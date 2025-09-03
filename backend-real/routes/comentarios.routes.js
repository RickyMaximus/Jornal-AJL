// routes/comentarios.routes.js
import express from 'express';
import {
  criarComentario,
  listarComentarios,
  responderComentario,
  deletarComentario,
  deletarRespostaPorIndex,
  toggleLikeComentario,
  toggleLikeResposta
} from '../controllers/comentarios.controller.js';

const router = express.Router();

// Comentar / Listar
router.post('/:noticiaId', criarComentario);
router.get('/:noticiaId', listarComentarios);

// Responder um comentário
router.put('/responder/:comentarioId', responderComentario);

// Excluir um comentário
router.delete('/:noticiaId/:comentarioId', deletarComentario);

// Excluir uma resposta (por índice)
router.delete('/resposta/:noticiaId/:comentarioId/:idx', deletarRespostaPorIndex);

// Curtir/Descurtir comentário
router.post('/:noticiaId/:comentarioId/like', toggleLikeComentario);

// Curtir/Descurtir resposta
router.post('/:noticiaId/:comentarioId/respostas/:idx/like', toggleLikeResposta);

export default router;
