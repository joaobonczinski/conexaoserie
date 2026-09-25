/* ===========================================================================
   OS ICONES — desenhados aqui, em SVG inline.

   Inline e nao um pacote: uma dependencia de icones viajaria no bundle de todo
   visitante para desenhar simbolos de 16px, e imagem externa seria uma
   requisicao a mais por simbolo.

   DUAS FAMILIAS, e a separacao e proposital:

   1. LOGOS DE MARCA (X, Facebook, Instagram, Discord, YouTube, TikTok, Twitch,
      Kick). Vem prontos, sao SOLIDOS, e nao ha o que inventar — um X vazado nao
      e o X. O unico ajuste possivel neles e o peso optico.

   2. GLIFOS DE INTERFACE, todos redesenhados nesta versao. Sao de TRACO.

   O QUE MUDOU DA v1 NOS GLIFOS DE INTERFACE, e vale explicar porque parece so
   gosto: o traco caiu de 1,75 para 1,5 e a construcao passou a ser geometrica —
   circulos de raio inteiro, cantos no mesmo raio, hastes alinhadas na grade de
   2px. O motivo e a fonte nova: a M PLUS 2 tem haste mais fina que a Noto Sans
   JP no mesmo peso, e icone mais gordo que o texto ao lado vira um carimbo.
   Icone e pontuacao do texto — quando ele pesa mais que a palavra, passa a
   competir com ela.
   =========================================================================== */

type Props = { className?: string; style?: React.CSSProperties };

/**
 * Base dos LOGOS (preenchidos).
 *
 * O `style` existe por causa das CORES DE MARCA das redes do perfil: ali a cor
 * e DADO (a marca do servico), nao escolha de layout, e sete cores arbitrarias
 * nao viram classe do Tailwind em tempo de build. Quem nao passa `style`
 * continua herdando a cor do texto.
 *
 * `aria-hidden` em todos: o nome acessivel mora no link ou no botao que os
 * envolve. Marcar o desenho como escondido evita anuncio em dobro.
 */
const solido = (className?: string, style?: React.CSSProperties) => ({
  viewBox: "0 0 24 24",
  fill: "currentColor",
  "aria-hidden": true,
  focusable: false,
  className: className ?? "h-4 w-4",
  style,
});

/**
 * Base dos GLIFOS DE INTERFACE (traco).
 *
 * 1,5 de traco numa caixa de 24: a 16px de tela isso da ~1px de linha, que e o
 * peso da haste da fonte no mesmo tamanho.
 */
const traco = (className?: string, style?: React.CSSProperties) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
  className: className ?? "h-4 w-4",
  style,
});

/**
 * Correcao OPTICA de tamanho, e nao geometrica.
 *
 * Desenhos na mesma caixa de 24 nao parecem do mesmo tamanho: forma cheia e
 * angular pesa mais que forma redonda ou vazada com a mesma medida. O fator
 * escala em torno do CENTRO (por isso o translate de ida e volta), sem mexer no
 * espaco que o icone ocupa no layout.
 */
function escalar(fator: number): string | undefined {
  if (fator === 1) return undefined;
  return `translate(12 12) scale(${fator}) translate(-12 -12)`;
}

/* ===========================================================================
   1. LOGOS DE MARCA

   Os fatores opticos abaixo foram medidos com `getBBox()` na pagina no ar e
   sobreviveram a v2 sem mudanca: eles descrevem a FORMA de cada marca, que nao
   depende do design do site em volta.
   =========================================================================== */

export function IconeX({ className, style }: Props) {
  return (
    <svg {...solido(className, style)}>
      {/* 0,95: massa cheia e angular pesa mais que circulo do mesmo tamanho.
          Medido, o X tem 24 x 21,7 contra ~22 dos vizinhos — fica um fio menor
          de proposito, que e o desconto da massa solida. */}
      <g transform={escalar(0.95)}>
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
      </g>
    </svg>
  );
}

export function IconeFacebook({ className, style }: Props) {
  return (
    <svg {...solido(className, style)}>
      {/* 0,92: disco cheio de borda a borda (23,9 de 24 medidos) — sem o recuo
          ele encosta nos quatro lados enquanto os vizinhos tem folga. */}
      <g transform={escalar(0.92)}>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
      </g>
    </svg>
  );
}

export function IconeInstagram({ className, style }: Props) {
  return (
    <svg {...solido(className, style)}>
      <g transform={escalar(0.92)}>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069ZM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z" />
      </g>
    </svg>
  );
}

export function IconeDiscord({ className, style }: Props) {
  return (
    // `overflow: visible` E OBRIGATORIO por causa do 1,05: o desenho ja ocupa os
    // 24 de largura e, ampliado, passa dos limites do `viewBox` — que o SVG
    // corta por padrao. Sem esta linha o Discord perde as pontas laterais.
    <svg {...solido(className, style)} style={{ ...style, overflow: "visible" }}>
      {/* 1,05 e o ACORDO entre largura e altura: marca larga e baixa (24 x
          18,3) nao tem escala que iguale as duas medidas, entao o alvo e a
          MEDIA delas. Com 1,05 ela vai a 22,2, que e onde estao os outros. */}
      <g transform={escalar(1.05)}>
        <path d="M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 0 0-.0785-.037 19.7363 19.7363 0 0 0-4.8852 1.515.0699.0699 0 0 0-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 0 0 .0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 0 0 .0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 0 0-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 0 1-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 0 1 .0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 0 1 .0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 0 1-.0066.1276 12.2986 12.2986 0 0 1-1.873.8914.0766.0766 0 0 0-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 0 0 .0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 0 0 .0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 0 0-.0312-.0286ZM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189Zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
      </g>
    </svg>
  );
}

export function IconeYoutube({ className, style }: Props) {
  return (
    <svg {...solido(className, style)}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814ZM9.545 15.568V8.432L15.818 12l-6.273 3.568Z" />
    </svg>
  );
}

export function IconeTiktok({ className, style }: Props) {
  return (
    <svg {...solido(className, style)}>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07Z" />
    </svg>
  );
}

export function IconeTwitch({ className, style }: Props) {
  return (
    <svg {...solido(className, style)}>
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0 1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0Zm14.571 11.143-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
    </svg>
  );
}

export function IconeKick({ className, style }: Props) {
  return (
    <svg {...solido(className, style)}>
      <path d="M1.333 0h8v5.333H12V2.667h2.667V0h8v8H20v2.667h-2.667v2.666H20V16h2.667v8h-8v-2.667H12v-2.666H9.333V24h-8Z" />
    </svg>
  );
}

/**
 * O icone de cada rede, achado pelo nome que vem do `marca.ts`.
 *
 * Um mapa, e nao um campo de icone la, porque `marca.ts` e dado puro e nao
 * importa React — ele e lido tambem por codigo que nao desenha nada.
 */
export const ICONE_DA_REDE: Record<string, (p: Props) => React.ReactElement> = {
  X: IconeX,
  Facebook: IconeFacebook,
  Instagram: IconeInstagram,
  // O YouTube e o TikTok ja estavam DESENHADOS aqui e faltavam so nesta linha:
  // o desenho existia para os selos do perfil do usuario (`organizador/redes`),
  // que tem o proprio mapa. Sem a entrada aqui, o rodape simplesmente pulava as
  // duas — `if (!Icone) return null` — sem erro nenhum na tela nem no build.
  YouTube: IconeYoutube,
  TikTok: IconeTiktok,
  Discord: IconeDiscord,
};

/* ===========================================================================
   2. GLIFOS DE INTERFACE

   Todos redesenhados nesta versao. A regra de construcao, para o proximo que
   for desenhar um: caixa util de 18x18 dentro dos 24 (3 de margem de cada
   lado), cantos no mesmo raio, circulos com raio inteiro, hastes na grade de 2.
   =========================================================================== */

/* --- Navegacao principal -------------------------------------------------- */

/**
 * Calendario: a grade do mes, com o topo destacado.
 *
 * As duas hastes do topo sao o que separa este desenho de um retangulo qualquer
 * a 16px — sem elas, calendario e "caixa" tem a mesma silhueta.
 */
export function IconeCalendario({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8.5 3v4M15.5 3v4" />
    </svg>
  );
}

/** Casa. O telhado sai da mesma diagonal dos dois lados — simetria exata. */
export function IconeCasa({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <path d="M3.5 10.5 12 3.5l8.5 7" />
      <path d="M5.5 9.8V19a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V9.8" />
      <path d="M9.5 21v-5a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v5" />
    </svg>
  );
}

/** Proximos: relogio, porque a pagina inteira e uma contagem regressiva. */
export function IconeRelogio({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  );
}

/**
 * Temporadas: camadas empilhadas — o calendario guardado, uma temporada em
 * cima da outra.
 *
 * Nao repete a grade do calendario nem o relogio dos proximos: as tres telas
 * mostram o MESMO dado em tempos diferentes (agora, daqui a pouco, arquivo), e
 * o icone e o que as separa no menu.
 */
export function IconeTemporadas({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <path d="m12 3 8.5 4.2-8.5 4.3-8.5-4.3L12 3Z" />
      <path d="m3.5 12 8.5 4.3 8.5-4.3M3.5 16.5 12 20.8l8.5-4.3" />
    </svg>
  );
}

/**
 * Ranking: trofeu.
 *
 * Nao uma estrela: a estrela ja e o botao de salvar na lista, em duas telas, e
 * o mesmo desenho com dois significados so confunde quem ainda esta aprendendo
 * o site.
 */
export function IconeTrofeu({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <path d="M7 4h10v5.5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4.2v1.3A3 3 0 0 0 7 10.3M17 6h2.8v1.3a3 3 0 0 1-2.8 3" />
      <path d="M12 14.5V17M8.5 20.5h7M10 17.5h4" />
    </svg>
  );
}

/**
 * Fillers: o simbolo de PULAR ADIANTE.
 *
 * Nao um rolo de filme: a secao nao existe para dizer "aqui tem episodio" e sim
 * "estes voce pode pular". Avancar e o unico desenho que carrega esse verbo.
 */
export function IconeFillers({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <path d="M4.5 6.5v11l7.5-5.5-7.5-5.5Z" />
      <path d="M12 6.5v11l6-5.5-6-5.5Z" />
      <path d="M20 6.5v11" />
    </svg>
  );
}

/**
 * Elo de corrente: a pagina /links.
 *
 * DOIS ELOS ENCAIXADOS, e nao um so: um elo sozinho a 16px vira uma pilula, que
 * e a silhueta de meia duzia de outras coisas. Sao os dois no diagonal que
 * fazem o desenho dizer "link" antes de alguem ler o rotulo.
 *
 * A diagonal e a mesma dos dois (45 graus), pela regra da grade la em cima: um
 * elo mais inclinado que o outro le como desenho torto, e nao como corrente.
 */
export function IconeElo({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <path d="M10 13.8a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.3 1.3" />
      <path d="M14 10.2a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.3-1.3" />
    </svg>
  );
}

/* --- Voce e a turma ------------------------------------------------------- */

/** Minha lista: linhas com marca de conferido — e uma lista que se marca. */
export function IconeLista({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <path d="M10 6.5h10.5M10 12h10.5M10 17.5h10.5" />
      <path d="m3.2 6.3 1.3 1.4 2.4-2.9M3.2 17.8l1.3 1.4 2.4-2.9" />
    </svg>
  );
}

/** Comunidade: duas pessoas. Uma so seria "perfil", que e outra coisa. */
export function IconePessoas({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <circle cx="9.5" cy="8" r="3.3" />
      <path d="M3.5 19.5c0-3.1 2.7-5.2 6-5.2s6 2.1 6 5.2" />
      <path d="M16.8 5.2a3.3 3.3 0 0 1 0 5.9M18.2 14.8c1.9.8 3.1 2.4 3.1 4.7" />
    </svg>
  );
}

/**
 * Forum: dois baloes de fala, um atras do outro.
 *
 * Nao as pessoas da /comunidade/. As duas paginas sao sobre gente e por isso
 * precisam de desenhos que digam o que as separa: a comunidade mostra QUEM
 * esta aqui, o forum mostra o que essa gente esta CONVERSANDO.
 */
export function IconeForum({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <path d="M15 4H5.5A1.5 1.5 0 0 0 4 5.5v6A1.5 1.5 0 0 0 5.5 13H7v3l3.4-3H15a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 15 4Z" />
      <path d="M19 8.5a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5h-1.2V20l-3-2.5" />
    </svg>
  );
}

/** Novidades: jornal dobrado. */
export function IconeNovidades({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <path d="M4 5.5h12.5v13a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 18.5v-13Z" />
      <path d="M16.5 9.5H19a1 1 0 0 1 1 1v7.6a1.9 1.9 0 0 1-3.5 1" />
      <path d="M7 9.5h6.5M7 13h6.5M7 16.5h4" />
    </svg>
  );
}

/** Apoiar: coracao. Contorno e nao preenchido — tom sobrio, pedido do Joao. */
export function IconeCoracao({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      {/* O menor da fileira (15x14). Coracao e forma redonda e vazada, que ja
          pesa menos que as angulosas na mesma medida — some duas razoes para
          subir. */}
      <g transform={escalar(1.12)}>
        <path d="M12 20.2s-7.6-4.6-7.6-9.7A4.4 4.4 0 0 1 12 7.5a4.4 4.4 0 0 1 7.6 3c0 5.1-7.6 9.7-7.6 9.7Z" />
      </g>
    </svg>
  );
}

/* --- Conta, controles e acoes --------------------------------------------- */

/** Admin: engrenagem de seis dentes — a 14px oito dentes viram um borrao. */
export function IconeEngrenagem({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <g transform={escalar(0.95)}>
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 2.6v3M12 18.4v3M20.1 7.3l-2.6 1.5M6.5 15.2l-2.6 1.5M20.1 16.7l-2.6-1.5M6.5 8.8 3.9 7.3" />
      </g>
    </svg>
  );
}

/**
 * A campainha.
 *
 * Dois tracos e nao tres: o corpo com a boca fechada, e o badalo embaixo. A
 * argolinha do topo que muitos desenhos tem sai de proposito — a 18px ela vira
 * um ponto colado no corpo.
 */
export function IconeSino({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <path d="M6.5 10.8a5.5 5.5 0 0 1 11 0c0 3.5 1 4.9 1.8 5.7H4.7c.8-.8 1.8-2.2 1.8-5.7Z" />
      <path d="M10.2 19.2a2 2 0 0 0 3.6 0" />
    </svg>
  );
}

/**
 * A LUA E O SOL do interruptor de tema.
 *
 * A lua e um CRESCENTE FEITO DE UM CAMINHO SO, e nao um circulo com outro por
 * cima: o interruptor pinta o icone com `currentColor`, e um recorte por
 * sobreposicao exigiria que o segundo circulo tivesse a cor do FUNDO — que muda
 * com o tema, que e exatamente o que este icone existe para trocar.
 *
 * O sol tem quatro raios, e nao oito: ele vive a 14px dentro de uma chave, e
 * oito raios nesse tamanho viram um borrao.
 */
export function IconeLua({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <path d="M20.4 14.3A8.5 8.5 0 0 1 9.7 3.6a8.5 8.5 0 1 0 10.7 10.7Z" />
    </svg>
  );
}

export function IconeSol({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.8v2.2M12 19v2.2M2.8 12H5M19 12h2.2" />
    </svg>
  );
}

/**
 * A lupa.
 *
 * O CABO SAI DA BORDA do circulo, na diagonal de 45 graus, e nao de dentro
 * dele: os dois tracos se somariam num borrao a 16px, que e o tamanho em que
 * ela vive.
 */
export function IconeLupa({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 4.5 4.5" />
    </svg>
  );
}

/** Envelope. Desenhado aqui — nao ha logo de "e-mail". */
export function IconeEmail({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="m3.8 7.5 7.1 4.6a2 2 0 0 0 2.2 0l7.1-4.6" />
    </svg>
  );
}

/**
 * O alfinete do artigo fixado.
 *
 * Inclinado, como um alfinete espetado de verdade — na vertical ele vira um
 * prego e some no meio do texto a 12px, que e o tamanho em que vive.
 */
export function IconeAlfinete({ className, style }: Props) {
  return (
    <svg {...traco(className ?? "h-3 w-3", style)}>
      <path d="m14.6 3.4 6 6" />
      <path d="M16.9 5.7 12.4 8.2a2 2 0 0 0-.9 1l-1.2 3 4.5 4.5 3-1.2a2 2 0 0 0 1-.9l2.5-4.5" />
      <path d="m10.3 12.2-6.9 8.4" />
    </svg>
  );
}

/**
 * Olho e olho cortado.
 *
 * Os dois existem porque um botao que alterna precisa mostrar o ESTADO PARA
 * ONDE VAI, e nao o atual — quem ve o olho cortado entende "clicar esconde",
 * que e o que o clique faz.
 */
export function IconeOlho({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <path d="M2.5 12S6 6.2 12 6.2 21.5 12 21.5 12 18 17.8 12 17.8 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}

/** A barra atravessa o desenho inteiro: em 14px um risco curto some. */
export function IconeOlhoCortado({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <path d="M2.5 12S6 6.2 12 6.2c1.6 0 3 .4 4.2 1M21.5 12s-3.5 5.8-9.5 5.8c-1.6 0-3-.4-4.2-1" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="m3.5 3.5 17 17" />
    </svg>
  );
}

/* --- Estados da lista ----------------------------------------------------- */

/** Concluido: um visto dentro de um circulo — terminou, fechou. */
export function IconeConcluido({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.3 2.4 2.4 4.6-5.2" />
    </svg>
  );
}

/** Dropado: circulo cortado. Nao um "X", para nao virar erro na leitura. */
export function IconeDropado({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M6 18 18 6" />
    </svg>
  );
}

/** Assistindo: pilha de quadros, como fotogramas. */
export function IconeEpisodios({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M3 10h18M8.5 5v14" />
    </svg>
  );
}

/** Planejado: marcador de pagina — guardado para depois. */
export function IconePlanejado({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <path d="M6.5 5.5A1.5 1.5 0 0 1 8 4h8a1.5 1.5 0 0 1 1.5 1.5V20l-5.5-3.7L6.5 20V5.5Z" />
    </svg>
  );
}

/* ===========================================================================
   3. OS GLIFOS NOVOS DESTA VERSAO

   Entraram com o cabecalho de uma linha, a folha do celular e a barra de abas
   de baixo — pecas que a v1 nao tinha.
   =========================================================================== */

/** Menu do celular: o traco do meio e mais curto de proposito — tres linhas
 *  iguais leem-se como "lista", nao como "abrir menu". */
export function IconeMenu({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <path d="M4 7h16M4 12h11M4 17h16" />
    </svg>
  );
}

/** Fechar. */
export function IconeFechar({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

/* AS DUAS SETAS DO CHAT — crescer e voltar ao tamanho normal.
   Sao um PAR e precisam ser lidas como par, entao a construcao e a mesma nas
   duas: o mesmo cotovelo de canto e a mesma diagonal, so que apontando para
   fora numa e para dentro na outra. Cantos opostos (e nao os quatro) porque a
   16px quatro cotovelos viram uma moldura borrada — dois bastam para a
   diagonal dizer a direcao. */

/** Crescer: os cotovelos abrem para os cantos. */
export function IconeExpandir({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />
    </svg>
  );
}

/** Voltar ao tamanho normal: os mesmos cotovelos, fechando para o centro. */
export function IconeEncolher({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <path d="M20 10h-6V4M4 14h6v6M13 11l7-7M11 13l-7 7" />
    </svg>
  );
}

/** A seta que aponta para baixo (menu que abre, secao que expande). */
export function IconeSetaBaixo({ className, style }: Props) {
  return (
    <svg {...traco(className ?? "h-3.5 w-3.5", style)}>
      <path d="m6 9.5 6 6 6-6" />
    </svg>
  );
}

export function IconeSetaEsquerda({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <path d="M14.5 5.5 8 12l6.5 6.5" />
    </svg>
  );
}

export function IconeSetaDireita({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <path d="M9.5 5.5 16 12l-6.5 6.5" />
    </svg>
  );
}

/** Sair da conta: a porta com a seta indo embora. */
export function IconeSair({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <path d="M14.5 4.5H7A2.5 2.5 0 0 0 4.5 7v10A2.5 2.5 0 0 0 7 19.5h7.5" />
      <path d="m16.5 8.5 3.5 3.5-3.5 3.5M20 12h-9.5" />
    </svg>
  );
}

/** Perfil: uma pessoa so — o par do `IconePessoas`, que sao duas. */
export function IconeUsuario({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <circle cx="12" cy="8.5" r="3.6" />
      <path d="M5 20c0-3.4 3.1-5.6 7-5.6s7 2.2 7 5.6" />
    </svg>
  );
}

/**
 * O raio do XP.
 *
 * Preenchido, ao contrario de quase todos os outros: ele aparece a 12px ao lado
 * de um numero e precisa de MASSA para nao sumir. Contorno nesse tamanho vira
 * um risco em ziguezague.
 */
export function IconeRaio({ className, style }: Props) {
  return (
    <svg {...solido(className ?? "h-3.5 w-3.5", style)}>
      <path d="M13.2 2 4.6 13.1a.6.6 0 0 0 .5 1h4.6l-1.1 7.6a.6.6 0 0 0 1.1.4l8.6-11.1a.6.6 0 0 0-.5-1h-4.6l1.1-7.6a.6.6 0 0 0-1.1-.4Z" />
    </svg>
  );
}

/**
 * A estrela de favoritar.
 *
 * Vem em duas versoes pelo mesmo motivo do olho: o botao mostra o estado. Vazia
 * = nao esta na lista; cheia = esta. O CAMINHO E O MESMO nas duas para o olho
 * nao ver duas estrelas diferentes ao alternar — muda so o preenchimento.
 */
const CAMINHO_ESTRELA =
  "M12 3.6 14.5 8.7l5.6.8-4.1 4 1 5.6-5-2.7-5 2.7 1-5.6-4.1-4 5.6-.8L12 3.6Z";

export function IconeEstrela({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <path d={CAMINHO_ESTRELA} />
    </svg>
  );
}

export function IconeEstrelaCheia({ className, style }: Props) {
  return (
    <svg {...solido(className, style)}>
      <path d={CAMINHO_ESTRELA} />
    </svg>
  );
}

/** A chama do "em alta" — o ranking por popularidade. */
export function IconeChama({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <path d="M12 3s5 3.8 5 9a5 5 0 0 1-10 0c0-1.7.7-3 1.5-4 0 1.4.8 2.3 1.8 2.3 1.3 0 1.9-1.2 1.7-3-.1-1.6-.5-3-.5-4.3Z" />
    </svg>
  );
}

/** Link que sai do site: a setinha diagonal saindo da caixa. */
export function IconeExterno({ className, style }: Props) {
  return (
    <svg {...traco(className ?? "h-3.5 w-3.5", style)}>
      <path d="M13.5 4.5H19v5.5M19 4.5l-8 8" />
      <path d="M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" />
    </svg>
  );
}

/** Um visto solto, sem circulo — confirmacao em linha de texto. */
export function IconeVisto({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

/** Mais: acrescentar a lista, abrir um topico. */
export function IconeMais({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/**
 * Radio: a NOTA MUSICAL DUPLA.
 *
 * NAO E ONDA DE TRANSMISSAO, e a recusa e deliberada: o simbolo da marca ja e
 * exatamente isso — o `((o))` do `SimboloDaMarca`. Um icone de ondas ao lado da
 * marca leria como se a marca fosse o botao, e nenhum dos dois se distinguiria
 * na barra.
 *
 * A nota dupla diz "musica" sem disputar com nada mais na tela.
 */
export function IconeRadio({ className, style }: Props) {
  return (
    <svg {...traco(className, style)}>
      <path d="M9 18V5l10-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="16" cy="16" r="3" />
    </svg>
  );
}

/** Ligar a radio. Triangulo cheio: a forma universal de "toca". */
export function IconeTocar({ className, style }: Props) {
  return (
    <svg {...solido(className, style)}>
      <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.3-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14Z" />
    </svg>
  );
}

/** Parar. Duas barras, o par do `IconeTocar`. */
export function IconePausar({ className, style }: Props) {
  return (
    <svg {...solido(className, style)}>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}
