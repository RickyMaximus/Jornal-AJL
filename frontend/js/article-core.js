
import {
  doc, getDoc, setDoc, updateDoc, increment,
  collection, getCountFromServer, deleteDoc, query, where, getDocs, addDoc
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

const { db, authReady } = window.$fb;

async function getUid() {
  const u = await authReady; 
  return u.uid;
}

async function ensureArticle(slug, data) {
  const ref = doc(db, "articles", slug);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { title: data.title || slug, createdAt: Date.now(), likesCount: 0, visitsCount: 0 });
  }
  return ref;
}

async function incVisitOnce(articleRef) {
  const uid = await getUid();
  const vRef = doc(articleRef, "visits", uid);
  const vSnap = await getDoc(vRef);
  if (!vSnap.exists()) {
    await setDoc(vRef, { at: Date.now() });
    await updateDoc(articleRef, { visitsCount: increment(1) });
  }
}

async function likeToggle(articleRef, desired) {
  const uid = await getUid();
  const lRef = doc(articleRef, "likes", uid);
  const lSnap = await getDoc(lRef);
  if (desired) {
    if (!lSnap.exists()) {
      await setDoc(lRef, { at: Date.now() });
      await updateDoc(articleRef, { likesCount: increment(1) });
    }
  } else {
    if (lSnap.exists()) {
      await deleteDoc(lRef);
      await updateDoc(articleRef, { likesCount: increment(-1) });
    }
  }
}

async function getCounts(articleRef) {
  const aSnap = await getDoc(articleRef);
  const data = aSnap.data() || {};
  return {
    likes: data.likesCount || 0,
    visits: data.visitsCount || 0
  };
}

/** Comentários */
async function addComment(articleRef, text) {
  const uid = await getUid();
  const cCol = collection(articleRef, "comments");
  await addDoc(cCol, { text, uid, at: Date.now() });
}
async function removeOwnComment(articleRef, commentId, ownerUid) {
  const uid = await getUid();
  if (uid !== ownerUid) return; // só remove o próprio
  await deleteDoc(doc(articleRef, "comments", commentId));
}
async function listComments(articleRef) {
  const cCol = collection(articleRef, "comments");
  const q = query(cCol);
  const snap = await getDocs(q);
  const out = [];
  snap.forEach(d => out.push({ id: d.id, ...d.data() }));
  // mais novo por último
  out.sort((a,b) => a.at - b.at);
  return out;
}

/** Hook para páginas de artigo */
export async function initArticlePage({ slug, title }) {
  const articleRef = await ensureArticle(slug, { title });

  // Visita única por usuário
  await incVisitOnce(articleRef);

  // Render contadores
  const counters = await getCounts(articleRef);
  const viewsEl = document.getElementById("views");
  const likesCountEl = document.getElementById("likesCount");
  if (viewsEl) viewsEl.textContent = `Visitas: ${counters.visits}`;
  if (likesCountEl) likesCountEl.textContent = counters.likes;

  // Estado do like inicial
  const uid = await getUid();
  const likedSnap = await getDoc(doc(articleRef, "likes", uid));
  const likeBtn = document.getElementById("btnLike");
  const unlikeBtn = document.getElementById("btnUnlike");

  function setLikeUI(liked) {
    if (likeBtn) likeBtn.classList.toggle("active", liked);
    if (unlikeBtn) unlikeBtn.classList.toggle("active", !liked);
  }
  setLikeUI(likedSnap.exists());

  if (likeBtn) likeBtn.addEventListener("click", async () => {
    await likeToggle(articleRef, true);
    const c = await getCounts(articleRef);
    likesCountEl.textContent = c.likes;
    setLikeUI(true);
  });
  if (unlikeBtn) unlikeBtn.addEventListener("click", async () => {
    await likeToggle(articleRef, false);
    const c = await getCounts(articleRef);
    likesCountEl.textContent = c.likes;
    setLikeUI(false);
  });

  // Comentários
  const form = document.getElementById("commentForm");
  const input = document.getElementById("commentInput");
  const list = document.getElementById("commentList");

  async function refreshComments(){
    if (!list) return;
    list.innerHTML = "";
    const items = await listComments(articleRef);
    const myUid = await getUid();
    items.forEach(c => {
      const li = document.createElement("li");
      li.className = "comment-item";
      li.innerHTML = `
        <span class="comment-text">${c.text}</span>
        ${c.uid === myUid ? `<button class="comment-remove" data-id="${c.id}" data-owner="${c.uid}">remover</button>` : ""}
      `;
      list.appendChild(li);
    });
    list.querySelectorAll(".comment-remove").forEach(btn=>{
      btn.addEventListener("click", async (e)=>{
        const id = e.currentTarget.dataset.id;
        const owner = e.currentTarget.dataset.owner;
        await removeOwnComment(articleRef, id, owner);
        refreshComments();
      });
    });
  }

  if (form && input) {
    form.addEventListener("submit", async (e)=>{
      e.preventDefault();
      const t = (input.value || "").trim();
      if (!t) return;
      await addComment(articleRef, t);
      input.value = "";
      refreshComments();
    });
  }

  refreshComments();
}

