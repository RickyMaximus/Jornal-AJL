// ====== Menu hamburguer ======
const siteNav = document.querySelector('.site-nav');
const menuToggle = document.getElementById('menuToggle');
if (siteNav && menuToggle){
  menuToggle.addEventListener('click', () => {
    siteNav.classList.toggle('open');
  });
}

// ====== Botão "Voltar ao topo" ======
(function setupBackToTop(){
  const btn = document.createElement('button');
  btn.id = 'backToTop';
  btn.title = 'Voltar ao topo';
  btn.innerText = '▲ Topo';
  document.body.appendChild(btn);

  const onScroll = () => {
    if (window.scrollY > 600) btn.classList.add('show');
    else btn.classList.remove('show');
  };
  btn.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth'}));
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();
})();

// ====== Contador de visitas da home (1 por usuário) ======
(async () => {
  try{
    if (!document.body.classList.contains('is-home')) return;

    // aguarda Firebase
    await (window.$fb?.authReady ?? Promise.resolve());
    if (!window.$fb) return;

    const { db, auth } = window.$fb;
    const { doc, setDoc, updateDoc, onSnapshot, increment, getDoc, collection } =
      await import("https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js");

    // Documento agregado de views do site
    const metaRef = doc(db, 'site', 'meta');
    await setDoc(metaRef, {}, { merge: true });

    // DEDUPE POR USUÁRIO (login anônimo) — só conta 1x por UID
    const uid = auth?.currentUser?.uid || 'guest';
    const visitRef = doc(collection(metaRef, 'visits'), uid);
    const visitSnap = await getDoc(visitRef);
    if (!visitSnap.exists()){
      await setDoc(visitRef, { at: Date.now() });
      try{ await updateDoc(metaRef, { views: increment(1) }); }
      catch{ await setDoc(metaRef, { views: 1 }, { merge: true }); }
    }

    // Exibe contador em tempo real
    const el = document.getElementById('siteViews');
    if (el){
      onSnapshot(metaRef, snap => {
        const v = snap.data()?.views || 0;
        el.textContent = `Visitantes do site: ${v}`;
      });
    }
  }catch(e){
    console.warn('Site views counter off:', e.message || e);
  }
})();
