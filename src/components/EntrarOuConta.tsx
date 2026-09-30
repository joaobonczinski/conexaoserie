"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { enderecoDeEntrar, useMinhaLista } from "@/lib/minha-lista";

/* ===========================================================================
   O CANTO DA CONTA NO CABECALHO: "Entrar", ou a foto de quem entrou.

   Enquanto a conta carrega, o espaco fica reservado, para o botao do tema nao
   pular para o lado quando a resposta chegar. Onde nao ha servidor de conta
   (o atalho da area de trabalho), nao aparece nada: "Entrar" que leva a um
   login que nao existe seria um beco.
   =========================================================================== */

export default function EntrarOuConta() {
  const conta = useMinhaLista();
  const caminho = usePathname();

  if (conta.fase === "carregando") return <span className="h-8 w-8" aria-hidden />;
  if (conta.fase === "indisponivel") return null;

  if (conta.fase === "deslogado" || !conta.usuario) {
    return (
      <Link
        href={enderecoDeEntrar(caminho)}
        className="botao botao-vazio px-3.5 py-2 text-[13px]"
      >
        Entrar
      </Link>
    );
  }

  const u = conta.usuario;
  const nome = u.nome ?? u.email;
  return (
    <Link
      href="/conta/"
      aria-label={`Sua conta (${nome})`}
      title={nome}
      className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-acento text-sm font-semibold text-sobre-acento"
    >
      {u.avatar_url ? (
        // A foto vem do Google ou do Discord. `no-referrer` porque a do Google
        // as vezes recusa quem manda o endereco da pagina de origem.
        // eslint-disable-next-line @next/next/no-img-element -- imagem de outro servidor, sem otimizador
        <img src={u.avatar_url} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
      ) : (
        nome.trim().charAt(0).toUpperCase()
      )}
    </Link>
  );
}
