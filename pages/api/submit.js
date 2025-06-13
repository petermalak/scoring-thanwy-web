// pages/api/submit.js
import { 
  appendRow, 
  getSheetData, 
  updateCell, 
  findRowByValue, 
  getHeaders, 
  getRowData,
  getFirstSheetName 
} from '../../utils/sheets';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Check if required environment variables are set
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.SPREADSHEET_ID) {
    console.error('Missing required environment variables');
    return res.status(500).json({ 
      error: 'Server configuration error',
      details: 'Missing required environment variables'
    });
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
    console.log('Received QR Code:', qrCode);
    
    // Get the sheet name first
    const sheetName = await getFirstSheetName();
    console.log('Using sheet:', sheetName);
    
    // Get headers and find row in parallel
    const [headers, userRow] = await Promise.all([
      getHeaders(),
      findRowByValue('CodeValue', qrCode)
    ]);

    console.log('Headers:', headers);
    console.log('User Row:', userRow);

    if (!userRow) {
      console.log('User not found for QR Code:', qrCode);
      return res.status(404).json({ 
        error: 'User not found',
        details: `No user found with QR code: ${qrCode}`,
        qrCode: qrCode
      });
    }

    const idIndex = headers.indexOf('ID');
    const scoreIndex = headers.indexOf('Score');
    const nameIndex = headers.indexOf('Name');
    const classIndex = headers.indexOf('Class');
    const teamIndex = headers.indexOf('Team');

    console.log('Column Indices:', {
      idIndex,
      scoreIndex,
      nameIndex,
      classIndex,
      teamIndex
    });

    // Get real-time data for the user
    const userData = await getRowData(sheetName, userRow);
    console.log('User Data:', userData);

    if (!userData) {
      return res.status(404).json({ 
        error: 'User data not found',
        details: 'User row exists but data could not be retrieved',
        qrCode: qrCode
      });
    }

    const currentScore = parseInt(userData[scoreIndex], 10) || 0;
    const newScore = currentScore + scoreToAdd;

    console.log('Score Update:', {
      currentScore,
      scoreToAdd,
      newScore
    });

    // Update score and log in parallel
    await Promise.all([
      // Update the score immediately
      updateCell(sheetName, `${String.fromCharCode(65 + scoreIndex)}${userRow}`, newScore),
      // Log the submission
      appendRow('Logs', [
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
      message: 'Score updated successfully',
      data: {
        name: userData[nameIndex],
        class: userData[classIndex],
        team: userData[teamIndex],
        oldScore: currentScore,
        newScore: newScore,
        pointsAdded: scoreToAdd
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      details: error.message,
      qrCode: qrCode
    });
  }
}
