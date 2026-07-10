import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./FavoritesPage.css";
const API = "/api";

const TYPE_LABELS = {
  movie: "🎬 Filmes",
  series: "📺 Séries",
  anime: "🎌 Animes",
  iptv: "📡 IPTV",
};

const TYPE_PATHS = {
  movie: "/filme/",
  series: "/serie/",
  anime: "/anime/",
  iptv: "/iptv",
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const loadFavorites = () => {
    setLoading(true);
    fetch(`${API}/favorites`)
      .then(r => r.json())
      .then(d => { setFavorites(d || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadFavorites(); }, []);

  const removeFavorite = (item) => {
    fetch(`${API}/favorites`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_type: item.item_type, item_id: item.item_id }),
    }).then(() => loadFavorites());
  };

  const filtered = filter
    ? favorites.filter(f => f.item_type === filter)
    : favorites;

  const grouped = {};
  filtered.forEach(f => {
    if (!grouped[f.item_type]) grouped[f.item_type] = [];
    grouped[f.item_type].push(f);
  });

  return (
    <div className="favorites-page">
      <div className="page-header">
        <h1>❤️ Favoritos</h1>
        <p>{favorites.length} itens salvos</p>
      </div>

      <div className="fav-controls">
        <button className={!filter ? "active" : ""} onClick={() => setFilter("")}>Todos</button>
        {Object.entries(TYPE_LABELS).map(([key, label]) => (
          <button key={key} className={filter === key ? "active" : ""} onClick={() => setFilter(key)}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-favorites">
          <p>💔</p>
          <p>Nenhum favorito ainda.</p>
          <p>Navegue pelos conteúdos e clique no ❤️ para salvar!</p>
        </div>
      ) : (
        Object.entries(grouped).map(([type, items]) => (
          <div key={type} className="fav-group">
            <h2>{TYPE_LABELS[type] || type} ({items.length})</h2>
            <div className="fav-grid">
              {items.map(fav => (
                <div key={`${fav.item_type}-${fav.item_id}`} className="fav-card">
                  <Link to={`${TYPE_PATHS[fav.item_type] || "/"}${fav.item_id}`}>
                    {fav.thumbnail ? (
                      <img src={fav.thumbnail} alt={fav.title} loading="lazy"
                        onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }} />
                    ) : null}
                    <div className="fav-thumb-placeholder" style={{display: fav.thumbnail ? "none" : "flex"}}>
                      {TYPE_LABELS[fav.item_type]?.split(" ")[0] || "📺"}
                    </div>
                    <div className="fav-info">
                      <h4>{fav.title}</h4>
                    </div>
                  </Link>
                  <button className="remove-fav" onClick={() => removeFavorite(fav)}>✕</button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
