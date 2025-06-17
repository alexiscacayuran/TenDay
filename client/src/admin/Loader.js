import React from 'react';
import { Box } from '@mui/material';
import tanaw from '../assets/img/Loading.gif';

const Loader = () => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(24, 23, 23, 0.85)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999
      }}
    >
      <img src={tanaw} alt="Loading..." style={{ width: '350px' }} />
    </Box>
  );
};

export default Loader;
