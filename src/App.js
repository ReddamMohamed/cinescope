
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { FavoritesProvider } from "./context/FavoritesContext";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Details from "./pages/Details";
import Favorites from "./pages/Favorites";

function App() {
  return (
    <FavoritesProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#101014] text-white">
          <Navbar />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/details/:type/:id" element={<Details />} />
            <Route path="/favorites" element={<Favorites />} />
          </Routes>
        </div>
      </BrowserRouter>
    </FavoritesProvider>
  );
}

export default App;
