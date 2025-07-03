import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../your-auth-context"; // however you get the current user

export default function Chat() {
  const { currentUser } = useAuth(); // get the logged-in user
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    const chatCollection = collection(db, "users", currentUser.uid, "chat_sessions");
    const q = query(chatCollection, orderBy("createdAt"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setMessages(querySnapshot.docs.map(doc => doc.data()));
    });
    return unsubscribe;
  }, [currentUser]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !currentUser) return;
    const chatCollection = collection(db, "users", currentUser.uid, "chat_sessions");
    // Save user message
    await addDoc(chatCollection, {
      text: input,
      sender: "user",
      createdAt: serverTimestamp(),
    });
    // Get AI response using chat history
    const aiReply = await getAIResponse([...messages, { text: input, sender: "user" }]);
    // Save AI response
    await addDoc(chatCollection, {
      text: aiReply,
      sender: "ai",
      createdAt: serverTimestamp(),
    });
    setInput("");
  };

  async function getAIResponse(messages) {
    // You might want to send only the last N messages for efficiency
    const context = messages.slice(-10); // last 10 messages
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context }),
    });
    const data = await response.json();
    return data.reply;
  }

  return (
    <div>
      <div>
        {messages.map((msg, idx) => (
          <div key={idx}><b>{msg.sender}:</b> {msg.text}</div>
        ))}
      </div>
      <form onSubmit={sendMessage}>
        <input value={input} onChange={e => setInput(e.target.value)} />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}