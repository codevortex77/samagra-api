import { ProxyAgent, fetch } from 'undici';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { mobile } = req.query;
  if (!mobile) return res.status(400).json({ error: "Mobile number required" });

  // Single Indian proxy
  const PROXY_URL = "http://Lz8gYXGWn190_custom_zone_IN_st__city_sid_14068911_time_15:4318888@change5.owlproxy.com:7778";
  const API_URL = "https://samagra.gov.in/Services/CommonWebApi.svc/GetDetailsBySamagra";

  // Create proxy agent (works in Vercel)
  const proxyAgent = new ProxyAgent(PROXY_URL);

  function smartGet(obj, keys) {
    if (typeof obj !== 'object' || obj === null) return null;
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const result = smartGet(item, keys);
        if (result) return result;
      }
      return null;
    }
    for (const [key, value] of Object.entries(obj)) {
      if (keys.includes(key)) return value;
      if (typeof value === 'object' && value !== null) {
        const result = smartGet(value, keys);
        if (result) return result;
      }
    }
    return null;
  }

  async function fetchSamagra(payload) {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'User-Agent': 'okhttp/3.12.1',
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Basic c2FtYWdyYUFwaTpzYW1hZ3JhQDEyMw==',
      },
      body: JSON.stringify(payload),
      dispatcher: proxyAgent, // <-- This routes through proxy
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    const data = JSON.parse(text.replace(/^\uFEFF/, '').trim());
    return data.d || data;
  }

  try {
    const mobileResult = await fetchSamagra({ samagraID: "0", MobileNo: mobile });

    let items = [];
    if (Array.isArray(mobileResult)) items = mobileResult;
    else if (mobileResult?.data && Array.isArray(mobileResult.data)) items = mobileResult.data;
    else if (mobileResult?.data) items = [mobileResult.data];
    else if (mobileResult) items = [mobileResult];

    const ids = [];
    for (const item of items) {
      const uid = smartGet(item, ["UserID", "samagraID", "MemberID", "SamagraID"]);
      if (uid) ids.push(String(uid));
    }
    const uniqueIds = [...new Set(ids)];

    if (uniqueIds.length === 0) {
      return res.json({ status: "error", message: "No records found" });
    }

    const results = [];
    for (const uid of uniqueIds) {
      const detail = await fetchSamagra({ samagraID: uid });
      const memberId = smartGet(detail, ["MemberID", "MemberId", "member_id"]) || uid;
      results.push({
        name: smartGet(detail, ["MemberNameE", "Name"]) || "",
        address: smartGet(detail, ["Address"]) || "",
        district: smartGet(detail, ["District"]) || "",
        family_id: smartGet(detail, ["FamilyID"]) || "",
        member_id: memberId,
        dob: smartGet(detail, ["Dob"]) || "",
        gender: smartGet(detail, ["Gender"]) || "",
        category: smartGet(detail, ["CategoryName"]) || "",
        photo_url: `https://samagra-api.vercel.app/api/photos/${memberId}`
      });
    }

    return res.json({ status: "success", data: results });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
}
