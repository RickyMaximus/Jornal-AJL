// controllers/curtidas.controller.js
import { db, FieldValue } from '../firebase.service.js';

// Estrutura: curtidas/noticias/{noticiaId}/{uid}
const usuariosCol = (noticiaId) =>
  db.collection('curtidas').doc('noticias').collection(String(noticiaId));

// Total de curtidas da notícia
// GET /api/curtidas/noticia/:noticiaId
export async function getCurtidasNoticia(req, res) {
  try {
    const { noticiaId } = req.params;
    const total = (await usuariosCol(noticiaId).count().get()).data().count || 0;
    res.json({ total });
  } catch (e) {
    res.status(500).json({ erro: 'Falha ao contar curtidas', detalhe: e.message });
  }
}

// Toggle curtida da notícia por uid
// POST /api/curtidas/noticia/:noticiaId?uid=xxxxx
export async function toggleCurtidaNoticia(req, res) {
  try {
    const { noticiaId } = req.params;
    const uid = String(req.query.uid || 'anon');

    const ref = usuariosCol(noticiaId).doc(uid);
    const snap = await ref.get();

    if (snap.exists) {
      await ref.delete();
      const total = (await usuariosCol(noticiaId).count().get()).data().count || 0;
      return res.json({ liked: false, total });
    }

    await ref.set({ createdAt: FieldValue.serverTimestamp() });
    const total = (await usuariosCol(noticiaId).count().get()).data().count || 0;
    res.json({ liked: true, total });
  } catch (e) {
    res.status(500).json({ erro: 'Falha ao alternar curtida', detalhe: e.message });
  }
}
