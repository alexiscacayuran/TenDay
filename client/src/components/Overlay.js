/* global d3 */

import { useState, useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { format } from "date-fns";
import parseGeoraster from "georaster";
import GeorasterLayer from "georaster-layer-for-leaflet";
import chroma from "chroma-js";
import "ih-leaflet-canvaslayer-field/dist/leaflet.canvaslayer.field.js";
import Button from "@mui/joy/Button";
import Box from "@mui/joy/Box";

const overlayList = [
  {
    name: "temperature_average",
    pathName: "MEAN",

    colorScale: "rainbow",
  },
  {
    name: "temperature_minimum",
    pathName: "MIN",
    min: 5,
    max: 45,
    colorScale: "rainbow",
  },
  {
    name: "temperature_maximum",
    pathName: "MAX",
    min: 5,
    max: 45,
    colorScale: "rainbow",
  },
  { name: "humidity", pathName: "RH", min: 0, max: 100, colorScale: "viridis" },
  { name: "wind", pathName: "WS", min: 0, max: 50, colorScale: "rainbow" },
  { name: "rainfall", pathName: "TP", min: 0, max: 30, colorScale: "rainbow" },
  { name: "cloud", pathName: "TCC", min: 0, max: 120, colorScale: "greys" },
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

const Overlay = ({ startDate, overlay, date, overlayLayer, isDiscrete }) => {
  const map = useMap();
  const colorScale = useRef(null);
  const scalarLayerRef = useRef(null);
  const vectorLayerRef = useRef(null);

  console.log(isDiscrete);

  const colorScaleFn = (value) => {
    let rgb = colorScale.current(value)._rgb;
    return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${rgb[3]})`;
  };

  useEffect(() => {
    let _colorScale = chroma
      .scale(["#376484", "#F9DA9A", "#A5322C"])
      .mode("hsl")
      .domain([15, 26.5, 38]);

    colorScale.current = isDiscrete ? _colorScale.classes(10) : _colorScale;

    if (!scalarLayerRef.current) {
      setTimeout(() => {
        if (scalarLayerRef.current) {
          console.log("Updating color scale using updateColors...");
          scalarLayerRef.current.updateColors(colorScaleFn, { debugLevel: -1 });
        }
      }, 500); // Wait for 500ms before retrying
      return;
    }

    console.log("Updating existing scalar layer...");
    scalarLayerRef.current.updateColors(colorScaleFn, { debugLevel: 1 });
  }, [isDiscrete]);

  useEffect(() => {
    console.log("Load raster renders.");
    const url = writeURL(startDate.current.latest_date, overlay, date, false);
    if (!url) return;

    const loadScalar = async () => {
      try {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        const georaster = await parseGeoraster(buffer);

        let scalarLayer = new GeorasterLayer({
          georaster: georaster,
          opacity: 0.5,
          resolution: 64,
          pixelValuesToColorFn: colorScaleFn,
          keepBuffer: 200,
        });

        // Replace scalar layer if it already exists
        if (scalarLayerRef.current) {
          overlayLayer.current.removeLayer(scalarLayerRef.current);
        }

        overlayLayer.current.addLayer(scalarLayer);
        scalarLayerRef.current = scalarLayer; // Store reference
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
