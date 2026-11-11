# K5: звірка назв предметів з грою — по всіх предметах реєстру гри, не на вибірці.
# Запуск з atm11_guide: python3 -I tools/audit_names.py [файл знімка]   (типово raw/game_item_names.json; можна дати файл гри
# kubejs/config/companion_item_names.json — тоді він спершу проходить ту саму перевірку, що й в extract_game_names.py).
# Нічого не змінює в docs/data; звіт — raw/names_audit.md: скільки назв збіглося з перекладом, скільки дала гра, де гра й переклад
# розходяться (за формою: є / немає перекладу власного ключа предмета) і скільки предметів лишилось без назви (має прямувати до 0).
import os, sys, sqlite3, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import RAW, jload
import build_names, extract_game_names

def recipe_items():
    p = os.path.join(RAW, 'recipes.db')
    if not os.path.exists(p): return None
    db = sqlite3.connect(f'file:{p}?mode=ro', uri=True)
    ids = set()
    for q in ('SELECT item_id FROM recipe_outputs', 'SELECT item_or_tag FROM recipe_ingredients WHERE is_tag=0', 'SELECT item_id FROM item_tags'):
        ids |= {r[0] for r in db.execute(q)}
    return {x for x in ids if x and ':' in x and not x.startswith('#')}

def by_mod(ids, n=12): return ', '.join(f'{m} {c}' for m, c in collections.Counter(i.split(':')[0] for i in ids).most_common(n))

def main():
    src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(RAW, 'game_item_names.json')
    snap = jload(src, None)
    if snap is None: print(f'!! Немає знімка назв з гри: {src} (спершу tools/extract_game_names.py)'); return 1
    if 'ts' in snap or 'v' in snap:                              # файл гри, а не знімок з raw/
        snap, why = extract_game_names.normalize(snap)
        if not snap: print(f'!! {why}'); return 1
    warns, st, res = [], {}, {}
    build_names.build(warns.append, write=False, game=snap, stats=st, out=res)
    items, tsv, game, base = res['items'], st['tsv'], snap['names'], snap.get('base') or {}
    registry = set(game) | set(snap['no_name']) | set(snap['failed'])
    left = sorted(i for i in registry if i not in items)
    rec = recipe_items()
    rec_left = sorted(i for i in rec if i not in items) if rec is not None else None
    own, shared, stale = [], [], []                              # розбіжності за формою
    for iid, t, g, _ in st['differs']:
        b = base.get(iid)
        (stale if not b else own if b[0] == t else shared).append((iid, t, g, b[0] if b else '', b[1] if b else ''))
    tpl_left = sorted(i for i in registry if i in items and build_names.RX_TPL.search(items[i][0] or ''))
    L = ['# Назви предметів: гра проти бази путівника (tools/audit_names.py, K5)', '',
         f'Знімок: мова {snap["lang"]}, предметів у реєстрі гри {snap["total"]}, з назвою {snap["count"]}, гра показує ключем перекладу {snap["untranslated"]}, помилок читання {snap["errors"]}.', '',
         '| Що | Скільки |', '|---|---|',
         f'| назва з гри = назва з перекладу | {st["same"]} |',
         f'| назви в перекладі немає → узято з гри | {st["added"]} |',
         f'| назва-шаблон у перекладі → узято з гри (шаблон спільний для кількох предметів) | {st["template"]} |',
         f'| назва-шаблон лише в одного предмета → назва без підстановки | {st["kind"]} |',
         f'| гра й переклад розходяться | {len(st["differs"])}: лишено назву предмета {sum(1 for d in st["differs"] if d[3] == "base")}, узято з гри {sum(1 for d in st["differs"] if d[3] == "game")} |',
         f'| предметів реєстру гри без назви в базі | {len(left)} |',
         f'| назв-шаблонів лишилось | {len(tpl_left)} |']
    if rec is not None: L.append(f'| предметів з бази рецептів без назви | {len(rec_left)} з {len(rec)} |')
    L += ['', f'У базі, але не в реєстрі гри (блоки без предмета, старі ключі перекладу): {sum(1 for i in items if i not in registry)}.', '']
    def table(title, rows, note):
        L.extend([f'## {title} — {len(rows)}', note, ''])
        if rows:
            L.extend(['| Предмет | У базі (переклад) | Показує гра | Переклад ключа предмета в грі | Ключ |', '|---|---|---|---|---|'])
            L.extend(f'| `{i}` | {t} | {g} | {b} | `{k}` |' for i, t, g, b, k in rows[:400])
            if len(rows) > 400: L.append(f'… ще {len(rows) - 400}')
        L.append('')
    table('Розбіжність: назва екземпляра ≠ назва предмета', own, 'Переклад ключа предмета в грі збігається з базою; гра показує іншу назву типового екземпляра (напр. зілля без ефекту). За модами: ' + by_mod([r[0] for r in own]))
    table('Розбіжність: ключ предмета в грі перекладено інакше, ніж у базі', shared, 'У базі назва з іншого ключа, ніж той, яким предмет називає гра. За модами: ' + by_mod([r[0] for r in shared]))
    table('Розбіжність: гра показує переклад свого ключа, у базі — інше', stale, 'Назва в грі — простий переклад ключа предмета, але в базі інший текст (застарілий переклад або не той ключ). За модами: ' + by_mod([r[0] for r in stale]))
    for title, ids in (('Без назви в базі (реєстр гри)', left), ('Назви-шаблони, що лишились', tpl_left), ('Без назви в базі (база рецептів)', rec_left or [])):
        L.extend([f'## {title} — {len(ids)}', ('За модами: ' + by_mod(ids)) if ids else '', ''] + [f'- `{i}`' + (f' — {items[i][0]}' if i in items else '') for i in ids[:300]] + ([f'… ще {len(ids) - 300}'] if len(ids) > 300 else []) + [''])
    open(os.path.join(RAW, 'names_audit.md'), 'w', encoding='utf-8', newline='\n').write('\n'.join(L) + '\n')
    print(f'Назви з гри: збіглося {st["same"]}, з гри {st["added"]}, шаблонів замінено {st["template"]} + без підстановки {st["kind"]}, розбіжностей {len(st["differs"])} (екземпляр {len(own)}, інший ключ {len(shared)}, інший текст {len(stale)}), '
          f'без назви {len(left)}' + (f', з рецептів без назви {len(rec_left)}' if rec is not None else '') + ' → raw/names_audit.md')
    for w in warns: print('!!', w)
    return 0

if __name__ == '__main__': sys.exit(main())
