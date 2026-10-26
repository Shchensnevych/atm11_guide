// @ts-check
// Мобільність у браузері (Варіант Б): кнопка «📂 Вказати теку гри» (showDirectoryPicker + fallback на <input webkitdirectory>).
// Читає прямо в браузері minecraft/saves/<світ> (level.dat, ftbquests, advancements, stats, <uuid>.dat), minecraft/options.txt та logs/latest.log.
import { slugify, readNbt, collectNbtItems, toHexId, parseJson5 } from './nbt.js';
import { parseOptions, saveUserOptions } from './keys-model.js';

const LS_KEY = 'atm11.gameFolder.v1';
const IDB_NAME = 'atm11-game-folder-db';
const IDB_STORE = 'handles';

/** @type {Record<number, [string, string]>} */
const GAME_MODES = {
  0: ['survival', 'Виживання'],
  1: ['creative', 'Творчість'],
  2: ['adventure', 'Пригода'],
  3: ['spectator', 'Спостерігач'],
};

/** Форматує Unix-час (секунди) у YYYY-MM-DD HH:MM. @param {number} ts */
function fmtTs(ts) {
  if (!ts) return '';
  const d = new Date(ts * 1000);
  const pad = (/** @type {number} */ n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── Збереження FileSystemDirectoryHandle у IndexedDB для оновлення в 1 клік ──
function openIdb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** @param {any} handle */
async function saveDirHandle(handle) {
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

async function clearSavedDirHandle() {
  try {
    const db = /** @type {IDBDatabase} */ (await openIdb());
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete('root');
  } catch {}
}

// ── Уніфіковане віртуальне дерево для showDirectoryPicker та <input webkitdirectory> ──
/** @typedef {{ name: string, kind: 'dir', getDir: (p: string) => Promise<VDir | null>, getFile: (p: string) => Promise<File | null>, listDirs: () => Promise<VDir[]>, listFiles: () => Promise<File[]> }} VDir */

/** @param {any} handle @returns {VDir} */
function wrapHandle(handle) {
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
function wrapFileList(fileList) {
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
async function resolveMinecraftLayout(root) {
  // Варіант 1: обрано корінь інстансу (всередині є minecraft/ або .minecraft/)
  const mcSub = (await root.getDir('minecraft')) || (await root.getDir('.minecraft'));
  if (mcSub) {
    return { mcDir: mcSub, savesDir: await mcSub.getDir('saves'), singleWorldDir: null };
  }
  // Варіант 2: обрано саму теку minecraft/ (є saves/ або options.txt)
  const savesSub = await root.getDir('saves');
  if (savesSub || (await root.getFile('options.txt'))) {
    return { mcDir: root, savesDir: savesSub, singleWorldDir: null };
  }
  // Варіант 3: обрано конкретний світ (є level.dat)
  if (await root.getFile('level.dat')) {
    return { mcDir: null, savesDir: null, singleWorldDir: root };
  }
  // Варіант 4: обрано теку saves/ (всередині підтеки зі світами)
  return { mcDir: null, savesDir: root, singleWorldDir: null };
}

/** Будує каталог квестів і завдань з уже завантаженого Store + за наявності з config/ftbquests/quests/chapters/*.json5.
 * @param {Store} store @param {VDir | null} mcDir */
async function buildQuestCatalog(store, mcDir) {
  /** @type {Record<string, { title: string, hidden: boolean, quests: number }>} */
  const chMeta = {};
  for (const c of store.chapters?.chapters || []) {
    chMeta[c.file] = { title: c.title || c.file, hidden: !!c.hidden, quests: c.quests || 0 };
  }
  /** @type {Record<string, { chapter: string, title: string, hidden: boolean, optional: boolean }>} */
  const qMeta = {};
  for (const [qid, info] of Object.entries(store.roadmap?.quest_info || {})) {
    qMeta[qid] = { chapter: info.chapter, title: info.title, hidden: !!chMeta[info.chapter]?.hidden, optional: false };
  }
  // Довантажуємо каталоги глав квестів із локальних JSON сайту (паралельно з кешем store)
  const chFiles = (store.chapters?.chapters || []).map((c) => c.file);
  const loadedChs = await Promise.all(chFiles.map((fn) => fetch(`data/quests/${fn}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null)));
  for (const d of loadedChs) {
    if (!d || !Array.isArray(d.quests)) continue;
    const fn = d.chapter;
    const hid = !!chMeta[fn]?.hidden;
    for (const q of d.quests) {
      qMeta[q.id] = { chapter: fn, title: q.title || '', hidden: hid, optional: !!q.optional };
    }
  }
  /** @type {Record<string, { chapter: string, quest: string }>} */
  const tMeta = {};
  const chapDir = mcDir ? await mcDir.getDir('config/ftbquests/quests/chapters') : null;
  if (chapDir) {
    const files = await chapDir.listFiles();
    for (const f of files) {
      if (!f.name.endsWith('.json5')) continue;
      const c = parseJson5(await f.text());
      const fn = c.filename || f.name.replace(/\.json5$/, '');
      for (const q of c.quests || []) {
        const qid = q.id;
        for (const t of q.tasks || []) {
          if (t?.id && qid) tMeta[t.id] = { chapter: fn, quest: qid };
        }
      }
    }
  }
  return { chMeta, qMeta, tMeta };
}

/** Знаходить UUID активного гравця у світі за найновішим часом модифікації файлів. @param {VDir} wdir */
async function findPlayerUuid(wdir) {
  /** @type {[number, string][]} */
  const cands = [];
  const specs = [
    ['players/data', '.dat'], ['playerdata', '.dat'],
    ['ftbquests', '.json5'], ['players/advancements', '.json'], ['players/stats', '.json'],
  ];
  for (const [sub, ext] of specs) {
    const d = await wdir.getDir(sub);
    if (!d) continue;
    for (const f of await d.listFiles()) {
      if (f.name.endsWith(ext) && !f.name.endsWith('_old')) {
        const u = f.name.slice(0, -ext.length);
        if (/^[0-9a-fA-F-]{32,36}$/.test(u)) cands.push([f.lastModified || 0, u]);
      }
    }
  }
  if (!cands.length) return null;
  cands.sort((a, b) => b[0] - a[0]);
  return cands[0][1];
}

/** Розбирає один світ у теці saves/<світ>/ (повний аналог extract_world у tools/extract_progress.py).
 * @param {VDir} wdir @param {string} slug @param {any} cat @param {string} nowStr */
async function extractWorldInBrowser(wdir, slug, cat, nowStr) {
  const { qMeta, tMeta } = cat;
  const folder = wdir.name;
  const ldFile = await wdir.getFile('level.dat');
  const ldRoot = ldFile ? await readNbt(await ldFile.arrayBuffer()).catch(() => ({})) : {};
  const ld = ldRoot.Data || {};
  const worldName = ld.LevelName || folder;
  const gt = Number(ld.GameType ?? 0);
  let [mode, modeUk] = ld.hardcore === 1 ? ['hardcore', 'Хардкор'] : (GAME_MODES[gt] || ['survival', 'Виживання']);

  const uuid = await findPlayerUuid(wdir);
  /** @type {number[]} */
  const mtimes = [];
  if (ldFile?.lastModified) mtimes.push(ldFile.lastModified / 1000);
  if (ld.LastPlayed) mtimes.push(Number(ld.LastPlayed) / 1000);

  // 1. Дані гравця (.dat NBT)
  /** @type {Record<string, number>} */
  const invCounts = {};
  /** @type {Record<string, any>} */
  const pInfo = { uuid: uuid || '' };
  if (uuid) {
    const pFile = (await wdir.getFile(`players/data/${uuid}.dat`)) || (await wdir.getFile(`playerdata/${uuid}.dat`));
    if (pFile) {
      if (pFile.lastModified) mtimes.push(pFile.lastModified / 1000);
      const pnbt = await readNbt(await pFile.arrayBuffer()).catch(() => ({}));
      for (const k of ['Inventory', 'EnderItems', 'equipment', 'neoforge:attachments']) {
        if (pnbt[k]) collectNbtItems(pnbt[k], invCounts);
      }
      if (pnbt.playerGameType === 1 && mode !== 'creative') [mode, modeUk] = ['creative', 'Творчість'];
      pInfo.xp_level = Number(pnbt.XpLevel || 0);
      pInfo.dimension = pnbt.Dimension || 'minecraft:overworld';
      const att = pnbt['neoforge:attachments'] || {};
      if (att['apotheosis:world_tier'] && typeof att['apotheosis:world_tier'] === 'object') {
        pInfo.world_tier = att['apotheosis:world_tier'].tier || 'haven';
      }
      if (att['solcarrot:food'] && Array.isArray(att['solcarrot:food'].foodList)) {
        pInfo.unique_foods = att['solcarrot:food'].foodList.length;
      }
    }
  }

  // 2. Квести FTB (ftbquests/<uuid>.json5)
  const qDone = new Set();
  const qStarted = new Set();
  const tDone = new Set();
  let rewardsClaimed = 0;
  if (uuid) {
    const fqFile = await wdir.getFile(`ftbquests/${uuid}.json5`);
    if (fqFile) {
      if (fqFile.lastModified) mtimes.push(fqFile.lastModified / 1000);
      const fq = parseJson5(await fqFile.text());
      if (fq.name) pInfo.name = String(fq.name).split('#')[0];
      rewardsClaimed = Object.keys(fq.claimed_rewards || {}).length;
      for (const decId of Object.keys(fq.task_progress || {})) {
        const hid = toHexId(decId);
        if (hid && (!Object.keys(tMeta).length || tMeta[hid])) tDone.add(hid);
      }
      for (const decId of Object.keys(fq.completed || {})) {
        const hid = toHexId(decId);
        if (!hid) continue;
        if (qMeta[hid]) qDone.add(hid);
        else tDone.add(hid);
      }
      for (const decId of Object.keys(fq.started || {})) {
        const hid = toHexId(decId);
        if (!hid) continue;
        if (qMeta[hid] && !qDone.has(hid)) qStarted.add(hid);
        else if (tMeta[hid]) {
          const qid = tMeta[hid].quest;
          if (qMeta[qid] && !qDone.has(qid)) qStarted.add(qid);
        }
      }
    }
  }

  /** @type {Record<string, { done: string[], started: string[] }>} */
  const byChapter = {};
  for (const qid of [...qDone].sort()) {
    const ch = qMeta[qid]?.chapter;
    if (!ch) continue;
    (byChapter[ch] ||= { done: [], started: [] }).done.push(qid);
  }
  for (const qid of [...qStarted].sort()) {
    const ch = qMeta[qid]?.chapter;
    if (!ch) continue;
    (byChapter[ch] ||= { done: [], started: [] }).started.push(qid);
  }
  const qDoneVis = [...qDone].filter((qid) => !qMeta[qid]?.hidden).sort();

  // 3. Досягнення (players/advancements/<uuid>.json)
  /** @type {string[]} */
  const advDone = [];
  if (uuid) {
    const advFile = await wdir.getFile(`players/advancements/${uuid}.json`);
    if (advFile) {
      if (advFile.lastModified) mtimes.push(advFile.lastModified / 1000);
      try {
        const ad = JSON.parse(await advFile.text()) || {};
        for (const [k, v] of Object.entries(ad)) {
          if (v && typeof v === 'object' && v.done === true && !/:recipes?\//.test(k)) advDone.push(k);
        }
      } catch {}
    }
  }
  advDone.sort();

  // 4. Статистика (players/stats/<uuid>.json)
  /** @type {Record<string, number>} */
  const crafted = {};
  const obtainedSet = new Set(Object.keys(invCounts));
  let playTicks = Number(ld.Time || 0);
  if (uuid) {
    const stFile = await wdir.getFile(`players/stats/${uuid}.json`);
    if (stFile) {
      if (stFile.lastModified) mtimes.push(stFile.lastModified / 1000);
      try {
        const st = (JSON.parse(await stFile.text()) || {}).stats || {};
        for (const [k, v] of Object.entries(st['minecraft:crafted'] || {})) {
          if (k !== 'minecraft:air' && Number(v) > 0) { crafted[k] = Number(v); obtainedSet.add(k); }
        }
        for (const bucket of ['minecraft:picked_up', 'minecraft:used', 'minecraft:mined', 'minecraft:dropped']) {
          for (const [k, v] of Object.entries(st[bucket] || {})) {
            if (k !== 'minecraft:air' && Number(v) > 0) obtainedSet.add(k);
          }
        }
        const pt = st['minecraft:custom']?.['minecraft:play_time'];
        if (typeof pt === 'number') playTicks = pt;
      } catch {}
    }
  }

  const lastTs = mtimes.length ? Math.floor(Math.max(...mtimes)) : 0;
  return {
    slug,
    world: worldName,
    folder,
    mode,
    mode_uk: modeUk,
    game_type: gt,
    last_played: fmtTs(lastTs),
    last_played_ts: lastTs,
    updated: nowStr,
    play_hours: Math.round((playTicks / 72000) * 100) / 100,
    player: pInfo,
    quests: {
      done: [...qDone].sort(),
      done_visible: qDoneVis,
      started: [...qStarted].sort(),
      tasks_done: [...tDone].sort(),
      rewards_claimed: rewardsClaimed,
      by_chapter: byChapter,
    },
    advancements: { done: advDone },
    items: {
      obtained: [...obtainedSet].sort(),
      crafted: Object.fromEntries(Object.entries(crafted).sort(([a], [b]) => a.localeCompare(b))),
      inventory: Object.fromEntries(Object.entries(invCounts).sort(([a], [b]) => a.localeCompare(b))),
    },
  };
}

/** Отримує збережений у localStorage знімок з обраної в браузері теки гри. */
export function getBrowserGameState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Скидає дані з обраної в браузері теки гри до стандартних даних збірки. */
export async function clearBrowserGameState() {
  try { localStorage.removeItem(LS_KEY); } catch {}
  saveUserOptions(null);
  await clearSavedDirHandle();
}

/** Читає VDir теки гри, оновлює світи, options.txt та latest.log, зберігає у localStorage.
 * @param {VDir} rootDir @param {Store} store */
async function scanGameRoot(rootDir, store) {
  const { mcDir, savesDir, singleWorldDir } = await resolveMinecraftLayout(rootDir);
  const nowStr = fmtTs(Math.floor(Date.now() / 1000));

  // 1. Оновлюємо клавіші з options.txt (якщо є)
  let keysUpdated = 0;
  const optFile = mcDir ? await mcDir.getFile('options.txt') : null;
  if (optFile) {
    const binds = parseOptions(await optFile.text());
    keysUpdated = Object.keys(binds).length;
    if (keysUpdated > 0) {
      saveUserOptions({ name: 'options.txt (з теки гри)', date: nowStr, binds });
    }
  }

  // 2. Оновлюємо світи з saves/<світ>/
  /** @type {VDir[]} */
  const worldDirs = [];
  if (singleWorldDir) {
    worldDirs.push(singleWorldDir);
  } else if (savesDir) {
    for (const d of await savesDir.listDirs()) {
      if (await d.getFile('level.dat')) worldDirs.push(d);
    }
  }

  const cat = await buildQuestCatalog(store, mcDir);
  const usedSlugs = new Set();
  /** @type {any[]} */
  const extracted = [];
  for (const wd of worldDirs) {
    const baseSlug = slugify(wd.name);
    let slug = baseSlug;
    let n = 2;
    while (usedSlugs.has(slug)) slug = `${baseSlug}_${n++}`;
    usedSlugs.add(slug);
    extracted.push(await extractWorldInBrowser(wd, slug, cat, nowStr));
  }

  extracted.sort((a, b) => Number(a.mode === 'creative') - Number(b.mode === 'creative') || (b.last_played_ts - a.last_played_ts));
  const nonCreative = extracted.filter((w) => w.mode !== 'creative');
  const chosen = nonCreative[0] || extracted[0] || null;

  const worldsSummary = extracted.map((w) => ({
    slug: w.slug, world: w.world, folder: w.folder, mode: w.mode, mode_uk: w.mode_uk,
    last_played: w.last_played, last_played_ts: w.last_played_ts, updated: w.updated, play_hours: w.play_hours,
    quests_done: w.quests.done.length, quests_visible_done: w.quests.done_visible.length,
    quests_started: w.quests.started.length, advancements_done: w.advancements.done.length,
    items_obtained: w.items.obtained.length,
  }));

  /** @type {Record<string, any>} */
  const bySlug = {};
  for (const w of extracted) {
    bySlug[w.slug] = { ...w, default: chosen?.slug || '', worlds: worldsSummary, from_browser: true };
  }

  // 3. Зчитуємо останні рядки logs/latest.log (якщо є)
  let logTail = '';
  const logFile = mcDir ? await mcDir.getFile('logs/latest.log') : null;
  if (logFile) {
    try {
      const size = logFile.size;
      const slice = size > 24576 ? logFile.slice(size - 24576, size) : logFile;
      const txt = await slice.text();
      logTail = txt.split(/\r?\n/).slice(-80).join('\n');
    } catch {}
  }

  if (!extracted.length && !keysUpdated) {
    throw new Error('У вибраній теці не знайдено ні minecraft/saves/<світ>/level.dat, ні minecraft/options.txt. Оберіть теку інстансу ATM11 або теку minecraft.');
  }

  const state = {
    folderName: rootDir.name,
    updated: nowStr,
    keysUpdated,
    defaultSlug: chosen?.slug || '',
    worlds: worldsSummary,
    bySlug,
    logTail,
  };
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch {}
  return state;
}

/** Відкриває діалог вибору теки гри (showDirectoryPicker або fallback <input webkitdirectory>) і зчитує сейви та клавіші.
 * @param {Store} store @returns {Promise<any>} */
export async function pickGameFolder(store) {
  if ('showDirectoryPicker' in window) {
    const handle = await /** @type {any} */ (window).showDirectoryPicker({ id: 'atm11-game', mode: 'read' });
    await saveDirHandle(handle);
    return await scanGameRoot(wrapHandle(handle), store);
  }
  return await new Promise((resolve, reject) => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.setAttribute('webkitdirectory', '');
    inp.multiple = true;
    inp.hidden = true;
    inp.onchange = async () => {
      try {
        const files = inp.files;
        inp.remove();
        if (!files || !files.length) { reject(new Error('cancelled')); return; }
        resolve(await scanGameRoot(wrapFileList(files), store));
      } catch (e) {
        reject(e);
      }
    };
    document.body.append(inp);
    inp.click();
  });
}

/** Перечитує дані з уже збереженого FileSystemDirectoryHandle в 1 клік (або відкриває діалог вибору, якщо дозволу немає).
 * @param {Store} store */
export async function rescanSavedGameFolder(store) {
  const handle = await getSavedDirHandle();
  if (handle && typeof handle.queryPermission === 'function') {
    let perm = await handle.queryPermission({ mode: 'read' });
    if (perm !== 'granted' && typeof handle.requestPermission === 'function') {
      perm = await handle.requestPermission({ mode: 'read' });
    }
    if (perm === 'granted') {
      return await scanGameRoot(wrapHandle(handle), store);
    }
  }
  return await pickGameFolder(store);
}
