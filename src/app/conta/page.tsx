import type { Metadata } from "next";
import CabecalhoDePagina from "@/components/CabecalhoDePagina";
import Conta from "@/components/Conta";
import { tituloComMarca } from "@/lib/metadados";

// A conta. Pagina estatica e sem dado de ninguem, como a /minha-lista/: o que
// e de cada um chega da /api/ depois. `noindex` por ser pessoal.
export const metadata: Metadata = {
  title: tituloComMarca("Sua conta"),
  robots: { index: false, follow: false },
};

export default function PaginaConta() {
  return (
    <main className="mx-auto w-full max-w-[78rem] px-4 pb-20 pt-6">
      <CabecalhoDePagina etiqueta="Sua conta" titulo="Conta" />
      <Conta />
    </main>
  );
}
