// /frontend/js/auth.js  (ESM)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export const ADMIN_EMAILS = [
  "guilhermepereiradepaula11@gmail.com" // você
  // adicione mais aqui quando quiser
];

const firebaseConfig = {
  apiKey: "AIzaSyBGDFfwJdn7Oqxqfvt8Y5F1eepfBgDb118",
  authDomain: "jornalajl.firebaseapp.com",
  projectId: "jornalajl",
  storageBucket: "jornalajl.firebasestorage.app",
  messagingSenderId: "958745231756",
  appId: "1:958745231756:web:f1202328fcfcdc114596a9",
  measurementId: "G-M1SYHH1V49",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

function saveUser(u) {
  localStorage.setItem('uid', u?.uid || 'anon');
  localStorage.setItem('email', u?.email || '');
  localStorage.setItem('displayName', u?.displayName || 'Visitante');
}

function loginModal() {
  const el = document.createElement('div');
  el.className = 'modal fade';
  el.innerHTML = `
  <div class="modal-dialog modal-dialog-centered"><div class="modal-content">
    <div class="modal-header"><h5 class="modal-title">Entrar no Jornal AJL</h5></div>
    <div class="modal-body">
      <p>Faça login com a sua conta Google para comentar e curtir.</p>
      <button class="btn btn-primary w-100" id="btnGoogle">Entrar com Google</button>
    </div>
  </div></div>`;
  document.body.appendChild(el);
  const m = new bootstrap.Modal(el, { backdrop: 'static', keyboard: false });
  el.querySelector('#btnGoogle').onclick = async () => {
    await signInWithPopup(auth, provider);
    m.hide();
    el.remove();
  };
  m.show();
}

export async function ensureLogin() {
  return new Promise(resolve => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        saveUser(user);
        resolve(user);
      } else {
        loginModal();
        // resolve quando logar – onAuthStateChanged chamará de novo
      }
    });
  });
}

export async function doLogout() {
  await signOut(auth);
  saveUser(null);
}
