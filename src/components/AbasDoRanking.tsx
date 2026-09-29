import Link from "next/link";

/* ===========================================================================
   AS DUAS PERGUNTAS DO RANKING, cada uma com a sua pagina — o formato do
   Conexão Filme, que ja tinha resolvido isso.

   "Todos os tempos" abre a secao (pedido do Joao em 29/09/2026: "tem que ser o
   ranking geral das series, e por categoria, igual no filme e anime"). "No ar
   agora" e o ranking que a /ranking/ mostrava ate entao: o do calendario, com
   as series da semana.

   SAO LINKS, e nao botoes: cada pergunta tem endereco proprio, que da para
   mandar para alguem e que o Google encontra.
   =========================================================================== */

const ABAS = [
  { chave: "todos-os-tempos", rotulo: "Todos os tempos", href: "/ranking/" },
  { chave: "no-ar", rotulo: "No ar agora", href: "/ranking/no-ar/" },
] as const;

export type AbaDoRanking = (typeof ABAS)[number]["chave"];

export default function AbasDoRanking({ atual }: { atual: AbaDoRanking }) {
  return (
    <nav aria-label="Rankings" className="flex flex-wrap gap-1.5">
      {ABAS.map((aba) => (
        <Link
          key={aba.chave}
          href={aba.href}
          aria-current={aba.chave === atual ? "page" : undefined}
          className="chip min-h-9 px-3.5 text-[13px]"
        >
          {aba.rotulo}
        </Link>
      ))}
    </nav>
  );
}
