import { useState, useEffect } from "react";
import "./SettingsPage.css";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    player: "auto",
    quality: "auto",
    autoplay: true,
    showLogos: true,
    theme: "dark",
    language: "pt-BR",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("lumora_settings");
    if (saved) {
      try { setSettings(JSON.parse(saved)); } catch(e) {}
    }
  }, []);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem("lumora_settings", JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearFavorites = () => {
    if (confirm("Tem certeza que deseja limpar todos os favoritos?")) {
      // This would need a backend endpoint, for now just clear localStorage
      localStorage.removeItem("lumora_favorites");
      alert("Favoritos limpos!");
    }
  };

  const handleClearCache = () => {
    if (confirm("Limpar cache do navegador?")) {
      localStorage.clear();
      sessionStorage.clear();
      alert("Cache limpo! Recarregue a página.");
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>⚙️ Configurações</h1>
        <p>Personalize sua experiência no Lumora</p>
      </div>

      <div className="settings-grid">
        {/* Player Settings */}
        <div className="settings-section">
          <h2>🎬 Player</h2>
          
          <div className="setting-item">
            <label>Player padrão</label>
            <select value={settings.player} onChange={e => handleChange("player", e.target.value)}>
              <option value="auto">Automático</option>
              <option value="native">Player Nativo</option>
              <option value="hlsjs">HLS.js</option>
              <option value="iframe">Iframe</option>
            </select>
          </div>

          <div className="setting-item">
            <label>Qualidade de vídeo</label>
            <select value={settings.quality} onChange={e => handleChange("quality", e.target.value)}>
              <option value="auto">Automático</option>
              <option value="1080p">1080p</option>
              <option value="720p">720p</option>
              <option value="480p">480p</option>
              <option value="360p">360p</option>
            </select>
          </div>

          <div className="setting-item">
            <label>
              <input type="checkbox" checked={settings.autoplay}
                onChange={e => handleChange("autoplay", e.target.checked)} />
              Reproduzir automaticamente
            </label>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="settings-section">
          <h2>🎨 Aparência</h2>
          
          <div className="setting-item">
            <label>Tema</label>
            <select value={settings.theme} onChange={e => handleChange("theme", e.target.value)}>
              <option value="dark">Escuro</option>
              <option value="light">Claro</option>
            </select>
          </div>

          <div className="setting-item">
            <label>
              <input type="checkbox" checked={settings.showLogos}
                onChange={e => handleChange("showLogos", e.target.checked)} />
              Mostrar logos dos canais
            </label>
          </div>
        </div>

        {/* Data Settings */}
        <div className="settings-section">
          <h2>🗃 Dados</h2>
          
          <div className="setting-item">
            <button className="btn-danger" onClick={handleClearFavorites}>
              Limpar Favoritos
            </button>
            <p className="setting-hint">Remove todos os itens salvos como favorito</p>
          </div>

          <div className="setting-item">
            <button className="btn-danger" onClick={handleClearCache}>
              Limpar Cache
            </button>
            <p className="setting-hint">Limpa configurações e dados temporários</p>
          </div>
        </div>

        {/* Stats */}
        <div className="settings-section">
          <h2>📊 Estatísticas</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">633</span>
              <span className="stat-label">Filmes</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">890</span>
              <span className="stat-label">Séries</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">396</span>
              <span className="stat-label">Animes</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">12591</span>
              <span className="stat-label">Canais IPTV</span>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-footer">
        <button className="btn-primary" onClick={handleSave}>
          {saved ? "✓ Salvo!" : "Salvar Configurações"}
        </button>
      </div>
    </div>
  );
}
