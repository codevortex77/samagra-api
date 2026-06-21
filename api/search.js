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

  const API_URL = "https://samagra.gov.in/Services/CommonWebApi.svc/GetDetailsBySamagra";
  const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Content-Type": "application/json; charset=UTF-8",
    "Authorization": "Basic c2FtYWdyYUFwaTpzYW1hZ3JhQDEyMw==",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
    "Origin": "https://samagra.gov.in",
    "Referer": "https://samagra.gov.in/",
  };

  // Helper function
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

  // Fetch through proxy
  async function fetchWithProxy(url, payload, proxyUrl) {
    // Parse proxy URL
    const proxyMatch = proxyUrl.match(/http:\/\/(.*):(.*)@(.*):(\d+)/);
    if (!proxyMatch) throw new Error('Invalid proxy format');
    
    const [, username, password, host, port] = proxyMatch;
    const auth = Buffer.from(`${username}:${password}`).toString('base64');

    const targetUrl = new URL(url);
    
    // Create the proxy request body
    const requestBody = JSON.stringify(payload);
    
    // Using HTTP CONNECT method for HTTPS through proxy
    const proxyResponse = await fetch(`http://${host}:${port}`, {
      method: 'POST',
      headers: {
        'Proxy-Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        method: 'POST',
        headers: HEADERS,
        body: requestBody
      })
    });

    if (!proxyResponse.ok) {
      throw new Error(`Proxy returned ${proxyResponse.status}`);
    }

    return await proxyResponse.json();
  }

  // Direct fetch attempt (might work from some Vercel edge locations)
  async function fetchDirect(payload) {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(payload)
    });

    if (response.status === 200) {
      const text = await response.text();
      const cleanText = text.replace(/^\uFEFF/, '').trim();
      const data = JSON.parse(cleanText);
      return data.d || data;
    }
    
    throw new Error(`Direct fetch failed with status ${response.status}`);
  }

  // Fetch with proxy rotation
  async function fetchSamagra(payload) {
    // First try direct connection (might work from some Vercel edge locations)
    try {
      console.log('Trying direct connection...');
      return await fetchDirect(payload);
    } catch (error) {
      console.log('Direct connection failed, trying proxies...');
    }

    // Try each proxy
    const shuffledProxies = PROXIES.sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < shuffledProxies.length; i++) {
      const proxyUrl = shuffledProxies[i];
      try {
        console.log(`Trying proxy ${i + 1}/${shuffledProxies.length}`);
        
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            ...HEADERS,
            // Use proxy headers
            'X-Proxy-Url': proxyUrl,
          },
          body: JSON.stringify(payload)
        });

        if (response.status === 200) {
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

    throw new Error('All connection attempts failed');
  }

  try {
    console.log(`Searching for mobile: ${mobile}`);

    // Search by mobile
    const mobileResult = await fetchSamagra({ 
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
      const uid = smartGet(item, [
        "UserID", "samagraID", "MemberID", "SamagraID",
        "UserId", "SamagraId", "MemberId"
      ]);
      if (uid) ids.push(String(uid));
    }

    const uniqueIds = [...new Set(ids)];

    if (uniqueIds.length === 0) {
      return res.json({ 
        success: false,
        message: "No records found",
        items_found: items.length,
        first_item_keys: items[0] ? Object.keys(items[0]) : []
      });
    }

    // Get details for each ID
    const results = [];
    for (const uid of uniqueIds) {
      const detailResult = await fetchSamagra({ 
        samagraID: String(uid) 
      });

      if (!detailResult) continue;

      const name = smartGet(detailResult, ["MemberNameE", "Name", "FullName", "MemberName"]);
      const dob = smartGet(detailResult, ["Dob", "DOB", "DateOfBirth"]);
      const gender = smartGet(detailResult, ["Gender", "Sex"]);
      const mobNo = smartGet(detailResult, ["MobileNo", "Mobile"]);
      const address = smartGet(detailResult, ["Address", "FullAddress", "AddressE", "AddressH"]);
      const district = smartGet(detailResult, ["District", "DistrictName"]);
      const category = smartGet(detailResult, ["CategoryName", "Category"]);
      const photoB64 = smartGet(detailResult, ["Photo", "PhotoBase64", "PhotoUrl"]);

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
        name,
        dob,
        gender,
        mobile: mobNo,
        address,
        district,
        category,
        photo: photoUrl
      });
    }

    return res.json({
      success: true,
      count: results.length,
      results
    });

  } catch (error) {
    console.error('Final error:', error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch data",
      error: error.message
    });
  }
}
