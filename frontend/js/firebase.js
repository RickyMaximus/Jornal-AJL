import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// espera config.js ter definido window.FB_CONFIG
const app = initializeApp(window.FB_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app);

// login anônimo imediato (com fallback silencioso)
const authReady = new Promise((resolve) => {
  onAuthStateChanged(auth, (user) => {
    if (user){ resolve(user); return; }
    signInAnonymously(auth)
      .then(({ user }) => resolve(user))
      .catch(err => {
        console.warn("Firebase Auth (anônimo) indisponível:", err?.message || err);
        resolve(null); // evita erro fatal na UI
      });
  });
});

window.$fb = { app, auth, db, authReady };
