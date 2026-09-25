"use client";

import { usePathname } from "next/navigation";
import LinkQueSobe from "./LinkQueSobe";
import BotaoDeTema from "./BotaoDeTema";
import IndicadorDoMenu from "./IndicadorDoMenu";
import Marca from "./Marca";
import { IconeLupa } from "@/components/Icones";
import { SECOES, secaoAtiva } from "@/lib/navegacao";

/* ===========================================================================
   O CABECALHO — uma linha: marca, as seis secoes, a lupa e o tema.

   E o cabecalho do Conexão Anime sem a conta: aqui nao ha login (decisao do
   Joao para a primeira versao, 25/09/2026), entao somem o "Entrar", o avatar e
   a campainha. O desenho e o resto sao os mesmos, para os dois sites parecerem
   da mesma familia.

   NO CELULAR quem navega e a BARRA DE ABAS de baixo, e por isso o menu daqui
   some abaixo de `lg`: seria a segunda coisa dizendo a mesma coisa.
   =========================================================================== */

export default function Cabecalho() {
  const caminho = usePathname();
  const secao = secaoAtiva(caminho);

  return (
    // Grudado em toda largura. `--altura-cabecalho` no globals.css espelha esta
    // altura, e e dela que desce a tira de dias do calendario.
    <header className="sticky top-0 z-40 border-b border-linha bg-[var(--p-vidro)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-[78rem] items-center gap-2 px-4">
        <Marca />

        <nav
          aria-label="Seções do site"
          className="menu-trilho ml-6 hidden items-center gap-6 lg:flex"
        >
          {SECOES.map((s) => (
            <LinkQueSobe
              key={s.id}
              href={s.href}
              emBreve={s.emBreve}
              aria-current={s.id === secao ? "page" : undefined}
              className={`menu-item text-sm transition-colors ${
                s.id === secao
                  ? "font-semibold text-tinta"
                  : "font-medium text-suave hover:text-tinta"
              }`}
            >
              {s.rotulo}
            </LinkQueSobe>
          ))}
          <IndicadorDoMenu caminho={caminho} />
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* A LUPA LEVA A BUSCA, em vez de abrir um campo aqui: quem responde
              pelas series da semana e a /calendario/, que ja tem a grade e o
              salto para o dia certo. O `#buscar` e o combinado entre os dois. */}
          <LinkQueSobe
            href="/calendario/#buscar"
            aria-label="Buscar uma série"
            title="Buscar uma série"
            className="flex h-9 w-9 items-center justify-center rounded-full text-suave transition-colors hover:bg-realce hover:text-tinta"
          >
            <IconeLupa className="h-[18px] w-[18px]" />
          </LinkQueSobe>

          <BotaoDeTema />
        </div>
      </div>
    </header>
  );
}
