import { AssistanceService } from './application/AssistanceService.js';
import { BookingService } from './application/BookingService.js';
import { ExportService } from './application/ExportService.js';
import { ExpressRequestService } from './application/ExpressRequestService.js';
import { GroupService } from './application/GroupService.js';
import { HouseService } from './application/HouseService.js';
import { ItemService } from './application/ItemService.js';
import { ProposalService } from './application/ProposalService.js';
import { ReturnRequestService } from './application/ReturnRequestService.js';
import { AuthService } from './infrastructure/AuthService.js';
import { ContextRepository } from './infrastructure/ContextRepository.js';
import { createMockBundle, createUnavailableAuth } from './infrastructure/mock/createMockBundle.js';
import { OfflineStorage } from './infrastructure/OfflineStorage.js';
import { createPocketBaseClient } from './infrastructure/PocketBaseClient.js';
import { App } from './presentation/App.js';
import { bindPickers } from './presentation/html.js';
import './styles.css';

bindPickers();

const url = import.meta.env.PUBLIC_POCKETBASE_URL || import.meta.env.VITE_POCKETBASE_URL || '';
let current = null;

function mount(deps) {
  current?.stop();
  current = new App({ exporter: new ExportService(), ...deps });
  current.start();
}

function liveDeps() {
  if (!url) {
    return {
      auth: createUnavailableAuth(),
      context: new ContextRepository(),
      offline: new OfflineStorage(),
      groups: null,
      houses: null,
      items: null,
      expressRequests: null,
      assistance: null,
      bookings: null,
      proposals: null,
      returns: null,
      onDemo: enterDemo,
    };
  }
  const pb = createPocketBaseClient(url);
  const auth = new AuthService(pb);
  return {
    auth,
    context: new ContextRepository(),
    offline: new OfflineStorage(),
    groups: new GroupService(pb, auth),
    houses: new HouseService(pb, auth),
    items: new ItemService(pb, auth),
    expressRequests: new ExpressRequestService(pb, auth),
    assistance: new AssistanceService(pb, auth),
    bookings: new BookingService(pb, auth),
    proposals: new ProposalService(pb, auth),
    returns: new ReturnRequestService(pb, auth),
    onDemo: enterDemo,
  };
}

function enterDemo() {
  mount({
    ...createMockBundle(),
    onLeaveDemo: () => mount(liveDeps()),
  });
}

mount(liveDeps());
