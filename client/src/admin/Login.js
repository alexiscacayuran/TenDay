import React, { useState, useEffect } from 'react';
import Slider from 'react-slick';
import {
  TextField, Button, Grid, Typography, Alert, Stack, IconButton,
  InputAdornment, Container, Box, Tooltip, Skeleton
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import logo from '../assets/img/logo.png';
import tenday from '../assets/img/10day.webp';
import Loader from './Loader'; 

const Login = ({ setIsAuthenticated }) => {
  const [inputs, setInputs] = useState({
    user_id: '',
    password: '',
    showPassword: false
  });

  const [alertMessage, setAlertMessage] = useState(null);
  const [alertSeverity, setAlertSeverity] = useState('success');
  const [loading, setLoading] = useState(true);
  const [load, setLoad] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoad(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const { user_id, password, showPassword } = inputs;

  const onChange = e => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  const onSubmitForm = async e => {
    e.preventDefault();
  
    if (!user_id.trim() || !password.trim()) {
      setAlertSeverity('warning');
      setAlertMessage('Fill in all fields.');
      return;
    }
  
    try {
      const body = { user_id, password };
      const response = await fetch(`/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
  
      const parseRes = await response.json();
  
      if (parseRes.token) {
        localStorage.setItem('token', parseRes.token);
        setIsAuthenticated(true);
        setAlertSeverity('success');
        setAlertMessage('Login successful!');
      } else {
        setIsAuthenticated(false);
        setAlertSeverity('error');
        setAlertMessage(parseRes);
      }
    } catch (err) {
      console.error('Error submitting form:', err.message);
      setAlertSeverity('error');
      setAlertMessage('Error submitting form');
    }
  };
  

  const togglePasswordVisibility = () => {
    setInputs({ ...inputs, showPassword: !showPassword });
  };

  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
  };

  const images = [
    tenday,
    'https://picsum.photos/id/13/200/300',
    'https://picsum.photos/id/16/200/300',
  ];

  const backgroundStyle = {
    backgroundColor: '#F5F5F9',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    margin: 0,
  };

  return (
    <>
      {/* Overlay Loader */}
      {load && <Loader />}

      {/* Main Content */}
      <div style={{ filter: load ? 'blur(2px)' : 'none' }}>
        <Box sx={backgroundStyle}>
          <Container maxWidth="md" sx={{
            padding: '1rem',
            backgroundColor: '#fff',
            borderRadius: '15px',
            boxShadow: 'rgba(149, 157, 165, 0.2) 0px 8px 24px'
          }}>
            <Grid container>
              {/* Left: Carousel */}
              <Grid item xs={12} md={6} sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 2
              }}>
                <Box sx={{ width: '100%' }}>
                  {loading ? (
                    <Skeleton variant="rectangular" width="100%" height={500} />
                  ) : (
                    <Slider {...sliderSettings}>
                      {images.map((image, index) => (
                        <div key={index}>
                          <img
                            src={image}
                            alt={`Slide ${index + 1}`}
                            onContextMenu={(e) => e.preventDefault()}
                            draggable="false"
                            style={{
                              width: '100%',
                              maxHeight: '500px',
                              objectFit: 'cover',
                              borderRadius: '10px',
                              userSelect: 'none'
                            }}
                          />
                        </div>
                      ))}
                    </Slider>
                  )}
                </Box>
              </Grid>

              {/* Right: Login Form */}
              <Grid item xs={12} md={6} sx={{ padding: 4 }}>
                {/* Animated logo container */}
                <Box
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 3,
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      width: '200px',
                      height: '200px',
                      backgroundColor: 'rgba(3, 195, 236, 0.3)',
                      borderRadius: '50%',
                      animation: 'pulse 2s infinite',
                      '@keyframes pulse': {
                        '0%': { transform: 'scale(0.2)', opacity: 1 },
                        '50%': { transform: 'scale(0.5)', opacity: 0.5 },
                        '100%': { transform: 'scale(0.2)', opacity: 1 },
                      },
                    }} />
                  <Box
                    sx={{
                      position: 'absolute',
                      width: '250px',
                      height: '250px',
                      backgroundColor: 'rgba(3, 195, 236, 0.2)',
                      borderRadius: '50%',
                      animation: 'pulse 3s infinite',
                      '@keyframes pulse': {
                        '0%': { transform: 'scale(0.2)', opacity: 1 },
                        '50%': { transform: 'scale(0.5)', opacity: 0.3 },
                        '100%': { transform: 'scale(0.2)', opacity: 1 },
                      },
                    }} />
                  {loading ? (
                    <Skeleton variant="circular" width={70} height={70} />
                  ) : (
                    <Box
                      component="img"
                      src={logo}
                      alt="logo"
                      onContextMenu={(e) => e.preventDefault()}
                      draggable="false"
                      style={{ userSelect: 'none' }}
                      sx={{ width: '70px', zIndex: 1 }}
                    />
                  )}
                </Box>

                {loading ? (
                  <>
                    <Box display="flex" flexDirection="column" alignItems="center">
                      <Skeleton width="60%" height={30} sx={{ marginBottom: 1 }} />
                      <Skeleton width="80%" height={60} />
                    </Box>
                  </>
                ) : (
                  <>
                    <Typography variant="h5" align="center" color='#566a7f' fontWeight={600}>
                      PAGASA-CAD
                    </Typography>
                    <Typography
                      variant="h5"
                      align="center"
                      gutterBottom
                      color="#566a7f"
                      fontWeight={600}
                      sx={{ lineHeight: 0.5, mb: 2 }}
                    >
                      Management System
                    </Typography>
                    <Typography variant="body2" align="center" gutterBottom color='#7d7777'>
                      Your source for climate data and weather information.
                    </Typography>
                  </>
                )}

                {alertMessage && (
                  <Stack sx={{ width: '100%', justifyContent: 'center', marginY: '1rem' }} spacing={2}>
                    <Alert severity={alertSeverity} onClose={() => setAlertMessage(null)}>
                      {alertMessage}
                    </Alert>
                  </Stack>
                )}

                <form onSubmit={onSubmitForm}>
                  {loading ? (
                    <>
                      <Skeleton variant="rectangular" width="100%" height={56} sx={{ marginBottom: 2 }} />
                      <Skeleton variant="rectangular" width="100%" height={56} sx={{ marginBottom: 2 }} />
                    </>
                  ) : (
                    <>
                      <TextField
                        type="text"
                        name="user_id"
                        label="Username"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={user_id}
                        onChange={onChange}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            '&:hover fieldset': { borderColor: '#03c3ec' },
                            '&.Mui-focused fieldset': { borderColor: '#03c3ec' },
                          },
                        }}
                      />
                      <TextField
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        label="Password"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={password}
                        onChange={onChange}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <Tooltip title={showPassword ? 'Hide Password' : 'Show Password'}>
                                <IconButton onClick={togglePasswordVisibility} edge="end">
                                  {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                                </IconButton>
                              </Tooltip>
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            '&:hover fieldset': { borderColor: '#03c3ec' },
                            '&.Mui-focused fieldset': { borderColor: '#03c3ec' },
                          },
                        }}
                      />
                    </>
                  )}
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    disabled={loading}
                    sx={{ marginTop: '1rem', backgroundColor: '#03c3ec', borderRadius: '8px', boxShadow: 'none' }}
                  >
                    {loading ? <Skeleton width="100%" /> : 'Sign in'}
                  </Button>
                </form>

                <br />
                <Typography variant="subtitle1" fontSize={12} fontWeight='500' align="center" gutterBottom color='#566a7f'>
                  © PAGASA-CAD 2025
                </Typography>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </div>
    </>
  );
};

export default Login;
