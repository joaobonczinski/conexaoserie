import mapa from "@/data/plataformas.json";
import type { Canal } from "./tipos";

/**
 * O mapa de canal para plataforma brasileira, lido de src/data/plataformas.json.
 *
 * O JSON e a fonte, e nao este arquivo, porque DOIS lugares o leem: o site e o
 * `npm run fetch`, que so baixa serie de canal que esta nele. Uma lista copiada
 * em cada lado divergiria no primeiro canal novo.
 */
const CANAIS = new Map<string, Canal>(
  (mapa.canais as Canal[]).map((c) => [`${c.tipo}:${c.id}`, c]),
);

const PLATAFORMAS = mapa.plataformas as Record<
  string,
  { cor: string; dominios: string[] }
>;

export function canalPorChave(chave: string): Canal | null {
  return CANAIS.get(chave) ?? null;
}

/** Os nomes que o admin oferece na lista de plataformas. */
export const NOMES_DAS_PLATAFORMAS = Object.keys(PLATAFORMAS);

/** Cinza neutro para plataforma que ainda nao tem cor no mapa. */
const COR_NEUTRA = "#8E8E93";

export function corDaPlataforma(nome: string): string {
  return PLATAFORMAS[nome]?.cor ?? COR_NEUTRA;
}

/**
 * Se um endereco ABRE no Brasil, pela regra de dominio do Conexão Anime.
 *
 * E uma lista de PERMISSAO, por plataforma: o site oficial que o TVmaze guarda
 * e o americano, e `hbo.com`, `hulu.com` ou `fxnetworks.com` nao servem para
 * ninguem daqui. Endereco que nao esta na lista vira texto, e nao link — link
 * que nao abre e pior do que link nenhum, porque gasta o clique e ensina que o
 * site erra.
 *
 * O dominio e exigido NA PLATAFORMA da serie, e nao em qualquer uma: um link da
 * Netflix num card do Disney+ seria o site se contradizendo.
 */
export function linkQueAbre(url: string | null, plataforma: string): string | null {
  if (!url) return null;
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  const dominios = PLATAFORMAS[plataforma]?.dominios ?? [];
  // O ponto antes do dominio e o que impede `naonetflix.com` de passar.
  const abre = dominios.some((d) => host === d || host.endsWith(`.${d}`));
  return abre ? url : null;
}
