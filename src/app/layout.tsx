import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Mono, M_PLUS_2 } from "next/font/google";
import BarraDeAbas from "@/components/BarraDeAbas";
import Cabecalho from "@/components/Cabecalho";
import Rodape from "@/components/Rodape";
import { MARCA, SITE_URL } from "@/lib/marca";
import "./globals.css";

/* ===========================================================================
   AS TRES FONTES DO CONEXÃO ANIME, pelos mesmos motivos:

     M PLUS 2            texto e interface
     Bricolage Grotesque titulos, marca
     DM Mono             horario, contagem regressiva, nota

   A mono so para numero e o que impede a linha de tremer a cada segundo da
   contagem: em fonte proporcional cada digito tem largura propria.

   A DIFERENCA E O SUBCONJUNTO DA M PLUS 2: no anime ela desenha o japones, que
   era o titulo de todo card; aqui os nomes chegam em alfabeto latino, entao so
   o `latin` e baixado. Mesma cara, uma fracao do peso.

   `next/font` baixa no build e serve do nosso dominio: nenhuma requisicao ao
   Google em tempo de execucao — nenhum IP de visitante entregue a terceiro.
   =========================================================================== */

const texto = M_PLUS_2({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--fonte-texto",
  display: "swap",
});

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--fonte-display",
  display: "swap",
});

const mono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--fonte-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // "calendário de séries" entra como descricao porque e o termo que o
  // brasileiro digita no Google.
  title: "Conexão Série — calendário de séries no horário de Brasília",
  // COMECA PELO TERMO DE BUSCA, a licao do anime: o Google marca em negrito o
  // que casa com a busca, e o comeco e lido antes de qualquer decisao de
  // continuar. Abaixo de 155 caracteres, que e onde o Google corta.
  description:
    "Calendário de séries no seu fuso: a hora em que cada episódio chega à Netflix, HBO Max, Disney+ e Prime Video no Brasil, estreias e ranking.",
  alternates: { canonical: "/" },
  openGraph: {
    title: MARCA,
    description:
      "O que sai hoje, o que estreia e o que vale a pena. A hora em que cada episódio chega ao streaming no Brasil, já no seu fuso.",
    url: "/",
    siteName: MARCA,
    locale: "pt_BR",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

/**
 * O ANTIPISCADA DO TEMA, igual ao do anime: o claro e o padrao e nao precisa de
 * atributo; quem escolheu escuro recebe o atributo ANTES da primeira pintura.
 * Sem isso, o site claro piscaria a cada visita de quem prefere escuro.
 *
 * O conteudo e uma constante deste arquivo, nao vem de fora — nao ha o que
 * injetar.
 */
const ANTIPISCADA =
  "try{if(localStorage.getItem('tema')==='escuro')document.documentElement.dataset.tema='escuro'}catch(e){}";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`h-full ${texto.variable} ${display.variable} ${mono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: ANTIPISCADA }} />
      </head>
      <body className="min-h-full">
        <Cabecalho />
        {children}
        {/* No layout, e nao na home: rodape e abas precisam ser alcancaveis de
            qualquer tela — a Politica de Privacidade inclusive. */}
        <Rodape />
        <BarraDeAbas />
      </body>
    </html>
  );
}
