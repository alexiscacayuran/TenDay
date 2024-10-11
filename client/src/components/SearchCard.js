import React, { useState } from "react";
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

export default function SearchCard(props) {
  const [province, setProvince] = useState("");

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
                value={province}
                onChange={(event, newValue) => {
                  setProvince(newValue);
                  props.searchLoc({ province: newValue });
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
                  .map((feature) => feature.municity)}
                onChange={(event, newValue) => {
                  props.searchLoc((prevValue) => {
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
