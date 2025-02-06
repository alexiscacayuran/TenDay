import { useEffect } from "react";
import { useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-geotiff-2";
import "leaflet-geotiff-2/dist/leaflet-geotiff-plotty";
import * as Geotiff from "geotiff";
import { format } from "date-fns";

const overlayList = [
  { name: "temperature_average", pathName: "MEAN" },
  { name: "temperature_minimum", pathName: "MIN" },
  { name: "temperature_maximum", pathName: "MAX" },
  { name: "humidity", pathName: "RH" },
  { name: "wind", pathName: "WS" },
  { name: "rainfall", pathName: "TP" },
  { name: "cloud", pathName: "TCC" },
];

const writeURL = (startDate, overlay, date) => {
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

const Overlay = ({ startDate, overlay, date }) => {
  const map = useMap();

  useEffect(() => {
    const url = writeURL(startDate.current.latest_date, overlay, date);
    if (!url) return; // Skip if URL construction fails

    // ✅ Step 1: Load the GeoTIFF
    const loadGeoTIFF = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch: ${url}`);

        const buffer = await response.arrayBuffer();

        const options = {
          sourceFunction: Geotiff.fromArrayBuffer,
          arrayBuffer: buffer,
          renderer: L.LeafletGeotiff.plotty({
            colorScale: "rainbow",
            displayMin: 10,
            displayMax: 35,
          }),
          opacity: 0.5,
          useWorker: true,
          clearBeforeMove: false,
        };

        // ✅ Step 2: Add the Layer to the Map
        const layer = L.leafletGeotiff(buffer, options);
        layer.addTo(map);
      } catch (error) {
        console.error("Error loading GeoTIFF:", error);
      }
    };

    loadGeoTIFF();
  }, [startDate, overlay, date, map]);

  return null;
};

export default Overlay;
