import React, { useState } from "react";
import Box from "@mui/joy/Box";
import IconButton from "@mui/joy/IconButton";
import Button from "@mui/joy/Button";
import ButtonGroup from "@mui/joy/ButtonGroup";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { format, addDays, subDays } from "date-fns";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

function generateDateRange(startDate, range) {
  return Array.from({ length: range }, (_, i) => addDays(startDate, i));
}

const DateNavigation = ({
  initialDate = new Date(),
  range = 10,
  onPageChange,
}) => {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [dateRange] = useState(generateDateRange(initialDate, range));

  const handleDateSelect = (date) => {
    setCurrentDate(date);
    onPageChange(date);
  };

  const handlePreviousDate = () => {
    const previousDate = subDays(currentDate, 1);
    if (
      dateRange.some(
        (date) =>
          format(date, "yyyy-MM-dd") === format(previousDate, "yyyy-MM-dd")
      )
    ) {
      setCurrentDate(previousDate);
      onPageChange(previousDate);
    }
  };

  const handleNextDate = () => {
    const nextDate = addDays(currentDate, 1);
    if (
      dateRange.some(
        (date) => format(date, "yyyy-MM-dd") === format(nextDate, "yyyy-MM-dd")
      )
    ) {
      setCurrentDate(nextDate);
      onPageChange(nextDate);
    }
  };

  return (
    <div>
      <Box
        sx={{
          position: "fixed",
          bottom: 25,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%", // Optional width adjustment
          maxWidth: 1200, // Optional max width
        }}
      >
        <ButtonGroup
          size="sm"
          variant="soft"
          color="neutral"
          aria-label="soft button group"
          sx={{ width: "100%", justifyContent: "center" }}
        >
          <IconButton
            className="glass"
            onClick={handlePreviousDate}
            disabled={
              format(currentDate, "yyyy-MM-dd") ===
              format(dateRange[0], "yyyy-MM-dd")
            }
          >
            <NavigateBeforeIcon />
          </IconButton>
          {dateRange.map((date, index) => (
            <Button
              key={index}
              className={
                format(date, "yyyy-MM-dd") !=
                  format(currentDate, "yyyy-MM-dd") && "glass"
              }
              color="primary"
              variant={
                format(date, "yyyy-MM-dd") === format(currentDate, "yyyy-MM-dd")
                  ? "solid"
                  : "neutral"
              }
              onClick={() => handleDateSelect(date)}
            >
              <Stack
                direction="column"
                spacing={0}
                sx={{
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {format(date, "EEE, MMM d")}{" "}
              </Stack>
            </Button>
          ))}
          <IconButton
            className="glass"
            onClick={handleNextDate}
            disabled={
              format(currentDate, "yyyy-MM-dd") ===
              format(dateRange[dateRange.length - 1], "yyyy-MM-dd")
            }
          >
            <NavigateNextIcon />
          </IconButton>
        </ButtonGroup>

        {/* <Typography variant="h6" align="center">
        Selected Date: {format(currentDate, "EEE, MMM d")}
      </Typography> */}
      </Box>
    </div>
  );
};

export default DateNavigation;
