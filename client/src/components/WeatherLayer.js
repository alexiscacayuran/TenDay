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
  const [loading, setLoading] = useState(true);

  const colorScaleFn = (value) => {
    if (value[0] < Number.MIN_VALUE) {
      return colorScale.current(value).alpha(0).css();
    }
    return colorScale.current(value).css();
  };

  const loadScalar = async () => {
    const url = writeURL(
      startDate.current.latest_date,
      overlay,
      date,
      false,
      isLayerClipped
    );
    if (!url) return;

    try {
      let cached = await db.scalars.get(url);
      let buffer;

      if (cached) {
        // console.log("Loaded array buffer from IndexedDB:", url);
        buffer = cached.scalarData;
      } else {
        // console.log("Fetching tif from AWS: ", url);
        const response = await fetch(url);
        buffer = await response.arrayBuffer();
        await db.scalars.put({ url, scalarData: buffer }); // Store in IndexedDB
      }

      const georaster = await parseGeoraster(buffer);
      colorScale.current = getColorScale(overlay, isDiscrete);

      let scalarLayer = new GeorasterLayer({
        georaster: georaster,
        resolution: 256,
        pixelValuesToColorFn: colorScaleFn,
        keepBuffer: 128,
        pane: "tilePane",
        zIndex: 100,
        opacity: 0.8,
        updateWhenIdle: false,
      });

      // Replace scalar layer if it already exists
      if (scalarLayerRef.current) {
        overlayLayer.current.removeLayer(scalarLayerRef.current);
      }

      overlayLayer.current.addLayer(scalarLayer);
      scalarLayerRef.current = scalarLayer; // Store reference
    } catch (error) {
      console.error("Error: ", error);
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
      const vectorUrl = `${uUrl}-${vUrl}`; // Unique key for vector layer

      try {
        if (!map) {
          console.error("Map is not available yet!");
          return;
        }

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
          width: 2.0,
          velocityScale: 1 / 1000,
        });

        // Replace vector layer if it already exists
        if (vectorLayerRef.current) {
          overlayLayer.current.removeLayer(vectorLayerRef.current);
        }

        overlayLayer.current.addLayer(vectorLayer);
        vectorLayerRef.current = vectorLayer; // Store reference
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

    const loadData = async () => {
      setLoading(true);
      await loadScalar();
      await loadVectorAnim();
      setLoading(false);
    };

    loadData();
  }, [startDate, overlay, date, map, overlayLayer, isLayerClipped]);

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
          bottom: open ? 340 : 70,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 999,
        }}
      >
        <div className="loader">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </Box>
    )
  );
};

export default WeatherLayer;
