import { errorMessage } from '../infrastructure/errors.js';
import { escapeHtml, MARK } from './html.js';

export class AuthScreens {
  constructor(app) {
    this.app = app;
  }

  get root() {
    return this.app.root;
  }

  authShell(title, text, body) {
    const demo = this.app.onDemo
      ? `<div class="mt-8 border-t border-stone-200 pt-5">
          <p class="mb-3 text-sm text-stone-500">Sans compte, pour regarder seulement.</p>
          <button type="button" data-demo class="btn btn-demo w-full">Parcourir avec des données d’exemple</button>
        </div>`
      : '';
    this.root.innerHTML = `
      <main class="mx-auto grid min-h-screen max-w-5xl items-center gap-10 px-4 py-12 md:grid-cols-2">
        <section>
          <div class="flex items-center gap-3">${MARK}<p class="font-display text-5xl">Palier</p></div>
          <p class="mt-4 max-w-md text-lg text-stone-700">N’achetez plus ce que le palier a déjà. Un voisin l’a : vous le prenez, vous le ramenez.</p>
        </section>
        <section class="panel p-6">
          <h1 class="font-display text-3xl">${title}</h1>
          <p class="mt-2 text-sm text-stone-600">${text}</p>
          ${body}
          ${demo}
        </section>
      </main>
    `;
    this.bindDemo();
  }

  renderLogin(message = '', ok = false) {
    const alert = message
      ? `<p class="mt-4 rounded-2xl px-3 py-2 text-sm ${ok ? 'bg-emerald-50 text-emerald-950' : 'bg-red-50 text-red-800'}">${escapeHtml(message)}</p>`
      : '';
    this.authShell(
      'Entrer',
      'Votre email et un mot de passe.',
      `
        ${alert}
        <form class="mt-6 grid gap-3" data-auth="login">
          <label class="label">Email
            <input class="field" name="email" type="email" autocomplete="email" required />
          </label>
          <label class="label">Mot de passe
            <input class="field" name="password" type="password" autocomplete="current-password" required minlength="8" />
          </label>
          <button class="btn btn-primary w-full" type="submit">Entrer</button>
        </form>
        <div class="mt-3 grid gap-3">
          <button type="button" class="btn btn-ghost w-full" data-auth-screen="register">Créer un compte</button>
          <button type="button" class="btn btn-ghost w-full" data-auth-screen="forgot">Mot de passe oublié</button>
        </div>
      `,
    );
    this.root.querySelector('[data-auth="login"]').addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.target;
      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      try {
        await this.app.auth.login(form.elements.email.value, form.elements.password.value);
      } catch (error) {
        this.renderLogin(errorMessage(error, 'Email ou mot de passe incorrect.'));
      }
    });
    this.bindAuthScreens();
  }

  renderRegister(message = '') {
    const alert = message
      ? `<p class="mt-4 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-800">${escapeHtml(message)}</p>`
      : '';
    this.authShell(
      'Créer un compte',
      'Votre nom s’affiche quand un objet change de maison.',
      `
        ${alert}
        <form class="mt-6 grid gap-3" data-auth="register">
          <label class="label">Votre nom
            <input class="field" name="name" autocomplete="name" required maxlength="80" />
          </label>
          <label class="label">Email
            <input class="field" name="email" type="email" autocomplete="email" required />
          </label>
          <label class="label">Mot de passe
            <input class="field" name="password" type="password" autocomplete="new-password" required minlength="8" />
          </label>
          <button class="btn btn-primary w-full" type="submit">Créer le compte</button>
        </form>
        <button type="button" class="btn btn-ghost mt-3 w-full" data-auth-screen="login">J’ai déjà un compte</button>
      `,
    );
    this.root.querySelector('[data-auth="register"]').addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.target;
      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      try {
        await this.app.auth.register({
          name: form.elements.name.value,
          email: form.elements.email.value,
          password: form.elements.password.value,
        });
      } catch (error) {
        this.renderRegister(errorMessage(error, 'Le compte n’a pas pu être créé.'));
      }
    });
    this.bindAuthScreens();
  }

  renderForgot(message = '', sent = false) {
    const alert = message
      ? `<p class="mt-4 rounded-2xl px-3 py-2 text-sm ${sent ? 'bg-emerald-50 text-emerald-950' : 'bg-red-50 text-red-800'}">${escapeHtml(message)}</p>`
      : '';
    const form = sent
      ? ''
      : `
        <form class="mt-6 grid gap-3" data-auth="forgot">
          <label class="label">Email
            <input class="field" name="email" type="email" autocomplete="email" required />
          </label>
          <button class="btn btn-primary w-full" type="submit">Envoyer le lien</button>
        </form>
      `;
    this.authShell(
      'Mot de passe oublié',
      'Indiquez l’adresse du compte. Si elle existe, un lien arrive.',
      `
        ${alert}
        ${form}
        <button type="button" class="btn btn-ghost mt-3 w-full" data-auth-screen="login">Retour</button>
      `,
    );
    this.root.querySelector('[data-auth="forgot"]')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formElement = event.target;
      const button = formElement.querySelector('button[type="submit"]');
      button.disabled = true;
      try {
        await this.app.auth.requestPasswordReset(formElement.elements.email.value);
        this.renderForgot('Si un compte existe pour cette adresse, le lien est parti.', true);
      } catch (error) {
        this.renderForgot(errorMessage(error, 'Le lien n’a pas pu partir. La boîte mail de PocketBase est-elle réglée ?'));
      }
    });
    this.bindAuthScreens();
  }

  renderReset(token, message = '') {
    const alert = message
      ? `<p class="mt-4 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-800">${escapeHtml(message)}</p>`
      : '';
    this.authShell(
      'Nouveau mot de passe',
      'Choisissez-en un d’au moins huit caractères.',
      `
        ${alert}
        <form class="mt-6 grid gap-3" data-auth="reset">
          <label class="label">Nouveau mot de passe
            <input class="field" name="password" type="password" autocomplete="new-password" required minlength="8" />
          </label>
          <label class="label">Confirmation
            <input class="field" name="confirm" type="password" autocomplete="new-password" required minlength="8" />
          </label>
          <button class="btn btn-primary w-full" type="submit">Enregistrer</button>
        </form>
      `,
    );
    this.root.querySelector('[data-auth="reset"]').addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.target;
      if (form.elements.password.value !== form.elements.confirm.value) {
        this.renderReset(token, 'Les deux mots de passe diffèrent.');
        return;
      }
      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      try {
        await this.app.auth.confirmPasswordReset(token, form.elements.password.value);
        this.app.resetToken = '';
        const url = new URL(window.location.href);
        url.searchParams.delete('reset');
        window.history.replaceState({}, '', url.pathname + url.search);
        this.renderLogin('Mot de passe enregistré. Vous pouvez entrer.', true);
      } catch (error) {
        this.renderReset(token, errorMessage(error, 'Ce lien n’est plus valable. Redemandez-en un.'));
      }
    });
  }

  bindAuthScreens() {
    this.root.querySelectorAll('[data-auth-screen]').forEach((button) => {
      button.addEventListener('click', () => {
        const screen = button.dataset.authScreen;
        if (screen === 'register') this.renderRegister();
        else if (screen === 'forgot') this.renderForgot();
        else this.renderLogin();
      });
    });
  }

  renderProblem(error) {
    const message = error?.status === 404
      ? 'Les collections Palier sont introuvables. Importez pocketbase/collections.json dans l’admin PocketBase.'
      : errorMessage(error);
    this.root.innerHTML = `
      <main class="mx-auto max-w-lg px-4 py-20">
        <section class="panel p-6">
          <h1 class="font-display text-3xl">Palier ne joint pas les données</h1>
          <p class="mt-3 text-sm text-stone-700">${escapeHtml(message)}</p>
          <div class="mt-6">
            <button type="button" data-retry class="btn btn-primary w-full">Réessayer</button>
          </div>
          ${this.app.onDemo ? `<div class="mt-8 border-t border-stone-200 pt-5">
            <p class="mb-3 text-sm text-stone-500">Sans compte, pour regarder seulement.</p>
            <button type="button" data-demo class="btn btn-demo w-full">Parcourir avec des données d’exemple</button>
          </div>` : ''}
        </section>
      </main>
    `;
    this.root.querySelector('[data-retry]').addEventListener('click', () => this.app.boot());
    this.bindDemo();
  }

  bindDemo() {
    this.root.querySelector('[data-demo]')?.addEventListener('click', () => this.app.onDemo?.());
  }
}
