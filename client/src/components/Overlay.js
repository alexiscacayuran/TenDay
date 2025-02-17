import { useEffect } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-geotiff-2";
import "leaflet-geotiff-2/dist/leaflet-geotiff-plotty";
import * as Geotiff from "geotiff";
import { format } from "date-fns";

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

const writeURL = (startDate, overlay, date, overlayLayer) => {
  const matchedOverlay = overlayList.find((item) => item.name === overlay);
  const overlayName = matchedOverlay.pathName;

  const formattedStartDate = format(startDate, "yyyyMMdd");
  const formattedDate = format(date, "yyyyMMdd");
  console.log(formattedStartDate);

  if (!overlayName) {
    console.error(
      `Invalid overlay name: "${overlay}" not found in overlayList.`
    );
    return null; // Return null if the overlay is invalid
  }

  return `https://tendayforecast.s3.ap-southeast-1.amazonaws.com/${formattedStartDate}/${overlayName}/${overlayName}_${formattedDate}.tif`;
};

const Overlay = ({ startDate, overlay, date, overlayLayer }) => {
  const map = useMap();

  useEffect(() => {
    const url = writeURL(startDate.current.latest_date, overlay, date);
    if (!url) return; // Skip if URL construction fails

    const loadGeoTIFF = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch: ${url}`);

        const buffer = await response.arrayBuffer();

        const rendererOptions = {
          colorScale: overlayList.find((item) => item.name === overlay)
            .colorScale,
          displayMin: overlayList.find((item) => item.name === overlay).min,
          displayMax: overlayList.find((item) => item.name === overlay).max,
          applyDisplayRange: true,
          useWebGL: true,
          clampHigh: true,
          clampLow: false,
        };

        const plottyRenderer = L.LeafletGeotiff.plotty(rendererOptions);

        const options = {
          sourceFunction: Geotiff.fromArrayBuffer,
          arrayBuffer: buffer,
          renderer: plottyRenderer,
          opacity: 0.5,
          useWorker: true,
          clearBeforeMove: false,
          blockSize: 131072,
        };

        let layer = L.leafletGeotiff(buffer, options);
        console.log(layer);

        if (overlayLayer.current) {
          overlayLayer.current.clearLayers();
          overlayLayer.current.addLayer(layer);
          // layer = layer.options.renderer.setClamps(true, true);
        }
      } catch (error) {
        console.error("Error loading GeoTIFF:", error);
      }
    };

    loadGeoTIFF();
  }, [startDate, overlay, date, map, overlayLayer]);

  return null;
};

export default Overlay;
