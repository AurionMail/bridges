import { ORIGINS } from '../shared/constants';
import { openDB, writeKV } from '../shared/db';
import { handleLogoutFlow } from '../shared/logout';

const DB_NAME = 'aurion-plugin-store';

async function performPluginCleanup() {
  const db = await openDB(DB_NAME);
  const storesToClear = ['dangerous-keys', 'key-records', 'message-cache']
    .filter(store => db.objectStoreNames.contains(store));

  if (storesToClear.length === 0) {
    db.close();
    return;
  }

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storesToClear, 'readwrite');
    storesToClear.forEach((storeName) => tx.objectStore(storeName).clear());
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

window.addEventListener('message', async (event) => {
  if (event.origin !== ORIGINS.SSO && event.origin !== ORIGINS.WEBMAIL) return;

  if (event.data?.type === 'WRITE_SECRET' && event.data.secret && event.source) {
    try {
      await writeKV(DB_NAME, 'aurion-secret', 'aurion-secret', event.data.secret);
      event.source.postMessage({ type: 'WRITE_SUCCESS' }, { targetOrigin: event.origin });
    } catch (e) {
      console.error(e);
    }
  }

  if (event.data?.type === 'LOGOUT' && event.source) {
    handleLogoutFlow(event.source, event.origin, performPluginCleanup);
  }
});