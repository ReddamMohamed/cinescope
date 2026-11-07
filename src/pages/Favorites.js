
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FaHeart,
  FaCompass,
  FaFilm,
  FaTrashAlt,
} from "react-icons/fa";

import { useFavorites } from "../context/FavoritesContext";
import MovieGrid from "../components/MovieGrid";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

const getImageUrl = (image, size = "w500") => {
  if (!image || typeof image !== "string") return null;

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return `${TMDB_IMAGE_BASE}/${size}${
    image.startsWith("/") ? image : `/${image}`
  }`;
};

const normalizeFavorite = (item) => {
  if (!item || typeof item !== "object") return null;

  const posterSource =
    item.poster ||
    item.posterUrl ||
    item.posterURL ||
    item.poster_path ||
    item.posterPath ||
    item.image ||
    item.imageUrl ||
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

  const rawType =
    item.type ||
    item.mediaType ||
    item.media_type ||
    "movie";

  const type =
    rawType === "tv" || rawType === "series"
      ? "series"
      : rawType;

  const title =
    item.title ||
    item.name ||
    item.original_title ||
    item.original_name ||
    "Untitled";

  return {
    ...item,

    id: item.id ?? item.tmdbId,
    tmdbId: item.tmdbId ?? item.id,

    type,
    mediaType: type,

    title,

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

function Favorites() {
  const { favorites } = useFavorites();

  const favoriteItems = useMemo(() => {
    if (!Array.isArray(favorites)) return [];

    return favorites
      .map(normalizeFavorite)
      .filter((item) => item && item.id);
  }, [favorites]);

  return (
    <main className="min-h-screen bg-[#101014] text-white">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">

        {/* Heading */}
        <div className="mb-9">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-[#d8bd94]">
            Your personal collection
          </p>

          <div className="flex items-center gap-3">
            <FaHeart className="text-2xl text-[#d8bd94]" />

            <h1 className="text-3xl font-bold sm:text-4xl">
              My <span className="text-[#d8bd94]">Favorites</span>
            </h1>
          </div>

          <p className="mt-3 max-w-xl text-sm leading-6 text-gray-400">
            All your favorite movies and television series,
            collected in one place.
          </p>

          {favoriteItems.length > 0 && (
            <p className="mt-3 text-sm text-gray-500">
              <span className="font-semibold text-[#d8bd94]">
                {favoriteItems.length}
              </span>{" "}
              {favoriteItems.length === 1 ? "title" : "titles"} saved
            </p>
          )}
        </div>

        {/* Favorites Grid */}
        {favoriteItems.length > 0 ? (
          <MovieGrid
            title=""
            items={favoriteItems}
            loading={false}
          />
        ) : (
          /* Empty State */
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-white/5 bg-[#19191f]/60 px-5 text-center">

            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#d8bd94]/10 text-2xl text-[#d8bd94]">
              <FaHeart />
            </div>

            <h2 className="text-xl font-semibold">
              Your collection is empty
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
              You haven't saved any movies or TV series yet.
              Explore CineScope and add your favorite titles
              to find them here.
            </p>

            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#d8bd94] px-6 py-3 text-sm font-bold text-[#101014] transition hover:bg-[#e7cfaa]"
            >
              <FaCompass />
              Explore titles
            </Link>
          </div>
        )}

      </div>
    </main>
  );
}

export default Favorites;
