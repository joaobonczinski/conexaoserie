/**
 * A cor dominante da capa de cada anime — o campo `cor` que a AniList entrega
 * junto com a imagem e que o site passou a usar em 04/09/2026.
 *
 * MORA NUMA LIB E NAO DENTRO DE UM CARD porque QUATRO telas desenham card de
 * capa (calendario, ranking, temporadas arquivadas e comunidade) e as quatro
 * precisam concordar sobre o que fazer quando a cor falta. Uma constante
 * copiada em quatro lugares e o mesmo defeito do `provedores` que derrubou a
 * /conta/: ninguem ve a divergencia ate alguem clicar.
 */

/**
 * O `style` que um card poe na raiz para publicar a sua cor ao CSS.
 *
 * Existe como funcao, e nao como objeto escrito na mao em cada card, pelo
 * motivo do cabecalho: quatro telas montando o MESMO objeto a mao divergem no
 * dia em que uma delas ganhar um campo.
 *
 * SEM COR, NAO ESCREVE NADA — e essa ausencia e que faz a reserva funcionar.
 * O `.card` no `globals.css` ja declara `--cor: var(--p-acento)`, entao um card
 * que nao publica a propria cor herda o acento do tema sozinho. Sao 7 dos 117
 * no ar (medido em 04/09/2026): continuam tendo fio e brilho, so nao os tem na
 * cor propria. "As vezes tem, as vezes nao" seria pior que nao ter — a grade
 * ficaria com buracos sem explicacao.
 *
 * ATE 07/09/2026 ISSO ERA UM HEX ESCRITO AQUI (`#38bdf8`), e ele atropelava o
 * padrao do CSS em vez de usa-lo. Era o `sky-400` da marca ANTERIOR: sobreviveu
 * ao redesenho que trocou o acento para coral, e o comentario que o justificava
 * ("o sky e o acento que o site ja usa em todo lugar") tinha deixado de ser
 * verdade sem que ninguem reparasse — porque so aparece em 7 cards.
 *
 * O CONSERTO NAO E TROCAR O HEX, e sim nao ter hex nenhum. Um valor fixo aqui
 * nao acompanha tema: o acento e `#e11d48` no claro e `#ff5470` no escuro,
 * justamente porque o coral do claro fica pesado sobre fundo escuro. Deixando o
 * CSS decidir, os dois casos ficam certos e nao ha constante para envelhecer de
 * novo.
 *
 * DEPENDE DE O ELEMENTO SER `.card` — os quatro que chamam esta funcao sao
 * (`CardAnime`, `CardArquivo`, `Comunidade`, `RankingTemporada`). Se um dia
 * alguem usar isto fora de um `.card`, `--cor` fica indefinida e os
 * `color-mix` do fio e do brilho nao pintam nada.
 */
export function estiloDaCor(cor: string | null | undefined) {
  return (cor ? { "--cor": cor } : {}) as React.CSSProperties;
}
