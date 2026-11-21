// @ts-check
// Пісочниця KubeJS для extract_kubejs.py (сито, сесія S). Виконує ВСІ скрипти kubejs/startup_scripts і server_scripts так, як гра:
// порядок — «// priority N» (більше — раніше), далі шлях; спільна область видимості в межах фази; Platform.isLoaded — за raw/registry_index.json.
// Скрипти працюють у node:vm без require/fs/мережі; API KubeJS — моки на індексах raw/*_index.json. Запис: рецепти (додано / вимкнено / змінено),
// теги, зареєстровані предмети, події гри (поведінка під час гри — лише перелік), умови isLoaded, нерозв'язані виклики (Java API) — з файлом:рядком.
// Запуск: node tools/kjs_sandbox.mjs <kubejs> <raw> <minecraft> <out.json>
import fs from 'node:fs'; import path from 'node:path'; import vm from 'node:vm'
const [KJS, RAW, MCDIR, OUT] = process.argv.slice(2)
const J = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const reg = J(path.join(RAW, 'registry_index.json')), TAGS = J(path.join(RAW, 'tags_index.json')), REC = J(path.join(RAW, 'recipes_index.json'))
const MA = fs.existsSync(path.join(RAW, 'mods_auto.json')) ? J(path.join(RAW, 'mods_auto.json')) : []
const LOADED = new Set(reg.mods), ITEMS = new Set(reg.items), FLUIDS = new Set(reg.fluids), BLOCKS = new Set(reg.blocks)
const VERS = Object.fromEntries(MA.map((m) => [m.id, m.version]))
/** @type {Record<string, any[]>} */
const O = { recipes: [], removes: [], replaces: [], foreach: [], tags: [], registry: [], events: [], data: [], conds: [], unresolved: [], errors: [], console: [] }
let CUR = '', PHASE = ''
function where() {
  const st = String(new Error().stack).split('\n')
  for (const l of st) { const m = l.match(/kjs:([^:()]+):(\d+)/); if (m) return `${m[1]}:${m[2]}` }
  return CUR
}
const seenU = new Set()
function note(name) { const w = where(); const k = name + '@' + w; if (!seenU.has(k)) { seenU.add(k); O.unresolved.push({ api: name, at: w }) } }
/** Невідомий API (Java-класи, моди без моку): будь-яке звернення повертає такий самий проксі й записується. */
function U(name) {
  const f = function () {}
  return new Proxy(f, {
    get(t, k) {
      if (k === Symbol.toPrimitive || k === 'toString' || k === 'valueOf') return () => `<${name}>`
      if (k === 'then') return undefined
      if (k === 'length') return 0
      if (k === Symbol.iterator) { note(`${name} (перебір)`); return function* () {} }
      if (typeof k === 'symbol') return undefined
      return U(`${name}.${String(k)}`)
    },
    apply(t, th, args) { note(`${name}()`); return U(`${name}()`) },
    construct() { note(`new ${name}`); return U(`new ${name}`) },
  })
}
// ---- значення: стеки предметів / рідин / інгредієнти
class Stack {
  constructor(id, count = 1, kind = 'item') { this.id = String(id); this.count = count; this.kind = kind }
  withCount(n) { return new Stack(this.id, n, this.kind) }
  getId() { return this.id } getCount() { return this.count }
  isEmpty() { return !this.id || this.id === 'minecraft:air' || (this.id.startsWith('#') && tagItems(this.id).length === 0) }
  getFirst() { return this.id.startsWith('#') ? parseItem(tagItems(this.id)[0] || 'minecraft:air') : this }
  getValues() { return this.getItemIds().map((i) => ({ unwrapKey: () => ({ get: () => ({ identifier: () => rl(i), location: () => rl(i) }) }), value: () => parseItem(i) })) }
  getStacks() { return this.getItemIds().map((i) => parseItem(i)) } get stacks() { return this.getStacks() }
  copy() { return new Stack(this.id, this.count, this.kind) } toString() { return this.id } toJson() { return { id: this.id, count: this.count } }
  getItemIds() { return this.id.startsWith('#') ? tagItems(this.id.slice(1)) : [this.id] } get itemIds() { return this.getItemIds() }
  get item() { return this } getItem() { return this } getAmount() { return this.count } get amount() { return this.count }
}
const rl = (i) => ({ namespace: i.split(':')[0], path: i.split(':').slice(1).join(':'), getNamespace() { return this.namespace }, getPath() { return this.path }, toString: () => i })
const stackProxy = (s) => new Proxy(s, { get(t, k, r) { if (k in t || typeof k === 'symbol') return Reflect.get(t, k, r); return () => r } })
const EMPTY = stackProxy(new Stack('minecraft:air', 0))
function parseItem(x, count) {
  if (x instanceof Stack) return stackProxy(count ? x.withCount(count) : x)
  let s = String(x).trim(); let n = count || 1
  const m = s.match(/^(\d+)x\s+(.+)$/); if (m) { n = +m[1]; s = m[2] }
  s = s.replace(/[[{].*$/, '')                                          // id[компоненти] / id{nbt} → id
  if (!s.includes(':') && !s.startsWith('#') && !s.startsWith('@')) s = 'minecraft:' + s
  return stackProxy(new Stack(s, n))
}
let TAGM = { item: {}, block: {}, fluid: {} }
const TAGM0 = { item: {}, block: {}, fluid: {} }
const TAGP = { item: {}, block: {}, fluid: {} }
const TAGREM = { item: {}, block: {}, fluid: {} }
for (const r of ['item', 'block', 'fluid']) {
  for (const [k, v] of Object.entries(TAGS[r] || {})) TAGM[r][k] = new Set(v)
  for (const [k, v] of Object.entries((TAGS.kjs_orig && TAGS.kjs_orig[r]) || {})) {
    if (v == null) delete TAGM[r][k]; else TAGM[r][k] = new Set(v)   // K32: чистий до-KubeJS стан тегів
  }
  for (const [k, s] of Object.entries(TAGM[r])) TAGM0[r][k] = new Set(s)
  for (const [ch, ps] of Object.entries((TAGS.parents && TAGS.parents[r]) || {})) TAGP[r][ch] = new Set(ps)
}
const tagItems = (t, r = 'item') => [...(TAGM[r][t.replace(/^#/, '')] || [])]
function propagateTagParents() {
  for (const r of ['item', 'block', 'fluid']) {
    const M = TAGM[r], B = TAGM0[r], P = TAGP[r], R = TAGREM[r]
    const q = [], inQ = new Set()
    for (const [t, s] of Object.entries(M)) {
      if (!P[t] || !P[t].size) continue
      const b = B[t]
      for (const x of s) if (!b || !b.has(x)) { q.push(t); inQ.add(t); break }
    }
    while (q.length) {
      const ch = q.shift(); inQ.delete(ch)
      const b = B[ch], delta = []
      for (const x of M[ch] || []) if (!b || !b.has(x)) delta.push(x)
      if (!delta.length) continue
      for (const p of P[ch] || []) {
        const rem = R[p], dst = M[p] || (M[p] = new Set())
        let grew = false
        for (const x of delta) if ((!rem || !rem.has(x)) && !dst.has(x)) { dst.add(x); grew = true }
        if (grew && P[p] && P[p].size && !inQ.has(p)) { q.push(p); inQ.add(p) }
      }
    }
  }
}
// ---- ID у довільних аргументах (як ingredients() у extract_recipes.py)
const isRe = (x) => Object.prototype.toString.call(x) === '[object RegExp]'     // RegExp зі скриптів — з іншого realm (vm)
const RXID = /^#?[a-z0-9_.-]+:[a-z0-9_/.-]+$/, OUTK = /result|output|product|byproduct|secondar|^outs?$|drops?$/i
const SKIPK = new Set(['type', 'neoforge:conditions', 'conditions', 'group', 'category', 'recipe_type', 'sound', 'texture', 'advancement'])
function ids(o, isout = false, acc = { in: new Set(), out: new Set() }, depth = 0) {
  if (o == null || depth > 12) return acc
  if (o instanceof Stack) { (isout ? acc.out : acc.in).add(o.id); return acc }
  if (Array.isArray(o)) { for (const x of o) ids(x, isout, acc, depth + 1); return acc }
  if (isRe(o) || typeof o === 'function') return acc
  if (typeof o === 'object') {
    for (const [k, v] of Object.entries(o)) {
      if (SKIPK.has(k)) continue
      if (k === 'tag' && typeof v === 'string') { (isout ? acc.out : acc.in).add('#' + v.replace(/^#/, '')); continue }
      ids(v, isout || OUTK.test(k), acc, depth + 1)
    }
    return acc
  }
  if (typeof o === 'string') { const s = o.trim().replace(/^\d+x\s+/, '').replace(/[[{].*$/, ''); if (RXID.test(s)) (isout ? acc.out : acc.in).add(s) }   // id[компоненти] / id{nbt} → id
  return acc
}
// ---- фільтри рецептів (remove / replaceInput / forEachRecipe / countRecipes) проти raw/recipes_index.json
for (const [k, r] of Object.entries(REC)) if (r.src === 'kubejs') { if (r.orig) REC[k] = r.orig; else delete REC[k] }   // індекс без накладеного раніше KubeJS
const RIDS0 = Object.keys(REC)
const live = (rid) => { const r = REC[rid]; return r && ('kjs_off' in r ? r.a0 : r.a) !== false }   // гра бачить лише завантажені (a: null — умова мода, теж кандидат)
function hasIng(list, want) {
  if (isRe(want)) return list.some((x) => want.test(x))
  const w = String(want instanceof Stack ? want.id : want).trim().replace(/^\d+x\s+/, '')
  if (w.startsWith('#')) { const ti = new Set(tagItems(w)); return list.some((x) => x === w || (!x.startsWith('#') && ti.has(x))) }
  return list.some((x) => x === w || (x.startsWith('#') && TAGM.item[x.slice(1)] && TAGM.item[x.slice(1)].has(w)))
}
function match(rid, f) {
  const r = REC[rid]
  if (f == null) return false
  if (Array.isArray(f)) return f.some((x) => match(rid, x))
  if (isRe(f)) return f.test(rid)
  if (typeof f === 'string' || f instanceof Stack) {
    const s = String(f)
    if (s === '*') return true
    if (s.startsWith('@')) return rid.split(':')[0] === s.slice(1)
    return rid === s
  }
  if (typeof f === 'object') {
    for (const [k, v] of Object.entries(f)) {
      const any = (fn) => (Array.isArray(v) ? v.some(fn) : fn(v))
      if (k === 'id' && !any((x) => (isRe(x) ? x.test(rid) : rid === String(x)))) return false
      if (k === 'mod' && !any((x) => rid.split(':')[0] === String(x))) return false
      if (k === 'type' && !any((x) => (isRe(x) ? x.test(r.t) : r.t === (String(x).includes(':') ? String(x) : 'minecraft:' + x)))) return false
      if (k === 'output' && !any((x) => hasIng(r.po || r.out, x))) return false      // KubeJS шукає в головних виходах (result / output), не в побічних (drops)
      if (k === 'input' && !any((x) => hasIng(r.in, x))) return false
      if (k === 'not' && match(rid, v)) return false
      if (k === 'or' && !match(rid, v)) return false
      if (k === 'group') { note('filter.group'); return false }
    }
    return true
  }
  return false
}
const filt = (f) => RIDS0.filter((rid) => live(rid) && match(rid, f))
const fdesc = (f) => JSON.stringify(f, (k, v) => (isRe(v) ? String(v) : v instanceof Stack ? v.id : v))
// ---- подія рецептів
/** Аргументи виклику рецепта → запис у формі datapack (K6): стек → «Nx id» (рідина → { id, amount }), вирази й функції — null.
 *  Його розбирає той самий код, що й JSON рецептів із jar (build_recipes_db.parse_raw) — з кількостями й сіткою. */
function plain(o, depth = 0) {
  if (o == null || depth > 12) return null
  if (o instanceof Stack) return o.kind === 'fluid' ? { id: o.id, amount: o.count } : (o.count > 1 ? `${o.count}x ${o.id}` : o.id)
  if (Array.isArray(o)) return o.map((x) => plain(x, depth + 1))
  if (isRe(o) || typeof o === 'function') return null
  if (typeof o === 'object') return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, plain(v, depth + 1)]))
  return typeof o === 'string' || typeof o === 'number' || typeof o === 'boolean' ? o : null
}
let RN = 0
function addRecipe(type, args, extra = {}) {
  const at = where(); const acc = { in: new Set(), out: new Set() }
  const r = { type, at, file: at.split(':')[0], id: null, in: [], out: [], ...extra }
  if (extra.outArg !== undefined) ids(extra.outArg, true, acc)
  for (const a of extra.inArgs || []) ids(a, false, acc)
  if (extra.json) ids(extra.json, false, acc)
  delete r.outArg; delete r.inArgs; delete r.json; delete r.form
  const form = extra.form || extra.json
  if (form && typeof form === 'object') { try { r.json = plain({ ...form, type }) } catch (e) {} }
  const sync = () => { r.in = [...acc.in]; r.out = [...acc.out] }
  sync(); r.n = ++RN; O.recipes.push(r)
  const h = new Proxy({}, {
    get(t, k) {
      if (typeof k === 'symbol') return undefined
      if (k === 'id') return (x) => { r.id = String(x).includes(':') ? String(x) : 'kubejs:' + x; return h }
      return (...a) => {
        const key = String(k)
        if (/out|result/i.test(key)) { ids(a, true, acc); sync() } else if (/in$|input|ingredient|In[A-Z]?/.test(key)) { ids(a, false, acc); sync() }
        return h
      }
    },
  })
  return h
}
const POOL = { item: ITEMS, block: BLOCKS, fluid: FLUIDS }
function recipesEvent() {
  const cook = (t) => (out, inp, xp, time) => addRecipe(t, null, { outArg: out, inArgs: [inp], form: { ingredient: inp, result: out } })
  /** @type {Record<string, any>} */
  const b = {
    shaped: (out, pat, keys) => addRecipe('minecraft:crafting_shaped', null, { outArg: out, inArgs: [keys], form: { pattern: pat, key: keys, result: out } }),
    shapeless: (out, ins) => addRecipe('minecraft:crafting_shapeless', null, { outArg: out, inArgs: [ins], form: { ingredients: Array.isArray(ins) ? ins : [ins], result: out } }),
    smelting: cook('minecraft:smelting'), blasting: cook('minecraft:blasting'), smoking: cook('minecraft:smoking'),
    campfireCooking: cook('minecraft:campfire_cooking'), stonecutting: cook('minecraft:stonecutting'),
    smithing: (out, t, base, add) => addRecipe('minecraft:smithing_transform', null, { outArg: out, inArgs: [t, base, add], form: { template: t, base, addition: add, result: out } }),
    custom: (json) => { const t = String(json && json.type || ''); return addRecipe(t.includes(':') ? t : 'minecraft:' + t, null, { json }) },
    remove: (f) => { O.removes.push({ f: fdesc(f), at: where(), ids: filt(f) }) },
    replaceInput: (f, from, to) => { O.replaces.push({ kind: 'input', f: fdesc(f), from: fdesc(from), to: fdesc(to), at: where(), ids: filt(f).filter((r) => hasIng(REC[r].in, from)) }) },
    replaceOutput: (f, from, to) => { O.replaces.push({ kind: 'output', f: fdesc(f), from: fdesc(from), to: fdesc(to), at: where(), ids: filt(f).filter((r) => hasIng(REC[r].po || REC[r].out, from)) }) },
    forEachRecipe: (f, cb) => { O.foreach.push({ f: fdesc(f), at: where(), ids: filt(f) }) },
    countRecipes: (f) => filt(f).length, findRecipeIds: (f) => filt(f), containsRecipe: (f) => filt(f).length > 0,
  }
  b.recipes = new Proxy({}, { get: (t, ns) => typeof ns === 'symbol' ? undefined : new Proxy({}, { get: (t2, ty) => {
    if (typeof ty === 'symbol') return undefined
    if ((ns === 'kubejs' || ns === 'minecraft') && b[ty]) return b[ty]
    return (...a) => addRecipe(`${String(ns)}:${String(ty)}`, null, { inArgs: a, unsplit: true })
  } }) })
  return new Proxy(b, { get: (t, k) => (k in t ? t[k] : typeof k === 'symbol' ? undefined : (note(`recipes.${String(k)}`), U(`recipes.${String(k)}`))) })
}
function tagsEvent(regName) {
  const r = String(regName).replace(/^minecraft:/, '').replace(/s$/, '')
  const M = TAGM[r] || (TAGM[r] = {})
  const vals = (v) => (Array.isArray(v) ? v.flat(5) : [v]).flatMap((x) => {
    if (isRe(x)) return [...(POOL[r] || [])].filter((i) => x.test(i))
    const s = String(x instanceof Stack ? x.id : x)
    if (s.startsWith('@') && POOL[r]) { const pre = s.slice(1) + ':'; return [...POOL[r]].filter((i) => i.startsWith(pre)) }
    return [s]
  })
  const op = (kind, tag, v) => {
    tag = String(tag).replace(/^#/, ''); const xs = v === undefined ? [] : vals(v)
    O.tags.push({ reg: r, kind, tag, vals: xs, at: where() })
    const s = M[tag] || (M[tag] = new Set())
    const P = TAGP[r], R = TAGREM[r]
    if (kind === 'add') xs.forEach((x) => {
      if (x.startsWith('#')) {
        const ch = x.slice(1)
        tagItems(x, r).forEach((y) => { s.add(y); if (R && R[tag]) R[tag].delete(y) })
        if (P && ch !== tag) (P[ch] || (P[ch] = new Set())).add(tag)
      } else { s.add(x); if (R && R[tag]) R[tag].delete(x) }
    })
    if (kind === 'remove') xs.forEach((x) => {
      if (x.startsWith('#')) {
        const ch = x.slice(1)
        tagItems(x, r).forEach((y) => { s.delete(y); if (R) (R[tag] || (R[tag] = new Set())).add(y) })
        if (P && P[ch]) P[ch].delete(tag)
      } else { s.delete(x); if (R) (R[tag] || (R[tag] = new Set())).add(x) }
    })
    if (kind === 'removeAll') {
      s.clear()
      if (R) delete R[tag]
      if (P) for (const ps of Object.values(P)) ps.delete(tag)
    }
  }
  const tagObj = (tag) => { const o = { add: (v) => (op('add', tag, v), o), remove: (v) => (op('remove', tag, v), o), removeAll: () => (op('removeAll', tag), o), getObjectIds: () => [...(M[String(tag).replace(/^#/, '')] || [])] }; return o }
  const e = { add: (t, v) => op('add', t, v), remove: (t, v) => op('remove', t, v), removeAll: (t) => op('removeAll', t), get: tagObj,
    removeAllTagsFrom: (v) => { for (const x of vals(v)) for (const [t, s] of Object.entries(M)) if (s.has(x)) op('remove', t, x) } }
  return new Proxy(e, { get: (t, k) => (k in t ? t[k] : typeof k === 'symbol' ? undefined : (note(`tags.${String(k)}`), U(`tags.${String(k)}`))) })
}
function registryEvent(regName) {
  const r = String(regName).replace(/^minecraft:/, '')
  const rec = (id, how) => {
    const full = String(id).includes(':') ? String(id) : 'kubejs:' + id
    O.registry.push({ reg: r, id: full, how, at: where() })
    if (r === 'item' || r === 'block') ITEMS.add(full); if (r === 'block') BLOCKS.add(full); if (r === 'fluid') { FLUIDS.add(full); ITEMS.add(full + '_bucket') }
    const h = new Proxy({}, { get: (t, k) => (typeof k === 'symbol' ? undefined : () => h) }); return h
  }
  return new Proxy({ create: (id, type) => rec(id, type ? String(type) : 'basic'), createCustom: (id) => rec(id, 'custom'), createFromJson: (id, json) => rec(id, 'json') },
    { get: (t, k) => (k in t ? t[k] : typeof k === 'symbol' ? undefined : (note(`registry.${String(k)}`), U(`registry.${String(k)}`))) })
}
function dataEvent() {
  return new Proxy({ json: (id, obj) => { O.data.push({ id: String(id), type: obj && obj.type, at: where(), json: obj && typeof obj === 'object' ? plain(obj) : null, io: obj && typeof obj === 'object' ? (() => { const a = ids(obj); return { in: [...a.in], out: [...a.out] } })() : null }) } },
    { get: (t, k) => (k in t ? t[k] : typeof k === 'symbol' ? undefined : (note(`data.${String(k)}`), U(`data.${String(k)}`))) })
}
// ---- глобальні об'єкти KubeJS
class JMap { constructor() { this.m = new Map() }
  put(k, v) { this.m.set(k, v); return v } putIfAbsent(k, v) { if (!this.m.has(k)) this.m.set(k, v) } get(k) { return this.m.get(k) ?? null } containsKey(k) { return this.m.has(k) }
  remove(k) { this.m.delete(k) } size() { return this.m.size } isEmpty() { return this.m.size === 0 } keySet() { return [...this.m.keys()] } values() { return [...this.m.values()] }
  entrySet() { return [...this.m.entries()].map(([k, v]) => ({ key: k, value: v, getKey: () => k, getValue: () => v })) } forEach(fn) { for (const [k, v] of this.m) fn(k, v) } }
const GLOBAL = {}, HANDLERS = []
const TXT = new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive || k === 'toString' ? () => '<text>' : typeof k === 'symbol' ? undefined : TXT), apply: () => TXT })
const evProxy = (name) => new Proxy({}, { get: (t, k) => typeof k === 'symbol' ? undefined : (...args) => { HANDLERS.push({ ev: `${name}.${String(k)}`, args, at: where(), file: CUR, phase: PHASE }) } })
function readJson(p) {
  const f = path.resolve(MCDIR, String(p)); if (!f.startsWith(path.resolve(MCDIR))) return null
  if (!fs.existsSync(f)) return null
  try { return CTX_JSON.parse(fs.readFileSync(f, 'utf8').replace(/^\s*\/\/.*$/gm, '')) } catch { return null }
}
let CTX_JSON = JSON
// Масиви в Rhino — це Java List: add / isEmpty / size / stream… (і в контексті скриптів, і в масивах, які повертають моки)
const JAVA_ARRAY = `if (!Array.prototype.isEmpty) Object.defineProperties(Array.prototype, {
    add: { value(x) { this.push(x); return true } }, addAll: { value(xs) { for (const x of xs) this.push(x); return true } }, isEmpty: { value() { return this.length === 0 } },
    size: { value() { return this.length } }, contains: { value(x) { return this.includes(x) } }, get: { value(i) { return this[i] } }, stream: { value() { return this } },
    collect: { value() { return this } }, toList: { value() { return this } }, anyMatch: { value(f) { return this.some(f) } }, allMatch: { value(f) { return this.every(f) } } })`
vm.runInThisContext(JAVA_ARRAY)
function mkContext() {
  const ctx = vm.createContext({})
  vm.runInContext(`${JAVA_ARRAY}
    globalThis.__JSet = class extends Set { constructor(xs) { super(xs || []) } contains(x) { return this.has(x) } isEmpty() { return this.size === 0 } addAll(xs) { for (const x of xs) this.add(x); return true } stream() { return [...this] } }`, ctx)
  CTX_JSON = vm.runInContext('JSON', ctx)
  const opt = (x) => ({ orElse: (d) => (x === undefined ? d : x), isPresent: () => x !== undefined, get: () => x, ifPresent: (f) => { if (x !== undefined) f(x) } })
  const stream = (xs) => ({ filter: (f) => stream(xs.filter((x) => f(x))), map: (f) => stream(xs.map((x) => f(x))), findFirst: () => opt(xs[0]), findAny: () => opt(xs[0]),
    forEach: (f) => xs.forEach((x) => f(x)), anyMatch: (f) => xs.some((x) => f(x)), allMatch: (f) => xs.every((x) => f(x)), toList: () => xs, count: () => xs.length, collect: () => xs })
  const JCLS = { 'java.util.stream.Stream': { of: (...a) => stream(a.length === 1 && Array.isArray(a[0]) ? [...a[0]] : a) }, 'java.util.ArrayList': vm.runInContext('Array', ctx), 'java.util.HashSet': vm.runInContext('__JSet', ctx), 'java.util.HashMap': JMap, 'java.util.TreeMap': JMap }
  Object.assign(ctx, {
    console: Object.fromEntries(['log', 'info', 'warn', 'error', 'debug'].map((l) => [l, (...a) => O.console.push({ at: where(), lvl: l, msg: a.map(String).join(' ') })])),
    Platform: { isLoaded: (id) => { const v = LOADED.has(String(id)); O.conds.push({ at: where(), mod: String(id), v }); return v }, isClientEnvironment: () => false,
      getInfo: (id) => ({ id, version: VERS[id] ?? (LOADED.has(id) ? '?' : null), name: id }), getMods: () => [...LOADED] },
    Item: { of: parseItem, exists: (id) => ITEMS.has(String(id)), getEmpty: () => EMPTY, isItem: (x) => x instanceof Stack, empty: EMPTY },
    Ingredient: { of: (x, n) => parseItem(x, n), parseString: (x) => parseItem(x), isIngredient: (x) => x instanceof Stack, all: parseItem('*'), empty: EMPTY },
    Fluid: { of: (id, a) => stackProxy(new Stack(String(id), a || 1000, 'fluid')), ingredientOf: (id, a) => stackProxy(new Stack(String(id), a || 1000, 'fluid')), exists: (id) => FLUIDS.has(String(id)), empty: EMPTY },
    Text: TXT, Component: TXT,
    JsonIO: { read: readJson, readJson: (p) => (note('JsonIO.readJson (Gson)'), U('JsonIO.readJson()')), write: () => null, toObject: (x) => x, toArray: (x) => x, toString: (x) => JSON.stringify(x), parse: (x) => CTX_JSON.parse(x) },
    Utils: { newList: () => vm.runInContext('[]', ctx), newMap: () => new JMap(), emptyList: () => [], emptyMap: () => new JMap() },
    Java: { loadClass: (n) => JCLS[n] || U(`Java(${n})`), cast: (c, x) => x }, global: GLOBAL,
  })
  return ctx
}
// ---- скрипти
function scripts(dir) {
  const out = []
  const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p); else if (f.name.endsWith('.js')) out.push(p) } }
  if (fs.existsSync(dir)) walk(dir)
  return out.map((p) => {
    const src = fs.readFileSync(p, 'utf8'); const head = src.split('\n').filter((l) => /^\s*\/\//.test(l)).slice(0, 12).join('\n')
    const pr = head.match(/\/\/\s*priority:?\s*(-?\d+)/i); const req = [...head.matchAll(/\/\/\s*requires:?\s*([a-z0-9_]+)/gi)].map((m) => m[1])
    return { p, rel: path.relative(KJS, p).split(path.sep).join('/'), src, pri: pr ? +pr[1] : 0, req, ignored: /\/\/\s*ignored:?\s*true/i.test(head) }
  }).sort((a, b) => b.pri - a.pri || (a.rel < b.rel ? -1 : 1))
}
const DECL = /\b(?:let|const|var|function|class)\s+([A-Za-z_$][\w$]*)/g
function runPhase(name) {
  PHASE = name; const ctx = mkContext(); const files = scripts(path.join(KJS, name)); const res = []
  const declared = new Set(files.flatMap((f) => [...f.src.matchAll(DECL)].map((m) => m[1])))
  const used = new Set(files.flatMap((f) => [...f.src.matchAll(/(?<![.\w$])([A-Z$][\w$]*)\s*\./g)].map((m) => m[1])))
  for (const n of used) if (!(n in ctx) && !declared.has(n) && !(n in globalThis)) ctx[n] = /Events$/.test(n) ? evProxy(n) : U(n)
  for (const n of ['ServerEvents', 'StartupEvents', 'PlayerEvents', 'BlockEvents', 'ItemEvents', 'EntityEvents', 'LevelEvents', 'NativeEvents', 'ClientEvents']) if (!(n in ctx)) ctx[n] = evProxy(n)
  for (const f of files) {
    CUR = f.rel
    if (f.ignored || f.req.some((m) => !LOADED.has(m))) { res.push({ file: f.rel, run: false, why: f.ignored ? 'ignored' : `requires ${f.req.join(',')}` }); continue }
    try { new vm.Script(f.src, { filename: `kjs:${f.rel}` }).runInContext(ctx, { timeout: 5000 }); res.push({ file: f.rel, run: true }) }
    catch (e) {
      if (e instanceof SyntaxError && /already been declared/.test(String(e))) {
        try { new vm.Script(`{\n${f.src}\n}`, { filename: `kjs:${f.rel}`, lineOffset: -1 }).runInContext(ctx, { timeout: 5000 }); res.push({ file: f.rel, run: true, note: 'блок (повторне оголошення)' }); continue } catch (e2) { e = e2 }
      }
      O.errors.push({ at: where() || f.rel, phase: name, err: String(e).slice(0, 200) }); res.push({ file: f.rel, run: false, why: 'помилка' })
    }
  }
  return res
}
// ---- виклик обробників подій (як гра: startup → registry; server → generateData → tags → recipes); решта — перелік поведінки під час гри
function errAt(e, dflt) { const m = String(e && e.stack || '').match(/kjs:([^:()]+):(\d+)/); return m ? `${m[1]}:${m[2]}` : dflt }
const RUN = { 'StartupEvents.registry': (h) => registryEvent(typeof h.args[0] === 'string' ? h.args[0] : 'item'), 'ServerEvents.generateData': () => dataEvent(),
  'ServerEvents.tags': (h) => tagsEvent(typeof h.args[0] === 'string' ? h.args[0] : 'item'), 'ServerEvents.recipes': () => recipesEvent() }
const ORDER = ['StartupEvents.registry', 'ServerEvents.generateData', 'ServerEvents.tags', 'ServerEvents.recipes']
function dispatch(phase) {
  const mine = HANDLERS.filter((h) => h.phase === phase)
  for (const ev of ORDER) {
    for (const h of mine.filter((x) => x.ev === ev)) {
      const cb = [...h.args].reverse().find((a) => typeof a === 'function'); if (!cb) continue
      CUR = h.file
      try { cb(RUN[ev](h)) } catch (e) { O.errors.push({ at: errAt(e, h.at), phase, ev: h.ev, err: String(e).slice(0, 200) }) }
    }
    if (ev === 'ServerEvents.tags') propagateTagParents()
  }
  for (const h of mine) if (!ORDER.includes(h.ev)) O.events.push({ ev: h.ev, at: h.at, target: h.args.filter((a) => typeof a === 'string').join(', ') })
}
const files = { startup: runPhase('startup_scripts') }; dispatch('startup_scripts')
files.server = runPhase('server_scripts'); dispatch('server_scripts')
for (const r of O.recipes) if (!r.id) r.id = null
fs.writeFileSync(OUT, JSON.stringify({ files, ...O, tagsAfter: Object.fromEntries(Object.entries(TAGM.item).map(([k, v]) => [k, v.size])) }))
console.log(`скриптів: startup ${files.startup.length}, server ${files.server.length}; рецептів додано ${O.recipes.length}, remove ${O.removes.length}, replace ${O.replaces.length}, теги ${O.tags.length}, реєстр ${O.registry.length}, події ${O.events.length}, помилок ${O.errors.length}, нерозв'язаних ${O.unresolved.length}`)
