import React from "react";
import { format } from "date-fns";
import Button from "@mui/joy/Button";
import Box from "@mui/joy/Box";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import CardOverflow from "@mui/joy/CardOverflow";
import IconButton from "@mui/joy/IconButton";
import Typography from "@mui/joy/Typography";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Stack } from "@mui/material";
import Skeleton from "@mui/joy/Skeleton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDroplet,
  faWind,
  faCloud,
  faCloudShowersHeavy,
} from "@fortawesome/free-solid-svg-icons";
import ForecastValue from "../utils/ForecastValue";
import ToggleUnits from "../utils/ToggleUnits";
import { useMediaQuery } from "@mui/material";

import {
  TMaxIcon,
  TMeanIcon,
  TMinIcon,
  NIcon,
  NNEIcon,
  NEIcon,
  ENEIcon,
  EIcon,
  ESEIcon,
  SEIcon,
  SSEIcon,
  SIcon,
  SSWIcon,
  SWIcon,
  WSWIcon,
  WIcon,
  WNWIcon,
  NWIcon,
  NNWIcon,
} from "../utils/CustomIcons";

const PopupContent = React.memo(
  ({
    forecast,
    setOpen,
    markerRef,
    handlePopupClose,
    overlay,
    forecastRetrieval,
    loading,
    units,
    setUnits,
  }) => {
    const isMobile = useMediaQuery((theme) => theme.breakpoints.down("md"));

    const OVERLAY_CONFIG = {
      temperature_mean: {
        title: "Mean Temperature",
        icon: (
          <TMeanIcon
            style={{
              fontSize: "1.5rem",
              color: !isMobile ? "#12467b" : "#32383E",
            }}
          />
        ),
        getValue: (data) => data.temperature.mean,
      },
      temperature_minimum: {
        title: "Min Temperature",
        icon: (
          <TMinIcon
            style={{
              fontSize: "1.5rem",
              color: !isMobile ? "#12467b" : "#32383E",
            }}
          />
        ),
        getValue: (data) => data.temperature.min,
      },
      temperature_maximum: {
        title: "Max Temperature",
        icon: (
          <TMaxIcon
            style={{
              fontSize: "1.5rem",
              color: !isMobile ? "#12467b" : "#32383E",
            }}
          />
        ),
        getValue: (data) => data.temperature.max,
      },
      humidity: {
        title: "Humidity",
        icon: (
          <FontAwesomeIcon
            icon={faDroplet}
            style={{
              fontSize: "1.5rem",
              color: !isMobile ? "#12467b" : "#32383E",
            }}
          />
        ),
        getValue: (data) => data.humidity,
      },
      wind: {
        title: "Wind",
        icon: (
          <FontAwesomeIcon
            icon={faWind}
            style={{
              fontSize: "1.5rem",
              color: !isMobile ? "#12467b" : "#32383E",
            }}
          />
        ),
        getValue: (data) => data.wind.speed,
        getDirection: (data) => data.wind.direction,
      },
      rainfall: {
        title: "Rainfall",
        icon: (
          <FontAwesomeIcon
            icon={faCloudShowersHeavy}
            style={{
              fontSize: "1.5rem",
              color: !isMobile ? "#12467b" : "#32383E",
            }}
          />
        ),
        getValue: (data) => data.rainfall.total,
      },
      cloud: {
        title: "Clouds",
        icon: (
          <FontAwesomeIcon
            icon={faCloud}
            style={{
              fontSize: "1.5rem",
              color: !isMobile ? "#12467b" : "#32383E",
            }}
          />
        ),
        getValue: (data) => data.cloud_cover,
      },
    };

    if (!forecastRetrieval) {
      return (
        <>
          {isMobile ? (
            <Card
              orientation="horizontal"
              className="glass"
              variant="plain"
              sx={{
                minWidth: 250,
                userSelect: "none",
                p: 1,
                borderRadius: "40px",
              }}
            >
              <Button
                color="inherit"
                size="sm"
                sx={{
                  position: "absolute",
                  top: -30,
                  right: 4,
                  color: "common.white",
                  textShadow: "2px 2px 4px rgba(0, 0, 0, 0.3)",
                }}
                onClick={handlePopupClose}
              >
                <CloseIcon sx={{ fontSize: "1.2rem" }} />
                Close
              </Button>

              <CardContent
                orientation="horizontal"
                sx={{ alignItems: "center", gap: 1 }}
              >
                <Box sx={{ m: 1 }}>
                  {loading ? (
                    <Skeleton variant="circular" width={34} height={34} />
                  ) : (
                    OVERLAY_CONFIG[overlay].icon
                  )}
                </Box>

                <Stack direction="column" sx={{ mr: 2 }}>
                  <Typography level="title-md" sx={{ fontWeight: "bold" }}>
                    <Skeleton
                      loading={loading}
                      sx={{ borderRadius: "md", opacity: 0.5 }}
                    >
                      {loading ? "Quezon City, Metro Manila" : "Oops, sorry..."}
                    </Skeleton>
                  </Typography>

                  {!loading && (
                    <Typography level="body-xs" sx={{ color: "neutral.700" }}>
                      No municipal level forecast available
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          ) : (
            // Original desktop version (unchanged)
            <Card
              className="glass"
              variant="plain"
              sx={{ minWidth: 365, userSelect: "none" }}
            >
              <Stack>
                <Typography level="title-lg">
                  <Skeleton
                    loading={loading}
                    sx={{ borderRadius: "md", opacity: 0.5 }}
                  >
                    {loading ? "Quezon City, Metro Manila" : "Oops, sorry..."}
                  </Skeleton>
                </Typography>
                <Typography level="body-sm">
                  <Skeleton
                    loading={loading}
                    sx={{ borderRadius: "md", opacity: 0.5 }}
                  >
                    {loading ? "Friday, February 14, 2024" : " "}
                  </Skeleton>
                </Typography>

                <IconButton
                  variant="plain"
                  color="inherit"
                  sx={{
                    position: "absolute",
                    top: "0.5rem",
                    right: "0.5rem",
                    fontSize: "1.5rem",
                  }}
                  onClick={handlePopupClose}
                >
                  <CloseIcon />
                </IconButton>
              </Stack>

              <CardOverflow
                color="neutral"
                variant="soft"
                sx={{ minHeight: 51 }}
              >
                <CardContent
                  orientation="horizontal"
                  sx={{ alignItems: "center" }}
                >
                  {loading ? (
                    <Skeleton variant="circular" width={34} height={34} />
                  ) : (
                    OVERLAY_CONFIG[overlay].icon
                  )}
                  {loading ? (
                    <Skeleton
                      variant="rectangular"
                      width={100}
                      height={30}
                      sx={{ borderRadius: "md" }}
                    />
                  ) : (
                    <Typography
                      level="body-sm"
                      sx={{ color: "var(--joy-palette-primary-700, #12467B)" }}
                    >
                      No municipal level forecast available
                    </Typography>
                  )}
                  {loading && (
                    <Skeleton
                      variant="rectangular"
                      width={106}
                      height={30}
                      sx={{ borderRadius: "md", ml: "auto" }}
                    />
                  )}
                </CardContent>
              </CardOverflow>
            </Card>
          )}
        </>
      );
    }

    return (
      <>
        {!isMobile && (
          <Card
            className="glass"
            variant="plain"
            sx={{ minWidth: 365, userSelect: "none" }}
          >
            <Stack>
              <Typography level="title-lg">
                {forecast.municity + ", " + forecast.province}
              </Typography>
              <Typography level="body-sm">
                {format(forecast.forecast.date, "EEEE, MMMM  d")}
              </Typography>

              <IconButton
                variant="plain"
                color="inherit"
                size="sm"
                sx={{ position: "absolute", top: "0.5rem", right: "0.5rem" }}
                onClick={handlePopupClose}
              >
                <CloseIcon
                  sx={{
                    fontSize: "1.5rem",
                    color: "var(--joy-palette-neutral-700, #32383E)",
                  }}
                />
              </IconButton>
            </Stack>

            <CardOverflow color="neutral" variant="soft">
              <CardContent
                orientation="horizontal"
                sx={{
                  alignItems: "center",
                  p: "5px 0",
                  flexWrap: "nowrap",
                  overflow: "hidden",
                }}
              >
                {OVERLAY_CONFIG[overlay].icon}

                <Box>
                  <Stack
                    direction="column"
                    spacing={0}
                    sx={{
                      justifyContent: "center",
                      alignItems: "flex-start",
                      position: "relative",
                      bottom: 7,
                    }}
                  >
                    <Typography
                      level="body-xs"
                      sx={{
                        position: "relative",
                        top: 7,
                        color: "var(--joy-palette-primary-700, #12467B)",
                      }}
                    >
                      {loading ? "Mean Temp" : OVERLAY_CONFIG[overlay].title}
                    </Typography>
                    <Typography
                      level={overlay === "cloud" ? "h4" : "h3"}
                      sx={{
                        fontSize: overlay === "cloud" && "1rem",
                        color: "#12467b",
                      }}
                    >
                      {loading ? (
                        "28°C"
                      ) : (
                        <>
                          <ForecastValue
                            value={OVERLAY_CONFIG[overlay].getValue(
                              forecast.forecast
                            )}
                            overlay={overlay}
                            units={units}
                          />
                          &nbsp;
                          <ToggleUnits
                            context="popup"
                            overlay={overlay}
                            units={units}
                            setUnits={setUnits}
                          />
                          &nbsp;
                          {overlay === "wind" &&
                            (() => {
                              const direction = OVERLAY_CONFIG[
                                overlay
                              ].getDirection(forecast.forecast);

                              const dirMap = {
                                N: NIcon,
                                NNE: NNEIcon,
                                NE: NEIcon,
                                ENE: ENEIcon,
                                E: EIcon,
                                ESE: ESEIcon,
                                SE: SEIcon,
                                SSE: SSEIcon,
                                S: SIcon,
                                SSW: SSWIcon,
                                SW: SWIcon,
                                WSW: WSWIcon,
                                W: WIcon,
                                WNW: WNWIcon,
                                NW: NWIcon,
                                NNW: NNWIcon,
                              };
                              const DirIcon = dirMap[direction];
                              return DirIcon ? (
                                <>
                                  &nbsp;
                                  <DirIcon
                                    sx={{ width: "15px", height: "auto" }}
                                  />
                                  &nbsp;
                                  <Typography
                                    level="body-lg"
                                    sx={{ color: "gray" }}
                                    component="span"
                                  >
                                    {direction}
                                  </Typography>
                                </>
                              ) : null;
                            })()}
                        </>
                      )}
                    </Typography>
                  </Stack>
                </Box>

                <Button
                  variant="solid"
                  size="sm"
                  color="primary"
                  aria-label="See Forecast"
                  sx={{
                    ml: "auto",
                    alignSelf: "center",
                    fontWeight: 600,
                    borderRadius: "lg",
                  }}
                  endDecorator={<ExpandMoreIcon sx={{ fontSize: "1.5rem" }} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    markerRef.current.closePopup();
                    setOpen(true);
                  }}
                >
                  Forecast
                </Button>
              </CardContent>
            </CardOverflow>
          </Card>
        )}

        {isMobile && (
          <Card
            orientation="horizontal"
            className="glass"
            variant="plain"
            sx={{
              minWidth: 280,
              userSelect: "none",
              p: 1,
              borderRadius: "40px",
            }}
          >
            <Button
              color="inherit"
              size="sm"
              sx={{
                position: "absolute",
                top: -30,
                right: 4,
                color: "common.white",
                textShadow: "2px 2px 4px rgba(0, 0, 0, 0.3)",
              }}
              onClick={handlePopupClose}
            >
              <CloseIcon sx={{ fontSize: "1.2rem" }} />
              Close
            </Button>

            <CardContent
              orientation="horizontal"
              sx={{ alignItems: "center", gap: 1 }}
            >
              <Box sx={{ m: 1 }}>{OVERLAY_CONFIG[overlay].icon}</Box>

              <Stack direction="column" sx={{ mr: "auto" }}>
                <Typography
                  level="title-sm"
                  sx={{
                    fontWeight: "bold",
                    color: "neutral.600",
                  }}
                >
                  <Skeleton loading={loading}>
                    {forecast.municity + ", " + forecast.province}
                  </Skeleton>
                </Typography>
                <Typography
                  level={overlay === "cloud" ? "h4" : "h3"}
                  sx={{
                    color: "neutral.700",
                  }}
                >
                  {loading ? (
                    "28°C"
                  ) : (
                    <>
                      <ForecastValue
                        value={OVERLAY_CONFIG[overlay].getValue(
                          forecast.forecast
                        )}
                        overlay={overlay}
                        units={units}
                      />
                      &nbsp;
                      <ToggleUnits
                        context="popup"
                        overlay={overlay}
                        units={units}
                        setUnits={setUnits}
                      />
                      {overlay === "wind" &&
                        (() => {
                          const direction = OVERLAY_CONFIG[
                            overlay
                          ].getDirection(forecast.forecast);
                          const dirMap = {
                            N: NIcon,
                            NNE: NNEIcon,
                            NE: NEIcon,
                            ENE: ENEIcon,
                            E: EIcon,
                            ESE: ESEIcon,
                            SE: SEIcon,
                            SSE: SSEIcon,
                            S: SIcon,
                            SSW: SSWIcon,
                            SW: SWIcon,
                            WSW: WSWIcon,
                            W: WIcon,
                            WNW: WNWIcon,
                            NW: NWIcon,
                            NNW: NNWIcon,
                          };
                          const DirIcon = dirMap[direction];
                          return DirIcon ? (
                            <>
                              &nbsp;
                              <DirIcon sx={{ width: "14px", height: "auto" }} />
                              &nbsp;
                              <Typography
                                level="body-lg"
                                sx={{ display: "inline", color: "gray" }}
                              >
                                {direction}
                              </Typography>
                            </>
                          ) : null;
                        })()}
                    </>
                  )}
                </Typography>
              </Stack>
              <IconButton
                color="primary"
                variant="solid"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  markerRef.current.closePopup();
                  setOpen(true);
                }}
                sx={{ color: "common.white", borderRadius: "20px", m: 1 }}
              >
                <ExpandMoreIcon sx={{ fontSize: "1.5rem" }} />
              </IconButton>
            </CardContent>
          </Card>
        )}
      </>
    );
  },

  (prevProps, nextProps) =>
    prevProps.forecast === nextProps.forecast &&
    prevProps.overlay === nextProps.overlay &&
    prevProps.units === nextProps.units
);

export default PopupContent;
