// Ponto de entrada do Worker do Conexão Série.
//
// O mesmo Worker faz duas coisas:
//   /api/*  -> este codigo (login, Minha Lista, busca, D1)
//   resto   -> os arquivos estaticos de out/, servidos pela Cloudflare
//
// O calendario, os proximos e o ranking continuam sendo HTML puro e
// instantaneo: nem passam por aqui (`run_worker_first` so tem /api/* no
// wrangler.jsonc). E o que mantem o site no plano gratis sem conta de
// requisicao: so quem usa a conta chama o Worker. O desenho e o do Conexão
// Filme, que veio do Anime, com o TVmaze no lugar do TMDB.

import {
  concluirLogin,
  concluirLoginDiscord,
  discordLigado,
  googleLigado,
  iniciarLogin,
  iniciarLoginDiscord,
  provedoresDe,
  type Ambiente,
} from "./auth";
import {
  Invalido,
  adicionar,
  apagarFichasOrfas,
  atualizar,
  listar,
  relerFichasVelhas,
  remover,
} from "./lista";
import {
  COOKIE_SESSAO,
  encerrarSessao,
  montarCookie,
  usuarioDaRequisicao,
  type Usuario,
} from "./sessao";
import { ErroTvmaze, buscarSeries } from "./tvmaze";

type AmbienteWorker = Ambiente & {
  ASSETS: Fetcher;
  /** O endereco oficial. Serve para mandar o `www.` para ele. */
  APP_URL?: string;
  /**
   * O teto de escritas por pessoa (ver `ratelimits` no wrangler.jsonc).
   * OPCIONAL de proposito, como no Anime: um limitador que derruba o site
   * quando falta e pior do que o problema que ele resolve.
   */
  ESCRITAS?: RateLimit;
};

/**
 * Palavra que a pessoa digita para confirmar que quer apagar a conta. Repetida
 * na tela (src/lib/minha-lista.ts) de proposito: o Worker e a `src/` nao
 * compartilham modulo.
 */
const CONFIRMACAO_APAGAR = "APAGAR";

function json(dados: unknown, status = 200): Response {
  return new Response(JSON.stringify(dados), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // Resposta de quem esta logado nunca pode ir para cache compartilhado:
      // seria o dado de uma pessoa entregue a outra.
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/**
 * O maior corpo que vale a pena ler. O maior pedido legitimo e um item com a
 * anotacao cheia (2.000 letras); 32 KB sobra. Recusar pelo tamanho e a unica
 * checagem que pode vir ANTES de o JSON ser montado na memoria.
 */
const CORPO_MAX = 32 * 1024;

async function corpoJson(req: Request): Promise<Record<string, unknown>> {
  const declarado = Number(req.headers.get("Content-Length") ?? "");
  if (Number.isFinite(declarado) && declarado > CORPO_MAX) {
    throw new Invalido("Corpo da requisição grande demais.");
  }
  try {
    const texto = await req.text();
    if (texto.length > CORPO_MAX) throw new Invalido("Corpo da requisição grande demais.");
    const dados = JSON.parse(texto);
    if (!dados || typeof dados !== "object") throw new Error();
    return dados as Record<string, unknown>;
  } catch (erro) {
    if (erro instanceof Invalido) throw erro;
    throw new Invalido("Corpo da requisição inválido.");
  }
}

/**
 * O objeto `usuario` que a tela recebe, montado NUM LUGAR SO. Licao do Anime:
 * quando duas rotas montavam o mesmo objeto na mao, uma delas esqueceu um
 * campo e derrubou a tela de conta inteira.
 */
async function usuarioParaCliente(db: D1Database, eu: Usuario) {
  return {
    id: eu.id,
    email: eu.email,
    nome: eu.nome,
    avatar_url: eu.avatar_url,
    provedores: await provedoresDe(db, eu.id),
  };
}

/** Rotas que exigem sessao. So chega aqui com uma valida. */
async function rotasComSessao(
  req: Request,
  env: AmbienteWorker,
  ctx: ExecutionContext,
  usuario: Usuario,
  rota: string,
): Promise<Response> {
  const metodo = req.method;

  // A busca de series, para adicionar a lista. EXIGE LOGIN: aberta, a rota
  // viraria um proxy do TVmaze para qualquer robo, e o limite de chamadas de
  // la e por IP — o nosso.
  if (rota === "/api/busca" && metodo === "GET") {
    const termo = (new URL(req.url).searchParams.get("q") ?? "").trim();
    if (termo.length < 2) return json({ series: [] });
    if (termo.length > 100) throw new Invalido("Busca longa demais.");
    return json({ series: await buscarSeries(termo) });
  }

  if (rota === "/api/lista") {
    if (metodo === "GET") {
      // A releitura das fichas velhas vai DEPOIS da resposta: e manutencao, e
      // ninguem espera por ela para ver a lista.
      ctx.waitUntil(relerFichasVelhas(usuario, env.DB).catch((e) => console.error(e)));
      return json({ itens: await listar(usuario, env.DB) });
    }
    if (metodo === "POST") {
      const item = await adicionar(usuario, env.DB, await corpoJson(req));
      return json({ item }, 201);
    }
  }

  const comId = rota.match(/^\/api\/lista\/([\w-]{36})$/);
  if (comId) {
    if (metodo === "PATCH") {
      const item = await atualizar(usuario, env.DB, comId[1], await corpoJson(req));
      return item ? json({ item }) : json({ erro: "Item não encontrado." }, 404);
    }
    if (metodo === "DELETE") {
      const ok = await remover(usuario, env.DB, comId[1]);
      return ok ? new Response(null, { status: 204 }) : json({ erro: "Item não encontrado." }, 404);
    }
  }

  // Apagar a conta: o direito de eliminacao da LGPD (art. 18, VI). Tem que
  // existir, ser do proprio titular e nao depender de pedir por e-mail.
  if (rota === "/api/conta" && metodo === "DELETE") {
    // A confirmacao tambem e conferida aqui, e nao so na tela: a tela protege
    // do clique sem querer; isto protege de um bug nosso chamar a rota sozinho.
    const { confirmacao } = await corpoJson(req);
    if (String(confirmacao ?? "") !== CONFIRMACAO_APAGAR) {
      throw new Invalido("Confirmação inválida.");
    }
    // Os filhos sao apagados EXPLICITAMENTE, sem confiar no ON DELETE CASCADE
    // (licao do Anime: `PRAGMA foreign_keys` vale por conexao, e se viesse
    // desligada sobraria lista orfa de uma conta que a pessoa mandou apagar).
    // `batch` e uma transacao: ou some tudo, ou nada some.
    await env.DB.batch([
      env.DB.prepare("DELETE FROM lista_itens WHERE usuario_id = ?").bind(usuario.id),
      env.DB.prepare("DELETE FROM sessoes WHERE usuario_id = ?").bind(usuario.id),
      env.DB.prepare("DELETE FROM identidades WHERE usuario_id = ?").bind(usuario.id),
      env.DB.prepare("DELETE FROM usuarios WHERE id = ?").bind(usuario.id),
      apagarFichasOrfas(env.DB),
    ]);
    return new Response(null, {
      status: 204,
      headers: { "Set-Cookie": montarCookie(COOKIE_SESSAO, "", { expira: true }) },
    });
  }

  return json({ erro: "rota não encontrada" }, 404);
}

const worker = {
  async fetch(req: Request, env: AmbienteWorker, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    const rota = url.pathname.replace(/\/$/, "") || "/";

    // O `www` e um atalho para o endereco oficial, e nunca um segundo site.
    // Quem o manda embora de verdade e a regra da zona (ver o README); isto
    // cobre a /api/, caso uma chamada chegue pelo `www` antes dela. 308 e nao
    // 301: o 301 deixa o navegador trocar POST por GET no caminho.
    if (env.APP_URL) {
      const canonico = new URL(env.APP_URL).host;
      if (url.host === `www.${canonico}`) {
        url.host = canonico;
        return Response.redirect(url.toString(), 308);
      }
    }

    // So /api/* chega aqui (`run_worker_first`), mas se um dia outra rota
    // chegar, ela vai para os arquivos estaticos e nao para um erro.
    if (!rota.startsWith("/api")) return env.ASSETS.fetch(req);

    // Sem isto, um erro de configuracao viraria um 500 confuso la na frente.
    if (!env.DB) return json({ erro: "Worker sem banco configurado." }, 500);

    try {
      switch (`${req.method} ${rota}`) {
        // Quais logins estao ligados. Existe porque a /entrar/ e HTML do build
        // e nao sabe se as credenciais ja chegaram ao Worker. NAO VAZA NADA:
        // devolve nomes de servico, nunca id ou segredo.
        case "GET /api/auth/provedores":
          return json({
            provedores: [
              ...(googleLigado(env) ? ["google"] : []),
              ...(discordLigado(env) ? ["discord"] : []),
            ],
          });
        case "GET /api/auth/login":
          return iniciarLogin(req, env);
        case "GET /api/auth/callback":
          return concluirLogin(req, env);
        case "GET /api/auth/login/discord":
          return iniciarLoginDiscord(req, env);
        case "GET /api/auth/discord/callback":
          return concluirLoginDiscord(req, env);
        case "GET /api/auth/me": {
          const eu = await usuarioDaRequisicao(req, env.DB);
          return json({ usuario: eu ? await usuarioParaCliente(env.DB, eu) : null });
        }
        // POST, nao GET: um <img src="/api/auth/logout"> numa pagina qualquer
        // nao consegue deslogar a pessoa sem ela querer.
        case "POST /api/auth/logout": {
          await encerrarSessao(req, env.DB);
          return new Response(null, {
            status: 204,
            headers: { "Set-Cookie": montarCookie(COOKIE_SESSAO, "", { expira: true }) },
          });
        }
      }

      // Daqui para baixo, tudo exige estar logado.
      const usuario = await usuarioDaRequisicao(req, env.DB);
      if (!usuario) return json({ erro: "Faça login para continuar." }, 401);

      // O TETO DE ESCRITAS POR PESSOA, num lugar por onde toda escrita passa
      // (licao do Anime: limite por rota e limite esquecido na rota seguinte).
      // 60 por minuto: ninguem clicando chega perto; um laco chega em um
      // segundo.
      if (req.method !== "GET" && env.ESCRITAS) {
        const { success } = await env.ESCRITAS.limit({ key: usuario.id });
        if (!success) return json({ erro: "Você está indo rápido demais. Espere um pouco." }, 429);
      }

      return await rotasComSessao(req, env, ctx, usuario, rota);
    } catch (erro) {
      if (erro instanceof Invalido) return json({ erro: erro.message }, 400);
      if (erro instanceof ErroTvmaze) return json({ erro: erro.message }, 502);
      console.error(erro);
      // Nunca a mensagem crua: ela pode revelar a estrutura do banco para
      // quem estiver sondando.
      return json({ erro: "Erro interno." }, 500);
    }
  },
};

export default worker;
