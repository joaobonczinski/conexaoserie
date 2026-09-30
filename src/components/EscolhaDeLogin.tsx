"use client";

import { useEffect, useState } from "react";
import { IconeDiscord } from "./Icones";
import { provedoresLigados } from "@/lib/minha-lista";

/* ===========================================================================
   OS BOTOES DE ENTRAR — so os dos servicos que o servidor tem ligados.

   A pagina e HTML do build e nao sabe se as credenciais do Google e do
   Discord ja chegaram ao Worker; quem sabe e a /api/auth/provedores. Sem essa
   pergunta, a escolha seria entre mostrar um botao que responde erro ou
   esconder um que ja funciona (a mesma razao do Conexão Anime).

   OS BOTOES SAO LINKS DE VERDADE (`<a>`), e nao navegacao do Next: o destino e
   a /api/, que redireciona para o Google, e isso tem que ser uma ida inteira
   do navegador. O caminho de volta (`?volta=`) e lido na hora do clique.
   =========================================================================== */

const NOMES: Record<string, string> = { google: "Google", discord: "Discord" };
const ENDERECOS: Record<string, string> = {
  google: "/api/auth/login",
  discord: "/api/auth/login/discord",
};

export default function EscolhaDeLogin() {
  const [provedores, setProvedores] = useState<string[] | null>(null);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    provedoresLigados()
      .then(setProvedores)
      .catch(() => setFalhou(true));
  }, []);

  function entrar(e: React.MouseEvent<HTMLAnchorElement>, provedor: string) {
    e.preventDefault();
    const volta = new URLSearchParams(window.location.search).get("volta");
    const destino = new URL(ENDERECOS[provedor], window.location.origin);
    if (volta) destino.searchParams.set("volta", volta);
    window.location.assign(destino.toString());
  }

  // DOIS MOTIVOS DIFERENTES, e cada um com a sua frase. Sem servidor de conta
  // (a pergunta falhou) e o atalho da area de trabalho. Servidor no ar sem
  // nenhum login ligado e o site publicado antes de as credenciais do Google
  // e do Discord chegarem: la, falar do "atalho do seu computador" seria
  // mentira para quem visita.
  if (falhou) {
    return (
      <div className="painel mt-8 px-5 py-6 text-sm leading-relaxed text-suave">
        <p className="font-semibold text-tinta">O login ainda não está disponível aqui.</p>
        <p className="mt-2">
          No atalho do seu computador o site mostra só as páginas; a conta funciona no site
          publicado.
        </p>
      </div>
    );
  }
  if (provedores && provedores.length === 0) {
    return (
      <div className="painel mt-8 px-5 py-6 text-sm leading-relaxed text-suave">
        <p className="font-semibold text-tinta">O login está quase pronto.</p>
        <p className="mt-2">
          A conta ainda está sendo configurada. O calendário e o ranking funcionam normalmente
          enquanto isso.
        </p>
      </div>
    );
  }

  if (!provedores) {
    return <p className="mt-8 min-h-24 text-sm text-fraco">Carregando…</p>;
  }

  return (
    <div className="mt-8 flex min-h-24 flex-col gap-3">
      {provedores.map((p) => (
        <a
          key={p}
          href={ENDERECOS[p]}
          onClick={(e) => entrar(e, p)}
          className="botao botao-vazio min-h-12 w-full text-[15px]"
        >
          {p === "discord" ? <IconeDiscord className="h-5 w-5 text-[#5865F2]" /> : <LetraDoGoogle />}
          Entrar com {NOMES[p] ?? p}
        </a>
      ))}
    </div>
  );
}

/**
 * O "G" do Google nas quatro cores: as diretrizes de marca do Google pedem o
 * logo deles no botao de entrar, e nao um "G" nosso.
 */
function LetraDoGoogle() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className="h-5 w-5">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}
