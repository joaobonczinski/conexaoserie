// Nome do site num lugar so.
//
// O Conexão Série e o segundo da familia, depois do Conexão Anime. O nome segue
// a mesma logica de la: "Conexão" nomeia a relacao, e nao a tela — conecta voce
// ao que esta no ar. O dominio e os @ nas redes foram escolhidos iguais aos do
// anime de proposito, para a familia se reconhecer.

export const MARCA = "Conexão Série";

/**
 * A caixa de contato do site.
 *
 * AINDA NAO FUNCIONA: so passa a existir quando o dominio for registrado e o
 * Email Routing da Cloudflare for ligado nele, como foi feito no anime. Ate la,
 * quem escrever para ca recebe o e-mail de volta.
 *
 * Nao e decoracao: a Politica de Privacidade o aponta como o canal para pedir
 * qualquer coisa sobre dados (LGPD, art. 18). Se ele parar de funcionar, a
 * politica passa a prometer algo que o site nao cumpre.
 */
export const EMAIL_CONTATO = "contato@conexaoserie.com.br";

/** O mesmo @ em todas as redes — o mesmo criterio do Conexão Anime. */
export const HANDLE = "conexaoseriebr";

/**
 * As redes que aparecem no rodape. VAZIO ATE CADA PERFIL EXISTIR.
 *
 * O @ foi conferido livre nas redes, mas conferir nao e criar: um link para um
 * perfil que ainda nao existe da 404, ou pior, cai no perfil de outra pessoa que
 * pegar o nome antes. Quando criar um, descomente a linha dele.
 *
 * O nome de cada uma e a CHAVE que acha o icone (`ICONE_DA_REDE`, no
 * Icones.tsx) e a cor (`MARCAS`, no cores-de-marca.ts). O YouTube e o TikTok
 * levam o `@` na URL e os outros nao: e como cada servico monta o endereco.
 */
export const REDES: readonly { nome: string; url: string }[] = [
  // { nome: "X", url: `https://x.com/${HANDLE}` },
  // { nome: "Facebook", url: `https://facebook.com/${HANDLE}` },
  // { nome: "Instagram", url: `https://instagram.com/${HANDLE}` },
  // { nome: "YouTube", url: `https://youtube.com/@${HANDLE}` },
  // { nome: "TikTok", url: `https://tiktok.com/@${HANDLE}` },
];

/**
 * Convite do Discord, PERMANENTE (expirar "Nunca", usos "Ilimitado").
 *
 * `null` enquanto nao existe, e nada que dependa dele aparece: e melhor a
 * comunidade nao ser mencionada do que ser mencionada com um link quebrado.
 */
export const DISCORD: string | null = null;

/**
 * Formas de apoiar o site. Cada uma so aparece na tela quando existe.
 *
 * COMECA TUDO `null` de proposito, e nao com valor de exemplo: dado de mentira
 * aqui vira uma pagina de doacao publicada com uma conta que nao e do Joao — o
 * pior tipo de bug possivel nesta pagina. A pagina do LivePix do anime
 * (`conexaoanimebr`) NAO foi copiada para ca: cada site recebe na sua.
 */
export const APOIO: { livepix: string | null; paypal: string | null } = {
  livepix: null,
  paypal: null,
};

/**
 * Endereco publico do site. E a base de todo canonical e de todo og:url.
 *
 * Sem `www`: o canonical precisa ser UM endereco so, senao o Google trata as
 * duas versoes como paginas diferentes com o mesmo conteudo.
 */
export const SITE_URL = "https://conexaoserie.com.br";

/** O site irmao, linkado no rodape. */
export const SITE_ANIME = "https://conexaoanime.com.br";
