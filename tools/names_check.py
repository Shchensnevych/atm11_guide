# G8: назви в текстах путівника — як у грі. Запуск з atm11_guide: python3 -I tools/names_check.py [--all]
# Для кожного запису з ref (тексти модів, синергії, кроки гілок, огляди й дописи глав, факти, віхи) бере ID предметів,
# які доводить сам запис (item:, вхід / вихід recipe:, only:, ID у ~цитатах kjs: / jarfile: / file:, предмети завдань quest:, icons),
# і звіряє з текстом назву цього ID з перекладу гри (docs/data/names.json ← ua_work effective.tsv):
#   ✅ назва є в тексті (відмінок допустимий: порівняння основ слів, чергування і / о / е);
#   ⚠ «підміна» — у тексті є найрідкісніше слово назви (рідкість — за всіма назвами гри, без списків слів), а сусіднє слово назви
#     замінено іншим словом зі словника назв гри (не пропущено в переліку, не розділено комою чи «і / й / та / або»), і такої пари слів немає в жодній назві гри
#     («хмара в банці» при «Хмара в пляшці»); решта неповних згадок («руни … тиші») — лише з --all;
#   ⚠ «англійською» — у тексті англійська назва предмета, хоча переклад є.
# Окремо — назви в «лапках», яких немає серед назв гри (предмети, істоти, виміри, біоми, книги, квести, глави, моди, досягнення).
# Звіт — raw/names_check.md (лише читає docs/data і raw/*_index.json; правки — у content/).
import os, sys, re, json, glob, math, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import RAW, DATA, UA, jload
import csv

J = lambda p, d=None: jload(p, d)
NM = J(os.path.join(DATA, 'names.json'), {}) or {}
ITEMS = NM.get('items', {})
R = J(os.path.join(RAW, 'recipes_index.json'), {}) or {}
QI = {}
for f in glob.glob(os.path.join(DATA, 'quests', '*.json')):
    for q in (J(f, {}) or {}).get('quests', []): QI[q['id']] = q

ALT = str.maketrans({'і': 'е', 'о': 'е', 'ї': 'е', 'є': 'е', 'ґ': 'г', 'ʼ': '', "'": '', '’': ''})
END = re.compile(r'(ями|ами|ові|еві|ього|ому|ими|іми|ий|ій|ої|ою|єю|им|ім|их|іх|ах|ях|ів|їв|ей|ам|ям|ом|ем|ого|а|я|о|е|и|і|у|ю|ї|й|ь)$')
def stem(w):
    w = w.lower()
    s = END.sub('', w) if len(w) > 3 else w
    return (s or w[:3]).translate(ALT)
WRX = re.compile(r"[a-zа-яіїєґ0-9ʼ'’\-]+")
def words(t):
    return WRX.findall((t or '').lower())
def spans(t):
    """Слова з ознакою «перед словом розділовий знак» (кома, крапка, дужка, тире) — межа сусідства."""
    t = (t or '').lower(); out = []; last = 0
    for m in WRX.finditer(t):
        out.append((m.group(0), bool(re.search(r'[,.;:()«»!?/–—]', t[last:m.start()])))); last = m.end()
    return out
def same(a, b):
    """Одне слово в різних відмінках: спільний початок основи ≥ 4 (або вся коротша основа)."""
    if a == b: return True
    n = 0
    for x, y in zip(a, b):
        if x != y: break
        n += 1
    k = min(len(a), len(b))
    return n >= min(4, k) and abs(len(a) - len(b)) <= 3 and n >= k - 2

CONJ = {'і', 'й', 'та', 'чи', 'або', 'а'}
SIG = lambda ws: [w for w in ws if len(w) >= 3 and not w.isdigit()]
DF = collections.Counter()                                               # рідкість слова — у скількох назвах гри воно є
BIG = collections.defaultdict(set)                                       # пари сусідніх основ у назвах гри (за першими 3 літерами першого слова)
for sec in ('items', 'entities'):
    for v in NM.get(sec, {}).values():
        ns = [stem(w) for w in SIG(words(v[0]))]
        for s in set(ns): DF[s] += 1
        for a, b in zip(ns, ns[1:]): BIG[a[:3]].add((a, b))
def in_game_pair(a, b):
    return any(same(a, x) and same(b, y) for x, y in BIG.get(a[:3], ()))

def find(text_st, name, sp=None):
    """Назва в тексті: усі значущі слова назви — підряд (вікно = довжина назви + 2) в основах тексту.
    Повертає (знайдено, індекс найрідкіснішого слова, підміна: (слово тексту, слово назви) | None)."""
    ns = [stem(w) for w in SIG(words(name))]
    if not ns: return True, None, None
    for i in range(len(text_st)):
        if not same(text_st[i], ns[0]) and not any(same(text_st[i], x) for x in ns): continue
        win = text_st[i:i + len(ns) + 2]
        if all(any(same(t, x) for t in win) for x in ns): return True, None, None
    j = min(range(len(ns)), key=lambda k: (DF.get(ns[k], 0), -len(ns[k]))); rare = ns[j]
    hits = [i for i, t in enumerate(text_st) if same(t, rare)]
    if not hits: return False, None, None
    sub = None
    if sp is not None and len(ns) > 1:
        for i in hits:
            for d in (1, -1):                                             # сусід назви праворуч / ліворуч від рідкісного слова
                if not 0 <= j + d < len(ns): continue
                k, ok = i, False
                while 0 <= k + d < len(sp):
                    if (sp[k + d][1] if d > 0 else sp[k][1]): break       # розділовий знак між словами — перелік, не підміна
                    k += d
                    if sp[k][0] in CONJ: break                            # «сонячного й місячного каменю» — перелік зі спільним словом
                    if len(sp[k][0]) >= 3: ok = True; break
                if not ok: continue
                w = text_st[k]
                if len(w) < 3 or w.isdigit() or any(same(w, x) for x in ns) or not DF.get(w): continue   # слова, якого немає в жодній назві гри («перші», «беруть»), — не назва
                a, b = (rare, w) if d > 0 else (w, rare)
                if in_game_pair(a, b): continue                          # пара слів є в іншій назві гри — інший предмет
                sub = (sp[k][0], SIG(words(name))[j + d]); break
            if sub: return False, i, sub
    return False, hits[0], None

ALTN = collections.defaultdict(set)                                       # ID → інші назви гри (блок і предмет з одним ID звуться по-різному: передавач / приймач тепла)
try:
    with open(os.path.join(UA, 'review', 'effective.tsv'), encoding='utf-8') as f:
        for row in csv.reader(f, delimiter='\t', quoting=csv.QUOTE_NONE):
            m = re.match(r'(item|block)\.([a-z0-9_]+)\.([a-z0-9_/]+)$', row[0]) if len(row) >= 5 else None
            if m: ALTN[f'{m[2]}:{m[3]}'].add(row[4])
except OSError: pass

def ids_of(refs, extra=()):
    out = []
    def add(x, why):
        x = x.lstrip('#')
        if ':' in x and not x.startswith(('c:', 'neoforge:')) and x not in [o for o, _ in out]: out.append((x, why))
    for r in refs:
        r = r.lstrip('!'); sch, _, v = r.partition(':')
        if sch == 'item': add(v, 'item')
        elif sch == 'only': add(v.split('=')[0], 'only')
        elif sch == 'recipe':
            e = R.get(v) or {}
            for x in e.get('out', []): add(x, 'вихід рецепта')
            for x in e.get('in', []):
                if not x.startswith('#'): add(x, 'вхід рецепта')
        elif sch == 'quest':
            q = QI.get(v.partition('~')[0].upper()) or {}
            for t in q.get('tasks', []):
                if t.get('item'): add(t['item'], 'завдання квесту')
        if sch in ('kjs', 'jarfile', 'file', 'quest') and '~' in v:
            for x in re.findall(r'[a-z0-9_]+:[a-z0-9_/]+', v.partition('~')[2]): add(x, '~цитата')
    for x in extra: add(x, 'icons')
    return out

PRIMARY = {'item', 'only', 'вихід рецепта', '~цитата', 'icons'}           # ID, які запис називає сам; входи рецептів і завдання квестів — лише з --all
def refs_of(x):
    r = x.get('ref') if isinstance(x, dict) else None
    return [r] if isinstance(r, str) else list(r or [])

RECS = []                                                                # (де, файл content/, текст, ref, icons)
def rec(where, src, text, refs, icons=()):
    if text and (refs or icons): RECS.append((where, src, text, refs, list(icons)))

mods = J(os.path.join(DATA, 'mods.json'), []) or []
GRP = {}
for f in glob.glob(os.path.join(os.path.dirname(DATA), '..', 'content', 'mods', '*.json')):
    for k in (J(f, {}) or {}): GRP[k] = 'content/mods/' + os.path.basename(f)
for m in mods:
    if m.get('auto'): continue
    src = GRP.get(m['id'], 'content/mods/?')
    own = {(f, int(i)) for f, d in (m.get('item_ref') or {}).items() for i in d}
    plain = ' '.join([m.get('uk', ''), *[x for f in ('what', 'tips') for i, x in enumerate(m.get(f, [])) if (f, i) not in own], m.get('spoiler', '') or ''])
    rec(f"мод/{m['id']} (текст)", src, plain, refs_of(m), m.get('icons', []))
    for f, d in (m.get('item_ref') or {}).items():
        for i, r in d.items(): rec(f"мод/{m['id']} {f}[{i}]", src, m.get(f, [])[int(i)], refs_of({'ref': r}))
    for s in m.get('synergy', []): rec(f"мод/{m['id']} → {s.get('mod')}", src, s.get('why', ''), refs_of(s))
for b in J(os.path.join(DATA, 'branches.json'), []) or []:
    for s in b.get('steps', []):
        rec(f"гілка/{b['id']}/{s.get('id')}", f"content/branches/{b['id']}.json", f"{s.get('title', '')}. {s.get('text', '')}", refs_of(s) + [f'quest:{q}' for q in s.get('quests', [])])
G = J(os.path.join(DATA, 'guide.json'), {}) or {}
for ch, g in G.items():
    src = f'content/chapters/{ch}.json'
    rec(f'глава/{ch} ov', src, (g.get('ov') or '') + ' ' + (g.get('why') or ''), refs_of(g))
    for fld in ('steps', 'rewards', 'atm'):
        for i, t in enumerate(g.get(fld) or []):
            r = ((g.get('item_ref') or {}).get(fld) or {}).get(str(i)) or ((g.get('item_ref') or {}).get(fld) or {}).get(i)
            rec(f'глава/{ch} {fld}[{i}]', src, t, refs_of({'ref': r}) if r else refs_of(g))
    for qid, n in (J(os.path.join(DATA, 'notes', f'{ch}.json'), {}) or {}).items():
        n = n if isinstance(n, dict) else {'text': n}
        rec(f'глава/{ch} допис {qid}', src, n.get('text', ''), refs_of(n) + [f'quest:{qid}'])
for f in (J(os.path.join(DATA, 'facts.json'), {}) or {}).get('facts', []):
    rec(f"факт/{f['id']}", 'content/facts.json', f"{f.get('title', '')}. {f.get('text', '')}", refs_of(f))
RM = J(os.path.join(DATA, 'roadmap.json'), {}) or {}
for n in RM.get('nodes', []):
    rec(f"віха/{n['id']}", 'content/roadmap.json', f"{n.get('title', '')}. {n.get('text', '')}", refs_of(n), n.get('icons', []))

# назви гри для «лапок»: усі рядки перекладу гри (до 8 слів) + назви квестів, глав, модів, досягнень і власні заголовки путівника
GAME = set()
try:
    with open(os.path.join(UA, 'review', 'effective.tsv'), encoding='utf-8') as f:
        for row in csv.reader(f, delimiter='\t', quoting=csv.QUOTE_NONE):
            if len(row) >= 5 and len(row[4].split()) <= 8: GAME |= {re.sub(r'§.|%\S*', '', row[4]).strip().lower(), row[3].strip().lower()}
except OSError: pass
for sec in ('items', 'entities', 'dims', 'biomes', 'books'):
    for v in NM.get(sec, {}).values(): GAME |= {v[0].lower()} | ({v[1].lower()} if len(v) > 1 else set())
for q in QI.values():
    if q.get('title'): GAME.add(re.sub(r'&.', '', q['title']).lower())
for c in (J(os.path.join(DATA, 'chapters.json'), {}) or {}).get('chapters', []): GAME.add((c.get('title') or '').lower())
for m in mods: GAME |= {(m.get('name') or '').lower(), m['id']}
for b in J(os.path.join(DATA, 'branches.json'), []) or []:
    GAME |= {(b.get('title') or '').lower()} | {(s.get('title') or '').lower() for s in b.get('steps', [])}
for f in (J(os.path.join(DATA, 'facts.json'), {}) or {}).get('facts', []): GAME.add((f.get('title') or '').lower())
GAME |= {(n.get('title') or '').lower() for n in RM.get('nodes', [])} | {(g.get('title') or '').lower() for g in RM.get('groups', [])} | {'особливості atm11'}
for a in (RM.get('adv_info') or {}).values():
    if isinstance(a, dict) and a.get('title'): GAME.add(a['title'].lower())
GSTEM = {' '.join(stem(w) for w in SIG(words(x))) for x in GAME}

def quoted_ok(q):
    ql = q.lower().strip(' .!?')
    if ql in GAME: return True
    qs = [stem(w) for w in SIG(words(ql))]
    if not qs: return True
    key = ' '.join(qs)
    if key in GSTEM: return True
    if any(len(g.split()) == len(qs) and all(same(a, b) for a, b in zip(qs, g.split())) for g in GSTEM if g[:2] == key[:2]): return True
    if len(qs) < 2: return False
    for g in GSTEM:                                                       # ≥2 слів — частина назви гри («Покращення печі» ⊂ «Покращення печі: мідна → залізна»)
        gs = g.split()
        for i in range(len(gs) - len(qs) + 1):
            if all(same(a, b) for a, b in zip(qs, gs[i:i + len(qs)])): return True
    return False

def main():
    full = '--all' in sys.argv
    diff, en, quo, okn, seen = [], [], [], 0, set()
    for where, src, text, refs, icons in RECS:
        sp = spans(text); tw = [w for w, _ in sp]; ts = [stem(w) for w in tw]
        for iid, why in ids_of(refs, icons):
            nm = ITEMS.get(iid)
            if not nm: continue
            uk, eng = nm[0], (nm[1] if len(nm) > 1 else '')
            hit, at, sub = find(ts, uk, sp)
            if not hit and any(find(ts, a, sp)[0] for a in ALTN.get(iid, ()) if a != uk): hit = True
            if hit: okn += 1; continue
            if eng and eng.lower() != uk.lower() and re.search(r'(?<![\w])' + re.escape(eng.lower()) + r'(?![\w])', text.lower()):
                en.append((src, where, iid, uk, eng)); continue
            if at is not None and ((sub and why in PRIMARY) or full):
                key = (where, iid)
                if key in seen: continue
                seen.add(key)
                frag = ' '.join(tw[max(0, at - 3):at + 4])
                diff.append((src, where, iid, uk, frag, why + (f'; «{sub[0]}» замість «{sub[1]}»' if sub else '')))
        for q in re.findall(r'«([^«»]{3,80})»', text):
            if not quoted_ok(q): quo.append((src, where, q))
    L = ['# Назви в текстах путівника — як у грі (tools/names_check.py, G8)', '',
         f'Записів з ref: {len(RECS)} · назв ID знайдено в тексті: {okn} · «підміна»{" і неповні" if full else ""}: {len(diff)} · англійською: {len(en)} · «лапки» без назви гри: {len(quo)}', '',
         'Відмінок допустимий. «Підміна» — найрідкісніше слово назви гри є в тексті, а сусіднє слово назви замінено іншим (не перелік через кому) і такої пари слів немає в жодній назві гри: текст називає предмет інакше — виправити в content/ (або це інша річ — лишити). `--all` — ще й неповні згадки.', '']
    def sect(title, rows, fmt):
        L.append(f'## {title} — {len(rows)}'); L.append('')
        by = collections.defaultdict(list)
        for r in rows: by[r[0]].append(r)
        for s in sorted(by):
            L.append(f'### {s}')
            for r in by[s]: L.append('- ' + fmt(r))
            L.append('')
    sect('Підміна слова в назві' + (' і неповні згадки (--all)' if full else ''), diff, lambda r: f'{r[1]}: `{r[2]}` = **{r[3]}** · у тексті: «…{r[4]}…» ({r[5]})')
    sect('Англійською, хоча є переклад', en, lambda r: f'{r[1]}: `{r[2]}` {r[4]} → **{r[3]}**')
    sect('«Лапки» без назви гри', quo, lambda r: f'{r[1]}: «{r[2]}»')
    open(os.path.join(RAW, 'names_check.md'), 'w', encoding='utf-8').write('\n'.join(L) + '\n')
    print(L[2])

if __name__ == '__main__': main()
