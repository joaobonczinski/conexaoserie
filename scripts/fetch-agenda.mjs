// Puxa do TVmaze os episodios da semana passada ate dois meses a frente e grava
// em src/data/agenda.json. Rode com `npm run fetch`.
//
// O arquivo gerado fica commitado, entao o site continua de pe mesmo se o
// TVmaze estiver fora do ar na hora do build — a mesma escolha do season.json do
// Conexão Anime.
//
// ============ O QUE ESTE SCRIPT NAO DECIDE, e isso e de proposito ============
//
// Ele guarda o dado CRU: data do episodio, o carimbo do TVmaze e se o canal tem
// horario de verdade. Em que PLATAFORMA brasileira a serie sai e a que HORAS ela
// chega aqui sao decididos na hora de montar o site (src/lib/series.ts), a
// partir de src/data/plataformas.json e dos ajustes do admin.
//
// Assim, corrigir a regra de horario de uma plataforma e trocar uma linha e
// rodar o build — nao e esperar o proximo fetch. E o mesmo desenho do Conexão
// Anime: `season.json` e o que veio de fora, `overrides.json` e o que e nosso.
//
// ============ DE ONDE VEM CADA PEDACO ============
//
// - Dos 7 dias passados ate 7 a frente: `/schedule/web` e `/schedule?country=US`
//   dia a dia. Esses tem cache de uma hora no TVmaze, e e a semana que o
//   calendario mostra — onde um adiamento precisa aparecer logo.
// - Do 8o dia ate o 60o: `/schedule/full`, que traz TODO episodio futuro numa
//   chamada so (12 MB, cache de 24 h). So serve para as estreias; ninguem
//   precisa saber hoje, ao minuto, o horario de um episodio de novembro.
//
// Licenca: os dados do TVmaze sao CC BY-SA e aceitam uso comercial com credito
// (o rodape linka o TVmaze). Conferido em https://www.tvmaze.com/api.

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gravarJson } from "./gravar-json.mjs";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DESTINO = resolve(RAIZ, "src/data/agenda.json");
const TITULOS_BR = resolve(RAIZ, "src/data/titulos-br.json");
const PLATAFORMAS = resolve(RAIZ, "src/data/plataformas.json");

const API = "https://api.tvmaze.com";

const DIAS_PARA_TRAS = 7;
const DIAS_DIA_A_DIA = 7;
const DIAS_PARA_FRENTE = 60;

/**
 * O TVmaze aceita "ao menos 20 chamadas a cada 10 segundos" por IP. 600 ms entre
 * uma e outra da ~17 a cada 10 s: folga para o GitHub Actions dividir IP com
 * outro job sem tomar 429.
 */
const PAUSA_MS = 600;

/** O titulo brasileiro de uma serie quase nunca muda; reconsulta a cada 30 dias. */
const VALIDADE_DO_TITULO_DIAS = 30;

/**
 * Os tipos de serie que entram. Reality, talk show, jornal, esporte e game show
 * ficam fora por decisao do Joao (25/09/2026): numa semana medida eram 26
 * realities americanos contra 43 series de ficcao, e quase ninguem acompanha
 * Survivor ou Real Housewives no Brasil. Poluiriam a grade.
 */
const TIPOS = new Set(["Scripted", "Animation", "Documentary"]);

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function pedir(caminho) {
  for (let tentativa = 1; ; tentativa++) {
    const resposta = await fetch(`${API}${caminho}`, {
      headers: { "User-Agent": "conexao-serie (github.com/joaobonczinski/conexaoserie)" },
    });
    // 429 e o TVmaze pedindo calma. Ele nao manda `retry-after`, entao a espera
    // cresce a cada tentativa.
    if (resposta.status === 429 && tentativa < 5) {
      console.warn(`  429 em ${caminho}, esperando ${tentativa * 5}s...`);
      await espera(tentativa * 5000);
      continue;
    }
    if (!resposta.ok) {
      throw new Error(`TVmaze respondeu ${resposta.status} em ${caminho}`);
    }
    await espera(PAUSA_MS);
    return resposta.json();
  }
}

/** "2026-09-25" do dia `deslocamento` dias a partir de hoje, em UTC. */
function dataISO(deslocamento) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + deslocamento);
  return d.toISOString().slice(0, 10);
}

/**
 * A chave de um canal, igual a de src/data/plataformas.json.
 *
 * PELO ID, e nao pelo nome: "Channel 4" existe como rede e como canal de
 * streaming, com ids diferentes, e o TVmaze ja renomeou canal antes ("Apple TV+"
 * virou "Apple TV"). O nome fica no JSON so para quem le.
 */
function chaveDoCanal(serie) {
  if (serie.webChannel) return `web:${serie.webChannel.id}`;
  if (serie.network) return `net:${serie.network.id}`;
  return null;
}

/** O show vem em `show` no schedule por pais e em `_embedded.show` nos outros. */
const serieDo = (episodio) => episodio.show ?? episodio._embedded?.show ?? null;

async function main() {
  const mapa = JSON.parse(await readFile(PLATAFORMAS, "utf8"));
  const canais = new Map(
    mapa.canais.map((c) => [`${c.tipo}:${c.id}`, c]),
  );

  // --- 1. Os episodios --------------------------------------------------------
  const porEpisodio = new Map();
  const guardar = (lista) => {
    for (const e of lista) porEpisodio.set(e.id, e);
  };

  console.log("Buscando o calendario completo (episodios futuros)...");
  const completo = await pedir("/schedule/full");
  const limiteFuturo = dataISO(DIAS_PARA_FRENTE);
  guardar(completo.filter((e) => e.airdate && e.airdate <= limiteFuturo));

  // Dia a dia DEPOIS do completo: o `set` do Map faz o dado fresco (cache de 1 h)
  // passar por cima do de 24 h para os mesmos episodios.
  console.log("Buscando dia a dia a semana passada e a proxima...");
  for (let d = -DIAS_PARA_TRAS; d <= DIAS_DIA_A_DIA; d++) {
    const data = dataISO(d);
    guardar(await pedir(`/schedule/web?date=${data}`));
    guardar(await pedir(`/schedule?country=US&date=${data}`));
  }
  console.log(`  ${porEpisodio.size} episodios no total, antes dos filtros`);

  // --- 2. Os filtros ---------------------------------------------------------
  const descartes = { canal: 0, tipo: 0, anime: 0, especial: 0 };
  const canaisIgnorados = new Map();
  const series = new Map();

  for (const e of porEpisodio.values()) {
    const s = serieDo(e);
    if (!s || !e.airdate) continue;

    const chave = chaveDoCanal(s);
    const canal = chave ? canais.get(chave) : null;
    if (!canal) {
      descartes.canal++;
      if (TIPOS.has(s.type)) {
        const nome = s.webChannel?.name ?? s.network?.name ?? "?";
        canaisIgnorados.set(`${chave} ${nome}`, (canaisIgnorados.get(`${chave} ${nome}`) ?? 0) + 1);
      }
      continue;
    }
    if (!TIPOS.has(s.type)) {
      descartes.tipo++;
      continue;
    }
    // ANIME MORA NO CONEXÃO ANIME. A Netflix e o Disney+ tem animacao japonesa
    // semanal, e ela chegaria aqui como "Animation". O idioma e o criterio: o
    // resto da animacao (Futurama, Simpsons) continua.
    if (s.type === "Animation" && s.language === "Japanese") {
      descartes.anime++;
      continue;
    }
    // "Especial insignificante" e o nome que o proprio TVmaze da para bastidor,
    // resumo e making of. Especial "significativo" (o de Natal de uma serie)
    // continua, porque e episodio de verdade.
    if (e.type === "insignificant_special") {
      descartes.especial++;
      continue;
    }

    let serie = series.get(s.id);
    if (!serie) {
      serie = {
        id: s.id,
        nome: s.name,
        generos: s.genres ?? [],
        tipo: s.type,
        idioma: s.language ?? null,
        // `medium` e o poster de 210x295; `original` e o arquivo cheio, que o
        // card so pede em tela retina, pelo srcset.
        capa: s.image?.medium ?? null,
        capaGrande: s.image?.original ?? null,
        nota: s.rating?.average ?? null,
        // O "peso" do TVmaze (0 a 100) mede o interesse na serie. Serve de
        // desempate no ranking, como a popularidade da AniList no anime.
        popularidade: s.weight ?? 0,
        canal: chave,
        site: s.officialSite ?? null,
        tvmazeUrl: s.url,
        estreou: s.premiered ?? null,
        episodios: [],
      };
      series.set(s.id, serie);
    }

    serie.episodios.push({
      temporada: e.season,
      numero: e.number ?? null,
      data: e.airdate,
      // Unix em segundos, SEMPRE absoluto. A conversao para o fuso de quem olha
      // acontece so no navegador.
      carimbo: Math.floor(Date.parse(e.airstamp) / 1000),
      // "Tem horario de verdade" so vale para canal de TV. No streaming o
      // TVmaze devolve meio-dia UTC quando nao sabe a hora, e isso nao e hora
      // nenhuma — ver o `horario.tipo` em plataformas.json.
      temHora: Boolean(e.airtime) && canal.horario.tipo === "exibicao",
    });
  }

  for (const serie of series.values()) {
    serie.episodios.sort(
      (a, b) => a.carimbo - b.carimbo || (a.numero ?? 0) - (b.numero ?? 0),
    );
  }

  // --- 3. O titulo brasileiro ------------------------------------------------
  // Vem dos "akas" do TVmaze, e e raro: numa amostra de 7 series de setembro de
  // 2026, so Lanterns tinha ("Lanternas"). O resto se preenche no admin. O cache
  // evita pedir de novo o titulo de uma serie que ja foi conferida.
  let cache = {};
  try {
    cache = JSON.parse(await readFile(TITULOS_BR, "utf8"));
  } catch {
    cache = {};
  }
  const hoje = dataISO(0);
  const vencido = dataISO(-VALIDADE_DO_TITULO_DIAS);
  let consultados = 0;
  for (const serie of series.values()) {
    const guardado = cache[serie.id];
    if (guardado && guardado.conferidoEm >= vencido) continue;
    const akas = await pedir(`/shows/${serie.id}/akas`);
    // SO O BRASIL, e Portugal nao serve de reserva: o titulo de la costuma ser
    // outro ("A Guerra dos Tronos"), e seria pior do que o nome original.
    const br = akas.find((a) => a.country?.code === "BR")?.name ?? null;
    cache[serie.id] = { titulo: br, conferidoEm: hoje };
    consultados++;
  }
  await gravarJson(TITULOS_BR, cache);

  for (const serie of series.values()) {
    serie.tituloBr = cache[serie.id]?.titulo ?? null;
  }

  // --- 4. Gravar -------------------------------------------------------------
  const lista = [...series.values()].sort(
    (a, b) => b.popularidade - a.popularidade || a.nome.localeCompare(b.nome),
  );
  await gravarJson(DESTINO, {
    atualizadoEm: new Date().toISOString(),
    janela: { de: dataISO(-DIAS_PARA_TRAS), ate: limiteFuturo },
    series: lista,
  });

  const semPlataforma = lista.filter((s) => canais.get(s.canal)?.plataforma === null);
  console.log(`\nGravadas ${lista.length} series em src/data/agenda.json`);
  console.log(`  com plataforma no Brasil        : ${lista.length - semPlataforma.length}`);
  console.log(`  canal sem casa fixa (so admin)  : ${semPlataforma.length}`);
  console.log(`  titulos brasileiros consultados : ${consultados}`);
  console.log(`  descartados: canal fora do mapa ${descartes.canal}, tipo ${descartes.tipo}, anime ${descartes.anime}, especial ${descartes.especial}`);

  // Os canais com serie de ficcao que ficaram de fora. Nao e erro — e a lista
  // de onde procurar se uma serie que alguem esperava nao apareceu.
  const maiores = [...canaisIgnorados].sort((a, b) => b[1] - a[1]).slice(0, 12);
  if (maiores.length) {
    console.log("\nCanais fora do mapa com mais episodios de ficcao:");
    for (const [canal, n] of maiores) console.log(`  ${String(n).padStart(4)}  ${canal}`);
  }
}

main().catch((erro) => {
  console.error(`\nFalhou: ${erro.message}`);
  process.exitCode = 1;
});
