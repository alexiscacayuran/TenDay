import React, { useState, useEffect } from "react";
import axios from "axios";
import { Box, Chip, Select, Option, IconButton } from "@mui/joy";
import CloseRounded from "@mui/icons-material/CloseRounded";

const MunicitiesSelector = ({
  forecast,
  serverToken,
  selectedMunicities,
  setSelectedMunicities,
}) => {
  const [municities, setMunicities] = useState([]);
  const action = React.useRef(null);
  console.log("selectedMunicities", selectedMunicities);

  const handleChange = (event, newValue) => {
    // console.log("selectedMunicities:", newValue + " " + forecast.province);
    setSelectedMunicities(newValue);
  };

  useEffect(() => {
    if (!forecast?.province) return;
    const fetchMunicities = async () => {
      try {
        const response = await axios.get("./municitiesInternal", {
          params: {
            province: forecast.province,
          },
          headers: {
            token: serverToken,
          },
        });

        setMunicities(
          response.data.filter((municity) => municity !== forecast.municity)
        );

        // // Set default selectedMunicities value only when data is loaded
        // if (response.data.includes(forecast.municity)) {
        //   setSelectedMunicities(forecast.municity);
        // }
      } catch (error) {
        console.log(error);
      }
    };

    fetchMunicities();
  }, [forecast]);

  return (
    <Box sx={{ flexBasis: "100%", width: "100%", mt: 1 }}>
      <Select
        placeholder={municities.length > 0 ? "ex. " + municities[0] : ""}
        multiple
        onChange={handleChange}
        value={selectedMunicities}
        renderValue={(selectedMunicities) => (
          <Box
            sx={{
              display: "flex",
              gap: "0.25rem",
              flexWrap: "wrap",
            }}
          >
            {selectedMunicities.map((selectedOption) => (
              <Chip variant="soft" color="primary">
                {selectedOption.label}
              </Chip>
            ))}
          </Box>
        )}
        sx={{ minWidth: "15rem", color: "neutral.500" }}
        slotProps={{
          listbox: {
            sx: {
              width: "100%",
            },
          },
        }}
        {...(selectedMunicities[0] && {
          // display the button and remove select indicator
          // when user has selected a value
          endDecorator: (
            <IconButton
              size="sm"
              variant="plain"
              color="neutral"
              onMouseDown={(event) => {
                // don't open the popup when clicking on this button
                event.stopPropagation();
              }}
              onClick={() => {
                setSelectedMunicities([]);
                action.current?.focusVisible();
              }}
            >
              <CloseRounded />
            </IconButton>
          ),
          indicator: null,
        })}
      >
        {municities.map((municity) => (
          <Option key={municity} value={municity}>
            {municity}
          </Option>
        ))}
      </Select>
    </Box>
  );
};

export default MunicitiesSelector;
