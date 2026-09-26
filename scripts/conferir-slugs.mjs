// Confere os enderecos das series. Rode com `npm run conferir:slugs`.

import { escolherSlug, slugificar } from "./slug.mjs";

let falhas = 0;
function igual(nome, obtido, esperado) {
  const ok = obtido === esperado;
  if (!ok) falhas++;
  console.log(`${ok ? "ok  " : "FALHOU"}  ${nome}${ok ? "" : `\n        esperado ${esperado}\n        obtido   ${obtido}`}`);
}

igual("Acento e pontuacao somem", slugificar("Matéria Escura"), "materia-escura");
igual("Trema tambem (o Ÿ do JAŸ-Z)", slugificar("JAŸ-Z IN 8"), "jay-z-in-8");
igual("& vira separador", slugificar("Law & Order: Special Victims Unit"), "law-order-special-victims-unit");
igual("Nada nas pontas", slugificar("#Love"), "love");
igual("Titulo sem letra latina fica vazio", slugificar("大奉打更人"), "");

const vazio = new Set();
igual(
  "O nome brasileiro vem primeiro",
  escolherSlug({ id: 44776, nome: "Lanterns", tituloBr: "Lanternas", estreou: "2026-08-16" }, vazio),
  "lanternas",
);
igual(
  "Sem nome brasileiro, o original",
  escolherSlug({ id: 44458, nome: "Ted Lasso", tituloBr: null, estreou: "2020-08-14" }, vazio),
  "ted-lasso",
);
igual(
  "Empate vira o ano de estreia",
  escolherSlug({ id: 2, nome: "Ghosts", tituloBr: null, estreou: "2021-10-07" }, new Set(["ghosts"])),
  "ghosts-2021",
);
igual(
  "Empate duplo vira o id",
  escolherSlug(
    { id: 3, nome: "Ghosts", tituloBr: null, estreou: "2021-10-07" },
    new Set(["ghosts", "ghosts-2021"]),
  ),
  "ghosts-3",
);
igual(
  "Nome sem letra latina vira serie-<id>",
  escolherSlug({ id: 99, nome: "大奉打更人", tituloBr: null, estreou: null }, vazio),
  "serie-99",
);

console.log(falhas === 0 ? "\nTudo certo." : `\n${falhas} caso(s) falharam.`);
process.exitCode = falhas === 0 ? 0 : 1;
