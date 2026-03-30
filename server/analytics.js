import express from 'express';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import dayjs from 'dayjs';
import fetch from 'node-fetch';
import { redisClient } from './db.js';

const router = express.Router();
const client = new BetaAnalyticsDataClient({
  keyFilename: './tenDayAnalytics.json'
});
const propertyId = 'properties/484898570';
const OPENCAGE_API_KEY = '98018f7808fd4776bfd7c891edba4bb6';

async function generateVisitorLineGraph(dateType, startDate, endDate) {
  const totalDays = dayjs(endDate).diff(dayjs(startDate), 'day') + 1;

  let dimension;
  if (dateType === 'today' || dateType === 'yesterday' || (dateType === 'custom' && totalDays === 1)) {
    dimension = 'dateHour'; // per hour
  } else {
    dimension = 'date'; // per day
  }

  const [report] = await client.runReport({
    property: propertyId,
    dimensions: [{ name: dimension }],
    metrics: [{ name: 'activeUsers' }],
    dateRanges: [{ startDate, endDate }],
    orderBys: [{ dimension: { dimensionName: dimension }, desc: false }]
  });

  const rows = report.rows || [];
  const result = [];

  for (const row of rows) {
    const label = dimension === 'dateHour'
      ? formatHour(row.dimensionValues[0].value)
      : formatDate(row.dimensionValues[0].value);

    result.push({
      time: label,
      activeUsers: Number(row.metricValues[0].value)
    });
  }

  // Trim if too long
  if (result.length > 7) {
    const step = Math.ceil(result.length / 7);
    return result.filter((_, index) => index % step === 0).slice(0, 7);
  }

  return result;
}

function formatHour(dateHourString) {
  const hour = Number(dateHourString.slice(-2));
  const label = `${hour === 0 ? 12 : hour % 12}${hour < 12 ? 'AM' : 'PM'}`;
  return label;
}

function formatDate(dateString) {
  return dayjs(dateString).format('MMM D');
}

function getComparisonRange(dateType, startDate, endDate) {
  const today = dayjs();
  switch (dateType) {
    case 'today': return { startDate: today.subtract(1, 'day').format('YYYY-MM-DD'), endDate: today.subtract(1, 'day').format('YYYY-MM-DD') };
    case 'yesterday': return { startDate: today.subtract(2, 'day').format('YYYY-MM-DD'), endDate: today.subtract(2, 'day').format('YYYY-MM-DD') };
    case 'weekly': return { startDate: today.subtract(14, 'day').startOf('week').format('YYYY-MM-DD'), endDate: today.subtract(7, 'day').endOf('week').format('YYYY-MM-DD') };
    case 'monthly': return { startDate: today.subtract(1, 'month').startOf('month').format('YYYY-MM-DD'), endDate: today.subtract(1, 'month').endOf('month').format('YYYY-MM-DD') };
    case 'yearly': return { startDate: today.subtract(1, 'year').startOf('year').format('YYYY-MM-DD'), endDate: today.subtract(1, 'year').endOf('year').format('YYYY-MM-DD') };
    case 'custom': {
      const s = dayjs(startDate);
      const e = dayjs(endDate);
      const delta = e.diff(s, 'day');
      return {
        startDate: s.subtract(delta + 1, 'day').format('YYYY-MM-DD'),
        endDate: s.subtract(1, 'day').format('YYYY-MM-DD')
      };
    }
    default: return null;
  }
}

function getTrend(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(2));
}

// ✅ Updated to support 3 hours for 'today', else 14 days
async function getLatLng(place, dateType = '') {
  const cacheKey = `geo:${place}`;
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(place)}&key=${OPENCAGE_API_KEY}&limit=1&no_annotations=1`;

    const res = await fetch(url, { timeout: 7000 });
    const data = await res.json();

    if (data?.results?.length) {
      const { lat, lng } = data.results[0].geometry;
      const result = { lat, lng };
      const ttl = dateType === 'today' ? 60 * 60 * 3 : 60 * 60 * 24 * 1; // 3 hrs vs 1 day
      await redisClient.setEx(cacheKey, ttl, JSON.stringify(result));
      return result;
    }
  } catch (err) {
    console.warn(`Failed geocoding "${place}":`, err.message);
  }
  return { lat: null, lng: null };
}

// ✅ Pass dateType to getLatLng
async function getStats(dimension, metricName, labelName, range, includeGeo = false, dateType = '') {
  const [report] = await client.runReport({
    property: propertyId,
    dimensions: [{ name: dimension }],
    metrics: [{ name: metricName }],
    dateRanges: [range],
    orderBys: [{ metric: { metricName }, desc: true }]
  });

  const rows = report.rows || [];
  return await Promise.all(rows.map(async row => {
    const name = row.dimensionValues[0].value;
    const base = { [labelName]: name, [metricName]: Number(row.metricValues[0].value) };
    if (includeGeo) {
      const { lat, lng } = await getLatLng(name, dateType);
      return { ...base, lat, lng };
    }
    return base;
  }));
}

function getWAURange(range) {
  const end = dayjs(range.endDate);
  const start = end.subtract(6, 'day'); // last 7 days
  return {
    startDate: start.format('YYYY-MM-DD'),
    endDate: end.format('YYYY-MM-DD')
  };
}

function getMAURange(range) {
  const end = dayjs(range.endDate);
  const start = end.subtract(29, 'day'); // last 30 days
  return {
    startDate: start.format('YYYY-MM-DD'),
    endDate: end.format('YYYY-MM-DD')
  };
}


router.get('/analytics', async (req, res) => {
  try {
    const { dateType, startDate, endDate } = req.query;
    const cacheKey = `analytics:${dateType || ''}:${startDate || ''}:${endDate || ''}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log('📦 Returning cached analytics data');
      return res.json(JSON.parse(cached));
    }

    const today = dayjs();
    let range = {};
    switch (dateType) {
      case 'today': range = { startDate: today.format('YYYY-MM-DD'), endDate: today.format('YYYY-MM-DD') }; break;
      case 'yesterday': range = { startDate: today.subtract(1, 'day').format('YYYY-MM-DD'), endDate: today.subtract(1, 'day').format('YYYY-MM-DD') }; break;
      case 'weekly': range = { startDate: today.startOf('week').format('YYYY-MM-DD'), endDate: today.endOf('week').format('YYYY-MM-DD') }; break;
      case 'monthly': range = { startDate: today.startOf('month').format('YYYY-MM-DD'), endDate: today.endOf('month').format('YYYY-MM-DD') }; break;
      case 'yearly': range = { startDate: today.startOf('year').format('YYYY-MM-DD'), endDate: today.endOf('year').format('YYYY-MM-DD') }; break;
      case 'custom':
        if (!startDate || !endDate) return res.status(400).json({ error: 'Missing startDate or endDate for custom range.' });
        range = { startDate, endDate };
        break;
      default:
        return res.status(400).json({ error: 'Invalid dateType' });
    }

    const comparisonRange = getComparisonRange(dateType, startDate, endDate);

    function formatComparedLabel(type, prevStart, prevEnd, currStart, currEnd) {
      const isSingleDay = currStart === currEnd;
      if (isSingleDay) {
        return `${prevStart} vs. ${currStart}`;
      } else {
        return `${prevStart} - ${prevEnd} vs. ${currStart} - ${currEnd}`;
      }
    }
    
    const comparisonLabel = comparisonRange
      ? formatComparedLabel(dateType, comparisonRange.startDate, comparisonRange.endDate, range.startDate, range.endDate)
      : '';    

    const [
      currentReport, previousReport,
      wauReport, prevWauReport,
      mauReport, prevMauReport,
      countryVisitors, cityVisitors,
      eventStats, deviceStats, browserStats, trafficStats
    ] = await Promise.all([
      client.runReport({ property: propertyId, metrics: [
        { name: 'activeUsers' }, { name: 'eventCount' }, { name: 'engagementRate' }], dateRanges: [range] }),
      client.runReport({ property: propertyId, metrics: [
        { name: 'activeUsers' }, { name: 'eventCount' }, { name: 'engagementRate' }], dateRanges: [comparisonRange] }),
        client.runReport({ property: propertyId, metrics: [{ name: 'activeUsers' }], dateRanges: [getWAURange(range)] }),
        client.runReport({ property: propertyId, metrics: [{ name: 'activeUsers' }], dateRanges: [getWAURange(comparisonRange)] }),
        client.runReport({ property: propertyId, metrics: [{ name: 'activeUsers' }], dateRanges: [getMAURange(range)] }),
        client.runReport({ property: propertyId, metrics: [{ name: 'activeUsers' }], dateRanges: [getMAURange(comparisonRange)] }),  
      getStats('country', 'activeUsers', 'country', range, true, dateType),
      getStats('city', 'activeUsers', 'city', range, true, dateType),
      getStats('eventName', 'eventCount', 'eventName', range, false, dateType),
      getStats('deviceCategory', 'activeUsers', 'deviceCategory', range, false, dateType),
      getStats('browser', 'activeUsers', 'browser', range, false, dateType),
      getStats('sessionSource', 'activeUsers', 'source', range, false, dateType)
    ]);

    const activeUsers = Number(currentReport[0].rows?.[0]?.metricValues?.[0]?.value || 0);
    const eventCount = Number(currentReport[0].rows?.[0]?.metricValues?.[1]?.value || 0);
    const engagementRate = Number(currentReport[0].rows?.[0]?.metricValues?.[2]?.value || 0);
    const prevActiveUsers = Number(previousReport[0].rows?.[0]?.metricValues?.[0]?.value || 0);
    const prevEventCount = Number(previousReport[0].rows?.[0]?.metricValues?.[1]?.value || 0);
    const prevEngagementRate = Number(previousReport[0].rows?.[0]?.metricValues?.[2]?.value || 0);
    const wau = Number(wauReport[0].rows?.[0]?.metricValues?.[0]?.value || 0);
    const prevWau = Number(prevWauReport[0].rows?.[0]?.metricValues?.[0]?.value || 0);
    const mau = Number(mauReport[0].rows?.[0]?.metricValues?.[0]?.value || 0);
    const prevMau = Number(prevMauReport[0].rows?.[0]?.metricValues?.[0]?.value || 0);

    const stickiness = mau ? wau / mau : 0;
    const prevStickiness = prevMau ? prevWau / prevMau : 0;

    let interpretation = 'No engagement data available.';
    if (stickiness >= 0.7) interpretation = 'Excellent engagement — most users return weekly.';
    else if (stickiness >= 0.5) interpretation = 'Good engagement — a strong portion of users are active weekly.';
    else if (stickiness >= 0.3) interpretation = 'Average engagement — some users return weekly, room to improve.';
    else if (stickiness > 0) interpretation = 'Low engagement — most users are not returning weekly.';

    const visitorLineGraph = await generateVisitorLineGraph(dateType, range.startDate, range.endDate);
    const response = {
      total: {
        activeUsers,
        activeUsersTrend: getTrend(activeUsers, prevActiveUsers),
        activeUsersTrendComparedTo: comparisonLabel,
        eventCount,
        eventCountTrend: getTrend(eventCount, prevEventCount),
        eventCountTrendComparedTo: comparisonLabel,
        engagementRate,
        engagementRateTrend: getTrend(engagementRate, prevEngagementRate),
        engagementRateTrendComparedTo: comparisonLabel
      },
      stickinessMetrics: {
        wau,
        wauTrend: getTrend(wau, prevWau),
        wauTrendComparedTo: 'Last Week (8 to 14 days ago)',
        mau,
        mauTrend: getTrend(mau, prevMau),
        mauTrendComparedTo: 'Last Month (31 to 60 days ago)',
        stickiness: Number(stickiness.toFixed(2)),
        stickinessTrend: getTrend(stickiness, prevStickiness),
        stickinessTrendComparedTo: 'Previous month vs current',
        interpretation
      },
      countryVisitors,
      cityVisitors,
      eventStats,
      deviceStats,
      browserStats,
      trafficStats,
      visitorLineGraph
    };

    await redisClient.setEx(cacheKey, 60 * 60, JSON.stringify(response)); // Analytics cache: 1 hour
    console.log('✅ Cached new analytics response');
    res.json(response);
  } catch (error) {
    console.error('Analytics API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch analytics data.' });
  }
});

export default router;
