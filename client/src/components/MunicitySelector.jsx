import React, { useEffect, useState } from "react";
import axios from "axios";
import { Select, Option } from "@mui/joy";
import { geocodeService } from "esri-leaflet-geocoder";

const MunicitySelector = ({
  map,
  arcgisToken,
  serverToken,
  forecast,
  setLocation,
  selectedPolygon,
}) => {
  const [municities, setMunicities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    if (!forecast?.province) return;
    const fetchMunicities = async () => {
      try {
        setLoading(true);
        const response = await axios.get("./municitiesInternal", {
          params: {
            province: forecast.province,
          },
          headers: {
            token: serverToken,
          },
        });

        setMunicities(response.data);

        // Set default selected value only when data is loaded
        if (response.data.includes(forecast.municity)) {
          setSelected(forecast.municity);
        }

        setLoading(false);
      } catch (error) {
        console.log(error);
      }
    };

    fetchMunicities();
  }, [forecast]);

  const handleChange = (event, newValue) => {
    // console.log("Selected:", newValue + " " + forecast.province);

    if (selectedPolygon.current) {
      map.removeLayer(selectedPolygon.current);
      selectedPolygon.current = null;
    }
    setSelected(newValue);

    const _geocodeService = geocodeService({
      apikey: arcgisToken,
    });

    _geocodeService
      .geocode()
      .city(newValue + " " + forecast.province)
      .run((error, res) => {
        if (!error) {
          console.log("Geocode result", res);
          const result = res.results[0];

          setLocation({
            latLng: result.latlng,
            municity: result.properties.City,
            province: result.properties.Subregion,
          });

          map.flyTo(result.latlng, 12, { duration: 0.75, easeLinearity: 0.01 });
        }
      });
  };
  return (
    <Select
      size="lg"
      value={selected}
      onChange={handleChange}
      sx={{
        mb: 1,
        "--Select-minHeight": 0,
        "--Select-paddingInline": "0.5rem",

        boxShadow: "none",
        backgroundColor: "transparent",
        borderColor: "neutral.800",
        "&:hover": {
          backgroundColor: "transparent",
        },
      }}
      slotProps={{
        button: {
          sx: {
            fontWeight: "600",
            color: "neutral.800",
            fontSize: "larger",
          },
        },
        indicator: {
          sx: {
            "--Icon-color": "neutral.800",
          },
        },
        listbox: {
          sx: {
            fontSize: "small",
            "--ListItem-minHeight": 0,
          },
        },
      }}
    >
      {municities.map((municity) => (
        <Option key={municity} value={municity}>
          {municity}
        </Option>
      ))}
    </Select>
  );
};

export default MunicitySelector;
