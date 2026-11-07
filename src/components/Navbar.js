
import React, { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  FaFilm,
  FaSearch,
  FaBars,
  FaTimes,
  FaHeart,
  FaHome,
  FaTv,
} from "react-icons/fa";

const GOLD = "#d8bd94";

function Navbar() {
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const homeType = params.get("type");

  const handleSearch = (e) => {
    e.preventDefault();

    const query = search.trim();
    if (!query) return;

    navigate(`/search?query=${encodeURIComponent(query)}&type=all`);

    setSearch("");
    setMenuOpen(false);
  };

  const navLinks = [
    {
      name: "Home",
      path: "/",
      icon: <FaHome />,
      active: location.pathname === "/" && !homeType,
    },
    {
      name: "Movies",
      path: "/?type=movies",
      icon: <FaFilm />,
      active: location.pathname === "/" && homeType === "movies",
    },
    {
      name: "TV Series",
      path: "/?type=series",
      icon: <FaTv />,
      active: location.pathname === "/" && homeType === "series",
    },
    {
      name: "Favorites",
      path: "/favorites",
      icon: <FaHeart />,
      active: location.pathname === "/favorites",
    },
  ];

  const linkClass = (active) =>
    `relative flex items-center gap-2 text-[13px] font-semibold tracking-wide transition-all duration-300 ${
      active
        ? "text-[#d8bd94]"
        : "text-gray-400 hover:text-white"
    }`;

  const closeMenu = () => setMenuOpen(false);

  const SearchForm = ({ mobile = false }) => (
    <form
      onSubmit={handleSearch}
      className={`relative ${
        mobile ? "w-full" : "hidden w-[250px] md:block xl:w-[290px]"
      }`}
    >
      <FaSearch
        className="absolute left-4 top-1/2 -translate-y-1/2 text-sm"
        style={{ color: GOLD }}
      />

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search movies, series..."
        className={`w-full border border-white/[0.08] bg-[#19191f] text-white outline-none transition-all duration-300 placeholder:text-gray-600 focus:border-[#d8bd94]/50 focus:shadow-[0_0_20px_rgba(216,189,148,0.06)] ${
          mobile
            ? "rounded-xl py-3.5 pl-11 pr-4 text-sm"
            : "rounded-full py-3 pl-11 pr-5 text-xs"
        }`}
      />
    </form>
  );

  return (
    <header className="fixed left-0 top-0 z-50 w-full border-b border-white/[0.07] bg-[#101014]/95 shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur-2xl">

      {/* Desktop / Main Navbar */}
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-5 px-5 md:px-8">

        {/* Logo */}
        <Link
          to="/"
          onClick={closeMenu}
          className="group flex shrink-0 items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#d8bd94]/25 bg-[#d8bd94]/10 transition-all duration-300 group-hover:border-[#d8bd94]/60 group-hover:bg-[#d8bd94]/20">
            <FaFilm className="text-lg text-[#d8bd94] transition-transform duration-300 group-hover:scale-110" />
          </div>

          <div className="flex flex-col leading-none">
            <span className="text-[21px] font-black tracking-[0.08em] text-white">
              CINE<span className="text-[#d8bd94]">SCOPE</span>
            </span>

            <span className="mt-1.5 text-[8px] font-semibold uppercase tracking-[0.28em] text-gray-500">
              Discover your next story
            </span>
          </div>
        </Link>

        {/* Desktop Links */}
        <nav className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={linkClass(link.active)}
            >
              {link.name}

              {link.active && (
                <span className="absolute -bottom-[30px] left-0 h-[2px] w-full rounded-full bg-[#d8bd94] shadow-[0_0_10px_rgba(216,189,148,0.35)]" />
              )}
            </Link>
          ))}
        </nav>

        {/* Desktop Search */}
        <SearchForm />

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#19191f] text-gray-300 transition-all hover:border-[#d8bd94]/40 hover:text-[#d8bd94] lg:hidden"
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`overflow-hidden border-t border-white/[0.06] bg-[#101014] transition-all duration-300 ease-in-out lg:hidden ${
          menuOpen
            ? "max-h-[450px] opacity-100"
            : "max-h-0 border-transparent opacity-0"
        }`}
      >
        <div className="mx-auto max-w-7xl px-5 py-5 md:px-8">

          <SearchForm mobile />

          <nav className="mt-5 grid grid-cols-2 gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={closeMenu}
                className={`flex items-center gap-3 rounded-xl border p-4 text-sm font-semibold transition-all duration-200 ${
                  link.active
                    ? "border-[#d8bd94]/30 bg-[#d8bd94]/10 text-[#d8bd94]"
                    : "border-white/[0.06] bg-[#19191f] text-gray-400 hover:border-white/20 hover:text-white"
                }`}
              >
                <span className="text-base">{link.icon}</span>
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-4">
            <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-gray-600">
              Discover your next story
            </span>

            <span className="text-[10px] font-bold tracking-[0.2em] text-[#d8bd94]">
              CINE SCOPE
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
