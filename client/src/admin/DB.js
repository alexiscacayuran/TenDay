import React, { useState, useEffect } from "react";
import { Box, Typography, IconButton, Card, CardContent, Grid, Avatar, Menu, MenuItem, Button, Switch } from "@mui/joy";
import { List, ListItem, ListItemText } from "@mui/material";
import { Tooltip, Stack } from "@mui/material";
import { PieChart as PieIcon, BarChart as BarIcon, ShowChart as LineIcon } from "@mui/icons-material"; 
import axios from "axios";

import MenuIcon from "@mui/icons-material/Menu";
import BusinessIcon from "@mui/icons-material/Business";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import PersonIcon from "@mui/icons-material/Person";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import logoText from "../assets/logo.png";
import dashboardMorning from "../assets/img/dashboard-morning.png";
import dashboardRain from "../assets/img/dashboard-rain.png";
import sunImage from "../assets/img/sun.png";
import cloudImage from "../assets/img/cloud.png";
import lightningImage from "../assets/img/lightning2.png";
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';

const drawerWidth = 180;

const Dashboard = ({ setIsAuthenticated }) => {
  const icons = [
    <LocationCityIcon />,
    <DescriptionOutlinedIcon />,
    <PersonOutlineOutlinedIcon />,
    <HelpOutlineOutlinedIcon />,
  ];
  const [open, setOpen] = useState(false);
  const [userName, setUserName] = useState("Loading...");
  const [anchorEl, setAnchorEl] = useState(null); // Controls Avatar menu
  const [stats, setStats] = useState([
    { title: "Municipalities", value: "0", icon: <BusinessIcon />, bg: "#cce5ff" },
    { title: "Files", value: "0", icon: <InsertDriveFileIcon />, bg: "#cce5ff" },
    { title: "Users", value: "0", icon: <PersonIcon />, bg: "#cce5ff" },
    { title: "Unknown", value: "N/A", icon: <HelpOutlineIcon />, bg: "#cce5ff" }
  ]);

  const [weatherMode, setWeatherMode] = useState("sunny");
  const today = new Date().toISOString().split("T")[0]; // Get current date
  const cardColors = ["#e3f2fd", "#e8f5e9", "#ffebee", "#fffde7"];
  const cardText = ["#42a5f5", "#66bb6a", "#e47070", "#ffd552"];
  const parText = "#55697e";
  const headText = "#4994da";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:5000/dashboard", {
          method: "POST",
          headers: { token: localStorage.getItem("token") }
        });

        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }

        const data = await response.json();
        console.log("Fetched Data:", data);

        setUserName(data.name || "User");
        setStats([
          { title: "Municipalities", value: data.municities ? Number(data.municities).toLocaleString() : "0", icon: <BusinessIcon />, bg: "#cce5ff" },
          { title: "File Log", value: data.myFiles || "0", icon: <InsertDriveFileIcon />, bg: "#cce5ff" },
          { title: "API Log", value: data.api || "0", icon: <PersonIcon />, bg: "#cce5ff" },
          
          { title: "Unknown", value: "N/A", icon: <HelpOutlineIcon />, bg: "#cce5ff" }
        ]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        const response = await fetch(
          `/date?municity=Quezon City&province=Metro Manila&date=${today}`
        );
        const data = await response.json();

        if (data.error) {
          console.error("API Error:", data.error);
          return;
        }

              // Log success if data is fetched successfully
      console.log("Success: Data fetched", data);

        // Set weather mode based on rainfall
        if (data.forecast?.rainfall?.total >= 5) {
          setWeatherMode("rainy");
        } else {
          setWeatherMode("sunny");
        }
      } catch (error) {
        console.error("Error fetching forecast:", error);
      }
    };

    fetchWeatherData();
  }, [today]);

  // Open the avatar menu
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  
  // Close the avatar menu
  const handleMenuClose = () => setAnchorEl(null);

  const handleWeatherToggle = () => {
    setWeatherMode((prevMode) => (prevMode === "sunny" ? "rainy" : "sunny"));
  };

  // Logout function
  const logout = (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    setIsAuthenticated(false); 
  };

  const [chartType, setChartType] = useState("pie");
  const [chartData, setChartData] = useState([]);
  const COLORS = ["#42a5f5", "#e47070", "#66bb6a", "#ffd552"];
  useEffect(() => {
    axios.get("http://localhost:5000/apiPie").then((response) => {
      setChartData(response.data);
    });
  }, []);

  const formattedData = chartData.map((item, index) => ({
    label: item.organization,
    value: item.count,
    color: COLORS[index % COLORS.length],
  }));


  return (
    <Box sx={{ display: "flex", minHeight: "100vh", width: "100vw", overflowX: "hidden" }}>
      {/* Sidebar Drawer */}
      <Box
        sx={{
          width: open ? drawerWidth : 0,
          transition: "width 0.3s ease-in-out",
          overflow: "hidden",
          background: "white",
          padding: open ? 2 : 0,
          minHeight: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          margin: "1%",
          borderRadius: "20px"
        }}
      >
        {open && <Typography level="h4">Sidebar Menu</Typography>}
      </Box>

      {/* Main Section */}
      <Box sx={{ flexGrow: 1, transition: "margin-left 0.3s ease-in-out", marginLeft: open ? `${drawerWidth + 15}px` : 0, }}>
        {/* Navbar */}
        <Box
          sx={{
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "white",
            margin: "1%",
            borderRadius: "20px",
            padding: "0 20px"
          }}
        >
          {/* Left: Menu Button and Logo */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton onClick={() => setOpen(!open)} variant="plain" color="neutral" style={{ marginRight: "10px" }}>
              <MenuIcon />
            </IconButton>
            <img src={logoText} alt="Logo" style={{ height: "40px" }} />
          </Box>

          {/* Right: Avatar with Dropdown Menu */}
          <Box>
            <IconButton onClick={handleMenuOpen}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: "#e3f2fd",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#42a5f5",
              }}
            >
              <PersonIcon sx={{ width: 24, height: 24 }} />
            </Box>
          </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              sx={{ marginTop: "10px" }}
            >
              <MenuItem>
                <Typography variant="body2">Weather Mode</Typography>
                <Switch checked={weatherMode === "rainy"} onChange={handleWeatherToggle} />
                <Typography variant="body2">{weatherMode.charAt(0).toUpperCase() + weatherMode.slice(1)}</Typography>
              </MenuItem>
              <MenuItem onClick={logout}>Sign Out</MenuItem>
            </Menu>
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ padding: 2, marginLeft: "2%", marginRight: "2%" }}>
          <Grid container spacing={3} sx={{ minHeight: "270px"}}>
            {/* Left: Welcome Section */}
            <Grid item xs={12} md={6}>
          <Card
            sx={{
              height: "100%",
              padding: 3,
              background: "white",
              borderRadius: "20px",
              border: "none",
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              position: "relative",
              overflow: "hidden",
            }}
          >
        {/* Left: Image Container */}
        <Box sx={{ position: "relative", 
              height: "200px", 
              overflow: "hidden",
              transition: "opacity 0.8s ease-in-out",
              opacity: weatherMode === "rainy" ? 1 : 0.9,
        }}>
          {/* Weather Effects */}
          {weatherMode === "sunny" ? (
            <>
              {/* Sun Image */}
              <img
                src={sunImage}
                alt="Sun"
                style={{
                  position: "absolute",
                  top: "1px",
                  left: "5px",
                  width: "60px",
                  zIndex: 0,
                  opacity: 0.8,
                  animation: "rotateSun 25s linear infinite",
                  transition: "opacity 0.8s ease-in-out",
                }}
              />

              {/* Moving Clouds */}
              {[...Array(3)].map((_, index) => (
                <img
                  key={index}
                  src={cloudImage}
                  alt={`Cloud ${index + 1}`}
                  style={{
                    position: "absolute",
                    top: `${20 + index * 40}px`,
                    left: "-100px",
                    width: `${80 + index * 10}px`,
                    opacity: 0.99 - index * 0.2,
                    transition: "opacity 0.8s ease-in-out",
                    animation: `moveCloud${index % 2 === 0 ? "Right" : "Left"} ${
                      15 + index * 3
                    }s linear infinite`,
                  }}
                />
              ))}
            </>
          ) : (
            <>
            {/* Lightning Bolts (Random Positions & Flashing Effect) */}
            <img
              src={lightningImage}
              alt="Lightning 1"
              style={{
                position: "absolute",
                top: "10px",
                left: "10px",
                width: "60px",
                opacity: 0,
                zIndex: 0,
                animation: "flashLightning 0.8s infinite alternate",
                transition: "opacity 0.8s ease-in-out",
              }}
            />
            <img
              src={lightningImage}
              alt="Lightning 2"
              style={{
                position: "absolute",
                top: "105px",
                left: "5px",
                width: "70px",
                opacity: 0,
                zIndex: 0,
                animation: "flashLightning 1s infinite alternate",
                transition: "opacity 0.8s ease-in-out",
              }}
            />
            <img
              src={lightningImage}
              alt="Lightning 3"
              style={{
                position: "absolute",
                top: "10px",
                left: "210px",
                width: "80px",
                opacity: 0,
                zIndex: 0,
                animation: "flashLightning 0.6s infinite alternate",
                transition: "opacity 0.8s ease-in-out",
              }}
            />

              {/* Raindrops */}
              {[...Array(50)].map((_, index) => (
                <div
                  key={index}
                  style={{
                    position: "absolute",
                    top: `${Math.random() * 1}%`,
                    left: `${Math.random() * 90}%`,
                    width: "1px",
                    height: "6px",
                    backgroundColor: "#7c9cbc",
                    opacity: 0.5,
                    animation: `fallRain ${Math.random() * 1.5 + 0.5}s linear infinite`,
                    transition: "opacity 0.8s ease-in-out",
                  }}
                />
              ))}
            </>
          )}

          {/* Dashboard Image */}
          <img
            src={weatherMode === "rainy" ? dashboardRain : dashboardMorning}
            alt="Dashboard Illustration"
            style={{
              height: "200px",
              flexShrink: 0,
              position: "relative",
              zIndex: 1,
              transition: "background-image 1s ease-in-out",
            }}
          />
        </Box>

        {/* Right: Text Section */}
        <Box sx={{ flex: 1, textAlign: { xs: "center", md: "left" } }}>
          <Typography sx={{ color: "#FFA500", marginBottom: "-2%", fontSize: "0.9rem", lineHeight: 1, fontWeight: 600 }}>
            WELCOME,
          </Typography>
          <Typography sx={{ fontWeight: "bold", fontSize: "1.8rem" }}>
            <span style={{ color: headText }}>{userName.toUpperCase()}!</span> 🎉
          </Typography>
          <Typography sx={{ color: parText, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            Your dashboard is your command center where you can track progress and stay organized.
          </Typography>
          <Button
            endDecorator={<KeyboardArrowRight />}
            variant="soft"
            sx={{
              marginTop: 2,
            }}
          >
            Explore Now!
          </Button>
        </Box>
      </Card>

      {/* CSS Keyframes */}
      <style>
        {`
          @keyframes rotateSun {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes moveCloudRight {
            0%   { left: 200px; opacity: 0; }    /* Start hidden */
            3%   { opacity: 0; }                 /* Keep hidden */
            10%  { opacity: 1; }                 /* Fade in */
            50%  { left: 150px; opacity: 1; }    /* Fully visible */
            90%  { opacity: 1; }                 /* Maintain visibility */
            97%  { opacity: 0; }                 /* Start fading */
            100% { left: 200px; opacity: 0; }     /* Fully hidden */
          }

          @keyframes moveCloudLeft {
            0%   { left: -10px; opacity: 0; }    /* Start hidden */
            3%   { opacity: 0; }                 /* Keep hidden */
            10%  { opacity: 1; }                 /* Fade in */
            50%  { left: 20px; opacity: 1; }     /* Fully visible */
            90%  { opacity: 1; }                 /* Maintain visibility */
            97%  { opacity: 0; }                 /* Start fading */
            100% { left: -10px; opacity: 0; }    /* Fully hidden */
          }

          @keyframes fallRain {
            0% { transform: translateY(0); opacity: 0.8; }
            100% { transform: translateY(25vh); opacity: 0; }
          }

          @keyframes flashLightning {
            0%, 100% { opacity: 0; }  /* Invisible at start and end */
            50% { opacity: 1; }       /* Visible in the middle */
          }

          @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; 
          }
        `}
      </style>
    </Grid>

            {/* Right: Stats Section */}
            <Grid item xs={24} sm={12} md={6} >
            <Grid container spacing={2} sx={{ width: "103%" }}>
              {stats.map((stat, index) => (
                <Grid key={index} item xs={12} sm={6} sx={{ display: "flex" }}>
                  <Card
                    variant="outlined"
                    sx={{
                        background: "white",
                        textAlign: "center",
                        minWidth: open ? "295px" : "345px",
                        height: "120px",
                        padding: 2,
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        transition: "min-width 0.3s ease-in-out",
                        borderRadius: "20px",
                        border: "none",
                        display: "flex", gap: 2
                    }}
                  >
                    {/* Left: Icon inside a light blue rounded background */}
                    <Box
                      sx={{
                        bgcolor: cardColors[index % cardColors.length],
                        width: "25%",
                        height: "80%",
                        borderRadius: "12px", // Rounded box for icon
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 2,
                      }}
                    >
                        {React.cloneElement(stat.icon, { sx: { height: "50%", width: "50%", color: cardText[index % cardText.length] } })}
                    </Box>

                    {/* Right: Title & Number */}
                    <Box>
                      <Typography fontSize="14px" color="textSecondary" sx={{textAlign:"start", lineHeight: 1, color: parText}}>
                        {stat.title}
                      </Typography>
                      <Typography fontSize="40px" fontWeight="480" sx={{textAlign:"start", lineHeight: 1, color: parText}}>
                        {stat.value}
                      </Typography>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>

            </Grid>
          </Grid>
        </Box>
  {/* Bottom */}
        <Box sx={{ padding: 2, marginLeft: "2%", marginRight: "2%", marginTop: "-10px" }}>
  <Grid container spacing={3} sx={{ minHeight: "330px" }}>
    {/* Left Section: Two Boxes Side by Side, Filling the Full Width */}
    <Grid item xs={12} md={6} sx={{ display: "flex", gap: 2}}>
      <Card sx={{ flex: 1, height: "100%", borderRadius: "20px", padding: 2, border:"none"}}>
        <CardContent>
          <Typography level="h5">Small Box 1</Typography>


          <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={1} p={3}>
            {/* Left Panel: Buttons */}
            <Box display="flex" flexDirection="column" alignItems="center" gap={2}  sx={{ 
                  backgroundColor: "green", 
    display: "flex", 
    justifyContent: "center", 
    alignItems: "center", 
  }}>
              <Stack spacing={2}>
                <Button 
                  variant="contained" 
                  onClick={() => setChartType("pie")} 
                  sx={{ width: "30%",
                    bgcolor: chartType === "pie" ? "#42a5f5" : "#e3f2fd",
                    "&:hover": { bgcolor: chartType === "pie" ? "#42a5f5" : "#bbdefb" }
                  }}
                >
                  <PieIcon sx={{ color: chartType === "pie" ? "#e3f2fd" : "#42a5f5" }} />
                </Button>
                <Button 
                  variant="contained" 
                  onClick={() => setChartType("bar")} 
                  sx={{ width: "30%",
                    bgcolor: chartType === "bar" ? "#42a5f5" : "#e3f2fd",
                    "&:hover": { bgcolor: chartType === "bar" ? "#42a5f5" : "#bbdefb" }
                  }}
                >
                  <BarIcon sx={{ color: chartType === "bar" ? "#e3f2fd" : "#42a5f5" }} />
                </Button>
                <Button 
                  variant="contained" 
                  onClick={() => setChartType("line")} 
                  sx={{ width: "30%",
                    bgcolor: chartType === "line" ? "#42a5f5" : "#e3f2fd",
                    "&:hover": { bgcolor: chartType === "line" ? "#42a5f5" : "#bbdefb" }
                  }}
                >
                  <LineIcon sx={{ color: chartType === "line" ? "#e3f2fd" : "#42a5f5" }} />
                </Button>
              </Stack>
            </Box>
                  
      {/* Right Panel: Chart */}
      <Box flex={1}  
      sx={{ 
    backgroundColor: "red", 
    display: "flex", 
    justifyContent: "center", 
    alignItems: "center" 
  }} >
  {chartType === "pie" && (
    <PieChart series={[{ data: formattedData, arcLabel: null }]} 
    width={250} 
    height={250} />
  )}
  
  {chartType === "bar" && (
    <BarChart
      xAxis={[{ scaleType: "band", data: formattedData.map((item) => item.label) }]}
      series={[{ data: formattedData.map((item) => item.value) }]}
      width={250}
      height={250}
    />
  )}
  
  {chartType === "line" && (
    <LineChart
      xAxis={[{ scaleType: "point", data: formattedData.map((item) => item.label) }]}
      series={[{ data: formattedData.map((item) => item.value) }]}
      width={250}
      height={250}
    />
  )}
</Box>
    </Box>



        </CardContent>
      </Card>
      <Card sx={{ flex: 1, height: "100%", borderRadius: "20px", padding: 2, border:"none" }}>
        <CardContent>
          <Typography level="h5">Small Box 2</Typography>
          <Typography level="body2">Content goes here</Typography>
        </CardContent>
      </Card>
    </Grid>

    {/* Right Section: One Big Box */}
    <Grid item xs={12} md={6}>
      <Card sx={{ height: "100%", borderRadius: "20px", padding: 2, border:"none" }}>
        <CardContent>
          <Typography level="h4">Big Box</Typography>
          <Typography level="body2">This is the larger content box.</Typography>
        </CardContent>
      </Card>
    </Grid>
  </Grid>
</Box>

      </Box>
    </Box>
  );
};

export default Dashboard;
