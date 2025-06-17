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
import InsertPhotoOutlinedIcon from '@mui/icons-material/InsertPhotoOutlined';
import AirIcon from '@mui/icons-material/Air';
import StorageIcon from '@mui/icons-material/Storage';
import Grid3x3Icon from '@mui/icons-material/Grid3x3';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import Loader from './Loader';
import dayjs from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import ResultBox from './resultBox';

import uploadImg from '../assets/img/uploadFile.png';
import windImg from '../assets/img/wind.png';
import xlsxImg from '../assets/img/xlsx.png';
import tifImg from '../assets/img/tif.png';
import dbImg from '../assets/img/database.png';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const TenDayForecastDialog = ({ open, onClose, weatherMode }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState(['data', 'wind', 'tif', 'xlsx']);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [uploadResult, setUploadResult] = useState('success');

const uploadTypes = [
  { type: 'data', label: 'Data', content: 'Upload data', img: dbImg },
  { type: 'tif', label: 'TIF', content: 'Upload TIF file', img: tifImg },
  { type: 'wind', label: 'Wind', content: 'Upload wind component', img: windImg },
  { type: 'xlsx', label: 'XLSX', content: 'Upload Excel sheet', img: xlsxImg },
];

const handleTypeClick = (type) => {
  const isSelected = selectedTypes.includes(type);
  const newTypes = isSelected
    ? selectedTypes.filter((t) => t !== type)
    : [...selectedTypes, type];

  setSelectedTypes(newTypes);
  setAlertSeverity('info');
  setAlertMessage(
    isSelected
      ? `${type.toUpperCase()} unselected.`
      : `${type.toUpperCase()} selected for upload.`
  );

  // Auto-hide alert after 1 second
  setTimeout(() => {
    setAlertMessage('');
  }, 1000);
};


  const handleSubmit = async () => {
    if (!selectedDate || selectedTypes.length === 0) {
      setAlertMessage('Please select a date and at least one upload type.');
      setAlertSeverity('warning');
      return;
    }

    const year = selectedDate.year();
    const month = String(selectedDate.month() + 1).padStart(2, '0');
    const day = String(selectedDate.date()).padStart(2, '0');

    const apiMap = {
      data: '/uploadForecastData',
      wind: '/uploadForecastWind',
      tif: '/uploadForecastTIF',
      xlsx: '/uploadForecastXLSX',
    };

    setLoading(true);
    setAlertMessage('');

    try {
      const results = await Promise.all(
        selectedTypes.map(async (type) => {
          const res = await fetch(`${apiMap[type]}?year=${year}&month=${month}&day=${day}`, {
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

      const allSuccessful = results.every((r) => r.success);
      setUploadResult(allSuccessful ? 'success' : 'fail');
      setShowResultDialog(true);
      onClose();
      setSelectedTypes([]);
      setSelectedDate(null);
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
          setSelectedDate(null);
          setAlertMessage('');
        }}
        fullWidth
        maxWidth="sm"
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
        TransitionComponent={Transition}
      >
        {/* Top image + text row */}
        <Box sx={{ display: 'flex', alignItems: 'center', mt: -8 }}>
          {/* Circular image floated above the dialog */}
          <Box
            sx={{
              width: 180,
              height: 180,
              borderRadius: '50%',
              overflow: 'hidden',
              backgroundColor: 'transparent',
              position: 'relative',
              top: -35,
              flexShrink: 0,
              boxShadow: 'none',
            }}
          >
            <img
              src={uploadImg}
              alt="Forecast Icon"
              style={{ width: '95%', height: '95%', objectFit: 'cover' }}
            />
          </Box>

          {/* Text on the right of image */}
          <Box sx={{ ml: 3, mt: -5, flexGrow: 1, color: '#55697e' }}>
            <Typography variant="h5" fontWeight="bold" sx={{fontSize: 22}}>
              Upload File
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 14, lineHeight: 1.2 }}>
              Select a date you want to upload, then choose the file types to upload.
            </Typography>
          </Box>
        </Box>

        {/* Alert */}
        <Collapse in={!!alertMessage} sx={{ mb: 1, mt: -5 }}>
          <Alert color="warning" severity={alertSeverity}>{alertMessage}</Alert>
        </Collapse>

        {/* Date Picker */}
<LocalizationProvider dateAdapter={AdapterDayjs}>
  <Tooltip title="Pick the base date of the forecast" arrow placement="top">
    <DatePicker
      value={selectedDate}
      onChange={(newValue) => setSelectedDate(newValue)}
      renderInput={(params) => {
        const displayValue = selectedDate ? params.inputProps.value : '';

        return (
          <Box sx={{ position: 'relative', width: '100%' }}>
            <TextField
              {...params}
              label="Select date"
              value={displayValue}
              placeholder="MM/DD/YYYY"
              sx={{
                '& .MuiOutlinedInput-root': {
                  pr: '48px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '20px',
                  '& fieldset': {
                    border: '1px solid #3f51b5',
                  },
                  '&:hover fieldset': {
                    borderColor: '#303f9f',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#303f9f',
                    borderWidth: 2,
                  },
                },
                '& .MuiOutlinedInput-input': {
                  padding: '10px 16px',
                },
              }}
              inputProps={{
                ...params.inputProps,
              }}
            />

            {/* Calendar Icon Container */}
            <Box
              sx={{
                position: 'absolute',
                top: 1,
                right: 1,
                bottom: 1,
                width: 46,
                backgroundColor: '#3f51b5',
                borderTopRightRadius: '20px',
                borderBottomRightRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 2,
              }}
              onClick={() => {
                if (params.inputRef?.current) params.inputRef.current.focus();
              }}
            >
              <CalendarTodayIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
          </Box>
        );
      }}
    />
  </Tooltip>
</LocalizationProvider>


        {/* Chips for upload types */}
<Box
  sx={{
    backgroundColor: weatherMode ? '#dae7f0' : '#f1f9fe',
    borderRadius: 2,
    px: 2,
    py: 2,
    mt: 2,
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
                ? '#d3dce3'
                : '#e3effb'
              : 'transparent',
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



        {/* Buttons */}
        <DialogActions sx={{ mt: 2, mb: -3 }}>
          <Button
            variant="plain"
            color="neutral"
            onClick={() => {
              onClose();
              setSelectedDate(null);
              setSelectedTypes(['data', 'wind', 'tif', 'xlsx']);
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

        {loading && <Loader />}
      </Dialog>

      {/* Result Dialog */}
      {showResultDialog && (
        <ResultBox
          open={showResultDialog}
          onClose={() => setShowResultDialog(false)}
            uploadResult={uploadResult}
        />
      )}
    </>
  );
};

export default TenDayForecastDialog;
