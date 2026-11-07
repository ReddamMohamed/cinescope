
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FaHeart,
  FaStar,
  FaArrowLeft,
  FaPlay,
  FaCalendarAlt,
  FaClock,
  FaFilm,
  FaChevronDown,
  FaChevronUp,
  FaExternalLinkAlt,
  FaUser,
  FaGlobe,
  FaImdb,
  FaQuoteLeft,
} from "react-icons/fa";

import {
  getDetails,
  getSimilarTitles,
} from "../api/movieApi";

import { useFavorites } from "../context/FavoritesContext";
import MovieGrid from "../components/MovieGrid";

const IMAGE_BASE = "https://image.tmdb.org/t/p";

// --------------------------------------------------
// IMAGE HELPERS
// --------------------------------------------------

const getImageUrl = (image, size = "w500") => {
  if (!image || typeof image !== "string") return null;

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return `${IMAGE_BASE}/${size}${image.startsWith("/") ? image : `/${image}`}`;
};

// --------------------------------------------------
// PEOPLE AND GENRES
// --------------------------------------------------

const getPersonName = (person) => {
  if (typeof person === "string") return person;

  return person?.name || person?.original_name || "Unknown";
};

const getGenreName = (genre) => {
  if (typeof genre === "string") return genre;

  return genre?.name || "Unknown";
};

// --------------------------------------------------
// TRAILER HELPERS
// --------------------------------------------------

const getYouTubeEmbed = (source) => {
  if (!source || typeof source !== "string") return "";

  let videoId = source.trim();

  try {
    if (
      videoId.includes("youtube.com") ||
      videoId.includes("youtu.be")
    ) {
      const url = new URL(videoId);

      if (url.hostname.includes("youtu.be")) {
        videoId = url.pathname.split("/").filter(Boolean)[0];
      } else if (url.searchParams.get("v")) {
        videoId = url.searchParams.get("v");
      } else if (url.pathname.includes("/embed/")) {
        videoId = url.pathname.split("/embed/")[1].split("/")[0];
      } else if (url.pathname.includes("/shorts/")) {
        videoId = url.pathname.split("/shorts/")[1].split("/")[0];
      } else {
        return "";
      }
    }
  } catch {
    return "";
  }

  if (!videoId || videoId.length < 5) return "";

  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`;
};

// Normalize both TMDB and other API video formats.
const getAvailableTrailers = (item) => {
  if (!item) return [];

  const videos = [
    ...(Array.isArray(item.trailers) ? item.trailers : []),
    ...(Array.isArray(item.videos) ? item.videos : []),
  ];

  const normalized = videos
    .map((video) => {
      if (!video || typeof video !== "object") return null;

      const source =
        video.source ||
        video.key ||
        video.url ||
        video.videoId;

      if (!source) return null;

      const site = String(video.site || "youtube").toLowerCase();

      // The embedded player supports YouTube videos.
      if (
        site !== "youtube" &&
        !String(source).includes("youtube.com") &&
        !String(source).includes("youtu.be")
      ) {
        return null;
      }

      return {
        id: video.id || source,
        source: String(source),
        name: video.name || video.title || "Untitled video",
        type: video.type || "Video",
      };
    })
    .filter(Boolean);

  // Remove duplicates.
  return normalized.filter(
    (video, index, array) =>
      index ===
      array.findIndex((other) => other.source === video.source)
  );
};

// --------------------------------------------------
// REVIEWS
// --------------------------------------------------

const normalizeReview = (review, index) => {
  if (!review || typeof review !== "object") return null;

  return {
    id:
      review.id ||
      review._id ||
      review.url ||
      `review-${index}`,
    author:
      review.author ||
      review.username ||
      review.user?.name ||
      review.user?.username ||
      "Anonymous",
    content:
      review.content ||
      review.comment ||
      review.text ||
      review.body ||
      "",
    rating:
      review.rating ??
      review.score ??
      review.author_details?.rating ??
      null,
    date:
      review.created_at ||
      review.createdAt ||
      review.date ||
      null,
    url: review.url || review.link || null,
  };
};

const formatDate = (date) => {
  if (!date) return null;

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// --------------------------------------------------
// DETAILS COMPONENT
// --------------------------------------------------

const Details = () => {
  const { type, id } = useParams();

  const [item, setItem] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedTrailer, setSelectedTrailer] = useState("");
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [showAllEpisodes, setShowAllEpisodes] = useState(false);

  const { toggleFavorite, isFavorite } = useFavorites();

  const mediaType =
    type === "tv"
      ? "series"
      : type === "anime"
        ? "anime"
        : type;

  // ------------------------------------------------
  // LOAD DETAILS AND SIMILAR TITLES
  // ------------------------------------------------

  useEffect(() => {
    let active = true;

    const loadDetails = async () => {
      setLoading(true);
      setError("");
      setItem(null);
      setSimilar([]);
      setSelectedTrailer("");
      setShowAllEpisodes(false);

      try {
        const details = await getDetails(mediaType, id);

        if (!active) return;

        if (!details) {
          setItem(null);
          setLoading(false);
          return;
        }

        setItem(details);

        // Select the first available YouTube trailer.
        const availableVideos = getAvailableTrailers(details);

        const firstTrailer =
          availableVideos.find(
            (video) =>
              video.type.toLowerCase() === "trailer"
          ) || availableVideos[0];

        if (firstTrailer) {
          setSelectedTrailer(firstTrailer.source);
        }

        // Load similar titles separately.
        try {
          const recommendations = await getSimilarTitles(
            mediaType,
            details
          );

          if (active && Array.isArray(recommendations)) {
            const sameCategory = recommendations.filter((result) => {
              const resultType =
                result.type === "tv" ? "series" : result.type;

              return (
                !resultType ||
                resultType === mediaType
              );
            });

            setSimilar(
              sameCategory.filter(
                (result) => String(result.id) !== String(id)
              )
            );
          }
        } catch (recommendationError) {
          console.error(
            "Similar titles loading error:",
            recommendationError
          );
        }
      } catch (detailsError) {
        console.error("Details loading error:", detailsError);

        if (active) {
          setError(
            detailsError?.message ||
            "Unable to load this title. Please try again."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDetails();

    return () => {
      active = false;
    };
  }, [mediaType, id]);

  // ------------------------------------------------
  // SEASONS AND EPISODES
  // ------------------------------------------------

  const seasons = useMemo(() => {
    if (!Array.isArray(item?.episodes)) return [];

    const grouped = {};

    item.episodes.forEach((episode) => {
      if (!episode || typeof episode !== "object") return;

      const seasonNumber = Number(episode.season || 1);

      if (!grouped[seasonNumber]) {
        grouped[seasonNumber] = [];
      }

      grouped[seasonNumber].push(episode);
    });

    return Object.keys(grouped)
      .map(Number)
      .sort((a, b) => a - b)
      .map((seasonNumber) => ({
        number: seasonNumber,
        episodes: grouped[seasonNumber].sort(
          (a, b) => (a.episode || 0) - (b.episode || 0)
        ),
      }));
  }, [item]);

  useEffect(() => {
    if (seasons.length > 0) {
      setSelectedSeason(seasons[0].number);
    }
  }, [seasons]);

  const currentSeason = seasons.find(
    (season) => season.number === selectedSeason
  );

  const episodes = currentSeason?.episodes || [];

  // ------------------------------------------------
  // TRAILERS
  // IMPORTANT: This useMemo is INSIDE Details.
  // ------------------------------------------------

  const trailers = useMemo(
    () => getAvailableTrailers(item),
    [item]
  );

  const youtubeEmbed = getYouTubeEmbed(selectedTrailer);

  // ------------------------------------------------
  // CAST, CREW, GENRES AND REVIEWS
  // ------------------------------------------------

  const cast = Array.isArray(item?.cast) ? item.cast : [];

  const directors = Array.isArray(item?.directors)
    ? item.directors
    : [];

  const genres = Array.isArray(item?.genres)
    ? item.genres
    : [];

  const reviews = useMemo(() => {
    const source = Array.isArray(item?.reviews)
      ? item.reviews
      : Array.isArray(item?.comments)
        ? item.comments
        : [];

    return source
      .map(normalizeReview)
      .filter((review) => review && review.content);
  }, [item]);

  // ------------------------------------------------
  // FAVORITES
  // ------------------------------------------------

  const favorite = item
    ? isFavorite(item.id, mediaType)
    : false;

  const handleFavorite = () => {
    if (!item) return;

    toggleFavorite({
      ...item,
      type: mediaType,
    });
  };

  // ------------------------------------------------
  // EXTERNAL LINKS
  // ------------------------------------------------

  const imdbUrl = item?.imdbId
    ? `https://www.imdb.com/title/${item.imdbId}/`
    : `https://www.imdb.com/find/?q=${encodeURIComponent(
        item?.title || ""
      )}`;

  // ------------------------------------------------
  // LOADING SCREEN
  // ------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-[#101014] text-white flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#d8bd94]/20 border-t-[#d8bd94] rounded-full animate-spin" />

        <p className="mt-5 text-sm tracking-widest text-gray-400 uppercase">
          Loading CineScope
        </p>
      </div>
    );
  }

  // ------------------------------------------------
  // ERROR SCREEN
  // ------------------------------------------------

  if (!item) {
    return (
      <div className="min-h-screen bg-[#101014] text-white flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 text-[#d8bd94] text-2xl">
          <FaFilm />
        </div>

        <h2 className="text-2xl font-bold mb-3">
          {error ? "Something went wrong" : "Title not found"}
        </h2>

        <p className="text-gray-500 max-w-md mb-7">
          {error || "We couldn't find the title you're looking for."}
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-[#d8bd94] text-[#101014] px-6 py-3 rounded-xl font-bold hover:bg-[#e7cfaa] transition"
        >
          <FaArrowLeft />
          Back to home
        </Link>
      </div>
    );
  }

  // ------------------------------------------------
  // PAGE
  // ------------------------------------------------

  return (
    <main className="min-h-screen bg-[#101014] text-white">

      {/* HERO */}
      <section className="relative isolate overflow-hidden">

        {item.backdrop && (
          <div
            className="absolute inset-0 -z-20 bg-cover bg-center scale-105"
            style={{
              backgroundImage: `url(${
                getImageUrl(item.backdrop, "original") ||
                item.backdrop
              })`,
            }}
          />
        )}

        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#101014] via-[#101014]/95 to-[#101014]/65" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#101014] via-transparent to-[#101014]/40" />

        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-10 pb-16 md:pt-14 md:pb-24">

          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-[#d8bd94] transition mb-12"
          >
            <FaArrowLeft />
            Back to discovery
          </Link>

          <div className="flex flex-col md:flex-row gap-9 lg:gap-14 items-start">

            {/* POSTER */}
            <div className="w-52 sm:w-60 md:w-72 shrink-0 mx-auto md:mx-0">
              {item.poster ? (
                <img
                  src={getImageUrl(item.poster, "w500") || item.poster}
                  alt={item.title}
                  className="w-full rounded-2xl shadow-2xl shadow-black/60 border border-white/10"
                />
              ) : (
                <div className="aspect-[2/3] rounded-2xl bg-white/5 flex items-center justify-center text-5xl text-gray-600">
                  <FaFilm />
                </div>
              )}
            </div>

            {/* INFORMATION */}
            <div className="flex-1 w-full pt-2">

              <div className="flex flex-wrap items-center gap-3 mb-5">
                <span className="rounded-full border border-[#d8bd94]/40 bg-[#d8bd94]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#d8bd94]">
                  {mediaType === "series"
                    ? "TV Series"
                    : mediaType === "anime"
                      ? "Anime"
                      : "Movie"}
                </span>

                {item.status && (
                  <span className="text-xs text-gray-400">
                    {item.status}
                  </span>
                )}
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
                {item.title}
              </h1>

              {item.originalTitle &&
                item.originalTitle !== item.title && (
                  <p className="text-gray-500 mt-2 text-sm">
                    {item.originalTitle}
                  </p>
                )}

              {/* META */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-7 text-sm text-gray-300">

                {item.year && (
                  <span className="flex items-center gap-2">
                    <FaCalendarAlt className="text-[#d8bd94]" />
                    {item.year}
                  </span>
                )}

                {Number(item.rating) > 0 && (
                  <span className="flex items-center gap-2">
                    <FaStar className="text-[#d8bd94]" />
                    <strong className="text-white">
                      {Number(item.rating).toFixed(1)}
                    </strong>
                    <span className="text-gray-500">/ 10</span>
                  </span>
                )}

                {item.runtime && (
                  <span className="flex items-center gap-2">
                    <FaClock className="text-[#d8bd94]" />
                    {typeof item.runtime === "number"
                      ? `${item.runtime} min`
                      : item.runtime}
                  </span>
                )}

                {mediaType === "series" && (
                  <span className="flex items-center gap-2">
                    <FaFilm className="text-[#d8bd94]" />
                    {item.numberOfSeasons || seasons.length || 0} Seasons
                  </span>
                )}

                {item.country && (
                  <span className="flex items-center gap-2">
                    <FaGlobe className="text-[#d8bd94]" />
                    {Array.isArray(item.country)
                      ? item.country.join(", ")
                      : item.country}
                  </span>
                )}
              </div>

              {/* DESCRIPTION */}
              <div className="mt-8 max-w-3xl">
                {item.tagline && (
                  <p className="text-[#d8bd94] italic mb-3">
                    "{item.tagline}"
                  </p>
                )}

                <h2 className="text-xs uppercase tracking-[0.25em] text-gray-500 font-bold mb-3">
                  Overview
                </h2>

                <p className="text-gray-300 leading-8 text-sm sm:text-base">
                  {item.description ||
                    "No description available for this title."}
                </p>
              </div>

              {/* GENRES */}
              {genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-7">
                  {genres.map((genre, index) => (
                    <span
                      key={`${getGenreName(genre)}-${index}`}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-gray-300"
                    >
                      {getGenreName(genre)}
                    </span>
                  ))}
                </div>
              )}

              {/* ACTIONS */}
              <div className="flex flex-wrap gap-3 mt-9">

                <button
                  type="button"
                  onClick={handleFavorite}
                  className={`flex items-center gap-3 rounded-xl px-6 py-3.5 font-semibold transition-all duration-300 ${
                    favorite
                      ? "bg-[#d8bd94] text-[#101014]"
                      : "border border-[#d8bd94]/40 bg-[#d8bd94]/10 text-[#d8bd94] hover:bg-[#d8bd94] hover:text-[#101014]"
                  }`}
                >
                  <FaHeart />
                  {favorite ? "Remove Favorite" : "Add to Favorites"}
                </button>

                {trailers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTrailer(trailers[0].source);

                      document
                        .getElementById("trailers")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 font-semibold text-white hover:bg-white/10 transition"
                  >
                    <FaPlay className="text-[#d8bd94]" />
                    Watch Trailer
                  </button>
                )}

                <a
                  href={imdbUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-5 py-3.5 font-semibold text-white hover:bg-white/10 transition"
                >
                  <FaImdb className="text-[#d8bd94] text-xl" />
                  IMDb
                  <FaExternalLinkAlt className="text-xs text-gray-500" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">

        {/* TRAILERS */}
        {trailers.length > 0 && (
          <section
            id="trailers"
            className="py-14 border-t border-white/10"
          >
            <div className="flex items-end justify-between gap-4 mb-8">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[#d8bd94] font-bold mb-2">
                  Watch now
                </p>

                <h2 className="text-2xl sm:text-3xl font-bold">
                  Trailers & Videos
                </h2>
              </div>

              <span className="text-xs text-gray-500">
                {trailers.length} videos
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* VIDEO PLAYER */}
              <div className="lg:col-span-2">
                <div className="aspect-video rounded-2xl overflow-hidden bg-[#19191f] border border-white/10 shadow-xl">
                  {youtubeEmbed ? (
                    <iframe
                      title={`${item.title} trailer`}
                      src={youtubeEmbed}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      Video unavailable.
                    </div>
                  )}
                </div>
              </div>

              {/* VIDEO LIST */}
              <div className="space-y-3">
                {trailers.map((trailer, index) => (
                  <button
                    type="button"
                    key={`${trailer.source}-${index}`}
                    onClick={() =>
                      setSelectedTrailer(trailer.source)
                    }
                    className={`w-full flex items-center gap-4 rounded-xl border p-4 text-left transition ${
                      selectedTrailer === trailer.source
                        ? "border-[#d8bd94]/60 bg-[#d8bd94]/10"
                        : "border-white/10 bg-[#19191f] hover:border-white/20"
                    }`}
                  >
                    <div className="w-11 h-11 shrink-0 rounded-xl bg-[#d8bd94]/10 flex items-center justify-center text-[#d8bd94]">
                      <FaPlay />
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {trailer.name || `Video ${index + 1}`}
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        {trailer.type}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* NO TRAILERS MESSAGE */}
        {trailers.length === 0 && (
          <section className="py-10 border-t border-white/10">
            <div className="rounded-2xl border border-white/10 bg-[#19191f] p-7">
              <div className="flex items-center gap-3">
                <FaPlay className="text-[#d8bd94]" />
                <div>
                  <h2 className="font-bold">Trailers & Videos</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    No trailers were returned by the API for this title.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CAST AND CREW */}
        {(cast.length > 0 || directors.length > 0) && (
          <section className="py-14 border-t border-white/10">
            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.25em] text-[#d8bd94] font-bold mb-2">
                The people behind it
              </p>

              <h2 className="text-2xl sm:text-3xl font-bold">
                Cast & Crew
              </h2>
            </div>

            {directors.length > 0 && (
              <div className="mb-9">
                <h3 className="text-sm font-semibold text-gray-400 mb-4">
                  Director
                </h3>

                <div className="flex flex-wrap gap-3">
                  {directors.map((person, index) => (
                    <div
                      key={`${getPersonName(person)}-${index}`}
                      className="rounded-xl border border-white/10 bg-[#19191f] px-5 py-4"
                    >
                      <p className="font-semibold">
                        {getPersonName(person)}
                      </p>

                      {person?.job && (
                        <p className="text-xs text-gray-500 mt-1">
                          {person.job}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cast.length > 0 && (
              <>
                <h3 className="text-sm font-semibold text-gray-400 mb-4">
                  Main Cast
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
                  {cast.map((person, index) => {
                    const name = getPersonName(person);
                    const profile = getImageUrl(
                      person?.profile,
                      "w185"
                    );

                    return (
                      <div
                        key={person?.id || `${name}-${index}`}
                        className="group overflow-hidden rounded-xl border border-white/10 bg-[#19191f] hover:border-[#d8bd94]/50 transition"
                      >
                        <div className="aspect-[3/4] bg-[#222229] overflow-hidden flex items-center justify-center">
                          {profile ? (
                            <img
                              src={profile}
                              alt={name}
                              loading="lazy"
                              className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <FaUser className="text-4xl text-gray-600" />
                          )}
                        </div>

                        <div className="p-3">
                          <p className="font-semibold text-sm line-clamp-2">
                            {name}
                          </p>

                          {person?.character && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {person.character}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        )}

        {/* EPISODES */}
        {mediaType === "series" && (
          <section className="py-14 border-t border-white/10">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[#d8bd94] font-bold mb-2">
                  Explore the story
                </p>

                <h2 className="text-2xl sm:text-3xl font-bold">
                  Episodes
                </h2>

                <p className="text-sm text-gray-500 mt-2">
                  Explore the seasons and episodes.
                </p>
              </div>

              {seasons.length > 0 && (
                <select
                  value={selectedSeason}
                  onChange={(event) => {
                    setSelectedSeason(Number(event.target.value));
                    setShowAllEpisodes(false);
                  }}
                  className="rounded-xl border border-white/10 bg-[#19191f] px-5 py-3 text-sm text-white outline-none focus:border-[#d8bd94]"
                >
                  {seasons.map((season) => (
                    <option
                      key={season.number}
                      value={season.number}
                    >
                      Season {season.number}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {episodes.length > 0 ? (
              <div className="space-y-4">
                {(showAllEpisodes
                  ? episodes
                  : episodes.slice(0, 8)
                ).map((episode, index) => (
                  <div
                    key={episode.id || index}
                    className="flex flex-col sm:flex-row gap-5 rounded-2xl border border-white/10 bg-[#19191f] p-4 hover:border-[#d8bd94]/30 transition"
                  >
                    {episode.thumbnail && (
                      <img
                        src={
                          getImageUrl(episode.thumbnail, "w500") ||
                          episode.thumbnail
                        }
                        alt={episode.title || "Episode"}
                        loading="lazy"
                        className="w-full sm:w-56 aspect-video object-cover rounded-xl"
                      />
                    )}

                    <div className="flex-1 py-1">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="font-bold text-lg">
                          {episode.episode
                            ? `Episode ${episode.episode}: `
                            : ""}
                          {episode.title || "Untitled Episode"}
                        </h3>

                        {Number(episode.rating) > 0 && (
                          <span className="flex items-center gap-2 text-[#d8bd94] text-sm">
                            <FaStar />
                            {episode.rating}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mt-2">
                        {formatDate(episode.released) ||
                          "Release date unavailable"}
                        {episode.runtime
                          ? ` • ${episode.runtime} min`
                          : ""}
                      </p>

                      <p className="text-sm text-gray-400 leading-7 mt-4">
                        {episode.overview ||
                          "No episode description available."}
                      </p>
                    </div>
                  </div>
                ))}

                {episodes.length > 8 && (
                  <button
                    type="button"
                    onClick={() =>
                      setShowAllEpisodes(!showAllEpisodes)
                    }
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#d8bd94] hover:text-white transition"
                  >
                    {showAllEpisodes ? (
                      <>
                        Show fewer episodes <FaChevronUp />
                      </>
                    ) : (
                      <>
                        Show all {episodes.length} episodes{" "}
                        <FaChevronDown />
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-[#19191f] p-8 text-center">
                <FaFilm className="mx-auto text-3xl text-gray-600 mb-4" />

                <p className="text-gray-400">
                  Episode information is not available.
                </p>
              </div>
            )}
          </section>
        )}

        {/* RATINGS AND REVIEWS */}
        <section className="py-14 border-t border-white/10">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.25em] text-[#d8bd94] font-bold mb-2">
              Community feedback
            </p>

            <h2 className="text-2xl sm:text-3xl font-bold">
              Ratings & Reviews
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* RATING CARD */}
            <div className="rounded-2xl border border-white/10 bg-[#19191f] p-7">
              <p className="text-sm text-gray-400 mb-5">
                Overall rating
              </p>

              <div className="flex items-center gap-3">
                <FaStar className="text-3xl text-[#d8bd94]" />

                <span className="text-4xl font-bold">
                  {Number(item.rating) > 0
                    ? Number(item.rating).toFixed(1)
                    : "N/A"}
                </span>

                <span className="text-gray-500 text-sm">/ 10</span>
              </div>

              {item.voteCount > 0 && (
                <p className="text-xs text-gray-500 mt-4">
                  Based on{" "}
                  {Number(item.voteCount).toLocaleString()} votes
                </p>
              )}

              <div className="h-1.5 rounded-full bg-white/10 mt-6 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#d8bd94]"
                  style={{
                    width: `${Math.min(
                      Math.max(Number(item.rating) * 10 || 0, 0),
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* REVIEWS SUMMARY */}
            <div className="md:col-span-2 rounded-2xl border border-white/10 bg-[#19191f] p-7">
              <div className="flex items-center justify-between gap-3 mb-5">
                <h3 className="font-bold text-lg">
                  User Reviews
                </h3>

                <span className="text-xs text-gray-500">
                  {reviews.length} available
                </span>
              </div>

              {reviews.length > 0 ? (
                <p className="text-sm text-gray-400 leading-7">
                  There are {reviews.length} written reviews available
                  for this title. Read what viewers have said below.
                </p>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 shrink-0 rounded-xl bg-[#d8bd94]/10 flex items-center justify-center text-[#d8bd94]">
                    <FaQuoteLeft />
                  </div>

                  <div>
                    <p className="font-semibold mb-2">
                      No written reviews available
                    </p>

                    <p className="text-sm text-gray-500 leading-6">
                      We couldn't find any written comments in the
                      information returned by the API. You can still
                      check the community reviews on IMDb.
                    </p>
                  </div>
                </div>
              )}

              <a
                href={imdbUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-[#d8bd94] hover:text-white transition"
              >
                Read more on IMDb
                <FaExternalLinkAlt className="text-xs" />
              </a>
            </div>
          </div>

          {/* REVIEW CARDS */}
          {reviews.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-7">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-2xl border border-white/10 bg-[#19191f] p-6"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-semibold">
                        {review.author}
                      </h3>

                      {review.date && (
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(review.date)}
                        </p>
                      )}
                    </div>

                    {review.rating !== null &&
                      review.rating !== undefined && (
                        <span className="shrink-0 flex items-center gap-2 rounded-lg bg-[#d8bd94]/10 px-3 py-2 text-sm text-[#d8bd94]">
                          <FaStar />
                          {review.rating}
                        </span>
                      )}
                  </div>

                  <p className="text-sm text-gray-400 leading-7 whitespace-pre-line">
                    {review.content}
                  </p>

                  {review.url && (
                    <a
                      href={review.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 mt-5 text-xs font-semibold text-[#d8bd94] hover:text-white"
                    >
                      Original review <FaExternalLinkAlt />
                    </a>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* SIMILAR TITLES */}
        <section className="py-14 border-t border-white/10">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#d8bd94] font-bold mb-2">
                Keep discovering
              </p>

              <h2 className="text-2xl sm:text-3xl font-bold">
                More Like This
              </h2>

              <p className="text-sm text-gray-500 mt-2">
                {mediaType === "anime"
                  ? "More anime you might enjoy."
                  : mediaType === "series"
                    ? "More TV series you might enjoy."
                    : "More movies you might enjoy."}
              </p>
            </div>

            <span className="rounded-full border border-[#d8bd94]/30 bg-[#d8bd94]/5 px-4 py-2 text-xs text-[#d8bd94]">
              {mediaType === "anime"
                ? "Anime"
                : mediaType === "series"
                  ? "TV Series"
                  : "Movies"}
            </span>
          </div>

          {similar.length > 0 ? (
            <MovieGrid
              title=""
              items={similar}
              loading={false}
            />
          ) : (
            <div className="rounded-2xl border border-white/10 bg-[#19191f] p-8 text-center">
              <FaFilm className="mx-auto text-3xl text-gray-600 mb-4" />

              <p className="text-gray-400">
                No similar titles are available right now.
              </p>
            </div>
          )}
        </section>
      </div>

      <div className="h-10" />
    </main>
  );
};

export default Details;
