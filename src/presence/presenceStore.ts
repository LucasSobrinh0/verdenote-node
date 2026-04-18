import { TicketValidation } from '../events/eventTypes';

export type Presence = {
  socketId: string;
  documentId: string;
  userId: string;
  username: string;
  lastSeenAt: string;
};

export class PresenceStore {
  private readonly presenceBySocket = new Map<string, Presence>();

  join(socketId: string, validation: TicketValidation): Presence {
    const presence: Presence = {
      socketId,
      documentId: validation.documentId,
      userId: validation.userId,
      username: validation.username,
      lastSeenAt: new Date().toISOString(),
    };
    this.presenceBySocket.set(socketId, presence);
    return presence;
  }

  leave(socketId: string): Presence | undefined {
    const presence = this.presenceBySocket.get(socketId);
    this.presenceBySocket.delete(socketId);
    return presence;
  }

  list(documentId: string): Presence[] {
    return [...this.presenceBySocket.values()].filter((presence) => presence.documentId === documentId);
  }

  get(socketId: string): Presence | undefined {
    return this.presenceBySocket.get(socketId);
  }
}
