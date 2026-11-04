/// <reference path="../pb_data/types.d.ts" />

onRecordUpdateRequest((e) => {
  if (e.hasSuperuserAuth()) {
    e.next();
    return;
  }
  const next = e.record;
  const prev = next.original();
  if (next.get('user') !== prev.get('user') || next.get('group') !== prev.get('group')) {
    throw new ForbiddenError('Cette résidence ne peut pas être modifiée.');
  }
  if (next.get('house') !== prev.get('house')) {
    const house = e.app.findRecordById('houses', next.get('house'));
    if (!e.auth || house.get('created_by') !== e.auth.id) {
      throw new ForbiddenError('Seul le créateur de la maison peut accepter.');
    }
  }
  e.next();
}, 'house_residents');
