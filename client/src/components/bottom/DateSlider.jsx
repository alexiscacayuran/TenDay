import React, { useMemo, useEffect, useState } from "react";
import { format, addDays } from "date-fns";
import { Box, Sheet, Typography, Stack } from "@mui/joy";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown } from "@fortawesome/free-solid-svg-icons";
import { Slide } from "@mui/material";

export const generateDateRange = (startDate, range) => {
  return Array.from({ length: range }, (_, i) => addDays(startDate, i));
};

const DateSlider = ({ initialDate, date, setDate, open, sliderRef }) => {
  const dateRange = useMemo(() => {
    const after = Array.from({ length: 4 }, () => null); //padding, empty date slides
    return [...generateDateRange(initialDate, 10), ...after];
  }, []);

  const [isSliderReady, setIsSliderReady] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsSliderReady(true);
    }, 500); // can be 50ms if still glitchy
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const idx = dateRange.findIndex(
      (d) => d.toDateString() === new Date(date).toDateString()
    );

    if (idx >= 0 && isSliderReady) {
      sliderRef.current.slickGoTo(idx, true);
    }
  }, [isSliderReady]);

  const settings = {
    focusOnSelect: true,
    centerMode: true,
    infinite: false,
    centerPadding: "0px",
    slidesToShow: 5,

    speed: 500,
    swipeToSlide: true,
    afterChange: (current) => {
      const newDate = dateRange[current];
      if (newDate) setDate(newDate);
    },
  };

  return (
    <Slide
      direction="up"
      in={!open}
      mountOnEnter
      // unmountOnExit
      timeout={{ enter: 200, exit: 200 }}
    >
      <Sheet
        variant="solid"
        sx={{
          height: "75px",
          overflow: "hidden",
          position: "absolute",
          bottom: 0,
          width: "100%",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: -14,
            left: "50%",
            transform: "translateX(-50%)",
            borderRadius: "lg",
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

        {isSliderReady && (
          <Slider
            {...settings}
            ref={(slider) => {
              sliderRef.current = slider;
            }}
          >
            {dateRange.map((d, i) => {
              if (!d) return <Box key={i} />;
              const isSelected =
                format(d, "yyyy-MM-dd") === format(date, "yyyy-MM-dd");
              return (
                <Sheet variant="solid" key={i} sx={{ py: 1 }}>
                  <Stack
                    alignItems="center"
                    spacing={-0.5}
                    sx={{
                      backgroundColor: isSelected ? "neutral.700" : "none",
                      borderRadius: "20px",
                    }}
                  >
                    <Typography
                      level="title-lg"
                      fontWeight={isSelected ? "bolder" : "normal"}
                      color="common.white"
                    >
                      {format(d, "EEE")}
                    </Typography>
                    <Typography
                      level="body-xs"
                      fontWeight={isSelected ? "bold" : "normal"}
                      color="common.white"
                    >
                      {format(d, "MMM d")}
                    </Typography>
                  </Stack>
                </Sheet>
              );
            })}
          </Slider>
        )}
      </Sheet>
    </Slide>
  );
};

export default DateSlider;
