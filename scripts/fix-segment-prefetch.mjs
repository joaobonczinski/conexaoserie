// Corrige os arquivos de prefetch de segmento que o `next build` grava errado
// quando roda no WINDOWS. Roda depois do build (ver "build" no package.json).
//
// Veio do Clickverse, onde o bug foi achado. O Next 16.2.x lista os segmentos
// com `path.relative()`, que no Windows usa "\", e so troca "/" por "." no nome
// do arquivo — a "\" sobra, e vira PASTA. No out/:
//
//   gravado:  ranking/__next.ranking/__PAGE__.txt
//   pedido:   ranking/__next.ranking.__PAGE__.txt   <- o que o navegador pede
//
// Conferido aqui em 25/09/2026: 404 no console para cada link visivel, e a
// navegacao sem aproveitar prefetch nenhum. Em Linux — onde a Cloudflare
// compila — os nomes ja saem com ponto, este script nao acha pasta nenhuma e
// nao faz nada. Ele existe para o teste local e para um deploy feito desta
// maquina nao levarem o defeito junto.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "out");

/** Todos os arquivos abaixo de `dir`, com caminho relativo a ele. */
function arquivosDentro(dir, base = dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((item) => {
    const cheio = path.join(dir, item.name);
    return item.isDirectory() ? arquivosDentro(cheio, base) : [path.relative(base, cheio)];
  });
}

let renomeados = 0;
let pastas = 0;

function percorrer(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!item.isDirectory()) continue;
    const cheio = path.join(dir, item.name);
    // "__next.<algo>" como PASTA so existe por causa do bug: o formato certo e
    // sempre um arquivo "__next.<segmentos separados por ponto>.txt".
    if (item.name.startsWith("__next.")) {
      for (const rel of arquivosDentro(cheio)) {
        const achatado = `${item.name}.${rel.split(path.sep).join(".")}`;
        fs.renameSync(path.join(cheio, rel), path.join(dir, achatado));
        renomeados++;
      }
      fs.rmSync(cheio, { recursive: true });
      pastas++;
    } else {
      percorrer(cheio);
    }
  }
}

if (!fs.existsSync(OUT)) {
  console.error("fix-segment-prefetch: nao existe out/ — rode depois do next build.");
  process.exitCode = 1;
} else {
  percorrer(OUT);
  console.log(
    renomeados
      ? `fix-segment-prefetch: ${renomeados} arquivos de prefetch renomeados (${pastas} pastas achatadas).`
      : "fix-segment-prefetch: nada a corrigir.",
  );
}
