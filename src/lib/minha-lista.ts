import { useSyncExternalStore } from "react";
import overridesJson from "@/data/overrides.json";

/* ===========================================================================
   A CONTA E A MINHA LISTA, do lado do navegador. Veio do Conexão Filme.

   UM ESTADO SO PARA A PAGINA INTEIRA: o botao "+" de cada linha, o cabecalho,
   a /minha-lista/ e o dialogo de edicao leem daqui. Sem isso, cada linha da
   /proximos/ perguntaria ao servidor se a serie esta na lista. A pergunta e
   feita UMA vez por carga de pagina (quem esta logado e a lista dele), e toda
   mudanca passa por aqui, entao a linha e a lista nunca discordam.

   A SESSAO VIAJA NUM COOKIE HttpOnly: nao existe token para o JavaScript
   guardar nem vazar, o navegador anexa sozinho.

   O HTML DO BUILD NASCE SEM USUARIO (fase "carregando"): a pagina e estatica
   e nao pode ter dado de ninguem dentro. O que e de cada um chega depois, da
   /api/, que responde `no-store`.
   =========================================================================== */

export type Status = "assistindo" | "quero_ver" | "terminei" | "abandonei";

/** Os quatro estados, na ordem da tela. Os mesmos do db/schema.sql. */
export const SITUACOES: { valor: Status; rotulo: string }[] = [
  { valor: "assistindo", rotulo: "Assistindo" },
  { valor: "quero_ver", rotulo: "Quero ver" },
  { valor: "terminei", rotulo: "Terminei" },
  { valor: "abandonei", rotulo: "Abandonei" },
];

export const rotuloDaSituacao = (s: string) =>
  SITUACOES.find((x) => x.valor === s)?.rotulo ?? s;

export type ItemDaLista = {
  id: string;
  tvmazeId: number;
  status: Status;
  nota: number | null;
  anotacoes: string;
  terminadoEm: string | null;
  criadoEm: string;
  atualizadoEm: string;
  serie: {
    nome: string;
    tituloBr: string | null;
    ano: number | null;
    capa: string | null;
  };
};

export type UsuarioLogado = {
  id: string;
  email: string;
  nome: string | null;
  avatar_url: string | null;
  /** Por onde a conta entra: ["google"] ou ["discord"]. */
  provedores: string[];
};

export type SerieDaBusca = {
  tvmazeId: number;
  nome: string;
  tituloBr: string | null;
  ano: number | null;
  capa: string | null;
};

// ---------------------------------------------------------------------------
// O nome na lista
// ---------------------------------------------------------------------------

/**
 * Os titulos que o admin corrigiu (src/data/overrides.json), por id do TVmaze.
 * So o `tituloBr`: e o unico ajuste que a lista mostra, e o arquivo e pequeno
 * o bastante para vir para o navegador.
 */
const TITULOS_AJUSTADOS = new Map(
  Object.entries(overridesJson as Record<string, unknown>).flatMap(([id, ajuste]) =>
    ajuste && typeof ajuste === "object" && "tituloBr" in ajuste && typeof ajuste.tituloBr === "string"
      ? [[Number(id), ajuste.tituloBr] as const]
      : [],
  ),
);

/**
 * O nome de uma serie na lista: o ajuste do admin, o titulo brasileiro do
 * TVmaze ou o original — a mesma ordem da agenda e do ranking. E o ajuste que
 * impede Stranger Things de aparecer como "Bagulhos Sinistros", o meme que o
 * TVmaze tem como titulo brasileiro.
 */
export const nomeDaSerie = (tvmazeId: number, s: { nome: string; tituloBr: string | null }) =>
  TITULOS_AJUSTADOS.get(tvmazeId) ?? s.tituloBr ?? s.nome;

// ---------------------------------------------------------------------------
// O estado
// ---------------------------------------------------------------------------

type Estado = {
  /**
   * carregando    ainda perguntando ao servidor
   * indisponivel  nao ha servidor de conta neste endereco (o atalho da area de
   *               trabalho so serve as paginas) ou ele falhou
   * deslogado     ninguem entrou
   * pronto        logado, com a lista na memoria
   */
  fase: "carregando" | "indisponivel" | "deslogado" | "pronto";
  usuario: UsuarioLogado | null;
  itens: ItemDaLista[];
  /** A serie aberta no dialogo de edicao (ver DialogoDoItem). */
  editando: number | null;
};

const INICIAL: Estado = { fase: "carregando", usuario: null, itens: [], editando: null };

let estado: Estado = INICIAL;
const ouvintes = new Set<() => void>();

function mudar(parcial: Partial<Estado>) {
  estado = { ...estado, ...parcial };
  for (const avisar of ouvintes) avisar();
}

/** Erro com a mensagem pronta para a tela. */
export class ErroDaConta extends Error {
  constructor(
    mensagem: string,
    public status: number,
  ) {
    super(mensagem);
  }
}

async function chamar<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const resposta = await fetch(caminho, {
    ...opcoes,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...opcoes.headers },
  });
  if (resposta.status === 204) return undefined as T;
  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    throw new ErroDaConta(corpo?.erro ?? "Não foi possível completar a ação.", resposta.status);
  }
  return corpo as T;
}

let iniciado = false;

/** A pergunta da carga de pagina: quem e, e o que tem na lista. Uma vez so. */
async function iniciar() {
  if (iniciado) return;
  iniciado = true;
  try {
    const { usuario } = await chamar<{ usuario: UsuarioLogado | null }>("/api/auth/me");
    if (!usuario) return mudar({ fase: "deslogado" });
    const { itens } = await chamar<{ itens: ItemDaLista[] }>("/api/lista");
    mudar({ fase: "pronto", usuario, itens });
  } catch {
    // Sem servidor de conta (o atalho local so tem as paginas) ou com ele
    // fora do ar. As telas dizem isso, em vez de fingir que ninguem entrou.
    mudar({ fase: "indisponivel" });
  }
}

function assinar(avisar: () => void) {
  ouvintes.add(avisar);
  void iniciar();
  return () => {
    ouvintes.delete(avisar);
  };
}

/** O estado da conta e da lista, para qualquer componente de cliente. */
export function useMinhaLista(): Estado {
  return useSyncExternalStore(assinar, () => estado, () => INICIAL);
}

/** O item desta serie na lista, ou `undefined`. */
export const itemDaSerie = (e: Estado, tvmazeId: number) =>
  e.itens.find((i) => i.tvmazeId === tvmazeId);

// ---------------------------------------------------------------------------
// O que muda a lista. Cada funcao atualiza o estado com a RESPOSTA do
// servidor, e nao com o que achava que ia acontecer: e o servidor que sabe,
// por exemplo, que adicionar de novo nao mexe na nota (ver worker/lista.ts).
// ---------------------------------------------------------------------------

export async function adicionar(tvmazeId: number, status: Status = "quero_ver") {
  const { item } = await chamar<{ item: ItemDaLista }>("/api/lista", {
    method: "POST",
    body: JSON.stringify({ tvmazeId, status }),
  });
  mudar({ itens: [item, ...estado.itens.filter((i) => i.id !== item.id)] });
  return item;
}

export async function atualizar(
  id: string,
  mudancas: Partial<Pick<ItemDaLista, "status" | "nota" | "anotacoes">>,
) {
  const { item } = await chamar<{ item: ItemDaLista }>(`/api/lista/${id}`, {
    method: "PATCH",
    body: JSON.stringify(mudancas),
  });
  mudar({ itens: estado.itens.map((i) => (i.id === item.id ? item : i)) });
  return item;
}

export async function remover(id: string) {
  await chamar<void>(`/api/lista/${id}`, { method: "DELETE" });
  mudar({ itens: estado.itens.filter((i) => i.id !== id), editando: null });
}

export async function buscarSeries(termo: string): Promise<SerieDaBusca[]> {
  const { series } = await chamar<{ series: SerieDaBusca[] }>(
    `/api/busca?q=${encodeURIComponent(termo)}`,
  );
  return series;
}

export const abrirEdicao = (tvmazeId: number) => mudar({ editando: tvmazeId });
export const fecharEdicao = () => mudar({ editando: null });

/** Sai e volta para a home: a pagina em que estava pode depender da conta. */
export async function sair() {
  await chamar<void>("/api/auth/logout", { method: "POST" });
  window.location.assign("/");
}

/** Palavra da confirmacao de apagar a conta. A MESMA do worker/index.ts. */
export const CONFIRMACAO_APAGAR = "APAGAR";

export async function apagarConta(confirmacao: string) {
  await chamar<void>("/api/conta", {
    method: "DELETE",
    body: JSON.stringify({ confirmacao }),
  });
  window.location.assign("/");
}

/** Os logins ligados no servidor (a /entrar/ so mostra os botoes que funcionam). */
export async function provedoresLigados(): Promise<string[]> {
  const { provedores } = await chamar<{ provedores: string[] }>("/api/auth/provedores");
  return provedores;
}

/**
 * O endereco da /entrar/ que volta para `caminho` depois do login. So o
 * caminho, sem busca nem ancora: o Worker so aceita caminho (ver `voltaSegura`
 * no worker/auth.ts).
 */
export const enderecoDeEntrar = (caminho: string) =>
  `/entrar/?volta=${encodeURIComponent(caminho)}`;
