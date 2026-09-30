import type { Metadata } from "next";
import EscolhaDeLogin from "@/components/EscolhaDeLogin";
import { MARCA } from "@/lib/marca";
import { tituloComMarca } from "@/lib/metadados";

// A tela de escolher por onde entrar, a do Conexão Filme.
//
// O botao de cada servico so aparece quando as chaves dele estao no Worker
// (ver EscolhaDeLogin). O lancamento e so com o Google, como no Filme; o
// Discord tem o codigo pronto e aparece sozinho no dia das chaves dele — e
// nesse dia o texto da /privacidade/ e dos /termos/ muda junto.
//
// `noindex` de proposito: e uma tela de passagem, nao um destino. Um resultado
// "Entrar no Conexão Série" no Google nao serve para quem procura serie.
export const metadata: Metadata = {
  title: tituloComMarca("Entrar"),
  robots: { index: false, follow: false },
};

export default function Entrar() {
  return (
    <main className="mx-auto w-full max-w-md px-4 pb-20 pt-16">
      <h1 className="text-2xl font-bold tracking-tight text-tinta">Entrar</h1>
      <p className="mt-2 text-sm leading-relaxed text-suave">
        A conta serve para montar a sua lista de séries: o que você está assistindo, o que quer
        ver e a sua nota. O calendário, os próximos e o ranking do {MARCA} funcionam sem ela.
      </p>

      <EscolhaDeLogin />
    </main>
  );
}
