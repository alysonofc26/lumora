import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import "./SearchResults.css";
const API = "/api";
export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!query) return;
    setLoading(true);
    fetch(API + "/search?q=" + encodeURIComponent(query)).then(r => r.json()).then(d => { setResults(d); setLoading(false); });
  }, [query]);
  return (
    <div className="search-page">
      <h1 className="search-title">{loading ? "Buscando..." : "Resultados para: " + query}</h1>
      {loading ? <div className="loading">Buscando...</div> : results.length === 0 ? (
        <div className="no-results"><span className="no-results-icon">🔍</span><p>Nenhum resultado para: {query}</p><Link to="/" className="back-home">Voltar ao inicio</Link></div>
      ) : (
        <div className="search-results-grid">
          {results.map(item => (
            <Link to={"/player/" + item.id} key={item.id} className="search-card">
              <div className="search-poster"><span>{item.thumbnail || "FLM"}</span><div className="search-overlay">PLAY</div></div>
              <div className="search-info"><h4>{item.title}</h4><span>{item.type === "channel" ? "Canal" : item.type === "movie" ? "Filme" : item.type === "series" ? "Serie" : "Anime"}</span></div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
