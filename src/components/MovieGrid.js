
import React from "react";
import MovieCard from "./MovieCard";

function MovieGrid({ title, items, loading, id }) {
  return (
    <section id={id} className="py-10">

      <div className="flex justify-between items-center mb-7">
        <h2 className="text-2xl md:text-3xl font-extrabold">
          {title}
        </h2>

        <span className="text-gray-500 text-sm">
          {items?.length || 0} titles
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index}>
              <div className="aspect-[2/3] rounded-xl bg-card animate-pulse" />
              <div className="h-4 bg-card rounded mt-3 animate-pulse" />
              <div className="h-3 bg-card rounded mt-2 w-2/3 animate-pulse" />
            </div>
          ))}
        </div>
      ) : items?.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {items.map((item) => (
            <MovieCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 py-10 text-center">
          No titles found.
        </p>
      )}
    </section>
  );
}

export default MovieGrid;
