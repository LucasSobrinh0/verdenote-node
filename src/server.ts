import cors from 'cors';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { CoreClient } from './clients/coreClient';
import { env } from './config/env';
import { DocumentGateway } from './documents/documentGateway';
import { RoomManager } from './documents/roomManager';
import { YdocStore } from './documents/ydocStore';
import { CursorStore } from './presence/cursorStore';
import { PresenceStore } from './presence/presenceStore';
import { isAllowedOrigin } from './security/originGuard';

const app = express();
app.use(cors({ origin: env.corsOrigin.split(',').map((origin) => origin.trim()), credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_request, response) => {
  response.json({ status: 'ok', service: 'verdenote-node' });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: env.corsOrigin.split(',').map((origin) => origin.trim()),
    credentials: true,
  },
  maxHttpBufferSize: 1_000_000,
});

io.use((socket, next) => {
  if (!isAllowedOrigin(socket.handshake.headers.origin)) {
    next(new Error('Origin não permitida.'));
    return;
  }
  next();
});

const gateway = new DocumentGateway(
  new RoomManager(io),
  new YdocStore(),
  new PresenceStore(),
  new CursorStore(),
  new CoreClient(),
);

io.on('connection', (socket) => {
  gateway.register(socket);
});

server.listen(env.port, () => {
  console.log(`verdenote-node listening on ${env.port}`);
});
