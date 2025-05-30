import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { format } from "date-fns";
import parseGeoraster from "georaster";
import GeorasterLayer from "georaster-layer-for-leaflet";
import chroma from "chroma-js";
import overlayList from "../utils/OverlayList";
import VectorField from "../../raster/VectorField";
import VectorFieldAnim from "../../layer/VectorFieldAnim";
// import "ih-leaflet-canvaslayer-field/dist/leaflet.canvaslayer.field.js";
import { buffer } from "d3";
import Dexie from "dexie";
import Box from "@mui/joy/Box";
import { useTheme } from "@mui/joy/styles";
import { useMediaQuery } from "@mui/material";

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const db = new Dexie("WeatherLayerCache");
db.version(2).stores({
  scalars: "url, timestamp",
  vectors: "url, timestamp", // `&` denotes `url` is the primary key
});

const baseParticleOption = {
  velocityScale: 1 / 1000,
  fade: 0.94,
  color: chroma("white").alpha(0.25),
  width: 2.5,
  paths: 15000,
  maxAge: 50,
};

const particleOptions = [
  { zoom: 5, width: 2.3, paths: 3600, maxAge: 125 },
  { zoom: 6, width: 2.5, paths: 4800, maxAge: 120 },
  { zoom: 7, width: 3.0, paths: 5400, maxAge: 115 },
  { zoom: 8, width: 3.3, paths: 7500, maxAge: 110 },
  { zoom: 9, width: 3.5, paths: 12000, maxAge: 95 },
  { zoom: 10, width: 3.7, paths: 30000, maxAge: 75 },
  { zoom: 11, width: 3.9, paths: 60000, maxAge: 60 },
  { zoom: 12, width: 4.1, paths: 90000, maxAge: 55 },
  { zoom: 13, width: 4.3, paths: 210000, maxAge: 50 },
];

const writeURL = (startDate, overlay, date, isVector, isLayerClipped) => {
  const formattedStartDate = format(startDate, "yyyyMMdd");
  const formattedDate = format(date, "yyyyMMdd");
  const maskedSuffix = isLayerClipped ? "_masked" : "";

  if (isVector) {
    return `https://tendayforecast.s3.ap-southeast-1.amazonaws.com/${formattedStartDate}/UV/UV_${formattedDate}${maskedSuffix}.tif`;
  }

  const currentOverlay = overlayList.find((item) => item.name === overlay);
  if (!currentOverlay) {
    console.error(`Invalid overlay name: "${overlay}"`);
    return null;
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
  const theme = useTheme();
  const isLaptop = useMediaQuery(theme.breakpoints.up("lg"));
  const isTablet = useMediaQuery(theme.breakpoints.up("md"));
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const map = useMap();
  const localOverlay = useRef(overlayList.find((o) => o.name === overlay));
  const colorScale = useRef(null);
  const scalarLayerRef = useRef(null);
  const vectorLayerRef = useRef(null);
  const [loadingScalar, setLoadingScalar] = useState(true);
  const [loadingVector, setLoadingVector] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cleanupOldCache = async () => {
      const now = Date.now();

      const expiredScalars = await db.scalars
        .filter((item) => now - item.timestamp > TTL_MS)
        .toArray();
      if (expiredScalars.length) {
        await db.scalars.bulkDelete(expiredScalars.map((item) => item.url));
      }

      const expiredVectors = await db.vectors
        .filter((item) => now - item.timestamp > TTL_MS)
        .toArray();
      if (expiredVectors.length) {
        await db.vectors.bulkDelete(expiredVectors.map((item) => item.url));
      }
    };

    cleanupOldCache();
  }, []);

  const colorScaleFn = (value) => {
    if (value[0] <= 0) {
      return colorScale.current(value).alpha(0).css();
    }

    return colorScale.current(value).css();
  };

  // const renderScalar = (buffer) => {};

  const loadScalar = async (signal) => {
    if (!map) return;

    const url = writeURL(
      startDate.current.latest_date,
      overlay,
      date,
      false,
      isLayerClipped
    );
    if (!url || signal?.aborted) return;

    try {
      const now = Date.now();
      const cached = await db.scalars.get(url);

      const isFresh = cached && now - cached.timestamp < TTL_MS;
      let _buffer;
      if (isFresh) {
        _buffer = cached.scalarData;
      } else {
        _buffer = await buffer(url, { signal });
        if (signal?.aborted) return;
        await db.scalars.put({ url, scalarData: _buffer, timestamp: now });
      }

      const georaster = await parseGeoraster(_buffer);
      //console.log("Georaster", georaster);
      colorScale.current = getColorScale(overlay, isDiscrete);

      let scalarLayer = new GeorasterLayer({
        georaster: georaster,
        resolution: 64,
        pixelValuesToColorFn: colorScaleFn,
        // keepBuffer: 100,
        pane: "tilePane",
        zIndex: 100,
        opacity: 0.8,
        updateWhenIdle: true,
        caching: true,
      });

      console.dir(scalarLayer);

      if (scalarLayerRef.current) {
        overlayLayer.current.removeLayer(scalarLayerRef.current);
        scalarLayerRef.current.remove(); // ✅ explicit cleanup
      }

      overlayLayer.current.addLayer(scalarLayer);
      scalarLayerRef.current = scalarLayer;
    } catch (error) {
      if (error.name !== "AbortError") console.error(error);
    }
  };

  const renderVectorAnim = (vf) => {
    const options = {
      ...baseParticleOption,
      // ...(particleOptions.find((opt) => opt.zoom === zoomLevel) || {}),
    };

    const vectorLayer = new VectorFieldAnim(vf, options);

    if (vectorLayerRef.current) {
      overlayLayer.current.removeLayer(vectorLayerRef.current);
      vectorLayerRef.current.remove(); // ✅ for vectors
    }

    overlayLayer.current.addLayer(vectorLayer);
    vectorLayerRef.current = vectorLayer;
  };

  const loadVectorAnim = async (signal) => {
    if (isAnimHidden || !map || signal?.aborted) return;

    const url = writeURL(
      startDate.current.latest_date,
      overlay,
      date,
      true,
      isLayerClipped
    );

    if (!url || signal?.aborted) return;

    try {
      const now = Date.now();
      const cached = await db.vectors.get(url);

      const isFresh = cached && now - cached.timestamp < TTL_MS;
      let vf;

      if (isFresh) {
        if (signal?.aborted) return;
        vf = new VectorField(cached.vf);
        renderVectorAnim(vf);
      } else {
        const worker = new Worker(
          `${process.env.PUBLIC_URL}/worker/vector-worker.js`,
          {
            type: "classic",
          }
        );

        const handleAbort = () => {
          worker.terminate();
        };
        signal?.addEventListener("abort", handleAbort, { once: true });

        worker.postMessage({
          url: url,
        });

        worker.onmessage = async (e) => {
          if (signal?.aborted) {
            worker.terminate();
            return;
          }

          const { type, payload, error } = e.data;
          if (type === "vf-data") {
            try {
              await db.vectors.put({
                url: url,
                vf: payload,
                timestamp: now,
              });

              vf = new VectorField(payload);
              renderVectorAnim(vf);
            } catch (err) {
              console.error("Failed to save or render vector data:", err);
            } finally {
              worker.terminate(); // ✅ move terminate *after* all logic completes
            }
          }

          if (error) {
            console.error("Worker error:", error);
          }

          worker.terminate(); // ✅ always terminate
        };

        signal?.removeEventListener("abort", handleAbort);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error loading vector layer: ", error);
      }
    }
  };

  useEffect(() => {
    colorScale.current = getColorScale(overlay, isDiscrete);

    if (scalarLayerRef.current) {
      scalarLayerRef.current.updateColors(colorScaleFn);
    }
  }, [isDiscrete]);

  useEffect(() => {
    const controller = new AbortController();
    localOverlay.current = overlayList.find((o) => o.name === overlay);

    const load = async () => {
      setLoadingScalar(true);
      await loadScalar(controller.signal);
      setLoadingScalar(false);
    };

    load();

    return () => controller.abort(); // cancel previous if new one triggers
  }, [map, overlay, date, isLayerClipped]);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoadingVector(true);
      await loadVectorAnim(controller.signal);
      setLoadingVector(false);
    };

    load();

    return () => {
      controller.abort();
    };
  }, [map, date, isLayerClipped]); //zoomLevel

  useEffect(() => {
    setLoading(loadingVector || loadingScalar);
  }, [loadingScalar, loadingVector]);

  useEffect(() => {
    if (isAnimHidden) {
      // Remove the vector layer if it exists
      if (vectorLayerRef.current) {
        overlayLayer.current.removeLayer(vectorLayerRef.current);
        vectorLayerRef.current.remove(); // ✅ for vectors
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
          bottom: open ? (isTablet ? 260 : 250) : isTablet ? 80 : 90,
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
