"use client";

import Link from "next/link";
import { useMinhaLista } from "@/lib/minha-lista";

/**
 * O "Minha conta" ao lado do titulo da /minha-lista/, como no Conexão Anime e
 * no Conexão Filme, de onde este veio.
 *
 * So aparece para quem entrou: a pagina e estatica e a mesma para todos, e so
 * o estado da conta, depois de carregado, sabe se ha conta para abrir.
 */
export default function LinkDaConta() {
  const conta = useMinhaLista();
  if (conta.fase !== "pronto") return null;
  return (
    <Link href="/conta/" className="botao botao-vazio shrink-0">
      Minha conta
    </Link>
  );
}
