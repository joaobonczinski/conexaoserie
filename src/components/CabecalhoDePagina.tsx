import { LINHA_DE_CONTEXTO } from "@/lib/layout";

/**
 * O CABECALHO DE UMA PAGINA — a mesma pilha em todas.
 *
 * POR QUE ELE EXISTE, e o motivo e mais forte do que "evitar repeticao": o
 * alinhamento entre telas era um CONTRATO ESCRITO A MAO. O Joao pediu em
 * 29/08/2026 que "quando eu mudar de temporada os cards nao devem mudar de
 * lugar, apenas os animes", e a solucao da v1 foram duas constantes de altura
 * (`LINHA_DE_CONTEXTO` e `CABECALHO_DA_FILA`) que cada pagina precisava lembrar
 * de aplicar, na ordem certa, com os mesmos tamanhos de fonte.
 *
 * Isso quebrou pelo menos duas vezes, e sempre do mesmo jeito: uma tela ganhava
 * um subtitulo que a outra nao tinha, e o primeiro card nascia 24px mais abaixo.
 * O commit de 05/09/2026 conserta o caso da /calendario/ exatamente assim —
 * dando a ela "a MESMA PILHA" da temporada em vez de compensar com constante,
 * porque "compensar com constante faz as duas telas baterem por acidente
 * aritmetico; ter a mesma pilha faz elas baterem por construcao".
 *
 * ESTE COMPONENTE E ESSA PILHA. Enquanto as telas que precisam bater usarem
 * ele, elas batem por construcao e ninguem precisa lembrar de nada.
 *
 * O `subtitulo` e RENDERIZADO SEMPRE, mesmo vazio, e e essa a peca central: era
 * a ausencia dele numa tela e a presenca na outra que produzia os 24px.
 */
export default function CabecalhoDePagina({
  etiqueta,
  titulo,
  acao,
  subtitulo,
  nota,
  children,
}: {
  /** Texto miudo em caixa alta acima do titulo. Diz de que TIPO e a tela. */
  etiqueta?: string;
  titulo: string;
  /**
   * Um botao na mesma linha do titulo, a direita — hoje, so o "Minha conta"
   * da /minha-lista/, como no Conexão Anime e no Filme. Sem ele, o titulo fica
   * sozinho, igual a antes.
   */
  acao?: React.ReactNode;
  /** Uma linha curta abaixo do titulo. Sempre ocupa espaco, mesmo vazia. */
  subtitulo?: string;
  /**
   * A ressalva de contexto — o horario ser da TV japonesa, a procedencia do
   * dado. Ocupa altura RESERVADA (ver `LINHA_DE_CONTEXTO`), entao uma frase que
   * quebra em duas linhas numa largura e em uma noutra nao desloca a grade.
   */
  nota?: React.ReactNode;
  /** O que entra ENTRE o subtitulo e a nota — hoje, so o menu de temporadas. */
  children?: React.ReactNode;
}) {
  return (
    <header>
      {etiqueta ? <p className="etiqueta mb-2">{etiqueta}</p> : null}

      {acao ? (
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-tinta sm:text-3xl">{titulo}</h1>
          {acao}
        </div>
      ) : (
        <h1 className="text-2xl font-bold tracking-tight text-tinta sm:text-3xl">{titulo}</h1>
      )}

      {/* SEMPRE PRESENTE, mesmo sem texto: o espaco em branco e o que faz as
          telas irmas comecarem no mesmo pixel. Ver o cabecalho deste arquivo. */}
      <p className="mt-1 min-h-[21px] text-sm text-suave">{subtitulo ?? " "}</p>

      {children}

      {nota ? (
        <p className={`${LINHA_DE_CONTEXTO} text-fraco`}>{nota}</p>
      ) : (
        <div className={LINHA_DE_CONTEXTO} aria-hidden />
      )}
    </header>
  );
}
