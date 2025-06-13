// pages/api/submit.js
import { appendRow, getSheetData, updateCell, findRowByValue, getHeaders, getRowData } from '../../utils/sheets';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { qrCode, selectedValue, timestamp } = req.body;

  if (!qrCode || !selectedValue) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const scoreToAdd = parseInt(selectedValue, 10);
  if (isNaN(scoreToAdd)) {
    return res.status(400).json({ error: 'Selected value must be a number' });
  }

  try {
    // Get headers and find row in parallel
    const [headers, userRow] = await Promise.all([
      getHeaders(process.env.SHEET_NAME),
      findRowByValue(process.env.SHEET_NAME, 'CodeValue', qrCode)
    ]);

    if (!userRow) {
      return res.status(404).json({ error: 'User not found' });
    }

    const idIndex = headers.indexOf('ID');
    const scoreIndex = headers.indexOf('Score');
    const nameIndex = headers.indexOf('Name');
    const classIndex = headers.indexOf('Class');
    const teamIndex = headers.indexOf('Team');

    // Get real-time data for the user
    const userData = await getRowData(process.env.SHEET_NAME, userRow);
    if (!userData) {
      return res.status(404).json({ error: 'User data not found' });
    }

    const currentScore = parseInt(userData[scoreIndex], 10) || 0;
    const newScore = currentScore + scoreToAdd;

    // Update score and log in parallel
    await Promise.all([
      // Update the score immediately
      updateCell(process.env.SHEET_NAME, `${String.fromCharCode(65 + scoreIndex)}${userRow}`, newScore),
      // Log the submission
      appendRow(process.env.LOGS_SHEET_NAME, [
        timestamp || new Date().toISOString(),
        qrCode,
        userData[nameIndex],
        userData[classIndex],
        userData[teamIndex],
        scoreToAdd,
        newScore,
      ])
    ]);

    return res.status(200).json({
      success: true,
      message: 'Score updated successfully'
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
