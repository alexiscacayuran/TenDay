import React, { useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalDialog,
  DialogTitle,
  DialogContent,
  Stack,
  Select,
  Option,
  Textarea,
  Snackbar,
} from "@mui/joy";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "@mui/joy/styles"; // or @mui/joy/styles if consistent

const Feedback = ({ setOpenSnackbar }) => {
  const submitFeedback = async (category, comment, email) => {
    setLoading(true);
    try {
      const response = await axios.post("api/postFeedback", {
        category: category,
        location: "",
        comment: comment,
        email: email,
      });

      console.log("Feedback submitted:", response.data.feedback);
    } catch (err) {
      if (err.response) {
        console.error("Server error:", err.response.data.error);
      } else {
        console.error("Network error:", err.message);
      }
    } finally {
      setLoading(false); // ✅ Reset loading state
      setOpenSnackbar(true);
    }
  };

  const [loading, setLoading] = useState(false);

  const theme = useTheme();
  const [open, setOpen] = useState(false);
  // const [openSnackbar, setOpenSnackbar] = useState(false);
  return (
    <Box
      sx={{
        zIndex: 1200,
        minWidth: "100px",
        display: "inline",
        [theme.breakpoints.down("lg")]: {
          display: "none",
        },
        pointerEvents: "auto",
      }}
    >
      <>
        <Button
          onClick={() => setOpen(true)}
          size="sm"
          className="glass"
          sx={{ color: "neutral.700" }}
          startDecorator={
            <FontAwesomeIcon icon={faEnvelope} style={{ fontSize: "1rem" }} />
          }
        >
          Feedback
        </Button>
        {/* <Snackbar
          // autoHideDuration={2000}
          open={openSnackbar}
          onClose={(event, reason) => {
            if (reason === "clickaway") {
              return;
            }
            setOpenSnackbar(false);
          }}
          size="md"
          variant="solid"
          sx={{ zIndex: 9999 }}
        >
          Feedback submitted successfully. Thank you for helping us improve!
        </Snackbar> */}
        <Modal open={open} onClose={() => setOpen(false)}>
          <ModalDialog
            variant="solid"
            sx={{
              width: "450px",
              "--ModalDialog-maxWidth": "450px",
            }}
          >
            <DialogTitle>Submit feedback/support</DialogTitle>
            <DialogContent sx={{ color: "neutral.400", fontSize: "sm" }}>
              Let us know your thoughts about the app.
            </DialogContent>
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                const category = parseInt(formData.get("concern"), 10);
                const comment = formData.get("comment");
                const email = formData.get("email");

                await submitFeedback(category, comment, email);

                setOpen(false);
              }}
            >
              <Stack spacing={2}>
                <FormControl>
                  <FormLabel sx={{ color: "common.white" }}>Concern</FormLabel>
                  <Select
                    variant="solid"
                    defaultValue={2}
                    name="concern"
                    required
                    sx={{ minWidth: 200, backgroundColor: "neutral.600" }}
                  >
                    <Option value={2}>Incorrect data</Option>
                    <Option value={3}>Bugs</Option>
                    <Option value={4}>UI</Option>
                    <Option value={5}>Others</Option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel sx={{ color: "common.white" }}>Comment</FormLabel>
                  <Textarea
                    name="comment"
                    variant="solid"
                    sx={{ backgroundColor: "neutral.600" }}
                    placeholder="Please do not include any of your sensitive information."
                    minRows={3}
                    maxRows={10}
                    required
                  />
                </FormControl>
                <FormControl>
                  <FormLabel sx={{ color: "common.white" }}>
                    Contact email
                  </FormLabel>
                  <Input
                    name="email"
                    placeholder="juandelacruz@gmail.com"
                    variant="solid"
                    sx={{ backgroundColor: "neutral.600" }}
                  />
                </FormControl>

                <Button loading={loading} type="submit">
                  Confirm
                </Button>
              </Stack>
            </form>
          </ModalDialog>
        </Modal>
      </>
    </Box>
  );
};

export default Feedback;
