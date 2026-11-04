import PocketBase from 'pocketbase';

export function createPocketBaseClient(url) {
  const pb = new PocketBase(url);
  pb.autoCancellation(false);
  return pb;
}
