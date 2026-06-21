export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Samagra Intel API</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        code { background: #f4f4f4; padding: 5px 10px; border-radius: 3px; }
        .success { color: green; }
      </style>
    </head>
    <body>
      <h2>🔍 Samagra Intel API</h2>
      <p class="success">✅ API is running!</p>
      <p><strong>Search by mobile:</strong></p>
      <code>GET /api/search?mobile=XXXXXXXXXX</code>
      <p><strong>Get photo:</strong></p>
      <code>GET /api/photos/{member_id}</code>
    </body>
    </html>
  `);
}
