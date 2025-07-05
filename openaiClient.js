const { OpenAI } = require("openai");
const fs = require("fs");
const multer = require("multer");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function transcribeAudio(audioFilePath) {
  const resp = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioFilePath),
    model: "whisper-1",
  });
  return resp.text;
}

async function getChatResponse(messages) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a kind, empathetic therapy assistant. Give short replies unless otherwise mentioned. ONLY REPLY TO THERAPY RELATED QUESTIONS. If user asks non-therapy topics, politely say you can only help with therapy." },
      ...messages
    ],
  });
  return completion.choices[0].message.content;
}


// Example usage:
async function textToSpeech(text, outputFilePath) {
  const response = await openai.audio.speech.create({
    model: "tts-1",
    voice: "nova",
    input: text,
  });
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputFilePath, buffer);
  return outputFilePath;
}

async function handleAudioChat(audioFilePath) {
  const text = await transcribeAudio(audioFilePath);
  const response = await getChatResponse(text);
  // Always create a new audio file for the chat response
  const ttsPath = audioFilePath.replace(/\.wav$/, '_response.mp3');
  await textToSpeech(response, ttsPath);
  return { response, ttsPath };
}

module.exports = { transcribeAudio, getChatResponse, handleAudioChat };

let mediaRecorder;
let audioChunks = [];

function startRecording() {
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();
    mediaRecorder.ondataavailable = event => {
      audioChunks.push(event.data);
    };
  });
}

function stopRecording() {
  mediaRecorder.stop();
  mediaRecorder.onstop = () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.wav');
    fetch('/api/audio-chat', { method: 'POST', body: formData });
    audioChunks = [];
  };
}

module.exports = { transcribeAudio, getChatResponse, handleAudioChat };