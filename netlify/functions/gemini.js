const fetch = require('node-fetch'); // Ensure node-fetch is available

exports.handler = async function (event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };

  try {
    const { prompt, image } = JSON.parse(event.body || "{}"); // Parse 'image' as base64
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return { statusCode: 500, headers, body: JSON.stringify({ error: "API key Netlify-তে সেট করা নেই।" }) };
    if (!prompt && !image) return { statusCode: 400, headers, body: JSON.stringify({ error: "প্রম্পট বা ছবি দেওয়া হয়নি।" }) };

    // Payload for multimodal request
    const parts = [{ text: prompt || "আমাকে এই ছবি সম্পর্কে বলো।" }];
    if (image) {
      parts.push({
        inlineData: {
          data: image, // Base64 image data
          mimeType: "image/jpeg" // Adjust based on input if needed (simple assumption here)
        }
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts }] })
      }
    );

    const data = await response.json();
    if (!response.ok) return { statusCode: response.status, headers, body: JSON.stringify({ error: data.error?.message || "Gemini API error" }) };

    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
