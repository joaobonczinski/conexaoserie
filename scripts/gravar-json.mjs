// Grava um JSON de dados sem risco de deixar o arquivo pela metade.
//
// ============ POR QUE ISTO NAO E `writeFile` E PRONTO ============
//
// `writeFile` TRUNCA o arquivo antes de escrever o conteudo novo. Se o processo
// morrer nessa janela — um `| head` que fecha o cano, um Ctrl+C, a maquina
// desligando — o que sobra e um arquivo de 0 byte. Ja aconteceu aqui com o
// `temas.json`, e so voltou por `git checkout`.
//
// Escrever num `.tmp` e RENOMEAR resolve, porque `rename` no mesmo volume ou
// troca o arquivo inteiro ou nao faz nada.
//
// ============ E POR QUE O RENAME PRECISA DE TENTATIVAS ============
//
// No Windows, `rename` sobre um arquivo que OUTRO PROCESSO tem aberto falha com
// EPERM — o sistema nao permite substituir arquivo em uso, ao contrario do
// Linux. Quem costuma estar com estes JSON abertos e o proprio `next dev`, que
// observa `src/data/` para recarregar a pagina quando o dado muda.
//
// ISSO CUSTOU UMA COLETA: em 07/09/2026 o `fetch:temas-youtube` morreu na faixa
// 39 de 90 com EPERM, no meio de uma rodada de cota que nao volta. As 38
// primeiras estavam salvas (o `.tmp` fez o trabalho dele), mas as 51 restantes
// so no dia seguinte.
//
// A janela em que o observador segura o arquivo e de milissegundos, entao
// tentar de novo depois de uma pausa curta resolve quase sempre. Nao e
// disfarce de defeito: e a unica saida, porque o script nao manda no editor
// nem no servidor de desenvolvimento de quem o roda. No CI, onde nada disso
// existe, a primeira tentativa passa e este codigo nunca roda.

import { rename, writeFile } from "node:fs/promises";

const TENTATIVAS = 5;
const ESPERA = 120;

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Grava `dados` em `caminho` como JSON, de forma atomica.
 *
 * `espacos` e o mesmo do `JSON.stringify`: 2 para os catalogos que se le no
 * diff, 1 para os arquivos grandes gerados.
 */
export async function gravarJson(caminho, dados, espacos = 2) {
  const temporario = `${caminho}.tmp`;
  await writeFile(temporario, JSON.stringify(dados, null, espacos) + "\n");

  for (let tentativa = 1; ; tentativa++) {
    try {
      await rename(temporario, caminho);
      return;
    } catch (e) {
      // SO EPERM E EBUSY SAO RETENTADOS. Disco cheio, caminho inexistente ou
      // permissao de verdade nao melhoram com espera, e insistir neles so
      // atrasaria o erro que a pessoa precisa ler.
      const valeTentar = e.code === "EPERM" || e.code === "EBUSY";
      if (!valeTentar || tentativa === TENTATIVAS) throw e;
      await esperar(ESPERA * tentativa);
    }
  }
}
