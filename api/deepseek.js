import fetch from 'node-fetch';

export default async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Verify environment variable
    const API_KEY = process.env.DEEPSEEK_API_KEY;
    if (!API_KEY) {
      console.error('API key missing in environment');
      return res.status(500).json({
        error: 'Server configuration error - API key not found',
        status: 'missing_key'
      });
    }

    // Parse request body
    const { prompt } = await req.json();
    if (!prompt) {
      return res.status(400).json({
        error: 'Missing prompt in request',
        status: 'missing_prompt'
      });
    }

    // Log request details (for debugging)
    console.log('Making request to DeepSeek API with prompt:', prompt.substring(0, 50) + '...');

    // Make API request
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that generates words for a Taboo guessing game. Respond with valid JSON only containing 'guess' and 'taboo' fields."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 150,
        response_format: { type: "json_object" }
      }),
      timeout: 10000
    });

    // Handle response
    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', response.status, errorText);
      return res.status(502).json({
        error: `DeepSeek API error: ${response.status}`,
        status: 'api_error',
        details: errorText.substring(0, 200)
      });
    }

    const data = await response.json();
    console.log('Received response:', JSON.stringify(data).substring(0, 100));

    return res.json({
      result: data.choices[0].message.content,
      status: 'success'
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      error: error.message,
      status: 'server_error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
