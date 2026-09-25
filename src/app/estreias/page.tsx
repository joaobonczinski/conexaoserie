import type { Metadata } from "next";
import { INSTANTE_DO_BUILD } from "@/lib/build";
import CabecalhoDePagina from "@/components/CabecalhoDePagina";
import ListaDeEstreias from "@/components/ListaDeEstreias";
import { metadadosDaPagina } from "@/lib/metadados";
import { estreias } from "@/lib/series";

/* ===========================================================================
   AS ESTREIAS DOS PROXIMOS DOIS MESES — serie nova e temporada nova.

   E A PAGINA FEITA PARA O GOOGLE: "estreias de séries em outubro" e busca de
   todo mes, e a resposta aqui sai pronta no HTML (componente de servidor),
   agrupada por dia e com o horario em que chega ao Brasil.

   DOIS MESES E O QUE O TVMAZE SABE COM ALGUMA FIRMEZA. Mais longe que isso a
   agenda fica rala (anuncio sem data) e a pagina cresceria com buraco.
   =========================================================================== */

const DIAS = 60;

export const metadata: Metadata = metadadosDaPagina({
  titulo: "Estreias de séries — novas temporadas e séries novas",
  descricao:
    "As estreias de séries dos próximos dois meses na Netflix, HBO Max, Disney+, Prime Video e Apple TV, com o dia e a hora em que chegam ao Brasil.",
  url: "/estreias/",
});

export default function PaginaEstreias() {
  const agora = INSTANTE_DO_BUILD;
  const itens = estreias(agora, DIAS);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-6">
      <CabecalhoDePagina
        etiqueta="Vem aí"
        titulo="Estreias de séries"
        subtitulo={`${itens.length} estreias nos próximos dois meses`}
        nota="Horários de Brasília. No streaming, é o horário padrão de cada plataforma no Brasil; a data pode mudar até a véspera, e a lista acompanha."
      />

      <ListaDeEstreias itens={itens} />
    </main>
  );
}
