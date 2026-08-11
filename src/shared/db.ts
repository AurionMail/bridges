export function openDB(name: string, version: number = 1, onUpgrade?: (db: IDBDatabase) => void): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version);
    if (onUpgrade) {
      req.onupgradeneeded = (e) => onUpgrade((e.target as IDBOpenDBRequest).result);
    }
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror = () => reject(req.error);
  });
}

export function deleteDB(name: string): Promise<void> {
  return new Promise((resolve) => {
    const req = indexedDB.deleteDatabase(name);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve(); 
    req.onblocked = () => resolve();
  });
}

export async function writeKV(dbName: string, storeName: string, key: string, value: any, version: number = 1): Promise<void> {
  const db = await openDB(dbName, version, (db) => {
    if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName);
  });
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(value, key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}