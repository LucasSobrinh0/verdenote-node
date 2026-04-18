import { env } from '../config/env';
import { TicketValidation } from '../events/eventTypes';

export class CoreClient {
  async validateTicket(ticket: string, documentId: string): Promise<TicketValidation> {
    const response = await fetch(`${env.coreUrl}/api/realtime/tickets/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VerdeNote-Realtime-Secret': env.realtimeServiceSecret,
      },
      body: JSON.stringify({ ticket, documentId }),
    });

    if (!response.ok) {
      throw new Error('Ticket realtime inválido.');
    }

    return response.json() as Promise<TicketValidation>;
  }

  async persistUpdate(ticket: string, documentId: string, update: Uint8Array, snapshot: Uint8Array): Promise<void> {
    const response = await fetch(`${env.coreUrl}/api/realtime/documents/${documentId}/updates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VerdeNote-Realtime-Secret': env.realtimeServiceSecret,
      },
      body: JSON.stringify({
        ticket,
        updatePayloadBase64: Buffer.from(update).toString('base64'),
        snapshotPayloadBase64: Buffer.from(snapshot).toString('base64'),
      }),
    });

    if (!response.ok) {
      throw new Error('Não foi possível persistir update no core.');
    }
  }
}
