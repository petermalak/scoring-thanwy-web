export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Validate input immediately
  if (!req.body.qrCode || !req.body.selectedValue) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const googleScriptUrl = "https://script.google.com/macros/s/AKfycbw1TvhizAjJoQhrk8ZvSfwww8loSoE46X9Qkz2r5r0ogs0ZfTbxBINBnT0w5xwBeTuiyA/exec";

  try {
    // Timeout after 3 seconds
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(googleScriptUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        qrCode: req.body.qrCode,
        selectedValue: req.body.selectedValue,
        timestamp: req.body.timestamp || new Date().toISOString()
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Google Script responded with ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
    
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ 
      error: err.name === 'AbortError' ? 'Request timeout' : 'Internal Server Error'
    });
  }
}