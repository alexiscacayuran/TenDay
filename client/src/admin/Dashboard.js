import React, { useState, useEffect } from 'react';
import { Box } from '@mui/joy';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Welcome from './Welcome';
import Chart from './Chart';
import DataBox from './dataBox';
import { images, preloadAllImages } from "./image";
import {
  PieChart, Pie, Tooltip as RechartsTooltip, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { CssVarsProvider } from "@mui/joy/styles";
import theme from "../theme"

//Icons
import BusinessIcon from '@mui/icons-material/Business';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import VerifiedIcon from '@mui/icons-material/Verified';
import Person2Icon from '@mui/icons-material/Person2';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DevicesIcon from '@mui/icons-material/Devices';
import PersonalVideoIcon from '@mui/icons-material/PersonalVideo';
import TabletMacIcon from '@mui/icons-material/TabletMac';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import GroupIcon from '@mui/icons-material/Group';

import CircleIcon from '@mui/icons-material/Circle';

import { useUser } from './UserContext'; 

const Dashboard = ({ setIsAuthenticated }) => {

const { userData, setUserData } = useUser();


//Issuance Date
const [validDate, setValidDate] = useState({
  time: '',
  formattedDate: '',
  error: false
});

useEffect(() => {
  fetch('/api/v1/valid')
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      if (data.latest_date && data.latest_time) {
        // Use space instead of T to avoid invalid time value error
        const dateObj = new Date(`${data.latest_date} ${data.latest_time}`);
        if (isNaN(dateObj.getTime())) {
          throw new Error('Invalid date from API');
        }

        const formattedDate = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: '2-digit' }).format(dateObj);

        // Format time only (without seconds)
        const timeOnly = data.latest_time.replace(/:\d+ /, ' ').trim();

        setValidDate({
          time: timeOnly,
          formattedDate,
          error: false
        });
      } else {
        throw new Error('Invalid data received');
      }
    })
    .catch(err => {
      console.error('Fetch error:', err);
      setValidDate({
        time: '',
        formattedDate: 'Error fetching date',
        error: true
      });
    })
    .finally(() => setLoading(false));
}, []);

  const [open, setOpen] = useState(false);

  const [weatherMode, setWeatherMode] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [userName, setUserName] = useState("User");
  const [userType, setUserType] = useState("Unknown");
  const [loading, setLoading] = useState(true);

const [imageSrc, setImageSrc] = useState(images.dashboardMorning);
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


  const [stats, setStats] = useState([
    { title: "Loading...", value: "0", icon: <HelpOutlineIcon /> },
    { title: "Loading...", value: "0", icon: <HelpOutlineIcon /> },
    { title: "Loading...", value: "0", icon: <HelpOutlineIcon /> },
    { title: "Loading...", value: "0", icon: <HelpOutlineIcon /> }
  ]);

useEffect(() => {
  const fetchWeatherData = async () => {
    try {
      const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

      // Fetch the token
      const tokenRes = await fetch('/serverToken');
      const tokenData = await tokenRes.json();
      const serverToken = tokenData.token;

      const response = await fetch(
        `/dateInternal?municity=Quezon City&province=Metro Manila&date=${today}`,
        {
          headers: {
            token: serverToken,
          },
        }
      );

      const data = await response.json();

      if (data.error) {
        console.error("API Error:", data.error);
        return;
      }

      console.log("Success: Data fetched", data);

      const rainfall = data.forecast?.rainfall?.total;
      if (typeof rainfall === "number") {
        setWeatherMode(rainfall >= 5);
      } else {
        console.warn("No rainfall data available");
      }
    } catch (error) {
      console.error("Error fetching forecast:", error);
    }
  };

  fetchWeatherData();
}, []);


useEffect(() => {
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch("/dashboard", { method: "POST", headers: { token } });
      if (!res.ok) throw new Error("Dashboard fetch failed");
      const data = await res.json();

      const ownerNum = Number(data.owner);
      setUserType(ownerNum);
      setUserName(data.name || "User");

      // ✅ Set userData context globally for all users
      setUserData({ name: data.name || "User", type: ownerNum });

      if (ownerNum === 2) {
        setStats([
          {
            title: "Municities",
            value: data.municities || 0,
            displayValue: (data.municities || 0).toString(),
            icon: <BusinessIcon />,
          },
          {
            title: "File Log",
            value: data.myFiles || 0,
            displayValue: (data.myFiles || 0).toString(),
            icon: <InsertDriveFileIcon />,
          },
          {
            title: "API Log",
            value: data.api || 0,
            displayValue: (data.api || 0).toString(),
            icon: <SettingsSuggestIcon />,
          },
          {
            title: "System Status",
            value: 0,
            displayValue: "Checking...",
            icon: <VerifiedIcon />,
          },
        ]);
        setLoading(false);
      } else if (ownerNum === 1) {
        const adminRes = await fetch("/dashboardAdmin", { method: "POST", headers: { token } });
        if (!adminRes.ok) throw new Error("Admin dashboard fetch failed");
        const adminData = await adminRes.json();

        setStats([
          {
            title: "System Users",
            value: parseInt(adminData.userSystem, 10) || 0,
            displayValue: adminData.userSystem?.toString() || "0",
            icon: <Person2Icon />,
          },
          {
            title: "Daily Visitors",
            value: parseInt(adminData.dailyvisit, 10) || 0,
            displayValue: adminData.dailyvisit?.toString() || "0",
            icon: <VisibilityIcon />,
          },
          {
            title: "Platform Visitors",
            platformValues: {
              Desktop: adminData.platformData?.Desktop || 0,
              Tablet: adminData.platformData?.Tablet || 0,
              Mobile: adminData.platformData?.Mobile || 0,
              "All Devices": adminData.platformData?.["All Devices"] || 0,
            },
            currentPlatform: "All Devices",
            value: adminData.platformData?.["All Devices"] || 0,
            displayValue: (adminData.platformData?.["All Devices"] || 0).toString(),
            icon: <DevicesIcon />,
            isPlatformCard: true,
          },
          {
            title: (
              <>
                Active Visitors{" "}
                <span style={{ fontStyle: "italic", fontSize: "0.7em" }}>
                  (in last 30 minutes)
                </span>
              </>
            ),
            value: parseInt(adminData.active, 10) || 0,
            displayValue: adminData.active?.toString() || "0",
            icon: <GroupIcon />,
          },
        ]);
        setLoading(false);
      } else {
        console.warn("Unknown userType:", ownerNum);
        setLoading(false);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setLoading(false);
    }
  };

  fetchDashboardData();
}, []);  

  //System Checker
useEffect(() => {
  if (userType !== 2) return; // Skip if not usertype 2

  const checkSystemStatus = async () => {
    try {
      const res = await fetch("/health");
      const data = await res.json();
      const isActive = data.status === "ACTIVE";
      const status = isActive ? "ACTIVE" : "OFFLINE";
      const color = isActive
        ? weatherMode ? "#11119e" : "#4CAF50"
        : "#f44336";

      setStats(prev =>
        prev.map((item, idx) =>
          item.title === "System Status"
            ? {
                ...item,
                value: isActive ? 1 : 0,
                displayValue: (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CircleIcon
                      sx={{
                        fontSize: 14,
                        color,
                        animation: isActive ? "blinker 0.8s linear infinite" : "none",
                        "@keyframes blinker": {
                          "50%": { opacity: 0 },
                        },
                      }}
                    />
                    {status}
                  </Box>
                ),
              }
            : item
        )
      );
    } catch (err) {
      console.error("Health check failed", err);
    }
  };

  checkSystemStatus();
  const intervalId = setInterval(checkSystemStatus, 10000);
  return () => clearInterval(intervalId);
}, [userType]);



  // Preload Dashboard Images
  useEffect(() => {
    const preload = new Image();
    preload.src = images.dashboardRain;
  }, []);

  // Toggle Background Image Based on Weather Mode
  useEffect(() => {
    setFade(false);
    const timeout = setTimeout(() => {
      setImageSrc(weatherMode ? images.dashboardRain : images.dashboardMorning);
      setFade(true);
    }, 250);
    return () => clearTimeout(timeout);
  }, [weatherMode]);

//Chart
const [showOrgDonut, setShowOrgDonut] = useState(true);
const [showApiDonut, setShowApiDonut] = useState(true);
const [showCityPie, setShowCityPie] = useState(true); 
const [showCountryPie, setShowCountryPie] = useState(false);


const useChartData = (endpoint) => {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetch(endpoint)
      .then(res => res.json())
      .then(data => setData(data.data))
      .catch(err => console.error(`Fetch error (${endpoint}):`, err));
  }, [endpoint]);
  return data;
}; 

const pieData = useChartData("/apiPie");
const barData = useChartData("/apiBar");
const cityData = useChartData("/cityChart");
const countryData = useChartData("/countryChart");
  

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', padding: '1%', backgroundColor: weatherMode ? '#dae7f0' : '#f5f5f9' }}>
      <Sidebar open={open} weatherMode={weatherMode} userType={userType} userName={userName} />
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
          userName={userName}
          userType={userType}
        />
        {!loading && stats.length >= 1 && (
          <Welcome
            userName={userName}
            userType={userType}
            stats={stats}
            imageSrc={imageSrc}
            fade={fade}
            loading={loading}
            weatherMode={weatherMode}
          />
        )}


        <Box sx={{ display: 'flex', flexWrap: { xs: 'wrap', md: 'nowrap' }, gap: 2, mt: 2 }}>

        {/** Charts */}
        {userType === 1 ? (
        <Box sx={{ flex: { xs: '100%', md: '50%' }, display: 'flex', flexDirection: 'row', gap: 2}}>
          <Chart
            title="City Visitors"
            data={cityData}
            isPie={showCityPie}
            setIsPie={setShowCityPie}
            open={open}
            weatherMode={weatherMode}
          />
<Chart
  title="Country Visitors"
  data={countryData}
  isPie={showCountryPie}
  setIsPie={setShowCountryPie}
  open={open}
  weatherMode={weatherMode}
/>
        </Box>

        ) : (

         <Box sx={{ flex: { xs: '100%', md: '50%' }, display: 'flex', flexDirection: 'row', gap: 2}}>
          <Chart
            title="User Usage"
            data={pieData}
            isPie={showOrgDonut}
            setIsPie={setShowOrgDonut}
            open={open}
            weatherMode={weatherMode}
          />
          <Chart
            title="API Usage"
            data={barData}
            isPie={!showApiDonut}
            setIsPie={(val) => setShowApiDonut(!val)}
            open={open}
            weatherMode={weatherMode}
          />
        </Box>
        )}

        {/** Upload and Data */}
        <DataBox weatherMode={weatherMode} loading={loading} validDate={validDate} open={open} userType={userType} />

        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
