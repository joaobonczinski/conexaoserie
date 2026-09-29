import Link from "next/link";
import type { SerieDoRanking } from "@/lib/ranking";
import { notaEmTexto } from "@/lib/rotulos";

/* ===========================================================================
   A LISTA DO RANKING DE TODOS OS TEMPOS — a linha do Conexão Filme, que veio
   do Conexão Anime, com os porques que o Joao ja pagou la:

   - O PODIO: os tres primeiros ganham medalha e nota maior. Um top 100 em que
     a linha 1 e igual a 74 nao esta ranqueando, so numerando.
   - O `px-2` vale para AS CEM linhas. No anime ele era so do podio, e as tres
     primeiras nasciam 8px para dentro ("esta torto").
   - A NOTA TEM LARGURA FIXA E TEXTO CENTRADO, senao a nota maior do podio
     empurra a propria coluna.

   O QUE MUDA AQUI: o clique leva a PAGINA DA SERIE NO SITE quando ela existe
   (a serie esta na agenda e passa numa plataforma daqui) e a ficha do TVmaze
   quando nao — Breaking Bad acabou em 2013 e nao tem "que horas sai", mas tem
   onde ler sobre ela.
   =========================================================================== */

function medalha(posicao: number): string | null {
  if (posicao === 1) return "medalha-ouro";
  if (posicao === 2) return "medalha-prata";
  if (posicao === 3) return "medalha-bronze";
  return null;
}

export default function ListaDoRanking({ series }: { series: SerieDoRanking[] }) {
  return (
    <ol className="divide-y divide-linha border-y border-linha">
      {series.map((s, i) => {
        const posicao = i + 1;
        const classeDaMedalha = medalha(posicao);
        const classe =
          "flex items-center gap-3 px-2 py-2.5 transition-colors hover:bg-realce/60";
        const conteudo = (
          <>
            <span
              className={`numero shrink-0 text-center text-sm ${
                classeDaMedalha
                  ? `grid h-7 w-7 place-items-center rounded-lg font-bold ${classeDaMedalha}`
                  : "w-7 font-medium text-fraco"
              }`}
            >
              {posicao}
            </span>
            {s.capa ? (
              // eslint-disable-next-line @next/next/no-img-element -- CDN externo em site estatico
              <img
                src={s.capa}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-14 w-10 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div className="h-14 w-10 shrink-0 rounded-lg bg-realce" />
            )}
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium leading-snug text-tinta">{s.nome}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-fraco">
                <span className="numero">{s.ano ?? "sem ano"}</span>
                {s.nomeOriginal ? ` · ${s.nomeOriginal}` : ""}
                {s.plataforma ? (
                  <>
                    {" · "}
                    <span
                      aria-hidden
                      className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle"
                      style={{ backgroundColor: s.cor ?? undefined }}
                    />
                    {s.plataforma}
                  </>
                ) : null}
              </p>
            </div>
            <span
              className={`numero w-12 shrink-0 text-center font-semibold text-tinta ${
                classeDaMedalha ? "text-base" : "text-sm"
              }`}
            >
              {notaEmTexto(s.nota)}
            </span>
          </>
        );

        return (
          <li key={s.id}>
            {s.pagina ? (
              // Sem prefetch: cem linhas na tela baixariam cem paginas (ver o
              // AGENTS.md).
              <Link href={s.pagina} prefetch={false} className={classe}>
                {conteudo}
              </Link>
            ) : (
              <a href={s.tvmazeUrl} target="_blank" rel="noopener noreferrer" className={classe}>
                {conteudo}
              </a>
            )}
          </li>
        );
      })}
    </ol>
  );
}
