# Вкладка «Квести»: ручні огляди глав і дописи до «німих» квестів (content/chapters/<файл>.json) + список наявних іконок квестів.
# Викликається з build_data.py: build(warn, write) → docs/data/guide.json (огляди всіх глав), docs/data/notes/<файл>.json (дописи), docs/data/qicons.json.
# content/chapters/<файл глави>.json:
#   ov — огляд (2–4 речення: що дає глава, навіщо гравцю);  steps[] — порядок проходження;  rewards[] — ключові нагороди;
#   atm[] — особливості ATM11 (KubeJS, конфіги — з файлів збірки);  why — лише для прихованих глав: чому прихована;
#   verify — «⚑ Чернетка» для всього огляду;  notes: {<id квесту>: "текст" | {"text": "…", "title"?: "назва, якщо в книзі її немає", "verify"?: true}};
#   _src, _… — коментарі (звідки факти), на сайт не йдуть.
#   G6d (сито): ref — машинні джерела ov / why (рядок або список); пункт steps / rewards / atm — рядок або {"t": текст, "ref": …, "abs_ok"?: "причина"};
#   допис — {"text", "ref", …}; abs_ok — свідомий виняток для «лише / усі / кожен». build → guide.json: рядки + ref, item_ref {поле: {індекс: ref}}, item_abs; notes/<глава>.json: + ref.
import os, sys, glob, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import CONTENT, DATA, RAW, jload, jsave, quest_item_ids

KEYS = {'ov', 'steps', 'rewards', 'atm', 'why', 'verify', 'notes', 'ref', 'abs_ok'}
LISTS = ('steps', 'rewards', 'atm')

def refcheck_fmt(warn, where, r):
    from refcheck import SCHEMES
    if r is None: return
    if not isinstance(r, (str, list)): warn(f'{where}: ref — рядок або список рядків'); return
    for x in ([r] if isinstance(r, str) else r):
        if not isinstance(x, str) or ':' not in x or x.lstrip('!').split(':', 1)[0] not in SCHEMES: warn(f'{where}: ref «{x}» — невідомий формат (схеми: {", ".join(SCHEMES)})')

def quest_icon_ids():
    ids = quest_item_ids(DATA)   # K25: одне правило з extract_icons.py (з предметами нагород)
    for f in glob.glob(os.path.join(DATA, 'progress', '*.json')):
        pd = jload(f, {}) or {}; it = pd.get('items') or {}; sl = pd.get('slots') or {}
        ids.update(it.get('names') or {}); ids.update(it.get('inventory') or {}); ids.update(it.get('crafted') or {}); ids.update(it.get('obtained') or [])
        for arr in sl.values():
            if isinstance(arr, list): ids.update(x['id'] for x in arr if isinstance(x, dict) and ':' in str(x.get('id', '')))
    return ids

def build(warn, write=True):
    chs = {c['file']: c for c in (jload(os.path.join(DATA, 'chapters.json'), {}) or {}).get('chapters', [])}
    guide, nnotes, nverify, noted = {}, 0, 0, set()
    os.makedirs(os.path.join(DATA, 'notes'), exist_ok=True)
    for f in sorted(glob.glob(os.path.join(CONTENT, 'chapters', '*.json'))):
        fn = os.path.splitext(os.path.basename(f))[0]
        if fn.startswith('_'): continue
        d = jload(f, {}) or {}
        if fn not in chs: warn(f'content/chapters/{fn}.json: глави {fn} немає в квестах'); continue
        for k in d:
            if k not in KEYS and not k.startswith('_'): warn(f'content/chapters/{fn}.json: невідоме поле {k}')
        c = chs[fn]
        if c.get('hidden') and not d.get('why'): warn(f'глава {fn} прихована — немає поля why')
        if not c.get('hidden') and d.get('why'): warn(f'глава {fn} не прихована, але має поле why')
        if not d.get('ov') and not d.get('why'): warn(f'content/chapters/{fn}.json: немає огляду ov')
        qs = {q['id']: q for q in (jload(os.path.join(DATA, 'quests', fn + '.json'), {}) or {}).get('quests', [])}
        notes = {}
        for qid, v in (d.get('notes') or {}).items():
            if qid.startswith('_'): continue
            v = {'text': v} if isinstance(v, str) else v
            if qid not in qs: warn(f'{fn}: допис до невідомого квесту {qid}'); continue
            if not (v.get('text') or '').strip() and not v.get('title'): warn(f'{fn}: порожній допис {qid}'); continue
            if qs[qid].get('arr'): warn(f'{fn}: допис до службового квесту {qid}')
            refcheck_fmt(warn, f'{fn}: допис {qid}', v.get('ref'))
            notes[qid] = {k: v[k] for k in ('text', 'title', 'verify', 'ref', 'abs_ok') if v.get(k)}
            nverify += bool(v.get('verify'))
        nnotes += len(notes); noted.update(notes)
        refcheck_fmt(warn, f'{fn}: ref', d.get('ref'))
        g = {k: d[k] for k in ('ov', 'why', 'verify', 'ref', 'abs_ok') if d.get(k)}
        for f_ in LISTS:                                                   # пункт — рядок або {"t", "ref", "abs_ok"?} → сайт отримує рядки
            xs = d.get(f_) or []
            if not xs: continue
            g[f_] = []
            for i, x in enumerate(xs):
                if isinstance(x, dict):
                    if not (x.get('t') or '').strip(): warn(f'{fn}: {f_}[{i}] — порожній пункт'); continue
                    refcheck_fmt(warn, f'{fn}: {f_}[{i}]', x.get('ref'))
                    if x.get('ref'): g.setdefault('item_ref', {}).setdefault(f_, {})[str(len(g[f_]))] = x['ref']
                    if x.get('abs_ok'): g.setdefault('item_abs', {}).setdefault(f_, {})[str(len(g[f_]))] = x['abs_ok']
                    g[f_].append(x['t'])
                else: g[f_].append(x)
        if notes: g['notes'] = len(notes)
        guide[fn] = g
        if write: jsave(os.path.join(DATA, 'notes', fn + '.json'), notes, compact=True)
    hidden = [fn for fn, c in chs.items() if c.get('hidden')]
    for fn in hidden:
        if fn not in guide: warn(f'глава {fn} прихована — немає content/chapters/{fn}.json з полем why')
    idb = jload(os.path.join(RAW, 'icons_auto.json'), {}) or {}
    qicons = sorted(i for i in quest_icon_ids() if i in idb)
    if write:
        jsave(os.path.join(DATA, 'guide.json'), guide)
        jsave(os.path.join(DATA, 'qicons.json'), qicons, compact=True)
        for f in glob.glob(os.path.join(DATA, 'notes', '*.json')):          # дописи глав, яких більше немає в content/
            if os.path.splitext(os.path.basename(f))[0] not in guide: jsave(f, {}, compact=True)
    silent = sum(1 for fn in chs for q in (jload(os.path.join(DATA, 'quests', fn + '.json'), {}) or {}).get('quests', [])
                 if not q.get('desc') and not q.get('arr') and not q.get('inv') and not chs[fn].get('hidden') and q['id'] not in noted)
    return {'guides': len(guide), 'hidden': len(hidden), 'notes': nnotes, 'verify': nverify, 'qicons': len(qicons), 'silent': silent}
