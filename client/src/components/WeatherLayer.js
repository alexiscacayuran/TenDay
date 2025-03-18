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

const db = new Dexie("OverlayCache");
db.version(1).stores({
  scalars: "url, scalarData", // Stores pre-built raster layers
  vectors: "url, vectorData", // Stores pre-built vector layers
});

const overlayList = [
  {
    name: "temperature_average",
    pathName: "MEAN",
    scale: [
      "#0031FF",
      "#0061FF",
      "#0092FF",
      "#00C2FF",
      "#00F3FF",
      "#24FFDB",
      "#55FFAA",
      "#86FF79",
      "#B6FF49",
      "#E7FF18",
      "#E7FF18",
      "#FFE500",
      "#FFD400",
      "#FFC300",
      "#FFB200",
      "#FF9D00",
      "#FF7E00",
      "#FF5E00",
      "#FF3F00",
      "#FF1F00",
    ],
    domain: chroma.limits([0, 40], "e", 10).map(Math.round),
    mode: "hsl",
    classes: 15,
  },
  {
    name: "temperature_minimum",
    pathName: "MIN",
    scale: [
      "#0031FF",
      "#0061FF",
      "#0092FF",
      "#00C2FF",
      "#00F3FF",
      "#24FFDB",
      "#55FFAA",
      "#86FF79",
      "#B6FF49",
      "#E7FF18",
      "#E7FF18",
      "#FFE500",
      "#FFD400",
      "#FFC300",
      "#FFB200",
      "#FF9D00",
      "#FF7E00",
      "#FF5E00",
      "#FF3F00",
      "#FF1F00",
    ],
    domain: chroma.limits([0, 40], "e", 20).map(Math.round),
    mode: "hsl",
    classes: 15,
  },
  {
    name: "temperature_maximum",
    pathName: "MAX",
    scale: [
      "#0031FF",
      "#0061FF",
      "#0092FF",
      "#00C2FF",
      "#00F3FF",
      "#24FFDB",
      "#55FFAA",
      "#86FF79",
      "#B6FF49",
      "#E7FF18",
      "#E7FF18",
      "#FFE500",
      "#FFD400",
      "#FFC300",
      "#FFB200",
      "#FF9D00",
      "#FF7E00",
      "#FF5E00",
      "#FF3F00",
      "#FF1F00",
    ],
    domain: chroma.limits([0, 40], "e", 20).map(Math.round),
    mode: "hsl",
    classes: 15,
  },
  {
    name: "humidity",
    pathName: "RH",
    scale: ["#C7E9B4", "#7FCDBB", "#41B6C4", "#1D91C0", "#225EA8"],
    domain: [50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100],
    mode: "hsl",
    classes: 15,
  },
  {
    name: "wind",
    pathName: "WS",
    scale: [
      "mediumpurple",
      "slateBlue",
      "mediumseagreen",
      "darkorange",
      "mediumvioletred",
    ],
    domain: [
      0.65, 2.5, 4.45, 6.75, 9.4, 12.35, 15.55, 19, 22.65, 26.5, 30.6, 42,
    ],
    mode: "hsl",
    classes: 15,
  },
  {
    name: "rainfall",
    pathName: "TP",
    scale: [
      chroma("#BAB8B8").alpha(0),
      "#BAB8B8",
      "#00C5FF",
      "#6BFB90",
      "#FFFF00",
      "#FFAA00",
      "#FF0000",
      "#FF73DF",
      "#8400A8",
    ],
    domain: [0, 5, 15, 37.5, 75, 150, 250, 400, 500],
    mode: "rgb",
    classes: 35,
  },
  {
    name: "cloud",
    pathName: "TCC",
    scale: [
      "SteelBlue",
      "lightsteelblue",
      chroma("linen").darken(0.2),
      "whitesmoke",
    ],
    domain: [0, 20, 50, 100],
    mode: "lab",
    classes: 15,
  },
];

const writeURL = (startDate, overlay, date, isVector) => {
  const formattedStartDate = format(startDate, "yyyyMMdd");
  const formattedDate = format(date, "yyyyMMdd");

  if (isVector) {
    return isVector === "u"
      ? `https://tendayforecast.s3.ap-southeast-1.amazonaws.com/${formattedStartDate}/WIND/U_${formattedDate}.asc`
      : `https://tendayforecast.s3.ap-southeast-1.amazonaws.com/${formattedStartDate}/WIND/V_${formattedDate}.asc`;
  }

  const matchedOverlay = overlayList.find((item) => item.name === overlay);
  const overlayName = matchedOverlay.pathName;

  if (!overlayName) {
    console.error(`Invalid overlay name: "${overlay}"`);
    return null; // Return null if the overlay is invalid
  }

  return `https://tendayforecast.s3.ap-southeast-1.amazonaws.com/${formattedStartDate}/${overlayName}/${overlayName}_${formattedDate}.tif`;
};

const getColorScale = (overlay, isDiscrete) => {
  const matchedOverlay = overlayList.find((o) => o.name === overlay);

  if (!matchedOverlay) {
    console.error(`Invalid overlay name: "${overlay}"`);
    return (value) => "rgba(0,0,0,0)"; // Return a fallback function instead of null
  }

  let colorScale = chroma.scale(matchedOverlay.scale);

  if (matchedOverlay.mode) {
    colorScale = colorScale.mode(matchedOverlay.mode);
  }

  if (matchedOverlay.domain) {
    colorScale = colorScale.domain(matchedOverlay.domain);
  }

  if (matchedOverlay.gamma) {
    colorScale = colorScale.gamma(matchedOverlay.gamma);
  }

  return isDiscrete ? colorScale.classes(matchedOverlay.classes) : colorScale;
};

const WeatherLayer = ({
  startDate,
  overlay,
  date,
  overlayLayer,
  isDiscrete,
  isAnimHidden,
}) => {
  const map = useMap();
  const colorScale = useRef(null);
  console.log(colorScale);
  const scalarLayerRef = useRef(null);
  const vectorLayerRef = useRef(null);
  const [loading, setLoading] = useState(true);

  const colorScaleFn = (value) => {
    let rgb = colorScale.current(value)._rgb;
    return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${rgb[3]})`;
  };

  const loadScalar = async () => {
    const url = writeURL(startDate.current.latest_date, overlay, date, false);
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
        resolution: 128,
        pixelValuesToColorFn: colorScaleFn,
        keepBuffer: 200,
        pane: "tilePane",
        zIndex: 100,
        opacity: 0.8,
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
      const uUrl = writeURL(startDate.current.latest_date, overlay, date, "u");
      const vUrl = writeURL(startDate.current.latest_date, overlay, date, "v");
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
    const loadData = async () => {
      setLoading(true);
      await loadScalar();
      await loadVectorAnim();
      setLoading(false);
    };

    loadData();
  }, [startDate, overlay, date, map, overlayLayer]);

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
          bottom: 70,
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
