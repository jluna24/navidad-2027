import express from 'express';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { router } from './routes.js';
import { PORT } from './config.js';

const app = express();
app.use(express.json());
app.use('/api', router);

// En producción servimos el front ya compilado desde el mismo puerto
const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

// 0.0.0.0 para que otros dispositivos de la red local puedan entrar
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
