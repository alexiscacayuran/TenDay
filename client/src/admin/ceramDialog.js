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
} from '@mui/material';
import dbImg from '../assets/img/database.png';
import tifImg from '../assets/img/tif.png';
import csvImg from '../assets/img/csv.png';
import uploadImg from '../assets/img/uploadFile.png';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import ResultBox from './resultBox';
import Loader from './Loader';

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const CeramDialog = ({ open, onClose, weatherMode }) => {
  const [selectedTypes, setSelectedTypes] = useState(['csv', 'tif']);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('info');
  const [loading, setLoading] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [uploadResult, setUploadResult] = useState('success');
  const [resultDetails, setResultDetails] = useState([]);

  const uploadTypes = [
    { type: 'data', label: 'Data', content: 'Convert CSV to database', img: dbImg },
    { type: 'csv', label: 'CSV File', content: 'Upload CERAM CSV', img: csvImg },
    { type: 'tif', label: 'TIF File', content: 'Upload extremes TIF', img: tifImg },
  ];

  const apiMap = {
    csv: '/uploadCeramCSV',
    tif: '/uploadExtremesTIF',
    data: '/api/get-ceram',
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
    if (selectedTypes.length === 0) {
      setAlertMessage('Please select at least one upload type.');
      setAlertSeverity('warning');
      return;
    }

    setLoading(true);
    setAlertMessage('');

    try {
      const results = await Promise.all(
        selectedTypes.map(async (type) => {
          try {
            const res = await fetch(apiMap[type], {
              method: 'GET',
              headers: {
                token: localStorage.getItem('token'),
              },
            });
            const text = await res.text();
            const failed =
              !res.ok ||
              text.toLowerCase().includes('error') ||
              text.toLowerCase().includes('not found');
            return {
              type,
              success: !failed,
              message: text,
            };
          } catch (err) {
            return {
              type,
              success: false,
              message: 'Request failed.',
            };
          }
        })
      );

      setResultDetails(results);

      const allSuccess = results.every((r) => r.success);
      const anySuccess = results.some((r) => r.success);

      setUploadResult(allSuccess ? 'success' : anySuccess ? 'partial' : 'fail');
      setShowResultDialog(true);
      onClose();
      setSelectedTypes(['csv', 'tif']);
    } catch (error) {
      console.error(error);
      setUploadResult('fail');
      setResultDetails([]);
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
              Select the file types to upload.
            </Typography>
          </Box>
        </Box>

        <Collapse in={!!alertMessage} sx={{ mb: 1, mt: -5 }}>
          <Alert severity={alertSeverity}>{alertMessage}</Alert>
        </Collapse>

        {/* Chip Selector */}
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
            borderRadius: '20px',
          }}
        >
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
                    color: selectedTypes.includes(type) ? '#000' : 'inherit',
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

        <DialogActions sx={{ mt: 2, px: 0 }}>
          <Button
            variant="plain"
            color="neutral"
            onClick={() => {
              onClose();
              setSelectedTypes(['csv', 'tif']);
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
      <ResultBox
        open={showResultDialog}
        result={uploadResult}
        details={resultDetails}
        onClose={() => setShowResultDialog(false)}
      />
    </>
  );
};

export default CeramDialog;
