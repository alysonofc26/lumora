import { useState, useEffect } from "react";
import "./AdminPage.css";
const API = "/api";
export default function AdminPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [m3uText, setM3uText] = useState("");
  const [importResult, setImportResult] = useState("");
  const [formData, setFormData] = useState({ title: "", description: "", category_id: "", type: "channel", stream_url: "", thumbnail: "", year: "", rating: "", duration: "", seasons: 1, episodes: 1, tags: "", featured: 0 });
  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    const [ir, cr, sr] = await Promise.all([fetch(API + "/items?limit=100"), fetch(API + "/categories"), fetch(API + "/stats")]);
    const id = await ir.json();
    setItems(id.items || []);
    setCategories(await cr.json());
    setStats(await sr.json());
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch(API + "/items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...formData, rating: parseFloat(formData.rating) || 0, seasons: parseInt(formData.seasons), episodes: parseInt(formData.episodes), featured: parseInt(formData.featured) }) });
    setShowForm(false);
    setFormData({ title: "", description: "", category_id: "", type: "channel", stream_url: "", thumbnail: "", year: "", rating: "", duration: "", seasons: 1, episodes: 1, tags: "", featured: 0 });
    loadData();
  };
  const handleDelete = async (id) => { if (!confirm("Excluir?")) return; await fetch(API + "/items/" + id, { method: "DELETE" }); loadData(); };
  const handleM3UImport = async () => {
    if (!m3uText.trim()) return;
    const lines = m3uText.split(chr(92) + "n");
    let count = 0;
    let current = {};
    for (const line of lines) {
      const l = line.trim();
      if (l.startsWith("#EXTINF:")) {
        const nameMatch = l.match(/,(.+)$/);
        const logoMatch = l.match(/tvg-logo="([^"]+)"/);
        current = { name: nameMatch ? nameMatch[1] : "Sem nome", logo: logoMatch ? logoMatch[1] : "" };
      } else if (l && !l.startsWith("#") && current.name) {
        await fetch(API + "/items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: current.name, description: current.name, category_id: categories[0]?.id || "cat_canais", type: "channel", stream_url: l, thumbnail: current.logo || "TV", year: "", rating: 0, duration: "", seasons: 1, episodes: 1, tags: "imported", featured: 0 }) });
        count++;
        current = {};
      }
    }
    setImportResult("Importados " + count + " itens!");
    setM3uText("");
    loadData();
  };
  return (
    <div className="admin-page">
      <div className="admin-header"><h1>Painel Admin</h1><button className="add-btn" onClick={() => setShowForm(true)}>+ Adicionar</button></div>
      {stats && (
        <div className="admin-stats">
          <div className="admin-stat-card"><span className="stat-val">{stats.totalItems}</span><span className="stat-lbl">Total</span></div>
          <div className="admin-stat-card"><span className="stat-val">{stats.totalChannels}</span><span className="stat-lbl">Canais</span></div>
          <div className="admin-stat-card"><span className="stat-val">{stats.totalMovies}</span><span className="stat-lbl">Filmes</span></div>
          <div className="admin-stat-card"><span className="stat-val">{stats.totalSeries}</span><span className="stat-lbl">Series</span></div>
          <div className="admin-stat-card"><span className="stat-val">{stats.totalAnimes}</span><span className="stat-lbl">Animes</span></div>
        </div>
      )}
      <div className="m3u-import">
        <h3>Importar Lista M3U</h3>
        <textarea value={m3uText} onChange={(e) => setM3uText(e.target.value)} placeholder="Cole sua lista M3U aqui..." rows="6"></textarea>
        <button className="save-btn" onClick={handleM3UImport}>Importar</button>
        {importResult && <p className="import-result">{importResult}</p>}
      </div>
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Adicionar Item</h2>
            <form onSubmit={handleSubmit} className="item-form">
              <div className="form-row"><input placeholder="Titulo" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required /><select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}><option value="channel">Canal</option><option value="movie">Filme</option><option value="series">Serie</option><option value="anime">Anime</option></select></div>
              <div className="form-row"><select value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })} required><option value="">Categoria</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><input placeholder="URL do Stream (.m3u8 ou .mp4)" value={formData.stream_url} onChange={e => setFormData({ ...formData, stream_url: e.target.value })} required /></div>
              <div className="form-row"><input placeholder="Ano" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} /><input placeholder="Rating" type="number" step="0.1" value={formData.rating} onChange={e => setFormData({ ...formData, rating: e.target.value })} /><input placeholder="Duracao" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} /></div>
              <input placeholder="Tags (virgula)" value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} />
              <div className="form-actions"><button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>Cancelar</button><button type="submit" className="save-btn">Salvar</button></div>
            </form>
          </div>
        </div>
      )}
      <div className="items-table-wrapper">
        <table className="items-table">
          <thead><tr><th>Titulo</th><th>Tipo</th><th>Ano</th><th>Rating</th><th>Acoes</th></tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}><td>{item.title}</td><td><span className={"type-pill " + item.type}>{item.type}</span></td><td>{item.year}</td><td>{item.rating || "-"}</td><td><button className="edit-btn" onClick={() => handleDelete(item.id)}>Excluir</button></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
