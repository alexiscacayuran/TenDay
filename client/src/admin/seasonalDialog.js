import React, { useState, forwardRef } from 'react';
import {
  Button,
  Typography,
  Box,
  IconButton,
  Chip,
  Tooltip,
  Alert,
} from '@mui/joy';
import {
  Slide,
  Dialog,
  DialogContent,
  DialogActions,
  Collapse,
  TextField
} from '@mui/material';
import dbImg from '../assets/img/database.png';
import tifImg from '../assets/img/tif.png';
import uploadImg from '../assets/img/uploadFile.png';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import ResultBox from './resultBox';
import Loader from './Loader';

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const SeasonalForecastDialog = ({ open, onClose, weatherMode }) => {
  const [batch, setBatch] = useState('');
  const [selectedTypes, setSelectedTypes] = useState(['data', 'tif']);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('info');
  const [loading, setLoading] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [uploadResult, setUploadResult] = useState('success');

  const uploadTypes = [
    { type: 'data', label: 'Data', content: 'Upload seasonal data', img: dbImg },
    { type: 'tif', label: 'TIF', content: 'Upload TIF image', img: tifImg },
  ];

  const apiMap = {
    data: '/seasonal-date',
    tif: '/seasonalprocess',
  };

  const handleTypeClick = (type) => {
    const isSelected = selectedTypes.includes(type);
    const updated = isSelected
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type];
    setSelectedTypes(updated);
    setAlertMessage(`${type.toUpperCase()} ${isSelected ? 'unselected' : 'selected'} for upload.`);
    setAlertSeverity('info');
    setTimeout(() => setAlertMessage(''), 1000);
  };

  const handleSubmit = async () => {
    if (!batch || selectedTypes.length === 0) {
      setAlertMessage('Please input a batch and select at least one upload type.');
      setAlertSeverity('warning');
      return;
    }

    setLoading(true);
    setAlertMessage('');
    try {
      const results = await Promise.all(
        selectedTypes.map(async (type) => {
          const res = await fetch(`${apiMap[type]}?batch=${batch}`, {
            method: 'GET',
            headers: {
              token: localStorage.getItem('token'),
            },
          });
          const text = await res.text();
          const failed =
            !res.ok ||
            text.toLowerCase().includes('folder not found') ||
            text.toLowerCase().includes('error');
          return { type, success: !failed, message: text };
        })
      );

      const allSuccess = results.every((r) => r.success);
      setUploadResult(allSuccess ? 'success' : 'fail');
      setShowResultDialog(true);
      onClose();
      setSelectedTypes(['data', 'tif']);
      setBatch('');
    } catch (error) {
      console.error(error);
      setUploadResult('fail');
      setShowResultDialog(true);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={() => {
          onClose();
          setAlertMessage('');
          setBatch('');
        }}
        fullWidth
        maxWidth="sm"
        TransitionComponent={Transition}
        PaperProps={{
          sx: {
            overflow: 'visible',
            pt: 6,
            pb: 4,
            px: 4,
            borderRadius: 4,
            width: 500,
            backgroundColor: weatherMode ? '#eaf4fd' : '#fff',
            boxShadow: 'none',
          },
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mt: -8 }}>
          <Box
            sx={{
              width: 180,
              height: 180,
              borderRadius: '50%',
              overflow: 'hidden',
              position: 'relative',
              top: -35,
              flexShrink: 0,
            }}
          >
            <img src={uploadImg} alt="Upload" style={{ width: '95%', height: '95%', objectFit: 'cover' }} />
          </Box>
          <Box sx={{ ml: 3, mt: -5, flexGrow: 1, color: '#55697e' }}>
            <Typography variant="h5" fontWeight="bold" sx={{ fontSize: 22 }}>
              Upload File
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 14, lineHeight: 1.2 }}>
              Input batch value, then select the file types to upload.
            </Typography>
          </Box>
        </Box>

        <Collapse in={!!alertMessage} sx={{ mb: 1, mt: -5 }}>
          <Alert severity={alertSeverity}>{alertMessage}</Alert>
        </Collapse>

        {/* Batch Input */}
        <TextField
          fullWidth
          label="Batch Number"
          placeholder="e.g., 180"
          type="number"
          value={batch}
          onChange={(e) => setBatch(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '999px',
              backgroundColor: '#f5f5f5',
            },
          }}
        />

        {/* Chips */}
<Box
  sx={{
    backgroundColor: weatherMode ? '#dae7f0' : '#f1f9fe',
    borderRadius: 2,
    px: 2,
    py: 2,
    mt: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: 'none',
    borderRadius: '20px'
  }}
>
  {/* Header with label + icon on right */}
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      mb: 1,
    }}
  >
    <Typography
      level="body-md"
      sx={{
        fontWeight: 'lg',
        color: '#55697e',
        fontSize: 12,
        userSelect: 'none',
      }}
    >
      Select chip that you want to upload
    </Typography>

<Tooltip
        arrow
        placement="top"
        variant="plain"
        sx={{ fontSize: 'xs' }}
        title={selectedTypes.length === uploadTypes.length ? 'Deselect All Items' : 'Select All Items'}
>
  <IconButton
    onClick={() => {
      if (selectedTypes.length === uploadTypes.length) {
        setSelectedTypes([]);
        setAlertSeverity('info');
        setAlertMessage('All types unselected.');
      } else {
        setSelectedTypes(uploadTypes.map((u) => u.type));
        setAlertSeverity('info');
        setAlertMessage('All types selected for upload.');
      }
      setTimeout(() => setAlertMessage(''), 1000);
    }}
    size="small"
    sx={{
      ml: 1,
      color: '#1976d2',
      '&:hover': {
        bgcolor: '#e3effb',
      },
    }}
  >
    {selectedTypes.length === uploadTypes.length ? (
      <CheckCircleIcon fontSize="small" />
    ) : (
      <RadioButtonUncheckedIcon fontSize="small" />
    )}
  </IconButton>
</Tooltip>

  </Box>

  {/* Chips */}
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 1,
      overflowX: 'auto',
      whiteSpace: 'nowrap',
      width: '100%',
      pb: 1,
    }}
  >
    {uploadTypes.map(({ type, label, content, img }) => (
      <Tooltip
        key={type}
        title={content}
        arrow
        placement="top"
        variant="plain"
        sx={{ fontSize: 'xs' }}
      >
<Chip
  variant={selectedTypes.includes(type) ? 'soft' : 'outlined'}
  color={selectedTypes.includes(type) ? 'primary' : 'neutral'}
  onClick={() => handleTypeClick(type)}
  sx={{
    px: 1.5,
    py: 0.5,
    borderRadius: 'lg',
    fontSize: 'sm',
    cursor: 'pointer',
    minWidth: 90,
    fontWeight: 500,
    backgroundColor: selectedTypes.includes(type)
      ? weatherMode
        ? '#d3dce3' // your custom light gray-blue
        : '#e3effb' // your custom light blue
      : 'transparent',
    color: selectedTypes.includes(type)
      ? '#000' // or any color that ensures good contrast
      : 'inherit',
    '&:hover': {
      backgroundColor: selectedTypes.includes(type)
        ? weatherMode
          ? '#c1cbd4'
          : '#b2d8f6'
        : '#f0f4f8',
    },
  }}
  startDecorator={
    <Box
      component="img"
      src={img}
      alt={label}
      sx={{
        width: 20,
        height: 20,
        borderRadius: '50%',
        objectFit: 'cover',
      }}
    />
  }
>
  <Typography level="body-sm" sx={{ fontWeight: 500 }}>
    {label}
  </Typography>
</Chip>

      </Tooltip>
    ))}
  </Box>
</Box>

        {/* Submit */}
        <DialogActions sx={{ mt: 2, px: 0 }}>
          {/* Cancel Button */}
          <Button
            variant="plain"
            color="neutral"
            onClick={() => {
              onClose();
              setSelectedTypes(['data', 'tif']);
              setBatch('');
              setAlertMessage('');
            }}
          >
            Cancel
          </Button>

          <Button
            variant="solid"
            color="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={loading}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {loading && <Loader />}
      <ResultBox open={showResultDialog} result={uploadResult} onClose={() => setShowResultDialog(false)} />
    </>
  );
};

export default SeasonalForecastDialog;