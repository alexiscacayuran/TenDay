import React, { useEffect, useState } from 'react';
import {
  Box, Typography
} from '@mui/material';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Slide from '@mui/material/Slide';
import { useUser } from './UserContext'; 

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const Report = ({ setIsAuthenticated }) => {
  const [showSearch, setShowSearch] = useState(false);
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isLifetime, setIsLifetime] = useState(false);

  const { userData, weatherMode, setWeatherMode } = useUser();

  const handleClickAway = () => setShowSearch(false);
  const toggleWeatherMode = () => setWeatherMode(prev => !prev);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleMenuClick = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const openMenu = Boolean(anchorEl);

  const logout = (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch("/api/report", {
          method: "POST", 
          headers: {
            "Content-Type": "application/json",
            token: localStorage.token
          }
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch report");

        setReportData(data);
        setLoading(false);
      } catch (err) {
        console.error("Fetch error:", err.message);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchReport();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', padding: '1%', backgroundColor: weatherMode ? '#dae7f0' : '#f5f5f9' }}>
      <Sidebar open={sidebarOpen} weatherMode={weatherMode} userName={userData?.name} userType={userData?.type} />
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
          userName={userData?.name}
          userType={userData?.type} 
        />

        <Box sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Report Data
          </Typography>
          <pre>{JSON.stringify(reportData, null, 2)}</pre>
        </Box>
      </Box>
    </Box>
  );
};

export default Report;
