// front-end/JS/comentario.js  (ESM)
import { db } from "./firebase.js";
import {
  collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, doc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

function slugFromBody() {
  const el = document.body;
  return el?.dataset?.slug || (location.pathname.split("/").pop() || "noticia").replace(".html","");
}

// Identificador do dispositivo para permitir REMOVER o próprio comentário
function getDeviceId() {
  let id = localStorage.getItem("deviceId");
  if (!id) {
    id = crypto.getRandomValues(new Uint32Array(4)).join("-");
    localStorage.setItem("deviceId", id);
  }
  return id;
}

function escapeHTML(s) {
  return s.replace(/[&<>"']/g, (c)=>({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]));
}

async function addComment(slug, author, text) {
  const deviceId = getDeviceId();
  const col = collection(db, "noticias", slug, "comentarios");
  await addDoc(col, {
    author: author || "Anônimo",
    text,
    deviceId,
    createdAt: serverTimestamp()
  });
}

async function deleteComment(slug, id) {
  const ref = doc(db, "noticias", slug, "comentarios", id);
  await deleteDoc(ref);
}

function renderComments(slug) {
  const list = document.getElementById("commentsList");
  const deviceId = getDeviceId();
  const q = query(collection(db, "noticias", slug, "comentarios"), orderBy("createdAt", "desc"));

  onSnapshot(q, (snap) => {
    list.innerHTML = "";
    snap.forEach((d) => {
      const c = d.data();
      const li = document.createElement("li");
      li.className = "comment-item";
      const canDelete = c.deviceId === deviceId;

      li.innerHTML = `
        <div class="comment-head">
          <strong class="comment-author">${escapeHTML(c.author || "Anônimo")}</strong>
          <time class="comment-time">${c.createdAt?.toDate ? c.createdAt.toDate().toLocaleString() : ""}</time>
          ${canDelete ? `<button class="comment-del" data-id="${d.id}" title="Remover comentário">Excluir</button>` : ""}
        </div>
        <p class="comment-text">${escapeHTML(c.text || "")}</p>
      `;
      list.appendChild(li);
    });

    list.querySelectorAll(".comment-del").forEach(btn=>{
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        if (confirm("Remover este comentário?")) {
          try { await deleteComment(slug, id); } 
          catch(e){ alert("Não foi possível remover agora."); console.error(e); }
        }
      });
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const slug = slugFromBody();
  const form = document.getElementById("commentForm");
  const nameInput = document.getElementById("commentName");
  const textInput = document.getElementById("commentText");

  renderComments(slug);

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const author = (nameInput.value || "").trim().slice(0, 40);
    const text = (textInput.value || "").trim().slice(0, 800);
    if (!text) { textInput.focus(); return; }
    form.querySelector("button[type=submit]").disabled = true;
    try {
      await addComment(slug, author, text);
      textInput.value = "";
    } catch (err) {
      alert("Não foi possível enviar agora. Tente novamente.");
      console.error(err);
    } finally {
      form.querySelector("button[type=submit]").disabled = false;
    }
  });
});
