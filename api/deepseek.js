import fetch from 'node-fetch';

export default async (req, res) => {
  // Set JSON content type explicitly
  res.setHeader('Content-Type', 'application/json');

  try {
    const API_KEY = process.env.DEEPSEEK_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({
        error: "Server configuration error",
        code: "missing_api_key"
      });
    }

    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({
        error: "Missing prompt",
        code: "invalid_request"
      });
    }

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
          content: "You generate Taboo game words. Respond ONLY with valid JSON: {guess:string,taboo:string[]}"
        }, {
          role: "user",
          content: prompt
        }],
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(502).json({
        error: "API service unavailable",
        code: "api_error",
        details: error.substring(0, 200)
      });
    }

    const data = await response.json();
    return res.json(data);

  } catch (error) {
    return res.status(500).json({
      error: "Internal server error",
      code: "server_error"
    });
  }
};
