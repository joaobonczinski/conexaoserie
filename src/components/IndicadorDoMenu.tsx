"use client";

import { useEffect, useRef, useState } from "react";

/**
 * O RISCO QUE SEGUE O ITEM DO MENU.
 *
 * Um indicador unico por barra, que percorre o caminho entre um item e outro em
 * vez de piscar de um para o outro, e que segue o item sob o MOUSE — voltando
 * para a pagina atual quando o mouse sai.
 *
 * E IRMAO DOS ITENS, e nao um container em volta deles: o `.menu-trilho` e um
 * flex e um filho a mais em fluxo mudaria o espacamento da barra. Ele e
 * `absolute` dentro do trilho, entao nao ocupa lugar nenhum.
 *
 * ============================== AS ARMADILHAS ==============================
 *
 * 1. O SUBLINHADO CSS COBRE O INSTANTE ANTES DA MEDICAO. O site e estatico: o
 *    HTML chega pronto e este componente so sabe onde pousar depois que o
 *    JavaScript mediu as posicoes. Sem o sublinhado do CSS, o menu apareceria
 *    sem marca nenhuma e ela pularia para dentro na hidratacao — a mesma
 *    piscada que o antipiscada do tema existe para evitar. Por isso os dois
 *    convivem e a classe `menu-medido` no trilho e que esconde um quando o
 *    outro esta pronto.
 *
 * 2. SO A PARTIR DE `lg`. Abaixo disso o menu vira uma fita rolavel na
 *    horizontal, e um indicador que so sabe `left` e `width` pousaria no lugar
 *    errado assim que alguem rolasse a fita. No celular quem marca a pagina
 *    atual e o proprio chip aceso.
 *
 * 3. REMEDIR QUANDO A FONTE CHEGA. As larguras dependem da fonte que estiver
 *    desenhando o texto, e a display so chega depois do CSS: medir uma vez na
 *    montagem deixa o risco com a largura da fonte de reserva. `document.fonts.
 *    ready` resolve, e o `ResizeObserver` cobre o resto (zoom, troca de
 *    idioma, item que aparece quando alguem loga).
 */
export default function IndicadorDoMenu({ caminho }: { caminho: string }) {
  const risco = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ x: number; w: number } | null>(null);
  const [seguindoMouse, setSeguindoMouse] = useState(false);

  useEffect(() => {
    const el = risco.current;
    const trilho = el?.parentElement;
    if (!el || !trilho) return;

    /** Mede um item em relacao ao trilho. `null` quando nao ha item. */
    const medir = (alvo: Element | null) => {
      if (!alvo) return null;
      const a = alvo.getBoundingClientRect();
      const t = trilho.getBoundingClientRect();
      return { x: a.left - t.left, w: a.width };
    };

    const ativo = () => trilho.querySelector('.menu-item[aria-current="page"]');
    const pousarNoAtivo = () => {
      setSeguindoMouse(false);
      setPos(medir(ativo()));
    };

    pousarNoAtivo();
    // O trilho so esconde o sublinhado do CSS depois da primeira medicao.
    trilho.classList.add("menu-medido");

    const aoEntrar = (e: Event) => {
      const item = (e.target as HTMLElement).closest(".menu-item");
      if (!item || !trilho.contains(item)) return;
      setSeguindoMouse(true);
      setPos(medir(item));
    };

    const observador = new ResizeObserver(() => {
      // So reposiciona sozinho quando o mouse nao esta mandando: mover o risco
      // para o item ativo no meio de um hover pareceria defeito.
      if (!seguindoMouse) setPos(medir(ativo()));
    });
    observador.observe(trilho);

    trilho.addEventListener("mouseover", aoEntrar);
    trilho.addEventListener("mouseleave", pousarNoAtivo);
    // A fonte chega depois do primeiro quadro e muda todas as larguras.
    document.fonts?.ready.then(() => {
      if (!seguindoMouse) setPos(medir(ativo()));
    });

    return () => {
      trilho.removeEventListener("mouseover", aoEntrar);
      trilho.removeEventListener("mouseleave", pousarNoAtivo);
      observador.disconnect();
      trilho.classList.remove("menu-medido");
    };
    // `caminho` entra na lista porque trocar de pagina troca o item ativo sem
    // desmontar nada — sem ele o risco ficaria no item da pagina anterior.
  }, [caminho, seguindoMouse]);

  return (
    <span
      ref={risco}
      aria-hidden
      className={`menu-indicador hidden lg:block ${pos ? "menu-aceso" : ""}`}
      style={
        pos
          ? { transform: `translateX(${pos.x}px)`, width: `${pos.w}px` }
          : undefined
      }
    />
  );
}
