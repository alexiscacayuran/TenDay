import React, { useEffect, useState, useRef } from "react";
import { useTheme } from "@mui/joy/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import Box from "@mui/joy/Box";
import IconButton from "@mui/joy/IconButton";
import Button from "@mui/joy/Button";
import Typography from "@mui/joy/Typography";
import Stack from "@mui/material/Stack";
import { format, addDays, subDays } from "date-fns";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import ToggleButtonGroup from "@mui/joy/ToggleButtonGroup";
import { Slide } from "@mui/material";

function generateDateRange(startDate, range) {
  return Array.from({ length: range }, (_, i) => addDays(startDate, i));
}

const DateNavigation = ({ initialDate, range, setDate, date, open }) => {
  const theme = useTheme();
  const isBelowLaptop = useMediaQuery(theme.breakpoints.down("lg"));
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [localDate, setlocalDate] = useState(new Date());
  const [dateRange] = useState(generateDateRange(initialDate, range));

  useEffect(() => {
    setlocalDate(new Date(date));
  }, [date]);

  const scrollContainerRef = useRef(null);
  const buttonRefs = useRef([]);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const scrollStartX = useRef(0);
  const wasDragging = useRef(false);

  const handleWheel = (e) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Only trigger horizontal scroll when vertical scroll is attempted
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      container.scrollLeft += e.deltaY;
    }
  };

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
  }, [localDate, isBelowLaptop]);

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
    if (!isBelowLaptop) return;
    isDragging.current = true;
    wasDragging.current = false;
    dragStartX.current = e.clientX;
    scrollStartX.current = scrollContainerRef.current.scrollLeft;
    scrollContainerRef.current.style.cursor = "grabbing";
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStartX.current;
    if (Math.abs(dx) > 5) {
      wasDragging.current = true;
    }
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
            maxWidth: "85vw",
            boxShadow: "sm",
          }}
        >
          <IconButton
            onClick={handlePreviousDate}
            disabled={
              format(localDate, "yyyy-MM-dd") ===
              format(dateRange[0], "yyyy-MM-dd")
            }
          >
            <NavigateBeforeIcon
              sx={{
                fontSize: "1.5rem",
              }}
            />
          </IconButton>

          <Box
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
            sx={{
              display: "flex",
              overflowX: "auto",
              overflowY: "hidden",
              whiteSpace: "nowrap",

              [theme.breakpoints.down("lg")]: {
                width: "78vw",
                cursor: "grab",
              },

              "&::-webkit-scrollbar": { display: "none" },
              msOverflowStyle: "none",
              scrollbarWidth: "none",
              "-ms-overflow-style": "none",
              scrollBehavior: "auto",
            }}
          >
            {dateRange.map((date, index) => (
              <Button
                size="lg"
                key={index}
                ref={(el) => (buttonRefs.current[index] = el)}
                value={format(date, "yyyy-MM-dd")}
                onClick={(e) => {
                  if (wasDragging.current) {
                    e.preventDefault(); // ✅ block accidental click
                    return;
                  }
                  handleDateSelect(date);
                }}
                sx={{
                  flexShrink: 0,
                  paddingInline: 2,
                }}
              >
                <Typography size="md" sx={{ color: "common.white" }}>
                  {format(date, "EEE M/d")}
                </Typography>
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
            <NavigateNextIcon
              sx={{
                fontSize: "1.5rem",
              }}
            />
          </IconButton>
        </ToggleButtonGroup>
      </Box>
    </Slide>
  );
};

export default DateNavigation;
