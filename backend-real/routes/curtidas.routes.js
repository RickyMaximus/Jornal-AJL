// routes/curtidas.routes.js
import express from 'express';
import {
  getCurtidasNoticia,
  toggleCurtidaNoticia
} from '../controllers/curtidas.controller.js';

const router = express.Router();

// Total de curtidas da notícia
router.get('/noticia/:noticiaId', getCurtidasNoticia);

// Toggle curtida da notícia (?uid=xxxx)
router.post('/noticia/:noticiaId', toggleCurtidaNoticia);

export default router;
