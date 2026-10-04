/** Um episodio como o `npm run fetch` gravou, sem decisao nenhuma nossa. */
export type EpisodioBruto = {
  temporada: number;
  /** `null` em especial, que o TVmaze nao numera. */
  numero: number | null;
  /** A data do episodio no calendario de origem (quase sempre o americano). */
  data: string;
  /** O `airstamp` do TVmaze, em Unix segundos. So vale quando `temHora`. */
  carimbo: number;
  /** Se o canal tem horario de verdade (TV). Streaming nunca tem. */
  temHora: boolean;
};

/** O ultimo episodio que ja saiu, guardado pelo fetch entre uma janela e outra. */
export type UltimoEpisodio = {
  temporada: number;
  numero: number | null;
  data: string;
};

/** Serie como vem do TVmaze, antes dos ajustes manuais. */
export type SerieBruta = {
  id: number;
  /** O endereco da pagina, /series/<slug>/. Escolhido uma vez, nunca muda. */
  slug: string;
  nome: string;
  /** Titulo brasileiro pelos "akas" do TVmaze. Raro — o admin completa. */
  tituloBr: string | null;
  generos: string[];
  tipo: string;
  idioma: string | null;
  capa: string | null;
  capaGrande: string | null;
  /** Nota media do publico do TVmaze, de 0 a 10. */
  nota: number | null;
  /** O "peso" do TVmaze, de 0 a 100. So desempata. */
  popularidade: number;
  /** Chave do canal, igual a de plataformas.json: "web:1", "net:8". */
  canal: string;
  site: string | null;
  tvmazeUrl: string;
  estreou: string | null;
  /** "Running", "Ended", "To Be Determined", "In Development". */
  status: string | null;
  /** A ultima vez que o fetch viu a serie na janela. */
  vistoEm: string;
  ultimo: UltimoEpisodio | null;
  /** Vazio quando a serie saiu da janela e so a pagina continua. */
  episodios: EpisodioBruto[];
};

export type Agenda = {
  atualizadoEm: string;
  janela: { de: string; ate: string };
  series: SerieBruta[];
};

/**
 * Como descobrir a que horas um episodio chega no Brasil.
 *
 * - `exibicao`: e o horario da TV americana, que o TVmaze da exato. Vale para
 *   HBO e FX, que saem no streaming daqui no mesmo instante.
 * - `regra`: a plataforma libera tudo na mesma hora, no fuso DELA. `vespera`
 *   quando a hora cai na noite anterior a data oficial (Apple TV).
 */
export type RegraDeHorario =
  | { tipo: "exibicao" }
  | { tipo: "regra"; hora: string; fuso: string; vespera: boolean };

export type Canal = {
  canal: string;
  tipo: "web" | "net";
  id: number;
  plataforma: string | null;
  horario: RegraDeHorario;
  conferido: string | null;
  fonte: string | null;
};

/** Ajustes manuais do admin, chaveados pelo id do TVmaze. */
export type Override = {
  /** Tira a serie do site sem apagar o dado. */
  oculto?: boolean;
  /** Destaca o card na grade. */
  destaque?: boolean;
  /** O titulo brasileiro, quando o TVmaze nao tem ou errou. */
  tituloBr?: string;
  /** Onde a serie sai no Brasil, quando o canal nao diz ou diz errado. */
  plataforma?: string;
  /** Endereco da serie na plataforma. So vira link se o dominio abrir aqui. */
  link?: string;
  /**
   * A hora em que a serie sai, quando ela foge da regra da plataforma (Marvel
   * no Disney+, por exemplo, sai na vespera as 22h). Em Brasilia, a menos que
   * venha `fuso`; `diaSeguinte` quando chega aqui um dia depois da data
   * oficial. O porque de cada um esta no `AjusteDeHorario` (regras.ts).
   */
  horario?: { hora: string; vespera?: boolean; diaSeguinte?: boolean; fuso?: string };
};

/** De onde saiu o horario de um lancamento — a tela diz isso a quem olha. */
export type OrigemDoHorario = "exibicao" | "regra" | "manual";

/**
 * Como a serie ganha horario: a regra do canal, ou o ajuste do admin (hora de
 * Brasilia). A pagina da serie explica isso com palavras.
 */
export type HorarioDaSerie =
  | RegraDeHorario
  | { tipo: "manual"; hora: string; vespera: boolean; diaSeguinte: boolean; fuso: string };

/**
 * Um LANCAMENTO: o que fica disponivel de uma vez.
 *
 * Nao e um episodio. A Netflix solta a temporada inteira no mesmo minuto, e
 * isso e UM lancamento com oito episodios — oito cards iguais na grade seriam
 * ruido. Ja a TV que passa dois episodios seguidos, as 21h e as 21h30, da dois.
 */
export type Lancamento = {
  /** A data do episodio no calendario de origem. */
  data: string;
  /** Unix segundos em que fica disponivel no Brasil, ou null se nao se sabe. */
  airingAt: number | null;
  origem: OrigemDoHorario | null;
  temporada: number;
  /** Os numeros dos episodios. Vazio quando e so um especial. */
  episodios: number[];
  /** Tem o episodio 1: estreia de serie ou de temporada. */
  estreia: boolean;
};

/** Serie pronta para a tela, com os ajustes e a plataforma resolvidos. */
export type Serie = {
  id: number;
  slug: string;
  /** O nome grande do card: o brasileiro quando existe, senao o original. */
  nome: string;
  /** O original, so quando e diferente do nome grande. */
  nomeOriginal: string | null;
  generos: string[];
  capa: string | null;
  capaGrande: string | null;
  nota: number | null;
  popularidade: number;
  plataforma: string;
  /** A cor da plataforma, que pinta o fio e o brilho do card. */
  cor: string;
  /** Endereco da serie na plataforma, so quando abre no Brasil. */
  link: string | null;
  destaque: boolean;
  tvmazeUrl: string;
  /** Chave do canal de origem ("net:8"), para a pagina explicar o horario. */
  canal: string;
  /** null quando a serie nao tem regra nem ajuste: sai sem hora. */
  horario: HorarioDaSerie | null;
  estreou: string | null;
  status: string | null;
  ultimo: UltimoEpisodio | null;
  lancamentos: Lancamento[];
};

/**
 * O que so a pagina da serie usa. O `capaGrande` entre eles: nenhum card usa o
 * original (ver o comentario do CardSerie), e so os dados estruturados da
 * pagina, que quem le e o robo do Google, apontam para ele.
 */
type SoDaPagina =
  | "lancamentos"
  | "capaGrande"
  | "canal"
  | "horario"
  | "estreou"
  | "status"
  | "ultimo";

/**
 * A serie SEM o que so a pagina dela usa — o que um card precisa saber.
 *
 * Existe por causa do tamanho da pagina: o calendario manda os cards para o
 * navegador, e uma novela diaria levaria os seus sessenta lancamentos dentro de
 * cada um dos sete cards dela.
 */
export type SerieNaTela = Omit<Serie, SoDaPagina>;

/** Um card do calendario: a serie mais UM lancamento dela. */
export type Item = {
  serie: SerieNaTela;
  lancamento: Lancamento;
};
