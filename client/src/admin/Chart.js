import React, { useState, useMemo } from 'react';
import { Box } from '@mui/joy';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Tooltip as RechartsTooltip, Cell,
  BarChart, Bar, XAxis, YAxis,
} from 'recharts';
import { Chart as GoogleChart } from "react-google-charts";
import PieChartIcon from '@mui/icons-material/PieChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded';
import ArrowDropDownRoundedIcon from '@mui/icons-material/ArrowDropDownRounded';
import ArrowLeftRoundedIcon from '@mui/icons-material/ArrowLeftRounded';
import ArrowRightRoundedIcon from '@mui/icons-material/ArrowRightRounded';
import noData from '../assets/img/noData.webp';

import { CssVarsProvider } from "@mui/joy/styles";
import theme from "../theme"


const generateVibrantPastelColors = (count, weatherMode = false) => {
  if (!weatherMode) {
    return Array.from({ length: count }, (_, i) => {
      const hue = (i * 130) % 360;
      return `hsl(${hue}, 70%, 60%)`;
    });
  } else {
    return Array.from({ length: count }, () => {
      const baseHue = 210 + Math.floor(Math.random() * 20); // 210-230 (blue to blue-gray)
      const isLight = Math.random() > 0.5; // Randomly decide if light or dark
      const saturation = 40 + Math.floor(Math.random() * 30); // 40-70%
      const lightness = isLight
        ? 55 + Math.floor(Math.random() * 20) // 55-75% for light blue
        : 20 + Math.floor(Math.random() * 20); // 20-40% for dark blue
      return `hsl(${baseHue}, ${saturation}%, ${lightness}%)`;
    });
  }
};

const Chart = ({ title, data, isPie, setIsPie, open, weatherMode }) => {

  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState('daily');
  const [legendPage, setLegendPage] = useState(0);

const COLORS = useMemo(() => generateVibrantPastelColors(100, weatherMode), [weatherMode]);

const nameColorMap = useMemo(() => {
  const uniqueNames = Array.from(new Set(data.map(item => item.organization || item.api_name || item.city || item.country)));
  const colors = generateVibrantPastelColors(uniqueNames.length, weatherMode);
  return Object.fromEntries(uniqueNames.map((name, index) => [name, colors[index % colors.length]]));
}, [data, weatherMode]);


  const itemsPerPage = 5;

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { value, fill, payload: data } = payload[0];
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '6px 10px',
        background: '#fff',
        borderRadius: '6px',
        fontFamily: 'Commissioner',
        fontSize: '13px',
        color: '#333'
      }}>
        <div style={{
          padding: 10,
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: fill || '#ECECEC',
          marginRight: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#727979',
          fontSize: 10,
          fontWeight: 600
        }}>
          {value}
        </div>
        <span>{data.name}</span>
      </div>
    );
  }
  return null;
};

  const filteredData = useMemo(() => {
    const key = {
      daily: 'daily_count',
      weekly: 'weekly_count',
      monthly: 'monthly_count',
      annually: 'all_time_count',
    }[timeframe];

const getLabel = (item) => {
  return item.organization?.trim() || item.api_name?.trim() || item.city?.trim() || item.country?.trim() || 'Unknown';
};


    return data.map(item => ({

      name: getLabel(item),
      value: parseInt(item[key] || 0, 10)
    }));
  }, [data, timeframe]);

  const hasNonZeroData = filteredData.some(item => item.value > 0);
  const chartData = filteredData.filter(item => item.value > 0);
  const maxPage = Math.max(0, Math.ceil(filteredData.length / itemsPerPage) - 1);
  const paginatedLegend = filteredData.slice(legendPage * itemsPerPage, (legendPage + 1) * itemsPerPage);

  return (
    <CssVarsProvider theme={theme}>
    <Box sx={{ flex: 1, backgroundColor: weatherMode ? '#eaf4fd' : 'white', transition: 'background-color 0.3s ease', borderRadius: '20px', p: 2, minHeight: 200, mt: { xs: open ? 27.5 : 27, md: 0 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', cursor: 'pointer' }} onClick={() => navigate('/admin/token')}>
          <p style={{ margin: 0, fontFamily: 'Commissioner', fontSize: 23, fontWeight: 400, color: '#55697e' }}>{title}</p>
          <KeyboardArrowRightRoundedIcon sx={{ color: weatherMode ? '#11457a' : '#0b6bcb', fontSize: 35, transition: '0.2s', '&:hover': { color: weatherMode ? '#062340' : '#074d93', marginLeft: 1 } }} />
        </Box>
        <Box>
          <PieChartIcon onClick={() => setIsPie(true)} sx={{
            cursor: 'pointer',
            backgroundColor: isPie ? '#0b6bcb' : (weatherMode ? '#cedff0' :'#e3effb'),
            color: isPie ? 'white' : '#12467b',
            padding: 0.5,
            borderRadius: '5px',
            fontSize: 28,
            mr: 0.5,
            '&:hover': { backgroundColor: isPie ? '#074d93' : '#c3d5e8' }
          }} />
          <BarChartIcon onClick={() => setIsPie(false)} sx={{
            cursor: 'pointer',
            backgroundColor: !isPie ? '#0b6bcb' : (weatherMode ? '#cedff0' :'#e3effb'),
            color: !isPie ? 'white' : '#12467b',
            padding: 0.5,
            borderRadius: '5px',
            fontSize: 28,
            '&:hover': { backgroundColor: !isPie ? '#074d93' : '#c3d5e8' }
          }} />
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{
        display: 'flex',
        flexDirection: { sm: 'column', md: open ? 'column' : 'row' },
        alignItems: { sm: 'center', md: open ? 'center' : 'flex-start' },
        justifyContent: { sm: 'center', md: open ? 'center' : 'flex-start' }
      }}>
        {/* Chart or No Data */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {!filteredData.length || !hasNonZeroData ? (
            <Box sx={{ textAlign: 'center', marginTop: 3, marginBottom: 3.5 }}>
              <img src={noData} alt="No Data" width="150" />
              <p style={{ fontFamily: 'Commissioner', color: '#0b6bcb', fontSize: 15, fontWeight: 650, marginTop: 10 }}>No Data Found</p>
              <p style={{ fontFamily: 'Commissioner', color: '#55697e', fontSize: 12 }}>There is no data to show you right now</p>
            </Box>
          ) : (
            isPie ? (
              <PieChart width={200} height={250}>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={60}
                  dataKey="value"
                  nameKey="name"
                >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={nameColorMap[entry.name]} />
                ))}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
              </PieChart>
            ) : (
              <BarChart 
                width={200} 
                height={250} 
                data={chartData}
                barCategoryGap={0} 
                barGap={0}         
              >
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={false} />
                <YAxis hide />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar dataKey="value">
                  {chartData.map((_, index) => (
                    <Cell key={`bar-cell-${index}`} fill={nameColorMap[chartData[index].name]} />
                  ))}
                </Bar>
              </BarChart>
            )
          )}
        </Box>

        {/* Dropdown & Legend */}
        <Box sx={{
          ml: 2,
          mt: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          overflow: 'hidden',
          maxHeight: { sm: 500, md: open ? 0 : 500 },
          opacity: { sm: 1, md: open ? 0 : 1 },
          pointerEvents: { sm: 'auto', md: open ? 'none' : 'auto' },
          transition: 'max-height 0.4s ease, opacity 0.4s ease',
        }}>
  <div style={{ position: 'relative', display: 'inline-block' }}>
      <select
        value={timeframe}
        onChange={(e) => {
          setTimeframe(e.target.value);
          setLegendPage(0);
        }}
        style={{
          padding: '5px 35px 5px 15px',
          fontFamily: 'Commissioner',
          borderRadius: '10px',
          fontSize: '14px',
          fontWeight: 450,
          marginBottom: '10px',
          backgroundColor: weatherMode ? '#cedff0' : '#e3effb',
          color: '#12467b',
          border: 'none',
          outline: 'none',
          appearance: 'none', 
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          textAlign: 'center',
          cursor: 'pointer',
        }}
      >
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
        <option value="annually">All Time</option>
      </select>
      <ArrowDropDownRoundedIcon
        style={{
          fontSize: 30,
          position: 'absolute',
          right: 1,
          top: '30%',
          transform: 'translateY(-50%)',
          color: '#12467b',
          animation: 'arrowBounce 0.8s infinite ease-in-out',
          pointerEvents: 'none', // avoid interfering with click
        }}
      />
      <style>
        {`
          @keyframes arrowBounce {
            0% { transform: translateY(-50%) translateY(0); }
            50% { transform: translateY(-50%) translateY(5px); }
            100% { transform: translateY(-50%) translateY(0); }
          }
        `}
      </style>
    </div>

          {hasNonZeroData && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {paginatedLegend.map((entry, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', fontFamily: 'Commissioner', fontSize: 13 }}>
                  <Box sx={{
                    width: 12,
                    height: 12,
                    backgroundColor: COLORS[(legendPage * itemsPerPage + index) % COLORS.length],
                    borderRadius: '50%',
                    mr: 1
                  }} />
                  {entry.name}
                </Box>
              ))}
              {filteredData.length > itemsPerPage && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end', 
                    position: 'relative', 
                    width: '50%', 
                    ml: 6
                  }}
                >
                  <button
                    onClick={() => setLegendPage((p) => Math.max(p - 1, 0))}
                    disabled={legendPage === 0}
                    style={{
                      background: legendPage === 0 ? '#fafafa' : '#e3effb',
                      border: 'none',
                      borderRadius: '50%',
                      cursor: legendPage === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: legendPage === 0 ? '#ccc' : '#12467b',
                      padding: 0,
                      width: '18px',
                      height: '18px',
                      marginRight: 2,
                    }}
                  >
                    <ArrowLeftRoundedIcon sx={{ fontSize: '24px' }} />
                  </button>
                  <button
                    onClick={() => setLegendPage((p) => Math.min(p + 1, maxPage))}
                    disabled={legendPage >= maxPage}
                    style={{
                      background: legendPage >= maxPage ? '#fafafa' : '#e3effb',
                      border: 'none',
                      borderRadius: '50%',
                      cursor: legendPage >= maxPage ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: legendPage >= maxPage ? '#ccc' : '#12467b',
                      padding: 0,
                      width: '18px',
                      height: '18px',
                      marginLeft: 2,
                    }}
                  >
                    <ArrowRightRoundedIcon sx={{ fontSize: '24px' }} />
                  </button>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
    </CssVarsProvider>
  );
};

export default Chart;
