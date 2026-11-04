import { Group, normalizeInviteCode } from '../../domain/Group.js';

export class MockGroupService {
  constructor(store, auth) {
    this.store = store;
    this.auth = auth;
  }

  async listMemberships() {
    const userId = this.auth.currentUser().id;
    return this.store.members
      .filter((member) => member.userId === userId)
      .map((member) => ({
        membershipId: member.id,
        group: this.store.groups.find((group) => group.id === member.groupId),
      }))
      .filter((entry) => entry.group);
  }

  async create(name) {
    const user = this.auth.currentUser();
    const draft = Group.create({ name, createdBy: user.id });
    draft.id = this.store.nextId('group');
    this.store.groups.push(draft);
    this.store.members.push({ id: this.store.nextId('member'), groupId: draft.id, userId: user.id });
    return draft;
  }

  async joinByCode(code) {
    const inviteCode = normalizeInviteCode(code);
    if (!/^[A-Z0-9]{6}$|^[A-Z0-9]{8}$/.test(inviteCode)) {
      throw new Error('Le code d’invitation doit comporter 6 ou 8 caractères.');
    }
    const group = this.store.groups.find((entry) => entry.inviteCode === inviteCode);
    if (!group) throw new Error('Aucun voisinage ne correspond à ce code.');
    const userId = this.auth.currentUser().id;
    const already = this.store.members.some((member) => member.groupId === group.id && member.userId === userId);
    if (!already) {
      this.store.members.push({ id: this.store.nextId('member'), groupId: group.id, userId });
    }
    return group;
  }

  async leave(groupId) {
    const userId = this.auth.currentUser().id;
    this.store.members = this.store.members.filter((member) => !(member.groupId === groupId && member.userId === userId));
  }
}
