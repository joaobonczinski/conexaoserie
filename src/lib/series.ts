import agendaJson from "@/data/agenda.json";
import overridesJson from "@/data/overrides.json";
import { canalPorChave, corDaPlataforma, linkQueAbre } from "./plataformas";
import { montarLancamentos } from "./regras";
import type {
  Agenda,
  Item,
  Lancamento,
  Override,
  Serie,
  SerieBruta,
  SerieNaTela,
} from "./tipos";

const agenda = agendaJson as Agenda;

// O JSON tem uma chave "_leiame" com a documentacao dos campos; ela nao e uma
// serie e precisa ser ignorada no merge.
const overrides = overridesJson as Record<string, Override | string[]>;

function pegarOverride(id: number): Override {
  const bruto = overrides[String(id)];
  return typeof bruto === "object" && bruto !== null && !Array.isArray(bruto)
    ? bruto
    : {};
}

/** Quando o `npm run fetch` rodou pela ultima vez, ISO. */
export const ATUALIZADO_EM = agenda.atualizadoEm;

/**
 * Compara dois nomes ignorando caixa, acento e pontuacao.
 *
 * A mesma regra do `nomeSecundario` do Conexão Anime, e pelo mesmo motivo: duas
 * linhas que diferem em dois-pontos ("Star Trek Strange New Worlds") nao sao
 * duas informacoes, e o card repetiria o proprio nome logo abaixo dele.
 */
function soLetrasENumeros(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

/**
 * A plataforma brasileira da serie, ou null quando ela nao deve ir ao ar.
 *
 * O AJUSTE MANUAL VEM PRIMEIRO: e ele que tira do limbo a serie de canal sem
 * casa fixa (ABC, CBS, Peacock), e e ele que corrige o canal quando o
 * licenciamento daqui foge do padrao.
 */
function plataformaDe(bruta: SerieBruta, ajuste: Override): string | null {
  return ajuste.plataforma ?? canalPorChave(bruta.canal)?.plataforma ?? null;
}

function aplicar(bruta: SerieBruta): Serie | null {
  const ajuste = pegarOverride(bruta.id);
  if (ajuste.oculto === true) return null;

  const plataforma = plataformaDe(bruta, ajuste);
  if (plataforma === null) return null;

  const canal = canalPorChave(bruta.canal);
  // A REGRA DE HORARIO SO VALE QUANDO A PLATAFORMA E A DO CANAL. Se o admin
  // mandou uma serie da ABC para o Disney+, o horario da TV americana deixa de
  // descrever quando ela chega aqui — e a regra do Disney+ vale para os
  // originais dele, nao para serie licenciada. Sem ajuste de horario, o card
  // fica com a data e sem hora, que e o que se sabe de verdade.
  const regra =
    canal && canal.plataforma === plataforma ? canal.horario : null;

  const nome = ajuste.tituloBr ?? bruta.tituloBr ?? bruta.nome;
  const nomeOriginal =
    soLetrasENumeros(nome) === soLetrasENumeros(bruta.nome) ? null : bruta.nome;

  return {
    id: bruta.id,
    slug: bruta.slug,
    nome,
    nomeOriginal,
    generos: bruta.generos,
    capa: bruta.capa,
    capaGrande: bruta.capaGrande,
    nota: bruta.nota,
    popularidade: bruta.popularidade,
    plataforma,
    cor: corDaPlataforma(plataforma),
    // O filtro vale TAMBEM para o link do admin, e nao so para o do TVmaze. Nao
    // e desconfianca: e que a regra "o site nunca mostra link que nao abre
    // aqui" so vale a pena sem excecao.
    link: linkQueAbre(ajuste.link ?? bruta.site, plataforma),
    destaque: ajuste.destaque === true,
    tvmazeUrl: bruta.tvmazeUrl,
    canal: bruta.canal,
    horario: ajuste.horario
      ? { tipo: "manual", hora: ajuste.horario.hora, vespera: ajuste.horario.vespera === true }
      : regra,
    estreou: bruta.estreou,
    status: bruta.status,
    ultimo: bruta.ultimo,
    lancamentos: montarLancamentos(bruta.episodios, regra, ajuste.horario ?? null),
  };
}

let carregadas: Serie[] | null = null;

/**
 * Todas as series que vao ao ar no site, com os ajustes aplicados.
 *
 * CALCULADO UMA VEZ POR BUILD: com uma pagina por serie, a lista e pedida
 * centenas de vezes, e cada montagem refaz a conta de fuso de todo episodio
 * (dois `Intl.DateTimeFormat` por episodio). O dado nao muda no meio do build.
 */
export function carregarSeries(): Serie[] {
  carregadas ??= agenda.series
    .map(aplicar)
    .filter((s): s is Serie => s !== null);
  return carregadas;
}

/** A serie sem o que so a pagina dela usa. Ver `SerieNaTela`. */
export function naTela(serie: Serie): SerieNaTela {
  const {
    lancamentos: _l,
    capaGrande: _g,
    canal: _c,
    horario: _h,
    estreou: _e,
    status: _s,
    ultimo: _u,
    ...resto
  } = serie;
  void [_l, _g, _c, _h, _e, _s, _u];
  return resto;
}

/**
 * A serie de um endereco, ou null.
 *
 * SO SERIE QUE VAI AO AR TEM PAGINA: a oculta pelo admin e a de canal sem casa
 * no Brasil (ABC, CBS...) ficam sem, pela mesma regra que as tira do
 * calendario. Uma pagina dizendo "que horas sai" de algo que nao sai aqui seria
 * resposta errada com cara de certa.
 */
export function buscarSerie(slug: string): Serie | null {
  return carregarSeries().find((s) => s.slug === slug) ?? null;
}

/**
 * Outras series da mesma plataforma no ar agora, as mais vistas primeiro.
 *
 * E o que a pagina de uma serie oferece embaixo — e tambem o que liga as
 * paginas entre si: sem isso, uma pagina de serie so seria achada pelo Google
 * a partir da lista inteira.
 */
export function vizinhasNoAr(serie: Serie, agora: number, quantas: number): SerieNaTela[] {
  const SEMANA = 7 * 86400;
  return carregarSeries()
    .filter(
      (s) =>
        s.id !== serie.id &&
        s.plataforma === serie.plataforma &&
        s.lancamentos.some((l) => {
          const t = instanteDe(l);
          return t >= agora - SEMANA && t < agora + SEMANA;
        }),
    )
    .sort((a, b) => b.popularidade - a.popularidade)
    .slice(0, quantas)
    .map(naTela);
}

/**
 * O instante que um lancamento ocupa na linha do tempo.
 *
 * Sem hora conhecida, o meio-dia UTC da data: e o ponto do dia que cai na mesma
 * data em qualquer fuso das Americas, entao o lancamento nao pula de dia so
 * porque ninguem sabe a hora dele.
 */
export function instanteDe(l: Lancamento): number {
  return l.airingAt ?? Date.parse(`${l.data}T12:00:00Z`) / 1000;
}

/** Os lancamentos entre dois instantes, ja como cards. */
export function itensEntre(de: number, ate: number): Item[] {
  const itens: Item[] = [];
  for (const serie of carregarSeries()) {
    const resumo = naTela(serie);
    for (const lancamento of serie.lancamentos) {
      const t = instanteDe(lancamento);
      if (t >= de && t < ate) itens.push({ serie: resumo, lancamento });
    }
  }
  return itens.sort(
    (a, b) =>
      instanteDe(a.lancamento) - instanteDe(b.lancamento) ||
      b.serie.popularidade - a.serie.popularidade,
  );
}

/**
 * O ranking do que esta NO AR: series com episodio de uma semana atras a uma
 * semana a frente, ordenadas pela nota.
 *
 * NO AR E O MESMO RECORTE DO CALENDARIO, com a semana de tras junto. So a
 * semana da frente deixaria de fora a serie que teve episodio ontem e so volta
 * daqui a oito dias — que continua no ar, e a pessoa acabou de ve-la no
 * calendario.
 *
 * QUEM NAO TEM NOTA VAI PARA O FIM e NAO recebe posicao, a regra do Conexão
 * Anime: numerar sem nota poria a serie em ultimo, o que AFIRMA que ela e a
 * pior — e o que se sabe dela e que ainda nao ha nota.
 *
 * A popularidade desempata, e o empate e comum: a nota do TVmaze tem uma casa
 * decimal, e sem regra a ordem entre dois 7,8 mudaria sozinha a cada fetch.
 */
export function rankingNoAr(agora: number): SerieNaTela[] {
  const SEMANA = 7 * 86400;
  const noAr = carregarSeries().filter((s) =>
    s.lancamentos.some((l) => {
      const t = instanteDe(l);
      return t >= agora - SEMANA && t < agora + SEMANA;
    }),
  );
  const comNota = noAr.filter((s) => s.nota !== null);
  const semNota = noAr.filter((s) => s.nota === null);
  comNota.sort((a, b) => b.nota! - a.nota! || b.popularidade - a.popularidade);
  semNota.sort((a, b) => b.popularidade - a.popularidade);
  return [...comNota, ...semNota].map(naTela);
}

/**
 * As estreias — serie nova ou temporada nova — de agora ate `dias` a frente.
 *
 * "Estreia" e ter o episodio 1 no lancamento. O "agora menos um dia" deixa a
 * estreia de ontem a noite ainda na lista na manha seguinte, que e quando mais
 * gente procura por ela.
 */
export function estreias(agora: number, dias: number): Item[] {
  return itensEntre(agora - 86400, agora + dias * 86400).filter(
    (i) => i.lancamento.estreia,
  );
}
