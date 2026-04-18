import { Socket } from 'socket.io';
import * as Y from 'yjs';
import { CoreClient } from '../clients/coreClient';
import { JoinPayload, socketEvents, TicketValidation, UpdatePayload } from '../events/eventTypes';
import { CursorStore } from '../presence/cursorStore';
import { PresenceStore } from '../presence/presenceStore';
import { documentRoom, RoomManager } from './roomManager';
import { YdocStore } from './ydocStore';

type SocketData = {
  ticket?: string;
  validation?: TicketValidation;
};

const UPDATE_LIMIT_WINDOW_MS = 10_000;
const MAX_UPDATES_PER_WINDOW = 60;

export class DocumentGateway {
  private readonly updateAttemptsBySocket = new Map<string, number[]>();

  constructor(
    private readonly roomManager: RoomManager,
    private readonly ydocStore: YdocStore,
    private readonly presenceStore: PresenceStore,
    private readonly cursorStore: CursorStore,
    private readonly coreClient: CoreClient,
  ) {}

  register(socket: Socket): void {
    const data = socket.data as SocketData;

    socket.on(socketEvents.join, async (payload: JoinPayload, ack?: (payload: unknown) => void) => {
      try {
        const validation = await this.coreClient.validateTicket(payload.ticket, payload.documentId);
        data.ticket = payload.ticket;
        data.validation = validation;
        this.roomManager.join(socket, payload.documentId);
        this.presenceStore.join(socket.id, validation);
        const state = this.ydocStore.get(payload.documentId);
        if (validation.currentSnapshotBase64) {
          Y.applyUpdate(state, Buffer.from(validation.currentSnapshotBase64, 'base64'), 'remote');
        }
        socket.emit(socketEvents.yjsUpdate, {
          documentId: payload.documentId,
          update: Buffer.from(Y.encodeStateAsUpdate(state)),
        });
        this.roomManager.emitToRoom(payload.documentId, socketEvents.presenceUpdate, this.presenceStore.list(payload.documentId));
        ack?.({ ok: true, validation });
      } catch (error) {
        ack?.({ ok: false, message: 'Acesso realtime negado.' });
        socket.emit(socketEvents.error, { message: 'Acesso realtime negado.' });
      }
    });

    socket.on(socketEvents.yjsUpdate, async (payload: UpdatePayload, ack?: (payload: unknown) => void) => {
      const validation = data.validation;
      if (!validation || validation.documentId !== payload.documentId || !data.ticket) {
        socket.emit(socketEvents.error, { message: 'Entre no documento antes de editar.' });
        return;
      }
      if (new Date(validation.expiresAt).getTime() <= Date.now()) {
        socket.emit(socketEvents.error, { message: 'Sessão realtime expirada. Reabra o documento.' });
        socket.disconnect(true);
        return;
      }
      if (!validation.permissions.includes('DOCUMENT_EDIT')) {
        socket.emit(socketEvents.error, { message: 'Seu acesso é somente leitura.' });
        return;
      }
      if (!this.allowUpdate(socket.id)) {
        socket.emit(socketEvents.error, { message: 'Muitas alterações em pouco tempo.' });
        socket.disconnect(true);
        return;
      }

      const update = this.toUint8Array(payload.update);
      const snapshot = this.ydocStore.applyUpdate(payload.documentId, update);
      socket.to(documentRoom(payload.documentId)).emit(socketEvents.yjsUpdate, {
        documentId: payload.documentId,
        update: Buffer.from(update),
        userId: validation.userId,
      });

      try {
        await this.coreClient.persistUpdate(data.ticket, payload.documentId, update, snapshot);
        ack?.({ ok: true });
        socket.emit(socketEvents.persisted, { documentId: payload.documentId });
      } catch {
        ack?.({ ok: false, message: 'Alteração sincronizada, mas ainda não foi persistida.' });
        socket.emit(socketEvents.error, { message: 'Alteração sincronizada, mas ainda não foi persistida.' });
      }
    });

    socket.on(socketEvents.cursorUpdate, (payload: { documentId: string; anchor: unknown }) => {
      const validation = data.validation;
      if (!validation || validation.documentId !== payload.documentId) {
        return;
      }
      this.cursorStore.update({
        socketId: socket.id,
        documentId: payload.documentId,
        userId: validation.userId,
        username: validation.username,
        anchor: payload.anchor,
        updatedAt: new Date().toISOString(),
      });
      socket.to(documentRoom(payload.documentId)).emit(socketEvents.cursorUpdate, this.cursorStore.list(payload.documentId));
    });

    socket.on('disconnect', () => {
      const presence = this.presenceStore.leave(socket.id);
      this.updateAttemptsBySocket.delete(socket.id);
      this.cursorStore.remove(socket.id);
      if (presence) {
        this.roomManager.emitToRoom(presence.documentId, socketEvents.presenceUpdate, this.presenceStore.list(presence.documentId));
        this.roomManager.emitToRoom(presence.documentId, socketEvents.cursorUpdate, this.cursorStore.list(presence.documentId));
      }
    });
  }

  private toUint8Array(value: ArrayBuffer | Uint8Array | number[]): Uint8Array {
    if (value instanceof Uint8Array) {
      return value;
    }
    if (Array.isArray(value)) {
      return Uint8Array.from(value);
    }
    return new Uint8Array(value);
  }

  private allowUpdate(socketId: string): boolean {
    const now = Date.now();
    const recentAttempts = (this.updateAttemptsBySocket.get(socketId) || [])
      .filter((attemptAt) => now - attemptAt < UPDATE_LIMIT_WINDOW_MS);
    recentAttempts.push(now);
    this.updateAttemptsBySocket.set(socketId, recentAttempts);
    return recentAttempts.length <= MAX_UPDATES_PER_WINDOW;
  }
}
