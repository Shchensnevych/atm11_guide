# ПОВНИЙ розбір minecraft/kubejs (сито, сесія S) → raw/kubejs_index.json + raw/kubejs_report.md; накладає KubeJS на raw/recipes_index.json.
# Як: tools/kjs_sandbox.mjs виконує ВСІ startup_scripts і server_scripts у пісочниці Node (порядок і Platform.isLoaded — як у грі, без доступу до файлів/мережі),
# записує кожен рецепт (id, тип, входи, виходи, файл:рядок), remove / replaceInput / replaceOutput (і ЯКІ рецепти jar вони зачіпають), теги (add/remove),
# предмети з реєстру KubeJS, умови isLoaded (зокрема хибні — код під ними неактивний), події гри (поведінка під час гри — перелік), нерозв'язане (Java API) — у звіт.
# kubejs/data і kubejs/dynamic_data — розбирає extract_recipes.py (як datapack). Звірка з logs/kubejs/server.log (додано / вимкнено / змінено).
# Потрібен Node.js (у Windows — той самий, що для ATM11-Companion). Запуск з atm11_guide після extract_recipes.py:  python3 -I tools/extract_kubejs.py
import os, sys, json, subprocess, collections, re, shutil
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import MC, RAW, jload, jsave
from extract_recipes import apply_kjs, apply_kjs_tags, recheck_tag_empty, unapply_kjs, Ctx, kjs_log, NOT_MODS
HERE = os.path.dirname(os.path.abspath(__file__))

def main():
    node = shutil.which('node') or shutil.which('node.exe')
    if not node: sys.exit('Потрібен Node.js (node) — пісочниця KubeJS: tools/kjs_sandbox.mjs')
    os.makedirs(os.path.join(RAW, 'tmp'), exist_ok=True)
    run = os.path.join(RAW, 'tmp', 'kjs_run.json')
    p = subprocess.run([node, os.path.join(HERE, 'kjs_sandbox.mjs'), os.path.join(MC, 'kubejs'), RAW, MC, run], capture_output=True, text=True, encoding='utf-8')
    if p.returncode: sys.exit('kjs_sandbox.mjs: ' + (p.stderr or p.stdout)[-1500:])
    d = jload(run); reg = jload(os.path.join(RAW, 'registry_index.json')); recs = jload(os.path.join(RAW, 'recipes_index.json'))
    loaded = set(reg['mods']); items = set(reg['items']) | {r['id'] for r in d['registry'] if r['reg'] in ('item', 'block')}
    items |= {r['id'] + '_bucket' for r in d['registry'] if r['reg'] == 'fluid'}; fluids = set(reg['fluids']) | {r['id'] for r in d['registry'] if r['reg'] == 'fluid'}
    # рецепти KubeJS: ключ = явний id або kjs:<файл>#L<рядок>[.<n>]; пізніший з тим самим id перекриває (як у грі)
    out, per_line = {}, collections.Counter()
    for r in d['recipes']:
        f, line = r['at'].rsplit(':', 1) if ':' in r['at'] else (r['at'], '0')
        if r.get('id'): key = r['id']
        else: per_line[r['at']] += 1; key = f'kjs:{f.split("/", 1)[-1]}#L{line}' + (f'.{per_line[r["at"]]}' if per_line[r['at']] > 1 else '')
        tns = r['type'].split(':')[0]; active, why = True, ''
        gone = sorted({x.split(':')[0] for x in r['in'] + r['out'] if not x.startswith('#')} - loaded - NOT_MODS)
        unknown = sorted({x for x in r['in'] + r['out'] if not x.startswith('#') and x.split(':')[0] in loaded and x not in items and x not in fluids})
        if tns not in loaded and tns not in ('minecraft', 'kubejs'): active, why = False, f'тип {r["type"]} — мода {tns} немає'
        elif gone: active, why = False, f'предмети модів, яких немає: {", ".join(gone)}'
        elif unknown: why = f'ID поза реєстром assets: {", ".join(unknown[:4])}'
        mods = sorted({x.lstrip('#').split(':')[0] for x in r['in'] + r['out'] if not x.startswith('#')} - NOT_MODS | ({tns} - NOT_MODS))
        e = {'key': key, 'id': r.get('id'), 'type': r['type'], 'at': r['at'], 'in': r['in'], 'out': r['out'], 'mods': mods, 'active': active}
        if why: e['why'] = why
        if isinstance(r.get('json'), dict): e['json'] = r['json']       # K6: запис рецепта у формі datapack — база рецептів бере з нього кількості
        if r.get('unsplit'): e['unsplit'] = True                  # схема мода без розділення входів/виходів (усі ID — у in)
        if key in out: e['overrides_kjs'] = out[key]['at']
        if key in recs and recs[key].get('src') != 'kubejs': e['overrides'] = recs[key]['src']
        out[key] = e
    for x in d['data']:                                              # generateData: event.json('<ns>:recipe/<шлях>', {…}) — рецепт у віртуальному datapack KubeJS
        m = re.match(r'([^:]+):recipes?/(.+?)(?:\.json)?$', x['id'])
        if not m or not x.get('io'): continue
        key = f'{m[1]}:{m[2]}'; t = str(x.get('type') or ''); tns = t.split(':')[0]
        ins, outs = x['io']['in'], x['io']['out']
        gone = sorted({i.split(':')[0] for i in ins + outs if not i.startswith('#')} - loaded - NOT_MODS)
        active, why = (False, f'тип {t} — мода {tns} немає') if tns not in loaded and tns != 'minecraft' else ((False, f'предмети модів, яких немає: {", ".join(gone)}') if gone else (True, ''))
        e = {'key': key, 'id': key, 'type': t, 'at': x['at'], 'in': ins, 'out': outs, 'active': active, 'data': True,
             'mods': sorted({i.lstrip('#').split(':')[0] for i in ins + outs if not i.startswith('#')} - NOT_MODS | ({tns} - NOT_MODS))}
        if why: e['why'] = why
        if isinstance(x.get('json'), dict): e['json'] = x['json']
        out[key] = e
    removed, modified = {}, {}
    for r in d['removes']:
        for rid in r['ids']: removed.setdefault(rid, r['at'])
    for r in d['replaces']:
        for rid in r['ids']: modified.setdefault(rid, r['at'])
    for r in d['foreach']:
        for rid in r['ids']: modified.setdefault(rid, r['at'] + ' (forEachRecipe)')
    conds_false = sorted({(c['at'], c['mod']) for c in d['conds'] if not c['v']})
    k = {'counts': {}, 'files': d['files'], 'recipes': list(out.values()), 'removed_ids': removed, 'modified_ids': modified,
         'removes': [{'f': r['f'], 'at': r['at'], 'n': len(r['ids'])} for r in d['removes']], 'replaces': d['replaces'],
         'tags': d['tags'], 'registry': d['registry'], 'events': d['events'], 'data': d['data'],
         'conds_false': [{'at': a, 'mod': m} for a, m in conds_false], 'conds_true': [{'at': a, 'mod': m} for a, m in sorted({(c['at'], c['mod']) for c in d['conds'] if c['v']})],
         'unresolved': d['unresolved'], 'errors': d['errors']}
    act = sum(1 for e in out.values() if e['active'])
    k['counts'] = {'recipes': len(out), 'active': act, 'removed': len(removed), 'modified': len(modified), 'tag_ops': len(d['tags']), 'registry': len(d['registry'])}
    jsave(os.path.join(RAW, 'kubejs_index.json'), k, compact=True)
    rep = []
    tags_doc = jload(os.path.join(RAW, 'tags_index.json'), {}) or {}
    exist = {'item': set(reg['items']), 'block': set(reg['blocks']), 'fluid': set(reg['fluids'])}
    flipped = apply_kjs_tags(tags_doc, exist, rep, k)
    jsave(os.path.join(RAW, 'tags_index.json'), tags_doc, compact=True)
    unapply_kjs(recs)
    recheck_tag_empty(recs, Ctx(loaded, exist['item'], exist['block'], exist['fluid'], tags_doc), flipped, rep)
    apply_kjs(recs, rep, k); jsave(os.path.join(RAW, 'recipes_index.json'), recs, compact=True)
    report(k, d, recs, kjs_log())
    for line in rep:
        if 'теги' in line: print(' ', line)
    print(f"KubeJS: рецептів {len(out)} (активних {act}), вимкнено jar {len(removed)}, змінено {len(modified)}, теги {len(d['tags'])}, реєстр {len(d['registry'])}, помилок {len(d['errors'])}")

def report(k, d, recs, game):
    c = k['counts']; L = ['# KubeJS збірки — повний розбір (tools/extract_kubejs.py)', '',
        'Пісочниця виконує всі скрипти як гра; цифри нижче — звірка з logs/kubejs/server.log останнього запуску гри.', '',
        '| | гра | індекс |', '|---|---|---|',
        f"| додано рецептів | {game.get('added', '?')} | {c['recipes']} (активних {c['active']}) |",
        f"| вимкнено (remove) | {game.get('removed', '?')} | {c['removed']} |",
        f"| змінено (replaceInput/Output) | {game.get('modified', '?')} | {sum(1 for r in k['replaces'] for _ in r['ids'])} (+ forEachRecipe) |", '',
        'Розбіжність «додано» — це рецепти, які скрипти будують з JSON рецептів гри або з Java-реєстрів (розділ «Нерозв\'язане»): пісочниця їх не відтворює; вони не вигадуються — їх просто немає в індексі.', '']
    nr = [f for ph in d['files'].values() for f in ph if not f['run']]
    L += [f"## Скрипти: startup {len(d['files']['startup'])}, server {len(d['files']['server'])}; не виконано {len(nr)}", ''] + [f"- {f['file']} — {f.get('why')}" for f in nr] + ['']
    off = [e for e in k['recipes'] if not e['active']]
    L += [f'## Неактивні рецепти KubeJS (мода / типу немає) — {len(off)}', ''] + [f"- `{e['key']}` {e['at']} — {e['why']}" for e in off] + ['']
    warn = [e for e in k['recipes'] if e['active'] and e.get('why')]
    L += [f'## ID поза реєстром предметів (assets) в активних рецептах — {len(warn)} (інформативно: ритуали / пентаклі Occultism, предмети, які мод реєструє кодом — есенції MA тощо; гра пише «0 failed», тобто рецепти завантажились)', ''] + [f"- `{e['key']}` {e['at']} — {e['why']}" for e in warn[:60]] + ['']
    zero = [r for r in k['removes'] if not r['n']]
    L += [f'## remove без збігів — {len(zero)} (рецепта немає в індексі: мод генерує його кодом, мода немає, або рецепт уже неактивний)', '']
    for r in zero:
        f = r['f']; m = re.search(r'"id":"([^"]+)"', f); e = recs.get(m[1]) if m else None
        L.append(f"- {r['at']}: `{f[:110]}`" + (f" — в індексі: {e.get('why0') or e.get('why') or 'активний'}" if e else ''))
    byf = collections.defaultdict(list)
    for x in k['conds_false']: byf[x['at'].rsplit(':', 1)[0]].append(f"{x['at'].rsplit(':', 1)[-1]}:{x['mod']}")
    L += ['', f"## Platform.isLoaded = false — код під цими умовами неактивний ({len(k['conds_false'])} місць у {len(byf)} файлах)", ''] + [f"- {f}: " + ', '.join(sorted(v, key=lambda s: int(s.split(':')[0]) if s.split(':')[0].isdigit() else 0)) for f, v in sorted(byf.items())] + ['']
    L += [f"## Події гри (поведінка під час гри; не рецепти — лише перелік) — {len(k['events'])}", ''] + [f"- {e['ev']} {e['at']} {e['target']}" for e in k['events']] + ['']
    g = collections.defaultdict(set)
    for u in k['unresolved']: g[u['at'].rsplit(':', 1)[0]].add(u['api'].split('(')[0].split('.')[0] + ('…' if '.' in u['api'] else ''))
    L += [f"## Нерозв'язане (Java API / дані гри — пісочниця не відтворює; що від них залежить, в індексі немає) — {len(g)} файлів", ''] + [f"- {f}: {', '.join(sorted(v))}" for f, v in sorted(g.items())]
    L += ['', '  (dynamic_data/read_dynamic_data.js — Gson API; ці файли розбирає extract_recipes.py так само, як скрипт: перша тека = мод, лише якщо мод є)', '']
    L += [f"## Помилки виконання — {len(k['errors'])}", ''] + [f"- {e['at']}: {e['err']}" for e in k['errors']] + ['']
    L += [f"## Теги (ServerEvents.tags): операцій {len(k['tags'])}; реєстр KubeJS (startup): {len(k['registry'])}; generateData: {len(k['data'])}", '']
    open(os.path.join(RAW, 'kubejs_report.md'), 'w', encoding='utf-8').write('\n'.join(L) + '\n')

if __name__ == '__main__': main()
