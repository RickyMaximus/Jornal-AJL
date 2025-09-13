// ================================
// Core de páginas de notícia
// - contador de visitas (1 por usuário - via subcoleção visits/{uid})
// - like (toggle) com contador em tempo real
// Requer: firebase.js já ter rodado (window.$fb)
// ================================
import {
  doc, setDoc, updateDoc, getDoc, onSnapshot, increment,
  collection, setDoc as setSubDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

const waitAuth = () => window.$fb?.authReady ?? Promise.reject("Firebase não inicializado");
function $el(id){ return document.getElementById(id); }
function $$views(){ return Array.from(document.querySelectorAll('#views')); }

function setLikedUI(isLiked){
  const likeBtn = $el('likeBtn');
  const likeIcon = $el('likeIcon');
  if (!likeBtn || !likeIcon) return;
  likeBtn.classList.toggle('liked', !!isLiked);
  likeIcon.textContent = isLiked ? '♥' : '♡';
}
function setViewsUI(v){
  $$views().forEach(el => el.textContent = `Visitas: ${v ?? 0}`);
}
function setLikesUI(n){
  const likeCount = $el('likeCount');
  if (likeCount) likeCount.textContent = `${n ?? 0}`;
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

  // Incrementa visitas (1x por UID)
  try{
    const uid = auth?.currentUser?.uid || 'guest';
    const visitRef = doc(collection(pageRef, 'visits'), uid);
    const snap = await getDoc(visitRef);
    if (!snap.exists()){
      await setDoc(visitRef, { at: Date.now() });
      try{ await updateDoc(pageRef, { views: increment(1) }); }
      catch{ await setDoc(pageRef, { views: 1 }, { merge: true }); }
    }
  }catch(e){
    console.warn('views (uid) off:', e.message || e);
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
