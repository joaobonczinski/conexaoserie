import type { Metadata } from "next";
import PaginaDoRanking from "@/components/PaginaDoRanking";
import { metadadosDaPagina } from "@/lib/metadados";

/* ===========================================================================
   O RANKING — abre no de todos os tempos, como o do Conexão Filme e o do
   Conexão Anime (pedido do Joao em 29/09/2026). O das series desta semana
   mudou para /ranking/no-ar/, na outra aba.
   =========================================================================== */

export const metadata: Metadata = metadadosDaPagina({
  titulo: "Top 100 séries mais bem avaliadas de todos os tempos",
  descricao:
    "As 100 séries mais bem avaliadas da história pela nota do público do TVmaze, e o top de cada gênero: drama, comédia, crime, terror, ficção científica e mais. Também as melhores séries coreanas, britânicas e em espanhol.",
  url: "/ranking/",
});

export default function Ranking() {
  return <PaginaDoRanking chave="geral" />;
}
