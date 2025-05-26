// /api/submit.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { qrCode, selectedValue, timestamp } = req.body;

    const googleScriptUrl = "https://script.google.com/macros/s/AKfycbwynDyJndKBVGnOM_1kMrH5S3vS4H0KzsuLkU4ppeplNm4UNl4yXLwLD_a8-X75lD0_6A/exec";

    const response = await fetch(googleScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrCode, selectedValue, timestamp }),
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
