export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { mobile } = req.query;

  if (!mobile) {
    return res.status(400).json({ error: "Mobile number required" });
  }

  const API_URL = "https://samagra.gov.in/Services/CommonWebApi.svc/GetDetailsBySamagra";
  const HEADERS = {
    "User-Agent": "okhttp/3.12.1",
    "Content-Type": "application/json; charset=UTF-8",
    "Authorization": "Basic c2FtYWdyYUFwaTpzYW1hZ3JhQDEyMw==",
  };

  // Helper function to recursively search for keys in object
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

  // Fetch function
  async function fetchSamagra(payload) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify(payload)
      });

      if (response.status !== 200) return null;
      
      const text = await response.text();
      const cleanText = text.replace(/^\uFEFF/, '').trim();
      const data = JSON.parse(cleanText);
      
      return data.d || data;
    } catch (error) {
      console.error('Fetch error:', error);
      return null;
    }
  }

  // Get user IDs by mobile
  async function getUserIds(mobileNo) {
    const res = await fetchSamagra({ samagraID: "0", MobileNo: mobileNo });
    if (!res) return [];

    let items = Array.isArray(res) ? res : (res.data || []);
    if (!items.length && typeof res === 'object') {
      items = [res];
    }

    const ids = [];
    for (const item of items) {
      const uid = smartGet(item, ["UserID", "samagraID", "MemberID"]);
      if (uid) ids.push(String(uid));
    }
    return [...new Set(ids)];
  }

  // Get full details by user ID
  async function getFullIntel(uid) {
    const res = await fetchSamagra({ samagraID: String(uid) });
    if (!res) return null;

    const name = smartGet(res, ["MemberNameE", "Name", "FullName"]);
    const dob = smartGet(res, ["Dob", "DOB"]);
    const gender = smartGet(res, ["Gender"]);
    const mob = smartGet(res, ["MobileNo"]);
    const address = smartGet(res, ["Address"]);
    const district = smartGet(res, ["District"]);
    const category = smartGet(res, ["CategoryName"]);
    const photoB64 = smartGet(res, ["Photo"]);

    let photoUrl = null;
    if (photoB64) {
      // Convert base64 to data URL (Vercel doesn't support local file storage)
      try {
        let cleanB64 = photoB64;
        if (cleanB64.includes(",")) {
          cleanB64 = cleanB64.split(",")[1];
        }
        // Add padding if needed
        cleanB64 += '='.repeat((4 - cleanB64.length % 4) % 4);
        photoUrl = `data:image/jpeg;base64,${cleanB64}`;
      } catch (e) {
        console.error('Photo conversion error:', e);
      }
    }

    return {
      uid,
      name,
      dob,
      gender,
      mobile: mob,
      address,
      district,
      category,
      photo: photoUrl
    };
  }

  try {
    const uids = await getUserIds(mobile);

    if (!uids || uids.length === 0) {
      return res.status(404).json({ message: "No records found" });
    }

    const results = [];
    for (const uid of uids) {
      const data = await getFullIntel(uid);
      if (data) results.push(data);
    }

    return res.status(200).json({
      count: results.length,
      results
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message
    });
  }
      }
