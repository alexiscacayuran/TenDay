import React, { useEffect, useState } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TableSortLabel, Paper, IconButton, TextField,
  Typography, TablePagination, Tooltip, Chip, Dialog,
  DialogActions, DialogContent, DialogTitle, Button, InputLabel, Collapse,
  ClickAwayListener, Alert, Slide
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessAlarmsIcon from '@mui/icons-material/AccessAlarms';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import axios from 'axios';
import Lottie from 'lottie-react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

import { useContext } from "react";
import { useUser } from './UserContext'; 

import noMatch from '../assets/img/noMatch.png';
import GentokenJson from '../assets/img/GenToken.json';  
import AddUserJson from '../assets/img/AddUser.json';   
import EditImage from '../assets/img/Edit.png';
import ReplayIcon from '@mui/icons-material/Replay';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const Token = ({ setIsAuthenticated }) => {
  const [showSearch, setShowSearch] = useState(false);
  const [open, setOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
  const handleClickAway = () => setShowSearch(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleWeatherMode = () => setWeatherMode(prev => !prev);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const [tokens, setTokens] = useState([]);
  const [apiMap, setApiMap] = useState({});
  const [orderBy, setOrderBy] = useState('organization');
  const [order, setOrder] = useState('asc');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const rowsPerPage = 5;

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editToken, setEditToken] = useState(null);
  const [editOrg, setEditOrg] = useState('');
  const [editExpiry, setEditExpiry] = useState('');
  const [editApiIds, setEditApiIds] = useState([]);

  const { userData, weatherMode, setWeatherMode } = useUser();

  const [loading, setLoading] = useState(true); // Add loading state

  // Inside your component
  const [isLifetime, setIsLifetime] = useState(false);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newOrg, setNewOrg] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newExpiry, setNewExpiry] = useState('');
  const [newApiIds, setNewApiIds] = useState([]);
  const [formError, setFormError] = useState('');

  const handleMenuClick = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const openMenu = Boolean(anchorEl);

  const logout = (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  const handleGenerateToken = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // ❌ Invalid email
    if (!emailRegex.test(newEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    // ❌ Missing required fields
    if (!newOrg || newApiIds.length === 0) {
      setFormError('Organization, email, and at least one API are required.');
      return;
    }

  try {
    const response = await fetch('/api/auth/generate-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization: newOrg,
        email: newEmail,
        api_ids: newApiIds,
        expires_in: isLifetime
          ? 'lifetime'
          : Math.floor((new Date(newExpiry).getTime() - Date.now()) / 1000).toString(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setFormError(`❌ ${data.error}`);
      return;
    }

    alert(`Token generated`);
    setAddDialogOpen(false);
    setNewOrg('');
    setNewEmail('');
    setNewExpiry('');
    setNewApiIds([]);
    setIsLifetime(true);
  } catch (error) {
    console.error('❌ Error:', error);
    alert('❌ Failed to generate token');
  }
};

useEffect(() => {
  if (!addDialogOpen) {
    // Reset form values when dialog is closed
    setNewOrg('');
    setNewEmail('');
    setNewExpiry('');
    setNewApiIds([]);
    setIsLifetime(true);
    setFormError('');
  }
}, [addDialogOpen]);


// Update isLifetime when editExpiry changes (if user picks a date manually)
useEffect(() => {
  if (editExpiry) {
    setIsLifetime(false);
  }
}, [editExpiry]);

  const apiColors = [
    '#FF8FA3', // watermelon pink
    '#5EC2B7', // deeper aqua
    '#6FBF73', // medium green
    '#8E7CC3', // royal pastel purple
    '#4DD0E1', // cool cyan
    '#9CCC65', // vibrant lime
    '#4FA7B3', // deeper teal
    '#9A7DCA', // richer lavender
    '#EC6B7B', // stronger rose
    '#5B9BD5', // bold sky blue
    '#FFB366', // orange cream
    '#B388EB', // violet
    '#6ECEDA', // tropical blue
    '#FFA07A', // coral pastel
    '#FFB347', // deep peach

  ];  


  useEffect(() => {
    fetchTokens();
    fetchApiNames();
  }, []);

  const fetchTokens = async () => {
    try {
      const res = await axios.get('/api/apiOrg');
      setTokens(res.data.data);
    } catch (error) {
      console.error('Failed to fetch tokens', error);
    }
  };

  const fetchApiNames = async () => {
    try {
      const res = await axios.get('/api/apis');
      const map = {};
      res.data.forEach(api => {
        map[api.id] = api.name;
      });
      setApiMap(map);
    } catch (error) {
      console.error('Failed to fetch API names', error);
    }
  };

  const handleSort = (column) => {
    const isAsc = orderBy === column && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(column);
  };

  const handleChangePage = (_, newPage) => setPage(newPage);

  const sortedFilteredTokens = tokens
    .filter(token => token.organization.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const valA = a[orderBy]?.toString().toLowerCase() || '';
      const valB = b[orderBy]?.toString().toLowerCase() || '';
      return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

  const paginatedTokens = sortedFilteredTokens.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleEdit = (token) => {
    setEditToken(token);
    setEditOrg(token.organization);
    setEditExpiry(token.expires_at ? token.expires_at.split('T')[0] : '');
    setEditApiIds(token.api_ids); // use array directly
    setEditDialogOpen(true);
  };
  
  
  const handleSaveEdit = async () => {
    try {
      await axios.put(`/api/apiOrg/${editToken.id}`, {
        organization: editOrg,
        expires_at: editExpiry === '' ? null : editExpiry,
        api_ids: editApiIds,
      });
      fetchTokens();
      setEditDialogOpen(false);
    } catch (err) {
      console.error('Failed to update token', err);
    }
  };
  

  const handleDelete = async (token) => {
    if (window.confirm(`Are you sure you want to delete token for "${token.organization}"?`)) {
      try {
        await axios.delete(`/api/apiOrg/${token.id}`);
        fetchTokens();
      } catch (err) {
        console.error('Failed to delete token', err);
      }
    }
  };

      //Preload Image
      useEffect(() => {
        const imagesToPreload = [
          noMatch,
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
      }, [noMatch]);

      const [rotate, setRotate] = useState(false);  // State for rotating the icon

      const handleClick = () => {
        // Trigger the rotation and reset after animation ends
        setRotate(true);
        fetchTokens();
        fetchApiNames();
    
        // Reset the rotation after the animation duration (1000ms)
        setTimeout(() => setRotate(false), 1000);  // Duration should match the animation time
      };

      console.log("Token in localStorage:", localStorage.token);


  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', padding: '1%', backgroundColor: weatherMode ? '#dae7f0' : '#f5f5f9' }}>
            <Sidebar open={sidebarOpen} weatherMode={weatherMode} userName={userData?.name} userType={userData?.type}/>
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
        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'column', md: 'row', width: '100%' },}}>
          {/* Left Panel */}
          <Box sx={{ flex: 8, backgroundColor: 'white', borderRadius: '20px', padding: 2 }}>
          <ClickAwayListener onClickAway={handleClickAway}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      {/* Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
      <Typography variant="h6">API Users</Typography>
  <Tooltip title="Reload API Users">
    <IconButton
      sx={{
        color: '#636363',
        backgroundColor: '#D3D3D3',
        width: '26px',  
        height: '26px', 
        borderRadius: '4px',  
        '&:hover': { backgroundColor: '#B3B3B3', color: '#6494848' },
        ml: 1,
      }}
    >
      <ReplayIcon onClick={handleClick}  
      sx={{ fontSize: '18px',         
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transition: 'transform 0.3s ease',
        transform: rotate ? 'rotate(360deg)' : 'none', 
        }}/>
    </IconButton>
  </Tooltip>
</Box>


{/* Search section */}
<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
  <Collapse in={showSearch} orientation="horizontal">
    <TextField
      autoFocus
      variant="outlined"
      size="small"
      placeholder="Search User"
      value={search}
      onChange={(e) => {
        setSearch(e.target.value);
        setPage(0);
      }}
      sx={{
        width: 200,
        backgroundColor: '#ECECEC',
        borderRadius: '20px',
        border: 'none',
        '& .MuiOutlinedInput-root': {
          '& fieldset': {
            border: 'none', // removes the border
          },
          '&.Mui-focused fieldset': {
            border: 'none', // removes the focus border
          },
        },
      }}
      InputProps={{
        endAdornment: search && (
          <IconButton
            onClick={() => setSearch('')}
            sx={{
              position: 'absolute',
              right: 5,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            <ClearIcon />
          </IconButton>
        ),
      }}
    />
  </Collapse>

  <IconButton onClick={() => setShowSearch((prev) => !prev)}>
    <SearchIcon sx={{ bgcolor: '#ffab18', borderRadius: '20px', color: 'white', padding: 0.7, fontSize: '1.9rem' }} />
  </IconButton>
</Box>

    </Box>
    </ClickAwayListener>

            <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
              <Table size="small">
              <TableHead>
  <TableRow sx={{ backgroundColor: '#5497db' }}>
    {['organization', 'expires_at', 'created_at', 'api_ids'].map((col) => (
      <TableCell key={col} align="center" sx={{ color: 'white' }}>
        <TableSortLabel
          active={orderBy === col}
          direction={orderBy === col ? order : 'asc'}
          onClick={() => handleSort(col)}
          sx={{
            color: 'white',
            fontWeight: orderBy === col ? 'bold' : 'normal',
            '&:hover': {
              color: 'white',
              fontWeight: 'bold',
              '.MuiTableSortLabel-icon': {
                color: 'white',
                opacity: 0.6,
                fontSize: '0.875rem', // smaller icon
              },
            },
            '&.Mui-active': {
              color: 'white',
              '.MuiTableSortLabel-icon': {
                color: 'white',
                opacity: 0.6,
                fontSize: '0.875rem',
              },
            },
          }}
        >
          {col === 'organization'
            ? 'Organization'
            : col === 'expires_at'
            ? 'Expiration'
            : col === 'created_at'
            ? 'Timestamp'
            : 'API Access'}
        </TableSortLabel>
      </TableCell>
    ))}
    <TableCell align="center" sx={{ color: 'white' }}>
      Actions
    </TableCell>
  </TableRow>
</TableHead>


                <TableBody>
                  {paginatedTokens.map((token, index) => (
                    <TableRow
                      key={token.id}
                      sx={{
                        backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9',
                        '&:hover': { backgroundColor: '#e0f7fa' }
                      }}
                    >
                      <TableCell align="center">{token.organization}</TableCell>
                      <TableCell align="center">
  {token.expires_at ? (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <CalendarMonthIcon sx={{ fontSize: 14, color: 'gray', mr: 0.3 }} />
        <span>
          {new Date(token.expires_at).toLocaleDateString('en-US', {
            month: 'long', day: '2-digit', year: 'numeric'
          })}
        </span>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <AccessAlarmsIcon sx={{ fontSize: 14, color: 'gray', ml: 1, mr: 0.3 }} />
        <span>
          {new Date(token.expires_at).toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: true
          })}
        </span>
      </Box>
    </Box>
  ) : (
    <Tooltip title="Lifetime"><AllInclusiveIcon color="primary" /></Tooltip>
  )}
</TableCell>

<TableCell align="center">
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, padding: 1 }}>
      <CalendarMonthIcon sx={{ fontSize: 14, color: 'gray' }} />
      <span>{new Date(token.created_at).toLocaleDateString('en-US', {
        month: 'long', day: '2-digit', year: 'numeric'
      })}</span>
    </Box>
  </Box>
</TableCell>

<TableCell align="center">
  {token.api_ids && (
    <>
      {token.api_ids.slice(0, 3).map((id, i) => (
        <Tooltip key={id} title={apiMap[id] || 'Unknown API'}>
<Chip
  label={apiMap[id]?.charAt(0).toUpperCase()}
  size="small"
  sx={{
    mr: 0.5,
    borderRadius: '100%',
    backgroundColor: apiColors[id - 1] || '#B0BEC5', // Adjusted to use the index (id - 1)
    color: '#fff',
  }}
/>
        </Tooltip>
      ))}

      {token.api_ids.length > 3 && (
        <Tooltip
          title={token.api_ids
            .slice(3)
            .map(id => apiMap[id] || 'Unknown API')
            .join(', ')}
        >
          <Chip
            label={`+${token.api_ids.length - 3}`}
            size="small"
            sx={{
              fontSize: '0.55rem',
              borderRadius: '100%',
              backgroundColor: '#D4D4D4',
              color: '#fff',
            }}
          />
        </Tooltip>
      )}
    </>
  )}
</TableCell>
                      <TableCell align="center">
                      <Tooltip title="Edit Entry">
                        <IconButton
                          sx={{
                            borderRadius: '8px',
                            padding: 0.5,
                            bgcolor: '#f4aa26',
                            marginRight: 0.25,
                            transition: 'background-color 0.3s ease',
                            '&:hover': { bgcolor: '#ff9000' }
                          }}
                          onClick={() => handleEdit(token)}
                        >
                          <EditIcon sx={{ fontSize: '1.1rem', color: 'white' }} />
                        </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Entry">
                        <IconButton
                          sx={{
                            borderRadius: '8px',
                            padding: 0.5,
                            bgcolor: '#ee2929',
                            marginLeft: 0.25,
                            transition: 'background-color 0.3s ease',
                            '&:hover': { bgcolor: '#b40000' }
                          }}
                          onClick={() => handleDelete(token)}
                        >
                          <DeleteIcon sx={{ fontSize: '1.1rem', color: 'white' }} />
                        </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginatedTokens.length === 0 && (

<TableRow>
  <TableCell colSpan={5} align="center">
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem' }}>
      <img src={noMatch} alt="No Matches" style={{ width: '150px', marginBottom: '1rem' }} />
      <div>
      <strong style={{ fontSize: '18px', marginBottom: '4px', color:'#4994da' }}>No Exact Matches Found</strong>
        <p style={{ margin: 0, color: '#556982' }}>Clear your search bar and start over</p>
      </div>
    </div>
  </TableCell>
</TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5]}
              component="div"
              count={sortedFilteredTokens.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              sx={{ px: 2 }}
            />
          </Box>

{/* Right Panel */}
<Box sx={{ flex: 2, display: 'flex', flexDirection: { sm: "row", md: "column" }, gap: 2 }}>
      {/* First Box */}
      <Box sx={{ flex: 1, backgroundColor: '#5497db', borderRadius: '20px', padding: 2, display: 'flex', cursor: 'pointer', alignItems: 'center', gap: 2, transition: '0.2s ease-in-out',
        '&:hover': {
          backgroundColor: '#2e6cab',
        },
        '&:hover .hover-title': {
          transform: 'scale(1.1)',
      color: '#ffab18',
    },
    '&:hover .hover-sub': {
      transform: 'scale(1.1)',
      color: 'white',
    },
    '&:hover .hover-lottie': {
      transform: 'scale(1.5)',
    },
       }}>
        {/* Left side: Lottie animation */}
        <Box
    className="hover-lottie"
    sx={{
      transition: 'transform 0.3s ease-in-out',
    }}
  >
    <Lottie
      animationData={GentokenJson}
      loop={true}
      autoplay={true}
      style={{ width: '100%', height: '100%' }}
    />
  </Box>

        {/* Right side: Add token content */}
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', width:'100%' }}>
          <Typography variant="h6" className="hover-title" sx={{ fontWeight: 'bold', color: '#114f8d', transition: '0.2s ease-in-out', lineHeight: 1, mb: 1 }}>Set Up API</Typography>
          <Typography variant="body2" className="hover-sub" sx={{ color: 'white', transition: '0.2s ease-in-out', lineHeight: 1.1 }}>Create an API that can be shared with other systems, services, or partners.</Typography>
        </Box>
      </Box>

      {/* Second Box */}
      
      <Box
  sx={{
    flex: 1,
    backgroundColor: '#ffab18',
    borderRadius: '20px',
    padding: 2,
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    transition: '0.3s ease-in-out',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#F68C22',
    },
    '&:hover .hover-title': {
      transform: 'scale(1.05)',
      color: '#114f8d',
    },
    '&:hover .hover-sub': {
      transform: 'scale(1.05)',
      color: 'white',
    },
    '&:hover .hover-lottie': {
      transform: 'scale(1.3)',
    },
  }}
  onClick={() => setAddDialogOpen(true)}
>
        {/* Left side: Lottie animation */}
  <Box
    className="hover-lottie"
    sx={{
      flex: '0 0 30%',
      width: '120px',
      height: '120px',
      transition: 'transform 0.3s ease-in-out',
    }}
  >
    <Lottie
      animationData={AddUserJson}
      loop
      autoplay
      style={{ width: '100%', height: '100%' }}
    />
  </Box>

     {/* Right side: Add API users content */}
  <Box
    sx={{
      flex: '0 0 70%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      transition: '0.3s ease-in-out',
    }}
  >
    <Typography
      className="hover-title"
      variant="h6"
      sx={{ fontWeight: 'bold', color: '#AC6F00', transition: 'all 0.3s', lineHeight: 1, mb: 1 }}
    >
      Register API Users
    </Typography>
    <Typography
      className="hover-sub"
      variant="body2"
      sx={{ color: 'white', transition: 'all 0.3s', lineHeight: 1.1 }}
    >
      Create user accounts and assign appropriate credentials to grant secure access to the API.
    </Typography>
  </Box>
</Box>


</Box>


          
        </Box>

             {/* Bottom: Tables */}
<Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'column', md: 'row', width: '100%' }, paddingTop: 2}}>

   {/* Bottom: Left */}
      <Box sx={{ flex: 2, display: 'flex', flexDirection: { sm: "row", md: "column" }, gap: 2, backgroundColor:'white', borderRadius: '20px'}}>
        API
      </Box>

         {/* Bottom: Right */}
      <Box sx={{ flex: 2, display: 'flex', flexDirection: { sm: "row", md: "column" }, gap: 2, backgroundColor:'white', borderRadius: '20px'  }}>
        API Logs
      </Box>
    </Box>
      </Box>

      {/* Edit Dialog */}
      {editDialogOpen && (
  <Box
    sx={{
      position: 'fixed',
      top: '7%',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1401,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      '@keyframes ripple': {
        '0%': {
          transform: 'scale(0.3)',
          opacity: 0.7,
        },
        '100%': {
          transform: 'scale(1.5)',
          opacity: 0,
        },
      },
    }}
  >
    <Box sx={{ position: 'relative', width: 150, height: 150 }}>
      {[...Array(4)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            backgroundColor: '#2196f3',
            animation: 'ripple 2.5s ease-out infinite',
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}
      <img
        src={EditImage}
        alt="Edit"
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          position: 'relative',
          zIndex: 1,
        }}
      />
    </Box>
  </Box>
)}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}   
      PaperProps={{
    sx: {
      borderRadius: '20px',
    },
  }}
  TransitionComponent={Transition}
  keepMounted
  >
    <br/>
    <br/>
    <br/>
    <br/>
    <br/>
    <DialogTitle
  sx={{
    textAlign: 'center',
    color: '#2196f3',
    fontWeight: 'bold',
    fontSize: '1.5rem',
  }}
>
  Edit Token
</DialogTitle>
  <DialogContent>
    <TextField
      label="Organization"
      fullWidth
      variant="outlined"
      sx={{ mt: 1, mb: 2 }}
      value={editOrg}
      onChange={(e) => setEditOrg(e.target.value)}
    />
<InputLabel shrink htmlFor="expires">
    Expiration Date (optional)
  </InputLabel>
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <TextField
      id="expires"
      type="date"
      fullWidth
      variant="outlined"
      value={isLifetime ? '' : editExpiry}
      disabled={isLifetime}
      onChange={(e) => setEditExpiry(e.target.value)}
    />
    <Tooltip title="Toggle Lifetime Access">
      <IconButton
        onClick={() => {
          const newLifetime = !isLifetime;
          setIsLifetime(newLifetime);
          if (newLifetime) setEditExpiry(''); // clear expiry if lifetime is set
        }}
        sx={{
          color: isLifetime ? 'white' : '#9e9e9e',
          backgroundColor: isLifetime ? '#2196f3' : 'transparent',
          borderRadius: '20px',
          transition: 'all 0.2s',
          '&:hover': {
            backgroundColor: isLifetime ? '#1976d2' : '#e0e0e0',
            transition: 'all 0.2s',
          },
        }}        
      >
        <AllInclusiveIcon />
      </IconButton>
    </Tooltip>
  </Box>

    <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
      API Access
    </Typography>
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1,
        p: 1,
        borderRadius: 2,
        backgroundColor: '#f7fbff',
      }}
    >
      {Object.entries(apiMap).map(([id, name]) => {
        const numericId = parseInt(id);
        const selected = editApiIds.includes(numericId);
        return (
          <Chip
            key={id}
            label={name}
            variant={selected ? 'filled' : 'outlined'}
            clickable
            onClick={() => {
              if (selected) {
                setEditApiIds(prev => prev.filter(i => i !== numericId));
              } else {
                setEditApiIds(prev => [...prev, numericId]);
              }
            }}
            sx={{
              color: selected ? 'white' : '#2196f3',
              backgroundColor: selected ? '#2196f3' : 'transparent',
              border: '1px solid #2196f3',
              '&:hover': {
                backgroundColor: selected ? '#1976d2' : '#e3f2fd',
              },
              fontWeight: 500,
            }}
          />
        );
      })}
    </Box>
  </DialogContent>
  <DialogActions
  sx={{
    justifyContent: 'center',
    mb: '2%',
  }}
>
  <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
  <Button variant="contained" onClick={handleSaveEdit}>Save</Button>
</DialogActions>

</Dialog>

   {/* Add Dialog */}
   {addDialogOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: formError ? '-1%' : '2.5%',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1401,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '@keyframes ripple': {
              '0%': { transform: 'scale(0.3)', opacity: 0.7 },
              '100%': { transform: 'scale(1.5)', opacity: 0 },
            },
          }}
        >
          <Box sx={{ position: 'relative', width: 150, height: 150 }}>
            {[...Array(4)].map((_, i) => (
              <Box
                key={i}
                sx={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  backgroundColor: '#2196f3',
                  animation: 'ripple 2.5s ease-out infinite',
                  animationDelay: `${i * 0.5}s`,
                }}
              />
            ))}
            <img
              src={EditImage}
              alt="Edit"
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                position: 'relative',
                zIndex: 1,
              }}
            />
          </Box>
        </Box>
      )}

      {/* Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        PaperProps={{
          sx: { borderRadius: '20px' },
        }}
        TransitionComponent={Transition}
        keepMounted
      >
        <br />
        <br />
        <br />
        <br/>
        <br/>
        <br/>
        <DialogTitle
          sx={{
            textAlign: 'center',
            color: '#2196f3',
            fontWeight: 'bold',
            fontSize: '1.5rem',
            mb: 1
          }}
        >
          Add API User
        </DialogTitle>

        <DialogContent>
        {formError && (
  <Alert severity="error" sx={{ mb: 1 }}>
    {formError}
  </Alert>
)}

          <TextField
            label="Organization"
            fullWidth
            variant="outlined"
            sx={{ mt: 1, mb: 2 }}
            value={newOrg}
            onChange={(e) => setNewOrg(e.target.value)}
          />
          <TextField
            label="Email"
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />

          <InputLabel shrink htmlFor="expires">Expiration Date (optional)</InputLabel>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              id="expires"
              type="date"
              fullWidth
              variant="outlined"
              value={isLifetime ? '' : newExpiry}
              disabled={isLifetime}
              onChange={(e) => setNewExpiry(e.target.value)}
            />
            <Tooltip title="Toggle Lifetime Access">
              <IconButton
                onClick={() => {
                  const toggle = !isLifetime;
                  setIsLifetime(toggle);
                  if (toggle) setNewExpiry('');
                }}
                sx={{
                  color: isLifetime ? 'white' : '#9e9e9e',
                  backgroundColor: isLifetime ? '#2196f3' : 'transparent',
                  borderRadius: '20px',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: isLifetime ? '#1976d2' : '#e0e0e0',
                  },
                }}
              >
                <AllInclusiveIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
            API Access
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              p: 1,
              borderRadius: 2,
              backgroundColor: '#f7fbff',
            }}
          >
            {Object.entries(apiMap).map(([id, name]) => {
              const numericId = parseInt(id);
              const selected = newApiIds.includes(numericId);
              return (
                <Chip
                  key={id}
                  label={name}
                  variant={selected ? 'filled' : 'outlined'}
                  clickable
                  onClick={() =>
                    setNewApiIds((prev) =>
                      selected ? prev.filter((i) => i !== numericId) : [...prev, numericId]
                    )
                  }
                  sx={{
                    color: selected ? 'white' : '#2196f3',
                    backgroundColor: selected ? '#2196f3' : 'transparent',
                    border: '1px solid #2196f3',
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: selected ? '#1976d2' : '#e3f2fd',
                    },
                  }}
                />
              );
            })}
          </Box>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', mb: '2%' }}>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleGenerateToken}>
            Generate Token
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default Token;
