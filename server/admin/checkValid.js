import express from 'express';
import axios from 'axios';
import moment from 'moment-timezone';

const router = express.Router();

router.get('/checkValid', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:5000/api/v1/valid');
    const { latest_date, latest_time } = response.data;

    const latestDateTimePH = moment.tz(`${latest_date} ${latest_time}`, 'YYYY-MM-DD hh:mm:ss A', 'Asia/Manila');
    const nextUploadPH = latestDateTimePH.clone().add(2, 'days').hour(14).minute(0).second(0);
    const nowPH = moment().tz('Asia/Manila');

    const diffMs = nextUploadPH.diff(nowPH);
    const diffDuration = moment.duration(diffMs);

    let status = '';
    if (diffMs > 0) {
      if (diffDuration.asHours() > 6) {
        status = '✅ Up to date.';
      } else {
        status = '⚠️ Upload due soon. ';
      }
    } else {
      status = '❌ Behind schedule.';
    }

    const remaining = diffMs > 0
      ? `${Math.floor(diffDuration.asHours())}h ${diffDuration.minutes()}m ${diffDuration.seconds()}s`
      : '0h 0m 0s';

    res.json({
      latest_date,
      next_upload_deadline: nextUploadPH.format('YYYY-MM-DD hh:mm A'),
      current_time: nowPH.format('YYYY-MM-DD hh:mm A'),
      remaining_time: remaining,
      status
    });

  } catch (error) {
    console.error('Failed to compute next upload status:', error.message);
    res.status(500).json({ error: 'Failed to fetch or compute upload status.' });
  }
});

export default router;
