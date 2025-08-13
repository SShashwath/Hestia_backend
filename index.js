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

async function listChats(req, res) {
  const { uid } = req.params;
  if (!uid) {
    return res.status(400).json({ error: "Missing user ID" });
  }

  try {
    const userRef = admin.firestore().collection("users").doc(uid);
    const collections = await userRef.listCollections();
    
    const chatList = collections
      .map(collection => {
        if (collection.id.startsWith('chat-')) {
          return { id: collection.id, title: collection.id };
        }
        return null;
      })
      .filter(chat => chat !== null);

    chatList.sort((a, b) => {
        const timeA = parseInt(a.id.split('-')[1] || 0);
        const timeB = parseInt(b.id.split('-')[1] || 0);
        return timeB - timeA;
    });

    return res.json(chatList);
  } catch (error) {
    console.error("Error listing chats:", error);
    return res.status(500).json({ error: "Failed to retrieve chat history." });
  }
}

async function getChatMessages(req, res) {
  const { uid, chatId } = req.params;
  if (!uid || !chatId) {
    return res.status(400).json({ error: "Missing user or chat ID" });
  }

  try {
    const messagesRef = admin.firestore()
      .collection("users").doc(uid)
      .collection(chatId).doc("sessions")
      .collection("chats").orderBy("createdAt", "asc");
    
    const snapshot = await messagesRef.get();
    const messages = [];
    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.userInput) {
            messages.push({ sender: "User", text: data.userInput });
        }
        if (data.reply) {
            messages.push({ sender: "Hestia", text: data.reply });
        }
    });

    return res.json(messages);
  } catch (error) {
    console.error("Error getting messages:", error);
    return res.status(500).json({ error: "Failed to retrieve messages." });
  }
}

module.exports = { chat, transcribe, speak, listChats, getChatMessages };