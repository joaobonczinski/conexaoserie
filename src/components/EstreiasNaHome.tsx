import TituloDeSecao from "./TituloDeSecao";
import { LinhaDeEstreia } from "./ListaDeEstreias";
import type { Item } from "@/lib/tipos";

/**
 * As proximas estreias, na home — as seis mais proximas, e o resto na
 * /proximos/, com o filtro "Estreias" ja escolhido (#estreias).
 *
 * FICA DEPOIS DO RANKING: o calendario e o ranking respondem sobre o que ja
 * esta no ar, e esta secao olha para a frente. Na ordem de leitura, o presente
 * vem antes do que vem.
 *
 * SEM ESTREIA NENHUMA, O BLOCO NAO EXISTE — secao vazia diz ao visitante que o
 * site esta parado.
 */
const QUANTAS = 6;

export default function EstreiasNaHome({ itens }: { itens: Item[] }) {
  const proximas = itens.slice(0, QUANTAS);
  if (proximas.length === 0) return null;

  return (
    <section className="mt-16">
      <TituloDeSecao
        etiqueta="Vem aí"
        titulo="Próximas estreias"
        descricao="Séries novas e temporadas novas, no horário de Brasília."
        href="/proximos/#estreias"
        rotuloDoLink="ver todas"
      />
      {/* `grid-cols-1` NAO E REDUNDANTE: sem ele a coluna do celular e
          automatica e cresce ate o titulo mais longo (o corte com reticencias
          nunca chega a agir). Medido em 25/09/2026: linha de 383px numa tela
          de 375, e a pagina inteira ficava 24px mais larga que o celular. */}
      <ol className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {proximas.map((item) => (
          <LinhaDeEstreia
            key={`${item.serie.id}-${item.lancamento.temporada}`}
            item={item}
            comDia
          />
        ))}
      </ol>
    </section>
  );
}
