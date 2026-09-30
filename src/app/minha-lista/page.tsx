import type { Metadata } from "next";
import CabecalhoDePagina from "@/components/CabecalhoDePagina";
import LinkDaConta from "@/components/LinkDaConta";
import MinhaLista from "@/components/MinhaLista";
import { tituloComMarca } from "@/lib/metadados";

// A Minha Lista (pedida em 29/09/2026, "segue o padrao do Conexão anime e
// filme").
//
// A PAGINA E ESTATICA E NASCE SEM DADO DE NINGUEM: o HTML do build e o mesmo
// para todos, e a lista de cada um chega depois, da /api/, que responde
// `no-store`. E o desenho do Anime e do Filme, e e o que impede um cache de
// entregar a lista de uma pessoa para outra.
//
// `noindex`: e uma tela pessoal, e sem login ela so diz "entre".
export const metadata: Metadata = {
  title: tituloComMarca("Minha lista"),
  robots: { index: false, follow: false },
};

export default function PaginaMinhaLista() {
  return (
    <main className="mx-auto w-full max-w-[78rem] px-4 pb-20 pt-6">
      <CabecalhoDePagina
        etiqueta="Sua conta"
        titulo="Minha lista"
        acao={<LinkDaConta />}
        subtitulo="As séries que você está assistindo, as que quer ver e as suas notas."
      />
      <MinhaLista />
    </main>
  );
}
