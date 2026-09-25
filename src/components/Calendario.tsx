"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CardSerie from "./CardSerie";
import { IconeLupa, IconeSetaDireita, IconeSetaEsquerda } from "./Icones";
import type { Item } from "@/lib/tipos";
import { CARD_CARROSSEL } from "@/lib/carrossel";
import { contar } from "@/lib/contagem";
import {
  DIAS,
  DIAS_CURTOS,
  dataLocal,
  dataPorExtenso,
  diaDaSemanaDaData,
  ehFusoBrasileiro,
  nomeDoFuso,
  somarDias,
} from "@/lib/horario";
import { useAgora, useAncora, useFuso } from "@/lib/relogio";

/** Quantos resultados a busca mostra. Mais que isso vira lista para rolar. */
const LIMITE_DA_BUSCA = 8;

/** Quanto tempo o card fica aceso depois de encontrado. */
const DURACAO_DO_DESTAQUE = 2600;

/** O combinado com a lupa do cabecalho, que aponta para `/calendario/#buscar`. */
const ANCORA_DA_BUSCA = "#buscar";

/**
 * Como os nomes sao comparados na busca: sem acento e sem caixa, porque quem
 * digita "materia escura" nao vai por o acento de "Matéria".
 */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** A chave de um card: a serie e o instante (ou a data) do lancamento. */
const chaveDo = (i: Item) =>
  `${i.serie.id}-${i.lancamento.temporada}-${i.lancamento.airingAt ?? i.lancamento.data}`;

/**
 * O dia em que um lancamento cai PARA QUEM OLHA.
 *
 * Com hora, e a data do instante no fuso do visitante — e aqui mora o valor do
 * site: o episodio que sai 00:00 de sabado em Los Angeles e sexta a noite no
 * Acre e sabado de madrugada em Brasilia. Sem hora, e a data do episodio como
 * veio, porque sem instante nao ha fuso para aplicar.
 */
function diaDoItem(item: Item, fuso: string): string {
  const { airingAt, data } = item.lancamento;
  return airingAt !== null ? dataLocal(airingAt, fuso) : data;
}

type Props = {
  itens: Item[];
  /**
   * A data de hoje no build, em Brasilia. So existe para o HTML do servidor e a
   * primeira renderizacao do cliente baterem; depois de montar, "hoje" e o do
   * relogio de quem esta vendo.
   */
  hojeDoBuild: string;
  /** Mostra a lupa. So a /calendario/ liga — na home a linha do dia ja e cheia. */
  comBusca?: boolean;
};

export default function Calendario({ itens, hojeDoBuild, comBusca = false }: Props) {
  const fuso = useFuso();

  // O RELOGIO ANDA EM DOIS PASSOS. O grosso, de minuto, decide se ha algo
  // saindo nas proximas 24h; so entao o fino, de segundo, liga. Acima de um dia
  // a contagem so muda de minuto em minuto, e repintar a grade por segundo
  // seria trabalho jogado fora.
  const agoraGrosso = useAgora(60_000);
  const precisaDeSegundo = useMemo(
    () =>
      agoraGrosso !== null &&
      itens.some((i) => {
        if (i.lancamento.airingAt === null) return false;
        const c = contar(i.lancamento.airingAt, agoraGrosso);
        return c.dias === 0 && !c.jaSaiu;
      }),
    [itens, agoraGrosso],
  );
  const agoraFino = useAgora(precisaDeSegundo ? 1000 : 60_000);
  const agora = agoraFino ?? agoraGrosso;

  const hoje = agora !== null ? dataLocal(agora, fuso) : hojeDoBuild;

  // A SEMANA COMECA HOJE, e nao no domingo. No anime a grade e "o proximo
  // episodio de cada um", que se repete toda semana, e a ordem Dom–Sab faz
  // sentido; aqui cada lancamento acontece uma vez, e "quinta" num sabado
  // precisaria dizer QUAL quinta. Contando a partir de hoje, a aba ja diz.
  const dias = useMemo(
    () => Array.from({ length: 7 }, (_, i) => somarDias(hoje, i)),
    [hoje],
  );

  const porDia = useMemo(() => {
    const grade = new Map<string, Item[]>(dias.map((d) => [d, []]));
    for (const item of itens) grade.get(diaDoItem(item, fuso))?.push(item);
    // Com hora primeiro, pela hora; "sem hora" no fim do dia. A lista ja chega
    // ordenada pelo instante, e o `sort` estavel preserva o resto.
    for (const lista of grade.values()) {
      lista.sort(
        (a, b) =>
          (a.lancamento.airingAt ?? Infinity) - (b.lancamento.airingAt ?? Infinity),
      );
    }
    return grade;
  }, [itens, dias, fuso]);

  const [diaEscolhido, setDiaEscolhido] = useState<string | null>(null);
  // O dia escolhido pode ter saido da janela (a pagina ficou aberta de um dia
  // para o outro): ai volta para hoje, em vez de mostrar um dia que nao tem aba.
  const diaAtivo =
    diaEscolhido !== null && porDia.has(diaEscolhido) ? diaEscolhido : dias[0];

  // No dia de hoje, o que JA saiu vai para o fim: quem abre o site a noite quer
  // ver o que ainda vem, e nao uma fileira de "saiu ha 6h".
  const doDia = useMemo(() => {
    const lista = porDia.get(diaAtivo) ?? [];
    if (agora === null || diaAtivo !== hoje) return lista;
    const jaSaiu = (i: Item) =>
      i.lancamento.airingAt !== null && i.lancamento.airingAt <= agora;
    return [...lista.filter((i) => !jaSaiu(i)), ...lista.filter(jaSaiu)];
  }, [porDia, diaAtivo, agora, hoje]);

  // --- As setas da fita ------------------------------------------------------
  // "Da para voltar/avancar" e MEDIDO no callback do ref, que roda no commit e
  // nao e efeito. Medir importa: num monitor largo o dia inteiro cabe, e seta
  // acesa apontando para lugar nenhum e mentira.
  const [podeVoltar, setPodeVoltar] = useState(false);
  const [podeAvancar, setPodeAvancar] = useState(false);
  const faixa = useRef<HTMLUListElement | null>(null);
  const medir = (el: HTMLUListElement | null) => {
    if (!el) return;
    setPodeVoltar(el.scrollLeft > 1);
    // A folga de 1px e por causa de zoom e tela de densidade fracionaria.
    setPodeAvancar(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };
  const guardarFaixa = (el: HTMLUListElement | null) => {
    faixa.current = el;
    medir(el);
  };
  function andar(direcao: 1 | -1) {
    const el = faixa.current;
    if (!el) return;
    el.scrollBy({ left: direcao * el.clientWidth * 0.8, behavior: "smooth" });
  }

  // --- A busca -----------------------------------------------------------------
  // Aberta por clique, ou pela ancora `#buscar` que a lupa do cabecalho manda.
  // Fechar vence a ancora: sem o `fechouAncora`, a busca reabriria sozinha
  // enquanto o `#buscar` continuasse na URL.
  const ancora = useAncora();
  const [abertaNoClique, setAbertaNoClique] = useState(false);
  const [fechouAncora, setFechouAncora] = useState(false);
  const buscaAberta =
    comBusca && (abertaNoClique || (ancora === ANCORA_DA_BUSCA && !fechouAncora));
  const fecharBusca = () => {
    setAbertaNoClique(false);
    setFechouAncora(true);
  };

  const [termo, setTermo] = useState("");
  const [indice, setIndice] = useState(0);
  const [destacado, setDestacado] = useState<string | null>(null);
  const caixaDaBusca = useRef<HTMLDivElement>(null);
  const painelDaBusca = useRef<HTMLDivElement>(null);

  const resultados = useMemo(() => {
    const busca = normalizar(termo);
    if (busca.length < 2) return [];
    const vistos = new Set<number>();
    const achados: { item: Item; dia: string }[] = [];
    for (const dia of dias) {
      for (const item of porDia.get(dia) ?? []) {
        // Uma linha por SERIE, no primeiro dia em que ela sai: a novela diaria
        // apareceria sete vezes seguidas na lista.
        if (vistos.has(item.serie.id)) continue;
        const nomes = [item.serie.nome, item.serie.nomeOriginal];
        if (nomes.some((n) => n && normalizar(n).includes(busca))) {
          vistos.add(item.serie.id);
          achados.push({ item, dia });
        }
      }
    }
    return achados.slice(0, LIMITE_DA_BUSCA);
  }, [termo, dias, porDia]);

  /** Leva a pessoa ate a serie: troca o dia, e o efeito abaixo rola e acende. */
  function irAte(alvo: { item: Item; dia: string }) {
    setDiaEscolhido(alvo.dia);
    setDestacado(chaveDo(alvo.item));
    fecharBusca();
    setTermo("");
  }

  // Rola ate o card achado e apaga o destaque sozinho. O efeito espera o
  // `destacado` mudar, que acontece DEPOIS de a faixa repintar com o dia novo —
  // procurar o card no mesmo instante do clique acharia o do dia anterior.
  useEffect(() => {
    if (destacado === null) return;
    document
      .querySelector<HTMLElement>(`[data-card="${destacado}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    const timer = setTimeout(() => setDestacado(null), DURACAO_DO_DESTAQUE);
    return () => clearTimeout(timer);
  }, [destacado]);

  // Fecha ao clicar fora e no Esc. O painel tem ref proprio porque nao mora
  // dentro do botao — sem ele, o `mousedown` num resultado contaria como fora.
  useEffect(() => {
    if (!buscaAberta) return;
    const foraDaqui = (e: MouseEvent) => {
      const alvo = e.target as Node;
      if (
        !caixaDaBusca.current?.contains(alvo) &&
        !painelDaBusca.current?.contains(alvo)
      ) {
        setAbertaNoClique(false);
        setFechouAncora(true);
      }
    };
    const noEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAbertaNoClique(false);
        setFechouAncora(true);
      }
    };
    document.addEventListener("mousedown", foraDaqui);
    document.addEventListener("keydown", noEsc);
    return () => {
      document.removeEventListener("mousedown", foraDaqui);
      document.removeEventListener("keydown", noEsc);
    };
  }, [buscaAberta]);

  const rotuloDaAba = (dia: string, i: number) =>
    i === 0 ? "Hoje" : i === 1 ? "Amanhã" : DIAS_CURTOS[diaDaSemanaDaData(dia)];

  return (
    // ESTE `div` E O CONTEXTO DO GRUDE DA TIRA DE DIAS: `sticky` so gruda dentro
    // do proprio pai, e o pai precisa ter a altura do calendario inteiro — nem
    // mais (a tira rolaria por cima do ranking), nem menos (ela sairia da tela
    // junto com os cards). Licao do Conexão Anime.
    <div>
      <nav
        aria-label="Dias da semana"
        className="barra-grudada -mx-4 mb-5 px-4"
        style={{ top: "var(--altura-cabecalho)" }}
      >
        {/* Sem `min-w-max` aqui: ele fazia a pagina inteira vazar para o lado no
            celular. Quem segura os botoes e o `shrink-0` de cada `li`. */}
        <ul className="fita -ml-3 gap-1 py-2 [scroll-snap-type:none]">
          {dias.map((dia, i) => {
            const ativo = dia === diaAtivo;
            return (
              <li key={dia} className="shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setDiaEscolhido(dia);
                    // Volta a faixa para o comeco e remede, senao as setas
                    // descreveriam o dia anterior.
                    const el = faixa.current;
                    if (el) {
                      el.scrollTo({ left: 0 });
                      medir(el);
                    }
                  }}
                  aria-current={ativo ? "page" : undefined}
                  aria-label={`${DIAS[diaDaSemanaDaData(dia)]}, ${dataPorExtenso(dia)}: ${
                    porDia.get(dia)?.length ?? 0
                  } lançamentos`}
                  // A borda existe em todos, transparente nos fechados: senao o
                  // aberto seria 2px maior e a tira andaria de lado a cada troca.
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    ativo
                      ? "border-contorno-aceso bg-aceso font-semibold text-sobre-aceso"
                      : "border-transparent font-medium text-suave hover:bg-realce hover:text-tinta"
                  }`}
                >
                  {rotuloDaAba(dia, i)}
                  {i > 1 ? (
                    <span className={`numero text-[11px] ${ativo ? "opacity-70" : "text-fraco"}`}>
                      {Number(dia.slice(8))}
                    </span>
                  ) : null}
                  <span
                    className={`numero rounded-full px-1.5 text-[10px] ${
                      ativo ? "bg-realce text-suave" : "bg-realce/60 text-fraco"
                    }`}
                  >
                    {porDia.get(dia)?.length ?? 0}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* `min-h-9` = a altura das setas: elas somem quando o dia cabe na tela,
          e sem a altura o bloco encolheria e os cards pulariam. */}
      <div className="mb-4 flex min-h-9 flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="text-lg font-bold text-tinta">
          {DIAS[diaDaSemanaDaData(diaAtivo)]}, {dataPorExtenso(diaAtivo)}
        </h2>

        {diaAtivo === hoje && agora !== null ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-acento/10 px-2 py-0.5 text-xs font-semibold text-acento">
            <span className="pulso h-1.5 w-1.5 !bg-acento" />
            hoje
          </span>
        ) : null}

        {/* UNICO LUGAR QUE DECLARA O FUSO, porque e o unico que roda no
            navegador — texto do build nao tem como saber de onde acessam. */}
        <p className="text-xs text-fraco">
          horários de {nomeDoFuso(fuso)}
          {ehFusoBrasileiro(fuso) ? "" : " (seu fuso)"}
        </p>

        <div className="ml-auto flex items-center gap-1">
          {comBusca ? (
            <div ref={caixaDaBusca}>
              <button
                type="button"
                onClick={() => (buscaAberta ? fecharBusca() : setAbertaNoClique(true))}
                aria-expanded={buscaAberta}
                aria-label="Buscar série na semana"
                className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                  buscaAberta
                    ? "border-acento bg-acento/10 text-acento"
                    : "border-linha text-suave hover:border-linha-forte hover:text-tinta"
                }`}
              >
                <IconeLupa className="h-[18px] w-[18px]" />
              </button>
            </div>
          ) : null}

          {/* As setas ficam no cabecalho do dia, e nao sobre os cards, onde
              cobririam a capa. Somem quando nao ha para onde ir. */}
          {podeVoltar || podeAvancar ? (
            <>
              <button
                type="button"
                onClick={() => andar(-1)}
                disabled={!podeVoltar}
                aria-label="Ver os lançamentos anteriores do dia"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-linha text-suave transition-colors hover:border-linha-forte hover:text-tinta disabled:opacity-60 disabled:hover:border-linha"
              >
                <IconeSetaEsquerda className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => andar(1)}
                disabled={!podeAvancar}
                aria-label="Ver os próximos lançamentos do dia"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-linha text-suave transition-colors hover:border-linha-forte hover:text-tinta disabled:opacity-60 disabled:hover:border-linha"
              >
                <IconeSetaDireita className="h-4 w-4" />
              </button>
            </>
          ) : null}
        </div>
      </div>

      {/* O PAINEL OCUPA ESPACO PROPRIO e empurra a fila, em vez de flutuar sobre
          ela: flutuando, cobria justamente os cards que a busca ajuda a achar. */}
      {buscaAberta ? (
        <div id="buscar" ref={painelDaBusca} className="painel mb-5 p-3">
          <input
            // O foco vai para o campo quando o painel nasce: quem abriu a busca
            // quer digitar.
            autoFocus
            value={termo}
            onChange={(e) => {
              setTermo(e.target.value);
              setIndice(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIndice((i) => Math.min(i + 1, resultados.length - 1));
                return;
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setIndice((i) => Math.max(i - 1, 0));
                return;
              }
              if (e.key === "Enter" && resultados[indice]) {
                irAte(resultados[indice]);
              }
            }}
            type="search"
            placeholder="Nome da série"
            aria-label="Nome da série"
            className="campo"
          />

          {termo.trim().length > 0 && termo.trim().length < 2 ? (
            <p className="px-2 py-3 text-xs text-fraco">Digite ao menos duas letras.</p>
          ) : resultados.length === 0 && termo.trim().length >= 2 ? (
            <p className="px-2 py-3 text-xs leading-relaxed text-fraco">
              Nenhuma série com esse nome sai nos próximos sete dias. As estreias
              mais distantes estão em Estreias.
            </p>
          ) : resultados.length > 0 ? (
            <ul className="mt-2 max-h-72 overflow-y-auto">
              {resultados.map((r, i) => (
                <li key={chaveDo(r.item)}>
                  <button
                    type="button"
                    onClick={() => irAte(r)}
                    onMouseEnter={() => setIndice(i)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors ${
                      i === indice ? "bg-realce" : ""
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-tinta">
                      {r.item.serie.nome}
                    </span>
                    {/* O DIA E A RESPOSTA, entao fica no fim da linha e nao some
                        no corte do nome. */}
                    <span className="shrink-0 text-[11px] text-fraco">
                      {r.dia === dias[0]
                        ? "hoje"
                        : r.dia === dias[1]
                          ? "amanhã"
                          : DIAS_CURTOS[diaDaSemanaDaData(r.dia)]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {doDia.length === 0 ? (
        <p className="py-16 text-center text-sm text-fraco">
          Nenhuma série sai neste dia.
        </p>
      ) : (
        // UMA FITA ROLAVEL, e nao uma grade: o card cortado na borda e o jeito
        // que qualquer pessoa entende que a fila continua.
        <ul
          ref={guardarFaixa}
          onScroll={(e) => medir(e.currentTarget)}
          tabIndex={0}
          role="region"
          aria-label={`Séries de ${DIAS[diaDaSemanaDaData(diaAtivo)].toLowerCase()}, lista rolável`}
          className="fita -mx-4 gap-4 scroll-pl-4 px-4 pb-3 focus-visible:outline focus-visible:outline-1 focus-visible:outline-acento"
        >
          {doDia.map((item) => {
            const chave = chaveDo(item);
            return (
              <li
                key={chave}
                data-card={chave}
                className={`${CARD_CARROSSEL} ${chave === destacado ? "achado" : ""}`}
              >
                <CardSerie item={item} fuso={fuso} agora={agora} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
