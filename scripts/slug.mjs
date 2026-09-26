// O endereco de cada serie: /series/<slug>/.
//
// UM SLUG E ESCOLHIDO UMA VEZ E NUNCA MUDA. Ele e gravado no agenda.json na
// primeira vez que a serie aparece, e o `npm run fetch` so o reaproveita dali em
// diante. Endereco que muda e pagina que o Google perde: se o titulo brasileiro
// chegar depois (pelo admin), o titulo da pagina muda e o endereco fica.
//
// Mora num arquivo so porque dois lugares o usam: o fetch, que escolhe, e o
// `npm run conferir:slugs`, que confere.

/** "JAŸ-Z IN 8" -> "jay-z-in-8"; "Law & Order: SVU" -> "law-order-svu". */
export function slugificar(texto) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * O slug de uma serie nova, sem repetir nenhum dos `ocupados`.
 *
 * O NOME BRASILEIRO PRIMEIRO, quando ja existe na primeira vez que a serie
 * aparece: e o que se digita aqui ("lanternas", e nao "lanterns").
 *
 * EMPATE vira o ano de estreia ("ghosts-2021"), e se ainda empatar, o id do
 * TVmaze — que e unico por definicao. Nome sem nenhuma letra latina (titulo em
 * chines, por exemplo) vira "serie-<id>".
 */
export function escolherSlug(serie, ocupados) {
  const base = slugificar(serie.tituloBr ?? serie.nome) || `serie-${serie.id}`;
  const ano = serie.estreou ? serie.estreou.slice(0, 4) : null;
  const candidatos = [base, ano ? `${base}-${ano}` : null, `${base}-${serie.id}`];
  return candidatos.find((c) => c && !ocupados.has(c)) ?? `${base}-${serie.id}`;
}
