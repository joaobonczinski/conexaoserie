"use client";

import { IconeRelogio } from "./Icones";
import type { Lancamento, UltimoEpisodio } from "@/lib/tipos";
import { contar, formatarContagem, type Contagem } from "@/lib/contagem";
import {
  DIAS,
  DIAS_CURTOS,
  dataLocal,
  dataPorExtenso,
  diaDaSemanaDaData,
  diaEMes,
  ehFusoBrasileiro,
  formatarHora,
  nomeDoFuso,
} from "@/lib/horario";
import { jaSaidos, proximoLancamento, recemSaido } from "@/lib/proximo";
import {
  lancamentoPorExtenso,
  minuscula,
  rotuloDeEstreia,
  rotuloDoLancamento,
} from "@/lib/rotulos";
import { useAgora, useFuso } from "@/lib/relogio";

/* ===========================================================================
   A RESPOSTA DA PAGINA DA SERIE: quando sai o proximo, e o resto das datas.

   COMPONENTE DE CLIENTE, e nao texto do build, por um motivo so: o build roda
   uma vez por dia, e o episodio de domingo as 22h sai no meio desse dia. Quem
   abre a pagina as 23h precisa ver o episodio SEGUINTE como proximo — e so o
   relogio de quem olha sabe que ja sao 23h.

   O HTML DO BUILD CONTINUA COM A RESPOSTA, no horario de Brasilia: e ele que o
   Google le. Na hidratacao o componente desenha o mesmo (o `agora` do build e o
   fuso de Brasilia, pelos `getServerSnapshot` do relogio.ts) e so depois troca
   para o relogio e o fuso de quem esta vendo.
   =========================================================================== */

/** Quantas datas cada lista mostra. Novela diaria teria sessenta. */
const LIMITE_DA_LISTA = 10;

type Props = {
  lancamentos: Lancamento[];
  /** O instante do build: o "agora" do HTML e da hidratacao. */
  agoraDoBuild: number;
  /** A cor da plataforma, para o fio do painel. */
  cor: string;
  /** "na HBO Max" — ja com o artigo certo. */
  onde: string;
  /** O ultimo episodio que o fetch viu sair, para quando a janela esvaziar. */
  ultimo: UltimoEpisodio | null;
  status: string | null;
};

/** O dia de um lancamento para quem olha: a data do instante, ou a do episodio. */
function diaDe(l: Lancamento, fuso: string): string {
  return l.airingAt !== null ? dataLocal(l.airingAt, fuso) : l.data;
}

/** "saiu há 3h", concordando com "os episódios 1 a 8". */
function haQuanto(c: Contagem, plural: boolean): string {
  const verbo = plural ? "saíram" : "saiu";
  if (c.horas > 0) return `${verbo} há ${c.horas}h`;
  if (c.minutos > 0) return `${verbo} há ${c.minutos}min`;
  return `${verbo} agora`;
}

/**
 * O que dizer quando nao ha proximo episodio. O `status` do TVmaze e o que
 * separa "acabou" de "ainda nao tem data" — respostas opostas para quem esta
 * esperando.
 */
function semProximo(status: string | null): string {
  switch (status) {
    case "Ended":
      return "A série terminou. Não há novos episódios anunciados.";
    case "To Be Determined":
      return "Ainda não há nova temporada confirmada.";
    case "In Development":
      return "A estreia ainda não tem data.";
    default:
      return "O próximo episódio ainda não tem data.";
  }
}

export default function AgendaDaSerie({
  lancamentos,
  agoraDoBuild,
  cor,
  onde,
  ultimo,
  status,
}: Props) {
  const fuso = useFuso();

  // O RELOGIO EM DOIS PASSOS, como no calendario: o de segundo so liga quando
  // o proximo sai nas proximas 24 horas. Antes disso a contagem so muda de
  // minuto em minuto, e repintar por segundo seria trabalho jogado fora.
  const agoraGrosso = useAgora(60_000);
  const proximoGrosso =
    agoraGrosso !== null ? proximoLancamento(lancamentos, agoraGrosso) : null;
  const precisaDeSegundo =
    agoraGrosso !== null &&
    proximoGrosso !== null &&
    proximoGrosso.airingAt !== null &&
    proximoGrosso.airingAt - agoraGrosso < 86400;
  const agoraFino = useAgora(precisaDeSegundo ? 1000 : 60_000);
  const agora = agoraFino ?? agoraGrosso;

  // `agora` e null no build e na hidratacao; ai vale o instante do build.
  const referencia = agora ?? agoraDoBuild;
  const proximo = proximoLancamento(lancamentos, referencia);
  const depois = proximo ? lancamentos.slice(lancamentos.indexOf(proximo) + 1) : [];
  const saidos = jaSaidos(lancamentos, referencia);
  // "Saiu ha 3h" so depois de montar: calculado no build, o "ha 3h" ficaria
  // congelado no HTML.
  const recente = agora !== null ? recemSaido(lancamentos, agora) : null;

  const fusoNaTela = `horário de ${nomeDoFuso(fuso)}${
    ehFusoBrasileiro(fuso) ? "" : " (seu fuso)"
  }`;

  return (
    <div>
      <section
        aria-labelledby="proximo-episodio"
        className="painel relative overflow-hidden p-5 sm:p-6"
      >
        {/* O fio de cima na cor da plataforma: o mesmo sinal do card. */}
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-1"
          style={{ backgroundColor: cor }}
        />

        {proximo ? (
          <Proximo lancamento={proximo} fuso={fuso} agora={agora} fusoNaTela={fusoNaTela} />
        ) : (
          <>
            <h2 id="proximo-episodio" className="etiqueta">
              Próximo episódio
            </h2>
            <p className="mt-2 text-lg font-semibold text-tinta">{semProximo(status)}</p>
            <UltimoQueSaiu saido={saidos[0] ?? null} ultimo={ultimo} fuso={fuso} />
          </>
        )}

        {/* O QUE ACABOU DE SAIR, embaixo do proximo. E a pergunta de quem chega
            as 22h30 procurando o episodio das 22h: "ja saiu?". */}
        {proximo && recente && recente.airingAt !== null && agora !== null ? (
          <FraseDoRecente
            lancamento={recente}
            contagem={contar(recente.airingAt, agora)}
            onde={onde}
          />
        ) : null}
      </section>

      {depois.length > 0 ? (
        <ListaDeDatas titulo="Próximas datas" lancamentos={depois} fuso={fuso} nota={fusoNaTela} />
      ) : null}

      {saidos.length > 0 ? (
        <ListaDeDatas
          titulo="Já saíram"
          lancamentos={saidos}
          fuso={fuso}
          nota="os mais recentes primeiro"
        />
      ) : null}
    </div>
  );
}

function Proximo({
  lancamento,
  fuso,
  agora,
  fusoNaTela,
}: {
  lancamento: Lancamento;
  fuso: string;
  agora: number | null;
  fusoNaTela: string;
}) {
  const dia = diaDe(lancamento, fuso);
  const estreia = rotuloDeEstreia(lancamento);
  const contagem =
    lancamento.airingAt !== null && agora !== null
      ? contar(lancamento.airingAt, agora)
      : null;

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h2 id="proximo-episodio" className="etiqueta">
          {lancamento.episodios.length > 1 ? "Próximo lançamento" : "Próximo episódio"}
        </h2>
        {estreia ? <SeloDeEstreia texto={estreia} /> : null}
      </div>

      <p className="mt-2 text-lg font-semibold text-tinta">
        {lancamentoPorExtenso(lancamento)}
      </p>

      <p className="mt-4 text-sm font-medium text-suave">
        {DIAS[diaDaSemanaDaData(dia)]}, {dataPorExtenso(dia)}
      </p>

      {lancamento.airingAt !== null ? (
        <p className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="numero text-4xl font-semibold leading-none text-tinta sm:text-5xl">
            {formatarHora(lancamento.airingAt, fuso)}
          </span>
          <span className="text-xs text-fraco">{fusoNaTela}</span>
        </p>
      ) : (
        <p className="mt-1 text-sm text-suave">
          A hora ainda não foi confirmada — o dia é o da exibição original.
        </p>
      )}

      {/* ALTURA RESERVADA: a contagem so existe depois de montar, e sem a
          reserva o painel cresceria uma linha na cara de quem esta lendo. */}
      <p className="mt-4 flex min-h-5 items-center gap-1.5 text-sm text-suave">
        {contagem !== null && !contagem.jaSaiu ? (
          <>
            <IconeRelogio className="h-4 w-4 text-fraco" />
            Faltam{" "}
            <span className="numero font-medium text-tinta">{formatarContagem(contagem)}</span>
          </>
        ) : null}
      </p>
    </>
  );
}

function SeloDeEstreia({ texto }: { texto: string }) {
  return (
    <span className="rounded-md bg-ouro-fundo px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ouro-tinta">
      {texto}
    </span>
  );
}

/** "O episódio 5 da 1ª temporada saiu há 3h e já está na HBO Max." */
function FraseDoRecente({
  lancamento,
  contagem,
  onde,
}: {
  lancamento: Lancamento;
  contagem: Contagem;
  onde: string;
}) {
  const plural = lancamento.episodios.length > 1;
  return (
    <p className="mt-4 border-t border-linha pt-3 text-sm text-suave">
      {plural ? "Os " : "O "}
      {minuscula(lancamentoPorExtenso(lancamento))}{" "}
      <span className="font-medium text-ok">{haQuanto(contagem, plural)}</span> e já{" "}
      {plural ? "estão" : "está"} {onde}.
    </p>
  );
}

/**
 * "O último foi o episódio 10 da 1ª temporada, em 24 de setembro de 2026."
 *
 * Primeiro o que a janela de episodios ainda tem; quando ela ja nao tem nada
 * (a temporada acabou ha mais de uma semana), o que o fetch guardou.
 */
function UltimoQueSaiu({
  saido,
  ultimo,
  fuso,
}: {
  saido: Lancamento | null;
  ultimo: UltimoEpisodio | null;
  fuso: string;
}) {
  let qual: string;
  let dia: string;
  let plural = false;
  if (saido) {
    qual = lancamentoPorExtenso(saido);
    dia = diaDe(saido, fuso);
    plural = saido.episodios.length > 1;
  } else if (ultimo) {
    qual = lancamentoPorExtenso({
      temporada: ultimo.temporada,
      episodios: ultimo.numero !== null ? [ultimo.numero] : [],
    });
    dia = ultimo.data;
  } else {
    return null;
  }

  return (
    <p className="mt-2 text-sm text-suave">
      {plural ? "Os últimos foram os " : "O último foi o "}
      {minuscula(qual)}, em {dataPorExtenso(dia, true)}.
    </p>
  );
}

function ListaDeDatas({
  titulo,
  lancamentos,
  fuso,
  nota,
}: {
  titulo: string;
  lancamentos: Lancamento[];
  fuso: string;
  nota: string;
}) {
  const visiveis = lancamentos.slice(0, LIMITE_DA_LISTA);
  const resto = lancamentos.length - visiveis.length;

  return (
    <section className="mt-8">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3">
        <h2 className="text-base font-bold text-tinta">{titulo}</h2>
        <p className="text-xs text-fraco">{nota}</p>
      </div>
      <ol className="divide-y divide-linha overflow-hidden rounded-xl border border-linha bg-cartao">
        {visiveis.map((l) => {
          const dia = diaDe(l, fuso);
          const estreia = rotuloDeEstreia(l);
          return (
            <li
              key={`${l.temporada}-${l.airingAt ?? l.data}`}
              className="flex items-center gap-3 px-3 py-2.5"
            >
              <span className="numero min-w-24 shrink-0 text-sm font-medium text-tinta">
                {rotuloDoLancamento(l)}
              </span>
              <span className="min-w-0 flex-1">
                {estreia ? <SeloDeEstreia texto={estreia} /> : null}
              </span>
              <span className="numero shrink-0 text-xs text-suave">
                {DIAS_CURTOS[diaDaSemanaDaData(dia)]} {diaEMes(dia)}
              </span>
              <span className="numero w-12 shrink-0 text-right text-sm font-medium text-tinta">
                {l.airingAt !== null ? formatarHora(l.airingAt, fuso) : "—"}
              </span>
            </li>
          );
        })}
      </ol>
      {resto > 0 ? (
        <p className="mt-2 text-xs text-fraco">
          E mais {resto} {resto === 1 ? "data" : "datas"}, até{" "}
          {dataPorExtenso(diaDe(lancamentos[lancamentos.length - 1], fuso))}.
        </p>
      ) : null}
    </section>
  );
}
