import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Config pública do seu projeto (OK no GitHub/Netlify)
const firebaseConfig = {
  apiKey: "AIzaSyBGDFfwJdn7Oqxqfvt8Y5F1eepfBgDb118",
  authDomain: "jornalajl.firebaseapp.com",
  projectId: "jornalajl",
  storageBucket: "jornalajl.firebasestorage.app",
  messagingSenderId: "958745231756",
  appId: "1:958745231756:web:f1202328fcfcdc114596a9",
  measurementId: "G-M1SYHH1V49"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
