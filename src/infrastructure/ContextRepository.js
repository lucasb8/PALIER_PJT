const EMPTY = () => ({ groupId: null });

export class ContextRepository {
  constructor(key = 'palier.context') {
    this.key = key;
  }

  read() {
    try {
      const parsed = JSON.parse(localStorage.getItem(this.key) || 'null');
      if (!parsed || typeof parsed !== 'object') return EMPTY();
      return { groupId: parsed.groupId ?? null };
    } catch {
      return EMPTY();
    }
  }

  write(next) {
    localStorage.setItem(this.key, JSON.stringify(next));
  }

  getActiveGroupId() {
    return this.read().groupId;
  }

  setActiveGroupId(groupId) {
    const data = this.read();
    data.groupId = groupId;
    this.write(data);
  }
}
