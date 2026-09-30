import LinkQueSobe from "./LinkQueSobe";
import { NomeDaMarca, SimboloDaMarca } from "./Marca";
import SeloDeRede from "./SeloDeRede";
import { ICONE_DA_REDE, IconeDiscord, IconeEmail } from "@/components/Icones";
import { APOIAR_EM_BREVE, GRUPOS_DO_RODAPE } from "@/lib/navegacao";
import { DISCORD, EMAIL_CONTATO, MARCA, REDES, SITE_ANIME } from "@/lib/marca";

/* ===========================================================================
   O RODAPE, em todas as paginas — o do Conexão Anime, com duas pecas a mais.

   O CREDITO DO TVMAZE NAO E CORTESIA: e a condicao da licenca (CC BY-SA) que
   deixa o site usar os dados. Ela pede "um link para o TVmaze de dentro do
   site", e o rodape e o unico lugar que esta em todas as paginas.

   O LINK PARA O CONEXÃO ANIME e a familia se apresentando. Quem acompanha
   serie tem boa chance de acompanhar anime, e a recíproca e o que faz dois
   sites pequenos crescerem juntos em vez de um de cada vez.
   =========================================================================== */

const ANO = new Date().getFullYear();

export default function Rodape() {
  const temRedes = REDES.length > 0 || DISCORD !== null;

  return (
    <footer className="mt-20 border-t border-linha bg-cartao">
      <div className="mx-auto w-full max-w-[78rem] px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(2,1fr)]">
          <div>
            <div className="flex items-center gap-2.5">
              <SimboloDaMarca className="h-8 w-8 text-acento" />
              <NomeDaMarca />
            </div>
            {/* A ORDEM DAS FRASES E A DAS PERGUNTAS que o site responde: o que
                sai, o que estreia, o que vale a pena. Depois a promessa. */}
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-tinta">
              O que sai hoje, o que estreia e o que vale a pena assistir.
            </p>
            <p className="mt-2.5 max-w-xs text-sm leading-relaxed text-suave">
              Calendário de séries no seu fuso, com a hora em que o episódio
              chega ao streaming no Brasil.
            </p>
            {/* "Sem cadastro" ate 29/09/2026. A conta chegou com a Minha lista,
                mas continua opcional: e isso que a frase precisa dizer. */}
            <p className="mt-2.5 max-w-xs text-sm leading-relaxed text-suave">
              Sem poluição, e sem cadastro para ver o calendário.
            </p>

            {/* As redes so aparecem quando existem — ver o comentario do REDES
                no marca.ts. */}
            {temRedes ? (
              <nav aria-label="Redes sociais" className="mt-5 flex items-center gap-2">
                {REDES.map(({ nome, url }) => {
                  const Icone = ICONE_DA_REDE[nome];
                  if (!Icone) return null;
                  return (
                    <a
                      key={nome}
                      href={url}
                      target="_blank"
                      rel="me noopener noreferrer"
                      aria-label={nome}
                      title={nome}
                      className="transition-transform hover:-translate-y-0.5"
                    >
                      <SeloDeRede nome={nome} Icone={Icone} tamanho="lg" />
                    </a>
                  );
                })}
                {DISCORD !== null ? (
                  <a
                    href={DISCORD}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Discord"
                    title="Discord"
                    className="transition-transform hover:-translate-y-0.5"
                  >
                    <SeloDeRede nome="Discord" Icone={IconeDiscord} tamanho="lg" />
                  </a>
                ) : null}
              </nav>
            ) : null}
          </div>

          {GRUPOS_DO_RODAPE.map((grupo) => (
            <div key={grupo.titulo}>
              <h2 className="etiqueta">{grupo.titulo}</h2>
              <ul className="mt-3 space-y-2">
                {grupo.itens.map((item) => (
                  <li key={item.href}>
                    <LinkQueSobe
                      href={item.href}
                      emBreve={item.emBreve}
                      className="text-sm text-suave transition-colors hover:text-acento"
                    >
                      {item.rotulo}
                    </LinkQueSobe>
                  </li>
                ))}
                {grupo.titulo === "O site" ? (
                  <li>
                    <a
                      href={SITE_ANIME}
                      className="text-sm text-suave transition-colors hover:text-acento"
                    >
                      Conexão Anime
                    </a>
                  </li>
                ) : null}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-linha pt-6 text-xs text-fraco sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {ANO} {MARCA}. Dados das séries:{" "}
            <a
              href="https://www.tvmaze.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 transition-colors hover:text-acento"
            >
              TVmaze
            </a>{" "}
            (CC BY-SA).
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a
              href={`mailto:${EMAIL_CONTATO}`}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-acento"
            >
              <IconeEmail className="h-3.5 w-3.5" />
              {EMAIL_CONTATO}
            </a>
            <LinkQueSobe
              href="/apoiar/"
              emBreve={APOIAR_EM_BREVE}
              className="transition-colors hover:text-acento"
            >
              Apoiar
            </LinkQueSobe>
            <LinkQueSobe href="/privacidade/" className="transition-colors hover:text-acento">
              Privacidade
            </LinkQueSobe>
            <LinkQueSobe href="/termos/" className="transition-colors hover:text-acento">
              Termos
            </LinkQueSobe>
          </div>
        </div>
      </div>
    </footer>
  );
}
