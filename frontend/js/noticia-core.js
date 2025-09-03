import {
  getFirestore, doc, getDoc, setDoc, updateDoc, increment,
  collection, addDoc, query, orderBy, onSnapshot, serverTimestamp,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "./firebase.js";

function deviceId() {
  let id = localStorage.getItem("device:id");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("device:id", id); }
  return id;
}

async function ensureArticle(ref, title) {
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { title: title || "", likes: 0, views: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  }
}

function bumpViewsOnce(ref, slug) {
  const today = new Date().toISOString().slice(0,10);
  const key = `viewed:${slug}:${today}`;
  if (!localStorage.getItem(key)) {
    updateDoc(ref, { views: increment(1), updatedAt: serverTimestamp() }).catch(()=>{});
    localStorage.setItem(key, "1");
  }
}

export async function initArticlePage({ slug, title }) {
  const ref = doc(getFirestore(), "articles", slug);
  await ensureArticle(ref, title);
  bumpViewsOnce(ref, slug);

  const likeBtn = document.getElementById("likeBtn");
  const likeIcon = document.getElementById("likeIcon");
  const likeCount = document.getElementById("likeCount");
  const viewsEl = document.getElementById("views");
  const devId = deviceId();

  async function refresh() {
    const s = await getDoc(ref);
    const d = s.exists() ? s.data() : { likes: 0, views: 0 };
    if (likeCount) likeCount.textContent = d.likes || 0;
    if (viewsEl) viewsEl.textContent = `Visitas: ${d.views || 0}`;
    const liked = localStorage.getItem(`liked:${slug}`) === "1";
    if (likeBtn) likeBtn.setAttribute("aria-pressed", liked ? "true" : "false");
    if (likeIcon) likeIcon.textContent = liked ? "❤" : "♡";
  }
  await refresh();

  if (likeBtn) {
    likeBtn.addEventListener("click", async () => {
      const liked = localStorage.getItem(`liked:${slug}`) === "1";
      await updateDoc(ref, { likes: increment(liked ? -1 : 1), updatedAt: serverTimestamp() });
      localStorage.setItem(`liked:${slug}`, liked ? "0" : "1");
      refresh();
    });
  }

  // Comentários
  const form = document.getElementById("commentForm");
  const input = document.getElementById("commentInput");
  const list = document.getElementById("commentList");
  const commentsCol = collection(ref, "comments");

  if (form && input && list) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const text = (input.value || "").trim();
      if (!text) return;
      await addDoc(commentsCol, { text, createdAt: serverTimestamp(), deviceId: devId });
      input.value = "";
    });

    const q = query(commentsCol, orderBy("createdAt", "desc"));
    onSnapshot(q, (snap) => {
      list.innerHTML = "";
      snap.forEach((d) => {
        const li = document.createElement("li");
        li.className = "comment-item";
        li.innerHTML = `<span>${d.data().text || ""}</span>`;
        if ((d.data().deviceId || "") === devId) {
          const del = document.createElement("button");
          del.className = "btn btn-small btn-danger";
          del.textContent = "Remover";
          del.addEventListener("click", async () => { await deleteDoc(d.ref); });
          li.appendChild(del);
        }
        list.appendChild(li);
      });
    });
  }
}
