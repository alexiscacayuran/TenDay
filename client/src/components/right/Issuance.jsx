import React from "react";

import { format } from "date-fns";
import TimeAgo from "react-timeago";
import Popover from "@mui/material/Popover";
import PopupState, { bindTrigger, bindPopover } from "material-ui-popup-state";
import { useMediaQuery } from "@mui/material";
import {
  Box,
  Stack,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemDecorator,
} from "@mui/joy";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";

const Issuance = ({ context, startDate }) => {
  const date = new Date(startDate.current.latest_date);
  const nextUpdate = date.setDate(date.getDate() + 2);
  const isLaptop = useMediaQuery((theme) => theme.breakpoints.up("lg"));
  const isTablet = useMediaQuery((theme) => theme.breakpoints.up("md"));
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("md"));

  return (
    <>
      {context === "laptop" && (
        <Box
          sx={{
            position: "absolute",
            top: 70,
            right: 60,
            zIndex: 400,
          }}
        >
          <Stack
            direction="column"
            spacing={0}
            sx={{
              justifyContent: "center",
              alignItems: "flex-end",
            }}
          >
            <Typography
              level="body-xs"
              sx={{
                color: "common.white",
                fontSize: "0.7rem",
                textShadow: "1.5px 1.5px 2px rgba(0, 0, 0, 0.5)",
              }}
            >
              Model: GFS
            </Typography>
            <Typography
              level="body-xs"
              sx={{
                color: "common.white",
                fontSize: "0.7rem",
                textShadow: "1.5px 1.5px 2px rgba(0, 0, 0, 0.5)",
              }}
            >
              Forecast updated{" "}
              {startDate.current && (
                <TimeAgo
                  date={`${startDate.current.latest_date} ${startDate.current.latest_time}`}
                />
              )}
              {/* {format(startDate.current.latest_date, "MMM d") +
            " " +
            startDate.current.latest_time.replace(/:\d{2}(?=\s?[AP]M)/, "")} */}
            </Typography>
            <Typography
              level="body-xs"
              sx={{
                color: "common.white",

                fontSize: "0.7rem",
                textShadow: "1.5px 1.5px 2px rgba(0, 0, 0, 0.5)",
              }}
            >
              Expect next update on {format(nextUpdate, "MMM d")}
            </Typography>
          </Stack>
        </Box>
      )}

      {context === "mobile" && (
        <PopupState variant="popover">
          {(popupState) => (
            <>
              <IconButton color="inherit" {...bindTrigger(popupState)}>
                <FontAwesomeIcon
                  icon={faCircleInfo}
                  style={{
                    fontSize: "1.5rem",
                    color: "white",
                    WebkitFilter:
                      "drop-shadow(1px 1px 2px rgba(21, 21, 21, 0.2)",
                    filter: "drop-shadow(1px 1px 2px rgba(21, 21, 21, 0.2)",
                  }}
                />
              </IconButton>
              <Popover
                {...bindPopover(popupState)}
                anchorOrigin={
                  isLaptop
                    ? {
                        vertical: "top",
                        horizontal: "left",
                      }
                    : {
                        vertical: "bottom",
                        horizontal: "right",
                      }
                }
                transformOrigin={
                  isLaptop
                    ? {
                        vertical: "top",
                        horizontal: "left",
                      }
                    : {
                        vertical: "bottom",
                        horizontal: "right",
                      }
                }
                slotProps={{
                  paper: {
                    sx: { boxShadow: "none", backgroundColor: "transparent" },
                  },
                }}
              >
                <List
                  size="md"
                  color="neutral"
                  variant="solid"
                  sx={{
                    borderRadius: "sm",
                    "--ListItem-minHeight": 0,
                  }}
                >
                  <ListItem>
                    <Typography
                      level="body-xs"
                      sx={{
                        color: "common.white",
                        fontSize: "0.7rem",
                      }}
                    >
                      Model: GFS
                    </Typography>
                  </ListItem>
                  <ListItem>
                    <Typography
                      level="body-xs"
                      sx={{
                        color: "common.white",
                        fontSize: "0.7rem",
                      }}
                    >
                      Current update:{" "}
                      {format(startDate.current.latest_date, "MMM d") +
                        " " +
                        startDate.current.latest_time.replace(
                          /:\d{2}(?=\s?[AP]M)/,
                          ""
                        )}
                    </Typography>
                  </ListItem>
                  <ListItem>
                    <Typography
                      level="body-xs"
                      sx={{
                        color: "common.white",
                        fontSize: "0.7rem",
                      }}
                    >
                      Next update: {format(nextUpdate, "MMM d")}
                    </Typography>
                  </ListItem>
                </List>
              </Popover>
            </>
          )}
        </PopupState>
      )}
    </>
  );
};

export default Issuance;
