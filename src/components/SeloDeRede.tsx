import { seloDaMarca } from "@/lib/cores-de-marca";

/**
 * O quadradinho de uma rede: a caixa, o anel e o logo por cima.
 *
 * NASCEU DE UMA REFERENCIA. O Joao mandou o rodape de outro site e disse "acho
 * muito bonito a qualidade e a cor deles" — eram PNGs de icone social em
 * quadrado arredondado, cada um na cor da marca. Os arquivos de la nao vieram
 * junto (eram assets hospedados, sem licenca declarada); veio a FORMA, montada
 * com os SVGs que este projeto ja tinha.
 *
 * COR EM TODO LUGAR, e isto REVERTE uma divisao que durou tres dias.
 *
 * De 02/09 a 05/09/2026 havia duas aparencias: cor no perfil e no formulario de
 * redes, preto e branco no rodape. O argumento era CONTEXTO, e ele continua
 * verdadeiro no que dizia — no rodape os quatro selos ficam lado a lado e sao
 * lidos como um grupo, e ali o que amarra a fileira e serem identicos; no
 * perfil cada selo aparece colado no @ de uma rede diferente, e ali a cor e o
 * que faz reconhecer o servico antes de ler o nome.
 *
 * O QUE MUDOU NAO FOI O ARGUMENTO, FOI O FUNDO. Quatro caixas escuras iguais
 * num site escuro sao discretas: elas encostam no fundo, e a fileira se le como
 * uma barra de rodape. Com o tema claro virando o padrao do site em 04/09, o
 * mesmo bloco passou a ser a coisa mais escura de um rodape branco — de
 * discreto virou o carimbo mais pesado da pagina. O Joao ligou as duas coisas
 * sozinho: "depois da minha decisao de tornar o tema branco como padrao, eu
 * acho melhor voltar para os icones coloridos das sociais no rodape".
 *
 * Fica a licao, que e mais util que a regra: aquele "contexto" era o CONTEXTO
 * DO TEMA ESCURO escrito como se fosse geral. Decisao de cor tomada num tema so
 * envelhece mal quando o outro tema vira o padrao.
 *
 * O CAMINHO ATE O ANEL vale ser guardado, porque ele explica o codigo abaixo.
 * Ele olhou a fileira e disse que o X parecia menor; medi com `getBBox()` e era
 * verdade (20,0 de altura contra 24,0 do Instagram), porque o X era o unico com
 * reducao no codigo. Corrigido o tamanho, ele pediu o anel em todos — e o anel
 * branco sumia nas caixas claras, porque ele existe para separar preto de um
 * fundo preto. So entao a raiz apareceu: FUNDO DE COR DIFERENTE EM CADA SELO e
 * o que impede uma FILEIRA de parecer uma coisa so.
 */
export default function SeloDeRede({
  nome,
  Icone,
  tamanho = "md",
}: {
  nome: string;
  Icone: (p: {
    className?: string;
    style?: React.CSSProperties;
  }) => React.ReactElement;
  /** `sm` no campo de edicao, `md` no perfil, `lg` no rodape. */
  tamanho?: "sm" | "md" | "lg";
}) {
  const marca = seloDaMarca(nome);

  const caixa =
    tamanho === "lg"
      ? "h-8 w-8 rounded-xl"
      : tamanho === "md"
        ? "h-7 w-7 rounded-lg"
        : "h-6 w-6 rounded-md";
  const icone =
    tamanho === "lg" ? "h-4 w-4" : tamanho === "md" ? "h-3.5 w-3.5" : "h-3 w-3";

  return (
    <span
      aria-hidden
      // `background` e nao `backgroundColor`: o Instagram vem como gradiente, e
      // a propriedade curta aceita os dois sem o componente precisar saber qual
      // dos dois chegou.
      //
      // O anel e `inset` e nao `border`: assim ele nao muda o TAMANHO do selo.
      // Com `border` cada um cresceria 3px e a fileira precisaria ser remedida.
      // 1,5px e nao 2: num selo de 32px o anel e moldura, nao contorno — a 2px
      // ele come a area do logo.
      //
      // O ANEL SO EXISTE ONDE RESOLVE ALGO — marca escura que sem ele nao se
      // separa do fundo (hoje, so o X). Em cima de azul, roxo ou do gradiente
      // do Instagram ele nao aparece; foi o Joao quem viu isso, quando o anel
      // ainda era de todos.
      //
      // E HOJE ELE E UM DISPOSITIVO DO TEMA ESCURO. Quem decide e o
      // `seloDaMarca`, olhando o fundo ESCURO da pagina, e no tema claro o anel
      // e apagado por variavel (`--anel-do-selo`, no globals.css): sobre
      // branco, a caixa quase preta do X ja se separa sozinha e o aro so
      // sujava. A cor passa por variavel e nao literal justamente para o tema
      // poder apaga-la — regra de folha de estilo perde de `style` inline, mas
      // o inline le a variavel.
      style={{
        background: marca.fundo,
        boxShadow: marca.borda
          ? `inset 0 0 0 1.5px var(--anel-do-selo, ${marca.borda})`
          : undefined,
      }}
      className={`inline-grid shrink-0 place-items-center ${caixa}`}
    >
      <Icone className={icone} style={{ color: marca.simbolo }} />
    </span>
  );
}
