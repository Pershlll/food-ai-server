import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

const upload = multer();

// Ваш новый Personal Access Token (PAT)
const API_KEY = "c23285902351402083b41e3dd0103354";

app.post("/analyze", upload.single("image"), async (req, res) => {
  try {
    const base64 = req.file.buffer.toString("base64");

    const response = await fetch(
      "https://api.clarifai.com/v2/models/food-item-recognition/outputs",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`, // ← изменено с Key на Bearer
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
