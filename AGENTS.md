<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Conexão Série

Irmão do Conexão Anime (`../calendario-animes`): mesmo desenho, mesmas peças,
outra cor. Antes de inventar um componente, veja se o anime já tem — quase
tudo aqui veio de lá, com os comentários explicando por quê. O README conta
como os dados funcionam.

## Verificação (faça sempre, nesta ordem)

```bash
npx tsc --noEmit
npx eslint src               # as regras do React Compiler pegam coisa real
npm run conferir:horarios    # a conta de horários, contra casos conhecidos
npm run conferir:slugs       # a regra dos endereços das séries
npm run build
```

Depois, veja no navegador de verdade (`.claude/launch.json`: `producao` serve o
`out/` com o wrangler, como a Cloudflare; `dev` é o `next dev`; `admin` é o
painel local). Dirija os campos, não só olhe.

**Sessão aberta em outra pasta** (o Clickverse, por exemplo): o
`preview_start` por nome lê o `launch.json` DAQUELA pasta e sobe o servidor
errado — aconteceu duas vezes em 25/09/2026, e trocar a pasta da sessão no
meio não resolveu. Nesse caso, sirva o `out/` em segundo plano e abra a URL com
`preview_start {url}`, ou abra a sessão já nesta pasta.

**O atalho da área de trabalho** roda `scripts/lancador.mjs` sem janela. Porta
4330 (a 4321 é do Clickverse; a 4331, do admin), estado em `.lancador/`,
desligar em `http://localhost:4330/__lancador/`. Para testar sem abrir o
navegador do João: `CONEXAO_SEM_NAVEGADOR=1`.

## Armadilhas

- **`Date.now()` em página é recusado pelo lint** (função impura na
  renderização). O instante do build mora em `src/lib/build.ts`
  (`INSTANTE_DO_BUILD`); o relógio de verdade só existe no navegador.
- **Valor que só existe no navegador** (fuso, hora, âncora, tema) vem por
  `useSyncExternalStore` com `getServerSnapshot` neutro (`src/lib/relogio.ts`),
  e não por `setState` dentro de `useEffect`. É o que faz o HTML do build e a
  hidratação baterem.
- **Componente de cliente não pode importar `src/lib/series.ts`**: ele importa
  o `agenda.json` inteiro, que iria para o navegador de todo visitante. Por isso
  a tradução de gêneros mora em `generos.ts` e os rótulos em `rotulos.ts`.
- **`regras.ts` não pode importar nada do projeto em tempo de execução** (só
  `import type`): o `conferir:horarios` e o admin o rodam direto no Node, que
  não entende o atalho `@/`.
- **Hora de streaming é regra, não dado**: o TVmaze devolve meio-dia UTC quando
  não sabe a hora. Por isso `temHora` só vale para canal de TV, e o streaming usa
  a regra da plataforma em `plataformas.json`.
- **A porta do admin é 4331**, e não a 4321 do anime: a 4321 é do lançador do
  Clickverse, que fica ligado em segundo plano.
- **`opengraph-image` sai sem extensão** no `out/`; o `public/_headers` o
  rotula como PNG. Sem isso o cartão de compartilhamento some e o build passa
  igual.
- **Não existe fonte com japonês aqui**: a M PLUS 2 baixa só o `latin`. Se um
  dia entrar título em alfabeto não latino, o subconjunto precisa mudar.
- **Sempre `npm run build`, nunca `npx next build`**: no Windows o Next 16.2
  grava o prefetch como pasta (`__next.ranking/__PAGE__.txt`) e o navegador
  pede arquivo (`__next.ranking.__PAGE__.txt`) — 404 em todo prefetch.
  `scripts/fix-segment-prefetch.mjs` conserta, e só roda pelo `npm run build`.
- **`EBUSY` no build** é o `out/` travado por um servidor servindo a pasta (o
  wrangler que sobreviveu ao fim do shell, inclusive). E um build que morreu no
  meio pode deixar o `.next` corrompido: o erro seguinte é um incompreensível
  "next/font/google queries have exactly one entry". Apague `.next` e `out`.
- **Fita com scroll-snap reencaixa no mesmo card** quando os filhos mudam de
  lugar: na hidratação, o dia de hoje abria rolado até o fim da fila. Por isso
  a fita do calendário tem `key` que muda com a ordem.
- **Grid sem colunas explícitas vaza no celular**: a coluna automática cresce
  até o título mais longo (o `truncate` nunca age). Use `grid-cols-1`.
- **O slug de uma série nunca muda** depois de gravado no `agenda.json` — é o
  endereço que o Google guardou. Não "conserte" um slug feio renomeando: a
  página velha vira 404. Regra em `scripts/slug.mjs`.
- **Card que é link não pode ser `<a>`**: o selo da plataforma é outro link, e
  link dentro de link quebra o HTML. O link fica no nome, esticado com
  `LINK_QUE_COBRE` (`src/lib/enderecos.ts`) — e o card precisa de `relative`.
- **Link para página de série vai com `prefetch={false}`**: a lista de séries e
  a fita do dia têm dezenas deles, e cada um que entra na tela baixaria uma
  página inteira no plano de dados de quem rola.

## Como trabalhar aqui

- Commitar e dar push (o João usa o GitHub como backup e para o deploy).
- Mensagem de commit explicando **por quê**, não só o quê.
- Comentário em código explica a razão, não o óbvio — no tom dos arquivos que
  vieram do anime.
- Relate o que falhou e o que não foi verificado.
