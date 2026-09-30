import type { Metadata } from "next";
import CabecalhoDePagina from "@/components/CabecalhoDePagina";
import Proximos from "@/components/Proximos";
import { INSTANTE_DO_BUILD } from "@/lib/build";
import { metadadosDaPagina } from "@/lib/metadados";
import { NOMES_DAS_PLATAFORMAS } from "@/lib/plataformas";
import { seriesComProximos } from "@/lib/series";

/* ===========================================================================
   OS PROXIMOS — a pagina do Conexão Anime e do Conexão Filme, pedida em
   29/09/2026 no lugar da /estreias/ e da /series/, que redirecionam para ca
   (public/_redirects).

   COMPONENTE DE SERVIDOR que monta os dados no build; a contagem e o fuso sao
   do componente de cliente, que roda no navegador.
   =========================================================================== */

export const metadata: Metadata = metadadosDaPagina({
  titulo: "Próximos episódios — quanto falta para cada série",
  descricao:
    "Contagem regressiva para o próximo episódio de cada série, com a hora em que ele chega à Netflix, HBO Max, Disney+ e Prime Video no Brasil. Estreias e temporadas novas, no seu fuso.",
  url: "/proximos/",
});

export default function PaginaProximos() {
  const agora = INSTANTE_DO_BUILD;
  const series = seriesComProximos(agora);
  const presentes = new Set(series.map((s) => s.serie.plataforma));
  // A ordem do mapa de plataformas, e nao a do tamanho: os filtros nao podem
  // trocar de lugar sozinhos porque uma plataforma teve uma semana cheia.
  const plataformas = NOMES_DAS_PLATAFORMAS.filter((p) => presentes.has(p));

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-6">
      <CabecalhoDePagina
        etiqueta="Próximos"
        titulo="Próximos episódios"
        subtitulo="Quem sai primeiro vem primeiro"
        nota="A hora é a de quando o episódio chega ao streaming no Brasil. Série sem hora confirmada mostra só o dia."
      />
      <Proximos series={series} agoraDoBuild={agora} plataformas={plataformas} />
    </main>
  );
}
