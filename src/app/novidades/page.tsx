import type { Metadata } from "next";
import Link from "next/link";
import CabecalhoDePagina from "@/components/CabecalhoDePagina";
import { carregarNovidades, formatarData } from "@/lib/novidades";
import { metadadosDaPagina } from "@/lib/metadados";

// "Novidades", e nao "Noticias", pelo motivo do anime: "Noticias" promete
// cadencia diaria, e com um ou dois textos por mes a secao leria como
// abandonada.

export const metadata: Metadata = metadadosDaPagina({
  titulo: "Novidades — guias e o que vem por aí",
  descricao:
    "Guias do que estreia, o que vale a pena e o que vem por aí nas séries. Escrito por quem mantém o site.",
  url: "/novidades/",
});

export default function Novidades() {
  const novidades = carregarNovidades();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-20 pt-6">
      <CabecalhoDePagina
        etiqueta="Do site"
        titulo="Novidades"
        subtitulo="Guias de estreias e o que vem por aí."
      />

      {novidades.length === 0 ? (
        <p className="py-20 text-center text-sm text-fraco">Nada publicado ainda.</p>
      ) : (
        <ul className="divide-y divide-linha border-t border-linha">
          {novidades.map((n) => (
            <li key={n.slug} className="py-6">
              <article className="flex items-start gap-4">
                {n.capa ? (
                  <Link
                    href={`/novidades/${n.slug}/`}
                    className="block flex-none"
                    // A imagem repete o link do titulo: fora do teclado e do
                    // leitor de tela, que so precisam de um caminho.
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- capa do artigo, em /public */}
                    <img
                      src={n.capa}
                      alt=""
                      loading="lazy"
                      className="aspect-square w-28 rounded-xl object-cover sm:w-40"
                    />
                  </Link>
                ) : null}

                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold leading-snug text-tinta">
                    <Link
                      href={`/novidades/${n.slug}/`}
                      className="transition-colors hover:text-acento"
                    >
                      {n.titulo}
                    </Link>
                  </h2>
                  <p className="numero mt-1 text-xs text-fraco">
                    <time dateTime={n.data}>{formatarData(n.data)}</time>
                    {n.autor ? <span> · por {n.autor}</span> : null}
                  </p>
                  {n.resumo ? (
                    <p className="mt-2 text-sm leading-relaxed text-suave">{n.resumo}</p>
                  ) : null}
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
