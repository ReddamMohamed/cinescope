
import axios from "axios";

/* =========================================================
   CONFIGURATION
========================================================= */

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p";
const REACT_APP_TMDB_API_KEY = "8361adaabc96968c984eaf7256060db7";
const REACT_APP_TMDB_ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4MzYxYWRhYWJjOTY5NjhjOTg0ZWFmNzI1NjA2MGRiNyIsIm5iZiI6MTc5Mzk0MDYxMi43ODQ5OTk4LCJzdWIiOiI2YWVkNWM4NDRkYmQ2OGQ2YjgzZDA5MDMiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.WKwWJ3Slx3WWGWxkorgRNpBD9E6cM-NPHs0y4BQYhWI";

const TMDB_ACCESS_TOKEN = (
  process.env.REACT_APP_TMDB_ACCESS_TOKEN || "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4MzYxYWRhYWJjOTY5NjhjOTg0ZWFmNzI1NjA2MGRiNyIsIm5iZiI6MTc5Mzk0MDYxMi43ODQ5OTk4LCJzdWIiOiI2YWVkNWM4NDRkYmQ2OGQ2YjgzZDA5MDMiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.WKwWJ3Slx3WWGWxkorgRNpBD9E6cM-NPHs0y4BQYhWI"
).trim();

const TMDB_API_KEY = (
  process.env.REACT_APP_TMDB_API_KEY || "8361adaabc96968c984eaf7256060db7"
).trim();

const ANILIST_URL =
  process.env.REACT_APP_ANILIST_API_URL ||
  "https://graphql.anilist.co";

const JIKAN_URL =
  process.env.REACT_APP_JIKAN_API_URL ||
  "https://api.jikan.moe/v4";

const TMDB_LANGUAGE = "en-US";

const movieGenres = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

const tvGenres = {
  10759: "Action & Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  10762: "Kids",
  9648: "Mystery",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
  37: "Western",
};

/* =========================================================
   AXIOS CLIENTS
========================================================= */

const tmdbClient = axios.create({
  baseURL: TMDB_BASE_URL,
  timeout: 20000,
});

tmdbClient.interceptors.request.use((config) => {
  if (TMDB_ACCESS_TOKEN) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${TMDB_ACCESS_TOKEN}`;
  } else if (TMDB_API_KEY) {
    config.params = {
      ...config.params,
      api_key: TMDB_API_KEY,
    };
  } else {
    throw new Error(
      "TMDB credentials are missing. Check your .env file."
    );
  }

  return config;
});

const anilistClient = axios.create({
  baseURL: ANILIST_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const jikanClient = axios.create({
  baseURL: JIKAN_URL,
  timeout: 20000,
});

/* =========================================================
   ERROR HANDLING
========================================================= */

export function getApiError(error) {
  if (error.response) {
    const status = error.response.status;
    const message =
      error.response.data?.status_message ||
      error.response.data?.message ||
      error.message;

    return `API error ${status}: ${message}`;
  }

  if (error.request) {
    return "No response from the server. Check your internet connection.";
  }

  return error.message || "An unexpected API error occurred.";
}

export function reportError(error, context = "API") {
  console.error(`[CineScope ${context}]`, getApiError(error));
}

async function tmdbGet(path, params = {}) {
  const response = await tmdbClient.get(path, {
    params: {
      language: TMDB_LANGUAGE,
      ...params,
    },
  });

  return response.data;
}

async function anilistPost(query, variables = {}) {
  const response = await anilistClient.post("", {
    query,
    variables,
  });

  if (response.data.errors?.length) {
    throw new Error(
      response.data.errors[0].message ||
      "AniList request failed."
    );
  }

  return response.data.data;
}

async function jikanGet(path, params = {}) {
  const response = await jikanClient.get(path, { params });
  return response.data;
}

/* =========================================================
   IMAGE HELPERS
========================================================= */

export function getTMDBImage(path, size = "w500") {
  if (!path) return null;

  if (path.startsWith("http")) return path;

  return `${TMDB_IMAGE_URL}/${size}${path}`;
}

export function getPoster(path) {
  return getTMDBImage(path, "w500");
}

export function getBackdrop(path) {
  return getTMDBImage(path, "w1280");
}

export function getProfileImage(path) {
  return getTMDBImage(path, "w185");
}

/* =========================================================
   GENRE HELPERS
========================================================= */

function normalizeGenres(item, type) {
  if (Array.isArray(item.genres) && item.genres.length) {
    return item.genres.map((genre) => {
      if (typeof genre === "string") return genre;
      return genre.name;
    }).filter(Boolean);
  }

  const genreMap = type === "series" ? tvGenres : movieGenres;

  return (item.genre_ids || [])
    .map((id) => genreMap[id])
    .filter(Boolean);
}

/* =========================================================
   NORMALIZE MOVIES AND TV SERIES
========================================================= */

export function normalizeTMDBItem(item, forcedType) {
  if (!item) return null;

  const type =
    forcedType ||
    (item.media_type === "tv" ? "series" : "movie");

  const title =
    item.title ||
    item.name ||
    item.original_title ||
    item.original_name ||
    "Untitled";

  const releaseDate =
    item.release_date ||
    item.first_air_date ||
    item.last_air_date ||
    "";

  const year = releaseDate
    ? releaseDate.substring(0, 4)
    : "N/A";

  return {
    id: item.id,
    tmdbId: item.id,
    type,
    mediaType: type === "series" ? "tv" : "movie",

    title,
    originalTitle:
      item.original_title ||
      item.original_name ||
      title,

    poster: getPoster(item.poster_path),
    backdrop: getBackdrop(item.backdrop_path),

    description:
      item.overview ||
      item.tagline ||
      "No description available.",

    tagline: item.tagline || "",
    year,
    releaseDate,
    releaseInfo: releaseDate,
    released: Boolean(releaseDate),

    rating: Number(item.vote_average || 0),
    voteCount: Number(item.vote_count || 0),
    popularity: Number(item.popularity || 0),

    genres: normalizeGenres(item, type),

    runtime:
      item.runtime ||
      item.episode_run_time?.[0] ||
      null,

    numberOfSeasons: item.number_of_seasons || 0,
    numberOfEpisodes: item.number_of_episodes || 0,

    status: item.status || "",
    country:
      item.origin_country?.[0] ||
      item.production_countries?.[0]?.name ||
      "",

    language: item.original_language || "",
    adult: Boolean(item.adult),

    cast: [],
    directors: [],
    writers: [],
    trailers: [],
    videos: [],

    seasons: [],
    episodes: [],

    recommendations: [],
    similar: [],

    homepage: item.homepage || "",
    imdbId: item.imdb_id || "",
  };
}

function normalizePeople(credits = {}) {
  const cast = (credits.cast || []).slice(0, 15).map((person) => ({
    id: person.id,
    name: person.name,
    character: person.character || "",
    profile: getProfileImage(person.profile_path),
  }));

  const crew = credits.crew || [];

  const directors = crew
    .filter((person) =>
      person.job === "Director" ||
      person.department === "Directing"
    )
    .slice(0, 8)
    .map((person) => ({
      id: person.id,
      name: person.name,
      job: person.job,
    }));

  const writers = crew
    .filter((person) =>
      ["Writer", "Screenplay", "Story", "Teleplay"].includes(
        person.job
      )
    )
    .slice(0, 8)
    .map((person) => ({
      id: person.id,
      name: person.name,
      job: person.job,
    }));

  return { cast, directors, writers };
}

function normalizeVideos(videos = []) {
  return videos
    .filter(
      (video) =>
        video.site === "YouTube" &&
        video.key
    )
    .map((video) => ({
      id: video.id,
      name: video.name,
      key: video.key,
      site: video.site,
      type: video.type,
      official: video.official,
      url: `https://www.youtube.com/watch?v=${video.key}`,
      embedUrl: `https://www.youtube.com/embed/${video.key}`,
      thumbnail: `https://img.youtube.com/vi/${video.key}/hqdefault.jpg`,
    }));
}

/* =========================================================
   MOVIE CATALOG
========================================================= */

async function getMovieCatalog(endpoint, page = 1) {
  const data = await tmdbGet(`/movie/${endpoint}`, {
    page,
  });

  return (data.results || [])
    .map((item) => normalizeTMDBItem(item, "movie"))
    .filter(Boolean);
}

export async function getMovies(page = 1) {
  return getMovieCatalog("popular", page);
}

export async function getPopularMovies(page = 1) {
  return getMovieCatalog("popular", page);
}

export async function getTopRatedMovies(page = 1) {
  return getMovieCatalog("top_rated", page);
}

export async function getNowPlayingMovies(page = 1) {
  return getMovieCatalog("now_playing", page);
}

export async function getUpcomingMovies(page = 1) {
  return getMovieCatalog("upcoming", page);
}

/* =========================================================
   TV SERIES CATALOG
========================================================= */

async function getTVcatalog(endpoint, page = 1) {
  const data = await tmdbGet(`/tv/${endpoint}`, {
    page,
  });

  return (data.results || [])
    .map((item) => normalizeTMDBItem(item, "series"))
    .filter(Boolean);
}

export async function getShows(page = 1) {
  return getTVcatalog("popular", page);
}

export async function getPopularShows(page = 1) {
  return getTVcatalog("popular", page);
}

export async function getTopRatedShows(page = 1) {
  return getTVcatalog("top_rated", page);
}

export async function getAiringTodayShows(page = 1) {
  return getTVcatalog("airing_today", page);
}

export async function getOnTheAirShows(page = 1) {
  return getTVcatalog("on_the_air", page);
}

/* =========================================================
   GENERAL CATALOG
========================================================= */

export async function getCatalog(type = "movie", page = 1) {
  if (type === "series" || type === "tv") {
    return getPopularShows(page);
  }

  if (type === "anime") {
    return getAnime(page);
  }

  return getPopularMovies(page);
}

/* =========================================================
   MOVIE DETAILS
========================================================= */

export async function getMovieDetails(id) {
  const data = await tmdbGet(`/movie/${id}`, {
    append_to_response:
      "credits,videos,recommendations,similar,external_ids",
  });

  const item = normalizeTMDBItem(data, "movie");
  const people = normalizePeople(data.credits);

  const recommendations = (
    data.recommendations?.results || []
  )
    .map((result) => normalizeTMDBItem(result, "movie"))
    .filter(Boolean);

  const similar = (data.similar?.results || [])
    .map((result) => normalizeTMDBItem(result, "movie"))
    .filter(Boolean);

  const videos = normalizeVideos(data.videos?.results);

  return {
    ...item,
    ...people,
    videos,
    trailers: videos.filter(
      (video) =>
        video.type === "Trailer" ||
        video.type === "Teaser"
    ),
    recommendations,
    similar,
    imdbId: data.external_ids?.imdb_id || data.imdb_id || "",
    budget: data.budget || 0,
    revenue: data.revenue || 0,
    productionCompanies:
      (data.production_companies || []).map(
        (company) => company.name
      ),
    productionCountries:
      (data.production_countries || []).map(
        (country) => country.name
      ),
  };
}

/* =========================================================
   TV SERIES DETAILS
========================================================= */

function normalizeSeason(season) {
  return {
    id: season.id,
    seasonNumber: season.season_number,
    name: season.name,
    overview: season.overview || "",
    poster: getPoster(season.poster_path),
    airDate: season.air_date || "",
    episodeCount: season.episode_count || 0,
    rating: Number(season.vote_average || 0),
  };
}

function normalizeEpisode(episode) {
  return {
    id: episode.id,
    name: episode.name,
    title: episode.name,
    episodeNumber: episode.episode_number,
    seasonNumber: episode.season_number,
    overview: episode.overview || "",
    still: getTMDBImage(episode.still_path, "w500"),
    airDate: episode.air_date || "",
    runtime: episode.runtime || null,
    rating: Number(episode.vote_average || 0),
    voteCount: Number(episode.vote_count || 0),
  };
}

export async function getSeriesDetails(id) {
  const data = await tmdbGet(`/tv/${id}`, {
    append_to_response:
      "credits,videos,recommendations,similar,external_ids",
  });

  const item = normalizeTMDBItem(data, "series");
  const people = normalizePeople(data.credits);

  const seasons = (data.seasons || [])
    .map(normalizeSeason);

  const recommendations = (
    data.recommendations?.results || []
  )
    .map((result) => normalizeTMDBItem(result, "series"))
    .filter(Boolean);

  const similar = (data.similar?.results || [])
    .map((result) => normalizeTMDBItem(result, "series"))
    .filter(Boolean);

  const videos = normalizeVideos(data.videos?.results);

  return {
    ...item,
    ...people,
    seasons,
    videos,
    trailers: videos.filter(
      (video) =>
        video.type === "Trailer" ||
        video.type === "Teaser"
    ),
    recommendations,
    similar,
    imdbId: data.external_ids?.imdb_id || "",
    networks: (data.networks || []).map(
      (network) => network.name
    ),
    createdBy: (data.created_by || []).map(
      (person) => person.name
    ),
    productionCompanies:
      (data.production_companies || []).map(
        (company) => company.name
      ),
  };
}

/* =========================================================
   SEASON AND EPISODE DETAILS
========================================================= */

export async function getSeasonDetails(
  seriesId,
  seasonNumber
) {
  const data = await tmdbGet(
    `/tv/${seriesId}/season/${seasonNumber}`
  );

  return {
    id: data.id,
    name: data.name,
    seasonNumber: data.season_number,
    overview: data.overview || "",
    poster: getPoster(data.poster_path),
    airDate: data.air_date || "",
    episodes: (data.episodes || []).map(normalizeEpisode),
  };
}

export async function getEpisodeDetails(
  seriesId,
  seasonNumber,
  episodeNumber
) {
  const data = await tmdbGet(
    `/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}`,
    {
      append_to_response: "credits,videos,external_ids",
    }
  );

  const videos = normalizeVideos(data.videos?.results);

  return {
    ...normalizeEpisode(data),
    videos,
    trailers: videos.filter(
      (video) => video.type === "Trailer"
    ),
    cast: (data.credits?.cast || []).map((person) => ({
      id: person.id,
      name: person.name,
      character: person.character || "",
      profile: getProfileImage(person.profile_path),
    })),
    crew: (data.credits?.crew || []).map((person) => ({
      id: person.id,
      name: person.name,
      job: person.job,
    })),
  };
}

/* =========================================================
   ANILIST - ANIME
========================================================= */

function normalizeAnime(item) {
  if (!item) return null;

  const title =
    item.title?.english ||
    item.title?.romaji ||
    item.title?.native ||
    "Untitled";

  const cover =
    item.coverImage?.extraLarge ||
    item.coverImage?.large ||
    item.coverImage?.medium ||
    null;

  const banner =
    item.bannerImage ||
    cover;

  return {
    id: item.id,
    malId: item.idMal || null,
    type: "anime",
    mediaType: "anime",

    title,
    originalTitle:
      item.title?.romaji ||
      item.title?.native ||
      title,

    poster: cover,
    backdrop: banner,

    description:
      item.description
        ?.replace(/<br\s*\/?>/gi, " ")
        ?.replace(/<[^>]*>/g, "") ||
      "No description available.",

    year:
      item.startDate?.year
        ? String(item.startDate.year)
        : "N/A",

    releaseDate: [
      item.startDate?.year,
      item.startDate?.month,
      item.startDate?.day,
    ]
      .filter(Boolean)
      .join("-"),

    rating: Number(item.averageScore || 0) / 10,
    voteCount: 0,

    genres: item.genres || [],

    episodes: item.episodes || 0,
    duration: item.duration || null,

    status: item.status || "",
    season: item.season || "",
    seasonYear: item.seasonYear || null,

    studios:
      item.studios?.nodes?.map((studio) => studio.name) || [],

    format: item.format || "",
    country: item.countryOfOrigin || "JP",

    cast: [],
    directors: [],
    writers: [],
    trailers: [],
    videos: [],

    recommendations: [],
    similar: [],

    popularity: item.popularity || 0,
    favourites: item.favourites || 0,

    nextAiringEpisode: item.nextAiringEpisode || null,
    externalLinks: item.externalLinks || [],
  };
}

const ANIME_FIELDS = `
  id
  idMal
  title {
    romaji
    english
    native
  }
  description
  coverImage {
    extraLarge
    large
    medium
  }
  bannerImage
  averageScore
  popularity
  favourites
  episodes
  duration
  status
  season
  seasonYear
  format
  countryOfOrigin
  genres
  startDate {
    year
    month
    day
  }
  studios {
    nodes {
      name
    }
  }
`;

const ANIME_LIST_QUERY = `
  query (
    $page: Int
    $perPage: Int
    $sort: [MediaSort]
    $type: MediaType
  ) {
    Page(page: $page, perPage: $perPage) {
      media(
        type: $type
        sort: $sort
        isAdult: false
      ) {
        ${ANIME_FIELDS}
      }
    }
  }
`;

async function getAnimeBySort(
  sort,
  page = 1,
  perPage = 20
) {
  const data = await anilistPost(ANIME_LIST_QUERY, {
    page,
    perPage,
    sort,
    type: "ANIME",
  });

  return (data.Page?.media || [])
    .map(normalizeAnime)
    .filter(Boolean);
}

export async function getAnime(page = 1) {
  return getAnimeBySort(
    ["POPULARITY_DESC"],
    page
  );
}

export async function getTrendingAnime(page = 1) {
  return getAnimeBySort(
    ["TRENDING_DESC", "POPULARITY_DESC"],
    page
  );
}

export async function getPopularAnime(page = 1) {
  return getAnimeBySort(
    ["POPULARITY_DESC"],
    page
  );
}

export async function getTopRatedAnime(page = 1) {
  return getAnimeBySort(
    ["SCORE_DESC"],
    page
  );
}

/* =========================================================
   ANIME DETAILS
========================================================= */

const ANIME_DETAILS_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      ${ANIME_FIELDS}

      nextAiringEpisode {
        airingAt
        timeUntilAiring
        episode
      }

      trailer {
        id
        site
        thumbnail
      }

      externalLinks {
        site
        url
      }

      characters(sort: ROLE, perPage: 12) {
        edges {
          role
          node {
            id
            name {
              full
            }
            image {
              large
            }
          }
          voiceActors(language: JAPANESE, sort: RELEVANCE) {
            id
            name {
              full
            }
            image {
              large
            }
          }
        }
      }

      recommendations(sort: RATING_DESC, perPage: 10) {
        nodes {
          mediaRecommendation {
            ${ANIME_FIELDS}
          }
        }
      }

      relations {
        edges {
          relationType
          node {
            id
            title {
              romaji
              english
            }
            coverImage {
              large
            }
            type
            format
          }
        }
      }
    }
  }
`;

export async function getAnimeDetails(id) {
  const data = await anilistPost(
    ANIME_DETAILS_QUERY,
    { id: Number(id) }
  );

  const anime = data.Media;

  if (!anime) {
    throw new Error("Anime was not found.");
  }

  const normalized = normalizeAnime(anime);

  const characters =
    anime.characters?.edges?.map((edge) => ({
      id: edge.node.id,
      name: edge.node.name.full,
      role: edge.role,
      image: edge.node.image.large,
      voiceActors: edge.voiceActors.map((actor) => ({
        id: actor.id,
        name: actor.name.full,
        image: actor.image.large,
      })),
    })) || [];

  const recommendations =
    anime.recommendations?.nodes
      ?.map((node) =>
        normalizeAnime(node.mediaRecommendation)
      )
      .filter(Boolean) || [];

  const relations =
    anime.relations?.edges?.map((edge) => ({
      id: edge.node.id,
      title:
        edge.node.title?.english ||
        edge.node.title?.romaji ||
        "Untitled",
      type: edge.node.type,
      format: edge.node.format,
      relation: edge.relationType,
      poster: edge.node.coverImage?.large || null,
    })) || [];

  let episodes = [];

  if (anime.idMal) {
    try {
      episodes = await getAnimeEpisodes(anime.idMal);
    } catch (error) {
      reportError(error, "Jikan episodes");
    }
  }

  const trailer = anime.trailer?.id
    ? {
        key: anime.trailer.id,
        site: anime.trailer.site,
        thumbnail: anime.trailer.thumbnail,
        url:
          anime.trailer.site === "youtube"
            ? `https://www.youtube.com/watch?v=${anime.trailer.id}`
            : "",
      }
    : null;

  return {
    ...normalized,
    characters,
    recommendations,
    relations,
    episodes,
    trailer,
    trailers: trailer ? [trailer] : [],
    externalLinks: anime.externalLinks || [],
    nextAiringEpisode: anime.nextAiringEpisode || null,
  };
}

/* =========================================================
   JIKAN - ANIME EPISODES
========================================================= */

export async function getAnimeEpisodes(
  malId,
  page = 1
) {
  const data = await jikanGet(
    `/anime/${malId}/episodes`,
    { page }
  );

  return (data.data || []).map((episode) => ({
    id: episode.mal_id,
    title: episode.title || episode.title_japanese || "Episode",
    titleJapanese: episode.title_japanese || "",
    titleRomanji: episode.title_romanji || "",
    episodeNumber: episode.mal_id,
    aired: episode.aired || "",
    score: episode.score || null,
    filler: Boolean(episode.filler),
    recap: Boolean(episode.recap),
    url: episode.url || "",
  }));
}

/* =========================================================
   SEARCH - MOVIES AND TV
========================================================= */

async function searchTMDB(endpoint, query, page = 1) {
  if (!query || !query.trim()) return [];

  const data = await tmdbGet(endpoint, {
    query: query.trim(),
    page,
    include_adult: false,
  });

  return (data.results || [])
    .map((item) =>
      normalizeTMDBItem(
        item,
        endpoint.includes("/tv") ? "series" : "movie"
      )
    )
    .filter(Boolean);
}

export async function searchMovies(query, page = 1) {
  return searchTMDB("/search/movie", query, page);
}

export async function searchShows(query, page = 1) {
  return searchTMDB("/search/tv", query, page);
}

/* =========================================================
   SEARCH - ANIME
========================================================= */

const ANIME_SEARCH_QUERY = `
  query ($search: String, $page: Int) {
    Page(page: $page, perPage: 20) {
      media(
        search: $search
        type: ANIME
        isAdult: false
        sort: SEARCH_MATCH
      ) {
        ${ANIME_FIELDS}
      }
    }
  }
`;

export async function searchAnime(query, page = 1) {
  if (!query || !query.trim()) return [];

  const data = await anilistPost(
    ANIME_SEARCH_QUERY,
    {
      search: query.trim(),
      page,
    }
  );

  return (data.Page?.media || [])
    .map(normalizeAnime)
    .filter(Boolean);
}

export async function searchTitles(query) {
  if (!query || !query.trim()) return [];

  const results = await Promise.allSettled([
    searchMovies(query),
    searchShows(query),
    searchAnime(query),
  ]);

  return results.flatMap((result) =>
    result.status === "fulfilled"
      ? result.value
      : []
  );
}

/* =========================================================
   SIMILAR TITLES
========================================================= */

export async function getSimilarTitles(type, id) {
  if (type === "anime") {
    const details = await getAnimeDetails(id);
    return details.recommendations || [];
  }

  const mediaType =
    type === "series" || type === "tv"
      ? "tv"
      : "movie";

  const data = await tmdbGet(
    `/${mediaType}/${id}/similar`
  );

  return (data.results || [])
    .map((item) =>
      normalizeTMDBItem(
        item,
        mediaType === "tv" ? "series" : "movie"
      )
    )
    .filter(Boolean);
}

/* =========================================================
   UNIVERSAL DETAILS FUNCTION
========================================================= */

export async function getDetails(type, id) {
  if (type === "anime") {
    return getAnimeDetails(id);
  }

  if (type === "series" || type === "tv") {
    return getSeriesDetails(id);
  }

  if (type === "movie") {
    return getMovieDetails(id);
  }

  throw new Error(`Unsupported content type: ${type}`);
}

/* =========================================================
   CONNECTION TEST
========================================================= */

export async function testTMDBConnection() {
  const data = await tmdbGet("/configuration");

  return {
    connected: Boolean(data?.images?.secure_base_url),
    imageBaseUrl: data?.images?.secure_base_url || null,
  };
}