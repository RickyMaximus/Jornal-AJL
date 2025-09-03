// backend-real/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import './firebase.service.js'; // garante Firebase inicializado 1x

import comentariosRoutes from './routes/comentarios.routes.js';
import curtidasRoutes from './routes/curtidas.routes.js';
import visitorsRoutes from './routes/visitors.routes.js';

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas da API
app.use('/api/comentarios', comentariosRoutes);
app.use('/api/curtidas', curtidasRoutes);
app.use('/api/visitors', visitorsRoutes);

// Healthcheck
app.get('/', (_req, res) => {
  res.send('✅ Backend do Jornal AJL rodando!');
});

// 404
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada', path: req.originalUrl });
});

// Erros
app.use((err, _req, res, _next) => {
  console.error('❌ Erro não tratado:', err);
  res.status(500).json({ erro: 'Erro interno do servidor', detalhe: err.message });
});

app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});
