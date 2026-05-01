import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

const upload = multer();

const API_KEY = process.env.GEMINI_API_KEY;

app.post("/analyze", upload.single("image"), async (req, res) => {
  try {
    const base64 = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype || "image/jpeg";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64,
                  },
                },
                {
                  text: `Look at this food image and identify the food items.
Return ONLY a JSON array of English food names, nothing else, no markdown.
Example: ["chicken breast", "rice", "broccoli"]
List up to 5 items. Be specific (e.g. "salmon" not "fish", "oatmeal" not "cereal").
If you cannot identify food, return: ["unknown"]`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 200,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini error:", JSON.stringify(data));
      return res.status(500).json({ error: data.error?.message || "Gemini error" });
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!content) {
      return res.status(500).json({ error: "Empty response from Gemini" });
    }

    let foods = [];
    try {
      const clean = content.replace(/```json|```/g, "").trim();
      foods = JSON.parse(clean);
    } catch (e) {
      foods = content
        .replace(/[\[\]"]/g, "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 5);
    }

    res.json({ foods });
  } catch (e) {
    console.error("Server error:", e);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

app.get("/", (req, res) => res.send("Food AI Server running ✅"));

app.listen(3000, () => console.log("Server running on port 3000"));
