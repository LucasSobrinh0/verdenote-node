import * as Y from 'yjs';

export class YdocStore {
  private readonly docs = new Map<string, Y.Doc>();

  get(documentId: string): Y.Doc {
    const existing = this.docs.get(documentId);
    if (existing) {
      return existing;
    }
    const doc = new Y.Doc();
    this.docs.set(documentId, doc);
    return doc;
  }

  applyUpdate(documentId: string, update: Uint8Array): Uint8Array {
    const doc = this.get(documentId);
    Y.applyUpdate(doc, update);
    return Y.encodeStateAsUpdate(doc);
  }
}
