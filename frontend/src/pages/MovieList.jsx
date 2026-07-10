import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./MovieList.css";
const API = "/api";

export default function MovieList() {
  const [movies, setMovies] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const limit = 48;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit, page });
    if (search) params.set("search", search);
    fetch(`${API}/movies?${params}`)
      .then(r => r.json())
      .then(d => {
        setMovies(d.movies || []);
        setTotal(d.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, search]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="movie-list-page">
      <div className="page-header">
        <h1>🎬 Filmes</h1>
        <p>{total} filmes disponiveis</p>
      </div>
      <div className="search-bar">
        <input type="text" placeholder="Buscar filme..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>
      {loading ? (
        <div className="loading">Carregando...</div>
      ) : (
        <>
          <div className="movie-grid">
            {movies.map(movie => (
              <Link to={`/filme/${movie.id}`} key={movie.id} className="movie-card">
                <div className="movie-thumb">
                  {movie.thumbnail ? (
                    <img src={movie.thumbnail} alt={movie.title} loading="lazy"
                      onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }} />
                  ) : null}
                  <div className="movie-thumb-placeholder" style={{display: movie.thumbnail ? "none" : "flex"}}>🎬</div>
                  {movie.rating > 0 && <span className="movie-rating">⭐ {movie.rating}</span>}
                </div>
                <div className="movie-info">
                  <h3>{movie.title}</h3>
                  <p className="movie-genre">{movie.year} {movie.genre ? `• ${movie.genre.split(",")[0]}` : ""}</p>
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
