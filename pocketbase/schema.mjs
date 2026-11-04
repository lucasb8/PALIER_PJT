import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Source de vérité du schéma Palier.
 * Lancer : node pocketbase/schema.mjs
 * Puis importer pocketbase/collections.json dans PocketBase :
 * Admin → Settings → Import collections.
 */

const USERS = '_pb_users_auth_';
const AUTH = '@request.auth.id != ""';
const GROUP_MEMBER = 'group_members_via_group.user ?= @request.auth.id';
const VIA_GROUP = 'group.group_members_via_group.user ?= @request.auth.id';
const VIA_ITEM = 'item.group.group_members_via_group.user ?= @request.auth.id';
const VIA_PROPOSAL = 'proposal.group.group_members_via_group.user ?= @request.auth.id';

const IDS = {
  groups: 'pal_groups00001',
  members: 'pal_members0001',
  houses: 'pal_houses00001',
  residents: 'pal_residents01',
  items: 'pal_items000001',
  express: 'pal_express0001',
  assistance: 'pal_assist00001',
  history: 'pal_history0001',
  bookings: 'pal_bookings001',
  returns: 'pal_returns0001',
  proposals: 'pal_proposals01',
  votes: 'pal_votes000001',
  joins: 'pal_joins000001',
};

let fieldSeq = 1;
function fid(name) {
  return `f_${name}_${String(fieldSeq++).padStart(3, '0')}`.slice(0, 24);
}

function pk() {
  return {
    autogeneratePattern: '[a-z0-9]{15}',
    hidden: false,
    id: 'text3208210256',
    max: 15,
    min: 15,
    name: 'id',
    pattern: '^[a-z0-9]+$',
    presentable: false,
    primaryKey: true,
    required: true,
    system: true,
    type: 'text',
  };
}

function autonumber() {
  return { hidden: false, id: 'autodate_created', name: 'created', onCreate: true, onUpdate: false, presentable: false, system: false, type: 'autodate' };
}

function autoupdate() {
  return { hidden: false, id: 'autodate_updated', name: 'updated', onCreate: true, onUpdate: true, presentable: false, system: false, type: 'autodate' };
}

function text(name, { required = false, presentable = false, max = 0, id = '' } = {}) {
  return {
    autogeneratePattern: '',
    hidden: false,
    id: id || fid(name),
    max,
    min: 0,
    name,
    pattern: '',
    presentable,
    primaryKey: false,
    required,
    system: false,
    type: 'text',
  };
}

function bool(name, { required = false } = {}) {
  return { hidden: false, id: fid(name), name, presentable: false, required, system: false, type: 'bool' };
}

function number(name, { required = false, min = null, max = null, onlyInt = false } = {}) {
  return { hidden: false, id: fid(name), max, min, name, onlyInt, presentable: false, required, system: false, type: 'number' };
}

function date(name, { required = false } = {}) {
  return { hidden: false, id: fid(name), max: '', min: '', name, presentable: true, required, system: false, type: 'date' };
}

function select(name, values, { required = false, maxSelect = 1 } = {}) {
  return { hidden: false, id: fid(name), maxSelect, name, presentable: true, required, system: false, type: 'select', values };
}

function file(name, { required = false, maxSize = 5 * 1024 * 1024 } = {}) {
  return {
    hidden: false,
    id: fid(name),
    maxSelect: 1,
    maxSize,
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    name,
    presentable: false,
    protected: false,
    required,
    system: false,
    thumbs: ['400x400'],
    type: 'file',
  };
}

function relation(name, collectionId, { required = false, maxSelect = 1, id = '' } = {}) {
  return {
    cascadeDelete: false,
    collectionId,
    hidden: false,
    id: id || fid(name),
    maxSelect,
    minSelect: required ? 1 : 0,
    name,
    presentable: false,
    required,
    system: false,
    type: 'relation',
  };
}

function rules(list, view, create, update, del) {
  return { listRule: list, viewRule: view, createRule: create, updateRule: update, deleteRule: del };
}

function collection(id, name, fields, ruleSet, indexes = []) {
  return {
    id,
    name,
    type: 'base',
    system: false,
    ...ruleSet,
    indexes,
    fields: [pk(), ...fields, autonumber(), autoupdate()],
  };
}

const collections = [
  collection(
    IDS.groups,
    'groups',
    [
      text('name', { required: true, presentable: true, max: 80 }),
      text('invite_code', { required: true, presentable: true, max: 8 }),
      relation('created_by', USERS, { required: true }),
    ],
    rules(
      AUTH,
      AUTH,
      `${AUTH} && created_by = @request.auth.id`,
      GROUP_MEMBER,
      'created_by = @request.auth.id',
    ),
    ['CREATE UNIQUE INDEX `idx_groups_invite_code` ON `groups` (`invite_code`)'],
  ),
  collection(
    IDS.members,
    'group_members',
    [
      relation('group', IDS.groups, { required: true }),
      relation('user', USERS, { required: true }),
    ],
    rules(
      `user = @request.auth.id || ${VIA_GROUP}`,
      `user = @request.auth.id || ${VIA_GROUP}`,
      `${AUTH} && user = @request.auth.id`,
      'user = @request.auth.id',
      'user = @request.auth.id',
    ),
    [
      'CREATE UNIQUE INDEX `idx_members_group_user` ON `group_members` (`group`, `user`)',
      'CREATE INDEX `idx_members_user` ON `group_members` (`user`)',
    ],
  ),
  collection(
    IDS.houses,
    'houses',
    [
      text('name', { required: true, presentable: true, max: 80 }),
      relation('group', IDS.groups, { required: true }),
      relation('created_by', USERS, { required: true, id: 'f_created_by_house' }),
    ],
    rules(
      VIA_GROUP,
      VIA_GROUP,
      `${AUTH} && created_by = @request.auth.id && ${VIA_GROUP}`,
      VIA_GROUP,
      VIA_GROUP,
    ),
    ['CREATE INDEX `idx_houses_group` ON `houses` (`group`)'],
  ),
  collection(
    IDS.residents,
    'house_residents',
    [
      relation('group', IDS.groups, { required: true }),
      relation('house', IDS.houses, { required: true }),
      relation('user', USERS, { required: true }),
    ],
    rules(
      VIA_GROUP,
      VIA_GROUP,
      `${AUTH} && house.created_by = @request.auth.id && ${VIA_GROUP}`,
      VIA_GROUP,
      'user = @request.auth.id',
    ),
    ['CREATE UNIQUE INDEX `idx_residents_group_user` ON `house_residents` (`group`, `user`)'],
  ),
  collection(
    IDS.items,
    'items',
    [
      text('name', { required: true, presentable: true, max: 120 }),
      text('description'),
      text('instructions', { id: 'f_instructions_item' }),
      text('image_url'),
      file('photo'),
      relation('group', IDS.groups, { required: true }),
      relation('home_house', IDS.houses, { required: true }),
      relation('current_house', IDS.houses, { required: true }),
    ],
    rules(
      VIA_GROUP,
      VIA_GROUP,
      `${AUTH} && ${VIA_GROUP}`,
      VIA_GROUP,
      'home_house.house_residents_via_house.user ?= @request.auth.id',
    ),
    ['CREATE INDEX `idx_items_group` ON `items` (`group`)'],
  ),
  collection(
    IDS.express,
    'express_requests',
    [
      text('title', { required: true, presentable: true, max: 120 }),
      text('description'),
      relation('group', IDS.groups, { required: true }),
      relation('requested_by_user', USERS, { required: true }),
      relation('requested_by_house', IDS.houses, { required: true }),
      select('status', ['pending', 'fulfilled'], { required: true }),
      relation('fulfilled_by_house', IDS.houses),
    ],
    rules(
      VIA_GROUP,
      VIA_GROUP,
      `${AUTH} && requested_by_user = @request.auth.id && ${VIA_GROUP}`,
      VIA_GROUP,
      'requested_by_house.house_residents_via_house.user ?= @request.auth.id',
    ),
    ['CREATE INDEX `idx_express_group` ON `express_requests` (`group`, `status`)'],
  ),
  collection(
    IDS.assistance,
    'assistance_requests',
    [
      text('title', { required: true, presentable: true, max: 120 }),
      text('description'),
      relation('group', IDS.groups, { required: true }),
      relation('requested_by_user', USERS, { required: true }),
      relation('requested_by_house', IDS.houses, { required: true }),
      select('status', ['open', 'resolved'], { required: true }),
      relation('resolved_by_house', IDS.houses),
    ],
    rules(
      VIA_GROUP,
      VIA_GROUP,
      `${AUTH} && requested_by_user = @request.auth.id && ${VIA_GROUP}`,
      VIA_GROUP,
      'requested_by_house.house_residents_via_house.user ?= @request.auth.id',
    ),
    ['CREATE INDEX `idx_assistance_group` ON `assistance_requests` (`group`, `status`)'],
  ),
  collection(
    IDS.returns,
    'return_requests',
    [
      relation('item', IDS.items, { required: true }),
      relation('group', IDS.groups, { required: true }),
      relation('home_house', IDS.houses, { required: true }),
      relation('holder_house', IDS.houses, { required: true }),
      relation('requested_by_user', USERS, { required: true }),
      select('status', ['open', 'done'], { required: true }),
    ],
    rules(
      VIA_GROUP,
      VIA_GROUP,
      `${AUTH} && requested_by_user = @request.auth.id && ${VIA_GROUP}`,
      VIA_GROUP,
      VIA_GROUP,
    ),
    ['CREATE INDEX `idx_returns_group` ON `return_requests` (`group`, `status`)'],
  ),
  collection(
    IDS.history,
    'item_history',
    [
      relation('item', IDS.items, { required: true }),
      relation('from_house', IDS.houses, { required: true }),
      relation('to_house', IDS.houses, { required: true }),
      relation('moved_by_user', USERS, { required: true }),
    ],
    rules(
      VIA_ITEM,
      VIA_ITEM,
      `${AUTH} && moved_by_user = @request.auth.id && ${VIA_ITEM}`,
      null,
      'item.home_house.house_residents_via_house.user ?= @request.auth.id',
    ),
    ['CREATE INDEX `idx_history_item` ON `item_history` (`item`)'],
  ),
  collection(
    IDS.bookings,
    'bookings',
    [
      relation('item', IDS.items, { required: true }),
      relation('house', IDS.houses, { required: true }),
      relation('booked_by_user', USERS, { required: true }),
      date('start_date', { required: true }),
      date('end_date', { required: true }),
    ],
    rules(
      VIA_ITEM,
      VIA_ITEM,
      `${AUTH} && booked_by_user = @request.auth.id && ${VIA_ITEM}`,
      'booked_by_user = @request.auth.id',
      'house.house_residents_via_house.user ?= @request.auth.id || item.home_house.house_residents_via_house.user ?= @request.auth.id',
    ),
    ['CREATE INDEX `idx_bookings_item` ON `bookings` (`item`, `start_date`)'],
  ),
  collection(
    IDS.proposals,
    'proposals',
    [
      text('title', { required: true, presentable: true, max: 120 }),
      text('description'),
      text('url', { max: 2000 }),
      number('estimated_cost', { min: 0 }),
      relation('group', IDS.groups, { required: true }),
      relation('created_by_user', USERS, { required: true }),
    ],
    rules(
      VIA_GROUP,
      VIA_GROUP,
      `${AUTH} && created_by_user = @request.auth.id && ${VIA_GROUP}`,
      VIA_GROUP,
      'created_by_user = @request.auth.id',
    ),
    ['CREATE INDEX `idx_proposals_group` ON `proposals` (`group`)'],
  ),
  collection(
    IDS.votes,
    'votes',
    [
      relation('proposal', IDS.proposals, { required: true }),
      relation('house', IDS.houses, { required: true }),
      relation('voted_by_user', USERS, { required: true }),
      bool('is_approved', { required: true }),
    ],
    rules(
      VIA_PROPOSAL,
      VIA_PROPOSAL,
      `${AUTH} && voted_by_user = @request.auth.id && ${VIA_PROPOSAL}`,
      VIA_PROPOSAL,
      VIA_PROPOSAL,
    ),
    ['CREATE UNIQUE INDEX `idx_votes_proposal_house` ON `votes` (`proposal`, `house`)'],
  ),
  collection(
    IDS.joins,
    'house_join_requests',
    [
      relation('group', IDS.groups, { required: true }),
      relation('house', IDS.houses, { required: true }),
      relation('user', USERS, { required: true }),
      text('user_name', { max: 80, id: 'f_user_name_join' }),
      select('status', ['pending', 'accepted', 'refused'], { required: true }),
      bool('seen'),
    ],
    rules(
      'user = @request.auth.id || house.created_by = @request.auth.id',
      'user = @request.auth.id || house.created_by = @request.auth.id',
      `${AUTH} && user = @request.auth.id && house.created_by != @request.auth.id && status = "pending" && ${VIA_GROUP}`,
      'house.created_by = @request.auth.id',
      'user = @request.auth.id && status != "accepted"',
    ),
    ['CREATE INDEX `idx_join_group` ON `house_join_requests` (`group`)'],
  ),
];

function uniqueFieldIds(col) {
  const used = new Set();
  for (const field of col.fields) {
    if (used.has(field.id)) field.id = `${field.id}_${col.name}`.slice(0, 24);
    used.add(field.id);
  }
}

for (const col of collections) {
  for (const field of col.fields) {
    if (field.name === 'created') field.id = `created_${col.name}`.slice(0, 24);
    if (field.name === 'updated') field.id = `updated_${col.name}`.slice(0, 24);
    if (field.name === 'id') field.id = `id_${col.name}`.slice(0, 24);
  }
  uniqueFieldIds(col);
}

const dir = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(dir, 'collections.json');
fs.writeFileSync(out, JSON.stringify(collections, null, 2));
console.log(`wrote ${collections.length} collections to ${path.basename(out)}`);
