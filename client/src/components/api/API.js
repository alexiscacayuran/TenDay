import React, { useState, useEffect, useRef } from "react";
import { Box, CssBaseline, Typography } from "@mui/material";
import Navbar from "./Navbar";
import WelcomeSection from "./Welcome";
import GettingStarted from "./gettingStarted";
import Concept from "./Concept";
import Products from "./Products";
import Load from "./Load";

const sections = ["Welcome", "Getting Started", "Concepts", "Products"];

export default function APIDocumentation() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [loading, setLoading] = useState(true);   
  const [fadeOut, setFadeOut] = useState(false); 

  const sectionRefs = useRef(sections.map(() => React.createRef()));

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
      const offsetY = window.scrollY + 100;

      sectionRefs.current.forEach((ref, i) => {
        const el = ref.current;
        if (el) {
          const top = el.offsetTop;
          const bottom = top + el.offsetHeight;
          if (offsetY >= top && offsetY < bottom) {
            setSelectedTab(i);
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    const timer = setTimeout(() => {
      setFadeOut(true); 
      setTimeout(() => {
        setLoading(false); 
        window.dispatchEvent(new Event("resize")); 
      }, 500);
    }, 1200);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
    sectionRefs.current[newValue].current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <Box sx={{ fontFamily: "Commissioner, sans-serif" }}>
      <CssBaseline />

      {/* 👇 Full-screen loader with fade-out */}
      {loading && (
        <Box
          sx={{
            position: "fixed",
            zIndex: 3000,
            width: "100vw",
            height: "100vh",
            transition: "opacity 0.5s ease",
            opacity: fadeOut ? 0 : 1,
          }}
        >
          <Load />
        </Box>
      )}

      {/* 👇 Actual API page, hidden while loading */}
      <Box sx={{ opacity: loading ? 0 : 1, transition: "opacity 0.5s ease" }}>
        <Navbar
          selectedTab={selectedTab}
          handleTabChange={handleTabChange}
          scrolled={scrolled}
          sections={sections}
        />

        <Box>
          {sections.map((label, i) => (
            <Box
              key={label}
              ref={sectionRefs.current[i]}
              sx={{
                minHeight: "100vh",
                scrollMarginTop: "64px",
                backgroundColor: label === "Welcome" ? "#f9f9f9" : "inherit",
                p: 0,
                m: 0,
              }}
            >
              {label === "Welcome" ? (
                <WelcomeSection />
              ) : label === "Getting Started" ? (
                <GettingStarted />
              ) : label === "Concepts" ? (
                <Concept />
              ) : label === "Products" ? (
                <Products /> 
              ) : null}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
