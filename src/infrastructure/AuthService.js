import { User } from '../domain/User.js';

export class AuthService {
  constructor(pb) {
    this.pb = pb;
  }

  get isValid() {
    return this.pb.authStore.isValid;
  }

  currentUser() {
    const record = this.pb.authStore.record;
    if (!record) return null;
    const avatar = record.avatar ? this.pb.files.getURL(record, record.avatar, { thumb: '64x64' }) : '';
    return new User({
      id: record.id,
      email: record.email,
      name: record.name || record.email,
      avatar,
    });
  }

  register({ name, email, password }) {
    const users = this.pb.collection('users');
    const identity = email.trim();
    return users.create({
      email: identity,
      emailVisibility: false,
      name: name.trim(),
      password,
      passwordConfirm: password,
    }).then(() => users.authWithPassword(identity, password));
  }

  login(email, password) {
    return this.pb.collection('users').authWithPassword(email.trim(), password);
  }

  requestPasswordReset(email) {
    return this.pb.collection('users').requestPasswordReset(email.trim());
  }

  confirmPasswordReset(token, password) {
    return this.pb.collection('users').confirmPasswordReset(token, password, password);
  }

  logout() {
    this.pb.authStore.clear();
  }

  async keep() {
    if (!this.pb.authStore.token) return false;
    this.silent = true;
    try {
      await this.pb.collection('users').authRefresh();
      return true;
    } catch (error) {
      if (error?.status === 401) {
        this.silent = false;
        this.logout();
        return false;
      }
      return this.pb.authStore.isValid;
    } finally {
      this.silent = false;
    }
  }

  onChange(callback) {
    return this.pb.authStore.onChange(() => {
      if (this.silent) return;
      callback();
    });
  }
}
