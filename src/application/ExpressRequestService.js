import { ExpressRequest } from '../domain/ExpressRequest.js';
import { NeighborRequestService } from './NeighborRequestService.js';

export class ExpressRequestService extends NeighborRequestService {
  constructor(pb, auth) {
    super(pb, auth, {
      collection: 'express_requests',
      Model: ExpressRequest,
      waiting: 'pending',
      actorColumn: 'fulfilled_by_house',
      actorField: 'fulfilledByHouseId',
      claim: 'fulfill',
    });
  }
}
