import Link from "next/link";
import SeloDePlataforma from "./SeloDePlataforma";
import { IconeRelogio } from "./Icones";
import type { Item } from "@/lib/tipos";
import { LINK_QUE_COBRE, enderecoDaSerie } from "@/lib/enderecos";
import { traduzirGenero } from "@/lib/generos";
import { contar, rotuloContagem } from "@/lib/contagem";
import { formatarHora } from "@/lib/horario";
import { estiloDaCor } from "@/lib/cor-da-capa";
import { rotuloDeEstreia, rotuloDoLancamento } from "@/lib/rotulos";

/* ===========================================================================
   O CARD DE SERIE — a peca que o site mais repete.

   E o card do Conexão Anime, e as regras dele valem aqui pelos mesmos motivos:

   - O HORARIO E A PECA PRINCIPAL DA CAPA: mono, maior que o resto. E a
     resposta que traz a pessoa ao site.
   - TODAS AS FATIAS DE TEXTO TEM ALTURA FIXA, renderizadas mesmo vazias, e e
     isso que faz os cards terminarem na mesma linha.
   - O QUE JA SAIU NAO APAGA: o card vai para o fim do dia e a contagem diz
     "saiu ha 3h". Apagar deixaria o site mais escuro justamente a noite.

   O QUE MUDA:

   - A COR DO CARD E A DA PLATAFORMA, e nao a da capa: o TVmaze nao entrega a
     cor dominante do poster, e a da plataforma diz algo — o fio vermelho e
     Netflix antes de a pessoa ler qualquer palavra.
   - O FIO NAO E BARRA DE PROGRESSO: o TVmaze nao da o total de episodios da
     temporada na agenda, e barra sem total mentiria. Fica cheio, na cor.
   - O RODAPE DA CAPA DIZ O QUE SAI ("T2 · E5", "T1 · E1–8"), porque aqui um
     lancamento pode ser a temporada inteira.
   =========================================================================== */

type Props = {
  item: Item;
  fuso: string;
  /** Unix em segundos, ou null antes de montar. Quem conta o tempo e o pai. */
  agora: number | null;
};

export default function CardSerie({ item, fuso, agora }: Props) {
  const { serie, lancamento } = item;
  const hora =
    lancamento.airingAt !== null ? formatarHora(lancamento.airingAt, fuso) : null;
  const generos = serie.generos.slice(0, 3).map(traduzirGenero).join(" · ");
  const contagem =
    lancamento.airingAt !== null && agora !== null
      ? contar(lancamento.airingAt, agora)
      : null;
  const estreia = rotuloDeEstreia(lancamento);

  return (
    <article className="card relative flex flex-col" style={estiloDaCor(serie.cor)}>
      <div className="card-capa aspect-[2/3]">
        {serie.capa ? (
          // SO O POSTER MEDIO (210px), sem `srcSet` com o original, e isso e
          // medido: o "original" do TVmaze e o arquivo que alguem subiu, com
          // media de 760 KB (ate 2 MB) numa amostra de 25/09/2026. Num celular
          // de tela densa o navegador escolheria ele para todo card — 40 vezes o
          // peso, na fita inteira. O medio fica um pouco macio em tela retina;
          // e o preco certo.
          // eslint-disable-next-line @next/next/no-img-element -- CDN externo em site estatico
          <img
            src={serie.capa}
            alt=""
            loading="lazy"
            decoding="async"
            className="card-arte h-full w-full object-cover"
          />
        ) : null}

        {/* O HORARIO. "sem hora" quando nao se sabe: e a verdade, e o card
            continua no dia certo, que e metade da resposta. */}
        <span
          className={`adesivo numero absolute left-2 top-2 px-2 py-1 font-medium leading-none ${
            hora ? "text-[13px]" : "text-[11px] text-arte/70"
          }`}
        >
          {hora ?? "sem hora"}
        </span>

        {/* Canto de cima a direita: os selos editoriais. A estreia vem ANTES do
            destaque porque e dado (o episodio 1 esta ali); o destaque e
            opiniao do Joao. */}
        {estreia || serie.destaque ? (
          <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
            {estreia ? (
              <span className="rounded-md bg-arte-ouro px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
                {estreia}
              </span>
            ) : null}
            {serie.destaque ? (
              <span className="adesivo px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                Destaque
              </span>
            ) : null}
          </div>
        ) : null}

        {/* A BARRA DE BAIXO: o que sai na esquerda, quanto falta na direita.
            Nas pontas, e nao centralizados, para um nunca cair por cima do
            outro a 375px de largura. */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-1.5 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-2 pb-2.5 pt-8">
          <span className="numero text-[11px] font-medium leading-none text-arte/90">
            {rotuloDoLancamento(lancamento)}
          </span>

          {lancamento.airingAt !== null ? (
            <span className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-medium leading-none text-arte/90">
              <IconeRelogio className="h-3 w-3" />
              {contagem === null ? (
                // Antes de montar ninguem sabe que horas sao — o HTML e
                // estatico. Este texto e o mesmo no servidor e na hidratacao.
                <span>quanto falta</span>
              ) : (
                <span className="numero">{rotuloContagem(contagem)}</span>
              )}
            </span>
          ) : null}
        </div>

        <span aria-hidden className="card-fio">
          <span className="card-fio-parte" style={{ width: "100%" }} />
        </span>
      </div>

      <div className="mt-2.5 flex flex-1 flex-col">
        {/* O `title` devolve o que o corte tira, para quem usa mouse; o texto
            inteiro continua no HTML.

            O NOME E O LINK DA PAGINA DA SERIE, esticado sobre o card inteiro
            (ver `LINK_QUE_COBRE`). Sem prefetch: a fita do dia tem dezenas de
            cards, e cada um que entrasse na tela baixaria uma pagina. */}
        <h3
          title={serie.nome}
          className="card-nome truncate text-[15px] font-semibold leading-snug text-tinta"
        >
          <Link href={enderecoDaSerie(serie.slug)} prefetch={false} className={LINK_QUE_COBRE}>
            {serie.nome}
          </Link>
        </h3>

        {/* Sempre presente: o espaco rigido segura a linha quando o nome
            brasileiro e o original sao o mesmo. */}
        <p
          title={serie.nomeOriginal ?? undefined}
          className="truncate text-[13px] leading-snug text-suave"
        >
          {serie.nomeOriginal ?? " "}
        </p>

        <p title={generos} className="mt-1 truncate text-[11px] leading-snug text-fraco">
          {generos || " "}
        </p>

        <SeloDePlataforma
          plataforma={serie.plataforma}
          cor={serie.cor}
          link={serie.link}
        />
      </div>
    </article>
  );
}
