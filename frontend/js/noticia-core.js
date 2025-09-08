// ================================
// Core de páginas de notícia
// - contador de visitas (com dedupe 12h por dispositivo)
// - like (toggle) com contador em tempo real
// Requer: firebase.js já ter rodado (window.$fb)
// ================================
import {
  doc, setDoc, updateDoc, getDoc, onSnapshot, increment,
  collection, setDoc as setSubDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

const waitAuth = () => window.$fb?.authReady ?? Promise.reject("Firebase não inicializado");
function $el(id){ return document.getElementById(id); }

function setLikedUI(isLiked){
  const likeBtn = $el('likeBtn');
  const likeIcon = $el('likeIcon');
  if (!likeBtn || !likeIcon) return;
  likeBtn.classList.toggle('liked', !!isLiked);
  likeIcon.textContent = isLiked ? '♥' : '♡';
}
function setViewsUI(v){ const views = $el('views'); if (views) views.textContent = `Visitas: ${v ?? 0}`; }
function setLikesUI(n){ const likeCount = $el('likeCount'); if (likeCount) likeCount.textContent = `${n ?? 0}`; }

/** throttle simples: 1 visita por slug a cada 12h por dispositivo */
function shouldCountView(slug){
  try{
    const key = `cjlv:view:${slug}`;
    const last = Number(localStorage.getItem(key) || 0);
    const now = Date.now();
    const DOZE_H = 12 * 60 * 60 * 1000;
    if (now - last > DOZE_H){
      localStorage.setItem(key, String(now));
      return true;
    }
    return false;
  }catch{ return true; }
}

/**
 * Inicializa recursos de uma página de artigo.
 * @param {{slug:string, title?:string}} opts
 */
export async function initArticlePage(opts){
  const { slug, title } = opts || {};
  if (!slug) throw new Error("slug obrigatório em initArticlePage");

  await waitAuth();
  const { db, auth } = window.$fb;

  // Garante documento da página
  const pageRef = doc(db, 'pages', slug);
  await setDoc(pageRef, { title: title || slug }, { merge: true });

  // Incrementa visitas (com dedupe)
  if (shouldCountView(slug)){
    try{
      await updateDoc(pageRef, { views: increment(1) });
    }catch(e){
      await setDoc(pageRef, { views: 1 }, { merge: true });
    }
  }

  // Observa contador (views e likesCount) em tempo real
  onSnapshot(pageRef, snap => {
    const data = snap.data() || {};
    setViewsUI(data.views || 0);
    setLikesUI(data.likesCount || 0);
  });

  // Like (toggle)
  const likeBtn = $el('likeBtn');
  if (likeBtn){
    // garante que temos um UID (pode vir nulo se auth anônima estiver off)
    const uid = window.$fb?.auth?.currentUser?.uid || 'guest';
    const likeRef = doc(collection(pageRef, 'likes'), uid);

    // Estado inicial
    const likedSnap = await getDoc(likeRef);
    setLikedUI(likedSnap.exists());

    likeBtn.addEventListener('click', async () => {
      const snap = await getDoc(likeRef);
      if (snap.exists()){
        // Descurtir
        await deleteDoc(likeRef);
        try{ await updateDoc(pageRef, { likesCount: increment(-1) }); } catch {}
        setLikedUI(false);
      }else{
        // Curtir
        await setSubDoc(likeRef, { at: Date.now() });
        try{ await updateDoc(pageRef, { likesCount: increment(1) }); }
        catch{ await setDoc(pageRef, { likesCount: 1 }, { merge: true }); }
        setLikedUI(true);
      }
    });
  }
}
