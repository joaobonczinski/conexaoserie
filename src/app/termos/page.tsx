import type { Metadata } from "next";
import Link from "next/link";
import { EMAIL_CONTATO, MARCA } from "@/lib/marca";
import { ATUALIZADO_EM, ATUALIZADO_EM_TEXTO } from "@/lib/legal";
import { metadadosDaPagina } from "@/lib/metadados";

// Termos de uso. Curto pelo mesmo motivo da politica de privacidade: o site
// nao tem conta, nao tem pagamento e nao recebe texto de ninguem. O que precisa
// estar dito e o limite do que ele promete — o horario e uma previsao.

export const metadata: Metadata = metadadosDaPagina({
  titulo: "Termos de Uso",
  descricao: "As regras de uso do Conexão Série e o limite do que o calendário promete.",
  url: "/termos/",
});

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-base font-semibold text-tinta">{titulo}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-suave">{children}</div>
    </section>
  );
}

export default function Termos() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6">
      <h1 className="text-2xl font-bold tracking-tight text-tinta">Termos de Uso</h1>
      <p className="mt-2 text-xs text-fraco">
        Última atualização em <time dateTime={ATUALIZADO_EM}>{ATUALIZADO_EM_TEXTO}</time>.
      </p>

      <Secao titulo="O que é o site">
        <p>
          O {MARCA} é um calendário de séries: mostra quando cada episódio chega
          ao streaming no Brasil, as estreias e as séries mais bem avaliadas. É
          gratuito, não tem anúncios e é mantido por uma pessoa só, no tempo
          livre.
        </p>
      </Secao>

      <Secao titulo="Os horários são uma previsão">
        <p>
          Nas séries de TV, o horário é o da exibição americana, convertido para
          o seu fuso. No streaming, é o horário em que cada plataforma costuma
          liberar episódios no Brasil. As plataformas mudam datas e horários sem
          aviso, e às vezes lançam uma série fora do padrão delas.
        </p>
        <p>
          Por isso o calendário é um guia, e não uma garantia: o site não se
          responsabiliza por um episódio que saiu antes ou depois do horário
          mostrado. Se você viu um horário errado, avise pelo{" "}
          <a href={`mailto:${EMAIL_CONTATO}`} className="text-tinta underline underline-offset-2">
            e-mail de contato
          </a>
          .
        </p>
      </Secao>

      <Secao titulo="De onde vêm os dados">
        <p>
          A agenda, as notas e os pôsteres vêm do{" "}
          <a
            href="https://www.tvmaze.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-tinta underline underline-offset-2"
          >
            TVmaze
          </a>
          , sob a licença CC BY-SA. O {MARCA} não é afiliado ao TVmaze nem a
          nenhuma plataforma de streaming. Nomes, marcas e imagens das séries e das
          plataformas pertencem aos seus donos.
        </p>
      </Secao>

      <Secao titulo="Privacidade">
        <p>
          O site não tem conta, não usa cookies e não tem rastreadores. Os
          detalhes estão na{" "}
          <Link href="/privacidade/" className="text-tinta underline underline-offset-2">
            Política de Privacidade
          </Link>
          .
        </p>
      </Secao>

      <Secao titulo="Mudanças">
        <p>
          Estes termos podem mudar quando o site mudar. A data lá em cima diz
          quando foi a última vez.
        </p>
      </Secao>
    </main>
  );
}
