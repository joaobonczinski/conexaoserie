import { JANELA_RECEM_SAIU_S } from "./contagem";
import type { Lancamento } from "./tipos";

// Qual lancamento de uma serie e o "proximo" e qual acabou de sair.
//
// Mora fora de series.ts porque o NAVEGADOR tambem faz esta conta: a pagina da
// serie e HTML do build, e entre um build e outro o episodio de domingo as 22h
// sai. Quem abre a pagina as 23h precisa ver o seguinte como proximo — e so o
// relogio de quem olha sabe que ja sao 23h. (E series.ts nao pode ir para o
// navegador: ele carrega a agenda inteira.)

/**
 * Ate quando um lancamento conta como "ainda vem".
 *
 * Com hora, o proprio instante. SEM HORA, o fim do dia dele em Brasilia: o
 * meio-dia UTC que ordena a linha do tempo (`instanteDe`, em series.ts) daria o
 * episodio por saido as 9h da manha — e a plataforma que ninguem sabe a que
 * horas libera pode liberar a noite. O Brasil nao tem horario de verao desde
 * 2019, entao o -03:00 fixo e exato.
 */
export function fimDe(l: Lancamento): number {
  return l.airingAt ?? Date.parse(`${l.data}T23:59:59-03:00`) / 1000;
}

/** O proximo lancamento que ainda nao saiu, ou null. A lista vem em ordem. */
export function proximoLancamento(
  lancamentos: Lancamento[],
  agora: number,
): Lancamento | null {
  return lancamentos.find((l) => fimDe(l) > agora) ?? null;
}

/** Os que ja sairam, do mais recente para o mais antigo. */
export function jaSaidos(lancamentos: Lancamento[], agora: number): Lancamento[] {
  return lancamentos.filter((l) => fimDe(l) <= agora).reverse();
}

/**
 * O ultimo lancamento, se saiu ha menos de 12 horas — o "saiu ha 3h" do card.
 *
 * So com hora: sem ela nao ha "ha quanto tempo" para dizer.
 */
export function recemSaido(lancamentos: Lancamento[], agora: number): Lancamento | null {
  const ultimo = jaSaidos(lancamentos, agora)[0];
  if (!ultimo || ultimo.airingAt === null) return null;
  return agora - ultimo.airingAt < JANELA_RECEM_SAIU_S ? ultimo : null;
}
