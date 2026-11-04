function cell(value) {
  const text = String(value ?? '');
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

function slug(name) {
  return String(name || 'voisinage')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'voisinage';
}

export class ExportService {
  build({ group, houses, items, expressRequests, assistanceRequests, bookings, proposals, votes, returnRequests = [] }) {
    const houseName = new Map(houses.map((house) => [house.id, house.name]));
    const payload = {
      group: { id: group.id, name: group.name, inviteCode: group.inviteCode },
      exportedAt: new Date().toISOString(),
      houses,
      items,
      expressRequests,
      assistanceRequests,
      bookings,
      proposals,
      votes,
      returnRequests,
    };
    const header = ['nom', 'description', 'consigne', 'emoji_ou_url', 'maison_origine', 'maison_actuelle'].map(cell).join(',');
    const rows = items.map((item) => [
      item.name,
      item.description,
      item.instructions,
      item.imageUrl,
      houseName.get(item.homeHouseId) || '',
      houseName.get(item.currentHouseId) || '',
    ].map(cell).join(','));
    return {
      filename: `palier-${slug(group.name)}`,
      json: JSON.stringify(payload, null, 2),
      csv: [header, ...rows].join('\n'),
    };
  }
}
