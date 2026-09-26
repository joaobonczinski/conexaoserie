import type { Lancamento } from "./tipos";

/**
 * "T2 · E5", "T1 · E1–8", "T3 · especial" — o que sai, em poucas letras.
 *
 * O INTERVALO E PELO PRIMEIRO E PELO ULTIMO, e nao pela contagem ("8
 * episodios"): quem ja viu ate o 4 da temporada que saiu inteira quer saber se
 * o 5 esta ali, e "E1–8" responde sem conta.
 */
export function rotuloDoLancamento(l: Pick<Lancamento, "temporada" | "episodios">): string {
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

/**
 * "Episódio 6 da 1ª temporada" — o `rotuloDoLancamento` por extenso, para a
 * pagina da serie, onde ha espaco e a frase vira resposta.
 */
export function lancamentoPorExtenso(
  l: Pick<Lancamento, "temporada" | "episodios">,
): string {
  const temporada = nomeDaTemporada(l.temporada);
  if (l.episodios.length === 0) return `Especial da ${temporada}`;
  const primeiro = l.episodios[0];
  const ultimo = l.episodios[l.episodios.length - 1];
  return primeiro === ultimo
    ? `Episódio ${primeiro} da ${temporada}`
    : `Episódios ${primeiro} a ${ultimo} da ${temporada}`;
}

/**
 * "1ª temporada" — ou "temporada de 2026", porque o TVmaze numera as novelas
 * americanas pelo ANO (Days of Our Lives esta na temporada 2026). "2026ª
 * temporada" seria a frase mais estranha do site.
 */
export function nomeDaTemporada(temporada: number): string {
  return temporada >= 1900 ? `temporada de ${temporada}` : `${temporada}ª temporada`;
}

/** A primeira letra em minuscula, para a frase que comeca no meio de outra. */
export function minuscula(texto: string): string {
  return texto.charAt(0).toLowerCase() + texto.slice(1);
}

/**
 * "na Netflix", "no Prime Video". O artigo muda com a plataforma, e errar soa
 * como texto de maquina — justo na frase que vai para o titulo do Google.
 *
 * Plataforma que nao esta aqui sai com "em", que nunca esta errado.
 */
const ARTIGO: Record<string, "a" | "o"> = {
  Netflix: "a",
  "Prime Video": "o",
  "Disney+": "o",
  "HBO Max": "a",
  "Apple TV": "a",
  "Paramount+": "o",
  Globoplay: "o",
};

export function naPlataforma(plataforma: string): string {
  const artigo = ARTIGO[plataforma];
  return `${artigo ? `n${artigo}` : "em"} ${plataforma}`;
}

/** "a Netflix", "o Prime Video" — e so o nome, sem artigo, quando nao se sabe. */
export function aPlataforma(plataforma: string): string {
  const artigo = ARTIGO[plataforma];
  return artigo ? `${artigo} ${plataforma}` : plataforma;
}

/** O `status` do TVmaze em portugues, ou null quando nao ajuda. */
export function situacaoDaSerie(status: string | null): string | null {
  switch (status) {
    case "Running":
      return "Em exibição";
    case "Ended":
      return "Encerrada";
    case "To Be Determined":
      return "Sem renovação confirmada";
    case "In Development":
      return "Ainda não estreou";
    default:
      return null;
  }
}
