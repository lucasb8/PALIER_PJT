import { errorMessage } from '../infrastructure/errors.js';
import { AskComponent } from './AskComponent.js';
import { CalendarComponent } from './CalendarComponent.js';
import { download } from './html.js';
import { InventoryComponent } from './InventoryComponent.js';
import { ProposalsComponent } from './ProposalsComponent.js';
import { SettingsComponent } from './SettingsComponent.js';

export function mountView(app, view) {
  const offline = app.offlineMode;
  if (app.tab === 'inventory') {
    mountInventory(app, view, offline);
    return;
  }
  if (app.tab === 'ask') {
    mountAsk(app, view, offline);
    return;
  }
  if (app.tab === 'calendar') {
    mountCalendar(app, view, offline);
    return;
  }
  if (app.tab === 'proposals') {
    mountProposals(app, view, offline);
    return;
  }
  if (app.tab === 'guide') {
    app.showGuide(view);
    return;
  }
  mountSettings(app, view);
}

function mountInventory(app, view, offline) {
  new InventoryComponent(view, {
    offline,
    onMove: (itemId, toHouseId) => app.run(async () => {
      const item = app.workspace.items.find((entry) => entry.id === itemId);
      const bookings = app.workspace.bookings.filter((booking) => booking.itemId === itemId);
      const choice = item.moveChoice(app.activeHouse.id, bookings);
      const target = choice === 'prendre' ? app.activeHouse.id : item.homeHouseId;
      if (!choice || toHouseId !== target) throw new Error('Ce déplacement n’est pas ouvert.');
      await app.items.move(item, toHouseId);
      await app.returns.closeForItem(itemId);
    }),
    onAskReturn: (itemId) => app.run(async () => {
      const item = app.workspace.items.find((entry) => entry.id === itemId);
      await app.returns.ask({
        item,
        activeHouseId: app.activeHouse.id,
        existing: app.workspace.returnRequests,
        bookings: app.workspace.bookings.filter((booking) => booking.itemId === itemId),
      });
    }),
    onHistory: (itemId) => app.items.history(itemId),
    onRemove: (itemId) => app.run(async () => {
      const item = app.workspace.items.find((entry) => entry.id === itemId);
      await app.items.remove(item, app.activeHouse.id);
    }),
    onAdd: async (payload) => {
      if (app.offlineMode) throw new Error('Action impossible hors connexion.');
      await app.items.create({ ...payload, groupId: app.activeGroup.id });
      app.notice = '';
      await app.refresh();
    },
    onGuide: () => app.openGuide(),
    onReserve: (itemId) => {
      app.reserveItemId = itemId;
      app.tab = 'calendar';
      app.renderTabs();
      app.paintHeader();
      app.renderView();
    },
  }).render({
    items: app.workspace.items,
    houses: app.workspace.houses,
    bookings: app.workspace.bookings,
    returnRequests: app.workspace.returnRequests,
    activeHouseId: app.activeHouse.id,
  });
}

function askChannel(app, kind) {
  if (kind === 'assistance') {
    return { service: app.assistance, requests: app.workspace.assistanceRequests };
  }
  return { service: app.expressRequests, requests: app.workspace.expressRequests };
}

function askAction(app, kind, id, method) {
  const channel = askChannel(app, kind);
  const request = channel.requests.find((entry) => entry.id === id);
  return channel.service[method](request, app.activeHouse.id);
}

function mountAsk(app, view, offline) {
  new AskComponent(view, {
    onCreate: (payload) => app.run(() => app.expressRequests.create({
      ...payload,
      groupId: app.activeGroup.id,
      houseId: app.activeHouse.id,
    })),
    onAnswer: (kind, id) => app.run(() => askAction(app, kind, id, 'answer')),
    onRelease: (kind, id) => app.run(() => askAction(app, kind, id, 'release')),
    onRemove: (kind, id) => app.run(() => askAction(app, kind, id, 'remove')),
  }).render({
    expressRequests: app.workspace.expressRequests,
    assistanceRequests: app.workspace.assistanceRequests,
    houses: app.workspace.houses,
    activeHouseId: app.activeHouse.id,
    offline,
  });
}

function mountCalendar(app, view, offline) {
  new CalendarComponent(view, {
    onCreateMany: (payload) => app.reserveMany(payload),
    onCancel: (id) => app.run(() => app.bookings.cancel(id, app.activeHouse.id)),
    onRemember: (viewState) => { app.calendarView = viewState; },
  }).render({
    items: app.workspace.items,
    bookings: app.workspace.bookings,
    houses: app.workspace.houses,
    returnRequests: app.workspace.returnRequests,
    activeHouseId: app.activeHouse.id,
    currentUserId: app.auth.currentUser()?.id,
    selectedItemId: app.reserveItemId,
    view: app.calendarView,
    offline,
  });
}

function mountProposals(app, view, offline) {
  new ProposalsComponent(view, {
    onCreate: (payload) => app.run(() => app.proposals.create({ ...payload, groupId: app.activeGroup.id })),
    onInterest: (proposalId, interested) => app.run(() => app.proposals.vote({
      proposalId,
      houseId: app.activeHouse.id,
      isApproved: interested,
      votes: app.workspace.votes,
    })),
    onRemove: (proposalId) => app.run(() => {
      const proposal = app.workspace.proposals.find((entry) => entry.id === proposalId);
      return app.proposals.remove(proposal);
    }),
  }).render({
    proposals: app.workspace.proposals,
    votes: app.workspace.votes,
    houses: app.workspace.houses,
    activeHouseId: app.activeHouse.id,
    currentUserId: app.auth.currentUser()?.id,
    offline,
  });
}

function mountSettings(app, view) {
  new SettingsComponent(view, {
    onExport: (kind) => {
      const file = app.exporter.build({ group: app.activeGroup, ...app.workspace });
      if (kind === 'csv') download(`${file.filename}.csv`, file.csv, 'text/csv;charset=utf-8');
      else download(`${file.filename}.json`, file.json, 'application/json');
    },
    onAddGroup: () => app.openAddGroup(),
    onMoveHouse: (houseId) => app.run(async () => {
      const result = await app.houses.ask(app.activeGroup.id, houseId);
      if (result.request?.status === 'pending') return 'Demande envoyée. Le créateur de la maison doit accepter.';
    }),
    onCreateHouse: (name) => app.run(() => app.houses.createAndLive(app.activeGroup.id, name)),
    onSwitch: (groupId) => app.switchGroup(groupId),
    onLeave: async () => {
      try {
        await app.groups.leave(app.activeGroup.id);
        app.context.setActiveGroupId(null);
        app.activeGroup = null;
        app.activeHouse = null;
        await app.boot();
      } catch (error) {
        app.notice = errorMessage(error);
        app.renderBanner();
      }
    },
    onLogout: () => app.leaveAccount(),
  }).render({
    group: app.activeGroup,
    memberships: app.memberships,
    houses: app.workspace.houses,
    activeHouseId: app.activeHouse.id,
    activeGroupId: app.activeGroup.id,
    logoutLabel: app.demo ? 'Quitter l’exemple' : 'Se déconnecter',
  });
}
