# Кросмодові рецепти з індексів (сито, сесія S) → raw/crossmod.md: активні рецепти, у яких предмети / машина ≥2 модів.
# Це КАНДИДАТИ в синергії для G4–G6: людина / модель лише відбирає з цього списку (і пише ref: recipe:<id>), а не вигадує зв'язки.
# Запуск з atm11_guide після extract_recipes.py і extract_kubejs.py:  python3 -I tools/crossmod.py
import os, sys, collections, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import RAW, DATA, jload
NOT_MODS = {'minecraft', 'c', 'neoforge', 'kubejs', 'atm', 'forge'}

def main():
    R = jload(os.path.join(RAW, 'recipes_index.json'), {})
    names = {m['id']: m.get('name', m['id']) for m in (jload(os.path.join(DATA, 'mods.json'), []) or [])}
    pairs = collections.defaultdict(list)
    for rid, e in R.items():
        if e['a'] is not True: continue
        ms = sorted({x.lstrip('#').split(':')[0] for x in e['in'] + e['out']} - NOT_MODS | ({e['t'].split(':')[0]} - NOT_MODS))   # тег мода (#occultism:…) — теж мод
        if len(ms) < 2 or len(ms) > 6: continue                     # >6 — збірні таблиці (переробка всього), не синергія
        for i, a in enumerate(ms):
            for b in ms[i + 1:]: pairs[(a, b)].append(rid)
    per = collections.defaultdict(list)
    for (a, b), ids in pairs.items(): per[a].append((b, ids)); per[b].append((a, ids))
    L = ['# Кросмодові рецепти — кандидати в синергії (tools/crossmod.py)', '',
         'Активні рецепти збірки (jar + дані + KubeJS, після вимкненого KubeJS), у яких беруть участь предмети або машина ≥2 модів. Спільні теги (c:…, minecraft:…) не рахуються — лише предмети й теги конкретних модів.',
         'Як користуватися: для мода знайти партнера → відкрити рецепт (`jarq.py recipes <ns> <шлях>` або raw/recipes_index.json) → якщо поєднання справді корисне гравцю — synergy з `ref: ["recipe:<id>"]`. Уніфікація руд / пилу (переробка «чужої» руди в машині) — зазвичай не синергія.', '',
         f'Пар модів: {len(pairs)}, модів: {len(per)}.', '']
    def ex(rid):
        e = R[rid]; io = ', '.join(e['in'][:3]) + (' …' if len(e['in']) > 3 else '') + ' → ' + ', '.join(e['out'][:2])
        return f"`recipe:{rid}` [{e['t'].split(':')[-1]}] {io}"
    for m in sorted(per):
        L += [f"## {m} — {names.get(m, '')} ({len(per[m])} партнерів)", '']
        for b, ids in sorted(per[m], key=lambda x: -len(x[1])):
            L.append(f"- **{b}** ({len(ids)}): " + ' · '.join(ex(r) for r in ids[:2]))
        L.append('')
    open(os.path.join(RAW, 'crossmod.md'), 'w', encoding='utf-8').write('\n'.join(L) + '\n')
    print(f'пар модів {len(pairs)}, модів {len(per)}')

if __name__ == '__main__': main()
