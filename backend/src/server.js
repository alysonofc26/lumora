import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './database.js';
import { v4 as uuidv4 } from 'uuid';
import { searchMovie, searchTV, getMovieDetails, getTVDetails, enrichItem, getImageUrl } from './tmdb.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

// Seed categories + items on fresh database (production)
function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) as c FROM categories').get().c;
  if (count > 0) return;
  console.log('Seeding database...');
  const cats = [
    {id:'cat_canais',name:'Canais Ao Vivo',slug:'canais',icon:'📡',sort_order:1},
    {id:'cat_filmes',name:'Filmes',slug:'filmes',icon:'🎬',sort_order:2},
    {id:'cat_series',name:'Séries',slug:'series',icon:'📺',sort_order:3},
    {id:'cat_animes',name:'Animes',slug:'animes',icon:'🎌',sort_order:4},
    {id:'cat_documentarios',name:'Documentários',slug:'documentarios',icon:'📚',sort_order:5},
    {id:'cat_infantil',name:'Infantil',slug:'infantil',icon:'🧸',sort_order:6},
  ];
  const ic = db.prepare('INSERT INTO categories(id,name,slug,icon,sort_order)VALUES(?,?,?,?,?)');
  for (const c of cats) ic.run(c.id,c.name,c.slug,c.icon,c.sort_order);
  const ii = db.prepare('INSERT INTO items(id,title,description,category_id,type,stream_url,thumbnail,year,rating,duration,seasons,episodes,tags,featured)VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
  function a(t){const id=uuidv4();ii.run(id,t.title,t.title+' - '+t.type,t.cat,t.type,t.url,t.icon||'🎬',t.year||'',t.rating||0,t.duration||'',t.seasons||1,t.episodes||1,t.tags||'',t.featured||0);}
  // Channels
  a({title:'Globo SP',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6807.m3u8',icon:'🔴',tags:'noticias,entretenimento',featured:1});
  a({title:'SBT',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6808.m3u8',icon:'🟡',tags:'entretenimento,variedade'});
  a({title:'Record TV',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6809.m3u8',icon:'🟢',tags:'noticias,entretenimento',featured:1});
  a({title:'Band',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6810.m3u8',icon:'🔵',tags:'esportes,noticias'});
  a({title:'RedeTV!',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6811.m3u8',icon:'🟣',tags:'entretenimento'});
  a({title:'ESPN',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6812.m3u8',icon:'🏈',tags:'esportes',featured:1});
  a({title:'ESPN2',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6813.m3u8',icon:'⚽',tags:'esportes'});
  a({title:'SporTV',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6814.m3u8',icon:'🏆',tags:'esportes'});
  a({title:'Fox Sports',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6815.m3u8',icon:'⚡',tags:'esportes'});
  a({title:'CNN Brasil',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6816.m3u8',icon:'📰',tags:'noticias'});
  a({title:'GloboNews',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6817.m3u8',icon:'🗞️',tags:'noticias'});
  a({title:'Jovem Pan',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6818.m3u8',icon:'📻',tags:'noticias'});
  a({title:'Discovery',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6819.m3u8',icon:'🌍',tags:'documentario'});
  a({title:'History',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6820.m3u8',icon:'📜',tags:'documentario,historia'});
  a({title:'Animal Planet',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6821.m3u8',icon:'🦁',tags:'natureza,animais'});
  a({title:'Disney Channel',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6822.m3u8',icon:'🏰',tags:'infantil,criancas'});
  a({title:'Cartoon Network',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6823.m3u8',icon:'🎨',tags:'infantil,desenhos'});
  a({title:'Nickelodeon',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6824.m3u8',icon:'🧡',tags:'infantil,criancas'});
  // Movies
  a({title:'Vingadores: Ultimato',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7001.m3u8',year:'2019',rating:8.4,duration:'181min',tags:'acao,aventura,marvel',featured:1});
  a({title:'Interestelar',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7002.m3u8',year:'2014',rating:8.7,duration:'169min',tags:'ficcao,espacial,sci-fi',featured:1});
  a({title:'O Poderoso Chefão',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7003.m3u8',year:'1972',rating:9.2,duration:'175min',tags:'drama,crime,classico'});
  a({title:'Batman: Cavaleiro das Trevas',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7004.m3u8',year:'2008',rating:9.0,duration:'152min',tags:'acao,drama,dc'});
  a({title:'Pulp Fiction',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7005.m3u8',year:'1994',rating:8.9,duration:'154min',tags:'crime,drama,classico'});
  a({title:'Matrix',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7006.m3u8',year:'1999',rating:8.7,duration:'136min',tags:'acao,ficcao,sci-fi'});
  a({title:'Clube da Luta',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7007.m3u8',year:'1999',rating:8.8,duration:'139min',tags:'drama,thriller'});
  a({title:'Forrest Gump',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7008.m3u8',year:'1994',rating:8.8,duration:'142min',tags:'drama,romance,classico'});
  a({title:'A Origem',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7009.m3u8',year:'2010',rating:8.8,duration:'148min',tags:'ficcao,thriller,sci-fi'});
  a({title:'O Senhor dos Anéis',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7010.m3u8',year:'2001',rating:8.9,duration:'178min',tags:'fantasia,aventura,epico'});
  a({title:'Titanic',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7011.m3u8',year:'1997',rating:7.9,duration:'194min',tags:'romance,drama,classico'});
  a({title:'Jurassic Park',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7012.m3u8',year:'1993',rating:8.2,duration:'127min',tags:'aventura,ficcao,sci-fi'});
  a({title:'O Rei Leão',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7013.m3u8',year:'1994',rating:8.5,duration:'88min',tags:'animacao,disney,infantil'});
  a({title:'De Volta p/ Futuro',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7014.m3u8',year:'1985',rating:8.5,duration:'116min',tags:'ficcao,aventura,classico'});
  a({title:'Gladiador',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7015.m3u8',year:'2000',rating:8.5,duration:'155min',tags:'acao,historia,epico'});
  a({title:'Homem de Ferro',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7016.m3u8',year:'2008',rating:7.9,duration:'126min',tags:'acao,marvel,super-heroi'});
  a({title:'Pantera Negra',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7017.m3u8',year:'2018',rating:7.3,duration:'134min',tags:'acao,marvel,super-heroi'});
  a({title:'Duna',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7018.m3u8',year:'2021',rating:8.0,duration:'155min',tags:'ficcao,epico,sci-fi'});
  a({title:'Top Gun: Maverick',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7019.m3u8',year:'2022',rating:8.3,duration:'131min',tags:'acao,drama'});
  a({title:'Everything Everywhere',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7020.m3u8',year:'2022',rating:7.8,duration:'139min',tags:'ficcao,aventura,comédia'});
  // Series
  a({title:'Breaking Bad',type:'series',cat:'cat_series',url:'https://live.embedstream.me/live/8001.m3u8',year:'2008-2013',rating:9.5,seasons:5,episodes:62,tags:'drama,crime,quimica',featured:1});
  a({title:'Game of Thrones',type:'series',cat:'cat_series',url:'https://live.embedstream.me/live/8002.m3u8',year:'2011-2019',rating:9.3,seasons:8,episodes:73,tags:'fantasia,drama,epico',featured:1});
  a({title:'Stranger Things',type:'series',cat:'cat_series',url:'https://live.embedstream.me/live/8003.m3u8',year:'2016-',rating:8.7,seasons:4,episodes:34,tags:'ficcao,terror,misterio'});
  a({title:'The Office',type:'series',cat:'cat_series',url:'https://live.embedstream.me/live/8004.m3u8',year:'2005-2013',rating:9.0,seasons:9,episodes:201,tags:'comédia,workplace'});
  a({title:'Friends',type:'series',cat:'cat_series',url:'https://live.embedstream.me/live/8005.m3u8',year:'1994-2004',rating:8.9,seasons:10,episodes:236,tags:'comédia,romance,classico'});
  a({title:'The Crown',type:'series',cat:'cat_series',url:'https://live.embedstream.me/live/8006.m3u8',year:'2016-2023',rating:8.6,seasons:6,episodes:60,tags:'drama,historia,real'});
  a({title:'The Boys',type:'series',cat:'cat_series',url:'https://live.embedstream.me/live/8007.m3u8',year:'2019-',rating:8.7,seasons:3,episodes:24,tags:'acao,drama,super-heroi'});
  a({title:'Wednesday',type:'series',cat:'cat_series',url:'https://live.embedstream.me/live/8008.m3u8',year:'2022-',rating:8.1,seasons:1,episodes:8,tags:'terror,comédia,misterio'});
  a({title:'The Last of Us',type:'series',cat:'cat_series',url:'https://live.embedstream.me/live/8009.m3u8',year:'2023-',rating:8.8,seasons:1,episodes:9,tags:'drama,ficcao,aventura'});
  a({title:'House of Dragon',type:'series',cat:'cat_series',url:'https://live.embedstream.me/live/8010.m3u8',year:'2022-',rating:8.4,seasons:2,episodes:18,tags:'fantasia,drama,dragoes'});
  a({title:'Peaky Blinders',type:'series',cat:'cat_series',url:'https://live.embedstream.me/live/8011.m3u8',year:'2013-2022',rating:8.8,seasons:6,episodes:36,tags:'drama,crime,historia'});
  a({title:'Dark',type:'series',cat:'cat_series',url:'https://live.embedstream.me/live/8012.m3u8',year:'2017-2020',rating:8.8,seasons:3,episodes:26,tags:'ficcao,misterio,alemão'});
  a({title:'Money Heist',type:'series',cat:'cat_series',url:'https://live.embedstream.me/live/8013.m3u8',year:'2017-2021',rating:8.3,seasons:5,episodes:41,tags:'acao,crime,espanhol'});
  a({title:'The Witcher',type:'series',cat:'cat_series',url:'https://live.embedstream.me/live/8014.m3u8',year:'2019-',rating:8.2,seasons:3,episodes:24,tags:'fantasia,aventura,netflix'});
  a({title:'Squid Game',type:'series',cat:'cat_series',url:'https://live.embedstream.me/live/8015.m3u8',year:'2021-',rating:8.0,seasons:2,episodes:16,tags:'thriller,coreano,sobrevivencia'});
  // Animes
  a({title:'Naruto Shippuden',type:'anime',cat:'cat_animes',url:'https://live.embedstream.me/live/9001.m3u8',year:'2007-2017',rating:9.0,seasons:21,episodes:500,tags:'acao,aventura,ninja,classico',featured:1});
  a({title:'One Piece',type:'anime',cat:'cat_animes',url:'https://live.embedstream.me/live/9002.m3u8',year:'1999-',rating:9.2,seasons:20,episodes:1100,tags:'acao,aventura,pirata,classico',featured:1});
  a({title:'Attack on Titan',type:'anime',cat:'cat_animes',url:'https://live.embedstream.me/live/9003.m3u8',year:'2013-2023',rating:9.1,seasons:4,episodes:87,tags:'acao,drama,fantasia,epico',featured:1});
  a({title:'Dragon Ball Z',type:'anime',cat:'cat_animes',url:'https://live.embedstream.me/live/9004.m3u8',year:'1989-1996',rating:8.7,seasons:9,episodes:291,tags:'acao,aventura,classico,luta'});
  a({title:'Demon Slayer',type:'anime',cat:'cat_animes',url:'https://live.embedstream.me/live/9005.m3u8',year:'2019-',rating:8.9,seasons:4,episodes:44,tags:'acao,fantasia,monstros'});
  a({title:'My Hero Academia',type:'anime',cat:'cat_animes',url:'https://live.embedstream.me/live/9006.m3u8',year:'2016-',rating:8.5,seasons:7,episodes:140,tags:'acao,escola,super-heroi'});
  a({title:'Death Note',type:'anime',cat:'cat_animes',url:'https://live.embedstream.me/live/9007.m3u8',year:'2006-2007',rating:9.0,seasons:1,episodes:37,tags:'thriller,misterio,psicologico'});
  a({title:'FMA: Brotherhood',type:'anime',cat:'cat_animes',url:'https://live.embedstream.me/live/9008.m3u8',year:'2009-2010',rating:9.4,seasons:1,episodes:64,tags:'acao,aventura,alquimia,classico'});
  a({title:'Hunter x Hunter',type:'anime',cat:'cat_animes',url:'https://live.embedstream.me/live/9009.m3u8',year:'2011-2014',rating:9.0,seasons:1,episodes:148,tags:'acao,aventura,fantasia,luta'});
  a({title:'Jujutsu Kaisen',type:'anime',cat:'cat_animes',url:'https://live.embedstream.me/live/9010.m3u8',year:'2020-',rating:8.7,seasons:2,episodes:47,tags:'acao,fantasia,monstros'});
  a({title:'Spy x Family',type:'anime',cat:'cat_animes',url:'https://live.embedstream.me/live/9011.m3u8',year:'2022-',rating:8.5,seasons:2,episodes:37,tags:'comédia,acao,espionagem'});
  a({title:'Chainsaw Man',type:'anime',cat:'cat_animes',url:'https://live.embedstream.me/live/9012.m3u8',year:'2022-',rating:8.4,seasons:1,episodes:12,tags:'acao,terror,demonios'});
  a({title:'One Punch Man',type:'anime',cat:'cat_animes',url:'https://live.embedstream.me/live/9013.m3u8',year:'2015-',rating:8.6,seasons:2,episodes:24,tags:'acao,comédia,super-heroi'});
  a({title:'Bleach: TYBW',type:'anime',cat:'cat_animes',url:'https://live.embedstream.me/live/9014.m3u8',year:'2022-',rating:9.0,seasons:4,episodes:52,tags:'acao,fantasia,espiritos'});
  a({title:'Solo Leveling',type:'anime',cat:'cat_animes',url:'https://live.embedstream.me/live/9015.m3u8',year:'2024-',rating:8.8,seasons:2,episodes:24,tags:'acao,fantasia,game-like'});
  // Documentários
  a({title:'Nosso Planeta',type:'movie',cat:'cat_documentarios',url:'https://live.embedstream.me/live/10001.m3u8',year:'2019',rating:9.3,duration:'404min',tags:'natureza,meio-ambiente,netflix'});
  a({title:'Making a Murderer',type:'series',cat:'cat_documentarios',url:'https://live.embedstream.me/live/10002.m3u8',year:'2015-2018',rating:8.6,seasons:2,episodes:20,tags:'crime,justica,misterio'});
  a({title:'The Social Dilemma',type:'movie',cat:'cat_documentarios',url:'https://live.embedstream.me/live/10003.m3u8',year:'2020',rating:7.6,duration:'94min',tags:'tecnologia,sociedade,redes-sociais'});
  a({title:'Free Solo',type:'movie',cat:'cat_documentarios',url:'https://live.embedstream.me/live/10004.m3u8',year:'2018',rating:8.2,duration:'100min',tags:'esportes,aventura,alpinismo'});
  a({title:'My Octopus Teacher',type:'movie',cat:'cat_documentarios',url:'https://live.embedstream.me/live/10005.m3u8',year:'2020',rating:8.1,duration:'85min',tags:'natureza,oceano,animais'});
  a({title:'O Dilema das Redes',type:'movie',cat:'cat_documentarios',url:'https://live.embedstream.me/live/10006.m3u8',year:'2020',rating:7.6,duration:'94min',tags:'tecnologia,sociedade'});
  a({title:'Icarus',type:'movie',cat:'cat_documentarios',url:'https://live.embedstream.me/live/10007.m3u8',year:'2017',rating:8.1,duration:'121min',tags:'esportes,doping,investigação'});
  a({title:'A Era dos Dados',type:'series',cat:'cat_documentarios',url:'https://live.embedstream.me/live/10008.m3u8',year:'2023',rating:7.8,seasons:1,episodes:6,tags:'tecnologia,dados,futuro'});
  // Infantil
  a({title:'Peppa Pig',type:'series',cat:'cat_infantil',url:'https://live.embedstream.me/live/11001.m3u8',year:'2004-',rating:6.5,seasons:8,episodes:250,tags:'infantil,crianças,animais'});
  a({title:'Paw Patrol',type:'series',cat:'cat_infantil',url:'https://live.embedstream.me/live/11002.m3u8',year:'2013-',rating:6.7,seasons:10,episodes:220,tags:'infantil,crianças,aventura'});
  a({title:'Masha e o Urso',type:'series',cat:'cat_infantil',url:'https://live.embedstream.me/live/11003.m3u8',year:'2009-',rating:7.2,seasons:5,episodes:104,tags:'infantil,crianças,comédia'});
  a({title:'Dora Aventureira',type:'series',cat:'cat_infantil',url:'https://live.embedstream.me/live/11004.m3u8',year:'2000-2019',rating:5.8,seasons:8,episodes:172,tags:'infantil,crianças,aventura'});
  a({title:'O Show da Luna',type:'series',cat:'cat_infantil',url:'https://live.embedstream.me/live/11005.m3u8',year:'2014-',rating:7.0,seasons:6,episodes:150,tags:'infantil,crianças,ciência'});
  a({title:'Galinha Pintadinha',type:'series',cat:'cat_infantil',url:'https://live.embedstream.me/live/11006.m3u8',year:'2006-',rating:6.8,seasons:12,episodes:200,tags:'infantil,crianças,música'});
  a({title:'Turma da Mônica',type:'series',cat:'cat_infantil',url:'https://live.embedstream.me/live/11007.m3u8',year:'1976-',rating:7.5,seasons:15,episodes:300,tags:'infantil,crianças,comédia'});
  a({title:'O Rei Leão (Filme)',type:'movie',cat:'cat_infantil',url:'https://live.embedstream.me/live/11008.m3u8',year:'1994',rating:8.5,duration:'88min',tags:'animação,disney,animais'});
  console.log('Seed complete!');
}

// Auto TMDB sync on startup - ALL tables
async function autoSyncTMDB() {
  try {
  const tables = [
    { name: 'items', typeCol: 'type', titleCol: 'title' },
    { name: 'movies', typeCol: null, titleCol: 'title' },
    { name: 'series', typeCol: null, titleCol: 'title' },
    { name: 'animes', typeCol: null, titleCol: 'title' },
  ];
  
  let totalSynced = 0;
  let totalItems = 0;

  const existingTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);

  for (const table of tables) {
    if (!existingTables.includes(table.name)) continue;
    const items = db.prepare(`SELECT * FROM ${table.name}`).all();
    const needSync = items.filter(i => !i.tmdb_id);
    totalItems += needSync.length;
    if (needSync.length === 0) continue;
    
    console.log(`TMDB: Syncing ${needSync.length} items from ${table.name}...`);
    let synced = 0;
    
    for (const item of needSync) {
      try {
        let tmdbData = null;
        const isAnime = table.name === 'animes';
        const isSerie = table.name === 'series';
        
        if (table.name === 'items') {
          if (item.type === 'movie') tmdbData = await searchMovie(item.title);
          else tmdbData = await searchTV(item.title);
        } else {
          tmdbData = await searchTV(item.title);
          if (!tmdbData && !isSerie) tmdbData = await searchMovie(item.title);
        }
        
        if (tmdbData) tmdbData = await getTVDetails(tmdbData.id).catch(() => null) || await getMovieDetails(tmdbData.id).catch(() => null);
        
        if (tmdbData) {
          const poster = getImageUrl(tmdbData.poster_path);
          const backdrop = getImageUrl(tmdbData.backdrop_path, 'w780');
          const desc = tmdbData.overview || '';
          const rating = tmdbData.vote_average || 0;
          const year = (tmdbData.release_date || tmdbData.first_air_date || '').substring(0, 4);
          const genres = (tmdbData.genres || []).map(g => g.name).join(', ');
          const seasons = tmdbData.number_of_seasons || 0;
          const episodes = tmdbData.number_of_episodes || 0;
          const dur = tmdbData.runtime ? tmdbData.runtime + 'min' : '';
          const trailer = tmdbData.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube')?.key || '';
          const cast = (tmdbData.credits?.cast || []).slice(0, 5).map(c => c.name).join(', ');

          db.prepare(`UPDATE ${table.name} SET thumbnail=?, description=?, rating=?, genres=?, trailer=?, cast=?, tmdb_id=? WHERE id=?`)
            .run(backdrop || poster, desc, rating, genres, trailer, cast, tmdbData.id, item.id);
          synced++;
          console.log(`  OK: ${item.title.substring(0,35)} -> ${rating}`);
        }
        await new Promise(r => setTimeout(r, 250));
      } catch (e) {}
    }
    totalSynced += synced;
    console.log(`TMDB: ${table.name} done! ${synced}/${needSync.length}`);
  }
  console.log(`TMDB: ALL DONE! ${totalSynced}/${totalItems} synced`);
  } catch (e) { console.log('TMDB sync error:', e.message); }
}

app.get('/api/categories', (req, res) => {
  res.json(db.prepare('SELECT * FROM categories ORDER BY sort_order').all());
});

app.get('/api/items', (req, res) => {
  const { category, type, search, featured, limit = 100, page = 1 } = req.query;
  let sql = 'SELECT * FROM items WHERE 1=1';
  const params = [];
  if (category) { sql += ' AND category_id = ?'; params.push(category); }
  if (type) { sql += ' AND type = ?'; params.push(type); }
  if (search) { sql += ' AND (title LIKE ? OR tags LIKE ?)'; params.push('%'+search+'%', '%'+search+'%'); }
  if (featured === '1') { sql += ' AND featured = 1'; }
  sql += ' ORDER BY featured DESC, rating DESC, title ASC';
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const { total } = db.prepare(sql.replace('SELECT *', 'SELECT COUNT(*) as total')).get(...params);
  sql += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);
  res.json({ items: db.prepare(sql).all(...params), total, page: parseInt(page), limit: parseInt(limit) });
});

app.get('/api/items/:id', (req, res) => {
  let item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  if (item) {
    db.prepare('UPDATE items SET views = views + 1 WHERE id = ?').run(req.params.id);
    return res.json(item);
  }
  const ch = db.prepare('SELECT *, name as title, logo as thumbnail, stream_url, group_name as tags, \'iptv\' as type FROM iptv_channels WHERE id = ?').get(req.params.id);
  if (ch) return res.json(ch);
  res.status(404).json({ error: 'Not found' });
});

app.post('/api/items', (req, res) => {
  const { title, description, category_id, type, stream_url, thumbnail, year, rating, duration, seasons, episodes, tags, featured } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO items(id,title,description,category_id,type,stream_url,thumbnail,year,rating,duration,seasons,episodes,tags,featured)VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(id, title, description, category_id, type, stream_url, thumbnail||'🎬', year||'', rating||0, duration||'', seasons||1, episodes||1, tags||'', featured||0);
  res.status(201).json({ id, ...req.body });
});

app.put('/api/items/:id', (req, res) => {
  const { title, description, category_id, type, stream_url, thumbnail, year, rating, duration, seasons, episodes, tags, featured } = req.body;
  db.prepare('UPDATE items SET title=?,description=?,category_id=?,type=?,stream_url=?,thumbnail=?,year=?,rating=?,duration=?,seasons=?,episodes=?,tags=?,featured=? WHERE id=?')
    .run(title, description, category_id, type, stream_url, thumbnail, year, rating, duration, seasons, episodes, tags, featured, req.params.id);
  res.json({ success: true });
});

app.delete('/api/items/:id', (req, res) => {
  db.prepare('DELETE FROM items WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/stats', (req, res) => {
  res.json({
    totalItems: db.prepare('SELECT COUNT(*) as c FROM items').get().c,
    totalChannels: db.prepare("SELECT COUNT(*) as c FROM items WHERE type='channel'").get().c,
    totalMovies: db.prepare("SELECT COUNT(*) as c FROM items WHERE type='movie'").get().c,
    totalSeries: db.prepare("SELECT COUNT(*) as c FROM items WHERE type='series'").get().c,
    totalAnimes: db.prepare("SELECT COUNT(*) as c FROM items WHERE type='anime'").get().c,
    featured: db.prepare('SELECT COUNT(*) as c FROM items WHERE featured=1').get().c,
  });
});

app.get('/api/search', (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  res.json(db.prepare("SELECT * FROM items WHERE title LIKE ? OR tags LIKE ? ORDER BY rating DESC LIMIT 20").all('%'+q+'%', '%'+q+'%'));
});

// === GLOBAL SEARCH ===

app.get('/api/search/all', (req, res) => {
  const { q, limit = 10 } = req.query;
  if (!q || q.length < 2) return res.json({ movies: [], series: [], animes: [], iptv: [] });
  
  const like = '%'+q+'%';
  const lim = parseInt(limit);
  const all = db.prepare("SELECT * FROM items").all();
  const ql = q.toLowerCase();
  
  const movies = all.filter(i => i.type === 'movie' && i.title.toLowerCase().includes(ql)).slice(0, lim);
  const series = all.filter(i => i.type === 'series' && i.title.toLowerCase().includes(ql)).slice(0, lim);
  const animes = all.filter(i => i.type === 'anime' && i.title.toLowerCase().includes(ql)).slice(0, lim);
  const iptv = all.filter(i => i.type === 'channel' && i.title.toLowerCase().includes(ql)).slice(0, lim);
  
  return res.json({ movies, series, animes, iptv });
});

// === ANIME ENDPOINTS ===

app.get('/api/animes', (req, res) => {
  if (!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='animes'").get()) {
    const { search, limit = 50, page = 1 } = req.query;
    let list = db.prepare("SELECT * FROM items WHERE type='anime'").all();
    if (search) { const q = search.toLowerCase(); list = list.filter(i => i.title.toLowerCase().includes(q)); }
    list.sort((a, b) => b.rating - a.rating || a.title.localeCompare(b.title));
    const offset = (parseInt(page) - 1) * parseInt(limit);
    return res.json({ animes: list.slice(offset, offset + parseInt(limit)), total: list.length, page: parseInt(page), limit: parseInt(limit) });
  }
  const { genre, search, limit = 50, page = 1 } = req.query;
  let sql = 'SELECT * FROM animes WHERE 1=1';
  const params = [];
  if (genre) { sql += ' AND genre LIKE ?'; params.push('%'+genre+'%'); }
  if (search) { sql += ' AND (title LIKE ? OR genre LIKE ?)'; params.push('%'+search+'%', '%'+search+'%'); }
  sql += ' ORDER BY rating DESC, title ASC';
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const { total } = db.prepare(sql.replace('SELECT *', 'SELECT COUNT(*) as total')).get(...params);
  sql += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);
  res.json({ animes: db.prepare(sql).all(...params), total, page: parseInt(page), limit: parseInt(limit) });
});

app.get('/api/animes/:id', (req, res) => {
  const anime = db.prepare('SELECT * FROM animes WHERE id = ?').get(req.params.id) ||
                db.prepare("SELECT * FROM items WHERE id = ? AND type='anime'").get(req.params.id);
  if (!anime) return res.status(404).json({ error: 'Not found' });
  let episodes = [];
  try { episodes = db.prepare('SELECT * FROM episodes WHERE anime_id = ? ORDER BY episode_number').all(anime.id); } catch {}
  res.json({ ...anime, episodes });
});

// === MOVIE ENDPOINTS ===

app.get('/api/movies', (req, res) => {
  if (!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='movies'").get()) {
    const { search, limit = 50, page = 1 } = req.query;
    let list = db.prepare("SELECT * FROM items WHERE type='movie'").all();
    if (search) { const q = search.toLowerCase(); list = list.filter(i => i.title.toLowerCase().includes(q)); }
    list.sort((a, b) => b.rating - a.rating || a.title.localeCompare(b.title));
    const offset = (parseInt(page) - 1) * parseInt(limit);
    return res.json({ movies: list.slice(offset, offset + parseInt(limit)), total: list.length, page: parseInt(page), limit: parseInt(limit) });
  }
  const { genre, search, limit = 50, page = 1 } = req.query;
  let sql = 'SELECT * FROM movies WHERE 1=1';
  const params = [];
  if (genre) { sql += ' AND genre LIKE ?'; params.push('%'+genre+'%'); }
  if (search) { sql += ' AND (title LIKE ? OR genre LIKE ?)'; params.push('%'+search+'%', '%'+search+'%'); }
  sql += ' ORDER BY rating DESC, title ASC';
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const { total } = db.prepare(sql.replace('SELECT *', 'SELECT COUNT(*) as total')).get(...params);
  sql += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);
  res.json({ movies: db.prepare(sql).all(...params), total, page: parseInt(page), limit: parseInt(limit) });
});

app.get('/api/movies/:id', (req, res) => {
  const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(req.params.id) ||
                db.prepare("SELECT * FROM items WHERE id = ? AND type='movie'").get(req.params.id);
  if (!movie) return res.status(404).json({ error: 'Not found' });
  res.json(movie);
});

// === SERIES ENDPOINTS ===

app.get('/api/series', (req, res) => {
  if (!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='series'").get()) {
    const { search, limit = 50, page = 1 } = req.query;
    let list = db.prepare("SELECT * FROM items WHERE type='series'").all();
    if (search) { const q = search.toLowerCase(); list = list.filter(i => i.title.toLowerCase().includes(q)); }
    list.sort((a, b) => b.rating - a.rating || a.title.localeCompare(b.title));
    const offset = (parseInt(page) - 1) * parseInt(limit);
    return res.json({ series: list.slice(offset, offset + parseInt(limit)), total: list.length, page: parseInt(page), limit: parseInt(limit) });
  }
  const { genre, search, limit = 50, page = 1 } = req.query;
  let sql = 'SELECT * FROM series WHERE 1=1';
  const params = [];
  if (genre) { sql += ' AND genre LIKE ?'; params.push('%'+genre+'%'); }
  if (search) { sql += ' AND (title LIKE ? OR genre LIKE ?)'; params.push('%'+search+'%', '%'+search+'%'); }
  sql += ' ORDER BY rating DESC, title ASC';
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const { total } = db.prepare(sql.replace('SELECT *', 'SELECT COUNT(*) as total')).get(...params);
  sql += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);
  res.json({ series: db.prepare(sql).all(...params), total, page: parseInt(page), limit: parseInt(limit) });
});

app.get('/api/series/:id', (req, res) => {
  const serie = db.prepare('SELECT * FROM series WHERE id = ?').get(req.params.id) ||
                db.prepare("SELECT * FROM items WHERE id = ? AND type='series'").get(req.params.id);
  if (!serie) return res.status(404).json({ error: 'Not found' });
  let episodes = [];
  try { episodes = db.prepare('SELECT * FROM series_episodes WHERE series_id = ? ORDER BY season, episode_number').all(serie.id); } catch {}
  res.json({ ...serie, episodes });
});

// === IPTV CHANNELS ENDPOINTS ===

const hasIPTVTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='iptv_channels'").get();

app.get('/api/iptv/groups', (req, res) => {
  if (!hasIPTVTable) {
    const channels = db.prepare("SELECT * FROM items WHERE type='channel'").all();
    const tags = {};
    channels.forEach(c => { const t = c.tags || 'Geral'; tags[t] = (tags[t] || 0) + 1; });
    return res.json(Object.entries(tags).map(([group_name, count]) => ({ group_name, count })));
  }
  const groups = db.prepare('SELECT group_name, COUNT(*) as count FROM iptv_channels WHERE active=1 GROUP BY group_name ORDER BY count DESC').all();
  res.json(groups);
});

app.get('/api/iptv/channels', (req, res) => {
  if (!hasIPTVTable) {
    const { search, limit = 100, page = 1 } = req.query;
    let channels = db.prepare("SELECT *, title as name, thumbnail as logo, tags as group_name FROM items WHERE type='channel'").all();
    if (search) {
      const q = search.toLowerCase();
      channels = channels.filter(c => c.name.toLowerCase().includes(q));
    }
    channels.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    const offset = (parseInt(page) - 1) * parseInt(limit);
    return res.json({ channels: channels.slice(offset, offset + parseInt(limit)), total: channels.length, page: parseInt(page), limit: parseInt(limit) });
  }
  const { group, search, limit = 100, page = 1 } = req.query;
  let sql = 'SELECT * FROM iptv_channels WHERE active=1';
  const params = [];
  if (group) { sql += ' AND group_name = ?'; params.push(group); }
  if (search) { sql += ' AND (name LIKE ? OR tvg_id LIKE ?)'; params.push('%'+search+'%', '%'+search+'%'); }
  sql += ' ORDER BY group_name, name';
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const { total } = db.prepare(sql.replace('SELECT *', 'SELECT COUNT(*) as total')).get(...params);
  sql += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);
  res.json({ channels: db.prepare(sql).all(...params), total, page: parseInt(page), limit: parseInt(limit) });
});

app.get('/api/iptv/channels/:id', (req, res) => {
  if (!hasIPTVTable) {
    const ch = db.prepare("SELECT *, title as name, thumbnail as logo FROM items WHERE id = ? AND type='channel'").get(req.params.id);
    if (!ch) return res.status(404).json({ error: 'Not found' });
    return res.json(ch);
  }
  const channel = db.prepare('SELECT * FROM iptv_channels WHERE id = ?').get(req.params.id);
  if (!channel) return res.status(404).json({ error: 'Not found' });
  res.json(channel);
});

// === IPTV CATEGORIES ENDPOINTS ===

app.get('/api/iptv/categories', (req, res) => {
  if (!hasIPTVTable) {
    return res.json([]);
  }
  const categories = db.prepare(`
    SELECT c.id, c.name, c.slug, c.icon, c.parent_id, c.sort_order,
           COUNT(ch.id) as channel_count
    FROM iptv_categories c
    LEFT JOIN iptv_channels ch ON ch.category_id = c.id AND ch.active = 1
    GROUP BY c.id
    ORDER BY c.sort_order, c.name
  `).all();
  res.json(categories);
});

app.get('/api/iptv/categories/:id/channels', (req, res) => {
  const { limit = 100, page = 1 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const catId = parseInt(req.params.id);
  const categoryIds = [catId];
  const subcats = db.prepare('SELECT id FROM iptv_categories WHERE parent_id = ?').all(catId);
  for (const sub of subcats) {
    categoryIds.push(sub.id);
  }
  const placeholders = categoryIds.map(() => '?').join(',');
  const total = db.prepare(`SELECT COUNT(*) as cnt FROM iptv_channels WHERE category_id IN (${placeholders}) AND active=1`).get(...categoryIds).cnt;
  const channels = db.prepare(`SELECT * FROM iptv_channels WHERE category_id IN (${placeholders}) AND active=1 ORDER BY name LIMIT ? OFFSET ?`).all(...categoryIds, parseInt(limit), offset);
  res.json({ channels, total, page: parseInt(page), limit: parseInt(limit) });
});

// === FAVORITES ENDPOINTS ===

app.get('/api/favorites', (req, res) => {
  const { type } = req.query;
  let sql = 'SELECT * FROM favorites';
  const params = [];
  if (type) { sql += ' WHERE item_type = ?'; params.push(type); }
  sql += ' ORDER BY created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

app.post('/api/favorites', (req, res) => {
  const { item_type, item_id, title, thumbnail } = req.body;
  if (!item_type || !item_id) return res.status(400).json({ error: 'Missing item_type or item_id' });
  try {
    db.prepare('INSERT OR IGNORE INTO favorites(item_type, item_id, title, thumbnail) VALUES(?,?,?,?)')
      .run(item_type, item_id, title || '', thumbnail || '');
    res.status(201).json({ success: true });
  } catch(e) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/favorites', (req, res) => {
  const { item_type, item_id } = req.body;
  if (!item_type || !item_id) return res.status(400).json({ error: 'Missing item_type or item_id' });
  db.prepare('DELETE FROM favorites WHERE item_type = ? AND item_id = ?').run(item_type, item_id);
  res.json({ success: true });
});

app.get('/api/favorites/check', (req, res) => {
  const { item_type, item_id } = req.query;
  if (!item_type || !item_id) return res.json({ favorite: false });
  const fav = db.prepare('SELECT id FROM favorites WHERE item_type = ? AND item_id = ?').get(item_type, item_id);
  res.json({ favorite: !!fav });
});

// === TMDB ENDPOINTS ===

app.get('/api/tmdb/search', async (req, res) => {
  const { q, type = 'multi' } = req.query;
  if (!q) return res.json([]);
  let result = null;
  if (type === 'movie') result = await searchMovie(q);
  else if (type === 'tv') result = await searchTV(q);
  else {
    result = await searchMovie(q);
    if (!result) result = await searchTV(q);
  }
  if (!result) return res.json(null);
  res.json({
    tmdb_id: result.id,
    title: result.title || result.name,
    poster: getImageUrl(result.poster_path),
    thumbnail: getImageUrl(result.backdrop_path, 'w780') || getImageUrl(result.poster_path),
    description: result.overview,
    rating: result.vote_average,
    year: (result.release_date || result.first_air_date || '').substring(0, 4),
    type: result.media_type || type,
  });
});

app.post('/api/tmdb/sync', async (req, res) => {
  const items = db.prepare("SELECT * FROM items WHERE type IN ('movie','series','anime')").all();
  let synced = 0;
  let errors = 0;

  for (const item of items) {
    try {
      let tmdbData = null;
      if (item.type === 'movie') {
        tmdbData = await searchMovie(item.title);
        if (tmdbData) tmdbData = await getMovieDetails(tmdbData.id);
      } else {
        tmdbData = await searchTV(item.title);
        if (tmdbData) tmdbData = await getTVDetails(tmdbData.id);
      }
      if (tmdbData) {
        const enriched = enrichItem(item, tmdbData);
        db.prepare(`UPDATE items SET thumbnail=?, poster=?, description=?, rating=?, year=?, duration=?, genres=?, seasons=?, episodes=?, trailer=?, cast=? WHERE id=?`)
          .run(enriched.thumbnail, enriched.poster, enriched.description, enriched.rating, enriched.year, enriched.duration, enriched.genres, enriched.seasons, enriched.episodes, enriched.trailer, enriched.cast, item.id);
        synced++;
      }
      await new Promise(r => setTimeout(r, 250));
    } catch (e) {
      errors++;
    }
  }

  res.json({ synced, errors, total: items.length });
});

app.post('/api/tmdb/sync-one/:id', async (req, res) => {
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });

  let tmdbData = null;
  if (item.type === 'movie') {
    tmdbData = await searchMovie(item.title);
    if (tmdbData) tmdbData = await getMovieDetails(tmdbData.id);
  } else {
    tmdbData = await searchTV(item.title);
    if (tmdbData) tmdbData = await getTVDetails(tmdbData.id);
  }

  if (!tmdbData) return res.json({ synced: false, message: 'TMDB not found' });

  const enriched = enrichItem(item, tmdbData);
  db.prepare(`UPDATE items SET thumbnail=?, poster=?, description=?, rating=?, year=?, duration=?, genres=?, seasons=?, episodes=?, trailer=?, cast=? WHERE id=?`)
    .run(enriched.thumbnail, enriched.poster, enriched.description, enriched.rating, enriched.year, enriched.duration, enriched.genres, enriched.seasons, enriched.episodes, enriched.trailer, enriched.cast, item.id);

  res.json({ synced: true, item: enriched });
});

app.get('/api/tmdb/trending', async (req, res) => {
  const data = await (await import('./tmdb.js')).getTrending('all', 'week');
  if (!data?.results) return res.json([]);
  res.json(data.results.slice(0, 20).map(r => ({
    tmdb_id: r.id,
    title: r.title || r.name,
    poster: getImageUrl(r.poster_path),
    thumbnail: getImageUrl(r.backdrop_path, 'w780') || getImageUrl(r.poster_path),
    rating: r.vote_average,
    year: (r.release_date || r.first_air_date || '').substring(0, 4),
    type: r.media_type,
    description: r.overview,
  })));
});

// Serve frontend static files
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log('Lumora API on http://localhost:' + PORT);
  seedIfEmpty();
  if (!process.env.VERCEL) autoSyncTMDB().catch(e => console.log('TMDB sync error:', e.message));
});
