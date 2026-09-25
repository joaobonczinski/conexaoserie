// A conta de A QUE HORAS um episodio chega no Brasil.
//
// E a parte do site que nenhuma API entrega pronta, e por isso mora num arquivo
// so, sem importar nada do resto do projeto: `npm run conferir:horarios` roda
// este arquivo direto no Node, sem build, contra casos conhecidos.
//
// A REGRA DE OURO e a mesma do Conexão Anime: todo horario vira um instante
// ABSOLUTO (Unix) aqui, e a conversao para o fuso de quem olha acontece so no
// navegador. Nada aqui depende do fuso da maquina que roda o build — todo
// relogio consultado e nomeado.

import type {
  EpisodioBruto,
  Lancamento,
  OrigemDoHorario,
  RegraDeHorario,
} from "./tipos";

/** Brasilia, para os ajustes que o admin escreve na hora daqui. */
export const FUSO_BRASILIA = "America/Sao_Paulo";

/**
 * Quantos milissegundos o relogio de `fuso` esta a frente do UTC num instante.
 *
 * Existe porque o JavaScript nao tem "meia-noite em Los Angeles" pronto: ele so
 * sabe ler um instante num fuso, e nao o contrario. A leitura com `Intl` da as
 * pecas do relogio local; montadas como se fossem UTC, a diferenca para o
 * instante real e o deslocamento.
 *
 * `hourCycle: "h23"` e o que impede a meia-noite de sair como "24" — alguns
 * motores fazem isso com `hour12: false`, e a conta erraria um dia inteiro.
 */
function deslocamento(utcMs: number, fuso: string): number {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: fuso,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const v: Record<string, number> = {};
  for (const p of partes) v[p.type] = Number(p.value);
  const comoUtc = Date.UTC(v.year, v.month - 1, v.day, v.hour, v.minute, v.second);
  return comoUtc - utcMs;
}

/**
 * O instante (Unix segundos) em que o relogio de `fuso` marca `hora` em `data`.
 *
 * DUAS PASSADAS, e a segunda nao e enfeite: a primeira mede o deslocamento no
 * instante ingenuo, que pode estar do outro lado de uma virada de horario de
 * verao; a segunda mede no instante ja corrigido. Numa virada de marco ou de
 * novembro a primeira sozinha erra por uma hora.
 */
export function instanteNoFuso(data: string, hora: string, fuso: string): number {
  const [ano, mes, dia] = data.split("-").map(Number);
  const [h, m] = hora.split(":").map(Number);
  const ingenuo = Date.UTC(ano, mes - 1, dia, h, m);
  let utc = ingenuo - deslocamento(ingenuo, fuso);
  utc = ingenuo - deslocamento(utc, fuso);
  return Math.floor(utc / 1000);
}

/** "2026-03-01" -> "2026-02-28". Em UTC, que nao tem horario de verao. */
export function diaAnterior(data: string): string {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia - 1)).toISOString().slice(0, 10);
}

/** O que o admin pode escrever para uma serie que foge da regra. */
export type AjusteDeHorario = { hora: string; vespera?: boolean };

/**
 * Quando UM episodio chega no Brasil, e de onde veio essa resposta.
 *
 * A ORDEM E A DA CONFIANCA: o ajuste manual (alguem conferiu esta serie)
 * ganha da regra da plataforma (vale para a maioria), que ganha de nada. O
 * horario da TV so vale para canal marcado como `exibicao`, porque e so la que
 * o carimbo do TVmaze e um horario de verdade.
 *
 * `null` quando nao ha como saber — melhor o card dizer "sem hora" do que
 * inventar uma.
 */
export function quandoChega(
  ep: EpisodioBruto,
  regra: RegraDeHorario | null,
  ajuste: AjusteDeHorario | null,
): { airingAt: number | null; origem: OrigemDoHorario | null } {
  if (ajuste) {
    const dia = ajuste.vespera ? diaAnterior(ep.data) : ep.data;
    return { airingAt: instanteNoFuso(dia, ajuste.hora, FUSO_BRASILIA), origem: "manual" };
  }
  if (regra?.tipo === "regra") {
    const dia = regra.vespera ? diaAnterior(ep.data) : ep.data;
    return { airingAt: instanteNoFuso(dia, regra.hora, regra.fuso), origem: "regra" };
  }
  if (regra?.tipo === "exibicao" && ep.temHora) {
    return { airingAt: ep.carimbo, origem: "exibicao" };
  }
  return { airingAt: null, origem: null };
}

/**
 * Ate quanto tempo depois do episodio anterior um episodio ainda conta como
 * "a mesma noite".
 *
 * A TV americana passa dois ou tres episodios seguidos na estreia — o American
 * Horror Story de setembro de 2026 saiu as 22h, 22h43 e 23h27 de Brasilia. Tres
 * cards da mesma serie na mesma noite sao ruido; um card "E1–3, 22h" diz a
 * mesma coisa. Tres horas pegam o bloco inteiro e nunca juntam dois dias de uma
 * novela diaria, que ficam 24 h separados.
 */
const MESMA_NOITE_S = 3 * 3600;

/**
 * Os episodios de uma serie agrupados no que sai JUNTO.
 *
 * - A temporada inteira da Netflix, que sai no mesmo minuto, vira UM lancamento.
 * - Episodios seguidos na mesma noite da TV viram um, com a hora do primeiro
 *   (ver `MESMA_NOITE_S`).
 * - Sem hora, junta o que tem a mesma data.
 *
 * A TEMPORADA SEPARA: o mesmo minuto pode soltar o fim de uma e o comeco de
 * outra (serie antiga que chega inteira no catalogo), e "T2 E10 e T3 E1" num
 * card so seria uma conta sem sentido.
 */
export function montarLancamentos(
  episodios: EpisodioBruto[],
  regra: RegraDeHorario | null,
  ajuste: AjusteDeHorario | null,
): Lancamento[] {
  // Sem instante vai por data, ao meio-dia UTC — so para ordenar, nunca para
  // mostrar. Meio-dia e o ponto do dia que cai na mesma data em qualquer fuso
  // das Americas.
  const ordem = (airingAt: number | null, data: string) =>
    airingAt ?? Date.parse(`${data}T12:00:00Z`) / 1000;

  const calculados = episodios
    .map((ep) => ({ ep, ...quandoChega(ep, regra, ajuste) }))
    .sort(
      (a, b) =>
        ordem(a.airingAt, a.ep.data) - ordem(b.airingAt, b.ep.data) ||
        (a.ep.numero ?? 0) - (b.ep.numero ?? 0),
    );

  const lista: Lancamento[] = [];
  // Por temporada: o lancamento aberto e a hora do ULTIMO episodio dele. A
  // comparacao e com o ultimo, e nao com o primeiro, para um bloco longo de
  // episodios de 40 minutos continuar inteiro.
  const aberto = new Map<number, { l: Lancamento; ultimo: number | null }>();

  for (const { ep, airingAt, origem } of calculados) {
    const atual = aberto.get(ep.temporada);
    const junta =
      atual !== undefined &&
      (airingAt !== null && atual.ultimo !== null
        ? airingAt - atual.ultimo <= MESMA_NOITE_S
        : airingAt === null && atual.ultimo === null && atual.l.data === ep.data);

    let l: Lancamento;
    if (junta) {
      l = atual.l;
    } else {
      l = {
        data: ep.data,
        airingAt,
        origem,
        temporada: ep.temporada,
        episodios: [],
        estreia: false,
      };
      lista.push(l);
    }
    aberto.set(ep.temporada, { l, ultimo: airingAt });
    if (ep.numero !== null) l.episodios.push(ep.numero);
    if (ep.numero === 1) l.estreia = true;
  }

  for (const l of lista) l.episodios.sort((a, b) => a - b);
  return lista;
}
