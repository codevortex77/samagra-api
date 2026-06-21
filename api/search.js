import https from 'https';
import http from 'http';

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

  // Your working proxies
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

  // Parse proxy URL
  function parseProxyUrl(proxyUrl) {
    const url = new URL(proxyUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port),
      auth: url.username ? `${url.username}:${url.password}` : null
    };
  }

  // Shuffle array for random proxy selection
  function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Fetch with custom proxy agent
  async function fetchWithProxy(url, options, proxyUrl) {
    return new Promise((resolve, reject) => {
      const proxy = parseProxyUrl(proxyUrl);
      
      // Create custom agent with proxy
      const agent = new https.Agent({
        host: proxy.host,
        port: proxy.port,
        auth: proxy.auth,
        rejectUnauthorized: false,
        keepAlive: true,
        timeout: 30000
      });

      // Parse the target URL
      const targetUrl = new URL(url);
      
      const requestOptions = {
        hostname: targetUrl.hostname,
        port: targetUrl.port || 443,
        path: targetUrl.pathname + targetUrl.search,
        method: options.method || 'POST',
        headers: {
          ...options.headers,
          'Host': targetUrl.hostname
        },
        agent: agent,
        timeout: 30000
      };

      const request = https.request(requestOptions, (response) => {
        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });
        response.on('end', () => {
          resolve({
            status: response.statusCode,
            text: data,
            headers: response.headers
          });
        });
      });

      request.on('error', (error) => {
        reject(error);
      });

      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.body) {
        request.write(options.body);
      }
      request.end();
    });
  }

  // Helper function to recursively search for keys
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

  // Fetch Samagra API with proxy rotation
  async function fetchSamagra(payload, retries = 13) {
    const shuffledProxies = shuffleArray(PROXIES);
    let lastError = null;

    for (let i = 0; i < Math.min(retries, shuffledProxies.length); i++) {
      const proxyUrl = shuffledProxies[i];
      
      try {
        console.log(`Trying proxy ${i + 1}: ${proxyUrl.split('@')[1]}`);
        
        const response = await fetchWithProxy(API_URL, {
          method: 'POST',
          headers: HEADERS,
          body: JSON.stringify(payload)
        }, proxyUrl);

        if (response.status === 200) {
          console.log(`Success with proxy ${i + 1}`);
          const text = response.text;
          const cleanText = text.replace(/^\uFEFF/, '').trim();
          const data = JSON.parse(cleanText);
          return data.d || data;
        } else {
          console.log(`Proxy ${i + 1} returned status ${response.status}`);
          lastError = new Error(`Status ${response.status}`);
        }
      } catch (error) {
        console.log(`Proxy ${i + 1} failed: ${error.message}`);
        lastError = error;
        continue;
      }
    }

    throw lastError || new Error('All proxies failed');
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

    console.log(`Found ${items.length} items`);

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
    console.log(`Found ${uniqueIds.length} unique IDs`);

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
      console.log(`Getting details for UID: ${uid}`);
      
      const detailResult = await fetchSamagra({ 
        samagraID: String(uid) 
      });

      if (!detailResult) continue;

      const name = smartGet(detailResult, [
        "MemberNameE", "Name", "FullName", "MemberName"
      ]);
      
      const dob = smartGet(detailResult, [
        "Dob", "DOB", "DateOfBirth"
      ]);
      
      const gender = smartGet(detailResult, [
        "Gender", "Sex"
      ]);
      
      const mobNo = smartGet(detailResult, [
        "MobileNo", "Mobile"
      ]);
      
      const address = smartGet(detailResult, [
        "Address", "FullAddress", "AddressE", "AddressH"
      ]);
      
      const district = smartGet(detailResult, [
        "District", "DistrictName"
      ]);
      
      const category = smartGet(detailResult, [
        "CategoryName", "Category"
      ]);
      
      const photoB64 = smartGet(detailResult, [
        "Photo", "PhotoBase64", "PhotoUrl"
      ]);

      // Convert photo to base64 URL
      let photoUrl = null;
      if (photoB64) {
        try {
          let cleanB64 = photoB64;
          if (cleanB64.includes(",")) {
            cleanB64 = cleanB64.split(",")[1];
          }
          cleanB64 += '='.repeat((4 - cleanB64.length % 4) % 4);
          photoUrl = `data:image/jpeg;base64,${cleanB64}`;
        } catch (e) {
          console.error('Photo conversion error:', e);
        }
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

    console.log(`Returning ${results.length} results`);

    return res.json({
      success: true,
      count: results.length,
      results
    });

  } catch (error) {
    console.error('Final error:', error);
    return res.status(500).json({
      success: false,
      message: "All proxies failed or request error",
      error: error.message
    });
  }
}
