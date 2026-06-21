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

  // Validate mobile number (10 digits)
  if (!/^\d{10}$/.test(mobile)) {
    return res.status(400).json({ error: "Invalid mobile number. Must be 10 digits." });
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

  // Fetch function with better error handling
  async function fetchSamagra(payload) {
    try {
      console.log('Fetching with payload:', JSON.stringify(payload));
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status);
      
      if (response.status !== 200) {
        console.log('Non-200 response:', response.status);
        return null;
      }
      
      const text = await response.text();
      console.log('Raw response (first 500 chars):', text.substring(0, 500));
      
      // Clean BOM and whitespace
      const cleanText = text.replace(/^\uFEFF/, '').trim();
      
      // Try to parse JSON
      let data;
      try {
        data = JSON.parse(cleanText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.log('Failed text:', cleanText.substring(0, 200));
        return null;
      }
      
      // Return d property if exists, otherwise return data
      return data.d || data;
      
    } catch (error) {
      console.error('Fetch error:', error);
      return null;
    }
  }

  // Get user IDs by mobile
  async function getUserIds(mobileNo) {
    console.log('Searching for mobile:', mobileNo);
    
    const res = await fetchSamagra({ 
      samagraID: "0", 
      MobileNo: mobileNo 
    });
    
    console.log('Mobile search result type:', typeof res);
    console.log('Mobile search result:', JSON.stringify(res).substring(0, 500));
    
    if (!res) return [];

    // Handle different response structures
    let items = [];
    
    if (Array.isArray(res)) {
      items = res;
    } else if (res.data && Array.isArray(res.data)) {
      items = res.data;
    } else if (res.data && typeof res.data === 'object') {
      items = [res.data];
    } else if (typeof res === 'object') {
      // Check if it's a single record
      items = [res];
    }
    
    console.log('Items found:', items.length);
    
    const ids = [];
    for (const item of items) {
      const uid = smartGet(item, ["UserID", "samagraID", "MemberID", "SamagraID"]);
      if (uid) {
        console.log('Found ID:', uid);
        ids.push(String(uid));
      }
    }
    
    console.log('All IDs:', ids);
    return [...new Set(ids)];
  }

  // Get full details by user ID
  async function getFullIntel(uid) {
    console.log('Getting details for UID:', uid);
    
    const res = await fetchSamagra({ 
      samagraID: String(uid) 
    });
    
    if (!res) return null;

    console.log('UID result:', JSON.stringify(res).substring(0, 500));

    const name = smartGet(res, ["MemberNameE", "Name", "FullName", "MemberName"]);
    const dob = smartGet(res, ["Dob", "DOB", "DateOfBirth"]);
    const gender = smartGet(res, ["Gender", "Sex"]);
    const mob = smartGet(res, ["MobileNo", "Mobile"]);
    const address = smartGet(res, ["Address", "FullAddress"]);
    const district = smartGet(res, ["District", "DistrictName"]);
    const category = smartGet(res, ["CategoryName", "Category"]);
    const photoB64 = smartGet(res, ["Photo", "PhotoBase64", "PhotoUrl"]);

    let photoUrl = null;
    if (photoB64) {
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
    console.log('Starting search for mobile:', mobile);
    
    const uids = await getUserIds(mobile);
    
    console.log('Total UIDs found:', uids.length);

    if (!uids || uids.length === 0) {
      return res.status(404).json({ 
        message: "No records found",
        debug: {
          mobile_searched: mobile,
          timestamp: new Date().toISOString()
        }
      });
    }

    const results = [];
    for (const uid of uids) {
      const data = await getFullIntel(uid);
      if (data) results.push(data);
    }

    console.log('Final results count:', results.length);

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
