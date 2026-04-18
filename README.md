# Verde Note Node

Realtime collaboration service for Verde Note.

This service owns volatile collaboration state: Socket.IO connections, Yjs rooms, presence and cursors. It does not own user accounts, document permissions or document persistence. Those decisions remain in `verdenote-core`.

## Responsibilities

- Accept Socket.IO connections from the frontend.
- Validate short-lived realtime tickets with `verdenote-core`.
- Keep `Y.Doc` instances in memory per document room.
- Broadcast Yjs updates to other sockets in the same room.
- Broadcast presence and cursor updates.
- Forward Yjs updates to `verdenote-core` for persistence.
- Enforce a basic per-socket update rate limit.
- Reject updates when the realtime ticket has expired.

## Security Model

The frontend cannot self-authorize. The flow is:

1. Browser session calls `verdenote-core`.
2. Core checks document ACL and issues a short-lived ticket.
3. Frontend connects to Node and sends `documentId` + ticket.
4. Node validates the ticket with Core using `X-VerdeNote-Realtime-Secret`.
5. Node joins the socket to `document:{documentId}` only after Core approval.

Production must keep `VERDENOTE_REALTIME_SERVICE_SECRET` private and identical in Core and Node.

## Local Run

```bash
npm install
VERDENOTE_CORE_URL=http://localhost:8080 \
VERDENOTE_NODE_CORS_ORIGIN=http://localhost:3000 \
VERDENOTE_REALTIME_SERVICE_SECRET=dev-realtime-service-secret-change-before-production \
npm run dev
```

## Build

```bash
npm run build
```

## Audit

```bash
npm audit --audit-level=high
```

## Docker

Build:

```bash
docker build -t verdenote-node .
```

Run via root compose:

```bash
docker compose up --build
```

Run this module alone:

```bash
docker compose up --build
```

The standalone compose expects `verdenote-core` to be available on the host at `http://localhost:8080`. Inside Docker it reaches that URL through `host.docker.internal`.

## Environment

Use `.env.example` as a template. Keep `.env` local only.
