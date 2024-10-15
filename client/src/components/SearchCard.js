import React, { useState, useEffect } from "react";
import {
  Stack,
  TextField,
  Autocomplete,
  Box,
  Typography,
  ThemeProvider,
  Card,
  CardContent,
  Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import "@fontsource-variable/inter";
import municities from "../data/municities.json";
import Theme from "./Theme";
import "../styles.css";

const features = municities.features.map((feature) => {
  return feature.properties;
});

const provinceList = [...new Set(features.map((item) => item.province))];
provinceList.sort();

function SearchCard(props) {
  const [province, setProvince] = useState("");
  const [municity, setMunicity] = useState("");

  // Update the municity field when a municity is selected in the map
  useEffect(() => {
    if (props.location) {
      setProvince(props.location.province); // Set the selected municity from the map
      setMunicity(props.location.municity); // Set the selected municity from the map
    }
  }, [props.location]);

  return (
    <ThemeProvider theme={Theme}>
      <Box sx={{ width: 350, m: 1 }}>
        <Card className="glass-card" sx={{ m: 2, p: 1 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
              <SearchIcon />
              <Typography variant="subtitle1">Select a location</Typography>
            </Stack>

            <Stack spacing={2}>
              <Autocomplete
                freeSolo
                options={provinceList}
                value={province} // Bind the Autocomplete value to the selected province
                onChange={(event, newValue, reason) => {
                  if (reason === "clear") {
                    props.setDidClear(true);
                    props.setLocation({ province: "", municity: "" });
                  } else props.setDidClear(false);
                  setProvince(newValue);
                  props.setLocation({ province: newValue, municity: "" });
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Province" />
                )}
              />
              <Autocomplete
                key={province}
                freeSolo
                options={features
                  .filter((feature) => feature.province === province)
                  .map((feature) => feature.municity)
                  .sort()}
                value={municity} // Bind the Autocomplete value to the selected municity
                onChange={(event, newValue) => {
                  props.setLocation((prevValue) => {
                    return { ...prevValue, municity: newValue };
                  });
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Municipality" />
                )}
              />
              <Button variant="contained">Get Forecast</Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </ThemeProvider>
  );
}

export default SearchCard;
