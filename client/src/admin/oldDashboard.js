import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, IconButton, Card, CardContent, Grid, Avatar, Menu, Button, Switch, Modal, Tooltip as MuiTooltip } from "@mui/joy";
import { List, ListItem, ListItemText } from "@mui/material";
import { Stack, Skeleton, Dialog, DialogContent, DialogTitle } from "@mui/material";
import { Select, MenuItem, FormControl, InputLabel, Backdrop, Fade, Checkbox, Alert } from "@mui/material";
import axios from "axios";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, LineChart, Line, ResponsiveContainer, Tooltip as RechartsTooltip  } from "recharts";
import { CircularProgress } from "@mui/material";
import { PieChart as PieIcon, BarChart as BarIcon, ShowChart as LineIcon } from "@mui/icons-material";
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder } from "@fortawesome/free-solid-svg-icons";
import { faCaretDown, faCaretLeft, faCaretRight } from "@fortawesome/free-solid-svg-icons";
import dayjs from 'dayjs';
import Badge from '@mui/material/Badge';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { DayCalendarSkeleton } from '@mui/x-date-pickers/DayCalendarSkeleton';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import Lottie from "lottie-react";

import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Slide from '@mui/material/Slide';
import { styled } from '@mui/system';

import DriveFolderUploadIcon from '@mui/icons-material/DriveFolderUpload';
import MenuIcon from "@mui/icons-material/Menu";
import BusinessIcon from "@mui/icons-material/Business";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import InfoIcon from '@mui/icons-material/Info';
import PersonIcon from "@mui/icons-material/Person";
import logoText from "../assets/logo.png";
import dashboardMorning from "../assets/img/dashboard-morning.webp";
import dashboardRain from "../assets/img/dashboard-rain.webp";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import sunImage from "../assets/img/sun.webp";
import cloudImage from "../assets/img/cloud.webp";
import lightningImage from "../assets/img/lightning2.webp";
import noData from "../assets/img/noData.webp";
import tenday1 from '../assets/img/tenday-1.webp'; 
import tenday2 from '../assets/img/tenday-2.webp';  
import seasonal1 from '../assets/img/seasonal-1.webp'; 
import seasonal2 from '../assets/img/seasonal-2.webp'; 
import uploadImage from '../assets/img/items-1.webp';
import uploadImageHover from '../assets/img/items-2.webp';
import calendarHeader from '../assets/img/calendar-header.webp';
import cloudAnimation from '../assets/img/cloudAnimation.webp';
import successAnimation from '../assets/img/Success.json';
import failedAnimation from '../assets/img/Failed.json';
import edgeLeft from '../assets/img/edgeLS.png';
import edgeRight from '../assets/img/edgeRS.png';

const drawerWidth = 180;

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Custom day renderer to add badge for highlighted days
const ServerDay = (props) => {
  const { highlightedDays = [], day, outsideCurrentMonth, ...other } = props;
  const isSelected =
    !outsideCurrentMonth && highlightedDays.indexOf(day.date()) >= 0;

  return (
    <Badge
      key={day.toString()}
      overlap="circular"
      badgeContent={isSelected ? '📍' : undefined} // Badge for highlighted days
    >
      {/* Only show Tooltip for highlighted days */}
      {isSelected ? (
        <MuiTooltip title="Latest Issuance Date" placement="top" arrow>
          <PickersDay {...other} outsideCurrentMonth={outsideCurrentMonth} day={day} />
        </MuiTooltip>
      ) : (
        <PickersDay {...other} outsideCurrentMonth={outsideCurrentMonth} day={day} />
      )}
    </Badge>
  );
};

const Dashboard = ({ setIsAuthenticated }) => {
  const [open, setOpen] = useState(false);
  const [userName, setUserName] = useState("Loading...");
  const [anchorEl, setAnchorEl] = useState(null); // Controls Avatar menu
  const [stats, setStats] = useState([
    { title: "Municipalities", value: "0", icon: <BusinessIcon />, bg: "#cce5ff" },
    { title: "Files", value: "0", icon: <InsertDriveFileIcon />, bg: "#cce5ff" },
    { title: "Users", value: "0", icon: <SettingsSuggestIcon />, bg: "#cce5ff" },
    { title: "Unknown", value: "N/A", icon: <HelpOutlineIcon />, bg: "#cce5ff" }
  ]);
  const [loading, setLoading] = useState(true); // Add loading state
  const [weatherMode, setWeatherMode] = useState("sunny");
  const today = new Date().toISOString().split("T")[0]; // Get current date
  const cardColors = ["#e3f2fd", "#e8f5e9", "#ffebee", "#fffde7"];
  const cardText = ["#42a5f5", "#66bb6a", "#e47070", "#ffd552"];
  const parText = "#55697e";
  const headText = "#4994da";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/dashboard", {
          method: "POST",
          headers: { token: localStorage.getItem("token") }
        });

        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }

        const data = await response.json();

        setUserName(data.name || "User");
        setStats([
          { title: "Municities", value: data.municities ? Number(data.municities).toLocaleString() : "0", icon: <BusinessIcon />, bg: "#cce5ff" },
          { title: "File Log", value: data.myFiles || "0", icon: <InsertDriveFileIcon />, bg: "#cce5ff" },
          { title: "API Log", value: data.api || "0", icon: <SettingsSuggestIcon />, bg: "#cce5ff" },
          { title: "Unknown", value: "N/A", icon: <HelpOutlineIcon />, bg: "#cce5ff" }
        ]);

          // Delay for 2 seconds to simulate loading
          setTimeout(() => {
            setLoading(false);
          }, 1000);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLoading(false); // Set loading to false in case of an error
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

// Function to generate more vibrant pastel colors
const generateVibrantPastelColors = (count) => {
  const colors = [];
  for (let i = 0; i < count; i++) {
    const hue = (i * 130) % 360; // Adjust hue for smooth transition
    const vibrantPastelColor = `hsl(${hue}, 80%, 60%)`; // Saturation 60% and Lightness 70% for more vibrant pastel effect
    colors.push(vibrantPastelColor);
  }
  return colors;
};

const COLORS = generateVibrantPastelColors(1000); // Generate vibrant pastel colors for 1000 items
  const ITEMS_PER_PAGE = 5; // Show 5 labels per page
  const [data, setData] = useState([]); // Full chart data
  const [paginatedLabels, setPaginatedLabels] = useState([]); // Labels per page
  const [chartType, setChartType] = useState("pie");
  const [timeFrame, setTimeFrame] = useState("daily"); // Time frame selection
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0); // Store total labels
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all data for the chart
        const response = await axios.get(`/apiPie`);
        const allData = response.data.data.map((item, index) => ({
          name: item.organization,
          value: parseInt(item[`${timeFrame}_count`], 10),
          color: COLORS[index % COLORS.length],
        })).filter(item => item.value > 0);
  
        setData(allData); // Store full dataset
        setTotalItems(allData.length); // Total labels count
        setPaginatedLabels(allData.slice(0, ITEMS_PER_PAGE)); // Initial labels
  
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
  
    fetchData();
  }, [timeFrame]);
  
  // Update paginated labels when page changes
  useEffect(() => {
    setPaginatedLabels(data.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE));
  }, [page, data]);

  //MODAL
  const [openModal, setOpenModal] = useState(false);

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => setOpenModal(false);

    //MODAL FOR 10-DAY
    const [openModal10, setOpenModal10] = useState(false);

    const handleOpen10 = () => {
      setOpenModal10(true);
      setOpenModal(false);  
    };

    const handleClose10 = () => setOpenModal10(false);

   //Calendar
   const [highlightedDay, setHighlightedDay] = useState(null); // For the highlighted day (from API)
const [selectedDate, setSelectedDate] = useState(dayjs()); // Track selected date
const [highlightedDays, setHighlightedDays] = useState([]); // For all highlighted days
const [isLoading, setIsLoading] = useState(true); // Loading state

// Fetch the latest valid date from the API
useEffect(() => {
  const fetchValidDate = async () => {
    try {
      const response = await axios.get('http://localhost:5000/valid');
      const latestDate = dayjs(response.data.latest_date); // Parse latest_date into dayjs object
      setHighlightedDay(latestDate);
      setHighlightedDays([latestDate]); // Set the fetched date as highlighted
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching valid date:', error);
      setIsLoading(false);
    }
  };
  
  fetchValidDate();
}, []);

// Handle date selection (clicked day)
const handleDateChange = (newDate) => {
  setSelectedDate(dayjs(newDate)); // Update the selected date with the clicked day
  console.log('Selected Date:', dayjs(newDate).format('YYYY-MM-DD')); // Format it for easier readability
};


// Handle month change (when user switches months)
const handleMonthChange = (date) => {
  setIsLoading(true);
  const startOfMonth = dayjs(date).startOf('month'); // Get the first day of the selected month
  setHighlightedDays([startOfMonth]); // Highlight the first day of the new month
  setIsLoading(false);
};  

    //Preload Image
    useEffect(() => {
      const imagesToPreload = [
        uploadImageHover,
        dashboardRain,
        tenday1,
        tenday2,
        seasonal1,
        seasonal2,
        edgeLeft,
        edgeRight
      ];
    
      let loaded = 0;
    
      const handleLoad = () => {
        loaded += 1;
        if (loaded === imagesToPreload.length) {
          setLoading(false);
        }
      };
    
      imagesToPreload.forEach((src) => {
        const img = new Image();
        img.src = src;
        img.onload = handleLoad;
        img.onerror = handleLoad; // in case one fails to load, avoid hanging
      });
    }, [uploadImageHover, dashboardRain]);

    //10-day API
    const [forecastDataChecked, setForecastDataChecked] = useState(false);
    const [forecastFileChecked, setForecastFileChecked] = useState(false);
    const [windComponentChecked, setWindComponentChecked] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null); // "success" | "failed"
    const [currentMessage, setCurrentMessage] = useState('');
    const [checkboxWarning, setCheckboxWarning] = useState(false);

  
    const randomMessages = [
      'Blowing your way like a gentle breeze—madali lang \'to, hintay ka lang!',
      'Diretso na \'to—tulad ng hangin na may direksyon, hindi ka maliligaw, maghintay ka lang!',
      'Hindi lang temperature ang lumalamig, kaya chill ka lang sa paghintay ma-upload ang files mo—tapos na \'yan soon!',
      'Tulad ng pagtaas ng humidity, mataas din ang progress—mabilis lang ‘yan, parang ulan sa hapon!',
      'Your files are uploading now, please add a little patience, like waiting for the rain to stop—pero mabilis lang \'yan, hintay lang!',
      'Forecast says your files are almost there—add some positivity, and tapos na ‘yan, sunny skies ahead!'
    ];
  
    useEffect(() => {
      // Rotate messages every 10 seconds
      const interval = setInterval(() => {
        setCurrentMessage(randomMessages[Math.floor(Math.random() * randomMessages.length)]);
      }, 7000);
  
      // Clean up interval when the component unmounts
      return () => clearInterval(interval);
    }, []);
  
    // Placeholder for handleMonthChangeData
    const handleMonthChangeData = (newDate) => {
      setSelectedDate(newDate);
    };
  
    const padZero = (number) => (number < 10 ? `0${number}` : number);
  
    const handleSubmit = async () => {

        // Validation: Make sure at least one is checked
  if (!forecastDataChecked && !forecastFileChecked && !windComponentChecked) {
    setCheckboxWarning(true); // Show warning
    return; // Don't proceed with upload
  }

  setCheckboxWarning(false); // Clear warning if validation passed

      handleClose10(); // Close dialog
      setIsUploading(true);  // Show fullscreen cloud animation
      setIsLoadingData(true);  // Show loading overlay
  
      const year = selectedDate.year();
      const month = padZero(selectedDate.month() + 1);
      const day = padZero(selectedDate.date());
  
      console.log(`Date Chosen: ${year}-${month}-${day}`);
  
      const requests = [];
  
      if (forecastDataChecked) {
        requests.push(fetch(`http://localhost:5000/uploadForecastData?year=${year}&month=${month}&day=${day}`, {
          method: 'GET',
          headers: { token: localStorage.getItem("token") }
        }));
      }
  
      if (forecastFileChecked) {
        requests.push(fetch(`http://localhost:5000/uploadForecastTIF?year=${year}&month=${month}&day=${day}`, {
          method: 'GET',
          headers: { token: localStorage.getItem("token") }
        }));
      }
  
      if (windComponentChecked) {
        requests.push(fetch(`http://localhost:5000/getWind?year=${year}&month=${month}&day=${day}`, {
          method: 'GET',
          headers: { token: localStorage.getItem("token") }
        }));
      }
  
      try {
        const results = await Promise.all(
          requests.map(async (req) => {
            const res = await req;
            if (!res.ok) throw new Error('Fetch failed');
  
            const contentType = res.headers.get("content-type");
            try {
              if (contentType && contentType.includes("application/json")) {
                return await res.json();
              } else {
                return await res.text(); // Accept plain text too
              }
            } catch (err) {
              console.warn("Response is not valid JSON, but upload succeeded.");
              return null;
            }
          })
        );
        setUploadStatus("success");
      } catch (error) {
        console.error("One or more uploads failed:", error);
        setUploadStatus("failed");
      } finally {
        setIsUploading(false);     // Stop clouds animation
        setIsLoadingData(false);   // Stop loading overlay
      }
    };

  return (
    <Box   name="Module" sx={{ display: "flex", minHeight: "100vh", width: "100vw", overflowX: "hidden" }}>
      {/* Sidebar Drawer */}
      <Box
        name="SideDrawer"
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
      <Box   name="ModuleSection" sx={{ flexGrow: 1, transition: "margin-left 0.3s ease-in-out", marginLeft: open ? `${drawerWidth + 15}px` : 0, }}>
        {/* Navbar */}
        <Box
          name="Navbar"
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
            <img src={logoText} alt="Logo" style={{ height: "40px" }}   onContextMenu={(e) => e.preventDefault()} draggable={false}/>
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

        {/* Main Content (start) */}
        <Box sx={{ padding: 2, marginLeft: "2%", marginRight: "2%"}}>
          <Grid container spacing={2} sx={{ minHeight: "270px"}}>
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
                  opacity: weatherMode === "rainy" ? 1 : 0.9,
                  opacity: loading ? 0 : 1, // Initially hide the image until it's fully loaded
                  transition: "opacity 1s ease-in-out", // Fade-in effect
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
                        onContextMenu={(e) => e.preventDefault()}
                        draggable={false}
                      />

                      {/* Moving Clouds */}
                      {[...Array(3)].map((_, index) => (
                        <img
                          key={index}
                          src={cloudImage}
                          alt={`Cloud ${index + 1}`}
                          onContextMenu={(e) => e.preventDefault()}
                          draggable={false}
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
                        onContextMenu={(e) => e.preventDefault()}
                        draggable={false}
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
                        onContextMenu={(e) => e.preventDefault()}
                        draggable={false}
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
                        onContextMenu={(e) => e.preventDefault()}
                        draggable={false}
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
                  onContextMenu={(e) => e.preventDefault()}
                  draggable={false}
                  style={{
                    height: "200px",
                    flexShrink: 0,
                    position: "relative",
                    zIndex: 1,
                    opacity: loading ? 0 : 1, // Initially hide the image until it's fully loaded
                    transition: "opacity 1s ease-in-out", // Fade-in effect
                  }}
                  //onLoad={() => setLoading(false)} // Set loading to false once the image has loaded
                />
                </Box>

                {/* Right: Text Section */}
                <Box sx={{ flex: 1, textAlign: { xs: "center", md: "left" } }}>
                {loading ? (
                    <>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" />
                    </>
                  ) : (
                    <>
                  <Typography sx={{ color: "#FFA500", marginBottom: "-2%", fontSize: "0.9rem", lineHeight: 1, fontWeight: 600 }}>
                    WELCOME,
                  </Typography>
                  <Typography sx={{ fontWeight: "bold", fontSize: "1.8rem" }}>
                    <span style={{ color: headText }}>{userName.toUpperCase()}!</span> 🎉
                  </Typography>
                  <Typography sx={{ color: parText, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    Your dashboard is your command center where you can track progress and stay organized.
                  </Typography>
                  </>
                  )}
                  {loading ? (
                    <Skeleton variant="rectangular" width={120} height={40} sx={{borderRadius:"10px", marginTop: "10px"}} />
                  ) : (
                    <Button
                      endDecorator={<KeyboardArrowRight />}
                      variant="soft"
                      sx={{
                        marginTop: 2,
                      }}
                    >
                      Explore Now!
                    </Button>
                  )}
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
            <Grid container spacing={2} sx={{ marginLeft: "1px", width: "50%", padding: 1 }}>
              {stats.slice(0, 4).map((stat, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Card
                    sx={{
                      backgroundColor: "white",
                      borderRadius: "20px",
                      border: "none",
                      height: "120px",
                      boxShadow: "none",
                      display: "flex",  
                      flexDirection: "row", 
                      alignItems: "center", 
                      padding: "16px",
                    }}
                  >
                    {/* Left: Icon inside a colored box */}
                    <Box
                      sx={{
                        bgcolor: cardColors[index % cardColors.length], 
                        width: "60px", // Fixed width
                        height: "60px", // Fixed height
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "16px", // Adds spacing between icon and text
                      }}
                    >
                      
                      {loading ? (
                      <Skeleton 
                        variant="circle" 
                        width={40} 
                        height={40} 
                        sx={{ bgcolor: cardColors[index % cardColors.length] }} 
                      />
                    ) : stat.icon ? (
                      React.cloneElement(stat.icon, {
                        sx: { 
                          height: "50%", 
                          width: "50%", 
                          color: cardText[index % cardText.length] // Set the color for the icon
                        },
                      })
                    ) : (
                      <Skeleton 
                        variant="circle" 
                        width={40} 
                        height={40} 
                        sx={{ bgcolor: cardColors[index % cardColors.length] }} 
                      />
                    )}
                      </Box>

                    {/* Right: Title & Number */}
                    <Box sx={{ textAlign: "left", flexGrow: 1 }}>
                      {/* Conditional Rendering for stat.title */}
                      {loading ? (
                        <Skeleton variant="text" width="50%" />
                      ) : stat.title ? (
                        <Typography
                          fontSize="14px"
                          sx={{
                            lineHeight: 1,
                            color: parText
                          }}
                        >
                          {stat.title}
                        </Typography>
                      ) : (
                        <Skeleton variant="text" width="50%" />
                      )}

                      {/* Conditional Rendering for stat.value */}
                      {loading ? (
                        <Skeleton variant="text" width="30%" />
                      ) : stat.value ? (
                        <Typography
                          fontSize="40px"
                          fontWeight="490"
                          sx={{
                            lineHeight: 1,
                            color: parText
                          }}
                        >
                          {stat.value}
                        </Typography>
                      ) : (
                        <Skeleton variant="text" width="30%" />
                      )}
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Box>
        
        {/*Bottom*/}
        <Box sx={{ padding: 2, marginLeft: "2%", marginRight: "2%", marginTop: "-1%" }}>
        <Grid container spacing={2} sx={{ minHeight: "270px", alignItems: "stretch" }}>
          
          {/* Left Side: Two Cards Taking Full Width */}
          <Grid item xs={12} md={6} container spacing={2}>
            <Grid item xs={6}>
              <Card
                sx={{
                  height: "100%",
                  minHeight: "270px",
                  padding: 3,
                  background: "white",
                  borderRadius: "20px",
                  border: "none",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <Box sx={{ flex: 1 }}>
                </Box>
              </Card>
            </Grid>

            <Grid item xs={6}>
              <Card
                sx={{
                  height: "100%",
                  minHeight: "270px",
                  padding: 3,
                  background: "white",
                  borderRadius: "20px",
                  border: "none",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                  overflow: "hidden",
                }}
              >

{/* Right Side: Chart API Tokens */}
<Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"}}>
  
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", mb: 2}}>
      {loading ? (
  <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: 2 }} />
) : (
        <Typography variant="body2" sx={{ fontWeight: "600", fontSize: "1.5rem" }}>API Usage</Typography>
)}
        <Box sx={{ display: 'flex' }}>
        {loading ? (
  <Skeleton variant="rectangular" width={35} height={35} sx={{ borderRadius: 2, marginRight: "5px" }} />
) : (
          <IconButton 
            onClick={() => setChartType("pie")} 
            color="primary" 
            variant={chartType === "pie" ? "solid" : "soft"}
            sx={{marginRight:"5px"}}
          >
            <PieIcon />
          </IconButton>
  )}
          {loading ? (
  <Skeleton variant="rectangular" width={35} height={35} sx={{ borderRadius: 2, marginRight: "5px" }} />
) : (
          <IconButton 
            onClick={() => setChartType("bar")} 
            color="primary" 
            variant={chartType === "bar" ? "solid" : "soft"}
            sx={{marginRight:"5px"}}
          >
            <BarIcon />
          </IconButton>
)}
 {/*       {loading ? (
  <Skeleton variant="rectangular" width={35} height={35} sx={{ borderRadius: 2, marginRight: "5px" }} />
) : (
          <IconButton 
            onClick={() => setChartType("line")} 
            color="primary" 
            variant={chartType === "line" ? "solid" : "soft"}
            sx={{marginRight:"5px"}}
          >
            <LineIcon />
          </IconButton>
)}*/}
        </Box>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
          <Box sx={{  alignItems: "center", display: open ? "hidden" : "flex", }}>
            <Box sx={{ flex: 2, display: "flex", justifyContent: "center", marginLeft: open ? 40 : 0}}>
            {loading ? (
              <Skeleton variant="rectangular" width={200} height={200} sx={{ borderRadius: 2 }} />
        ) : (
          <div style={{ textAlign: "center" }}>
          {data.length === 0 ? (
            <div>
            <img src={noData} alt="No Data Available"   onContextMenu={(e) => e.preventDefault()}
  draggable={false} style={{ width: "75%", height: "75%", objectFit: "contain" }} />
            <p style={{ fontSize: "18px", color: "#0b6bcb", fontWeight: 700 }}>No Data Found</p>
            <p style={{ fontSize: "12px", color: "#0b6bcb", lineHeight: 1}}>No relevant data available for the selected time frame.</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width={200} height={200}>
                {chartType === "pie" && (
                  <PieChart>
  {/* Outer Ring of the Donut */}
  <Pie 
    data={data} 
    cx="50%" 
    cy="50%" 
    outerRadius={100} 
    innerRadius={55} // This creates the hole for the donut
    fill="#8884d8" 
    dataKey="value"
  >
    {data.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={entry.color} />
    ))}
  </Pie>
  
  {/* Tooltip */}
  <RechartsTooltip />

</PieChart>
                )}
                {chartType === "bar" && (
                 <BarChart data={data} width={500} style={{ marginLeft: "-20%" }}>
                 <XAxis 
                   tick={{ fontSize: 10 }} // Smaller font size for X-axis numbers
                   tickLine={false} // Hide tick lines
                   strokeOpacity={0.5} // Reduce axis line opacity
                 />
                 <YAxis 
                   tick={{ fontSize: 10 }} // Smaller font size for Y-axis numbers
                   tickLine={false} // Hide tick lines
                   strokeOpacity={0.5} // Reduce axis line opacity
                 />
                <RechartsTooltip
                  cursor={{ fill: "transparent" }} 
                  labelFormatter={() => ""}  // Removes the number above the tooltip
                  formatter={(value, name, props) => [`${value}`, props.payload.name]} 
                />

                 <Bar dataKey="value">
                   {data.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Bar>
               </BarChart>
               

                )}
                {chartType === "line" && (
                  <LineChart data={data} width={500} style={{ marginLeft: "-20%" }}>
                    {/* X and Y Axes with small text and faded lines */}
                    <XAxis 
                      tick={{ fontSize: 10 }} 
                      tickLine={false} 
                      strokeOpacity={0.5} 
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }} 
                      tickLine={false} 
                      strokeOpacity={0.5} 
                    />

                    {/* Tooltip with fixed label issue */}
                    <RechartsTooltip
                      cursor={{ stroke: "#8884d8", strokeWidth: 1, strokeDasharray: "3 3" }} 
                      labelFormatter={() => ""}  // ✅ Removes the extra number above tooltip
                      formatter={(value, name, props) => [`${value}`, props.payload.name]} 
                    />

                    {/* Line Graph with Dynamic Point Colors 
                    <Line 
                      type="linear"  // ✅ Keeps line straight
                      dataKey="value" 
                      stroke="#8884d8" // ✅ Line remains a single color
                      strokeWidth={2} 
                      dot={(props) => (
                        <circle 
                          cx={props.cx} 
                          cy={props.cy} 
                          r={4}  // ✅ Sets dot size
                          fill={COLORS[props.index % COLORS.length]} // ✅ Uses a color from the array
                          stroke="white" // Optional: White stroke for contrast
                          strokeWidth={1}
                        />
                      )}
                    />*/}
                  </LineChart>

                )}
              </ResponsiveContainer>
              </>
      )}
    </div>
            )}
            </Box>
            <Box sx={{     flex: 1,
    flexDirection: "column",
    ml: 2,
    opacity: open ? 0 : 1,
    transform: open ? "scale(0.95)" : "scale(1)",
    visibility: open ? "hidden" : "visible",
    transition: "opacity 0.3s ease, transform 0.3s ease",
    height: open ? 0 : "auto",
    overflow: "hidden", // prevent layout issues when collapsed
    display: "flex", }}>

            {loading ? (
  <Skeleton variant="rectangular" width={80} height={20} sx={{ borderRadius: 2, marginBottom:"10px" }} />
) : (        
<FormControl
  size="small"
  sx={{
    maxWidth: 90,
    marginBottom: "10px",
    border: "none",
  }}
>
<Select
  value={timeFrame}
  onChange={(e) => setTimeFrame(e.target.value)}
  displayEmpty
  IconComponent={(props) => (
    <FontAwesomeIcon
      icon={faCaretDown}
      {...props}
      style={{
        color: "#12467b", 
        animation: "upDownAnimation 1s infinite alternate",  // Apply animation here
      }}
    />
  )}
  sx={{
    fontSize: "0.9rem",
    border: "none",
    borderRadius: "10px",
    backgroundColor: "#e3effb",
    color: "#12467b",
    padding: "0px",
    height: "30px",
    minHeight: "30px",
    "& fieldset": { border: "none" },
    "& .MuiOutlinedInput-notchedOutline": { border: "none" },
  }}
  MenuProps={{
    PaperProps: {
      sx: {
        border: "none",
        boxShadow: "none",
      },
    },
  }}
>
  <MenuItem value="daily">Daily</MenuItem>
  <MenuItem value="weekly">Weekly</MenuItem>
  <MenuItem value="monthly">Monthly</MenuItem>
  <MenuItem value="all_time">All Time</MenuItem>
</Select>
</FormControl>
)}



              {/* CSS Keyframes */}
              <style>
                {`
@keyframes upDownAnimation {
  0% {
    transform: translateY(0); /* Starting position */
  }
  25% {
    transform: translateY(-3px); /* Move up */
  }
  50% {
    transform: translateY(0); /* Return to starting position */
  }
  75% {
    transform: translateY(-3px); /* Starting position */
  }
  100% {
    transform: translateY(0); /* Move up */
  }
}
                `}
              </style>


{/* Labels (Paginated) */}
{loading ? (
  <Skeleton variant="rectangular" width={90} height={100} sx={{ borderRadius: 2 }} />
) : paginatedLabels.map((entry, index) => (  // ✅ No extra {}
  <Box key={index} sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
    <Box sx={{ width: 9, height: 9, backgroundColor: entry.color, borderRadius: "50%", mr: 1 }} />
    <Typography variant="body2" sx={{ lineHeight: "0.7rem", fontSize: "0.9rem" }}>
      {entry.name}
    </Typography>
  </Box>
))}


{/* Pagination Arrows */}
{loading ? (
  <Skeleton variant="rectangular" width={80} height={20} sx={{ borderRadius: 2, marginTop: "10px" }} />
) : (
<Box sx={{ display: "flex", justifyContent: "right"}}>
  <IconButton onClick={() => setPage((prev) => Math.max(prev - 1, 1))} disabled={page === 1} size="small"     sx={{
      color: "#12467b", 
      marginRight: "2px",
      padding: "4px",
      "&:hover": { backgroundColor: "#e3effb" }
    }}>
      <FontAwesomeIcon icon={faCaretLeft} fontSize="small" />
    
  </IconButton>

  <IconButton onClick={() => setPage((prev) => Math.min(prev + 1, Math.ceil(totalItems / ITEMS_PER_PAGE)))} disabled={page === Math.ceil(totalItems / ITEMS_PER_PAGE)} size="small"     sx={{
      color: "#12467b", 
      padding: "4px",
      "&:hover": { backgroundColor: "#e3effb" }
    }}>
    <FontAwesomeIcon icon={faCaretRight} fontSize="small" />
  </IconButton>
</Box>
)}





            </Box>
          </Box>
      </Box>
</Box>

              </Card>
            </Grid>
          </Grid>

          {/* Right Side: One Full-Width Card */}
          <Grid item xs={12} md={6}>
          <Card
  name="ForecastCard"
  sx={{
    height: "100%",
    minHeight: "270px",
    padding: 3,
    background: "#fff",
    borderRadius: "20px",
    border: "none",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
    marginLeft: "1%",
    marginRight: "1%",
    cursor: "default",
  }}
>
  <Box sx={{ display: "flex", width: "100%", height: "100%" }}>
  <Box
  sx={{
    width: "50%",
    cursor: "pointer",
  }}
  onClick={handleOpen}
>

  {/* Upload Box */}
  <Box
    sx={{
      height: "100%",
      borderRadius: "20px",
      textAlign: "center",
      position: "relative",
      transition: "background-color 0.3s ease-in-out",
      "&:hover img": {
        content: `url(${uploadImageHover})`,
      },":hover":{
        backgroundColor: "#eef6f9",
      }
    }}
  >
            {loading ? (
          <Skeleton
            variant="rectangular"
            width="200px"
            height="200px"
            sx={{ borderRadius: 2 }}
          />
        ) : (
    <Box
      component="img"
      src={uploadImage}
      alt="Upload"
      onContextMenu={(e) => e.preventDefault()}
      draggable={false}
      sx={{
        marginTop: 0.5,
        width: "230px",
        height: "200px",
        transition: "0.3s ease-in-out",
      }}
    />
        )}
                {loading ? (
          <Skeleton
            variant="rectangular"
            width="50%"
            height="10%"
            sx={{ borderRadius: 2, marginTop: 1 }}
          />
        ) : (
    <Typography variant="body2" sx={{ color: parText, fontWeight: 500, fontSize:'1.2rem' }}>
      Click to upload files
    </Typography>
        )}
                {loading ? (
          <Skeleton
            variant="rectangular"
            width="35%"
            height="5%"
            sx={{ borderRadius: 2, marginTop: 0.3 }}
          />
        ) : (
    <Typography variant="body2" sx={{ color: parText, fontWeight: 400, fontSize:'0.6rem', lineHeight:0.2, marginBottom: 3}}>
    <b>Accepted File Types:</b> CSV, TIF, ASC
    </Typography>
        )}
  </Box>
</Box>
    <Box sx={{ width: "50%", padding: 2 }}>
      {/* Right Box Content */}
    </Box>
  </Box>
</Card>


      <Modal
        open={openModal}
        onClose={handleClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          sx: { backgroundColor: "rgba(0, 0, 0, 0.3)", backdropFilter: "blur(10px)" },
        }}
      >
<Fade in={openModal} timeout={{ enter: 300, exit: 200 }}>
<Box
            name="backgroundModal"
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
          onClick={handleClose}
        >
          <Box
            name="ForecastModal"
            sx={{
              display: "flex",
              gap: 5,
              padding: 3,
              borderRadius: 3,
              boxShadow: 3,
              width: "60%",
              height: "60%",
            }}
            onClick={(e) => e.stopPropagation()} // Prevents closing when clicking inside modal
          >

<Box
      name="TenDayForecast"
      sx={{
        width: "50%",
        height: "100%",
        background: "#eef6f9",
        borderRadius: "20px",
        padding: 2,
        boxShadow: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        transform: "scale(0.9)",
        transition: "transform 0.3s ease-in-out, background-color 0.3s ease-in-out",
        "&:hover": {
          transform: "scale(1)",
          background: "#fff",
          cursor: "pointer",
          "& .flip-card-inner": {
            transform: "rotateY(180deg)",
          },
        },
      }}
      onClick={handleOpen10}
    >

      <Box
        sx={{
          width: "80%",
          height: "320px", 
          perspective: "1000px",
          position: "relative",
          borderRadius: "20px",
        }}
      >
        {loading ? (
          <Skeleton
            variant="rectangular"
            width="100%"
            height="100%"
            sx={{ borderRadius: 2 }}
          />
        ) : (
          <Box
            className="flip-card-inner"
            sx={{
              width: "100%",
              height: "100%",
              position: "relative",
              transformStyle: "preserve-3d",
              transition: "transform 0.8s ease-in-out",
              borderRadius: "20px",
            }}
          >
            {/* Front Image */}
            <Box
              sx={{
                width: "100%",
                height: "100%",
                position: "absolute",
                backfaceVisibility: "hidden",
              }}
            >
              <img
                src={tenday1}
                alt="Seasonal Forecast Front"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "20px",
                }}
                onContextMenu={(e) => e.preventDefault()}
                draggable={false}
              />
            </Box>

            {/* Back Image */}
            <Box
              sx={{
                width: "100%",
                height: "100%",
                position: "absolute",
                transform: "rotateY(180deg)",
                backfaceVisibility: "hidden",
              }}
            >
              <img
                src={tenday2}
                alt="Seasonal Forecast Back"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "20px",
                }}
                onContextMenu={(e) => e.preventDefault()}
                draggable={false}
              />
            </Box>
          </Box>
        )}
      </Box>

      {loading ? (
        <Skeleton
          variant="rectangular"
          width={180}
          height={40}
          sx={{ borderRadius: 2, padding: "10px", marginTop: "10px" }}
        />
      ) : (
        <Typography
          sx={{
            marginTop: 2,
            textAlign: "center",
            color: "#0b6bcb",
            fontSize: "1.5rem",
            fontWeight: "600",
          }}
        >
          10-Day Forecast
        </Typography>
      )}

<Typography
          sx={{
            marginTop: 1,
            textAlign: "center",
            fontSize: "0.9rem",
            fontWeight: "400",
            lineHeight: 1
          }}
        >
          Upload short-range weather data to keep the 10-day forecast accurate and up-to-date.
        </Typography>
    </Box>


    <Box
      name="SeasonalForecast"
      sx={{
        width: "50%",
        height: "100%",
        background: "#eef6f9",
        borderRadius: "20px",
        padding: 2,
        boxShadow: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        transform: "scale(0.9)",
        transition: "transform 0.3s ease-in-out, background-color 0.3s ease-in-out",
        "&:hover": {
          transform: "scale(1)",
          background: "#fff",
          cursor: "pointer",
          "& .flip-card-inner": {
            transform: "rotateY(180deg)",
          },
        },
      }}
    >
      <Box
        sx={{
          width: "80%",
          height: "320px", // Fixed height to match Skeleton and images
          perspective: "1000px",
          position: "relative",
          borderRadius: "20px",
        }}
      >
        {loading ? (
          <Skeleton
            variant="rectangular"
            width="100%"
            height="100%"
            sx={{ borderRadius: 2 }}
          />
        ) : (
          <Box
            className="flip-card-inner"
            sx={{
              width: "100%",
              height: "100%",
              position: "relative",
              transformStyle: "preserve-3d",
              transition: "transform 0.8s ease-in-out",
              borderRadius: "20px",
            }}
          >
            {/* Front Image */}
            <Box
              sx={{
                width: "100%",
                height: "100%",
                position: "absolute",
                backfaceVisibility: "hidden",
              }}
            >
              <img
                src={seasonal1}
                alt="Seasonal Forecast Front"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "20px",
                }}
                onContextMenu={(e) => e.preventDefault()}
                draggable={false}
              />
            </Box>

            {/* Back Image */}
            <Box
              sx={{
                width: "100%",
                height: "100%",
                position: "absolute",
                transform: "rotateY(180deg)",
                backfaceVisibility: "hidden",
              }}
            >
              <img
                src={seasonal2}
                alt="Seasonal Forecast Back"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "20px",
                }}
                onContextMenu={(e) => e.preventDefault()}
                draggable={false}
              />
            </Box>
          </Box>
        )}
      </Box>

      {loading ? (
        <Skeleton
          variant="rectangular"
          width={180}
          height={40}
          sx={{ borderRadius: 2, padding: "10px", marginTop: "10px" }}
        />
      ) : (
        <Typography
          sx={{
            marginTop: 2,
            textAlign: "center",
            color: "#0b6bcb",
            fontSize: "1.5rem",
            fontWeight: "500",
          }}
        >
          Seasonal Forecast
        </Typography>
      )}
    </Box>


          </Box>
        </Box>
        </Fade>
      </Modal>


                   {/* Modal for 10-day with Fade and Backdrop */}
    <Dialog
      open={openModal10}
      onClose={handleClose10}
      TransitionComponent={Transition}
      keepMounted
      sx={{
        "& .MuiDialog-paper": {
          display: "flex",
          height: "55%",
          backgroundColor: "white",
          borderRadius: "20px",
          overflow: "auto",
          padding: 2,
          flexDirection: "column",
        },
      }}
    >
      <DialogContent
        sx={{
          display: "flex",
          justifyContent: "center",
          padding: 0,
          height: "100%",
          overflow: "hidden",
        }}
      >
{/* Left Box (60%) */}
<Box
  sx={{
    width: "60%",
    padding: 2,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  }}
>
  {/* Calendar Header Image */}
  <Box
    sx={{
      width: "100%",
      display: "flex",
      justifyContent: "center",
      marginBottom:"-8%"
    }}
  >
    <img
      src={calendarHeader} // Use the imported image
      alt="Calendar Header"
      style={{ width: "100%", maxWidth: "100%" }} // Ensure it scales correctly
      onContextMenu={(e) => e.preventDefault()}
      draggable={false}
    />
  </Box>

  {/* Calendar Box */}
  <Box
    sx={{
      width: "200%",
      padding: "5px",
      maxWidth: "100%",
      display: "flex",
      justifyContent: "center",
      borderRadius: "20px",
      overflow: "none",
    }}
  >
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DateCalendar
        value={selectedDate} // Pass the selected date to the calendar
        loading={isLoading}
        onChange={handleDateChange} // Handle date selection
        onMonthChange={handleMonthChange} // Handle month change
        renderLoading={() => <DayCalendarSkeleton />}
        slots={{ day: ServerDay }}
        slotProps={{
          day: { highlightedDays }, // Highlight specific days
        }}
        sx={{ width: "100%" }}
      />
    </LocalizationProvider>
  </Box>
</Box>


        {/* Right Box (40%) */}
        <Box
          sx={{
            width: '60%',
            padding: 2,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: "#e3effb",
            borderRadius: "10px",
          }}
        >
          {/* Title */}
    <Typography
      variant="body2"
      sx={{
        marginBottom: 1,
        fontWeight: 600,
        fontSize: "1.2rem",
        display: "flex",
        alignItems: "center",
        gap: 1.2,
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Ripples */}
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              position: "absolute",
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "2px solid #1976d2",
              animation: `ripple 1.8s ease-out ${i * 0.4}s infinite`,
              opacity: 0,
            }}
          />
        ))}

        {/* Folder Icon */}
        <FontAwesomeIcon icon={faFolder} style={{ fontSize: "24px", color: "#1976d2", zIndex: 1 }} />
      </Box>
      Upload Files

      {/* Keyframes for ripple */}
      <style>
        {`
          @keyframes ripple {
            0% {
              transform: scale(0.5);
              opacity: 0.5;
            }
            100% {
              transform: scale(1.5);
              opacity: 0;
            }
          }
        `}
      </style>
    </Typography>

          {/* Form Group with individual checkboxes and info icons */}
          <FormGroup sx={{ width: '100%' }}>
            
            {/* First Checkbox with Info Icon */}
            <Box
              sx={{
                width: '100%',
                padding: 1,
                border: '2px solid white',
                borderRadius: '10px',
                backgroundColor: 'white',
                marginBottom: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <FormControlLabel
                control={<Checkbox checked={forecastDataChecked} onChange={() => setForecastDataChecked(!forecastDataChecked)} />}
                label={<Typography sx={{ lineHeight: 1 }}><span dangerouslySetInnerHTML={{ __html: 'Forecast <br/> Data' }} /></Typography>}
                sx={{ marginRight: 2 }}
              />
              <MuiTooltip title="Upload forecast data like cloud cover, rainfall, and temperature to the 10-day forecast system." placement="top" arrow>
                <IconButton sx={{ padding: 0 }}>
                  <InfoIcon fontSize="small" sx={{ width: 15, height: 15, color:'#0b6bcb',}} />
                </IconButton>
              </MuiTooltip>
            </Box>

            {/* Second Checkbox with Info Icon */}
            <Box
              sx={{
                width: '100%',
                padding: 1,
                border: '2px solid white',
                borderRadius: '10px',
                backgroundColor: 'white',
                marginBottom: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <FormControlLabel
                control={<Checkbox checked={forecastFileChecked} onChange={() => setForecastFileChecked(!forecastFileChecked)} />}
                label={<Typography sx={{ lineHeight: 1 }}><span dangerouslySetInnerHTML={{ __html: 'Forecast <br/> File' }} /></Typography>}
                sx={{ marginRight: 2 }}
              />
              <MuiTooltip title="Upload and mask TIF and CSV files to the 10-day forecast system." placement="top" arrow>
                <IconButton sx={{ padding: 0 }}>
                  <InfoIcon fontSize="small" sx={{ width: 15, height: 15, color:'#0b6bcb' }} />
                </IconButton>
              </MuiTooltip>
            </Box>

            {/* Third Checkbox with Info Icon */}
            <Box
              sx={{
                width: '100%',
                padding: 1,
                border: '2px solid white',
                borderRadius: '10px',
                backgroundColor: 'white',
                marginBottom: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <FormControlLabel
                control={<Checkbox checked={windComponentChecked} onChange={() => setWindComponentChecked(!windComponentChecked)} />}
                label={<Typography sx={{ lineHeight: 1 }}><span dangerouslySetInnerHTML={{ __html: 'Wind <br/> Component' }} /></Typography>}
                sx={{ marginRight: 2 }}
              />
              <MuiTooltip title="Upload, mask, and convert wind data to ASC format for the 10-day forecast system." placement="top" arrow>
                <IconButton sx={{ padding: 0 }}>
                  <InfoIcon fontSize="small" sx={{ width: 15, height: 15, color:'#0b6bcb' }} />
                </IconButton>
              </MuiTooltip>
            </Box>
          </FormGroup>

          {/* Upload Button */}
          {checkboxWarning && (
  <Alert severity="error">Please check at least one item before uploading.</Alert>
)}


          <Button
            sx={{
              marginTop: 3,
              padding: '10px 20px',
              textTransform: 'none',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              '&:hover': {
                backgroundColor: '#3e80c6',
              }
            }}
            onClick={handleSubmit}
          >
            Upload
          </Button>
        </Box>
      </DialogContent>
    </Dialog>

    {(uploadStatus === 'success' || uploadStatus === 'failed') && (
  <Dialog
    open
    TransitionComponent={Transition}
    keepMounted
    onClose={() => setUploadStatus(null)}
    PaperProps={{
      sx: {
        borderRadius: '20px',
        backgroundColor: 'white',
        overflow: 'visible',
        width: '30%',
      },
    }}
  >
    <DialogContent
      sx={{
        textAlign: 'center',
        padding: 4,
        position: 'relative',
        pt: 10,
        overflow: 'visible',
      }}
    >
      {/* Floating Lottie Animation */}
      <Box
        sx={{
          position: 'absolute',
          top: '-80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          width: '100%',
        }}
      >
        <Lottie
          animationData={
            uploadStatus === 'success' ? successAnimation : failedAnimation
          }
          loop={false}
          style={{ height: 200 }}
        />
      </Box>

      {/* Title */}
      <Typography
        variant="h2"
        fontWeight={600}
        sx={{
          mt: 4,
          fontSize: '2.5rem',
          color: uploadStatus === 'success' ? '#59b189' : '#cd5050',
        }}
      >
        {uploadStatus === 'success' ? 'Success' : 'Failed'}
      </Typography>

      {/* Subtext */}
      <Typography variant="body1" sx={{ mt: 0, color: '#666' }}>
        {uploadStatus === 'success'
          ? 'Your data and files have been successfully uploaded to the repository.'
          : 'Unfortunately, there was an issue uploading your files. Please try again later.'}
      </Typography>

      {/* Close Button */}
      <Button
  variant="solid"
  sx={{
    mt: 4,
    borderRadius: '10px',
    paddingX: 4,
    backgroundColor: uploadStatus === 'success' ? '#59b189' : '#cd5050',
    color: '#fff',
    '&:hover': {
      backgroundColor: uploadStatus === 'success' ? '#4e9d79' : '#b84343',
    },
  }}
  onClick={() => setUploadStatus(null)}
>
  Close
</Button>

    </DialogContent>
  </Dialog>
)}

{isUploading && (
  <div
    style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'linear-gradient(to top, #a7dfff, #e3f3fd)',
      zIndex: 9999,
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      transition: 'opacity 0.5s ease',
      opacity: isUploading ? 1 : 0
    }}
  >
    <style>
      {`
        @keyframes floatUp {
          0% { transform: translateY(50px); opacity: 0.6; }
          50% { transform: translateY(-100px); opacity: 1; }
          100% { transform: translateY(-250px); opacity: 0; }
        }

        @keyframes driftLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-200px); }
        }

        @keyframes edgePeekLeft {
          0% { left: -500px; opacity: 1; }
          20% { left: 0; opacity: 1; }
          60% { left: 0; opacity: 1; }
          80% { left: -500px; opacity: 0; }
          100% { left: -500px; opacity: 0; }
        }

        @keyframes edgePeekRight {
          0% { right: -500px; opacity: 1; }
          20% { right: 0; opacity: 1; }
          60% { right: 0; opacity: 1; }
          100% { right: -500px; opacity: 0; }
        }

        .fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        .progress-bar {
          width: 300px;
          height: 10px;
          background-color: #d0eaff;
          border-radius: 10px;
          overflow: hidden;
          margin-top: 20px;
        }

        .progress-fill {
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, #4faaff, #007bff);
          animation: progressGrow 3s linear infinite;
        }

        @keyframes progressGrow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .edge-img {
          position: fixed;
          bottom: 0;
          height: 500px; /* Updated to 500px size */
          z-index: 10;
          opacity: 0;
          animation-duration: 7s; /* Total duration for one cycle */
          animation-timing-function: ease-in-out;
          animation-fill-mode: forwards;
        }

        .edge-left {
          animation-name: edgePeekLeft;
          animation-delay: 5s; /* Delay before it starts peeking */
        }

        .edge-right {
          animation-name: edgePeekRight;
          animation-delay: 12s; /* Delay before it starts peeking */
        }
      `}
    </style>

    {/* Randomly pick either left or right edge image */}
    {Math.random() > 0.5 ? (
      <img
        src={edgeLeft}
        alt="Edge Left"
        className={`edge-img edge-left`}
        style={{ left: 0 }}
      />
    ) : (
      <img
        src={edgeRight}
        alt="Edge Right"
        className={`edge-img edge-right`}
        style={{ right: 0 }}
      />
    )}

    {/* Multiple animated cloud layers */}
    {[...Array(10)].map((_, i) => (
      <img
        key={i}
        src={cloudAnimation}
        alt="Cloud"
        style={{
          position: 'absolute',
          bottom: `${Math.random() * 60}px`,
          left: `${Math.random() * 100}%`,
          animation: `${i % 2 === 0 ? 'floatUp' : 'driftLeft'} ${5 + Math.random() * 4}s infinite ease-in-out`,
          width: `${120 + Math.random() * 200}px`,
          opacity: 0.7,
          pointerEvents: 'none'
        }}
      />
    ))}

    {/* Uploading message */}
    <Typography
      variant="h4"
      sx={{
        color: '#004d80',
        zIndex: 10,
        textAlign: 'center',
        fontWeight: 600
      }}
      className="fade-in"
    >
      {currentMessage}
    </Typography>

    {/* Progress bar */}
    <div className="progress-bar">
      <div className="progress-fill"></div>
    </div>
  </div>
)}




          </Grid>
        </Grid>
      </Box>


      </Box>
    </Box>
  );
};

export default Dashboard;

{/**

  import React, { useState, useEffect } from 'react';
  import { Box } from '@mui/joy';
  import Sidebar from './Sidebar';
  import Navbar from './Navbar';
  import Welcome from './Welcome';
  import dashboardMorning from "../assets/img/dashboard-morning.webp";
  import dashboardRain from "../assets/img/dashboard-rain.webp";
  import BusinessIcon from '@mui/icons-material/Business';
  import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
  import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
  import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
  
  const Dashboard = ({ setIsAuthenticated }) => {
    const [open, setOpen] = useState(false);
    const [weatherMode, setWeatherMode] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [userName, setUserName] = useState("User");
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState([
      { title: "Loading...", value: "0", icon: <HelpOutlineIcon /> },
      { title: "Loading...", value: "0", icon: <HelpOutlineIcon /> },
      { title: "Loading...", value: "0", icon: <HelpOutlineIcon /> },
      { title: "Loading...", value: "0", icon: <HelpOutlineIcon /> }
    ]);
  
    const [imageSrc, setImageSrc] = useState(dashboardMorning);
    const [fade, setFade] = useState(true);
  
    const toggleSidebar = () => setOpen(!open);
    const toggleWeatherMode = () => setWeatherMode(!weatherMode);
    const handleMenuClick = (e) => setAnchorEl(e.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);
    const openMenu = Boolean(anchorEl);
  
    const logout = (e) => {
      e.preventDefault();
      localStorage.removeItem("token");
      setIsAuthenticated(false);
    };
  
    useEffect(() => {
      fetch("/dashboard", {
        method: "POST",
        headers: {
          token: localStorage.getItem("token")
        }
      })
      .then(res => res.json())
      .then(data => {
        setUserName(data.name || "User");
        setStats([
          { title: "Municities", value: data.municities || "0", icon: <BusinessIcon /> },
          { title: "File Log", value: data.myFiles || "0", icon: <InsertDriveFileIcon /> },
          { title: "API Log", value: data.api || "0", icon: <SettingsSuggestIcon /> },
          { title: "Unknown", value: "N/A", icon: <HelpOutlineIcon /> }
        ]);
      })
      .catch(err => console.error("Dashboard error", err))
      .finally(() => setLoading(false));
    }, []);
  
    useEffect(() => {
      const preload = new Image();
      preload.src = dashboardRain;
    }, []);
  
    useEffect(() => {
      setFade(false);
      const timeout = setTimeout(() => {
        setImageSrc(weatherMode ? dashboardRain : dashboardMorning);
        setFade(true);
      }, 250);
      return () => clearTimeout(timeout);
    }, [weatherMode]);
  
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', padding: '1%', backgroundColor: weatherMode ? '#dae7f0' : '#f5f5f9' }}>
        <Sidebar open={open} weatherMode={weatherMode} />
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Navbar
            open={open}
            toggleSidebar={toggleSidebar}
            weatherMode={weatherMode}
            anchorEl={anchorEl}
            handleMenuClick={handleMenuClick}
            handleMenuClose={handleMenuClose}
            openMenu={openMenu}
            toggleWeatherMode={toggleWeatherMode}
            logout={logout}
          />
          <Welcome
            userName={userName}
            stats={stats}
            imageSrc={imageSrc}
            fade={fade}
            loading={loading}
            weatherMode={weatherMode}
          />
        </Box>
      </Box>
    );
  };
  
  export default Dashboard;
  
  
  
  */}
