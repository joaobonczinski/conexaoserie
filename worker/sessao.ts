// Sessoes e cookies. Veio do Conexão Filme (worker/sessao.ts), que veio do
// Conexão Anime sem os campos de perfil — e o Serie tambem nao tem perfil.
//
// Fica fora de `src/` de proposito: o tsconfig do Next inclui `**/*.ts`, e este
// codigo usa globais do Worker (D1Database) que nao existem no navegador.

export const COOKIE_SESSAO = "sessao";
const DIAS_DE_VALIDADE = 30;

/** Bytes aleatorios em base64url — serve para token, state e PKCE. */
export function aleatorio(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return base64url(buf);
}

export function base64url(dados: ArrayBuffer | Uint8Array): string {
  const bytes = dados instanceof Uint8Array ? dados : new Uint8Array(dados);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function sha256(texto: string): Promise<string> {
  const dados = new TextEncoder().encode(texto);
  return base64url(await crypto.subtle.digest("SHA-256", dados));
}

/**
 * Comparacao em tempo constante.
 *
 * Comparar segredo com `===` vaza informacao pelo tempo de resposta: quanto
 * mais caracteres iniciais batem, mais demora. Com muitas tentativas da para
 * descobrir o valor caractere a caractere.
 */
export function iguaisSeguro(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function lerCookie(req: Request, nome: string): string | null {
  const cabecalho = req.headers.get("Cookie");
  if (!cabecalho) return null;
  for (const parte of cabecalho.split(";")) {
    const idx = parte.indexOf("=");
    if (idx === -1) continue;
    if (parte.slice(0, idx).trim() === nome) {
      return decodeURIComponent(parte.slice(idx + 1).trim());
    }
  }
  return null;
}

type OpcoesCookie = { maxAge?: number; expira?: boolean };

/**
 * Monta o Set-Cookie.
 *
 * HttpOnly   — JavaScript da pagina nao le, entao um XSS nao rouba a sessao.
 * Secure     — so trafega em HTTPS. O `localhost` e excecao do navegador, e
 *              por isso o teste local funciona sem certificado.
 * SameSite=Lax — protege contra CSRF (um POST vindo de outro site chega sem o
 *                cookie) e ainda sobrevive ao redirect de volta do Google,
 *                que e uma navegacao GET de outro site.
 */
export function montarCookie(
  nome: string,
  valor: string,
  { maxAge, expira }: OpcoesCookie = {},
): string {
  const partes = [
    `${nome}=${encodeURIComponent(valor)}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
  ];
  if (expira) partes.push("Max-Age=0");
  else if (maxAge !== undefined) partes.push(`Max-Age=${maxAge}`);
  return partes.join("; ");
}

export type Usuario = {
  id: string;
  email: string;
  nome: string | null;
  avatar_url: string | null;
};

/**
 * Cria a sessao e devolve o token que vai no cookie.
 *
 * No banco guardamos apenas o HASH do token. Se o D1 vazar, ninguem consegue
 * montar um cookie valido a partir do que esta la.
 */
export async function criarSessao(
  db: D1Database,
  usuarioId: string,
): Promise<{ token: string; maxAge: number }> {
  const token = aleatorio(32);
  const agora = new Date();
  const expira = new Date(agora.getTime() + DIAS_DE_VALIDADE * 86400_000);

  await db
    .prepare(
      `INSERT INTO sessoes (id, token_hash, usuario_id, expira_em, criado_em)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      await sha256(token),
      usuarioId,
      expira.toISOString(),
      agora.toISOString(),
    )
    .run();

  return { token, maxAge: DIAS_DE_VALIDADE * 86400 };
}

/** Usuario da requisicao, ou null. Sessao vencida e apagada na hora. */
export async function usuarioDaRequisicao(
  req: Request,
  db: D1Database,
): Promise<Usuario | null> {
  const token = lerCookie(req, COOKIE_SESSAO);
  if (!token) return null;

  const hash = await sha256(token);
  const linha = await db
    .prepare(
      // A COLUNA NOVA PRECISA ENTRAR AQUI TAMBEM (licao do Anime): a lista e
      // explicita, e coluna que nao esta escrita nao existe para o resto do
      // Worker, sem erro nenhum.
      `SELECT u.id, u.email, u.nome, u.avatar_url, s.expira_em
         FROM sessoes s
         JOIN usuarios u ON u.id = s.usuario_id
        WHERE s.token_hash = ?`,
    )
    .bind(hash)
    .first<Usuario & { expira_em: string }>();

  if (!linha) return null;

  if (new Date(linha.expira_em) < new Date()) {
    await db.prepare("DELETE FROM sessoes WHERE token_hash = ?").bind(hash).run();
    return null;
  }

  return { id: linha.id, email: linha.email, nome: linha.nome, avatar_url: linha.avatar_url };
}

export async function encerrarSessao(req: Request, db: D1Database) {
  const token = lerCookie(req, COOKIE_SESSAO);
  if (!token) return;
  await db
    .prepare("DELETE FROM sessoes WHERE token_hash = ?")
    .bind(await sha256(token))
    .run();
}
