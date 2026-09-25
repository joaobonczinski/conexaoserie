// As medidas de layout que DUAS TELAS precisam compartilhar.
//
// Ficam FORA de `carrossel.ts` por arquitetura e nao por gosto: aquele arquivo
// exporta o hook `useCarrossel`, entao importa `react` e so pode ser lido por
// componente de CLIENTE. A pagina de temporada e componente de SERVIDOR e
// precisa destas duas constantes — importa-las de la quebrava o build inteiro
// ("You're importing a module that depends on useRef into a React Server
// Component").

/**
 * AS DUAS MEDIDAS QUE FAZEM O PRIMEIRO CARD NASCER NO MESMO PIXEL na
 * /calendario/ e em qualquer temporada.
 *
 * Pedido do Joao em 29/08/2026, depois de navegar: "quando eu mudar de
 * temporada os cards nao devem mudar de lugar, apenas os animes". O par era
 * home <-> temporada e virou /calendario/ <-> temporada em 05/09/2026, quando o
 * menu de temporadas saiu da home.
 *
 * O QUE A v2 MUDOU AQUI, e vale saber porque parece que sobrou pouca coisa: a
 * PARTE DE CIMA da pilha (titulo, subtitulo, menu, linha de contexto) deixou de
 * depender destas constantes e passou a ser um componente — o
 * `CabecalhoDePagina`. As duas telas usam o mesmo, entao a parte de cima bate
 * POR CONSTRUCAO e nao por aritmetica. O que sobra para as constantes e so o
 * que as duas telas fazem DIFERENTE:
 *
 * - `LINHA_DE_CONTEXTO` e a altura reservada da frase de ressalva. Ela continua
 *   sendo `min-h` porque a frase muda de tela para tela e pode quebrar em duas
 *   linhas numa e em uma noutra.
 * - `CABECALHO_DA_FILA` e o que vem ENTRE aquela frase e os cards: na
 *   /calendario/ e a tira de dias mais a linha do dia, na temporada e so o
 *   titulo da secao. O `justify-end` e a peca central: a sobra fica em CIMA,
 *   virando respiro embaixo do menu, e nunca entre o titulo e os cards — que e
 *   onde um buraco apareceria como defeito.
 *
 * OS 121px SAO MEDIDOS NA /calendario/ EM 05/09/2026, e a conta e esta:
 *
 *   tira de dias           49
 *   margem da tira         20   (`mb-5`)
 *   linha do dia           36   (`min-h-9`)
 *   margem da linha        16   (`mb-4`)
 *   ------------------------------
 *                         121
 *
 * Eram 129 na v1 e o numero envelheceu junto com o desenho: com a tira e a
 * linha do dia novas, os 8px que sobravam apareciam como 8px de deslocamento ao
 * pular de /calendario/ para uma temporada (medido: 337 contra 345).
 *
 * PARA RECONFERIR depois de mexer no calendario, com a pagina JA HIDRATADA (as
 * setas dos carrosseis so aparecem quando a fila nao cabe, e quem decide isso e
 * o JavaScript — foi assim que uma diferenca de 4px passou batido uma vez):
 *
 *   const m = document.querySelector("main").getBoundingClientRect();
 *   const c = document.querySelector("li[data-anime], main section ul.fita > li");
 *   Math.round(c.getBoundingClientRect().top - m.top);   // igual nas duas
 *
 * HA UMA CICATRIZ ATRAS DISTO: eu cheguei a envolver a tira de dias no mesmo
 * `CABECALHO_DA_FILA`, para as duas telas declararem a mesma altura em vez de
 * uma copiar a outra. Aquilo QUEBROU O GRUDE — `position: sticky` so gruda
 * dentro do proprio pai, e o pai virou um bloco de 125px: a tira saia da tela
 * junto com os cards em vez de ficar no topo.
 *
 * Sao `min-h` e nao `h`: numa tela estreita o texto cresce e o bloco tem que
 * crescer junto, senao ele passa por cima dos cards. O alinhamento ao pixel vale
 * onde as duas telas cabem no mesmo tamanho, que e o monitor dele.
 */
export const LINHA_DE_CONTEXTO =
  "mb-5 min-h-[39px] max-w-2xl text-xs leading-relaxed";

export const CABECALHO_DA_FILA = "flex min-h-[121px] flex-col justify-end";
