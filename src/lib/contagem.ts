// Contagem regressiva ate o proximo lancamento. Veio do Conexão Anime.
//
// Funcoes puras, sem React e sem `Date.now()` por dentro: quem chama passa o
// `agora`. E isso que impede o erro classico deste tipo de site — calcular
// tempo durante o build. O HTML e estatico e gerado uma vez; uma contagem
// resolvida ali nasceria congelada no horario do build.

/**
 * Por quanto tempo um lancamento que ja saiu ainda conta como "acabou de sair".
 *
 * 12 horas: "saiu ha 3h" e informacao util (da para assistir agora); passado
 * disso, o card so ocupa lugar na frente do que ainda vem.
 */
export const JANELA_RECEM_SAIU_S = 12 * 3600;

export type Contagem = {
  /** Negativo quando o episodio ja saiu. */
  segundos: number;
  dias: number;
  horas: number;
  minutos: number;
  segundosDoMinuto: number;
  jaSaiu: boolean;
  /** Ja saiu, mas ha pouco tempo — ainda vale mostrar. */
  recemSaiu: boolean;
};

export function contar(airingAt: number, agora: number): Contagem {
  const segundos = airingAt - agora;
  const abs = Math.abs(segundos);
  const jaSaiu = segundos <= 0;

  return {
    segundos,
    dias: Math.floor(abs / 86400),
    horas: Math.floor((abs % 86400) / 3600),
    minutos: Math.floor((abs % 3600) / 60),
    segundosDoMinuto: Math.floor(abs % 60),
    jaSaiu,
    recemSaiu: jaSaiu && abs < JANELA_RECEM_SAIU_S,
  };
}

/**
 * "2d 3h 45m", "3h 45m 12s", "45m 12s", "12s".
 *
 * A unidade menor some conforme a maior cresce: segundo em cima de "2 dias" e
 * ruido, e ainda forcaria repintar a tela toda a cada segundo.
 */
export function formatarContagem(c: Contagem): string {
  if (c.dias > 0) return `${c.dias}d ${c.horas}h ${c.minutos}m`;
  if (c.horas > 0) return `${c.horas}h ${c.minutos}m ${c.segundosDoMinuto}s`;
  if (c.minutos > 0) return `${c.minutos}m ${c.segundosDoMinuto}s`;
  return `${c.segundosDoMinuto}s`;
}

/**
 * Texto pronto para o card. O que acabou de sair diz HA QUANTO TEMPO — a
 * pergunta de quem olha e "perdi por quanto?" —, e "saiu agora" fica so para o
 * primeiro minuto, onde e verdade.
 */
export function rotuloContagem(c: Contagem): string {
  if (c.recemSaiu) {
    if (c.horas > 0) return `saiu há ${c.horas}h`;
    if (c.minutos > 0) return `saiu há ${c.minutos}min`;
    return "saiu agora";
  }
  if (c.jaSaiu) return "já saiu";
  return formatarContagem(c);
}
