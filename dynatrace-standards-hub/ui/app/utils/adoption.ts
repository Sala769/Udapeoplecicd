const STORAGE_KEY = "udapeople-standards-hub.adopted";

/**
 * Per-viewer "adopted in this repo" checklist. Backed by localStorage so it
 * survives reloads without needing a backend; wrapped in try/catch because
 * storage access can throw (private browsing, restrictive embeds).
 */
export function loadAdopted(): Set<string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function saveAdopted(ids: Set<string>): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // Storage unavailable — adoption state simply won't persist this session.
  }
}
