// Leitura dos artigos da secao Novidades — o mesmo desenho do Conexão Anime.
//
// Roda SO no build, nunca no navegador (usa `node:fs`). Por isso a secao e HTML
// estatico de verdade: o texto esta dentro do arquivo que o Google baixa.
//
// Os artigos sao markdown em `src/content/novidades/`. Ficarem no repositorio e
// o que permite publicar sem admin nenhum: da para escrever pelo proprio GitHub,
// inclusive pelo celular, e o build republica sozinho.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

const PASTA = join(process.cwd(), "src/content/novidades");

export type Novidade = {
  /** Vem do nome do arquivo: `guia-outono-2026.md` -> `guia-outono-2026`. */
  slug: string;
  titulo: string;
  /** Uma frase. Vira a meta description e a chamada na lista. */
  resumo: string;
  /** ISO curto, `2026-07-27`. */
  data: string;
  /** Preenchido so quando o texto muda depois de publicado. */
  atualizado: string | null;
  autor: string;
  /** Miniatura do artigo, em /public, ou null. */
  capa: string | null;
  /** HTML ja renderizado a partir do markdown. */
  html: string;
};

/**
 * Formata `2026-07-27` como "27 de julho de 2026", a partir dos pedacos da
 * string e NAO com `new Date(...)`: data sem hora e lida como meia-noite UTC,
 * que no Brasil e o dia anterior.
 */
export function formatarData(iso: string): string {
  const MESES = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  const [ano, mes, dia] = iso.split("-").map(Number);
  return `${dia} de ${MESES[mes - 1]} de ${ano}`;
}

/** A data de hoje (AAAA-MM-DD) no fuso do site, nao no da maquina do build. */
function hojeEmSaoPaulo(): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
}

function ler(arquivo: string): Novidade | null {
  const cru = readFileSync(join(PASTA, arquivo), "utf8");
  const { data, content } = matter(cru);

  // Rascunho nao existe para o site: fora da lista, fora do sitemap e sem
  // pagina gerada.
  if (data.rascunho === true) return null;

  // Data no futuro e AGENDAMENTO: o artigo entra no ar no primeiro build depois
  // dela. Como o bot da agenda commita todo dia, na pratica e no dia certo.
  if (String(data.data ?? "") > hojeEmSaoPaulo()) return null;

  return {
    slug: arquivo.replace(/\.md$/, ""),
    titulo: String(data.titulo ?? "Sem título"),
    resumo: String(data.resumo ?? ""),
    data: String(data.data ?? ""),
    atualizado: data.atualizado ? String(data.atualizado) : null,
    autor: String(data.autor ?? ""),
    capa: data.capa ? String(data.capa) : null,
    // O markdown e escrito pelo dono do site, entao o HTML gerado e confiavel.
    // Se um dia passar texto de visitante por aqui, precisa de sanitizacao.
    //
    // `breaks: true` faz UM Enter virar quebra de linha — o que se digita e o
    // que aparece, como no GitHub e no Discord.
    html: marked.parse(content, { async: false, breaks: true }),
  };
}

/** Todos os artigos publicados, do mais novo para o mais antigo. */
export function carregarNovidades(): Novidade[] {
  let arquivos: string[];
  try {
    arquivos = readdirSync(PASTA).filter((n) => n.endsWith(".md"));
  } catch {
    // Pasta ainda nao existe: secao vazia, nao erro de build.
    return [];
  }
  return arquivos
    .map(ler)
    .filter((n): n is Novidade => n !== null)
    .sort((a, b) => b.data.localeCompare(a.data));
}

export function buscarNovidade(slug: string): Novidade | undefined {
  return carregarNovidades().find((n) => n.slug === slug);
}
