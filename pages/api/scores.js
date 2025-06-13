import { getSheetData } from '../../utils/sheets';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = await getSheetData();
    
    // Transform the data to match the expected format
    const scores = data.map((row, index) => ({
      id: index + 1,
      name: row.name || '',
      class: row.class || '',
      team: row.team || '',
      score: parseInt(row.score || '0', 10),
    }));

    res.status(200).json(scores);
  } catch (error) {
    console.error('Error fetching scores:', error);
    res.status(500).json({ error: 'Failed to fetch scores' });
  }
} 