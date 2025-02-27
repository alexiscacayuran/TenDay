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
      units: "°C", //needs to be toggleable, should be a switch statement
    },
    {
      name: "temperature_minimum",
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
      units: "°C",
    },
    {
      name: "temperature_maximum",
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
      units: "°C",
    },
    {
      name: "humidity",
      scale: ["palegreen", "royalblue"],
      domain: chroma.limits([80, 100], "e", 10),
      units: "%",
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
      domain: [0, 0.5, 1, 2, 4, 10, 18, 30],
      units: "m/s",
    },
    {
      name: "rainfall",
      scale: [
        "cornflowerblue",
        "cornflowerblue",
        "mediumaquamarine",
        "khaki",
        "mediumvioletred",
        "mediumorchid",
      ],
      domain: [0, 0.3, 5, 15, 25, 30],
      units: "mm/24h",
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

      <div class="legend-scale">
        {isDiscrete ? (
          <ul className="legend-discrete">
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
    </div>
  );
};

export default Legend;
