import { CoreClient } from '../clients/coreClient';
import { TicketValidation } from '../events/eventTypes';

export class TicketValidator {
  constructor(private readonly coreClient: CoreClient) {}

  validate(ticket: string, documentId: string): Promise<TicketValidation> {
    return this.coreClient.validateTicket(ticket, documentId);
  }
}
