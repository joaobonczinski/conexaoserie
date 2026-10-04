// Admin local para editar src/data/overrides.json. Rode com `npm run admin` e
// abra http://localhost:4331.
//
// DE PROPOSITO NAO E UMA PAGINA DO NEXT: o site e `output: "export"`, entao
// qualquer rota do app viraria arquivo estatico em `out/` e ficaria publica na
// internet sem senha. Aqui e um servidor separado que so escuta em 127.0.0.1,
// nunca entra no build e nunca vai para a Cloudflare. E o `npm run admin` do
// Conexão Anime, que la continua existindo como saida de emergencia.
//
// A PORTA E 4331, e nao a 4321 do anime: a 4321 e do lancador do Clickverse,
// que fica ligado em segundo plano, e as duas brigariam.
//
// O fluxo: editar, Salvar, e commitar o overrides.json. O push dispara o build
// e a mudanca entra no ar.
//
// A PREVIA DO HORARIO usa a MESMA conta do site (src/lib/regras.ts, importado
// direto — o Node tira os tipos sozinho). E ela que responde a pergunta que
// importa aqui: "a hora que o site vai mostrar e a hora certa?".

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gravarJson } from "./gravar-json.mjs";
import { montarLancamentos } from "../src/lib/regras.ts";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CAMINHO_AGENDA = resolve(RAIZ, "src/data/agenda.json");
const CAMINHO_OVERRIDES = resolve(RAIZ, "src/data/overrides.json");
const CAMINHO_PLATAFORMAS = resolve(RAIZ, "src/data/plataformas.json");

const PORTA = 4331;
const HORA_VALIDA = /^([01]\d|2[0-3]):[0-5]\d$/;
// Os relogios em que um ajuste pode vir escrito, alem de Brasilia (que e a
// ausencia do campo). Ver o `AjusteDeHorario`, no regras.ts.
const FUSOS_DO_AJUSTE = ["America/New_York", "America/Los_Angeles"];

const lerJson = async (caminho) => JSON.parse(await readFile(caminho, "utf8"));

function json(res, status, corpo) {
  const texto = JSON.stringify(corpo);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(texto),
  });
  res.end(texto);
}

async function lerCorpo(req) {
  const partes = [];
  let total = 0;
  for await (const parte of req) {
    total += parte.length;
    if (total > 2_000_000) throw new Error("corpo grande demais");
    partes.push(parte);
  }
  return JSON.parse(Buffer.concat(partes).toString("utf8"));
}

/**
 * Descarta campo vazio ou invalido, para o overrides.json nao encher de lixo e,
 * principalmente, para um valor torto nao chegar ao build: uma hora "25:00" ou
 * uma plataforma que nao existe no mapa quebrariam o site de um jeito que so
 * apareceria no ar.
 */
function limpar(entrada, plataformas) {
  const limpo = {};
  if (entrada.oculto === true) limpo.oculto = true;
  if (entrada.destaque === true) limpo.destaque = true;
  const titulo = String(entrada.tituloBr ?? "").trim();
  if (titulo) limpo.tituloBr = titulo;
  if (plataformas.includes(entrada.plataforma)) limpo.plataforma = entrada.plataforma;
  const link = String(entrada.link ?? "").trim();
  if (/^https?:\/\//.test(link)) limpo.link = link;
  const hora = String(entrada.horario?.hora ?? "").trim();
  if (HORA_VALIDA.test(hora)) {
    limpo.horario = { hora };
    // Vespera e dia seguinte se excluem. Se os dois vierem, fica a vespera,
    // que e o que o `quandoChega` faria.
    if (entrada.horario?.vespera === true) limpo.horario.vespera = true;
    else if (entrada.horario?.diaSeguinte === true) limpo.horario.diaSeguinte = true;
    if (FUSOS_DO_AJUSTE.includes(entrada.horario?.fuso)) limpo.horario.fuso = entrada.horario.fuso;
  }
  return limpo;
}

/** O proximo lancamento de cada serie, com a hora que o site vai mostrar. */
function previas(agenda, canais, overrides) {
  const agora = Date.now() / 1000;
  const resultado = {};
  for (const serie of agenda.series) {
    const ajuste = overrides[serie.id] ?? {};
    const canal = canais.get(serie.canal);
    const plataforma = ajuste.plataforma ?? canal?.plataforma ?? null;
    // A mesma regra de src/lib/series.ts: o horario do canal so vale quando a
    // plataforma e a do canal.
    const regra = canal && canal.plataforma === plataforma ? canal.horario : null;
    const lancamentos = montarLancamentos(serie.episodios, regra, ajuste.horario ?? null);
    const proximo =
      lancamentos.find((l) => (l.airingAt ?? Date.parse(`${l.data}T23:59:59Z`) / 1000) >= agora) ??
      null;
    resultado[serie.id] = proximo;
  }
  return resultado;
}

const servidor = createServer(async (req, res) => {
  try {
    if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Length": Buffer.byteLength(PAGINA),
      });
      return res.end(PAGINA);
    }

    if (req.method === "GET" && req.url === "/api/dados") {
      const [agenda, overrides, mapa] = await Promise.all([
        lerJson(CAMINHO_AGENDA),
        lerJson(CAMINHO_OVERRIDES),
        lerJson(CAMINHO_PLATAFORMAS),
      ]);
      const canais = new Map(mapa.canais.map((c) => [`${c.tipo}:${c.id}`, c]));
      return json(res, 200, {
        atualizadoEm: agenda.atualizadoEm,
        series: agenda.series.map((s) => ({
          id: s.id,
          nome: s.nome,
          tituloBrTvmaze: s.tituloBr,
          capa: s.capa,
          site: s.site,
          tvmazeUrl: s.tvmazeUrl,
          canal: canais.get(s.canal)?.canal ?? s.canal,
          plataformaDoCanal: canais.get(s.canal)?.plataforma ?? null,
          popularidade: s.popularidade,
        })),
        previas: previas(agenda, canais, overrides),
        overrides,
        plataformas: Object.keys(mapa.plataformas),
      });
    }

    if (req.method === "POST" && req.url === "/api/salvar") {
      const recebido = await lerCorpo(req);
      const [anterior, mapa] = await Promise.all([
        lerJson(CAMINHO_OVERRIDES),
        lerJson(CAMINHO_PLATAFORMAS),
      ]);
      const plataformas = Object.keys(mapa.plataformas);

      // Preserva a chave de documentacao e regrava so as entradas com conteudo.
      const saida = { _leiame: anterior._leiame };
      for (const [id, entrada] of Object.entries(recebido)) {
        if (id.startsWith("_")) continue;
        const limpo = limpar(entrada, plataformas);
        if (Object.keys(limpo).length) saida[id] = limpo;
      }

      await gravarJson(CAMINHO_OVERRIDES, saida);
      const total = Object.keys(saida).length - 1;
      console.log(`  salvou overrides.json (${total} série(s) com ajuste)`);
      return json(res, 200, { ok: true, total });
    }

    return json(res, 404, { erro: "rota nao encontrada" });
  } catch (erro) {
    console.error(erro);
    return json(res, 500, { erro: erro.message });
  }
});

// Escuta so no loopback: nada exposto na rede local.
servidor.listen(PORTA, "127.0.0.1", () => {
  console.log(`\nAdmin rodando em http://localhost:${PORTA}`);
  console.log("Edite, clique em Salvar e depois faca commit do overrides.json.");
  console.log("Ctrl+C para encerrar.\n");
});

const PAGINA = /* html */ `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Admin — Conexão Série</title>
<style>
  * { box-sizing: border-box; }
  body { margin:0; background:#0d0c11; color:#eee; font:14px/1.5 system-ui, sans-serif; }
  header { position:sticky; top:0; z-index:5; display:flex; gap:12px; align-items:center;
           padding:12px 16px; background:#16151c; border-bottom:1px solid #272531; flex-wrap:wrap; }
  h1 { font-size:15px; margin:0; font-weight:600; }
  .info { color:#8a8496; font-size:12px; }
  input[type=text], input[type=url], select {
    background:#201e29; border:1px solid #3a3747; color:#eee; border-radius:6px;
    padding:6px 8px; font:inherit; }
  input:focus, select:focus { outline:2px solid #8b93ff; outline-offset:-1px; }
  #busca { flex:1; min-width:180px; max-width:320px; }
  button { background:#4f46e5; color:#fff; border:0; border-radius:6px; padding:8px 14px;
           font:inherit; font-weight:600; cursor:pointer; }
  button:disabled { background:#333; color:#777; cursor:default; }
  ul { list-style:none; margin:0; padding:16px; display:flex; flex-direction:column; gap:10px; }
  li { display:grid; grid-template-columns:52px 1fr; gap:12px; padding:10px;
       background:#16151c; border:1px solid #272531; border-radius:10px; }
  li.oculto { opacity:.4; }
  li.sem { border-color:#92400e; }
  img { width:52px; height:74px; object-fit:cover; border-radius:5px; background:#222; }
  .nome { font-weight:600; }
  .nome a { color:inherit; }
  .meta { color:#8a8496; font-size:12px; }
  .linha { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-top:6px; }
  .linha input[type=text], .linha input[type=url] { flex:1; min-width:160px; }
  .linha input.hora { flex:0 0 72px; min-width:0; }
  label.chk { display:inline-flex; gap:5px; align-items:center; color:#aaa; font-size:12.5px;
              cursor:pointer; user-select:none; white-space:nowrap; }
  .previa { font-size:12px; color:#c7d2fe; }
  .aviso { color:#fbbf24; font-size:11.5px; }
</style>
</head>
<body>
<header>
  <h1>Admin — Conexão Série</h1>
  <span class="info" id="resumo">carregando...</span>
  <input type="text" id="busca" placeholder="filtrar por nome...">
  <label class="chk"><input type="checkbox" id="soSemPlataforma"> só sem plataforma</label>
  <button id="salvar" disabled>Salvar</button>
</header>
<ul id="lista"></ul>

<script>
let dados = null;
let overrides = {};
let sujo = false;

const el = (t, p = {}) => Object.assign(document.createElement(t), p);
const ov = (id) => (overrides[id] ??= {});

function marcarSujo() {
  sujo = true;
  const b = document.getElementById("salvar");
  b.disabled = false;
  b.textContent = "Salvar alterações";
}

const plataformaDe = (s) => overrides[s.id]?.plataforma ?? s.plataformaDoCanal;

function textoDaPrevia(p) {
  if (!p) return "sem episódio futuro na agenda";
  const eps = p.episodios.length
    ? (p.episodios.length > 1 ? "E" + p.episodios[0] + "–" + p.episodios.at(-1) : "E" + p.episodios[0])
    : "especial";
  const quando = p.airingAt
    ? new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "short",
        day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
        .format(new Date(p.airingAt * 1000)) + " (Brasília)"
    : p.data + ", sem hora";
  const origem = { exibicao: "horário da TV", regra: "regra da plataforma", manual: "ajuste manual" }[p.origem] ?? "";
  return "próximo: T" + p.temporada + " " + eps + " · " + quando + (origem ? " · " + origem : "");
}

function render() {
  const busca = document.getElementById("busca").value.toLowerCase().trim();
  const soSem = document.getElementById("soSemPlataforma").checked;
  const lista = document.getElementById("lista");
  lista.textContent = "";

  const visiveis = dados.series.filter((s) => {
    if (soSem && plataformaDe(s)) return false;
    if (!busca) return true;
    return [s.nome, s.tituloBrTvmaze, overrides[s.id]?.tituloBr]
      .filter(Boolean).join(" ").toLowerCase().includes(busca);
  });
  for (const s of visiveis) lista.append(linha(s));

  const sem = dados.series.filter((s) => !plataformaDe(s)).length;
  const ocultas = dados.series.filter((s) => overrides[s.id]?.oculto).length;
  document.getElementById("resumo").textContent =
    dados.series.length + " séries · " + sem + " sem plataforma (fora do site) · " +
    ocultas + " ocultas · exibindo " + visiveis.length;
}

function linha(s) {
  const item = el("li");
  const aj = overrides[s.id] ?? {};
  if (aj.oculto) item.className = "oculto";
  else if (!plataformaDe(s)) item.className = "sem";

  const corpo = el("div");
  const nome = el("div", { className: "nome" });
  nome.append(el("a", { href: s.tvmazeUrl, target: "_blank", textContent: s.nome }));
  corpo.append(
    nome,
    el("div", { className: "meta",
      textContent: s.canal + " → " + (s.plataformaDoCanal ?? "sem casa fixa no Brasil") +
        (s.tituloBrTvmaze ? " · título BR do TVmaze: " + s.tituloBrTvmaze : "") }),
    el("div", { className: "previa", textContent: textoDaPrevia(dados.previas[s.id]) }),
  );

  // Linha 1: marcas e plataforma.
  const l1 = el("div", { className: "linha" });
  for (const [campo, rotulo] of [["oculto", "ocultar"], ["destaque", "destaque"]]) {
    const label = el("label", { className: "chk" });
    const chk = el("input", { type: "checkbox", checked: !!aj[campo] });
    chk.addEventListener("change", () => { ov(s.id)[campo] = chk.checked; marcarSujo(); });
    label.append(chk, document.createTextNode(rotulo));
    l1.append(label);
  }
  const sel = el("select");
  sel.append(el("option", { value: "", textContent: s.plataformaDoCanal
    ? "plataforma do canal (" + s.plataformaDoCanal + ")" : "— sem plataforma (fica fora do site) —" }));
  for (const p of dados.plataformas) sel.append(el("option", { value: p, textContent: p, selected: aj.plataforma === p }));
  sel.addEventListener("change", () => { ov(s.id).plataforma = sel.value || undefined; marcarSujo(); });
  l1.append(sel);
  corpo.append(l1);

  // Linha 2: título brasileiro e link.
  const l2 = el("div", { className: "linha" });
  const titulo = el("input", { type: "text", placeholder: "título no Brasil", value: aj.tituloBr ?? "" });
  titulo.addEventListener("input", () => { ov(s.id).tituloBr = titulo.value; marcarSujo(); });
  const link = el("input", { type: "url", placeholder: "link na plataforma (" + (s.site ?? "TVmaze não tem") + ")", value: aj.link ?? "" });
  link.addEventListener("input", () => { ov(s.id).link = link.value; marcarSujo(); });
  l2.append(titulo, link);
  corpo.append(l2);

  // Linha 3: horário, quando foge da regra. Em Brasília, a menos que a fonte
  // dê a hora de lá — ver o AjusteDeHorario, no regras.ts.
  const l3 = el("div", { className: "linha" });
  const hora = el("input", { type: "text", className: "hora", placeholder: "22:00", value: aj.horario?.hora ?? "" });
  const fuso = el("select");
  for (const [valor, nome] of [["", "de Brasília"], ["America/New_York", "de Nova York"], ["America/Los_Angeles", "de Los Angeles"]]) {
    fuso.append(el("option", { value: valor, textContent: nome, selected: (aj.horario?.fuso ?? "") === valor }));
  }
  const vesp = el("input", { type: "checkbox", checked: !!aj.horario?.vespera });
  const seg = el("input", { type: "checkbox", checked: !!aj.horario?.diaSeguinte });
  const atualizarHorario = () => {
    const h = hora.value.trim();
    ov(s.id).horario = h
      ? { hora: h, vespera: vesp.checked || undefined, diaSeguinte: seg.checked || undefined, fuso: fuso.value || undefined }
      : undefined;
    marcarSujo();
  };
  // Véspera e dia seguinte se excluem: marcar um desmarca o outro.
  vesp.addEventListener("change", () => { if (vesp.checked) seg.checked = false; atualizarHorario(); });
  seg.addEventListener("change", () => { if (seg.checked) vesp.checked = false; atualizarHorario(); });
  hora.addEventListener("input", atualizarHorario);
  fuso.addEventListener("change", atualizarHorario);
  const lv = el("label", { className: "chk" });
  lv.append(vesp, document.createTextNode("na véspera"));
  const ls = el("label", { className: "chk" });
  ls.append(seg, document.createTextNode("no dia seguinte"));
  l3.append(el("span", { className: "meta", textContent: "hora, se fugir da regra:" }), hora, fuso, lv, ls);
  if (!s.plataformaDoCanal && aj.plataforma && !aj.horario) {
    l3.append(el("span", { className: "aviso", textContent: "sem hora até você preencher" }));
  }
  corpo.append(l3);

  item.append(el("img", { src: s.capa ?? "", alt: "", loading: "lazy" }), corpo);
  return item;
}

async function carregar() {
  dados = await (await fetch("/api/dados")).json();
  overrides = Object.fromEntries(Object.entries(dados.overrides).filter(([k]) => !k.startsWith("_")));
  render();
}

document.getElementById("salvar").addEventListener("click", async () => {
  const botao = document.getElementById("salvar");
  botao.disabled = true;
  botao.textContent = "salvando...";
  const corpo = await (await fetch("/api/salvar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(overrides),
  })).json();
  if (corpo.ok) {
    sujo = false;
    botao.textContent = "salvo ✓";
    // Recarrega para a prévia do horário refletir o que foi salvo.
    await carregar();
  } else {
    botao.textContent = "erro ao salvar";
    botao.disabled = false;
  }
});

document.getElementById("busca").addEventListener("input", render);
document.getElementById("soSemPlataforma").addEventListener("change", render);
addEventListener("beforeunload", (e) => { if (sujo) e.preventDefault(); });
carregar();
</script>
</body>
</html>`;
