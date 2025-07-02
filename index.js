const admin = require("firebase-admin");
const dotenv = require("dotenv");
dotenv.config();

const { filterTherapy } = require("./filters");
const { getChatResponse } = require("./openaiClient");


admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

async function chat(req, res) {
  const userInput = req.body.text;
  //if (!filterTherapy(userInput)) {
    //return res.json({ message: "Sorry, I can only help with therapy-related topics." });
  //}

  const reply = await getChatResponse(userInput);

  await admin.firestore().collection("sessions").add({
    userInput,
    reply,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return res.json({ reply });
}

async function transcribe(req, res) {
  const audioUrl = req.body.audioUrl;
  const text = await transcribeAudio(audioUrl);

  await admin.firestore().collection("transcriptions").add({
    audioUrl,
    text,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return res.json({ text });
}

async function speak(req, res) {
  const text = req.body.text;
  const audioUrl = await speakText(text);

  await admin.firestore().collection("speech").add({
    text,
    audioUrl,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return res.json({ audioUrl });
}

module.exports = { chat, transcribe, speak };