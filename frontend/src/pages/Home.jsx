import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Home.css";
const API = "/api";
export default function Home() {
  const [stats, setStats] = useState(null);
  const [featured, setFeatured] = useState([]);
  const [channels, setChannels] = useState([]);
  const [animes, setAnimes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);
  const [iptvChannels, setIptvChannels] = useState([]);
  useEffect(() => {
    fetch(API + "/stats").then(r => r.json()).then(setStats);
    fetch(API + "/items?featured=1&limit=10").then(r => r.json()).then(d => setFeatured(d.items || []));
    fetch(API + "/items?type=channel&limit=8").then(r => r.json()).then(d => setChannels(d.items || []));
    fetch(API + "/animes?limit=8&page=1").then(r => r.json()).then(d => setAnimes(d.animes || [])).catch(() => {});
    fetch(API + "/movies?limit=8&page=1").then(r => r.json()).then(d => setMovies(d.movies || [])).catch(() => {});
    fetch(API + "/series?limit=8&page=1").then(r => r.json()).then(d => setSeries(d.series || [])).catch(() => {});
    fetch(API + "/iptv/channels?limit=8&group=News").then(r => r.json()).then(d => setIptvChannels(d.channels || [])).catch(() => {});
  }, []);

  const HomeGrid = ({ items, path, icon, cls }) => (
    <div className={`card-grid ${cls}`}>
      {items.map(item => (
        <Link to={`/${path}/${item.id}`} key={item.id} className={`${path}-home-card`}>
          <div className={`${path}-home-thumb`}>
            {item.thumbnail ? (
              <img src={item.thumbnail} alt={item.title} loading="lazy"
                onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }} />
            ) : null}
            <div className="thumb-placeholder" style={{display: item.thumbnail ? "none" : "flex"}}>{icon}</div>
            {item.rating > 0 && <span className="rating-badge">⭐ {item.rating}</span>}
          </div>
          <div className={`${path}-home-info`}><h4>{item.title}</h4><p>{item.year || ""}</p></div>
        </Link>
      ))}
    </div>
  );

  return (
    <div className="home">
      <section className="hero"><div className="hero-content">
        <h1>Bem-vindo ao <span className="highlight">Lumora</span></h1>
        <p>Filmes, series, animes e canais - tudo em um so lugar.</p>
        <div className="hero-stats">
          {stats && (<>
            <div className="stat-card"><span className="stat-number">{movies.length || 0}</span><span className="stat-label">Filmes</span></div>
            <div className="stat-card"><span className="stat-number">{series.length || 0}</span><span className="stat-label">Series</span></div>
            <div className="stat-card"><span className="stat-number">{animes.length || 0}</span><span className="stat-label">Animes</span></div>
            <div className="stat-card"><span className="stat-number">386K+</span><span className="stat-label">Canais IPTV</span></div>
          </>)}
        </div>
      </div></section>

      {iptvChannels.length > 0 && (
        <section className="section"><div className="section-header"><h2>📡 Canais Ao Vivo</h2><Link to="/iptv" className="see-all">Ver todos</Link></div>
          <div className="card-grid channels-grid">
            {iptvChannels.map(ch => (
              <Link to={`/iptv`} key={`iptv-${ch.id}`} className="channel-card">
                {ch.logo ? <img src={ch.logo} alt={ch.name} className="channel-logo" /> : <div className="channel-icon">📺</div>}
                <div className="channel-info"><h4>{ch.name}</h4><span className="live-badge">AO VIVO</span></div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {movies.length > 0 && (
        <section className="section"><div className="section-header"><h2>🎬 Filmes</h2><Link to="/filmes" className="see-all">Ver todos</Link></div>
          <HomeGrid items={movies} path="filme" icon="🎬" cls="movie-home-grid" />
        </section>
      )}

      {series.length > 0 && (
        <section className="section"><div className="section-header"><h2>📺 Séries</h2><Link to="/series" className="see-all">Ver todos</Link></div>
          <HomeGrid items={series} path="serie" icon="📺" cls="series-home-grid" />
        </section>
      )}

      {animes.length > 0 && (
        <section className="section"><div className="section-header"><h2>🎌 Animes</h2><Link to="/animes" className="see-all">Ver todos</Link></div>
          <HomeGrid items={animes} path="anime" icon="🎌" cls="anime-home-grid" />
        </section>
      )}

      <section className="section"><div className="section-header"><h2>Destaques</h2></div>
        <div className="card-grid featured-grid">
          {featured.map(item => (<Link to={"/player/" + item.id} key={item.id} className="featured-card"><div className="featured-poster"><span className="poster-emoji">{item.thumbnail || "FLM"}</span><div className="featured-overlay"><span className="play-btn">PLAY</span></div></div><div className="featured-info"><h4>{item.title}</h4><p>{item.year || ""}</p></div></Link>))}
        </div>
      </section>
    </div>
  );
}
