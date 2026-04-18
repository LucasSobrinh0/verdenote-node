import { Server, Socket } from 'socket.io';

export function documentRoom(documentId: string): string {
  return `document:${documentId}`;
}

export class RoomManager {
  constructor(private readonly io: Server) {}

  join(socket: Socket, documentId: string): void {
    socket.join(documentRoom(documentId));
  }

  leave(socket: Socket, documentId: string): void {
    socket.leave(documentRoom(documentId));
  }

  emitToRoom(documentId: string, event: string, payload: unknown): void {
    this.io.to(documentRoom(documentId)).emit(event, payload);
  }
}
