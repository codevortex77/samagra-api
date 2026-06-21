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

  const PROXIES = [
    "http://Lz8gYXGWn190_custom_zone_IN_st__city_sid_14068911_time_15:4318888@change5.owlproxy.com:7778",
    "http://Lz8gYXGWn190_custom_zone_IN_st__city_sid_76090875_time_15:4318888@change5.owlproxy.com:7778",
    "http://Lz8gYXGWn190_custom_zone_IN_st__city_sid_55959051_time_15:4318888@change5.owlproxy.com:7778",
    "http://Lz8gYXGWn190_custom_zone_IN_st__city_sid_20782905_time_15:4318888@change5.owlproxy.com:7778",
    "http://Lz8gYXGWn190_custom_zone_IN_st__city_sid_15476846_time_15:4318888@change5.owlproxy.com:7778",
    "http://Lz8gYXGWn190_custom_zone_IN_st__city_sid_55677753_time_15:4318888@change5.owlproxy.com:7778",
    "http://Lz8gYXGWn190_custom_zone_IN_st__city_sid_36922492_time_15:4318888@change5.owlproxy.com:7778",
    "http://Lz8gYXGWn190_custom_zone_IN_st__city_sid_58760767_time_15:4318888@change5.owlproxy.com:7778",
    "http://Lz8gYXGWn190_custom_zone_IN_st__city_sid_25856756_time_15:4318888@change5.owlproxy.com:7778",
    "http://Lz8gYXGWn190_custom_zone_IN_st__city_sid_18064269_time_15:4318888@change5.owlproxy.com:7778",
    "http://Lz8gYXGWn190_custom_zone_IN_st__city_sid_90704531_time_15:4318888@change5.owlproxy.com:7778",
    "http://Lz8gYXGWn190_custom_zone_IN_st__city_sid_80377955_time_15:4318888@change5.owlproxy.com:7778",
    "http://Lz8gYXGWn190_custom_zone_IN_st__city_sid_91038744_time_15:4318888@change5.owlproxy.com:7778",
  ];

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

  async function fetchWithProxy(payload, maxRetries = 13) {
    for (let i = 0; i < maxRetries && i < PROXIES.length; i++) {
      const proxyUrl = PROXIES[i];
      
      try {
        console.log(`Trying proxy ${i + 1}`);
        
        // Create proxy agent URL for fetch
        const proxyAgentUrl = proxyUrl.replace('http://', 'http://');
        
        const response = await fetch("https://samagra.gov.in/Services/CommonWebApi.svc/GetDetailsBySamagra", {
          method: 'POST',
          headers: {
            'User-Agent': 'okhttp/3.12.1',
            'Content-Type': 'application/json; charset=UTF-8',
            'Authorization': 'Basic c2FtYWdyYUFwaTpzYW1hZ3JhQDEyMw==',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
          },
          body: JSON.stringify(payload),
          // @ts-ignore
          dispatcher: new (await import('undici')).ProxyAgent(proxyUrl),
        });

        if (response.ok) {
          const text = await response.text();
          const cleanText = text.replace(/^\uFEFF/, '').trim();
          const data = JSON.parse(cleanText);
          return data.d || data;
        }
      } catch (error) {
        console.log(`Proxy ${i + 1} failed: ${error.message}`);
        continue;
      }
    }
    throw new Error('All proxies failed');
  }

  try {
    // Search by mobile
    const mobileResult = await fetchWithProxy({ 
      samagraID: "0", 
      MobileNo: mobile 
    });

    // Parse items
    let items = [];
    if (Array.isArray(mobileResult)) {
      items = mobileResult;
    } else if (mobileResult?.data && Array.isArray(mobileResult.data)) {
      items = mobileResult.data;
    } else if (mobileResult?.data) {
      items = [mobileResult.data];
    } else if (mobileResult) {
      items = [mobileResult];
    }

    // Extract IDs
    const ids = [];
    for (const item of items) {
      const uid = smartGet(item, ["UserID", "samagraID", "MemberID", "SamagraID"]);
      if (uid) ids.push(String(uid));
    }

    const uniqueIds = [...new Set(ids)];

    if (uniqueIds.length === 0) {
      return res.json({ 
        success: false,
        message: "No records found",
        items_found: items.length
      });
    }

    // Get details for each ID
    const results = [];
    for (const uid of uniqueIds) {
      const detailResult = await fetchWithProxy({ samagraID: String(uid) });
      
      if (!detailResult) continue;

      const photoB64 = smartGet(detailResult, ["Photo", "PhotoBase64"]);
      let photoUrl = null;
      if (photoB64) {
        try {
          let cleanB64 = photoB64.includes(",") ? photoB64.split(",")[1] : photoB64;
          cleanB64 += '='.repeat((4 - cleanB64.length % 4) % 4);
          photoUrl = `data:image/jpeg;base64,${cleanB64}`;
        } catch (e) {}
      }

      results.push({
        uid,
        name: smartGet(detailResult, ["MemberNameE", "Name", "FullName", "MemberName"]),
        dob: smartGet(detailResult, ["Dob", "DOB", "DateOfBirth"]),
        gender: smartGet(detailResult, ["Gender", "Sex"]),
        mobile: smartGet(detailResult, ["MobileNo", "Mobile"]),
        address: smartGet(detailResult, ["Address", "FullAddress", "AddressE", "AddressH"]),
        district: smartGet(detailResult, ["District", "DistrictName"]),
        category: smartGet(detailResult, ["CategoryName", "Category"]),
        photo: photoUrl
      });
    }

    return res.json({
      success: true,
      count: results.length,
      results
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      message: "Request failed",
      error: error.message
    });
  }
}
