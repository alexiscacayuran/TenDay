import React from "react";
import { Box, Stack, Typography } from "@mui/joy";
import { format } from "date-fns";
import TimeAgo from "timeago-react";

const Issuance = ({ startDate }) => {
  const date = new Date(startDate.current.latest_date);
  const nextUpdate = date.setDate(date.getDate() + 2);

  return (
    <Box
      sx={{
        position: "absolute",
        top: 60,
        right: 60,
        zIndex: 1000,
        userSelect: "none",
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
          variant="plain"
          sx={{
            color: "common.white",
            textShadow: " 0px -1px 5px rgba(0,0,0,0.2)",
          }}
        >
          Forecast updated{" "}
          <TimeAgo
            datetime={`${startDate.current.latest_date} ${startDate.current.latest_time}`}
          />{" "}
          PST
          {/* {format(startDate.current.latest_date, "MMM d") +
            " " +
            startDate.current.latest_time.replace(/:\d{2}(?=\s?[AP]M)/, "")} */}
        </Typography>
        <Typography
          level="body-xs"
          variant="plain"
          sx={{
            color: "common.white",
            textShadow: " 0px -1px 5px rgba(0,0,0,0.2)",
          }}
        >
          Next update: {format(nextUpdate, "MMM d")}
        </Typography>
      </Stack>
    </Box>
  );
};

export default Issuance;
