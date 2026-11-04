import { AssistanceRequest } from '../../domain/AssistanceRequest.js';
import { MockNeighborRequestService } from './MockNeighborRequestService.js';

export class MockAssistanceService extends MockNeighborRequestService {
  constructor(store, auth) {
    super(store, auth, {
      key: 'assistance',
      Model: AssistanceRequest,
      prefix: 'help',
      claim: 'resolve',
    });
  }
}
