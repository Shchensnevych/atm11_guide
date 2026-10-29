# Квести FTB → docs/data/chapters.json (групи, глави, міжглавні зв'язки, моди глави) і docs/data/quests/<глава>.json (квести).
# Тексти — українські (lang/uk_ua; немає — en). Назви предметів завдань і нагород — з ua_work/review/effective.tsv (те, що бачить гравець).
# Квест: icon (як у книзі: власна іконка або перше завдання), tasks[] з id (стан із сейву), rw[] (нагороди),
#   arr (службовий «AllRightsReserved» — у грі не видно ніколи), inv (невидимий до виконання), hdl / hdtl (лінії до попередників / до наступників сховано в книзі),
#   any (досить одного з попередників), dreq / dmin (режим залежностей / мінімум попередників), flex (гнучкий режим проходження),
#   vis (у грі прихований, доки попередники видимі / виконані), hdet (деталі приховано, доки квест не доступний), shape (з типовою формою глави).
#   Глава в quests/<файл>.json: links[] (quest_links), img[] (картинки на полотні), ext. docs/data/reward_tables.json — вміст випадкових нагород.
# Іконки квестів: tools/extract_icons.py --quests (усі ID поля icon і завдань).
import os, sys, glob, csv, collections, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import QUESTS, UA, DATA, RAW, json5, jsave, jload, strip_fmt
csv.field_size_limit(10 ** 9)
ID_RX = re.compile(r'^[a-z0-9_.-]+:[a-z0-9_/.-]+$')

def l5(p):
    if not os.path.exists(p): return {}
    t = open(p, encoding='utf-8-sig').read()
    try:   # швидкий шлях: ключі без лапок і кінцеві коми → JSON (json5 на чистому Python у ~20 разів повільніший)
        t1 = re.sub(r'(^|[{,])(\s*)([A-Za-z0-9_]+)\s*:', lambda m: m.group(1) + m.group(2) + '"' + m.group(3) + '":', t, flags=re.M)
        return json.loads(re.sub(r',(\s*[}\]])', r'\1', t1))
    except Exception:
        return json5.loads(t)

def names_map():
    """item/block/entity key → (en, uk) з effective.tsv (екрановані \\n \\t)."""
    p = os.path.join(UA, 'review', 'effective.tsv'); M = {}
    if not os.path.exists(p): return M
    for r in csv.reader(open(p, encoding='utf-8'), delimiter='\t'):
        if len(r) > 4 and r[0].split('.')[0] in ('item', 'block', 'entity', 'fluid', 'crop', 'parttype'): M[r[0]] = (r[3], r[4] or r[3])
    return M

def item_name(iid, M):
    n = _item_name(iid, M)
    return re.sub(r'\s*%s\s*', ' ', n).strip(' :') if n and '%s' in n else n   # шаблон «Передбачення: %s» без компонента — без «%s»

def _item_name(iid, M):
    if not isinstance(iid, str) or ':' not in iid: return None
    ns, path = iid.split(':', 1)
    for pre in ('item', 'block', 'entity', 'fluid'):
        k = f'{pre}.{ns}.{path.replace("/", ".")}'
        if k in M: return M[k][1]
    if path.startswith('part_') and (v := M.get(f'parttype.{ns}.{path[5:]}')): return v[1]   # частини Integrated Dynamics
    m = re.match(r'(.+)_(seeds|essence)$', path) if ns == 'mysticalagriculture' else None   # «Насіння %s» / «Есенція %s» + назва рослини
    if m and (pat := M.get(f'item.mysticalagriculture.mystical_{m[2]}')):
        crop = next((v[1] for k, v in M.items() if k.startswith('crop.') and k.endswith('.' + m[1])), None)
        if crop: return pat[1].replace('%s', crop)
    return None

def text(L, Len, key):
    v = L.get(key, Len.get(key))
    if isinstance(v, list): v = '\n'.join(v)
    return v

def oid(v):
    """ID предмета з поля icon / item (рядок або {id: …})."""
    v = v.get('id') if isinstance(v, dict) else v
    return v if isinstance(v, str) and ID_RX.match(v) else None

def custom_icon(v):
    """Іконка-текстура FTB (ftbquests:custom_icon + компонент ftbquests:icon) → синтетичний ID ftbtex:<ns>/<шлях у assets без .png> (малює extract_icons)."""
    if not isinstance(v, dict) or v.get('id') != 'ftbquests:custom_icon': return None
    t = (v.get('components') or {}).get('ftbquests:icon')
    if not isinstance(t, str) or ':' not in t: return None
    ns, p = t.split(':', 1)
    p = p[:-4] if p.endswith('.png') else p
    if not p.startswith('textures/'): p = 'textures/' + p
    i = f'ftbtex:{ns}/{p}'
    return i if ID_RX.match(i) else None

def usable(i):
    return i and not i.startswith('ftbquests:') and i != 'ftbfiltersystem:smart_filter'

class Tags:
    """Теги предметів з jar модів і клієнтського jar (data/<ns>/tags/item/<path>.json) — лише для іконок «розумних фільтрів»."""
    def __init__(self): self.idx = None
    def _load(self):
        import zipfile
        from common import MODS, CLIENT_JARS
        self.idx = {}
        jars = sorted(glob.glob(os.path.join(MODS, '*.jar'))) + [p for p in CLIENT_JARS() if os.path.exists(p)][:1]
        for j in jars:
            try: z = zipfile.ZipFile(j)
            except Exception: continue
            for n in z.namelist():
                m = re.match(r'data/([^/]+)/tags/items?/(.+)\.json$', n)
                if m: self.idx.setdefault(f'{m[1]}:{m[2]}', []).append((z, n))
    def first(self, tag, depth=0):
        if self.idx is None: self._load()
        for z, n in self.idx.get(tag, []):
            try: vals = json.loads(z.read(n).decode('utf-8-sig')).get('values', [])
            except Exception: continue
            for v in vals:
                v = v.get('id') if isinstance(v, dict) else v
                if not isinstance(v, str): continue
                if v.startswith('#'):
                    if depth < 4 and (r := self.first(v[1:], depth + 1)): return r
                elif ID_RX.match(v): return v
        return None
TAGS = Tags()

def filter_icon(item):
    """Іконка «розумного фільтра» FTB: перший item(…)/block(…), інакше перший предмет тегу item_tag(…)."""
    f = ((item or {}).get('components') or {}).get('ftbfiltersystem:filter') if isinstance(item, dict) else None
    if not isinstance(f, str): return None
    m = re.search(r'(?:item|block)\(([a-z0-9_.-]+:[a-z0-9_/.-]+)\)', f)
    if m: return m[1]
    m = re.search(r'item_tag\(([a-z0-9_.-]+:[a-z0-9_/.-]+)\)', f)
    return TAGS.first(m[1]) if m else None

def missing_id(item):
    mi = ((item or {}).get('components') or {}).get('ftbquests:missing_item') if isinstance(item, dict) else None
    m = re.search(r'([a-z0-9_.-]+:[a-z0-9_/.-]+)', mi) if isinstance(mi, str) else None
    return m[1] if m else None

def task_icon(t, have):
    ti, it = oid(t.get('icon')), oid(t.get('item'))
    if usable(ti): return ti
    if usable(it): return it
    if it == 'ftbfiltersystem:smart_filter': return filter_icon(t.get('item'))
    if it == 'ftbquests:missing_item' and (mid := missing_id(t.get('item'))) and mid.split(':')[0] in have: return mid
    if t.get('type') == 'kill' and isinstance(t.get('entity'), str) and ':' in t['entity']:
        return t['entity'] + '_spawn_egg'     # як яйце виклику (є не для всіх істот — тоді іконки не буде)
    return None

def filter_opts(item, M):
    """«Розумний фільтр» FTB: усі варіанти item(…)/block(…) (до 16) і теги item_tag(…) — щоб показати «будь-що з …», як у грі."""
    f = ((item or {}).get('components') or {}).get('ftbfiltersystem:filter') if isinstance(item, dict) else None
    if not isinstance(f, str): return None, None
    ids = list(dict.fromkeys(re.findall(r'(?:item|block)\(([a-z0-9_.-]+:[a-z0-9_/.-]+)\)', f)))[:16]
    tags = list(dict.fromkeys(re.findall(r'item_tag\(([a-z0-9_.-]+:[a-z0-9_/.-]+)\)', f)))
    mods = list(dict.fromkeys(re.findall(r'mod\(([a-z0-9_.-]+)\)', f)))
    return ([{'id': i, 'name': item_name(i, M) or ''} for i in ids] or None), ([*('#' + t for t in tags), *('@' + m for m in mods)] or None)

def comp_note(item, M):
    """Властивості предмета, які гра перевіряє (зілля, зачарування, тип бджоли, назва…) — коротким рядком."""
    c = ((item or {}).get('components') or {}) if isinstance(item, dict) else {}
    out = []
    pc = c.get('minecraft:potion_contents')
    if isinstance(pc, dict) and pc.get('potion'): out.append('зілля ' + pc['potion'].split(':')[-1])
    for k in ('minecraft:stored_enchantments', 'minecraft:enchantments'):
        e = c.get(k)
        if isinstance(e, dict): out.append('чари ' + ', '.join(f"{x.split(':')[-1]} {v}" for x, v in (e.get('levels') or e).items() if isinstance(v, int)))
    for k, lbl in (('productivebees:bee_type', 'бджола'), ('productivefarming:color', 'колір'), ('gateways:gateway', 'брама'), ('sophisticatedstorage:wood_type', 'деревина')):
        if isinstance(c.get(k), str): out.append(f"{lbl} {c[k].split(':')[-1]}")
    if c.get('minecraft:custom_name'): out.append('з власною назвою')
    return '; '.join(out) or None

def reward(r, M, RT):
    t = r.get('type'); it = oid(r.get('item'))
    if t == 'item' and it:
        return {'t': 'item', 'item': it, 'n': r.get('count') or (r.get('item') or {}).get('count') or 1, 'name': item_name(it, M) or ''}
    if t in ('xp', 'xp_levels'): return {'t': t, 'n': r.get(t) or 0}
    if t in ('random', 'loot', 'choice'):
        tid = r.get('table_id')
        if isinstance(tid, int): tid = f'{tid & 0xFFFFFFFFFFFFFFFF:016X}'     # у файлах квесту — десяткове long, у таблицях — hex
        return {'t': t, 'tid': tid, 'table': strip_fmt(RT.get(f'reward_table.{tid}.title') or '')}
    return None   # command / toast — службове

def main():
    M = names_map()
    have = {m['id'] for m in (jload(os.path.join(RAW, 'mods_auto.json'), []) or [])}   # моди, що є в збірці
    groups_order = [g['id'] for g in l5(os.path.join(QUESTS, 'chapter_groups.json5')).get('chapter_groups', [])]
    uk, en = os.path.join(QUESTS, 'lang', 'uk_ua'), os.path.join(QUESTS, 'lang', 'en_us')
    G_uk, G_en = l5(os.path.join(uk, 'chapter_group.json5')), l5(os.path.join(en, 'chapter_group.json5'))
    C_uk, C_en = l5(os.path.join(uk, 'chapter.json5')), l5(os.path.join(en, 'chapter.json5'))
    RT = {**l5(os.path.join(en, 'reward_table.json5')), **l5(os.path.join(uk, 'reward_table.json5'))}
    D = l5(os.path.join(QUESTS, 'data.json5'))                       # загальні налаштування книги: типова форма, режим проходження
    shape0, pm0 = D.get('default_quest_shape') or 'circle', D.get('progression_mode') or 'linear'
    chapters, qowner, raw = [], {}, {}
    for f in sorted(glob.glob(os.path.join(QUESTS, 'chapters', '*.json5'))):
        c = l5(f); raw[c['filename']] = c
        for q in c.get('quests', []): qowner[q['id']] = c['filename']
    os.makedirs(os.path.join(DATA, 'quests'), exist_ok=True)
    cross = collections.Counter(); stat = collections.Counter(); out = {}
    for fn, c in raw.items():
        Lu, Le = l5(os.path.join(uk, 'chapters', fn + '.json5')), l5(os.path.join(en, 'chapters', fn + '.json5'))
        cid = c['id']; quests = []; modc = collections.Counter(); missc = collections.Counter()
        hdl0 = bool(c.get('default_hide_dependency_lines'))
        for q in c.get('quests', []):
            qid = q['id']; tasks = []; qmiss = set(); arr = False
            for t in q.get('tasks', []):
                iid = oid(t.get('item')); ent = t.get('entity'); dim = t.get('dimension')
                obj = iid or ent or dim
                if isinstance(obj, str) and ':' in obj: modc[obj.split(':')[0]] += 1
                mi = ((t.get('item') or {}).get('components') or {}).get('ftbquests:missing_item') if isinstance(t.get('item'), dict) else None
                ns = re.sub(r'^\d+x\s*', '', mi).split(':')[0] if isinstance(mi, str) and ':' in mi else None
                if ns and ns not in have: missc[ns] += 1; qmiss.add(ns)   # заглушка: предмета мода немає в збірці
                ttl = strip_fmt(text(Lu, Le, f'task.{t["id"]}.title') or '')
                if ttl == 'AllRightsReserved': arr = True
                cnt = (t.get('item') or {}).get('count') if isinstance(t.get('item'), dict) else None
                cnt = t.get('count') or cnt
                opts, tags = filter_opts(t.get('item'), M) if iid == 'ftbfiltersystem:smart_filter' else (None, None)
                tasks.append({k: v for k, v in {'id': t['id'], 'type': t.get('type'), 'item': iid, 'icon': task_icon(t, have), 'count': cnt,
                              'entity': ent, 'dim': dim, 'adv': t.get('advancement'), 'structure': t.get('structure'), 'biome': t.get('biome'),
                              'opt': t.get('optional_task'), 'opts': opts, 'tags': tags, 'comp': comp_note(t.get('item'), M),
                              'consume': t.get('consume_items'),
                              'name': ttl or item_name(iid or ent, M)}.items() if v not in (None, '', 1, False)})
            title = strip_fmt(text(Lu, Le, f'quest.{qid}.title') or '') or (tasks[0].get('name') if tasks else '') or ''
            deps = q.get('dependencies', [])
            for d in deps:
                if qowner.get(d) and qowner[d] != fn: cross[(qowner[d], fn)] += 1
            qi = custom_icon(q.get('icon')) or oid(q.get('icon'))
            icon = qi if usable(qi) else next((t['icon'] for t in tasks if t.get('icon')), None)
            rw = [x for x in (reward(r, M, RT) for r in q.get('rewards', [])) if x]
            inv = bool(q.get('invisible')) and not arr
            stat['arr'] += arr; stat['inv'] += inv; stat['icon'] += bool(icon)
            quests.append({k: v for k, v in {
                'id': qid, 'x': q.get('x'), 'y': q.get('y'), 'title': title,
                'sub': strip_fmt(text(Lu, Le, f'quest.{qid}.quest_subtitle') or ''),
                'desc': text(Lu, Le, f'quest.{qid}.quest_desc') or '',   # з кодами &x — сайт їх розфарбовує
                'deps': deps, 'any': q.get('dependency_requirement') in ('one_completed', 'one_started'),
                'dreq': q.get('dependency_requirement') if q.get('dependency_requirement') not in (None, 'all_completed') else None,
                'dmin': q.get('min_required_dependencies'),
                'flex': (q.get('progression_mode') or c.get('progression_mode') or pm0) == 'flexible',
                'vis': 'deps_complete' if q.get('hide_until_deps_complete') else 'deps_visible' if q.get('hide_until_deps_visible') else None,
                'hdet': q.get('hide_details_until_startable'),
                'tasks': tasks, 'shape': q.get('shape') or c.get('default_quest_shape') or shape0, 'size': q.get('size'),
                'optional': q.get('optional'), 'icon': icon,
                'rewards': len(q.get('rewards', [])), 'rw': rw,
                'arr': arr, 'inv': inv, 'hdl': bool(q.get('hide_dependency_lines', hdl0)), 'hdtl': q.get('hide_dependent_lines'),
                'missing': sorted(qmiss),   # квест-заглушка: потрібні предмети модів, яких немає в збірці
            }.items() if v not in (None, '', [], 0, False)})
        links = [{k: v for k, v in {'id': l.get('id'), 'linked': l.get('linked_quest'), 'chapter': qowner.get(l.get('linked_quest')),
                  'x': l.get('x'), 'y': l.get('y'), 'size': l.get('size'), 'shape': l.get('shape')}.items() if v not in (None, '')}
                 for l in c.get('quest_links', []) if l.get('linked_quest') in qowner]
        imgs = [{k: v for k, v in {'src': im.get('image'), 'x': im.get('x'), 'y': im.get('y'), 'w': im.get('width'), 'h': im.get('height'),
                 'r': im.get('rotation') or None, 'a': im.get('alpha'), 'dep': im.get('dependency'), 'z': im.get('order')}.items() if v not in (None, '', 0)}
                for im in c.get('images', []) if isinstance(im.get('image'), str)]   # картинки на полотні глави (як у книзі)
        out[fn] = {'chapter': fn, 'quests': quests, 'links': links, 'img': imgs}
        chapters.append({k: v for k, v in {
            'id': cid, 'file': fn, 'group': c.get('group', ''), 'order': c.get('order_index', 0),
            'title': strip_fmt(text(C_uk, C_en, f'chapter.{cid}.title') or fn),
            'sub': strip_fmt(text(C_uk, C_en, f'chapter.{cid}.chapter_subtitle') or ''),
            'icon': custom_icon(c.get('icon')) or oid(c.get('icon')), 'quests': len(quests), 'hidden': c.get('always_invisible'),
            'service': sum(1 for q in quests if q.get('arr') or q.get('inv')),
            'mods': [m for m, _ in modc.most_common(10) if m not in ('minecraft', 'allthetweaks', 'ftbquests', 'ftbfiltersystem')][:8],
            'missing': [m for m, _ in missc.most_common(4)],   # моди, яких немає в збірці (квести-заглушки ftbquests:missing_item)
        }.items() if v not in (None, '', [], False, 0)})
    # квести інших глав, на які посилається глава (залежності, quest_links) → ext: {id: {t, c, icon}} — назва й глава без завантаження чужих файлів
    allq = {q['id']: (fn, q) for fn, d in out.items() for q in d['quests']}
    for fn, d in out.items():
        refs = {x for q in d['quests'] for x in q.get('deps', []) if allq.get(x, (fn,))[0] != fn} | {l['linked'] for l in d['links']}
        d['ext'] = {r: {k: v for k, v in {'t': allq[r][1].get('title', ''), 'c': allq[r][0], 'icon': allq[r][1].get('icon')}.items() if v}
                    for r in sorted(refs) if r in allq}
        jsave(os.path.join(DATA, 'quests', fn + '.json'), {k: v for k, v in d.items() if v not in ([], {})}, compact=True)
    # таблиці випадкових нагород (reward_tables) → що саме може випасти і з яким шансом
    tables = {}
    for f in glob.glob(os.path.join(QUESTS, 'reward_tables', '*.json5')):
        t = l5(f); its = []
        for r in t.get('rewards', []):
            it = r.get('item') if isinstance(r.get('item'), dict) else {}
            i = oid(it); mid = missing_id(it) if i == 'ftbquests:missing_item' else None
            x = {'item': mid or i, 'name': item_name(mid or i, M) or '', 'n': r.get('count') or it.get('count') or 1, 'w': r.get('weight', 1.0)}
            if mid and mid.split(':')[0] not in have: x['miss'] = 1
            if r.get('type') in ('xp', 'xp_levels'): x = {'t': r['type'], 'n': r.get(r['type']) or 0, 'w': r.get('weight', 1.0)}
            if x.get('item') or x.get('t'): its.append(x)
        tables[t['id']] = {'title': strip_fmt(RT.get(f"reward_table.{t['id']}.title") or ''), 'n': t.get('loot_size', 1), 'items': its}
    jsave(os.path.join(DATA, 'reward_tables.json'), tables, compact=True)
    groups = [{'id': g, 'title': strip_fmt(G_uk.get(f'chapter_group.{g}.title') or G_en.get(f'chapter_group.{g}.title') or g), 'order': i}
              for i, g in enumerate(groups_order)]
    links = [{'from': a, 'to': b, 'n': n} for (a, b), n in sorted(cross.items())]
    jsave(os.path.join(DATA, 'chapters.json'), {'groups': groups, 'chapters': sorted(chapters, key=lambda c: (groups_order.index(c.get('group')) if c.get('group') in groups_order else 99, c.get('order', 0))), 'links': links})
    allq = [q for d in out.values() for q in d['quests']]
    print('груп', len(groups), '| глав', len(chapters), '| квестів', len(allq), '| міжглавних зв\'язків', len(links),
          '| з іконкою', stat['icon'], '| службових', stat['arr'], '| невидимих', stat['inv'],
          '| без опису', sum(1 for q in allq if not q.get('desc')), '| без назви', sum(1 for q in allq if not q.get('title')))

if __name__ == '__main__': main()
