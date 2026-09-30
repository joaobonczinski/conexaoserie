// A Minha Lista: o CRUD dos itens e o catalogo de series por tras deles.
//
// O desenho e o do Conexão Filme (worker/lista.ts), que veio do Anime, com o
// que muda por ser serie: quatro estados (ver `lista_itens` no db/schema.sql)
// e o catalogo lido do TVmaze PELO WORKER.
//
// Toda rota daqui exige sessao, e o `usuario_id` vem SEMPRE da sessao, nunca
// do corpo da requisicao: se viesse do corpo, qualquer um editaria a lista dos
// outros so trocando um id.

import type { Usuario } from "./sessao";
import { ErroTvmaze, lerSerie, type FichaDaSerie } from "./tvmaze";

const STATUS_VALIDOS = new Set(["assistindo", "quero_ver", "terminei", "abandonei"]);

/**
 * Depois de quantos dias a ficha da serie e relida do TVmaze. Nao ha prazo de
 * licenca aqui (o Filme rele por causa dos termos do TMDB); e so para o poster
 * novo e o titulo brasileiro que apareceu depois chegarem a lista.
 */
const DIAS_ATE_RELER = 90;

/** Quantas fichas velhas cada abertura da lista rele, no maximo. */
const RELEITURAS_POR_VEZ = 10;

type Entrada = {
  tvmazeId?: number;
  status?: string;
  nota?: number | null;
  anotacoes?: string | null;
};

/** Erro de validacao com mensagem que pode ir para a tela. */
export class Invalido extends Error {}

function validar(e: Entrada, exigirTudo: boolean) {
  if (exigirTudo || e.tvmazeId !== undefined) {
    if (!Number.isInteger(e.tvmazeId) || (e.tvmazeId as number) <= 0) {
      throw new Invalido("Série inválida.");
    }
  }
  if (exigirTudo || e.status !== undefined) {
    if (!STATUS_VALIDOS.has(e.status ?? "")) throw new Invalido("Situação inválida.");
  }
  if (e.nota !== undefined && e.nota !== null) {
    // De 1 a 10, de meio em meio, como no Conexão Anime.
    if (
      typeof e.nota !== "number" ||
      e.nota < 1 ||
      e.nota > 10 ||
      Math.round(e.nota * 2) !== e.nota * 2
    ) {
      throw new Invalido("A nota vai de 1 a 10, de meio em meio.");
    }
  }
  if (e.anotacoes !== undefined && e.anotacoes !== null) {
    if (typeof e.anotacoes !== "string") throw new Invalido("Anotação inválida.");
    if (e.anotacoes.length > 2000) throw new Invalido("Anotação longa demais (máximo de 2.000 letras).");
  }
}

const limiteDeReleitura = () => new Date(Date.now() - DIAS_ATE_RELER * 86400_000).toISOString();

function gravarFicha(db: D1Database, f: FichaDaSerie) {
  return db
    .prepare(
      `INSERT INTO series (tvmaze_id, nome, titulo_br, ano, capa, atualizado_em)
       VALUES (?,?,?,?,?,?)
       ON CONFLICT(tvmaze_id) DO UPDATE SET
         nome          = excluded.nome,
         titulo_br     = excluded.titulo_br,
         ano           = excluded.ano,
         capa          = excluded.capa,
         atualizado_em = excluded.atualizado_em`,
    )
    .bind(f.tvmazeId, f.nome, f.tituloBr, f.ano, f.capa, new Date().toISOString());
}

/**
 * Garante que a serie esta no catalogo, com ficha recente.
 *
 * Ficha velha que o TVmaze nao consegue reler agora FICA como esta: e melhor o
 * item entrar com o poster de meses atras do que a pessoa nao conseguir
 * adicionar a serie porque o TVmaze piscou.
 */
async function garantirNoCatalogo(db: D1Database, tvmazeId: number) {
  const existente = await db
    .prepare("SELECT atualizado_em FROM series WHERE tvmaze_id = ?")
    .bind(tvmazeId)
    .first<{ atualizado_em: string }>();
  if (existente && existente.atualizado_em >= limiteDeReleitura()) return;

  let ficha: FichaDaSerie | null;
  try {
    ficha = await lerSerie(tvmazeId);
  } catch (erro) {
    if (existente) return;
    throw erro;
  }
  if (!ficha) {
    if (existente) return;
    throw new Invalido("Essa série não existe no TVmaze.");
  }
  await gravarFicha(db, ficha).run();
}

/**
 * Rele do TVmaze as fichas velhas das series desta pessoa. Roda DEPOIS de a
 * lista ser entregue (no `waitUntil`), e no maximo RELEITURAS_POR_VEZ por
 * abertura: e manutencao, nao pode atrasar a tela.
 */
export async function relerFichasVelhas(usuario: Usuario, db: D1Database) {
  const { results = [] } = await db
    .prepare(
      `SELECT s.tvmaze_id FROM series s
         JOIN lista_itens i ON i.tvmaze_id = s.tvmaze_id
        WHERE i.usuario_id = ? AND s.atualizado_em < ?
        LIMIT ?`,
    )
    .bind(usuario.id, limiteDeReleitura(), RELEITURAS_POR_VEZ)
    .all<{ tvmaze_id: number }>();
  for (const { tvmaze_id } of results) {
    try {
      const ficha = await lerSerie(tvmaze_id);
      if (ficha) await gravarFicha(db, ficha).run();
    } catch (erro) {
      if (!(erro instanceof ErroTvmaze)) throw erro;
      // O TVmaze fora do ar nao e motivo para nada: fica para a proxima.
    }
  }
}

/**
 * Apaga do catalogo as series que ninguem mais tem na lista: sem isto, a ficha
 * de uma serie removida ficaria guardada para sempre, sem uso.
 */
export function apagarFichasOrfas(db: D1Database) {
  return db.prepare(
    "DELETE FROM series WHERE tvmaze_id NOT IN (SELECT DISTINCT tvmaze_id FROM lista_itens)",
  );
}

type LinhaJuncao = Record<string, unknown>;

function montarItem(l: LinhaJuncao) {
  return {
    id: l.id as string,
    tvmazeId: l.tvmaze_id as number,
    status: l.status as string,
    nota: l.nota as number | null,
    anotacoes: (l.anotacoes as string | null) ?? "",
    terminadoEm: l.terminado_em as string | null,
    criadoEm: l.criado_em as string,
    atualizadoEm: l.atualizado_em as string,
    serie: {
      nome: l.nome as string,
      tituloBr: l.titulo_br as string | null,
      ano: l.ano as number | null,
      capa: l.capa as string | null,
    },
  };
}

const SELECT_ITENS = `
  SELECT i.*, s.nome, s.titulo_br, s.ano, s.capa
    FROM lista_itens i
    JOIN series s ON s.tvmaze_id = i.tvmaze_id
   WHERE i.usuario_id = ?`;

export async function listar(usuario: Usuario, db: D1Database) {
  const { results } = await db
    .prepare(`${SELECT_ITENS} ORDER BY i.atualizado_em DESC`)
    .bind(usuario.id)
    .all<LinhaJuncao>();
  return (results ?? []).map(montarItem);
}

export async function adicionar(usuario: Usuario, db: D1Database, e: Entrada) {
  validar(e, true);
  await garantirNoCatalogo(db, e.tvmazeId!);

  const agora = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO lista_itens
         (id, usuario_id, tvmaze_id, status, nota, anotacoes, terminado_em, criado_em, atualizado_em)
       VALUES (?,?,?,?,?,?,?,?,?)
       -- DO NOTHING, nunca DO UPDATE (licao do Anime): adicionar de novo uma
       -- serie que ja esta na lista sobrescreveria a nota e a anotacao com os
       -- valores padrao do botao. Em conflito, devolvemos o item intacto.
       ON CONFLICT(usuario_id, tvmaze_id) DO NOTHING`,
    )
    .bind(
      crypto.randomUUID(),
      usuario.id,
      e.tvmazeId,
      e.status,
      e.nota ?? null,
      e.anotacoes ?? null,
      e.status === "terminei" ? agora : null,
      agora,
      agora,
    )
    .run();

  const linha = await db
    .prepare(`${SELECT_ITENS} AND i.tvmaze_id = ?`)
    .bind(usuario.id, e.tvmazeId)
    .first<LinhaJuncao>();
  return linha ? montarItem(linha) : null;
}

export async function atualizar(usuario: Usuario, db: D1Database, itemId: string, e: Entrada) {
  if (e.tvmazeId !== undefined) throw new Invalido("A série de um item não muda.");
  validar(e, false);

  const campos: string[] = [];
  const valores: unknown[] = [];
  const por = (coluna: string, valor: unknown) => {
    campos.push(`${coluna} = ?`);
    valores.push(valor);
  };
  if (e.status !== undefined) {
    por("status", e.status);
    // Virar "terminei" carimba a data; sair de "terminei" apaga.
    por("terminado_em", e.status === "terminei" ? new Date().toISOString() : null);
  }
  if (e.nota !== undefined) por("nota", e.nota);
  if (e.anotacoes !== undefined) por("anotacoes", e.anotacoes || null);
  if (campos.length === 0) throw new Invalido("Nada para atualizar.");
  por("atualizado_em", new Date().toISOString());

  // O `usuario_id` no WHERE e o que impede editar item de outra pessoa.
  const r = await db
    .prepare(`UPDATE lista_itens SET ${campos.join(", ")} WHERE id = ? AND usuario_id = ?`)
    .bind(...valores, itemId, usuario.id)
    .run();
  if (!r.meta.changes) return null;

  const linha = await db
    .prepare(`${SELECT_ITENS} AND i.id = ?`)
    .bind(usuario.id, itemId)
    .first<LinhaJuncao>();
  return linha ? montarItem(linha) : null;
}

export async function remover(usuario: Usuario, db: D1Database, itemId: string) {
  const [r] = await db.batch([
    db.prepare("DELETE FROM lista_itens WHERE id = ? AND usuario_id = ?").bind(itemId, usuario.id),
    apagarFichasOrfas(db),
  ]);
  return (r.meta.changes ?? 0) > 0;
}
