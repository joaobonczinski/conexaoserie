import type { Metadata } from "next";
import Link from "next/link";
import CabecalhoDePagina from "@/components/CabecalhoDePagina";
import { INSTANTE_DO_BUILD } from "@/lib/build";
import { enderecoDaSerie } from "@/lib/enderecos";
import {
  DIAS_CURTOS,
  FUSO_PADRAO,
  dataLocal,
  diaDaSemanaDaData,
  diaEMes,
  formatarHora,
} from "@/lib/horario";
import { metadadosDaPagina } from "@/lib/metadados";
import { NOMES_DAS_PLATAFORMAS } from "@/lib/plataformas";
import { fimDe, proximoLancamento } from "@/lib/proximo";
import { rotuloDeEstreia, rotuloDoLancamento, situacaoDaSerie } from "@/lib/rotulos";
import { carregarSeries } from "@/lib/series";
import type { Lancamento, Serie } from "@/lib/tipos";

/* ===========================================================================
   TODAS AS SERIES, separadas pela plataforma onde passam no Brasil.

   E a porta das paginas de serie: o calendario so mostra sete dias, e a serie
   que volta em novembro nao aparece nele — aqui aparece, com a data. E tambem
   o que liga todas as paginas de serie a um lugar so, que e como o Google acha
   cada uma.

   POR PLATAFORMA, e nao em ordem alfabetica: "o que sai na Netflix" e a
   pergunta de quem assina uma e nao as outras. Dentro de cada uma, o que sai
   antes vem primeiro; o que nao tem data vai para o fim.

   HTML DO BUILD, e por isso o horario e o de Brasilia, escrito na tela — a
   mesma escolha da /estreias/. O fuso de quem olha fica para a pagina da serie.
   =========================================================================== */

export const metadata: Metadata = metadadosDaPagina({
  titulo: "Todas as séries — que horas sai cada uma, por plataforma",
  descricao:
    "As séries da Netflix, Prime Video, Disney+, HBO Max, Apple TV e Paramount+ com o próximo episódio de cada uma, no horário de Brasília.",
  url: "/series/",
});

/** "HBO Max" -> "hbo-max": a ancora de cada plataforma. */
function ancoraDe(plataforma: string): string {
  return plataforma
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type Linha = { serie: Serie; proximo: Lancamento | null };

function agrupar(series: Serie[], agora: number) {
  const grupos = new Map<string, Linha[]>();
  for (const serie of series) {
    const lista = grupos.get(serie.plataforma) ?? [];
    lista.push({ serie, proximo: proximoLancamento(serie.lancamentos, agora) });
    grupos.set(serie.plataforma, lista);
  }
  for (const lista of grupos.values()) {
    lista.sort(
      (a, b) =>
        (a.proximo ? fimDe(a.proximo) : Infinity) - (b.proximo ? fimDe(b.proximo) : Infinity) ||
        a.serie.nome.localeCompare(b.serie.nome, "pt-BR"),
    );
  }
  // A ordem do mapa de plataformas, e nao a do tamanho: a lista nao pode
  // trocar de ordem sozinha porque uma plataforma teve uma semana cheia.
  const ordem = [
    ...NOMES_DAS_PLATAFORMAS,
    ...[...grupos.keys()].filter((p) => !NOMES_DAS_PLATAFORMAS.includes(p)),
  ];
  return ordem
    .filter((p) => grupos.has(p))
    .map((plataforma) => ({ plataforma, linhas: grupos.get(plataforma)! }));
}

export default function PaginaSeries() {
  const agora = INSTANTE_DO_BUILD;
  const series = carregarSeries();
  const grupos = agrupar(series, agora);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-6">
      <CabecalhoDePagina
        etiqueta="Por plataforma"
        titulo="Todas as séries"
        subtitulo={`${series.length} séries em ${grupos.length} plataformas`}
        nota="O próximo episódio de cada uma, no horário de Brasília. Na página da série, o horário no seu fuso e a contagem regressiva."
      />

      <nav aria-label="Plataformas" className="mb-8 flex flex-wrap gap-2">
        {grupos.map(({ plataforma, linhas }) => (
          <a key={plataforma} href={`#${ancoraDe(plataforma)}`} className="chip">
            {plataforma}
            <span className="numero text-[10px] text-fraco">{linhas.length}</span>
          </a>
        ))}
      </nav>

      <div className="flex flex-col gap-10">
        {grupos.map(({ plataforma, linhas }) => (
          <section
            key={plataforma}
            id={ancoraDe(plataforma)}
            aria-labelledby={`titulo-${ancoraDe(plataforma)}`}
            // O cabecalho do site gruda no topo: sem a margem, o salto pela
            // ancora esconderia o titulo da plataforma debaixo dele.
            className="scroll-mt-20"
          >
            <h2
              id={`titulo-${ancoraDe(plataforma)}`}
              className="mb-3 flex items-center gap-2 text-base font-bold text-tinta"
            >
              <span
                aria-hidden
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: linhas[0].serie.cor }}
              />
              {plataforma}
              <span className="numero text-xs font-medium text-fraco">{linhas.length}</span>
            </h2>
            <ol className="flex flex-col gap-2">
              {linhas.map((linha) => (
                <LinhaDaSerie key={linha.serie.id} {...linha} />
              ))}
            </ol>
          </section>
        ))}
      </div>
    </main>
  );
}

function LinhaDaSerie({ serie, proximo }: Linha) {
  const dia = proximo
    ? proximo.airingAt !== null
      ? dataLocal(proximo.airingAt, FUSO_PADRAO)
      : proximo.data
    : null;
  const estreia = proximo ? rotuloDeEstreia(proximo) : null;

  return (
    <li>
      {/* A LINHA INTEIRA E O LINK, e sem prefetch: com cem linhas na tela, o
          prefetch de cada uma que entra na tela baixaria cem paginas que
          ninguem pediu — no celular, no plano de dados de quem rola. */}
      <Link
        href={enderecoDaSerie(serie.slug)}
        prefetch={false}
        className="flex items-center gap-3 rounded-xl border border-linha bg-cartao px-3 py-2.5 transition-colors hover:border-linha-forte"
      >
        {serie.capa ? (
          // eslint-disable-next-line @next/next/no-img-element -- CDN externo em site estatico
          <img
            src={serie.capa}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-16 w-11 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="h-16 w-11 shrink-0 rounded-lg bg-realce" />
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-tinta">{serie.nome}</p>
          {serie.nomeOriginal ? (
            <p className="truncate text-xs text-suave">{serie.nomeOriginal}</p>
          ) : null}
          <p className="numero mt-1 truncate text-[11px] text-fraco">
            {proximo
              ? rotuloDoLancamento(proximo)
              : serie.ultimo
                ? `último: ${rotuloDoLancamento({
                    temporada: serie.ultimo.temporada,
                    episodios: serie.ultimo.numero !== null ? [serie.ultimo.numero] : [],
                  })} · ${diaEMes(serie.ultimo.data)}`
                : (situacaoDaSerie(serie.status) ?? "sem episódio marcado")}
          </p>
        </div>

        <div className="shrink-0 text-right">
          {estreia ? (
            <p className="text-[11px] font-semibold uppercase tracking-wide text-acento">
              {estreia}
            </p>
          ) : null}
          {proximo && dia ? (
            <>
              <p className="numero mt-0.5 text-[11px] text-fraco">
                {DIAS_CURTOS[diaDaSemanaDaData(dia)]} {diaEMes(dia)}
              </p>
              <p className="numero mt-0.5 text-[15px] font-semibold text-tinta">
                {proximo.airingAt !== null ? formatarHora(proximo.airingAt, FUSO_PADRAO) : "—"}
              </p>
            </>
          ) : (
            <p className="text-[11px] text-fraco">
              {serie.status === "Ended" ? "encerrada" : "sem data"}
            </p>
          )}
        </div>
      </Link>
    </li>
  );
}
