import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/marca";
import { enderecoDaSerie } from "@/lib/enderecos";
import { APOIAR_EM_BREVE } from "@/lib/navegacao";
import { carregarNovidades } from "@/lib/novidades";
import { chavesDasCategorias, enderecoDaLista } from "@/lib/ranking";
import { carregarSeries } from "@/lib/series";

/**
 * OBRIGATORIO com `output: "export"`: sem esta linha o build inteiro falha. O
 * Next trata sitemap como ROTA, e rota precisa dizer que e estatica.
 */
export const dynamic = "force-static";

/**
 * O mapa do site para os buscadores. So entra o que e publico e estavel — a
 * /calendario/ fica fora porque o canonical dela aponta para a home.
 *
 * `lastModified` NAO E O DIA DE HOJE em toda pagina: carimbar tudo a cada build
 * faria o site jurar, todo dia, que a Politica de Privacidade mudou — e o
 * buscador aprende a ignorar quem mente assim. So os artigos levam data, porque
 * e a unica que o site sabe de verdade.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const fixas: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/series/`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/estreias/`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/ranking/`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/ranking/no-ar/`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/novidades/`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/privacidade/`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/termos/`, changeFrequency: "yearly", priority: 0.2 },
  ];
  // O Apoiar so e anunciado quando tem onde clicar — ver `APOIAR_EM_BREVE`.
  if (!APOIAR_EM_BREVE) {
    fixas.push({ url: `${SITE_URL}/apoiar/`, changeFrequency: "yearly", priority: 0.3 });
  }

  const novidades: MetadataRoute.Sitemap = carregarNovidades().map((n) => ({
    url: `${SITE_URL}/novidades/${n.slug}/`,
    lastModified: new Date(n.atualizado ?? n.data),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  // Uma por serie. Sem `lastModified` pelo motivo do cabecalho: o site nao sabe
  // quando a pagina de uma serie mudou de verdade, so que ela e refeita todo dia.
  const series: MetadataRoute.Sitemap = carregarSeries().map((s) => ({
    url: `${SITE_URL}${enderecoDaSerie(s.slug)}`,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // O top de cada categoria: "melhores séries de terror" e o tipo de busca que
  // traz gente nova, e cada uma tem pagina propria por isso.
  const categorias: MetadataRoute.Sitemap = chavesDasCategorias().map((chave) => ({
    url: `${SITE_URL}${enderecoDaLista(chave)}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...fixas, ...categorias, ...series, ...novidades];
}
