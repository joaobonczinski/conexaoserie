import type { Metadata } from "next";
import Link from "next/link";
import { EMAIL_CONTATO, MARCA } from "@/lib/marca";
import { ATUALIZADO_EM, ATUALIZADO_EM_TEXTO, IDADE_MINIMA } from "@/lib/legal";
import { metadadosDaPagina } from "@/lib/metadados";

// Politica de privacidade.
//
// A REGRA DO ANIME VALE AQUI: SO ENTRA O QUE O CODIGO FAZ. Qualquer coisa que
// trate dado novo muda este arquivo JUNTO, no mesmo commit, e a data em
// legal.ts muda com ele. A conta e a Minha lista entraram em 29/09/2026, e o
// texto veio do Conexão Filme, com o TVmaze no lugar do TMDB.
//
// O LOGIN E SO PELO GOOGLE, como no lancamento do Filme. O Worker sabe fazer o
// do Discord, mas o texto fala do que o site oferece: no dia em que as chaves
// do Discord chegarem, ele entra aqui, e a data muda — e um servico novo
// recebendo dados.

export const metadata: Metadata = metadadosDaPagina({
  titulo: "Política de Privacidade",
  descricao: `Que dados o ${MARCA} trata: sem conta, nenhum que identifique você. Com conta, só o login e a sua lista. Sem anúncios e sem rastreadores.`,
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

const Destaque = ({ children }: { children: React.ReactNode }) => (
  <strong className="font-semibold text-tinta">{children}</strong>
);

const Email = () => (
  <a href={`mailto:${EMAIL_CONTATO}`} className="text-tinta underline underline-offset-2">
    {EMAIL_CONTATO}
  </a>
);

export default function Privacidade() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-24 pt-6">
      <h1 className="text-2xl font-bold tracking-tight text-tinta">Política de Privacidade</h1>
      <p className="mt-2 text-xs text-fraco">
        Última atualização em <time dateTime={ATUALIZADO_EM}>{ATUALIZADO_EM_TEXTO}</time>.
      </p>

      {/* O resumo vem ANTES do documento: quem abre uma politica quer saber
          "voces me rastreiam?", e enterrar a resposta e o jeito de ninguem ler. */}
      <div className="mt-6 rounded-xl border border-linha bg-realce p-5">
        <p className="text-sm font-medium text-tinta">O resumo</p>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-suave">
          <li>
            • O calendário, os próximos e o ranking <Destaque>funcionam sem conta</Destaque>, e
            sem conta o site não guarda nada que identifique você.
          </li>
          <li>
            • Quem quer montar a <Destaque>Minha lista</Destaque> entra com o Google. Aí
            guardamos o seu nome, e-mail e foto, e a sua lista — e nada disso é vendido nem
            mostrado para ninguém.
          </li>
          <li>
            • Não existe anúncio, Google Analytics, pixel do Facebook nem qualquer outro
            rastreador. <Destaque>Nenhum.</Destaque>
          </li>
        </ul>
      </div>

      <Secao titulo="Quem é responsável">
        <p>
          O {MARCA} é um projeto pessoal, mantido por João no tempo livre. Ele é o controlador
          dos dados tratados aqui, nos termos da Lei Geral de Proteção de Dados (Lei
          13.709/2018). Qualquer assunto sobre dados (dúvida, correção, exclusão ou reclamação)
          vai para <Email />.
        </p>
      </Secao>

      <Secao titulo="Se você não tem conta">
        <p>
          Sem conta, o site não coleta nada que identifique você. Três coisas acontecem mesmo
          assim, e é honesto dizer:
        </p>
        <p>
          <Destaque>Hospedagem.</Destaque> O site roda na Cloudflare, que registra dados técnicos
          de acesso (endereço IP, navegador, horário) para entregar as páginas e barrar ataques.
          Esses registros são da Cloudflare.
        </p>
        <p>
          <Destaque>Pôsteres das séries.</Destaque> As imagens vêm do TVmaze e são carregadas
          direto do servidor dele pelo seu navegador. Ou seja: o seu IP chega ao TVmaze, do mesmo
          jeito que chegaria se você visitasse o site dele.
        </p>
        <p>
          <Destaque>Tema.</Destaque> A escolha entre tema claro e escuro fica gravada no seu
          próprio navegador, e só nele. Ela nunca é enviada para nós.
        </p>
        <p>As fontes do site são servidas pelo nosso próprio endereço: nada vai ao Google.</p>
      </Secao>

      <Secao titulo="Se você cria uma conta">
        <p>
          A conta existe para a Minha lista. O login é feito pelo <Destaque>Google</Destaque>,
          então <Destaque>o site nunca vê nem guarda a sua senha</Destaque>: ela fica com o
          Google, e nós recebemos só o que ele nos entrega:
        </p>
        <ul className="ml-1 space-y-1.5">
          <li>• o seu nome e a sua foto no Google;</li>
          <li>• o seu e-mail;</li>
          <li>
            • um identificador da sua conta no Google, um código sem significado que serve para
            reconhecer você quando voltar.
          </li>
        </ul>
        <p>
          Depois disso, guardamos a sua <Destaque>lista</Destaque>: as séries, a situação de cada
          uma (assistindo, quero ver, terminei, abandonei), a sua nota, as suas anotações e as
          datas em que você adicionou e em que marcou que terminou. <Destaque>Nada disso é
          público</Destaque>: não existe página de perfil, e ninguém além de você vê a sua lista,
          o seu nome ou o seu e-mail.
        </p>
      </Secao>

      <Secao titulo="Cookies">
        <p>
          O site usa <Destaque>um</Destaque> cookie, chamado{" "}
          <code className="text-tinta">sessao</code>, e ele só existe depois que você entra. É o
          que mantém você conectado entre uma página e outra. Ele dura 30 dias, não pode ser lido
          por JavaScript e não acompanha você para fora daqui.
        </p>
        <p>
          Durante o login existem também três cookies temporários, de no máximo 10 minutos: dois
          protegem o login contra fraude e o terceiro lembra para qual página você volta. Eles são
          apagados assim que o login termina.
        </p>
        <p>
          Não há cookie de publicidade, de medição de audiência ou de rede social. Por isso não há
          banner de cookies: cookie estritamente necessário para o serviço funcionar dispensa
          consentimento.
        </p>
      </Secao>

      <Secao titulo="Por que podemos tratar esses dados">
        <p>A LGPD exige uma base legal para cada tratamento. Aqui elas são duas:</p>
        <ul className="ml-1 space-y-1.5">
          <li>
            • <Destaque>Execução do que você pediu</Destaque>: a conta, a lista e a sessão existem
            porque sem elas a Minha lista não funciona.
          </li>
          <li>
            • <Destaque>Interesse legítimo</Destaque>: manter o site no ar e evitar abuso, como o
            limite de alterações por minuto de cada conta.
          </li>
        </ul>
      </Secao>

      <Secao titulo="Com quem os dados são compartilhados">
        <p>
          <Destaque>Nada é vendido, alugado ou cedido para publicidade.</Destaque> Os únicos
          terceiros envolvidos são os que fazem o site funcionar:
        </p>
        <ul className="ml-1 space-y-1.5">
          <li>
            • <Destaque>Google</Destaque>: processa o login.
          </li>
          <li>
            • <Destaque>Cloudflare</Destaque>: hospeda o site e o banco de dados.
          </li>
          <li>
            • <Destaque>TVmaze</Destaque>: fornece os dados e os pôsteres das séries. Quando você
            busca uma série na Minha lista, o nosso servidor pergunta ao TVmaze pelo nome que você
            digitou, sem o seu IP e sem nada da sua conta.
          </li>
        </ul>
        <p>
          Esses serviços podem processar dados fora do Brasil. Ao usar o site com conta, você fica
          ciente dessa transferência internacional, que acontece só para o site funcionar.
        </p>
      </Secao>

      <Secao titulo="Por quanto tempo guardamos">
        <ul className="ml-1 space-y-1.5">
          <li>
            • <Destaque>A sua conta e a sua lista:</Destaque> enquanto a conta existir. Você decide
            quando isso acaba.
          </li>
          <li>
            • <Destaque>A sessão de login:</Destaque> 30 dias, ou até você sair.
          </li>
          <li>
            • <Destaque>As cópias de recuperação do banco:</Destaque> o banco da Cloudflare guarda
            um histórico para restaurar os dados em caso de pane, por até 30 dias. Uma conta
            apagada ainda existe nesse histórico até ele expirar sozinho, e ele só é usado para
            recuperar o site, nunca para trazer de volta uma conta que alguém apagou.
          </li>
        </ul>
      </Secao>

      <Secao titulo="Links para outros sites">
        <p>
          O site leva para as páginas das séries na Netflix, no Prime Video, no TVmaze e em outros
          lugares. Ao clicar, você sai do {MARCA}, e o que acontece lá segue a política de
          privacidade de cada um.
        </p>
      </Secao>

      <Secao titulo="Seus direitos">
        <p>
          A LGPD garante que você possa confirmar, acessar, corrigir e apagar os seus dados e
          saber com quem foram compartilhados. Aqui isso é direto:
        </p>
        <p>
          <Destaque>Ver:</Destaque> a página{" "}
          <Link href="/conta/" className="text-tinta underline underline-offset-2">
            Conta
          </Link>{" "}
          mostra o nome, o e-mail e a foto que temos, e a Minha lista mostra todo o resto.
        </p>
        <p>
          <Destaque>Apagar tudo:</Destaque> na página Conta existe o botão de apagar a conta. Ele
          apaga de verdade a conta, a lista inteira e o acesso em todos os aparelhos. Não há
          lixeira e não é preciso pedir por e-mail.
        </p>
        <p>
          <Destaque>Corrigir:</Destaque> a lista você edita na hora. Nome, foto e e-mail vêm do
          Google, então mudam lá e chegam aqui no próximo login.
        </p>
        <p>
          Para qualquer outro pedido, escreva para <Email />. Como este é um projeto de uma pessoa
          só, a resposta pode não ser imediata, mas ela vem.
        </p>
      </Secao>

      <Secao titulo="Idade mínima">
        <p>
          É preciso ter pelo menos {IDADE_MINIMA} anos para criar conta, a mesma idade exigida
          pelo Google para ter conta própria. O site não tem como verificar idade; se você é
          responsável por alguém menor e encontrar uma conta que não deveria existir, escreva para{" "}
          <Email /> que ela é removida. O calendário, os próximos e o ranking não pedem conta e
          podem ser usados por qualquer pessoa.
        </p>
      </Secao>

      <Secao titulo="Segurança">
        <p>
          Todo o site roda em HTTPS. A sua senha não existe aqui. Do seu acesso, o banco guarda só
          uma versão embaralhada e irreversível do código de sessão: mesmo que o banco vazasse,
          ninguém entraria na sua conta com o que está lá. Nenhum sistema é perfeito, e se algo
          acontecer que possa afetar você, você será avisado.
        </p>
      </Secao>

      <Secao titulo="Mudanças nesta política">
        <p>
          Quando o site ganhar uma função que trate dados de um jeito novo, este texto muda junto e
          a data no topo é atualizada.
        </p>
      </Secao>
    </main>
  );
}
