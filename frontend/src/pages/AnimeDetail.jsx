import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import "./AnimeDetail.css";
const API = "/api";

export default function AnimeDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [selectedEp, setSelectedEp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/animes/${id}`)
      .then(r => r.json())
      .then(d => {
        setData(d);
        if (d.episodes && d.episodes.length > 0) {
          setSelectedEp(d.episodes[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-full">Carregando...</div>;
  if (!data) return <div className="loading-full">Anime nao encontrado</div>;

  const anime = data;
  const episodes = data.episodes || [];

  // Determine which player URL to show
  const getPlayerUrl = () => {
    if (!selectedEp) return null;
    return selectedEp.player_legendado || selectedEp.player_dublado || null;
  };

  const playerUrl = getPlayerUrl();

  return (
    <div className="anime-detail-page">
      <div className="anime-detail-header">
        <div className="anime-detail-thumb">
          {anime.thumbnail ? (
            <img src={anime.thumbnail} alt={anime.title}
              onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
          ) : null}
          <div className="anime-thumb-placeholder" style={{ display: anime.thumbnail ? "none" : "flex" }}>🎌</div>
        </div>
        <div className="anime-detail-info">
          <h1>{anime.title}</h1>
          <div className="anime-meta">
            {anime.year && <span className="meta-item">📅 {anime.year}</span>}
            {anime.rating > 0 && <span className="meta-item">⭐ {anime.rating}</span>}
            {anime.genre && <span className="meta-item">🏷️ {anime.genre}</span>}
          </div>
          {anime.description && <p className="anime-description">{anime.description}</p>}
          <div className="anime-source">
            <a href={anime.source_url} target="_blank" rel="noopener noreferrer" className="source-link">
              Ver no site original ↗
            </a>
          </div>
        </div>
      </div>

      {/* Player */}
      {selectedEp && (
        <div className="anime-player-section">
          <div className="player-header">
            <h2>{selectedEp.label || `Episodio ${selectedEp.episode_number}`}</h2>
          </div>
          {playerUrl ? (
            <div className="player-wrapper">
              <iframe
                src={playerUrl}
                allow="autoplay; fullscreen"
                sandbox="allow-scripts allow-same-origin allow-forms"
                frameBorder="0"
                allowFullScreen
                title={`Player - ${selectedEp.label}`}
              />
            </div>
          ) : (
            <div className="player-unavailable">
              <p>Player indisponivel para este episodio.</p>
              <a href={selectedEp.source_url} target="_blank" rel="noopener noreferrer" className="watch-external">
                Assistir no site original ↗
              </a>
            </div>
          )}
        </div>
      )}

      {/* Episode List */}
      {episodes.length > 0 && (
        <div className="episodes-section">
          <h3>Episodios ({episodes.length})</h3>
          <div className="episodes-grid">
            {episodes.map(ep => (
              <button
                key={ep.id}
                className={`ep-btn${selectedEp && selectedEp.id === ep.id ? " active" : ""}`}
                onClick={() => setSelectedEp(ep)}
              >
                <span className="ep-num">E{ep.episode_number}</span>
                <span className="ep-label">{ep.label || `Episodio ${ep.episode_number}`}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
