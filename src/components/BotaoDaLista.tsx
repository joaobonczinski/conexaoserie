"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { IconeMais, IconeVisto } from "./Icones";
import {
  abrirEdicao,
  adicionar,
  enderecoDeEntrar,
  itemDaSerie,
  rotuloDaSituacao,
  useMinhaLista,
} from "@/lib/minha-lista";

/* ===========================================================================
   O BOTAO "+ MINHA LISTA" — na linha dos proximos e do ranking, na pagina de
   cada serie e, desde 03/10/2026, na capa dos cards da home. Veio do Conexão
   Filme, com as decisoes de la:

   Um toque adiciona como "Quero ver" E JA ABRE O DIALOGO, para mudar a
   situacao, dar nota ou anotar na hora (pedido do Joao no Filme: "quando eu
   clico no + ... nao abre a janela para editar"). Fechar sem mexer deixa a
   serie em "Quero ver"; o toque errado se desfaz ali mesmo, no "Remover da
   lista". Com a serie na lista, o botao vira um visto na cor do site, e o
   toque reabre o dialogo.

   SEM CONTA, o botao leva para a /entrar/ e volta para esta mesma pagina
   depois do login: a pessoa estava a um toque de guardar uma serie.

   ENQUANTO A CONTA CARREGA, e onde nao ha servidor de conta (o atalho da area
   de trabalho), o botao nao aparece: um "+" que nao faz nada e pior que
   nenhum. Na LINHA o espaco dele fica reservado mesmo assim, senao a coluna da
   contagem pularia para o lado quando a conta chegasse.
   =========================================================================== */

export default function BotaoDaLista({
  tvmazeId,
  titulo,
  variante,
}: {
  tvmazeId: number;
  titulo: string;
  /**
   * `linha`: ocupa o fim da linha. `pagina`: o botao com texto da pagina da
   * serie. `card`: o adesivo sobre a capa; quem o posiciona e o card.
   */
  variante: "linha" | "pagina" | "card";
}) {
  const conta = useMinhaLista();
  const caminho = usePathname();
  const [salvando, setSalvando] = useState(false);
  const [falhou, setFalhou] = useState(false);

  // No CARD a reserva tambem conta: os selos de estreia moram embaixo do botao,
  // e subiriam 32px quando a conta chegasse.
  const reserva =
    variante === "linha" ? (
      <span className="h-9 w-9 shrink-0" aria-hidden />
    ) : variante === "card" ? (
      <span className="h-7 w-7" aria-hidden />
    ) : null;
  if (conta.fase === "carregando" || conta.fase === "indisponivel") return reserva;

  const item = conta.fase === "pronto" ? itemDaSerie(conta, tvmazeId) : undefined;

  async function tocar() {
    if (conta.fase === "deslogado") {
      window.location.assign(enderecoDeEntrar(caminho));
      return;
    }
    if (item) {
      abrirEdicao(tvmazeId);
      return;
    }
    setSalvando(true);
    setFalhou(false);
    try {
      await adicionar(tvmazeId);
      abrirEdicao(tvmazeId);
    } catch {
      setFalhou(true);
    } finally {
      setSalvando(false);
    }
  }

  const rotulo = item
    ? `${titulo}: na sua lista como "${rotuloDaSituacao(item.status)}". Editar`
    : falhou
      ? `Não deu para adicionar ${titulo}. Tentar de novo`
      : `Adicionar ${titulo} à Minha lista`;

  // NA PAGINA DA SERIE o botao diz o que faz com palavras: e o lugar em que a
  // pessoa esta olhando para UMA serie, e um "+" solto ali pareceria enfeite.
  if (variante === "pagina") {
    return (
      <button
        type="button"
        onClick={tocar}
        disabled={salvando}
        aria-label={rotulo}
        className={`botao ${item ? "botao-cheio" : "botao-vazio"} disabled:opacity-60`}
      >
        {item ? <IconeVisto className="h-4 w-4" /> : <IconeMais className="h-4 w-4" />}
        {item
          ? rotuloDaSituacao(item.status)
          : falhou
            ? "Tentar de novo"
            : "Minha lista"}
      </button>
    );
  }

  // NA CAPA DO CARD, o tamanho e o lugar da estrela do Conexão Anime: um
  // adesivo de 28px na quina, o mesmo em todos os cards, para tocar sem
  // procurar. O `before` estica a area de toque para 40px sem engordar o
  // desenho — 28px e pouco para o dedo.
  //
  // A cor de erro vai por `style`: o `.adesivo` fica fora das camadas do
  // Tailwind e venceria um `text-*` (a armadilha do AGENTS.md).
  if (variante === "card") {
    return (
      <button
        type="button"
        onClick={tocar}
        disabled={salvando}
        aria-label={rotulo}
        title={rotulo}
        style={falhou && !item ? { color: "var(--color-arte-erro)" } : undefined}
        className={`relative z-10 grid h-7 w-7 place-items-center rounded-lg transition-transform before:absolute before:-inset-1.5 before:content-[''] hover:scale-110 disabled:opacity-60 ${
          item ? "bg-acento text-sobre-acento shadow-sm" : "adesivo"
        }`}
      >
        {item ? <IconeVisto className="h-4 w-4" /> : <IconeMais className="h-4 w-4" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={tocar}
      disabled={salvando}
      aria-label={rotulo}
      title={rotulo}
      // `relative z-10`: a linha e um link por inteiro (ver `LINK_QUE_COBRE`),
      // e sem isto a area do link cobriria o botao.
      className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border shadow-sm transition-colors disabled:opacity-60 ${
        item
          ? "border-transparent bg-acento text-sobre-acento"
          : falhou
            ? "border-linha-forte bg-[var(--p-vidro)] text-erro backdrop-blur"
            : "border-linha-forte bg-[var(--p-vidro)] text-tinta backdrop-blur hover:bg-realce"
      }`}
    >
      {item ? <IconeVisto className="h-4 w-4" /> : <IconeMais className="h-4 w-4" />}
    </button>
  );
}
