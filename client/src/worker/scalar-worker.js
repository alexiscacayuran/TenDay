/* eslint-env worker */
/* global importScripts, GeoTIFF, d3 */
importScripts(
  "https://cdn.jsdelivr.net/npm/georaster@1.6.0/dist/georaster.browser.bundle.min.js"
);
importScripts("https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js");

onmessage = async (e) => {
  try {
    const buffer = await d3.buffer(url);
    const georaster = await parseGeoraster(buffer);

    postMessage({ type: "scalar-data", payload: georaster });
  } catch (err) {
    postMessage({ error: err.message });
  }
};
