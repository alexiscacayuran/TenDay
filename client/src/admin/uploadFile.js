import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button
} from '@mui/joy';
import { Slide, Fade, Backdrop } from '@mui/material';
import items1 from '../assets/img/items-1.webp';
import items2 from '../assets/img/items-2.webp';
import items1wm from '../assets/img/items-1-wm.png';
import items2wm from '../assets/img/items-2-wm.png';
import pageCurl from '../assets/img/curl.png';
import tenday2 from '../assets/img/tenday-1.png';
import tenday from '../assets/img/tenday-2.webp';
import seasonal2 from '../assets/img/seasonal-1.png';
import seasonal1 from '../assets/img/seasonal-2.webp';
import histo1 from '../assets/img/histo-1.png';
import histo2 from '../assets/img/histo-2.png';
import ceram2 from '../assets/img/ceram-1.png';
import ceram1 from '../assets/img/ceram-2.png';
import noMatch from '../assets/img/noMatch.png';

import TenDayForecastDialog from './tenDayDialog';
import SeasonalDialog from './seasonalDialog';
import CeramDialog from './ceramDialog';

const UploadBox = ({ weatherMode, userType, open }) => {
  const [activeDialog, setActiveDialog] = useState(null);
  const [slideIndex, setSlideIndex] = useState(0);

  const handleClose = () => setActiveDialog(null);

  // Dialog data for user types
  const user2Data = [
    {
      title: 'Ten-day Forecast',
      description: 'Upload daily forecast data to keep short-term weather updates current.',
    },
    {
      title: 'Seasonal Forecast',
      description: 'Submit seasonal outlooks to support planning and decision-making.',
    },
    {
      title: 'Historical Data',
      description: 'Import past forecast records to enable trend analysis and validation.',
    },
  ];

  const user3Data = [
    {
      title: 'CERAM',
      description: 'Provide CERAM data to assess climate-related risks and exposures.',
    }
  ];

  const dialogData =
    userType === 1 ? [...user2Data, ...user3Data] :
    userType === 2 ? user2Data :
    userType === 3 ? user3Data :
    [];

  // Number of cards to show at once
  const cardsPerPage = 3;

  // Calculate total slides
  const totalSlides = Math.ceil(dialogData.length / cardsPerPage);

  // Get dialogs for current slide
  const currentDialogs = dialogData.slice(slideIndex * cardsPerPage, (slideIndex + 1) * cardsPerPage);

  // Handle dot click
  const handleDotClick = (index) => {
    setSlideIndex(index);
  };

  const imageMapFront = {
  'Ten-day Forecast': tenday,
  'Seasonal Forecast': seasonal1,
  'Historical Forecast': histo1,
  'CERAM': ceram1,
};

const imageMapBack = {
  'Ten-day Forecast': tenday2,
  'Seasonal Forecast': seasonal2,
  'Historical Forecast': histo2,
  'CERAM': ceram2,
};


  return (
    <>
      {/* Upload Box */}
      <Box
        sx={{
          mt: '1%',
          flex: open ? '0 0 50%' : '0 0 60%',
          borderRadius: '20px',
          p: 2,
          minHeight: 200,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Box
          onClick={() => setActiveDialog('main')}
          sx={{
            width: '100%',
            height: 235,
            backgroundImage: weatherMode ? `url(${items1wm})` : `url(${items1})`,
            backgroundSize: open ? '100%' : '70%',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center center',
            cursor: 'pointer',
            mt: -2,
            transition: 'background-image 0.3s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '&:hover': {
              backgroundImage: weatherMode ? `url(${items2wm})` : `url(${items2})`,
            },
          }}
        >
        </Box>

        <Typography
          variant="body1"
          onClick={() => setActiveDialog('main')}
          sx={{
            mt: 1,
            fontWeight: 500,
            fontSize: 20,
            lineHeight: 1,
            cursor: 'pointer',
            color: weatherMode ? '#3d6272' : '#0b70d2',
          }}
        >
          Click to upload files
        </Typography>
        <Typography
          variant="body2"
          onClick={() => setActiveDialog('main')}
          sx={{ color: '#55697e', cursor: 'pointer', fontSize: 10 }}
        >
          <b>Accepted file types:</b> TIFF, XLSX, CSV, ASC
        </Typography>
      </Box>

      {/* Main Dialog */}
      <Fade in={activeDialog === 'main'}>
        <Backdrop
          open={activeDialog === 'main'}
          onClick={handleClose}
          sx={{
            zIndex: 1300,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
          }}
        >
          <Slide direction="up" in={activeDialog === 'main'} mountOnEnter unmountOnExit timeout={300}>
            <Box
              onClick={(e) => e.stopPropagation()}
              sx={{
                display: 'flex',
                gap: 2,
                p: 2,
                flexWrap: 'nowrap',
                justifyContent: 'center',
                alignItems: 'flex-start',
                width: '100%',
                maxWidth: cardsPerPage * 320, // width of visible cards + gaps
                overflow: 'hidden',
                position: 'relative',
                flexDirection: 'column',
              }}
            >
              {/* Cards Container */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  transform: `translateX(-${slideIndex * (320 + 16)}px)`, // card width + gap for sliding
                  transition: 'transform 0.4s ease',
                  width: dialogData.length * 320 + (dialogData.length - 1) * 16,
                }}
              >
                {dialogData.map((item, idx) => (
                  <Box
                    key={idx}
                    className="card-hover-wrapper"
                    sx={{
                      position: 'relative',
                      width: 300,
                      height: 350,
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',

                      '&:hover .flip-image': {
                        transform: 'rotateY(180deg)',
                      },
                      '&:hover .circle': {
                        backgroundColor: '#fff',
                      },
                      '&:hover .page-curl-img': {
                        opacity: 1,
                        transform: 'scale(1) translate(0, 0)',
                      },
                      '&:hover .title span': {
                        backgroundSize: '100% 2px',
                      },
                      '&:hover .text': {
                        color: '#fff',
                        transform: 'translateY(-30%)',
                      },
                      '&:hover .button': {
                        backgroundColor: '#fff',
                        color: '#1976d2',
                        transform: 'translateY(-30%)',
                      },
                      '&:hover .dialog-box': {
                        clipPath: 'polygon(0 0, 100% 0, 100% 77%, 80% 100%, 0 100%)',
                        backgroundColor: '#1976d2',
                      },
                    }}
                  >
                    {/* Circle */}
                    <Box
                      className="circle"
                      sx={{
                        width: 190,
                        height: 190,
                        borderRadius: '50%',
                        backgroundColor: '#1976d2',
                        position: 'absolute',
                        top: -10,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 3,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden',
                        transition: 'background-color 0.4s ease',
                      }}
                    >
                      <Box
                        className="flip-image"
                        sx={{
                          width: '70%',
                          height: '70%',
                          transformStyle: 'preserve-3d',
                          transition: 'transform 0.6s',
                          position: 'relative',
                        }}
                      >
                        {/* Front */}
                        <Box
                          component="img"
                            src={imageMapFront[item.title] || tenday}
                          alt="front"
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            backfaceVisibility: 'hidden',
                          }}
                        />
                        {/* Back */}
                        <Box
                          component="img"
                          src={imageMapBack[item.title] || tenday2}
                          alt="back"
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            transform: 'rotateY(180deg)',
                            backfaceVisibility: 'hidden',
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Dialog box */}
                    <Box
                      className="dialog-box"
                      onClick={() => setActiveDialog(item.title)}
                      sx={{
                        mt: 10,
                        width: '100%',
                        height: 400,
                        bgcolor: weatherMode ? '#eaf4fd' : '#fff',
                        borderRadius: '20px',
                        p: 2,
                        pt: 10,
                        boxShadow: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 100% 100%, 0 100%)',
                        transition: 'clip-path 0.37s ease-in-out, background-color 0.4s ease-in-out',
                        willChange: 'clip-path',

                        '.page-curl-img': {
                          opacity: 1,
                          transform: 'scale(0.9) translate(55px, 55px)',
                          transition: 'opacity 0.5s ease, transform 0.5s ease',
                        },
                      }}
                    >
                      {/* Title */}
                      <Typography
                        variant="h6"
                        className="title text"
                        sx={{
                          mb: 1,
                          lineHeight: 1.2,
                          textAlign: 'center',
                          mt: 2,
                          transition: 'transform 0.4s ease',
                          fontSize: 18,
                          fontWeight: 600
                        }}
                      >
                        {item.title.split('\n').map((line, i) => (
                          <Box
                            component="span"
                            key={i}
                            sx={{
                              display: 'inline-block',
                              position: 'relative',
                              backgroundImage: 'linear-gradient(currentColor, currentColor)',
                              backgroundSize: '0% 2px',
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: '0 100%',
                              transition: 'background-size 0.5s ease-out',
                            }}
                          >
                            {line}
                            <br />
                          </Box>
                        ))}
                      </Typography>

                      {/* Description */}
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        className="text"
                        sx={{ textAlign: 'center', px: 2, transition: 'transform 0.4s ease', lineHeight: 1.2, fontSize: 14 }}
                      >
                        {item.description}
                      </Typography>

                      {/* Button */}
                      <Button
                        variant="contained"
                        className="button"
                        sx={{
                          mt: 3,
                          width: '150px',
                          color: '#fff',
                          backgroundColor: '#1976d2',
                          alignSelf: 'center',
                          borderRadius: '20px',
                          boxShadow: 'none',
                          transition: 'transform 0.4s ease',
                        }}
                      >
                        Select
                      </Button>

                      {/* Page curl image */}
                      <Box
                        className="page-curl-img"
                        component="img"
                        src={pageCurl}
                        alt="page curl"
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: 60,
                          height: 60,
                          pointerEvents: 'none',
                          zIndex: 2,
                          filter: 'drop-shadow(-2px -2px 4px rgba(0, 0, 0, 0.2))',
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>

              {/* Dots navigation */}
              {dialogData.length > cardsPerPage && (
                <Box
                  sx={{
                    mt: 2,
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 1,
                  }}
                >
                  {[...Array(totalSlides)].map((_, idx) => (
                    <Box
                      key={idx}
                      onClick={() => handleDotClick(idx)}
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: idx === slideIndex ? '#1976d2' : '#ccc',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s ease',
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Slide>
        </Backdrop>
      </Fade>

      {/* Individual Dialogs for Each Forecast Type */}
      {dialogData.map((item) => {
        if (item.title === 'Ten-day Forecast') {
          return (
            <TenDayForecastDialog
              key={item.title}
              open={activeDialog === 'Ten-day Forecast'}
              onClose={handleClose}
              weatherMode={weatherMode}
            />
          );
        }

          if (item.title === 'Seasonal Forecast') {
          return (
            <SeasonalDialog
              key={item.title}
              open={activeDialog === 'Seasonal Forecast'}
              onClose={handleClose}
              weatherMode={weatherMode}
            />
          );
        }

        if (item.title === 'CERAM') {
          return (
            <ceramDialog
              key={item.title}
              open={activeDialog === 'CERAM'}
              onClose={handleClose}
              weatherMode={weatherMode}
            />
          );
        }

        return (
          <Fade in={activeDialog === item.title} key={item.title}>
            <Backdrop
              open={activeDialog === item.title}
              onClick={handleClose}
              sx={{
                zIndex: 1300,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
              }}
            >
              <Slide direction="up" in={activeDialog === item.title} mountOnEnter unmountOnExit timeout={300}>
                <Box
                  onClick={(e) => e.stopPropagation()}
                  sx={{
                    width: 500,
                    p: 4,
                    borderRadius: '20px',
                    bgcolor: weatherMode ? '#eaf4fd' : '#fff',
                    textAlign: 'center',
                    color: weatherMode ? '#1976d2' : 'black',
                  }}
                >
                  <Typography variant="h5" gutterBottom sx={{mb: 2, fontSize: 20}}>
                    <b>{item.title}</b>
                  </Typography>
                  <img src={noMatch} alt="No Match" style={{ width: "100%", maxWidth: 150, margin: "0 auto", display: "block" }} />
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    Apologies, this part is not available yet.
                  </Typography>
                  <Button   size="md" variant="solid" onClick={handleClose}>
                    Close
                  </Button>
                </Box>
              </Slide>
            </Backdrop>
          </Fade>
        );
      })}
      <TenDayForecastDialog open={activeDialog === 'Ten-day Forecast'} onClose={handleClose} />
<SeasonalDialog open={activeDialog === 'Seasonal Forecast'} onClose={handleClose} />
<CeramDialog open={activeDialog === 'CERAM'} onClose={handleClose} />  {/* <-- ADD THIS */}

    </>
  );
};

export default UploadBox;
