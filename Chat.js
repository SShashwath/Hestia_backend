import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDocs,
  setDoc,
  getDoc
} from "firebase/firestore";
import { useAuth } from "../AuthContext";

export default function Chat() {
  const { currentUser } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [userName, setUserName] = useState("");

  // Fetch all sessions for the user
  useEffect(() => {
    if (!currentUser) return;
    const sessionsRef = collection(db, "users", currentUser.uid, "sessions");
    const q = query(sessionsRef, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const sessionList = [];
      querySnapshot.forEach(doc => {
        sessionList.push({ id: doc.id, ...doc.data() });
      });
      setSessions(sessionList);
      // Optionally auto-select the most recent session
      if (!activeSessionId && sessionList.length > 0) {
        setActiveSessionId(sessionList[0].id);
      }
    });
    return unsubscribe;
  }, [currentUser]);

  // Fetch messages for the active session
  useEffect(() => {
    if (!currentUser || !activeSessionId) return;
    const messagesRef = collection(db, "users", currentUser.uid, "sessions", activeSessionId, "messages");
    const q = query(messagesRef, orderBy("createdAt"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setMessages(querySnapshot.docs.map(doc => doc.data()));
    });
    return unsubscribe;
  }, [currentUser, activeSessionId]);

  // Fetch user document to get the user name
  useEffect(() => {
    const fetchUserName = async () => {
      if (!currentUser) return;
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        setUserName(userDoc.data().name);
      }
    };
    fetchUserName();
  }, [currentUser]);

  // Start a new session
  const handleNewSession = async () => {
    if (!currentUser) return;
    const sessionsRef = collection(db, "users", currentUser.uid, "sessions");
    const newSession = await addDoc(sessionsRef, {
      title: `Session ${sessions.length + 1}`,
      createdAt: serverTimestamp(),
    });
    setActiveSessionId(newSession.id);
    setMessages([]);
  };

  // Send a message in the active session
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !currentUser || !activeSessionId) return;
    const messagesRef = collection(db, "users", currentUser.uid, "sessions", activeSessionId, "messages");
    // Save user message
    await addDoc(messagesRef, {
      text: input,
      sender: "user",
      createdAt: serverTimestamp(),
    });
    // Get AI response using chat history
    const aiReply = await getAIResponse([...messages, { text: input, sender: "user" }]);
    // Save AI response
    await addDoc(messagesRef, {
      text: aiReply,
      sender: "ai",
      createdAt: serverTimestamp(),
    });
    setInput("");
  };

  async function getAIResponse(messages) {
    const context = messages.slice(-10);
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context }),
    });
    const data = await response.json();
    return data.reply;
  }

  return (
    <div className="flex">
      {/* Sidebar for chat history */}
      <aside className="w-64 bg-gray-900 text-white h-screen p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Chat History</h2>
          <button onClick={handleNewSession}>New Chat</button>
        </div>
        <ul>
          {sessions.map(session => (
            <li
              key={session.id}
              className={`p-2 cursor-pointer ${activeSessionId === session.id ? "bg-gray-700" : ""}`}
              onClick={() => setActiveSessionId(session.id)}
            >
              {session.title || "Untitled"}
              <br />
              <span className="text-xs text-gray-400">
                {session.createdAt?.toDate().toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </aside>
      {/* Main chat area */}
      <main className="flex-1 p-4">
        <div>
          {messages.map((msg, idx) => (
            <div key={idx}><b>{msg.sender}:</b> {msg.text}</div>
          ))}
        </div>
        <form onSubmit={sendMessage}>
          <input value={input} onChange={e => setInput(e.target.value)} />
          <button type="submit">Send</button>
        </form>
      </main>
    </div>
  );
}

// Set user document in Firestore
export async function setUserDoc(user) {
  await setDoc(doc(db, "users", user.uid), {
    name: user.displayName, // or user-chosen name
    email: user.email,
    // ...other info
  });
}