"use client";

import Link from "next/link";
import { useState } from "react";
import EstadoVazio from "./EstadoVazio";
import { IconeSair } from "./Icones";
import {
  CONFIRMACAO_APAGAR,
  apagarConta,
  enderecoDeEntrar,
  sair,
  useMinhaLista,
} from "@/lib/minha-lista";

/* ===========================================================================
   A CONTA: quem entrou, por onde, sair e apagar.

   APAGAR PEDE A PALAVRA ESCRITA, como no Conexão Anime: um botao so seria um
   clique sem querer de distancia de perder a lista inteira. O Worker confere a
   palavra de novo (ver o worker/index.ts), porque a tela protege do clique e
   o servidor protege de um bug nosso.
   =========================================================================== */

const NOMES: Record<string, string> = { google: "Google", discord: "Discord" };

export default function Conta() {
  const conta = useMinhaLista();
  const [palavra, setPalavra] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (conta.fase === "carregando") {
    return <p className="py-16 text-center text-sm text-fraco">Carregando…</p>;
  }
  if (conta.fase === "indisponivel") {
    return (
      <EstadoVazio titulo="A conta funciona no site publicado">
        No atalho do seu computador o site mostra só as páginas.
      </EstadoVazio>
    );
  }
  if (conta.fase === "deslogado" || !conta.usuario) {
    return (
      <EstadoVazio titulo="Você não entrou">
        <Link href={enderecoDeEntrar("/conta/")} className="botao botao-cheio mt-3">
          Entrar
        </Link>
      </EstadoVazio>
    );
  }

  const u = conta.usuario;
  // So nomeia o servico quando ha um so (a mesma regra do Anime): com dois,
  // "entrou com Google e Discord" seria uma frase que nenhum login produz.
  const servico = u.provedores.length === 1 ? (NOMES[u.provedores[0]] ?? u.provedores[0]) : null;

  async function fazer(acao: () => Promise<void>) {
    setOcupado(true);
    setErro(null);
    try {
      await acao();
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível completar a ação.");
      setOcupado(false);
    }
  }

  return (
    <div className="max-w-xl">
      <section className="painel flex items-center gap-4 p-5">
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-acento text-xl font-semibold text-sobre-acento">
          {u.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- imagem de outro servidor, sem otimizador
            <img src={u.avatar_url} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
          ) : (
            (u.nome ?? u.email).trim().charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <p className="text-base font-semibold text-tinta">{u.nome ?? "Sem nome"}</p>
          <p className="text-sm break-all text-suave">{u.email}</p>
          <p className="mt-1 text-xs text-fraco">
            {servico ? `Você entrou com ${servico}.` : "Você entrou com a conta que escolheu."}
          </p>
        </div>
      </section>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link href="/minha-lista/" className="botao botao-cheio">
          Minha lista
        </Link>
        <button type="button" onClick={() => fazer(sair)} disabled={ocupado} className="botao botao-vazio">
          <IconeSair className="h-4 w-4" />
          Sair
        </button>
      </div>

      <section aria-labelledby="titulo-apagar" className="mt-14 border-t border-linha pt-8">
        <h2 id="titulo-apagar" className="text-lg font-bold tracking-tight text-tinta">
          Apagar a conta
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-suave">
          Apaga a conta e a lista inteira, de vez. Não dá para desfazer. Se você entrar de novo
          depois, começa uma conta nova, vazia.
        </p>
        <label className="mt-4 block">
          <span className="text-xs text-suave">
            Para confirmar, escreva <strong className="text-tinta">{CONFIRMACAO_APAGAR}</strong>
          </span>
          <input
            value={palavra}
            onChange={(e) => setPalavra(e.target.value)}
            autoComplete="off"
            className="campo mt-1.5 min-h-10 max-w-xs"
          />
        </label>
        <button
          type="button"
          onClick={() => fazer(() => apagarConta(palavra))}
          disabled={ocupado || palavra !== CONFIRMACAO_APAGAR}
          className="botao mt-3 border border-erro text-erro"
        >
          Apagar minha conta
        </button>
      </section>

      {erro ? (
        <p role="alert" className="mt-4 text-sm text-erro">
          {erro}
        </p>
      ) : null}
    </div>
  );
}
