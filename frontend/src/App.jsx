import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import CategoryPage from "./pages/CategoryPage";
import PlayerPage from "./pages/PlayerPage";
import SearchResults from "./pages/SearchResults";
import SearchPage from "./pages/SearchPage";
import AdminPage from "./pages/AdminPage";
import AnimeList from "./pages/AnimeList";
import AnimeDetail from "./pages/AnimeDetail";
import MovieList from "./pages/MovieList";
import MovieDetail from "./pages/MovieDetail";
import SeriesList from "./pages/SeriesList";
import SeriesDetail from "./pages/SeriesDetail";
import IPTVPage from "./pages/IPTVPage";
import FavoritesPage from "./pages/FavoritesPage";
import SettingsPage from "./pages/SettingsPage";
import "./App.css";
export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="app-body">
          <Sidebar isOpen={sidebarOpen} />
          <main className={"main-content" + (sidebarOpen ? "" : " full-width")}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/category/:slug" element={<CategoryPage />} />
              <Route path="/player/:id" element={<PlayerPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/search/results" element={<SearchResults />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/animes" element={<AnimeList />} />
              <Route path="/anime/:id" element={<AnimeDetail />} />
              <Route path="/filmes" element={<MovieList />} />
              <Route path="/filme/:id" element={<MovieDetail />} />
              <Route path="/series" element={<SeriesList />} />
              <Route path="/serie/:id" element={<SeriesDetail />} />
              <Route path="/iptv" element={<IPTVPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
