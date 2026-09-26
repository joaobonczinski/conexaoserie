/** O endereco da pagina de uma serie. Com barra no fim, como o site inteiro. */
export function enderecoDaSerie(slug: string): string {
  return `/series/${slug}/`;
}

/**
 * O LINK QUE COBRE O CARD INTEIRO sem que o card seja um link.
 *
 * O card nao pode ser um `<a>`: ele tem outro link dentro (o selo da
 * plataforma), e link dentro de link e HTML invalido — o navegador fecha o
 * primeiro no meio e o card se parte em dois. Entao o link fica no NOME, que e
 * o texto que um leitor de tela deve anunciar, e um `::after` absoluto estica a
 * area de clique sobre o card todo.
 *
 * Duas condicoes, e esquecer qualquer uma quebra em silencio: o card precisa
 * de `relative` (senao o `::after` cobre a pagina inteira ate o proximo
 * ancestral posicionado), e o selo precisa de `relative z-10` (senao o
 * `::after` passa por cima dele e o link da plataforma deixa de abrir).
 */
export const LINK_QUE_COBRE = "after:absolute after:inset-0";
