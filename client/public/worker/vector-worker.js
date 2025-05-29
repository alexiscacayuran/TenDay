/* eslint-env worker */
/* global GeoTIFF, d3 */
importScripts(
  "https://cdn.jsdelivr.net/npm/geotiff@2.1.3/dist-browser/geotiff.js"
);
importScripts("https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js");

onmessage = async (e) => {
  const { url } = e.data;
  console.log("Worker received URL:", url);
  const bandIndexes = [0, 1]; // Always U and V bands

  try {
    const buffer = await d3.buffer(url);
    const tiff = await GeoTIFF.fromArrayBuffer(buffer);
    const image = await tiff.getImage();
    const rasters = await image.readRasters();

    const tiepoint = image.getTiePoints()[0];
    const fileDirectory = image.getFileDirectory();
    const [xScale, yScale] = fileDirectory.ModelPixelScale;

    const [u, v] = bandIndexes.map((bandIndex) => {
      let zs = rasters[bandIndex];
      if (fileDirectory.GDAL_NODATA) {
        const noData = parseFloat(fileDirectory.GDAL_NODATA);
        zs = Array.from(zs).map((z) => (z === noData ? null : z));
      }

      return {
        nCols: image.getWidth(),
        nRows: image.getHeight(),
        xllCorner: tiepoint.x,
        yllCorner: tiepoint.y - image.getHeight() * yScale,
        cellXSize: xScale,
        cellYSize: yScale,
        zs,
      };
    });

    postMessage({
      type: "vf-data",
      payload: {
        nCols: u.nCols,
        nRows: u.nRows,
        xllCorner: u.xllCorner,
        yllCorner: u.yllCorner,
        cellXSize: u.cellXSize,
        cellYSize: u.cellYSize,
        us: u.zs,
        vs: v.zs,
      },
    });

    postMessage({
      type: "debug",
      payload: {
        url: url,
      },
    });
  } catch (err) {
    postMessage({ error: err.message });
  }
};
