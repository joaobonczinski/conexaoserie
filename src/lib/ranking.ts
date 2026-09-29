import "server-only";
import dados from "@/data/ranking.json";
import { enderecoDaSerie } from "./enderecos";
import { canalPorChave, corDaPlataforma } from "./plataformas";
import { carregarSeries, pegarOverride } from "./series";

/* ===========================================================================
   O RANKING DE TODOS OS TEMPOS — o ranking.json que o scripts/fetch-ranking.mjs
   grava, e o texto de cada lista. O formato e o do Conexão Filme.

   "server-only" porque o arquivo tem mil series: cada pagina de categoria e
   estatica e leva para o navegador so as dela. Um componente de cliente que
   importasse isto quebraria o build, e e de proposito.
   =========================================================================== */

type SerieNoArquivo = {
  nome: string;
  tituloBr: string | null;
  ano: number | null;
  capa: string | null;
  /** A nota do TVmaze como veio, com as casas todas. */
  nota: number;
  /** O "peso" do TVmaze (0 a 100): o que decide quem entra (ver o fetch). */
  peso: number;
  canal: string | null;
  tvmazeUrl: string;
};

type Arquivo = {
  geradoEm: string | null;
  listas: { chave: string; piso: number; total: number; ids: number[] }[];
  series: Record<string, SerieNoArquivo>;
};

const ARQUIVO = dados as Arquivo;

/** Uma linha do ranking, pronta para a tela. */
export type SerieDoRanking = {
  id: number;
  /** O nome brasileiro quando se sabe, senao o original. */
  nome: string;
  nomeOriginal: string | null;
  ano: number | null;
  capa: string | null;
  nota: number;
  /** Onde passa no Brasil, quando o mapa de canais sabe. */
  plataforma: string | null;
  cor: string | null;
  /** A pagina da serie no site, quando ela tem uma. */
  pagina: string | null;
  tvmazeUrl: string;
};

/**
 * O texto de cada lista, na ordem do seletor. `nome` completa o titulo ("Top
 * 100 {nome} mais bem avaliadas") e o subtitulo ("entre as 812 {nome}"), e por
 * isso e SEMPRE "séries …", no feminino: "documentários" pediria "avaliados", e
 * a frase e uma so para todas as listas.
 */
const CATEGORIAS: {
  chave: string;
  rotulo: string;
  nome: string;
  grupo: "Gêneros" | "Origem";
}[] = [
  { chave: "acao", rotulo: "Ação", nome: "séries de ação", grupo: "Gêneros" },
  { chave: "animacao", rotulo: "Animação", nome: "séries de animação", grupo: "Gêneros" },
  { chave: "aventura", rotulo: "Aventura", nome: "séries de aventura", grupo: "Gêneros" },
  { chave: "comedia", rotulo: "Comédia", nome: "séries de comédia", grupo: "Gêneros" },
  { chave: "crime", rotulo: "Crime", nome: "séries de crime", grupo: "Gêneros" },
  { chave: "documentarios", rotulo: "Documentário", nome: "séries documentais", grupo: "Gêneros" },
  { chave: "drama", rotulo: "Drama", nome: "séries de drama", grupo: "Gêneros" },
  { chave: "espionagem", rotulo: "Espionagem", nome: "séries de espionagem", grupo: "Gêneros" },
  { chave: "familia", rotulo: "Família", nome: "séries para a família", grupo: "Gêneros" },
  { chave: "fantasia", rotulo: "Fantasia", nome: "séries de fantasia", grupo: "Gêneros" },
  { chave: "faroeste", rotulo: "Faroeste", nome: "séries de faroeste", grupo: "Gêneros" },
  { chave: "ficcao-cientifica", rotulo: "Ficção científica", nome: "séries de ficção científica", grupo: "Gêneros" },
  { chave: "guerra", rotulo: "Guerra", nome: "séries de guerra", grupo: "Gêneros" },
  { chave: "historia", rotulo: "História", nome: "séries históricas", grupo: "Gêneros" },
  { chave: "medicas", rotulo: "Médicas", nome: "séries médicas", grupo: "Gêneros" },
  { chave: "misterio", rotulo: "Mistério", nome: "séries de mistério", grupo: "Gêneros" },
  { chave: "romance", rotulo: "Romance", nome: "séries de romance", grupo: "Gêneros" },
  { chave: "sobrenatural", rotulo: "Sobrenatural", nome: "séries sobrenaturais", grupo: "Gêneros" },
  { chave: "suspense", rotulo: "Suspense", nome: "séries de suspense", grupo: "Gêneros" },
  { chave: "terror", rotulo: "Terror", nome: "séries de terror", grupo: "Gêneros" },
  { chave: "tribunal", rotulo: "Tribunal", nome: "séries de tribunal", grupo: "Gêneros" },
  // "ORIGEM", e nao "País" como no Conexão Filme: uma das tres e um idioma
  // (ver o fetch-ranking, que conta tambem por que nao ha lista brasileira).
  { chave: "coreanas", rotulo: "Coreia do Sul", nome: "séries coreanas", grupo: "Origem" },
  { chave: "britanicas", rotulo: "Reino Unido", nome: "séries britânicas", grupo: "Origem" },
  { chave: "em-espanhol", rotulo: "Em espanhol", nome: "séries em espanhol", grupo: "Origem" },
];

const GERAL = { chave: "geral", rotulo: "Todas as categorias", nome: "séries" };

export type ListaDoRanking = {
  chave: string;
  rotulo: string;
  nome: string;
  /** O peso minimo desta lista (ver o topo do fetch-ranking). */
  piso: number;
  /** Quantas series passam no minimo; a lista mostra ate 100 delas. */
  total: number;
  series: SerieDoRanking[];
  anoMaisAntigo: number | null;
  anoMaisNovo: number | null;
};

/**
 * Nome, plataforma e pagina de uma serie do ranking.
 *
 * SE A SERIE ESTA NA AGENDA, e ela que manda: o nome ali ja passou pelos
 * ajustes do admin, e so ali existe a pagina /series/<slug>/. Fora dela, o
 * ajuste do admin ainda vale — e e ele que conserta o titulo brasileiro que o
 * TVmaze errou. Medido em 29/09/2026: 70 das 1.560 series do ranking tem
 * titulo brasileiro la, e quase todos estao certos (Ruptura, A Casa do
 * Dragao), mas Stranger Things vinha como "Bagulhos Sinistros", o meme.
 */
function montar(id: number, s: SerieNoArquivo, naAgenda: Map<number, ReturnType<typeof carregarSeries>[number]>): SerieDoRanking {
  const daAgenda = naAgenda.get(id);
  const nome = daAgenda?.nome ?? pegarOverride(id).tituloBr ?? s.tituloBr ?? s.nome;
  const plataforma =
    daAgenda?.plataforma ?? (s.canal ? (canalPorChave(s.canal)?.plataforma ?? null) : null);
  return {
    id,
    nome,
    nomeOriginal: nome !== s.nome ? s.nome : null,
    ano: s.ano,
    capa: s.capa,
    nota: s.nota,
    plataforma,
    cor: plataforma ? corDaPlataforma(plataforma) : null,
    pagina: daAgenda ? enderecoDaSerie(daAgenda.slug) : null,
    tvmazeUrl: s.tvmazeUrl,
  };
}

/** A lista pronta para a pagina, ou `null` se a chave nao existe no arquivo. */
export function listaDoRanking(chave: string): ListaDoRanking | null {
  const texto = chave === "geral" ? GERAL : CATEGORIAS.find((c) => c.chave === chave);
  const lista = ARQUIVO.listas.find((l) => l.chave === chave);
  if (!texto || !lista) return null;

  const naAgenda = new Map(carregarSeries().map((s) => [s.id, s]));
  const series = lista.ids
    .map((id) => {
      const s = ARQUIVO.series[String(id)];
      // Serie oculta pelo admin some do site inteiro, ranking incluido.
      if (!s || pegarOverride(id).oculto === true) return null;
      return montar(id, s, naAgenda);
    })
    .filter((s): s is SerieDoRanking => s !== null);
  // `filter` antes do min/max: um `null` no meio faria o Math devolver 0 e a
  // frase prometer "de 0 a 2026".
  const anos = series.map((s) => s.ano).filter((a): a is number => a !== null);

  return {
    chave,
    rotulo: texto.rotulo,
    nome: texto.nome,
    piso: lista.piso,
    total: lista.total,
    series,
    anoMaisAntigo: anos.length > 0 ? Math.min(...anos) : null,
    anoMaisNovo: anos.length > 0 ? Math.max(...anos) : null,
  };
}

/** As chaves com pagina propria (/ranking/<chave>/), so as que o arquivo tem. */
export function chavesDasCategorias(): string[] {
  return CATEGORIAS.map((c) => c.chave).filter((chave) =>
    ARQUIVO.listas.some((l) => l.chave === chave && l.ids.length > 0),
  );
}

/** O endereco de uma lista. A geral e a propria /ranking/. */
export const enderecoDaLista = (chave: string) =>
  chave === "geral" ? "/ranking/" : `/ranking/${chave}/`;

export type GrupoDoSeletor = {
  rotulo: string;
  itens: { chave: string; rotulo: string; endereco: string }[];
};

/**
 * As categorias do seletor, agrupadas como os `optgroup` dele, cada uma com o
 * endereco pronto: o seletor e componente de cliente e nao pode importar este
 * arquivo (ver o "server-only" no topo).
 */
export function gruposDoSeletor(): GrupoDoSeletor[] {
  const existentes = new Set(chavesDasCategorias());
  return [
    {
      rotulo: "",
      itens: [{ chave: "geral", rotulo: GERAL.rotulo, endereco: enderecoDaLista("geral") }],
    },
    ...(["Gêneros", "Origem"] as const).map((grupo) => ({
      rotulo: grupo,
      itens: CATEGORIAS.filter((c) => c.grupo === grupo && existentes.has(c.chave)).map(
        ({ chave, rotulo }) => ({ chave, rotulo, endereco: enderecoDaLista(chave) }),
      ),
    })),
  ].filter((g) => g.itens.length > 0);
}
