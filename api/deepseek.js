import fetch from 'node-fetch';

export default async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    return res.status(200).end();
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');

  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY  || process.env['deepseek-api-key'] || process.env['DEEPSEEK_API_KEY'];
  const { prompt } = await req.json();

  console.log("Received prompt:", prompt?.substring(0, 50) + "..."); // Log first 50 chars
  console.log("API Key exists:", !!DEEPSEEK_API_KEY);

  if (!DEEPSEEK_API_KEY) {
    console.error("DeepSeek API key is missing");
    return res.status(500).json({ error: "Missing DeepSeek API key" });
  }

  try {
    const response = await fetch(
      "https://api.deepseek.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that generates words for a Taboo guessing game. Always respond with valid JSON only.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 1.0,
          max_tokens: 150,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`DeepSeek API error: ${response.status} - ${errorText}`);
      throw new Error(`DeepSeek API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("No content in DeepSeek response");
    }

    console.log("Successfully generated word");
    res.json({ result: content });
  } catch (err) {
    console.error("API Error:", err);
    res.status(500).json({ error: err.message });
  }
};
