// src/assets/image.js

import dashboardMorning from "../assets/img/dashboard-morning.webp";
import dashboardRain from "../assets/img/dashboard-rain.webp";

// Preload helper
const preloadImages = (...srcArray) => {
  srcArray.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
};

export const images = {
  dashboardMorning,
  dashboardRain
};

export const preloadAllImages = () => {
  preloadImages(dashboardMorning, dashboardRain);
};
