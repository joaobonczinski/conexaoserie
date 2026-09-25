/**
 * A COR DE CADA MARCA, num lugar so.
 *
 * O X e o Instagram aparecem em DOIS lugares do site — nos selos de rede do
 * perfil e na fileira do rodape — e uma cor escrita nos dois viraria dois rosas
 * diferentes para o Instagram no dia em que alguem ajustasse um. E o mesmo
 * argumento do `CORES_SERVICO` (streaming) e do `CARD_CARROSSEL` (largura do
 * card): dado que duas telas mostram nao pode morar em duas telas.
 *
 * AQUI A COR E A AREA, e isso e uma mudanca de rumo com dono. Ate 29/08 a regra
 * da casa era "cor em detalhe, nunca em area" — o pontinho do streaming e
 * colorido, o nome nao. O Joao viu num outro site os icones como QUADRADOS
 * coloridos com o logo branco dentro e pediu esse visual: "nao me importo que
 * seja velho, ficou lindo". A regra antiga continua valendo onde ela nasceu (os
 * selos de streaming no card); aqui o selo VIROU o botao.
 *
 * NAO COPIAMOS OS ARQUIVOS DAQUELE SITE. Eram PNGs hospedados no servidor
 * deles, sem licenca declarada — pegar assets do site de outra empresa nao e
 * licenca. O que foi reproduzido e o ESTILO, com os SVGs que este projeto ja
 * desenhava: sai nitido em qualquer tela, sem download nenhum, e com os logos
 * atuais das marcas.
 *
 * O CONTRASTE DO SIMBOLO E CALCULADO, NAO ESCOLHIDO. Cada marca declara a cor
 * do fundo; a cor do logo por cima sai da luminancia relativa (WCAG) dessa cor:
 * acima de 0,45 o simbolo e escuro, abaixo e branco. E por isso que o limao do
 * Kick (0,715) leva logo preto e o roxo do Twitch (0,176) leva branco — do
 * mesmo jeito que as duas marcas fazem.
 */
type Marca = {
  /** A cor do quadrado. `null` para quem nao tem cor propria (o X e preto). */
  fundo: string | null;
  /** Gradiente, quando a marca tem um. Vence o `fundo` quando existe. */
  gradiente?: string;
};

export const MARCAS: Record<string, Marca> = {
  // O preto do X nao aparece sobre o fundo quase preto do site, entao o selo
  // dele usa o cinza-carvao que a propria marca usa nos botoes.
  X: { fundo: "#16181C" },
  Facebook: { fundo: "#1877F2" },
  // O Instagram nao tem cor: tem um gradiente, e e ele que a marca usa desde
  // 2016. Em CSS ele sai igual, e sem imagem nenhuma.
  Instagram: {
    fundo: "#E4405F",
    gradiente:
      "linear-gradient(45deg, #F58529 0%, #FEDA77 25%, #DD2A7B 55%, #8134AF 80%, #515BD4 100%)",
  },
  YouTube: { fundo: "#FF0000" },
  TikTok: { fundo: "#010101" },
  Twitch: { fundo: "#9146FF" },
  Kick: { fundo: "#53FC18" },
  Discord: { fundo: "#5865F2" },
};

/**
 * O fundo da pagina NO TEMA ESCURO. E contra ele que o selo precisa aparecer.
 *
 * Continua sendo o escuro mesmo depois que o claro virou o padrao do site, e
 * isso e deliberado: o anel que esta conta decide e um dispositivo do tema
 * escuro — no claro ele e apagado inteiro. Perguntar "esta marca some no fundo
 * escuro?" e exatamente a pergunta certa para saber quem precisa de anel.
 */
const FUNDO_DA_PAGINA = "#0A0A0A";

/** Luminancia relativa (WCAG). Decide se o logo por cima e branco ou escuro. */
function luminancia(hex: string): number {
  const n = hex.replace("#", "");
  const canais = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
  const [r, g, b] = canais.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razao de contraste (WCAG) entre duas cores. 1 = identicas. */
function contraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/**
 * Abaixo disto o quadrado nao se separa do fundo da pagina e vira um logo
 * flutuando. Os selos coloridos ficam entre 4,3 e 5,0 de contraste; o X (1,11)
 * e o TikTok (1,05) estavam praticamente invisiveis como FORMA — o Joao viu no
 * X, cujo logo e fino, mas o TikTok tinha o mesmo defeito.
 */
const CONTRASTE_MINIMO = 1.5;

/**
 * O visual do selo de uma rede: fundo do quadrado, cor do logo e contorno.
 *
 * O CONTORNO E REGRA E NAO EXCECAO. A saida obvia para o X seria clarear o
 * fundo dele ate destacar, e ela esta errada: o preto E a marca, e um X cinza
 * medio numa fileira de cores certas seria o unico selo com a cor trocada. Em
 * vez disso, quem nao alcanca o `CONTRASTE_MINIMO` contra o fundo da pagina
 * ganha uma borda clara — o quadrado volta a ter forma e a marca continua a
 * dela. E vale para qualquer marca preta que entrar depois, sem ninguem
 * precisar lembrar de tratar o caso.
 *
 * Marca desconhecida cai num cinza neutro com logo branco — nao inventa cor, e
 * o selo continua legivel.
 */
/**
 * A cor do anel do selo, e ela e UMA SO desde 02/09/2026.
 *
 * Este valor nasceu como socorro da marca preta — sem ele, preto sobre o fundo
 * preto da pagina nao se separa. Quando o Joao pediu o anel em todos, a
 * primeira versao deu aos coloridos um tom mais fraco (0,14), com o argumento
 * de que ali o anel so amarra a fileira em vez de separar do fundo. Ele olhou e
 * disse que esperava "uma borda da mesma cor do X nos demais" — e a fileira e
 * de quem olha, nao de quem argumenta.
 *
 * DEIXOU DE SER EXPORTADO em 05/09/2026. Ele existia em dois lugares enquanto
 * o rodape tinha um modo preto-e-branco proprio, que pintava o anel por conta;
 * com o rodape de volta as cores das marcas, quem pinta o anel e so o
 * `seloDaMarca` logo abaixo.
 *
 * E BRANCO PORQUE E COISA DO TEMA ESCURO. No claro ele e apagado por variavel
 * (`--anel-do-selo`, no globals.css): sobre branco, a caixa quase preta do X ja
 * se separa sozinha, e o aro so sujava.
 */
const ANEL_DO_SELO = "rgba(255,255,255,0.22)";

export function seloDaMarca(nome: string): {
  fundo: string;
  simbolo: string;
  borda: string | null;
} {
  const marca = MARCAS[nome];
  if (!marca) return { fundo: "#3F3F46", simbolo: "#FFFFFF", borda: null };
  const solida = marca.fundo ?? "#3F3F46";
  return {
    fundo: marca.gradiente ?? solida,
    // O gradiente do Instagram e claro no meio e escuro nas pontas; o logo
    // branco e o que a propria marca usa por cima dele.
    simbolo: !marca.gradiente && luminancia(solida) > 0.45 ? "#0A0A0A" : "#FFFFFF",
    // O gradiente nunca precisa: ele ja tem uma ponta clara.
    borda:
      !marca.gradiente && contraste(solida, FUNDO_DA_PAGINA) < CONTRASTE_MINIMO
        ? ANEL_DO_SELO
        : null,
  };
}
