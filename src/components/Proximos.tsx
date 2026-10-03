"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import BotaoDaLista from "./BotaoDaLista";
import SeloDePlataforma from "./SeloDePlataforma";
import type { Lancamento, SerieNaTela } from "@/lib/tipos";
import { contar, rotuloContagem } from "@/lib/contagem";
import { LINK_QUE_COBRE, enderecoDaSerie } from "@/lib/enderecos";
import {
  DIAS_CURTOS,
  dataLocal,
  diaDaSemanaDaData,
  diaEMes,
  ehFusoBrasileiro,
  formatarHora,
  nomeDoFuso,
} from "@/lib/horario";
import { instanteDe, proximoLancamento, recemSaido } from "@/lib/proximo";
import { useAgora, useAncora, useFuso } from "@/lib/relogio";
import { rotuloDeEstreia, rotuloDoLancamento } from "@/lib/rotulos";

/* ===========================================================================
   OS PROXIMOS — quanto falta para o proximo episodio de cada serie.

   E a /proximos/ do Conexão Anime (a contagem e o produto da tela, e quem sai
   primeiro vem primeiro), e entrou em 29/09/2026 no lugar de duas paginas: a
   /estreias/ e a /series/ ("remove esse menu Series e Estreias para criar o
   Proximos", pediu o Joao). O que cada uma fazia virou FILTRO aqui: "Estreias"
   e cada plataforma.

   O HTML DO BUILD JA TEM A LISTA, no horario de Brasilia — e ela que o Google
   le. Depois de montar, o relogio e o fuso passam a ser os de quem olha, e o
   episodio que saiu no meio do dia da lugar ao seguinte sozinho (cada serie
   chega com os tres proximos lancamentos, ver `seriesComProximos`).
   =========================================================================== */

type SerieComLancamentos = { serie: SerieNaTela; lancamentos: Lancamento[] };

type Props = {
  series: SerieComLancamentos[];
  /** O instante do build: o "agora" do HTML e da hidratacao. */
  agoraDoBuild: number;
  /** As plataformas que tem serie na lista, na ordem do mapa. */
  plataformas: string[];
};

/** "HBO Max" -> "hbo-max": a ancora de cada filtro (#hbo-max). */
const ancoraDe = (texto: string) =>
  texto
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function Proximos({ series, agoraDoBuild, plataformas }: Props) {
  const fuso = useFuso();

  // O relogio em dois passos, como no calendario: o de segundo so liga quando
  // algo sai nas proximas 24 horas.
  const agoraGrosso = useAgora(60_000);
  const precisaDeSegundo = useMemo(
    () =>
      agoraGrosso !== null &&
      series.some((s) => {
        const p = proximoLancamento(s.lancamentos, agoraGrosso);
        return p !== null && p.airingAt !== null && p.airingAt - agoraGrosso < 86400;
      }),
    [series, agoraGrosso],
  );
  const agoraFino = useAgora(precisaDeSegundo ? 1000 : 60_000);
  const agora = agoraFino ?? agoraGrosso;
  const referencia = agora ?? agoraDoBuild;

  // O FILTRO NASCE DA ANCORA (/proximos/#estreias, que a home usa no "ver
  // todas") e depois e do clique. Sem `setState` em efeito: a ancora e lida
  // pelo `useAncora`, e o clique so passa a mandar quando existe.
  const ancora = useAncora().replace(/^#/, "");
  const filtros = ["todas", "estreias", ...plataformas.map(ancoraDe)];
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const filtro = escolhido ?? (filtros.includes(ancora) ? ancora : "todas");

  const { aCaminho, recentes } = useMemo(() => {
    const aCaminho: { s: SerieComLancamentos; l: Lancamento }[] = [];
    const recentes: { s: SerieComLancamentos; l: Lancamento }[] = [];
    for (const s of series) {
      const l = proximoLancamento(s.lancamentos, referencia);
      if (l) aCaminho.push({ s, l });
      else {
        // O que saiu ha pouco e ja nao tem seguinte na mao vai para o fim, e
        // nao some: "saiu ha 2h" e resposta para quem chegou procurando.
        const r = agora !== null ? recemSaido(s.lancamentos, agora) : null;
        if (r) recentes.push({ s, l: r });
      }
    }
    aCaminho.sort((a, b) => instanteDe(a.l) - instanteDe(b.l));
    return { aCaminho, recentes };
  }, [series, referencia, agora]);

  const passa = ({ s, l }: { s: SerieComLancamentos; l: Lancamento }) =>
    filtro === "todas" ||
    (filtro === "estreias" ? l.estreia : ancoraDe(s.serie.plataforma) === filtro);
  const visiveis = [...aCaminho.filter(passa), ...recentes.filter(passa)];

  const rotuloDoFiltro = (f: string) =>
    f === "todas"
      ? "Todas"
      : f === "estreias"
        ? "Estreias"
        : (plataformas.find((p) => ancoraDe(p) === f) ?? f);

  return (
    <>
      <div role="group" aria-label="Filtrar os próximos" className="mb-5 flex flex-wrap gap-1.5">
        {filtros.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filtro === f}
            onClick={() => setEscolhido(f)}
            className="chip min-h-9 px-3.5 text-[13px]"
          >
            {rotuloDoFiltro(f)}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-sm text-suave">
          <span className="numero font-semibold text-tinta">{visiveis.length}</span>{" "}
          {visiveis.length === 1 ? "série" : "séries"}
          {filtro === "estreias" ? " estreando" : " com episódio marcado"}
        </p>
        {/* O fuso so pode ser declarado por codigo que roda no navegador. */}
        <p className="text-xs text-fraco">
          horários de {nomeDoFuso(fuso)}
          {ehFusoBrasileiro(fuso) ? "" : " (seu fuso)"}
        </p>
      </div>

      {visiveis.length === 0 ? (
        <p className="py-16 text-center text-sm text-fraco">
          Nenhuma série com episódio marcado neste filtro.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {visiveis.map(({ s, l }) => {
            const { serie } = s;
            const c = agora !== null && l.airingAt !== null ? contar(l.airingAt, agora) : null;
            const dia = l.airingAt !== null ? dataLocal(l.airingAt, fuso) : l.data;
            const estreia = rotuloDeEstreia(l);
            return (
              <li
                key={serie.id}
                className={`relative flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors hover:border-linha-forte ${
                  c?.recemSaiu ? "border-ok/40 bg-ok/[0.06]" : "border-linha bg-cartao"
                }`}
              >
                {serie.capa ? (
                  // eslint-disable-next-line @next/next/no-img-element -- CDN externo em site estatico
                  <img
                    src={serie.capa}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-16 w-11 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-16 w-11 shrink-0 rounded-lg bg-realce" />
                )}

                <div className="min-w-0 flex-1">
                  {/* DUAS LINHAS, e nao `truncate`: com a contagem e o "+" na
                      mesma linha, sobram uns 110px para o nome num celular de
                      375px, e o corte de uma linha comia 38 dos 87 nomes
                      ("American Hor…", "The Sisters Gri…") em 01/10/2026. O
                      link esticado nao sofre com o `overflow` do corte: o
                      `::after` dele se posiciona pelo `li`, que esta fora. */}
                  <p className="line-clamp-2 text-sm font-semibold text-tinta">
                    <Link
                      href={enderecoDaSerie(serie.slug)}
                      prefetch={false}
                      className={LINK_QUE_COBRE}
                    >
                      {serie.nome}
                    </Link>
                  </p>
                  {serie.nomeOriginal ? (
                    <p className="truncate text-xs text-suave">{serie.nomeOriginal}</p>
                  ) : null}
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="numero text-[11px] text-fraco">
                      {rotuloDoLancamento(l)} · {DIAS_CURTOS[diaDaSemanaDaData(dia)]}{" "}
                      {diaEMes(dia)}
                      {l.airingAt !== null ? ` · ${formatarHora(l.airingAt, fuso)}` : ""}
                    </p>
                    {estreia ? (
                      <span className="rounded-md bg-ouro-fundo px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ouro-tinta">
                        {estreia}
                      </span>
                    ) : null}
                    <SeloDePlataforma
                      plataforma={serie.plataforma}
                      cor={serie.cor}
                      link={serie.link}
                      espacamento="mt-0"
                    />
                  </div>
                </div>

                {/* A CONTAGEM E O PRODUTO DESTA TELA: mono, maior que o resto.
                    Sem hora, a data ja foi dita na linha, e a coluna diz so que
                    a hora falta. */}
                <span
                  className={`numero shrink-0 text-right text-[15px] font-semibold ${
                    c?.recemSaiu ? "text-ok" : "text-tinta"
                  }`}
                >
                  {l.airingAt === null ? (
                    <span className="text-[11px] font-medium text-fraco">sem hora</span>
                  ) : c === null ? (
                    <span className="text-fraco">—</span>
                  ) : (
                    rotuloContagem(c)
                  )}
                </span>
                <BotaoDaLista tvmazeId={serie.id} titulo={serie.nome} variante="linha" />
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
