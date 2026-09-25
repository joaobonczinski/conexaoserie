// Tudo que envolve fuso horario NA TELA mora aqui. (A conta de quando um
// episodio chega, que roda no build, mora em regras.ts.)
//
// Regra de ouro, herdada do Conexão Anime: `airingAt` e um timestamp Unix
// absoluto e NUNCA e convertido no build. O site e estatico, entao o build roda
// no fuso do servidor do Cloudflare — converter la deixaria o horario congelado
// e errado para todo mundo. A conversao acontece sempre com um fuso explicito.

export const FUSO_PADRAO = "America/Sao_Paulo";

export const DIAS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export const DIAS_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** Fuso do visitante, com o Brasil como fallback. */
export function detectarFuso(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || FUSO_PADRAO;
  } catch {
    return FUSO_PADRAO;
  }
}

/** Horario no formato 23:30, no fuso informado. */
export function formatarHora(unixSegundos: number, fuso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: fuso,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(unixSegundos * 1000));
}

// Nomes em portugues dos fusos brasileiros. O identificador tecnico nao serve
// para mostrar na tela: "America/Sao_Paulo" viraria "Sao Paulo" sem acento, e
// o nome correto desse fuso no Brasil e "horario de Brasilia" (UTC-3), mesmo o
// identificador citando Sao Paulo.
const FUSOS_BRASILEIROS: Record<string, string> = {
  "America/Sao_Paulo": "Brasília",
  "America/Bahia": "Salvador",
  "America/Fortaleza": "Fortaleza",
  "America/Recife": "Recife",
  "America/Maceio": "Maceió",
  "America/Araguaina": "Araguaína",
  "America/Belem": "Belém",
  "America/Santarem": "Santarém",
  "America/Campo_Grande": "Campo Grande",
  "America/Cuiaba": "Cuiabá",
  "America/Manaus": "Manaus",
  "America/Boa_Vista": "Boa Vista",
  "America/Porto_Velho": "Porto Velho",
  "America/Rio_Branco": "Rio Branco",
  "America/Eirunepe": "Eirunepé",
  "America/Noronha": "Fernando de Noronha",
};

export function ehFusoBrasileiro(fuso: string): boolean {
  return fuso in FUSOS_BRASILEIROS;
}

/** Nome do fuso para mostrar na tela (ex.: "Brasília", "Manaus", "Lisbon"). */
export function nomeDoFuso(fuso: string): string {
  return (
    FUSOS_BRASILEIROS[fuso] ?? fuso.split("/").pop()?.replace(/_/g, " ") ?? fuso
  );
}

/**
 * A data no fuso de quem acessa, "2026-08-27".
 *
 * `en-CA` da exatamente YYYY-MM-DD, que compara como texto sem virar objeto de
 * data — e e com texto que o calendario separa os dias.
 */
export function dataLocal(unixSegundos: number, fuso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: fuso,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(unixSegundos * 1000));
}

/**
 * "2026-09-25" somado de `dias`. Em UTC ao meio-dia: e so aritmetica de
 * calendario, e meio-dia nunca atravessa a meia-noite por causa de horario de
 * verao.
 */
export function somarDias(data: string, dias: number): string {
  const [a, m, d] = data.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + dias, 12)).toISOString().slice(0, 10);
}

/** O dia da semana (0 = domingo) de uma DATA, sem fuso nenhum envolvido. */
export function diaDaSemanaDaData(data: string): number {
  const [a, m, d] = data.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d, 12)).getUTCDay();
}

/** "27/09" — o dia e o mes, para as abas e as listas. */
export function diaEMes(data: string): string {
  const [, m, d] = data.split("-");
  return `${d}/${m}`;
}

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/**
 * "27 de setembro". Feito a partir dos pedacos da string, e NAO com
 * `new Date(...)`: uma data sem hora e lida como meia-noite UTC, que no Brasil
 * e o dia anterior.
 */
export function dataPorExtenso(data: string, comAno = false): string {
  const [ano, mes, dia] = data.split("-").map(Number);
  return `${dia} de ${MESES[mes - 1]}${comAno ? ` de ${ano}` : ""}`;
}
