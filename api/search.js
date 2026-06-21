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

  const debug = {
    steps: [],
    errors: [],
    raw_responses: []
  };

  const API_URL = "https://samagra.gov.in/Services/CommonWebApi.svc/GetDetailsBySamagra";
  const HEADERS = {
    "User-Agent": "okhttp/3.12.1",
    "Content-Type": "application/json; charset=UTF-8",
    "Authorization": "Basic c2FtYWdyYUFwaTpzYW1hZ3JhQDEyMw==",
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

  // Fetch function with full debugging
  async function fetchWithDebug(payload, stepName) {
    try {
      debug.steps.push(`${stepName}: Sending request with payload: ${JSON.stringify(payload)}`);
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify(payload)
      });

      debug.steps.push(`${stepName}: Response status: ${response.status}`);
      debug.steps.push(`${stepName}: Response headers: ${JSON.stringify(Object.fromEntries(response.headers))}`);

      const text = await response.text();
      debug.raw_responses.push({
        step: stepName,
        status: response.status,
        body_preview: text.substring(0, 1000),
        body_length: text.length
      });

      if (response.status !== 200) {
        debug.errors.push(`${stepName}: Non-200 status: ${response.status}`);
        return null;
      }

      // Try multiple parsing approaches
      let data = null;
      const cleanText = text.replace(/^\uFEFF/, '').trim();

      // Try 1: Direct JSON parse
      try {
        data = JSON.parse(cleanText);
        debug.steps.push(`${stepName}: Direct JSON parse successful`);
      } catch (e1) {
        debug.errors.push(`${stepName}: Direct JSON parse failed: ${e1.message}`);
        
        // Try 2: Handle BOM and special characters
        try {
          const utf8Text = Buffer.from(text, 'utf-8').toString('utf-8').replace(/^\uFEFF/, '').trim();
          data = JSON.parse(utf8Text);
          debug.steps.push(`${stepName}: UTF8 parse successful`);
        } catch (e2) {
          debug.errors.push(`${stepName}: UTF8 parse failed: ${e2.message}`);
          
          // Try 3: Remove non-printable characters
          try {
            const printableText = cleanText.replace(/[^\x20-\x7E\u0900-\u097F]/g, '');
            data = JSON.parse(printableText);
            debug.steps.push(`${stepName}: Printable text parse successful`);
          } catch (e3) {
            debug.errors.push(`${stepName}: All parse attempts failed`);
            return null;
          }
        }
      }

      return data.d || data;

    } catch (error) {
      debug.errors.push(`${stepName}: Fetch error: ${error.message}`);
      return null;
    }
  }

  // Get user IDs
  async function getUserIds(mobileNo) {
    const res = await fetchWithDebug({ 
      samagraID: "0", 
      MobileNo: mobileNo 
    }, "MobileSearch");

    if (!res) {
      debug.errors.push("MobileSearch: No response received");
      return [];
    }

    debug.steps.push(`MobileSearch: Response type: ${typeof res}`);
    debug.steps.push(`MobileSearch: Is array: ${Array.isArray(res)}`);
    debug.steps.push(`MobileSearch: Keys: ${Object.keys(res).join(', ')}`);

    // Handle different response structures
    let items = [];
    
    if (Array.isArray(res)) {
      items = res;
      debug.steps.push(`MobileSearch: Found array with ${items.length} items`);
    } else if (res.data && Array.isArray(res.data)) {
      items = res.data;
      debug.steps.push(`MobileSearch: Found data array with ${items.length} items`);
    } else if (res.data && typeof res.data === 'object') {
      items = [res.data];
      debug.steps.push(`MobileSearch: Single data object`);
    } else if (typeof res === 'object' && Object.keys(res).length > 0) {
      items = [res];
      debug.steps.push(`MobileSearch: Using entire response as single item`);
    }

    // Check all possible ID fields
    if (items.length > 0) {
      const firstItem = items[0];
      debug.steps.push(`First item keys: ${Object.keys(firstItem).join(', ')}`);
      debug.steps.push(`First item preview: ${JSON.stringify(firstItem).substring(0, 300)}`);
    }

    const ids = [];
    for (const item of items) {
      const uid = smartGet(item, [
        "UserID", "samagraID", "MemberID", "SamagraID",
        "UserId", "SamagraId", "MemberId", "id", "ID",
        "userid", "samagraid", "memberid"
      ]);
      if (uid) {
        debug.steps.push(`Found ID: ${uid}`);
        ids.push(String(uid));
      }
    }

    if (ids.length === 0 && items.length > 0) {
      debug.errors.push("No ID field found in items. Available keys: " + 
        Object.keys(items[0]).join(', '));
    }

    return [...new Set(ids)];
  }

  // Get full details
  async function getFullIntel(uid) {
    const res = await fetchWithDebug({ 
      samagraID: String(uid) 
    }, `DetailsFor_${uid}`);

    if (!res) return null;

    const name = smartGet(res, [
      "MemberNameE", "Name", "FullName", "MemberName",
      "memberNameE", "name", "fullName", "memberName"
    ]);
    
    const dob = smartGet(res, [
      "Dob", "DOB", "DateOfBirth", "dob", "dateOfBirth"
    ]);
    
    const gender = smartGet(res, [
      "Gender", "Sex", "gender", "sex"
    ]);
    
    const mob = smartGet(res, [
      "MobileNo", "Mobile", "mobileNo", "mobile"
    ]);
    
    const address = smartGet(res, [
      "Address", "FullAddress", "address", "fullAddress",
      "AddressE", "AddressH"  // Hindi address support
    ]);
    
    const district = smartGet(res, [
      "District", "DistrictName", "district", "districtName"
    ]);
    
    const category = smartGet(res, [
      "CategoryName", "Category", "categoryName", "category"
    ]);
    
    const photoB64 = smartGet(res, [
      "Photo", "PhotoBase64", "PhotoUrl", "photo", "photoBase64"
    ]);

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
        debug.errors.push(`Photo conversion error: ${e.message}`);
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
    debug.steps.push(`Total UIDs found: ${uids.length}`);

    if (!uids || uids.length === 0) {
      return res.status(200).json({
        success: false,
        message: "No records found",
        debug: {
          mobile_searched: mobile,
          timestamp: new Date().toISOString(),
          steps: debug.steps,
          errors: debug.errors,
          raw_responses: debug.raw_responses
        }
      });
    }

    const results = [];
    for (const uid of uids) {
      const data = await getFullIntel(uid);
      if (data) results.push(data);
    }

    return res.status(200).json({
      success: true,
      count: results.length,
      results,
      debug: {
        steps: debug.steps,
        raw_responses_count: debug.raw_responses.length
      }
    });

  } catch (error) {
    debug.errors.push(`Main error: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
      debug
    });
  }
}
