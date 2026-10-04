"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import SeloDePlataforma from "./SeloDePlataforma";
import { IconeOlho, IconeOlhoCortado, IconeSetaDireita, IconeSetaEsquerda } from "./Icones";
import type { Item } from "@/lib/tipos";
import { contar, formatarContagem, rotuloContagem } from "@/lib/contagem";
import { enderecoDaSerie } from "@/lib/enderecos";
import { dataLocal, formatarHora } from "@/lib/horario";
import { useMinhaLista } from "@/lib/minha-lista";
import { useAgora, useFuso } from "@/lib/relogio";
import { rotuloDoLancamento } from "@/lib/rotulos";

/* ===========================================================================
   SUAS SERIES DE HOJE — o que junta as duas metades do site.

   O "Seus animes de hoje" do Conexão Anime, pedido aqui em 03/10/2026 (o item
   2 da revisao: ligar a Minha lista ao calendario). Deslogado, o bloco nao
   existe e a home e a de sempre. Logado, as series da lista que saem HOJE, no
   relogio de quem olha, ficam no topo, dizendo qual episodio e quanto falta
   (ou ha quanto tempo saiu).

   AS DECISOES QUE VIERAM DO ANIME, com o motivo de la:

   - NASCE FECHADO, A CADA CARGA DE PAGINA ("sim, sempre fechado ao abrir o
     site", 04/09/2026). O motivo do olho nao e tirar o bloco do caminho: e
     nao mostrar na tela o que a pessoa assiste sem ela pedir. Uma escolha
     lembrada entre visitas derrotaria isso na segunda.
   - E LUGAR DE SABER, NAO DE GRAVAR: nada de marcar episodio aqui ("ali nao e
     legal marcar, prefiro que marquem em minha lista", 27/08/2026).
   - O QUE JA SAIU VAI PARA O FIM, como no calendario: a versao fechada mostra
     uma linha, e tres episodios ja exibidos virariam o bloco num retrovisor.

   O QUE MUDA: o card leva para a pagina da serie, que aqui existe (no anime
   ele abria a linha da Minha lista); "Abandonei" fica de fora — lembrar o
   episodio de uma serie largada e insistir.

   Tudo acontece depois de montar: o HTML do build e o mesmo para todo mundo,
   e a home continua estatica para quem chega pela primeira vez.
   =========================================================================== */

/**
 * Se o bloco foi aberto NESTA CARGA DA PAGINA. No escopo do modulo, e nao em
 * estado, pelo motivo do anime: "abrir o site" e uma carga de pagina, e o Next
 * troca de tela sem recarregar. Aqui o bloco sobrevive ao passeio pelo site e
 * morre no F5, na aba nova e na proxima visita.
 */
let abertoNestaCarga = false;

/** A chave de um lancamento na fila (a mesma conta do calendario). */
const chaveDo = (i: Item) =>
  `${i.serie.id}-${i.lancamento.temporada}-${i.lancamento.airingAt ?? i.lancamento.data}`;

export default function SuasSeriesDeHoje({ itens }: { itens: Item[] }) {
  const conta = useMinhaLista();
  const fuso = useFuso();

  // O relogio em dois passos, como no calendario: o de segundo so liga quando
  // algo da fila sai nas proximas 24 horas, que e quando a contagem mostra
  // segundos.
  const agoraGrosso = useAgora(60_000);
  const hoje = agoraGrosso === null ? null : dataLocal(agoraGrosso, fuso);

  // Cruza o calendario com a lista: o id do TVmaze e a chave comum. Depende
  // do DIA, e nao do segundo — o relogio fino nao refaz o filtro.
  const meusHoje = useMemo(() => {
    if (conta.fase !== "pronto" || hoje === null) return [];
    const naLista = new Set(
      conta.itens.filter((i) => i.status !== "abandonei").map((i) => i.tvmazeId),
    );
    return itens
      .filter((i) => naLista.has(i.serie.id))
      .filter((i) => {
        const { airingAt, data } = i.lancamento;
        return (airingAt !== null ? dataLocal(airingAt, fuso) : data) === hoje;
      })
      .sort(
        (a, b) => (a.lancamento.airingAt ?? Infinity) - (b.lancamento.airingAt ?? Infinity),
      );
  }, [conta, itens, fuso, hoje]);

  const precisaDeSegundo =
    agoraGrosso !== null &&
    meusHoje.some((i) => {
      const t = i.lancamento.airingAt;
      return t !== null && t > agoraGrosso && t - agoraGrosso < 86400;
    });
  const agoraFino = useAgora(precisaDeSegundo ? 1000 : 60_000);
  const agora = agoraFino ?? agoraGrosso;

  // O que ja saiu vai para o fim; o "sem hora" fica entre os que ainda vem.
  const ordenados = useMemo(() => {
    if (agora === null) return meusHoje;
    const saiu = (i: Item) => i.lancamento.airingAt !== null && i.lancamento.airingAt <= agora;
    return [...meusHoje.filter((i) => !saiu(i)), ...meusHoje.filter(saiu)];
  }, [meusHoje, agora]);

  const [escondido, setEscondido] = useState<boolean>(!abertoNestaCarga);
  function alternarEscondido() {
    // A marca de modulo muda AQUI, no manipulador, e nao no atualizador do
    // `setEscondido`: atualizador precisa ser funcao pura.
    const agoraEscondido = !escondido;
    abertoNestaCarga = !agoraEscondido;
    setEscondido(agoraEscondido);
  }

  // AS SETAS SOMEM QUANDO NAO HA PARA ONDE IR (quem tem duas series hoje nunca
  // ve seta). Medido no callback do ref e na rolagem, como no calendario.
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

  // So para quem esta logado, e saber isso exige uma ida ao servidor. Sem
  // relogio tambem nao: sem ele a fila estaria vazia por falta de "hoje", e o
  // bloco piscaria "nenhuma serie hoje" na cara de quem tem tres.
  if (conta.fase !== "pronto" || agora === null) return null;

  /** O olho, igual nos dois estados menos pelo que ele diz. */
  const olho = (
    <button
      type="button"
      onClick={alternarEscondido}
      aria-expanded={!escondido}
      aria-label={
        escondido ? "Mostrar o bloco Suas séries de hoje" : "Esconder o bloco Suas séries de hoje"
      }
      title={escondido ? "Mostrar este bloco" : "Esconder este bloco"}
      // O icone mostra PARA ONDE O CLIQUE LEVA, nao o estado atual. O alvo tem
      // 44px no celular e encolhe no desktop.
      className="grid min-h-11 min-w-11 place-items-center rounded-full text-fraco transition-colors hover:bg-realce hover:text-tinta sm:min-h-8 sm:min-w-8"
    >
      {escondido ? <IconeOlho className="h-4 w-4" /> : <IconeOlhoCortado className="h-4 w-4" />}
    </button>
  );

  return (
    <section className="mb-8">
      {ordenados.length > 0 ? (
        escondido ? (
          // ESCONDIDO NAO E SUMIDO: fica a linha com o titulo, a contagem e o
          // caminho de volta. A contagem sozinha ja responde "tenho serie
          // hoje?" sem mostrar quais.
          <div className="flex items-center gap-1 border-b border-linha pb-3">
            <h2 className="text-sm font-medium text-suave">
              Suas séries de hoje{" "}
              <span className="numero ml-0.5 text-fraco">{ordenados.length}</span>
            </h2>
            {olho}
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1">
                <h2 className="text-lg font-bold text-tinta">
                  Suas séries de hoje{" "}
                  <span className="numero ml-0.5 text-sm font-normal text-fraco">
                    {ordenados.length}
                  </span>
                </h2>
                {olho}
              </div>

              <div className="flex items-center gap-2">
                {podeVoltar || podeAvancar ? (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => andar(-1)}
                      disabled={!podeVoltar}
                      aria-label="Ver as séries anteriores"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-linha text-suave transition-colors hover:border-linha-forte hover:text-tinta disabled:opacity-60 disabled:hover:border-linha"
                    >
                      <IconeSetaEsquerda className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => andar(1)}
                      disabled={!podeAvancar}
                      aria-label="Ver as próximas séries"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-linha text-suave transition-colors hover:border-linha-forte hover:text-tinta disabled:opacity-60 disabled:hover:border-linha"
                    >
                      <IconeSetaDireita className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}
                <Link
                  href="/minha-lista/"
                  className="text-xs font-medium text-suave transition-colors hover:text-acento"
                >
                  minha lista
                </Link>
              </div>
            </div>

            <ul
              ref={guardarFaixa}
              onScroll={(e) => medir(e.currentTarget)}
              tabIndex={0}
              role="region"
              aria-label="Suas séries de hoje, lista rolável"
              className="fita -mx-4 gap-3 scroll-pl-4 px-4 pb-3 focus-visible:outline focus-visible:outline-1 focus-visible:outline-acento"
            >
              {ordenados.map((item) => {
                const { serie, lancamento } = item;
                const c =
                  lancamento.airingAt !== null ? contar(lancamento.airingAt, agora) : null;
                // "falta 3h 12m 5s" antes, "saiu há 2h" depois: o que a pessoa
                // quer saber aqui e "ja posso assistir?".
                const quando =
                  c === null ? null : c.jaSaiu ? rotuloContagem(c) : `falta ${formatarContagem(c)}`;
                return (
                  <li
                    key={chaveDo(item)}
                    // Deitado e com 280px, o card do anime: capa pequena ao lado
                    // do texto. Em 375px sobra um pedaco do proximo espiando na
                    // borda, que e o que diz "tem mais para o lado".
                    className="painel flex w-[280px] shrink-0 snap-start flex-col gap-2 p-2 transition-colors hover:border-linha-forte"
                  >
                    <Link
                      href={enderecoDaSerie(serie.slug)}
                      prefetch={false}
                      className="group flex min-w-0 items-center gap-2.5"
                    >
                      {serie.capa ? (
                        // eslint-disable-next-line @next/next/no-img-element -- CDN externo em site estatico
                        <img
                          src={serie.capa}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="h-24 w-16 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-24 w-16 shrink-0 rounded-lg bg-realce" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-tinta transition-colors group-hover:text-acento">
                          {serie.nome}
                        </span>
                        <span className="numero mt-1 block text-xs text-suave">
                          {rotuloDoLancamento(lancamento)} ·{" "}
                          {lancamento.airingAt !== null
                            ? formatarHora(lancamento.airingAt, fuso)
                            : "sem hora"}
                        </span>
                        {/* Verde para o que ja saiu: a diferenca entre "posso
                            assistir agora" e "falta 3h" nao pode depender de
                            ler a frase inteira. */}
                        {quando ? (
                          <span
                            className={`numero block text-xs ${c?.jaSaiu ? "text-ok" : "text-fraco"}`}
                          >
                            {quando}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                    {/* FORA do link: o selo vira link da plataforma quando o
                        endereco abre no Brasil, e link dentro de link quebra. */}
                    <SeloDePlataforma
                      plataforma={serie.plataforma}
                      cor={serie.cor}
                      link={serie.link}
                      espacamento="mt-0"
                    />
                  </li>
                );
              })}
            </ul>
          </>
        )
      ) : (
        // DOIS ESTADOS VAZIOS, e nao um so (licao do anime): quem mais via "nada
        // hoje" era quem acabou de criar conta, e a frase culpava o calendario
        // por uma lista que ninguem montou ainda — escondendo o "+" logo abaixo.
        <p className="painel px-4 py-3 text-sm text-suave">
          {conta.itens.length === 0 ? (
            <>
              Sua lista está vazia. Toque no + de uma série no calendário abaixo — as que saírem
              hoje aparecem aqui.
            </>
          ) : (
            <>
              Nenhuma série da sua lista sai hoje.{" "}
              <Link href="/minha-lista/" className="font-medium text-acento hover:underline">
                ver minha lista
              </Link>
            </>
          )}
        </p>
      )}
    </section>
  );
}
