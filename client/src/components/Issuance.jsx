import React from "react";
import { Box, Stack, Typography } from "@mui/joy";
import { format } from "date-fns";
import TimeAgo from "react-timeago";

const Issuance = ({ startDate }) => {
  const date = new Date(startDate.current.latest_date);
  const nextUpdate = date.setDate(date.getDate() + 2);

  return (
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
          Next update: {format(nextUpdate, "MMM d")}
        </Typography>
      </Stack>
    </Box>
  );
};

export default Issuance;
