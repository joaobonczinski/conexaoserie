// Serve o out/ do build como a Cloudflare vai servir: index.html por pasta,
// out/404.html para endereco desconhecido e os Content-Type do public/_headers
// (que rotula o /opengraph-image, arquivo sem extensao). Veio do Clickverse.
//
// Uso direto: npm run serve   (sobe na porta 4330 e abre o navegador)
// O atalho da area de trabalho usa o `criarServidorDoOut()` pelo lancador.mjs.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { exec } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

export const PROJETO = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
export const OUT = path.join(PROJETO, "out");

/**
 * 4330, e nao a 4321 do Clickverse: o lancador de la fica ligado em segundo
 * plano, e os dois brigariam pela porta. A 4331 e do admin — "site na 30,
 * admin na 31" e facil de lembrar.
 */
export const PORTA = Number(process.env.PORT ?? 4330);

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

/** Content-Type por caminho, lido do mesmo _headers que a Cloudflare usa. */
function lerTiposDoHeaders(raiz) {
  const tipos = {};
  try {
    let atual = null;
    for (const linha of fs.readFileSync(path.join(raiz, "_headers"), "utf8").split(/\r?\n/)) {
      if (!linha.trim() || linha.trimStart().startsWith("#")) continue;
      if (!/^\s/.test(linha)) atual = linha.trim();
      else if (atual) {
        const [chave, ...valor] = linha.trim().split(":");
        if (chave.toLowerCase() === "content-type") tipos[atual] = valor.join(":").trim();
      }
    }
  } catch {
    // Sem _headers o servidor ainda funciona; so o cartao de compartilhamento
    // sai com o tipo generico.
  }
  return tipos;
}

/**
 * O tratador de requisicoes do out/. O _headers e relido a cada build (o
 * lancador chama de novo depois de compilar), e nao a cada requisicao.
 */
export function criarServidorDoOut(raiz = OUT) {
  const tipos = lerTiposDoHeaders(raiz);
  return (req, res) => {
    const caminho = decodeURIComponent((req.url ?? "/").split("?")[0]);
    let arquivo = path.join(raiz, caminho);
    // Nao deixa "../" sair da pasta out/.
    if (!arquivo.startsWith(raiz)) {
      res.writeHead(403);
      return res.end();
    }
    if (fs.existsSync(arquivo) && fs.statSync(arquivo).isDirectory()) {
      // /ranking sem a barra vira /ranking/, como faz a Cloudflare com o
      // `trailingSlash` do next.config.ts.
      if (!caminho.endsWith("/")) {
        res.writeHead(307, { Location: `${caminho}/` });
        return res.end();
      }
      arquivo = path.join(arquivo, "index.html");
    }
    if (!fs.existsSync(arquivo) || fs.statSync(arquivo).isDirectory()) {
      res.writeHead(404, { "Content-Type": TIPOS[".html"] });
      return res.end(fs.readFileSync(path.join(raiz, "404.html")));
    }
    const tipo = tipos[caminho] ?? TIPOS[path.extname(arquivo)] ?? "application/octet-stream";
    res.writeHead(200, { "Content-Type": tipo });
    fs.createReadStream(arquivo).pipe(res);
  };
}

export function abrirNavegador(url) {
  const comando =
    process.platform === "win32"
      ? `start "" "${url}"`
      : process.platform === "darwin"
        ? `open ${url}`
        : `xdg-open ${url}`;
  exec(comando, { windowsHide: true });
}

// So sobe servidor quando rodado direto (npm run serve), nao quando importado.
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  if (!fs.existsSync(OUT)) {
    console.error("Nao existe out/. Rode `npm run build` antes (o `npm run preview` ja faz isso).");
    process.exitCode = 1;
  } else {
    const servidor = http.createServer(criarServidorDoOut());
    servidor.on("error", (erro) => {
      console.error(
        erro.code === "EADDRINUSE"
          ? `A porta ${PORTA} ja esta em uso — o Conexão Série provavelmente ja esta rodando em http://localhost:${PORTA}/`
          : erro,
      );
      process.exitCode = 1;
    });
    servidor.listen(PORTA, () => {
      const url = `http://localhost:${PORTA}/`;
      console.log(`\nConexão Série no ar em ${url}  (Ctrl+C para desligar)\n`);
      if (process.argv.includes("--open")) abrirNavegador(url);
    });
  }
}
