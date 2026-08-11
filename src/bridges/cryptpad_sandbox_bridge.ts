import { ORIGINS } from '../shared/constants';
import { openDB } from '../shared/db';

window.addEventListener('message', async (event) => {
  // Attention: vérifiez que PAD_ORIGIN est bien le parent qui appelle ce bridge.
  if (event.origin !== ORIGINS.PAD) return;

  if (event.data?.type === 'WRITE_SAND_DATA') {
    try {
      const db = await openDB("AurionAuth", 1, (db) => {
         if (!db.objectStoreNames.contains("keys")) db.createObjectStore("keys");
      });
      const tx = db.transaction("keys", "readwrite");
      const store = tx.objectStore("keys");
      
      if (event.data.color) store.put(event.data.color, "color");
      if (event.data.server) store.put(event.data.server, "server");
      if (event.data.mail) store.put(event.data.mail, "mail");
      if (event.data.logoutAll) store.put(event.data.logoutAll, "logoutAll");

      tx.oncomplete = () => {
        db.close();
        event.source?.postMessage({ type: 'SAND_WRITE_SUCCESS' }, { targetOrigin: event.origin });
      };
    } catch (e) { console.error(e); }
  }
});