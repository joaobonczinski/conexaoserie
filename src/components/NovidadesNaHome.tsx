import Link from "next/link";
import TituloDeSecao from "./TituloDeSecao";
import { carregarNovidades, formatarData } from "@/lib/novidades";

/**
 * As ultimas Novidades, na home. Roda no build, como componente de servidor: o
 * texto entra no HTML estatico, e a home e a pagina que o Google visita primeiro.
 *
 * SE NAO HA ARTIGO PUBLICADO, ESTE BLOCO NAO EXISTE — a mesma regra do Discord e
 * do Apoiar no marca.ts.
 */
const QUANTOS = 3;

export default function NovidadesNaHome() {
  const novidades = carregarNovidades().slice(0, QUANTOS);
  if (novidades.length === 0) return null;

  return (
    <section className="mt-16">
      <TituloDeSecao
        etiqueta="Do site"
        titulo="Novidades"
        href="/novidades/"
        rotuloDoLink="ver todas"
      />

      {/* `grid-cols-1` pelo mesmo motivo do EstreiasNaHome: coluna automatica
          cresce ate o conteudo e vaza da tela do celular. */}
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {novidades.map((n) => (
          <li
            key={n.slug}
            className="painel overflow-hidden transition-colors hover:border-linha-forte"
          >
            <article className="flex items-start gap-3 p-3">
              {n.capa ? (
                // Quadrada e de tamanho fixo: capa de artigo e poster com texto
                // dentro, e qualquer corte apaga informacao.
                // eslint-disable-next-line @next/next/no-img-element -- capa do artigo, em /public
                <img
                  src={n.capa}
                  alt=""
                  loading="lazy"
                  className="aspect-square w-24 flex-none rounded-lg object-cover"
                />
              ) : null}
              <div className="min-w-0">
                <h3 className="break-words text-[15px] font-semibold leading-snug text-tinta">
                  {/* O link envolve so o titulo: bloco inteiro clicavel impede
                      selecionar o resumo. */}
                  <Link
                    href={`/novidades/${n.slug}/`}
                    className="transition-colors hover:text-acento"
                  >
                    {n.titulo}
                  </Link>
                </h3>
                <p className="numero mt-1 text-[11px] text-fraco">{formatarData(n.data)}</p>
                {n.resumo ? (
                  <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-suave">
                    {n.resumo}
                  </p>
                ) : null}
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
