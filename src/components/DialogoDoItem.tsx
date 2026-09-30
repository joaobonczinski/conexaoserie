"use client";

import { useEffect, useRef, useState } from "react";
import { IconeFechar } from "./Icones";
import {
  SITUACOES,
  atualizar,
  fecharEdicao,
  itemDaSerie,
  nomeDaSerie,
  remover,
  useMinhaLista,
  type ItemDaLista,
  type Status,
} from "@/lib/minha-lista";

/* ===========================================================================
   O DIALOGO DE UMA SERIE DA LISTA: situacao, nota, anotacao e remover. Veio
   do Conexão Filme.

   MONTADO UMA VEZ, NO LAYOUT: a linha dos proximos, a do ranking, a pagina da
   serie e a /minha-lista/ abrem o mesmo dialogo (ver `abrirEdicao`), e
   nenhuma das telas precisa carregar o proprio.

   O `<dialog>` NATIVO, com `showModal()`: ele prende o foco dentro, fecha no
   Esc, escurece o fundo e esconde o resto da pagina do leitor de tela, sem
   uma linha nossa para nada disso.
   =========================================================================== */

/** As notas do seletor: de 10 a 1, de meio em meio (a regra do worker/lista.ts). */
const NOTAS = Array.from({ length: 19 }, (_, i) => 10 - i * 0.5);
const formatarNota = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 1 });

export default function DialogoDoItem() {
  const conta = useMinhaLista();
  const item = conta.editando !== null ? itemDaSerie(conta, conta.editando) : undefined;
  const dialogo = useRef<HTMLDialogElement>(null);

  // So a porta do dialogo acompanha o estado aqui; o formulario vive no
  // componente de baixo, que nasce de novo para cada item (ver a `key`).
  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (item && !d.open) d.showModal();
    if (!item && d.open) d.close();
  }, [item]);

  return (
    <dialog
      ref={dialogo}
      // O ESC E DO ESTADO, e nao do navegador (licao do Anime, repetida no
      // Filme): com o `onClose`, o Esc fechava o dialogo mas o estado
      // continuava com a serie "aberta", e tocar de novo nela nao abria nada.
      // Cancelando o fechamento nativo, quem fecha e o efeito la em cima.
      onCancel={(e) => {
        e.preventDefault();
        fecharEdicao();
      }}
      // O clique no fundo tem o proprio dialogo como alvo (o `::backdrop` nao e
      // um elemento): e por isso que o dialogo nao tem padding.
      onClick={(e) => {
        if (e.target === dialogo.current) fecharEdicao();
      }}
      aria-label={item ? `Editar ${nomeDaSerie(item.tvmazeId, item.serie)}` : "Editar série"}
      className="m-auto w-[calc(100vw-2rem)] max-w-md bg-transparent p-0 text-tinta backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      {item ? <Formulario key={item.id} item={item} /> : null}
    </dialog>
  );
}

function Formulario({ item }: { item: ItemDaLista }) {
  const [status, setStatus] = useState<Status>(item.status);
  const [nota, setNota] = useState<number | null>(item.nota);
  const [anotacoes, setAnotacoes] = useState(item.anotacoes);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const nome = nomeDaSerie(item.tvmazeId, item.serie);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      await atualizar(item.id, { status, nota, anotacoes });
      fecharEdicao();
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function tirarDaLista() {
    setSalvando(true);
    setErro(null);
    try {
      await remover(item.id);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível remover.");
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="rounded-2xl border border-linha bg-cartao p-5 shadow-2xl">
      <div className="flex items-start gap-3">
        {item.serie.capa ? (
          // eslint-disable-next-line @next/next/no-img-element -- CDN externo em site estatico
          <img src={item.serie.capa} alt="" className="h-[4.5rem] w-12 shrink-0 rounded-md object-cover" />
        ) : (
          <div className="h-[4.5rem] w-12 shrink-0 rounded-md bg-realce" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs text-suave">Na sua lista</p>
          <h2 className="mt-0.5 text-base font-semibold leading-snug text-tinta">{nome}</h2>
          {item.serie.ano ? <p className="numero mt-0.5 text-xs text-fraco">{item.serie.ano}</p> : null}
        </div>
        <button
          type="button"
          onClick={fecharEdicao}
          aria-label="Fechar"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-suave hover:bg-realce hover:text-tinta"
        >
          <IconeFechar className="h-4 w-4" />
        </button>
      </div>

      <fieldset className="mt-5">
        <legend className="text-xs text-suave">Situação</legend>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {SITUACOES.map((s) => (
            <button
              key={s.valor}
              type="button"
              aria-pressed={status === s.valor}
              onClick={() => setStatus(s.valor)}
              className="chip min-h-9 px-3.5 text-[13px]"
            >
              {s.rotulo}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="mt-4 block">
        <span className="text-xs text-suave">Sua nota</span>
        <select
          value={nota ?? ""}
          onChange={(e) => setNota(e.target.value === "" ? null : Number(e.target.value))}
          className="campo mt-1.5 min-h-10"
        >
          <option value="">Sem nota</option>
          {NOTAS.map((n) => (
            <option key={n} value={n}>
              {formatarNota(n)}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 block">
        <span className="text-xs text-suave">Anotação</span>
        <textarea
          value={anotacoes}
          onChange={(e) => setAnotacoes(e.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="Em que episódio parou, com quem assiste, o que achou…"
          className="campo mt-1.5 resize-y"
        />
      </label>

      {erro ? (
        <p role="alert" className="mt-3 text-sm text-erro">
          {erro}
        </p>
      ) : null}

      <div className="mt-5 flex items-center justify-between gap-2">
        {/* O vermelho vai no `style`, e nao numa classe: o `.botao` fica fora
            das camadas do Tailwind e vence o utilitario de cor (a armadilha
            que o Filme registrou). */}
        <button
          type="button"
          onClick={tirarDaLista}
          disabled={salvando}
          className="botao botao-fantasma px-2"
          style={{ color: "var(--p-erro)" }}
        >
          Remover da lista
        </button>
        <button type="submit" disabled={salvando} className="botao botao-cheio">
          {salvando ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}
