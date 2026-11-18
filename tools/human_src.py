# K21 (§4 Б12): рядок «Джерело» (`src` синергій, ребер карти, кроків гілок) людською мовою — для сайту й моста.
# У content/ src пишуть з машинними id і шляхами («рецепт allthemodium:teleport_pad», «тег curios:feet», «KubeJS mods/x.js»,
# «клас io/redspace/…»): сито звіряє твердження за ref, а гравець бачить src. Тут — лише заміна за даними, без правил під
# моди: id → назва з гри (предмет, рідина, тег, біом, вимір, істота; рецепт — назва його виходу з бази рецептів; шаблон
# «…/*» чи невідомий id відомого простору імен — назва мода); шлях → «налаштування / скрипт збірки / дані / код мода <Мод>»
# (мод — з самого шляху). content/ і ref не змінюються. Що не впізнано — лишається як є і рахується (`residual`).
import os, re, sqlite3

ID = re.compile(r'#?\b([a-z0-9_.-]+):([a-z0-9_/.*-]+[a-z0-9_*])')
PATH = r'[a-z0-9_.*-]+(?:/[a-z0-9_.*-]+)+/?|[a-z0-9_.-]+\.(?:js|json|toml|cfg|txt)\b'
LATIN_PATHS = rf'(?:{PATH})(?:\s*(?:,|\+)\s*(?:{PATH}))*'
FILE_EXT = re.compile(r'\.(?:js|json|toml|cfg|txt)$')
# код мода: пакет / клас (з великими літерами), далі — ще класи через кому
CODE_PATHS = r'[A-Za-z0-9_.$-]+(?:/[A-Za-z0-9_.$-]+)+(?:\s*,\s*[A-Za-z0-9_.$-]+(?:/[A-Za-z0-9_.$-]+)*)*'
# «сусіди» замінного id у переліку: «…/fluxite, energite, uranite», «…_from_raw_materials_iron (3)» — скорочені id того самого виду
SIBLINGS = r'(?:\s*\(\d+\))?(?:,\s*(?:…|\.\.\.)?[a-z0-9_/]+(?:\s*\(\d+\))?(?![\w:]))*'


class Humanizer:
    def __init__(self, names, mods, recipes_db=None):
        self.n = names or {}
        self.mod_name = {m['id']: m.get('name') or m['id'] for m in mods or []}
        self.mod_name.setdefault('minecraft', 'Minecraft')
        self.residual = []
        self._out = {}
        if recipes_db and os.path.exists(recipes_db):
            db = sqlite3.connect(f'file:{recipes_db}?mode=ro', uri=True)
            rows = db.execute('SELECT recipe_id, item_id FROM recipe_outputs WHERE is_primary = 1').fetchall()
            for rid, iid in rows: self._out.setdefault(rid, set()).add(iid)
            for rid, fid in db.execute("SELECT recipe_id, fluid_id FROM recipe_fluids WHERE io_type = 'output'").fetchall():
                self._out.setdefault(rid, set()).add(fid)
            db.close()

    def _uk(self, table, key):
        v = (self.n.get(table) or {}).get(key)
        return (v[0] if isinstance(v, list) else v) or None if v else None

    def mod(self, ns):
        """Назва мода за простором імен; «c» — спільні групи NeoForge; невідомий — None."""
        if ns == 'c': return None
        return self.mod_name.get(ns) or self.mod_name.get(ns.replace('-', '_'))

    def mod_in(self, path):
        """Мод, названий будь-яким сегментом шляху (config/enderio/…, io/redspace/ironsjewelry/…, server_scripts/mods/powah/…)."""
        for seg in re.split(r'[/._-]', path):
            if seg in self.mod_name and seg not in ('minecraft', 'data', 'common', 'compat', 'mods', 'config'): return self.mod_name[seg]
        for seg in path.split('/'):
            base = re.sub(r'[-_](?:common|server|client|startup)$', '', FILE_EXT.sub('', seg))
            if base in self.mod_name: return self.mod_name[base]
        return None

    def name_of_id(self, tag, ns, path):
        """Назва для `ns:path` (з `#` — група); None — не впізнано."""
        full = f'{ns}:{path}'
        if '*' in path:   # шаблон: назва групи-префікса («c:ores/*» — руди), інакше мод
            pre = path.split('*')[0].rstrip('/_')
            uk = pre and (self._uk('tags', f'{ns}:{pre}') or self._uk('items', f'{ns}:{pre}'))
            return f'«{uk}»' if uk else self.mod(ns)
        for table in (('tags', 'fluid_tags') if tag else ('items', 'fluids', 'biomes', 'dims', 'entities', 'tags', 'fluid_tags')):
            uk = self._uk(table, full)
            if uk and table in ('tags', 'fluid_tags') and isinstance((self.n.get(table) or {}).get(full), list) and table == 'fluid_tags':
                uk = (self.n['fluid_tags'][full] or [None])[0]
            if uk: return f'«{uk}»'
        outs = self._out.get(full)
        if outs:
            names = sorted({self._uk('items', o) or self._uk('fluids', o) for o in outs} - {None})
            if names: return '«' + '» / «'.join(names[:2]) + '»'
        if tag: return f'група {self.mod(ns)}' if self.mod(ns) else 'спільна група предметів'
        return self.mod(ns)

    def text(self, s):
        if not isinstance(s, str) or not s: return s
        t = s
        # шляхи з їхнім словом-видом: «KubeJS a/b.js (x:y)», «клас io/…», «Jade jar: snownee/…», «config/x.toml: key»
        t = re.sub(rf'\bKubeJS:?\s+(?:{LATIN_PATHS})', lambda m: self._kind_paths(m.group(0), 'KubeJS'), t)
        t = re.sub(rf'\b(?:клас(?:и)?|пакет(?:и)?|[A-Za-z]+ jar:)\s+({CODE_PATHS})', lambda m: self._code(m.group(1)), t)
        t = re.sub(r'(рецепт[иі]?|теги?)\s+([a-z0-9_]+)\s+((?:[a-z0-9_/*.-]+/[a-z0-9_/*.-]*)(?:,\s*[a-z0-9_/*.-]+/[a-z0-9_/*.-]*)*)',
                   lambda m: f'{m.group(1)} {self.mod(m.group(2))}' if self.mod(m.group(2)) else m.group(0), t)
        t = re.sub(ID.pattern + SIBLINGS, lambda m: self._id(m), t)
        # мод словом перед шляхом («powah data_maps/fluid/x.json», «allthemodium: neoforge/…») — шлях його даних
        t = re.sub(rf'\b([a-z0-9_]+):?\s+({LATIN_PATHS})', lambda m: self._kind_paths(m.group(2), '', self.mod(m.group(1))) if self.mod(m.group(1)) else m.group(0), t)
        t = re.sub(rf'(?<![\w«/]){LATIN_PATHS}', lambda m: self._kind_paths(m.group(0), ''), t)
        t = re.sub(r'(?:налаштування|скрипт збірки|дані)[^;,()]*?:\s*([A-Za-z_][A-Za-z0-9_.]*)(?=$|[;,)])', lambda m: m.group(0)[: -len(m.group(1))].rstrip(': ') , t)   # ключ конфігу без пояснення
        t = re.sub(r'\(\s*\)', '', t)
        t = re.sub(r'(скрипт збірки(?: \(KubeJS\))?)(?:\s*(?:,|\+)\s*скрипт збірки(?: \(KubeJS\))?)+', r'\1', t)
        t = re.sub(r'\s{2,}', ' ', t).strip(' ;,')
        for x in re.findall(r'#?\b[a-z0-9_.-]+:[a-z0-9_/.*-]+|\b[a-z0-9_.-]+/[a-z0-9_/.*-]+', t): self.residual.append(x)
        return t

    def _id(self, m):
        head = ID.match(m.group(0)).group(0)
        name = self.name_of_id(head.startswith('#'), m.group(1), m.group(2))
        if not name: return m.group(0)
        return name + (' та ін.' if ',' in m.group(0)[len(head):] else '')

    def _code(self, paths):
        mod = self.mod_in(paths)
        return f'код мода {mod}' if mod else 'код мода'

    def _kind_paths(self, chunk, lead, owner=None):
        paths = re.findall(PATH, chunk)
        kinds = []
        for p in paths:
            mod = self.mod_in(p) or owner
            if p.startswith('config/') or p.endswith(('.toml', '.cfg')): k = f'налаштування {mod}' if mod else 'налаштування збірки'
            elif lead == 'KubeJS' or p.endswith('.js') or p.startswith(('kubejs/', 'server_scripts/', 'startup_scripts/', 'client_scripts/', 'mods/', 'modpack/')):
                k = 'скрипт збірки (KubeJS)'
            elif p.startswith(('data/', 'dynamic_data/')) or p.endswith('.json'): k = f'дані {mod}' if mod else 'дані збірки'
            elif p == 'options.txt': k = 'налаштування гри'
            else: k = f'дані {mod}' if mod else None
            if k and k not in kinds: kinds.append(k)
        return ', '.join(kinds) if kinds else chunk
