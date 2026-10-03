# Conexão Série

Calendário de séries com a hora em que cada episódio chega ao streaming **no
Brasil**, já convertida para o fuso de quem visita. Os próximos episódios, o
ranking de todos os tempos e a Minha lista. Irmão do [Conexão Anime](https://conexaoanime.com.br)
e do Conexão Filme, com o mesmo desenho, a mesma antena na marca e outra cor de
destaque (índigo).

Site estático (Next.js + Tailwind, `output: "export"`) servido pela Cloudflare,
mais um Worker só para a `/api/` (login e Minha lista, com banco D1) — ver
"Conta e Minha lista" abaixo. A primeira versão (25/09/2026) não tinha conta;
ela veio em 29/09/2026, com o menu do anime e do filme.

## O atalho da área de trabalho

O atalho **"Conexão Série"** abre o site no navegador com dois cliques, sem
janela de terminal (`scripts/conexao-serie.vbs` → `scripts/lancador.mjs`):

- traz do GitHub a agenda que o bot atualizou (só avanço rápido — se houver
  qualquer coisa local no caminho, ele não mexe e segue com o que tem);
- recompila só se algo mudou desde o último build, com uma página
  "Compilando…" que recarrega sozinha;
- deixa o servidor em segundo plano em `http://localhost:4330/`, e clicar de
  novo só abre o navegador.

Para desligar: `http://localhost:4330/__lancador/`. Estado e logs em
`.lancador/`. Se o atalho sumir, ele aponta para `wscript.exe` com o
argumento `"C:\Users\Admin\Desktop\conexao-serie\scripts\conexao-serie.vbs"` e
o ícone `scripts\conexao-serie.ico` (gerado por `npm run icone`).

## O dia a dia

```bash
npm run dev                # site em http://localhost:3000
npm run fetch              # busca a agenda no TVmaze
npm run fetch:ranking      # monta o ranking de todos os tempos (leva uns 15 min)
npm run admin              # painel de ajustes em http://localhost:4331
npm run conferir:horarios  # confere a conta de horários contra casos conhecidos
npm run conferir:slugs     # confere a regra dos endereços das séries
npm run build              # gera o site estático em out/ (sempre por aqui, nunca `next build`)
npm run preview            # compila e serve o out/ como a Cloudflare, na 4330
```

O GitHub Actions roda o `fetch` todo dia de madrugada, marcado para 3h17 de
Brasília (`.github/workflows/atualizar-agenda.yml`), e commita se algo mudou; o
commit republica o site sozinho. O GitHub costuma atrasar esses agendamentos em
horas — por isso o horário é cedo e fora da hora cheia.

## Conta e Minha lista

Pedidas em 29/09/2026 ("segue o padrão do Conexão anime e filme"), com o
código do Conexão Filme, que veio do Anime: login pelo Google (OAuth com PKCE,
sem senha nenhuma), sessão com o hash do token no banco, e apagar a conta de
verdade (LGPD).

- **Servidor:** `worker/` (`index.ts` são as rotas; `auth.ts`, `sessao.ts`,
  `lista.ts` e `tvmaze.ts`). Só a `/api/*` passa por ele (`run_worker_first` no
  `wrangler.jsonc`); o resto são os arquivos do `out/`, que continuam de graça.
- **Banco:** D1 `conexaoserie` (região ENAM), criado em 29/09/2026 com o
  `db/schema.sql` aplicado. O catálogo `series` é escrito PELO WORKER, lido do
  TVmaze, nunca pelo navegador.
- **Quatro situações:** assistindo, quero ver, terminei, abandonei.
- **O "+"** está nos próximos, no ranking e na página de cada série. Ele
  adiciona como "Quero ver" e já abre a janela de editar.
- **O atalho da área de trabalho não tem servidor de conta:** as telas dizem
  "funciona no site publicado" e o "+" some.

### O login do Google

**Ligado e testado em 29/09/2026**: o João entrou com a conta dele no site
publicado, e a conta nasceu no banco de produção. O projeto "Conexão Série" do
Google Cloud e o cliente `site` foram criados nesse dia; o ID do cliente está
no `wrangler.jsonc`. A chave secreta foi por
`npx wrangler secret put GOOGLE_CLIENT_SECRET`, e nunca vai por arquivo do git.
Sem as duas, o site funciona inteiro e a /entrar/ diz "o login está quase
pronto". Como foi montado, para refazer:

1. No [Google Cloud](https://console.cloud.google.com/), criar o projeto
   "Conexão Série" — o Filme usou o Gmail do próprio site, porque o e-mail de
   suporte aparece na tela de login do Google.
2. Tela de consentimento OAuth: externo, nome "Conexão Série", domínio
   `conexaoserie.com.br`, a política em `/privacidade/` e os termos em
   `/termos/`. Publicar (os escopos são só `openid email profile`, que não
   pedem verificação do Google).
3. Credenciais → ID do cliente OAuth → Aplicativo da Web, com os retornos
   `https://conexaoserie.com.br/api/auth/callback` e
   `http://localhost:8787/api/auth/callback` (o segundo é o do teste no
   computador).
4. O **ID do cliente** vai no `wrangler.jsonc` (`vars.GOOGLE_CLIENT_ID`: não é
   segredo, vai na URL de login). A **chave secreta** vai por
   `npx wrangler secret put GOOGLE_CLIENT_SECRET`, e no teste local pelo
   `.dev.vars` (o git ignora).

O Discord tem o código pronto no Worker e aparece sozinho no dia das chaves
dele (`DISCORD_CLIENT_ID` e `DISCORD_CLIENT_SECRET`). Nesse dia, a
/privacidade/ e os /termos/ mudam junto, porque é um serviço novo recebendo
dados.

### Testar a conta no computador

```bash
npx wrangler d1 execute conexaoserie --local --file=db/schema.sql   # uma vez
npm run build                        # o wrangler dev serve o out/
npx wrangler dev --port 8787         # segredos no .dev.vars
```

Sem as chaves do Google, dá para testar logado criando uma sessão no banco
local: um `INSERT` em `usuarios`, `identidades` e `sessoes`, com o
`token_hash` = SHA-256 em base64url do token, e o cookie `sessao=<token>`
posto no navegador pelo console. Foi assim que a lista foi testada em
29/09/2026 (adicionar, editar, remover, busca, conta).

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
| `src/data/agenda.json` | o `npm run fetch`, automático | episódios dos últimos 7 dias até 60 à frente, crus, e o endereço de cada série |
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

## A página de cada série

`/series/<slug>/` responde "que horas sai" para uma série só — é a pergunta que
mais se digita no Google. A lista de todas é a `/proximos/`, com filtro por
plataforma e por estreia: ela tomou o lugar da `/series/` e da `/estreias/` em
29/09/2026 (as duas redirecionam, ver `public/_redirects`). O painel
do próximo episódio roda no navegador (contagem regressiva, fuso de quem olha, e
troca sozinho para o episódio seguinte quando o atual sai); o resto é HTML do
build, no horário de Brasília.

- **O endereço nunca muda.** O `fetch` escolhe o slug na primeira vez que a
  série aparece (o nome brasileiro, se já houver; senão o original; empate vira
  `-ano` e depois `-id`) e grava no `agenda.json`. Dali em diante só
  reaproveita: se o admin der um título brasileiro depois, muda o título da
  página, e não o endereço. A regra está em `scripts/slug.mjs`.
- **A página não some no fim da temporada.** A série que sai da janela do TVmaze
  continua no `agenda.json`, sem episódios e com o último que saiu, por um ano
  (`GUARDA_DIAS` no `fetch`). A página passa a dizer "o último foi o episódio
  10, em 24 de setembro".
- **Só série que vai ao ar tem página**: a de canal sem casa fixa (ABC, CBS…)
  ganha a sua quando o admin escolher a plataforma.
- **O limite da Cloudflare**: o plano grátis aceita 20.000 arquivos por versão
  do site, e cada página de série gera 9. Medido em 25/09/2026: 103 séries,
  1.166 arquivos no site inteiro — cabem umas 2.000 séries. Se um dia chegar
  perto, é o `GUARDA_DIAS` que baixa.

## O ranking

`/ranking/` é o **top 100 de todos os tempos**, e `/ranking/<categoria>/` o de
cada gênero (drama, terror, tribunal…) e origem (coreanas, britânicas, em
espanhol). O formato é o do Conexão Filme, pedido do João em 29/09/2026. O
ranking das séries **desta semana**, que era a `/ranking/` até então, mudou
para `/ranking/no-ar/`, a outra aba — e é para ele que o carrossel da home
aponta.

- **Sai do índice inteiro do TVmaze** (`scripts/fetch-ranking.mjs`, umas 370
  páginas), porque o TVmaze não tem busca por "mais bem avaliadas". O robô
  roda às segundas, e sempre que disparado à mão.
- **A nota sozinha não serve**: o TVmaze não diz quantos votos cada nota tem.
  O corte é o "peso" dele (quanta gente acompanha a série): cada lista usa o
  maior peso que ainda deixa 300 candidatas, entre 95 e 60. O script conta a
  medição que escolheu esses números.
- **Sem lista brasileira**: o TVmaze tem só umas 30 séries em português com
  nota. Ver o topo do script antes de tentar de novo.
- O clique leva à página da série no site quando ela existe, e à ficha do
  TVmaze quando não (Breaking Bad acabou e não tem "que horas sai").

## O que entra e o que não entra

- **Só ficção**: séries roteirizadas, animação e documentário. Reality, talk
  show e jornal ficam fora (decisão de 25/09/2026: eram 26 realities americanos
  por semana contra 43 séries).
- **Anime não entra**: animação em japonês mora no Conexão Anime.
- **Sem filtro de país**: série coreana ou espanhola da Netflix entra, como no
  anime.

## Onde o site vive

No ar em **https://conexaoserie.com.br** desde 28/09/2026, e só ali: o Worker
`conexaoserie` da Cloudflare, só com arquivos estáticos (a pasta `out/`). O
domínio é do Registro.br, com os servidores de nome da Cloudflare. O DNSSEC
saiu na troca de DNS; para religar, é ligar na Cloudflare e colar o DS dela no
Registro.br.

**O endereço é decidido no `wrangler.jsonc`, e não no painel**: o domínio
(`custom_domain`) e o `.workers.dev` desligado estão escritos lá. Todo deploy
aplica aquele arquivo, e o que ele não diz o deploy desfaz — foi assim que o
`.workers.dev` do anime, desligado só no painel, voltou ao ar.

**Todo push na `main` republica o site** (Workers Builds, ligado em
29/09/2026): build `npm run build`, deploy `npx wrangler deploy`, sem preview
builds — ninguém usa outra branch, e os endereços de preview estão desligados
no `wrangler.jsonc`. É o que faz o commit diário do robô virar site novo. Cada
commit ganha no GitHub um check "Workers Builds: conexaoserie": é ali que se
confere se o deploy passou, e o link leva ao log.

**O que mora na zona, e não no `wrangler.jsonc`** (configurado no painel em
29/09/2026, porque é regra da Cloudflare e não do Worker):

- o `www` redireciona (308) para o endereço sem `www`, pela regra "Redirect
  from WWW to root" em Rules → Redirect Rules, com um registro `AAAA www 100::`
  com proxy — o `100::` é o endereço "vazio" que a Cloudflare recomenda para
  nome que só redireciona;
- `http://` vira `https://` (Always Use HTTPS) e o TLS mínimo é 1.2, em
  SSL/TLS → Edge Certificates.
- o `contato@conexaoserie.com.br` encaminha para o e-mail do João (Email →
  Email Routing). O domínio veio com registros de "não uso e-mail" (MX `.` e
  `v=spf1 -all`), que precisaram sair na mão; o `_dmarc` com `p=reject` ficou,
  porque o site não manda e-mail e isso impede e-mail falso em nome dele.
  **Ligar o Email Routing não cria o endereço**: sem uma regra em Routing
  rules, a Cloudflare recusa com "550 Address does not exist".

Para subir na mão, sem esperar o GitHub:

```bash
npm run build
npx wrangler deploy
```

O wrangler desta máquina está logado na conta da Cloudflare.

**Google Search Console**: propriedade de domínio `conexaoserie.com.br`,
verificada por um TXT `google-site-verification` no DNS da Cloudflare, com o
`sitemap.xml` enviado em 29/09/2026. Não apague esse TXT: sem ele o Google
deixa de reconhecer o João como dono do site.

## O que falta decidir

- **Discord**: `DISCORD` em `src/lib/marca.ts` fica `null` até existir um
  convite permanente. As redes (@conexaoseriebr no X, Facebook, Instagram,
  YouTube e TikTok) estão no rodapé desde 03/10/2026, conferidas deslogado.
- **Apoiar**: fica riscado no menu ("em breve") até existir uma página no
  LivePix (`APOIO` em `marca.ts`). A do anime não foi reaproveitada — cada site
  recebe na sua.
- **Cor de destaque**: índigo, um token só (`--p-acento` no `globals.css`).
