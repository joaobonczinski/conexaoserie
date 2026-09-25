import type { Metadata } from "next";
import { APOIO, MARCA } from "@/lib/marca";
import { metadadosDaPagina } from "@/lib/metadados";

// "Apoiar", e nao "Doação": doacao pede caridade, apoio convida a fazer parte.
//
// Pagina estatica pura: quem processa o pagamento e o LivePix ou o PayPal, e o
// site nunca ve, guarda nem toca em dado de pagamento de ninguem.
//
// ENQUANTO NAO HA FORMA DE APOIO NO marca.ts, o item fica riscado no menu (ver
// `APOIAR_EM_BREVE`) e a pagina fica fora do sitemap. Ela continua existindo
// para quem tiver o endereco, e diz a verdade: ainda nao ha onde apoiar.

export const metadata: Metadata = metadadosDaPagina({
  titulo: `Apoiar o ${MARCA}`,
  descricao:
    "O site é gratuito, sem anúncios e feito por uma pessoa só. Veja como ajudar a manter no ar.",
  url: "/apoiar/",
});

export default function Apoiar() {
  const temDinheiro = APOIO.livepix !== null || APOIO.paypal !== null;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-20 pt-6">
      <h1 className="text-2xl font-bold tracking-tight text-tinta">
        Apoie o {MARCA} 💜
      </h1>

      {/* O TEXTO DO ANIME, trocado so o assunto: o Joao o escreveu palavra por
          palavra para o Conexão Anime em 31/08/2026, e a promessa e a mesma. */}
      <p className="mt-4 text-sm leading-relaxed text-suave">
        Se o {MARCA} já te ajudou a saber a hora certa do episódio, a não perder
        uma estreia ou a escolher a próxima série, considere apoiar o projeto!
      </p>
      <p className="mt-3 text-sm leading-relaxed text-suave">
        O {MARCA} é mantido com carinho e sem anúncios, para que você possa
        navegar pelo site sem interrupções ou propagandas.
      </p>

      {temDinheiro ? (
        <section className="mt-10">
          <h2 className="text-sm font-medium text-tinta">
            {APOIO.paypal !== null ? "Com dinheiro" : "💜 Apoie via PIX"}
          </h2>

          {APOIO.livepix !== null ? (
            <div className="mt-4 rounded-xl border border-linha bg-realce p-4">
              {APOIO.paypal !== null ? (
                <h3 className="text-sm font-medium text-tinta">Pix</h3>
              ) : null}
              <p className="mt-1 text-xs text-suave">
                Cai na hora, sem cadastro e sem nenhuma taxa para você.
              </p>
              <p className="mt-2 text-xs text-suave">
                O pagamento passa pelo LivePix. Você escolhe o valor e pode deixar
                um recado junto.
              </p>
              {/* O botao diz para onde vai: descobrir so depois de clicar que
                  saiu do site faz a pessoa desistir no meio. */}
              <a
                href={APOIO.livepix}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block rounded-lg border border-linha-forte px-3 py-2 text-sm text-tinta transition-colors hover:bg-realce"
              >
                Abrir o LivePix
              </a>
            </div>
          ) : null}

          {APOIO.paypal !== null ? (
            <div className="mt-3 rounded-xl border border-linha bg-realce p-4">
              <h3 className="text-sm font-medium text-tinta">PayPal</h3>
              <p className="mt-1 text-xs text-suave">
                Para quem está fora do Brasil e não tem Pix.
              </p>
              <a
                href={APOIO.paypal}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block rounded-lg border border-linha-forte px-3 py-2 text-sm text-tinta transition-colors hover:bg-realce"
              >
                Abrir o PayPal
              </a>
            </div>
          ) : null}
        </section>
      ) : (
        <p className="mt-10 rounded-xl border border-linha bg-realce p-4 text-sm text-suave">
          As formas de apoio ainda estão sendo preparadas. Em breve elas aparecem
          aqui.
        </p>
      )}
    </main>
  );
}
