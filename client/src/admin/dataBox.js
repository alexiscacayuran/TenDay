// UploadFile.js
import React, { useState, useEffect } from 'react';
import { Box, Typography, Stack, Avatar, Tooltip } from '@mui/joy';
import InsertInvitationIcon from '@mui/icons-material/InsertInvitation';
import InfoOutlineIcon from '@mui/icons-material/InfoOutlined';
import { AccessAlarm, PictureAsPdf } from '@mui/icons-material';
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';
import UploadBox from './uploadFile';

const DataBox = ({ weatherMode, loading, validDate, userType, open }) => {
    //Schedule Date
      const [remainingSeconds, setRemainingSeconds] = useState(null);
      const [remainingStatus, setRemainingStatus] = useState('');
      const [remainingLoading, setRemainingLoading] = useState(true);
    
      useEffect(() => {
        setRemainingLoading(true);
        fetch('/api/checkValid')
          .then((res) => res.json())
          .then((data) => {
            const seconds = parseRemainingTime(data.remaining_time);
            setRemainingSeconds(seconds);
            setRemainingStatus(data.status);
            setRemainingLoading(false);
          })
          .catch(() => {
            setRemainingSeconds(-1);
            setRemainingStatus('Error fetching data');
            setRemainingLoading(false);
          });
      }, []);
    
      useEffect(() => {
        if (remainingSeconds > 0) {
          const timer = setInterval(() => {
            setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
          }, 1000);
          return () => clearInterval(timer);
        }
      }, [remainingSeconds]);
    
      function formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}h ${m}m ${s}s`;
      }
    
      function parseRemainingTime(timeStr) {
        const hMatch = timeStr.match(/(\d+)h/);
        const mMatch = timeStr.match(/(\d+)m/);
        const sMatch = timeStr.match(/(\d+)s/);
    
        const h = hMatch ? parseInt(hMatch[1]) : 0;
        const m = mMatch ? parseInt(mMatch[1]) : 0;
        const s = sMatch ? parseInt(sMatch[1]) : 0;
    
        return h * 3600 + m * 60 + s;
      }
  return (
<Box
  sx={{
    flex: { xs: '100%', md: '50%' },  // Parent box takes 50% on medium screens and above
    backgroundColor: weatherMode ? '#eaf4fd' : '#fff',
    borderRadius: '20px',
    p: 2,
    minHeight: 200,                   // Ensure the minimum height is defined
    display: 'flex',                  // Enable flex layout
    justifyContent: 'space-between',  // Space between the Left and Right boxes
  }}
>
  {/* Left Box - 60% width */}

<UploadBox weatherMode={weatherMode} userType={userType} open={open}/>

  {/* Right Box - 40% width */}
  <Box
    sx={{
      flex: '0 0 40%',                 // 40% width for the right box
      borderRadius: '20px',
      minHeight: 200,
      display: 'flex',                 // Enable flex layout for vertical stacking
      flexDirection: 'column',         // Stack the child boxes vertically
    }}
  >
    {/* Box 1 */}
<Box
  sx={{
    flex: 1,
    background: weatherMode ? 'linear-gradient(305deg, transparent, #cedff0)' : 'linear-gradient(-55deg, #e3f2fd, transparent)',
    borderRadius: '20px',
    borderBottom: '3px',
    borderColor: '#e3f2fd',
    p: 2,
    mb: 1,
    maxWidth: 300,
    transition: '0.3s ease-in-out',
    "&:hover": {background: weatherMode ? '#cedff0' : '#e3f2fd'}

  }}
>
  <Stack direction="row" spacing={2} alignItems="center">
    <Avatar sx={{ bgcolor: weatherMode ? '#1a497f' : '#e3f2fd', width: 50, height: 50 }}>
      <InsertInvitationIcon sx={{ color: weatherMode ? '#eaf4fd' : '#42a5f5', fontSize: '1.8rem' }} />
    </Avatar>

           <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle2" backgroundColor="#c0ddf4" sx={{ mb: 0.5, padding: 0.1, fontSize: 13,       
          px: 1, // horizontal padding for spacing
      py: 0.2, // vertical padding
      borderRadius: '20px',
      color: weatherMode ? '#1a497f' : '#5d96c3',
      display: 'inline-block', fontWeight: 500 }}>
        &nbsp;&nbsp;Issuance Date&nbsp;&nbsp;
      </Typography>

      {loading ? (
        <Typography variant="subtitle1" color="text.primary" sx={{ fontSize: '18', fontWeight: 500, color: '#55697e' }}>
          Loading...
        </Typography>
      ) : validDate.error ? (
        <Typography
          variant="subtitle1"
          sx={{ fontSize: 16, fontWeight: 500, color: '#55697e' }}
        >
          {validDate.formattedDate}
        </Typography>
      ) : (
        <>
          <Typography variant="subtitle1" color="text.primary" sx={{ fontSize: '1.5rem', lineHeight: 1, fontWeight: 500, color:'#55697e', fontSize: 19 }}>
            {validDate.time}
          </Typography>
          <Typography variant="subtitle2" color="text.primary" sx={{ fontSize: '0.8rem', lineHeight: 1, color:'#55697e', fontSize: 11 }}>
            <i>&nbsp;{validDate.formattedDate}</i>
          </Typography>
        </>
      )}
    </Box>

<Tooltip
  variant="plain"
  color="neutral"
  arrow
  placement="top"
  title={
    <Box
      sx={{
        backgroundColor: '#fff',
        p: 1,
        borderRadius: 'sm',
        boxShadow: 'none',
        maxWidth: 220,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Box
          sx={{
            bgcolor: '#f0f0f0',
            borderRadius: '50%',
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <InsertInvitationIcon sx={{ color: '#888', fontSize: 16 }} />
        </Box>
        <Typography level="body-sm" sx={{ fontWeight: 500, color: '#444' }}>
          Issuance Date
        </Typography>
      </Stack>
      <Typography level="body-xs" sx={{ color: '#666', lineHeight: 1.4, textAlign: 'justify' }}>
        This shows the latest issuance date, indicating when the data was last updated.
      </Typography>
    </Box>
  }
>
  <InfoOutlineIcon
    sx={{
      color: weatherMode ? '#1a497f' : '#42a5f5',
      cursor: 'pointer',
      fontSize: 20,
    }}
  />
</Tooltip>

  </Stack>
</Box>


    {/* Box 2 */}
 <Box
      sx={{
        flex: 1,
        background: weatherMode ? 'linear-gradient(305deg, transparent, #cedff0)' :
        !remainingLoading &&
        (remainingSeconds <= 0 || remainingStatus.toLowerCase() === 'done')
            ? 'linear-gradient(-55deg, #ffebee, transparent)'
            : 'linear-gradient(-55deg, #e8f5e9, transparent)',
        borderRadius: '20px',
        p: 2,
        mb: 1,
        maxWidth: 300,
        transition: '0.3s ease-in-out',
        "&:hover": {        background:
              weatherMode ? '#cedff0' :
              !remainingLoading && (remainingSeconds <= 0 || remainingStatus.toLowerCase() === 'done')
                ? '#ffebee'
                : '#e8f5e9',}
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar sx={{ bgcolor: weatherMode ? '#1a497f' : !remainingLoading && (remainingSeconds <= 0 || remainingStatus.toLowerCase() === 'done')
                ? '#ffebee'
                : '#e8f5e9', width: 50, height: 50 }}>
          <AccessAlarmIcon sx={{ color: weatherMode ? '#eaf4fd' : !remainingLoading && (remainingSeconds <= 0 || remainingStatus.toLowerCase() === 'done')
                ? '#e47070'
                : '#66bb6a', fontSize: '1.8rem' }} />
        </Avatar>

        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5, padding: 0.1, fontSize: 13,  
          px: 1,
      py: 0.2, 
      borderRadius: '20px',
      display: 'inline-block', fontWeight: 500,
      backgroundColor: weatherMode ? '#cedff0' : !remainingLoading &&
        (remainingSeconds <= 0 || remainingStatus.toLowerCase() === 'done')
            ? '#ffbdbd'
            : '#c8f0c9',
      color: weatherMode ? '#1a497f' : !remainingLoading &&
        (remainingSeconds <= 0 || remainingStatus.toLowerCase() === 'done')
            ? '#e47070'
            : '#5aa85e',
      }}>
            &nbsp;&nbsp;Schedule Date&nbsp;&nbsp;
          </Typography>

          {remainingLoading ? (
            <Typography variant="subtitle1" color="text.primary" sx={{ fontSize: '18', fontWeight: 500, color: '#55697e' }}>
              Loading...
            </Typography>
          ) : remainingSeconds < 0 ? (
            <Typography variant="subtitle1" sx={{ fontSize: '18', fontWeight: 500, color: '#55697e' }}>
              Error fetching time
            </Typography>
          ) : (
            <>
              <Typography
                variant="subtitle1"
                sx={{ fontSize: '1.3rem', lineHeight: 1, fontWeight: 500, color: '#55697e', fontSize: 19 }}
              >
                {formatTime(remainingSeconds)}
              </Typography>
              <Typography
                variant="subtitle2"
                sx={{ fontSize: '0.8rem', lineHeight: 1, color: '#55697e', fontSize: 11 }}
              >
                <i>{remainingStatus}</i>
              </Typography>
            </>
          )}
        </Box>

        <Tooltip
          variant="plain"
          color="neutral"
          arrow
          placement="top"
          title={
            <Box
              sx={{
                backgroundColor: '#fff',
                p: 1,
                borderRadius: 'sm',
                boxShadow: 'none',
                maxWidth: 220,
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Box
                  sx={{
                    bgcolor: '#f0f0f0',
                    borderRadius: '50%',
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AccessAlarmIcon sx={{ color: '#888', fontSize: 16 }} />
                </Box>
                <Typography level="body-sm" sx={{ fontWeight: 500, color: '#444' }}>
                  Schedule Date
                </Typography>
              </Stack>
              <Typography level="body-xs" sx={{ color: '#666', lineHeight: 1.4, textAlign: 'justify' }}>
                This box shows the remaining time to upload data and stay on schedule, along with a status update to keep you informed
              </Typography>
            </Box>
          }
        >
          <InfoOutlineIcon sx={{ cursor: 'pointer', fontSize: 22,      
          color: weatherMode ? '#1a497f' : !remainingLoading &&
        (remainingSeconds <= 0 || remainingStatus.toLowerCase() === 'done')
            ? '#e47070'
            : '#5aa85e', }} />
        </Tooltip>

      </Stack>
    </Box>

    {/* Box 3 */}
 <Box
      sx={{
        flex: 1,
        background: weatherMode ? 'linear-gradient(305deg, transparent, #cedff0)' : 'linear-gradient(-55deg, #fffde7, transparent)',
        borderRadius: '20px',
        p: 2,
        mb: 1,
        maxWidth: 300,
        transition: '0.3s ease-in-out',
        cursor: 'pointer',
        "&:hover": {background: weatherMode ? '#cedff0' : '#fefde8'}
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar sx={{ bgcolor: weatherMode ? '#1a497f' : '#fefde8', width: 50, height: 50, color: weatherMode ? '#eaf4fd' : '#fff' }}>
          <PictureAsPdf sx={{ fontSize: '1.8rem', color: weatherMode ? '#eaf4fd' : '#ffd552', }} />
        </Avatar>

        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5, padding: 0.1, fontSize: 13, 
          px: 1, // horizontal padding for spacing
      py: 0.2, // vertical padding
      borderRadius: '20px',
      color: weatherMode ? "#1a497f" : "#f4c638",
      backgroundColor: weatherMode ? "#cedff0" : "#fffac4",
      transition: '0.2s ease-in-out',
      display: 'inline-block', fontWeight: 500 }}>
            &nbsp;&nbsp;User Manual&nbsp;&nbsp;
          </Typography>

              <Typography
                variant="subtitle1"
                sx={{ fontSize: '1.3rem', lineHeight: 1, fontWeight: 500, color: '#55697e', fontSize: 19  }}
              >
                AdminUM.pdf
              </Typography>
              <Typography
                variant="subtitle2"
                sx={{ fontSize: '0.8rem', lineHeight: 1, color: '#55697e', fontSize: 11 }}
              >
                <i>Click to download.</i>
              </Typography>
        </Box>

        <Tooltip
          variant="plain"
          color="neutral"
          arrow
          placement="top"
          title={
            <Box
              sx={{
                backgroundColor: '#fff',
                p: 1,
                borderRadius: 'sm',
                boxShadow: 'none',
                maxWidth: 220,
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Box
                  sx={{
                    bgcolor: '#f0f0f0',
                    borderRadius: '50%',
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PictureAsPdf sx={{ color: '#888', fontSize: 16 }} />
                </Box>
                <Typography level="body-sm" sx={{ fontWeight: 500, color: '#444' }}>
                  User Manual
                </Typography>
              </Stack>
              <Typography level="body-xs" sx={{ color: '#666', lineHeight: 1.4, textAlign: 'justify' }}>
                This box provides guidance on how to navigate the system — click it to access the user manual and explore step-by-step instructions.This shows the latest issuance date, indicating when the data was last updated.
              </Typography>
            </Box>
          }
        >
          <InfoOutlineIcon
            sx={{
              color: weatherMode ? '#1a497f' : '#f4c638',
              cursor: 'pointer',
              fontSize: 20,
            }}
          />
        </Tooltip>

      </Stack>
    </Box>
  </Box>
</Box>
  );
};

export default DataBox;
