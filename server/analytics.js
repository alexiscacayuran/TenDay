import { BetaAnalyticsDataClient } from '@google-analytics/data';

const client = new BetaAnalyticsDataClient({
  keyFilename: './tenDayAnalytics.json',
});

const propertyId = 'properties/484898570';

// Daily Active Users (7 days)
async function getDailyActiveUsers() {
  try {
    const [response] = await client.runReport({
      property: propertyId,
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'activeUsers' }],
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      orderBys: [
        {
          dimension: {
            dimensionName: 'date',
          },
          desc: false,
        },
      ],
    });

    return response.rows.map(row => ({
      date: formatDate(row.dimensionValues[0].value),
      activeUsers: Number(row.metricValues[0].value),
    }));
  } catch (error) {
    console.error('Error in getDailyActiveUsers:', error.message);
    return [];
  }
}

// Platforms (last 7 days)
async function getPlatformCounts() {
  try {
    const [response] = await client.runReport({
      property: propertyId,
      dimensions: [
        { name: 'platform' },
        { name: 'deviceCategory' }
      ],
      metrics: [{ name: 'activeUsers' }],
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      orderBys: [
        {
          metric: {
            metricName: 'activeUsers',
          },
          desc: true,
        },
      ],
      limit: 10,
    });

    return response.rows.map(row => ({
      platform: `${sanitize(row.dimensionValues[0].value)} / ${sanitize(row.dimensionValues[1].value)}`,
      activeUsers: Number(row.metricValues[0].value),
    }));
  } catch (error) {
    console.error('Error in getPlatformCounts:', error.message);
    return [];
  }
}

// Top Countries
async function getTopCountries() {
  try {
    const [response] = await client.runReport({
      property: propertyId,
      dimensions: [{ name: 'country' }],
      metrics: [{ name: 'activeUsers' }],
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      orderBys: [
        {
          metric: {
            metricName: 'activeUsers',
          },
          desc: true,
        },
      ],
      limit: 10,
    });

    return response.rows.map(row => ({
      country: sanitize(row.dimensionValues[0].value),
      activeUsers: Number(row.metricValues[0].value),
    }));
  } catch (error) {
    console.error('Error in getTopCountries:', error.message);
    return [];
  }
}

// Top Cities
async function getTopCities() {
  try {
    const [response] = await client.runReport({
      property: propertyId,
      dimensions: [{ name: 'city' }],
      metrics: [{ name: 'activeUsers' }],
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      orderBys: [
        {
          metric: {
            metricName: 'activeUsers',
          },
          desc: true,
        },
      ],
      limit: 10,
    });

    return response.rows.map(row => ({
      city: sanitize(row.dimensionValues[0].value),
      activeUsers: Number(row.metricValues[0].value),
    }));
  } catch (error) {
    console.error('Error in getTopCities:', error.message);
    return [];
  }
}

// Realtime Active Users (Current Snapshot)
async function getRealtimeActiveUsers() {
  try {
    const [response] = await client.runRealtimeReport({
      property: propertyId,
      dimensions: [
        { name: 'platform' },
        { name: 'deviceCategory' },
        { name: 'city' }
      ],
      metrics: [{ name: 'activeUsers' }],
      limit: 10,
    });

    return response.rows.map(row => ({
      platform: `${sanitize(row.dimensionValues[0].value)} / ${sanitize(row.dimensionValues[1].value)}`,
      city: sanitize(row.dimensionValues[2].value),
      activeUsers: Number(row.metricValues[0].value),
    }));
  } catch (error) {
    console.error('Error in getRealtimeActiveUsers:', error.message);
    return [];
  }
}

// Helpers

// Fallback for empty/null dimension values
function sanitize(value) {
  if (!value || value.trim() === '' || value.toLowerCase() === '(not set)') {
    return 'Unknown';
  }
  return value;
}


// Format YYYYMMDD → YYYY-MM-DD
function formatDate(dateStr) {
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
}

// Main function
async function main() {
  console.log('📊 Fetching Google Analytics GA4 Data...');

  const dailyUsers = await getDailyActiveUsers();
  console.log('\n📅 Daily Active Users (Last 7 Days):');
  console.log(JSON.stringify(dailyUsers, null, 2));

  const platforms = await getPlatformCounts();
  console.log('\n💻 Top Platforms / Devices (Last 7 Days):');
  console.log(JSON.stringify(platforms, null, 2));

  const countries = await getTopCountries();
  console.log('\n🌍 Top Countries (Last 7 Days):');
  console.log(JSON.stringify(countries, null, 2));

  const cities = await getTopCities();
  console.log('\n🏙️ Top Cities (Last 7 Days):');
  console.log(JSON.stringify(cities, null, 2));

  const realtime = await getRealtimeActiveUsers();
  console.log('\n⏱️ Realtime Active Users (Current Snapshot):');
  console.log(JSON.stringify(realtime, null, 2));
}

main().catch(console.error);
