import React, { useEffect, useState } from "react";
import chroma from "chroma-js";
import overlayList from "./OverlayList";
import ToggleUnits from "./ToggleUnits";
import ForecastValue from "./ForecastValue";

const Legend = ({ isDiscrete, overlay, units, setUnits }) => {
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
    <div className="glass legend-container">
      <div className="legend-units">
        <span>
          <ToggleUnits
            context="legend"
            overlay={overlayData.name}
            units={units}
            setUnits={setUnits}
          />
        </span>
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
                <ForecastValue overlay={overlay} units={units} value={value} />
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
                <ForecastValue overlay={overlay} units={units} value={value} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Legend;
