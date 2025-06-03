import React, { useEffect, useState } from "react";
import L from "leaflet";
import axios from "axios";
import { Select, Option } from "@mui/joy";
import { geocodeService } from "esri-leaflet-geocoder";
import { query } from "esri-leaflet";
import { useTheme } from "@mui/joy/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

const MunicitySelector = ({
  map,
  arcgisToken,
  serverToken,
  forecast,
  setLocation,
  selectedPolygon,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("md"));

  const [municities, setMunicities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("");

  const _query = query({
    url: "https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/PHL_Boundaries_2022/FeatureServer/3",
  });
  _query.token(arcgisToken);

  const executeQuery = (result) => {
    console.log(result);
    _query.nearby(result.latlng, 1);

    _query.run(function (error, featureCollection, response) {
      if (error) {
        console.log(error);
        return;
      }

      if (selectedPolygon.current) {
        map.removeLayer(selectedPolygon.current);
      }

      const feature = featureCollection.features[0];

      const selectedMunicity = L.geoJSON(feature, {
        style: {
          color: "#3E7BFF",
          weight: 3,
          opacity: 1,
          fillColor: "#3E7BFF",
          fillOpacity: 0.3,
          interactive: false,
          pane: "activeFeaturePane",
        },
      });

      selectedMunicity.addTo(map);
      selectedPolygon.current = selectedMunicity;
    });
  };

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

          executeQuery(result);
          map.flyTo(result.latlng, 12, { duration: 0.75, easeLinearity: 0.01 });
        }
      });
  };
  return (
    <Select
      size="lg"
      value={selected}
      {...(isMobile && {
        renderValue: (selectedOption) =>
          selectedOption
            ? `${selectedOption.value}, ${forecast?.province || ""}`
            : "",
      })}
      onChange={handleChange}
      sx={{
        "--Select-minHeight": 0,
        "--Select-paddingInline": "0.5rem",
        boxShadow: "none",
        backgroundColor: "transparent",
        borderColor: "neutral.800",
        border: !isMobile ? "var(--variant-borderWidth) solid" : "none",
        borderBottom: "1px solid",
        borderRadius: !isMobile ? "" : "none",
        "&:hover": {
          backgroundColor: "transparent",
        },
      }}
      slotProps={{
        button: {
          sx: {
            flexShrink: 1,

            fontWeight: "600",
            color: "neutral.800",
            fontSize: !isMobile ? "larger" : "small",
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
