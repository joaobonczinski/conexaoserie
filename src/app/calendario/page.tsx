import type { Metadata } from "next";
import { INSTANTE_DO_BUILD } from "@/lib/build";
import Calendario from "@/components/Calendario";
import CabecalhoDePagina from "@/components/CabecalhoDePagina";
import { FUSO_PADRAO, dataLocal } from "@/lib/horario";
import { metadadosDaPagina } from "@/lib/metadados";
import { itensEntre } from "@/lib/series";

/* ===========================================================================
   O CALENDARIO COM BUSCA — a mesma grade da home, com a lupa.

   O `canonical` APONTA PARA A HOME, de proposito e como no anime: duas paginas
   quase iguais fazem o Google escolher uma sozinho, normalmente a errada.
   Dizendo que a oficial e `/`, esta pagina existe para quem USA o site e nao
   disputa busca com a home. Pelo mesmo motivo fica fora do sitemap.
   =========================================================================== */

export const metadata: Metadata = metadadosDaPagina({
  titulo: "Calendário de séries",
  descricao:
    "A semana inteira com busca: digite o nome da série e o calendário pula para o dia em que ela sai.",
  url: "/",
});

const DIA = 86400;

export default function PaginaCalendario() {
  const agora = INSTANTE_DO_BUILD;

  return (
    <main className="mx-auto w-full max-w-[78rem] px-4 pb-20 pt-6">
      <CabecalhoDePagina
        titulo="Calendário de séries"
        subtitulo="Os próximos sete dias, a partir de hoje"
        nota="No streaming, o horário é o padrão de cada plataforma no Brasil; na TV, o da exibição americana. Tudo convertido para o seu fuso. Use a lupa para achar uma série."
      />

      <Calendario
        itens={itensEntre(agora - 2 * DIA, agora + 15 * DIA)}
        hojeDoBuild={dataLocal(agora, FUSO_PADRAO)}
        comBusca
      />
    </main>
  );
}
