/**
 * Os generos do TVmaze em portugues.
 *
 * MORA SOZINHO, e nao em series.ts, por causa de quem importa: o card e
 * componente de CLIENTE, e series.ts importa a agenda inteira (220 KB de JSON).
 * Importar a traducao de la levaria a agenda junto para o navegador de todo
 * visitante, so para traduzir "Drama".
 */
const GENEROS_PT: Record<string, string> = {
  Action: "Ação",
  Adult: "Adulto",
  Adventure: "Aventura",
  Anime: "Anime",
  Children: "Infantil",
  Comedy: "Comédia",
  Crime: "Crime",
  DIY: "Faça você mesmo",
  Drama: "Drama",
  Espionage: "Espionagem",
  Family: "Família",
  Fantasy: "Fantasia",
  Food: "Culinária",
  History: "História",
  Horror: "Terror",
  Legal: "Tribunal",
  Medical: "Médico",
  Music: "Musical",
  Mystery: "Mistério",
  Nature: "Natureza",
  Romance: "Romance",
  "Science-Fiction": "Ficção científica",
  Sports: "Esportes",
  Supernatural: "Sobrenatural",
  Thriller: "Suspense",
  Travel: "Viagem",
  War: "Guerra",
  Western: "Faroeste",
};

export function traduzirGenero(genero: string): string {
  return GENEROS_PT[genero] ?? genero;
}
