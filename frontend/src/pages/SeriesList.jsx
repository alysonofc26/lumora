import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./SeriesList.css";
const API = "/api";

export default function SeriesList() {
  const [series, setSeries] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const limit = 48;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit, page });
    if (search) params.set("search", search);
    fetch(`${API}/series?${params}`)
      .then(r => r.json())
      .then(d => {
        setSeries(d.series || []);
        setTotal(d.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, search]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="series-list-page">
      <div className="page-header">
        <h1>📺 Séries</h1>
        <p>{total} series disponiveis</p>
      </div>
      <div className="search-bar">
        <input type="text" placeholder="Buscar serie..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>
      {loading ? (
        <div className="loading">Carregando...</div>
      ) : (
        <>
          <div className="series-grid">
            {series.map(s => (
              <Link to={`/serie/${s.id}`} key={s.id} className="series-card">
                <div className="series-thumb">
                  {s.thumbnail ? (
                    <img src={s.thumbnail} alt={s.title} loading="lazy"
                      onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }} />
                  ) : null}
                  <div className="series-thumb-placeholder" style={{display: s.thumbnail ? "none" : "flex"}}>📺</div>
                  {s.rating > 0 && <span className="series-rating">⭐ {s.rating}</span>}
                </div>
                <div className="series-info">
                  <h3>{s.title}</h3>
                  <p className="series-genre">{s.year} {s.genre ? `• ${s.genre.split(",")[0]}` : ""}</p>
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
