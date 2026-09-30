import {
  IconeCalendario,
  IconeCasa,
  IconeCoracao,
  IconeLista,
  IconeNovidades,
  IconeRelogio,
  IconeTrofeu,
} from "@/components/Icones";
import { APOIO } from "./marca";

/**
 * O Apoiar fica RISCADO ("em breve") enquanto nao ha forma de apoio nenhuma no
 * marca.ts — o recurso do anime para tela que vai existir mas ainda nao abre.
 * Um menu levando a uma pagina sem ter onde clicar ensinaria que o site promete
 * e nao entrega.
 */
export const APOIAR_EM_BREVE = APOIO.livepix === null && APOIO.paypal === null;

/* ===========================================================================
   O MAPA DA NAVEGACAO — num lugar so.

   Quatro pecas leem daqui: o cabecalho, a barra de abas do celular, a folha do
   menu e o rodape. E a licao do Conexão Anime: enquanto a lista de links viveu
   escrita a mao em cada peca, elas divergiram.

   UMA PRATELEIRA SO, e nao as duas do anime. La a segunda existe porque o site
   cresceu para doze telas; aqui sao sete, e cabem numa linha. No dia em que
   aparecer uma tela de uso ocasional, e la que ela entra — e a prateleira de
   baixo volta junto.

   O MENU E O DO ANIME E DO FILME desde 29/09/2026 (pedido do Joao): Proximos
   entrou no lugar de "Series" e "Estreias", que viraram filtros dele, e a
   Minha lista chegou com a conta.
   =========================================================================== */

export type Destino = {
  href: string;
  rotulo: string;
  Icone: (p: { className?: string }) => React.ReactElement;
  emBreve?: boolean;
};

export type IdDeSecao =
  | "inicio"
  | "calendario"
  | "proximos"
  | "ranking"
  | "minha-lista"
  | "novidades"
  | "apoiar";

export const SECOES: {
  id: IdDeSecao;
  rotulo: string;
  href: string;
  emBreve?: boolean;
}[] = [
  { id: "inicio", rotulo: "Início", href: "/" },
  { id: "calendario", rotulo: "Calendário", href: "/calendario/" },
  { id: "proximos", rotulo: "Próximos", href: "/proximos/" },
  { id: "ranking", rotulo: "Ranking", href: "/ranking/" },
  // A lista de cada um. A pagina diz "entre" para quem nao entrou, entao o
  // link aparece para todos: e ele que conta que a lista existe.
  { id: "minha-lista", rotulo: "Minha lista", href: "/minha-lista/" },
  { id: "novidades", rotulo: "Novidades", href: "/novidades/" },
  // POR ULTIMO, como no anime: e a pagina que menos gente procura, e primeiro
  // lugar no menu daria a ela um peso que ela nao deve ter.
  { id: "apoiar", rotulo: "Apoiar", href: "/apoiar/", emBreve: APOIAR_EM_BREVE },
];

/**
 * A que secao um caminho pertence. A home e comparada por igualdade e o resto
 * por prefixo: `/` casaria com qualquer `startsWith`.
 *
 * A PAGINA DE UMA SERIE (/series/lanternas/) E DOS PROXIMOS: e de la que se
 * chega nela, e e para la que o "voltar" dela aponta.
 */
export function secaoAtiva(caminho: string): IdDeSecao | null {
  if (caminho === "/") return "inicio";
  if (caminho.startsWith("/series/")) return "proximos";
  return SECOES.find((s) => s.id !== "inicio" && caminho.startsWith(s.href))?.id ?? null;
}

/**
 * AS ABAS DO CELULAR — cinco, e a quinta abre a folha com o resto.
 *
 * Cinco e o teto: a 320px de tela, seis abas com rotulo legivel nao cabem. As
 * quatro sao as do Conexão Filme: o que sai hoje (a home e o calendario), o
 * que vem por ai, o que vale a pena e a lista de cada um. O Calendario fica na
 * folha: a home ja abre nele.
 */
export const ABAS_DO_CELULAR: Destino[] = [
  { href: "/", rotulo: "Início", Icone: IconeCasa },
  { href: "/proximos/", rotulo: "Próximos", Icone: IconeRelogio },
  { href: "/ranking/", rotulo: "Ranking", Icone: IconeTrofeu },
  { href: "/minha-lista/", rotulo: "Minha lista", Icone: IconeLista },
];

/**
 * O que a folha do menu mostra, agrupado. TODOS os destinos do site estao aqui,
 * inclusive os que ja tem aba: um mapa com buracos e pior que nao ter mapa.
 */
export const GRUPOS_DO_MENU: { titulo: string; itens: Destino[] }[] = [
  {
    titulo: "Séries",
    itens: [
      { href: "/", rotulo: "Início", Icone: IconeCasa },
      { href: "/calendario/", rotulo: "Calendário", Icone: IconeCalendario },
      { href: "/proximos/", rotulo: "Próximos", Icone: IconeRelogio },
      { href: "/ranking/", rotulo: "Ranking", Icone: IconeTrofeu },
    ],
  },
  {
    titulo: "Você",
    itens: [{ href: "/minha-lista/", rotulo: "Minha lista", Icone: IconeLista }],
  },
  {
    titulo: "O site",
    itens: [
      { href: "/novidades/", rotulo: "Novidades", Icone: IconeNovidades },
      {
        href: "/apoiar/",
        rotulo: "Apoiar",
        Icone: IconeCoracao,
        emBreve: APOIAR_EM_BREVE,
      },
    ],
  },
];

/**
 * O rodape guarda so o ENDERECO, e busca rotulo e icone no menu. Se uma tela
 * sair do menu, o build quebra — de proposito: erro em build e barulhento; link
 * errado no rodape e silencioso.
 */
function destinoPorHref(href: string): Destino {
  const achado = GRUPOS_DO_MENU.flatMap((g) => g.itens).find(
    (d) => d.href === href,
  );
  if (!achado) {
    throw new Error(
      `navegacao: o rodape aponta para "${href}", que nao esta mais no menu. ` +
        `Corrija o endereco nos dois lugares, ou tire a linha do rodape.`,
    );
  }
  return achado;
}

export const GRUPOS_DO_RODAPE: { titulo: string; itens: Destino[] }[] = [
  {
    titulo: "Séries",
    itens: ["/calendario/", "/proximos/", "/ranking/"].map(destinoPorHref),
  },
  {
    titulo: "O site",
    itens: ["/", "/minha-lista/", "/novidades/", "/apoiar/"].map(destinoPorHref),
  },
];
