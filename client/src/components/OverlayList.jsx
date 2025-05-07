import chroma from "chroma-js";

const lighten = (color) => {
  return chroma(color).brighten(0.2).saturate(0.4).hex();
};

const darken = (color) => {
  return chroma(color).darken(0.4).hex();
};

const overlayList = [
  {
    name: "temperature_mean",
    pathName: "TMEAN",
    scale: [
      darken("#0031FF"),
      darken("#0061FF"),
      darken("#0092FF"),
      darken("#00C2FF"),
      darken("#00F3FF"),
      darken("#24FFDB"),
      darken("#55FFAA"),
      darken("#86FF79"),
      darken("#B6FF49"),
      darken("#E7FF18"),
      darken("#FFF600"),
      darken("#FFE500"),
      darken("#FFD400"),
      darken("#FFC300"),
      darken("#FFB200"),
      darken("#FF9D00"),
      darken("#FF7E00"),
      darken("#FF5E00"),
      darken("#FF3F00"),
      darken("#FF1F00"),
    ],
    domain: chroma.limits([0, 40], "e", 10).map(Math.round),
    mode: "hsl",
    classes: 15,
    units: "°C", //needs to be a toggle, should be a switch statement
    height: "320px",
  },
  {
    name: "temperature_minimum",
    pathName: "TMIN",
    scale: [
      darken("#0031FF"),
      darken("#0061FF"),
      darken("#0092FF"),
      darken("#00C2FF"),
      darken("#00F3FF"),
      darken("#24FFDB"),
      darken("#55FFAA"),
      darken("#86FF79"),
      darken("#B6FF49"),
      darken("#E7FF18"),
      darken("#E7FF18"),
      darken("#FFE500"),
      darken("#FFD400"),
      darken("#FFC300"),
      darken("#FFB200"),
      darken("#FF9D00"),
      darken("#FF7E00"),
      darken("#FF5E00"),
      darken("#FF3F00"),
      darken("#FF1F00"),
    ],
    domain: chroma.limits([0, 40], "e", 10).map(Math.round),
    mode: "hsl",
    classes: 15,
    units: "°C",
    height: "320px",
  },
  {
    name: "temperature_maximum",
    pathName: "TMAX",
    scale: [
      darken("#0031FF"),
      darken("#0061FF"),
      darken("#0092FF"),
      darken("#00C2FF"),
      darken("#00F3FF"),
      darken("#24FFDB"),
      darken("#55FFAA"),
      darken("#86FF79"),
      darken("#B6FF49"),
      darken("#E7FF18"),
      darken("#E7FF18"),
      darken("#FFE500"),
      darken("#FFD400"),
      darken("#FFC300"),
      darken("#FFB200"),
      darken("#FF9D00"),
      darken("#FF7E00"),
      darken("#FF5E00"),
      darken("#FF3F00"),
      darken("#FF1F00"),
    ],
    domain: chroma.limits([0, 40], "e", 10).map(Math.round),
    mode: "hsl",
    classes: 15,
    units: "°C",
    height: "320px",
  },
  {
    name: "humidity",
    pathName: "RH",
    scale: [
      darken("#f03b20"),
      darken("#fd8d3c"),
      darken("#feb24c"),
      darken("#fed976"),
      darken("#ffffb2"),
      darken("#c7e9b4"),
      darken("#7fcdbb"),
      darken("#41b6c4"),
      darken("#1d91c0"),
      darken("#225ea8"),
    ],
    domain: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
    mode: "hsl",
    classes: 15,
    units: "%",
    height: "320px",
  },
  {
    name: "wind",
    pathName: "WS",
    scale: [
      lighten("#6271b8"),
      lighten("#427ca5"),
      lighten("#4a9295"),
      lighten("#4c9e59"),
      lighten("#5aa340"),
      lighten("#9b8b3f"),
      lighten("#96565b"),
      lighten("#924575"),
      lighten("#795798"),
      lighten("#5e6aa0"),
      lighten("#5b789d"),
      lighten("#5b88a1"),
    ],
    domain: [
      0.65, 2.5, 4.45, 6.75, 9.4, 12.35, 15.55, 19, 22.65, 26.5, 30.6, 42,
    ].map(Math.round),
    mode: "hsl",
    classes: 15,
    units: "m/s",
    height: "320px",
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
    units: "mm/24h",
    height: "320px",
  },

  {
    name: "cloud",
    pathName: "TCC",
    scale: [
      darken("SteelBlue"),
      darken("lightsteelblue"),
      darken(chroma("linen").darken(0.1)),
      darken("whitesmoke"),
    ],
    domain: chroma.limits([0, 100], "e", 10),
    mode: "lab",
    classes: 15,
    units: "%",
    height: "320px",
  },
];

// Function to get the correct color scale
export const getColorScale = (overlayName) => {
  const overlay = overlayList.find((o) => o.name === overlayName);
  if (!overlay) {
    console.error(`Overlay not found: ${overlayName}`);
    return chroma.scale(["#ffffff", "#000000"]).domain([0, 1]); // Fallback grayscale
  }
  return chroma.scale(overlay.scale).domain(overlay.domain).mode(overlay.mode);
};

// "#87CEFA",
//   "#7FFFD4",
//   "#90EE90",
//   "#00FF7F",
//   "#00DC00",
//   "#7CFC00",
//   "#E6DC32",
//   "#DAA520",
//   "#FF8C00",
//   "#FF4500",
//   "#FA3C3C",
//   "#F00082";

export default overlayList;
