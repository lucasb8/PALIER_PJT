import { errorMessage } from '../infrastructure/errors.js';
import { AuthScreens } from './AuthScreens.js';
import { GroupHeaderSelector } from './GroupHeaderSelector.js';
import { GuideComponent } from './GuideComponent.js';
import { escapeHtml } from './html.js';
import { mountView } from './mountView.js';
import { buildNotifications } from './notifications.js';
import { OnboardingModal } from './OnboardingModal.js';
import { emptyWorkspace, hydrateWorkspace } from './workspace.js';

const TABS = [
  ['inventory', 'Objets'],
  ['calendar', 'Calendrier'],
  ['ask', 'Demander'],
  ['proposals', 'Achats'],
];

export class App {
  constructor(deps) {
    Object.assign(this, deps);
    this.root = document.querySelector('#app');
    this.screens = new AuthScreens(this);
    this.booting = false;
    this.tab = 'inventory';
    this.memberships = [];
    this.activeGroup = null;
    this.activeHouse = null;
    this.workspace = emptyWorkspace();
    this.offlineMode = false;
    this.notice = '';
    this.reserveItemId = '';
    this.calendarView = null;
    this.previousGroupId = null;
  }

  async start() {
    this.unsubscribe = this.auth.onChange(() => {
      if (this.resetToken) return;
      this.boot();
    });
    this.onVisible = () => {
      if (document.visibilityState === 'visible' && this.auth.isValid) this.auth.keep();
    };
    document.addEventListener('visibilitychange', this.onVisible);
    this.sessionTimer = setInterval(() => {
      if (this.auth.isValid) this.auth.keep();
    }, 12 * 60 * 60 * 1000);
    const resetToken = new URLSearchParams(window.location.search).get('reset');
    if (resetToken && !this.auth.isValid) {
      this.resetToken = resetToken;
      this.screens.renderReset(resetToken);
      return;
    }
    if (resetToken) {
      const url = new URL(window.location.href);
      url.searchParams.delete('reset');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
    await this.boot();
  }

  stop() {
    this.unsubscribe?.();
    this.unsubscribe = null;
    document.removeEventListener('visibilitychange', this.onVisible);
    clearInterval(this.sessionTimer);
  }

  async boot() {
    if (this.booting) return;
    this.booting = true;
    try {
      let retried = false;
      for (;;) {
        try {
          const alive = await this.auth.keep();
          if (!alive && !this.auth.isValid) {
            this.screens.renderLogin();
            return;
          }
          this.memberships = await this.groups.listMemberships();
          const savedId = this.context.getActiveGroupId();
          const membership = this.memberships.find((entry) => entry.group.id === savedId)
            || this.memberships[0]
            || null;
          if (!membership) {
            this.activeGroup = null;
            this.renderOnboarding({ step: 'group', canClose: false });
            return;
          }
          this.activeGroup = membership.group;
          this.context.setActiveGroupId(membership.group.id);
          await this.ensureHouseOrAsk();
          return;
        } catch (error) {
          if (error?.status === 401 && !retried) {
            retried = true;
            const alive = await this.auth.keep();
            if (alive) continue;
          }
          if (error?.status === 401 && !this.auth.isValid) {
            this.screens.renderLogin();
            return;
          }
          this.screens.renderProblem(error);
          return;
        }
      }
    } finally {
      this.booting = false;
    }
  }

  async ensureHouseOrAsk({ canClose = false } = {}) {
    const houses = await this.houses.list(this.activeGroup.id);
    this.workspace = { ...this.workspace, houses };
    const house = await this.houseForGroup(houses);
    if (!house) {
      const pending = await this.houses.pendingFor(this.activeGroup.id);
      this.renderOnboarding({ step: 'house', canClose, pending });
      return;
    }
    this.previousGroupId = null;
    this.activeHouse = house;
    await this.loadWorkspace();
    this.renderShell();
  }

  async houseForGroup(houses = this.workspace.houses) {
    const residence = await this.houses.residenceFor(this.activeGroup.id);
    const house = residence && houses.find((entry) => entry.id === residence.houseId);
    return house || null;
  }

  async loadWorkspace() {
    const groupId = this.activeGroup.id;
    try {
      const [houses, items, expressRequests, assistanceRequests, bookings, proposals, votes, returnRequests, joinRequests] = await Promise.all([
        this.houses.list(groupId),
        this.items.list(groupId),
        this.expressRequests.list(groupId),
        this.assistance.list(groupId),
        this.bookings.listForGroup(groupId),
        this.proposals.list(groupId),
        this.proposals.listVotes(groupId),
        this.returns.list(groupId),
        this.houses.listJoins(groupId),
      ]);
      this.workspace = { houses, items, expressRequests, assistanceRequests, bookings, proposals, votes, returnRequests, joinRequests };
      this.offlineMode = false;
      await this.offline.set(`workspace:${groupId}`, JSON.parse(JSON.stringify(this.workspace)));
    } catch (error) {
      if (error?.status === 401) throw error;
      const cached = await this.offline.get(`workspace:${groupId}`);
      if (!cached) throw error;
      this.workspace = hydrateWorkspace(cached);
      this.offlineMode = true;
      this.notice = 'Sans réseau : les données affichées viennent du cache de cet appareil.';
    }
  }


  async refresh() {
    await this.loadWorkspace();
    this.activeHouse = await this.houseForGroup() || this.activeHouse;
    this.renderShell();
  }

  async run(action) {
    if (this.offlineMode) {
      this.notice = 'Action impossible hors connexion.';
      this.renderBanner();
      return;
    }
    try {
      const notice = await action();
      this.notice = typeof notice === 'string' ? notice : '';
      await this.refresh();
    } catch (error) {
      this.notice = errorMessage(error);
      if (document.querySelector('#view')) this.renderBanner();
      else this.screens.renderProblem(error);
    }
  }


  renderOnboarding({ step, canClose, pending = null }) {
    this.root.innerHTML = '<div id="onboarding" class="mx-auto min-h-screen max-w-3xl px-4 py-10"></div>';
    const modal = new OnboardingModal(this.root.querySelector('#onboarding'), {
      onCreateGroup: async (name) => {
        const group = await this.groups.create(name);
        await this.onGroupReady(group);
      },
      onJoinGroup: async (code) => {
        const group = await this.groups.joinByCode(code);
        await this.onGroupReady(group);
      },
      onCreateHouse: async (name) => {
        const house = await this.houses.createAndClaim(this.activeGroup.id, name);
        await this.onHouseReady(house);
      },
      onSelectHouse: async (houseId) => {
        const result = await this.houses.ask(this.activeGroup.id, houseId);
        if (result.request?.status === 'pending') {
          this.renderOnboarding({ step: 'house', canClose, pending: result.request });
          return;
        }
        const house = (this.workspace.houses || []).find((entry) => entry.id === houseId);
        if (!house) throw new Error('Cette maison est introuvable.');
        await this.onHouseReady(house);
      },
      onCancelJoin: async (requestId) => {
        await this.houses.cancel(requestId);
        this.renderOnboarding({ step: 'house', canClose, pending: null });
      },
      onClose: () => this.closeOnboarding(),
    });
    modal.render({
      step,
      canClose,
      houses: this.workspace.houses,
      groupName: this.activeGroup?.name || '',
      pending,
    });
  }

  async onGroupReady(group) {
    this.context.setActiveGroupId(group.id);
    this.activeGroup = group;
    this.memberships = await this.groups.listMemberships();
    this.workspace = { ...this.workspace, houses: await this.houses.list(group.id) };
    const pending = await this.houses.pendingFor(group.id);
    this.renderOnboarding({
      step: 'house',
      canClose: Boolean(this.previousGroupId) || this.memberships.length > 1,
      pending,
    });
  }

  async onHouseReady(house) {
    this.activeHouse = house;
    this.previousGroupId = null;
    await this.loadWorkspace();
    this.tab = 'inventory';
    this.renderShell();
  }

  async closeOnboarding() {
    if (this.previousGroupId) this.context.setActiveGroupId(this.previousGroupId);
    this.previousGroupId = null;
    await this.boot();
  }

  openAddGroup() {
    this.previousGroupId = this.activeGroup?.id || null;
    this.renderOnboarding({ step: 'group', canClose: true });
  }

  renderShell() {
    this.notesOpen = Boolean(this.root.querySelector('#header .notes.is-open'));
    this.root.innerHTML = `
      <div class="min-h-screen">
        <header id="header" class="sticky top-0 z-20 border-b border-stone-200/80 bg-[#f4f0e7]/90 backdrop-blur"></header>
        <div class="mx-auto max-w-6xl px-4 pb-16">
          <div id="banner"></div>
          <nav id="tabs" class="mt-5 grid grid-cols-2 gap-2 sm:flex sm:items-center"></nav>
          <div id="view" class="mt-6"></div>
        </div>
      </div>
    `;
    this.header = new GroupHeaderSelector(this.root.querySelector('#header'), {
      onGroup: (groupId) => this.switchGroup(groupId),
      onLogout: () => this.leaveAccount(),
      onSettings: () => this.openSettings(),
      onGuide: () => this.openGuide(),
      onNotify: (action, id) => this.onJoinClick(action, id),
    });
    this.paintHeader();
    this.renderTabs();
    this.renderBanner();
    this.renderView();
  }

  paintHeader() {
    const notes = buildNotifications({
      userId: this.auth.currentUser()?.id,
      houses: this.workspace.houses,
      items: this.workspace.items,
      returnRequests: this.workspace.returnRequests,
      joinRequests: this.workspace.joinRequests,
      activeHouseId: this.activeHouse?.id,
    });
    const notesOpen = this.notesOpen || Boolean(this.root.querySelector('#header .notes.is-open'));
    this.notesOpen = false;
    this.header.render({
      user: this.auth.currentUser(),
      memberships: this.memberships,
      activeGroupId: this.activeGroup.id,
      houseLabel: this.activeHouse.name,
      settingsOpen: this.tab === 'settings',
      guideOpen: this.tab === 'guide',
      logoutLabel: this.demo ? 'Quitter l’exemple' : 'Se déconnecter',
      notifications: notes.html,
      notificationCount: notes.count,
      notesOpen,
    });
  }

  renderTabs() {
    const nav = this.root.querySelector('#tabs');
    const tabButton = ([id, label]) => `
      <button type="button" data-tab="${id}" class="w-full rounded-full px-3 py-1.5 text-sm whitespace-nowrap sm:w-auto ${this.tab === id ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 ring-1 ring-stone-200'}">${label}</button>
    `;
    nav.innerHTML = `
      ${TABS.slice(0, 2).map(tabButton).join('')}
      <span class="mx-1 hidden h-5 w-px shrink-0 bg-stone-300 sm:block" aria-hidden="true"></span>
      ${TABS.slice(2).map(tabButton).join('')}
    `;
    nav.querySelectorAll('[data-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        this.tab = button.dataset.tab;
        this.renderTabs();
        this.paintHeader();
        this.renderView();
      });
    });
  }

  renderBanner() {
    const banner = this.root.querySelector('#banner');
    if (!banner) return;
    banner.innerHTML = this.notice
      ? `<p class="mt-3 rounded-2xl bg-amber-50 px-4 py-2 text-sm text-amber-950">${escapeHtml(this.notice)}</p>`
      : '';
  }

  onJoinClick(action, id) {
    if (!action || !id) return;
    this.run(() => {
      if (action === 'accept') return this.houses.accept(id);
      if (action === 'refuse') return this.houses.refuse(id);
      if (action === 'dismiss') return this.houses.acknowledge(id);
      return this.houses.cancel(id);
    });
  }

  async switchGroup(groupId) {
    if (!groupId || groupId === this.activeGroup?.id) return;
    const membership = this.memberships.find((entry) => entry.group.id === groupId);
    if (!membership) return;
    this.previousGroupId = this.activeGroup.id;
    this.context.setActiveGroupId(groupId);
    this.activeGroup = membership.group;
    if (this.tab !== 'settings' && this.tab !== 'guide') this.tab = 'inventory';
    this.calendarView = null;
    try {
      await this.ensureHouseOrAsk({ canClose: true });
    } catch (error) {
      this.screens.renderProblem(error);
    }
  }

  async reserveMany({ itemIds, startDate, endDate }) {
    if (!itemIds?.length) {
      this.notice = 'Choisissez au moins un objet.';
      this.renderBanner();
      return;
    }
    const rejected = [];
    const pool = [...this.workspace.bookings];
    for (const itemId of itemIds) {
      try {
        const booking = await this.bookings.create({
          itemId,
          houseId: this.activeHouse.id,
          startDate,
          endDate,
          existing: pool,
        });
        pool.push(booking);
      } catch (error) {
        const item = this.workspace.items.find((entry) => entry.id === itemId);
        rejected.push(`${item?.name || 'Objet'} : ${error.message}`);
      }
    }
    this.notice = rejected.join(' · ');
    await this.refresh();
  }

  renderView() {
    const previous = this.root.querySelector('#view');
    if (!previous || !this.activeHouse) return;
    const view = previous.cloneNode(false);
    previous.replaceWith(view);
    mountView(this, view);
  }

  openSettings() {
    this.tab = 'settings';
    this.renderTabs();
    this.paintHeader();
    this.renderView();
  }

  openGuide() {
    this.tab = 'guide';
    this.renderTabs();
    this.paintHeader();
    this.renderView();
  }

  showGuide(view) {
    new GuideComponent(view, {
      onOpen: (tab) => {
        this.tab = tab;
        this.renderTabs();
        this.paintHeader();
        this.renderView();
      },
    }).render();
  }

  leaveAccount() {
    if (this.onLeaveDemo) this.onLeaveDemo();
    else this.auth.logout();
  }
}
