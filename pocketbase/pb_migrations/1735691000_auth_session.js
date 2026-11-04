/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const users = app.findCollectionByNameOrId('_pb_users_auth_');
  users.authToken.duration = 94670856;
  app.save(users);
}, (app) => {
  const users = app.findCollectionByNameOrId('_pb_users_auth_');
  users.authToken.duration = 432000;
  app.save(users);
});
