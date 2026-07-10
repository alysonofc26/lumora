import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import "./MovieDetail.css";
const API = "/api";
const SOURCE_BASE = "https://thefilmes.net";

// Known player domains and how to handle them
const PLAYER_DOMAINS = {
  // Direct iframe players
  "superflixapi.cyou": "iframe",
  "embedplayer.site": "iframe",
  "fembed.sx": "iframe",
  "fembed.com": "iframe",
  "fshd.link": "iframe",
  "vsembed.ru": "iframe",
  "embed69.org": "iframe",
  "kllamrd.org": "iframe",
  "watchonline.to": "iframe",
  "embedflix.com": "iframe",
  "upcloud.co": "iframe",
  "doodstream.com": "iframe",
  "streamtape.com": "iframe",
  "mixdrop.co": "iframe",
  "mixdrop.to": "iframe",
  "vidcloud.co": "iframe",
  "goplayer.app": "iframe",
  "playhydrax.com": "iframe",
  // Redirect/link pages that need extraction
  "iframetester.com": "redirect",
  "assistirseriesonline.cc": "redirect",
};

function extractPlayerUrl(url) {
  if (!url) return null;
  // Handle iframetester wrapper
  if (url.includes("iframetester.com")) {
    const m = url.match(/[?&]url=([^&]+)/);
    if (m) return decodeURIComponent(m[1]);
  }
  return url;
}

function isDirectPlayer(url) {
  if (!url) return false;
  const extracted = extractPlayerUrl(url);
  for (const domain of Object.keys(PLAYER_DOMAINS)) {
    if (extracted.includes(domain)) return true;
  }
  return false;
}

export default function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [activePlayer, setActivePlayer] = useState(null);
  const [playerIframe, setPlayerIframe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerError, setPlayerError] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/movies/${id}`)
      .then(r => r.json())
      .then(d => {
        setMovie(d);
        if (d.players) {
          try {
            const ps = JSON.parse(d.players);
            // Prefer direct URL players, fallback to AJAX players
            const direct = ps.find(p => p.url && isDirectPlayer(p.url));
            const any = ps.find(p => p.title !== "Trailer" && !p.title.includes("Trailer"));
            setActivePlayer(direct || any || null);
            if (direct) {
              setPlayerIframe(extractPlayerUrl(direct.url));
            }
          } catch(e) {}
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handlePlayerClick = useCallback(async (player) => {
    setActivePlayer(player);
    setPlayerLoading(true);
    setPlayerIframe(null);
    setPlayerError(false);
    
    try {
      // Direct URL player
      if (player.url) {
        const url = extractPlayerUrl(player.url);
        if (isDirectPlayer(url)) {
          setPlayerIframe(url);
          setPlayerLoading(false);
          return;
        }
        // Try to fetch redirect page and extract iframe
        try {
          const resp = await fetch(url, { redirect: "follow" });
          const finalUrl = resp.url || url;
          if (isDirectPlayer(finalUrl)) {
            setPlayerIframe(finalUrl);
            setPlayerLoading(false);
            return;
          }
        } catch(e) {}
        // Fallback: try the URL anyway
        setPlayerIframe(url);
        setPlayerLoading(false);
        return;
      }
      
      // AJAX player (post/nume)
      if (player.post && player.nume) {
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
        
        // Try to extract iframe src
        const m = html.match(/src=["']([^"']+)["']/);
        if (m && m[1] !== "javascript:false") {
          setPlayerIframe(m[1]);
          setPlayerLoading(false);
          return;
        }
        // Try to find any embed URL
        const m2 = html.match(/(https?:\/\/[^\s"'<>]+(?:embed|player|video|stream|cloud|flix)[^\s"'<>]*)/i);
        if (m2) {
          setPlayerIframe(m2[1]);
          setPlayerLoading(false);
          return;
        }
        // Try data-src
        const m3 = html.match(/data-src=["']([^"']+)["']/);
        if (m3) {
          setPlayerIframe(m3[1]);
          setPlayerLoading(false);
          return;
        }
        
        setPlayerError(true);
      }
    } catch(e) {
      setPlayerError(true);
    }
    setPlayerLoading(false);
  }, []);

  if (loading) return <div className="loading-full">Carregando...</div>;
  if (!movie) return <div className="loading-full">Filme nao encontrado</div>;

  let players = [];
  try { players = JSON.parse(movie.players || "[]"); } catch(e) {}
  
  // Filter out trailer-only players for the main list
  const mainPlayers = players.filter(p => !p.title.includes("Trailer") && p.nume !== "trailer");
  const trailerPlayers = players.filter(p => p.title.includes("Trailer") || p.nume === "trailer");

  return (
    <div className="movie-detail-page">
      <div className="movie-detail-header">
        <div className="movie-detail-thumb">
          {movie.thumbnail ? (
            <img src={movie.thumbnail} alt={movie.title}
              onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }} />
          ) : null}
          <div className="movie-thumb-placeholder" style={{display: movie.thumbnail ? "none" : "flex"}}>🎬</div>
        </div>
        <div className="movie-detail-info">
          <h1>{movie.title}</h1>
          <div className="movie-meta">
            {movie.year && <span className="meta-item">📅 {movie.year}</span>}
            {movie.rating > 0 && <span className="meta-item">⭐ {movie.rating}</span>}
            {movie.duration && <span className="meta-item">⏱️ {movie.duration}</span>}
            {movie.genre && <span className="meta-item">🏷️ {movie.genre}</span>}
          </div>
          {movie.description && <p className="movie-description">{movie.description}</p>}
          <div className="movie-source">
            <a href={movie.source_url} target="_blank" rel="noopener noreferrer" className="source-link">Ver no site original ↗</a>
          </div>
        </div>
      </div>

      {/* Player */}
      <div className="movie-player-section">
        <div className="player-header">
          <h2>{activePlayer?.title || "Player"} {movie.title}</h2>
        </div>

        {/* Player selector */}
        {mainPlayers.length > 0 && (
          <div className="player-selector">
            {mainPlayers.map((p, i) => (
              <button key={i}
                className={`player-btn${activePlayer === p ? " active" : ""}`}
                onClick={() => handlePlayerClick(p)}>
                {p.title || `Player ${i+1}`}
                {p.url && isDirectPlayer(p.url) && <span className="direct-badge">●</span>}
              </button>
            ))}
          </div>
        )}

        {/* Trailer button */}
        {trailerPlayers.length > 0 && (
          <div className="player-selector" style={{marginTop: 8}}>
            {trailerPlayers.map((p, i) => (
              <button key={`t${i}`}
                className={`player-btn trailer${activePlayer === p ? " active" : ""}`}
                onClick={() => handlePlayerClick(p)}>
                🎞️ {p.title || "Trailer"}
              </button>
            ))}
          </div>
        )}

        {/* Player iframe */}
        {playerLoading ? (
          <div className="player-wrapper" style={{display:"flex",alignItems:"center",justifyContent:"center",background:"#1a1a2e"}}>
            <p style={{color:"#888"}}>Carregando player...</p>
          </div>
        ) : playerIframe ? (
          <div className="player-wrapper">
            <iframe
              src={playerIframe}
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              frameBorder="0"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              title={`Player - ${movie.title}`}
              onError={() => setPlayerError(true)}
            />
          </div>
        ) : playerError ? (
          <div className="player-unavailable">
            <p>Erro ao carregar player. Tente outro player acima.</p>
            <a href={movie.source_url} target="_blank" rel="noopener noreferrer" className="watch-external">
              Assistir no site original ↗
            </a>
          </div>
        ) : (
          <div className="player-unavailable">
            <p>Selecione um player acima para assistir.</p>
          </div>
        )}
      </div>
    </div>
  );
}
