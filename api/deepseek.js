export default async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Verify environment variable
    const API_KEY = process.env.DEEPSEEK_API_KEY;
    if (!API_KEY) {
      console.error('Missing API Key');
      return res.status(500).json({
        error: 'Server configuration error',
        code: 'missing_api_key'
      });
    }

    // Vercel automatically parses JSON bodies
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: 'Missing prompt parameter',
        code: 'missing_prompt'
      });
    }

    // Make API request
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{
          role: "system",
          content: "You generate Taboo game words. Respond with valid JSON containing 'guess' and 'taboo' fields."
        }, {
          role: "user",
          content: prompt
        }],
        response_format: { type: "json_object" },
        max_tokens: 300
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    // Handle response
    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API Error:', response.status, errorText);
      return res.status(502).json({
        error: 'API service unavailable',
        code: 'api_error',
        details: errorText.substring(0, 200)
      });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Server Error:', error);

    if (error.name === 'AbortError') {
      return res.status(504).json({
        error: 'API request timed out',
        code: 'timeout'
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      code: 'server_error',
      message: error.message
    });
  }
};
