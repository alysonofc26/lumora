import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./AnimeList.css";
const API = "/api";

export default function AnimeList() {
  const [animes, setAnimes] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const limit = 48;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit, page });
    if (search) params.set("search", search);
    fetch(`${API}/animes?${params}`)
      .then(r => r.json())
      .then(d => {
        setAnimes(d.animes || []);
        setTotal(d.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, search]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="anime-list-page">
      <div className="page-header">
        <h1>🎌 Animes</h1>
        <p>{total} animes disponiveis</p>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Buscar anime..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : (
        <>
          <div className="anime-grid">
            {animes.map(anime => (
              <Link to={`/anime/${anime.id}`} key={anime.id} className="anime-card">
                <div className="anime-thumb">
                  {anime.thumbnail ? (
                    <img src={anime.thumbnail} alt={anime.title} loading="lazy"
                      onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
                  ) : null}
                  <div className="anime-thumb-placeholder" style={{ display: anime.thumbnail ? "none" : "flex" }}>
                    🎌
                  </div>
                  {anime.rating > 0 && (
                    <span className="anime-rating">⭐ {anime.rating}</span>
                  )}
                </div>
                <div className="anime-info">
                  <h3>{anime.title}</h3>
                  <p className="anime-genre">{anime.year} {anime.genre ? `• ${anime.genre.split(",")[0]}` : ""}</p>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
              <span>Pagina {page} de {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Proxima →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
