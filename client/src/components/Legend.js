import React, { useEffect, useState } from "react";
import chroma from "chroma-js";

const Legend = ({ isDiscrete, overlay }) => {
  const overlayList = [
    {
      name: "temperature_average",
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
      units: "°C", //needs to be a toggle, should be a switch statement
      height: "320px",
    },
    {
      name: "temperature_minimum",
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
      units: "°C",
      height: "320px",
    },
    {
      name: "temperature_maximum",
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
      units: "°C",
      height: "320px",
    },
    {
      name: "humidity",
      scale: ["#C7E9B4", "#7FCDBB", "#41B6C4", "#1D91C0", "#225EA8"],
      domain: [50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100],
      units: "%",
      height: "320px",
    },
    {
      name: "wind",
      scale: [
        "mediumpurple",
        "slateBlue",
        "mediumseagreen",
        "darkorange",
        "mediumvioletred",
      ],
      domain: [
        0.65, 2.5, 4.45, 6.75, 9.4, 12.35, 15.55, 19, 22.65, 26.5, 30.6, 42,
      ].map(Math.round),
      units: "m/s",
      height: "320px",
    },
    {
      name: "rainfall",
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
      domain: [0, 5, 15, 38, 75, 150, 250, 400, 500],
      units: "mm/24h",
      height: "320px",
    },
    {
      name: "cloud",
      scale: [
        "SteelBlue",
        "lightsteelblue",
        chroma("linen").darken(0.2),
        "whitesmoke",
      ],
      domain: chroma.limits([0, 100], "e", 10),
      units: "%",
      height: "320px",
    },
  ];

  const getColorScale = () => {
    return overlayList.find((o) => o.name === overlay);
  };

  const [colorScale, setColorScale] = useState(null);

  useEffect(() => {
    const overlayData = getColorScale();
    setColorScale(() =>
      chroma.scale(overlayData.scale).domain(overlayData.domain)
    );
  }, [overlay]);

  const generateGradient = () => {
    if (!colorScale) return "transparent"; // Prevent error on first render
    const overlayData = getColorScale();
    return `linear-gradient(to top, ${overlayData.domain
      .map((val) => colorScale(val).alpha(0.8).css())
      .join(", ")})`;
  };

  const overlayData = getColorScale(); // Call once per render

  return (
    <div className="legend-container">
      <div className="legend-units">
        <span>{overlayData.units}</span>
      </div>

      <div className="legend-scale">
        {isDiscrete ? (
          <ul
            className="legend-discrete"
            style={{ height: overlayData.height }}
          >
            {overlayData.domain.map((value, index) => (
              <li
                key={index}
                className="legend-item"
                style={{ backgroundColor: colorScale(value).alpha(0.8).css() }}
              >
                {value}
              </li>
            ))}
          </ul>
        ) : (
          <ul
            className="legend-continuous"
            style={{
              background: generateGradient(),
              height: overlayData.height,
            }}
          >
            {overlayData.domain.map((value, index) => (
              <li key={index} className="legend-item">
                {value}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Legend;
