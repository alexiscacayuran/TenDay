import React, { useState, useEffect } from "react";
import { IconButton } from "@mui/joy";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faCircleCheck,
  faTrash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Dexie from "dexie";
import { motion } from "framer-motion";
import { useLiveQuery } from "dexie-react-hooks";

export const db = new Dexie("FavoriteLocationsDB");

db.version(1).stores({
  favorites: "++id, municity, province", // '++id' is an auto-incremented primary key
});

const MotionIconButton = motion(IconButton);
const MotionIcon = motion(FontAwesomeIcon);

const Favorites = ({ location, setOpenSnackbar, setSnackbarContent }) => {
  const [favoriteId, setFavoriteId] = useState(null);

  // Live query for matching favorite
  const existing = useLiveQuery(async () => {
    if (!location) return null;
    return await db.favorites
      .where({
        municity: location.municity,
        province: location.province,
      })
      .first();
  }, [location]);

  useEffect(() => {
    if (existing) {
      setFavoriteId(existing.id);
    } else {
      setFavoriteId(null);
    }
  }, [existing]);

  const isFavorite = !!favoriteId;

  const toggleFavorite = async () => {
    if (isFavorite) {
      await db.favorites.delete(favoriteId);
    } else {
      const total = await db.favorites.count();

      if (total >= 5) {
        const oldest = await db.favorites.orderBy("id").first();
        if (oldest) {
          await db.favorites.delete(oldest.id);
        }
      }

      await db.favorites.add(location);
      setSnackbarContent({
        message: "Location has been added to favorites",
        icon: (
          <FontAwesomeIcon
            icon={faCircleCheck}
            style={{ fontSize: "1.5rem" }}
          />
        ),
        color: "success",
      });
      setOpenSnackbar(true);
    }
  };

  return (
    <MotionIconButton
      whileTap={{ scale: 0.7 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
      size="sm"
      color="inherit"
      aria-label="favorite"
      onClick={toggleFavorite}
      sx={{ mr: 0.1 }}
    >
      <MotionIcon
        icon={faStar}
        animate={{
          color: isFavorite ? "#fbbc05" : "#32383E",
        }}
        transition={{ duration: 0.1 }}
        style={{ fontSize: "1rem" }}
      />
    </MotionIconButton>
  );
};

export default Favorites;
