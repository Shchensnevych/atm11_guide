# Прогрес гравця із сейву Minecraft → docs/data/progress.json + docs/data/progress/<slug>.json + progress/index.json.
# Запуск з atm11_guide: py -I tools/extract_progress.py [--world <назва>]
import os, sys, glob, gzip, struct, json, re, datetime, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import MC, QUESTS, DATA, json5, jload, jsave

SAVES = os.path.join(MC, 'saves')
PROG_DIR = os.path.join(DATA, 'progress')

TRANSLIT = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd', 'е': 'e', 'є': 'ye',
    'ж': 'zh', 'з': 'z', 'и': 'y', 'і': 'i', 'ї': 'yi', 'й': 'y', 'к': 'k', 'л': 'l',
    'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '',
    'ю': 'yu', 'я': 'ya', 'ы': 'y', 'э': 'e', 'ъ': '', 'ё': 'yo', "'": '', '’': '', '`': ''
}

GAME_MODES = {
    0: ('survival', 'Виживання'),
    1: ('creative', 'Творчість'),
    2: ('adventure', 'Пригода'),
    3: ('spectator', 'Спостерігач'),
}

def slugify(s):
    out = []
    for ch in (s or '').lower():
        if ch in TRANSLIT:
            out.append(TRANSLIT[ch])
        elif 'a' <= ch <= 'z' or '0' <= ch <= '9':
            out.append(ch)
        else:
            out.append('_')
    res = re.sub(r'_+', '_', ''.join(out)).strip('_')
    return res or 'world'

def read_nbt(path):
    """Читає стиснутий (gzip) або звичайний файл NBT без сторонніх бібліотек."""
    if not os.path.exists(path):
        return {}
    raw = open(path, 'rb').read()
    data = gzip.decompress(raw) if raw[:2] == b'\x1f\x8b' else raw
    pos = 0
    def u8():
        nonlocal pos; v = data[pos]; pos += 1; return v
    def i8():
        nonlocal pos; v, = struct.unpack_from('>b', data, pos); pos += 1; return v
    def i16():
        nonlocal pos; v, = struct.unpack_from('>h', data, pos); pos += 2; return v
    def u16():
        nonlocal pos; v, = struct.unpack_from('>H', data, pos); pos += 2; return v
    def i32():
        nonlocal pos; v, = struct.unpack_from('>i', data, pos); pos += 4; return v
    def i64():
        nonlocal pos; v, = struct.unpack_from('>q', data, pos); pos += 8; return v
    def f32():
        nonlocal pos; v, = struct.unpack_from('>f', data, pos); pos += 4; return v
    def f64():
        nonlocal pos; v, = struct.unpack_from('>d', data, pos); pos += 8; return v
    def string():
        nonlocal pos; n = u16(); s = data[pos:pos + n].decode('utf-8', errors='replace'); pos += n; return s
    def payload(tag):
        nonlocal pos
        if tag == 1: return i8()
        if tag == 2: return i16()
        if tag == 3: return i32()
        if tag == 4: return i64()
        if tag == 5: return f32()
        if tag == 6: return f64()
        if tag == 7:
            n = i32(); pos += n; return None
        if tag == 8: return string()
        if tag == 9:
            et = u8(); n = i32()
            return [payload(et) for _ in range(max(0, n))]
        if tag == 10:
            out = {}
            while pos < len(data):
                t = u8()
                if t == 0: break
                k = string()
                out[k] = payload(t)
            return out
        if tag == 11:
            n = i32(); v = list(struct.unpack_from(f'>{n}i', data, pos)); pos += 4 * n; return v
        if tag == 12:
            n = i32(); v = list(struct.unpack_from(f'>{n}q', data, pos)); pos += 8 * n; return v
        raise ValueError(f'Невідомий тег NBT {tag} на позиції {pos}')
    if not data or u8() != 10:
        return {}
    _ = string()
    return payload(10)

def l5(p):
    if not os.path.exists(p): return {}
    t = open(p, encoding='utf-8-sig').read()
    try:
        t1 = re.sub(r'(^|[{,])(\s*)([A-Za-z0-9_]+)\s*:', lambda m: m.group(1) + m.group(2) + '"' + m.group(3) + '":', t, flags=re.M)
        return json.loads(re.sub(r',(\s*[}\]])', r'\1', t1))
    except Exception:
        return json5.loads(t)

def to_hex_id(dec_str):
    val = int(dec_str)
    if val < 0:
        val += (1 << 64)
    return f'{val:016X}'

def fmt_ts(ts):
    if not ts: return ''
    return datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M')

def load_quest_catalog():
    """Каталог квестів і завдань з docs/data/chapters.json, docs/data/quests/*.json та config/ftbquests."""
    chs = jload(os.path.join(DATA, 'chapters.json'), {'chapters': []}).get('chapters', [])
    ch_meta = {c['file']: {'title': c.get('title', c['file']), 'hidden': bool(c.get('hidden')), 'quests': c.get('quests', 0)} for c in chs}
    q_meta = {}
    for f in sorted(glob.glob(os.path.join(DATA, 'quests', '*.json'))):
        d = jload(f, {})
        fn = d.get('chapter') or os.path.splitext(os.path.basename(f))[0]
        hid = ch_meta.get(fn, {}).get('hidden', False)
        for q in d.get('quests', []):
            q_meta[q['id']] = {'chapter': fn, 'title': q.get('title', ''), 'hidden': hid, 'optional': bool(q.get('optional'))}
    t_meta = {}
    for f in sorted(glob.glob(os.path.join(QUESTS, 'chapters', '*.json5'))):
        c = l5(f)
        fn = c.get('filename') or os.path.splitext(os.path.basename(f))[0]
        for q in c.get('quests', []):
            qid = q.get('id')
            for t in q.get('tasks', []):
                if t.get('id'):
                    t_meta[t['id']] = {'chapter': fn, 'quest': qid}
    return ch_meta, q_meta, t_meta

def collect_nbt_items(obj, counts):
    """Рекурсивно збирає предмети (id + count) зі структур інвентарю NBT (Inventory, EnderItems, Curios, Toolbelt, контейнери)."""
    if isinstance(obj, dict):
        iid = obj.get('id')
        cnt = obj.get('count', obj.get('Count', 1))
        if isinstance(iid, str) and ':' in iid and iid != 'minecraft:air' and isinstance(cnt, int) and cnt > 0:
            if any(k in obj for k in ('Slot', 'count', 'Count', 'components')):
                counts[iid] += cnt
        for k, v in obj.items():
            if k in ('Inventory', 'EnderItems', 'Items', 'stacks', 'Curios', 'Stacks', 'Cosmetics', 'equipment', 'components', 'minecraft:container', 'neoforge:attachments', 'curios:inventory', 'toolbelt:belt'):
                collect_nbt_items(v, counts)
    elif isinstance(obj, list):
        for x in obj:
            collect_nbt_items(x, counts)

def find_player_uuid(wdir):
    """Знаходить UUID активного гравця у світі за найновішим файлом даних."""
    cands = []
    for sub, ext in (('players/data', '.dat'), ('playerdata', '.dat'), ('ftbquests', '.json5'), ('players/advancements', '.json'), ('players/stats', '.json')):
        p = os.path.join(wdir, sub)
        if not os.path.isdir(p): continue
        for f in os.listdir(p):
            if f.endswith(ext) and not f.endswith('_old'):
                u = f[:-len(ext)]
                if re.match(r'^[0-9a-fA-F-]{32,36}$', u):
                    cands.append((os.path.getmtime(os.path.join(p, f)), u))
    if not cands:
        return None
    cands.sort(reverse=True)
    return cands[0][1]

def extract_world(wdir, slug, ch_meta, q_meta, t_meta, now_str):
    folder = os.path.basename(wdir)
    ld_path = os.path.join(wdir, 'level.dat')
    ld = read_nbt(ld_path).get('Data', {})
    world_name = ld.get('LevelName') or folder
    gt = ld.get('GameType', 0)
    if ld.get('hardcore') == 1:
        mode, mode_uk = 'hardcore', 'Хардкор'
    else:
        mode, mode_uk = GAME_MODES.get(gt, ('survival', 'Виживання'))
    uuid = find_player_uuid(wdir)
    mtimes = [os.path.getmtime(ld_path)] if os.path.exists(ld_path) else []
    if ld.get('LastPlayed'):
        mtimes.append(ld['LastPlayed'] / 1000.0)

    # 1. Дані гравця (.dat NBT)
    inv_counts = collections.Counter()
    p_info = {'uuid': uuid or ''}
    if uuid:
        pdat = os.path.join(wdir, 'players', 'data', f'{uuid}.dat')
        if not os.path.exists(pdat):
            pdat = os.path.join(wdir, 'playerdata', f'{uuid}.dat')
        if os.path.exists(pdat):
            mtimes.append(os.path.getmtime(pdat))
            pnbt = read_nbt(pdat)
            for k in ('Inventory', 'EnderItems', 'equipment', 'neoforge:attachments'):
                if k in pnbt:
                    collect_nbt_items(pnbt[k], inv_counts)
            if pnbt.get('playerGameType') == 1 and mode != 'creative':
                mode, mode_uk = 'creative', 'Творчість'
            p_info['xp_level'] = int(pnbt.get('XpLevel', 0))
            p_info['dimension'] = pnbt.get('Dimension', 'minecraft:overworld')
            att = pnbt.get('neoforge:attachments') or {}
            if isinstance(att.get('apotheosis:world_tier'), dict):
                p_info['world_tier'] = att['apotheosis:world_tier'].get('tier', 'haven')
            if isinstance(att.get('solcarrot:food'), dict):
                fl = att['solcarrot:food'].get('foodList')
                if isinstance(fl, list):
                    p_info['unique_foods'] = len(fl)

    # 2. Квести FTB (ftbquests/<uuid>.json5)
    q_done, q_started, t_done = set(), set(), {}
    rewards_claimed = 0
    if uuid:
        fq_path = os.path.join(wdir, 'ftbquests', f'{uuid}.json5')
        if os.path.exists(fq_path):
            mtimes.append(os.path.getmtime(fq_path))
            fq = l5(fq_path)
            raw_name = fq.get('name', '')
            if raw_name:
                p_info['name'] = raw_name.split('#')[0]
            rewards_claimed = len(fq.get('claimed_rewards') or {})
            for dec_id, val in (fq.get('task_progress') or {}).items():
                hid = to_hex_id(dec_id)
                if hid in t_meta:
                    t_done[hid] = int(val)
            for dec_id in (fq.get('completed') or {}):
                hid = to_hex_id(dec_id)
                if hid in q_meta:
                    q_done.add(hid)
                elif hid in t_meta:
                    t_done.setdefault(hid, 1)
            for dec_id in (fq.get('started') or {}):
                hid = to_hex_id(dec_id)
                if hid in q_meta and hid not in q_done:
                    q_started.add(hid)
                elif hid in t_meta:
                    qid = t_meta[hid]['quest']
                    if qid in q_meta and qid not in q_done:
                        q_started.add(qid)

    by_chapter = {}
    for qid in sorted(q_done):
        ch = q_meta[qid]['chapter']
        by_chapter.setdefault(ch, {'done': [], 'started': []})['done'].append(qid)
    for qid in sorted(q_started):
        ch = q_meta[qid]['chapter']
        by_chapter.setdefault(ch, {'done': [], 'started': []})['started'].append(qid)

    q_done_vis = sorted(qid for qid in q_done if not q_meta[qid]['hidden'])

    # 3. Досягнення (players/advancements/<uuid>.json)
    adv_done = []
    if uuid:
        adv_path = os.path.join(wdir, 'players', 'advancements', f'{uuid}.json')
        if os.path.exists(adv_path):
            mtimes.append(os.path.getmtime(adv_path))
            ad = jload(adv_path, {}) or {}
            for k, v in ad.items():
                if isinstance(v, dict) and v.get('done') is True and not re.search(r':recipes?/', k):
                    adv_done.append(k)
    adv_done.sort()

    # 4. Статистика (players/stats/<uuid>.json)
    crafted, picked_up, used, mined, dropped = {}, {}, {}, {}, {}
    play_ticks = int(ld.get('Time') or 0)
    if uuid:
        st_path = os.path.join(wdir, 'players', 'stats', f'{uuid}.json')
        if os.path.exists(st_path):
            mtimes.append(os.path.getmtime(st_path))
            st = (jload(st_path, {}) or {}).get('stats') or {}
            crafted = {k: v for k, v in (st.get('minecraft:crafted') or {}).items() if k != 'minecraft:air' and v > 0}
            picked_up = {k: v for k, v in (st.get('minecraft:picked_up') or {}).items() if k != 'minecraft:air' and v > 0}
            used = {k: v for k, v in (st.get('minecraft:used') or {}).items() if k != 'minecraft:air' and v > 0}
            mined = {k: v for k, v in (st.get('minecraft:mined') or {}).items() if k != 'minecraft:air' and v > 0}
            dropped = {k: v for k, v in (st.get('minecraft:dropped') or {}).items() if k != 'minecraft:air' and v > 0}
            pt = (st.get('minecraft:custom') or {}).get('minecraft:play_time')
            if isinstance(pt, int):
                play_ticks = pt

    obtained = sorted(set(crafted) | set(picked_up) | set(used) | set(mined) | set(dropped) | set(inv_counts))
    last_ts = int(max(mtimes)) if mtimes else 0

    return {
        'slug': slug,
        'world': world_name,
        'folder': folder,
        'mode': mode,
        'mode_uk': mode_uk,
        'game_type': gt,
        'last_played': fmt_ts(last_ts),
        'last_played_ts': last_ts,
        'updated': now_str,
        'play_hours': round(play_ticks / 72000.0, 2),
        'player': p_info,
        'quests': {
            'done': sorted(q_done),
            'done_visible': q_done_vis,
            'started': sorted(q_started),
            'tasks_done': sorted(t_done.keys()),
            'rewards_claimed': rewards_claimed,
            'by_chapter': by_chapter,
        },
        'advancements': {
            'done': adv_done,
        },
        'items': {
            'obtained': obtained,
            'crafted': dict(sorted(crafted.items())),
            'inventory': dict(sorted(inv_counts.items())),
        },
    }

def main():
    want_world = None
    args = sys.argv[1:]
    i = 0
    while i < len(args):
        if args[i] in ('--world', '-w') and i + 1 < len(args):
            want_world = args[i + 1]
            i += 2
        elif args[i].startswith('--world='):
            want_world = args[i].split('=', 1)[1]
            i += 1
        else:
            i += 1

    ch_meta, q_meta, t_meta = load_quest_catalog()
    now_str = datetime.datetime.now().strftime('%Y-%m-%d %H:%M')
    os.makedirs(PROG_DIR, exist_ok=True)

    world_dirs = []
    if os.path.isdir(SAVES):
        for name in sorted(os.listdir(SAVES)):
            p = os.path.join(SAVES, name)
            if os.path.isdir(p) and os.path.exists(os.path.join(p, 'level.dat')):
                world_dirs.append(p)

    used_slugs = set()
    extracted = []
    for wdir in world_dirs:
        base_slug = slugify(os.path.basename(wdir))
        slug = base_slug
        n = 2
        while slug in used_slugs:
            slug = f'{base_slug}_{n}'; n += 1
        used_slugs.add(slug)
        wdata = extract_world(wdir, slug, ch_meta, q_meta, t_meta, now_str)
        extracted.append(wdata)

    # Сортуємо світи: спершу не-творчі (виживання/пригода), усередині — за часом останньої гри (найновіші зверху)
    extracted.sort(key=lambda w: (w['mode'] == 'creative', -w['last_played_ts']))

    # Вибір світу за замовчуванням
    chosen = None
    if want_world:
        q = want_world.strip().lower()
        for w in extracted:
            if q in (w['folder'].lower(), w['world'].lower(), w['slug'].lower()):
                chosen = w; break
        if not chosen:
            for w in extracted:
                if q in w['folder'].lower() or q in w['world'].lower() or q in w['slug'].lower():
                    chosen = w; break
        if not chosen:
            avail = ', '.join(f"«{w['world']}» ({w['slug']})" for w in extracted) or 'немає'
            print(f"!! Світ «{want_world}» не знайдено в minecraft/saves/. Наявні: {avail}", file=sys.stderr)
            sys.exit(1)
    else:
        # За замовчуванням — світ, у який грали останнім, але творчі світи (GameType = 1) пропускаємо
        non_creative = [w for w in extracted if w['mode'] != 'creative']
        chosen = non_creative[0] if non_creative else (extracted[0] if extracted else None)

    worlds_summary = []
    for w in extracted:
        jsave(os.path.join(PROG_DIR, f"{w['slug']}.json"), w)
        worlds_summary.append({
            'slug': w['slug'],
            'world': w['world'],
            'folder': w['folder'],
            'mode': w['mode'],
            'mode_uk': w['mode_uk'],
            'last_played': w['last_played'],
            'last_played_ts': w['last_played_ts'],
            'updated': w['updated'],
            'play_hours': w['play_hours'],
            'quests_done': len(w['quests']['done']),
            'quests_visible_done': len(w['quests']['done_visible']),
            'quests_started': len(w['quests']['started']),
            'advancements_done': len(w['advancements']['done']),
            'items_obtained': len(w['items']['obtained']),
        })

    default_slug = chosen['slug'] if chosen else ''
    index_obj = {
        'default': default_slug,
        'updated': now_str,
        'worlds': worlds_summary,
    }
    jsave(os.path.join(PROG_DIR, 'index.json'), index_obj)

    if chosen:
        main_prog = dict(chosen, default=default_slug, worlds=worlds_summary)
    else:
        main_prog = {
            'slug': '', 'world': '', 'folder': '', 'mode': 'survival', 'mode_uk': 'Виживання',
            'game_type': 0, 'last_played': '', 'last_played_ts': 0, 'updated': now_str, 'play_hours': 0,
            'player': {}, 'quests': {'done': [], 'done_visible': [], 'started': [], 'tasks_done': [], 'rewards_claimed': 0, 'by_chapter': {}},
            'advancements': {'done': []}, 'items': {'obtained': [], 'crafted': {}, 'inventory': {}},
            'default': '', 'worlds': [],
        }
    jsave(os.path.join(DATA, 'progress.json'), main_prog)

    if chosen:
        print(f"світів {len(extracted)} | вибрано «{chosen['world']}» ({chosen['slug']}, {chosen['mode_uk']}, гра: {chosen['last_played']}) "
              f"| квестів виконано {len(chosen['quests']['done'])} (у видимих главах {len(chosen['quests']['done_visible'])}, розпочато {len(chosen['quests']['started'])}) "
              f"| досягнень {len(chosen['advancements']['done'])} | предметів {len(chosen['items']['obtained'])}")
        for ch_file, ch_q in sorted(chosen['quests']['by_chapter'].items()):
            ct = ch_meta.get(ch_file, {})
            hid_tag = ' [прихована]' if ct.get('hidden') else ''
            d_titles = [f"{qid} ({q_meta[qid]['title']})" for qid in ch_q['done']]
            s_titles = [f"{qid} ({q_meta[qid]['title']})" for qid in ch_q['started']]
            print(f"  глава {ch_file} «{ct.get('title', ch_file)}»{hid_tag}: виконано {len(ch_q['done'])}/{ct.get('quests', '?')}"
                  + (f" — {', '.join(d_titles)}" if d_titles else '')
                  + (f" | розпочато {len(ch_q['started'])}: {', '.join(s_titles)}" if s_titles else ''))
    else:
        print('світів 0 — створено порожній progress.json')

if __name__ == '__main__':
    main()
