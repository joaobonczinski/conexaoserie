-- O banco do Conexão Série (Cloudflare D1): as contas e a Minha Lista.
--
-- Aplicar no banco local:   npx wrangler d1 execute conexaoserie --local --file=db/schema.sql
-- Aplicar no de producao:   npx wrangler d1 execute conexaoserie --remote --file=db/schema.sql
--
-- IDEMPOTENTE: tudo e `IF NOT EXISTS`, entao reaplicar nao estraga nada.
-- Por isso `ALTER TABLE` NUNCA entra aqui (licao do Conexão Anime): ele nao e
-- idempotente e quebra a reaplicacao inteira com "duplicate column name".
-- Coluna nova vai na `CREATE TABLE` (para bancos novos) e o ALTER roda avulso,
-- por db/migracoes/ (para o banco que ja existe).
--
-- A estrutura de contas e a do Conexão Filme, que veio do Anime.

-- As contas. NAO GUARDA SENHA: o login e so por Google (e Discord, quando ligado).
CREATE TABLE IF NOT EXISTS usuarios (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL,
  nome          TEXT,
  avatar_url    TEXT,
  criado_em     TEXT NOT NULL,
  atualizado_em TEXT NOT NULL
);

-- Por onde cada conta entra. A chave e o `sub` do provedor, NUNCA o e-mail: o
-- `sub` e estavel para sempre e o e-mail muda (e pode ser reciclado, o que
-- daria a conta antiga de alguem para um desconhecido).
--
-- NAO HA VINCULACAO ENTRE PROVEDORES: entrar pelo Discord com o mesmo e-mail de
-- uma conta Google cria conta NOVA. Juntar pelo e-mail seria confiar que os
-- dois verificaram o mesmo endereco do mesmo jeito.
CREATE TABLE IF NOT EXISTS identidades (
  provedor   TEXT NOT NULL CHECK (provedor IN ('google','discord')),
  sub        TEXT NOT NULL,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  email      TEXT,
  criado_em  TEXT NOT NULL,
  PRIMARY KEY (provedor, sub)
);
CREATE INDEX IF NOT EXISTS idx_identidades_usuario ON identidades(usuario_id);

-- As sessoes. So o HASH do token fica aqui: se o banco vazar, ninguem monta um
-- cookie valido com o que esta nele.
CREATE TABLE IF NOT EXISTS sessoes (
  id          TEXT PRIMARY KEY,
  token_hash  TEXT NOT NULL UNIQUE,
  usuario_id  TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  expira_em   TEXT NOT NULL,
  criado_em   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessoes_usuario ON sessoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_expira  ON sessoes(expira_em);

-- O catalogo: uma linha por serie que ALGUEM pos na lista. Compartilhado, e
-- nao dado pessoal de ninguem.
--
-- QUEM ESCREVE AQUI E O WORKER, lendo do TVmaze, e nunca o navegador (a licao
-- que o Filme registrou): como a linha e de todos, um navegador mal-
-- intencionado conseguiria renomear uma serie para todo mundo que a tem.
--
-- `titulo_br` e o titulo brasileiro dos "akas" do TVmaze, quando existe. O
-- ajuste do admin (src/data/overrides.json) ganha dele na tela.
CREATE TABLE IF NOT EXISTS series (
  tvmaze_id     INTEGER PRIMARY KEY,
  nome          TEXT NOT NULL,
  titulo_br     TEXT,
  ano           INTEGER,
  capa          TEXT,
  atualizado_em TEXT NOT NULL
);

-- A Minha Lista.
--
-- QUATRO ESTADOS, e nao os tres do Filme: serie tem episodio, entao existe o
-- "assistindo" do Anime. O "pausado" do Anime ficou de fora — em serie, parar
-- no meio e esperar a proxima temporada, e isso e "assistindo".
CREATE TABLE IF NOT EXISTS lista_itens (
  id            TEXT PRIMARY KEY,
  usuario_id    TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tvmaze_id     INTEGER NOT NULL REFERENCES series(tvmaze_id),
  status        TEXT NOT NULL CHECK (status IN ('assistindo','quero_ver','terminei','abandonei')),
  -- De 1 a 10, de meio em meio, como no Conexão Anime. NULL e "sem nota", que
  -- nao pode virar zero.
  nota          REAL CHECK (nota IS NULL OR (nota >= 1 AND nota <= 10)),
  anotacoes     TEXT,
  -- Carimbado quando o status vira "terminei", e apagado quando sai dele.
  terminado_em  TEXT,
  criado_em     TEXT NOT NULL,
  atualizado_em TEXT NOT NULL,
  UNIQUE (usuario_id, tvmaze_id)
);
CREATE INDEX IF NOT EXISTS idx_lista_usuario        ON lista_itens(usuario_id);
CREATE INDEX IF NOT EXISTS idx_lista_usuario_status ON lista_itens(usuario_id, status);
