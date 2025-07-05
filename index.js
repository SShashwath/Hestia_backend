const admin = require("firebase-admin");
const dotenv = require("dotenv");
dotenv.config();

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
  const uid = req.body.uid;

  if (!uid) {
    return res.status(400).json({ error: "Missing user ID" });
  }

  const reply = await getChatResponse(userInput);

  await admin.firestore()
    .collection("users")
    .doc(uid)
    .collection("sessions")
    .add({
      userInput,
      reply,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

  return res.json({ reply });
}

// Your transcribe and speak endpoints remain unchanged
module.exports = { chat, transcribe, speak };