import Calendario from "@/components/Calendario";
import { INSTANTE_DO_BUILD } from "@/lib/build";
import EstreiasNaHome from "@/components/EstreiasNaHome";
import NovidadesNaHome from "@/components/NovidadesNaHome";
import RankingNoAr from "@/components/RankingNoAr";
import { FUSO_PADRAO, dataLocal } from "@/lib/horario";
import { estreias, itensEntre, rankingNoAr } from "@/lib/series";

/**
 * A janela que vai para o navegador: de dois dias atras ate duas semanas a
 * frente.
 *
 * O calendario mostra sete dias a partir de HOJE NO RELOGIO DE QUEM OLHA, e esse
 * hoje so existe no navegador. A folga dos dois lados cobre o fuso (o "hoje" do
 * Japao ja e amanha aqui) e o site ficar um dia sem build: o bot da agenda
 * roda todo dia, mas um dia sem commit nao pode deixar a semana sem sabado.
 */
const DIA = 86400;

export default function Home() {
  // Calculado no build, sempre no fuso de Brasilia (nunca no da maquina que
  // builda). So serve para o HTML e a primeira renderizacao do cliente baterem.
  const agora = INSTANTE_DO_BUILD;
  const hojeDoBuild = dataLocal(agora, FUSO_PADRAO);
  const itens = itensEntre(agora - 2 * DIA, agora + 15 * DIA);

  return (
    <main className="mx-auto w-full max-w-[78rem] px-4 pb-20 pt-6">
      {/* O `h1` fica, mesmo discreto: e o titulo da pagina para o Google e o
          primeiro marco de quem usa leitor de tela. */}
      <h1 className="mb-4 text-2xl font-bold tracking-tight text-tinta sm:text-3xl">
        Calendário de séries
      </h1>

      <Calendario itens={itens} hojeDoBuild={hojeDoBuild} />

      {/* O ranking colado no calendario: os dois falam do que esta no ar. O
          calendario responde "que horas sai", o ranking "o que vale a pena". */}
      <RankingNoAr series={rankingNoAr(agora)} />

      <EstreiasNaHome itens={estreias(agora, 60)} />

      <NovidadesNaHome />
    </main>
  );
}
