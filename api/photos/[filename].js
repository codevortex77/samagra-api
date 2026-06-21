import { ProxyAgent, fetch } from 'undici';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { filename } = req.query;
  if (!filename) return res.status(400).json({ error: "Member ID required" });

  const PROXY_URL = "http://Lz8gYXGWn190_custom_zone_IN_st__city_sid_14068911_time_15:4318888@change5.owlproxy.com:7778";
  const API_URL = "https://samagra.gov.in/Services/CommonWebApi.svc/GetDetailsBySamagra";
  const proxyAgent = new ProxyAgent(PROXY_URL);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'User-Agent': 'okhttp/3.12.1',
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Basic c2FtYWdyYUFwaTpzYW1hZ3JhQDEyMw==',
      },
      body: JSON.stringify({ samagraID: filename }),
      dispatcher: proxyAgent,
    });

    if (!response.ok) return res.status(404).json({ error: "Not found" });

    const text = await response.text();
    const data = JSON.parse(text.replace(/^\uFEFF/, '').trim());
    const result = data.d || data;

    let photoB64 = null;
    JSON.stringify(result, (key, value) => {
      if (key === "Photo" && typeof value === "string" && value.length > 100) {
        photoB64 = value;
      }
      return value;
    });

    if (!photoB64) return res.status(404).json({ error: "No photo" });

    let cleanB64 = photoB64.includes(",") ? photoB64.split(",")[1] : photoB64;
    cleanB64 += '='.repeat((4 - cleanB64.length % 4) % 4);

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(Buffer.from(cleanB64, 'base64'));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
