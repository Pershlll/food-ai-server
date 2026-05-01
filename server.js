import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

const upload = multer();

const API_KEY = process.env.OPENAI_API_KEY;

app.post("/analyze", upload.single("image"), async (req, res) => {
  try {
    const base64 = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype || "image/jpeg";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                  detail: "low",
                },
              },
              {
                type: "text",
                text: `Look at this food image and identify the food items. 
Return ONLY a JSON array of English food names, nothing else.
Example: ["chicken breast", "rice", "broccoli"]
List up to 5 items. Be specific (e.g. "salmon" not "fish", "oatmeal" not "cereal").
If you cannot identify food, return: ["unknown"]`,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);
      return res.status(500).json({ error: data.error?.message || "OpenAI error" });
    }

    const content = data.choices[0].message.content.trim();

    // Парсим JSON из ответа
    let foods = [];
    try {
      // Убираем возможные markdown блоки ```json ... ```
      const clean = content.replace(/```json|```/g, "").trim();
      foods = JSON.parse(clean);
    } catch (e) {
      // Если не распарсилось — вытаскиваем слова вручную
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
