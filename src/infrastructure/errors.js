export function errorMessage(error, fallback = 'Une erreur est survenue.') {
  if (error?.status === 0 || error?.message === 'Failed to fetch') {
    return 'Connexion au serveur impossible.';
  }
  const data = error?.data?.data ?? error?.data ?? error?.response?.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const messages = [];
    for (const value of Object.values(data)) {
      if (typeof value?.message === 'string') messages.push(value.message);
      else if (typeof value === 'string') messages.push(value);
    }
    if (messages.length) return messages.join(' ');
  }
  if (typeof error?.message === 'string' && error.message && !error.message.startsWith('Failed to')) {
    return error.message;
  }
  return fallback;
}
