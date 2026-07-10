import { categories, items } from './data.js';

const TMDB_KEY = process.env.TMDB_API_KEY || '';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p';

async function tmdbFetch(endpoint, params = {}) {
  if (!TMDB_KEY) return null;
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  url.searchParams.set('api_key', TMDB_KEY);
  url.searchParams.set('language', 'pt-BR');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) return null;
  return res.json();
}

function imgUrl(p, size = 'w500') {
  if (!p) return null;
  return `${TMDB_IMG}/${size}${p}`;
}

function json(res, data, status = 200) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return res;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return json(res, {}).end();
  }

  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;
  const params = Object.fromEntries(url.searchParams);

  try {
    // === CATEGORIES ===
    if (path === '/api/categories' && req.method === 'GET') {
      return json(res, categories.sort((a, b) => a.sort_order - b.sort_order)).end();
    }

    // === ITEMS ===
    if (path === '/api/items' && req.method === 'GET') {
      let filtered = [...items];
      if (params.category) filtered = filtered.filter(i => i.category_id === params.category);
      if (params.type) filtered = filtered.filter(i => i.type === params.type);
      if (params.featured === '1') filtered = filtered.filter(i => i.featured === 1);
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(i => i.title.toLowerCase().includes(q) || i.tags.toLowerCase().includes(q));
      }
      filtered.sort((a, b) => (b.featured - a.featured) || (b.rating - a.rating) || a.title.localeCompare(b.title));
      const limit = parseInt(params.limit) || 100;
      const page = parseInt(params.page) || 1;
      const offset = (page - 1) * limit;
      const paged = filtered.slice(offset, offset + limit);
      return json(res, { items: paged, total: filtered.length, page, limit }).end();
    }

    // === ITEMS BY ID ===
    if (path.startsWith('/api/items/') && req.method === 'GET') {
      const id = path.split('/api/items/')[1];
      const item = items.find(i => i.id === id);
      if (item) return json(res, item).end();
      return json(res, { error: 'Not found' }, 404).end();
    }

    // === POST/PUT/DELETE items (admin) ===
    if (path === '/api/items' && req.method === 'POST') {
      const body = await readBody(req);
      const newItem = { id: 'custom_' + Date.now(), views: 0, ...body };
      items.push(newItem);
      return json(res, newItem, 201).end();
    }

    if (path.startsWith('/api/items/') && req.method === 'PUT') {
      const id = path.split('/api/items/')[1];
      const idx = items.findIndex(i => i.id === id);
      if (idx === -1) return json(res, { error: 'Not found' }, 404).end();
      const body = await readBody(req);
      items[idx] = { ...items[idx], ...body };
      return json(res, { success: true }).end();
    }

    if (path.startsWith('/api/items/') && req.method === 'DELETE') {
      const id = path.split('/api/items/')[1];
      const idx = items.findIndex(i => i.id === id);
      if (idx !== -1) items.splice(idx, 1);
      return json(res, { success: true }).end();
    }

    // === STATS ===
    if (path === '/api/stats' && req.method === 'GET') {
      return json(res, {
        totalItems: items.length,
        totalChannels: items.filter(i => i.type === 'channel').length,
        totalMovies: items.filter(i => i.type === 'movie').length,
        totalSeries: items.filter(i => i.type === 'series').length,
        totalAnimes: items.filter(i => i.type === 'anime').length,
        featured: items.filter(i => i.featured === 1).length,
      }).end();
    }

    // === SEARCH ===
    if (path === '/api/search' && req.method === 'GET') {
      const q = (params.q || '').toLowerCase();
      if (!q) return json(res, []).end();
      const results = items.filter(i => i.title.toLowerCase().includes(q) || i.tags.toLowerCase().includes(q)).sort((a, b) => b.rating - a.rating).slice(0, 20);
      return json(res, results).end();
    }

    // === GLOBAL SEARCH ===
    if (path === '/api/search/all' && req.method === 'GET') {
      const q = (params.q || '').toLowerCase();
      if (q.length < 2) return json(res, { movies: [], series: [], animes: [], iptv: [] }).end();
      const lim = parseInt(params.limit) || 10;
      return json(res, {
        movies: items.filter(i => i.type === 'movie' && i.title.toLowerCase().includes(q)).slice(0, lim),
        series: items.filter(i => i.type === 'series' && i.title.toLowerCase().includes(q)).slice(0, lim),
        animes: items.filter(i => i.type === 'anime' && i.title.toLowerCase().includes(q)).slice(0, lim),
        iptv: items.filter(i => i.type === 'channel' && i.title.toLowerCase().includes(q)).slice(0, lim),
      }).end();
    }

    // === ANIMES ===
    if (path === '/api/animes' && req.method === 'GET') {
      let filtered = items.filter(i => i.type === 'anime');
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(i => i.title.toLowerCase().includes(q) || i.tags.toLowerCase().includes(q));
      }
      filtered.sort((a, b) => b.rating - a.rating || a.title.localeCompare(b.title));
      const limit = parseInt(params.limit) || 50;
      const page = parseInt(params.page) || 1;
      const offset = (page - 1) * limit;
      return json(res, { animes: filtered.slice(offset, offset + limit), total: filtered.length, page, limit }).end();
    }

    if (path.startsWith('/api/animes/') && req.method === 'GET') {
      const id = path.split('/api/animes/')[1];
      const anime = items.find(i => i.id === id && i.type === 'anime');
      if (!anime) return json(res, { error: 'Not found' }, 404).end();
      return json(res, { ...anime, episodes: [] }).end();
    }

    // === MOVIES ===
    if (path === '/api/movies' && req.method === 'GET') {
      let filtered = items.filter(i => i.type === 'movie');
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(i => i.title.toLowerCase().includes(q) || i.tags.toLowerCase().includes(q));
      }
      filtered.sort((a, b) => b.rating - a.rating || a.title.localeCompare(b.title));
      const limit = parseInt(params.limit) || 50;
      const page = parseInt(params.page) || 1;
      const offset = (page - 1) * limit;
      return json(res, { movies: filtered.slice(offset, offset + limit), total: filtered.length, page, limit }).end();
    }

    if (path.startsWith('/api/movies/') && req.method === 'GET') {
      const id = path.split('/api/movies/')[1];
      const movie = items.find(i => i.id === id && i.type === 'movie');
      if (!movie) return json(res, { error: 'Not found' }, 404).end();
      return json(res, movie).end();
    }

    // === SERIES ===
    if (path === '/api/series' && req.method === 'GET') {
      let filtered = items.filter(i => i.type === 'series');
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(i => i.title.toLowerCase().includes(q) || i.tags.toLowerCase().includes(q));
      }
      filtered.sort((a, b) => b.rating - a.rating || a.title.localeCompare(b.title));
      const limit = parseInt(params.limit) || 50;
      const page = parseInt(params.page) || 1;
      const offset = (page - 1) * limit;
      return json(res, { series: filtered.slice(offset, offset + limit), total: filtered.length, page, limit }).end();
    }

    if (path.startsWith('/api/series/') && req.method === 'GET') {
      const id = path.split('/api/series/')[1];
      const serie = items.find(i => i.id === id && i.type === 'series');
      if (!serie) return json(res, { error: 'Not found' }, 404).end();
      return json(res, { ...serie, episodes: [] }).end();
    }

    // === IPTV ===
    if (path === '/api/iptv/groups' && req.method === 'GET') {
      const channels = items.filter(i => i.type === 'channel');
      const groups = {};
      channels.forEach(c => { groups[c.tags] = (groups[c.tags] || 0) + 1; });
      return json(res, Object.entries(groups).map(([group_name, count]) => ({ group_name, count })).sort((a, b) => b.count - a.count)).end();
    }

    if (path === '/api/iptv/channels' && req.method === 'GET') {
      let filtered = items.filter(i => i.type === 'channel');
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(i => i.title.toLowerCase().includes(q));
      }
      const limit = parseInt(params.limit) || 100;
      const page = parseInt(params.page) || 1;
      const offset = (page - 1) * limit;
      return json(res, { channels: filtered.slice(offset, offset + limit), total: filtered.length, page, limit }).end();
    }

    if (path.startsWith('/api/iptv/channels/') && req.method === 'GET') {
      const id = path.split('/api/iptv/channels/')[1];
      const channel = items.find(i => i.id === id && i.type === 'channel');
      if (!channel) return json(res, { error: 'Not found' }, 404).end();
      return json(res, channel).end();
    }

    if (path === '/api/iptv/categories' && req.method === 'GET') {
      return json(res, categories.map(c => ({
        ...c,
        channel_count: items.filter(i => i.type === 'channel' && i.category_id === c.id).length,
      }))).end();
    }

    // === FAVORITES (localStorage on frontend, stub here) ===
    if (path === '/api/favorites' && req.method === 'GET') {
      return json(res, []).end();
    }
    if (path === '/api/favorites' && req.method === 'POST') {
      return json(res, { success: true }, 201).end();
    }
    if (path === '/api/favorites' && req.method === 'DELETE') {
      return json(res, { success: true }).end();
    }
    if (path === '/api/favorites/check' && req.method === 'GET') {
      return json(res, { favorite: false }).end();
    }

    // === TMDB ===
    if (path === '/api/tmdb/search' && req.method === 'GET') {
      const q = params.q;
      const type = params.type || 'multi';
      if (!q) return json(res, []).end();
      let result = null;
      if (type === 'movie') result = await tmdbFetch('/search/movie', { query: q });
      else if (type === 'tv') result = await tmdbFetch('/search/tv', { query: q });
      else {
        result = await tmdbFetch('/search/movie', { query: q });
        if (!result?.results?.length) result = await tmdbFetch('/search/tv', { query: q });
      }
      const r = result?.results?.[0];
      if (!r) return json(res, null).end();
      return json(res, {
        tmdb_id: r.id,
        title: r.title || r.name,
        poster: imgUrl(r.poster_path),
        thumbnail: imgUrl(r.backdrop_path, 'w780') || imgUrl(r.poster_path),
        description: r.overview,
        rating: r.vote_average,
        year: (r.release_date || r.first_air_date || '').substring(0, 4),
        type: r.media_type || type,
      }).end();
    }

    if (path === '/api/tmdb/trending' && req.method === 'GET') {
      const data = await tmdbFetch('/trending/all/week');
      if (!data?.results) return json(res, []).end();
      return json(res, data.results.slice(0, 20).map(r => ({
        tmdb_id: r.id,
        title: r.title || r.name,
        poster: imgUrl(r.poster_path),
        thumbnail: imgUrl(r.backdrop_path, 'w780') || imgUrl(r.poster_path),
        rating: r.vote_average,
        year: (r.release_date || r.first_air_date || '').substring(0, 4),
        type: r.media_type,
        description: r.overview,
      }))).end();
    }

    if (path === '/api/tmdb/sync' && req.method === 'POST') {
      return json(res, { synced: 0, errors: 0, total: 0, message: 'Sync not available on serverless' }).end();
    }

    if (path.startsWith('/api/tmdb/sync-one/') && req.method === 'POST') {
      return json(res, { synced: false, message: 'Sync not available on serverless' }).end();
    }

    // 404
    return json(res, { error: 'Not found: ' + path }, 404).end();

  } catch (err) {
    return json(res, { error: err.message }, 500).end();
  }
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); } catch { resolve({}); }
    });
  });
}
