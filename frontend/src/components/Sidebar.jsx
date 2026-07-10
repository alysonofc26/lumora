import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";

const NAV_ITEMS = [
  { to: "/", label: "Inicio", icon: "🏠" },
  { to: "/iptv", label: "Canais Ao Vivo", icon: "📡" },
  { to: "/filmes", label: "Filmes", icon: "🎬" },
  { to: "/series", label: "Séries", icon: "📺" },
  { to: "/animes", label: "Animes", icon: "🎌" },
  { to: "/category/documentarios", label: "Documentários", icon: "📚" },
  { to: "/category/infantil", label: "Infantil", icon: "🧸" },
];

export default function Sidebar({ isOpen }) {
  const { pathname } = useLocation();
  return (
    <aside className={"sidebar" + (isOpen ? "" : " closed")}>
      <div className="sidebar-header"><h3>Categorias</h3></div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <Link key={item.to} to={item.to} className={"sidebar-item" + (pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to)) ? " active" : "")}>
            <span className="sidebar-icon">{item.icon}</span><span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer"><p>IPTV Lumora v1.0</p></div>
    </aside>
  );
}
