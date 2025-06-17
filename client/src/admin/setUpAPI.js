import React from 'react';
import { Paper, Box, Typography, Button } from '@mui/material';
import Lottie from 'lottie-react';
import apiAnimation from '../assets/img/GenToken.json';  
import userAnimation from '../assets/img/AddUser.json';   

const SetUpAPI = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
      <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
        <Lottie animationData={apiAnimation} style={{ height: 150 }} />
        <Typography variant="h6">Set Up Your API</Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>Create tokens and manage access</Typography>
        <Button variant="contained">Set Up</Button>
      </Paper>
      <Paper elevation={3} sx={{ p: 2, textAlign: 'center' }}>
        <Lottie animationData={userAnimation} style={{ height: 150 }} />
        <Typography variant="h6">Add API User</Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>Invite and manage API consumers</Typography>
        <Button variant="outlined">Add User</Button>
      </Paper>
    </Box>
  );
};

export default SetUpAPI;
