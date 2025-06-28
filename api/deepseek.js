import fetch from 'node-fetch';

export default async (req, res) => {
  // Debugging logs
  console.log('--- New API Request ---');
  console.log('Environment:', process.env.VERCEL_ENV);
  console.log('API Key Present:', !!process.env.DEEPSEEK_API_KEY);

  try {
    const { prompt } = await req.json();
    console.log('Prompt:', prompt?.substring(0, 100));

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that generates words for a Taboo guessing game. Respond with valid JSON only."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 150
      }),
      timeout: 10000
    });

    console.log('API Status:', response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error('API Error:', error);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log('API Response:', JSON.stringify(data).substring(0, 100));

    return res.json({ result: data.choices[0].message.content });
  } catch (error) {
    console.error('Full Error:', error);
    return res.status(500).json({
      error: error.message,
      env: process.env.VERCEL_ENV,
      keyPresent: !!process.env.DEEPSEEK_API_KEY
    });
  }
};
