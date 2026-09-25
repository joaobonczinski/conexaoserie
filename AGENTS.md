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
npm run build
```

Depois, veja no navegador de verdade (`.claude/launch.json`: `producao` serve o
`out/` com o wrangler, como a Cloudflare; `dev` é o `next dev`; `admin` é o
painel local).

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

## Como trabalhar aqui

- Commitar e dar push (o João usa o GitHub como backup e para o deploy).
- Mensagem de commit explicando **por quê**, não só o quê.
- Comentário em código explica a razão, não o óbvio — no tom dos arquivos que
  vieram do anime.
- Relate o que falhou e o que não foi verificado.
