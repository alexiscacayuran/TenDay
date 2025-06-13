import React, { useState, useEffect, Fragment, useRef } from "react";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Modal,
  ModalDialog,
  DialogTitle,
  DialogContent,
  FormControl,
  FormLabel,
  Button,
  Radio,
  ToggleButtonGroup,
  Select,
  Option,
  Switch,
  Sheet,
} from "@mui/joy";

import DownloadIcon from "@mui/icons-material/Download";
import ForecastDownload from "./ForecastDownload";
import MunicitiesSelector from "./MunicitiesSelector";

const DownloadDialog = ({ units, location, forecast, serverToken }) => {
  const isTablet = useMediaQuery((theme) => theme.breakpoints.up("md"));

  const [openDownload, setOpenDownload] = useState(false);
  const [selectedUnits, setSelectedUnits] = useState("current");
  const [docUnits, setDocUnits] = useState(units);
  const [docFormat, setDocFormat] = useState("pdf");
  const [docColored, setDocColored] = useState(true);
  const [docExtendForecast, setDocExtendForecast] = useState(false);
  const [selectedMunicities, setSelectedMunicities] = useState([]);

  useEffect(() => {
    setDocUnits(units);
  }, [units]);

  const handleChange = (event, value) => {
    setDocFormat(value);
  };

  const handleUnitChange = (event, value) => {
    setSelectedUnits(event.target.value);
  };

  return (
    <Fragment>
      {isTablet ? (
        <Button
          size="sm"
          color="inherit"
          aria-label="download"
          onClick={() => setOpenDownload(true)}
          sx={{
            fontSize: "0.7rem",

            color: "neutral.700",
            paddingInline: 0,
            mr: 1.5,
          }}
          startDecorator={
            <DownloadIcon
              sx={{
                fontSize: "1.5rem",
                color: "var(--joy-palette-neutral-700, #32383E)",
              }}
            />
          }
        >
          Download
        </Button>
      ) : (
        <IconButton
          size="sm"
          color="inherit"
          aria-label="download"
          onClick={() => setOpenDownload(true)}
        >
          <DownloadIcon
            sx={{
              fontSize: "1.5rem",
              color: "var(--joy-palette-neutral-700, #32383E)",
            }}
          />
        </IconButton>
      )}
      <Modal open={openDownload} onClose={() => setOpenDownload(false)}>
        <ModalDialog
          variant="solid"
          sx={{
            width: "450px",
            "--ModalDialog-maxWidth": "450px",
          }}
        >
          <DialogTitle sx={{ mb: 2 }}>
            Download forecast for
            <Typography
              level="title-lg"
              sx={{
                color: "common.white",
              }}
            >
              {location.municity}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ color: "neutral.400", fontSize: "sm" }}>
            Select your preferences:
          </DialogContent>

          <Stack spacing={3}>
            <FormControl size="md">
              <FormLabel sx={{ color: "common.white" }}>Set units</FormLabel>
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  justifyContent: "flex-start",
                  alignItems: "center",
                }}
              >
                <Radio
                  color="neutral"
                  variant="outlined"
                  checked={selectedUnits === "current"}
                  onChange={handleUnitChange}
                  value="current"
                  name="radio-buttons"
                  sx={{ color: "common.white" }}
                  slotProps={{
                    input: { "aria-label": "current" },
                  }}
                  label="Current"
                  size="sm"
                />
                <Radio
                  color="neutral"
                  variant="outlined"
                  checked={selectedUnits === "custom"}
                  onChange={handleUnitChange}
                  value="custom"
                  name="radio-buttons"
                  sx={{ color: "common.white" }}
                  slotProps={{
                    input: { "aria-label": "custom" },
                  }}
                  label="Custom"
                  size="sm"
                />
              </Stack>
              {selectedUnits === "custom" ? (
                <Sheet
                  variant="solid"
                  sx={{
                    p: 1,
                    mt: 1,
                    backgroundColor: "neutral.600",
                    borderRadius: "sm",
                  }}
                >
                  <FormControl size="sm" orientation="horizontal">
                    <FormLabel sx={{ flexGrow: 1, color: "common.white" }}>
                      Temperature
                    </FormLabel>
                    <ToggleButtonGroup
                      size="sm"
                      variant="solid"
                      value={docUnits.temperature}
                      exclusive
                      sx={{ "--ButtonGroup-separatorSize": 0 }}
                      onChange={(e, value) =>
                        value &&
                        setDocUnits({
                          ...docUnits,
                          temperature: value,
                        })
                      }
                    >
                      <Button value="°C">°C</Button>
                      <Button value="°F">°F</Button>
                    </ToggleButtonGroup>
                  </FormControl>

                  <FormControl
                    size="sm"
                    orientation="horizontal"
                    sx={{ mt: 2 }}
                  >
                    <Box sx={{ display: "flex", flex: 1, pr: 1 }}>
                      <FormLabel sx={{ flexGrow: 1, color: "common.white" }}>
                        Rainfall
                      </FormLabel>
                    </Box>
                    <ToggleButtonGroup
                      size="sm"
                      variant="solid"
                      value={docUnits.rainfall}
                      exclusive
                      sx={{ "--ButtonGroup-separatorSize": 0 }}
                      onChange={(e, value) =>
                        value &&
                        setDocUnits({
                          ...docUnits,
                          rainfall: value,
                        })
                      }
                    >
                      <Button value="mm/day">mm/day</Button>
                      <Button value="in/day">in/day</Button>
                    </ToggleButtonGroup>
                  </FormControl>

                  <FormControl
                    size="sm"
                    orientation="horizontal"
                    sx={{ mt: 2 }}
                  >
                    <Box sx={{ display: "flex", flex: 1, pr: 1 }}>
                      <FormLabel sx={{ flexGrow: 1, color: "common.white" }}>
                        Wind speed
                      </FormLabel>
                    </Box>
                    <ToggleButtonGroup
                      size="sm"
                      variant="solid"
                      z
                      value={docUnits.windSpeed}
                      exclusive
                      sx={{ "--ButtonGroup-separatorSize": 0 }}
                      onChange={(e, value) =>
                        value &&
                        setDocUnits({
                          ...docUnits,
                          windSpeed: value,
                        })
                      }
                    >
                      <Button value="m/s">m/s</Button>
                      <Button value="km/h">km/h</Button>
                      <Button value="kt">knot</Button>
                    </ToggleButtonGroup>
                  </FormControl>

                  {docUnits === "pdf" ? (
                    <FormControl
                      size="sm"
                      orientation="horizontal"
                      sx={{ mt: 2 }}
                    >
                      <Box sx={{ display: "flex", flex: 1, pr: 1 }}>
                        <FormLabel>Wind direction</FormLabel>
                      </Box>
                      <ToggleButtonGroup
                        size="sm"
                        variant="plain"
                        value={docUnits.windDirection}
                        exclusive
                        onChange={(e, value) =>
                          value &&
                          setDocUnits({
                            ...docUnits,
                            windDirection: value,
                          })
                        }
                      >
                        <Button value="arrow">
                          <Typography level="body-xs">arrow</Typography>
                        </Button>
                        <Button value="desc">
                          <Typography level="body-xs">description</Typography>
                        </Button>
                      </ToggleButtonGroup>
                    </FormControl>
                  ) : null}
                </Sheet>
              ) : null}
            </FormControl>

            {docFormat === "pdf" && (
              <>
                <FormControl orientation="horizontal">
                  <FormLabel sx={{ mr: "auto", color: "common.white" }}>
                    Show colors for visualization
                  </FormLabel>
                  <Switch
                    size="sm"
                    checked={docColored}
                    onChange={(event) => setDocColored(event.target.checked)}
                    variant={docColored ? "solid" : "outlined"}
                    endDecorator={docColored ? "On" : "Off"}
                    slotProps={{
                      endDecorator: {
                        sx: {
                          minWidth: 24,
                          fontWeight: 400,
                        },
                      },
                      ...(!docColored
                        ? {
                            track: {
                              sx: { backgroundColor: "neutral.500" },
                            },
                            thumb: {
                              sx: { backgroundColor: "common.white" },
                            },
                          }
                        : {}),
                    }}
                  />
                </FormControl>
              </>
            )}

            <FormControl orientation="horizontal" sx={{ flexWrap: "wrap" }}>
              <FormLabel sx={{ flexGrow: 1, color: "common.white" }}>
                Add other forecast data
              </FormLabel>
              <Switch
                sx={{ flexGrow: 0 }}
                size="sm"
                checked={docExtendForecast}
                variant={docExtendForecast ? "solid" : "outlined"}
                onChange={(event) => {
                  setDocExtendForecast(event.target.checked);
                }}
                endDecorator={docExtendForecast ? "Yes" : "No"}
                slotProps={{
                  endDecorator: {
                    sx: {
                      minWidth: 24,
                      fontWeight: 400,
                    },
                  },
                  ...(!docExtendForecast
                    ? {
                        track: {
                          sx: { backgroundColor: "neutral.500" },
                        },
                        thumb: {
                          sx: { backgroundColor: "common.white" },
                        },
                      }
                    : {}),
                }}
              />
              {docExtendForecast && (
                <MunicitiesSelector
                  forecast={forecast}
                  serverToken={serverToken}
                  selectedMunicities={selectedMunicities}
                  setSelectedMunicities={setSelectedMunicities}
                  setDocExtendForecast={setDocExtendForecast}
                />
              )}
            </FormControl>

            <FormControl>
              <FormLabel sx={{ color: "common.white" }}>File format</FormLabel>
              <Select
                variant="solid"
                sx={{ backgroundColor: "neutral.600" }}
                defaultValue="pdf"
                onChange={handleChange}
              >
                <Option value="pdf">PDF</Option>
                <Option value="csv">CSV</Option>
                <Option value="txt">TXT</Option>
              </Select>
            </FormControl>

            <ForecastDownload
              serverToken={serverToken}
              location={location}
              forecast={forecast}
              docFormat={docFormat}
              docUnits={docUnits}
              docColored={docColored}
              docExtendForecast={docExtendForecast}
              selectedMunicities={selectedMunicities}
            />
          </Stack>
        </ModalDialog>
      </Modal>
    </Fragment>
  );
};

export default DownloadDialog;
