// Web preview (Yana's desktop link, 2026-11-21): save to the browser's localStorage instead of SQLite.
function ls(): globalThis.Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export const Storage = {
  getItemSync(key: string): string | null {
    return ls()?.getItem(key) ?? null;
  },
  setItemSync(key: string, value: string) {
    ls()?.setItem(key, value);
  },
  removeItemSync(key: string) {
    ls()?.removeItem(key);
  },
  // async versions, used by the Supabase login session
  async getItem(key: string) {
    return ls()?.getItem(key) ?? null;
  },
  async setItem(key: string, value: string) {
    ls()?.setItem(key, value);
  },
  async removeItem(key: string) {
    ls()?.removeItem(key);
  },
};
