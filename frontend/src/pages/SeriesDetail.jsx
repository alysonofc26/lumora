import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import "./SeriesDetail.css";
const API = "/api";
const SOURCE_BASE = "https://thefilmes.net";

export default function SeriesDetail() {
  const { id } = useParams();
  const [serie, setSerie] = useState(null);
  const [activeEpisode, setActiveEpisode] = useState(null);
  const [playerIframe, setPlayerIframe] = useState(null);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [activePlayer, setActivePlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/series/${id}`)
      .then(r => r.json())
      .then(d => {
        setSerie(d);
        if (d.episodes && d.episodes.length > 0) {
          setActiveEpisode(d.episodes[0]);
        }
        // Auto-select first player
        if (d.players) {
          try {
            const ps = JSON.parse(d.players);
            const first = ps.find(p => !p.title.includes("Trailer"));
            if (first) setActivePlayer(first);
          } catch(e) {}
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handlePlayerClick = async (player) => {
    setActivePlayer(player);
    setPlayerLoading(true);
    setPlayerIframe(null);
    try {
      if (player.url) {
        let url = player.url;
        if (url.includes("iframetester.com")) {
          const m = url.match(/[?&]url=([^&]+)/);
          if (m) url = decodeURIComponent(m[1]);
        }
        setPlayerIframe(url);
      } else if (player.post && player.nume) {
        const form = new URLSearchParams();
        form.append("action", "dooplayer_play");
        form.append("post", player.post);
        form.append("nume", player.nume);
        form.append("type", player.data_type || "movie");
        const resp = await fetch(`${SOURCE_BASE}/wp-admin/admin-ajax.php`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: form.toString(),
        });
        const html = await resp.text();
        const m = html.match(/src=["']([^"']+)["']/);
        if (m) setPlayerIframe(m[1]);
        else setPlayerIframe(null);
      }
    } catch(e) { setPlayerIframe(null); }
    setPlayerLoading(false);
  };

  if (loading) return <div className="loading-full">Carregando...</div>;
  if (!serie) return <div className="loading-full">Serie nao encontrada</div>;

  let players = [];
  try { players = JSON.parse(serie.players || "[]"); } catch(e) {}
  const episodes = serie.episodes || [];
  
  // Group episodes by seasons
  const seasonsMap = {};
  episodes.forEach(ep => {
    const s = ep.season || 1;
    if (!seasonsMap[s]) seasonsMap[s] = [];
    seasonsMap[s].push(ep);
  });
  const seasons = Object.keys(seasonsMap).map(Number).sort((a, b) => a - b);

  return (
    <div className="series-detail-page">
      <div className="series-detail-header">
        <div className="series-detail-thumb">
          {serie.thumbnail ? (
            <img src={serie.thumbnail} alt={serie.title}
              onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }} />
          ) : null}
          <div className="series-thumb-placeholder" style={{display: serie.thumbnail ? "none" : "flex"}}>📺</div>
        </div>
        <div className="series-detail-info">
          <h1>{serie.title}</h1>
          <div className="series-meta">
            {serie.year && <span className="meta-item">📅 {serie.year}</span>}
            {serie.rating > 0 && <span className="meta-item">⭐ {serie.rating}</span>}
            {serie.genre && <span className="meta-item">🏷️ {serie.genre}</span>}
          </div>
          {serie.description && <p className="series-description">{serie.description}</p>}
          <div className="series-source">
            <a href={serie.source_url} target="_blank" rel="noopener noreferrer" className="source-link">Ver no site original ↗</a>
          </div>
        </div>
      </div>

      {/* Player */}
      {(players.length > 0 || activePlayer) && (
        <div className="series-player-section">
          <h2>{activeEpisode ? `${activeEpisode.label}` : "Player"}</h2>
          
          {players.length > 1 && (
            <div className="player-selector">
              {players.map((p, i) => (
                <button key={i}
                  className={`player-btn${activePlayer === p ? " active" : ""}`}
                  onClick={() => handlePlayerClick(p)}>
                  {p.title || `Player ${i+1}`}
                </button>
              ))}
            </div>
          )}

          {playerLoading ? (
            <div className="player-wrapper" style={{display:"flex",alignItems:"center",justifyContent:"center",background:"#1a1a2e"}}>
              <p style={{color:"#888"}}>Carregando player...</p>
            </div>
          ) : playerIframe ? (
            <div className="player-wrapper">
              <iframe src={playerIframe} allow="autoplay; fullscreen; picture-in-picture"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                frameBorder="0" allowFullScreen title={`Player - ${serie.title}`} />
            </div>
          ) : (
            <div className="player-unavailable">
              <p>Selecione um player e episodio para assistir.</p>
            </div>
          )}
        </div>
      )}

      {/* Seasons and Episodes */}
      {seasons.length > 0 && (
        <div className="episodes-section">
          <h3>Episodios ({episodes.length})</h3>
          
          {/* Season tabs */}
          {seasons.length > 1 && (
            <div className="season-tabs">
              {seasons.map(s => (
                <span key={s} className="season-label">Temporada {s}</span>
              ))}
            </div>
          )}
          
          {seasons.map(seasonNum => (
            <div key={seasonNum} className="season-block">
              {seasons.length > 1 && <h4 className="season-title">Temporada {seasonNum}</h4>}
              <div className="episodes-grid">
                {seasonsMap[seasonNum].map(ep => (
                  <button
                    key={ep.id}
                    className={`ep-btn${activeEpisode && activeEpisode.id === ep.id ? " active" : ""}`}
                    onClick={() => setActiveEpisode(ep)}
                  >
                    <span className="ep-num">E{ep.episode_number}</span>
                    <span className="ep-label">{ep.label || `Episodio ${ep.episode_number}`}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
