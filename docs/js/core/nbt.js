// @ts-check
// Читання бінарних файлів NBT (level.dat, players/data/<uuid>.dat) та JSON5 (ftbquests/<uuid>.json5) прямо в браузері.
// Використовує вбудований DecompressionStream('gzip') без жодних зовнішніх залежностей.

const TRANSLIT = /** @type {Record<string, string>} */ ({
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ye',
  ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'yi', й: 'y', к: 'k', л: 'l',
  м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
  ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '',
  ю: 'yu', я: 'ya', ы: 'y', э: 'e', ъ: '', ё: 'yo', "'": '', '’': '', '`': '',
});

/** Транслітерація назви світу в латинський slug (дзеркало tools/extract_progress.py). @param {string} s */
export function slugify(s) {
  const out = [];
  for (const ch of (s || '').toLowerCase()) {
    if (ch in TRANSLIT) out.push(TRANSLIT[ch]);
    else if ((ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9')) out.push(ch);
    else out.push('_');
  }
  return out.join('').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'world';
}

/** Розпаковує Gzip-буфер у браузері через DecompressionStream (якщо перші 2 байти 0x1f 0x8b). @param {ArrayBuffer} buf @returns {Promise<Uint8Array>} */
export async function gunzipIfNeeded(buf) {
  const raw = new Uint8Array(buf);
  if (raw.length < 2 || raw[0] !== 0x1f || raw[1] !== 0x8b) return raw;
  const ds = new DecompressionStream('gzip');
  const stream = new Blob([raw]).stream().pipeThrough(ds);
  const outBuf = await new Response(stream).arrayBuffer();
  return new Uint8Array(outBuf);
}

/** Читає стиснутий (gzip) або звичайний файл NBT у JS-об'єкт (дзеркало read_nbt у tools/extract_progress.py). @param {ArrayBuffer} buf @returns {Promise<Record<string, any>>} */
export async function readNbt(buf) {
  const data = await gunzipIfNeeded(buf);
  if (!data.length) return {};
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const dec = new TextDecoder('utf-8');
  let pos = 0;

  const u8 = () => data[pos++];
  const i8 = () => view.getInt8(pos++);
  const i16 = () => { const v = view.getInt16(pos, false); pos += 2; return v; };
  const u16 = () => { const v = view.getUint16(pos, false); pos += 2; return v; };
  const i32 = () => { const v = view.getInt32(pos, false); pos += 4; return v; };
  const i64 = () => { const v = view.getBigInt64(pos, false); pos += 8; return Number(v); };
  const f32 = () => { const v = view.getFloat32(pos, false); pos += 4; return v; };
  const f64 = () => { const v = view.getFloat64(pos, false); pos += 8; return v; };
  const str = () => { const n = u16(); const s = dec.decode(data.subarray(pos, pos + n)); pos += n; return s; };

  /** @param {number} tag @returns {any} */
  function payload(tag) {
    switch (tag) {
      case 1: return i8();
      case 2: return i16();
      case 3: return i32();
      case 4: return i64();
      case 5: return f32();
      case 6: return f64();
      case 7: { const n = i32(); pos += Math.max(0, n); return null; }
      case 8: return str();
      case 9: {
        const et = u8();
        const n = Math.max(0, i32());
        const arr = new Array(n);
        for (let i = 0; i < n; i++) arr[i] = payload(et);
        return arr;
      }
      case 10: {
        /** @type {Record<string, any>} */
        const out = {};
        while (pos < data.length) {
          const t = u8();
          if (t === 0) break;
          const k = str();
          out[k] = payload(t);
        }
        return out;
      }
      case 11: {
        const n = Math.max(0, i32());
        const arr = new Array(n);
        for (let i = 0; i < n; i++) arr[i] = i32();
        return arr;
      }
      case 12: {
        const n = Math.max(0, i32());
        const arr = new Array(n);
        for (let i = 0; i < n; i++) arr[i] = i64();
        return arr;
      }
      default:
        throw new Error(`Невідомий тег NBT ${tag} на позиції ${pos}`);
    }
  }

  if (u8() !== 10) return {};
  str(); // кореневе ім'я тегу
  return payload(10);
}

const INV_KEYS = new Set([
  'Inventory', 'EnderItems', 'Items', 'stacks', 'Curios', 'Stacks', 'Cosmetics',
  'equipment', 'components', 'minecraft:container', 'neoforge:attachments', 'curios:inventory', 'toolbelt:belt',
]);

/** Рекурсивно збирає предмети (id + count) зі структур інвентарю NBT. @param {any} obj @param {Record<string, number>} counts */
export function collectNbtItems(obj, counts) {
  if (!obj || typeof obj !== 'object') return;
  if (Array.isArray(obj)) {
    for (const x of obj) collectNbtItems(x, counts);
    return;
  }
  const iid = obj.id;
  const cnt = obj.count ?? obj.Count ?? 1;
  if (typeof iid === 'string' && iid.includes(':') && iid !== 'minecraft:air' && typeof cnt === 'number' && cnt > 0) {
    if ('Slot' in obj || 'count' in obj || 'Count' in obj || 'components' in obj) {
      counts[iid] = (counts[iid] || 0) + cnt;
    }
  }
  for (const [k, v] of Object.entries(obj)) {
    if (INV_KEYS.has(k)) collectNbtItems(v, counts);
  }
}

/** Десятковий 64-бітний long-ID із ftbquests → 16-символьний hex-ID. @param {string | number} decStr */
export function toHexId(decStr) {
  try {
    return BigInt.asUintN(64, BigInt(String(decStr).trim())).toString(16).toUpperCase().padStart(16, '0');
  } catch {
    return '';
  }
}

/** Швидкий розбір JSON5 для файлів FTB Quests (ftbquests/<uuid>.json5 та chapters/*.json5). @param {string} text */
export function parseJson5(text) {
  if (!text) return {};
  const clean = text.replace(/^\uFEFF/, '');
  try {
    // 1. Вирізаємо однорядкові // коментарі поза лапками та підставляємо лапки навколо ключів
    const noComments = clean.replace(/(^|\s)\/\/.*$/gm, '$1');
    const quoted = noComments
      .replace(/(^|[{,])(\s*)([A-Za-z0-9_.-]+)\s*:/gm, '$1$2"$3":')
      .replace(/:\s*(-?\d+)L\b/g, ': $1')
      .replace(/:\s*(-?\d+\.\d+)[dDfF]\b/g, ': $1')
      .replace(/,(\s*[}\]])/g, '$1');
    return JSON.parse(quoted);
  } catch {
    return {};
  }
}
