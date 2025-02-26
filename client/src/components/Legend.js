import React, { useEffect, useState } from "react";
import chroma from "chroma-js";

const Legend = ({ isDiscrete, overlay }) => {
  const overlayList = [
    {
      name: "temperature_average",
      scale: [
        "#3765AE",
        "#4A93B1",
        "#70E7B8",
        "#B5E851",
        "#FFFF5B",
        "#F9DA9A",
        "#F4B949",
        "#ED763B",
        "#EA3F34",
      ],
      domain: chroma.limits([15, 27, 39], "e", 8),
      units: "&deg",
    },
    {
      name: "temperature_minimum",
      scale: ["steelblue", "yellow", "darkred"],
      domain: chroma.limits([15, 27, 39], "e", 8),
    },
    {
      name: "temperature_maximum",
      scale: ["steelblue", "yellow", "darkred"],
      domain: chroma.limits([15, 27, 39], "e", 8),
    },
    {
      name: "humidity",
      scale: ["palegreen", "royalblue"],
      domain: [50, 100],
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
      domain: [0, 4, 10, 18, 30],
    },
    {
      name: "rainfall",
      scale: [
        chroma("cornflowerblue").alpha(0),
        "cornflowerblue",
        "mediumaquamarine",
        "khaki",
        "mediumvioletred",
        "mediumorchid",
      ],
      domain: [0, 0.3, 5, 15, 25, 30],
    },
    {
      name: "cloud",
      scale: [
        chroma("whitesmoke").alpha(0),
        chroma("darkgray").alpha(0.5),
        "whitesmoke",
      ],
      domain: [0, 40, 80],
    },
  ];

  const getColorScale = () => {
    return overlayList.find((o) => o.name === overlay);
  };

  const [colorScale, setColorScale] = useState(() => {
    const overlayData = getColorScale();
    return chroma.scale(overlayData.scale).domain(overlayData.domain);
  });

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
      .map((val) => colorScale(val).css()) // Ensure colorScale is a function
      .join(", ")})`;
  };

  const overlayData = getColorScale(); // Call once per render

  return (
    <div className="legend-container">
      <div className="legend-units">
        <span>&deg;C</span>
      </div>

      {isDiscrete ? (
        <ul className="legend-discrete">
          {overlayData.domain.map((value, index) => (
            <li
              key={index}
              className="legend-item"
              style={{ backgroundColor: colorScale(value).css() }}
            >
              {value}
            </li>
          ))}
        </ul>
      ) : (
        <ul
          className="legend-continuous"
          style={{ background: generateGradient() }}
        >
          {overlayData.domain.map((value, index) => (
            <li key={index} className="legend-item">
              {value}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Legend;
