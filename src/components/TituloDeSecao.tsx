import Link from "next/link";
import { IconeSetaDireita } from "./Icones";

/**
 * O CABECALHO DE UMA SECAO — titulo, uma linha de explicacao e o "ver tudo".
 *
 * Existe porque SEIS blocos desenhavam isso a mao (o ranking da home, a
 * comunidade, as novidades, os proximos, os fillers e o carrossel de
 * temporada), cada um com o seu tamanho de titulo e a sua versao do link. Eles
 * divergiram: um dizia "ver tudo", outro "ver todas", e o tamanho do titulo
 * variava entre `text-lg` e `text-xl` na MESMA pagina.
 *
 * A ETIQUETA ACIMA DO TITULO e a novidade da v2, e ela faz um trabalho de
 * verdade: ela diz de que TIPO e o bloco ("no ar", "da turma", "do site"). Numa
 * home com cinco secoes empilhadas, e ela que permite varrer a pagina de
 * relance em vez de ler cinco titulos.
 */
export default function TituloDeSecao({
  etiqueta,
  titulo,
  descricao,
  href,
  rotuloDoLink = "ver tudo",
}: {
  etiqueta?: string;
  titulo: string;
  descricao?: string;
  /** Ausente quando a secao nao tem uma pagina propria para onde levar. */
  href?: string;
  rotuloDoLink?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div className="min-w-0">
        {etiqueta ? <p className="etiqueta mb-1.5">{etiqueta}</p> : null}
        <h2 className="text-xl font-bold tracking-tight text-tinta sm:text-2xl">
          {titulo}
        </h2>
        {descricao ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-suave">
            {descricao}
          </p>
        ) : null}
      </div>

      {href ? (
        // `shrink-0` porque o titulo pode ser longo e o link nunca deve quebrar
        // em duas linhas — ele e um alvo de clique, e alvo quebrado e alvo
        // menor. `group` para a seta andar junto com o texto no hover.
        <Link
          href={href}
          className="group flex shrink-0 items-center gap-1 text-sm font-medium text-suave transition-colors hover:text-acento"
        >
          {rotuloDoLink}
          <IconeSetaDireita className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : null}
    </div>
  );
}
