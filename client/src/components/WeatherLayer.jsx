import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { format } from "date-fns";
import parseGeoraster from "georaster";
import GeorasterLayer from "georaster-layer-for-leaflet";
import chroma from "chroma-js";
import "ih-leaflet-canvaslayer-field/dist/leaflet.canvaslayer.field.js";
import { text } from "d3";
import Dexie from "dexie";
import Box from "@mui/joy/Box";
import overlayList from "./OverlayList";

const db = new Dexie("WeatherLayerCache");
db.version(1).stores({
  scalars: "url, scalarData", // Stores pre-built raster layers
  vectors: "url, vectorData", // Stores pre-built vector layers
});

const writeURL = (startDate, overlay, date, isVector, isLayerClipped) => {
  const formattedStartDate = format(startDate, "yyyyMMdd");
  const formattedDate = format(date, "yyyyMMdd");
  const maskedSuffix = isLayerClipped ? "_masked" : "";

  if (isVector) {
    return isVector === "u"
      ? `https://tendayforecast.s3.ap-southeast-1.amazonaws.com/${formattedStartDate}/WIND/U_${formattedDate}${maskedSuffix}.asc`
      : `https://tendayforecast.s3.ap-southeast-1.amazonaws.com/${formattedStartDate}/WIND/V_${formattedDate}${maskedSuffix}.asc`;
  }

  const currentOverlay = overlayList.find((item) => item.name === overlay);
  if (!currentOverlay) {
    console.error(`Invalid overlay name: "${overlay}"`);
    return null; // Return null if the overlay is invalid
  }

  const overlayName = currentOverlay.pathName;

  return `https://tendayforecast.s3.ap-southeast-1.amazonaws.com/${formattedStartDate}/${overlayName}/${overlayName}_${formattedDate}${maskedSuffix}.tif`;
};

const getColorScale = (overlay, isDiscrete) => {
  const currentOverlay = overlayList.find((o) => o.name === overlay);

  let colorScale = chroma.scale(currentOverlay.scale);

  if (currentOverlay.mode) {
    colorScale = colorScale.mode(currentOverlay.mode);
  }

  if (currentOverlay.domain) {
    colorScale = colorScale.domain(currentOverlay.domain);
  }

  return isDiscrete ? colorScale.classes(currentOverlay.classes) : colorScale;
};

const baseParticleOption = {
  velocityScale: 1 / 500,
  fade: 0.94,
  color: chroma("white").alpha(0.25),
  width: 4.5,
  paths: 70000,
  maxAge: 10,
};

const particleOptions = [
  { zoom: 5, width: 1.8, paths: 1200, maxAge: 95 },
  { zoom: 6, width: 2, paths: 1600, maxAge: 90 },
  { zoom: 7, width: 2.5, paths: 1800, maxAge: 85 },
  { zoom: 8, width: 2.8, paths: 2500, maxAge: 80 },
  { zoom: 9, width: 3.2, paths: 4000, maxAge: 65 },
  { zoom: 10, width: 3.5, paths: 10000, maxAge: 45 },
  { zoom: 11, width: 3.8, paths: 20000, maxAge: 30 },
  { zoom: 12, width: 4.2, paths: 30000, maxAge: 25 },
  { zoom: 13, width: 4.5, paths: 70000, maxAge: 20 },
];

const WeatherLayer = ({
  startDate,
  overlay,
  date,
  overlayLayer,
  isDiscrete,
  isAnimHidden,
  isLayerClipped,
  open,
  zoomLevel,
}) => {
  const map = useMap();
  const localOverlay = useRef(overlayList.find((o) => o.name === overlay));
  const colorScale = useRef(null);
  const scalarLayerRef = useRef(null);
  const vectorLayerRef = useRef(null);
  const [loadingScalar, setLoadingScalar] = useState(true);
  const [loadingVector, setLoadingVector] = useState(true);
  const [loading, setLoading] = useState(true);
  // console.log("Loading scalar", loadingScalar);
  // console.log("Loading vector", loadingVector);

  const colorScaleFn = (value) => {
    if (value[0] <= 0) {
      return colorScale.current(value).alpha(0).css();
    }

    return colorScale.current(value).css();
  };

  useEffect(() => {
    const controller = new AbortController();
    loadScalar(controller.signal);
    return () => controller.abort(); // cancel previous if new one triggers
  }, [overlay, date]);

  const loadScalar = async (signal) => {
    const url = writeURL(
      startDate.current.latest_date,
      overlay,
      date,
      false,
      isLayerClipped
    );
    if (!url || signal?.aborted) return;

    try {
      let cached = await db.scalars.get(url);
      if (signal?.aborted) return;
      let buffer;

      if (cached) {
        // console.log("Loaded array buffer from IndexedDB:", url);
        buffer = cached.scalarData;
      } else {
        // Fetch from network if not cached
        const response = await fetch(url, { signal });
        if (signal?.aborted) return;

        const buffer = await response.arrayBuffer();

        await db.scalars.put({ url, scalarData: buffer }); // Store in IndexedDB
      }

      const georaster = await parseGeoraster(buffer);
      colorScale.current = getColorScale(overlay, isDiscrete);

      let scalarLayer = new GeorasterLayer({
        georaster: georaster,
        resolution: 64,
        pixelValuesToColorFn: colorScaleFn,
        keepBuffer: 50,
        pane: "tilePane",
        zIndex: 100,
        opacity: 0.8,
        updateWhenIdle: true,
      });

      // Replace scalar layer if it already exists
      if (scalarLayerRef.current) {
        overlayLayer.current.removeLayer(scalarLayerRef.current);
      }

      overlayLayer.current.addLayer(scalarLayer);
      scalarLayerRef.current = scalarLayer; // Store reference
    } catch (error) {
      if (error.name !== "AbortError") console.error(error);
    }
  };

  const loadVectorAnim = async () => {
    if (!isAnimHidden) {
      const uUrl = writeURL(
        startDate.current.latest_date,
        overlay,
        date,
        "u",
        isLayerClipped
      );
      const vUrl = writeURL(
        startDate.current.latest_date,
        overlay,
        date,
        "v",
        isLayerClipped
      );

      try {
        if (!map) {
          console.error("Map is not available yet!");
          return;
        }

        // // Introduce a delay to ensure source data is available
        // await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay

        let cachedU = await db.vectors.get(uUrl);
        let cachedV = await db.vectors.get(vUrl);
        let u, v;

        if (cachedU && cachedV) {
          // console.log("Loaded vector data from IndexedDB:", vectorUrl);
          u = cachedU.vectorData;
          v = cachedV.vectorData;
        } else {
          // console.log("Fetching vector data from AWS...");
          u = await text(uUrl);
          v = await text(vUrl);

          // ✅ Store raw ASCII grids in IndexedDB
          await db.vectors.put({ url: uUrl, vectorData: u });
          await db.vectors.put({ url: vUrl, vectorData: v });
        }

        let vf = L.VectorField.fromASCIIGrids(u, v);

        let vectorLayer = L.canvasLayer.vectorFieldAnim(vf, {
          ...baseParticleOption,
          ...(particleOptions.find((opt) => opt.zoom === zoomLevel) || {}),
        });

        // Replace vector layer if it already exists
        if (vectorLayerRef.current) {
          overlayLayer.current.removeLayer(vectorLayerRef.current);
        }

        overlayLayer.current.addLayer(vectorLayer);
        vectorLayerRef.current = vectorLayer; // Store reference

        // Cleanup function to remove the layer
        return () => {
          if (vectorLayerRef.current) {
            overlayLayer.current.removeLayer(vectorLayerRef.current);
            vectorLayerRef.current = null;
          }
        };
      } catch (error) {
        console.error("Error loading vector layer: ", error);
      }
    }
  };

  useEffect(() => {
    colorScale.current = getColorScale(overlay, isDiscrete);

    if (scalarLayerRef.current) {
      scalarLayerRef.current.updateColors(colorScaleFn, { debugLevel: -1 });
    }
  }, [isDiscrete]);

  useEffect(() => {
    localOverlay.current = overlayList.find((o) => o.name === overlay);

    const loadScalarData = async () => {
      setLoadingScalar(true);
      await loadScalar();
      setLoadingScalar(false);
    };

    loadScalarData();
  }, [map, overlay, date, isLayerClipped]);

  useEffect(() => {
    const loadVectorData = async () => {
      setLoadingVector(true);
      await loadVectorAnim();
      setLoadingVector(false);
    };

    loadVectorData();
  }, [map, date, isLayerClipped, zoomLevel]);

  useEffect(() => {
    setLoading(loadingScalar && loadingVector);
  }, [loadingScalar, loadingVector]);

  useEffect(() => {
    if (isAnimHidden) {
      // Remove the vector layer if it exists
      if (vectorLayerRef.current) {
        overlayLayer.current.removeLayer(vectorLayerRef.current);
      }
    } else {
      // Add the vector layer if it exists
      if (vectorLayerRef.current) {
        overlayLayer.current.addLayer(vectorLayerRef.current);
      }
    }
  }, [map, isAnimHidden]);

  return (
    loading && (
      <Box
        sx={{
          position: "fixed",
          bottom: open ? 310 : 70,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 999,
        }}
      >
        <div className="loader"></div>
      </Box>
    )
  );
};

export default WeatherLayer;
