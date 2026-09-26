import {
  IconeCalendario,
  IconeCasa,
  IconeCoracao,
  IconeEpisodios,
  IconeNovidades,
  IconeTemporadas,
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
  | "series"
  | "estreias"
  | "ranking"
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
  // Colada no calendario: e a mesma pergunta ("que horas sai"), feita por
  // serie em vez de por dia — e a pagina de cada serie mora aqui dentro.
  { id: "series", rotulo: "Séries", href: "/series/" },
  { id: "estreias", rotulo: "Estreias", href: "/estreias/" },
  { id: "ranking", rotulo: "Ranking", href: "/ranking/" },
  { id: "novidades", rotulo: "Novidades", href: "/novidades/" },
  // POR ULTIMO, como no anime: e a pagina que menos gente procura, e primeiro
  // lugar no menu daria a ela um peso que ela nao deve ter.
  { id: "apoiar", rotulo: "Apoiar", href: "/apoiar/", emBreve: APOIAR_EM_BREVE },
];

/**
 * A que secao um caminho pertence. A home e comparada por igualdade e o resto
 * por prefixo: `/` casaria com qualquer `startsWith`.
 */
export function secaoAtiva(caminho: string): IdDeSecao | null {
  if (caminho === "/") return "inicio";
  return SECOES.find((s) => s.id !== "inicio" && caminho.startsWith(s.href))?.id ?? null;
}

/**
 * AS ABAS DO CELULAR — cinco, e a quinta abre a folha com o resto.
 *
 * Cinco e o teto: a 320px de tela, seis abas com rotulo legivel nao cabem. Os
 * quatro destinos sao os que respondem as perguntas que trazem alguem ao site —
 * o que sai hoje, a semana, o que estreia e o que vale a pena.
 */
export const ABAS_DO_CELULAR: Destino[] = [
  { href: "/", rotulo: "Início", Icone: IconeCasa },
  { href: "/calendario/", rotulo: "Calendário", Icone: IconeCalendario },
  { href: "/estreias/", rotulo: "Estreias", Icone: IconeTemporadas },
  { href: "/ranking/", rotulo: "Ranking", Icone: IconeTrofeu },
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
      { href: "/series/", rotulo: "Todas as séries", Icone: IconeEpisodios },
      { href: "/estreias/", rotulo: "Estreias", Icone: IconeTemporadas },
      { href: "/ranking/", rotulo: "Ranking", Icone: IconeTrofeu },
    ],
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
    itens: ["/calendario/", "/series/", "/estreias/", "/ranking/"].map(destinoPorHref),
  },
  {
    titulo: "O site",
    itens: ["/", "/novidades/", "/apoiar/"].map(destinoPorHref),
  },
];
