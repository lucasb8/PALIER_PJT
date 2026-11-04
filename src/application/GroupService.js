import { Group, normalizeInviteCode } from '../domain/Group.js';
import { where } from '../infrastructure/pbFilter.js';

export class GroupService {
  constructor(pb, auth) {
    this.pb = pb;
    this.auth = auth;
  }

  async listMemberships() {
    const userId = this.auth.currentUser().id;
    const members = await this.pb.collection('group_members').getFullList({
      filter: where('user', userId),
      expand: 'group',
      sort: 'created',
    });
    return members
      .filter((member) => member.expand?.group)
      .map((member) => ({
        membershipId: member.id,
        group: Group.fromRecord(member.expand.group),
      }));
  }

  async create(name) {
    const user = this.auth.currentUser();
    const draft = Group.create({ name, createdBy: user.id });
    const record = await this.pb.collection('groups').create({
      name: draft.name,
      invite_code: draft.inviteCode,
      created_by: user.id,
    });
    await this.pb.collection('group_members').create({
      group: record.id,
      user: user.id,
    });
    return Group.fromRecord(record);
  }

  async joinByCode(code) {
    const inviteCode = normalizeInviteCode(code);
    if (!/^[A-Z0-9]{6}$|^[A-Z0-9]{8}$/.test(inviteCode)) {
      throw new Error('Le code d’invitation doit comporter 6 ou 8 caractères.');
    }
    const found = await this.pb.collection('groups').getFullList({
      filter: where('invite_code', inviteCode),
    });
    if (!found.length) throw new Error('Aucun voisinage ne correspond à ce code.');
    const userId = this.auth.currentUser().id;
    const existing = await this.pb.collection('group_members').getFullList({
      filter: `${where('group', found[0].id)} && ${where('user', userId)}`,
    });
    if (!existing.length) {
      await this.pb.collection('group_members').create({ group: found[0].id, user: userId });
    }
    return Group.fromRecord(found[0]);
  }

  async leave(groupId) {
    const userId = this.auth.currentUser().id;
    const existing = await this.pb.collection('group_members').getFullList({
      filter: `${where('group', groupId)} && ${where('user', userId)}`,
    });
    await Promise.all(existing.map((member) => this.pb.collection('group_members').delete(member.id)));
  }
}
