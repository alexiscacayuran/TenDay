import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import Lottie from 'lottie-react';
import SuccessAnimation from '../assets/img/Success.json';
import FailedAnimation from '../assets/img/Failed.json';

const ResultBox = ({ open, onClose, uploadResult }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          pt: 6,
          textAlign: 'center',
          overflow: 'visible',
          boxShadow: 'none',
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '-90px',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ height: 200, width: 200 }}>
          <Lottie
            animationData={uploadResult === 'success' ? SuccessAnimation : FailedAnimation}
            loop={false}
          />
        </Box>
      </Box>

      <DialogTitle
        sx={{
          pt: 0,
          mt: 8,
          fontWeight: 500,
          fontSize: 30,
          color: uploadResult === 'success' ? '#59b189' : '#cd5050',
        }}
      >
        {uploadResult === 'success' ? 'Upload Successful!' : 'Upload Failed'}
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" sx={{ fontSize: 15, color: '#55697e' }}>
          {uploadResult === 'success'
            ? 'All selected forecast files were uploaded successfully. Your data is now available in the system.'
            : 'Some or all forecast files could not be uploaded. Please review the error logs and try again.'}
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          variant="contained"
          color={uploadResult === 'success' ? 'primary' : 'error'}
          sx={{
            mx: 'auto',
            borderRadius: 2,
            width: '200px',
            mb: 2,
            boxShadow: 'none',
            backgroundColor: uploadResult === 'success' ? '#59b189' : '#cd5050',
          }}
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ResultBox;
