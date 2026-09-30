// Login com Google e com Discord (authorization code + PKCE nos dois).
//
// VEIO DO CONEXÃO FILME sem mudanca de regra (29/09/2026), e o Filme o trouxe
// do Conexão Anime, que ja passou por producao. As decisoes de la valem aqui:
//   - servico de terceiro e nao senha propria: nao guardamos credencial
//     nenhuma, e o banco nem tem coluna para isso;
//   - dois caminhos separados, porque o Discord NAO e OpenID Connect (o Google
//     devolve um `id_token` com tudo; o Discord obriga uma segunda chamada);
//   - cada um com o proprio endereco de retorno, que nunca muda (mexer nele
//     exige atualizar o console do provedor, e isso ja quebrou o login do
//     Anime uma vez);
//   - sem vinculacao entre provedores (ver `identidades` no db/schema.sql).
//
// O QUE MUDOU AQUI:
//   - `entrar` nao tem a coluna `google_sub`, que no Anime e legado;
//   - a pessoa volta para a pagina de onde saiu (`volta`), e nao para a home;
//   - os enderecos do Google e do Discord podem apontar para um servidor
//     falso no teste local (`GOOGLE_AUTH_URL` e companhia). Em producao essas
//     variaveis nao existem e valem os enderecos reais.

import {
  COOKIE_SESSAO,
  aleatorio,
  base64url,
  criarSessao,
  iguaisSeguro,
  lerCookie,
  montarCookie,
} from "./sessao";

const GOOGLE_AUTORIZACAO = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";

const DISCORD_AUTORIZACAO = "https://discord.com/oauth2/authorize";
const DISCORD_API_PADRAO = "https://discord.com/api";

const COOKIE_STATE = "oauth_state";
const COOKIE_VERIFIER = "oauth_verifier";
const COOKIE_VOLTA = "oauth_volta";
// Curto de proposito: e so o tempo de ir ao provedor e voltar.
const VALIDADE_TEMP = 600;

/** Para onde a pessoa vai depois de entrar, quando nao disse de onde veio. */
const VOLTA_PADRAO = "/minha-lista/";

export type Ambiente = {
  DB: D1Database;
  /** Opcional: sem ele, o botao do Google some da tela (ver /api/auth/provedores). */
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  DISCORD_CLIENT_ID?: string;
  DISCORD_CLIENT_SECRET?: string;
  // Enderecos trocaveis SO PARA O TESTE LOCAL (ver o topo do arquivo). O
  // Anime tem o `DISCORD_API` pelo mesmo motivo: login e o caminho que nao da
  // para deixar sem teste, e sem isto o unico teste seria logar de verdade.
  GOOGLE_AUTH_URL?: string;
  GOOGLE_TOKEN_URL?: string;
  DISCORD_AUTH_URL?: string;
  DISCORD_API?: string;
};

export const googleLigado = (env: Ambiente) =>
  Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
export const discordLigado = (env: Ambiente) =>
  Boolean(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET);

/**
 * Para onde o provedor devolve — SEMPRE o mesmo host de onde a pessoa clicou.
 *
 * Licao do Anime: com o retorno cravado num host fixo, quem comecava o login
 * em `www.` gravava os cookies `oauth_*` num host e voltava em outro, e a
 * checagem de CSRF derrubava tudo. Nao e buraco de seguranca: o provedor so
 * aceita `redirect_uri` que esteja na lista do console dele.
 */
const urlDeRetorno = (req: Request) => `${new URL(req.url).origin}/api/auth/callback`;
const urlDeRetornoDiscord = (req: Request) =>
  `${new URL(req.url).origin}/api/auth/discord/callback`;

/**
 * O caminho de volta, so se for um caminho DESTE site.
 *
 * Sem esta regra, `/api/auth/login?volta=https://outro.site` faria do nosso
 * login um trampolim para mandar a pessoa, ja logada e confiante, a um site
 * qualquer (o "open redirect"). Aceita so caminho que comeca com UMA barra e
 * tem letra, numero, hifen e barra; `//outro.site` e o truque classico, e cai
 * fora pela segunda barra.
 */
function voltaSegura(valor: string | null): string {
  if (!valor || !/^\/(?!\/)[a-z0-9\-/]*$/i.test(valor)) return VOLTA_PADRAO;
  return valor;
}

/** Os cookies da ida ao provedor: state, verifier e o caminho de volta. */
function cookiesDaIda(state: string, verifier: string, volta: string): Headers {
  const cabecalhos = new Headers();
  cabecalhos.append("Set-Cookie", montarCookie(COOKIE_STATE, state, { maxAge: VALIDADE_TEMP }));
  cabecalhos.append("Set-Cookie", montarCookie(COOKIE_VERIFIER, verifier, { maxAge: VALIDADE_TEMP }));
  cabecalhos.append("Set-Cookie", montarCookie(COOKIE_VOLTA, volta, { maxAge: VALIDADE_TEMP }));
  return cabecalhos;
}

/** A resposta final do login: cria a sessao, limpa os temporarios e volta. */
async function concluir(req: Request, env: Ambiente, usuarioId: string): Promise<Response> {
  const { token, maxAge } = await criarSessao(env.DB, usuarioId);
  const volta = voltaSegura(lerCookie(req, COOKIE_VOLTA));
  const cabecalhos = new Headers({ Location: `${new URL(req.url).origin}${volta}` });
  cabecalhos.append("Set-Cookie", montarCookie(COOKIE_SESSAO, token, { maxAge }));
  // Os temporarios ja cumpriram o papel.
  for (const nome of [COOKIE_STATE, COOKIE_VERIFIER, COOKIE_VOLTA]) {
    cabecalhos.append("Set-Cookie", montarCookie(nome, "", { expira: true }));
  }
  return new Response(null, { status: 302, headers: cabecalhos });
}

/** Desistir na tela do provedor volta para onde a pessoa estava, sem erro. */
const cancelado = (req: Request) =>
  Response.redirect(
    `${new URL(req.url).origin}${voltaSegura(lerCookie(req, COOKIE_VOLTA))}`,
    302,
  );

/**
 * A checagem de CSRF de login: o `state` que voltou tem que ser o que saiu.
 *
 * Sem ela, um site malicioso conseguiria disparar o retorno e logar a vitima
 * numa conta controlada por ele.
 */
function conferirIdaEVolta(req: Request): { code: string; verifier: string } | Response {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const stateSalvo = lerCookie(req, COOKIE_STATE);
  const verifier = lerCookie(req, COOKIE_VERIFIER);

  if (!code || !state || !stateSalvo || !iguaisSeguro(state, stateSalvo)) {
    return new Response("Requisição de login inválida.", { status: 400 });
  }
  if (!verifier) {
    return new Response("Sessão de login expirada. Tente de novo.", { status: 400 });
  }
  return { code, verifier };
}

async function pkce(): Promise<{ state: string; verifier: string; challenge: string }> {
  const state = aleatorio(32);
  const verifier = aleatorio(32);
  // PKCE: mandamos agora o hash do verifier e so depois o verifier em si.
  // Assim, mesmo que alguem intercepte o `code` no redirect, nao consegue
  // troca-lo por um token sem conhecer o verifier original.
  const challenge = base64url(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)),
  );
  return { state, verifier, challenge };
}

// ---------------------------------------------------------------------------
// Google
// ---------------------------------------------------------------------------

/** Etapa 1: manda a pessoa para o Google. */
export async function iniciarLogin(req: Request, env: Ambiente): Promise<Response> {
  if (!googleLigado(env)) {
    return new Response("Login com Google ainda não está configurado.", { status: 503 });
  }
  const { state, verifier, challenge } = await pkce();

  const url = new URL(env.GOOGLE_AUTH_URL ?? GOOGLE_AUTORIZACAO);
  url.searchParams.set("client_id", env.GOOGLE_CLIENT_ID!);
  url.searchParams.set("redirect_uri", urlDeRetorno(req));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  // Sem refresh token: so precisamos identificar a pessoa uma vez, no login.
  url.searchParams.set("access_type", "online");

  const volta = voltaSegura(new URL(req.url).searchParams.get("volta"));
  const cabecalhos = cookiesDaIda(state, verifier, volta);
  cabecalhos.set("Location", url.toString());
  return new Response(null, { status: 302, headers: cabecalhos });
}

type PayloadIdToken = {
  iss: string;
  aud: string;
  sub: string;
  exp: number;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

function decodificarJwt(idToken: string): PayloadIdToken {
  const payload = idToken.split(".")[1];
  if (!payload) throw new Error("id_token malformado");
  const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(decodeURIComponent(escape(json)));
}

/**
 * Etapa 2: o Google devolveu a pessoa aqui com um `code`.
 *
 * Sobre nao verificar a assinatura do id_token: pela especificacao do OpenID
 * Connect (secao 3.1.3.7), quando o token vem DIRETO do endpoint de token por
 * TLS — que e o caso aqui, e nao pelo navegador — a validacao de assinatura e
 * dispensavel, porque o canal ja garante a origem. Ainda assim conferimos
 * emissor, destinatario e validade abaixo.
 */
export async function concluirLogin(req: Request, env: Ambiente): Promise<Response> {
  if (!googleLigado(env)) {
    return new Response("Login com Google ainda não está configurado.", { status: 503 });
  }
  if (new URL(req.url).searchParams.get("error")) return cancelado(req);

  const ida = conferirIdaEVolta(req);
  if (ida instanceof Response) return ida;

  const resposta = await fetch(env.GOOGLE_TOKEN_URL ?? GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: ida.code,
      client_id: env.GOOGLE_CLIENT_ID!,
      client_secret: env.GOOGLE_CLIENT_SECRET!,
      // Tem que ser IDENTICO ao da etapa 1 — o Google compara os dois.
      redirect_uri: urlDeRetorno(req),
      grant_type: "authorization_code",
      code_verifier: ida.verifier,
    }),
  });
  if (!resposta.ok) return new Response("Falha ao autenticar com o Google.", { status: 502 });

  const { id_token } = (await resposta.json()) as { id_token?: string };
  if (!id_token) return new Response("Google não devolveu id_token.", { status: 502 });

  const p = decodificarJwt(id_token);
  const emissorOk = p.iss === "accounts.google.com" || p.iss === "https://accounts.google.com";
  if (!emissorOk) return new Response("Emissor inválido.", { status: 401 });
  if (p.aud !== env.GOOGLE_CLIENT_ID) return new Response("Token de outro app.", { status: 401 });
  if (p.exp * 1000 < Date.now()) return new Response("Token expirado.", { status: 401 });
  if (!p.email || p.email_verified === false) {
    return new Response("E-mail do Google não verificado.", { status: 403 });
  }

  const usuarioId = await entrar(env.DB, {
    provedor: "google",
    sub: p.sub,
    email: p.email,
    nome: p.name ?? null,
    avatar: p.picture ?? null,
  });
  return concluir(req, env, usuarioId);
}

type Provedor = "google" | "discord";

type Identidade = {
  provedor: Provedor;
  /** O id da pessoa NAQUELE servico. Estavel para sempre. */
  sub: string;
  email: string;
  nome: string | null;
  avatar: string | null;
};

/**
 * Cria ou atualiza o usuario a partir de uma identidade.
 *
 * A CHAVE E O `sub` DO PROVEDOR, NUNCA O E-MAIL, e nao se procura conta de
 * outro provedor pelo e-mail (ver `identidades` no db/schema.sql).
 */
async function entrar(db: D1Database, ident: Identidade): Promise<string> {
  const agora = new Date().toISOString();

  const existente = await db
    .prepare("SELECT usuario_id FROM identidades WHERE provedor = ? AND sub = ?")
    .bind(ident.provedor, ident.sub)
    .first<{ usuario_id: string }>();

  if (existente) {
    // Nome e foto sao relidos a cada login: quem troca a foto no provedor ve a
    // troca aqui sem fazer nada.
    await db
      .prepare(
        `UPDATE usuarios SET email = ?, nome = ?, avatar_url = ?, atualizado_em = ?
          WHERE id = ?`,
      )
      .bind(ident.email, ident.nome, ident.avatar, agora, existente.usuario_id)
      .run();
    return existente.usuario_id;
  }

  const id = crypto.randomUUID();
  // As duas escritas num lote so: usuario sem identidade e uma conta na qual
  // ninguem consegue entrar. Ou as duas, ou nenhuma.
  await db.batch([
    db
      .prepare(
        `INSERT INTO usuarios (id, email, nome, avatar_url, criado_em, atualizado_em)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(id, ident.email, ident.nome, ident.avatar, agora, agora),
    db
      .prepare(
        `INSERT INTO identidades (provedor, sub, usuario_id, email, criado_em)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(ident.provedor, ident.sub, id, ident.email, agora),
  ]);
  return id;
}

// ---------------------------------------------------------------------------
// Discord
// ---------------------------------------------------------------------------

/** Etapa 1: manda a pessoa para o Discord. */
export async function iniciarLoginDiscord(req: Request, env: Ambiente): Promise<Response> {
  if (!discordLigado(env)) {
    return new Response("Login com Discord ainda não está configurado.", { status: 503 });
  }
  const { state, verifier, challenge } = await pkce();

  const url = new URL(env.DISCORD_AUTH_URL ?? DISCORD_AUTORIZACAO);
  url.searchParams.set("client_id", env.DISCORD_CLIENT_ID!);
  url.searchParams.set("redirect_uri", urlDeRetornoDiscord(req));
  url.searchParams.set("response_type", "code");
  // So o minimo: quem e a pessoa e o e-mail dela. Escopo que nao se usa e
  // escopo que assusta na tela de autorizacao sem dar nada em troca.
  url.searchParams.set("scope", "identify email");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  // Sem isto o Discord PULA a tela de autorizacao para quem ja autorizou, e
  // some o unico momento em que a pessoa ve com qual conta esta entrando.
  url.searchParams.set("prompt", "consent");

  const volta = voltaSegura(new URL(req.url).searchParams.get("volta"));
  const cabecalhos = cookiesDaIda(state, verifier, volta);
  cabecalhos.set("Location", url.toString());
  return new Response(null, { status: 302, headers: cabecalhos });
}

type UsuarioDiscord = {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
  email?: string | null;
  verified?: boolean;
};

/**
 * Etapa 2: o Discord devolveu a pessoa aqui com um `code`. Sem `id_token`: o
 * que volta e um access token, e quem e a pessoa se descobre em /users/@me.
 */
export async function concluirLoginDiscord(req: Request, env: Ambiente): Promise<Response> {
  if (!discordLigado(env)) {
    return new Response("Login com Discord ainda não está configurado.", { status: 503 });
  }
  if (new URL(req.url).searchParams.get("error")) return cancelado(req);

  const ida = conferirIdaEVolta(req);
  if (ida instanceof Response) return ida;

  const api = env.DISCORD_API ?? DISCORD_API_PADRAO;
  const resposta = await fetch(`${api}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: ida.code,
      client_id: env.DISCORD_CLIENT_ID!,
      client_secret: env.DISCORD_CLIENT_SECRET!,
      redirect_uri: urlDeRetornoDiscord(req),
      grant_type: "authorization_code",
      code_verifier: ida.verifier,
    }),
  });
  if (!resposta.ok) return new Response("Falha ao autenticar com o Discord.", { status: 502 });

  const { access_token } = (await resposta.json()) as { access_token?: string };
  if (!access_token) return new Response("Discord não devolveu token.", { status: 502 });

  const eu = await fetch(`${api}/users/@me`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!eu.ok) return new Response("Discord não disse quem é você.", { status: 502 });
  const d = (await eu.json()) as UsuarioDiscord;

  // E-MAIL NAO VERIFICADO NAO ENTRA, a mesma regra do Google: e o unico
  // contato do site com a pessoa, e por onde ela pede exclusao de dados.
  if (!d.email || d.verified === false) {
    return new Response("E-mail do Discord não verificado.", { status: 403 });
  }

  const usuarioId = await entrar(env.DB, {
    provedor: "discord",
    sub: d.id,
    email: d.email,
    // `global_name` e o nome de exibicao novo do Discord; `username` sempre
    // existe. Quem nao escolheu nome de exibicao cai no segundo.
    nome: d.global_name || d.username || null,
    avatar: d.avatar ? `https://cdn.discordapp.com/avatars/${d.id}/${d.avatar}.png?size=128` : null,
  });
  return concluir(req, env, usuarioId);
}

/** As ligacoes desta conta, para a tela dizer "entrou com Google". */
export async function provedoresDe(db: D1Database, usuarioId: string): Promise<string[]> {
  const r = await db
    .prepare("SELECT provedor FROM identidades WHERE usuario_id = ? ORDER BY criado_em")
    .bind(usuarioId)
    .all<{ provedor: string }>();
  return (r.results ?? []).map((linha) => linha.provedor);
}

export { COOKIE_SESSAO };
