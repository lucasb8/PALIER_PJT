import { Proposal, Vote } from '../../domain/Proposal.js';

export class MockProposalService {
  constructor(store, auth) {
    this.store = store;
    this.auth = auth;
  }

  async list(groupId) {
    return this.store.proposals.filter((proposal) => proposal.groupId === groupId);
  }

  async listVotes(groupId) {
    const ids = new Set(this.store.proposals.filter((proposal) => proposal.groupId === groupId).map((proposal) => proposal.id));
    return this.store.votes.filter((vote) => ids.has(vote.proposalId));
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
    draft.id = this.store.nextId('prop');
    this.store.proposals.push(draft);
    return draft;
  }

  async vote({ proposalId, houseId, isApproved }) {
    const userId = this.auth.currentUser().id;
    this.store.votes = this.store.votes.filter((vote) => vote.proposalId !== proposalId || vote.houseId !== houseId);
    if (!isApproved) return null;
    const vote = new Vote({
      id: this.store.nextId('vote'),
      proposalId,
      houseId,
      userId,
      isApproved: true,
    });
    this.store.votes.push(vote);
    return vote;
  }

  async remove(proposal) {
    const stored = this.store.proposals.find((entry) => entry.id === proposal.id);
    stored.assertRemovable(this.auth.currentUser().id);
    this.store.votes = this.store.votes.filter((vote) => vote.proposalId !== stored.id);
    this.store.proposals = this.store.proposals.filter((entry) => entry.id !== stored.id);
  }
}
