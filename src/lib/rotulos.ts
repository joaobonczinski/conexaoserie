import type { Lancamento } from "./tipos";

/**
 * "T2 · E5", "T1 · E1–8", "T3 · especial" — o que sai, em poucas letras.
 *
 * O INTERVALO E PELO PRIMEIRO E PELO ULTIMO, e nao pela contagem ("8
 * episodios"): quem ja viu ate o 4 da temporada que saiu inteira quer saber se
 * o 5 esta ali, e "E1–8" responde sem conta.
 */
export function rotuloDoLancamento(l: Lancamento): string {
  const t = `T${l.temporada}`;
  if (l.episodios.length === 0) return `${t} · especial`;
  const primeiro = l.episodios[0];
  const ultimo = l.episodios[l.episodios.length - 1];
  return primeiro === ultimo ? `${t} · E${primeiro}` : `${t} · E${primeiro}–${ultimo}`;
}

/**
 * O selo de estreia: "Série nova" quando e a primeira temporada, "Estreia" nas
 * outras. `null` quando o lancamento nao tem episodio 1.
 *
 * Sao DOIS textos porque sao duas noticias diferentes: serie nova e algo que a
 * pessoa ainda nao conhece; temporada nova e algo que ela talvez esteja
 * esperando ha dois anos.
 */
export function rotuloDeEstreia(l: Lancamento): string | null {
  if (!l.estreia) return null;
  return l.temporada === 1 ? "Série nova" : "Estreia";
}

/** A nota do TVmaze como gente le: "8,4". */
export function notaEmTexto(nota: number): string {
  return nota.toFixed(1).replace(".", ",");
}
