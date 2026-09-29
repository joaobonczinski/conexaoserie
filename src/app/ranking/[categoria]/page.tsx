import type { Metadata } from "next";
import PaginaDoRanking, { tituloDaLista } from "@/components/PaginaDoRanking";
import { metadadosDaPagina } from "@/lib/metadados";
import { chavesDasCategorias, enderecoDaLista, listaDoRanking } from "@/lib/ranking";

/* ===========================================================================
   O RANKING DE UMA CATEGORIA (/ranking/terror/, /ranking/coreanas/).

   UMA PAGINA ESTATICA POR CATEGORIA, gerada no build a partir do
   ranking.json. Categoria que nao esta no arquivo nao vira pagina: o site e
   `output: export`, entao endereco desconhecido cai no 404.

   A /ranking/no-ar/ e uma pasta propria e ganha desta rota: o Next resolve o
   segmento fixo antes do dinamico, e "no-ar" nunca e chave de categoria.
   =========================================================================== */

export const dynamicParams = false;

/**
 * Endereco usado quando o ranking.json nao tem categoria nenhuma — o mesmo
 * recurso da /novidades/[slug]/. Com a lista vazia, o `output: export` recusa
 * a rota inteira e o build falha; aconteceu na primeira compilacao, antes da
 * primeira coleta.
 */
const RESERVA = "em-breve";

export function generateStaticParams() {
  const chaves = chavesDasCategorias();
  return chaves.length > 0 ? chaves.map((categoria) => ({ categoria })) : [{ categoria: RESERVA }];
}

type Props = { params: Promise<{ categoria: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria } = await params;
  const lista = listaDoRanking(categoria);
  // A reserva nao e conteudo: fica fora do indice.
  if (!lista) return { title: "Ranking", robots: { index: false, follow: false } };
  return metadadosDaPagina({
    titulo: tituloDaLista(lista),
    descricao: `As ${lista.series.length} ${lista.nome} mais bem avaliadas de todos os tempos, pela nota do público do TVmaze, entre as mais acompanhadas por lá.`,
    url: enderecoDaLista(categoria),
  });
}

export default async function RankingDaCategoria({ params }: Props) {
  const { categoria } = await params;
  return <PaginaDoRanking chave={categoria} />;
}
