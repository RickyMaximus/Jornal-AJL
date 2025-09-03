// controllers/comentarios.controller.js
import { db, FieldValue } from '../firebase.service.js';

// Coleção auxiliar
const commentsCol = (noticiaId) =>
  db.collection('comentarios').doc(String(noticiaId)).collection('lista');

// =========================================
// Criar comentário
// POST /api/comentarios/:noticiaId
// body: { autor, texto, uid }
// =========================================
export async function criarComentario(req, res) {
  try {
    const { noticiaId } = req.params;
    const { autor = 'Visitante', texto = '', uid = 'anon' } = req.body;

    if (!String(texto).trim()) {
      return res.status(400).json({ erro: 'Texto é obrigatório' });
    }

    const novo = {
      autor,
      autorId: uid,          // quem escreveu (Visitante# ou user id)
      texto,
      criadoEm: FieldValue.serverTimestamp(),
      respostas: [],         // array de { autor, autorId, texto, criadoEm, likes[], curtidas }
      likes: [],             // array de uids
      curtidas: 0
    };

    await commentsCol(noticiaId).add(novo);
    res.status(201).json({ mensagem: 'Comentário adicionado!' });
  } catch (e) {
    res.status(500).json({ erro: 'Falha ao criar comentário', detalhe: e.message });
  }
}

// =========================================
/* Listar comentários (ordenados por criadoEm asc)
   GET /api/comentarios/:noticiaId */
// =========================================
export async function listarComentarios(req, res) {
  try {
    const { noticiaId } = req.params;
    const snap = await commentsCol(noticiaId).orderBy('criadoEm', 'asc').get();
    const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(lista);
  } catch (e) {
    res.status(500).json({ erro: 'Falha ao listar comentários', detalhe: e.message });
  }
}

// =========================================
/* Responder comentário (push em respostas[])
   PUT /api/comentarios/responder/:comentarioId
   body: { noticiaId, autor, texto, uid } */
// =========================================
export async function responderComentario(req, res) {
  try {
    const { comentarioId } = req.params;
    const { noticiaId, autor = 'Visitante', texto = '', uid = 'anon' } = req.body;

    if (!String(texto).trim()) {
      return res.status(400).json({ erro: 'Texto é obrigatório' });
    }

    const ref = commentsCol(noticiaId).doc(comentarioId);
    await ref.update({
      respostas: FieldValue.arrayUnion({
        autor,
        autorId: uid,
        texto,
        criadoEm: FieldValue.serverTimestamp(),
        likes: [],
        curtidas: 0
      })
    });

    res.json({ mensagem: 'Resposta adicionada!' });
  } catch (e) {
    res.status(500).json({ erro: 'Falha ao responder', detalhe: e.message });
  }
}

// =========================================
/* Deletar comentário
   DELETE /api/comentarios/:noticiaId/:comentarioId
   (beta: sem checagem de dono/adm) */
// =========================================
export async function deletarComentario(req, res) {
  try {
    const { noticiaId, comentarioId } = req.params;
    await commentsCol(noticiaId).doc(comentarioId).delete();
    res.json({ mensagem: 'Comentário excluído!' });
  } catch (e) {
    res.status(500).json({ erro: 'Falha ao excluir comentário', detalhe: e.message });
  }
}

// =========================================
/* Deletar resposta (por índice)
   DELETE /api/comentarios/resposta/:noticiaId/:comentarioId/:idx */
// =========================================
export async function deletarRespostaPorIndex(req, res) {
  try {
    const { noticiaId, comentarioId, idx } = req.params;
    const i = Number(idx);
    if (Number.isNaN(i) || i < 0) return res.status(400).json({ erro: 'Índice inválido' });

    const ref = commentsCol(noticiaId).doc(comentarioId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error('Comentário não encontrado');

      const data = snap.data() || {};
      const respostas = Array.isArray(data.respostas) ? [...data.respostas] : [];
      if (i >= respostas.length) throw new Error('Índice fora do intervalo');

      respostas.splice(i, 1);
      tx.update(ref, { respostas });
    });

    res.json({ mensagem: 'Resposta excluída!' });
  } catch (e) {
    res.status(500).json({ erro: 'Falha ao excluir resposta', detalhe: e.message });
  }
}

// =========================================
/* Curtir/Descurtir comentário (toggle por uid)
   POST /api/comentarios/:noticiaId/:comentarioId/like?uid=xxxxx */
// =========================================
export async function toggleLikeComentario(req, res) {
  try {
    const { noticiaId, comentarioId } = req.params;
    const uid = String(req.query.uid || 'anon');

    const ref = commentsCol(noticiaId).doc(comentarioId);

    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error('Comentário não encontrado');

      const data = snap.data() || {};
      const likes = Array.isArray(data.likes) ? [...data.likes] : [];
      const pos = likes.indexOf(uid);
      let liked;

      if (pos >= 0) { likes.splice(pos, 1); liked = false; }
      else { likes.push(uid); liked = true; }

      tx.update(ref, { likes, curtidas: likes.length });
      return { liked, total: likes.length };
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({ erro: 'Falha no like do comentário', detalhe: e.message });
  }
}

// =========================================
/* Curtir/Descurtir resposta (toggle por uid)
   POST /api/comentarios/:noticiaId/:comentarioId/respostas/:idx/like?uid=xxxxx */
// =========================================
export async function toggleLikeResposta(req, res) {
  try {
    const { noticiaId, comentarioId, idx } = req.params;
    const uid = String(req.query.uid || 'anon');
    const i = Number(idx);
    if (Number.isNaN(i) || i < 0) return res.status(400).json({ erro: 'Índice inválido' });

    const ref = commentsCol(noticiaId).doc(comentarioId);

    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error('Comentário não encontrado');

      const data = snap.data() || {};
      const respostas = Array.isArray(data.respostas) ? [...data.respostas] : [];
      if (i >= respostas.length) throw new Error('Índice fora do intervalo');

      const r = respostas[i] || {};
      const likes = Array.isArray(r.likes) ? [...r.likes] : [];
      const pos = likes.indexOf(uid);

      let liked;
      if (pos >= 0) { likes.splice(pos, 1); liked = false; }
      else { likes.push(uid); liked = true; }

      respostas[i] = { ...r, likes, curtidas: likes.length };
      tx.update(ref, { respostas });

      return { liked, total: likes.length };
    });

    res.json(result);
  } catch (e) {
    res.status(500).json({ erro: 'Falha no like da resposta', detalhe: e.message });
  }
}
