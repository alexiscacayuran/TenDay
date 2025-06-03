import { useRef, useEffect, useCallback, useState } from "react";
import { Box, Sheet, Typography, Stack } from "@mui/joy";
import { format, addDays, subDays } from "date-fns";
import debounce from "lodash.debounce";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown } from "@fortawesome/free-solid-svg-icons";

function generateDateRange(startDate, range) {
  return Array.from({ length: range }, (_, i) => addDays(startDate, i));
}

const DateSlider = ({ initialDate, range, date, setDate, open }) => {
  const [dateRange] = useState(generateDateRange(initialDate, range));
  const [localDate, setlocalDate] = useState(new Date());
  const scrollRef = useRef(null);
  const itemWidth = 100;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);

  useEffect(() => {
    setDate(dateRange[selectedIndex]);
  }, [selectedIndex]);

  useEffect(() => {
    if (!scrollRef.current || !dateRange.length || !date) return;

    const index = dateRange.findIndex(
      (d) => d.toDateString() === new Date(date).toDateString()
    );

    if (index !== -1) {
      setSelectedIndex(index);

      const container = scrollRef.current;
      const scrollTo = index * 100 + 80;

      container.scrollTo({
        left: scrollTo,
        behavior: "smooth", // makes it scroll smoothly on load
      });
    }
  }, [dateRange, localDate]);

  const updateSelectedIndex = useCallback(
    debounce(() => {
      const container = scrollRef.current;
      if (!container) return;

      const center = container.scrollLeft - 54 + container.clientWidth / 2;
      const contentCenter = center - container.clientWidth / 2;
      const index = Math.round(contentCenter / itemWidth);

      if (index !== selectedIndex && dateRange[index]) {
        setSelectedIndex(index);
      }
    }, 100), // Debounce delay in ms
    [selectedIndex]
  );

  useEffect(() => {
    return () => {
      updateSelectedIndex.cancel();
    };
  }, [updateSelectedIndex]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    container.addEventListener("scroll", updateSelectedIndex);
    return () => container.removeEventListener("scroll", updateSelectedIndex);
  }, [selectedIndex]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleMouseDown = (e) => {
      setIsDragging(true);
      container.classList.add("dragging");
      startX.current = e.pageX - container.offsetLeft;
      scrollLeftStart.current = container.scrollLeft;
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = x - startX.current;
      container.scrollLeft = scrollLeftStart.current - walk;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      container.classList.remove("dragging");
    };

    const handleTouchStart = (e) => {
      startX.current = e.touches[0].pageX - container.offsetLeft;
      scrollLeftStart.current = container.scrollLeft;
    };

    const handleTouchMove = (e) => {
      const x = e.touches[0].pageX - container.offsetLeft;
      const walk = x - startX.current;
      container.scrollLeft = scrollLeftStart.current - walk;
    };

    container.addEventListener("mousedown", handleMouseDown);
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("mouseleave", handleMouseUp);

    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleMouseUp);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("mouseleave", handleMouseUp);

      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      {/* 🔻 Triangle Thumb Marker */}
      <Box
        sx={{
          position: "absolute",
          top: 15,
          left: "50%",
          transform: "translateX(-50%)",
          borderRadius: "5px",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <FontAwesomeIcon
          icon={faCaretDown}
          style={{
            fontSize: "2rem",
            color: "#3e7bff",
            WebkitFilter: "drop-shadow(1px 1px 2px rgba(21, 21, 21, 0.2)",
            filter: "drop-shadow(1px 1px 2px rgba(21, 21, 21, 0.2)",
          }}
        />
      </Box>

      {/* 📆 Scrollable/Draggable Track */}
      <Box
        ref={scrollRef}
        sx={{
          overflowX: "scroll",
          overflowY: "hidden",
          whiteSpace: "nowrap",
          display: "flex",
          pt: 4,
          cursor: isDragging ? "grabbing" : "grab",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
          userSelect: "none",
        }}
      >
        {/* 🔲 Left Buffer */}
        <Sheet
          variant="solid"
          sx={{
            width: "50%",
            height: "55px",
            flex: "0 0 auto",
          }}
        />

        {/* 🗓️ Dates */}
        {dateRange.map((date, index) => {
          const isSelected = index === selectedIndex;
          return (
            <Box
              key={index}
              sx={{
                backgroundColor: "neutral.500",
                boxSizing: "border-box",
                height: "55px",
                p: 0.1,
                border: "1px solid #636B74",
              }}
            >
              <Sheet
                variant="solid"
                key={index}
                sx={{
                  my: 0.5,
                  width: "100px",
                  height: "83%",
                  flex: "0 0 auto",
                  backgroundColor: isSelected ? "neutral.700" : "neutral.500",
                  borderRadius: isSelected ? "lg" : "0",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Stack
                  spacing={-0.8}
                  direction="column"
                  sx={{
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    level="body-md"
                    sx={{
                      color: "common.white",
                      fontWeight: isSelected ? "bold" : "normal",
                    }}
                  >
                    {format(date, "EEE")}
                  </Typography>
                  <Typography
                    level="body-sm"
                    sx={{
                      color: "common.white",
                      fontWeight: isSelected ? "bold" : "normal",
                    }}
                  >
                    {format(date, "MMM d")}
                  </Typography>
                </Stack>
              </Sheet>
            </Box>
          );
        })}

        {/* 🔲 Right Buffer */}
        <Sheet
          variant="solid"
          sx={{
            width: "50%",
            height: "55px",
            flex: "0 0 auto",
          }}
        />
      </Box>
    </Box>
  );
};

export default DateSlider;
