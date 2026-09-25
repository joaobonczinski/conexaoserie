"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import LinkQueSobe from "./LinkQueSobe";
import BotaoDeTema from "./BotaoDeTema";
import { IconeFechar, IconeMenu } from "@/components/Icones";
import { ABAS_DO_CELULAR, GRUPOS_DO_MENU } from "@/lib/navegacao";

/* ===========================================================================
   A BARRA DE ABAS DO CELULAR — e a folha de menu que a quinta aba abre.

   Veio do Conexão Anime, sem a parte da conta. A navegacao fica onde o polegar
   alcanca e nao ocupa nada do conteudo rolavel. Ela nao existe no desktop
   (`lg:hidden`), onde o menu do cabecalho ja esta sempre a vista.

   O PRECO: 56px no rodape da tela, que o corpo reserva no globals.css — senao a
   barra cobriria a ultima linha de conteudo, que e onde mora o rodape.
   =========================================================================== */

export default function BarraDeAbas() {
  const caminho = usePathname();
  const [aberto, setAberto] = useState(false);

  /**
   * Fecha a folha. Chamado pelo PROPRIO CLIQUE de cada link, e nao por um efeito
   * olhando o `usePathname()` — escrever estado dentro de efeito dispara uma
   * renderizacao em cascata a cada navegacao, e as regras do projeto recusam.
   */
  const fechar = () => setAberto(false);

  // TRAVA A ROLAGEM DE TRAS enquanto a folha esta aberta. Sem isto, arrastar na
  // folha rola a pagina embaixo dela.
  useEffect(() => {
    if (!aberto) return;
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const noEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    document.addEventListener("keydown", noEsc);
    return () => {
      document.body.style.overflow = antes;
      document.removeEventListener("keydown", noEsc);
    };
  }, [aberto]);

  const ativo = (href: string) =>
    href === "/" ? caminho === "/" : caminho.startsWith(href);

  return (
    <>
      {/* A FOLHA mora ANTES da barra no DOM para a barra ficar por cima dela sem
          `z-index` maior — e continuar clicavel, que e como se fecha. */}
      {aberto ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Fechar o menu"
            onClick={fechar}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-2xl border-t border-linha bg-fundo pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
            <div className="sticky top-0 flex items-center justify-between gap-2 border-b border-linha bg-fundo px-4 py-3">
              <span className="etiqueta">Navegar</span>
              <button
                type="button"
                onClick={fechar}
                aria-label="Fechar o menu"
                className="flex h-8 w-8 items-center justify-center rounded-full text-suave hover:bg-realce"
              >
                <IconeFechar className="h-4 w-4" />
              </button>
            </div>

            {GRUPOS_DO_MENU.map((grupo) => (
              <div key={grupo.titulo} className="border-b border-linha px-4 py-3">
                <p className="etiqueta mb-1.5">{grupo.titulo}</p>
                <ul>
                  {grupo.itens.map((item) => (
                    <li key={item.href}>
                      <LinkQueSobe
                        href={item.href}
                        emBreve={item.emBreve}
                        onClick={fechar}
                        aria-current={ativo(item.href) ? "page" : undefined}
                        className={`-mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 text-[15px] transition-colors ${
                          ativo(item.href)
                            ? "bg-realce font-semibold text-tinta"
                            : "text-suave"
                        }`}
                      >
                        <item.Icone className="h-[18px] w-[18px] text-fraco" />
                        {item.rotulo}
                      </LinkQueSobe>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="flex items-center justify-between gap-3 px-4 py-4">
              <span className="text-sm text-suave">Tema</span>
              <BotaoDeTema />
            </div>
          </div>
        </div>
      ) : null}

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-linha bg-[var(--p-vidro)] pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        <ul className="grid grid-cols-5">
          {ABAS_DO_CELULAR.map((aba) => (
            <li key={aba.href}>
              <LinkQueSobe
                href={aba.href}
                emBreve={aba.emBreve}
                onClick={fechar}
                aria-current={ativo(aba.href) ? "page" : undefined}
                className={`flex h-14 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                  ativo(aba.href) ? "text-acento" : "text-fraco"
                }`}
              >
                <aba.Icone className="h-[22px] w-[22px]" />
                {aba.rotulo}
              </LinkQueSobe>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setAberto((a) => !a)}
              aria-expanded={aberto}
              aria-label={aberto ? "Fechar o menu" : "Abrir o menu"}
              className={`flex h-14 w-full flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                aberto ? "text-acento" : "text-fraco"
              }`}
            >
              {aberto ? (
                <IconeFechar className="h-[22px] w-[22px]" />
              ) : (
                <IconeMenu className="h-[22px] w-[22px]" />
              )}
              Menu
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
