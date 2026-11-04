import { ContextRepository } from '../ContextRepository.js';
import { OfflineStorage } from '../OfflineStorage.js';
import { MockAssistanceService } from './MockAssistanceService.js';
import { MockAuth, UnavailableAuth } from './MockAuth.js';
import { MockBookingService } from './MockBookingService.js';
import { MockExpressService } from './MockExpressService.js';
import { MockGroupService } from './MockGroupService.js';
import { MockHouseService } from './MockHouseService.js';
import { MockItemService } from './MockItemService.js';
import { MockProposalService } from './MockProposalService.js';
import { MockReturnService } from './MockReturnService.js';
import { MockStore } from './MockStore.js';

export function createMockBundle() {
  const store = new MockStore();
  const auth = new MockAuth(store.user);
  const context = new ContextRepository('palier.demo.context');
  if (!context.getActiveGroupId()) context.setActiveGroupId('group-parc');
  return {
    auth,
    context,
    offline: new OfflineStorage('palier-demo'),
    groups: new MockGroupService(store, auth),
    houses: new MockHouseService(store, auth),
    items: new MockItemService(store, auth),
    expressRequests: new MockExpressService(store, auth),
    assistance: new MockAssistanceService(store, auth),
    bookings: new MockBookingService(store, auth),
    proposals: new MockProposalService(store, auth),
    returns: new MockReturnService(store, auth),
    demo: true,
  };
}

export function createUnavailableAuth() {
  return new UnavailableAuth();
}
