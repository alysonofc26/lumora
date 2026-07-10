import db from './database.js';
import { v4 as uuidv4 } from 'uuid';

db.exec('DELETE FROM items');
db.exec('DELETE FROM categories');

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
a({title:'Globo SP',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6807.m3u8',icon:'🔴',tags:'noticias,entretenimento',featured:1});
a({title:'SBT',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6808.m3u8',icon:'🟡',tags:'entretenimento,variedade',featured:0});
a({title:'Record TV',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6809.m3u8',icon:'🟢',tags:'noticias,entretenimento',featured:1});
a({title:'Band',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6810.m3u8',icon:'🔵',tags:'esportes,noticias',featured:0});
a({title:'RedeTV!',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6811.m3u8',icon:'🟣',tags:'entretenimento',featured:0});
a({title:'ESPN',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6812.m3u8',icon:'🏈',tags:'esportes',featured:1});
a({title:'ESPN2',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6813.m3u8',icon:'⚽',tags:'esportes',featured:0});
a({title:'SporTV',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6814.m3u8',icon:'🏆',tags:'esportes',featured:0});
a({title:'Fox Sports',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6815.m3u8',icon:'⚡',tags:'esportes',featured:0});
a({title:'CNN Brasil',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6816.m3u8',icon:'📰',tags:'noticias',featured:0});
a({title:'GloboNews',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6817.m3u8',icon:'🗞️',tags:'noticias',featured:0});
a({title:'Jovem Pan',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6818.m3u8',icon:'📻',tags:'noticias',featured:0});
a({title:'Discovery',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6819.m3u8',icon:'🌍',tags:'documentario',featured:0});
a({title:'History',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6820.m3u8',icon:'📜',tags:'documentario,historia',featured:0});
a({title:'Animal Planet',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6821.m3u8',icon:'🦁',tags:'natureza,animais',featured:0});
a({title:'Disney Channel',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6822.m3u8',icon:'🏰',tags:'infantil,criancas',featured:0});
a({title:'Cartoon Network',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6823.m3u8',icon:'🎨',tags:'infantil,desenhos',featured:0});
a({title:'Nickelodeon',type:'channel',cat:'cat_canais',url:'https://live.embedstream.me/live/6824.m3u8',icon:'🧡',tags:'infantil,criancas',featured:0});
a({title:'Vingadores: Ultimato',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7001.m3u8',year:'2019',rating:8.4,duration:'181min',tags:'acao,aventura,marvel',featured:1});
a({title:'Interestelar',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7002.m3u8',year:'2014',rating:8.7,duration:'169min',tags:'ficcao,espacial,sci-fi',featured:1});
a({title:'O Poderoso Chefão',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7003.m3u8',year:'1972',rating:9.2,duration:'175min',tags:'drama,crime,classico',featured:0});
a({title:'Batman: Cavaleiro das Trevas',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7004.m3u8',year:'2008',rating:9.0,duration:'152min',tags:'acao,drama,dc',featured:0});
a({title:'Pulp Fiction',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7005.m3u8',year:'1994',rating:8.9,duration:'154min',tags:'crime,drama,classico',featured:0});
a({title:'Matrix',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7006.m3u8',year:'1999',rating:8.7,duration:'136min',tags:'acao,ficcao,sci-fi',featured:0});
a({title:'Clube da Luta',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7007.m3u8',year:'1999',rating:8.8,duration:'139min',tags:'drama,thriller',featured:0});
a({title:'Forrest Gump',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7008.m3u8',year:'1994',rating:8.8,duration:'142min',tags:'drama,romance,classico',featured:0});
a({title:'A Origem',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7009.m3u8',year:'2010',rating:8.8,duration:'148min',tags:'ficcao,thriller,sci-fi',featured:0});
a({title:'O Senhor dos Anéis',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7010.m3u8',year:'2001',rating:8.9,duration:'178min',tags:'fantasia,aventura,epico',featured:0});
a({title:'Titanic',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7011.m3u8',year:'1997',rating:7.9,duration:'194min',tags:'romance,drama,classico',featured:0});
a({title:'Jurassic Park',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7012.m3u8',year:'1993',rating:8.2,duration:'127min',tags:'aventura,ficcao,sci-fi',featured:0});
a({title:'O Rei Leão',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7013.m3u8',year:'1994',rating:8.5,duration:'88min',tags:'animacao,disney,infantil',featured:0});
a({title:'De Volta p/ Futuro',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7014.m3u8',year:'1985',rating:8.5,duration:'116min',tags:'ficcao,aventura,classico',featured:0});
a({title:'Gladiador',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7015.m3u8',year:'2000',rating:8.5,duration:'155min',tags:'acao,historia,epico',featured:0});
a({title:'Homem de Ferro',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7016.m3u8',year:'2008',rating:7.9,duration:'126min',tags:'acao,marvel,super-heroi',featured:0});
a({title:'Pantera Negra',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7017.m3u8',year:'2018',rating:7.3,duration:'134min',tags:'acao,marvel,super-heroi',featured:0});
a({title:'Duna',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7018.m3u8',year:'2021',rating:8.0,duration:'155min',tags:'ficcao,epico,sci-fi',featured:0});
a({title:'Top Gun: Maverick',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7019.m3u8',year:'2022',rating:8.3,duration:'131min',tags:'acao,drama',featured:0});
a({title:'Everything Everywhere',type:'movie',cat:'cat_filmes',url:'https://live.embedstream.me/live/7020.m3u8',year:'2022',rating:7.8,duration:'139min',tags:'ficcao,aventura,comédia',featured:0});
a({title:'Breaking Bad',type:'series',cat:'cat_series',url:'https://live.embedstream.me/live/8001.m3u8',year:'2008-2013',rating:9.5,seasons:5,episodes:62,tags:'drama,crime,quimica',featured:1});
a({title:'Game of Thrones',type:'series',cat:'cat_series',url:'https://live.embedstream.me/live/8002.m3u8',year:'2011-2019',rating:9.3,seasons:8,episodes:73,tags:'fantasia,drama,epico',featured:1});
a({title:'Stranger Things',type:'series',cat:'cat_series',url:'https://live.embedstream.me/live/8003.m3u8',year:'2016-',rating:8.7,seasons:4,episodes:34,tags:'ficcao,terror,misterio',featured:0});
a({title:'The Office',type:'series',cat:'cat_series',url:'https://live.embedstream.me/live/8004.m3u8',year:'2005-2013',rating:9.0,seasons:9,episodes:201,tags:'comédia,workplace',featured:0});
a({title:'Friends',type:'series',cat:'cat_series',url:'https://live.embedstream.me/live/8005.m3u8',year:'1994-2004',rating:8.9,seasons:10,episodes:236,tags:'comédia,romance,classico',featured:0});
a({title:'The Crown',type:'series',cat:'cat_series',url:'https://live.embedstream.me/live/8006.m3u8',year:'2016-2023',rating:8.6,seasons:6,episodes:60,tags:'drama,historia,real',featured:0});
a({title:'The Boys',type:'series',cat:'cat_series',url:'https://live.embedstream.me/live/8007.m3u8',year:'2019-',rating:8.7,seasons:3,episodes:24,tags:'acao,drama,super-heroi',featured:0});
a({title:'Wednesday',type:'series',cat:'cat_series',url:'https://live.embedstream.me/live/8008.m3u8',year:'2022-',rating:8.1,seasons:1,episodes:8,tags:'terror,comédia,misterio',featured:0});
a({title:'The Last of Us',type:'series',cat:'cat_series',url:'https://live.embedstream.me/live/8009.m3u8',year:'2023-',rating:8.8,seasons:1,episodes:9,tags:'drama,ficcao,aventura',featured:0});
a({title:'House of Dragon',type:'series',cat:'cat_series',url:'https://live.embedstream.me/live/8010.m3u8',year:'2022-',rating:8.4,seasons:2,episodes:18,tags:'fantasia,drama,dragoes',featured:0});
a({title:'Peaky Blinders',type:'series',cat:'cat_series',url:'https://live.embedstream.me/live/8011.m3u8',year:'2013-2022',rating:8.8,seasons:6,episodes:36,tags:'drama,crime,historia',featured:0});
a({title:'Dark',type:'series',cat:'cat_series',url:'https://live.embedstream.me/live/8012.m3u8',year:'2017-2020',rating:8.8,seasons:3,episodes:26,tags:'ficcao,misterio,alemão',featured:0});
a({title:'Money Heist',type:'series',cat:'cat_series',url:'https://live.embedstream.me/live/8013.m3u8',year:'2017-2021',rating:8.3,seasons:5,episodes:41,tags:'acao,crime,espanhol',featured:0});
a({title:'The Witcher',type:'series',cat:'cat_series',url:'https://live.embedstream.me/live/8014.m3u8',year:'2019-',rating:8.2,seasons:3,episodes:24,tags:'fantasia,aventura,netflix',featured:0});
a({title:'Squid Game',type:'series',cat:'cat_series',url:'https://live.embedstream.me/live/8015.m3u8',year:'2021-',rating:8.0,seasons:2,episodes:16,tags:'thriller,coreano,sobrevivencia',featured:0});
a({title:'Naruto Shippuden',type:'anime',cat:'cat_animes',url:'https://live.embedstream.me/live/9001.m3u8',year:'2007-2017',rating:9.0,seasons:21,episodes:500,tags:'acao,aventura,ninja,classico',featured:1});
a({title:'One Piece',type:'anime',cat:'cat_animes',url:'https://live.embedstream.me/live/9002.m3u8',year:'1999-',rating:9.2,seasons:20,episodes:1100,tags:'acao,aventura,pirata,classico',featured:1});
a({title:'Attack on Titan',type:'anime',cat:'cat_animes',url:'https://live.embedstream.me/live/9003.m3u8',year:'2013-2023',rating:9.1,seasons:4,episodes:87,tags:'acao,drama,fantasia,epico',featured:1});
a({title:'Dragon Ball Z',type:'anime',cat:'cat_animes',url:'https://live.embedstream.me/live/9004.m3u8',year:'1989-1996',rating:8.7,seasons:9,episodes:291,tags:'acao,aventura,classico,luta',featured:0});
a({title:'Demon Slayer',type:'anime',cat:'cat_animes',url:'https://live.embedstream.me/live/9005.m3u8',year:'2019-',rating:8.9,seasons:4,episodes:44,tags:'acao,fantasia,monstros',featured:0});
a({title:'My Hero Academia',type:'anime',cat:'cat_animes',url:'https://live.embedstream.me/live/9006.m3u8',year:'2016-',rating:8.5,seasons:7,episodes:140,tags:'acao,escola,super-heroi',featured:0});
a({title:'Death Note',type:'anime',cat:'cat_animes',url:'https://live.embedstream.me/live/9007.m3u8',year:'2006-2007',rating:9.0,seasons:1,episodes:37,tags:'thriller,misterio,psicologico',featured:0});
a({title:'FMA: Brotherhood',type:'anime',cat:'cat_animes',url:'https://live.embedstream.me/live/9008.m3u8',year:'2009-2010',rating:9.4,seasons:1,episodes:64,tags:'acao,aventura,alquimia,classico',featured:0});
a({title:'Hunter x Hunter',type:'anime',cat:'cat_animes',url:'https://live.embedstream.me/live/9009.m3u8',year:'2011-2014',rating:9.0,seasons:1,episodes:148,tags:'acao,aventura,fantasia,luta',featured:0});
a({title:'Jujutsu Kaisen',type:'anime',cat:'cat_animes',url:'https://live.embedstream.me/live/9010.m3u8',year:'2020-',rating:8.7,seasons:2,episodes:47,tags:'acao,fantasia,monstros',featured:0});
a({title:'Spy x Family',type:'anime',cat:'cat_animes',url:'https://live.embedstream.me/live/9011.m3u8',year:'2022-',rating:8.5,seasons:2,episodes:37,tags:'comédia,acao,espionagem',featured:0});
a({title:'Chainsaw Man',type:'anime',cat:'cat_animes',url:'https://live.embedstream.me/live/9012.m3u8',year:'2022-',rating:8.4,seasons:1,episodes:12,tags:'acao,terror,demonios',featured:0});
a({title:'One Punch Man',type:'anime',cat:'cat_animes',url:'https://live.embedstream.me/live/9013.m3u8',year:'2015-',rating:8.6,seasons:2,episodes:24,tags:'acao,comédia,super-heroi',featured:0});
a({title:'Bleach: TYBW',type:'anime',cat:'cat_animes',url:'https://live.embedstream.me/live/9014.m3u8',year:'2022-',rating:9.0,seasons:4,episodes:52,tags:'acao,fantasia,espiritos',featured:0});
a({title:'Solo Leveling',type:'anime',cat:'cat_animes',url:'https://live.embedstream.me/live/9015.m3u8',year:'2024-',rating:8.8,seasons:2,episodes:24,tags:'acao,fantasia,game-like',featured:0});
a({title:'Nosso Planeta',type:'movie',cat:'cat_documentarios',url:'https://live.embedstream.me/live/10001.m3u8',year:'2019',rating:9.3,duration:'404min',tags:'natureza,meio-ambiente,netflix',featured:0});
a({title:'Making a Murderer',type:'series',cat:'cat_documentarios',url:'https://live.embedstream.me/live/10002.m3u8',year:'2015-2018',rating:8.6,seasons:2,episodes:20,tags:'crime,justica,misterio',featured:0});
a({title:'The Social Dilemma',type:'movie',cat:'cat_documentarios',url:'https://live.embedstream.me/live/10003.m3u8',year:'2020',rating:7.6,duration:'94min',tags:'tecnologia,sociedade,redes-sociais',featured:0});
a({title:'Free Solo',type:'movie',cat:'cat_documentarios',url:'https://live.embedstream.me/live/10004.m3u8',year:'2018',rating:8.2,duration:'100min',tags:'esportes,aventura,alpinismo',featured:0});
a({title:'My Octopus Teacher',type:'movie',cat:'cat_documentarios',url:'https://live.embedstream.me/live/10005.m3u8',year:'2020',rating:8.1,duration:'85min',tags:'natureza,oceano,animais',featured:0});
a({title:'O Dilema das Redes',type:'movie',cat:'cat_documentarios',url:'https://live.embedstream.me/live/10006.m3u8',year:'2020',rating:7.6,duration:'94min',tags:'tecnologia,sociedade',featured:0});
a({title:'Icarus',type:'movie',cat:'cat_documentarios',url:'https://live.embedstream.me/live/10007.m3u8',year:'2017',rating:8.1,duration:'121min',tags:'esportes,doping,investigação',featured:0});
a({title:'A Era dos Dados',type:'series',cat:'cat_documentarios',url:'https://live.embedstream.me/live/10008.m3u8',year:'2023',rating:7.8,seasons:1,episodes:6,tags:'tecnologia,dados,futuro',featured:0});
a({title:'Peppa Pig',type:'series',cat:'cat_infantil',url:'https://live.embedstream.me/live/11001.m3u8',year:'2004-',rating:6.5,seasons:8,episodes:250,tags:'infantil,crianças,animais',featured:0});
a({title:'Paw Patrol',type:'series',cat:'cat_infantil',url:'https://live.embedstream.me/live/11002.m3u8',year:'2013-',rating:6.7,seasons:10,episodes:220,tags:'infantil,crianças,aventura',featured:0});
a({title:'Masha e o Urso',type:'series',cat:'cat_infantil',url:'https://live.embedstream.me/live/11003.m3u8',year:'2009-',rating:7.2,seasons:5,episodes:104,tags:'infantil,crianças,comédia',featured:0});
a({title:'Dora Aventureira',type:'series',cat:'cat_infantil',url:'https://live.embedstream.me/live/11004.m3u8',year:'2000-2019',rating:5.8,seasons:8,episodes:172,tags:'infantil,crianças,aventura',featured:0});
a({title:'O Show da Luna',type:'series',cat:'cat_infantil',url:'https://live.embedstream.me/live/11005.m3u8',year:'2014-',rating:7.0,seasons:6,episodes:150,tags:'infantil,crianças,ciência',featured:0});
a({title:'Galinha Pintadinha',type:'series',cat:'cat_infantil',url:'https://live.embedstream.me/live/11006.m3u8',year:'2006-',rating:6.8,seasons:12,episodes:200,tags:'infantil,crianças,música',featured:0});
a({title:'Turma da Mônica',type:'series',cat:'cat_infantil',url:'https://live.embedstream.me/live/11007.m3u8',year:'1976-',rating:7.5,seasons:15,episodes:300,tags:'infantil,crianças,comédia',featured:0});
a({title:'O Rei Leão (Filme)',type:'movie',cat:'cat_infantil',url:'https://live.embedstream.me/live/11008.m3u8',year:'1994',rating:8.5,duration:'88min',tags:'animação,disney,animais',featured:0});
const r = db.prepare('SELECT COUNT(*) as c FROM items').get();
console.log('Seed: ' + r.c + ' itens inseridos');
