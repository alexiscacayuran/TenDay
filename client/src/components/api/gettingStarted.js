import React from "react";
import { Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import { useInView } from "react-intersection-observer";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const steps = [
  {
    title: "Step 1: Prepare Your Request Letter",
    details: `Draft an official request letter addressed to:
NATHANIEL T. SERVANDO
Administrator

Thru:
THELMA A. CINCO – Project Leader, CIS4A&H
MAXIMO F. PERALTA – Chief, Engineering and Technical Services Division

Your letter must include:
• The purpose of API use
• When and where the API will be used
• Your full name, email address, and phone number

Don’t forget to fill out the required request form and review the guidelines.`,
  },
  {
    title: "Step 2: Wait for Approval",
    details: `You will receive a notification via email regarding the status of your request.

If approved, the email will contain:
• Your API token
• A validation link

If declined, you may revise your submission and reapply.`,
  },
  {
    title: "Step 3: Activate Your API Access",
    details: `Click the validation link provided in the approval email to activate your access.

Once activated:
• Your API token becomes valid
• You may begin making authenticated requests`,
  },
  {
    title: "Step 4: Authenticate Your Requests",
    details: `Include your API token in the Authorization header of each request.

Example:`,
    code: `GET /api/tenday/date?province=Sorsogon&date=2025-07-08

Headers: {
  "token": "YOUR_API_TOKEN"
}`,
  },
  {
    title: "Step 5: Start Using the API",
    details: `You’re now ready to integrate TenDay forecast data into your application. 

Refer to the full documentation to explore available endpoints, query parameters, response formats, and data upload options.`,
  },
];

const StepBox = ({ title, details, color, code }) => {
  const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true });

  return (
    <Box
      ref={ref}
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        borderRadius: "20px",
        background: "rgba(255, 255, 255, 0.2)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25)",
        padding: 3,
        marginBottom: 6,
        color: "#fff",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        fontFamily: "Commissioner, sans-serif",
        overflow: "hidden",
        transform: inView ? "translateY(0px)" : "translateY(50px)",
        opacity: inView ? 1 : 0,
        transition: "all 0.9s ease-in-out",
        "&::before": {
          content: '""',
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "12px",
          background: `linear-gradient(to bottom, ${color}, ${color}80)`,
          borderRadius: "10px",
        },
      }}
    >
      <Box
        sx={{
          width: "fit-content",
          borderRight: "2px solid rgba(255,255,255,0.75)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          fontFamily: "Commissioner, sans-serif",
          fontSize: "1.25rem",
          fontWeight: "bold",
          animation: inView
            ? "typing 3s steps(40, end), blink .75s step-end infinite"
            : "none",
          "@keyframes typing": {
            from: { width: 0 },
            to: { width: "100%" },
          },
          "@keyframes blink": {
            "0%, 100%": { borderColor: "transparent" },
            "50%": { borderColor: "#fff" },
          },
        }}
      >
        {title}
      </Box>

      <Typography
        component="div"
        sx={{
          whiteSpace: "pre-line",
          lineHeight: 1.8,
          fontSize: "1rem",
          fontFamily: "Commissioner, sans-serif",
          color: "#fff",
          mt: 2,
        }}
      >
        <span
          dangerouslySetInnerHTML={{
            __html: details
              .replace(
                "request form",
                `<a href="https://drive.google.com/file/d/1vJM2mkWta4gvpSd4xtmGIVA3xtJmWcN-/view" target="_blank" rel="noopener noreferrer" style="color:#ffe; text-decoration:underline; font-weight:500;">request form</a>`
              )
              .replace(
                "guidelines",
                `<a href="https://drive.google.com/file/d/1bUbGzNplkXPZFgeiQG9nmyrp6rHJyQRP/view" target="_blank" rel="noopener noreferrer" style="color:#ffe; text-decoration:underline; font-weight:500;">guidelines</a>`
              ),
          }}
        />
      </Typography>

      {code && (
        <SyntaxHighlighter
          language="http"
          style={vscDarkPlus}
          customStyle={{
            borderRadius: "10px",
            padding: "16px",
            fontSize: "0.95rem",
            background: "#1e1e1e",
            marginTop: "16px",
          }}
        >
          {code}
        </SyntaxHighlighter>
      )}
    </Box>
  );
};

const GettingStarted = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const stepColors = ["#09bdec", "#3f79ff", "#53d1e4", "#4388dd", "#09bdec"];

  return (
    <Box
      px={isMobile ? 2 : 10}
      py={8}
      sx={{
        minHeight: "100vh",
        fontFamily: "Commissioner, sans-serif",
        background: "linear-gradient(270deg, #09bdec, #3f79ff, #53d1e4)",
        backgroundSize: "600% 600%",
        animation: "moveGradient 15s ease infinite",
        "@keyframes moveGradient": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      }}
    >
      <Typography
        variant="h4"
        fontWeight="bold"
        gutterBottom
        sx={{
          color: "#fff",
          textShadow: "0 1px 3px rgba(0,0,0,0.3)",
          fontFamily: "Commissioner, sans-serif",
        }}
      >
        Getting Started
      </Typography>

      <Typography
        sx={{
          mb: 5,
          maxWidth: 2000,
          mx: "auto",
          textAlign: "justify",
          lineHeight: 1.9,
          fontSize: "1.05rem",
          color: "#f0f0f0",
          textShadow: "0 1px 2px rgba(0,0,0,0.2)",
          fontFamily: "Commissioner, sans-serif",
        }}
      >
        To start using the TenDay Forecast API, just send a request, wait for
        approval, activate your token, and use it in your requests. Follow the
        steps below to begin.
      </Typography>

      {steps.map((step, index) => (
        <StepBox
          key={index}
          title={step.title}
          details={step.details}
          code={step.code}
          color={stepColors[index % stepColors.length]}
        />
      ))}
    </Box>
  );
};

export default GettingStarted;
