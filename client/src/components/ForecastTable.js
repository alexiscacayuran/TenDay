import React from "react";
import chroma from "chroma-js";

const overlayList = [
  {
    name: "temperature_average",
    pathName: "MEAN",
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
    mode: "hsl",
    classes: 15,
  },
  {
    name: "temperature_minimum",
    pathName: "MIN",
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
    domain: chroma.limits([0, 40], "e", 20).map(Math.round),
    mode: "hsl",
    classes: 15,
  },
  {
    name: "temperature_maximum",
    pathName: "MAX",
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
    domain: chroma.limits([0, 40], "e", 20).map(Math.round),
    mode: "hsl",
    classes: 15,
  },
  {
    name: "humidity",
    pathName: "RH",
    scale: ["#C7E9B4", "#7FCDBB", "#41B6C4", "#1D91C0", "#225EA8"],
    domain: [50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100],
    mode: "hsl",
    classes: 15,
  },
  {
    name: "wind",
    pathName: "WS",
    scale: [
      "mediumpurple",
      "slateBlue",
      "mediumseagreen",
      "darkorange",
      "mediumvioletred",
    ],
    domain: [
      0.65, 2.5, 4.45, 6.75, 9.4, 12.35, 15.55, 19, 22.65, 26.5, 30.6, 42,
    ],
    mode: "hsl",
    classes: 15,
  },
  {
    name: "rainfall",
    pathName: "TP",
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
    domain: [0, 5, 15, 37.5, 75, 150, 250, 400, 500],
    mode: "rgb",
    classes: 35,
  },
  {
    name: "cloud",
    pathName: "TCC",
    scale: [
      "SteelBlue",
      "lightsteelblue",
      chroma("linen").darken(0.2),
      "whitesmoke",
    ],
    domain: [0, 20, 50, 100],
    mode: "lab",
    classes: 15,
  },
];

const temperatureOverlay = overlayList.find(
  (o) => o.name === "temperature_average"
);

const colorScale = chroma
  .scale(temperatureOverlay.scale)
  .domain(temperatureOverlay.domain)
  .mode(temperatureOverlay.mode);

const getColorForTemperature = (temperature) => colorScale(temperature).css();

const getMedian = (a, b) => (a + b) / 2;

const ForecastTable = ({ forecast }) => {
  const [tempTypeIndex, setTempTypeIndex] = useState(0);

  const handleRowClick = () => {
    setTempTypeIndex((prevIndex) => (prevIndex + 1) % temperatureTypes.length);
  };

  return (
    <>
      <tr>
        <th onClick={handleRowClick} style={{ cursor: "pointer" }}>
          <Typography
            startDecorator={
              <FontAwesomeIcon
                icon={faCaretDown}
                style={{
                  fontSize: "1rem",
                  marginLeft: "12px",
                  color: "var(--joy-palette-primary-700, #12467B)",
                }}
              />
            }
            sx={{ justifyContent: "space-between" }}
            level="title-sm"
          >
            Temperature ({temperatureTypes[tempTypeIndex]})
          </Typography>
        </th>
        <th>
          <Button
            color="neutral"
            size="sm"
            variant="plain"
            sx={{ fontSize: "0.8rem" }}
          >
            &deg;C
          </Button>
        </th>
        {forecast.forecasts.map((data, index) => (
          <td key={index}>
            {data.temperature[temperatureTypes[tempTypeIndex]]}
          </td>
        ))}
      </tr>
      <tr>
        <th>
          <Typography level="title-sm">Rain</Typography>
        </th>
        <th>
          <Button
            color="neutral"
            onClick={function () {}}
            size="sm"
            variant="plain"
            sx={{ fontSize: "0.8rem" }}
          >
            mm/24h
          </Button>
        </th>
        {forecast.forecasts.map((data, index) => (
          <td key={index}>{data.rainfall.total}</td>
        ))}
      </tr>
      <tr>
        <th>
          <Typography level="title-sm">Humidity</Typography>
        </th>

        <th>
          {" "}
          <Button
            color="neutral"
            onClick={function () {}}
            size="sm"
            variant="plain"
            sx={{ fontSize: "0.8rem" }}
          >
            %
          </Button>
        </th>
        {forecast.forecasts.map((data, index) => (
          <td key={index}>{data.humidity}</td>
        ))}
      </tr>
      <tr>
        <th>
          <Typography level="title-sm">Wind speed</Typography>
        </th>
        <th>
          {" "}
          <Button
            color="neutral"
            onClick={function () {}}
            size="sm"
            variant="plain"
            sx={{ fontSize: "0.8rem" }}
          >
            m/s
          </Button>
        </th>
        {forecast.forecasts.map((data, index) => (
          <td key={index}>{data.wind.speed}</td>
        ))}
      </tr>
    </>
  );
};

export default ForecastTable;
