import { reverseGeocode } from "esri-leaflet-geocoder";
import { useMapEvents } from "react-leaflet";

const ReverseGeocode = ({ arcgisToken, setLocation, setIsLocationReady }) => {
  useMapEvents({
    click(e) {
      const { latlng } = e;

      setIsLocationReady(false);

      // Perform reverse geocoding
      reverseGeocode({
        apikey: arcgisToken,
      })
        .latlng(latlng)
        .run((error, result) => {
          if (error) {
            console.error("Geocoding error:", error);
            return;
          }

          setLocation({
            latLng: result.latlng,
            municity: result.address.City,
            province: result.address.Subregion,
          });
          setIsLocationReady(true);
        });
    },
  });

  return null;
};

export default ReverseGeocode;
