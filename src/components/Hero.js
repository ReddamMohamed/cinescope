
import React from "react";
import { FaPlay, FaInfoCircle } from "react-icons/fa";

function Hero({ show }) {
  if (!show) return null;

  const background =
    show.image?.replace("/original/", "/original/") || "";

  return (
    <section className="relative min-h-[550px] md:min-h-[650px] flex items-center overflow-hidden">

      {background && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${background})` }}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-dark via-dark/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-dark/20" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pt-28">

        <span className="inline-block bg-accent text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
          Discover something amazing
        </span>

        <h1 className="text-5xl md:text-7xl font-black max-w-3xl leading-tight mb-6">
          Your Next Favorite
          <span className="text-accent"> Story.</span>
        </h1>

        <p className="text-gray-300 text-base md:text-lg max-w-xl leading-relaxed mb-8">
          Explore movies and TV shows, discover incredible stories,
          and find your next entertainment obsession.
        </p>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={() =>
              document.getElementById("discover")?.scrollIntoView({
                behavior: "smooth",
              })
            }
            className="bg-accent hover:bg-red-700 px-7 py-4 rounded-lg flex items-center gap-3 font-bold transition"
          >
            <FaPlay />
            Explore Now
          </button>

          <button
            onClick={() =>
              document.getElementById("series")?.scrollIntoView({
                behavior: "smooth",
              })
            }
            className="bg-white/10 hover:bg-white/20 backdrop-blur-md px-7 py-4 rounded-lg flex items-center gap-3 font-bold transition"
          >
            <FaInfoCircle />
            Discover Series
          </button>
        </div>
      </div>
    </section>
  );
}

export default Hero;
