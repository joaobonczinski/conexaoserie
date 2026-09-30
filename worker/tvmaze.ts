// O TVmaze do lado do Worker: a ficha de uma serie, para o catalogo da Minha
// Lista, e a busca pelo nome.
//
// E o `tmdb.ts` do Conexão Filme com a outra fonte, e com uma diferenca que
// simplifica: o TVmaze nao pede chave. A busca ainda exige login (ver o
// index.ts), mas pelo motivo de sempre — uma rota aberta vira proxy de robo —,
// e nao para proteger cota nossa.

const API = "https://api.tvmaze.com";

/** O TVmaze fora do ar ou recusando: vira 502 na rota, com esta mensagem. */
export class ErroTvmaze extends Error {}

export type FichaDaSerie = {
  tvmazeId: number;
  nome: string;
  /** O titulo brasileiro dos "akas", quando existe. Raro. */
  tituloBr: string | null;
  ano: number | null;
  /** O poster medio (210px): o original tem ~760 KB (ver o CardSerie). */
  capa: string | null;
};

type Show = {
  id: number;
  name: string;
  premiered?: string | null;
  image?: { medium?: string | null } | null;
};

async function pedir<T>(caminho: string): Promise<T | null> {
  const resposta = await fetch(`${API}${caminho}`, {
    headers: { "User-Agent": "conexao-serie (github.com/joaobonczinski/conexaoserie)" },
  });
  if (resposta.status === 404) return null;
  // 429 e o TVmaze pedindo calma (20 chamadas a cada 10 s por IP, e o IP de
  // saida do Worker e dividido com outros sites). Nao ha espera aqui: a pessoa
  // tenta de novo, e a mensagem diz isso.
  if (resposta.status === 429) {
    throw new ErroTvmaze("O TVmaze está ocupado agora. Tente de novo em alguns segundos.");
  }
  if (!resposta.ok) throw new ErroTvmaze("O TVmaze não respondeu. Tente de novo mais tarde.");
  return (await resposta.json()) as T;
}

const ficha = (s: Show, tituloBr: string | null): FichaDaSerie => ({
  tvmazeId: s.id,
  nome: s.name,
  tituloBr,
  ano: s.premiered ? Number(s.premiered.slice(0, 4)) : null,
  capa: s.image?.medium ?? null,
});

/** A ficha de uma serie, com o titulo brasileiro, ou null se ela nao existe. */
export async function lerSerie(id: number): Promise<FichaDaSerie | null> {
  const show = await pedir<Show>(`/shows/${id}`);
  if (!show) return null;
  // SO O BRASIL, e Portugal nao serve de reserva — a regra do fetch da agenda.
  const akas = (await pedir<{ name: string; country?: { code?: string } | null }[]>(
    `/shows/${id}/akas`,
  )) ?? [];
  return ficha(show, akas.find((a) => a.country?.code === "BR")?.name ?? null);
}

/** A busca pelo nome, como o TVmaze devolve: da mais parecida para a menos. */
export async function buscarSeries(termo: string): Promise<FichaDaSerie[]> {
  const achados = (await pedir<{ show: Show }[]>(`/search/shows?q=${encodeURIComponent(termo)}`)) ?? [];
  return achados.slice(0, 10).map(({ show }) => ficha(show, null));
}
