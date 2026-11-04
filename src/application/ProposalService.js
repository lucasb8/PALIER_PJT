import { Proposal, Vote } from '../domain/Proposal.js';
import { where } from '../infrastructure/pbFilter.js';

export class ProposalService {
  constructor(pb, auth) {
    this.pb = pb;
    this.auth = auth;
  }

  async list(groupId) {
    const records = await this.pb.collection('proposals').getFullList({
      filter: where('group', groupId),
      sort: '-created',
    });
    return records.map((record) => Proposal.fromRecord(record));
  }

  async listVotes(groupId) {
    const records = await this.pb.collection('votes').getFullList({
      filter: where('proposal.group', groupId),
    });
    return records.map((record) => Vote.fromRecord(record));
  }

  async create({ title, description, url, estimatedCost, groupId }) {
    const draft = Proposal.create({
      title,
      description,
      url,
      estimatedCost,
      groupId,
      createdByUserId: this.auth.currentUser().id,
    });
    const payload = {
      title: draft.title,
      description: draft.description,
      url: draft.url,
      group: groupId,
      created_by_user: draft.createdByUserId,
    };
    if (draft.estimatedCost !== null) payload.estimated_cost = draft.estimatedCost;
    const record = await this.pb.collection('proposals').create(payload);
    return Proposal.fromRecord(record);
  }

  async remove(proposal) {
    proposal.assertRemovable(this.auth.currentUser().id);
    const votes = await this.pb.collection('votes').getFullList({
      filter: where('proposal', proposal.id),
    });
    await Promise.all(votes.map((vote) => this.pb.collection('votes').delete(vote.id)));
    await this.pb.collection('proposals').delete(proposal.id);
  }

  async vote({ proposalId, houseId, isApproved, votes }) {
    const userId = this.auth.currentUser().id;
    const sameHouse = votes.filter((entry) => entry.proposalId === proposalId && entry.houseId === houseId);
    if (!isApproved) {
      await Promise.all(sameHouse.map((entry) => this.pb.collection('votes').delete(entry.id)));
      return null;
    }
    if (sameHouse.length) {
      const [keep, ...extra] = sameHouse;
      const record = await this.pb.collection('votes').update(keep.id, {
        is_approved: true,
        voted_by_user: userId,
      });
      await Promise.all(extra.map((entry) => this.pb.collection('votes').delete(entry.id)));
      return Vote.fromRecord(record);
    }
    const record = await this.pb.collection('votes').create({
      proposal: proposalId,
      house: houseId,
      voted_by_user: userId,
      is_approved: true,
    });
    return Vote.fromRecord(record);
  }
}
