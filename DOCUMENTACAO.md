# Lumora - Painel IPTV

Lumora é uma plataforma full-stack IPTV/media streaming que agrega canais ao vivo, filmes, séries e animes de múltiplas fontes gratuitas em um único painel unificado.

---

## Sumário

- [Arquitetura](#arquitetura)
- [Stack Tecnológico](#stack-tecnológico)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Backend](#backend)
  - [API Endpoints](#api-endpoints)
  - [Banco de Dados](#banco-de-dados)
- [Frontend](#frontend)
  - [Componentes](#componentes)
  - [Páginas](#páginas)
- [Fontes de Conteúdo](#fontes-de-conteúdo)
- [Como Executar](#como-executar)
- [Scripts Úteis](#scripts-úteis)

---

## Arquitetura

```
┌─────────────────────────────────────────────┐
│               Frontend (React + Vite)        │
│              localhost:5173                  │
│                                              │
│  react-router-dom │ hls.js │ CSS Modules     │
└──────────────────┬──────────────────────────┘
                   │ Proxy Vite (/api -> :3001)
                   ▼
┌─────────────────────────────────────────────┐
│        Backend (Node.js + Express)           │
│              localhost:3001                  │
│                                              │
│  better-sqlite3 │ CORS │ UUID                │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│           SQLite (lumora.db)                 │
│                                              │
│  Tabelas Node.js: categories, items, users, │
│  favorites                                   │
│  Tabelas Scrapers: movies, series, animes,  │
│  iptv_channels, episodes, etc.              │
└─────────────────────────────────────────────┘
                   ▲
                   │
┌─────────────────────────────────────────────┐
│        Scrapers (Python)                     │
│                                              │
│  requests + BeautifulSoup4                   │
│  scraper.py │ scraper_filmes.py │            │
│  parser_m3u.py │ scraper_doramore.py         │
└─────────────────────────────────────────────┘
```

O backend Node.js serve a API REST e gerencia o banco SQLite. Os scrapers Python coletam conteúdo de sites externos e alimentam as mesmas tabelas. O frontend React consome a API e renderiza a interface.

---

## Stack Tecnológico

| Camada         | Tecnologia                                                                 |
|----------------|----------------------------------------------------------------------------|
| Backend API    | Node.js (ESM), Express 4.18, CORS                                          |
| Banco de Dados | SQLite via better-sqlite3 9.4 (modo WAL, FK habilitadas)                   |
| Scrapers       | Python 3.14, requests, BeautifulSoup4                                      |
| Frontend       | React 19, React DOM 19, react-router-dom 7                                 |
| Build          | Vite 8, @vitejs/plugin-react 6                                             |
| Player Vídeo   | hls.js 1.6 (streams .m3u8)                                                |
| Lint           | ESLint 10 (flat config)                                                    |

---

## Estrutura do Projeto

```
D:\iptvlumora\
├── DOCUMENTACAO.md              ← Este arquivo
├── lumora.db                    ← Banco SQLite
├── backend/
│   ├── package.json
│   ├── src/
│   │   ├── server.js            ← Servidor Express (porta 3001)
│   │   ├── database.js          ← Conexão e init do banco
│   │   └── seed.js              ← Dados de exemplo
│   ├── parser_m3u.py            ← Importa playlists M3U (iptv-org)
│   ├── import_iptv.py           ← Importa Xtream M3U
│   ├── organize_iptv.py         ← Organiza categorias IPTV
│   ├── scraper.py               ← Scraper de animes
│   ├── scraper_quick.py         ← Scraper rápido de animes
│   ├── scraper_filmes.py        ← Scraper de filmes/séries
│   ├── scraper_doramore.py      ← Scraper de doramas
│   ├── scraper_multi.py         ← Framework multi-fonte
│   ├── fetch_players.py         ← Busca tokens de players
│   ├── seed_real.cjs            ← Seed com URLs reais
│   ├── migrate.py               ← Migração de tabelas (Python)
│   ├── migrate.cjs              ← Migração de tabelas (Node.js)
│   ├── migrate_favorites.cjs    ← Migração favoritos
│   ├── anime_urls.txt           ← 1939 URLs de animes
│   └── iptv_m3u.m3u             ← Playlist Xtream (748K linhas)
├── frontend/
│   ├── package.json
│   ├── vite.config.js           ← Proxy /api -> :3001, porta 5173
│   ├── index.html               ← HTML de entrada (pt-BR)
│   ├── eslint.config.js
│   └── src/
│       ├── main.jsx             ← Ponto de entrada React
│       ├── App.jsx              ← Rotas e layout (15 rotas)
│       ├── App.css              ← Tema escuro global
│       ├── index.css            ← Resets e variáveis CSS
│       ├── components/
│       │   ├── Navbar.jsx       ← Barra superior com busca global
│       │   └── Sidebar.jsx      ← Sidebar com categorias
│       ├── pages/
│       │   ├── Home.jsx         ← Dashboard com hero + stats
│       │   ├── CategoryPage.jsx ← Listagem por categoria
│       │   ├── PlayerPage.jsx   ← Player de vídeo
│       │   ├── IPTVPage.jsx     ← Interface IPTV completa
│       │   ├── AnimeList.jsx    ← Grid de animes
│       │   ├── AnimeDetail.jsx  ← Detalhe do anime + episódios
│       │   ├── MovieList.jsx    ← Grid de filmes
│       │   ├── MovieDetail.jsx  ← Detalhe do filme + players
│       │   ├── SeriesList.jsx   ← Grid de séries
│       │   ├── SeriesDetail.jsx ← Detalhe da série + temporadas
│       │   ├── SearchPage.jsx   ← Busca global agrupada
│       │   ├── SearchResults.jsx← Resultados simplificados
│       │   ├── FavoritesPage.jsx← Favoritos por tipo
│       │   ├── SettingsPage.jsx ← Configurações do usuário
│       │   └── AdminPage.jsx    ← Painel admin + CRUD
│       └── assets/
│           └── hero.png         ← Imagem do hero na Home
```

---

## Backend

### API Endpoints

#### Categorias e Itens (tabela `items`)
| Método | Rota                | Descrição                              |
|--------|---------------------|----------------------------------------|
| GET    | `/api/categories`   | Lista categorias ordenadas             |
| GET    | `/api/items`        | Itens com filtros (category, type, search, featured, page) |
| GET    | `/api/items/:id`    | Detalhe do item + incrementa views     |
| POST   | `/api/items`        | Cria novo item                         |
| PUT    | `/api/items/:id`    | Atualiza item                          |
| DELETE | `/api/items/:id`    | Remove item                            |
| GET    | `/api/stats`        | Estatísticas do dashboard              |
| GET    | `/api/search`       | Busca simples                          |
| GET    | `/api/search/all`   | Busca global (filmes, séries, animes, IPTV) |

#### Conteúdo Scrapeado
| Método | Rota                                | Descrição                          |
|--------|-------------------------------------|------------------------------------|
| GET    | `/api/animes`                       | Lista animes (gênero, busca, page) |
| GET    | `/api/animes/:id`                   | Detalhe + episódios                |
| GET    | `/api/movies`                       | Lista filmes (gênero, busca, page) |
| GET    | `/api/movies/:id`                   | Detalhe do filme                   |
| GET    | `/api/series`                       | Lista séries (gênero, busca, page) |
| GET    | `/api/series/:id`                   | Detalhe + temporadas/episódios     |

#### IPTV
| Método | Rota                                    | Descrição                         |
|--------|-----------------------------------------|-----------------------------------|
| GET    | `/api/iptv/groups`                      | Grupos de canais com contagem     |
| GET    | `/api/iptv/channels`                    | Canais (filtro grupo, busca, page)|
| GET    | `/api/iptv/channels/:id`                | Detalhe do canal                  |
| GET    | `/api/iptv/categories`                  | Categorias hierárquicas           |
| GET    | `/api/iptv/categories/:id/channels`     | Canais por categoria              |

#### Favoritos
| Método | Rota                  | Descrição                    |
|--------|-----------------------|------------------------------|
| GET    | `/api/favorites`      | Lista favoritos (filtro type)|
| POST   | `/api/favorites`      | Adicionar favorito           |
| DELETE | `/api/favorites`      | Remover favorito             |
| GET    | `/api/favorites/check`| Verificar se é favorito      |

---

### Banco de Dados

#### Tabelas principais (gerenciadas pelo Node.js)

| Tabela       | Colunas                                                                 |
|--------------|-------------------------------------------------------------------------|
| `categories` | id TEXT PK, name, slug UNIQUE, icon, sort_order, created_at            |
| `items`      | id TEXT PK, title, description, category_id FK, type CHECK, stream_url, thumbnail, poster, year, rating, duration, seasons, episodes, tags, featured, views, created_at |
| `users`      | id TEXT PK, username UNIQUE, password, role CHECK('user','admin'), created_at |
| `favorites`  | id INTEGER PK, item_type CHECK, item_id, title, thumbnail, created_at, UNIQUE(item_type, item_id) |

#### Tabelas de conteúdo scrapeado

| Tabela              | Colunas                                                                 |
|---------------------|-------------------------------------------------------------------------|
| `movies`            | id INTEGER PK, slug UNIQUE, title, year, rating, thumbnail, duration, genre, description, source_url, players JSON, created_at |
| `series`            | id INTEGER PK, slug UNIQUE, title, year, rating, thumbnail, duration, genre, description, source_url, players, seasons, episodes JSON, created_at |
| `series_episodes`   | id INTEGER PK, series_id FK, season, episode_number, slug, label, source_url, players, created_at |
| `animes`            | id INTEGER PK, slug UNIQUE, title, description, year, rating, thumbnail, genre, source_url, created_at |
| `episodes`          | id INTEGER PK, anime_id FK, episode_number, slug, label, source_url, player_dublado, player_legendado, created_at |
| `iptv_channels`     | id INTEGER PK, name, tvg_id, logo, group_name, stream_url, source, active, category_id FK, created_at |
| `iptv_categories`   | id INTEGER PK, name UNIQUE, slug UNIQUE, icon, parent_id FK (auto-referência), sort_order, created_at |

O banco usa **modo WAL** (Write-Ahead Logging) para melhor performance de leitura/escrita concorrente entre Node.js e Python.

---

## Frontend

### Componentes

- **Navbar.jsx** — Barra superior com:
  - Botão hamburger para toggle da sidebar
  - Logo "Lumora" com gradiente
  - Formulário de busca global com debounce
  - Links rápidos: IPTV, Filmes, Séries, Animes, Favoritos, Configurações

- **Sidebar.jsx** — Sidebar esquerda com:
  - Lista de categorias carregada de `/api/categories`
  - Estado ativo baseado na rota atual
  - Rodapé com versão

### Páginas (15 rotas)

| Rota              | Página            | Descrição                                      |
|-------------------|-------------------|------------------------------------------------|
| `/`               | Home              | Dashboard com hero, stats, seções de conteúdo  |
| `/category/:slug` | CategoryPage      | Itens por categoria com filtros e paginação    |
| `/player/:id`     | PlayerPage        | Player HLS.js com sidebar de relacionados      |
| `/iptv`           | IPTVPage          | Grid de canais + player embutido               |
| `/animes`         | AnimeList         | Catálogo de animes com busca e paginação       |
| `/anime/:id`      | AnimeDetail       | Detalhe + episódios + iframe player            |
| `/filmes`         | MovieList         | Catálogo de filmes com busca                   |
| `/filme/:id`      | MovieDetail       | Detalhe + múltiplos players + trailer          |
| `/series`         | SeriesList        | Catálogo de séries com busca                   |
| `/serie/:id`      | SeriesDetail      | Temporadas agrupadas + seletor de episódios    |
| `/search`         | SearchPage        | Busca global com resultados agrupados por tipo |
| `/search/results` | SearchResults     | Resultados simplificados                       |
| `/favorites`      | FavoritesPage     | Favoritos agrupados por tipo, com abas         |
| `/settings`       | SettingsPage      | Preferências: player, qualidade, tema, etc.    |
| `/admin`          | AdminPage         | Admin: stats, import M3U, CRUD de itens        |

### Player de Vídeo

- Usa **hls.js** para streams HLS (`.m3u8`) com recovery automático
- Player nativo para `.mp4`
- Suporte a iframe embutido (animes com dublado/legendado)
- Resolução AJAX de players do site thefilmes.net

### Tema

- Tema escuro padrão com variáveis CSS customizáveis
- Cores:
  - `--accent: #e94560` (vermelho)
  - `--bg-primary: #0a0a1a` (azul escuro)
  - `--bg-secondary: #1a1a2e`
  - `--text-primary: #ffffff`
  - `--text-secondary: #b0b0b0`
- Suporte a tema claro via configurações

---

## Fontes de Conteúdo

| Fonte                      | Tipo               | Script                    |
|----------------------------|--------------------|---------------------------|
| iptv-org.github.io         | Canais IPTV (M3U)  | `parser_m3u.py`           |
| Xtream (playlist local)    | Canais IPTV (M3U)  | `import_iptv.py`          |
| animesonlinecc.to          | Animes             | `scraper.py`              |
| thefilmes.net (Pobreflix)  | Filmes e Séries    | `scraper_filmes.py`       |
| doramore.com               | Doramas (K-Dramas) | `scraper_doramore.py`     |
| Blender Foundation         | Filmes demo (MP4)  | `seed_real.cjs`           |
| live.embedstream.me        | Canais demo        | `seed.js` / `seed_real.cjs` |
| demo.unified-streaming.com | Streams demo (HLS) | `seed.js`                 |

---

## Como Executar

### 1. Backend

```bash
cd backend
npm install
npm run seed       # Popula dados de exemplo
npm run dev        # Inicia servidor em :3001 (com nodemon)
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev        # Inicia servidor em :5173
```

Acessar: `http://localhost:5173`

### 3. Scrapers (Python)

```bash
# Animes
python backend/scraper.py --pages 5 --limit 20

# Filmes/Séries
python backend/scraper_filmes.py --pages 10 --limit 50

# Doramas
python backend/scraper_doramore.py

# Playlists IPTV
python backend/parser_m3u.py
python backend/import_iptv.py
python backend/organize_iptv.py
```

---

## Scripts Úteis

### Migrações de Banco

```bash
node backend/migrate.cjs          # Cria tabelas movies/series/episodes
python backend/migrate.py         # Mesmo que acima (versão Python)
node backend/migrate_favorites.cjs # Cria tabela favorites
```

### Seed com URLs Reais

```bash
node backend/seed_real.cjs
```
Insere canais reais (NASA TV, Al Jazeera, DW News, Bloomberg, etc.) e filmes open-source da Blender Foundation com streams funcionais.

### Organização de Categorias IPTV

```bash
python backend/organize_iptv.py
```
Mapeia grupos brutos do Xtream para categorias hierárquicas organizadas (60+ categorias).

### Busca de Players de Episódios

```bash
python backend/fetch_players.py
```
Processa episódios sem player e busca URLs de iframe dos players do Blogger.

---

## Observações Técnicas

- O backend usa **ES Modules** (`"type": "module"` no package.json)
- O banco SQLite fica em `D:\iptvlumora\lumora.db` e é compartilhado entre Node.js e Python
- O Vite faz proxy de `/api` para `http://localhost:3001` em desenvolvimento
- Não há arquivos `.env` — configurações são hardcoded nos fontes
- O arquivo `iptv_m3u.m3u` tem ~748K linhas e deve ser baixado separadamente (não incluso no repositório)
- `anime_urls.txt` contém 1939 URLs de animes para processamento em lote
