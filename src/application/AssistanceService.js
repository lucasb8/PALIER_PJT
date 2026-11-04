import { AssistanceRequest } from '../domain/AssistanceRequest.js';
import { NeighborRequestService } from './NeighborRequestService.js';

export class AssistanceService extends NeighborRequestService {
  constructor(pb, auth) {
    super(pb, auth, {
      collection: 'assistance_requests',
      Model: AssistanceRequest,
      waiting: 'open',
      actorColumn: 'resolved_by_house',
      actorField: 'resolvedByHouseId',
      claim: 'resolve',
    });
  }
}
