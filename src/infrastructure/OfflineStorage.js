export class OfflineStorage {
  constructor(dbName = 'palier') {
    this.dbName = dbName;
  }

  open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async set(key, value) {
    const db = await this.open();
    await new Promise((resolve, reject) => {
      const tx = db.transaction('kv', 'readwrite');
      tx.objectStore('kv').put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  }

  async get(key) {
    const db = await this.open();
    const value = await new Promise((resolve, reject) => {
      const tx = db.transaction('kv', 'readonly');
      const request = tx.objectStore('kv').get(key);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return value;
  }
}
