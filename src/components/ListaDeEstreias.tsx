import Link from "next/link";
import SeloDePlataforma from "./SeloDePlataforma";
import type { Item } from "@/lib/tipos";
import { LINK_QUE_COBRE, enderecoDaSerie } from "@/lib/enderecos";
import { traduzirGenero } from "@/lib/generos";
import {
  DIAS,
  DIAS_CURTOS,
  FUSO_PADRAO,
  dataLocal,
  dataPorExtenso,
  diaDaSemanaDaData,
  diaEMes,
  formatarHora,
} from "@/lib/horario";
import { rotuloDeEstreia, rotuloDoLancamento } from "@/lib/rotulos";

/* ===========================================================================
   AS ESTREIAS, agrupadas por dia — na /estreias/ e, curta, na home.

   COMPONENTE DE SERVIDOR, e por isso o horario e o de BRASILIA, escrito com o
   nome: esta lista e HTML do build, e o build nao sabe de onde a pessoa acessa.
   Um fuso fixo e dito na tela e verdade para todo mundo; um fuso "do
   visitante" calculado no build seria o do servidor, e mentira para todos.

   E a pagina feita para ser achada no Google ("estreias de séries em outubro"),
   e o texto dela precisa estar no HTML — o que tambem pede servidor.
   =========================================================================== */

/** O dia de uma estreia em Brasilia: a data do instante, ou a data do episodio. */
function diaEmBrasilia(item: Item): string {
  const { airingAt, data } = item.lancamento;
  return airingAt !== null ? dataLocal(airingAt, FUSO_PADRAO) : data;
}

export function agruparPorDia(itens: Item[]): { dia: string; itens: Item[] }[] {
  const grupos = new Map<string, Item[]>();
  for (const item of itens) {
    const dia = diaEmBrasilia(item);
    const lista = grupos.get(dia) ?? [];
    lista.push(item);
    grupos.set(dia, lista);
  }
  return [...grupos]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dia, lista]) => ({ dia, itens: lista }));
}

export function LinhaDeEstreia({
  item,
  comDia = false,
}: {
  item: Item;
  /**
   * Mostra o dia acima da hora. A /estreias/ nao precisa — la as linhas vem
   * embaixo do titulo do dia —, mas a home lista estreias de dias diferentes
   * sem titulo nenhum, e "22:00" sozinho nao diz de QUAL dia.
   */
  comDia?: boolean;
}) {
  const { serie, lancamento } = item;
  const generos = serie.generos.slice(0, 2).map(traduzirGenero).join(" · ");
  const dia = diaEmBrasilia(item);

  return (
    <li className="relative flex items-center gap-3 rounded-xl border border-linha bg-cartao px-3 py-2.5 transition-colors hover:border-linha-forte">
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
        <p className="truncate text-sm font-semibold text-tinta">
          <Link href={enderecoDaSerie(serie.slug)} prefetch={false} className={LINK_QUE_COBRE}>
            {serie.nome}
          </Link>
        </p>
        {serie.nomeOriginal ? (
          <p className="truncate text-xs text-suave">{serie.nomeOriginal}</p>
        ) : null}
        <div className="mt-1 flex flex-wrap items-center gap-x-2">
          <p className="numero text-[11px] text-fraco">
            {rotuloDoLancamento(lancamento)}
            {generos ? ` · ${generos}` : ""}
          </p>
          <SeloDePlataforma
            plataforma={serie.plataforma}
            cor={serie.cor}
            link={serie.link}
            espacamento="mt-0"
          />
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-acento">
          {rotuloDeEstreia(lancamento)}
        </p>
        {comDia ? (
          <p className="numero mt-0.5 text-[11px] text-fraco">
            {DIAS_CURTOS[diaDaSemanaDaData(dia)]} {diaEMes(dia)}
          </p>
        ) : null}
        <p className="numero mt-0.5 text-[15px] font-semibold text-tinta">
          {lancamento.airingAt !== null
            ? formatarHora(lancamento.airingAt, FUSO_PADRAO)
            : "—"}
        </p>
      </div>
    </li>
  );
}

export default function ListaDeEstreias({ itens }: { itens: Item[] }) {
  const grupos = agruparPorDia(itens);

  if (grupos.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-fraco">
        Nenhuma estreia anunciada para as próximas semanas.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {grupos.map(({ dia, itens: doDia }) => (
        <section key={dia} aria-labelledby={`dia-${dia}`}>
          <h2 id={`dia-${dia}`} className="mb-3 text-base font-bold text-tinta">
            {DIAS[diaDaSemanaDaData(dia)]}, {dataPorExtenso(dia)}
            <span className="numero ml-2 text-xs font-medium text-fraco">
              {doDia.length}
            </span>
          </h2>
          <ol className="flex flex-col gap-2">
            {doDia.map((item) => (
              <LinhaDeEstreia
                key={`${item.serie.id}-${item.lancamento.temporada}`}
                item={item}
              />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
