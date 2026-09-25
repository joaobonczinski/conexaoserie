import type { Metadata } from "next";
import Link from "next/link";
import { MARCA, SITE_URL } from "@/lib/marca";
import { metadadosDaPagina } from "@/lib/metadados";
import { IconeSetaEsquerda } from "@/components/Icones";
import { buscarNovidade, carregarNovidades, formatarData } from "@/lib/novidades";

type Props = { params: Promise<{ slug: string }> };

/**
 * Endereco usado quando nao ha NENHUM artigo publicado.
 *
 * Com `output: "export"` e a lista de parametros vazia, o Next recusa a rota
 * inteira ("missing generateStaticParams") e o build falha. Sem esta reserva,
 * o site nascer sem artigo nenhum — que e o estado de hoje — derrubaria o build.
 */
const RESERVA = "em-breve";

export function generateStaticParams() {
  const publicados = carregarNovidades().map((n) => ({ slug: n.slug }));
  return publicados.length > 0 ? publicados : [{ slug: RESERVA }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const novidade = buscarNovidade(slug);
  // A reserva nao e conteudo: fica fora do indice.
  if (!novidade) return { title: "Novidades", robots: { index: false, follow: false } };

  return metadadosDaPagina({
    titulo: novidade.titulo,
    descricao: novidade.resumo,
    url: `/novidades/${slug}/`,
    imagem: novidade.capa ?? null,
    artigo: {
      publicadoEm: novidade.data,
      atualizadoEm: novidade.atualizado ?? undefined,
    },
  });
}

export default async function Artigo({ params }: Props) {
  const { slug } = await params;
  const novidade = buscarNovidade(slug);

  // `notFound()` nao serve aqui: no `output: "export"` ele acontece no build e
  // derruba a geracao. Esta e a pagina de reserva — nada linka para ela.
  if (!novidade) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-20 text-center">
        <p className="text-sm text-fraco">Nada publicado ainda.</p>
        <Link href="/novidades/" className="botao botao-vazio mt-4">
          Ver as novidades
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-20 pt-6">
      {/* Dados estruturados: e o que permite ao Google entender que isto e um
          artigo com data e autor. Montado a partir do frontmatter, nunca de
          entrada de visitante. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: novidade.titulo,
            description: novidade.resumo,
            datePublished: novidade.data,
            dateModified: novidade.atualizado ?? novidade.data,
            author: { "@type": "Person", name: novidade.autor },
            publisher: { "@type": "Organization", name: MARCA },
            mainEntityOfPage: `${SITE_URL}/novidades/${slug}/`,
            ...(novidade.capa ? { image: `${SITE_URL}${novidade.capa}` } : {}),
          }),
        }}
      />

      <Link
        href="/novidades/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-suave transition-colors hover:text-acento"
      >
        <IconeSetaEsquerda className="h-3.5 w-3.5" />
        Novidades
      </Link>

      <article className="mt-5">
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-tinta">
          {novidade.titulo}
        </h1>

        <p className="numero mt-3 text-xs text-fraco">
          <time dateTime={novidade.data}>{formatarData(novidade.data)}</time>
          {novidade.autor ? ` · por ${novidade.autor}` : ""}
          {novidade.atualizado ? (
            <>
              {" · atualizado em "}
              <time dateTime={novidade.atualizado}>
                {formatarData(novidade.atualizado)}
              </time>
            </>
          ) : null}
        </p>

        {/* O markdown e escrito pelo dono do site e vive no repositorio. Se um
            dia passar texto de visitante por aqui, precisa de sanitizacao. */}
        <div
          className="artigo mt-8"
          dangerouslySetInnerHTML={{ __html: novidade.html }}
        />
      </article>
    </main>
  );
}
