
import React from "react";
import { FaHeart } from "react-icons/fa";
import { useFavorites } from "../context/FavoritesContext";

function FavoriteButton({ item }) {
  const { toggleFavorite, isFavorite } = useFavorites();

  const active = isFavorite(item.id);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite(item);
      }}
      className={`p-2 rounded-full transition ${
        active
          ? "bg-red-600 text-white"
          : "bg-black/60 text-white hover:bg-red-600"
      }`}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      title={active ? "Remove from favorites" : "Add to favorites"}
    >
      <FaHeart />
    </button>
  );
}

export default FavoriteButton;
