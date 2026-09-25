"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";

/* ===========================================================================
   UM LINK QUE VOLTA AO TOPO QUANDO JA SE ESTA NA PAGINA.

   O DEFEITO QUE ELE CONSERTA: no rodape, clicar em "Início" (ou na logo) nao
   fazia nada. Nao era o link errado — era o link CERTO para a pagina em que a
   pessoa ja estava. O Next so rola para o topo quando ha troca de rota; se o
   destino e a rota atual ele descarta a navegacao, e o clique morre em
   silencio. E o rodape e justamente o lugar onde esse clique e mais provavel:
   quem chegou ate la rolou a pagina inteira e quer voltar.

   POR QUE UM COMPONENTE E NAO UM `onClick` EM CADA LUGAR: sao quatro telas com
   link para a home (logo, rodape, barra de abas do celular, menu do
   cabecalho). Quatro copias divergem na primeira mudanca — o mesmo argumento
   que ja mora no `navegacao.ts`.

   ELE NAO SUBSTITUI O `Link` EM TODO CANTO. So vale onde o destino pode ser a
   pagina atual: menu, rodape, abas, logo. Num card de anime o destino nunca e
   a tela de onde se clica, e ali o `Link` normal continua certo — este aqui
   custa um `usePathname`, que puxa o componente para o lado do cliente.
   =========================================================================== */

/** `/radio` e `/radio/` sao a mesma pagina — o site usa `trailingSlash`. */
function mesmaPagina(a: string, b: string): boolean {
  const limpar = (s: string) => (s.length > 1 ? s.replace(/\/+$/, "") : s);
  return limpar(a) === limpar(b);
}

export default function LinkQueSobe({
  href,
  onClick,
  emBreve,
  children,
  className,
  ...resto
}: ComponentProps<typeof Link> & {
  /* ============ O DESTINO EXISTE MAS AINDA NAO ABRE ============
     Pedido dele para o Forum e para a Conexão IA: *"deixa ele lá mas 'bloqueia'
     o click, pode 'riscar' ou colocar um em breve"*.

     MORA AQUI, E NAO EM CADA MENU, porque sao CINCO lugares que desenham o
     mesmo destino — prateleira de cima, prateleira de baixo, barra de abas do
     celular, folha do menu e rodape. Cinco copias da mesma regra divergem na
     primeira mudanca, que e o defeito que este arquivo ja existe para evitar.

     E UM `<span>`, E NAO UM LINK DESABILITADO. Nao existe `disabled` em `<a>`:
     um link com `onClick` cancelado continua no teclado, continua no menu de
     contexto ("abrir em nova aba") e continua sendo anunciado como link pelo
     leitor de tela. Trocar a tag e a unica forma de o destino sumir de verdade
     dos tres caminhos ao mesmo tempo.

     SO O RISCO, SEM O SELO "EM BREVE". A primeira versao tinha os dois, com o
     argumento de que riscado sozinho le como "removido". Ele usou e discordou:
     *"achei que fica muito poluido, principalmente no menu"* — e olhando o
     resultado ele esta certo, porque o Forum aparece em QUATRO lugares e o selo
     se repetia nos quatro, dobrando o tamanho do item em cada um.

     O SENTIDO NAO SE PERDEU PARA QUEM NAO VE O RISCO: `aria-disabled` diz que o
     item nao esta disponivel e o `title` continua dizendo "em breve". O que saiu
     foi o texto redundante na tela, e nao a informacao. */
  emBreve?: boolean;
}) {
  const caminho = usePathname();

  if (emBreve) {
    return (
      <span
        aria-disabled="true"
        title="em breve"
        className={`${className ?? ""} pointer-events-none line-through opacity-45`}
      >
        {children}
      </span>
    );
  }

  function aoClicar(evento: MouseEvent<HTMLAnchorElement>) {
    // O `onClick` de quem usa vem PRIMEIRO: na barra de abas e no menu do
    // cabecalho ele e o que fecha o painel aberto, e fechar continua sendo o
    // certo mesmo quando a rota nao muda.
    onClick?.(evento);
    if (evento.defaultPrevented) return;

    const destino = typeof href === "string" ? href : (href.pathname ?? "");
    if (!mesmaPagina(caminho, destino)) return;

    // So aqui o clique deixa de ser navegacao e vira rolagem: sem isto o Next
    // ainda tentaria trocar de rota para a mesma rota.
    evento.preventDefault();

    const inicio = window.scrollY;
    if (inicio === 0) return;

    // Quem pediu menos animacao no sistema recebe o salto seco. Rolagem longa
    // e suave e um dos gatilhos classicos de enjoo para quem marca essa opcao.
    const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: suave ? "smooth" : "auto" });
    if (!suave) return;

    /* A REDE DE SEGURANCA, e ela existe porque o defeito foi VISTO.
       Conferindo este conserto no site no ar, `behavior: "smooth"` nao rolou
       NADA — nem um pixel — enquanto o mesmo `scrollTo` com `"auto"` levava a
       pagina ao topo na hora. O navegador aceita a chamada, nao reclama, e nao
       faz nada.

       Isso seria o bug de novo, e pior: o clique passaria a "funcionar" so em
       alguns navegadores, o que e mais dificil de relatar do que nao funcionar
       em nenhum. Entao, um quarto de segundo depois, se a pagina nao saiu do
       lugar NENHUM, o salto seco resolve.

       `!==` e nao `>`: se a pessoa rolou junto no meio da animacao, a posicao
       mudou e nao ha o que socorrer — a animacao esta viva e quem manda e
       ela. */
    window.setTimeout(() => {
      if (window.scrollY === inicio) window.scrollTo(0, 0);
    }, 250);
  }

  // `children` e `className` voltam explicitos: os dois foram desestruturados
  // la em cima para o caminho do `emBreve` poder usa-los, entao nao chegam mais
  // aqui dentro do `...resto`.
  return (
    <Link href={href} onClick={aoClicar} className={className} {...resto}>
      {children}
    </Link>
  );
}
