export const socketEvents = {
  join: 'document:join',
  leave: 'document:leave',
  yjsUpdate: 'document:yjs-update',
  persisted: 'document:persisted',
  snapshotRequest: 'document:snapshot-request',
  presenceUpdate: 'presence:update',
  cursorUpdate: 'cursor:update',
  commentCreated: 'comment:created',
  commentResolved: 'comment:resolved',
  error: 'error',
} as const;

export type DocumentPermission =
  | 'DOCUMENT_READ'
  | 'DOCUMENT_EDIT'
  | 'DOCUMENT_COMMENT'
  | 'DOCUMENT_SHARE'
  | 'DOCUMENT_RENAME'
  | 'DOCUMENT_DELETE'
  | 'DOCUMENT_HISTORY';

export type TicketValidation = {
  documentId: string;
  userId: string;
  username: string;
  permissions: DocumentPermission[];
  currentSnapshotBase64?: string | null;
  expiresAt: string;
};

export type JoinPayload = {
  documentId: string;
  ticket: string;
};

export type UpdatePayload = {
  documentId: string;
  update: ArrayBuffer | Uint8Array | number[];
};
