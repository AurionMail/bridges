import { ORIGINS } from '../shared/constants';
import { deleteDB, openDB } from '../shared/db';
import { handleLogoutFlow } from '../shared/logout';

function clearCookies() {
  const cookiesToClear = ['ssotoken', 'token', 'session'];
  cookiesToClear.forEach((name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${window.location.hostname}; path=/`;
  });
}

function clearLocalStorage() {
  ['loginToken', 'sessionJWT', 'SSO_seed', 'username', 'Block_hash', 'pad'].forEach(key => localStorage.removeItem(key));
}

async function performStorageCleanup() {
  clearLocalStorage();
  clearCookies();
  await Promise.all(['localforage', 'cp_cache'].map(deleteDB));
}

window.addEventListener('message', (event) => {
  if (event.origin !== ORIGINS.WEBMAIL && event.origin !== ORIGINS.SSO) return;

  const { data, source, origin } = event;
  if (!data || !source) return;

  if (data.type === 'WRITE_SECRET' && data.secret) {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = `${ORIGINS.SAND}/bridge-sand.html`;
    document.body.appendChild(iframe);

    const handleSandMessage = async (sandEvent: MessageEvent) => {
      if (sandEvent.origin !== ORIGINS.SAND) return;
      
      if (sandEvent.data?.type === 'SAND_WRITE_SUCCESS') {
        window.removeEventListener('message', handleSandMessage);
        document.body.removeChild(iframe);

        try {
          const db = await openDB("AurionAuth", 1, (db) => {
             if (!db.objectStoreNames.contains("keys")) db.createObjectStore("keys");
          });
          const tx = db.transaction("keys", "readwrite");
          tx.objectStore("keys").put(data.secret, "temp_key");
          tx.oncomplete = () => {
             db.close();
             source.postMessage({ type: 'WRITE_SUCCESS' }, { targetOrigin: origin });
          };
        } catch (e) { console.error(e); }
      }
    };

    window.addEventListener('message', handleSandMessage);

    iframe.onload = () => {
      iframe.contentWindow?.postMessage({
        type: 'WRITE_SAND_DATA',
        color: data.color,
        server: data.server,
        mail: data.mail,
        logoutAll: data.logoutAll
      }, ORIGINS.SAND);
    };
  }

  if (data.type === 'LOGOUT') {
    handleLogoutFlow(source, origin, performStorageCleanup);
  }
});