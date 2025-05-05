import React from "react";
import {
  Page,
  Image,
  Text,
  View,
  Document,
  StyleSheet,
  Font,
  PDFViewer,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import PAGASA from "../assets/logo/pagasa-logo.png";
import BagongPilipinas from "../assets/logo/bagong-pilipinas-logo.png";
import {
  SunnyIconPDF,
  NoRainParCloudyIconPDF,
  NoRainMosCloudyIconPDF,
  NoRainCloudyIconPDF,
  LightRainsParCloudyIconPDF,
  LightRainsMosCloudyIconPDF,
  LightRainsCloudyIconPDF,
  ModRainsParCloudyIconPDF,
  ModRainsMosCloudyIconPDF,
  ModRainsCloudyIconPDF,
  HeavyRainsParCloudyIconPDF,
  HeavyRainsMosCloudyIconPDF,
  HeavyRainsCloudyIconPDF,
  SunnyIconLgPDF,
  NoRainParCloudyIconLgPDF,
  NoRainMosCloudyIconLgPDF,
  NoRainCloudyIconLgPDF,
  LightRainsParCloudyIconLgPDF,
  LightRainsMosCloudyIconLgPDF,
  LightRainsCloudyIconLgPDF,
  ModRainsParCloudyIconLgPDF,
  ModRainsMosCloudyIconLgPDF,
  ModRainsCloudyIconLgPDF,
  HeavyRainsParCloudyIconLgPDF,
  HeavyRainsMosCloudyIconLgPDF,
  HeavyRainsCloudyIconLgPDF,
  NIconPDF,
  NNEIconPDF,
  NEIconPDF,
  ENEIconPDF,
  EIconPDF,
  ESEIconPDF,
  SEIconPDF,
  SSEIconPDF,
  SIconPDF,
  SSWIconPDF,
  SWIconPDF,
  WSWIconPDF,
  WIconPDF,
  WNWIconPDF,
  NWIconPDF,
  NNWIconPDF,
} from "./CustomIcons";
import VerticalBarGraph from "./VerticalBarGraph";
import OverlayList, { getColorScale } from "./OverlayList";
import { convertValue } from "./ForecastValue";
import chroma from "chroma-js";

Font.register({
  family: "Rubik",
  fonts: [
    {
      src: "http://fonts.gstatic.com/s/rubik/v3/o1vXYO8YwDpErHEAPAxpOg.ttf", // Light 300
      fontWeight: "light",
    },
    {
      src: "http://fonts.gstatic.com/s/rubik/v3/4sMyW_teKWHB3K8Hm-Il6A.ttf", // Regular 400
      fontWeight: "regular",
    },
    {
      src: "http://fonts.gstatic.com/s/rubik/v3/m1GGHcpLe6Mb0_sAyjXE4g.ttf", // Bold 700
      fontWeight: "bold",
    },
  ],
});

// Define PDF styles
const styles = StyleSheet.create({
  page: { padding: 20, family: "Rubik" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between", // Space out the logos
    alignItems: "center",
  },
  logo: {
    width: 35, // Adjust size
    height: "auto",
  },
  logoTextContainer: {
    flexGrow: 1,
    textAlign: "left",
    marginLeft: 10,
  },

  logoText: {
    fontSize: 7,
    fontWeight: 400,
  },

  hero: {
    marginTop: 20,
    display: "flex",
    alignItems: "center",
    flexDirection: "row",
  },

  heroAlt: {
    marginTop: 20,
    flexDirection: "column",
  },

  heroTitleContainer: {
    flexGrow: 1,
  },

  heroTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#3e7bff",
    maxWidth: "100%",
  },

  todayContainer: {
    flexGrow: 1,
    backgroundColor: "#f5f8ff",
    padding: "10px 20px",
  },

  todayContainerAlt: {
    marginTop: 10,
    backgroundColor: "#f5f8ff",
    padding: "10px 20px",
    width: "100%",
  },

  todayDate: {
    fontSize: 7,
    fontWeight: 700,
    color: "#3e7bff",
  },

  weatherParamsContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  weatherParamsContainerAlt: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: "0 60px",
  },

  weatherParamContainer: {
    display: "flex",
    flexDirection: "row",
    marginTop: 10,
    alignItems: "center",
  },

  weatherParamLogo: {
    marginRight: 10,
  },

  weatherParamText: {
    fontWeight: 400,
    color: "#595959",
  },

  titleContainer: {
    marginTop: 20,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },

  dateContainer: {
    display: "flex",
    alignItems: "flex-end",
  },

  dateTextContainer: {
    display: "flex",
    flexDirection: "row",
    width: "120px",
    justifyContent: "space-between",
  },

  dateText: {
    fontWeight: 400,
    fontSize: 7,
    color: "#32383E",
  },

  tableContainer: {
    marginTop: 20,
    borderTop: "1px solid #bfbfbf",
    borderLeft: "1px solid #bfbfbf",
  },

  table: {
    display: "table",
    width: "100%",
  },

  tableRow: {
    flexDirection: "row",
  },

  tableHeader: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#3e7bff",
    width: "10%",
    backgroundColor: "#F5F8FF",
    padding: 5,
    borderRight: "1px solid #bfbfbf",
    borderBottom: "1px solid #bfbfbf",
    textAlign: "center",
  },

  tableHeaderColumn: { width: "20%", color: "#32383E", textAlign: "right" },

  tableUnitsColumn: { width: "10%", color: "#32383E", textAlign: "left" },

  tableCell: {
    fontSize: 8,
    fontWeight: 400,
    color: "#32383E",
    width: "10%",
    padding: 5,
    borderRight: "1px solid #bfbfbf",
    borderBottom: "1px solid #bfbfbf",
    textAlign: "center",
    alignItems: "center",
  },

  tableHeaderMerge: { borderBottom: "1px solid #F5F8FF" },
  tableCellMerge: { borderBottom: "1px solid white" },

  tableWeatherIcon: {
    width: "20px",
  },

  tableDirectionIcon: {
    width: "12px",
  },

  tableFooter: {
    display: "flex",
    flexDirection: "row",
    fontSize: 7,
    flexGrow: 1,
    justifyContent: "flex-end",
    marginTop: 3,
  },
});

const bgColor = (value, overlay, docColored) => {
  const colorScale = getColorScale(overlay);
  return {
    backgroundColor: docColored ? colorScale(value).hex() : "transparent",
    color:
      chroma.deltaE(colorScale(value), "white") <= 40 ? "#32383E" : "white",
  };
};

export const ReportViewer = ({ forecast, docUnits, location, docColored }) => (
  <div
    style={{
      width: "700px",
      height: "800px",
      position: "fixed",
      zIndex: 999999,
      top: -300,
      left: -750,
    }}
  >
    <PDFViewer width="100%" height="100%">
      <ForecastReportPDF
        location={location}
        forecast={forecast}
        docUnits={docUnits}
        docColored={docColored}
      />
    </PDFViewer>
  </div>
);

const ForecastReportPDF = ({ location, forecast, docUnits, docColored }) => {
  const municity = forecast.municity;

  const heroStyle = municity.length >= 12 ? styles.heroAlt : styles.hero;
  const todayContainerStyle =
    municity.length >= 12 ? styles.todayContainerAlt : styles.todayContainer;

  const weatherParamsContainerStyle =
    municity.length >= 12
      ? styles.weatherParamsContainerAlt
      : styles.weatherParamsContainer;

  const todayForecast = forecast.forecasts.find(
    (f) =>
      format(new Date(f.date), "yyyy-MM-dd") ===
      format(new Date(), "yyyy-MM-dd")
  );

  const renderWeatherIcon = () => {
    if (!todayForecast) return null;

    switch (todayForecast.rainfall.description) {
      case "NO RAIN":
        switch (todayForecast.cloud_cover) {
          case "SUNNY":
            return <SunnyIconLgPDF />;
          case "PARTLY CLOUDY":
            return <NoRainParCloudyIconLgPDF />;
          case "MOSTLY CLOUDY":
            return <NoRainMosCloudyIconLgPDF />;
          case "CLOUDY":
            return <NoRainCloudyIconLgPDF />;
          default:
            return null;
        }
      case "LIGHT RAINS":
        switch (todayForecast.cloud_cover) {
          case "SUNNY":
            return <LightRainsParCloudyIconLgPDF />;
          case "PARTLY CLOUDY":
            return <LightRainsParCloudyIconLgPDF />;
          case "MOSTLY CLOUDY":
            return <LightRainsMosCloudyIconLgPDF />;
          case "CLOUDY":
            return <LightRainsCloudyIconLgPDF />;
          default:
            return null;
        }
      case "MODERATE RAINS":
        switch (todayForecast.cloud_cover) {
          case "SUNNY":
            return <ModRainsParCloudyIconLgPDF />;
          case "PARTLY CLOUDY":
            return <ModRainsParCloudyIconLgPDF />;
          case "MOSTLY CLOUDY":
            return <ModRainsMosCloudyIconLgPDF />;
          case "CLOUDY":
            return <ModRainsCloudyIconLgPDF />;
          default:
            return null;
        }
      case "HEAVY RAINS":
        switch (todayForecast.cloud_cover) {
          case "SUNNY":
            return <HeavyRainsParCloudyIconLgPDF />;
          case "PARTLY CLOUDY":
            return <HeavyRainsParCloudyIconLgPDF />;
          case "MOSTLY CLOUDY":
            return <HeavyRainsMosCloudyIconLgPDF />;
          case "CLOUDY":
            return <HeavyRainsCloudyIconLgPDF />;
          default:
            return null;
        }
      default:
        return null;
    }
  };

  const renderWindIcon = () => {
    if (!todayForecast) return null;

    const width = { width: "20px" };

    switch (todayForecast.wind.direction) {
      case "N":
        return <NIconPDF style={width} />;
      case "NNE":
        return <NNEIconPDF style={width} />;
      case "NE":
        return <NEIconPDF style={width} />; // Northeast
      case "ENE":
        return <ENEIconPDF style={width} />; // East-Northeast
      case "E":
        return <EIconPDF style={width} />; // East
      case "ESE":
        return <ESEIconPDF style={width} />; // East-Southeast
      case "SE":
        return <SEIconPDF style={width} />; // Southeast
      case "SSE":
        return <SSEIconPDF style={width} />; // South-Southeast
      case "S":
        return <SIconPDF style={width} />; // South
      case "SSW":
        return <SSWIconPDF style={width} />; // South-Southwest
      case "SW":
        return <SWIconPDF style={width} />; // Southwest
      case "WSW":
        return <WSWIconPDF style={width} />; // West-Southwest
      case "W":
        return <WIconPDF style={width} />; // West
      case "WNW":
        return <WNWIconPDF style={width} />; // West-Northwest
      case "NW":
        return <NWIconPDF style={width} />; // Northwest
      case "NNW":
        return <NNWIconPDF style={width} />; // North-Northwest
      default:
        return null;
    }
  };

  const renderWindText = () => {
    const { direction } = todayForecast.wind;

    const directionText = {
      N: "NORTH",
      NNE: "NORTH-NORTHEAST",
      NE: "NORTHEAST",
      ENE: "EAST-NORTHEAST",
      E: "EAST",
      ESE: "EAST-SOUTHEAST",
      SE: "SOUTHEAST",
      SSE: "SOUTH-SOUTHEAST",
      S: "SOUTH",
      SSW: "SOUTH-SOUTHWEST",
      SW: "SOUTHWEST",
      WSW: "WEST-SOUTHWEST",
      W: "WEST",
      WNW: "WEST-NORTHWEST",
      NW: "NORTHWEST",
      NNW: "NORTH-NORTHWEST",
    };

    return directionText[direction] || "";
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src={PAGASA} style={styles.logo} />

          <View style={styles.logoTextContainer}>
            <Text style={styles.logoText}>Republic of the Philippines</Text>
            <Text style={[styles.logoText, { fontWeight: "bold" }]}>
              DEPARTMENT OF SCIENCE AND TECHNOLOGY
            </Text>
            <Text style={[styles.logoText, { width: 200, fontWeight: "bold" }]}>
              Philippine Atmospheric, Geophysical, and Astronomical Services
              Administration (PAGASA)
            </Text>
          </View>

          <Image src={BagongPilipinas} style={[styles.logo, { width: 55 }]} />
        </View>

        <View style={heroStyle}>
          <View style={styles.heroTitleContainer}>
            <Text style={styles.dateText}>
              {"LAT " + location?.latLng.lat.toFixed(2) + "  "}
              {"LONG " + location?.latLng.lng.toFixed(2)}
            </Text>
            <Text style={[styles.heroTitle, { marginTop: 10 }]}>
              {forecast.municity}
            </Text>
            <Text style={[styles.heroTitle, { fontSize: 9 }]}>
              {forecast.province}
            </Text>
          </View>

          <View style={todayContainerStyle}>
            <Text style={styles.todayDate}>
              {"TODAY " + format(new Date(), "MMM d").toUpperCase()}
            </Text>
            <View style={weatherParamsContainerStyle}>
              <View style={styles.weatherParamContainer}>
                <View style={styles.weatherParamLogo}>
                  {renderWeatherIcon()}
                </View>
                <View>
                  <Text style={[styles.weatherParamText, { fontSize: 16 }]}>
                    {convertValue(
                      "temperature",
                      docUnits,
                      todayForecast?.temperature.mean
                    ) +
                      " " +
                      docUnits?.temperature}
                  </Text>
                  <Text
                    style={[
                      styles.weatherParamText,
                      { fontSize: 6.5, width: "80px" },
                    ]}
                  >
                    {todayForecast?.cloud_cover +
                      (todayForecast?.rainfall.description === "NO RAIN"
                        ? ""
                        : " WITH " + todayForecast?.rainfall.description)}
                  </Text>
                </View>
              </View>
              <View style={styles.weatherParamContainer}>
                <View style={styles.weatherParamLogo}>{renderWindIcon()}</View>
                <View>
                  <Text style={[styles.weatherParamText, { fontSize: 16 }]}>
                    {convertValue("wind", docUnits, todayForecast?.wind.speed) +
                      " " +
                      docUnits?.windSpeed}
                  </Text>
                  <Text style={[styles.weatherParamText, { fontSize: 6.5 }]}>
                    {renderWindText()}
                  </Text>
                </View>
              </View>

              <View style={styles.weatherParamContainer}>
                <View style={styles.weatherParamLogo}>
                  <VerticalBarGraph
                    value={todayForecast?.humidity}
                    maxHeight={30}
                    width={10}
                  />
                </View>
                <View
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "flex-end",
                  }}
                >
                  <Text style={[styles.weatherParamText, { fontSize: 16 }]}>
                    {todayForecast?.humidity + "% "}
                  </Text>
                  <Text style={[styles.weatherParamText, { fontSize: 8 }]}>
                    humid
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.titleContainer}>
          <View style={[styles.dateText, { flexGrow: 1 }]}>
            <Text>10-DAY CLIMATE FORECAST</Text>
          </View>
          <View>
            <View style={styles.dateContainer}>
              <View style={styles.dateTextContainer}>
                <Text style={styles.dateText}>Forecast date</Text>
                <Text style={styles.dateText}>
                  {format(forecast.forecasts[0].start_date, "MMMM d, yyy")}
                </Text>
              </View>
              <View style={styles.dateTextContainer}>
                <Text style={styles.dateText}>Valid until</Text>
                <Text style={styles.dateText}>
                  {format(forecast.forecasts[9].date, "MMMM d, yyy")}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.tableContainer}>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={[styles.tableHeader, styles.tableHeaderColumn]} />
              <Text
                style={[styles.tableHeader, styles.tableUnitsColumn]}
              ></Text>
              {forecast.forecasts.map((data) => (
                <Text style={styles.tableHeader}>
                  {format(data.date, "EEE d")}
                </Text>
              ))}
            </View>

            <View style={styles.tableRow}>
              <Text
                style={[
                  styles.tableHeader,
                  styles.tableHeaderColumn,
                  styles.tableHeaderMerge,
                ]}
              />
              <Text
                style={[
                  styles.tableHeader,
                  styles.tableUnitsColumn,
                  styles.tableHeaderMerge,
                ]}
              ></Text>
              {forecast.forecasts.map((data) => (
                <View style={[styles.tableCell, styles.tableCellMerge]}>
                  {(() => {
                    switch (data.rainfall.description) {
                      case "NO RAIN":
                        switch (data.cloud_cover) {
                          case "SUNNY":
                            return (
                              <SunnyIconPDF style={styles.tableWeatherIcon} />
                            );
                          case "PARTLY CLOUDY":
                            return (
                              <NoRainParCloudyIconPDF
                                style={styles.tableWeatherIcon}
                              />
                            );
                          case "MOSTLY CLOUDY":
                            return (
                              <NoRainMosCloudyIconPDF
                                style={styles.tableWeatherIcon}
                              />
                            );
                          case "CLOUDY":
                            return (
                              <NoRainCloudyIconPDF
                                style={styles.tableWeatherIcon}
                              />
                            );
                          default:
                            return null;
                        }
                      case "LIGHT RAINS":
                        switch (data.cloud_cover) {
                          case "SUNNY":
                            return (
                              <LightRainsParCloudyIconPDF
                                style={styles.tableWeatherIcon}
                              />
                            );
                          case "PARTLY CLOUDY":
                            return (
                              <LightRainsParCloudyIconPDF
                                style={styles.tableWeatherIcon}
                              />
                            );
                          case "MOSTLY CLOUDY":
                            return (
                              <LightRainsMosCloudyIconPDF
                                style={styles.tableWeatherIcon}
                              />
                            );
                          case "CLOUDY":
                            return (
                              <LightRainsCloudyIconPDF
                                style={styles.tableWeatherIcon}
                              />
                            );
                          default:
                            return null;
                        }
                      case "MODERATE RAINS":
                        switch (data.cloud_cover) {
                          case "SUNNY":
                            return (
                              <ModRainsParCloudyIconPDF
                                style={styles.tableWeatherIcon}
                              />
                            );
                          case "PARTLY CLOUDY":
                            return (
                              <ModRainsParCloudyIconPDF
                                style={styles.tableWeatherIcon}
                              />
                            );
                          case "MOSTLY CLOUDY":
                            return (
                              <ModRainsMosCloudyIconPDF
                                style={styles.tableWeatherIcon}
                              />
                            );
                          case "CLOUDY":
                            return (
                              <ModRainsCloudyIconPDF
                                style={styles.tableWeatherIcon}
                              />
                            );
                          default:
                            return null;
                        }
                      case "HEAVY RAINS":
                        switch (data.cloud_cover) {
                          case "SUNNY":
                            return (
                              <HeavyRainsParCloudyIconPDF
                                style={styles.tableWeatherIcon}
                              />
                            );
                          case "PARTLY CLOUDY":
                            return (
                              <HeavyRainsParCloudyIconPDF
                                style={styles.tableWeatherIcon}
                              />
                            );
                          case "MOSTLY CLOUDY":
                            return (
                              <HeavyRainsMosCloudyIconPDF
                                style={styles.tableWeatherIcon}
                              />
                            );
                          case "CLOUDY":
                            return (
                              <HeavyRainsCloudyIconPDF
                                style={styles.tableWeatherIcon}
                              />
                            );
                          default:
                            return null;
                        }
                      default:
                        return null;
                    }
                  })()}
                </View>
              ))}
            </View>

            <View style={[styles.tableRow]}>
              <Text
                style={[
                  styles.tableHeader,
                  styles.tableHeaderColumn,
                  styles.tableHeaderMerge,
                ]}
              >
                Rainfall
              </Text>
              <Text
                style={[
                  styles.tableHeader,
                  styles.tableUnitsColumn,
                  styles.tableHeaderMerge,
                ]}
              >
                {docUnits.rainfall}
              </Text>
              {forecast.forecasts.map((data) => (
                <Text
                  style={[
                    styles.tableCell,
                    styles.tableCellMerge,
                    bgColor(data.rainfall.total, "rainfall", docColored),
                  ]}
                >
                  {convertValue("rainfall", docUnits, data.rainfall.total)}
                </Text>
              ))}
            </View>

            <View style={styles.tableRow}>
              <Text
                style={[
                  styles.tableHeader,
                  styles.tableHeaderColumn,
                  styles.tableHeaderMerge,
                ]}
              >
                Rainfall
              </Text>
              <Text
                style={[
                  styles.tableHeader,
                  styles.tableUnitsColumn,
                  styles.tableHeaderMerge,
                ]}
              >
                desc
              </Text>
              {forecast.forecasts.map((data) => (
                <Text
                  style={[
                    styles.tableCell,
                    styles.tableCellMerge,
                    { fontSize: 6 },
                  ]}
                >
                  {data.rainfall.description}
                </Text>
              ))}
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableHeader, styles.tableHeaderColumn]}>
                Cloud cover
              </Text>
              <Text style={[styles.tableHeader, styles.tableUnitsColumn]}>
                desc
              </Text>
              {forecast.forecasts.map((data) => (
                <Text style={[styles.tableCell, { fontSize: 6 }]}>
                  {data.cloud_cover}
                </Text>
              ))}
            </View>

            <View style={styles.tableRow}>
              <Text
                style={[
                  styles.tableHeader,
                  styles.tableHeaderColumn,
                  styles.tableHeaderMerge,
                ]}
              >
                Max temperature
              </Text>
              <Text
                style={[
                  styles.tableHeader,
                  styles.tableUnitsColumn,
                  styles.tableHeaderMerge,
                ]}
              >
                {docUnits.temperature}
              </Text>
              {forecast.forecasts.map((data) => (
                <Text
                  style={[
                    styles.tableCell,
                    styles.tableCellMerge,
                    bgColor(
                      data.temperature.max,
                      "temperature_maximum",
                      docColored
                    ),
                  ]}
                >
                  {convertValue("temperature", docUnits, data.temperature.max)}
                </Text>
              ))}
            </View>

            <View style={styles.tableRow}>
              <Text
                style={[
                  styles.tableHeader,
                  styles.tableHeaderColumn,
                  styles.tableHeaderMerge,
                ]}
              >
                Mean temperature
              </Text>
              <Text
                style={[
                  styles.tableHeader,
                  styles.tableUnitsColumn,
                  styles.tableHeaderMerge,
                ]}
              >
                {docUnits.temperature}
              </Text>
              {forecast.forecasts.map((data) => (
                <Text
                  style={[
                    styles.tableCell,
                    styles.tableCellMerge,
                    bgColor(
                      data.temperature.mean,
                      "temperature_mean",
                      docColored
                    ),
                  ]}
                >
                  {convertValue("temperature", docUnits, data.temperature.mean)}
                </Text>
              ))}
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableHeader, styles.tableHeaderColumn]}>
                Min temperature
              </Text>
              <Text style={[styles.tableHeader, styles.tableUnitsColumn]}>
                {docUnits.temperature}
              </Text>
              {forecast.forecasts.map((data) => (
                <Text
                  style={[
                    styles.tableCell,
                    bgColor(
                      data.temperature.min,
                      "temperature_minimum",
                      docColored
                    ),
                  ]}
                >
                  {convertValue("temperature", docUnits, data.temperature.min)}
                </Text>
              ))}
            </View>

            <View style={styles.tableRow}>
              <Text
                style={[
                  styles.tableHeader,
                  styles.tableHeaderColumn,
                  styles.tableHeaderMerge,
                ]}
              >
                Wind speed
              </Text>
              <Text
                style={[
                  styles.tableHeader,
                  styles.tableUnitsColumn,
                  styles.tableHeaderMerge,
                ]}
              >
                {docUnits.windSpeed}
              </Text>
              {forecast.forecasts.map((data) => (
                <Text
                  style={[
                    styles.tableCell,
                    styles.tableCellMerge,
                    bgColor(data.wind.speed, "wind", docColored),
                  ]}
                >
                  {convertValue("wind", docUnits, data.wind.speed)}
                </Text>
              ))}
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableHeader, styles.tableHeaderColumn]}>
                Wind direction
              </Text>
              <Text style={[styles.tableHeader, styles.tableUnitsColumn]}>
                {docUnits.windDirection}
              </Text>
              {forecast.forecasts.map((data) => (
                <View style={styles.tableCell}>
                  {docUnits.windDirection === "arrow" ? (
                    (() => {
                      switch (data.wind.direction) {
                        case "N":
                          return <NIconPDF style={styles.tableDirectionIcon} />;
                        case "NNE":
                          return (
                            <NNEIconPDF style={styles.tableDirectionIcon} />
                          );
                        case "NE":
                          return (
                            <NEIconPDF style={styles.tableDirectionIcon} />
                          ); // Northeast
                        case "ENE":
                          return (
                            <ENEIconPDF style={styles.tableDirectionIcon} />
                          ); // East-Northeast
                        case "E":
                          return <EIconPDF style={styles.tableDirectionIcon} />; // East
                        case "ESE":
                          return (
                            <ESEIconPDF style={styles.tableDirectionIcon} />
                          ); // East-Southeast
                        case "SE":
                          return (
                            <SEIconPDF style={styles.tableDirectionIcon} />
                          ); // Southeast
                        case "SSE":
                          return (
                            <SSEIconPDF style={styles.tableDirectionIcon} />
                          ); // South-Southeast
                        case "S":
                          return <SIconPDF style={styles.tableDirectionIcon} />; // South
                        case "SSW":
                          return (
                            <SSWIconPDF style={styles.tableDirectionIcon} />
                          ); // South-Southwest
                        case "SW":
                          return (
                            <SWIconPDF style={styles.tableDirectionIcon} />
                          ); // Southwest
                        case "WSW":
                          return (
                            <WSWIconPDF style={styles.tableDirectionIcon} />
                          ); // West-Southwest
                        case "W":
                          return <WIconPDF style={styles.tableDirectionIcon} />; // West
                        case "WNW":
                          return (
                            <WNWIconPDF style={styles.tableDirectionIcon} />
                          ); // West-Northwest
                        case "NW":
                          return (
                            <NWIconPDF style={styles.tableDirectionIcon} />
                          ); // Northwest
                        case "NNW":
                          return (
                            <NNWIconPDF style={styles.tableDirectionIcon} />
                          ); // North-Northwest
                        default:
                          return null;
                      }
                    })()
                  ) : (
                    <Text>{data.wind.direction}</Text>
                  )}
                </View>
              ))}
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableHeader, styles.tableHeaderColumn]}>
                Humidity
              </Text>
              <Text style={[styles.tableHeader, styles.tableUnitsColumn]}>
                %
              </Text>
              {forecast.forecasts.map((data) => (
                <Text
                  style={[
                    styles.tableCell,
                    bgColor(data.humidity, "humidity", docColored),
                  ]}
                >
                  {data.humidity}
                </Text>
              ))}
            </View>
          </View>
        </View>
        <View style={styles.tableFooter}>
          <Text>Forecast data is based on GFS by NOAA</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ForecastReportPDF;
