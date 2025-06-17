import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, List, ListItem, ListItemButton } from '@mui/joy';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import SettingsSuggestOutlinedIcon from '@mui/icons-material/SettingsSuggestOutlined';
import ArticleIcon from '@mui/icons-material/Article';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import AnalyticsIcon from '@mui/icons-material/PieChart';
import AnalyticsOutlinedIcon from '@mui/icons-material/PieChartOutline';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import { Link, useLocation } from 'react-router-dom';

// ✅ SVG ICONS
import SunnyIcon from '../assets/icons/weather/0-sunny-lg.png';
import NoRainPartlyCloudyIcon from '../assets/icons/weather/1-no-rain_partly-cloudy-lg.png';
import NoRainMostlyCloudyIcon from '../assets//icons/weather/2-no-rain_mostly-cloudy-lg.png';
import NoRainCloudyIcon from '../assets/icons/weather/3-no-rain_cloudy-lg.png';
import LightRainsPartlyCloudyIcon from '../assets/icons/weather/4-light-rains_partly-cloudy-lg.png';
import LightRainsMostlyCloudyIcon from '../assets/icons/weather/5-light-rains_mostly-cloudy-lg.png';
import LightRainsCloudyIcon from '../assets/icons/weather/6-light-rains_cloudy-lg.png';
import ModRainsPartlyCloudyIcon from '../assets/icons/weather/7-mod-rains_partly-cloudy-lg.png';
import ModRainsMostlyCloudyIcon from '../assets/icons/weather/8-mod-rains_mostly-cloudy-lg.png';
import ModRainsCloudyIcon from '../assets/icons/weather/9-mod-rains_cloudy-lg.png';
import HeavyRainsPartlyCloudyIcon from '../assets/icons/weather/10-heavy-rains_partly-cloudy-lg.png';
import HeavyRainsMostlyCloudyIcon from '../assets/icons/weather/11-heavy-rains_mostly-cloudy-lg.png';
import HeavyRainsCloudyIcon from '../assets/icons/weather/12-heavy-rains_cloudy-lg.png';
import noResult from '../assets/img/noResult.png';
import { AccountCircle, AccountCircleOutlined } from '@mui/icons-material';

const drawerWidth = 180;

const Sidebar = ({ open, weatherMode, userType, userName }) => {
  const [time, setTime] = useState(new Date());
  const [forecast, setForecast] = useState(null);
  const location = useLocation();

  const shineAnimation = {
    '@keyframes shine': {
      '0%': {
        left: '-75%',
      },
      '100%': {
        left: '125%',
      },
    },
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(
          `http://localhost:5000/dateInternal?municity=Quezon City&province=Metro Manila&date=${today}`
        );
        const data = await response.json();
        setForecast(data.forecast);
      } catch (error) {
        console.error('Error fetching forecast:', error);
      }
    };

    fetchForecast();
  }, []);

  const dateString = time.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const timeString = time.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Determine icon and gradient based on weather
  let selectedIcon = noResult;
  let selectedGradient = 'linear-gradient(135deg, #e0e0e0, #f5f5f5)'; // Default gray pastel
  let textColor = '#333333'; // Default text color (dark gray)

  if (forecast) {
    const rainfallDesc = forecast.rainfall?.desc?.toUpperCase();
    const cloudCover = forecast.cloud_cover?.toUpperCase();

    if (rainfallDesc === 'NO RAIN' && cloudCover === 'SUNNY') {
      selectedIcon = SunnyIcon;
      selectedGradient = 'linear-gradient(135deg, #ffe680, #ffd27f)'; // Soft pastel sunny yellow/orange
      textColor = '#b8860b';
    } else if (rainfallDesc === 'NO RAIN' && cloudCover === 'PARTLY CLOUDY') {
      selectedIcon = NoRainPartlyCloudyIcon;
      selectedGradient = 'linear-gradient(135deg, #b3e5fc, #81d4fa)'; // Light sky pastel blue
      textColor = '#063970'; // Blue for partly cloudy
    } else if (rainfallDesc === 'NO RAIN' && cloudCover === 'MOSTLY CLOUDY') {
      selectedIcon = NoRainMostlyCloudyIcon;
      selectedGradient = 'linear-gradient(135deg, #cfd8dc, #eceff1)'; // Soft grayish blue
      textColor = '#607d8b'; // Grayish blue for mostly cloudy
    } else if (rainfallDesc === 'NO RAIN' && cloudCover === 'CLOUDY') {
      selectedIcon = NoRainCloudyIcon;
      selectedGradient = 'linear-gradient(135deg, #d7ccc8, #f5f5f5)'; // Soft warm gray
      textColor = '#757575'; // Light gray for cloudy
    } else if (rainfallDesc === 'LIGHT RAINS' && cloudCover === 'PARTLY CLOUDY') {
      selectedIcon = LightRainsPartlyCloudyIcon;
      selectedGradient = 'linear-gradient(135deg, #aedff7, #d0f0fc)'; // Pastel aqua blue
      textColor = '#0288d1'; // Blue for light rain, partly cloudy
    } else if (rainfallDesc === 'LIGHT RAINS' && cloudCover === 'MOSTLY CLOUDY') {
      selectedIcon = LightRainsMostlyCloudyIcon;
      selectedGradient = 'linear-gradient(135deg, #a1c4fd, #c2e9fb)'; // Soft blue
      textColor = '#1976d2'; // Darker blue for light rain, mostly cloudy
    } else if (rainfallDesc === 'LIGHT RAINS' && cloudCover === 'CLOUDY') {
      selectedIcon = LightRainsCloudyIcon;
      selectedGradient = 'linear-gradient(135deg, #c8d6e5, #e0f7fa)'; // Light pastel gray-blue
      textColor = '#1565c0'; // Deeper blue for light rain, cloudy
    } else if (rainfallDesc === 'MODERATE RAINS' && cloudCover === 'PARTLY CLOUDY') {
      selectedIcon = ModRainsPartlyCloudyIcon;
      selectedGradient = 'linear-gradient(135deg, #9ad0ec, #bce6f9)'; // Fresh pastel blue
      textColor = '#0288d1'; // Blue for moderate rain, partly cloudy
    } else if (rainfallDesc === 'MODERATE RAINS' && cloudCover === 'MOSTLY CLOUDY') {
      selectedIcon = ModRainsMostlyCloudyIcon;
      selectedGradient = 'linear-gradient(135deg, #b0bec5, #dfe6e9)'; // Soft cloudy gray-blue
      textColor = '#0277bd'; // Blue for moderate rain, mostly cloudy
    } else if (rainfallDesc === 'MODERATE RAINS' && cloudCover === 'CLOUDY') {
      selectedIcon = ModRainsCloudyIcon;
      selectedGradient = 'linear-gradient(135deg, #cfd8dc, #eceff1)'; // Soft gray
      textColor = '#55697e'; // Dark blue for moderate rain, cloudy
    } else if (rainfallDesc === 'HEAVY RAINS' && cloudCover === 'PARTLY CLOUDY') {
      selectedIcon = HeavyRainsPartlyCloudyIcon;
      selectedGradient = 'linear-gradient(135deg, #dab6fc, #f0d7ff)'; // Soft pastel lavender
      textColor = '#8e24aa'; // Purple for heavy rain, partly cloudy
    } else if (rainfallDesc === 'HEAVY RAINS' && cloudCover === 'MOSTLY CLOUDY') {
      selectedIcon = HeavyRainsMostlyCloudyIcon;
      selectedGradient = 'linear-gradient(135deg, #c5c6ca, #e0e0e0)'; // Soft neutral gray
      textColor = '#6a1b9a'; // Purple for heavy rain, mostly cloudy
    } else if (rainfallDesc === 'HEAVY RAINS' && cloudCover === 'CLOUDY') {
      selectedIcon = HeavyRainsCloudyIcon;
      selectedGradient = 'linear-gradient(135deg, #d6d6d6, #f0f0f0)'; // Light cloudy gray
      textColor = '#9c27b0'; // Purple for heavy rain, cloudy
    } else {
      // Fallback
      selectedIcon = noResult;
      selectedGradient = 'linear-gradient(135deg, #f5f5f5, #ffffff)'; // Softest neutral fallback
      textColor = '#000000'; // Default text color (black)
    }
  }


const menuItems = [
  {
    label: 'Dashboard',
    path: '/admin/dashboard',
    IconFilled: DashboardIcon,
    IconOutlined: DashboardOutlinedIcon,
  },
  {
    label: 'API',
    path: '/admin/token',
    IconFilled: SettingsSuggestIcon,
    IconOutlined: SettingsSuggestOutlinedIcon,
  },
  ...(userType === 1
    ? [
        {
          label: 'Users',
          path: '/admin/user',
          IconFilled: AccountCircleIcon,
          IconOutlined: AccountCircleOutlinedIcon,
        },
        {
          label: 'Analytics',
          path: '/admin/analytics',
          IconFilled: AnalyticsIcon,
          IconOutlined: AnalyticsOutlinedIcon,
        },
        {
          label: 'Report',
          path: '/admin/report',
          IconFilled: ArticleIcon,
          IconOutlined: ArticleOutlinedIcon,
        },
      ]
    : []),
];


  return (
    <Box
      sx={{
        width: open ? `${drawerWidth}px` : 0,
        backgroundColor: weatherMode ? '#eaf4fd' : 'white',
        borderRadius: '20px',
        transition: 'width 0.3s ease, background-color 0.5s ease',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'relative',
        marginRight: { sm: open ? '2%' : '0', md: open ? '1%' : '0' },
        fontFamily: 'Roboto, sans-serif',
      }}
    >
      <Box sx={{ padding: 2, visibility: open ? 'visible' : 'hidden' }}>
        <Box
          sx={{
            mb: 3,
            padding: 2,
            borderRadius: '12px',
            background: selectedGradient,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            transition: 'background 0.5s ease',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-35%',
              width: '40%',
              height: '100%',
              background: 'linear-gradient(to right, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.2) 100%)',
              transform: 'skewX(-25deg)',
              zIndex: 2,
              animation: 'shine 3s infinite ease-in-out',
            },
            '@keyframes shine': {
              '0%': {
                left: '-85%',
              },
              '50%': {
                left: '100%',
              },
              '100%': {
                left: '-85%',
              },
            },
          }}
        >
          <Box
            sx={{
              width: '80px',
              height: '80px',
              mb: 1,
              transition: 'transform 0.5s ease',
              ml: selectedIcon === noResult ? '-10%' : 0,
            }}
          >
            <img
              src={selectedIcon}
              alt="Weather Icon"
              style={{
                width: selectedIcon === noResult ? '120%' : '100%',
                height: selectedIcon === noResult ? '120%' : '100%',
                objectFit: 'contain',
              }}
            />
          </Box>
          <Typography
            sx={{
              fontSize: '0.55rem',
              fontWeight: 450,
              color: textColor, 
              textAlign: 'center',
              lineHeight: 1,
              borderRadius: '50px',
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              px: 1.5,
              py: 0.6,
            }}
          >
            {dateString}
          </Typography>
          <Typography
            sx={{
              fontSize: '1.2rem',
              fontWeight: 700,
              color: textColor,
              textAlign: 'center',
            }}
          >
            {timeString}
          </Typography>
        </Box>

<List>
  {menuItems.map(({ label, path, IconFilled, IconOutlined }) => {
    const isActive = location.pathname === path;

    return (
      <ListItem key={label}>
        <ListItemButton
          component={Link}
          to={path}
          sx={{
            fontSize: '0.95rem',
            fontWeight: 600,
            color: isActive ? 'primary.plainColor' : 'text.primary',
            backgroundColor: isActive ? 'primary.softBg' : 'transparent',
            borderRadius: '8px',
            mb: 0.1,
            transition: 'background-color 0.3s ease, color 0.3s ease, transform 0.3s ease',
            '&:hover': !isActive && {
              backgroundColor: 'primary.softHoverBg',
              color: 'primary.plainColor',
              '& .sidebar-icon': {
                transform: 'scale(1.1)',
              },
              '& .icon-filled': {
                opacity: 1,
              },
              '& .icon-outlined': {
                opacity: 0,
              },
            },
          }}
        >
          <Box
            className="sidebar-icon"
            sx={{
              mr: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.3s ease',
              position: 'relative',
              width: 24,
              height: 24,
            }}
          >
            {/* Filled icon */}
            <Box
              className="icon-filled"
              sx={{
                position: 'absolute',
                opacity: isActive ? 1 : 0,
                transition: 'opacity 0.3s ease',
              }}
            >
              <IconFilled fontSize="small" />
            </Box>

            {/* Outlined icon */}
            {!isActive && (
              <Box
                className="icon-outlined"
                sx={{
                  position: 'absolute',
                  opacity: 1,
                  transition: 'opacity 0.3s ease',
                }}
              >
                <IconOutlined fontSize="small" />
              </Box>
            )}
          </Box>
          {label}
        </ListItemButton>
      </ListItem>
    );
  })}
</List>

      </Box>
    </Box>
  );
};

export default Sidebar;
