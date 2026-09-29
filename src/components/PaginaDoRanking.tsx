import AbasDoRanking from "./AbasDoRanking";
import CabecalhoDePagina from "./CabecalhoDePagina";
import ListaDoRanking from "./ListaDoRanking";
import SeletorDeCategoria from "./SeletorDeCategoria";
import { gruposDoSeletor, listaDoRanking, type ListaDoRanking as Lista } from "@/lib/ranking";

/* ===========================================================================
   A PAGINA DO RANKING DE TODOS OS TEMPOS, a mesma para a lista geral
   (/ranking/) e para cada categoria (/ranking/terror/). Veio do Conexão Filme.

   OS NUMEROS DA FRASE VEM DO ARQUIVO, e nenhum e digitado, pela licao do
   Conexão Anime: a frase promete um tamanho e uma faixa de anos, e no dia em
   que o robo mudar o corte, um numero escrito a mao viraria mentira sem nada
   quebrar.
   =========================================================================== */

/** "Top 100 séries de terror mais bem avaliadas" (ou "Top 84", se tiver menos). */
export function tituloDaLista(lista: Lista): string {
  return `Top ${lista.series.length} ${lista.nome} mais bem avaliadas`;
}

function subtituloDaLista(lista: Lista): string {
  const n = lista.series.length;
  const anos =
    lista.anoMaisAntigo && lista.anoMaisNovo
      ? `, de ${lista.anoMaisAntigo} a ${lista.anoMaisNovo}`
      : "";
  // Quando a lista tem TODAS as que passam no corte, "o top 84 entre as 84"
  // seria esquisito.
  return n < lista.total
    ? `O top ${n} entre as ${lista.total.toLocaleString("pt-BR")} ${lista.nome} mais conhecidas do TVmaze${anos}.`
    : `Todas as ${n} ${lista.nome} mais conhecidas do TVmaze${anos}.`;
}

export default function PaginaDoRanking({ chave }: { chave: string }) {
  const lista = listaDoRanking(chave);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-6">
      <CabecalhoDePagina
        etiqueta="Ranking"
        titulo={lista ? tituloDaLista(lista) : "As séries mais bem avaliadas"}
        subtitulo={lista ? subtituloDaLista(lista) : undefined}
        // O "MAIS CONHECIDAS" PRECISA DE EXPLICACAO, e e esta: o TVmaze nao diz
        // quantos votos cada nota tem, e sem um corte de popularidade uma serie
        // com meia duzia de votos 10 ficaria no topo. Ver o fetch-ranking.
        nota="Nota média do público do TVmaze, de 0 a 10. Só entram as séries mais acompanhadas por lá: sem esse corte, uma série com meia dúzia de votos iria para o topo."
      />

      <AbasDoRanking atual="todos-os-tempos" />

      {lista && lista.series.length > 0 ? (
        <>
          <div className="mt-5">
            <SeletorDeCategoria atual={lista.chave} grupos={gruposDoSeletor()} />
          </div>
          <div className="mt-6">
            <ListaDoRanking series={lista.series} />
          </div>
        </>
      ) : (
        <p className="py-16 text-center text-sm text-fraco">
          O ranking aparece assim que a primeira coleta rodar.
        </p>
      )}
    </main>
  );
}
