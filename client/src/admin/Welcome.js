import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Card, Skeleton } from '@mui/joy';
import { useNavigate } from 'react-router-dom';
import sunImage from "../assets/img/sun.webp";
import cloudImage from "../assets/img/cloud.webp";
import lightningImage from "../assets/img/lightning2.webp";
import PersonalVideoIcon from '@mui/icons-material/PersonalVideo';
import TabletMacIcon from '@mui/icons-material/TabletMac';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import DevicesIcon from '@mui/icons-material/Devices';

const cardColors = ["#e3f2fd", "#e8f5e9", "#ffebee", "#fffde7"];
const cardText = ["#42a5f5", "#66bb6a", "#e47070", "#ffd552"];
const parText = "#55697e";
const headText = "#4994da";

const Welcome = ({ weatherMode, loading, userName, stats, fade, imageSrc }) => {
  const navigate = useNavigate();
  const [animatedValues, setAnimatedValues] = useState(stats.map(() => 0));  // Start with 0
  const [animationComplete, setAnimationComplete] = useState(false);


    const [platformIndex, setPlatformIndex] = useState(0);

  const platformOrder = ["All Devices", "Desktop", "Tablet", "Mobile"];
  const currentPlatform = platformOrder[platformIndex];

  const handlePlatformClick = () => {
    const nextIndex = (platformIndex + 1) % platformOrder.length;
    setPlatformIndex(nextIndex);
  };

  // Start animation when loading is done
  useEffect(() => {
    if (!loading && stats.length && !animationComplete) {
      const duration = 1000; // animation duration in ms
      const frameRate = 30; // frames per second
      const totalFrames = Math.round((duration / 1000) * frameRate);

      stats.forEach((stat, index) => {
        let frame = 0;
        const interval = setInterval(() => {
          frame++;
          const progress = frame / totalFrames;
          const current = Math.round(stat.value * progress);
          
          // Update state progressively
          setAnimatedValues(prev => {
            const updated = [...prev];
            updated[index] = current;
            return updated;
          });

          if (frame === totalFrames) {
            clearInterval(interval);
            // Set final value after animation ends
            setAnimatedValues(prev => {
              const updated = [...prev];
              updated[index] = stat.value;
              return updated;
            });
            if (index === stats.length - 1) {
              setAnimationComplete(true);  // Animation complete
            }
          }
        }, duration / totalFrames);
      });
    }
  }, [loading, stats, animationComplete]);


  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'column', md: 'row' },
        gap: '1%',
        height: '250px',
      }}
    >
      {/* Welcome Left Box */}
      <Box sx={{ flex: 1 }}>
        <Card
          sx={{
            height: '100%',
            padding: 3,
            background: weatherMode ? '#eaf4fd' : 'white',
            border: 'none',
            borderRadius: "20px",
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            position: "relative",
            overflow: "hidden",
            transition: 'background-color 0.5s ease',
          }}
        >
          {/* Image Section */}
<Box sx={{ position: "relative", height: "200px", overflow: "hidden" }}>
  {/* Background Animations */}
  {!weatherMode ? (
    <>
      {/* Sun Image */}
      <img
        src={sunImage}
        alt="Sun"
        style={{
          position: "absolute",
          top: "1px",
          left: "5px",
          width: "60px",
          zIndex: 0,
          opacity: 0.8,
          animation: "rotateSun 25s linear infinite",
          transition: "opacity 0.8s ease-in-out",
        }}
        onContextMenu={(e) => e.preventDefault()}
        draggable={false}
      />

      {/* Moving Clouds */}
      {[...Array(3)].map((_, index) => (
        <img
          key={index}
          src={cloudImage}
          alt={`Cloud ${index + 1}`}
          onContextMenu={(e) => e.preventDefault()}
          draggable={false}
          style={{
            position: "absolute",
            top: `${30 + index * 50}px`,
            left: "-100px",
            width: `${80 + index * 10}px`,
            opacity: 0.99 - index * 0.2,
            zIndex: 0,
            animation: `moveCloud${index % 2 === 0 ? "Right" : "Left"} ${
              15 + index * 3
            }s linear infinite`,
          }}
        />
      ))}
    </>
  ) : (
    <>
      {/* Lightning Bolts */}
      <img
        src={lightningImage}
        alt="Lightning 1"
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          width: "60px",
          opacity: 0,
          zIndex: 0,
          animation: "flashLightning 0.8s infinite alternate",
        }}
        onContextMenu={(e) => e.preventDefault()}
        draggable={false}
      />
      <img
        src={lightningImage}
        alt="Lightning 2"
        style={{
          position: "absolute",
          top: "105px",
          left: "5px",
          width: "70px",
          opacity: 0,
          zIndex: 0,
          animation: "flashLightning 1s infinite alternate",
        }}
        onContextMenu={(e) => e.preventDefault()}
        draggable={false}
      />
      <img
        src={lightningImage}
        alt="Lightning 3"
        style={{
          position: "absolute",
          top: "10px",
          left: "210px",
          width: "80px",
          opacity: 0,
          zIndex: 0,
          animation: "flashLightning 0.6s infinite alternate",
        }}
        onContextMenu={(e) => e.preventDefault()}
        draggable={false}
      />

      {/* Raindrops */}
      {[...Array(50)].map((_, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            top: `${Math.random() * 1}%`,
            left: `${Math.random() * 90}%`,
            width: "1px",
            height: "6px",
            backgroundColor: "#7c9cbc",
            opacity: 0.5,
            zIndex: 0,
            animation: `fallRain ${Math.random() * 1.5 + 0.5}s linear infinite`,
          }}
        />
      ))}
    </>
  )}

  {/* Foreground Image */}
  <img
    src={imageSrc}
    alt="Weather"
    style={{
      height: "200px",
      width: "100%",
      objectFit: "cover",
      opacity: fade ? 1 : 0,
      transition: "opacity 0.5s ease-in-out",
      position: "relative",
      zIndex: 1,
    }}
  />
</Box>

 <style>{`
   @keyframes rotateSun {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes moveCloudRight {
  0% {
    left: -100px;
  }
  100% {
    left: 100%;
  }
}

@keyframes moveCloudLeft {
  0% {
    left: 100%;
  }
  100% {
    left: -100px;
  }
}

@keyframes flashLightning {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 0.9;
  }
}

@keyframes fallRain {
  0% {
    top: -10px;
  }
  100% {
    top: 200px;
  }
}
 `}</style>

          {/* Text Section */}
          <Box sx={{ flex: 1, textAlign: { xs: "center", sm: "left" } }}>
            {loading ? (
              <>
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" />
              </>
            ) : (
              <>
                <Typography sx={{ color: "#FFA500", fontSize: "0.9rem", fontWeight: 600, lineHeight: 1 }}>
                  WELCOME,
                </Typography>
                <Typography sx={{ color: weatherMode ? '#3d6268' : headText, fontWeight: "bold", fontSize: "2rem", lineHeight: 1 }}>
                  {userName.toUpperCase()}
                </Typography>
                <Typography sx={{ color: parText, mt: 1.5 }}>
                  Your dashboard is your command center where you can track progress and stay organized.
                </Typography>
              </>
            )}

            {loading ? (
              <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: "10px", marginTop: "10px" }} />
            ) : (
              <Button variant="soft" sx={{ marginTop: 2, backgroundColor: weatherMode ? "#cedff0" : "", color: weatherMode ? "#3d6268" : "", transition: "0.2s ease-in-out"}}>
                Explore Now!
              </Button>
            )}
          </Box>
        </Card>
      </Box>

      {/* Stat Boxes */}
      <Box
        sx={{
          userSelect: 'none',
          flex: 1,
          display: 'flex',
          flexWrap: 'wrap',
          marginTop: {
            sm: '2%',
            md: 0,
          },
        }}
      >
        {stats.map((stat, index) => {
          const isRightCol = index % 2 === 1;
          const isBottomRow = index >= 2;
          const isCardThree = index === 2;

       const isPlatformCard = stat.isPlatformCard;
const currentPlatform = isPlatformCard ? platformOrder[platformIndex] : null;
const platformValue = isPlatformCard && currentPlatform ? stat.platformValues[currentPlatform] : null;

const iconElement = isPlatformCard ? (
  currentPlatform === "All Devices" ? <DevicesIcon /> :
  currentPlatform === "Desktop" ? <PersonalVideoIcon /> :
  currentPlatform === "Tablet" ? <TabletMacIcon /> :
  currentPlatform === "Mobile" ? <PhoneIphoneIcon /> :
  <DevicesIcon />
) : stat.icon;

          const cardContent = (
            <Card
              sx={{
                backgroundColor: weatherMode ? '#eaf4fd' : 'white',
                borderRadius: "20px",
                border: "none",
                height: "100%",
                boxShadow: "none",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                padding: "16px",
                transition: 'background-color 0.3s ease',
                cursor: isCardThree ? 'pointer' : 'default',
                '&:hover': isCardThree
                  ? {
                      backgroundColor: '#ffebee',
                      '& .hover-text': { color: '#e07978' },
                      '& .hover-icon': { backgroundColor: '#ffebee' }
                    }
                  : {},
              }}
              onClick={() => {
              if (stat.isPlatformCard) {
                handlePlatformClick();
              } else if (index === 2) {
                navigate('/admin/token');
              }
            }}

            >
              {/* Icon box */}
              <Box
                className={isCardThree ? 'hover-icon' : ''}
                sx={{
                  bgcolor: weatherMode ? '#cedff0' : cardColors[index % cardColors.length],
                  width: "60px",
                  height: "60px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: "16px",
                  transition: 'background-color 0.3s ease',
                }}
              >
                {loading ? (
                  <Skeleton variant="circular" width={40} height={40} />
                ) : (
                  React.cloneElement(iconElement, {
                    sx: {
                      height: "50%",
                      width: "50%",
                      color: weatherMode ? '#11457a' : cardText[index % cardText.length],
                    },
                  })
                )}
              </Box>

              {/* Text */}
              <Box sx={{ textAlign: "left", flexGrow: 1 }}>
                {loading ? (
                  <>
                    <Skeleton variant="text" width="50%" />
                    <Skeleton variant="text" width="30%" />
                  </>
                ) : (
                  <>
<Typography
  fontSize="14px"
  className={isCardThree ? 'hover-text' : ''}
  sx={{ lineHeight: 1, color: parText, transition: 'color 0.3s ease' }}
>
{isPlatformCard ? (
  <>
      Platform Visitors{" "}
      <span style={{ fontStyle: "italic", fontSize: "0.7em" }}>
        ({currentPlatform})
      </span>
  </>
) : (
  stat.title
)}
</Typography>

<Typography
  fontSize="40px"
  fontWeight="490"
  className={isCardThree ? 'hover-text' : ''}
  sx={{ lineHeight: 1, color: parText, transition: 'color 0.3s ease' }}
>
  {isPlatformCard
    ? platformValue.toLocaleString()
    : index < 3
    ? (animatedValues[index] ?? 0).toLocaleString()
    : stat.displayValue}
</Typography>

                  </>
                )}
              </Box>
            </Card>
          );

          return (
            <Box
              key={index}
              sx={{
                width: '49%',
                height: '47.2%',
                ml: isRightCol ? '2%' : 0,
                mt: isBottomRow ? '2%' : 0,
              }}
            >
              {cardContent}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default Welcome;
