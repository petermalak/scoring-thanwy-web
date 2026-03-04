import { getGiftsData } from '../../utils/sheets';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if required environment variables are set
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.SPREADSHEET_ID) {
      console.error('Missing required environment variables');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'Missing required environment variables'
      });
    }

    const gifts = await getGiftsData();
    
    res.status(200).json(gifts);
  } catch (error) {
    console.error('Error fetching gifts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch gifts',
      details: error.message
    });
  }
}
