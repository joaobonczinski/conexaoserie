import { useCallback, useRef, useState } from "react";

/**
 * A mecanica dos carrosseis do site, num lugar so.
 *
 * POR QUE AGORA E NAO ANTES. Quando os tres primeiros carrosseis nasceram
 * (SeusDeHoje, o calendario do dia e o ranking, todos em 27/08/2026), a decisao
 * registrada foi NAO extrair componente: um componente que servisse aos tres
 * precisaria de seis props e ficaria pior que a duplicacao, porque eles sao
 * deliberadamente diferentes na APARENCIA — setas de tamanhos diferentes, um
 * mede com ResizeObserver, outro reseta a rolagem ao trocar de dia. O que ficou
 * anotado e que valia extrair um dia a MECANICA, num hook. As temporadas sao o
 * quarto uso, e este e o dia.
 *
 * O hook cuida so do que os quatro fazem igual: saber se da para ir para cada
 * lado, e andar 80% da largura visivel. A aparencia continua de cada um.
 *
 * A ROLAGEM E NATIVA (`overflow-x-auto` + scroll-snap no elemento). O hook nao
 * a substitui — no celular o dedo precisa funcionar sem JavaScript nenhum, e
 * teclado e leitor de tela ja sabem lidar com um contêiner rolavel de verdade.
 * As setas sao um conforto por cima disso, nao o mecanismo.
 */
export function useCarrossel<T extends HTMLElement>() {
  const trilho = useRef<T>(null);

  // Comeca em "nao da para voltar, da para avancar" sem MEDIR nada: na rolagem
  // zero isso e verdade por definicao. Assim nao ha `setState` dentro de
  // efeito, que e o que o ESLint do React Compiler proibe neste projeto.
  const [podeVoltar, setPodeVoltar] = useState(false);
  const [podeAvancar, setPodeAvancar] = useState(true);

  const aoRolar = useCallback(() => {
    const el = trilho.current;
    if (!el) return;
    // O "- 1" e por causa de largura fracionaria: `scrollLeft + clientWidth`
    // para meio pixel antes de `scrollWidth`, e a seta ficaria acesa no fim.
    setPodeVoltar(el.scrollLeft > 1);
    setPodeAvancar(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  const rolar = useCallback((direcao: 1 | -1) => {
    const el = trilho.current;
    if (!el) return;
    // 80% e nao 100% de proposito: sobra um card da tela anterior visivel, que
    // e o que diz para a pessoa que ela avancou dentro da MESMA fila em vez de
    // ter trocado de conteudo.
    el.scrollBy({ left: direcao * el.clientWidth * 0.8, behavior: "smooth" });
  }, []);

  return { trilho, podeVoltar, podeAvancar, aoRolar, rolar };
}

/**
 * As classes do trilho, identicas nos carrosseis do site.
 *
 * A barra de rolagem FICA VISIVEL, e isso e decisao do Joao ("eu gosto das
 * barras"): ela e a unica pista de quanto ainda ha para o lado antes de a
 * pessoa tentar. Os tamanhos diferentes do polegar entre um carrossel e outro
 * sao proporcionais ao conteudo e nao da para igualar sem mentir.
 *
 * O `-mx-4 px-4` faz a fila sangrar ate a borda da tela: sem isso o primeiro e
 * o ultimo card ficam com uma faixa morta do lado, e a fila parece cortada
 * antes de acabar.
 */
/**
 * O card dos carrosseis de capa, numa constante so.
 *
 * OS TRES ERAM 164, 164 e 132. O ranking nasceu menor porque mostra so capa,
 * posicao, nota e uma linha de titulo — cabia mais gente na tela. Na pratica o
 * que acontecia era outra coisa: o Joao descia a home vendo cards de 132 e
 * abria uma temporada com cards de 164, e leu isso como "os cards das outras
 * temporadas sao maiores". Nao eram — os do calendario e os das temporadas
 * sempre foram iguais. Era a home que tinha dois tamanhos.
 *
 * Decisao dele em 29/08/2026: "gostaria que os cards da futura, passada e
 * atual com todos do mesmo tamanho". Fica AQUI, e nao repetido em cada
 * componente, porque largura de card que mora em tres arquivos volta a
 * divergir no dia em que alguem mexer em um so.
 *
 * A ALTURA continua diferente entre eles, e isso nao e descuido: o card do
 * calendario carrega quatro linhas de texto e o do ranking uma. O que a pessoa
 * compara de uma fila para outra e a CAPA, e a capa agora e a mesma.
 *
 * Nao vale para o card do SeusDeHoje (280px): aquele e deitado, com capa
 * pequena ao lado do texto, e nao entra nesta comparacao.
 */
export const CARD_CARROSSEL = "w-[168px] shrink-0 snap-start";

/**
 * O DESENHO DA BARRA SAIU DAQUI para a classe `.fita` do globals.css.
 *
 * Ela estava escrita como utilitario arbitrario com a cor CRUA
 * (`[scrollbar-color:rgba(255,255,255,0.2)_transparent]`), e cor crua e
 * exatamente o que o tema nao alcanca: no claro a barra ficava branca sobre
 * papel branco. Na `.fita` ela usa `--p-linha-forte`, que muda com o tema.
 */
export const TRILHO_CARROSSEL =
  "fita -mx-4 scroll-pl-4 px-4 pb-3 focus-visible:outline focus-visible:outline-1 focus-visible:outline-acento";
