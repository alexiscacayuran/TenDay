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

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const db = new Dexie("WeatherLayerCache");
db.version(2).stores({
  scalars: "url, timestamp",
  vectors: "url, timestamp",
});

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
  const vectorFieldRef = useRef(null);
  // console.log("Loading scalar", loadingScalar);
  // console.log("Loading vector", loadingVector);

  // Monkey-patch drawParticle once
  useEffect(() => {
    if (!L.CanvasLayer.VectorFieldAnim.prototype._drawParticleWrapped) {
      const originalDrawParticle =
        L.CanvasLayer.VectorFieldAnim.prototype._drawParticle;

      L.CanvasLayer.VectorFieldAnim.prototype._drawParticle = function (
        viewInfo,
        ctx,
        par
      ) {
        try {
          originalDrawParticle.call(this, viewInfo, ctx, par);
        } catch (error) {
          console.error("Error inside _drawParticle:", error);
          this._stopAnimation();

          if (vectorLayerRef.current) {
            overlayLayer.current.removeLayer(vectorLayerRef.current);
            vectorLayerRef.current = null;
          }

          if (vectorFieldRef.current) {
            setTimeout(() => {
              createVectorLayer(vectorFieldRef.current);
            }, 1000);
          }
        }
      };

      L.CanvasLayer.VectorFieldAnim.prototype._drawParticleWrapped = true;
    }
  }, []);

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
      const now = Date.now();
      let cached = await db.scalars.get(url);
      if (signal?.aborted) return;

      let buffer;
      const isFresh = cached && now - cached.timestamp < TTL_MS;

      if (isFresh) {
        buffer = cached.scalarData;
      } else {
        const response = await fetch(url, { signal });
        if (signal?.aborted) return;

        buffer = await response.arrayBuffer();
        await db.scalars.put({ url, scalarData: buffer, timestamp: now });
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

      if (scalarLayerRef.current) {
        overlayLayer.current.removeLayer(scalarLayerRef.current);
      }

      overlayLayer.current.addLayer(scalarLayer);
      scalarLayerRef.current = scalarLayer;
    } catch (error) {
      if (error.name !== "AbortError") console.error(error);
    }
  };

  const createVectorLayer = (vf) => {
    if (!vf) return;

    try {
      const options = {
        ...baseParticleOption,
        ...(particleOptions.find((opt) => opt.zoom === zoomLevel) || {}),
      };

      const vectorLayer = L.canvasLayer.vectorFieldAnim(vf, options);

      if (vectorLayerRef.current) {
        overlayLayer.current.removeLayer(vectorLayerRef.current);
      }

      overlayLayer.current.addLayer(vectorLayer);
      vectorLayerRef.current = vectorLayer;
    } catch (error) {
      console.error("Error creating vector layer:", error);
    }
  };

  const loadVectorAnim = async () => {
    if (isAnimHidden || !map) return;

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
      const now = Date.now();

      let cachedU = await db.vectors.get(uUrl);
      let cachedV = await db.vectors.get(vUrl);

      const isFreshU = cachedU && now - cachedU.timestamp < TTL_MS;
      const isFreshV = cachedV && now - cachedV.timestamp < TTL_MS;

      let u, v;

      if (isFreshU && isFreshV) {
        u = cachedU.vectorData;
        v = cachedV.vectorData;
      } else {
        u = await text(uUrl);
        v = await text(vUrl);
        await db.vectors.put({ url: uUrl, vectorData: u, timestamp: now });
        await db.vectors.put({ url: vUrl, vectorData: v, timestamp: now });
      }

      let vf = L.VectorField.fromASCIIGrids(u, v);
      vectorFieldRef.current = vf;
      createVectorLayer(vf);
    } catch (error) {
      console.error("Error loading vector layer: ", error);
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

    if (!map) return; // Map must exist first

    map.whenReady(() => {
      const loadScalarData = async () => {
        setLoadingScalar(true);
        await loadScalar();
        setLoadingScalar(false);
      };

      loadScalarData();
    });
  }, [map, overlay, date, isLayerClipped]);

  useEffect(() => {
    if (!map) return;

    map.whenReady(() => {
      const loadVectorData = async () => {
        setLoadingVector(true);
        await loadVectorAnim();
        setLoadingVector(false);
      };

      loadVectorData();
    });
  }, [map, date, isLayerClipped]);

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

  useEffect(() => {
    if (!map) return;

    let zoomEndTimeout;

    const handleZoomEnd = () => {
      clearTimeout(zoomEndTimeout);
      zoomEndTimeout = setTimeout(() => {
        if (vectorFieldRef.current) {
          createVectorLayer(vectorFieldRef.current);
        }
      }, 100);
    };

    map.on("zoomend", handleZoomEnd);

    return () => {
      map.off("zoomend", handleZoomEnd);
      clearTimeout(zoomEndTimeout);
    };
  }, [map, zoomLevel]);

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
