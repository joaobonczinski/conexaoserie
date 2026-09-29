// Monta o ranking de TODOS OS TEMPOS, o geral e o de cada categoria, e grava
// em src/data/ranking.json. Rode com `npm run fetch:ranking`.
//
// O robo da agenda roda este toda segunda-feira (e sempre que for disparado a
// mao): nota de serie muda devagar, e cada rodada baixa o indice inteiro do
// TVmaze — umas 370 paginas.
//
// ============ POR QUE O INDICE INTEIRO ============
//
// Pedido do Joao (29/09/2026): "ranking geral das series, e por categoria,
// igual no filme e anime". O Conexão Filme pede ao TMDB "os mais bem avaliados
// de terror" e recebe pronto; o TVmaze nao tem essa busca. O que ele tem e o
// indice de todas as series (/shows?page=N, 250 por pagina), com nota e
// genero. Entao o ranking sai de la, filtrado aqui.
//
// ============ A NOTA SOZINHA NAO SERVE ============
//
// O TVmaze da a MEDIA das notas, mas nao QUANTOS votos ela tem — e sem um
// minimo, qualquer serie com tres votos 10 ganharia de Breaking Bad. O que ele
// da e o "peso" (weight, de 0 a 100), que mede quanta gente acompanha a
// serie. Ele faz aqui o papel do minimo de votos do Conexão Filme.
//
// CADA LISTA USA O MAIOR PISO DE PESO QUE AINDA DEIXA 300 CANDIDATAS (tres
// vezes o tamanho da lista): acima disso, o top 100 deixaria de escolher e
// passaria so a ordenar as famosas. Medido em 29/09/2026 sobre as 90.260
// series do indice (9.622 no bolo):
//   - o teto e 95. Com 98, o geral perdia os documentarios da BBC (Planet
//     Earth III, 9,3, tem peso 96) e ficava so com o que e famoso; com 95 o
//     topo e Planet Earth III, Breaking Bad, Firefly, Band of Brothers — o
//     mesmo desenho do top de TV do IMDb;
//   - o chao e 60. Genero pequeno (faroeste, com 71 series no bolo inteiro)
//     desce ate ali e mostra o que tem: "Top 64", e nao "Top 100".
//
// ============ QUEM ENTRA ============
//
// A mesma regra da agenda: ficcao, animacao e documentario (reality e talk
// show ficam fora), sem anime (mora no Conexão Anime) e sem o genero "Adult".
// SEM filtro de plataforma: o ranking de todos os tempos inclui Breaking Bad
// mesmo que o mapa de canais nao saiba onde ela passa hoje no Brasil.
//
// NOME SEM LETRA LATINA FICA FORA ("Анна-детективъ"): a fonte do site so tem o
// alfabeto latino, e ninguem aqui acharia a serie por esse nome.
//
// ============ O QUE FICOU DE FORA, E POR QUE ============
//
// SERIES BRASILEIRAS: o TVmaze tem so umas 30 em portugues com nota, quase
// todas originais da Netflix votados por pouca gente. A lista sairia com 20
// series, Sintonia com 4,0 e uma portuguesa no meio (Rabo de Peixe: o canal
// da Netflix nao tem pais, e o idioma e o mesmo). Japonesas (live-action) e
// turcas ficaram fora pelo mesmo motivo — poucas, e de nota fraca.

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gravarJson } from "./gravar-json.mjs";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DESTINO = resolve(RAIZ, "src/data/ranking.json");
const TITULOS_BR = resolve(RAIZ, "src/data/titulos-br.json");
const API = "https://api.tvmaze.com";

/** A mesma pausa do fetch da agenda (ver la): ~17 chamadas a cada 10 s. */
const PAUSA_MS = 600;
const TAMANHO = 100;

/** Do mais exigente para o menos (ver o topo: o teto e 95, o chao e 60). */
const PISOS = [95, 90, 85, 80, 75, 70, 60];
/** Quantas candidatas o piso precisa deixar: tres vezes o tamanho da lista. */
const CANDIDATAS = 3 * TAMANHO;
/** Lista com menos series que isto nao vira pagina. */
const MINIMO_POR_LISTA = 20;
/** Com menos series que isto no geral, o script para sem gravar. */
const PISO_DE_SEGURANCA = 50;
/** O titulo brasileiro de uma serie quase nunca muda; reconsulta a cada 30 dias. */
const VALIDADE_DO_TITULO_DIAS = 30;

const TIPOS = new Set(["Scripted", "Animation", "Documentary"]);

/** O pais de uma serie: o do canal de TV, ou o do streaming quando ele tem. */
const paisDe = (s) => s.network?.country?.code ?? s.webChannel?.country?.code ?? null;

/** Alguma letra fora do alfabeto latino (cirilico, hangul, kanji...). */
const temLetraNaoLatina = (texto) => /[^\p{Script=Latin}\P{L}]/u.test(texto);

/**
 * As listas. `chave` e o endereco (/ranking/<chave>/); o texto das paginas
 * mora em src/lib/ranking.ts, junto com a ordem do seletor. `filtro` recebe a
 * serie crua do TVmaze.
 */
const LISTAS = [
  { chave: "geral", filtro: () => true },
  { chave: "acao", filtro: (s) => s.genres.includes("Action") },
  { chave: "animacao", filtro: (s) => s.type === "Animation" },
  { chave: "aventura", filtro: (s) => s.genres.includes("Adventure") },
  { chave: "comedia", filtro: (s) => s.genres.includes("Comedy") },
  { chave: "crime", filtro: (s) => s.genres.includes("Crime") },
  { chave: "documentarios", filtro: (s) => s.type === "Documentary" },
  { chave: "drama", filtro: (s) => s.genres.includes("Drama") },
  { chave: "espionagem", filtro: (s) => s.genres.includes("Espionage") },
  { chave: "familia", filtro: (s) => s.genres.includes("Family") },
  { chave: "fantasia", filtro: (s) => s.genres.includes("Fantasy") },
  { chave: "ficcao-cientifica", filtro: (s) => s.genres.includes("Science-Fiction") },
  { chave: "guerra", filtro: (s) => s.genres.includes("War") },
  { chave: "historia", filtro: (s) => s.genres.includes("History") },
  { chave: "medicas", filtro: (s) => s.genres.includes("Medical") },
  { chave: "misterio", filtro: (s) => s.genres.includes("Mystery") },
  { chave: "romance", filtro: (s) => s.genres.includes("Romance") },
  { chave: "sobrenatural", filtro: (s) => s.genres.includes("Supernatural") },
  { chave: "suspense", filtro: (s) => s.genres.includes("Thriller") },
  { chave: "terror", filtro: (s) => s.genres.includes("Horror") },
  { chave: "tribunal", filtro: (s) => s.genres.includes("Legal") },
  { chave: "faroeste", filtro: (s) => s.genres.includes("Western") },
  // PELO IDIOMA, e nao pelo pais: as coreanas da Netflix tem canal sem pais.
  { chave: "coreanas", filtro: (s) => s.language === "Korean" },
  { chave: "britanicas", filtro: (s) => paisDe(s) === "GB" },
  // "Em espanhol", e nao "espanholas": La Casa de Papel e Elite saem pelo
  // canal da Netflix, sem pais, e so o idioma as encontra — junto com as da
  // America Latina, que o idioma nao separa.
  { chave: "em-espanhol", filtro: (s) => s.language === "Spanish" },
];

// ---------------------------------------------------------------------------

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function pedir(caminho) {
  for (let tentativa = 1; ; tentativa++) {
    const resposta = await fetch(`${API}${caminho}`, {
      headers: { "User-Agent": "conexao-serie (github.com/joaobonczinski/conexaoserie)" },
    });
    if (resposta.status === 429 && tentativa < 6) {
      await espera(tentativa * 5000);
      continue;
    }
    // O indice acaba com um 404: e o fim da lista, e nao um erro.
    if (resposta.status === 404) return null;
    if (!resposta.ok) throw new Error(`TVmaze respondeu ${resposta.status} em ${caminho}`);
    await espera(PAUSA_MS);
    return resposta.json();
  }
}

/** "2026-09-29" do dia `deslocamento` dias a partir de hoje, em UTC. */
function dataISO(deslocamento) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + deslocamento);
  return d.toISOString().slice(0, 10);
}

async function baixarBolo() {
  const bolo = [];
  let vistas = 0;
  for (let pagina = 0; ; pagina++) {
    const lista = await pedir(`/shows?page=${pagina}`);
    if (lista === null) break;
    vistas += lista.length;
    for (const s of lista) {
      if (!TIPOS.has(s.type)) continue;
      if (s.type === "Animation" && s.language === "Japanese") continue;
      if (s.genres?.includes("Adult")) continue;
      if (s.rating?.average == null) continue;
      if (temLetraNaoLatina(s.name)) continue;
      bolo.push(s);
    }
    if (pagina % 50 === 0) console.log(`  pagina ${pagina}: ${vistas} series vistas`);
  }
  console.log(`  ${vistas} series no indice, ${bolo.length} no bolo`);
  return bolo;
}

function montarLista(lista, bolo) {
  const daLista = bolo.filter(lista.filtro);
  // O primeiro piso que deixa CANDIDATAS series; se nenhum deixa, o chao.
  const piso =
    PISOS.find((p) => daLista.filter((s) => s.weight >= p).length >= CANDIDATAS) ?? PISOS.at(-1);
  const passam = daLista.filter((s) => s.weight >= piso);
  // Desempate pelo peso, e depois pelo id: sem regra, dois 8,9 trocariam de
  // lugar sozinhos a cada coleta.
  passam.sort(
    (a, b) => b.rating.average - a.rating.average || b.weight - a.weight || a.id - b.id,
  );
  return { chave: lista.chave, piso, total: passam.length, escolhidas: passam.slice(0, TAMANHO) };
}

async function main() {
  console.log("Baixando o indice de series do TVmaze...");
  const bolo = await baixarBolo();

  const listas = LISTAS.map((l) => montarLista(l, bolo)).filter((l) => {
    if (l.escolhidas.length >= MINIMO_POR_LISTA || l.chave === "geral") return true;
    console.log(`  ${l.chave}: so ${l.escolhidas.length} series, fica sem pagina`);
    return false;
  });

  const geral = listas.find((l) => l.chave === "geral");
  if (!geral || geral.escolhidas.length < PISO_DE_SEGURANCA) {
    console.error(
      `O ranking geral veio com ${geral?.escolhidas.length ?? 0} series (o piso e ${PISO_DE_SEGURANCA}). ` +
        `O arquivo NAO foi gravado; o de antes continua valendo.`,
    );
    process.exit(1);
  }

  // --- O titulo brasileiro, pelo mesmo cache do fetch da agenda --------------
  const escolhidas = new Map();
  for (const l of listas) for (const s of l.escolhidas) escolhidas.set(s.id, s);

  let cache = {};
  try {
    cache = JSON.parse(await readFile(TITULOS_BR, "utf8"));
  } catch {
    cache = {};
  }
  const hoje = dataISO(0);
  const vencido = dataISO(-VALIDADE_DO_TITULO_DIAS);
  let consultados = 0;
  for (const s of escolhidas.values()) {
    const guardado = cache[s.id];
    if (guardado && guardado.conferidoEm >= vencido) continue;
    const akas = (await pedir(`/shows/${s.id}/akas`)) ?? [];
    // SO O BRASIL, e Portugal nao serve de reserva (ver o fetch da agenda).
    cache[s.id] = { titulo: akas.find((a) => a.country?.code === "BR")?.name ?? null, conferidoEm: hoje };
    consultados++;
    if (consultados % 100 === 0) console.log(`  ${consultados} titulos brasileiros consultados`);
  }
  await gravarJson(TITULOS_BR, cache);

  const series = {};
  for (const s of escolhidas.values()) {
    const canal = s.webChannel ? `web:${s.webChannel.id}` : s.network ? `net:${s.network.id}` : null;
    series[s.id] = {
      nome: s.name,
      tituloBr: cache[s.id]?.titulo ?? null,
      ano: s.premiered ? Number(s.premiered.slice(0, 4)) : null,
      capa: s.image?.medium ?? null,
      nota: s.rating.average,
      peso: s.weight,
      canal,
      tvmazeUrl: s.url,
    };
  }

  await gravarJson(DESTINO, {
    _leiame:
      "Gerado por scripts/fetch-ranking.mjs a partir do indice do TVmaze (CC BY-SA). " +
      "Nao edite a mao: a proxima coleta sobrescreve.",
    geradoEm: new Date().toISOString(),
    listas: listas.map(({ chave, piso, total, escolhidas: e }) => ({
      chave,
      piso,
      total,
      ids: e.map((s) => s.id),
    })),
    series,
  });

  console.log("");
  for (const l of listas) {
    console.log(`${l.chave.padEnd(18)} peso >= ${String(l.piso).padStart(2)}: ${l.escolhidas.length} de ${l.total}`);
  }
  console.log(`\nGravadas ${listas.length} listas com ${escolhidas.size} series; ${consultados} titulos consultados.`);
}

main().catch((erro) => {
  console.error(`\nFalhou: ${erro.message}`);
  process.exitCode = 1;
});
