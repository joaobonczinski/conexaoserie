/**
 * O bloco que aparece no lugar de uma lista que ainda nao tem nada.
 *
 * NUNCA SEM SAIDA: ele sempre diz o que falta para a tela encher. E a licao da
 * Fabrica de Shorts (21/09/2026): estrutura nova escondida ate ter conteudo e
 * estrutura que ninguem ve. Vazia e dizendo o proximo passo, ela ensina que a
 * capacidade existe.
 */
export default function EstadoVazio({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="painel px-5 py-8 text-center sm:px-8">
      <p className="text-base font-semibold text-tinta">{titulo}</p>
      <div className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-suave">
        {children}
      </div>
    </div>
  );
}
