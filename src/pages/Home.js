
import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  FaPlay,
  FaInfoCircle,
  FaHeart,
  FaSearch,
  FaStar,
  FaChevronRight,
  FaFilm,
  FaTv,
  FaFire,
  FaSyncAlt,
  FaExclamationCircle,
  FaCalendarAlt,
  FaTimes,
} from "react-icons/fa";

import {
  getPopularMovies,
  getTopRatedMovies,
  getUpcomingMovies,
  getPopularShows,
  getTopRatedShows,
  getAiringTodayShows,
  getTrendingAnime,
  getTopRatedAnime,
  reportError,
} from "../api/movieApi";

import { useFavorites } from "../context/FavoritesContext";

/* =========================================================
   THEME
========================================================= */

const THEME = {
  background: "#101014",
  surface: "#18181f",
  surfaceLight: "#202029",
  gold: "#d8bd94",
  goldHover: "#ecd3ad",
  muted: "#96949e",
  border: "rgba(255,255,255,0.08)",
};

/* =========================================================
   SMALL HELPERS
========================================================= */

function getYear(item) {
  return item?.year && item.year !== "N/A"
    ? item.year
    : "Unknown year";
}

function getRating(item) {
  const rating = Number(item?.rating || 0);

  if (!rating) return "N/A";

  return rating.toFixed(1);
}

function getTypeLabel(type) {
  if (type === "series" || type === "tv") return "TV Series";
  if (type === "anime") return "Anime";
  return "Movie";
}

function getDetailsPath(item) {
  return `/details/${item.type}/${item.id}`;
}

/* =========================================================
   FAVORITE BUTTON
========================================================= */

function FavoriteButton({ item, compact = false }) {
  const favoritesContext = useFavorites();

  const isFavorite =
    favoritesContext?.isFavorite?.(item.id, item.type) ||
    false;

  const handleFavorite = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (favoritesContext?.toggleFavorite) {
      favoritesContext.toggleFavorite(item);
      return;
    }

    if (isFavorite && favoritesContext?.removeFavorite) {
      favoritesContext.removeFavorite(item.id);
      return;
    }

    if (!isFavorite && favoritesContext?.addFavorite) {
      favoritesContext.addFavorite(item);
    }
  };

  return (
    <button
      type="button"
      onClick={handleFavorite}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      className={`
        flex items-center justify-center rounded-full
        border border-white/10 backdrop-blur-md
        transition-all duration-300
        ${
          compact
            ? "h-9 w-9"
            : "h-11 w-11"
        }
        ${
          isFavorite
            ? "bg-red-500/20 text-red-400 border-red-400/30"
            : "bg-black/40 text-white hover:bg-white/15 hover:text-[#d8bd94]"
        }
      `}
    >
      <FaHeart size={compact ? 13 : 15} />
    </button>
  );
}

/* =========================================================
   MOVIE CARD
========================================================= */

function MovieCard({ item, index = 0 }) {
  if (!item) return null;

  return (
    <article
      className="group min-w-0 animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="relative overflow-hidden rounded-xl bg-[#202029] aspect-[2/3]">
        <Link
          to={getDetailsPath(item)}
          className="absolute inset-0 z-10"
          aria-label={`View ${item.title}`}
        />

        {item.poster ? (
          <img
            src={item.poster}
            alt={item.title}
            loading="lazy"
            className="
              h-full w-full object-cover
              transition-transform duration-700
              group-hover:scale-110
            "
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/30">
            <FaFilm size={42} />
          </div>
        )}

        <div
          className="
            absolute inset-0
            bg-gradient-to-t from-black/90 via-black/10 to-transparent
            opacity-80 transition-opacity duration-300
            group-hover:opacity-100
          "
        />

        <div className="absolute left-3 top-3 z-20">
          <span className="rounded-md border border-white/10 bg-black/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#d8bd94] backdrop-blur-md">
            {getTypeLabel(item.type)}
          </span>
        </div>

        <div className="absolute right-3 top-3 z-20">
          <FavoriteButton item={item} compact />
        </div>

        {item.rating > 0 && (
          <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 rounded-md bg-black/65 px-2 py-1 text-xs font-semibold text-white backdrop-blur-md">
            <FaStar className="text-[#d8bd94]" size={11} />
            {getRating(item)}
          </div>
        )}

        <div
          className="
            absolute bottom-0 left-0 right-0 z-20
            translate-y-3 p-3 opacity-0
            transition-all duration-300
            group-hover:translate-y-0 group-hover:opacity-100
          "
        >
          <Link
            to={getDetailsPath(item)}
            className="
              flex w-full items-center justify-center gap-2
              rounded-lg bg-[#d8bd94] px-3 py-2.5
              text-xs font-bold text-[#151419]
              transition hover:bg-[#ecd3ad]
            "
          >
            <FaInfoCircle size={12} />
            View details
          </Link>
        </div>
      </div>

      <div className="mt-3">
        <Link
          to={getDetailsPath(item)}
          className="
            line-clamp-1 text-sm font-semibold text-white
            transition-colors hover:text-[#d8bd94]
          "
        >
          {item.title}
        </Link>

        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-xs text-[#96949e]">
            {getYear(item)}
          </span>

          {item.genres?.length > 0 && (
            <span className="truncate text-right text-[11px] text-[#777680]">
              {item.genres[0]}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   SECTION SKELETON
========================================================= */

function MovieSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[2/3] rounded-xl bg-[#24242c]" />
      <div className="mt-3 h-3 w-3/4 rounded bg-[#24242c]" />
      <div className="mt-2 h-2.5 w-1/3 rounded bg-[#24242c]" />
    </div>
  );
}

/* =========================================================
   CONTENT SECTION
========================================================= */

function ContentSection({
  title,
  subtitle,
  icon,
  items,
  loading,
  error,
  emptyText = "No titles available right now.",
  onRetry,
  viewAllLink,
}) {
  return (
    <section className="mb-14">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[#d8bd94]">
            {icon}
            <span className="text-[10px] font-bold uppercase tracking-[0.22em]">
              Discover
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-1 text-sm text-[#96949e]">
              {subtitle}
            </p>
          )}
        </div>

        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="flex items-center gap-2 text-xs font-semibold text-[#d8bd94] transition hover:text-white"
          >
            View all
            <FaChevronRight size={10} />
          </Link>
        )}
      </div>

      {error && !loading && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-400/20 bg-red-400/5 p-4">
          <div className="flex items-center gap-3">
            <FaExclamationCircle className="text-red-400" />
            <div>
              <p className="text-sm font-semibold text-white">
                Could not load this section
              </p>
              <p className="mt-1 text-xs text-[#96949e]">
                {error}
              </p>
            </div>
          </div>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white transition hover:border-[#d8bd94] hover:text-[#d8bd94]"
            >
              Try again
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <MovieSkeleton key={index} />
          ))}
        </div>
      ) : items?.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {items.slice(0, 12).map((item, index) => (
            <MovieCard
              key={`${item.type}-${item.id}`}
              item={item}
              index={index}
            />
          ))}
        </div>
      ) : (
        !error && (
          <div className="rounded-xl border border-white/5 bg-[#18181f] py-12 text-center">
            <FaFilm className="mx-auto mb-3 text-2xl text-[#55545e]" />
            <p className="text-sm text-[#96949e]">
              {emptyText}
            </p>
          </div>
        )
      )}
    </section>
  );
}

/* =========================================================
   HERO
========================================================= */

function Hero({ item, loading }) {
  if (loading) {
    return (
      <section className="relative mb-14 h-[460px] overflow-hidden rounded-2xl bg-[#202029] animate-pulse md:h-[560px]">
        <div className="absolute bottom-10 left-8 space-y-4 md:left-14">
          <div className="h-4 w-28 rounded bg-white/10" />
          <div className="h-10 w-64 rounded bg-white/10" />
          <div className="h-4 w-80 max-w-[80vw] rounded bg-white/10" />
        </div>
      </section>
    );
  }

  if (!item) return null;

  const backdrop = item.backdrop || item.poster;

  return (
    <section className="relative mb-14 min-h-[480px] overflow-hidden rounded-2xl border border-white/5 bg-[#18181f] md:min-h-[570px]">
      {backdrop && (
        <img
          src={backdrop}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-[#101014] via-[#101014]/90 to-[#101014]/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#101014] via-transparent to-black/20" />

      <div className="relative z-10 flex min-h-[480px] max-w-3xl flex-col justify-end px-6 pb-10 pt-32 md:min-h-[570px] md:px-14 md:pb-16">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <span className="rounded-md bg-[#d8bd94] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#151419]">
            Featured
          </span>

          <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
            {getTypeLabel(item.type)}
          </span>

          {item.rating > 0 && (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
              <FaStar className="text-[#d8bd94]" />
              {getRating(item)}
            </span>
          )}
        </div>

        <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[#d8bd94]">
          {getYear(item)}
          {item.genres?.length > 0 &&
            `  •  ${item.genres.slice(0, 3).join(" / ")}`}
        </p>

        <h1 className="max-w-2xl text-4xl font-black leading-[1.08] tracking-tight text-white md:text-6xl">
          {item.title}
        </h1>

        <p className="mt-5 line-clamp-3 max-w-xl text-sm leading-7 text-white/65 md:text-base">
          {item.description}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            to={getDetailsPath(item)}
            className="flex items-center gap-2 rounded-lg bg-[#d8bd94] px-6 py-3.5 text-sm font-bold text-[#151419] transition hover:bg-[#ecd3ad]"
          >
            <FaInfoCircle />
            Explore title
          </Link>

          <FavoriteButton item={item} />
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   MAIN HOME PAGE
========================================================= */

export default function Home() {
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState("all");
  const [searchValue, setSearchValue] = useState("");

  const [content, setContent] = useState({
    popularMovies: [],
    topMovies: [],
    upcomingMovies: [],
    popularShows: [],
    topShows: [],
    airingShows: [],
    trendingAnime: [],
    topAnime: [],
  });

  const [loading, setLoading] = useState(true);
  const [heroLoading, setHeroLoading] = useState(true);

  const [errors, setErrors] = useState({});

  const loadSection = useCallback(async (key, request) => {
    try {
      const result = await request();

      setContent((previous) => ({
        ...previous,
        [key]: Array.isArray(result) ? result : [],
      }));

      setErrors((previous) => ({
        ...previous,
        [key]: "",
      }));

      return result;
    } catch (error) {
      reportError(error, key);

      setErrors((previous) => ({
        ...previous,
        [key]: error.message || "Request failed.",
      }));

      setContent((previous) => ({
        ...previous,
        [key]: [],
      }));

      return [];
    }
  }, []);

  const loadAllContent = useCallback(async () => {
    setLoading(true);
    setHeroLoading(true);
    setErrors({});

    const requests = [
      ["popularMovies", getPopularMovies],
      ["topMovies", getTopRatedMovies],
      ["upcomingMovies", getUpcomingMovies],
      ["popularShows", getPopularShows],
      ["topShows", getTopRatedShows],
      ["airingShows", getAiringTodayShows],
      ["trendingAnime", getTrendingAnime],
      ["topAnime", getTopRatedAnime],
    ];

    await Promise.all(
      requests.map(([key, request]) =>
        loadSection(key, request)
      )
    );

    setLoading(false);
    setHeroLoading(false);
  }, [loadSection]);

  useEffect(() => {
    loadAllContent();
  }, [loadAllContent]);

  const retrySection = async (key) => {
    const requestMap = {
      popularMovies: getPopularMovies,
      topMovies: getTopRatedMovies,
      upcomingMovies: getUpcomingMovies,
      popularShows: getPopularShows,
      topShows: getTopRatedShows,
      airingShows: getAiringTodayShows,
      trendingAnime: getTrendingAnime,
      topAnime: getTopRatedAnime,
    };

    const request = requestMap[key];

    if (request) {
      await loadSection(key, request);
    }
  };

  const heroItem =
    content.popularMovies[0] ||
    content.popularShows[0] ||
    content.trendingAnime[0] ||
    null;

  const handleSearch = (event) => {
    event.preventDefault();

    const query = searchValue.trim();

    if (!query) return;

    navigate(
      `/search?query=${encodeURIComponent(query)}&type=all`
    );
  };

  const categories = [
    {
      id: "all",
      label: "Everything",
      icon: <FaFire />,
    },
    {
      id: "movie",
      label: "Movies",
      icon: <FaFilm />,
    },
    {
      id: "series",
      label: "TV Series",
      icon: <FaTv />,
    },
    {
      id: "anime",
      label: "Anime",
      icon: <FaStar />,
    },
  ];

  return (
    <main className="min-h-screen bg-[#101014] text-white">
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn .5s ease both;
        }

        * {
          scrollbar-color: #39343b #101014;
        }
      `}</style>

      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#101014]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-5 py-4 md:px-10">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#d8bd94] text-[#151419]">
              <FaFilm size={17} />
            </span>

            <span className="text-xl font-black tracking-tight text-white">
              Cine<span className="text-[#d8bd94]">Scope</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <Link
              to="/"
              className="text-sm font-semibold text-[#d8bd94]"
            >
              Home
            </Link>

            <Link
              to="/search?type=movie"
              className="text-sm text-[#96949e] transition hover:text-white"
            >
              Movies
            </Link>

            <Link
              to="/search?type=series"
              className="text-sm text-[#96949e] transition hover:text-white"
            >
              TV Series
            </Link>

            <Link
              to="/search?type=anime"
              className="text-sm text-[#96949e] transition hover:text-white"
            >
              Anime
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/favorites"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-[#96949e] transition hover:border-[#d8bd94]/50 hover:text-[#d8bd94]"
              title="Favorites"
            >
              <FaHeart size={15} />
            </Link>

            <button
              type="button"
              onClick={loadAllContent}
              disabled={loading}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-[#96949e] transition hover:border-[#d8bd94]/50 hover:text-[#d8bd94] disabled:opacity-40"
              title="Refresh content"
            >
              <FaSyncAlt
                size={14}
                className={loading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="mx-auto max-w-[1500px] px-5 pb-16 pt-8 md:px-10 md:pt-10">
        {/* INTRO */}
        <div className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#d8bd94]">
              Your entertainment destination
            </p>

            <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">
              Discover your next
              <span className="text-[#d8bd94]"> obsession.</span>
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#96949e]">
              Explore movies, television series, and anime
              from around the world.
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="flex w-full max-w-md items-center gap-3 rounded-xl border border-white/10 bg-[#18181f] px-4 py-3 transition focus-within:border-[#d8bd94]/60"
          >
            <FaSearch className="shrink-0 text-[#96949e]" />

            <input
              type="search"
              value={searchValue}
              onChange={(event) =>
                setSearchValue(event.target.value)
              }
              placeholder="Search movies, series, anime..."
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#777680]"
            />

            {searchValue && (
              <button
                type="button"
                onClick={() => setSearchValue("")}
                className="text-[#96949e] hover:text-white"
                aria-label="Clear search"
              >
                <FaTimes />
              </button>
            )}

            <button
              type="submit"
              className="rounded-lg bg-[#d8bd94] px-4 py-2 text-xs font-bold text-[#151419] transition hover:bg-[#ecd3ad]"
            >
              Search
            </button>
          </form>
        </div>

        {/* HERO */}
        <Hero
          item={heroItem}
          loading={heroLoading}
        />

        {/* CATEGORY FILTER */}
        <div className="mb-12 flex flex-wrap items-center gap-2 border-b border-white/[0.07] pb-5">
          {categories.map((category) => {
            const active = activeCategory === category.id;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() =>
                  setActiveCategory(category.id)
                }
                className={`
                  flex items-center gap-2 rounded-lg px-4 py-2.5
                  text-xs font-semibold transition-all
                  ${
                    active
                      ? "bg-[#d8bd94] text-[#151419]"
                      : "border border-white/10 bg-[#18181f] text-[#96949e] hover:border-[#d8bd94]/40 hover:text-white"
                  }
                `}
              >
                {category.icon}
                {category.label}
              </button>
            );
          })}
        </div>

        {/* MOVIES */}
        {(activeCategory === "all" ||
          activeCategory === "movie") && (
          <>
            <ContentSection
              title="Popular Movies"
              subtitle="The movies everyone is talking about."
              icon={<FaFire />}
              items={content.popularMovies}
              loading={loading}
              error={errors.popularMovies}
              onRetry={() => retrySection("popularMovies")}
              viewAllLink="/search?type=movie"
            />

            <ContentSection
              title="Top Rated Movies"
              subtitle="Highly rated movies worth your time."
              icon={<FaStar />}
              items={content.topMovies}
              loading={loading}
              error={errors.topMovies}
              onRetry={() => retrySection("topMovies")}
              viewAllLink="/search?type=movie"
            />

            <ContentSection
              title="Coming Soon"
              subtitle="Upcoming movies to look forward to."
              icon={<FaCalendarAlt />}
              items={content.upcomingMovies}
              loading={loading}
              error={errors.upcomingMovies}
              onRetry={() => retrySection("upcomingMovies")}
              viewAllLink="/search?type=movie"
            />
          </>
        )}

        {/* TV SERIES */}
        {(activeCategory === "all" ||
          activeCategory === "series") && (
          <>
            <ContentSection
              title="Popular TV Series"
              subtitle="Discover popular television shows."
              icon={<FaFire />}
              items={content.popularShows}
              loading={loading}
              error={errors.popularShows}
              onRetry={() => retrySection("popularShows")}
              viewAllLink="/search?type=series"
            />

            <ContentSection
              title="Top Rated TV Series"
              subtitle="Series with outstanding audience ratings."
              icon={<FaStar />}
              items={content.topShows}
              loading={loading}
              error={errors.topShows}
              onRetry={() => retrySection("topShows")}
              viewAllLink="/search?type=series"
            />

            <ContentSection
              title="Airing Today"
              subtitle="Series with episodes scheduled for today."
              icon={<FaCalendarAlt />}
              items={content.airingShows}
              loading={loading}
              error={errors.airingShows}
              onRetry={() => retrySection("airingShows")}
              viewAllLink="/search?type=series"
            />
          </>
        )}

        {/* ANIME */}
        {(activeCategory === "all" ||
          activeCategory === "anime") && (
          <>
            <ContentSection
              title="Trending Anime"
              subtitle="Popular anime from the AniList community."
              icon={<FaFire />}
              items={content.trendingAnime}
              loading={loading}
              error={errors.trendingAnime}
              onRetry={() => retrySection("trendingAnime")}
              viewAllLink="/search?type=anime"
            />

            <ContentSection
              title="Top Rated Anime"
              subtitle="Explore highly rated anime."
              icon={<FaStar />}
              items={content.topAnime}
              loading={loading}
              error={errors.topAnime}
              onRetry={() => retrySection("topAnime")}
              viewAllLink="/search?type=anime"
            />
          </>
        )}

        {/* FOOTER */}
        <footer className="mt-20 border-t border-white/[0.07] pt-8">
          <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
            <Link to="/" className="text-lg font-black text-white">
              Cine<span className="text-[#d8bd94]">Scope</span>
            </Link>

            <p className="text-xs text-[#777680]">
              Discover. Explore. Enjoy.
            </p>

            <p className="text-xs text-[#777680]">
              Movie and TV information provided by TMDB.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}