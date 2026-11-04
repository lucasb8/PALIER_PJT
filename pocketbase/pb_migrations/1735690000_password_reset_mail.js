/// <reference path="../pb_data/types.d.ts" />

const resetMail = {
  subject: 'Mot de passe Palier',
  body: `<p>Quelqu’un a demandé un nouveau mot de passe pour ce compte Palier.</p>
<p><a href="{APP_URL}/?reset={TOKEN}">Choisir un nouveau mot de passe</a></p>
<p>Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.</p>`,
};

migrate((app) => {
  const users = app.findCollectionByNameOrId('_pb_users_auth_');
  users.resetPasswordTemplate.subject = resetMail.subject;
  users.resetPasswordTemplate.body = resetMail.body;
  app.save(users);
}, (app) => {
  const users = app.findCollectionByNameOrId('_pb_users_auth_');
  users.resetPasswordTemplate.subject = 'Reset your {APP_NAME} password';
  users.resetPasswordTemplate.body = `<p><a href="{APP_URL}/_/#/auth/confirm-password-reset/{TOKEN}">Reset password</a></p>`;
  app.save(users);
});
