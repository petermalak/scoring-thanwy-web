// pages/api/submit.js
import { appendRow, getSheetData, updateCell } from '../../utils/sheets';

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
    const usersData = await getSheetData(process.env.SHEET_NAME);
    const headers = usersData[0];
    const idIndex = headers.indexOf('ID');
    const scoreIndex = headers.indexOf('Score');
    const nameIndex = headers.indexOf('Name');
    const classIndex = headers.indexOf('Class');
    const teamIndex = headers.indexOf('Team');

    let userRow = null;
    for (let i = 1; i < usersData.length; i++) {
      if (usersData[i][idIndex] === qrCode) {
        userRow = i + 1; // Adjust for header row
        break;
      }
    }

    if (!userRow) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentScore = parseInt(usersData[userRow - 1][scoreIndex], 10) || 0;
    const newScore = currentScore + scoreToAdd;

    const scoreCell = `${String.fromCharCode(65 + scoreIndex)}${userRow}`;
    await updateCell(process.env.SHEET_NAME, scoreCell, newScore);

    const userData = usersData[userRow - 1];

    await appendRow(process.env.LOGS_SHEET_NAME, [
      timestamp || new Date().toISOString(),
      qrCode,
      userData[nameIndex],
      userData[classIndex],
      userData[teamIndex],
      scoreToAdd,
      newScore,
    ]);

    return res.status(200).json({
      success: true,
      message: 'Score updated successfully',
      userData: {
        id: qrCode,
        name: userData[nameIndex],
        class: userData[classIndex],
        team: userData[teamIndex],
        previousScore: currentScore,
        newScore: newScore,
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
