import React, { useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Tab,
  Tabs,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Tooltip,
  IconButton,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

import apiGroups from "./apiGroups";

export default function Products() {
  const [tabIndex, setTabIndex] = useState(0);
  const [accordionOpen, setAccordionOpen] = useState(null);
  const [codeTabs, setCodeTabs] = useState({});
  const [snackbar, setSnackbar] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleCopy = () => setSnackbar(true);

  const handleCodeTabChange = (apiIndex, newValue) => {
    setCodeTabs(prev => ({ ...prev, [apiIndex]: newValue }));
  };

  return (
    <Box sx={{ px: isMobile ? 2 : 10, py: 6 }}>
      <Typography variant="h3" fontWeight="bold" mb={4}>
        API Documentation
      </Typography>

      <Tabs
        value={tabIndex}
        onChange={(e, val) => {
          setTabIndex(val);
          setAccordionOpen(null);
        }}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3 }}
      >
        {apiGroups.map((group, i) => (
          <Tab key={i} label={group.name} />
        ))}
      </Tabs>

      {apiGroups[tabIndex].apis.map((api, index) => {
        const currentCodeTab = codeTabs[index] || 0;

        return (
          <Accordion
            key={index}
            expanded={accordionOpen === index}
            onChange={() =>
              setAccordionOpen(accordionOpen === index ? null : index)
            }
            sx={{
              mb: 3,
              borderRadius: 2,
              boxShadow: 2,
              "& .MuiAccordionSummary-root": {
                background: "linear-gradient(135deg, #3E7BFF, #5C33E1)",
                color: "white",
                borderRadius: 2,
              },
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "white" }} />}>
              <Typography fontWeight="bold">{api.title}</Typography>
            </AccordionSummary>

            <AccordionDetails sx={{ px: isMobile ? 1 : 2 }}>
              <Typography variant="body1" mb={2}>
                {api.description}
              </Typography>

              <Box mb={3}>
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography fontWeight="bold" mr={1}>
                    Endpoint:
                  </Typography>
                  <CopyToClipboard text={api.endpoint} onCopy={handleCopy}>
                    <Tooltip title="Copy to clipboard">
                      <IconButton size="small">
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </CopyToClipboard>
                </Box>

                <SyntaxHighlighter
                  language="json"
                  style={vscDarkPlus}
                  customStyle={{
                    borderRadius: 8,
                    fontSize: 14,
                    padding: 16,
                    backgroundColor: "#1e1e1e",
                    margin: 0,
                  }}
                >
                  {`"${api.endpoint}"`}
                </SyntaxHighlighter>
              </Box>

              {Array.isArray(api.params) && (
                <Paper
                  sx={{
                    overflowX: "auto",
                    mb: 3,
                    borderRadius: 2,
                    backgroundColor: "#fafafa",
                    p: 1,
                  }}
                  elevation={0}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><b>Parameter</b></TableCell>
                        <TableCell><b>Requirement</b></TableCell>
                        <TableCell><b>Description</b></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {api.params.map((param, i) => (
                        <TableRow key={i}>
                          <TableCell>{param.name}</TableCell>
                          <TableCell>{param.requirement}</TableCell>
                          <TableCell>{param.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              )}

              {api.tryItSamples && (
                <Box
                  sx={{
                    border: "1px solid #444",
                    borderRadius: 2,
                    mb: 3,
                    backgroundColor: "#1e1e1e",
                  }}
                >
                  <Tabs
                    value={currentCodeTab}
                    onChange={(e, newValue) => handleCodeTabChange(index, newValue)}
                    sx={{ borderBottom: "1px solid #555", px: 2 }}
                  >
                    <Tab label="Curl" />
                    <Tab label="JavaScript" />
                    <Tab label="Python" />
                  </Tabs>

                  <Box sx={{ position: "absolute", top: 8, right: 16 }}>
                    <CopyToClipboard
                      text={
                        api.tryItSamples?.[["curl", "javascript", "python"][currentCodeTab]] || ""
                      }
                      onCopy={handleCopy}
                    >
                      <Tooltip title="Copy">
                        <IconButton sx={{ color: "white" }}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </CopyToClipboard>
                  </Box>

                  <SyntaxHighlighter
                    language={["bash", "javascript", "python"][currentCodeTab]}
                    style={vscDarkPlus}
                    customStyle={{
                      borderRadius: "0 0 8px 8px",
                      fontSize: 14,
                      padding: 16,
                      margin: 0,
                    }}
                  >
                    {api.tryItSamples?.[["curl", "javascript", "python"][currentCodeTab]] ||
                      "// No sample available"}
                  </SyntaxHighlighter>
                </Box>
              )}

              {api.sampleResponse && (
                <Box>
                  <Typography fontWeight="bold" mb={1}>
                    Sample Response
                  </Typography>
                  <SyntaxHighlighter
                    language="json"
                    style={vscDarkPlus}
                    customStyle={{
                      borderRadius: 2,
                      fontSize: 14,
                      padding: 16,
                    }}
                  >
                    {JSON.stringify(api.sampleResponse, null, 2)}
                  </SyntaxHighlighter>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        );
      })}

      <Snackbar
        open={snackbar}
        autoHideDuration={2000}
        onClose={() => setSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setSnackbar(false)} severity="success" sx={{ width: "100%" }}>
          Copied to clipboard!
        </Alert>
      </Snackbar>
    </Box>
  );
}
