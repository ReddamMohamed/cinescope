
import React from "react";
import { Link } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import FavoriteButton from "./FavoriteButton";

function MovieCard({ item }) {
  return (
    <div className="group min-w-0">

      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-card">

        <Link to={`/details/${item.type}/${item.id}`}>
          {item.image ? (
            <img
              src={item.image}
              alt={item.title}
              loading="lazy"
              className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
              No Poster
            </div>
          )}

          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
            <span className="bg-accent px-5 py-3 rounded-lg font-bold">
              View Details
            </span>
          </div>
        </Link>

        <span className="absolute top-3 left-3 bg-accent px-3 py-1 rounded-md text-xs font-bold uppercase">
          {item.type}
        </span>

        <FavoriteButton
          item={item}
          className="absolute top-3 right-3 w-10 h-10 text-sm"
        />

        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/80 px-2 py-1 rounded-md text-xs">
          <FaStar className="text-yellow-400" />
          {item.rating}
        </div>

      </div>

      <div className="pt-3">
        <Link to={`/details/${item.type}/${item.id}`}>
          <h3 className="font-bold text-white truncate group-hover:text-accent transition">
            {item.title}
          </h3>
        </Link>

        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <span>{item.year}</span>
          <span className="truncate ml-2">
            {item.genres.slice(0, 2).join(" / ") || "Entertainment"}
          </span>
        </div>
      </div>

    </div>
  );
}

export default MovieCard;