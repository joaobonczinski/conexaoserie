import Link from "next/link";

/**
 * A pagina de endereco inexistente. Vira o `out/404.html`, que o
 * `not_found_handling` do wrangler.jsonc serve no lugar da pagina de erro
 * generica da Cloudflare.
 */
export default function NaoEncontrada() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-24 text-center">
      <p className="etiqueta">Erro 404</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-tinta">
        Esta página não existe
      </h1>
      <p className="mt-3 text-sm text-suave">
        O endereço pode ter mudado, ou nunca ter existido.
      </p>
      <Link href="/" className="botao botao-cheio mt-6">
        Ver o calendário
      </Link>
    </main>
  );
}
