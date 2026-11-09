# tools/build_recipes_db.py — ⚡ Створення SQLite-графу рецептів ATM11 (сесія R1).
# Запуск: py -I tools/build_recipes_db.py
# Читає перевірені індекси (raw/recipes_index.json, raw/kubejs_index.json, raw/tags_index.json, raw/registry_index.json),
# оригінальні JSON-файли з JAR-пакетів та KubeJS, звіряє ситом із логами гри, і будує:
#   • atm11_guide/raw/recipes.db
#   • копію в ATM11-Companion/data/recipes.db
import os, sys, json, sqlite3, zipfile, io, re, csv, time, shutil, collections

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import MC, MODS, RAW, UA, CLIENT_JARS, jload
from extract_recipes import neoforge_jar

HERE = os.path.dirname(os.path.abspath(__file__))
GUIDE_ROOT = os.path.dirname(HERE)
COMPANION_ROOT = os.path.abspath(os.path.join(GUIDE_ROOT, '..', 'ATM11-Companion'))
DB_OUT_RAW = os.path.join(RAW, 'recipes.db')
DB_OUT_COMPANION = os.path.join(COMPANION_ROOT, 'data', 'recipes.db')

CJ = next((p for p in CLIENT_JARS() if os.path.exists(p)), None)
NF = neoforge_jar()

def get_zip_or_dir(src, mod_jars):
    """Повертає відкритий ZipFile або None для вказаного джерела."""
    if src == 'minecraft' and CJ:
        return zipfile.ZipFile(CJ)
    if src == 'neoforge' and NF:
        return zipfile.ZipFile(NF)
    if src and src.endswith('.jar'):
        p = os.path.join(MODS, src)
        if os.path.exists(p):
            return zipfile.ZipFile(p)
    if src and '!' in src:
        out_j, in_j = src.split('!', 1)
        p = os.path.join(MODS, out_j)
        if os.path.exists(p):
            try:
                with zipfile.ZipFile(p) as z:
                    for n in z.namelist():
                        if n.endswith(in_j):
                            return zipfile.ZipFile(io.BytesIO(z.read(n)))
            except Exception:
                pass
    return None

def categorize(t):
    """Визначає категорію рецепта та прапорець in_world."""
    if t in ('minecraft:crafting_shaped', 'minecraft:crafting_shapeless'):
        return 'crafting_table', 0
    if t in ('minecraft:smelting', 'minecraft:blasting', 'minecraft:smoking'):
        return 'furnace', 0
    if t == 'minecraft:stonecutting':
        return 'stonecutter', 0
    if t in ('minecraft:smithing_transform', 'minecraft:smithing_trim'):
        return 'smithing_table', 0
    if t == 'minecraft:campfire_cooking':
        return 'campfire', 1
    if 'ritual' in t or 'awakening' in t or 'infusion' in t or 'altar' in t:
        return 'in_world_ritual', 1
    if 'transform' in t or 'transmutation' in t or 'in_world' in t or 'explosion' in t or 'goo' in t:
        return 'in_world_action', 1
    if 'crushing' in t or 'pulveriz' in t or 'mill' in t or 'centrifuge' in t or 'squeezer' in t or 'sawmill' in t:
        return 'machine_processing', 0
    if 'energiz' in t or 'inscriber' in t or 'assembler' in t or 'forge' in t or 'alloy' in t or 'collision' in t:
        return 'machine_processing', 0
    if 'theurgy' in t or 'alchem' in t or 'ferment' in t or 'brew' in t:
        return 'alchemical', 0
    if 'melt' in t or 'cast' in t:
        return 'foundry_casting', 0
    if 'crop' in t or 'tree' in t or 'beehive' in t or 'hive' in t:
        return 'farming', 0
    return 'machine_processing', 0

def parse_ingredient_entry(ing):
    """Розбирає запис інгредієнта -> list of (item_or_tag, is_tag, count)."""
    if not ing:
        return []
    if isinstance(ing, str):
        count = 1.0
        m = re.match(r'^(\d+)x\s+(.+)$', ing.strip())
        if m:
            count, ing = float(m.group(1)), m.group(2)
        ing = re.sub(r'\[.*$', '', ing).strip()
        is_tag = ing.startswith('#')
        return [(ing, 1 if is_tag else 0, count)]
    if isinstance(ing, dict):
        count = float(ing.get('count', 1.0))
        if 'item' in ing:
            return [(str(ing['item']), 0, count)]
        if 'tag' in ing:
            t = str(ing['tag'])
            if not t.startswith('#'):
                t = '#' + t
            return [(t, 1, count)]
        if 'id' in ing:
            return [(str(ing['id']), 0, count)]
        if 'ingredient' in ing:
            return parse_ingredient_entry(ing['ingredient'])
    if isinstance(ing, list):
        res = []
        for x in ing:
            res.extend(parse_ingredient_entry(x))
        return res
    return []

def parse_output_entry(out):
    """Розбирає результат рецепта -> list of (item_id, count, chance, is_primary)."""
    if not out:
        return []
    if isinstance(out, str):
        count = 1.0
        m = re.match(r'^(\d+)x\s+(.+)$', out.strip())
        if m:
            count, out = float(m.group(1)), m.group(2)
        out = re.sub(r'\[.*$', '', out).strip()
        return [(out, count, 1.0, 1)]
    if isinstance(out, dict):
        count = float(out.get('count', 1.0))
        chance = float(out.get('chance', 1.0))
        item_id = out.get('id') or out.get('item') or ''
        if not item_id and 'result' in out:
            return parse_output_entry(out['result'])
        item_id = re.sub(r'\[.*$', '', str(item_id)).strip()
        if item_id:
            return [(item_id, count, chance, 1)]
    if isinstance(out, list):
        res = []
        for i, x in enumerate(out):
            sub = parse_output_entry(x)
            for item_id, count, chance, _ in sub:
                res.append((item_id, count, chance, 1 if i == 0 else 0))
        return res
    return []

def parse_fluids(d):
    """Розбирає рідини рецепта -> list of (fluid_id, amount_mb, io_type)."""
    fluids = []
    for k in ('fluidInput', 'fluid_input', 'fluid'):
        if k in d:
            val = d[k]
            if isinstance(val, dict):
                fid = val.get('id') or val.get('fluid')
                amt = val.get('amount') or 1000
                if fid:
                    fluids.append((str(fid), int(amt), 'input'))
            elif isinstance(val, str):
                fluids.append((val, 1000, 'input'))
    for k in ('fluidOutputs', 'fluid_outputs', 'fluidResults', 'fluid_results'):
        if k in d and isinstance(d[k], list):
            for val in d[k]:
                if isinstance(val, dict):
                    fid = val.get('id') or val.get('fluid')
                    amt = val.get('amount') or 1000
                    if fid:
                        fluids.append((str(fid), int(amt), 'output'))
    if 'result' in d and isinstance(d['result'], dict):
        r = d['result']
        if 'amount' in r and ('id' in r or 'fluid' in r):
            fid = r.get('id') or r.get('fluid')
            fluids.append((str(fid), int(r['amount']), 'output'))
    return fluids

def init_schema(db):
    """Створює схему бази даних SQLite."""
    cur = db.cursor()
    cur.execute("PRAGMA journal_mode = MEMORY;")
    cur.execute("PRAGMA synchronous = OFF;")
    cur.execute("PRAGMA foreign_keys = OFF;")

    cur.executescript("""
    DROP TABLE IF EXISTS recipes;
    DROP TABLE IF EXISTS recipe_ingredients;
    DROP TABLE IF EXISTS recipe_outputs;
    DROP TABLE IF EXISTS recipe_fluids;
    DROP TABLE IF EXISTS item_tags;
    DROP TABLE IF EXISTS items_meta;
    DROP TABLE IF EXISTS recipes_fts;

    CREATE TABLE recipes (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        mod_id TEXT NOT NULL,
        duration_ticks INTEGER DEFAULT 0,
        energy_fe INTEGER DEFAULT 0,
        in_world INTEGER DEFAULT 0,
        structure_id TEXT,
        sacrifice_entity TEXT,
        active INTEGER NOT NULL DEFAULT 1,
        why_inactive TEXT,
        source_file TEXT,
        extra_json TEXT
    );

    CREATE TABLE recipe_ingredients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id TEXT NOT NULL,
        item_or_tag TEXT NOT NULL,
        is_tag INTEGER NOT NULL DEFAULT 0,
        count REAL NOT NULL DEFAULT 1.0,
        role TEXT NOT NULL DEFAULT 'input',
        slot_idx INTEGER
    );

    CREATE TABLE recipe_outputs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id TEXT NOT NULL,
        item_id TEXT NOT NULL,
        count REAL NOT NULL DEFAULT 1.0,
        chance REAL NOT NULL DEFAULT 1.0,
        is_primary INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE recipe_fluids (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id TEXT NOT NULL,
        fluid_id TEXT NOT NULL,
        amount_mb INTEGER NOT NULL,
        io_type TEXT NOT NULL
    );

    CREATE TABLE item_tags (
        tag_id TEXT NOT NULL,
        item_id TEXT NOT NULL,
        PRIMARY KEY (tag_id, item_id)
    );

    CREATE TABLE items_meta (
        id TEXT PRIMARY KEY,
        mod_id TEXT NOT NULL,
        name_en TEXT NOT NULL,
        name_uk TEXT,
        icon_path TEXT
    );

    CREATE VIRTUAL TABLE recipes_fts USING fts5(
        recipe_id UNINDEXED,
        item_name_uk,
        item_name_en,
        mod_id,
        ingredients_text
    );
    """)
    db.commit()

def create_indices(db):
    """Створює швидкі індекси після вставки даних."""
    cur = db.cursor()
    cur.executescript("""
    CREATE INDEX idx_rec_mod ON recipes(mod_id);
    CREATE INDEX idx_rec_type ON recipes(type);
    CREATE INDEX idx_rec_cat ON recipes(category);
    CREATE INDEX idx_rec_active ON recipes(active);

    CREATE INDEX idx_ing_item ON recipe_ingredients(item_or_tag);
    CREATE INDEX idx_ing_rec ON recipe_ingredients(recipe_id);

    CREATE INDEX idx_out_item ON recipe_outputs(item_id);
    CREATE INDEX idx_out_rec ON recipe_outputs(recipe_id);

    CREATE INDEX idx_tag_id ON item_tags(tag_id);
    CREATE INDEX idx_tag_item ON item_tags(item_id);

    CREATE INDEX idx_fluid_rec ON recipe_fluids(recipe_id);
    """)
    db.commit()

def load_translations():
    """Завантажує назви предметів з effective.tsv."""
    tsv_path = os.path.join(UA, 'review', 'effective.tsv')
    meta = {}
    if not os.path.exists(tsv_path):
        return meta
    with open(tsv_path, encoding='utf-8') as f:
        reader = csv.reader(f, delimiter='\t', quoting=csv.QUOTE_NONE)
        for row in reader:
            if len(row) >= 5:
                k = row[0]
                for pre in ('item.', 'block.', 'fluid.', 'entity.'):
                    if k.startswith(pre):
                        rest = k[len(pre):]
                        if '.' in rest:
                            mod, path = rest.split('.', 1)
                            item_id = f'{mod}:{path}'
                            if item_id not in meta:
                                meta[item_id] = (mod, row[3], row[4])
                        break
    return meta

def main():
    t0 = time.time()
    print("⚡ [1/5] Ініціалізація та завантаження індексів 'Сита'...")
    recs_idx = jload(os.path.join(RAW, 'recipes_index.json'), {}) or {}
    kjs_idx = jload(os.path.join(RAW, 'kubejs_index.json'), {}) or {}
    tags_idx = jload(os.path.join(RAW, 'tags_index.json'), {}) or {}
    reg_idx = jload(os.path.join(RAW, 'registry_index.json'), {}) or {}

    os.makedirs(os.path.dirname(DB_OUT_RAW), exist_ok=True)
    if os.path.exists(DB_OUT_RAW):
        try: os.remove(DB_OUT_RAW)
        except Exception: pass

    db = sqlite3.connect(DB_OUT_RAW)
    init_schema(db)

    print(f"📦 Завантажено {len(recs_idx)} рецептів з індексу сита.")

    # Групуємо рецепти за джерелом (src) для читання JSON
    by_src = collections.defaultdict(list)
    for rid, r in recs_idx.items():
        by_src[r.get('src')].append((rid, r))

    rec_rows = []
    ing_rows = []
    out_rows = []
    fluid_rows = []

    print("🔍 [2/5] Читання та парсинг рецептів (JARs + KubeJS Data)...")
    parsed_count = 0
    mod_jars = set(os.listdir(MODS)) if os.path.isdir(MODS) else set()

    for src, items in by_src.items():
        z = None
        kd_dir = None
        if src == 'kubejs/data':
            kd_dir = os.path.join(MC, 'kubejs')
        else:
            try:
                z = get_zip_or_dir(src, mod_jars)
            except Exception:
                z = None

        namelist = set(z.namelist()) if z else set()

        for rid, meta in items:
            p = meta.get('p')
            raw_d = None
            if z and p and p in namelist:
                try:
                    raw_d = json.loads(z.read(p).decode('utf-8-sig'))
                except Exception:
                    pass
            elif kd_dir and p:
                fp = os.path.join(kd_dir, p)
                if os.path.exists(fp):
                    try:
                        raw_d = json.load(open(fp, encoding='utf-8-sig'))
                    except Exception:
                        pass

            # Базові поля з індексу сита
            rtype = meta.get('t') or (raw_d.get('type') if raw_d else '') or 'unknown'
            mod_id = rtype.split(':')[0] if ':' in rtype else (rid.split(':')[0] if ':' in rid else 'unknown')
            category, in_world = categorize(rtype)
            active = 1 if meta.get('a') is True else 0
            why_inactive = meta.get('why') or ''

            dur_ticks = 0
            energy_fe = 0
            structure_id = None
            sacrifice_entity = None
            extra_data = {}

            parsed_ings = []
            parsed_outs = []
            parsed_fls = []

            if raw_d and isinstance(raw_d, dict):
                # 1. Minecraft Shaped
                if rtype == 'minecraft:crafting_shaped':
                    pat = raw_d.get('pattern', [])
                    key_map = raw_d.get('key', {})
                    if isinstance(pat, list) and isinstance(key_map, dict):
                        # Рахуємо кожен слот
                        for r_idx, row in enumerate(pat):
                            for c_idx, ch in enumerate(row):
                                slot = r_idx * 3 + c_idx
                                if ch != ' ' and ch in key_map:
                                    parsed = parse_ingredient_entry(key_map[ch])
                                    if parsed:
                                        item_tag, is_tag, _ = parsed[0]
                                        parsed_ings.append((item_tag, is_tag, 1.0, 'input', slot))
                    parsed_outs = parse_output_entry(raw_d.get('result'))

                # 2. Minecraft Shapeless
                elif rtype == 'minecraft:crafting_shapeless':
                    ings = raw_d.get('ingredients', [])
                    for slot, ing in enumerate(ings):
                        parsed = parse_ingredient_entry(ing)
                        if parsed:
                            item_tag, is_tag, cnt = parsed[0]
                            parsed_ings.append((item_tag, is_tag, cnt, 'input', slot))
                    parsed_outs = parse_output_entry(raw_d.get('result'))

                # 3. Occultism Ritual
                elif rtype == 'occultism:ritual':
                    structure_id = raw_d.get('pentacle_id')
                    dur_ticks = int(raw_d.get('duration', 120)) * 20
                    sac = raw_d.get('entity_to_sacrifice')
                    if isinstance(sac, dict):
                        sacrifice_entity = sac.get('tag') or sac.get('entity')
                    elif isinstance(sac, str):
                        sacrifice_entity = sac

                    act_item = raw_d.get('activation_item')
                    if act_item:
                        for it, ist, c in parse_ingredient_entry(act_item):
                            parsed_ings.append((it, ist, c, 'catalyst', None))

                    for ing in raw_d.get('ingredients', []):
                        for it, ist, c in parse_ingredient_entry(ing):
                            parsed_ings.append((it, ist, c, 'pedestal', None))

                    parsed_outs = parse_output_entry(raw_d.get('result'))
                    if 'entity_to_summon' in raw_d:
                        extra_data['entity_to_summon'] = raw_d['entity_to_summon']

                # 4. Powah Energizing
                elif rtype == 'powah:energizing':
                    energy_fe = int(raw_d.get('energy', 0))
                    for slot, ing in enumerate(raw_d.get('ingredients', [])):
                        for it, ist, c in parse_ingredient_entry(ing):
                            parsed_ings.append((it, ist, c, 'input', slot))
                    parsed_outs = parse_output_entry(raw_d.get('result'))

                # 5. AE2 Inscriber
                elif rtype == 'ae2:inscriber':
                    ings = raw_d.get('ingredients', {})
                    if isinstance(ings, dict):
                        for pos in ('top', 'middle', 'bottom'):
                            if pos in ings:
                                for it, ist, c in parse_ingredient_entry(ings[pos]):
                                    parsed_ings.append((it, ist, c, pos, None))
                    parsed_outs = parse_output_entry(raw_d.get('result'))
                    extra_data['mode'] = raw_d.get('mode', 'press')

                # 6. Mystical Agriculture Awakening / Infusion
                elif 'awakening' in rtype or 'infusion' in rtype:
                    if 'input' in raw_d:
                        for it, ist, c in parse_ingredient_entry(raw_d['input']):
                            parsed_ings.append((it, ist, c, 'center_altar', None))
                    for ing in raw_d.get('ingredients', []):
                        for it, ist, c in parse_ingredient_entry(ing):
                            parsed_ings.append((it, ist, c, 'pedestal', None))
                    for ess in raw_d.get('essences', []):
                        for it, ist, c in parse_ingredient_entry(ess):
                            parsed_ings.append((it, ist, c, 'essence_vessel', None))
                    parsed_outs = parse_output_entry(raw_d.get('result'))

                # 7. Oritech Machines
                elif rtype.startswith('oritech:'):
                    dur_ticks = int(raw_d.get('time', 100))
                    for slot, ing in enumerate(raw_d.get('itemInputs', [])):
                        for it, ist, c in parse_ingredient_entry(ing):
                            parsed_ings.append((it, ist, c, 'input', slot))
                    for res in raw_d.get('itemResults', []):
                        parsed_outs.extend(parse_output_entry(res))
                    parsed_fls = parse_fluids(raw_d)

                # 8. Ender IO SAG Milling / Alloy Smelting
                elif rtype.startswith('enderio:'):
                    energy_fe = int(raw_d.get('energy', 0))
                    dur_ticks = int(raw_d.get('time', 0))
                    inp = raw_d.get('input') or raw_d.get('inputs')
                    if inp:
                        for it, ist, c in parse_ingredient_entry(inp):
                            parsed_ings.append((it, ist, c, 'input', None))
                    for out in raw_d.get('outputs', []):
                        parsed_outs.extend(parse_output_entry(out))

                # 9. Generic Fallback
                else:
                    dur_ticks = int(raw_d.get('cookingtime') or raw_d.get('time') or raw_d.get('duration') or 0)
                    energy_fe = int(raw_d.get('energy') or raw_d.get('energy_fe') or 0)
                    for k in ('ingredient', 'ingredients', 'input', 'inputs', 'itemInputs'):
                        if k in raw_d:
                            val = raw_d[k]
                            vals = val if isinstance(val, list) else [val]
                            for slot, ing in enumerate(vals):
                                for it, ist, c in parse_ingredient_entry(ing):
                                    parsed_ings.append((it, ist, c, 'input', slot))
                            break
                    for k in ('result', 'results', 'output', 'outputs', 'itemResults'):
                        if k in raw_d:
                            parsed_outs.extend(parse_output_entry(raw_d[k]))
                            break
                    parsed_fls = parse_fluids(raw_d)

            # Якщо raw_d не було або парсинг порожній — беремо з індексу сита
            if not parsed_ings and meta.get('in'):
                for slot, ing in enumerate(meta['in']):
                    is_t = 1 if ing.startswith('#') else 0
                    parsed_ings.append((ing, is_t, 1.0, 'input', slot))

            if not parsed_outs and meta.get('out'):
                for i, out_id in enumerate(meta['out']):
                    parsed_outs.append((out_id, 1.0, 1.0, 1 if i == 0 else 0))

            extra_json_str = json.dumps(extra_data) if extra_data else None

            rec_rows.append((rid, rtype, category, mod_id, dur_ticks, energy_fe, in_world, structure_id, sacrifice_entity, active, why_inactive, src or '', extra_json_str))

            for it_tag, is_tag, cnt, role, slot in parsed_ings:
                ing_rows.append((rid, it_tag, is_tag, cnt, role, slot))

            for out_id, cnt, chance, is_prim in parsed_outs:
                out_rows.append((rid, out_id, cnt, chance, is_prim))

            for fid, amt, io_type in parsed_fls:
                fluid_rows.append((rid, fid, amt, io_type))

            parsed_count += 1

        if z:
            try: z.close()
            except Exception: pass

    # Додаємо рецепти, специфічні для KubeJS (що додалися скриптами)
    kjs_recipes = kjs_idx.get('recipes', [])
    print(f"🔧 Додавання {len(kjs_recipes)} рецептів KubeJS...")
    existing_rids = {r[0] for r in rec_rows}

    for kr in kjs_recipes:
        rid = kr.get('key') or kr.get('id')
        if not rid or rid in existing_rids:
            continue
        rtype = kr.get('type') or 'kubejs:custom'
        mod_id = rtype.split(':')[0] if ':' in rtype else 'kubejs'
        cat, in_world = categorize(rtype)
        act = 1 if kr.get('active') else 0
        why = kr.get('why') or ''
        rec_rows.append((rid, rtype, cat, mod_id, 0, 0, in_world, None, None, act, why, kr.get('at', 'kubejs'), None))

        for slot, ing in enumerate(kr.get('in', [])):
            is_t = 1 if ing.startswith('#') else 0
            ing_rows.append((rid, ing, is_t, 1.0, 'input', slot))

        for i, out_id in enumerate(kr.get('out', [])):
            out_rows.append((rid, out_id, 1.0, 1.0, 1 if i == 0 else 0))

    print(f"💾 [3/5] Запис у базу: {len(rec_rows)} рецептів, {len(ing_rows)} інгредієнтів, {len(out_rows)} виходів, {len(fluid_rows)} рідин...")
    cur = db.cursor()
    cur.executemany("INSERT INTO recipes VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", rec_rows)
    cur.executemany("INSERT INTO recipe_ingredients (recipe_id, item_or_tag, is_tag, count, role, slot_idx) VALUES (?,?,?,?,?,?)", ing_rows)
    cur.executemany("INSERT INTO recipe_outputs (recipe_id, item_id, count, chance, is_primary) VALUES (?,?,?,?,?)", out_rows)
    cur.executemany("INSERT INTO recipe_fluids (recipe_id, fluid_id, amount_mb, io_type) VALUES (?,?,?,?)", fluid_rows)
    db.commit()

    # Запис тегів (item_tags)
    print("🏷️  [4/5] Запис тегів предметів...")
    item_tags_data = tags_idx.get('item', {})
    tag_rows = []
    for tag_name, items in item_tags_data.items():
        clean_tag = tag_name.lstrip('#')
        for item_id in items:
            tag_rows.append((clean_tag, item_id))
    cur.executemany("INSERT OR IGNORE INTO item_tags VALUES (?,?)", tag_rows)
    db.commit()

    # Запис метаданих предметів (items_meta) та повнотекстовий пошук (recipes_fts)
    print("🇺🇦 [5/5] Запис метаданих та індексація FTS5...")
    tr_meta = load_translations()
    reg_items = set(reg_idx.get('items', []))
    all_item_ids = reg_items | set(tr_meta.keys())
    item_rows = []
    for iid in sorted(all_item_ids):
        mod = iid.split(':')[0] if ':' in iid else 'minecraft'
        name_en, name_uk = tr_meta.get(iid, (mod, iid.split(':')[-1].replace('_', ' ').title(), None))[1:]
        item_rows.append((iid, mod, name_en, name_uk, None))

    cur.executemany("INSERT OR IGNORE INTO items_meta VALUES (?,?,?,?,?)", item_rows)
    db.commit()

    # Заповнення FTS5 таблиці
    print("🔍 Створення FTS5 індексу...")
    cur.execute("""
    INSERT INTO recipes_fts (recipe_id, item_name_uk, item_name_en, mod_id, ingredients_text)
    SELECT 
        r.id,
        COALESCE(m.name_uk, ''),
        COALESCE(m.name_en, ''),
        r.mod_id,
        GROUP_CONCAT(COALESCE(mi.name_uk, ri.item_or_tag), ' ')
    FROM recipes r
    JOIN recipe_outputs ro ON ro.recipe_id = r.id AND ro.is_primary = 1
    LEFT JOIN items_meta m ON m.id = ro.item_id
    LEFT JOIN recipe_ingredients ri ON ri.recipe_id = r.id
    LEFT JOIN items_meta mi ON mi.id = ri.item_or_tag
    WHERE r.active = 1
    GROUP BY r.id, m.name_uk, m.name_en, r.mod_id;
    """)
    db.commit()

    print("⚡ Створення індексів швидкодії...")
    create_indices(db)
    db.close()

    # Копіюємо в Companion/data/recipes.db
    os.makedirs(os.path.dirname(DB_OUT_COMPANION), exist_ok=True)
    shutil.copyfile(DB_OUT_RAW, DB_OUT_COMPANION)

    raw_size_mb = os.path.getsize(DB_OUT_RAW) / (1024 * 1024)
    print(f"✅ Базу успішно створено за {time.time()-t0:.2f}с!")
    print(f"📊 Розмір: {raw_size_mb:.2f} МБ")
    print(f"📁 Шлях raw: {DB_OUT_RAW}")
    print(f"📁 Шлях companion: {DB_OUT_COMPANION}")

if __name__ == '__main__':
    main()
