import type { Metadata } from "next";
import { EMAIL_CONTATO, MARCA } from "@/lib/marca";
import { ATUALIZADO_EM, ATUALIZADO_EM_TEXTO } from "@/lib/legal";
import { metadadosDaPagina } from "@/lib/metadados";

// Politica de privacidade.
//
// A REGRA DO ANIME VALE AQUI: SO ENTRA O QUE O CODIGO FAZ. E o que este site faz
// e pouco — nao ha conta, nao ha cookie, nao ha rastreador —, entao a politica e
// curta de verdade, e nao por preguica. Se um dia entrar login, medicao de
// audiencia ou e-mail, este arquivo muda NO MESMO COMMIT, e a data em legal.ts
// muda junto.

export const metadata: Metadata = metadadosDaPagina({
  titulo: "Política de Privacidade",
  descricao:
    "Que dados o Conexão Série trata e por quê. Sem conta, sem cookies, sem anúncios e sem rastreadores.",
  url: "/privacidade/",
});

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-base font-semibold text-tinta">{titulo}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-suave">{children}</div>
    </section>
  );
}

export default function Privacidade() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6">
      <h1 className="text-2xl font-bold tracking-tight text-tinta">
        Política de Privacidade
      </h1>
      <p className="mt-2 text-xs text-fraco">
        Última atualização em <time dateTime={ATUALIZADO_EM}>{ATUALIZADO_EM_TEXTO}</time>.
      </p>

      {/* O resumo vem ANTES do documento: quem abre uma politica quer saber
          "voces me rastreiam?" e enterrar a resposta e o jeito de ninguem ler. */}
      <div className="mt-6 rounded-xl border border-linha bg-realce p-5">
        <p className="text-sm font-medium text-tinta">O resumo</p>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-suave">
          <li>
            • O site <strong>não tem conta nem cadastro</strong>. Não há o que
            você precise informar.
          </li>
          <li>
            • Não existe anúncio, Google Analytics, pixel do Facebook nem qualquer
            outro rastreador. <strong>Nenhum.</strong>
          </li>
          <li>
            • O site <strong>não usa cookies</strong>. Por isso não há aquele
            banner pedindo permissão.
          </li>
        </ul>
      </div>

      <Secao titulo="Quem é responsável">
        <p>
          O {MARCA} é um projeto pessoal, mantido por João no tempo livre. Ele é o
          controlador dos dados tratados aqui, nos termos da Lei Geral de Proteção
          de Dados (Lei 13.709/2018).
        </p>
        <p>
          Qualquer assunto relacionado a dados vai para{" "}
          <a
            href={`mailto:${EMAIL_CONTATO}`}
            className="text-tinta underline underline-offset-2"
          >
            {EMAIL_CONTATO}
          </a>
          .
        </p>
      </Secao>

      <Secao titulo="O que acontece quando você abre o site">
        <p>
          O site não coleta nada que identifique você. Três coisas acontecem mesmo
          assim, e é honesto dizer:
        </p>
        <p>
          <strong className="font-medium text-tinta">Hospedagem.</strong> O site
          roda na Cloudflare, que registra dados técnicos de acesso — endereço IP,
          navegador, horário — para entregar as páginas e barrar ataques. Isso é do
          funcionamento da internet, e esses registros são da Cloudflare.
        </p>
        <p>
          <strong className="font-medium text-tinta">Pôsteres das séries.</strong>{" "}
          As imagens vêm do TVmaze e são carregadas direto do servidor dele pelo
          seu navegador. Ou seja: o seu IP chega ao TVmaze quando você abre o
          calendário, do mesmo jeito que chegaria se você visitasse o site dele.
        </p>
        <p>
          <strong className="font-medium text-tinta">A escolha do tema.</strong>{" "}
          Se você troca para o tema escuro, o site guarda essa escolha no seu
          próprio navegador, e só nele. Ela nunca sai do seu aparelho e não
          identifica ninguém.
        </p>
      </Secao>

      <Secao titulo="Links para outros sites">
        <p>
          O site leva para as páginas das séries na Netflix, no Prime Video e em
          outras plataformas. Ao clicar, você sai do {MARCA}, e o que acontece lá
          segue a política de privacidade de cada uma.
        </p>
      </Secao>

      <Secao titulo="Seus direitos">
        <p>
          Como o site não guarda dado pessoal de ninguém, não há o que consultar,
          corrigir ou apagar do nosso lado. Se tiver qualquer dúvida sobre isso, é
          só escrever para o e-mail acima.
        </p>
      </Secao>

      <Secao titulo="Mudanças nesta política">
        <p>
          Se o site passar a tratar algum dado novo, esta página muda antes, e a
          data lá em cima muda junto.
        </p>
      </Secao>
    </main>
  );
}
