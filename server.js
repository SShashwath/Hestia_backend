const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const { chat, transcribe, speak } = require("./index");
const { handleAudioChat } = require("./openaiClient");

const upload = multer({ dest: "uploads/" });

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Serve uploaded audio files publicly
app.use('/uploads', express.static('uploads'));

app.post("/chat", chat);
app.post("/transcribe", transcribe);
app.post("/speak", speak);

app.get("/keep-alive", (req, res) => {
  res.send("Server is awake.");
});

app.post("/api/audio-chat", upload.single("audio"), async (req, res) => {
  try {
    // ✅ Ensure correct file extension
    const ext = path.extname(req.file.originalname) || ".mp3";
    const newPath = req.file.path + ext;
    fs.renameSync(req.file.path, newPath);

    // ✅ Process with OpenAI
    const result = await handleAudioChat(newPath);

    // ✅ Adjust ttsPath so it's a proper URL
    result.ttsPath = `/uploads/${path.basename(result.ttsPath)}`;

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));