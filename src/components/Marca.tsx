import LinkQueSobe from "./LinkQueSobe";

/* ===========================================================================
   A MARCA — o simbolo e o nome escrito.

   O SIMBOLO E A MESMA ANTENA DO CONEXÃO ANIME: um ponto e tres arcos saindo
   dele. E o que faz os dois sites se reconhecerem como familia; o que os
   separa e a COR (o acento de cada um, no globals.css) e a segunda palavra.

   Em SVG inline ele herda `currentColor`, entao acompanha os dois temas sem
   ter dois arquivos que envelhecem separados.
   =========================================================================== */

export function SimboloDaMarca({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden
      focusable="false"
      className={className ?? "h-7 w-7"}
    >
      <rect width="32" height="32" rx="9" fill="currentColor" />
      {/* Os arcos e o ponto sao vazados NA COR DO FUNDO da pastilha, por isso
          `--p-cartao` e nao branco: no tema escuro o vazado precisa ser escuro. */}
      <g
        fill="none"
        stroke="var(--p-cartao)"
        strokeWidth="2.1"
        strokeLinecap="round"
      >
        <path d="M11.4 20.6a6.5 6.5 0 0 1 0-9.2" />
        <path d="M20.6 11.4a6.5 6.5 0 0 1 0 9.2" />
        <path d="M7.8 24.2a11.6 11.6 0 0 1 0-16.4" opacity=".55" />
        <path d="M24.2 7.8a11.6 11.6 0 0 1 0 16.4" opacity=".55" />
      </g>
      <circle cx="16" cy="16" r="2.6" fill="var(--p-cartao)" />
    </svg>
  );
}

/** O nome em duas tintas: "conexão" suave, "série" forte. Igual ao anime. */
export function NomeDaMarca() {
  return (
    <span className="font-display text-[17px] leading-none tracking-tight">
      <span className="font-medium text-suave">conexão</span>
      <span className="font-bold text-tinta">série</span>
    </span>
  );
}

export default function Marca({ className }: { className?: string }) {
  return (
    <LinkQueSobe
      href="/"
      aria-label="Conexão Série — ir para a página inicial"
      className={`group flex items-center gap-2.5 ${className ?? ""}`}
    >
      <SimboloDaMarca className="h-8 w-8 shrink-0 text-acento transition-transform duration-300 group-hover:-rotate-6" />
      {/* Some abaixo de `sm`: no celular o simbolo sozinho ja identifica o site. */}
      <span className="hidden sm:block">
        <NomeDaMarca />
      </span>
    </LinkQueSobe>
  );
}
