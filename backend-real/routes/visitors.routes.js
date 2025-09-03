// routes/visitors.routes.js
import express from 'express';
import { db, FieldValue } from '../firebase.service.js';

const router = express.Router();

// Gera apelido "Visitante #N" e um visitorId simples
const randomId = () => Math.random().toString(36).slice(2, 10);

router.post('/claim', async (_req, res) => {
  try {
    const metaRef = db.collection('meta').doc('counters');
    await metaRef.set({ visitors: FieldValue.increment(1) }, { merge: true });
    const snap = await metaRef.get();
    const n = snap.data()?.visitors || 1;

    const visitorId = randomId();     // use no ?uid= e em autorId
    const alias = `Visitante #${n}`;  // exibir no site

    res.json({ visitorId, alias });
  } catch (e) {
    res.status(500).json({ erro: 'Falha ao gerar visitante', detalhe: e.message });
  }
});

export default router;
