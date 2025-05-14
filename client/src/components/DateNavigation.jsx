import React, { useEffect, useState, useRef } from "react";
import { CssVarsProvider, useTheme } from "@mui/joy/styles";
import theme from "../theme";
import Box from "@mui/joy/Box";
import IconButton from "@mui/joy/IconButton";
import Button from "@mui/joy/Button";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { format, addDays, subDays } from "date-fns";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import ToggleButtonGroup from "@mui/joy/ToggleButtonGroup";
import { Slide } from "@mui/material";
import useResponsiveCheck from "../hooks/useResponsiveCheck";

function generateDateRange(startDate, range) {
  return Array.from({ length: range }, (_, i) => addDays(startDate, i));
}

const DateNavigation = ({ initialDate, range, setDate, date, open }) => {
  const [localDate, setlocalDate] = useState(new Date());
  const [dateRange] = useState(generateDateRange(initialDate, range));
  const isTablet = useResponsiveCheck("laptop"); // viewport below or equal laptop screen
  const scrollContainerRef = useRef(null);
  const buttonRefs = useRef([]);

  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const scrollStartX = useRef(0);

  useEffect(() => {
    setlocalDate(new Date(date));
  }, [date]);

  useEffect(() => {
    const activeIndex = dateRange.findIndex(
      (d) => format(d, "yyyy-MM-dd") === format(localDate, "yyyy-MM-dd")
    );
    if (buttonRefs.current[activeIndex]) {
      buttonRefs.current[activeIndex].scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [localDate, isTablet]);

  const handleDateSelect = (date) => {
    setDate(date.toLocaleString("en-PH").split(", ")[0]);
  };

  const handlePreviousDate = () => {
    const previous = subDays(localDate, 1);
    const prevStr = previous.toLocaleString("en-PH").split(", ")[0];
    if (
      dateRange.some(
        (d) => format(d, "yyyy-MM-dd") === format(previous, "yyyy-MM-dd")
      )
    ) {
      setDate(prevStr);
    }
  };

  const handleNextDate = () => {
    const next = addDays(localDate, 1);
    const nextStr = next.toLocaleString("en-PH").split(", ")[0];
    if (
      dateRange.some(
        (d) => format(d, "yyyy-MM-dd") === format(next, "yyyy-MM-dd")
      )
    ) {
      setDate(nextStr);
    }
  };

  // Mouse events for panning
  const handleMouseDown = (e) => {
    if (!isTablet) return; // Only on tablet
    isDragging.current = true;
    dragStartX.current = e.clientX;
    scrollStartX.current = scrollContainerRef.current.scrollLeft;
    scrollContainerRef.current.style.cursor = "grabbing";
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStartX.current;
    scrollContainerRef.current.scrollLeft = scrollStartX.current - dx;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    scrollContainerRef.current.style.cursor = "grab";
  };

  const handleMouseLeave = () => {
    if (isDragging.current) handleMouseUp();
  };

  return (
    <Slide direction="up" in={!open} mountOnEnter unmountOnExit>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          pointerEvents: "auto",
          position: "absolute",
          zIndex: 1200,
          height: "40px",
        }}
      >
        <ToggleButtonGroup
          size="md"
          variant="solid"
          color="neutral"
          value={format(localDate, "yyyy-MM-dd")}
          sx={{
            display: "flex",
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

          <Box
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            sx={{
              display: "flex",
              overflowX: "auto",
              whiteSpace: "nowrap",
              maxWidth: isTablet ? "60vw" : "none",
              cursor: isTablet ? "grab" : "default",
              "&::-webkit-scrollbar": { display: "none" },
              "-ms-overflow-style": "none",
              "scrollbar-width": "none",
              scrollBehavior: "smooth",
            }}
          >
            {dateRange.map((date, index) => (
              <Button
                key={index}
                ref={(el) => (buttonRefs.current[index] = el)}
                value={format(date, "yyyy-MM-dd")}
                onClick={() => handleDateSelect(date)}
                sx={{
                  minWidth: 64,
                  flexShrink: 0,
                  ...(index !== 0 && { marginLeft: "5px" }),
                }}
              >
                <Stack direction="column" spacing={0} alignItems="center">
                  {format(date, "EEE M/d")}
                </Stack>
              </Button>
            ))}
          </Box>

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
    </Slide>
  );
};

export default DateNavigation;
