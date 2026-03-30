// utils/geocode.js
import fetch from 'node-fetch';
import { redisClient } from '../db.js';

const OPENCAGE_KEY = '98018f7808fd4776bfd7c891edba4bb6';

export async function getLatLng(place) {
  if (!place || place.trim() === '') return { lat: null, lng: null };

  const cacheKey = `geo:${place}`;
  const cached = await redisClient.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(place)}&key=${OPENCAGE_KEY}&limit=1`;

  try {
    const res = await fetch(url, { timeout: 7000 });
    const data = await res.json();
    const result = data.results?.[0]?.geometry;
    if (result?.lat && result?.lng) {
      await redisClient.setEx(cacheKey, 60 * 60 * 24 * 30, JSON.stringify(result)); 
      return result;
    }
  } catch (err) {
    console.error(`Geocoding failed for "${place}":`, err.message);
  }

  return { lat: null, lng: null };
}
