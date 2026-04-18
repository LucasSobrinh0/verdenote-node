export type CursorState = {
  socketId: string;
  documentId: string;
  userId: string;
  username: string;
  anchor: unknown;
  updatedAt: string;
};

export class CursorStore {
  private readonly cursorsBySocket = new Map<string, CursorState>();

  update(cursor: CursorState): void {
    this.cursorsBySocket.set(cursor.socketId, cursor);
  }

  remove(socketId: string): void {
    this.cursorsBySocket.delete(socketId);
  }

  list(documentId: string): CursorState[] {
    return [...this.cursorsBySocket.values()].filter((cursor) => cursor.documentId === documentId);
  }
}
