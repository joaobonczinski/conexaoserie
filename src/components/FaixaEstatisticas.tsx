"use client";

import { useMemo } from "react";
import type { ItemDaLista, Status } from "@/lib/minha-lista";

/* ===========================================================================
   "VOCE JA TERMINOU" — a faixa de resumo do topo da Minha lista.

   A do Conexão Filme, que veio do Anime (pedida pelo Joao em 28/09/2026 com
   um print de la): UMA LINHA, com o numero grande deitado ao lado do rotulo.
   Entrou aqui em 03/10/2026, no pedido de ligar a lista ao resto do site.

   O QUE MUDA POR SER SERIE: o Filme soma as horas dos filmes vistos, e aqui
   isso seria inventar. A lista nao marca episodio, e "Terminei" pode ser a
   serie inteira ou so a temporada que a pessoa acompanhava — um Grey's
   Anatomy terminado viraria centenas de horas que ninguem sabe se foram
   vistas. O numero grande e o de series terminadas, que e o que a lista sabe
   de verdade; o resto da linha conta as outras situacoes e a nota media, como
   no Anime e no Filme.
   =========================================================================== */

const numero = (n: number) => n.toLocaleString("pt-BR");

export default function FaixaEstatisticas({ itens }: { itens: ItemDaLista[] }) {
  const stats = useMemo(() => {
    const quantas = (s: Status) => itens.filter((i) => i.status === s).length;
    const notas = itens.map((i) => i.nota).filter((n): n is number => n != null);
    const media = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null;
    return {
      terminei: quantas("terminei"),
      assistindo: quantas("assistindo"),
      queroVer: quantas("quero_ver"),
      abandonei: quantas("abandonei"),
      media,
    };
  }, [itens]);

  // As outras situacoes so entram quando tem alguma: "0 abandonadas" e ruido.
  const detalhes = [
    stats.assistindo > 0 ? `${numero(stats.assistindo)} assistindo` : null,
    stats.queroVer > 0 ? `${numero(stats.queroVer)} para ver` : null,
    stats.abandonei > 0
      ? `${numero(stats.abandonei)} ${stats.abandonei === 1 ? "abandonada" : "abandonadas"}`
      : null,
    stats.media !== null
      ? `nota média ${stats.media.toLocaleString("pt-BR", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })}`
      : null,
  ].filter((d): d is string => d !== null);

  return (
    <section aria-label="Resumo da sua lista" className="mb-8">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl border border-linha bg-realce px-4 py-3">
        <p className="text-sm text-suave">Você já terminou</p>
        {/* SEM a classe `numero`, como no Filme: ela troca para a fonte mono, e
            o numero grande parecia maquina de escrever. */}
        <p className="text-2xl font-semibold tracking-tight text-tinta">
          {numero(stats.terminei)} {stats.terminei === 1 ? "série" : "séries"}
        </p>
        {detalhes.length > 0 ? (
          <p className="text-xs text-fraco">{detalhes.join(" · ")}</p>
        ) : null}
      </div>
    </section>
  );
}
