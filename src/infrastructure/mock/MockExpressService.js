import { ExpressRequest } from '../../domain/ExpressRequest.js';
import { MockNeighborRequestService } from './MockNeighborRequestService.js';

export class MockExpressService extends MockNeighborRequestService {
  constructor(store, auth) {
    super(store, auth, {
      key: 'express',
      Model: ExpressRequest,
      prefix: 'expr',
      claim: 'fulfill',
    });
  }
}
