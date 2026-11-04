export class Proposal {
  constructor({ id = null, title, description = '', url = '', estimatedCost = null, groupId, createdByUserId }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.url = url;
    this.estimatedCost = estimatedCost;
    this.groupId = groupId;
    this.createdByUserId = createdByUserId;
  }

  static create({ title, description = '', url = '', estimatedCost = null, groupId, createdByUserId }) {
    const trimmed = String(title ?? '').trim();
    if (!trimmed) throw new Error('Nommez l’achat à partager.');
    if (!groupId || !createdByUserId) throw new Error('La proposition est incomplète.');
    const cost = estimatedCost === '' || estimatedCost === null || estimatedCost === undefined
      ? null
      : Number(estimatedCost);
    if (cost !== null && (Number.isNaN(cost) || cost < 0)) throw new Error('Le coût estimé est invalide.');
    return new Proposal({
      title: trimmed,
      description: String(description ?? '').trim(),
      url: Proposal.normalizeUrl(url),
      estimatedCost: cost,
      groupId,
      createdByUserId,
    });
  }

  static normalizeUrl(value) {
    const raw = String(value ?? '').trim();
    if (!raw) return '';
    const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    let parsed;
    try {
      parsed = new URL(withScheme);
    } catch {
      throw new Error('Le lien est invalide.');
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Le lien doit commencer par http ou https.');
    }
    return parsed.href;
  }

  static fromRecord(record) {
    return new Proposal({
      id: record.id,
      title: record.title,
      description: record.description || '',
      url: record.url || '',
      estimatedCost: record.estimated_cost ?? null,
      groupId: record.group,
      createdByUserId: record.created_by_user,
    });
  }

  assertRemovable(userId) {
    if (!userId || this.createdByUserId !== userId) {
      throw new Error('Seule la personne qui a proposé cet achat peut le retirer.');
    }
  }

  static byHouse(votes) {
    const seen = new Map();
    for (const vote of votes || []) {
      if (vote?.houseId) seen.set(vote.houseId, vote);
    }
    return [...seen.values()];
  }

  static interested(votes) {
    return Proposal.byHouse(votes).filter((vote) => vote.isApproved);
  }
}

export class Vote {
  constructor({ id = null, proposalId, houseId, userId, isApproved }) {
    this.id = id;
    this.proposalId = proposalId;
    this.houseId = houseId;
    this.userId = userId;
    this.isApproved = Boolean(isApproved);
  }

  static fromRecord(record) {
    return new Vote({
      id: record.id,
      proposalId: record.proposal,
      houseId: record.house,
      userId: record.voted_by_user,
      isApproved: record.is_approved,
    });
  }
}
