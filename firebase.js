import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBtRo5rKlyjOeOlOz6Yja7CH6fx87zW4dU",
  authDomain: "hestia-3786d.firebaseapp.com",
  projectId: "hestia-3786d",
  // ...other config
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);