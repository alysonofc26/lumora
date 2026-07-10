import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
  try {
    const envFile = readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
    const env = {};
    envFile.split('\n').forEach(line => {
      const [key, ...val] = line.split('=');
      if (key) env[key.trim()] = val.join('=').trim();
    });
    return env;
  } catch { return {}; }
}

const env = loadEnv();
const API_KEY = process.env.TMDB_API_KEY || env.TMDB_API_KEY || '';
const BASE = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p';

export function getImageUrl(path, size = 'w500') {
  if (!path) return null;
  return `${IMG}/${size}${path}`;
}

async function tmdbFetch(endpoint, params = {}) {
  if (!API_KEY) return null;
  const url = new URL(`${BASE}${endpoint}`);
  url.searchParams.set('api_key', API_KEY);
  url.searchParams.set('language', 'pt-BR');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) return null;
  return res.json();
}

export async function searchMovie(title) {
  const data = await tmdbFetch('/search/movie', { query: title });
  return data?.results?.[0] || null;
}

export async function searchTV(title) {
  const data = await tmdbFetch('/search/tv', { query: title });
  return data?.results?.[0] || null;
}

export async function getMovieDetails(id) {
  return await tmdbFetch(`/movie/${id}`, { append_to_response: 'credits,videos' });
}

export async function getTVDetails(id) {
  return await tmdbFetch(`/tv/${id}`, { append_to_response: 'credits,videos' });
}

export async function getTrending(mediaType = 'all', timeWindow = 'week') {
  return await tmdbFetch(`/trending/${mediaType}/${timeWindow}`);
}

export function enrichItem(item, tmdbData) {
  if (!tmdbData) return item;
  return {
    ...item,
    tmdb_id: tmdbData.id,
    poster: getImageUrl(tmdbData.poster_path) || item.poster || item.thumbnail,
    thumbnail: getImageUrl(tmdbData.backdrop_path, 'w780') || getImageUrl(tmdbData.poster_path) || item.thumbnail,
    description: tmdbData.overview || item.description,
    rating: tmdbData.vote_average || item.rating,
    year: item.year || (tmdbData.release_date || tmdbData.first_air_date || '').substring(0, 4),
    duration: item.duration || (tmdbData.runtime ? tmdbData.runtime + 'min' : ''),
    genres: (tmdbData.genres || []).map(g => g.name).join(', '),
    seasons: tmdbData.number_of_seasons || item.seasons,
    episodes: tmdbData.number_of_episodes || item.episodes,
    trailer: tmdbData.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube')?.key || null,
    cast: (tmdbData.credits?.cast || []).slice(0, 5).map(c => c.name).join(', '),
  };
}
