// Gera scripts/conexao-serie.ico, o icone do atalho da area de trabalho, a
// partir da mesma antena de src/app/icon.svg. Rode com `node scripts/gerar-icone.mjs`
// quando a marca mudar.
//
// UM .ICO COM QUATRO TAMANHOS (16, 32, 48 e 256), e nao um so: o Windows
// escolhe o tamanho conforme o lugar — 16 na barra de tarefas, 48 na area de
// trabalho, 256 no Explorer com icones grandes. Com um tamanho so, ele reduz ou
// amplia na hora e a antena sai borrada.
//
// Cada tamanho entra como PNG dentro do .ico, que o Windows aceita desde o
// Vista. O `sharp` ja vem instalado com o Next.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SVG = fs.readFileSync(path.join(RAIZ, "src/app/icon.svg"));
const DESTINO = path.join(RAIZ, "scripts/conexao-serie.ico");
const TAMANHOS = [16, 32, 48, 256];

const pngs = await Promise.all(
  TAMANHOS.map((t) => sharp(SVG, { density: 72 * (t / 32) * 2 }).resize(t, t).png().toBuffer()),
);

// O formato: cabecalho de 6 bytes, uma entrada de 16 bytes por imagem, e as
// imagens em seguida. Largura e altura 256 se escrevem como 0.
const cabecalho = Buffer.alloc(6);
cabecalho.writeUInt16LE(0, 0); // reservado
cabecalho.writeUInt16LE(1, 2); // tipo 1 = icone
cabecalho.writeUInt16LE(pngs.length, 4);

let deslocamento = 6 + 16 * pngs.length;
const entradas = pngs.map((png, i) => {
  const e = Buffer.alloc(16);
  const t = TAMANHOS[i];
  e.writeUInt8(t === 256 ? 0 : t, 0);
  e.writeUInt8(t === 256 ? 0 : t, 1);
  e.writeUInt8(0, 2); // sem paleta
  e.writeUInt8(0, 3); // reservado
  e.writeUInt16LE(1, 4); // planos
  e.writeUInt16LE(32, 6); // bits por pixel
  e.writeUInt32LE(png.length, 8);
  e.writeUInt32LE(deslocamento, 12);
  deslocamento += png.length;
  return e;
});

fs.writeFileSync(DESTINO, Buffer.concat([cabecalho, ...entradas, ...pngs]));
console.log(`Gerado ${path.relative(RAIZ, DESTINO)} com ${TAMANHOS.join(", ")} px`);
