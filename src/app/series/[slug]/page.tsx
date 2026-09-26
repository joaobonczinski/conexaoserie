import type { Metadata } from "next";
import Link from "next/link";
import AgendaDaSerie from "@/components/AgendaDaSerie";
import SeloDePlataforma from "@/components/SeloDePlataforma";
import { IconeExterno, IconeSetaEsquerda } from "@/components/Icones";
import { INSTANTE_DO_BUILD } from "@/lib/build";
import { enderecoDaSerie } from "@/lib/enderecos";
import { traduzirGenero } from "@/lib/generos";
import {
  DIAS,
  FUSO_PADRAO,
  dataLocal,
  dataPorExtenso,
  diaDaSemanaDaData,
  formatarHora,
  nomeDoFuso,
} from "@/lib/horario";
import { MARCA, SITE_URL } from "@/lib/marca";
import { metadadosDaPagina } from "@/lib/metadados";
import { canalPorChave } from "@/lib/plataformas";
import { proximoLancamento } from "@/lib/proximo";
import {
  aPlataforma,
  lancamentoPorExtenso,
  naPlataforma,
  nomeDaTemporada,
  notaEmTexto,
  situacaoDaSerie,
} from "@/lib/rotulos";
import { buscarSerie, carregarSeries, vizinhasNoAr } from "@/lib/series";
import type { Lancamento, Serie } from "@/lib/tipos";

/* ===========================================================================
   A PAGINA DE UMA SERIE — /series/<slug>/.

   Existe para UMA pergunta, a que mais se digita no Google sobre serie no
   Brasil: "que horas sai o episodio 6 de Lanternas". O calendario responde, mas
   o calendario e uma pagina so, com todas as series; a resposta para UMA serie
   precisa de um endereco dela.

   O ENDERECO NAO MUDA (ver scripts/slug.mjs) e a pagina NAO SOME quando a
   temporada acaba: ela passa a dizer "a temporada terminou em 12/10" e continua
   juntando visita para a temporada seguinte. Some um ano depois de a serie sair
   da agenda (`GUARDA_DIAS`, no fetch).
   =========================================================================== */

type Props = { params: Promise<{ slug: string }> };

/**
 * Endereco usado quando nao ha NENHUMA serie — o mesmo recurso da
 * /novidades/[slug]/. Com `output: "export"` e a lista vazia, o Next recusa a
 * rota inteira e o build falha.
 */
const RESERVA = "em-breve";

/** Endereco que nao saiu do build e 404, e nao pagina gerada na hora. */
export const dynamicParams = false;

export function generateStaticParams() {
  const slugs = carregarSeries().map((s) => ({ slug: s.slug }));
  return slugs.length > 0 ? slugs : [{ slug: RESERVA }];
}

/** "Domingo, 28 de setembro" de um lancamento, em Brasilia. */
function diaEmBrasilia(l: Lancamento): string {
  const dia = l.airingAt !== null ? dataLocal(l.airingAt, FUSO_PADRAO) : l.data;
  return `${DIAS[diaDaSemanaDaData(dia)].toLowerCase()}, ${dataPorExtenso(dia)}`;
}

/**
 * O titulo da aba e do Google: a pergunta que a pessoa digitou, com o numero
 * do episodio.
 *
 * O NOME DA SERIE VEM PRIMEIRO porque o Google corta o fim de titulo longo, e
 * o que nao pode sumir e o nome. O numero do episodio e a data do build — um
 * titulo de ontem pode ficar um dia atras, e a pagina em si nao.
 */
function tituloDaPagina(serie: Serie, proximo: Lancamento | null): string {
  const onde = naPlataforma(serie.plataforma);
  if (!proximo) {
    // Serie encerrada nao tem "proximo": prometer um no titulo do Google seria
    // a pessoa clicar para ler que nao existe.
    return serie.status === "Ended"
      ? `${serie.nome}: quando saiu o último episódio ${onde}`
      : `${serie.nome}: quando sai o próximo episódio ${onde}`;
  }
  const { temporada, episodios, estreia } = proximo;
  if (estreia) {
    return temporada === 1
      ? `${serie.nome}: que horas estreia ${onde}`
      : `${serie.nome}: que horas estreia a ${nomeDaTemporada(temporada)} ${onde}`;
  }
  if (episodios.length === 0) return `${serie.nome}: que horas sai o especial ${onde}`;
  if (episodios.length > 1) {
    return `${serie.nome}: que horas saem os episódios ${episodios[0]} a ${episodios.at(-1)} ${onde}`;
  }
  return `${serie.nome}: que horas sai o episódio ${episodios[0]} ${onde}`;
}

/** A descricao do Google: a resposta inteira na primeira frase. */
function descricaoDaPagina(serie: Serie, proximo: Lancamento | null): string {
  const onde = naPlataforma(serie.plataforma);
  const nome = serie.nomeOriginal ? `${serie.nome} (${serie.nomeOriginal})` : serie.nome;
  if (!proximo) {
    return `${nome} ${onde}: quando sai o próximo episódio, o último que saiu e o horário no Brasil. A data aparece aqui assim que for anunciada.`;
  }
  const verbo = proximo.episodios.length > 1 ? "saem" : "sai";
  const quando =
    proximo.airingAt !== null
      ? `${diaEmBrasilia(proximo)}, às ${formatarHora(proximo.airingAt, FUSO_PADRAO)} (horário de Brasília)`
      : `${diaEmBrasilia(proximo)} (a hora ainda não foi confirmada)`;
  return `${lancamentoPorExtenso(proximo)} de ${nome} ${verbo} ${onde} ${quando}. Contagem regressiva, o horário no seu fuso e as próximas datas.`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const serie = buscarSerie(slug);
  // A reserva nao e conteudo: fica fora do indice.
  if (!serie) return { title: "Série", robots: { index: false, follow: false } };

  const proximo = proximoLancamento(serie.lancamentos, INSTANTE_DO_BUILD);
  return metadadosDaPagina({
    titulo: tituloDaPagina(serie, proximo),
    descricao: descricaoDaPagina(serie, proximo),
    url: enderecoDaSerie(serie.slug),
    // O cartaz da serie no compartilhamento: no WhatsApp, e ele que faz o link
    // ser reconhecido antes de alguem ler o titulo. O MEDIO (18 KB), e nao o
    // original: o original tem em media 760 KB, para virar uma miniatura de
    // poucos centimetros na conversa.
    imagem: serie.capa,
    imagemPequena: serie.capa !== null,
  });
}

/** "à meia-noite", "às 21h", "à 1h". */
function horaPorExtenso(hora: string): string {
  const [h, m] = hora.split(":").map(Number);
  if (h === 0 && m === 0) return "à meia-noite";
  if (h === 12 && m === 0) return "ao meio-dia";
  const texto = `${h}h${m ? String(m).padStart(2, "0") : ""}`;
  return h === 1 ? `à ${texto}` : `às ${texto}`;
}

/** O nome da cidade de um fuso de regra, em portugues. */
const CIDADES: Record<string, string> = {
  "America/Los_Angeles": "Los Angeles",
  "America/New_York": "Nova York",
};

/**
 * DE ONDE VEM A HORA, dito com palavras. Nao e nota de rodape: e o que faz a
 * pessoa confiar (ou desconfiar, com razao) do numero grande la em cima — e o
 * que explica por que ele muda uma hora em novembro.
 */
function comoSaiOHorario(serie: Serie): string {
  const { horario, plataforma } = serie;
  const onde = naPlataforma(plataforma);
  const quem = aPlataforma(plataforma);
  const Quem = quem.charAt(0).toUpperCase() + quem.slice(1);

  if (horario?.tipo === "manual") {
    return `Esta série foge do horário de costume ${onde}: sai ${horaPorExtenso(horario.hora)} no horário de Brasília${
      horario.vespera ? ", na noite anterior à data oficial" : ""
    }. O horário foi conferido à mão.`;
  }
  if (horario?.tipo === "regra") {
    const cidade = CIDADES[horario.fuso] ?? nomeDoFuso(horario.fuso);
    return `${Quem} libera os episódios ${horaPorExtenso(horario.hora)} no horário de ${cidade}${
      horario.vespera ? ", na noite anterior à data oficial" : ""
    }. A hora que aparece aqui já vem convertida para o seu fuso — e muda uma hora quando os Estados Unidos entram ou saem do horário de verão.`;
  }
  if (horario?.tipo === "exibicao") {
    const canal = canalPorChave(serie.canal)?.canal ?? "americano";
    return `Cada episódio chega ${onde} no mesmo minuto em que passa na TV americana (canal ${canal}). A hora que aparece aqui é essa, convertida para o seu fuso — e muda uma hora quando os Estados Unidos entram ou saem do horário de verão.`;
  }
  return `A hora em que ${quem} libera esta série ainda não foi confirmada. O dia é o da exibição original, e a hora aparece aqui assim que for conferida.`;
}

export default async function PaginaDaSerie({ params }: Props) {
  const { slug } = await params;
  const serie = buscarSerie(slug);

  // `notFound()` nao serve aqui: no `output: "export"` ele acontece no build e
  // derruba a geracao. Esta e a pagina de reserva — nada linka para ela.
  if (!serie) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-20 text-center">
        <p className="text-sm text-fraco">Nenhuma série por aqui ainda.</p>
        <Link href="/" className="botao botao-vazio mt-4">
          Ver o calendário
        </Link>
      </main>
    );
  }

  const agora = INSTANTE_DO_BUILD;
  const onde = naPlataforma(serie.plataforma);
  const hoje = dataLocal(agora, FUSO_PADRAO);
  // "desde 2020" so quando ja estreou: o TVmaze poe no `premiered` a data
  // MARCADA da estreia, e "desde 2026" antes de ela acontecer seria falso. O
  // `<` e nao `<=`: no dia da estreia, o build da manha vem antes dela.
  const desde = serie.estreou && serie.estreou < hoje ? serie.estreou.slice(0, 4) : null;
  // "Ainda não estreou" fica so no painel, que sabe a hora: aqui ele seria
  // texto do build, e ficaria errado na noite da estreia.
  const situacao = serie.status === "In Development" ? null : situacaoDaSerie(serie.status);
  const detalhes = [
    ...serie.generos.slice(0, 3).map(traduzirGenero),
    desde ? `desde ${desde}` : null,
    situacao,
  ].filter(Boolean);
  const vizinhas = vizinhasNoAr(serie, agora, 6);
  const cartaz = serie.capaGrande ?? serie.capa;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-6">
      {/* Dados estruturados: dizem ao Google que a pagina e sobre uma SERIE, e
          qual. Sem nota (`aggregateRating`): a nota e do publico do TVmaze, e
          as regras do Google so aceitam avaliacao feita no proprio site. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TVSeries",
            name: serie.nome,
            ...(serie.nomeOriginal ? { alternateName: serie.nomeOriginal } : {}),
            url: `${SITE_URL}${enderecoDaSerie(serie.slug)}`,
            ...(cartaz ? { image: cartaz } : {}),
            ...(serie.generos.length ? { genre: serie.generos.map(traduzirGenero) } : {}),
            ...(desde ? { startDate: serie.estreou } : {}),
            sameAs: serie.tvmazeUrl,
          }),
        }}
      />

      <Link
        href="/series/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-suave transition-colors hover:text-acento"
      >
        <IconeSetaEsquerda className="h-3.5 w-3.5" />
        Todas as séries
      </Link>

      <header className="mt-5 flex items-start gap-4 sm:gap-6">
        {serie.capa ? (
          // O poster medio, e nao o original: ver o comentario do CardSerie.
          // eslint-disable-next-line @next/next/no-img-element -- CDN externo em site estatico
          <img
            src={serie.capa}
            alt={`Cartaz de ${serie.nome}`}
            decoding="async"
            className="aspect-[2/3] w-24 shrink-0 rounded-xl object-cover shadow-[0_0_0_1px_var(--p-linha)] sm:w-36"
          />
        ) : (
          <div className="aspect-[2/3] w-24 shrink-0 rounded-xl bg-realce sm:w-36" />
        )}

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-tinta sm:text-3xl">
            Que horas sai {serie.nome}
          </h1>
          {serie.nomeOriginal ? (
            <p className="mt-1 text-sm text-suave">{serie.nomeOriginal}</p>
          ) : null}
          {detalhes.length ? (
            <p className="mt-2 text-xs leading-relaxed text-fraco">{detalhes.join(" · ")}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <SeloDePlataforma
              plataforma={serie.plataforma}
              cor={serie.cor}
              link={serie.link}
              espacamento="mt-0"
            />
            {serie.nota !== null ? (
              <p className="text-xs text-fraco">
                nota{" "}
                <span className="numero text-sm font-semibold text-tinta">
                  {notaEmTexto(serie.nota)}
                </span>{" "}
                no TVmaze
              </p>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mt-8">
        <AgendaDaSerie
          lancamentos={serie.lancamentos}
          agoraDoBuild={agora}
          cor={serie.cor}
          onde={onde}
          ultimo={serie.ultimo}
          status={serie.status}
        />
      </div>

      {serie.link ? (
        <a
          href={serie.link}
          target="_blank"
          rel="noopener noreferrer"
          className="botao botao-vazio mt-6"
        >
          Abrir {onde}
          <IconeExterno />
        </a>
      ) : null}

      <section className="mt-10">
        <h2 className="text-base font-bold text-tinta">De onde vem o horário</h2>
        <p className="mt-2 text-sm leading-relaxed text-suave">{comoSaiOHorario(serie)}</p>
      </section>

      {vizinhas.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-base font-bold text-tinta">
            Outras séries no ar {onde}
          </h2>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {vizinhas.map((v) => (
              <li key={v.id}>
                <Link
                  href={enderecoDaSerie(v.slug)}
                  prefetch={false}
                  className="flex items-center gap-3 rounded-xl border border-linha bg-cartao px-3 py-2 transition-colors hover:border-linha-forte"
                >
                  {v.capa ? (
                    // eslint-disable-next-line @next/next/no-img-element -- CDN externo em site estatico
                    <img
                      src={v.capa}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-12 w-8 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <div className="h-12 w-8 shrink-0 rounded-md bg-realce" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-tinta">
                    {v.nome}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* A procedencia. O credito ao TVmaze e condicao da licenca (CC BY-SA),
          e o link para a ficha dele e o lugar de quem quiser conferir. */}
      <p className="mt-12 border-t border-linha pt-5 text-xs leading-relaxed text-fraco">
        Datas e episódios vêm do{" "}
        <a
          href={serie.tvmazeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-linha-forte underline-offset-2 hover:text-acento"
        >
          TVmaze
        </a>{" "}
        (CC BY-SA) e são atualizados todo dia. A hora no Brasil é calculada pelo {MARCA}.
      </p>
    </main>
  );
}
