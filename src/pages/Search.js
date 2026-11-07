
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FaSearch,
  FaTimes,
  FaFilm,
  FaTv,
  FaExclamationCircle,
  FaRedo,
} from "react-icons/fa";

import { searchMovies, searchShows } from "../api/movieApi";
import MovieGrid from "../components/MovieGrid";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

const getImageUrl = (image, size = "w500") => {
  if (!image || typeof image !== "string") return null;

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return `${TMDB_IMAGE_BASE}/${size}${image.startsWith("/") ? image : `/${image}`}`;
};

const normalizeSearchItem = (item, fallbackType) => {
  if (!item || typeof item !== "object") return null;

  const rawType =
    item.type ||
    item.mediaType ||
    item.media_type ||
    fallbackType;

  const type =
    rawType === "tv" || rawType === "series"
      ? "series"
      : "movie";

  // Support different poster field names.
  const posterSource =
    item.poster ||
    item.posterUrl ||
    item.posterURL ||
    item.poster_path ||
    item.posterPath ||
    item.image ||
    item.imageUrl ||
    item.profile_path ||
    null;

  const backdropSource =
    item.backdrop ||
    item.backdropUrl ||
    item.backdrop_path ||
    item.backdropPath ||
    null;

  const posterUrl = getImageUrl(posterSource, "w500");
  const backdropUrl = getImageUrl(backdropSource, "w1280");

  const releaseDate =
    item.releaseDate ||
    item.release_date ||
    item.first_air_date ||
    "";

  const title =
    item.title ||
    item.name ||
    item.original_title ||
    item.original_name ||
    "Untitled";

  return {
    ...item,

    id: item.id || item.tmdbId,
    tmdbId: item.tmdbId || item.id,

    type,
    mediaType: type,

    title,

    originalTitle:
      item.originalTitle ||
      item.original_title ||
      item.original_name ||
      title,

    // Provide the same image under multiple property names.
    // This helps compatibility with different MovieGrid versions.
    poster: posterUrl,
    posterUrl,
    poster_path: posterUrl,
    image: posterUrl,
    imageUrl: posterUrl,

    backdrop: backdropUrl,
    backdropUrl,
    backdrop_path: backdropUrl,

    description: item.description || item.overview || "",

    year:
      item.year ||
      (releaseDate ? releaseDate.slice(0, 4) : ""),

    releaseDate,

    rating: Number(
      item.rating ?? item.vote_average ?? 0
    ),

    voteCount: Number(
      item.voteCount ?? item.vote_count ?? 0
    ),

    popularity: Number(item.popularity ?? 0),

    genres: Array.isArray(item.genres)
      ? item.genres
      : [],
  };
};

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get("query") || searchParams.get("q") || "";
  const initialType = searchParams.get("type") || "all";

  const [inputValue, setInputValue] = useState(query);
  const [activeFilter, setActiveFilter] = useState(initialType);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setInputValue(query);
  }, [query]);

  useEffect(() => {
    setActiveFilter(initialType);
  }, [initialType]);

  const loadResults = useCallback(async () => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setResults([]);
      setError("");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [movieResponse, showResponse] = await Promise.allSettled([
        searchMovies(trimmedQuery),
        searchShows(trimmedQuery),
      ]);

      const movieData =
        movieResponse.status === "fulfilled"
          ? movieResponse.value
          : [];

      const showData =
        showResponse.status === "fulfilled"
          ? showResponse.value
          : [];

      const movies = Array.isArray(movieData)
        ? movieData
        : movieData?.results || [];

      const shows = Array.isArray(showData)
        ? showData
        : showData?.results || [];

      const normalizedMovies = movies
        .map((item) => normalizeSearchItem(item, "movie"))
        .filter((item) => item && item.id);

      const normalizedShows = shows
        .map((item) => normalizeSearchItem(item, "series"))
        .filter((item) => item && item.id);

      const combined = [...normalizedMovies, ...normalizedShows];

      const uniqueResults = Array.from(
        new Map(
          combined.map((item) => [`${item.type}-${item.id}`, item])
        ).values()
      );

      uniqueResults.sort(
        (a, b) => b.popularity - a.popularity
      );

      if (
        movieResponse.status === "rejected" &&
        showResponse.status === "rejected"
      ) {
        throw new Error(
          "Unable to load search results. Please check your API connection."
        );
      }

      setResults(uniqueResults);
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
      setError(
        err?.message || "Something went wrong while searching."
      );
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const filteredResults = useMemo(() => {
    if (activeFilter === "movie") {
      return results.filter((item) => item.type === "movie");
    }

    if (activeFilter === "series") {
      return results.filter((item) => item.type === "series");
    }

    return results;
  }, [results, activeFilter]);

  const submitSearch = (event) => {
    event.preventDefault();

    const trimmed = inputValue.trim();

    if (!trimmed) {
      setSearchParams({});
      return;
    }

    setSearchParams({
      query: trimmed,
      type: activeFilter,
    });
  };

  const clearSearch = () => {
    setInputValue("");
    setSearchParams({});
    setResults([]);
    setError("");
  };

  const filters = [
    { id: "all", label: "All", icon: <FaSearch /> },
    { id: "movie", label: "Movies", icon: <FaFilm /> },
    { id: "series", label: "TV Series", icon: <FaTv /> },
  ];

  return (
    <main className="min-h-screen bg-[#101014] text-white">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        {/* Page heading */}
        <div className="mb-9">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-[#d8bd94]">
            Discover something amazing
          </p>

          <h1 className="text-3xl font-bold sm:text-4xl">
            Search <span className="text-[#d8bd94]">CineScope</span>
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-gray-400">
            Find your favorite movies and television series in one place.
          </p>
        </div>

        {/* Search form */}
        <form
          onSubmit={submitSearch}
          className="mb-8 flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-[#19191f] p-2 transition focus-within:border-[#d8bd94]/60"
        >
          <FaSearch className="ml-3 shrink-0 text-lg text-[#d8bd94]" />

          <input
            type="text"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="Search movies or TV series..."
            className="min-w-0 flex-1 bg-transparent px-1 py-3 text-sm text-white outline-none placeholder:text-gray-500"
          />

          {inputValue && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
              className="rounded-lg p-2 text-gray-400 transition hover:bg-white/10 hover:text-white"
            >
              <FaTimes />
            </button>
          )}

          <button
            type="submit"
            className="rounded-xl bg-[#d8bd94] px-5 py-3 text-sm font-bold text-[#101014] transition hover:bg-[#e7cfaa]"
          >
            Search
          </button>
        </form>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => {
                setActiveFilter(filter.id);

                if (query.trim()) {
                  setSearchParams({
                    query,
                    type: filter.id,
                  });
                }
              }}
              className={`flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition ${
                activeFilter === filter.id
                  ? "border-[#d8bd94] bg-[#d8bd94] text-[#101014]"
                  : "border-white/10 bg-[#19191f] text-gray-400 hover:border-[#d8bd94]/50 hover:text-white"
              }`}
            >
              {filter.icon}
              {filter.label}
            </button>
          ))}
        </div>

        {/* Results heading */}
        {query.trim() && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">
                Results for{" "}
                <span className="text-[#d8bd94]">
                  "{query}"
                </span>
              </h2>

              {!loading && !error && (
                <p className="mt-1 text-sm text-gray-500">
                  {filteredResults.length}{" "}
                  {filteredResults.length === 1 ? "result" : "results"} found
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={loadResults}
              disabled={loading}
              className="flex items-center gap-2 text-sm text-gray-400 transition hover:text-[#d8bd94] disabled:opacity-50"
            >
              <FaRedo className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        )}

        {/* Initial state */}
        {!query.trim() && (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#19191f]/60 px-5 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#d8bd94]/10 text-2xl text-[#d8bd94]">
              <FaSearch />
            </div>

            <h2 className="text-xl font-semibold">
              What are you looking for?
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
              Search for a movie or TV series by its title to discover more.
            </p>
          </div>
        )}

        {/* Loading state */}
        {query.trim() && loading && (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="aspect-[2/3] rounded-xl bg-white/10" />
                <div className="mt-3 h-4 w-3/4 rounded bg-white/10" />
                <div className="mt-2 h-3 w-1/2 rounded bg-white/5" />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {query.trim() && !loading && error && (
          <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 px-5 text-center">
            <FaExclamationCircle className="mb-4 text-3xl text-red-400" />

            <h2 className="text-lg font-semibold">
              Something went wrong
            </h2>

            <p className="mt-2 max-w-md text-sm text-gray-400">
              {error}
            </p>

            <button
              type="button"
              onClick={loadResults}
              className="mt-5 rounded-xl bg-[#d8bd94] px-5 py-3 text-sm font-bold text-[#101014] transition hover:bg-[#e7cfaa]"
            >
              Try again
            </button>
          </div>
        )}

        {/* Results */}
        {query.trim() && !loading && !error && filteredResults.length > 0 && (
          <MovieGrid
            title=""
            items={filteredResults}
            loading={false}
          />
        )}

        {/* Empty results */}
        {query.trim() &&
          !loading &&
          !error &&
          filteredResults.length === 0 && (
            <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#19191f]/60 px-5 text-center">
              <div className="mb-4 text-4xl text-gray-600">
                {activeFilter === "movie" ? <FaFilm /> : <FaTv />}
              </div>

              <h2 className="text-xl font-semibold">
                No results found
              </h2>

              <p className="mt-2 max-w-md text-sm text-gray-500">
                We couldn't find anything matching "{query}" in this category.
                Try another title or change the filter.
              </p>

              {activeFilter !== "all" && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter("all");
                    setSearchParams({
                      query,
                      type: "all",
                    });
                  }}
                  className="mt-5 rounded-xl border border-[#d8bd94]/40 px-5 py-2.5 text-sm font-semibold text-[#d8bd94] transition hover:bg-[#d8bd94]/10"
                >
                  Show all results
                </button>
              )}
            </div>
          )}
      </div>
    </main>
  );
};

export default Search;
