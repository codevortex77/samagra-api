export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Samagra Intel API</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
        }
        h2 { color: #333; }
        code {
          background: #f4f4f4;
          padding: 5px 10px;
          border-radius: 3px;
        }
        .example {
          background: #f9f9f9;
          padding: 15px;
          border-left: 4px solid #0070f3;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <h2>🔍 Samagra Intel API</h2>
      <p>Get citizen details using mobile number from Samagra Portal</p>
      
      <div class="example">
        <strong>Usage:</strong><br>
        <code>GET /api/search?mobile=XXXXXXXXXX</code>
      </div>
      
      <div class="example">
        <strong>Example:</strong><br>
        <a href="/api/search?mobile=9876543210">/api/search?mobile=9876543210</a>
      </div>
      
      <p><strong>Response Format:</strong></p>
      <pre>
{
  "count": 1,
  "results": [
    {
      "uid": "12345678",
      "name": "John Doe",
      "dob": "01/01/1990",
      "gender": "Male",
      "mobile": "9876543210",
      "address": "123 Main St",
      "district": "Bhopal",
      "category": "General",
      "photo": "data:image/jpeg;base64,..."
    }
  ]
}
      </pre>
    </body>
    </html>
  `);
}
