import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./IPTVPage.css";
const API = "/api";

export default function IPTVPage() {
  const [searchParams] = useSearchParams();
  const search = searchParams.get("q") || "";
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [channels, setChannels] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  useEffect(() => {
    fetch(`${API}/iptv/groups`).then(r => r.json()).then(setGroups).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit, page });
    if (selectedGroup) params.set("group", selectedGroup);
    if (search) params.set("search", search);
    fetch(`${API}/iptv/channels?${params}`)
      .then(r => r.json())
      .then(d => { setChannels(d.channels || []); setTotal(d.total || 0); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selectedGroup, search, page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="iptv-page">
      <div className="page-header">
        <h1>Canais IPTV</h1>
        <p>{total} canais ao vivo disponiveis</p>
      </div>

      <div className="iptv-controls">
        {search && <p className="iptv-search-info">Buscando: "{search}"</p>}
        <select value={selectedGroup} onChange={e => { setSelectedGroup(e.target.value); setPage(1); }}>
          <option value="">Todos os grupos ({total})</option>
          {groups.map(g => (
            <option key={g.group_name} value={g.group_name}>{g.group_name} ({g.count})</option>
          ))}
        </select>
      </div>

      <div className="channel-grid">
        {loading ? (
          <div className="loading">Carregando...</div>
        ) : (
          channels.map(ch => (
            <div key={ch.id} className="iptv-card" onClick={() => navigate("/player/" + ch.id)}>
              {ch.logo ? (
                <img src={ch.logo} alt={ch.name} className="iptv-card-logo"
                  onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
              ) : null}
              <div className="iptv-card-placeholder" style={{ display: ch.logo ? "none" : "flex" }}>📺</div>
              <div className="iptv-card-info">
                <span className="iptv-card-name">{ch.name}</span>
                <span className="iptv-card-group">{ch.group_name}</span>
              </div>
              <div className="iptv-card-play">▶</div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
          <span>{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Proxima →</button>
        </div>
      )}
    </div>
  );
}
