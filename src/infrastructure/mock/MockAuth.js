export class MockAuth {
  constructor(user) {
    this.user = user;
    this.signedIn = true;
    this.listeners = new Set();
  }

  get isValid() {
    return this.signedIn;
  }

  currentUser() {
    return this.signedIn ? this.user : null;
  }

  async login() {
    this.signedIn = true;
    this.emit();
  }

  logout() {
    this.signedIn = false;
    this.emit();
  }

  keep() {
    return Promise.resolve(this.signedIn);
  }

  onChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  emit() {
    for (const callback of this.listeners) callback();
  }
}

export class UnavailableAuth {
  get isValid() {
    return false;
  }

  currentUser() {
    return null;
  }

  login() {
    return Promise.reject(new Error('PocketBase n’est pas joignable. Parcourez les données d’exemple, ou renseignez PUBLIC_POCKETBASE_URL.'));
  }

  register() {
    return this.login();
  }

  requestPasswordReset() {
    return this.login();
  }

  confirmPasswordReset() {
    return this.login();
  }

  logout() {}

  keep() {
    return Promise.resolve(false);
  }

  onChange() {
    return () => {};
  }
}
