import React, { useState } from "react";
import {
  Button,
  Drawer,
  Box,
  Typography,
  ModalClose,
  Stack,
  AspectRatio,
  Sheet,
} from "@mui/joy";
import UnderConstruction from "../../assets/img/under-construction.png";
import Infog from "../../assets/img/infog.png";

const StationsPanel = ({ station }) => {
  const [open, setOpen] = useState(false);
  console.log(station);
  return (
    <>
      <Button
        color="primary"
        variant="outlined"
        sx={{
          mt: 1,
          borderRadius: "lg",
          color: "common.white",
          fontWeight: "bold",
          width: "100%",
          "&:hover": { color: "primary.500" },
        }}
        onClick={() => setOpen(true)}
      >
        View
      </Button>
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        sx={{ zIndex: 1200 }}
        slotProps={{
          content: {
            sx: {
              boxShadow: "none",
            },
          },
          backdrop: {
            sx: {
              backdropFilter: "none",
              backgroundColor: "transparent",
            },
          },
        }}
      >
        <Box sx={{}}>
          <ModalClose color="inherit" />
          {station.stn_code === 430 ? (
            <AspectRatio
              objectFit="contain"
              sx={{
                backgroundColor: "transparent",
              }}
              slotProps={{
                content: {
                  sx: {
                    backgroundColor: "transparent",
                    height: 700,
                  },
                },
              }}
            >
              <img src={Infog} alt="Infographics" />
            </AspectRatio>
          ) : (
            <Stack
              direction="column"
              spacing={2}
              sx={{
                justifyContent: "center",
                alignItems: "flex-start",
                p: 2,
              }}
            >
              <Typography level="h3">Coming soon...</Typography>
              <AspectRatio
                variant="plain"
                ratio="1"
                sx={{
                  width: 500,
                  maxWidth: "100%",
                  backgroundColor: "transparent",
                }}
              >
                <img src={UnderConstruction} alt="Under Construction" />
              </AspectRatio>
              <Typography level="body-sm">
                This feature is currently under construction and not yet
                available. We're working hard to bring it to you soon — stay
                tuned!
              </Typography>
            </Stack>
          )}
        </Box>
      </Drawer>
    </>
  );
};

export default StationsPanel;
