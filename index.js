const admin = require("firebase-admin");
const dotenv = require("dotenv");
dotenv.config();

const { getChatResponse, transcribeAudio, speakText } = require("./openaiClient");

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
  const did = req.body.did; // 🔥 new: chat/session id

  if (!uid || !did) {
    return res.status(400).json({ error: "Missing user ID or session ID" });
  }

  // 🔥 Fetch last 20 messages for this chat
  const sessionRef = admin.firestore()
    .collection("users")
    .doc(uid)
    .collection(did)
    .doc("sessions")
    .collection("chats")
    .orderBy("createdAt", "asc")
    .limit(20);

  const snapshot = await sessionRef.get();
  const history = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.userInput) history.push({ role: "user", content: data.userInput });
    if (data.reply) history.push({ role: "assistant", content: data.reply });
  });

  history.push({ role: "user", content: userInput });

  const reply = await getChatResponse(history);

  await admin.firestore()
    .collection("users")
    .doc(uid)
    .collection(did)
    .doc("sessions")
    .collection("chats")
    .add({
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