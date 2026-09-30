import Link from "next/link";
import SeloDePlataforma from "./SeloDePlataforma";
import type { Item } from "@/lib/tipos";
import { LINK_QUE_COBRE, enderecoDaSerie } from "@/lib/enderecos";
import { traduzirGenero } from "@/lib/generos";
import {
  DIAS_CURTOS,
  FUSO_PADRAO,
  dataLocal,
  diaDaSemanaDaData,
  diaEMes,
  formatarHora,
} from "@/lib/horario";
import { rotuloDeEstreia, rotuloDoLancamento } from "@/lib/rotulos";

/* ===========================================================================
   A LINHA DE UMA ESTREIA — nas "Próximas estreias" da home.

   Ate 29/09/2026 havia tambem a /estreias/, com as linhas agrupadas por dia;
   ela virou o filtro "Estreias" da /proximos/, e so a linha ficou.

   COMPONENTE DE SERVIDOR, e por isso o horario e o de BRASILIA, escrito com o
   nome: esta lista e HTML do build, e o build nao sabe de onde a pessoa acessa.
   Um fuso fixo e dito na tela e verdade para todo mundo; um fuso "do
   visitante" calculado no build seria o do servidor, e mentira para todos.
   =========================================================================== */

/** O dia de uma estreia em Brasilia: a data do instante, ou a data do episodio. */
function diaEmBrasilia(item: Item): string {
  const { airingAt, data } = item.lancamento;
  return airingAt !== null ? dataLocal(airingAt, FUSO_PADRAO) : data;
}

export function LinhaDeEstreia({
  item,
  comDia = false,
}: {
  item: Item;
  /**
   * Mostra o dia acima da hora: a home lista estreias de dias diferentes sem
   * titulo nenhum, e "22:00" sozinho nao diz de QUAL dia. (A /estreias/, que
   * agrupava por dia e nao precisava, saiu em 29/09/2026.)
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
