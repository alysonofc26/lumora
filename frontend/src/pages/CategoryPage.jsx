import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import "./CategoryPage.css";
const API = "/api";
export default function CategoryPage() {
  const { slug } = useParams();
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 24;
  useEffect(() => {
    fetch(API + "/categories").then(r => r.json()).then(cats => {
      setCategory(cats.find(c => c.slug === slug));
    });
  }, [slug]);
  useEffect(() => {
    if (!category) return;
    setLoading(true);
    let url = API + "/items?category=" + category.id + "&limit=" + limit + "&page=" + page;
    if (filter !== "all") url += "&type=" + filter;
    fetch(url).then(r => r.json()).then(d => { setItems(d.items || []); setTotal(d.total || 0); setLoading(false); });
  }, [category, filter, page]);
  if (!category) return <div className="loading">Carregando...</div>;
  const totalPages = Math.ceil(total / limit);
  return (
    <div className="category-page">
      <div className="category-header"><h1>{category.icon} {category.name}</h1><p>{total} itens</p></div>
      <div className="filters">
        {["all","channel","movie","series","anime"].map(f => (
          <button key={f} className={"filter-btn" + (filter === f ? " active" : "")} onClick={() => { setFilter(f); setPage(1); }}>
            {f === "all" ? "Todos" : f === "channel" ? "Canais" : f === "movie" ? "Filmes" : f === "series" ? "Series" : "Animes"}
          </button>
        ))}
      </div>
      {loading ? <div className="loading">Carregando...</div> : (<>
        <div className="items-grid">
          {items.map(item => (
            <Link to={"/player/" + item.id} key={item.id} className="item-card">
              <div className="item-poster"><span className="poster-emoji">{item.thumbnail || "FLM"}</span><div className="item-overlay"><span className="play-icon">PLAY</span></div></div>
              <div className="item-info"><h4>{item.title}</h4><div className="item-meta">{item.year && <span>{item.year}</span>}{item.duration && <span>{item.duration}</span>}</div></div>
            </Link>
          ))}
        </div>
        {totalPages > 1 && <div className="pagination"><button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</button><span>Pagina {page} de {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Proxima</button></div>}
      </>)}
    </div>
  );
}
