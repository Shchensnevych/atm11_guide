// @ts-check
// Віртуальне дерево теки гри (FileSystemDirectoryHandle + <input webkitdirectory>) та збереження дозволу в IndexedDB.

const IDB_NAME = 'atm11-game-folder-db';
const IDB_STORE = 'handles';

/** @typedef {{ name: string, kind: 'dir', getDir: (p: string) => Promise<VDir | null>, getFile: (p: string) => Promise<File | null>, listDirs: () => Promise<VDir[]>, listFiles: () => Promise<File[]> }} VDir */

function openIdb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** @param {any} handle */
export async function saveDirHandle(handle) {
  try {
    const db = /** @type {IDBDatabase} */ (await openIdb());
    await new Promise((res, rej) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(handle, 'root');
      tx.oncomplete = () => res(true);
      tx.onerror = () => rej(tx.error);
    });
  } catch { /* ігноруємо в приватному режимі */ }
}

export async function getSavedDirHandle() {
  try {
    const db = /** @type {IDBDatabase} */ (await openIdb());
    return await new Promise((res) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const r = tx.objectStore(IDB_STORE).get('root');
      r.onsuccess = () => res(r.result || null);
      r.onerror = () => res(null);
    });
  } catch {
    return null;
  }
}

export async function clearSavedDirHandle() {
  try {
    const db = /** @type {IDBDatabase} */ (await openIdb());
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete('root');
  } catch {}
}

/** @param {any} handle @returns {VDir} */
export function wrapHandle(handle) {
  /** @param {any} hDir @param {string[]} parts @returns {Promise<any>} */
  async function walkDir(hDir, parts) {
    let cur = hDir;
    for (const p of parts) {
      if (!p) continue;
      try { cur = await cur.getDirectoryHandle(p); } catch { return null; }
    }
    return cur;
  }
  return {
    name: handle.name || 'game',
    kind: 'dir',
    async getDir(relPath) {
      const parts = relPath.split('/').filter(Boolean);
      const sub = await walkDir(handle, parts);
      return sub ? wrapHandle(sub) : null;
    },
    async getFile(relPath) {
      const parts = relPath.split('/').filter(Boolean);
      const fn = parts.pop();
      if (!fn) return null;
      const dir = await walkDir(handle, parts);
      if (!dir) return null;
      try {
        const fh = await dir.getFileHandle(fn);
        return await fh.getFile();
      } catch {
        return null;
      }
    },
    async listDirs() {
      /** @type {VDir[]} */
      const out = [];
      try {
        for await (const [, entry] of handle.entries()) {
          if (entry.kind === 'directory') out.push(wrapHandle(entry));
        }
      } catch {}
      return out.sort((a, b) => a.name.localeCompare(b.name));
    },
    async listFiles() {
      /** @type {File[]} */
      const out = [];
      try {
        for await (const [, entry] of handle.entries()) {
          if (entry.kind === 'file') out.push(await entry.getFile());
        }
      } catch {}
      return out;
    },
  };
}

/** Будує VDir із FileList від <input webkitdirectory>. @param {FileList} fileList @returns {VDir} */
export function wrapFileList(fileList) {
  /** @type {{ name: string, dirs: Map<string, any>, files: Map<string, File> }} */
  const root = { name: 'game', dirs: new Map(), files: new Map() };
  for (let i = 0; i < fileList.length; i++) {
    const f = fileList[i];
    const rel = (f.webkitRelativePath || f.name).replace(/\\/g, '/');
    const parts = rel.split('/').filter(Boolean);
    if (parts.length > 1 && root.name === 'game') root.name = parts[0];
    const subParts = parts.length > 1 ? parts.slice(1) : parts;
    const fn = subParts.pop();
    if (!fn) continue;
    let cur = root;
    for (const p of subParts) {
      if (!cur.dirs.has(p)) cur.dirs.set(p, { name: p, dirs: new Map(), files: new Map() });
      cur = cur.dirs.get(p);
    }
    cur.files.set(fn, f);
  }
  /** @param {typeof root} node @returns {VDir} */
  function makeNode(node) {
    /** @param {string[]} parts */
    const walk = (parts) => {
      let c = node;
      for (const p of parts) { if (!p) continue; c = c?.dirs.get(p); if (!c) return null; }
      return c;
    };
    return {
      name: node.name,
      kind: 'dir',
      async getDir(relPath) {
        const sub = walk(relPath.split('/').filter(Boolean));
        return sub ? makeNode(sub) : null;
      },
      async getFile(relPath) {
        const parts = relPath.split('/').filter(Boolean);
        const fn = parts.pop();
        if (!fn) return null;
        const d = walk(parts);
        return d?.files.get(fn) || null;
      },
      async listDirs() {
        return [...node.dirs.values()].map(makeNode).sort((a, b) => a.name.localeCompare(b.name));
      },
      async listFiles() {
        return [...node.files.values()];
      },
    };
  }
  return makeNode(root);
}

/** Знаходить теку minecraft/, saves/ або окремого світу всередині обраної користувачем теки. @param {VDir} root */
export async function resolveMinecraftLayout(root) {
  const mcSub = (await root.getDir('minecraft')) || (await root.getDir('.minecraft'));
  if (mcSub) {
    return { mcDir: mcSub, savesDir: await mcSub.getDir('saves'), singleWorldDir: null };
  }
  const savesSub = await root.getDir('saves');
  if (savesSub || (await root.getFile('options.txt'))) {
    return { mcDir: root, savesDir: savesSub, singleWorldDir: null };
  }
  if (await root.getFile('level.dat')) {
    return { mcDir: null, savesDir: null, singleWorldDir: root };
  }
  return { mcDir: null, savesDir: root, singleWorldDir: null };
}

