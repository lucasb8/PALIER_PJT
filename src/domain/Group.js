const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomIndex(max) {
  if (globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(1);
    globalThis.crypto.getRandomValues(bytes);
    return bytes[0] % max;
  }
  return Math.floor(Math.random() * max);
}

export function generateInviteCode(length = 6) {
  const size = length === 8 ? 8 : 6;
  return Array.from({ length: size }, () => ALPHABET[randomIndex(ALPHABET.length)]).join('');
}

export function normalizeInviteCode(code) {
  return String(code ?? '').trim().toUpperCase();
}

export class Group {
  constructor({ id = null, name, inviteCode, createdBy = null }) {
    this.id = id;
    this.name = name;
    this.inviteCode = inviteCode;
    this.createdBy = createdBy;
  }

  static create({ name, createdBy, inviteCode, codeLength = 6 }) {
    const trimmed = String(name ?? '').trim();
    if (!trimmed) throw new Error('Le nom du voisinage est requis.');
    return new Group({
      name: trimmed,
      createdBy,
      inviteCode: inviteCode ? normalizeInviteCode(inviteCode) : generateInviteCode(codeLength),
    });
  }

  static fromRecord(record) {
    return new Group({
      id: record.id,
      name: record.name,
      inviteCode: record.invite_code,
      createdBy: record.created_by,
    });
  }
}
