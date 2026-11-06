# Аудит відповідності путівника збірці: що в даних сайту не підтверджено квестами / суперечить складу збірки → raw/audit_fidelity.md.
# Запуск з atm11_guide після build_data.py:  python3 -I tools/audit_fidelity.py
# Перевіряє: згадки модів, яких у збірці немає, без пояснення; віхи карти з квестами прихованих глав / заглушками / без квестів;
#   ребра req без src, яких немає в залежностях квестів; синергії без src (ребра карти й synergy модів); кроки гілок без src / з квестами прихованих глав;
#   посилання на приховані глави; ⚑ чернетки.
# SYN_AUDITED — класи (головний cls), чиї synergy вже звірено з джерелами: без src → «виправити»; решта — «інфо» до своєї сесії (G5–G6).
# TXT_AUDITED — класи, чиї тексти модів (uk / what / tips / spoiler) звірено: mod.ref обов'язковий (G4: tech, energy).
# СИТО (сесія S): кожне машинне посилання `ref` (tools/refcheck.py) розв'язується за повними індексами raw/*_index.json (extract_recipes.py, extract_kubejs.py):
#   не знайдено / неактивне (мода немає, рецепт вимкнено, значення конфігу інше) → «виправити»; ref має стосуватися модів, які твердження поєднує;
#   число з config-ref має бути в тексті. ref обов'язковий: кроки гілок (quests — теж ref), synergy класів SYN_AUDITED, ребра req/syn віх цих класів без підтвердження квестами, факти.
import json, glob, os, re, sys, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import DATA as D, RAW
from refcheck import Refs, refs_of, nums, fmt_num, text_nums, num_forms
J = lambda p: json.load(open(p, encoding='utf-8'))
mods = J(f'{D}/mods.json'); road = J(f'{D}/roadmap.json'); br = J(f'{D}/branches.json'); chs = J(f'{D}/chapters.json')['chapters']
have = {m['id'] for m in mods}; ch = {c['file']: c for c in chs}
qown, qinfo, deps = {}, {}, collections.defaultdict(set)
for f in glob.glob(f'{D}/quests/*.json'):
    fn = os.path.basename(f)[:-5]
    for q in J(f)['quests']:
        qown[q['id']] = fn; qinfo[q['id']] = q
        for d in q.get('deps', []): deps[q['id']].add(d)
absent_ns = sorted({m for c in chs for m in c.get('missing', [])})
ABS = {'Mekanism': 'mekanism', 'Create': 'create', 'Modern Industrialization': 'modern_industrialization', 'PneumaticCraft': 'pneumaticcraft', 'Industrial Foregoing': 'industrialforegoing',
       'Immersive Engineering': 'immersiveengineering', 'Draconic Evolution': 'draconicevolution', 'Twilight Forest': 'twilightforest', "Iron's Spells": 'irons_spellbooks', 'Ars Nouveau': 'ars_nouveau',
       'Cataclysm': 'cataclysm', 'Bumblezone': 'the_bumblezone', 'Deeper and Darker': 'deeperdarker', 'Eternal Starlight': 'eternal_starlight', "Nature's Aura": 'naturesaura', 'Flux Networks': 'fluxnetworks',
       'Extreme Reactors': 'bigreactors', 'XyCraft': 'xycraft_world', 'Actually Additions': 'actuallyadditions', 'Botania': 'botania', 'Thermal': 'thermal', 'Blood Magic': 'bloodmagic', 'Tinkers': 'tconstruct',
       'Relics': 'relics', 'Compact Machines': 'compactmachines', 'Ender Storage': 'enderstorage', 'MEGA Cells': 'megacells', 'Ad Astra': 'ad_astra', 'Applied Mekanistics': 'appmek'}
ABS = {k: v for k, v in ABS.items() if v not in have}
rx = re.compile('|'.join(re.escape(k) for k in sorted(ABS, key=len, reverse=True)))
out = collections.defaultdict(list)
SYN_AUDITED = {'magic', 'tech', 'energy', 'resources', 'farming', 'exploration', 'combat', 'storage', 'logistics', 'gear', 'qol', 'decor', 'library', 'perf'}     # G6b: + storage, logistics, gear; G6c: + qol, decor, library, perf (усі класи)
TXT_AUDITED = {'tech', 'energy', 'resources', 'farming', 'exploration', 'combat', 'magic', 'storage', 'logistics', 'gear', 'qol', 'decor', 'library', 'perf'}     # G6b: + magic, storage, logistics, gear; G6c: + qol, decor, library, perf                  # головний cls: тексти uk / what / tips звірено з індексами (G4) — mod.ref обов'язковий, числа з config-ref мають бути в тексті
RF = Refs()
if not RF.ok: out['виправити: індекси сита відсутні — запустіть tools/extract_recipes.py і tools/extract_kubejs.py'].append('raw/*_index.json')
SIEVED = collections.Counter()
ABS_RX = re.compile(r'(?<![\w-])(лише|тільки|єдин(?:ий|а|е|і|ого|ої|ому|им|их|ою)|завжди|ніколи|усі|усіх|усім|усіма|всі|всіх|всім|всіма|будь-як(?:ий|а|е|і|ого|ої|ому|им|их|ою)|кож(?:ен|н(?:ий|а|е|і|ого|ої|ому|им|их|ою|ій)))(?![\w-])', re.I)   # G6d: + кожен / кожна / кожне / кожні (рішення користувача 2026-10-28)
NUM_CTX = re.compile(r'(?:етап\w*|розділ\w*|рівень|рівня|рівні|рівнів|рівнем|рівню|тир\w*|tier|ранг\w*|atm|глав\w*|сесі\w*|mk|ступін\w*|ступен\w*|№)\s*(?:\d+\s*(?:[-–/,]|і|та)\s*)*$', re.I)
ABS_SRC = re.compile(r'\b(only|just|every|each|all|always|never|any|sole|solely|cannot|can\'t|exclusively|whole)\b|лише|тільки|єдин|завжди|ніколи|усі|всі|будь-як|кож(?:ен|н)|@[a-z_]+', re.I)   # цитата джерела (~…) сама містить «лише / усі» або весь простір імен @мод
NUM_POST = re.compile(r'\s*[-–]?\s*(?:-?(?:й|го|му)\s+)?(?:рівн|етап|тир\b|розділ)', re.I)        # «Кузня 3 рівня», «5-го етапу»
DUP, QSEEN = collections.defaultdict(list), set()
def unproven(claim, ev):
    """Числа тексту, яких немає серед доказів ref (з похідними формами) і які не стоять у дозволеному контексті (етап, рівень, Розділ, назва в «…»)."""
    claim = re.sub(r'`[^`]*`', ' ', claim or '')
    forms = set()
    for e in ev: forms |= {round(x, 4) for x in num_forms(e)}
    bad = []
    for m in re.finditer(r'«[^«»]*»|[^«]+', claim):
        seg = m.group(0)
        if seg.startswith('«'): continue                                  # назва в лапках (квест, предмет, вимір) — доводить сам ref
        seg = re.sub(r'(?<=\d)[\s\u00a0\u202f](?=\d{3}\b)', '', re.sub(r'[a-z0-9_]+:[a-z0-9_/.\-]+|\d+(?:\.\d+){2,}|\b\d{4}-\d{2}-\d{2}\b', ' ', seg))
        for x in re.finditer(r'(?<![\w:/#.\-])\d+(?:[.,]\d+)?(?![\w])', seg):
            v = float(x.group(0).replace(',', '.'))
            pre = seg[max(0, x.start() - 14):x.start()]
            if round(v, 4) in forms or NUM_CTX.search(pre) or NUM_POST.match(seg[x.end():x.end() + 12]): continue
            bad.append(f'{x.group(0)} («…{seg[max(0, x.start() - 30):x.end() + 20].strip()}…»)')
    return bad
def deep(where, rec, refs, claim, strict, qdesc=True):
    """G6b крок 0: числа (кожне — з конфігу / квесту uk|en / рецепта / тексту ~…), абсолютні слова (лише / єдиний / усі…), дублікати механізмів."""
    if not strict: return
    ev = set()
    for r in refs: ev |= RF.evidence(r, qdesc)
    for b in unproven(claim, ev): out['виправити: число без джерела (немає в конфігу / квесті uk-en / рецепті / тексті ~… з ref запису)'].append(f'{where}: {b}')
    ab = sorted({m.group(1).lower() for m in ABS_RX.finditer(re.sub(r'«[^«»]*»', ' ', claim or ''))})
    if ab:
        if isinstance(rec, dict) and rec.get('abs_ok'): out['інфо: абсолютне слово — свідомий виняток (abs_ok)'].append(f"{where}: {', '.join(ab)} — {rec['abs_ok']}")
        elif sum(1 for r in refs if r.startswith(('!', 'only:')) or ABS_SRC.search(r.partition('~')[2])) < len([x for x in re.split(r'(?<=[.!?;])\s+', re.sub(r'«[^«»]*»', ' ', claim or '')) if ABS_RX.search(x)]): out['перевірити: абсолютне слово без доказу повноти (речень з «лише / усі…» більше, ніж доказів !ref / only: / ~цитата «only…»; або abs_ok, або переформулювати)'].append(f"{where}: {', '.join(ab)} — «{(claim or '')[:150]}»")
    owner = re.sub(r' (what|tips)\[\d+\]$', ' (текст)', where)
    for raw in refs:
        neg = raw.startswith('!'); r = raw.lstrip('!'); sch, _, v = r.partition(':')
        if neg: continue                                                    # заперечення («рецепт вимкнено») — спільний контекст, не опис механізму
        if sch in ('recipe', 'only') or (sch == 'config' and '#' in v) or (sch in ('kjs', 'jarfile', 'file') and ('#' in v or '~' in v)):
            key = sch + ':' + (v.partition('=')[0] if sch in ('config', 'only') else v)
            if owner not in DUP[key]: DUP[key].append(owner)
        if sch == 'quest': QSEEN.add(v.partition('~')[0].upper())
def sieve(where, rec, text='', need=(), required=False, extra=(), claim=None, more_ev=(), qdesc=True, noref='виправити: немає ref (машинного джерела) — твердження не пройшло сито'):
    """Прогнати ref запису через індекси. need — моди, яких має стосуватися хоч один ref (синергія справді поєднує моди).
    claim — саме твердження (без src) для перевірок G6b; more_ev — ref, що доводять числа, але не належать запису (ref мода для пункту what / tips)."""
    refs = refs_of(rec) + list(extra)
    deep(where, rec, refs + list(more_ev), text if claim is None else claim, required or bool(refs), qdesc)
    text = re.sub(r'(?<=\d)[\s\u00a0\u202f](?=\d{3}\b)', '', text)          # «20 000» = 20000
    ing = rec.get('ingame') if isinstance(rec, dict) else None             # рішення користувача: «перевірить у грі» — сито не блокує, а показує
    FIX = (lambda k, x: out['інфо: перевірити в грі (ingame) — сито не підтвердило повністю'].append(f'{x} · перевірити: {ing}')) if ing else (lambda k, x: out[k].append(x))
    if not refs:
        if required: out[noref].append(where)
        return
    touched, ok = set(), 0
    for r in refs:
        lvl, msg, ms = RF.check(r); touched |= ms; SIEVED[lvl] += 1
        if lvl == 'fix': FIX('виправити: ref не підтверджено індексами збірки', f'{where}: `{r}` — {msg}')
        elif lvl == 'info': out['інфо: ref — умова мода (обчислює мод у грі) / перевірити в грі'].append(f'{where}: `{r}` — {msg}')
        else: ok += 1
        if r.startswith('config:') and lvl == 'ok':
            v = RF.config_value(r.split(':', 1)[1]); ns = nums(v)                 # частка 0.15 = «15 %»
            if ns and not any(f in text for x in ns + [round(x * 100, 4) for x in ns if 0 < x <= 1] + [x / d for x in ns for d in (1000, 1e6) if x >= d and x % d == 0] for f in fmt_num(x)): FIX('виправити: число з конфігу не збігається з текстом', f'{where}: `{r}` = {v} — у тексті цього числа немає')
    need = {m for m in need if m}
    if need and ok and not (touched & need): FIX('виправити: ref не стосуються модів, які твердження поєднує', f'{where}: потрібно {", ".join(sorted(need))}; ref стосуються {", ".join(sorted(touched)) or "—"}')
    if ing: out['інфо: перевірити в грі (ingame)'].append(f'{where}: {ing}')
TAG_USE = collections.defaultdict(set)                                     # G8: тег → моди, чиї активні рецепти беруть його інгредієнтом
for _rid, _e in RF.R.items():
    if _e.get('a') is False: continue
    for _x in _e.get('in', []):
        if _x.startswith('#'): TAG_USE[_x[1:]] |= {_rid.split(':')[0]} | set(_e.get('m') or [])
for _f, _d in RF.C.items():                                              # … і моди, чий конфіг називає тег (generatorgalore: fuelTag = c:honey)
    _m = re.split(r'[-_./]', _f.removeprefix('config/'))[0]
    for _v in (_d or {}).values():
        for _x in (_v if isinstance(_v, list) else [_v]):
            if isinstance(_x, str) and re.fullmatch(r'#?[a-z0-9_.\-]+:[a-z0-9_/.\-]+', _x): TAG_USE[_x.lstrip('#')].add(_m)
def tag_owner(where, rec, mods_ok, owner=()):
    """G8: tag:<тег> доводить запис мода, лише якщо в тезі є предмет мода-власника або партнера (G7: амулети BHC «у тезі намиста», а їх там немає),
    або тег — власний тег мода-власника (простір імен), або активний рецепт / конфіг мода-власника бере цей тег."""
    if not isinstance(rec, dict) or rec.get('ingame'): return
    mods_ok = {m for m in mods_ok if m}; owner = {m for m in owner if m}
    for raw in refs_of(rec):
        if not raw.startswith('tag:'): continue
        xs = RF.tag_items(raw[4:])
        if not xs: continue                                                 # немає / порожній — уже «виправити» в sieve
        have = {x.lstrip('#').split(':')[0] for x in xs}; tg = raw[4:].split(':', 1)[1] if raw[4:].split(':')[0] in ('block', 'fluid', 'item') and raw.count(':') == 3 else raw[4:]
        if not have & mods_ok and tg.split(':')[0] not in owner and not TAG_USE.get(tg.lstrip('#'), set()) & owner: out['виправити: тег не містить предметів мода-власника / партнера (tag: доводить лише вміст)'].append(f"{where}: `{raw}` — у тезі {len(xs)} ({', '.join(sorted(have)[:6])}), потрібно {', '.join(sorted(mods_ok))}")
NEG = re.compile(r'немає|неактивн|відсутн|не портован|заглушк|прихован|не працю|не скрафтити|не зібрати|очікують|бракує|ще не|в дусі|переосмислення|за мотивами', re.I)
def scan(where, text):
    for m in set(x.group(0) for x in rx.finditer(text or '')):
        i = text.find(m); ctx = text[max(0, i - 160):i + 160]
        key = 'інфо: згадка відсутнього мода — пояснено, що його немає' if NEG.search(ctx) else 'виправити: згадка відсутнього мода БЕЗ пояснення — може збити гравця'
        out[key].append(f'{where}: «{m}» — …{text[max(0, i - 70):i + 70]}…')
# 1. дорожня карта
nid = {n['id']: n for n in road['nodes']}
for n in road['nodes']:
    w = f"карта/{n['id']} «{n.get('title')}»"
    scan(w, ' '.join([n.get('title', ''), n.get('text', '')]))
    if n.get('chapter') and ch.get(n['chapter'], {}).get('hidden'): out['виправити: віха посилається на приховану главу'].append(f"{w} → {n['chapter']}")
    for qid in (n.get('done_by') or {}).get('quests', []):
        q = qinfo.get(qid)
        if not q: out['виправити: done_by — невідомий квест'].append(f'{w}: {qid}')
        elif ch.get(qown[qid], {}).get('hidden'): out['виправити: done_by — квест у прихованій главі (у грі не виконати)'].append(f"{w}: {qid} «{q.get('title')}» ({qown[qid]})")
        elif q.get('missing'): out['виправити: done_by — квест-заглушка'].append(f"{w}: {qid} «{q.get('title')}»")
    sieve(w, n, ' '.join([n.get('title', ''), n.get('text', ''), n.get('src', '') or '']), claim=' '.join([n.get('title', ''), n.get('text', '')]))
    if n.get('na'): out['інфо: віха «у цій версії недоступно» (na)'].append(f"{w}: {n['na']}")
    elif not (n.get('done_by') or {}).get('quests'): out['інфо: віха без квесту в done_by (у мода немає відкритої глави — стан із предметів/досягнень)'].append(w)
# 2. ребра «потрібно» без підтвердження залежностями квестів
anc_cache = {}
def ancestors(q):
    if q in anc_cache: return anc_cache[q]
    seen, st = set(), [q]
    while st:
        x = st.pop()
        for d in deps.get(x, ()):
            if d not in seen: seen.add(d); st.append(d)
    anc_cache[q] = seen; return seen
for e in road['edges']:
    a, b = nid.get(e['from'], {}), nid.get(e['to'], {})
    if e.get('kind') == 'syn' and not e.get('src'): out['виправити: синергія без джерела src'].append(f"{e['from']} → {e['to']}")
    if e.get('kind') not in ('req', 'syn'):
        sieve(f"ребро {e['from']} → {e['to']}", e, e.get('src', '') or '', claim=e.get('label', '')); continue
    qa, qb = (a.get('done_by') or {}).get('quests', []), (b.get('done_by') or {}).get('quests', [])
    qok = qa and qb and any(x in ancestors(y) for x in qa for y in qb)
    aud = bool({a.get('lane'), b.get('lane')} & SYN_AUDITED)
    need = set(a.get('mods', [])) | set(b.get('mods', [])) if e.get('kind') == 'syn' else set()
    sieve(f"ребро {e['from']} → {e['to']} ({e.get('kind')})", e, e.get('src', '') or '', need=need, required=aud and not qok, claim=e.get('label', ''))
    if e.get('kind') != 'req' or qok: continue                                                      # req підтверджено залежністю квестів
    if e.get('src'):
        if not e.get('ref'): out['інфо: ребро req за рецептом / KubeJS / конфігом / завданням квесту (src без ref; звірити при оновленні збірки)'].append(f"{e['from']} → {e['to']}: {e['src']}")
        continue
    if not qa or not qb: out['виправити: ребро req без src і без квестів з обох боків'].append(f"{e['from']} → {e['to']}"); continue
    if not any(x in ancestors(y) for x in qa for y in qb): out['виправити: ребро req без src, у квестах залежності немає'].append(f"{e['from']} «{a.get('title')}» → {e['to']} «{b.get('title')}»")
# 3. довідник
for m in mods:
    if m.get('auto'): continue
    w = f"мод/{m['id']}"
    scan(w, ' '.join([m.get('uk', ''), *m.get('what', []), *m.get('tips', []), m.get('spoiler', '') or '', *[s.get('why', '') for s in m.get('synergy', [])]]))
    if m.get('chapter') and ch.get(m['chapter'], {}).get('hidden'): out['інфо: мод посилається на приховану главу (сторінка мода показує «Приховані в грі» з причиною)'].append(f"{w} → {m['chapter']}")
    if m.get('verify'): out['виправити: мод — ⚑ чернетка (не підтверджено)'].append(w)
    ir = m.get('item_ref') or {}                                           # G6b: власні ref пунктів what / tips (build_data: {поле: {індекс: [ref]}})
    own = {(f, int(i)): refs_of({'ref': r}) for f, d in ir.items() for i, r in d.items()}
    plain = ' '.join([m.get('uk', ''), *[x for f in ('what', 'tips') for i, x in enumerate(m.get(f, [])) if (f, i) not in own], m.get('spoiler', '') or ''])
    txt_req = (m.get('cls') or [''])[0] in TXT_AUDITED
    sieve(f'{w} (текст)', m, ' '.join([m.get('uk', ''), *m.get('what', []), *m.get('tips', []), m.get('spoiler', '') or '']), required=txt_req, claim=plain)
    tag_owner(f'{w} (текст)', m, {m['id']}, {m['id']})
    for (f, i), rs in own.items():
        sieve(f'{w} {f}[{i}]', {'ref': rs}, m.get(f, [''] * (i + 1))[i], required=True, more_ev=refs_of(m))
        tag_owner(f'{w} {f}[{i}]', {'ref': rs}, {m['id']}, {m['id']})
    for sy in m.get('synergy', []):
        sieve(f"{w} → {sy.get('mod')}", sy, f"{sy.get('why', '')} {sy.get('src', '')}", need={sy.get('mod')}, required=(m.get('cls') or [''])[0] in SYN_AUDITED, claim=sy.get('why', ''))
        tag_owner(f"{w} → {sy.get('mod')}", sy, {m['id'], sy.get('mod')}, {m['id']})
        if sy.get('src'): continue
        if (m.get('cls') or [''])[0] in SYN_AUDITED: out['виправити: синергія мода без src (рецепт / тег / конфіг / сумісність)'].append(f"{w} → {sy.get('mod')}: {sy.get('why', '')[:90]}")
        else: out['інфо: синергія мода без src (клас ще не звірено — G4–G6)'].append(f"{w} → {sy.get('mod')}")
# 4. гілки
for b in br:
    w = f"гілка/{b['id']}"
    scan(w, ' '.join([b.get('summary', ''), *b.get('gives', []), *[s.get('title', '') + ' ' + s.get('text', '') for s in b.get('steps', [])]]))
    if b.get('verify'): out['виправити: гілка — ⚑ чернетка'].append(w)
    for st in b.get('steps', []):
        sieve(f"{w}/{st.get('id')}", st, ' '.join([st.get('title', ''), st.get('text', ''), st.get('src', '') or '']), required=True, extra=[f'quest:{q}' for q in st.get('quests', [])], claim=' '.join([st.get('title', ''), st.get('text', '')]))
        tag_owner(f"{w}/{st.get('id')}", st, set(b.get('mods', [])), set(b.get('mods', [])))
        if not st.get('src'): out['виправити: крок гілки без src'].append(f"{w}/{st.get('id')} «{st.get('title')}»")
        if st.get('verify'): out['виправити: крок гілки — ⚑ (не підтверджено)'].append(f"{w}/{st.get('id')} «{st.get('title')}»")
        for qid in st.get('quests', []):
            if qid in qown and ch.get(qown[qid], {}).get('hidden'): out['виправити: крок гілки — квест у прихованій главі'].append(f"{w}/{st.get('id')}: {qid}")
            elif qinfo.get(qid, {}).get('missing'): out['виправити: крок гілки — квест-заглушка'].append(f"{w}/{st.get('id')}: {qid}")
    if b.get('chapter') and ch.get(b['chapter'], {}).get('hidden'): out['виправити: гілка посилається на приховану главу'].append(w)
# 5. факти
for f in J(f'{D}/facts.json')['facts']:
    scan(f"факт/{f['id']}", f['text']); sieve(f"факт/{f['id']}", f, f.get('title', '') + '. ' + f['text'], required=True)
NOREF_CH = 'виправити: глава без ref — огляд / пункт / допис глави квестів не пройшов сито (G6d)'
# 6. глави квестів (G6d): огляд ov / why, пункти steps / rewards / atm, дописи — кожен з ref; числа — з рецепта / конфігу / даних квесту (кількості завдань і нагород), не з опису квесту (qdesc=False)
guide = J(f'{D}/guide.json')
for fn, g in sorted(guide.items()):
    w = f'глава/{fn}'; c = ch.get(fn, {})
    scan(w, ' '.join([g.get('ov', ''), g.get('why', ''), *[x for f in ('steps', 'rewards', 'atm') for x in g.get(f, [])]]))
    main = 'why' if c.get('hidden') else 'ov'
    if g.get(main): sieve(f'{w} ({main})', {'ref': g.get('ref'), 'abs_ok': g.get('abs_ok')}, g[main], required=True, qdesc=False, noref=NOREF_CH)
    for f in ('steps', 'rewards', 'atm'):
        for i, x in enumerate(g.get(f, [])):
            sieve(f'{w} {f}[{i}]', {'ref': ((g.get('item_ref') or {}).get(f) or {}).get(str(i)), 'abs_ok': ((g.get('item_abs') or {}).get(f) or {}).get(str(i))}, x, required=True, qdesc=False, noref=NOREF_CH)
    nf = f'{D}/notes/{fn}.json'
    for qid, v in (J(nf) if os.path.exists(nf) else {}).items():
        sieve(f'{w} допис {qid}', v, ' '.join([v.get('title', ''), v.get('text', '')]), required=True, more_ev=[f'quest:{qid}'], qdesc=False, noref=NOREF_CH)
# Дублікати (G6b): карта (підсумок), гілки (проходження) і довідник — різні подання й можуть спиратися на те саме джерело;
#   звести треба той самий механізм, описаний у записах ≥2 різних модів (синергії A → B і B → A, текст A і синергія B → A) або в ≥2 фактах.
#   Синергію партнер бачить і так: сторінка мода показує зворотні синергії (synergy_in, build_data) — другий запис не потрібен.
for k, ws in DUP.items():
    pairs = collections.Counter(frozenset(re.match(r'мод/([\w-]+) → ([\w-]+)', w).groups()) for w in ws if re.match(r'мод/[\w-]+ → ', w))   # та сама пара модів (A → B і B → A) — дублікат;
    facts_ = [w for w in ws if w.startswith('факт/')]                                                                  # рецепт із предметами кількох модів законно доводить різні пари
    if any(c > 1 for c in pairs.values()) or len(facts_) > 1: out['перевірити: один механізм (ref) описано в записах кількох модів / фактів — звести в одне місце (мод-власник або факт), партнер бачить зворотну синергію'].append(f"`{k}` — {' · '.join(ws)}")
    elif len(ws) > 1: out['інфо: те саме джерело в різних поданнях (карта / гілка / довідник / факт) — узгодженість перевіряти при правках'].append(f"`{k}` — {' · '.join(ws)}")
# G7: пара модів, описана в обидва боки (A → B і B → A) з різними ref, — сито вище її не ловить (немає спільного ref). Той самий
#   механізм — звести в один запис мода-власника (партнер бачить synergy_in); різні механізми — pair_ok: "чому" в одному із записів.
_syn = {(m['id'], x['mod']): x for m in J(f'{D}/mods.json') for x in m.get('synergy', [])}
for (a, b), x in sorted(_syn.items()):
    if a < b and (b, a) in _syn and not (x.get('pair_ok') or _syn[(b, a)].get('pair_ok')):
        out['перевірити: пара модів описана в обидва боки (A → B і B → A) — той самий механізм звести в один запис мода-власника; різні механізми — pair_ok: "чому"'].append(f'{a} ⇄ {b}')
for q in sorted(QSEEN):                                                     # G6b: квест як джерело — англійський оригінал поруч; розбіжність чисел uk ≠ en — спірне для ua_work
    uk, en = RF.quest_text(q)
    if en and sorted(text_nums(uk)) != sorted(text_nums(en)): out['інфо: квест-джерело — числа в перекладі ≠ en (спірне для ua_work; брати en)'].append(f"{q}: uk {sorted(text_nums(uk))} «{uk[:110]}» · en {sorted(text_nums(en))} «{en[:110]}»")
rep = ['# Аудит відповідності путівника збірці (tools/audit_fidelity.py)', '', 'Автоматична перевірка даних путівника проти файлів збірки (квести, моди в збірці). Кожен пункт — кандидат на виправлення в G2–G6: підтвердити джерелом (рецепт, квест, конфіг, KubeJS) або прибрати / позначити ⚑.', '',
       f'Моди, яких у збірці немає, але їх згадують квести: {", ".join(absent_ns)}', '']
fix = sum(len(v) for k, v in out.items() if k.startswith('виправити')); chk = sum(len(v) for k, v in out.items() if k.startswith('перевірити'))
rep += [f'**Виправити: {fix}** · перевірити: {chk} · інфо: {sum(len(v) for k, v in out.items() if k.startswith("інфо"))}', '',
        f'Сито: ref перевірено {sum(SIEVED.values())} — підтверджено {SIEVED["ok"]}, відкинуто {SIEVED["fix"]}, умова мода / перевірити в грі {SIEVED["info"]}. Індекси: raw/recipes_report.md, raw/kubejs_report.md.', '']
for k, v in sorted(out.items(), key=lambda kv: ({'в': 0, 'п': 1}.get(kv[0][0], 2), kv[0])):
    rep += [f'## {k} — {len(v)}', ''] + [f'- {x}' for x in v] + ['']
open(os.path.join(RAW, 'audit_fidelity.md'), 'w', encoding='utf-8').write('\n'.join(rep))
for k, v in out.items(): print(len(v), k)
