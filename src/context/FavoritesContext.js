
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const FavoritesContext = createContext(null);

const STORAGE_KEY = "cinescope-favorites";

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Could not load favorites:", error);
      return [];
    }
  });

  // Save favorites whenever they change.
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(favorites)
      );
    } catch (error) {
      console.error("Could not save favorites:", error);
    }
  }, [favorites]);

  const isFavorite = (id, type = "movie") => {
    return favorites.some(
      (item) =>
        String(item.id) === String(id) &&
        item.type === type
    );
  };

  const toggleFavorite = (item) => {
    if (!item || !item.id) return;

    const normalizedItem = {
      ...item,
      id: String(item.id),
      type: item.type || "movie",
    };

    setFavorites((previous) => {
      const exists = previous.some(
        (favorite) =>
          String(favorite.id) === normalizedItem.id &&
          favorite.type === normalizedItem.type
      );

      if (exists) {
        return previous.filter(
          (favorite) =>
            !(
              String(favorite.id) === normalizedItem.id &&
              favorite.type === normalizedItem.type
            )
        );
      }

      return [...previous, normalizedItem];
    });
  };

  const removeFavorite = (id, type = "movie") => {
    setFavorites((previous) =>
      previous.filter(
        (item) =>
          !(
            String(item.id) === String(id) &&
            item.type === type
          )
      )
    );
  };

  const clearFavorites = () => {
    setFavorites([]);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        toggleFavorite,
        isFavorite,
        removeFavorite,
        clearFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error(
      "useFavorites must be used inside FavoritesProvider"
    );
  }

  return context;
};
