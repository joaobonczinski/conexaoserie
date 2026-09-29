"use client";

import { useRouter } from "next/navigation";
import type { GrupoDoSeletor } from "@/lib/ranking";

/* ===========================================================================
   O SELETOR DE CATEGORIA do ranking de todos os tempos. Veio do Conexão
   Filme.

   UM `select`, e nao vinte chips: chip e bom para meia duzia de opcoes, e aqui
   sao dois grupos (genero e pais) que o `optgroup` separa de graca.

   ESCOLHER E NAVEGAR: cada categoria e uma pagina estatica com as series dela
   (/ranking/terror/), e nao um filtro sobre um bolo de mil series que teria de
   ir inteiro para o navegador.

   O `import type` de ranking.ts e so de tipo — some no build. O arquivo em si
   e "server-only" e nao pode vir para ca.
   =========================================================================== */

export default function SeletorDeCategoria({
  atual,
  grupos,
}: {
  atual: string;
  grupos: GrupoDoSeletor[];
}) {
  const router = useRouter();
  const enderecos = new Map(grupos.flatMap((g) => g.itens.map((i) => [i.chave, i.endereco])));

  return (
    <label className="block max-w-sm">
      <span className="etiqueta">Categoria</span>
      <select
        value={atual}
        onChange={(e) => router.push(enderecos.get(e.target.value) ?? "/ranking/")}
        className="campo mt-1.5 min-h-10"
      >
        {grupos.map((g) =>
          g.rotulo ? (
            <optgroup key={g.rotulo} label={g.rotulo}>
              {g.itens.map((i) => (
                <option key={i.chave} value={i.chave}>
                  {i.rotulo}
                </option>
              ))}
            </optgroup>
          ) : (
            g.itens.map((i) => (
              <option key={i.chave} value={i.chave}>
                {i.rotulo}
              </option>
            ))
          ),
        )}
      </select>
    </label>
  );
}
