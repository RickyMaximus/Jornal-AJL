import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import comentariosRoutes from './routes/comentarios.routes.js';
import curtidasRoutes from './routes/curtidas.routes.js';
import errorHandler from './middlewares/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/comentarios', comentariosRoutes);
app.use('/api/curtidas', curtidasRoutes);

// middleware global de erro
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🔥 Servidor rodando em http://localhost:${PORT}`);
});
