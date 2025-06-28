import fetch from 'node-fetch';

export default async (req, res) => {
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
  const { prompt } = await req.json();

  if (!DEEPSEEK_API_KEY) {
    return res.status(500).json({ error: "Missing DeepSeek API key" });
  }

  try {
    const response = await fetch(
      "https://api.deepseek.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
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
      throw new Error(`DeepSeek API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("No content in DeepSeek response");
    }

    res.json({ result: content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
