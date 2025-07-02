require('dotenv').config();
const { handleAudioChat } = require('./openaiClient');
const admin = require('./firebaseFeatures');

async function testIntegration() {
  try {
    // Use your actual audio file name here
    const audioFilePath = 'test_audio.wav';
    const response = await handleAudioChat(audioFilePath);
    console.log('Chat response:', response);

    // Save to Firestore
    await admin.firestore().collection('audioChats').add({
      audioFile: audioFilePath,
      response: response,
      timestamp: new Date()
    });
    console.log('Saved to Firebase Firestore!');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testIntegration();