/* global d3 */

import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { format, set } from "date-fns";
import parseGeoraster from "georaster";
import GeorasterLayer from "georaster-layer-for-leaflet";
import chroma from "chroma-js";
import "ih-leaflet-canvaslayer-field/dist/leaflet.canvaslayer.field.js";

const overlayList = [
  {
    name: "temperature_average",
    pathName: "MEAN",
    scale: ["steelblue", "moccasin", "darkred"],
    domain: [15, 26.5, 38],
    mode: "hsl",
    classes: 10,
    colors: chroma
      .scale(["steelblue", "moccasin", "darkred"])
      .mode("hsl")
      .domain([15, 26.5, 38])
      .colors(10), //for discrete scale legend
  },
  {
    name: "temperature_minimum",
    pathName: "MIN",
    scale: ["steelblue", "moccasin", "darkred"],
    domain: [15, 26.5, 38],
    mode: "hsl",
    classes: 10,
    colors: chroma
      .scale(["steelblue", "moccasin", "darkred"])
      .mode("hsl")
      .domain([15, 26.5, 38])
      .colors(10),
  },
  {
    name: "temperature_maximum",
    pathName: "MAX",
    scale: ["steelblue", "moccasin", "darkred"],
    domain: [15, 26.5, 38],
    mode: "hsl",
    classes: 10,
    colors: chroma
      .scale(["steelblue", "moccasin", "darkred"])
      .mode("hsl")
      .domain([15, 26.5, 38])
      .colors(10),
  },
  {
    name: "humidity",
    pathName: "RH",
    scale: ["palegreen", "royalblue"],
    domain: [50, 100],
    mode: "hsl",
    classes: 8,
    colors: chroma
      .scale(["palegreen", "royalblue"])
      .domain([50, 100])
      .colors(8),
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
    domain: [0, 4, 10, 18, 30],
    mode: "hsl",
    classes: 10,
  },
  {
    name: "rainfall",
    pathName: "TP",
    scale: [
      chroma("cornflowerblue").alpha(0),
      "cornflowerblue",
      "mediumaquamarine",
      "khaki",
      "mediumvioletred",
      "mediumorchid",
    ],
    domain: [0, 0.3, 5, 15, 25, 30],
    mode: "hsl",
    classes: 10,
  },
  {
    name: "cloud",
    pathName: "TCC",
    scale: [
      chroma("whitesmoke").alpha(0),
      chroma("darkgray").alpha(0.5),
      "whitesmoke",
    ],
    domain: [0, 40, 80],
    mode: "hsl",
    classes: 10,
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
  const matchedOverlay = overlayList.find((item) => item.name === overlay);

  if (!matchedOverlay) {
    console.error(`Invalid overlay name: "${overlay}"`);
    return null; // Return null if the overlay is invalid
  }

  let colorScale = chroma.scale(matchedOverlay.scale);

  if (matchedOverlay.mode) {
    colorScale = colorScale.mode(matchedOverlay.mode);
  }

  if (matchedOverlay.domain) {
    colorScale = colorScale.domain(matchedOverlay.domain);
  }

  return isDiscrete ? colorScale.classes(matchedOverlay.classes) : colorScale;
};

const Overlay = ({ startDate, overlay, date, overlayLayer, isDiscrete }) => {
  const map = useMap();
  const colorScale = useRef(null);
  const scalarLayerRef = useRef(null);
  const vectorLayerRef = useRef(null);
  const [isLayerReady, setIsLayerReady] = useState(false);

  const colorScaleFn = (value) => {
    let rgb = colorScale.current(value)._rgb;
    return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${rgb[3]})`;
  };

  useEffect(() => {
    if (!isLayerReady) return; // Ensure raster has been loaded before updating colors

    console.log("Updating color scale due to isDiscrete change...");
    colorScale.current = getColorScale(overlay, isDiscrete);

    if (scalarLayerRef.current) {
      scalarLayerRef.current.updateColors(colorScaleFn, { debugLevel: -1 });
    }
  }, [isDiscrete]);

  useEffect(() => {
    console.log("Loading raster due to overlay change...");
    const url = writeURL(startDate.current.latest_date, overlay, date, false);
    if (!url) return;

    const loadScalar = async () => {
      try {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        const georaster = await parseGeoraster(buffer);

        colorScale.current = getColorScale(overlay, isDiscrete);

        let scalarLayer = new GeorasterLayer({
          georaster: georaster,
          opacity: 0.6,
          resolution: 128,
          pixelValuesToColorFn: colorScaleFn,
          keepBuffer: 200,
        });

        // Replace scalar layer if it already exists
        if (scalarLayerRef.current) {
          overlayLayer.current.removeLayer(scalarLayerRef.current);
        }

        overlayLayer.current.addLayer(scalarLayer);
        scalarLayerRef.current = scalarLayer; // Store reference

        setIsLayerReady(true);
      } catch (error) {
        console.log("Error: ", error);
      }
    };

    loadScalar();

    const loadVectorAnim = async () => {
      try {
        let u = await fetch(
          writeURL(startDate.current.latest_date, overlay, date, "u")
        ).then((res) => res.text());

        let v = await fetch(
          writeURL(startDate.current.latest_date, overlay, date, "v")
        ).then((res) => res.text());

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
    };

    loadVectorAnim();
  }, [startDate, overlay, date, map]);

  return null;
};

export default Overlay;
