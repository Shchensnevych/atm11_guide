# K5: назви предметів, як їх показує гра. Запуск з atm11_guide: python3 -I tools/extract_game_names.py
# Клієнтський скрипт компаньйона (kubejs/client_scripts/atm11_companion_live.js) раз за запуск гри обходить реєстр предметів і пише
# <гра>/minecraft/kubejs/config/companion_item_names.json (формат — ATM11-Companion/FORMATS.md): id → назва типового екземпляра
# предмета мовою гри. Тут — лише перевірка й знімок у raw/game_item_names.json (сталий порядок, без часу запису); назви в базу
# кладе build_names.py. Файла немає / інша мова гри / обхід неповний — знімок у raw/ не змінюється.
# Так само — companion_quest_names.json (заголовки завдань і нагород квестів FTB та рядків таблиць нагород, як їх показує книга
# квестів) → raw/game_quest_names.json; у базу їх кладе extract_quests.py.
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

def clean(s):
    """Назва з гри: без кодів кольору «§x» і зайвих пробілів («&» у грі — звичайний знак, не код)."""
    return re.sub(r'\s+', ' ', re.sub(r'§.', '', s)).strip()

def _ids(v):
    return sorted(x for x in (v or []) if isinstance(x, str) and RX_ID.match(x)) if isinstance(v, list) else []

def normalize(d):
    """Файл гри → (знімок, None) або (None, причина відмови)."""
    if not isinstance(d, dict) or not isinstance(d.get('names'), dict): return None, 'не схоже на файл назв (немає names)'
    if d.get('lang') != LANG: return None, f'мова гри «{d.get("lang") or "?"}» — потрібна {LANG} (увімкніть українську й зайдіть у світ)'
    names = {k: clean(v) for k, v in d['names'].items() if isinstance(k, str) and RX_ID.match(k) and isinstance(v, str) and clean(v)}
    if not names: return None, 'назв немає'
    num = lambda k: d[k] if isinstance(d.get(k), (int, float)) else 0
    total = int(num('total'))
    if total and num('count') + num('untranslated') + num('errors') < total - 1: return None, f'обхід неповний: назв {int(num("count"))} з {total} предметів'
    base = {k: [clean(v[0]), v[1]] for k, v in (d.get('base') or {}).items()
            if k in names and isinstance(v, list) and len(v) == 2 and all(isinstance(x, str) for x in v) and clean(v[0])} if isinstance(d.get('base'), dict) else {}
    return {'lang': LANG, 'total': total or len(names), 'count': len(names), 'untranslated': int(num('untranslated')), 'errors': int(num('errors')),
            'no_name': _ids(d.get('no_name')), 'failed': _ids(d.get('failed')),
            'names': dict(sorted(names.items())), 'base': dict(sorted(base.items()))}, None

def registry_ids(snap):
    """Реєстр предметів гри зі знімка (K6): усі предмети обходу — з назвою, без назви (гра показує ключем) і ті, що не прочитались.
    Знімка немає або він без назв — None (не порожній реєстр): тоді ніхто не вважає, що в грі предметів немає."""
    if not isinstance(snap, dict) or not snap.get('names'): return None
    return set(snap['names']) | set(snap.get('no_name') or []) | set(snap.get('failed') or []) | {EMPTY_ITEM}

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
    def names_sum(snap, old):
        base = f'{snap["count"]} назв з {snap["total"]} предметів'
        if old is None: return base
        oldn = old.get('names') or {}
        return f'{base} (нових і змінених {sum(1 for k, v in snap["names"].items() if oldn.get(k) != v)}; гра показує ключем {snap["untranslated"]}, помилок читання {snap["errors"]})'
    def quests_sum(snap, old):
        return f'завдань {len(snap["tasks"])}, нагород {len(snap["rewards"])}, таблиць {len(snap["tables"])} (квестів {snap["quests_total"]}, помилок читання {snap["errors"]})'
    snapshot(SRC, OUT, normalize, 'Назви предметів з гри', names_sum, keep_lost)
    snapshot(QSRC, QOUT, normalize_quests, 'Заголовки квестів з гри', quests_sum)
    return 0

if __name__ == '__main__': sys.exit(main())
