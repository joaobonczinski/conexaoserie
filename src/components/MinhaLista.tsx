"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import BotaoDaLista from "./BotaoDaLista";
import EstadoVazio from "./EstadoVazio";
import FaixaEstatisticas from "./FaixaEstatisticas";
import { IconeLupa, IconeRelogio } from "./Icones";
import { contar, rotuloContagem } from "@/lib/contagem";
import {
  DIAS_CURTOS,
  dataLocal,
  diaDaSemanaDaData,
  diaEMes,
  formatarHora,
  somarDias,
} from "@/lib/horario";
import {
  SITUACOES,
  abrirEdicao,
  buscarSeries,
  enderecoDeEntrar,
  nomeDaSerie,
  rotuloDaSituacao,
  useMinhaLista,
  type ItemDaLista,
  type SerieDaBusca,
  type Status,
} from "@/lib/minha-lista";
import { proximoLancamento, recemSaido } from "@/lib/proximo";
import { useAgora, useFuso } from "@/lib/relogio";
import { rotuloDoLancamento } from "@/lib/rotulos";
import type { Lancamento } from "@/lib/tipos";

/* ===========================================================================
   A MINHA LISTA — a busca para adicionar, os filtros por situacao e os
   posteres. Tocar num poster abre o dialogo do item (DialogoDoItem, que mora
   no layout). Veio do Conexão Filme.

   CADA ESTADO DA PAGINA DIZ O SEU MOTIVO: carregando, sem servidor de conta
   (o atalho da area de trabalho so serve as paginas), sem login, lista vazia,
   filtro vazio. Sao causas diferentes, e a pessoa so consegue reagir a cada
   uma se souber qual e.

   LIGADA AO CALENDARIO desde 03/10/2026 (o item 2 da revisao): a faixa "Você
   já terminou" no topo, como no Filme, e o proximo episodio embaixo de cada
   poster — a lista deixou de ser so um arquivo de series e passou a dizer
   quando sai a proxima.
   =========================================================================== */

type Filtro = "todos" | Status;

type Props = {
  /** Os proximos lancamentos de cada serie da agenda, por id do TVmaze. */
  proximos: Record<number, Lancamento[]>;
};

export default function MinhaLista({ proximos }: Props) {
  const conta = useMinhaLista();
  const [filtro, setFiltro] = useState<Filtro>("todos");
  // De minuto em minuto basta: a linha diz o dia e a hora do proximo, e o
  // "saiu ha 2h" so muda de hora em hora.
  const agora = useAgora(60_000);
  const fuso = useFuso();

  if (conta.fase === "carregando") {
    return <p className="py-16 text-center text-sm text-fraco">Carregando…</p>;
  }

  if (conta.fase === "indisponivel") {
    return (
      <EstadoVazio titulo="A Minha lista funciona no site publicado">
        No atalho do seu computador o site mostra só as páginas. A conta e a lista precisam do
        servidor, que existe no site publicado.
      </EstadoVazio>
    );
  }

  if (conta.fase === "deslogado") {
    return (
      <EstadoVazio titulo="Entre para montar a sua lista">
        <p>
          Guarde as séries que você está assistindo e as que quer ver, marque as que terminou e dê
          a sua nota. Dá para adicionar daqui ou pelo + do calendário, dos próximos, do ranking e
          da página de cada série.
        </p>
        <Link href={enderecoDeEntrar("/minha-lista/")} className="botao botao-cheio mt-5">
          Entrar
        </Link>
      </EstadoVazio>
    );
  }

  const quantos = (s: Filtro) =>
    s === "todos" ? conta.itens.length : conta.itens.filter((i) => i.status === s).length;
  const itens = filtro === "todos" ? conta.itens : conta.itens.filter((i) => i.status === filtro);

  return (
    <>
      {/* Com a lista vazia, "voce ja terminou 0 series" so repetiria o aviso
          de lista vazia la embaixo. */}
      {conta.itens.length > 0 ? <FaixaEstatisticas itens={conta.itens} /> : null}

      <Busca />

      <div role="group" aria-label="Filtrar a lista" className="mt-10 flex flex-wrap gap-1.5">
        {([{ valor: "todos", rotulo: "Todas" }, ...SITUACOES] as { valor: Filtro; rotulo: string }[]).map(
          (s) => (
            <button
              key={s.valor}
              type="button"
              aria-pressed={filtro === s.valor}
              onClick={() => setFiltro(s.valor)}
              className="chip min-h-9 px-3.5 text-[13px]"
            >
              {s.rotulo} <span className="numero ml-1 text-fraco">{quantos(s.valor)}</span>
            </button>
          ),
        )}
      </div>

      <div className="mt-6">
        {conta.itens.length === 0 ? (
          <EstadoVazio titulo="A sua lista está vazia">
            Busque uma série acima, ou toque no + de qualquer série do calendário, dos próximos, do
            ranking e da página de cada série.
          </EstadoVazio>
        ) : itens.length === 0 ? (
          <p className="py-10 text-center text-sm text-suave">
            Nenhuma série em “{rotuloDaSituacao(filtro)}”.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {itens.map((item) => (
              <PosterDaLista
                key={item.id}
                item={item}
                lancamentos={proximos[item.tvmazeId] ?? null}
                agora={agora}
                fuso={fuso}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/**
 * Quando sai, no texto mais curto que ainda diz o dia: "hoje 22:00", "amanhã
 * 04:00", "qui 22:00", "15/10 22:00". Dentro de uma semana o dia da semana
 * basta — nao ha duas quintas possiveis.
 */
function quandoSai(l: Lancamento, agora: number, fuso: string): string {
  const hoje = dataLocal(agora, fuso);
  const dia = l.airingAt !== null ? dataLocal(l.airingAt, fuso) : l.data;
  const hora = l.airingAt !== null ? ` ${formatarHora(l.airingAt, fuso)}` : "";
  if (dia === hoje) return `hoje${hora}`;
  if (dia === somarDias(hoje, 1)) return `amanhã${hora}`;
  if (dia < somarDias(hoje, 7)) return `${DIAS_CURTOS[diaDaSemanaDaData(dia)].toLowerCase()}${hora}`;
  return `${diaEMes(dia)}${hora}`;
}

/**
 * A linha do proximo episodio, embaixo do poster.
 *
 * O QUE SAIU HA POUCO VEM ANTES DO QUE VEM: "saiu ha 2h", em verde, responde
 * "ja da para assistir?", que e a pergunta de quem abre a lista a noite.
 * Passada a janela do `recemSaido` (12 horas), a linha volta a dizer o
 * proximo.
 */
function ProximoEpisodio({
  lancamentos,
  agora,
  fuso,
}: {
  lancamentos: Lancamento[];
  agora: number;
  fuso: string;
}) {
  const saiu = recemSaido(lancamentos, agora);
  if (saiu && saiu.airingAt !== null) {
    return (
      <p className="numero mt-1 text-[11px] text-ok">
        {rotuloDoLancamento(saiu)} · {rotuloContagem(contar(saiu.airingAt, agora))}
      </p>
    );
  }
  const proximo = proximoLancamento(lancamentos, agora);
  if (!proximo) return null;
  return (
    <p className="numero mt-1 flex items-center gap-1 text-[11px] text-suave">
      <IconeRelogio className="h-3 w-3 shrink-0" />
      <span>
        {rotuloDoLancamento(proximo)} · {quandoSai(proximo, agora, fuso)}
      </span>
    </p>
  );
}

/** Uma serie da lista: o poster com a situacao, o nome, a nota e o proximo episodio. */
function PosterDaLista({
  item,
  lancamentos,
  agora,
  fuso,
}: {
  item: ItemDaLista;
  /** `null` quando a serie nao esta na agenda (acabou, ou ninguem marcou data). */
  lancamentos: Lancamento[] | null;
  agora: number | null;
  fuso: string;
}) {
  const nome = nomeDaSerie(item.tvmazeId, item.serie);
  return (
    <button
      type="button"
      onClick={() => abrirEdicao(item.tvmazeId)}
      aria-label={`${nome}: ${rotuloDaSituacao(item.status)}. Editar`}
      className="card block w-full text-left"
    >
      <div className="card-capa aspect-[2/3]">
        {item.serie.capa ? (
          // eslint-disable-next-line @next/next/no-img-element -- CDN externo em site estatico
          <img
            src={item.serie.capa}
            alt=""
            loading="lazy"
            decoding="async"
            className="card-arte h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center text-sm font-semibold text-fraco">
            {nome}
          </div>
        )}
        <span className="adesivo absolute left-2 top-2 px-1.5 py-0.5 text-[11px]">
          {rotuloDaSituacao(item.status)}
        </span>
        {item.nota !== null ? (
          <span className="adesivo numero absolute bottom-2 right-2 px-1.5 py-0.5 text-[11px]">
            {item.nota.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}
          </span>
        ) : null}
      </div>
      <p className="card-nome mt-2.5 line-clamp-3 text-sm font-semibold leading-snug text-tinta">
        {nome}
      </p>
      {item.serie.ano ? <p className="numero mt-0.5 text-xs text-fraco">{item.serie.ano}</p> : null}
      {/* Abandonada nao ganha a linha: lembrar o episodio de uma serie que a
          pessoa largou e insistir. */}
      {lancamentos && agora !== null && item.status !== "abandonei" ? (
        <ProximoEpisodio lancamentos={lancamentos} agora={agora} fuso={fuso} />
      ) : null}
    </button>
  );
}

/**
 * A busca para adicionar. Pergunta ao servidor 400ms depois da ultima tecla,
 * e so a resposta da ULTIMA pergunta vale: quem digita rapido dispara varias,
 * e uma resposta antiga chegando depois de uma nova trocaria o resultado pelo
 * de um termo que a pessoa ja apagou.
 */
function Busca() {
  const [termo, setTermo] = useState("");
  const [resultado, setResultado] = useState<{ termo: string; series: SerieDaBusca[] } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const ultima = useRef(0);
  const limpo = termo.trim();

  useEffect(() => {
    if (limpo.length < 2) return;
    const esta = ++ultima.current;
    const relogio = setTimeout(async () => {
      try {
        const series = await buscarSeries(limpo);
        if (esta === ultima.current) {
          setResultado({ termo: limpo, series });
          setErro(null);
        }
      } catch (falha) {
        if (esta === ultima.current) setErro(falha instanceof Error ? falha.message : "A busca falhou.");
      }
    }, 400);
    return () => clearTimeout(relogio);
  }, [limpo]);

  // Os resultados valem so para o termo que esta escrito AGORA.
  const series = limpo.length >= 2 && resultado?.termo === limpo ? resultado.series : null;
  const buscando = limpo.length >= 2 && !series && !erro;

  return (
    <section aria-labelledby="titulo-busca">
      <label htmlFor="busca-serie" id="titulo-busca" className="etiqueta">
        Adicionar uma série
      </label>
      <div className="relative mt-1.5 max-w-xl">
        <IconeLupa className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fraco" />
        <input
          id="busca-serie"
          type="search"
          value={termo}
          onChange={(e) => {
            setTermo(e.target.value);
            setErro(null);
          }}
          placeholder="Nome da série"
          autoComplete="off"
          className="campo min-h-11"
          // O espaco da lupa vai no `style`, e nao num `pl-9`: o `.campo` do
          // globals.css fica fora das camadas do Tailwind e VENCE qualquer
          // utilitario de padding (a armadilha que o Filme registrou).
          style={{ paddingLeft: "2.25rem" }}
        />
      </div>

      <div aria-live="polite" className="max-w-xl">
        {erro ? <p className="mt-3 text-sm text-erro">{erro}</p> : null}
        {buscando ? <p className="mt-3 text-sm text-fraco">Buscando…</p> : null}
        {series && series.length === 0 ? (
          <p className="mt-3 text-sm text-suave">Nenhuma série com esse nome no TVmaze.</p>
        ) : null}
        {series && series.length > 0 ? (
          <ul className="mt-3 divide-y divide-linha rounded-xl border border-linha">
            {series.slice(0, 8).map((s) => {
              const nome = nomeDaSerie(s.tvmazeId, s);
              return (
                <li key={s.tvmazeId} className="flex items-center gap-3 px-3 py-2">
                  {s.capa ? (
                    // eslint-disable-next-line @next/next/no-img-element -- CDN externo em site estatico
                    <img src={s.capa} alt="" loading="lazy" className="h-12 w-8 shrink-0 rounded object-cover" />
                  ) : (
                    <div className="h-12 w-8 shrink-0 rounded bg-realce" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-tinta">{nome}</p>
                    <p className="numero text-xs text-fraco">
                      {s.ano ?? "sem ano"}
                      {nome !== s.nome ? ` · ${s.nome}` : ""}
                    </p>
                  </div>
                  <BotaoDaLista tvmazeId={s.tvmazeId} titulo={nome} variante="linha" />
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
