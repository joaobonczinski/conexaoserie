import type { Metadata } from "next";
import { MARCA } from "./marca";

/**
 * Os metadados de uma pagina, montados num lugar so.
 *
 * Veio do Conexão Anime, onde nasceu de um defeito medido: pagina sem
 * `openGraph` proprio herdava o bloco da raiz INTEIRO (compartilhar /ranking/
 * mostrava a home), e pagina com `openGraph` proprio ficava SEM IMAGEM, porque
 * declarar o objeto substitui o herdado. Com o objeto saindo daqui, pagina nova
 * nao tem como nascer com nenhum dos dois defeitos.
 */

/**
 * A imagem padrao de compartilhamento: o `src/app/opengraph-image.tsx`.
 *
 * O caminho e escrito aqui porque declarar `openGraph` desliga a convencao do
 * arquivo — e precisamos declarar. Mexer num e mexer no outro.
 */
const IMAGEM_PADRAO = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Conexão Série — o calendário de séries no horário de Brasília.",
};

/**
 * O titulo da aba e do Google, com a marca no fim.
 *
 * A regra do site inteiro: **`|` separa da MARCA, `—` separa do SUBTITULO**.
 * A checagem por conteudo evita "Apoiar o Conexão Série | Conexão Série".
 */
export function tituloComMarca(titulo: string): string {
  return titulo.includes(MARCA) ? titulo : `${titulo} | ${MARCA}`;
}

type Entrada = {
  /** O titulo da pagina, SEM a marca — quem poe e o `tituloComMarca`. */
  titulo: string;
  descricao: string;
  /** Caminho com barra no fim. Vira o canonical E o og:url, sempre iguais. */
  url: string;
  /** So quando o texto do compartilhamento merece ser diferente do da aba. */
  tituloCompartilhado?: string;
  descricaoCompartilhada?: string;
  /** A capa do artigo. Sem ela, entra a imagem do site — nunca imagem nenhuma. */
  imagem?: string | null;
  artigo?: { publicadoEm: string; atualizadoEm?: string };
};

export function metadadosDaPagina(e: Entrada): Metadata {
  return {
    title: tituloComMarca(e.titulo),
    description: e.descricao,
    alternates: { canonical: e.url },
    openGraph: {
      // SEM a marca: o `siteName` ja a desenha numa linha propria do cartao.
      title: e.tituloCompartilhado ?? e.titulo,
      description: e.descricaoCompartilhada ?? e.descricao,
      url: e.url,
      siteName: MARCA,
      locale: "pt_BR",
      type: e.artigo ? "article" : "website",
      images: [e.imagem ?? IMAGEM_PADRAO],
      ...(e.artigo
        ? {
            publishedTime: e.artigo.publicadoEm,
            modifiedTime: e.artigo.atualizadoEm,
          }
        : {}),
    },
    twitter: { card: "summary_large_image" },
  };
}
