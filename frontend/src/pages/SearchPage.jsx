import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import "./SearchPage.css";
const API = "/api";

const TYPE_CONFIG = {
  movie: { label: "🎬 Filmes", path: "/filme/" },
  series: { label: "📺 Séries", path: "/serie/" },
  anime: { label: "🎌 Animes", path: "/anime/" },
  iptv: { label: "📡 IPTV", path: "/iptv" },
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ movies: [], series: [], animes: [], iptv: [] });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback((q) => {
    if (!q || q.length < 2) { setResults({ movies: [], series: [], animes: [], iptv: [] }); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    fetch(`${API}/search/all?q=${encodeURIComponent(q)}&limit=10`)
      .then(r => r.json())
      .then(d => { setResults(d || {}); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  const totalResults = (results.movies?.length || 0) + (results.series?.length || 0) + (results.animes?.length || 0) + (results.iptv?.length || 0);

  return (
    <div className="search-page">
      <div className="page-header">
        <h1>🔍 Busca Global</h1>
        <p>Pesquise em filmes, series, animes e canais IPTV</p>
      </div>

      <div className="search-box">
        <input type="text" placeholder="Digite o que deseja buscar..." value={query}
          onChange={e => setQuery(e.target.value)} autoFocus />
        {loading && <span className="search-loading">Buscando...</span>}
      </div>

      {searched && (
        <p className="search-results-count">{totalResults} resultados para "{query}"</p>
      )}

      {totalResults === 0 && searched && !loading && (
        <div className="empty-search">
          <p>😕</p>
          <p>Nenhum resultado encontrado.</p>
        </div>
      )}

      {Object.entries(TYPE_CONFIG).map(([type, config]) => {
        const items = results[type] || [];
        if (items.length === 0) return null;
        return (
          <div key={type} className="search-group">
            <h2>{config.label} ({items.length})</h2>
            <div className="search-grid">
              {items.map(item => (
                <Link key={`${type}-${item.id}`} to={`${config.path}${item.id}`} className="search-card">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} loading="lazy"
                      onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }} />
                  ) : null}
                  <div className="search-thumb-placeholder" style={{display: item.thumbnail ? "none" : "flex"}}>
                    {config.label.split(" ")[0]}
                  </div>
                  <div className="search-info">
                    <h4>{item.title}</h4>
                    <p>{item.year || item.group_name || ""}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
