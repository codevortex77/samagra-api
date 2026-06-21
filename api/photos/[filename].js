export default async function handler(req, res) {
  const { filename } = req.query;

  if (!filename) {
    return res.status(400).json({ error: "Filename required" });
  }

  const PROXY = "http://Lz8gYXGWn190_custom_zone_IN_st__city_sid_14068911_time_15:4318888@change5.owlproxy.com:7778";

  try {
    // First get the photo base64 from Samagra API
    const response = await fetch("https://samagra.gov.in/Services/CommonWebApi.svc/GetDetailsBySamagra", {
      method: 'POST',
      headers: {
        'User-Agent': 'okhttp/3.12.1',
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Basic c2FtYWdyYUFwaTpzYW1hZ3JhQDEyMw==',
      },
      body: JSON.stringify({ samagraID: filename }),
    });

    if (!response.ok) {
      return res.status(404).json({ error: "Photo not found" });
    }

    const text = await response.text();
    const cleanText = text.replace(/^\uFEFF/, '').trim();
    const data = JSON.parse(cleanText);
    const result = data.d || data;

    // Extract photo
    let photoB64 = null;
    function findPhoto(obj) {
      if (typeof obj !== 'object' || obj === null) return;
      if (Array.isArray(obj)) {
        obj.forEach(findPhoto);
        return;
      }
      for (const [key, value] of Object.entries(obj)) {
        if (key === "Photo" && typeof value === "string" && value.length > 100) {
          photoB64 = value;
          return;
        }
        if (typeof value === 'object') findPhoto(value);
      }
    }
    findPhoto(result);

    if (!photoB64) {
      return res.status(404).json({ error: "No photo found" });
    }

    // Clean and decode base64
    let cleanB64 = photoB64;
    if (cleanB64.includes(",")) {
      cleanB64 = cleanB64.split(",")[1];
    }
    cleanB64 += '='.repeat((4 - cleanB64.length % 4) % 4);

    const imgBuffer = Buffer.from(cleanB64, 'base64');

    // Set headers and send image
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(imgBuffer);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
