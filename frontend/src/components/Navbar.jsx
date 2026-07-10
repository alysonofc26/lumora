import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import "./Navbar.css";
export default function Navbar({ onToggleSidebar }) {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const isIPTV = location.pathname === "/iptv";

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = encodeURIComponent(searchQuery.trim());
    if (isIPTV) {
      navigate("/iptv?q=" + q);
    } else {
      navigate("/search?q=" + q);
    }
    setSearchQuery("");
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="menu-btn" onClick={onToggleSidebar}>&#9776;</button>
        <Link to="/" className="logo"><span className="logo-icon">&#127916;</span><span className="logo-text">Lumora</span></Link>
      </div>
      <form className="search-form" onSubmit={handleSearch}>
        <input type="text" placeholder={isIPTV ? "Buscar canal..." : "Buscar em tudo..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        <button type="submit">&#128269;</button>
      </form>
      <div className="navbar-right">
        <Link to="/iptv" className="nav-link">📡 IPTV</Link>
        <Link to="/filmes" className="nav-link">🎬 Filmes</Link>
        <Link to="/series" className="nav-link">📺 Séries</Link>
        <Link to="/animes" className="nav-link">🎌 Animes</Link>
        <Link to="/favorites" className="nav-link">❤️</Link>
        <Link to="/settings" className="nav-link">⚙️</Link>
      </div>
    </nav>
  );
}
