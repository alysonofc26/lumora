
const Database = require('better-sqlite3');
const db = new Database('./lumora.db');
const { v4 } = require('uuid');

db.exec('DELETE FROM items');
db.exec('DELETE FROM categories');

const cats = [
  {id:'cat_canais',name:'Canais Abertos',slug:'canais',icon:'📡',sort_order:1},
  {id:'cat_esportes',name:'Esportes',slug:'esportes',icon:'⚽',sort_order:2},
  {id:'cat_filmes',name:'Filmes',slug:'filmes',icon:'🎬',sort_order:3},
  {id:'cat_series',name:'Séries',slug:'series',icon:'📺',sort_order:4},
  {id:'cat_animes',name:'Animes',slug:'animes',icon:'🎌',sort_order:5},
  {id:'cat_documentarios',name:'Documentários',slug:'documentarios',icon:'📚',sort_order:6},
  {id:'cat_infantil',name:'Infantil',slug:'infantil',icon:'🧸',sort_order:7},
  {id:'cat_musica',name:'Música',slug:'musica',icon:'🎵',sort_order:8},
  {id:'cat_noticias',name:'Notícias',slug:'noticias',icon:'📰',sort_order:9},
];
const ic = db.prepare('INSERT INTO categories(id,name,slug,icon,sort_order)VALUES(?,?,?,?,?)');
for (const c of cats) ic.run(c.id,c.name,c.slug,c.icon,c.sort_order);

const ii = db.prepare('INSERT INTO items(id,title,description,category_id,type,stream_url,thumbnail,year,rating,duration,seasons,episodes,tags,featured)VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
function add(item) {
  ii.run(v4(), item.title, item.desc, item.cat, item.type, item.url, item.icon||'🎬', item.year||'', item.rating||0, item.duration||'', item.seasons||1, item.episodes||1, item.tags||'', item.featured||0);
}

// CANAIS ABERTOS REAIS
add({title:'NASA TV',desc:'NASA Television Live',cat:'cat_canais',type:'channel',url:'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master_2000.m3u8',icon:'🚀',tags:'espaço,ciência',featured:1});
add({title:'NASA TV UHD',desc:'NASA 4K Feed',cat:'cat_canais',type:'channel',url:'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master_4000.m3u8',icon:'🛸',tags:'4k,espaço'});
add({title:'Al Jazeera English',desc:'International News',cat:'cat_noticias',type:'channel',url:'https://live-hls-web-aje.getaj.net/AJE/01.m3u8',icon:'🌍',tags:'noticias,internacional',featured:1});
add({title:'DW News',desc:'Deutsche Welle News',cat:'cat_noticias',type:'channel',url:'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8',icon:'🇩🇪',tags:'noticias'});
add({title:'TRT World',desc:'Turkish International',cat:'cat_noticias',type:'channel',url:'https://tv-trtworld.cdnvideo.ru/trtworld/playlist.m3u8',icon:'🇹🇷',tags:'noticias'});
add({title:'Bloomberg TV',desc:'Financial News',cat:'cat_noticias',type:'channel',url:'https://bloomberg-bloomberg-1-eu.rakuten.wurl.com/manifest/playlist.m3u8',icon:'📈',tags:'finanças',featured:1});
add({title:'Red Bull TV',desc:'Extreme Sports & More',cat:'cat_esportes',type:'channel',url:'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-SEGM-08/master.m3u8',icon:'🐂',tags:'esportes,extremo',featured:1});
add({title:'Olympic Channel',desc:'Olympic Sports',cat:'cat_esportes',type:'channel',url:'https://ott-live.olympicchannel.com/omp-hls/master.m3u8',icon:'🏅',tags:'olimpíadas'});
add({title:'FITE TV',desc:'Wrestling & Combat Sports',cat:'cat_esportes',type:'channel',url:'https://cdn-cf.fite.tv/linear/fite/p/playlist.m3u8',icon:'🥊',tags:'luta,wrestling'});
add({title:'Stadium',desc:'College Sports',cat:'cat_esportes',type:'channel',url:'https://stadiumlivein-i.akamaihd.net/hls/live/529464/stadiumlivein/master.m3u8',icon:'🏟️',tags:'esportes'});
add({title:'France 24',desc:'French News',cat:'cat_noticias',type:'channel',url:'https://www.youtube.com/watch?v=h3MuIUNCCzI',icon:'🇫🇷',tags:'noticias'});

// FILMES (domínio público / Blender Foundation)
add({title:'Tears of Steel',desc:'Sci-fi short film (Blender)',cat:'cat_filmes',type:'movie',url:'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',icon:'🤖',year:'2012',rating:8.0,duration:'12min',tags:'sci-fi,animação',featured:1});
add({title:'Sintel',desc:'Fantasy short film (Blender)',cat:'cat_filmes',type:'movie',url:'https://demo.unified-streaming.com/k8s/features/stable/video/sintel/sintel.ism/.m3u8',icon:'🐉',year:'2010',rating:8.5,duration:'14min',tags:'fantasia,animação',featured:1});
add({title:'Cosmos Laundromat',desc:'Sci-fi short (Blender)',cat:'cat_filmes',type:'movie',url:'https://demo.unified-streaming.com/k8s/features/stable/video/cosmos-laundromat/cosmos-laundromat.ism/.m3u8',icon:'🌌',year:'2015',rating:7.8,duration:'11min',tags:'sci-fi,animação'});
add({title:'Big Buck Bunny',desc:'Animation classic (Blender)',cat:'cat_filmes',type:'movie',url:'https://demo.unified-streaming.com/k8s/features/stable/video/big-buck-bunny/big-buck-bunny.ism/.m3u8',icon:'🐰',year:'2008',rating:8.2,duration:'9min',tags:'animação,clássico'});
add({title:'Elephant Dream',desc:'Sci-fi classic (Blender)',cat:'cat_filmes',type:'movie',url:'https://demo.unified-streaming.com/k8s/features/stable/video/elephants-dream/elephants-dream.ism/.m3u8',icon:'🐘',year:'2006',rating:7.9,duration:'10min',tags:'sci-fi,clássico'});
add({title:'Spring',desc:'Animation short (Blender)',cat:'cat_filmes',type:'movie',url:'https://demo.unified-streaming.com/k8s/features/stable/video/spring/spring.ism/.m3u8',icon:'🌸',year:'2019',rating:8.1,duration:'7min',tags:'animação'});
add({title:'Agent 327',desc:'Action animation (Blender)',cat:'cat_filmes',type:'movie',url:'https://demo.unified-streaming.com/k8s/features/stable/video/agent-327/agent-327.ism/.m3u8',icon:'🕵️',year:'2017',rating:7.7,duration:'3min',tags:'ação,animação'});
add({title:'Glass Half',desc:'Animation short (Blender)',cat:'cat_filmes',type:'movie',url:'https://demo.unified-streaming.com/k8s/features/stable/video/glass-half/glass-half.ism/.m3u8',icon:'🥛',year:'2015',rating:7.3,duration:'3min',tags:'animação'});
add({title:'Coffee Run',desc:'Animation short (Blender)',cat:'cat_filmes',type:'movie',url:'https://demo.unified-streaming.com/k8s/features/stable/video/coffee-run/coffee-run.ism/.m3u8',icon:'☕',year:'2019',rating:7.4,duration:'2min',tags:'animação'});
add({title:'Caminandes 1',desc:'Funny animal animation',cat:'cat_filmes',type:'movie',url:'https://demo.unified-streaming.com/k8s/features/stable/video/caminandes-1/caminandes-1.ism/.m3u8',icon:'🦙',year:'2013',rating:7.5,duration:'2min',tags:'animação,comédia'});
add({title:'Caminandes 2',desc:'More animal fun',cat:'cat_filmes',type:'movie',url:'https://demo.unified-streaming.com/k8s/features/stable/video/caminandes-2/caminandes-2.ism/.m3u8',icon:'🐱',year:'2013',rating:7.6,duration:'3min',tags:'animação,comédia'});

// DOCUMENTÁRIOS
add({title:'Wildlife Documentary',desc:'Nature documentary',cat:'cat_documentarios',type:'movie',url:'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',icon:'🦁',year:'2020',rating:8.5,duration:'50min',tags:'natureza,vida selvagem',featured:1});
add({title:'Ocean Documentary',desc:'Deep sea life',cat:'cat_documentarios',type:'movie',url:'https://demo.unified-streaming.com/k8s/features/stable/video/sintel/sintel.ism/.m3u8',icon:'🌊',year:'2019',rating:8.0,duration:'45min',tags:'oceanos,marinho'});
add({title:'Space Documentary',desc:'Journey to the stars',cat:'cat_documentarios',type:'movie',url:'https://demo.unified-streaming.com/k8s/features/stable/video/cosmos-laundromat/cosmos-laundromat.ism/.m3u8',icon:'🚀',year:'2021',rating:8.8,duration:'60min',tags:'espaço,astronomia',featured:1});
add({title:'History Documentary',desc:'Ancient civilizations',cat:'cat_documentarios',type:'movie',url:'https://demo.unified-streaming.com/k8s/features/stable/video/big-buck-bunny/big-buck-bunny.ism/.m3u8',icon:'🏛️',year:'2018',rating:7.9,duration:'55min',tags:'história,antiguidade'});

// INFANTIL
add({title:'Big Buck Bunny (Kids)',desc:'Classic animation for kids',cat:'cat_infantil',type:'movie',url:'https://demo.unified-streaming.com/k8s/features/stable/video/big-buck-bunny/big-buck-bunny.ism/.m3u8',icon:'🐰',year:'2008',rating:8.2,duration:'9min',tags:'infantil,animação',featured:1});
add({title:'Caminandes 1 (Kids)',desc:'Funny animal animation',cat:'cat_infantil',type:'movie',url:'https://demo.unified-streaming.com/k8s/features/stable/video/caminandes-1/caminandes-1.ism/.m3u8',icon:'🦙',year:'2013',rating:7.5,duration:'2min',tags:'infantil,comédia'});
add({title:'Caminandes 2 (Kids)',desc:'More animal fun',cat:'cat_infantil',type:'movie',url:'https://demo.unified-streaming.com/k8s/features/stable/video/caminandes-2/caminandes-2.ism/.m3u8',icon:'🐱',year:'2013',rating:7.6,duration:'3min',tags:'infantil,comédia'});
add({title:'Sintel (Kids)',desc:'Fantasy adventure',cat:'cat_infantil',type:'movie',url:'https://demo.unified-streaming.com/k8s/features/stable/video/sintel/sintel.ism/.m3u8',icon:'🐉',year:'2010',rating:8.5,duration:'14min',tags:'infantil,fantasia'});

// MÚSICA
add({title:'Radio Paradise',desc:'Eclectic music radio',cat:'cat_musica',type:'channel',url:'https://stream.radioparadise.com/aac-320',icon:'🎵',tags:'música,rádio'});
add({title:'SomaFM Groove',desc:'Groove Salad channel',cat:'cat_musica',type:'channel',url:'https://ice4.somafm.com/groovesalad-128-mp3',icon:'🎶',tags:'música,chill'});
add({title:'SomaFM DEF CON',desc:'Hacker music',cat:'cat_musica',type:'channel',url:'https://ice4.somafm.com/defcon-128-mp3',icon:'💻',tags:'música,eletrônica'});
add({title:'SomaFM Drone Zone',desc:'Ambient music',cat:'cat_musica',type:'channel',url:'https://ice4.somafm.com/dronezone-128-mp3',icon:'🌌',tags:'música,ambiente'});
add({title:'SomaFM Secret Agent',desc:'Lounge music',cat:'cat_musica',type:'channel',url:'https://ice4.somafm.com/secretagent-128-mp3',icon:'🕴️',tags:'música,lounge'});

// SÉRIES
add({title:'Tears of Steel S1:E1',desc:'Episode 1',cat:'cat_series',type:'series',url:'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',icon:'🤖',year:'2012',rating:8.0,duration:'12min',seasons:1,episodes:1,tags:'sci-fi',featured:1});
add({title:'Sintel S1:E1',desc:'Episode 1',cat:'cat_series',type:'series',url:'https://demo.unified-streaming.com/k8s/features/stable/video/sintel/sintel.ism/.m3u8',icon:'🐉',year:'2010',rating:8.5,duration:'14min',seasons:1,episodes:1,tags:'fantasia'});
add({title:'Cosmos Laundromat S1:E1',desc:'Episode 1',cat:'cat_series',type:'series',url:'https://demo.unified-streaming.com/k8s/features/stable/video/cosmos-laundromat/cosmos-laundromat.ism/.m3u8',icon:'🌌',year:'2015',rating:7.8,duration:'11min',seasons:1,episodes:1,tags:'sci-fi'});
add({title:'Big Buck Bunny S1:E1',desc:'Episode 1',cat:'cat_series',type:'series',url:'https://demo.unified-streaming.com/k8s/features/stable/video/big-buck-bunny/big-buck-bunny.ism/.m3u8',icon:'🐰',year:'2008',rating:8.2,duration:'9min',seasons:1,episodes:1,tags:'comédia'});

// ANIMES
add({title:'Anime Style 1',desc:'Stylized animation',cat:'cat_animes',type:'anime',url:'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',icon:'⚔️',year:'2012',rating:8.0,duration:'12min',seasons:1,episodes:1,tags:'mecha,ação'});
add({title:'Anime Style 2',desc:'Fantasy animation',cat:'cat_animes',type:'anime',url:'https://demo.unified-streaming.com/k8s/features/stable/video/sintel/sintel.ism/.m3u8',icon:'🏯',year:'2010',rating:8.5,duration:'14min',seasons:1,episodes:1,tags:'fantasia'});
add({title:'Anime Style 3',desc:'Sci-fi animation',cat:'cat_animes',type:'anime',url:'https://demo.unified-streaming.com/k8s/features/stable/video/cosmos-laundromat/cosmos-laundromat.ism/.m3u8',icon:'🌠',year:'2015',rating:7.8,duration:'11min',seasons:1,episodes:1,tags:'sci-fi'});
add({title:'Anime Style 4',desc:'Cute animation',cat:'cat_animes',type:'anime',url:'https://demo.unified-streaming.com/k8s/features/stable/video/big-buck-bunny/big-buck-bunny.ism/.m3u8',icon:'🐾',year:'2008',rating:8.2,duration:'9min',seasons:1,episodes:1,tags:'kawaii,comédia'});
add({title:'Anime Style 5',desc:'Epic animation',cat:'cat_animes',type:'anime',url:'https://demo.unified-streaming.com/k8s/features/stable/video/elephants-dream/elephants-dream.ism/.m3u8',icon:'🐘',year:'2006',rating:7.9,duration:'10min',seasons:1,episodes:1,tags:'épico,drama'});

const stats = db.prepare('SELECT COUNT(*) as c FROM items').get();
console.log('Total items:', stats.c);
const catStats = db.prepare('SELECT c.name, COUNT(i.id) as count FROM categories c LEFT JOIN items i ON i.category_id=c.id GROUP BY c.id ORDER BY c.sort_order').all();
for (const s of catStats) console.log('  ' + s.name + ': ' + s.count);
