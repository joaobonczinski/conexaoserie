import { useCallback, useSyncExternalStore } from "react";
import { FUSO_PADRAO, detectarFuso } from "./horario";

/* ===========================================================================
   O QUE SO EXISTE NO NAVEGADOR: o fuso de quem olha, a hora de agora e a ancora
   da URL.

   `useSyncExternalStore`, e nao `useState` + `useEffect`. O HTML e gerado no
   build, onde nao existe fuso de visitante nem relogio de verdade; o
   `getServerSnapshot` devolve um valor NEUTRO, que e o que o servidor e a
   primeira renderizacao do cliente usam — os dois batem e a hidratacao nao
   quebra. Logo depois o React le o valor real e redesenha.

   E o mesmo resultado do `useEffect(() => setFuso(...))` do Conexão Anime, sem
   o `setState` dentro de efeito que as regras do React Compiler recusam.
   =========================================================================== */

const nuncaMuda = () => () => {};

/** O fuso de quem esta vendo. No build e na hidratacao, o de Brasilia. */
export function useFuso(): string {
  return useSyncExternalStore(nuncaMuda, detectarFuso, () => FUSO_PADRAO);
}

/**
 * A hora de agora em Unix segundos, andando de `passoMs` em `passoMs`.
 *
 * `null` no servidor e na hidratacao: ninguem sabe que horas sao quando o HTML
 * e gerado, e uma contagem resolvida ali nasceria congelada no horario do
 * build.
 *
 * O valor e ARREDONDADO ao passo, e isso nao e so economia: o React compara o
 * que o `getSnapshot` devolve entre uma chamada e outra, e o `Date.now()` cru
 * mudaria a cada milissegundo — o React tomaria cada chamada por uma mudanca.
 */
export function useAgora(passoMs: number): number | null {
  const assinar = useCallback(
    (avisar: () => void) => {
      const timer = setInterval(avisar, passoMs);
      return () => clearInterval(timer);
    },
    [passoMs],
  );
  const ler = useCallback(
    () => (Math.floor(Date.now() / passoMs) * passoMs) / 1000,
    [passoMs],
  );
  return useSyncExternalStore(assinar, ler, () => null);
}

function assinarAncora(avisar: () => void) {
  window.addEventListener("hashchange", avisar);
  return () => window.removeEventListener("hashchange", avisar);
}

/** A ancora da URL (`#buscar`). Vazia no servidor. */
export function useAncora(): string {
  return useSyncExternalStore(
    assinarAncora,
    () => window.location.hash,
    () => "",
  );
}
