import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Switch,
  Typography,
  Divider,
  Avatar,
  Sheet
} from '@mui/joy';
import SettingsIcon from '@mui/icons-material/Settings';
import LockResetIcon from '@mui/icons-material/LockReset';
import LogoutIcon from '@mui/icons-material/Logout';
import CloudIcon from '@mui/icons-material/Cloud';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import HamburgerMenu from './HamburgerMenu';
import logo from '../assets/img/logo.png';
import logoWM from '../assets/img/logo-wm.png';
import { useNavigate } from 'react-router-dom';

const Navbar = ({
  open,
  toggleSidebar,
  weatherMode,
  toggleWeatherMode,
  logout,
  userName = 'User',
  userType
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);
  const navigate = useNavigate();

  const handleMenuToggle = (event) => {
    if (openMenu) {
      setAnchorEl(null);
    } else {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogoClick = () => {
    navigate('/admin/dashboard');
  };

  const userTypeMap = {
    1: 'Administrator',
    2: 'CAD-CLIMPS',
    3: 'CAD-IAAS',
  };

  const initial = userName?.charAt(0)?.toUpperCase() || 'U';

  return (
    <Box
      sx={{
        backgroundColor: weatherMode ? '#eaf4fd' : 'white',
        borderRadius: '20px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: { sm: '2%', md: '1%' },
        transition: 'background-color 0.5s ease',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <HamburgerMenu
          toggleSidebar={toggleSidebar}
          isSidebarOpen={open}
          weatherMode={weatherMode}
        />
        <img
          src={weatherMode ? logoWM : logo}
          alt="Logo"
          style={{ height: '40px', cursor: 'pointer' }}
          onClick={handleLogoClick}
        />
      </Box>

      <IconButton onClick={handleMenuToggle} sx={{":hover":{bgcolor: 'transparent'}}}>
        <SettingsIcon sx={{borderRadius: '50%', bgcolor: '#e3effb', color: '#12467b', padding: 1, fontSize: 40, transition: "transform 0.3s ease, background-color 0.2s ease, color 0.2s ease", ':hover': {bgcolor: '#0b6bcb', color: '#fff', transform: "rotate(90deg)",}}} />
      </IconButton>

      <Menu
        open={openMenu}
        anchorEl={anchorEl}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          popper: {
            modifiers: [{ name: 'offset', options: { offset: [-16, 10] } }],
          },
        }}
        sx={{
          minWidth: 220,
          borderRadius: '20px',
          border: 'none',
          padding: 1,
          bgcolor: weatherMode ? '#eaf4fd' : '#fff'
        }}
      >
        {/* User Info Section */}
        <Sheet
          sx={{
            borderRadius: '12px',
            p: 2,
            textAlign: 'center',
            bgcolor: 'transparent'
          }}
        >
          <Avatar
            sx={{ margin: '0 auto', width: 56, height: 56, fontSize: 24, bgcolor: weatherMode ? '#11457a' : '#0b6bcb', color: weatherMode ? '#cedff0' : '#e3effb' }}
          >
            {initial}
          </Avatar>
          <Typography level="title-md" sx={{ mt: 1 }}>
            <b>{userName}</b>
          </Typography>
          <Typography level="body-sm" color="neutral">
            {userTypeMap[userType] || 'Unknown'}
          </Typography>
        </Sheet>

        <Divider />

        {/* Weather Mode Toggle */}
        <MenuItem
          onClick={handleMenuClose}
          sx={{ justifyContent: 'space-between' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {weatherMode ? (
              <CloudIcon color="info" />
            ) : (
              <WbSunnyIcon color="warning" />
            )}
            {weatherMode ? 'Weather Mode' : 'Normal Mode'}
          </Box>
          <Switch
            checked={weatherMode}
            onChange={toggleWeatherMode}
            color="primary"
          />
        </MenuItem>

        {/* Reset Password */}
        <MenuItem
          onClick={() => {
            navigate('/reset-password');
            handleMenuClose();
          }}
        >
          <LockResetIcon sx={{ mr: 1 }} />
          Reset Password
        </MenuItem>

        {/* Logout */}
        <MenuItem
          onClick={(e) => {
            logout(e);
            handleMenuClose();
          }}
        >
          <LogoutIcon sx={{ mr: 1 }} />
          Sign Out
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Navbar;
