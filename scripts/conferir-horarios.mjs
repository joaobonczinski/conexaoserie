// Confere a conta de horarios contra casos conhecidos. Rode com
// `npm run conferir:horarios` depois de mexer em src/lib/regras.ts.
//
// Importa o `.ts` direto: o Node 22.18+ tira os tipos sozinho, e o arquivo nao
// importa nada do projeto em tempo de execucao — foi escrito assim para isto.
//
// Cada caso tem a resposta escrita em horario de Brasilia, que e como ela
// aparece nas fontes brasileiras, e nao em UTC. Se um caso falhar, a pergunta
// certa e "a fonte mudou ou a conta quebrou?" — antes de mexer no numero.

import {
  diaAnterior,
  instanteNoFuso,
  montarLancamentos,
  quandoChega,
} from "../src/lib/regras.ts";

let falhas = 0;

function emBrasilia(unix) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(unix * 1000));
}

function igual(nome, obtido, esperado) {
  const ok = obtido === esperado;
  if (!ok) falhas++;
  console.log(`${ok ? "ok  " : "FALHOU"}  ${nome}${ok ? "" : `\n        esperado ${esperado}\n        obtido   ${obtido}`}`);
}

const NETFLIX = { tipo: "regra", hora: "00:00", fuso: "America/Los_Angeles", vespera: false };
const APPLE = { tipo: "regra", hora: "21:00", fuso: "America/New_York", vespera: true };
const HBO_MAX = { tipo: "regra", hora: "21:00", fuso: "America/New_York", vespera: false };
const TV = { tipo: "exibicao" };

const ep = (data, numero = 1, extra = {}) => ({
  temporada: 1,
  numero,
  data,
  carimbo: 0,
  temHora: false,
  ...extra,
});

// --- Netflix e o horario de verao americano ---------------------------------
// TechTudo (nov/2025) diz 5h: era inverno nos EUA. Em setembro, com Los Angeles
// no horario de verao, a mesma meia-noite e 4h aqui.
igual(
  "Netflix em setembro sai as 4h",
  emBrasilia(quandoChega(ep("2026-09-24"), NETFLIX, null).airingAt),
  "24/09/2026, 04:00",
);
igual(
  "Netflix em novembro, depois da virada, sai as 5h",
  emBrasilia(quandoChega(ep("2026-11-20"), NETFLIX, null).airingAt),
  "20/11/2026, 05:00",
);
// As viradas de 2026 em Los Angeles: 8 de marco e 1o de novembro, as 2h. A
// meia-noite desses dias ainda esta do lado ANTIGO — e aqui que a segunda
// passada do `instanteNoFuso` trabalha.
igual(
  "Netflix no dia da virada de novembro ainda e 4h",
  emBrasilia(instanteNoFuso("2026-11-01", "00:00", "America/Los_Angeles")),
  "01/11/2026, 04:00",
);
igual(
  "Netflix no dia da virada de marco ainda e 5h",
  emBrasilia(instanteNoFuso("2026-03-08", "00:00", "America/Los_Angeles")),
  "08/03/2026, 05:00",
);
igual(
  "3h de Los Angeles no dia da virada de marco (depois dela) e 7h",
  emBrasilia(instanteNoFuso("2026-03-08", "03:00", "America/Los_Angeles")),
  "08/03/2026, 07:00",
);

// --- Apple TV: a noite anterior -----------------------------------------------
// Ted Lasso tem data oficial numa quarta; o episodio sai na terca as 21h de
// Nova York, 22h aqui.
igual(
  "Apple TV sai na vespera as 22h",
  emBrasilia(quandoChega(ep("2026-09-23"), APPLE, null).airingAt),
  "22/09/2026, 22:00",
);
igual(
  "Apple TV na vespera atravessa a virada de mes",
  emBrasilia(quandoChega(ep("2026-10-01"), APPLE, null).airingAt),
  "30/09/2026, 22:00",
);

// --- HBO Max: Stuart saiu na quinta 24/09 as 22h (O Tempo) --------------------
igual(
  "HBO Max original sai as 22h do mesmo dia",
  emBrasilia(quandoChega(ep("2026-09-24"), HBO_MAX, null).airingAt),
  "24/09/2026, 22:00",
);

// --- TV: o carimbo do TVmaze vale, e so ele ---------------------------------
// Lanterns: domingo 27/09, 21h de Nova York, que e 01:00 UTC de segunda.
const lanterns = Date.parse("2026-09-28T01:00:00Z") / 1000;
igual(
  "HBO na TV usa o carimbo: domingo 22h",
  emBrasilia(quandoChega(ep("2026-09-27", 7, { carimbo: lanterns, temHora: true }), TV, null).airingAt),
  "27/09/2026, 22:00",
);
igual(
  "TV sem hora nao inventa horario",
  quandoChega(ep("2026-09-27", 7, { carimbo: lanterns, temHora: false }), TV, null).airingAt,
  null,
);

// --- O ajuste manual ganha de tudo ---------------------------------------------
igual(
  "Ajuste em Brasilia na vespera, por cima da regra do Disney+",
  emBrasilia(quandoChega(ep("2026-09-24"), NETFLIX, { hora: "22:00", vespera: true }).airingAt),
  "23/09/2026, 22:00",
);
igual(
  "Ajuste marca a origem como manual",
  quandoChega(ep("2026-09-24"), NETFLIX, { hora: "22:00" }).origem,
  "manual",
);

// --- Datas ---------------------------------------------------------------------
igual("Dia anterior atravessa fevereiro", diaAnterior("2026-03-01"), "2026-02-28");
igual("Dia anterior atravessa o ano", diaAnterior("2027-01-01"), "2026-12-31");

// --- Agrupar em lancamentos ---------------------------------------------------
const maratona = montarLancamentos(
  [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ep("2026-09-24", n)),
  NETFLIX,
  null,
);
igual("Temporada inteira da Netflix vira UM lancamento", maratona.length, 1);
igual("... com os oito episodios", maratona[0].episodios.join(","), "1,2,3,4,5,6,7,8");
igual("... e marcada como estreia", maratona[0].estreia, true);

// American Horror Story, 24/09/2026 na FX: 22h, 22h43 e 23h27 de Brasilia.
const t22 = Date.parse("2026-09-25T01:00:00Z") / 1000;
const bloco = montarLancamentos(
  [
    ep("2026-09-24", 1, { carimbo: t22, temHora: true }),
    ep("2026-09-24", 2, { carimbo: t22 + 43 * 60, temHora: true }),
    ep("2026-09-24", 3, { carimbo: t22 + 87 * 60, temHora: true }),
  ],
  TV,
  null,
);
igual("Tres episodios seguidos na mesma noite da TV viram um lancamento", bloco.length, 1);
igual("... com a hora do primeiro", emBrasilia(bloco[0].airingAt), "24/09/2026, 22:00");
igual("... e os tres episodios", bloco[0].episodios.join(","), "1,2,3");

const novela = montarLancamentos(
  [
    ep("2026-09-24", 101, { carimbo: t22, temHora: true }),
    ep("2026-09-25", 102, { carimbo: t22 + 86400, temHora: true }),
  ],
  TV,
  null,
);
igual("Novela diaria continua um lancamento por dia", novela.length, 2);

const semanal = montarLancamentos(
  [ep("2026-09-24", 4), ep("2026-10-01", 5)],
  NETFLIX,
  null,
);
igual("Serie semanal do streaming, um lancamento por semana", semanal.length, 2);

const semHora = montarLancamentos(
  [
    ep("2026-09-24", 1, { carimbo: t22, temHora: false }),
    ep("2026-09-24", 2, { carimbo: t22, temHora: false }),
    ep("2026-09-25", 3, { carimbo: t22, temHora: false }),
  ],
  TV,
  null,
);
igual("Sem hora, junta so o que tem a mesma data", semHora.length, 2);

const viradaDeTemporada = montarLancamentos(
  [ep("2026-09-24", 10, { temporada: 2 }), ep("2026-09-24", 1, { temporada: 3 })],
  NETFLIX,
  null,
);
igual("Fim de uma temporada e comeco da outra no mesmo minuto sao dois", viradaDeTemporada.length, 2);

console.log(falhas === 0 ? "\nTudo certo." : `\n${falhas} caso(s) falharam.`);
process.exitCode = falhas === 0 ? 0 : 1;
