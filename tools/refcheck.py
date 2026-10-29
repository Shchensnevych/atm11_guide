# Розв'язувач машинних посилань `ref` (сито, сесія S) — за ПОВНИМИ індексами raw/*_index.json, а не за пильністю моделі.
#   quest:<hex>                       квест існує, глава не прихована, не заглушка
#   recipe:<id>                       рецепт jar / даних / KubeJS існує й активний (умови NeoForge, мод є, не вимкнено KubeJS)
#   kjs:<файл>[#<id рецепта>|#L<рядок>]  файл у minecraft/kubejs (шлях від kubejs/); скрипт діє (не під хибним Platform.isLoaded); рецепт / рядок — є в розборі
#   tag:<ns:path>                     тег предметів (block:/fluid: — інші реєстри) існує й не порожній
#   config:<файл>#<ключ>[=<значення>] ключ у minecraft/<файл> (повний шлях або унікальний кінець), значення збігається
#   item:<ns:id>  lang:<ключ>  jarfile:[<jar>!]<шлях у jar>[~<текст, який файл містить>]
#   file:<шлях від minecraft/>[~<текст>]  інший файл гри (crash-reports, options.txt…) — лише як свідчення спостереження
#   only:<предмет>=<тип | мод>[,…]  «лише / єдиний спосіб» — усі активні рецепти предмета мають такий тип (G6b)
#   count:<що>:<вибірка>=<N>          число-кількість (G6b): files:[<jar>!]<префікс>[|<RX імені>] · items:<ns>[|<RX>] · recipes:<RX id>[|<RX типу>] (активні) · quests:<глава> · tag:<ns:path>
#                                     · config:<файл>#<ключ> / json:<файл від minecraft/>#<ключ> (довжина списку) · dir:<тека від minecraft/>[|<RX>] · rx:<файл від minecraft/>|<RX> (збіги)
#   quest:<hex>~<текст>               квест містить цитату (uk або en, без кодів форматування) — доказ формулювання «лише / усі»
#   !<ref>                          заперечення: «вимкнено / немає / приховано» — ок, лише якщо ref НЕ розв'язується
# check(ref) → (рівень 'ok' | 'fix' | 'info', пояснення, моди, яких стосується) — моди потрібні, щоб перевірити, що синергія справді поєднує моди.
import os, re, json, glob, zipfile, sys, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import RAW, DATA, MC, MODS, jload, strip_fmt
strip = lambda s: strip_fmt((s or '').replace('\\n', ' '))
SCHEMES = ('quest', 'recipe', 'kjs', 'tag', 'config', 'item', 'lang', 'jarfile', 'file', 'only', 'count')
NOT_MODS = {'minecraft', 'c', 'neoforge', 'kubejs', 'atm', 'forge'}
NUM_LAX = re.compile(r'(?<!\d)(\d+(?:[.,]\d+)?)')                     # докази: і «mouse.4», «tier_5», «300s»
NUM_RX = re.compile(r'(?<![\w:/#.\-])(\d+(?:[.,]\d+)?)(?![\w])')      # окреме число (не частина ID, версії, клавіші F3, «T2», «s3»)

def text_nums(s, strict=True):
    """Числа в тексті як float: «20 000» = 20000, «1,5» = 1.5; ID, версії й `код` пропускаються. strict=False (докази) — і «300s», «tier_5»."""
    s = re.sub(r'`[^`]*`', ' ', s or '')
    if strict: s = re.sub(r'[a-z0-9_]+:[a-z0-9_/.\-]+', ' ', s)            # ID ns:path
    s = re.sub(r'\d+(?:\.\d+){2,}', ' ', s)                                  # версії 26.1.2
    s = re.sub(r'(?<=\d)[\s\u00a0\u202f](?=\d{3}\b)', '', s)
    s = re.sub(r'(?<=\d),(?=\d{3}(?:\D|$))', '', s)                         # en: 1,000,000
    out = []
    for m in (NUM_RX if strict else NUM_LAX).finditer(s):
        try: out.append(float(m.group(1).replace(',', '.')))
        except ValueError: pass
    return out

def raw_nums(o):
    """Усі числа JSON-об'єкта / рядка (значення конфігу, рецепт, текст квесту)."""
    if isinstance(o, bool) or o is None: return set()
    if isinstance(o, (int, float)): return {float(o)}
    if isinstance(o, str): return set(text_nums(o, False))
    if isinstance(o, dict): return set().union(*[raw_nums(v) for v in o.values()]) if o else set()
    if isinstance(o, list): return set().union(*[raw_nums(v) for v in o]) if o else set()
    return set()

EN_N = {w: i for i, w in enumerate('zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split())}
EN_N.update({'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90, 'a': 1, 'single': 1, 'double': 2, 'twice': 2, 'triple': 3, 'half': 0.5})
EN_M = {'hundred': 100, 'thousand': 1000, 'million': 1000000}
def word_nums(t):
    """Числа словами в англійському тексті квесту: «sixteen», «two thousand», «twenty-four» (G6b: квести часто пишуть числа словами)."""
    out, cur, have = set(), 0, False
    for w in re.findall(r"[a-z]+", (t or '').lower().replace('-', ' ')):
        if w in EN_N and not (w == 'a' and not have):
            cur += EN_N[w]; have = True
        elif w in EN_M and have:
            cur = (cur or 1) * EN_M[w]
        else:
            if have and cur: out.add(float(cur))
            cur, have = 0, False
            if w in EN_M: out.add(float(EN_M[w]))
    if have and cur: out.add(float(cur))
    return out

def recipe_nums(o):
    """Кількості, заховані у формі рецепта: скільки разів символ стоїть у шаблоні (pattern), скільки однакових інгредієнтів у списку; неявна 1."""
    out = {1.0}
    def walk(x):
        if isinstance(x, dict):
            pat = x.get('pattern')
            if isinstance(pat, list) and all(isinstance(r, str) for r in pat):
                c = collections.Counter(ch for r in pat for ch in r if ch != ' '); out.update(float(v) for v in c.values())
            for v in x.values(): walk(v)
        elif isinstance(x, list):
            c = collections.Counter(json.dumps(v, sort_keys=True) for v in x)
            out.update(float(v) for v in c.values() if v > 1)
            for v in x: walk(v)
    walk(o); return out

def script_nums(t):
    """Те саме для рядків скрипта KubeJS: шаблон ['ABA', 'B B', …] і повтори інгредієнтів."""
    out = {1.0}
    for arr in re.findall(r"\[\s*((?:['\"][^'\"\n]{1,3}['\"]\s*,?\s*){2,3})\]", t):
        rows = re.findall(r"['\"]([^'\"\n]{1,3})['\"]", arr)
        c = collections.Counter(ch for r in rows for ch in r if ch != ' '); out.update(float(v) for v in c.values())
    for arr in re.findall(r'\[([^\[\]]{3,400})\]', t):
        c = collections.Counter(x.strip() for x in arr.split(',') if x.strip()); out.update(float(v) for v in c.values() if v > 1)
    return out

def num_forms(e):
    """Похідні форми числа-джерела: частка ↔ %, тики ↔ секунди / хвилини, FE ↔ кFE / MFE, «N-1» рівнів від 0."""
    return {e, e * 100, e / 100, e / 20, e * 20, e / 1200, e / 1000, e / 1e6, e * 1000, e / 60, e / 2, e + 1}

def nums(v):
    """Числа значення конфігу (число або список чисел)."""
    if isinstance(v, bool): return []
    if isinstance(v, (int, float)): return [v]
    if isinstance(v, list): return [x for x in v if isinstance(x, (int, float)) and not isinstance(x, bool)]
    return []

def fmt_num(x):
    s = str(int(x)) if float(x).is_integer() else repr(float(x))
    return {s, s.replace('.', ',')}

class Refs:
    def __init__(self):
        self.R = jload(os.path.join(RAW, 'recipes_index.json'), {}) or {}
        self.K = jload(os.path.join(RAW, 'kubejs_index.json'), {}) or {}
        self.T = jload(os.path.join(RAW, 'tags_index.json'), {}) or {}
        reg = jload(os.path.join(RAW, 'registry_index.json'), {}) or {}
        self.mods = set(reg.get('mods', [])); self.items = set(reg.get('items', [])) | {r['id'] for r in self.K.get('registry', []) if r['reg'] in ('item', 'block')}
        self.C = jload(os.path.join(RAW, 'config_index.json'), {}) or {}
        self._lang = None; self._jars = None
        self.ok = bool(self.R and self.K and self.T and reg)
        chs = (jload(os.path.join(DATA, 'chapters.json'), {}) or {}).get('chapters', []); self.hidden = {c['file'] for c in chs if c.get('hidden')}
        self._en = None; self._zips = {}
        self.Q = {}
        for f in glob.glob(os.path.join(DATA, 'quests', '*.json')):
            fn = os.path.basename(f)[:-5]
            for q in (jload(f, {}) or {}).get('quests', []): self.Q[q['id']] = (fn, q)
        self.kat = {}                                                   # файл KubeJS → що він робить (рецепти, remove, теги, події…)
        for kind in ('recipes', 'removes', 'replaces', 'tags', 'registry', 'events', 'data'):
            for x in self.K.get(kind, []):
                self.kat.setdefault(x['at'].rsplit(':', 1)[0], []).append((kind, x))
        self.kfalse = {}
        for c in self.K.get('conds_false', []): self.kfalse.setdefault(c['at'].rsplit(':', 1)[0], []).append(c)
        self.ktrue = {}                                                 # моди з Platform.isLoaded(…) = true у файлі — скрипт стосується цих модів
        for c in self.K.get('conds_true', []): self.ktrue.setdefault(c['at'].rsplit(':', 1)[0], set()).add(c['mod'])
        self.longmods = sorted((m for m in self.mods if len(m) >= 5 and m not in NOT_MODS), key=len, reverse=True)
        kt = {}
        for op in self.K.get('tags', []):
            if op['kind'] == 'add': kt.setdefault(f"{op['reg']}:{op['tag']}", set()).update(op['vals'])
        self.ktags = kt

    def lang(self):
        if self._lang is None: self._lang = jload(os.path.join(RAW, 'lang_index.json'), {}) or {}
        return self._lang

    def jarnames(self):
        if self._jars is None:
            self._jars = {}
            for j in glob.glob(os.path.join(MODS, '*.jar')):
                try: self._jars[os.path.basename(j)] = set(zipfile.ZipFile(j).namelist())
                except Exception: pass
        return self._jars

    def mods_in(self, text):
        """ID модів, що стоять у шляху / назві окремим словом (alchemical_sulfur_allthemodium → allthemodium)."""
        t = '_' + re.sub(r'[^a-z0-9_]+', '_', text.lower()) + '_'
        return {m for m in self.longmods if f'_{m}_' in t}

    def rmods(self, e):
        return set(e.get('m') or e.get('mods') or []) | {x.lstrip('#').split(':')[0] for x in e.get('in', []) + e.get('out', [])} - NOT_MODS

    def check(self, ref):
        if isinstance(ref, str) and ref.startswith('!'):                 # заперечення: твердження каже «вимкнено / немає / приховано» — сито вимагає, щоб так і було
            lvl, msg, ms = self.check(ref[1:])
            if lvl == 'fix': return 'ok', f'неактивне / відсутнє, як і сказано: {msg}', ms
            if lvl == 'ok': return 'fix', f'твердження «вимкнено / немає», а в збірці є: {msg}', ms
            return lvl, msg, ms
        if not isinstance(ref, str) or ':' not in ref: return 'fix', f'ref «{ref}»: формат <схема>:<значення>', set()
        sch, val = ref.split(':', 1)
        if sch not in SCHEMES: return 'fix', f'ref «{ref}»: невідома схема {sch} (є: {", ".join(SCHEMES)})', set()
        return getattr(self, 'c_' + sch)(val)

    def c_quest(self, v):
        v, _, needle = v.partition('~')                                 # quest:<hex>~<текст> — квест (uk або en) містить саме цей текст (G6b: цитата, що доводить «лише / усі»)
        if needle and self.Q.get(v.upper()) and not any(needle in t for t in self.quest_text(v)): return 'fix', f'квест {v}: тексту «{needle}» немає ні в uk, ні в en', set()
        q = self.Q.get(v.upper())
        if not q: return 'fix', f'квеста {v} немає', set()
        fn, d = q; ms = {fn} | {t.get('item', '').split(':')[0] for t in d.get('tasks', []) if t.get('item')} | {r.get('item', '').split(':')[0] for r in d.get('rw', []) if r.get('item')}
        ms |= {o['id'].split(':')[0] for t in d.get('tasks', []) for o in t.get('opts', []) if ':' in o.get('id', '')}   # варіанти смарт-фільтра FTB («Технічні моди»: EP / EIO / JDT)
        if fn in self.hidden: return 'fix', f'квест {v} «{d.get("title")}» — у прихованій главі {fn}', ms
        if d.get('missing'): return 'fix', f'квест {v} — заглушка (мода немає)', ms
        en = self.en().get(v.upper(), {}).get('title')
        return 'ok', f'квест «{d.get("title")}»' + (f' / en «{strip(en)}»' if en and strip(en) != d.get('title') else '') + f' ({fn})', ms - {''}

    def en(self):
        """Англійський оригінал квестів: config/ftbquests/quests/lang/en_us/chapters/*.json5 → {ID: {title, sub, desc, tasks}} (G6b: показувати поруч з українським)."""
        if self._en is None:
            self._en = {}
            rx = re.compile(r'"(quest|task)\.([0-9A-F]{16})\.(\w+)"\s*:\s*(\[(?:\s*"(?:[^"\\]|\\.)*"\s*,?)*\s*\]|"(?:[^"\\]|\\.)*")')
            tasks = {}
            for q in self.Q.values():
                for t in q[1].get('tasks', []): tasks[t.get('id', '')] = q[1]['id']
            for f in glob.glob(os.path.join(MC, 'config', 'ftbquests', 'quests', 'lang', 'en_us', 'chapters', '*.json5')):
                for kind, qid, key, val in rx.findall(open(f, encoding='utf-8', errors='replace').read()):
                    try: s = json.loads(re.sub(r',\s*\]$', ']', val))
                    except Exception: continue
                    s = ' '.join(s) if isinstance(s, list) else s
                    if kind == 'task':
                        if qid in tasks: self._en.setdefault(tasks[qid], {}).setdefault('tasks', []).append(s)
                        continue
                    k = {'title': 'title', 'quest_subtitle': 'sub', 'quest_desc': 'desc'}.get(key)
                    if k: self._en.setdefault(qid, {})[k] = s
        return self._en

    def quest_text(self, qid):
        """(український текст, англійський текст) квесту: назва, підзаголовок, опис, назви завдань."""
        fn, d = self.Q.get(qid.upper(), (None, {}))
        uk = ' '.join(str(x) for x in [d.get('title'), d.get('sub'), d.get('desc'), *[t.get('name') for t in d.get('tasks', [])]] if x)
        e = self.en().get(qid.upper(), {})
        return strip(uk), strip(' '.join(x for x in [e.get('title'), e.get('sub'), e.get('desc'), *e.get('tasks', [])] if x))

    def c_only(self, v):
        """only:<ns:id | #тег>=<тип | мод>[,…] — «лише / єдиний спосіб»: УСІ активні рецепти, що дають предмет, мають тип (повний або мод типу) зі списку (G6b)."""
        it, eq, allow = v.partition('=')
        if not eq: return 'fix', f'only:{v} — формат only:<предмет>=<тип | мод>[,…]', set()
        allow = {a.strip() for a in allow.split(',') if a.strip()}
        prod = [(k, e) for k, e in self.R.items() if e['a'] is not False and it in e['out']]
        ms = {it.lstrip('#').split(':')[0]} | {a.split(':')[0] for a in allow}
        if not prod: return 'fix', f'only:{it}: жодного активного рецепта, що дає предмет', ms - NOT_MODS
        other = [(k, e['t']) for k, e in prod if e['t'] not in allow and e['t'].split(':')[0] not in allow]
        if other: return 'fix', f'only:{it}: є й інші способи — ' + ', '.join(f'{k} [{t}]' for k, t in other[:4]) + (f' … ще {len(other) - 4}' if len(other) > 4 else ''), ms - NOT_MODS
        return 'ok', f'only:{it}: усі {len(prod)} активних рецептів — {", ".join(sorted(allow))}', ms - NOT_MODS

    def counted(self, v):
        """count:… → (кількість | None, пояснення, моди)."""
        what, _, sel = v.partition(':'); sel, _, rx = sel.partition('|'); R = re.compile(rx) if rx else None
        if what == 'files':
            jar, _, pre = sel.rpartition('!')
            hit = {f'{j}!{n}' for j, names in self.jarnames().items() if not jar or jar.lower() in j.lower() for n in names if n.startswith(pre) and not n.endswith('/') and (not R or R.search(n))}
            return len(hit), f'файлів {pre}* у jar' + (f' «{jar}»' if jar else ''), (set(re.findall(r'(?:assets|data)/([a-z0-9_]+)/', pre)) | self.mods_in(jar)) - NOT_MODS
        if what == 'items':
            return len([i for i in self.items if i.split(':')[0] == sel and (not R or R.search(i.split(':', 1)[1]))]), f'предметів {sel}' + (f' /{rx}/' if rx else '') + ' у реєстрі', {sel} - NOT_MODS
        if what == 'recipes':
            S = re.compile(sel); hit = [k for k, e in self.R.items() if e['a'] and S.search(k) and (not R or R.search(e['t']))]
            return len(hit), f'активних рецептів /{sel}/', {k.split(':')[0] for k in hit[:50]} - NOT_MODS
        if what == 'quests':
            return len([1 for fn, d in self.Q.values() if fn == sel and not d.get('arr') and not d.get('missing')]), f'квестів глави {sel} (без службових і заглушок)', {sel}
        if what in ('stubs', 'qall'):                                     # G6d: квестів-заглушок (ftbquests:missing_item) / усіх квестів глави (зі службовими) — для why прихованих глав
            qs = [d for fn, d in self.Q.values() if fn == sel]
            return len([d for d in qs if d.get('missing')] if what == 'stubs' else qs), ('квестів-заглушок' if what == 'stubs' else 'усіх квестів') + f' глави {sel}', {sel}
        if what == 'tag':
            xs = set(self.T.get('item', {}).get(sel, [])) | self.ktags.get(f'item:{sel}', set())
            return len(xs), f'предметів у тезі #{sel}', {sel.split(':')[0]} - NOT_MODS
        if what == 'config':                                            # довжина списку / словника — значення ключа конфігу
            val = self.config_value(sel)
            return (len(val) if isinstance(val, (list, dict)) else None), f'елементів у {sel}', set(re.findall(r'config/([a-z0-9_]+)', sel)) - NOT_MODS
        if what == 'json':                                              # json:<файл від minecraft/>#<ключ> — довжина списку / словника (файли KubeJS, яких немає в config_index)
            f, _, key = sel.partition('#')
            try: val = json.load(open(os.path.join(MC, f), encoding='utf-8'))
            except Exception: return None, f'minecraft/{f} не читається як JSON', set()
            for k in [k for k in key.split('.') if k]: val = val.get(k) if isinstance(val, dict) else None
            return (len(val) if isinstance(val, (list, dict)) else None), f'елементів у minecraft/{f}#{key}', set(re.findall(r'mods/([a-z0-9_]+)/', f)) & self.mods
        if what in ('dir', 'rx'):                                         # файлів у теці гри · збігів RX у файлі гри (шлях від minecraft/)
            p = os.path.normpath(os.path.join(MC, sel))
            if not p.startswith(os.path.normpath(MC)) or not os.path.exists(p): return None, f'minecraft/{sel} немає', set()
            ms = set(re.findall(r'(?:mods|config)/([a-z0-9_]+)', sel)) & self.mods
            if what == 'dir': return len([f for f in os.listdir(p) if os.path.isfile(os.path.join(p, f)) and (not R or R.search(f))]), f'файлів у minecraft/{sel}', ms
            if not R: return None, 'count:rx — потрібен |<RX>', ms
            return len(R.findall(open(p, encoding='utf-8', errors='replace').read())), f'збігів /{rx}/ у minecraft/{sel}', ms
        return None, f'count:{what} — невідомо (files | items | recipes | quests | stubs | qall | tag | config | json | dir | rx)', set()

    def c_count(self, v):
        body, eq, want = v.rpartition('=')
        if not eq: return 'fix', f'count:{v} — формат count:<що>:<вибірка>=<N>', set()
        n, msg, ms = self.counted(body)
        if n is None: return 'fix', msg, ms
        if str(n) != want.strip(): return 'fix', f'{msg}: {n}, а в ref {want}', ms
        return 'ok', f'{msg}: {n}', ms

    def zread(self, label, path):
        """Файл з jar за міткою джерела індексу рецептів (<jar> або <jar>!<вкладений jar>)."""
        try:
            if label in ('minecraft', 'neoforge'): return None
            jar, _, inner = label.partition('!')
            z = self._zips.get(jar) or self._zips.setdefault(jar, zipfile.ZipFile(os.path.join(MODS, jar)))
            if inner:
                k = label
                if k not in self._zips:
                    import io
                    name = next(n for n in z.namelist() if n.endswith('/' + inner))
                    self._zips[k] = zipfile.ZipFile(io.BytesIO(z.read(name)))
                z = self._zips[k]
            return z.read(path).decode('utf-8', 'replace')
        except Exception: return None

    def lines(self, f, ln, n=14):
        p = os.path.join(MC, 'kubejs', f)
        try: return ''.join(open(p, encoding='utf-8', errors='replace').readlines()[max(0, ln - 1):ln - 1 + n])
        except Exception: return ''

    def evidence(self, ref, qdesc=True):
        """Числа, які доводить ref (G6b, перевірка чисел): значення конфігу, кількості й параметри рецепта, числа квесту (uk + en), тексти ~… ."""
        if not isinstance(ref, str) or ':' not in ref or ref.startswith('!'): return set()
        sch, v = ref.split(':', 1); body, _, needle = v.partition('~')
        if needle and sch not in ('jarfile', 'file', 'kjs', 'quest'): return raw_nums(needle)
        if sch == 'quest' and not qdesc:                                 # G6d: квест доводить лише власні дані (кількості завдань і нагород), не числа опису
            d = self.Q.get(body.upper(), (None, {}))[1]
            return (raw_nums(needle) if needle else set()) | raw_nums([t.get('count') for t in d.get('tasks', [])]) | raw_nums([r.get('n') for r in d.get('rw', [])])
        return (raw_nums(needle) if needle else set()) | self._evidence(sch, v, body)

    def _evidence(self, sch, v, body):
        if sch == 'count': return raw_nums(v.rpartition('=')[2])
        if sch == 'only': return set()
        if sch == 'config':
            f, _, kv = v.partition('#')
            if not kv: return raw_nums(list((self.C.get(f) or {}).values()))   # config:<файл> без ключа — числа всього конфігу мода (G6b)
            return raw_nums(self.config_value(v))
        if sch == 'quest':
            fn, d = self.Q.get(body.upper(), (None, {}))
            uk, en = self.quest_text(body)
            return raw_nums(uk) | raw_nums(en) | word_nums(en) | raw_nums([t.get('count') for t in d.get('tasks', [])]) | raw_nums([r.get('n') for r in d.get('rw', [])])
        if sch == 'file':
            try:
                t = open(os.path.join(MC, body), encoding='utf-8', errors='replace').read()
                return raw_nums(t) if len(t) < 60000 and not body.endswith('options.txt') else set()
            except Exception: return set()
        if sch == 'recipe':
            e = self.R.get(v)
            if not e: return set()
            return raw_nums(re.sub(r'[_/:]', ' ', v)) | self._recipe_ev(e)          # 6x_charged_… — кількість у ID рецепта
        if sch == 'kjs':
            f, _, frag = body.partition('#'); f = f.strip().removeprefix('kubejs/')
            if frag.startswith('L') and frag[1:].isdigit(): t = self.lines(f, int(frag[1:])); return raw_nums(t) | script_nums(t)
            if frag:
                hit = [x for kind, x in self.kat.get(f, []) if kind == 'recipes' and frag in (x.get('id'), x.get('key'))]
                if hit:
                    ln = hit[-1]['at'].rsplit(':', 1)[1]
                    t = self.lines(f, int(ln)) if ln.isdigit() else ''
                    return raw_nums(t) | script_nums(t) | raw_nums(re.sub(r'[_/:]', ' ', frag))
                return set()
            try:
                t = open(os.path.join(MC, 'kubejs', f), encoding='utf-8', errors='replace').read()
                return raw_nums(t) if len(t) < 60000 else set()
            except Exception: return set()
        if sch == 'lang': return raw_nums(self.lang().get(v, ''))
        if sch in ('item', 'tag'): return raw_nums(re.sub(r'[_/]', ' ', v))
        if sch == 'jarfile':
            jar, _, path = body.rpartition('!')
            hit = [j for j, names in self.jarnames().items() if path in names and (not jar or jar.lower() in j.lower())]
            t = self.zread(hit[0], path) if hit else None
            return raw_nums(t) if t and len(t) < 200000 else set()
        return set()

    def _recipe_ev(self, e):
        if e['src'] == 'kubejs':
            f, _, ln = e['p'].rpartition(':')
            t = self.lines(f, max(1, int(ln) - 24), 38) if ln.isdigit() else ''    # allthemods.json(id, json): сам JSON рецепта — вище рядка виклику
            return raw_nums(t) | script_nums(t)
        try:
            o = json.load(open(os.path.join(MC, 'kubejs', e['p']), encoding='utf-8')) if e['src'] == 'kubejs/data' else json.loads(self.zread(e['src'], e['p']) or 'null')
        except Exception: return {1.0}
        return raw_nums(o) | recipe_nums(o)

    def c_recipe(self, v):
        e = self.R.get(v)
        if not e: return 'fix', f'рецепта {v} немає в індексі (jar, дані, KubeJS)', set()
        ms = self.rmods(e) | ({v.split(':')[0]} - NOT_MODS)
        if e['a'] is False: return 'fix', f'рецепт {v} неактивний: {e.get("why", "")}', ms
        if e['a'] is None: return 'info', f'рецепт {v}: {e.get("why", "умова мода")} — перевірити в грі', ms
        return 'ok', f'рецепт {v} ({e["t"]}, {e["src"]})', ms

    def c_kjs(self, v):
        v, _, needle = v.partition('~')
        f, _, frag = v.partition('#'); f = f.strip().removeprefix('kubejs/')
        p = os.path.join(MC, 'kubejs', f)
        if not os.path.exists(p): return 'fix', f'файлу kubejs/{f} немає', set()
        ms = {x for x in re.findall(r'(?:mods|recipe|data|dynamic_data)/([a-z0-9_]+)/', f)} - NOT_MODS
        ms |= self.ktrue.get(f, set())
        if needle:
            if needle not in open(p, encoding='utf-8', errors='replace').read(): return 'fix', f'kubejs/{f}: тексту «{needle}» у файлі немає', ms
            ms |= set(re.findall(r'([a-z0-9_]+):[a-z0-9_/]+', needle)) - NOT_MODS
        if f.startswith(('data/', 'dynamic_data/')):                    # datapack KubeJS: рецепт діє, якщо є в індексі й активний; dynamic_data — лише якщо мод є
            m = re.match(r'dynamic_data/([^/]+)/(.+)$', f); dp = f'data/{m[1]}/{m[2]}' if m else f
            if m and m[1] != 'atm' and m[1] not in self.mods: return 'fix', f'kubejs/{f}: мода {m[1]} немає — read_dynamic_data.js файл не підключає', ms
            hit = [(k, e) for k, e in self.R.items() if e.get('p') == dp and e.get('src', '').startswith('kubejs/')]
            if hit:
                k, e = hit[0]; ms |= self.rmods(e)
                if e['a'] is False: return 'fix', f'kubejs/{f} → рецепт {k} неактивний: {e.get("why")}', ms
            return 'ok', f'kubejs/{f}' + (f' → рецепт {hit[0][0]}' if hit else ''), ms
        acts = self.kat.get(f, [])
        for kind, x in acts:
            if kind == 'recipes': ms |= set(x.get('mods', []))
            if kind == 'data' and x.get('io'): ms |= {i.lstrip('#').split(':')[0] for i in x['io']['in'] + x['io']['out']} - NOT_MODS
        if frag:
            if frag.startswith('L') and frag[1:].isdigit():
                hit = [x for kind, x in acts if x['at'] == f'{f}:{frag[1:]}']
                if not hit: return 'fix', f'kubejs/{f}#{frag}: на цьому рядку пісочниця нічого не зафіксувала (рядок зсунувся?)', ms
                bad = [x for x in hit if x.get('active') is False]
                if bad: return 'fix', f'kubejs/{f}#{frag}: рецепт неактивний — {bad[0].get("why")}', ms
                return 'ok', f'kubejs/{f}#{frag}', ms
            hit = [x for kind, x in acts if kind == 'recipes' and frag in (x.get('id'), x.get('key'))]
            if not hit: return 'fix', f'kubejs/{f}: рецепта {frag} у розборі немає (не виконується — умова isLoaded? — або id інший)', ms
            x = hit[-1]; ms |= set(x.get('mods', []))
            if not x['active']: return 'fix', f'kubejs/{f}#{frag}: рецепт неактивний — {x.get("why")}', ms
            return 'ok', f'kubejs/{f}#{frag} ({x["type"]})', ms
        live = [x for kind, x in acts if kind != 'recipes' or x.get('active')]
        if live: return 'ok', f'kubejs/{f}: дій {len(live)}', ms
        if acts: return 'fix', f'kubejs/{f}: усі рецепти файлу неактивні ({acts[0][1].get("why")})', ms
        fl = self.kfalse.get(f)
        if fl: return 'fix', f'kubejs/{f} неактивний: ' + ', '.join(f"isLoaded({c['mod']}) = false" for c in fl[:3]), ms
        return 'info', f'kubejs/{f}: у пісочниці без дій (клієнтський / службовий скрипт?)', ms

    def c_tag(self, v):
        reg = 'item'
        if v.split(':')[0] in ('block', 'fluid', 'item') and v.count(':') == 2: reg, v = v.split(':', 1)
        v = v.lstrip('#'); xs = set(self.T.get(reg, {}).get(v, [])) | self.ktags.get(f'{reg}:{v}', set())
        ms = ({v.split(':')[0]} | ({x.split(':')[0] for x in xs} if len(xs) <= 60 else set())) - NOT_MODS
        if v not in self.T.get(reg, {}) and f'{reg}:{v}' not in self.ktags: return 'fix', f'тега {reg} #{v} немає', ms
        if not xs: return 'fix', f'тег {reg} #{v} порожній у збірці', ms
        return 'ok', f'тег #{v}: {len(xs)}', ms

    def c_config(self, v):
        f, _, kv = v.partition('#'); key, eq, want = kv.partition('=')
        d = self.C.get(f)
        ms = set(re.findall(r'[a-z0-9_]+', os.path.basename(f).split('.')[0].replace('-', '_'))[:1]) | {re.split(r'[-_.]', os.path.basename(f))[0]} | self.mods_in(f)   # config/ironjetpacks/jetpacks/wood.json → ironjetpacks
        if d is None: return 'fix', f'конфігу {f} немає (або не розібрано)', ms
        if not key: return 'ok', f, ms
        ks = [k for k in d if k == key] or [k for k in d if k.endswith('.' + key)]
        if not ks: return 'fix', f'{f}: ключа {key} немає', ms
        if len(ks) > 1: return 'fix', f'{f}: ключ {key} неоднозначний ({", ".join(ks[:3])}) — дайте повний шлях', ms
        have = d[ks[0]]
        if not eq: return 'ok', f'{f}#{ks[0]} = {json.dumps(have, ensure_ascii=False)}', ms
        try: w = json.loads(want)
        except Exception: w = want
        same = (w == have) or (isinstance(w, (int, float)) and isinstance(have, (int, float)) and float(w) == float(have)) or str(w) == str(have)
        if not same: return 'fix', f'{f}#{ks[0]}: у конфігу {json.dumps(have, ensure_ascii=False)}, а в ref {want}', ms
        return 'ok', f'{f}#{ks[0]} = {json.dumps(have, ensure_ascii=False)}', ms

    def config_value(self, v):
        f, _, kv = v.partition('#'); key = kv.partition('=')[0]; d = self.C.get(f) or {}
        ks = [k for k in d if k == key] or [k for k in d if k.endswith('.' + key)]
        return d[ks[0]] if len(ks) == 1 else None

    def c_item(self, v):
        ns = v.split(':')[0]
        if ns not in self.mods and ns != 'minecraft': return 'fix', f'предмет {v}: мода {ns} немає', {ns}
        ms = ({ns} | self.mods_in(v.split(':', 1)[1])) - NOT_MODS
        if v not in self.items: return 'fix', f'предмета {v} немає в реєстрі', ms
        return 'ok', f'предмет {v}', ms

    def c_lang(self, v):
        ms = {t for t in v.split('.')[:2] if t in self.mods} - NOT_MODS
        if v not in self.lang(): return 'fix', f'рядка lang {v} немає в en_us', ms
        return 'ok', f'lang {v}: «{self.lang()[v][:60]}»', ms

    def c_jarfile(self, v):
        v, _, needle = v.partition('~')                                 # ~<текст> — файл має містити цей текст (напр. ID предмета): доказ вмісту, а не лише наявності
        jar, _, path = v.rpartition('!'); jars = self.jarnames()
        hit = [j for j, names in jars.items() if path in names and (not jar or jar.lower() in j.lower())]
        ms = (set(re.findall(r'(?:assets|data)/([a-z0-9_]+)/', path)) | self.mods_in(path)) - NOT_MODS
        if not hit: return 'fix', f'файлу {path} немає в jar' + (f' «{jar}»' if jar else ''), ms
        ms |= self.mods_in(hit[0].rsplit('.', 1)[0]) - NOT_MODS                     # моди, чиє ID — у назві jar
        if needle:
            txt = zipfile.ZipFile(os.path.join(MODS, hit[0])).read(path).decode('utf-8', 'replace')
            if needle not in txt: return 'fix', f'{hit[0]}!{path}: тексту «{needle}» у файлі немає', ms
            ms |= set(re.findall(r'([a-z0-9_]+):[a-z0-9_/]+', needle)) - NOT_MODS
            if path.endswith('.class'): ms |= set(re.findall(r'[a-z0-9_]+', needle)) & self.mods   # G6b: клас сумісності, що згадує ID іншого мода
            ms |= set(re.findall(r'\b([a-z0-9_]+)/api/', needle)) & self.mods          # клас сумісності, що викликає API іншого мода (journeymap/api/…) — доказ інтеграції з ним (G6)
        return 'ok', f'{hit[0]}!{path}' + (f' ∋ {needle}' if needle else ''), ms

    def c_file(self, v):
        path, _, needle = v.partition('~'); p = os.path.normpath(os.path.join(MC, path))
        if not p.startswith(os.path.normpath(MC)) or not os.path.isfile(p): return 'fix', f'файлу minecraft/{path} немає', set()
        if needle and needle not in open(p, encoding='utf-8', errors='replace').read(): return 'fix', f'minecraft/{path}: тексту «{needle}» немає', set()
        return 'ok', f'minecraft/{path}' + (f' ∋ {needle}' if needle else ''), set()

def refs_of(x):
    r = x.get('ref') if isinstance(x, dict) else None
    return [r] if isinstance(r, str) else list(r or [])
