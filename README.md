# Conexão Série

Calendário de séries com a hora em que cada episódio chega ao streaming **no
Brasil**, já convertida para o fuso de quem visita. Estreias dos próximos dois
meses e ranking do que está no ar. Irmão do [Conexão Anime](https://conexaoanime.com.br),
com o mesmo desenho, a mesma antena na marca e outra cor de destaque (índigo).

Site estático (Next.js + Tailwind, `output: "export"`) servido pela Cloudflare.
Sem login, sem banco, sem API própria — decisão da primeira versão (25/09/2026).
Login, lista e shoutbox podem vir depois, trazidos do anime.

## O dia a dia

```bash
npm run dev                # site em http://localhost:3000
npm run fetch              # busca a agenda no TVmaze
npm run admin              # painel de ajustes em http://localhost:4331
npm run conferir:horarios  # confere a conta de horários contra casos conhecidos
npm run build              # gera o site estático em out/
```

O GitHub Actions roda o `fetch` todo dia às 6h de Brasília
(`.github/workflows/atualizar-agenda.yml`) e commita se algo mudou; o commit
republica o site sozinho.

## De onde vêm os dados, e por que não o TMDB

A agenda vem do [TVmaze](https://www.tvmaze.com/api), sob licença **CC BY-SA**,
que aceita uso comercial com crédito — o rodapé linka o TVmaze em todas as
páginas. **Não tire esse link**: é a condição da licença.

O TMDB foi descartado de propósito: os termos dele classificam como uso
comercial um "destination website" ou site que gera receita, e exigem contrato
separado. O "onde assistir" do TMDB (que vem do JustWatch) ficou de fora junto.

## Como os dados funcionam

São três arquivos, e a separação é o ponto principal:

| Arquivo | Quem escreve | O que tem |
|---|---|---|
| `src/data/agenda.json` | o `npm run fetch`, automático | episódios dos últimos 7 dias até 60 à frente, crus |
| `src/data/plataformas.json` | você, à mão | canal → plataforma no Brasil, e a regra de horário de cada uma |
| `src/data/overrides.json` | você, pelo admin | ajustes por série |

Nunca edite o `agenda.json` — ele é sobrescrito todo dia. A hora em que o
episódio chega ao Brasil **não** é gravada no fetch: ela é calculada no build
(`src/lib/regras.ts`), então corrigir uma regra de plataforma vale no próximo
build, sem esperar o próximo fetch.

### A regra de horário de cada plataforma

É a parte que nenhuma API entrega, e o que diferencia o site. Conferido em
25/09/2026 em fontes brasileiras:

| Plataforma | Quando sai | Em Brasília |
|---|---|---|
| Netflix, Prime Video, Disney+ | meia-noite de Los Angeles | 4h (5h fora do horário de verão americano) |
| HBO Max (originais) | 21h de Nova York | 22h (23h no inverno americano) |
| HBO e FX (TV) | junto com a exibição americana | o horário da TV, convertido |
| Apple TV | 21h de Nova York **na véspera** | 22h da véspera |

A regra fica no fuso **da plataforma**, e não em Brasília: é isso que acerta o
horário de verão americano sozinho. Hulu e Paramount+ usam o padrão americano e
ainda não foram vistos no Brasil (`conferido: null` no JSON).

Série que foge da regra (Marvel e Star Wars no Disney+ costumam sair na véspera
às 22h) se corrige no admin, com a hora de Brasília.

### Canal sem casa fixa

ABC, CBS, NBC, FOX, Peacock, STARZ e outros têm `plataforma: null`: as séries
deles são baixadas e aparecem no admin (filtro "só sem plataforma"), mas só vão
para o site quando você escolhe onde elas passam aqui. Sem hora escolhida, o
card mostra o dia e "sem hora" — melhor que inventar.

Canal que não está no mapa (Tencent, BBC iPlayer…) nem é baixado. O `fetch`
lista no fim os que mais tiveram episódio de ficção, para você decidir se algum
merece entrar.

## O que entra e o que não entra

- **Só ficção**: séries roteirizadas, animação e documentário. Reality, talk
  show e jornal ficam fora (decisão de 25/09/2026: eram 26 realities americanos
  por semana contra 43 séries).
- **Anime não entra**: animação em japonês mora no Conexão Anime.
- **Sem filtro de país**: série coreana ou espanhola da Netflix entra, como no
  anime.

## Deploy (ainda não feito)

1. Registrar `conexaoserie.com.br` e pôr na Cloudflare.
2. Em Workers & Pages → Create → Import a repository, apontar para este
   repositório. Comando de build `npm run build`; o `wrangler.jsonc` já diz que
   o site é a pasta `out/`, sem Worker.
3. Adicionar o domínio no Worker e desligar o `.workers.dev` (o motivo está no
   README do anime).
4. Ligar o Email Routing para o `contato@` funcionar — a Política de
   Privacidade aponta para ele.

## O que falta decidir

- **Redes sociais e Discord**: `REDES` e `DISCORD` em `src/lib/marca.ts` estão
  vazios até cada perfil existir de verdade.
- **Apoiar**: fica riscado no menu ("em breve") até existir uma página no
  LivePix (`APOIO` em `marca.ts`). A do anime não foi reaproveitada — cada site
  recebe na sua.
- **Cor de destaque**: índigo, um token só (`--p-acento` no `globals.css`).
