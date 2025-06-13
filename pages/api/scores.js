import { getSheetData } from '../../utils/sheets';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if required environment variables are set
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEET_ID) {
      console.error('Missing required environment variables');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'Missing required environment variables'
      });
    }

    const data = await getSheetData();
    
    // Transform the data to match the expected format
    const scores = data.map((row, index) => ({
      id: index + 1,
      name: row.name || '',
      class: row.class || '',
      team: row.team || '',
      score: parseInt(row.score || '0', 10),
      details: row.details || '',
      notes: row.notes || '',
      date: row.date || new Date().toISOString(),
    }));

    res.status(200).json(scores);
  } catch (error) {
    console.error('Error fetching scores:', error);
    res.status(500).json({ 
      error: 'Failed to fetch scores',
      details: error.message
    });
  }
} 