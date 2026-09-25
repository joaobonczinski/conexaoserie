"use client";

import SeloDePlataforma from "./SeloDePlataforma";
import TituloDeSecao from "./TituloDeSecao";
import { IconeSetaDireita, IconeSetaEsquerda } from "./Icones";
import { CARD_CARROSSEL, TRILHO_CARROSSEL, useCarrossel } from "@/lib/carrossel";
import { estiloDaCor } from "@/lib/cor-da-capa";
import { traduzirGenero } from "@/lib/generos";
import { notaEmTexto } from "@/lib/rotulos";
import type { SerieNaTela } from "@/lib/tipos";

/* ===========================================================================
   O RANKING DO QUE ESTA NO AR, na home — colado no calendario.

   O calendario responde "que horas sai"; o ranking responde "o que vale a
   pena". E ranqueia SO o que esta no ar, a regra do Conexão Anime: com uma nota
   de fora sobre outro recorte, a pessoa clicaria no ranking e nao acharia a
   serie no calendario logo acima.

   A POSICAO E MEDALHA NAS TRES PRIMEIRAS e numero discreto no resto: um ranking
   em que o topo nao se destaca nao esta rankeando nada, so numerando.
   =========================================================================== */

function medalha(posicao: number): string | null {
  if (posicao === 1) return "medalha-ouro";
  if (posicao === 2) return "medalha-prata";
  if (posicao === 3) return "medalha-bronze";
  return null;
}

export default function RankingNoAr({ series }: { series: SerieNaTela[] }) {
  const { trilho, podeVoltar, podeAvancar, aoRolar, rolar } =
    useCarrossel<HTMLUListElement>();

  if (series.length === 0) return null;

  const quantosComNota = series.filter((s) => s.nota !== null).length;

  return (
    <section className="mt-16">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <TituloDeSecao
            etiqueta="No ar agora"
            titulo="Mais bem avaliadas"
            // Diz DE ONDE vem a nota e QUANTAS entraram: numero sem origem e
            // opiniao com cara de fato.
            descricao={`Nota média do público do TVmaze, entre as ${quantosComNota} séries no ar que já têm nota. Atualiza todo dia.`}
            href="/ranking/"
          />
        </div>

        <div className="mb-5 hidden shrink-0 gap-1 sm:flex">
          <button
            type="button"
            onClick={() => rolar(-1)}
            disabled={!podeVoltar}
            aria-label="Ver os anteriores do ranking"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-linha text-suave transition-colors hover:border-linha-forte hover:text-tinta disabled:opacity-60 disabled:hover:border-linha"
          >
            <IconeSetaEsquerda className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => rolar(1)}
            disabled={!podeAvancar}
            aria-label="Ver os próximos do ranking"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-linha text-suave transition-colors hover:border-linha-forte hover:text-tinta disabled:opacity-60 disabled:hover:border-linha"
          >
            <IconeSetaDireita className="h-4 w-4" />
          </button>
        </div>
      </div>

      <ul
        ref={trilho}
        onScroll={aoRolar}
        tabIndex={0}
        role="region"
        aria-label="Ranking das séries no ar, lista rolável"
        className={`${TRILHO_CARROSSEL} gap-4`}
      >
        {series.map((serie, i) => {
          const posicao = serie.nota !== null ? i + 1 : null;
          const generos = serie.generos.slice(0, 3).map(traduzirGenero).join(" · ");
          const classeDaMedalha = posicao ? medalha(posicao) : null;

          return (
            <li key={serie.id} className={CARD_CARROSSEL}>
              {/* O `role="group"` com `aria-label` diz ao leitor de tela
                  posicao, nome e nota juntos — sem isso os cards viram texto
                  solto e quem nao ve a tela perde a nocao de ranking. */}
              <div
                role="group"
                aria-label={`${posicao ? `${posicao}º lugar, ` : ""}${serie.nome}, ${
                  serie.nota !== null ? `nota ${notaEmTexto(serie.nota)}` : "ainda sem nota"
                }`}
                className="card block"
                style={estiloDaCor(serie.cor)}
              >
                <div className="card-capa aspect-[2/3]">
                  {serie.capa ? (
                    // eslint-disable-next-line @next/next/no-img-element -- CDN externo em site estatico
                    <img
                      src={serie.capa}
                      srcSet={
                        serie.capaGrande
                          ? `${serie.capa} 210w, ${serie.capaGrande} 680w`
                          : undefined
                      }
                      sizes="168px"
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="card-arte h-full w-full object-cover"
                    />
                  ) : null}

                  {posicao ? (
                    <span
                      aria-hidden="true"
                      className={`numero absolute left-2 top-2 grid h-7 min-w-7 place-items-center rounded-lg px-1.5 text-xs font-semibold ${
                        classeDaMedalha ?? "adesivo"
                      }`}
                    >
                      {posicao}
                    </span>
                  ) : null}

                  <span
                    aria-hidden="true"
                    className={`adesivo numero absolute bottom-3 right-2 px-1.5 py-0.5 text-xs font-semibold ${
                      serie.nota !== null ? "text-arte-ouro" : "text-arte/60 !text-[10px]"
                    }`}
                  >
                    {serie.nota !== null ? notaEmTexto(serie.nota) : "sem nota"}
                  </span>

                  <span aria-hidden className="card-fio">
                    <span className="card-fio-parte" style={{ width: "100%" }} />
                  </span>
                </div>

                {/* As mesmas quatro linhas do card do calendario, na mesma
                    ordem: a serie tem o MESMO nome nas duas filas da mesma
                    tela. */}
                <div className="mt-2.5 flex flex-col">
                  <p
                    title={serie.nome}
                    className="card-nome truncate text-[15px] font-semibold leading-snug text-tinta"
                  >
                    {serie.nome}
                  </p>
                  <p
                    title={serie.nomeOriginal ?? undefined}
                    className="truncate text-[13px] leading-snug text-suave"
                  >
                    {serie.nomeOriginal ?? " "}
                  </p>
                  <p title={generos} className="mt-1 truncate text-[11px] leading-snug text-fraco">
                    {generos || " "}
                  </p>
                  <SeloDePlataforma
                    plataforma={serie.plataforma}
                    cor={serie.cor}
                    link={serie.link}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
