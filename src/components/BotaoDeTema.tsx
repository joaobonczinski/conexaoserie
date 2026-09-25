"use client";

import { useSyncExternalStore } from "react";
import { IconeLua, IconeSol } from "@/components/Icones";

/**
 * O interruptor de TEMA: claro (padrao) e escuro. Veio do Conexão Anime.
 *
 * E UMA CHAVE DE VERDADE: `role="switch"` e `aria-checked`, que o leitor de
 * tela anuncia como ligado/desligado.
 *
 * QUEM MANDA E O ATRIBUTO NA RAIZ, e nao este componente: o `data-tema` no
 * <html> e a unica fonte da verdade, o CSS le dele, e o script embutido no
 * layout ja o escreve ANTES da primeira pintura. Este componente so alterna o
 * atributo e grava a escolha.
 *
 * O QUE MUDOU EM RELACAO AO ANIME: la o estado era copiado do atributo num
 * `useEffect`. Aqui o componente ASSINA o atributo (um `MutationObserver`), e o
 * que ele desenha e sempre o que esta na raiz — nao ha copia para ficar
 * defasada, e nao ha `setState` dentro de efeito.
 *
 * `null` NO SERVIDOR: o HTML e gerado no build, sem `localStorage`. Chutar um
 * lado faria a chave nascer de um jeito no HTML e de outro no navegador.
 */

/** A mesma chave que o script embutido no `layout.tsx` le. Mudar aqui e mudar la. */
const CHAVE = "tema";

function assinar(avisar: () => void) {
  const observador = new MutationObserver(avisar);
  observador.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-tema"],
  });
  return () => observador.disconnect();
}

const lerEscuro = () => document.documentElement.dataset.tema === "escuro";

export default function BotaoDeTema() {
  const escuro = useSyncExternalStore(assinar, lerEscuro, () => null);

  function alternar() {
    const novo = !escuro;
    if (novo) document.documentElement.dataset.tema = "escuro";
    else delete document.documentElement.dataset.tema;
    // Navegador com armazenamento bloqueado ainda alterna; so nao lembra.
    try {
      localStorage.setItem(CHAVE, novo ? "escuro" : "claro");
    } catch {
      /* sem memoria, e tudo bem */
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={escuro ?? false}
      aria-label={escuro ? "Mudar para o tema claro" : "Mudar para o tema escuro"}
      title={escuro ? "Tema claro" : "Tema escuro"}
      onClick={alternar}
      disabled={escuro === null}
      className="chave-tema"
    >
      {/* OS DOIS ICONES FICAM SEMPRE MONTADOS, e quem decide qual aparece e a
          opacidade no CSS. Trocar o elemento faria o icone piscar. */}
      <IconeSol className="chave-icone chave-sol h-3.5 w-3.5" />
      <IconeLua className="chave-icone chave-lua h-3.5 w-3.5" />
      <span aria-hidden className="chave-bolinha" />
    </button>
  );
}
