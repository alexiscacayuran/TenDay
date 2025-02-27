import { useState, useEffect } from "react";
import Dexie from "dexie";

// Connect to IndexedDB
const db = new Dexie("OverlayCache");
db.version(1).stores({
  scalars: "url, layerOptions",
  vectors: "url, layerOptions",
});

const IndexedDBDebugger = () => {
  const [scalarLayers, setScalarLayers] = useState([]);
  const [vectorLayers, setVectorLayers] = useState([]);

  // Fetch IndexedDB layers on mount
  useEffect(() => {
    const fetchCache = async () => {
      const scalars = await db.scalars.toArray();
      const vectors = await db.vectors.toArray();
      setScalarLayers(scalars);
      setVectorLayers(vectors);
    };

    fetchCache();
  }, []);

  // Remove a specific layer
  const removeLayer = async (url, type) => {
    if (type === "scalar") {
      await db.scalars.delete(url);
      setScalarLayers(await db.scalars.toArray()); // Refresh UI
    } else if (type === "vector") {
      await db.vectors.delete(url);
      setVectorLayers(await db.vectors.toArray()); // Refresh UI
    }
  };

  // Clear all cache
  const clearCache = async () => {
    await db.scalars.clear();
    await db.vectors.clear();
    setScalarLayers([]);
    setVectorLayers([]);
  };

  return (
    <div
      style={{
        padding: "10px",
        background: "#f4f4f4",
        border: "1px solid #ddd",
        position: "absolute",
        bottom: 45,
        left: 10,
        zIndex: 9999,
      }}
    >
      <h3>IndexedDB Cache Debugger</h3>

      <h4>Scalar Layers (GeoTIFF)</h4>
      {scalarLayers.length > 0 ? (
        <ul>
          {scalarLayers.map(({ url }) => (
            <li key={url}>
              {url}
              <button
                onClick={() => removeLayer(url, "scalar")}
                style={{ marginLeft: "10px" }}
              >
                ❌ Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No cached scalar layers</p>
      )}

      <h4>Vector Layers (ASC)</h4>
      {vectorLayers.length > 0 ? (
        <ul>
          {vectorLayers.map(({ url }) => (
            <li key={url}>
              {url}
              <button
                onClick={() => removeLayer(url, "vector")}
                style={{ marginLeft: "10px" }}
              >
                ❌ Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No cached vector layers</p>
      )}

      <button
        onClick={clearCache}
        style={{
          marginTop: "10px",
          background: "red",
          color: "white",
          padding: "5px 10px",
        }}
      >
        🗑️ Clear All Cache
      </button>
    </div>
  );
};

export default IndexedDBDebugger;
