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
    scale: [
      "#3765AE",
      "#4A93B1",
      "#70E7B8",
      "#B5E851",
      "#FFFF5B",
      "#F9DA9A",
      "#F4B949",
      "#ED763B",
      "#A5322C",
    ],
    domain: chroma.limits([15, 27, 39], "e", 8),
    mode: "hsl",
    classes: 9,
  },
  {
    name: "temperature_minimum",
    pathName: "MIN",
    scale: ["steelblue", "yellow", "darkred"],
    domain: chroma.limits([15, 27, 39], "e", 8),
    mode: "hsl",
    classes: 9,
  },
  {
    name: "temperature_maximum",
    pathName: "MAX",
    scale: ["steelblue", "yellow", "darkred"],
    domain: chroma.limits([15, 27, 39], "e", 8),
    mode: "hsl",
    classes: 9,
  },
  {
    name: "humidity",
    pathName: "RH",
    scale: ["palegreen", "royalblue"],
    domain: [50, 100],
    mode: "hsl",
    classes: 8,
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
  const matchedOverlay = overlayList.find((o) => o.name === overlay);

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

  if (matchedOverlay.gamma) {
    colorScale = colorScale.gamma(matchedOverlay.gamma);
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
    colorScale.current = getColorScale(overlay, isDiscrete);

    if (scalarLayerRef.current) {
      scalarLayerRef.current.updateColors(colorScaleFn, { debugLevel: -1 });
    }
  }, [isDiscrete]);

  useEffect(() => {
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

        setIsLayerReady(true);
      } catch (error) {
        console.log("Error: ", error);
      }
    };

    loadScalar();

    const loadVectorAnim = async () => {
      try {
        if (!map) {
          console.error("Map is not available yet!");
          return;
        }

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
