import type { Metadata } from "next";
import Link from "next/link";
import { INSTANTE_DO_BUILD } from "@/lib/build";
import CabecalhoDePagina from "@/components/CabecalhoDePagina";
import SeloDePlataforma from "@/components/SeloDePlataforma";
import { metadadosDaPagina } from "@/lib/metadados";
import { LINK_QUE_COBRE, enderecoDaSerie } from "@/lib/enderecos";
import { traduzirGenero } from "@/lib/generos";
import { notaEmTexto } from "@/lib/rotulos";
import { rankingNoAr } from "@/lib/series";

/* ===========================================================================
   O RANKING INTEIRO DO QUE ESTA NO AR — o carrossel da home, em lista.

   LISTA E NAO GRADE DE CAPAS: aqui a pessoa esta comparando, e numa lista a
   posicao e a nota ficam alinhadas numa coluna, que e onde o olho compara. Na
   home o carrossel ja cumpre o papel de vitrine.

   So entra o que esta no ar (episodio de uma semana atras a uma semana a
   frente) — a mesma regra do carrossel, e pelo mesmo motivo: o ranking fala do
   que esta no calendario.
   =========================================================================== */

export const metadata: Metadata = metadadosDaPagina({
  titulo: "Ranking das séries no ar — as mais bem avaliadas da semana",
  descricao:
    "As séries que estão no ar agora, da mais bem avaliada para a menos, com a nota do público e onde assistir no Brasil.",
  url: "/ranking/",
});

export default function PaginaRanking() {
  const agora = INSTANTE_DO_BUILD;
  const series = rankingNoAr(agora);
  const comNota = series.filter((s) => s.nota !== null).length;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-20 pt-6">
      <CabecalhoDePagina
        etiqueta="No ar agora"
        titulo="Ranking das séries no ar"
        subtitulo={`${comNota} séries com nota, de ${series.length} no ar esta semana`}
        nota="Nota média do público do TVmaze, de 0 a 10. Quem ainda não tem nota fica no fim, sem posição — sem nota não é o mesmo que pior."
      />

      <ol className="flex flex-col gap-2">
        {series.map((serie, i) => {
          const posicao = serie.nota !== null ? i + 1 : null;
          const generos = serie.generos.slice(0, 3).map(traduzirGenero).join(" · ");
          return (
            <li
              key={serie.id}
              className="relative flex items-center gap-3 rounded-xl border border-linha bg-cartao px-3 py-2.5 transition-colors hover:border-linha-forte"
            >
              <span className="numero w-7 shrink-0 text-center text-sm font-semibold text-fraco">
                {posicao ?? "—"}
              </span>
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
                <p className="truncate text-sm font-semibold text-tinta">
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
                <div className="mt-1 flex flex-wrap items-center gap-x-2">
                  {generos ? <p className="text-[11px] text-fraco">{generos}</p> : null}
                  <SeloDePlataforma
                    plataforma={serie.plataforma}
                    cor={serie.cor}
                    link={serie.link}
                    espacamento="mt-0"
                  />
                </div>
              </div>
              <span
                className={`numero shrink-0 text-[15px] font-semibold ${
                  serie.nota !== null ? "text-tinta" : "text-[11px] text-fraco"
                }`}
              >
                {serie.nota !== null ? notaEmTexto(serie.nota) : "sem nota"}
              </span>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
