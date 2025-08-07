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

const StationsPanel = () => {
  const [open, setOpen] = useState(false);

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
              p: { md: 1, xs: 0 },
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
        <Box sx={{ p: 2 }}>
          <ModalClose color="inherit" />
          <Stack
            direction="column"
            spacing={2}
            sx={{
              justifyContent: "center",
              alignItems: "flex-start",
            }}
          >
            <Typography level="h3">Coming soon...</Typography>
            <AspectRatio
              variant="plain"
              ratio="1"
              sx={{ width: 500, backgroundColor: "none" }}
            >
              <img src={UnderConstruction} alt="Under Construction" />
            </AspectRatio>
            <Typography level="body-sm">
              This feature is currently under construction and not yet
              available. We're working hard to bring it to you soon — stay
              tuned!
            </Typography>
          </Stack>
        </Box>
      </Drawer>
    </>
  );
};

export default StationsPanel;
