// Lancador do atalho "Conexão Série" da area de trabalho (via conexao-serie.vbs,
// que roda isto escondido — sem janela de terminal). E o lancador do
// Clickverse, com um passo a mais: puxar a agenda do GitHub.
//
// O que ele faz:
//   - o servidor roda em segundo plano e sobrevive entre cliques; clicar com
//     ele no ar so abre o navegador;
//   - antes, traz do GitHub o que o bot da agenda commitou (so avanco rapido,
//     nunca mistura nada — ver `puxarDoGithub`);
//   - so recompila quando algum arquivo que entra no build mudou desde o
//     ultimo build bem-sucedido;
//   - enquanto compila, o navegador ja abre numa pagina "Compilando…" que
//     recarrega sozinha quando termina (e mostra o erro, se falhar).
//
// Estado e logs ficam em .lancador/ (fora do git).
// Para desligar: http://localhost:4330/__lancador/ → "Desligar".
// Para testar sem abrir o navegador: CONEXAO_SEM_NAVEGADOR=1.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { exec, execFile, spawn } from "node:child_process";
import { OUT, PORTA, PROJETO, abrirNavegador, criarServidorDoOut } from "./servir-out.mjs";

const URL_DO_SITE = `http://localhost:${PORTA}/`;
const abrir = (url) =>
  process.env.CONEXAO_SEM_NAVEGADOR ? registrar("abriria", url) : abrirNavegador(url);
const PASTA_DE_ESTADO = path.join(PROJETO, ".lancador");
const CARIMBO = path.join(PASTA_DE_ESTADO, "inicio-do-ultimo-build");
const LOG_DO_BUILD = path.join(PASTA_DE_ESTADO, "build.log");
const LOG = path.join(PASTA_DE_ESTADO, "lancador.log");
// Identifica o NOSSO servidor na porta, para nao confundir com outro programa.
const MARCA = "conexao-serie-lancador";

// Tudo que, se mudar, muda o out/. A agenda mora em src/data, entao o que o
// `git pull` trouxer tambem dispara o build.
const ENTRADAS_DO_BUILD = [
  "src",
  "public",
  "next.config.ts",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "postcss.config.mjs",
  "scripts/fix-segment-prefetch.mjs",
];

fs.mkdirSync(PASTA_DE_ESTADO, { recursive: true });

function registrar(...partes) {
  const linha = `[${new Date().toISOString()}] ${partes.join(" ")}\n`;
  try {
    fs.appendFileSync(LOG, linha);
  } catch {
    // Sem onde escrever o log nao ha o que fazer; o lancador segue.
  }
}

process.on("uncaughtException", (erro) => {
  registrar("erro inesperado:", erro.stack ?? String(erro));
  process.exitCode = 1;
});

// ---------------------------------------------------------------------------
// A agenda do GitHub
// ---------------------------------------------------------------------------

/**
 * Traz o que o bot commitou no GitHub, SE der para trazer sem mexer em nada.
 *
 * POR QUE EXISTE: a agenda e atualizada pelo GitHub Actions, la no GitHub. Sem
 * puxar, a copia daqui ficaria com a agenda do dia em que foi baixada, e o
 * calendario local iria esvaziando semana a semana — parecendo defeito do site.
 *
 * `--ff-only` E A TRAVA: so avanca quando a copia local e um pedaco do que esta
 * la. Commit local nao enviado, conflito, repositorio sem GitHub ainda, sem
 * internet — em qualquer desses casos o git recusa, o lancador registra no log
 * e segue com o que tem. Nunca mistura, nunca apaga.
 */
function puxarDoGithub() {
  return new Promise((resolver) => {
    execFile(
      "git",
      ["pull", "--ff-only", "--quiet"],
      { cwd: PROJETO, timeout: 20_000, windowsHide: true },
      (erro, _saida, stderr) => {
        // So a primeira linha: o git explica o motivo em dez, e o log e para
        // bater o olho.
        const motivo = (stderr || erro?.message || "").trim().split(/\r?\n/)[0];
        registrar(erro ? `git pull nao rodou: ${motivo}` : "git pull ok");
        resolver();
      },
    );
  });
}

// ---------------------------------------------------------------------------
// Precisa recompilar?
// ---------------------------------------------------------------------------

function modificadoMaisRecente(alvo) {
  let info;
  try {
    info = fs.statSync(alvo);
  } catch {
    return 0;
  }
  if (!info.isDirectory()) return info.mtimeMs;
  let maisRecente = info.mtimeMs;
  for (const item of fs.readdirSync(alvo)) {
    maisRecente = Math.max(maisRecente, modificadoMaisRecente(path.join(alvo, item)));
  }
  return maisRecente;
}

// O carimbo guarda a hora em que o ultimo build bem-sucedido COMECOU, e nao a em
// que terminou: um arquivo salvo durante o build pode nao ter entrado nele, e
// comparar com o inicio pega esse caso.
function inicioDoUltimoBuild() {
  try {
    return Number(fs.readFileSync(CARIMBO, "utf8"));
  } catch {
    return 0;
  }
}

function precisaCompilar() {
  if (!fs.existsSync(path.join(OUT, "index.html"))) return true;
  const carimbo = inicioDoUltimoBuild();
  if (!carimbo) return true;
  return ENTRADAS_DO_BUILD.some(
    (entrada) => modificadoMaisRecente(path.join(PROJETO, entrada)) > carimbo,
  );
}

// ---------------------------------------------------------------------------
// Estado do servidor
// ---------------------------------------------------------------------------

const estado = {
  fase: "parado", // parado | compilando | pronto | erro
  inicioDoBuild: 0,
  fimDoErro: "",
  tratador: null,
  filho: null, // o `npm run build` em andamento, se houver
};

function compilar() {
  estado.fase = "compilando";
  estado.inicioDoBuild = Date.now();
  estado.fimDoErro = "";
  // Nada e servido do out/ durante o build: o Next apaga e recria a pasta, e
  // um arquivo aberto aqui travaria isso (o EBUSY).
  estado.tratador = null;
  registrar("compilando");

  const saida = fs.createWriteStream(LOG_DO_BUILD);
  // `npm run build`, e nao `next build`: o script inclui o conserto do
  // prefetch no Windows (scripts/fix-segment-prefetch.mjs).
  const filho = spawn("npm run build", { cwd: PROJETO, shell: true, windowsHide: true });
  estado.filho = filho;
  filho.stdout.pipe(saida);
  filho.stderr.pipe(saida);
  filho.on("close", (codigo) => {
    estado.filho = null;
    saida.end();
    if (codigo === 0) {
      fs.writeFileSync(CARIMBO, String(estado.inicioDoBuild));
      estado.tratador = criarServidorDoOut(OUT);
      estado.fase = "pronto";
      registrar(`build ok em ${Math.round((Date.now() - estado.inicioDoBuild) / 1000)} s`);
    } else {
      estado.fase = "erro";
      try {
        estado.fimDoErro = fs.readFileSync(LOG_DO_BUILD, "utf8").split(/\r?\n/).slice(-40).join("\n");
      } catch {
        estado.fimDoErro = `npm run build saiu com codigo ${codigo}`;
      }
      registrar("build falhou, codigo", codigo);
    }
  });
}

function garantirAtualizado() {
  if (estado.fase === "compilando") return;
  if (precisaCompilar()) {
    compilar();
  } else if (estado.fase !== "pronto") {
    estado.tratador = criarServidorDoOut(OUT);
    estado.fase = "pronto";
  }
}

function estadoEmJson() {
  return JSON.stringify({
    marca: MARCA,
    fase: estado.fase,
    segundos:
      estado.fase === "compilando" ? Math.round((Date.now() - estado.inicioDoBuild) / 1000) : 0,
    fimDoErro: estado.fimDoErro,
  });
}

// ---------------------------------------------------------------------------
// Paginas do proprio lancador
// ---------------------------------------------------------------------------

const ESTILO = `
  :root { color-scheme: light dark; --fundo:#faf8f5; --tinta:#17151c; --suave:#57515f; --acento:#4f46e5; --caixa:#f1ece4; }
  @media (prefers-color-scheme: dark) { :root { --fundo:#0d0c11; --tinta:#f6f4f8; --suave:#a9a3b6; --acento:#8b93ff; --caixa:#201e29; } }
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
         background:var(--fundo); color:var(--tinta); font:16px/1.5 system-ui, sans-serif; padding:16px; box-sizing:border-box; }
  main { max-width:720px; width:100%; text-align:center; }
  h1 { font-size:28px; margin:0 0 8px; font-weight:500; color:var(--suave); } h1 b { color:var(--tinta); }
  p { color:var(--suave); margin:8px 0; }
  .roda { width:40px; height:40px; margin:24px auto; border:4px solid var(--caixa); border-top-color:var(--acento);
          border-radius:50%; animation:gira 1s linear infinite; }
  @keyframes gira { to { transform:rotate(360deg); } }
  pre { text-align:left; background:var(--caixa); padding:12px; border-radius:8px; overflow:auto; max-height:50vh; font-size:12px; }
  button { background:var(--acento); color:#fff; border:0; border-radius:999px; padding:10px 18px; font-size:15px; cursor:pointer; }
  a { color:var(--acento); }
`;

const PAGINA_DE_ESPERA = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Compilando o Conexão Série…</title><style>${ESTILO}</style></head>
<body><main>
  <h1>conexão<b>série</b></h1>
  <div id="compilando">
    <div class="roda"></div>
    <p><strong>Compilando o site</strong> porque o código ou a agenda mudou desde a última vez.</p>
    <p>Costuma levar de 20 a 60 segundos. Esta página recarrega sozinha quando terminar.</p>
    <p id="segundos"></p>
  </div>
  <div id="falhou" hidden>
    <p><strong>O build falhou.</strong> O fim da saída do <code>npm run build</code>:</p>
    <pre id="log"></pre>
    <button id="denovo">Tentar de novo</button>
  </div>
</main>
<script>
  async function perguntar() {
    try {
      const s = await (await fetch("/__lancador/estado", { cache: "no-store" })).json();
      if (s.fase === "pronto") return location.reload();
      const falhou = s.fase === "erro";
      document.getElementById("compilando").hidden = falhou;
      document.getElementById("falhou").hidden = !falhou;
      if (falhou) document.getElementById("log").textContent = s.fimDoErro;
      else document.getElementById("segundos").textContent = s.segundos ? s.segundos + " s" : "";
    } catch {}
    setTimeout(perguntar, 1000);
  }
  document.getElementById("denovo").onclick = () => fetch("/__lancador/garantir", { method: "POST" });
  perguntar();
</script>
</body></html>`;

const PAGINA_DE_CONTROLE = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Conexão Série — servidor local</title><style>${ESTILO}</style></head>
<body><main>
  <h1>conexão<b>série</b></h1>
  <p>O servidor local está rodando em segundo plano em <a href="/">${URL_DO_SITE}</a>.</p>
  <p>Ele fica ligado até você desligar aqui ou reiniciar o computador.</p>
  <p style="margin-top:24px"><button id="desligar">Desligar o servidor</button></p>
  <p id="msg"></p>
</main>
<script>
  document.getElementById("desligar").onclick = async () => {
    await fetch("/__lancador/desligar", { method: "POST" }).catch(() => {});
    document.getElementById("msg").textContent = "Desligado. O atalho liga de novo quando precisar.";
  };
</script>
</body></html>`;

// ---------------------------------------------------------------------------
// Servidor
// ---------------------------------------------------------------------------

// So existe quando este processo e o servidor (ver o fim do arquivo).
let servidor = null;

function tratar(req, res) {
  const url = (req.url ?? "/").split("?")[0];

  if (url === "/__lancador/estado") {
    res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    return res.end(estadoEmJson());
  }
  if (url === "/__lancador/garantir") {
    garantirAtualizado();
    res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    return res.end(estadoEmJson());
  }
  if (url === "/__lancador/desligar" && req.method === "POST") {
    registrar("desligado pela pagina de controle");
    res.writeHead(204, { Connection: "close" });
    res.end(() => {
      // Fecha tudo e deixa o processo terminar sozinho (ver `pedir`).
      estado.filho?.kill();
      servidor.close();
      servidor.closeAllConnections();
    });
    return;
  }
  if (url === "/__lancador/" || url === "/__lancador") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(PAGINA_DE_CONTROLE);
  }

  if (estado.fase === "pronto" && estado.tratador) return estado.tratador(req, res);

  // Compilando (ou falhou): pagina navegada recebe a tela de espera; o resto
  // (prefetch, scripts) recebe 503, que o Next trata como falha de rede.
  if ((req.headers.accept ?? "").includes("text/html")) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    return res.end(PAGINA_DE_ESPERA);
  }
  res.writeHead(503, { "Retry-After": "5" });
  res.end();
}

// Requisicao ao proprio servidor. NAO usa fetch() de proposito: o fetch deixa a
// conexao viva (keep-alive), e encerrar o processo com ela aberta derruba o
// Node no Windows com 0xC0000409 — a licao do lancador do Clickverse. Com
// `agent: false` a conexao fecha junto com a resposta.
function pedir(caminho, metodo = "GET") {
  return new Promise((resolver, rejeitar) => {
    const req = http.request(
      { host: "localhost", port: PORTA, path: caminho, method: metodo, agent: false, timeout: 2000 },
      (res) => {
        let corpo = "";
        res.setEncoding("utf8");
        res.on("data", (pedaco) => (corpo += pedaco));
        res.on("end", () => resolver(corpo));
      },
    );
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", rejeitar);
    req.end();
  });
}

/** Pergunta a porta quem esta la: o nosso servidor, outro programa ou ninguem. */
async function quemEstaNaPorta() {
  try {
    const corpo = await pedir("/__lancador/estado");
    return JSON.parse(corpo)?.marca === MARCA ? "nosso" : "outro";
  } catch (erro) {
    return erro?.code === "ECONNREFUSED" ? "livre" : "outro";
  }
}

// Sem terminal nao ha onde escrever: erro que o Joao precisa ver vira caixa de
// mensagem do Windows.
function avisar(mensagem) {
  registrar("aviso:", mensagem);
  const escapada = mensagem.replace(/'/g, "''");
  exec(
    `powershell -NoProfile -WindowStyle Hidden -Command "Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show('${escapada}', 'Conexão Série')"`,
    { windowsHide: true },
  );
}

await puxarDoGithub();
const quem = await quemEstaNaPorta();

// Nos dois primeiros ramos o processo termina sozinho quando nao sobra nada
// pendente — sem process.exit(), pelo mesmo motivo do comentario em `pedir`.
if (quem === "nosso") {
  // Ja esta no ar: garante que esta atualizado e so abre o navegador.
  await pedir("/__lancador/garantir", "POST").catch(() => {});
  abrir(URL_DO_SITE);
  registrar("servidor ja estava no ar; navegador aberto");
} else if (quem === "outro") {
  avisar(
    `A porta ${PORTA} está ocupada por outro programa, então o Conexão Série não pôde subir. Feche esse programa e abra o atalho de novo.`,
  );
  process.exitCode = 1;
} else {
  servidor = http.createServer(tratar);
  servidor.on("error", (erro) => {
    avisar(`O Conexão Série não conseguiu subir o servidor: ${erro.message}`);
    process.exitCode = 1;
  });
  servidor.listen(PORTA, () => {
    registrar("servidor no ar na porta", PORTA);
    garantirAtualizado();
    abrir(URL_DO_SITE);
  });
}
