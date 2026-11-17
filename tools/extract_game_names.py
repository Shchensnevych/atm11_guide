# K5: назви предметів, як їх показує гра. Запуск з atm11_guide: python3 -I tools/extract_game_names.py
# Клієнтський скрипт компаньйона (kubejs/client_scripts/atm11_companion_live.js) раз за запуск гри обходить реєстр предметів і пише
# <гра>/minecraft/kubejs/config/companion_item_names.json (формат — ATM11-Companion/FORMATS.md): id → назва типового екземпляра
# предмета мовою гри. Тут — лише перевірка й знімок у raw/game_item_names.json (сталий порядок, без часу запису); назви в базу
# кладе build_names.py. Файла немає / інша мова гри / обхід неповний — знімок у raw/ не змінюється.
# Так само — companion_quest_names.json (заголовки завдань і нагород квестів FTB та рядків таблиць нагород, як їх показує книга
# квестів) → raw/game_quest_names.json; у базу їх кладе extract_quests.py.
# K7: companion_fluid_names.json (реєстр рідин гри з назвами, той самий формат, що й у предметів) → raw/game_fluid_names.json:
# реєстр рідин для сита (extract_recipes.py) і назви рідин (build_names.py).
# K19: companion_enchantments.json (реєстр зачарувань гри: назва, опис, на що накладається, несумісні, теги; поправки коду модів —
# перевірка «supportsEnchantment проти тегів» по всіх предметах, лише коли змінився відбиток збірки) → raw/game_enchantments.json;
# у базу (docs/data/enchantments.json) кладе build_enchantments.py.
# K20: companion_item_traits.json (ознаки предметів з компонентів гри — їжа, інструмент, зброя, знос, вдягання, контейнер, блок — і
# назви вкладок творчого інвентаря; лише коли змінився відбиток збірки або мова) → raw/game_item_traits.json; групи предметів
# (docs/data/item_groups.json) будує build_item_groups.py.
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import MC, RAW, jload, jsave

SRC = os.path.join(MC, 'kubejs', 'config', 'companion_item_names.json')
OUT = os.path.join(RAW, 'game_item_names.json')
LANG = 'uk_ua'                                   # база путівника — українською: назви іншої мови гри не беремо
RX_ID = re.compile(r'^[a-z0-9_.-]+:[a-z0-9_./-]+$')
QSRC = os.path.join(MC, 'kubejs', 'config', 'companion_quest_names.json')
QOUT = os.path.join(RAW, 'game_quest_names.json')
EMPTY_ITEM = 'minecraft:air'                     # «порожній» предмет: у реєстрі гри він є (total його рахує), але обхід назв його пропускає — екземпляра з назвою немає
RX_CODE = re.compile(r'^[0-9A-F]{16}$')
FSRC = os.path.join(MC, 'kubejs', 'config', 'companion_fluid_names.json')
FOUT = os.path.join(RAW, 'game_fluid_names.json')
EMPTY_FLUID = 'minecraft:empty'                  # порожня рідина — так само: у реєстрі є, назви не має
ESRC = os.path.join(MC, 'kubejs', 'config', 'companion_enchantments.json')
EOUT = os.path.join(RAW, 'game_enchantments.json')
TSRC = os.path.join(MC, 'kubejs', 'config', 'companion_item_traits.json')
TOUT = os.path.join(RAW, 'game_item_traits.json')

def clean(s):
    """Назва з гри: без кодів кольору «§x» і зайвих пробілів («&» у грі — звичайний знак, не код)."""
    return re.sub(r'\s+', ' ', re.sub(r'§.', '', s)).strip()

def _ids(v):
    return sorted(x for x in (v or []) if isinstance(x, str) and RX_ID.match(x)) if isinstance(v, list) else []

def normalize(d, what='предметів'):
    """Файл гри (обхід реєстру: предмети або рідини — what для пояснення) → (знімок, None) або (None, причина відмови)."""
    if not isinstance(d, dict) or not isinstance(d.get('names'), dict): return None, 'не схоже на файл назв (немає names)'
    if d.get('lang') != LANG: return None, f'мова гри «{d.get("lang") or "?"}» — потрібна {LANG} (увімкніть українську й зайдіть у світ)'
    names = {k: clean(v) for k, v in d['names'].items() if isinstance(k, str) and RX_ID.match(k) and isinstance(v, str) and clean(v)}
    if not names: return None, 'назв немає'
    num = lambda k: d[k] if isinstance(d.get(k), (int, float)) else 0
    total = int(num('total'))
    if total and num('count') + num('untranslated') + num('errors') < total - 1: return None, f'обхід неповний: назв {int(num("count"))} з {total} {what}'
    base = {k: [clean(v[0]), v[1]] for k, v in (d.get('base') or {}).items()
            if k in names and isinstance(v, list) and len(v) == 2 and all(isinstance(x, str) for x in v) and clean(v[0])} if isinstance(d.get('base'), dict) else {}
    return {'lang': LANG, 'total': total or len(names), 'count': len(names), 'untranslated': int(num('untranslated')), 'errors': int(num('errors')),
            'no_name': _ids(d.get('no_name')), 'failed': _ids(d.get('failed')),
            'names': dict(sorted(names.items())), 'base': dict(sorted(base.items()))}, None

def registry_ids(snap, empty=EMPTY_ITEM):
    """Реєстр гри зі знімка (K6 — предмети, K7 — рідини з empty=EMPTY_FLUID): усі записи обходу — з назвою, без назви (гра показує
    ключем) і ті, що не прочитались, плюс порожній запис реєстру. Знімка немає або він без назв — None (не порожній реєстр): тоді
    ніхто не вважає, що в грі цього немає."""
    if not isinstance(snap, dict) or not snap.get('names'): return None
    return set(snap['names']) | set(snap.get('no_name') or []) | set(snap.get('failed') or []) | {empty}

def keep_lost(snap, old):
    """Предмет, який гра цього разу показала ключем, а в попередньому знімку мав назву, — назва лишається (замір K5: після F3+T
    гра втратила назви 20 предметів, які складає кодом при старті). Предмета в реєстрі вже немає — назва зникає, як і має."""
    oldn = (old or {}).get('names') or {}
    kept = {k: oldn[k] for k in snap['no_name'] if k in oldn}
    if kept:
        snap['names'] = dict(sorted({**snap['names'], **kept}.items()))
        snap['no_name'] = [k for k in snap['no_name'] if k not in kept]
        snap['count'], snap['untranslated'] = len(snap['names']), len(snap['no_name'])
    return snap

def normalize_quests(d):
    """Файл заголовків квестів → (знімок, None) або (None, причина відмови)."""
    if not isinstance(d, dict) or not all(isinstance(d.get(k), dict) for k in ('tasks', 'rewards', 'tables')): return None, 'не схоже на файл заголовків квестів (немає tasks / rewards / tables)'
    if d.get('lang') != LANG: return None, f'мова гри «{d.get("lang") or "?"}» — потрібна {LANG}'
    titles = lambda m: dict(sorted((k, clean(v)) for k, v in m.items() if isinstance(k, str) and RX_CODE.match(k) and isinstance(v, str) and clean(v)))
    tasks, rewards = titles(d['tasks']), titles(d['rewards'])
    if not tasks: return None, 'заголовків завдань немає'
    tables = dict(sorted((k, [clean(x) if isinstance(x, str) else '' for x in v]) for k, v in d['tables'].items() if isinstance(k, str) and RX_CODE.match(k) and isinstance(v, list)))
    return {'lang': LANG, 'quests_total': int(d['quests_total']) if isinstance(d.get('quests_total'), (int, float)) else 0,
            'errors': int(d['errors']) if isinstance(d.get('errors'), (int, float)) else 0, 'tasks': tasks, 'rewards': rewards, 'tables': tables}, None

def _pairs(v):
    return sorted({(a, b) for a, b in (x for x in (v or []) if isinstance(x, list) and len(x) == 2) if isinstance(a, str) and isinstance(b, str) and RX_ID.match(a) and RX_ID.match(b)})

def _set(v):
    """Множина предметів зачарування: {tag} або {items}; інше — None."""
    if not isinstance(v, dict): return None
    if isinstance(v.get('tag'), str) and RX_ID.match(v['tag']): return {'tag': v['tag']}
    if isinstance(v.get('items'), list): return {'items': _ids(v['items'])}
    return None

def normalize_enchantments(d):
    """Файл зачарувань гри → (знімок, None) або (None, причина відмови). Знімок без часу запису й зі сталим порядком."""
    if not isinstance(d, dict) or not isinstance(d.get('enchantments'), list) or not isinstance(d.get('tag_sets'), dict): return None, 'не схоже на файл зачарувань (немає enchantments / tag_sets)'
    if d.get('lang') != LANG: return None, f'мова гри «{d.get("lang") or "?"}» — потрібна {LANG}'
    fp = d.get('fingerprint')
    if not isinstance(fp, str) or not fp: return None, 'немає відбитка збірки'
    ench = []
    for e in d['enchantments']:
        if not isinstance(e, dict) or not isinstance(e.get('id'), str) or not RX_ID.match(e['id']): continue
        name = clean(e['name']) if isinstance(e.get('name'), str) else ''
        sup = _set(e.get('supported'))
        if not name or not sup: continue
        r = {'id': e['id'], 'name': name, 'supported': sup}
        if isinstance(e.get('desc'), str) and clean(e['desc']): r['desc'] = clean(e['desc'])
        for k in ('max_level', 'weight', 'anvil_cost'):
            if isinstance(e.get(k), (int, float)): r[k] = int(e[k])
        if isinstance(e.get('slots'), list): r['slots'] = [x for x in e['slots'] if isinstance(x, str)]
        pr = _set(e.get('primary'))
        if pr: r['primary'] = pr
        if isinstance(e.get('exclusive'), list): r['exclusive'] = _ids(e['exclusive'])
        if isinstance(e.get('exclusive_tag'), str) and RX_ID.match(e['exclusive_tag']): r['exclusive_tag'] = e['exclusive_tag']
        r['tags'] = _ids(e.get('tags'))
        ench.append(r)
    if not ench: return None, 'зачарувань немає'
    total = int(d['total']) if isinstance(d.get('total'), (int, float)) else len(ench)
    errors = int(d['errors']) if isinstance(d.get('errors'), (int, float)) else 0
    if len(ench) + errors < total: return None, f'прочитано не всі зачарування: {len(ench)} з {total}'
    tag_sets = {k: sorted(set(_ids(v))) for k, v in sorted(d['tag_sets'].items()) if isinstance(k, str) and RX_ID.match(k) and isinstance(v, list)}
    cc = d.get('code_check') if isinstance(d.get('code_check'), dict) else {}
    if cc.get('state') == 'done' and cc.get('fingerprint') == fp:
        code = {'state': 'done', 'checks': int(cc.get('checks') or 0), 'items': int(cc.get('items') or 0), 'errors': int(cc.get('errors') or 0),
                'adds_n': int(cc.get('adds_n') or 0), 'removes_n': int(cc.get('removes_n') or 0), 'adds': [list(x) for x in _pairs(cc.get('adds'))], 'removes': [list(x) for x in _pairs(cc.get('removes'))]}
    else:
        code = {'state': 'pending'}
    return {'lang': LANG, 'fingerprint': fp, 'mods': int(d.get('mods') or 0), 'items_total': int(d.get('items_total') or 0), 'total': len(ench), 'errors': errors, 'failed': _ids(d.get('failed')),
            'enchantments': sorted(ench, key=lambda x: x['id']), 'tag_sets': tag_sets, 'code_check': code}, None

def normalize_traits(d):
    """Файл ознак предметів гри → (знімок, None) або (None, причина відмови). Знімок без часу запису й зі сталим порядком."""
    if not isinstance(d, dict) or not isinstance(d.get('items'), list) or not isinstance(d.get('has'), dict) or not isinstance(d.get('by'), dict): return None, 'не схоже на файл ознак предметів (немає items / has / by)'
    if d.get('lang') != LANG: return None, f'мова гри «{d.get("lang") or "?"}» — потрібна {LANG}'
    fp = d.get('fingerprint')
    if not isinstance(fp, str) or not fp: return None, 'немає відбитка збірки'
    total = int(d['total']) if isinstance(d.get('total'), (int, float)) else 0
    blocks = int(d['block_items']) if isinstance(d.get('block_items'), (int, float)) else -1
    items = sorted(set(_ids(d['items'])))
    errors = int(d['errors']) if isinstance(d.get('errors'), (int, float)) else 0
    if total <= 0 or blocks < 0: return None, 'обхід порожній'
    if len(items) + blocks + errors < total: return None, f'прочитано не всі предмети: {len(items) + blocks} з {total}'
    has = {k: sorted(set(_ids(v))) for k, v in sorted(d['has'].items()) if isinstance(k, str) and RX_ID.match(k) and isinstance(v, list)}
    by = {}
    for k, v in sorted(d['by'].items()):
        if not (isinstance(k, str) and RX_ID.match(k) and isinstance(v, dict)): continue
        by[k] = {kk: sorted(set(_ids(vv))) for kk, vv in sorted(v.items()) if isinstance(kk, str) and re.match(r'^[A-Z_?]+$', kk) and isinstance(vv, list)}
    tabs = {k: clean(v) for k, v in sorted((d.get('tabs') or {}).items()) if isinstance(k, str) and RX_ID.match(k) and isinstance(v, str) and clean(v)}
    return {'lang': LANG, 'fingerprint': fp, 'mods': int(d.get('mods') or 0), 'total': total, 'block_items': blocks, 'errors': errors, 'failed': _ids(d.get('failed')),
            'items': items, 'has': has, 'by': by, 'tabs': tabs}, None

def keep_code_check(snap, old):
    """Перевірка кодом ще йде (pending), а попередній знімок того самого відбитка збірки її має — лишається попередня."""
    if snap['code_check'].get('state') != 'done' and old and old.get('fingerprint') == snap['fingerprint'] and (old.get('code_check') or {}).get('state') == 'done':
        snap['code_check'] = old['code_check']
    return snap

def snapshot(src, out, norm, label, summary, merge=None):
    """Файл гри → перевірка → знімок у raw/ (лише коли змінився)."""
    if not os.path.exists(src):
        print(f'!! Немає {src} — запустіть гру з увімкненим компаньйоном і зайдіть у світ (знімок у raw/ не змінено)'); return
    try: d = jload(src)
    except ValueError as e:
        print(f'!! {src}: не читається ({e}) — знімок у raw/ не змінено'); return
    snap, why = norm(d)
    if not snap:
        print(f'!! {label} не взято: {why} (знімок у raw/ не змінено)'); return
    old = jload(out, None)
    if merge: snap = merge(snap, old)
    if old == snap: print(f'{label}: без змін — {summary(snap, None)}'); return
    jsave(out, snap, compact=True)
    print(f'{label}: {summary(snap, old or {})} → raw/{os.path.basename(out)}')

def main():
    def names_sum(what):
        def summary(snap, old):
            base = f'{snap["count"]} назв з {snap["total"]} {what}'
            if old is None: return base
            oldn = old.get('names') or {}
            return f'{base} (нових і змінених {sum(1 for k, v in snap["names"].items() if oldn.get(k) != v)}; гра показує ключем {snap["untranslated"]}, помилок читання {snap["errors"]})'
        return summary
    def quests_sum(snap, old):
        return f'завдань {len(snap["tasks"])}, нагород {len(snap["rewards"])}, таблиць {len(snap["tables"])} (квестів {snap["quests_total"]}, помилок читання {snap["errors"]})'
    snapshot(SRC, OUT, normalize, 'Назви предметів з гри', names_sum('предметів'), keep_lost)
    snapshot(FSRC, FOUT, lambda d: normalize(d, 'рідин'), 'Реєстр і назви рідин з гри', names_sum('рідин'), keep_lost)
    snapshot(QSRC, QOUT, normalize_quests, 'Заголовки квестів з гри', quests_sum)
    def ench_sum(snap, old):
        cc = snap['code_check']
        code = f"код модів: додає {cc['adds_n']}, забороняє {cc['removes_n']} (пар {cc['checks']})" if cc.get('state') == 'done' else 'перевірка кодом ще не завершена в грі'
        return f"зачарувань {snap['total']}, тегів предметів {len(snap['tag_sets'])}, {code}"
    snapshot(ESRC, EOUT, normalize_enchantments, 'Зачарування з гри', ench_sum, keep_code_check)
    def traits_sum(snap, old):
        return f"предметів {snap['total']} (блоків {snap['block_items']}), компонентів {len(snap['has'])}, вкладок {len(snap['tabs'])}"
    snapshot(TSRC, TOUT, normalize_traits, 'Ознаки предметів з гри', traits_sum)
    return 0

if __name__ == '__main__': sys.exit(main())
