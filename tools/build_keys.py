# Вкладка «Клавіші» (GK): raw/keys_auto.json (tools/extract_keys.py) + content/keys.json (ручні правила) → docs/data/keys.json.
# Викликається з build_data.py (build(warn, write)); окремо: python3 -I tools/build_keys.py [--check]
# Логіку конфліктів дзеркалить docs/js/core/keys-model.js (level) — змінювати разом.
import os, sys, re, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import RAW, CONTENT, DATA, jload, jsave

CTX = ('game', 'gui', 'held', 'vehicle', 'debug')
FIELDS = ('cat', 'ctx', 'scr', 'nc', 'soft', 'important', 'note', 'name')
MODS = {'CONTROL': 'C', 'CONTROL_OR_COMMAND': 'C', 'SHIFT': 'S', 'ALT': 'A'}
MOD_KEY = {'S': 'SHIFT', 'C': 'CONTROL', 'A': 'ALT'}
KUMA_NS = {'craftingtweaks', 'inventoryessentials', 'trashslot', 'waystones', 'cookingforblockheads', 'farmingforblockheads', 'netherportalfix', 'defaultoptions', 'balm'}  # моди на Balm/Kuma

def scr_match(x, y):
    if not x or not y: return False
    return x == y or (x == 'c:*' and y.startswith('c:')) or (y == 'c:*' and x.startswith('c:'))

def level(a, b):
    """0 — не конфлікт, 1 — можливий (лише з предметом / верхи / умовно), 2 — конфлікт (обидві діють завжди). Дзеркало keys-model.js.
    Рішення користувача (GK): кілька дій модів з різними предметами на одній клавіші — допустимо; «у світі × з предметом» — лише можливий."""
    if a.get('nc') or b.get('nc') or a['ns'] == b['ns']: return 0     # один мод — так задумано (K: стиснути один / стос / усі)
    p = {a['ctx'], b['ctx']}
    if p == {'game'}: lv = 2
    elif p <= {'game', 'held'}: lv = 1
    elif 'vehicle' in p: lv = 1 if p <= {'vehicle', 'game', 'held'} and len(p) > 1 else 0
    elif p == {'gui'}: lv = (2 if a.get('scr') == b.get('scr') else 1) if scr_match(a.get('scr'), b.get('scr')) else 0
    elif p == {'debug'}: lv = 2
    else: lv = 0
    return min(lv, 1) if (a.get('soft') or b.get('soft')) else lv

def combo_of(k):
    return ('F3+' if k['ctx'] == 'debug' else '') + k['bind'] + ('|' + k['m'] if k['m'] else '')

def parse_suggest(s):
    """«Ctrl+G» → ('key.keyboard.g', 'C'); «none» → (UNKNOWN, '')."""
    if s == 'none': return UNKNOWN, ''
    parts = s.split('+'); m = ''
    for p in parts[:-1]: m = {'Ctrl': 'C', 'Shift': 'S', 'Alt': 'A'}[p]
    k = parts[-1].lower()
    mm = re.fullmatch(r'миша (\d+)', k)
    if mm: return 'key.mouse.' + mm[1], m
    return 'key.keyboard.' + {'`': 'grave.accent', 'ins': 'insert', 'del': 'delete', 'pgup': 'page.up', 'pgdn': 'page.down'}.get(k, k), m

UNKNOWN = 'key.keyboard.unknown'

def analyze(keys):
    by = collections.defaultdict(list)
    for k in keys:
        if k['bind'] != UNKNOWN: by[combo_of(k)].append(k)
    return by, {c: max((level(x, y) for i, x in enumerate(v) for y in v[i + 1:]), default=0) for c, v in by.items()}

def build(warn, write=True, mod_ids=None):
    auto = jload(os.path.join(RAW, 'keys_auto.json'), []) or []
    man = jload(os.path.join(CONTENT, 'keys.json'), {}) or {}
    cats = {c['id'] for c in man.get('cats', [])}
    rules = man.get('rules', []); hits = [0] * len(rules); keys = []
    for a in auto:
        k = {'id': a['id'], 'ns': a['ns'], 'name': a.get('uk') or a.get('en') or '', 'en': a.get('en') or '',
             'bind': a['bind'], 'm': MODS.get(a.get('mod') or '', '')}
        for i, r in enumerate(rules):
            if 're' in r and not re.search(r['re'], k['id']): continue
            if 'ns' in r and not re.fullmatch(r['ns'], k['ns']): continue
            hits[i] += 1
            if 'mod' in r: k['ns'] = r['mod']
            for f in FIELDS:
                if f in r:
                    if r[f] is None or r[f] is False: k.pop(f, None)
                    else: k[f] = r[f]
        if not k['name']: k['name'] = k['id']; warn(f"клавіші: {k['id']} без назви (додайте name у content/keys.json)")
        if mod_ids is not None and k['ns'] in mod_ids: k['mod'] = k['ns']
        if k.get('cat') not in cats: warn(f"клавіші: {k['id']} — без категорії / невідома категорія {k.get('cat')}")
        if k.get('ctx') not in CTX: warn(f"клавіші: {k['id']} — без контексту / невідомий контекст {k.get('ctx')}")
        if k.get('ctx') != 'gui': k.pop('scr', None)
        if k.get('ctx') == 'gui' and not k.get('scr'): warn(f"клавіші: {k['id']} — gui без scr")
        if k.get('important') is True: k['imp'] = k.pop('important')
        else: k.pop('important', None)
        if k['en'] == k['name']: k.pop('en')
        keys.append(k)
    for i, r in enumerate(rules):
        if not hits[i]: warn(f"клавіші: правило без збігів #{i}: {r.get('ns', '')} {r.get('re', '')}")
    by, conf = analyze(keys)
    # Моди на Balm (бібліотека клавіш Kuma API): модифікатор Ctrl/Shift/Alt у options.txt → StackOverflowError при запуску гри
    # (краш 2026-10-24, NativeKeyModifierReconciler). Таким діям — лише клавіші без модифікатора.
    for k in keys:
        if k['ns'] in KUMA_NS and k['m']: warn(f"клавіші: {k['id']} — мод на Kuma API, модифікатор {k['m']} у options.txt крашить гру")
    # план перепризначень (content/keys.json → plan): застосувати до копії і перевірити, що не з'явилось нових конфліктів
    kid = {k['id']: k for k in keys}; planned = []; lines = []
    for pl in man.get('plan', []):
        k = kid.get(pl['id'])
        if not k: warn(f"клавіші: план — невідома дія {pl['id']}"); continue
        b, m = parse_suggest(pl['to'])
        if k['ns'] in KUMA_NS and m: warn(f"клавіші: план {pl['id']} → {pl['to']}: мод на Kuma API — модифікатори заборонені (краш гри)")
        k['plan'] = pl['to']; k['why'] = pl.get('why', ''); k['was'] = pl.get('was', '')
        if (b, m) == (k['bind'], k['m']): k['plan_done'] = True; continue          # уже застосовано в options.txt
        planned.append(dict(k, bind=b, m=m))
        lines.append(f"key_{k['id']}:{b}" + (':' + MOD_KEY[m] if m else ''))
    pid = {x['id']: x for x in planned}
    after = [pid.get(k['id'], k) for k in keys]
    by2, conf2 = analyze(after)
    for x in planned:
        if x['bind'] == UNKNOWN: continue
        lv = max((level(x, y) for y in by2[combo_of(x)] if y['id'] != x['id']), default=0)
        if lv == 2: warn(f"клавіші: план {x['id']} → {x['plan']} створює конфлікт: " + ', '.join(y['id'] for y in by2[combo_of(x)] if y['id'] != x['id'] and level(x, y) == 2))
    unb = [k for k in keys if k['bind'] == 'key.keyboard.unknown']
    stat = {'keys': len(keys), 'bound': len(keys) - len(unb), 'unbound': len(unb),
            'conflicts': sum(1 for v in conf.values() if v == 2), 'maybe': sum(1 for v in conf.values() if v == 1),
            'imp_unbound': sum(1 for k in unb if k.get('imp')), 'plan': len(planned), 'plan_done': sum(1 for k in keys if k.get('plan_done')),
            'plan_conflicts': sum(1 for v in conf2.values() if v == 2), 'plan_maybe': sum(1 for v in conf2.values() if v == 1),
            'plan_imp_unbound': sum(1 for k in after if k['bind'] == UNKNOWN and k.get('imp'))}
    if write:
        jsave(os.path.join(DATA, 'keys.json'), {'cats': man.get('cats', []), 'ctxs': man.get('ctxs', []), 'stat': stat, 'keys': keys}, compact=True)
        lines_c = [f"{lv} {c}: " + ' | '.join(f"{x['ns']}:{x['ctx']}{'*' if x.get('nc') else ''} {x['name']}" for x in by[c])
                 for c, lv in sorted(conf.items(), key=lambda kv: -kv[1]) if lv]
        rep_lines = lines_c
        open(os.path.join(RAW, 'keys_conflicts.txt'), 'w', encoding='utf-8').write('\n'.join(rep_lines) + '\n')
        open(os.path.join(RAW, 'keys_plan.txt'), 'w', encoding='utf-8').write(
            '# План перепризначень (content/keys.json → plan). Застосувати до minecraft/options.txt при ЗАКРИТІЙ грі (замінити рядки з тими самими key_…)\n' + '\n'.join(lines) + '\n')
    return stat

if __name__ == '__main__':
    rep = []
    mods = {m['id'] for m in (jload(os.path.join(RAW, 'mods_auto.json'), []) or [])}
    st = build(rep.append, '--check' not in sys.argv, mods)
    print(st); [print('  !!', r) for r in rep[:30]]
