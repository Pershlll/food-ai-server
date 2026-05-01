import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

const upload = multer();

// 🔑 ВСТАВЬ СЮДА СВОЙ КЛЮЧ
const API_KEY = "PASTE_YOUR_CLARIFAI_KEY_HERE";

app.post("/analyze", upload.single("image"), async (req, res) => {
  try {
    const base64 = req.file.buffer.toString("base64");

    const response = await fetch(
      "https://api.clarifai.com/v2/models/food-item-recognition/outputs",
      {
        method: "POST",
        headers: {
          Authorization: `Key ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: [
            {
              data: {
                image: { base64 },
              },
            },
          ],
        }),
      }
    );

    const data = await response.json();

    const foods = data.outputs[0].data.concepts
      .slice(0, 5)
      .map((c) => c.name);

    res.json({ foods });
  } catch (e) {
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

app.listen(3000, () => {
  console.log("Server running");
});
