import React, { useEffect, useState } from "react";
import Box from "@mui/joy/Box";
import IconButton from "@mui/joy/IconButton";
import Button from "@mui/joy/Button";
import ButtonGroup from "@mui/joy/ButtonGroup";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { format, addDays, subDays } from "date-fns";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import ToggleButtonGroup from "@mui/joy/ToggleButtonGroup";

function generateDateRange(startDate, range) {
  return Array.from({ length: range }, (_, i) => addDays(startDate, i));
}

const DateNavigation = ({ initialDate, range, setDate, date }) => {
  const [localDate, setlocalDate] = useState(new Date());
  const [dateRange] = useState(generateDateRange(initialDate, range));

  useEffect(() => {
    setlocalDate(date);
  }, [date]);

  const handleDateSelect = (date) => {
    setDate(date.toLocaleString("en-PH").split(", ")[0]);
  };

  const handlePreviousDate = () => {
    const previousDate = subDays(localDate, 1)
      .toLocaleString("en-PH")
      .split(", ")[0];
    if (
      dateRange.some(
        (date) =>
          format(date, "yyyy-MM-dd") === format(previousDate, "yyyy-MM-dd")
      )
    ) {
      setDate(previousDate);
    }
  };

  const handleNextDate = () => {
    const nextDate = addDays(localDate, 1)
      .toLocaleString("en-PH")
      .split(", ")[0];
    if (
      dateRange.some(
        (date) => format(date, "yyyy-MM-dd") === format(nextDate, "yyyy-MM-dd")
      )
    ) {
      setDate(nextDate);
    }
  };

  return (
    <div>
      <Box
        sx={{
          position: "fixed",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%", // Optional width adjustment
          maxWidth: 1100, // Optional max width
          zIndex: 999,
        }}
      >
        <ToggleButtonGroup
          size="md"
          variant="solid"
          color="neutral"
          aria-label="soft button group"
          value={format(localDate, "yyyy-MM-dd")}
          sx={{
            width: "100%",
            justifyContent: "center",
            gap: "5px",
            "--ButtonGroup-separatorColor": "transparent",
          }}
        >
          <IconButton
            onClick={handlePreviousDate}
            disabled={
              format(localDate, "yyyy-MM-dd") ===
              format(dateRange[0], "yyyy-MM-dd")
            }
          >
            <NavigateBeforeIcon />
          </IconButton>
          {dateRange.map((date, index) => (
            <Button
              key={index}
              value={format(date, "yyyy-MM-dd")}
              color="neutral"
              variant="solid"
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
                {format(date, "EEE M/d")}
              </Stack>
            </Button>
          ))}
          <IconButton
            onClick={handleNextDate}
            disabled={
              format(localDate, "yyyy-MM-dd") ===
              format(dateRange[dateRange.length - 1], "yyyy-MM-dd")
            }
          >
            <NavigateNextIcon />
          </IconButton>
        </ToggleButtonGroup>
      </Box>
    </div>
  );
};

export default DateNavigation;
