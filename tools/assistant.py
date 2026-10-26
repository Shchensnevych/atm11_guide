# ШІ-помічник путівника ATM11 поруч із грою (CLI + локальний HTTP-міст для веб-панелі #/assistant).
# Бере стан світу з docs/data/progress.json, дорожню карту, моди, квести та останні рядки minecraft/logs/latest.log.
# Підтримує автономний режим (радник + RAG) і зовнішній API-пайплайн користувача (.env з gitignore або Server/.env).
# Запуск:
#   py -I -X utf8 atm11_guide/tools/assistant.py                      — зведення за сейвом і наступні кроки
#   py -I -X utf8 atm11_guide/tools/assistant.py --ask "що далі?"     — RAG + відповідь (з LLM або --no-llm)
#   py -I -X utf8 atm11_guide/tools/assistant.py --serve [--port 8812] — локальний HTTP-міст для браузера
import os, sys, json, re, math, urllib.request, urllib.error
from http.server import BaseHTTPRequestHandler, HTTPServer

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import ROOT, MC, DATA, jload

SERVER_PROJECT_DIR = r'C:\Users\Yurec\OneDrive\Projects\Server'
COMPANION_PROJECT_DIR = r'C:\Users\Yurec\OneDrive\Projects\ATM11-Companion'

PACK_FACTS = [
    {
        'id': 'fact:atm_star',
        'title': 'Чому не крафтиться ATM Star (Зірка ATM) у цій версії?',
        'href': '#/roadmap?node=tr_star',
        'text': ('У поточній бета-версії ATM11 (Minecraft 26.1.2) фінальний рецепт ATM Star прив’язаний до зоряного вівтаря '
                 'Modern Industrialization, але сам мод ще не портовано. Активні лише насіння вимірів, творча есенція '
                 '(Mystical Agriculture) та блоки зірки Незеру 3x. Глава ATM Star прихована («NOT HERE YET»).'),
    },
    {
        'id': 'fact:quarryplus',
        'title': 'Кар’єр QuarryPlus і чому не крафтиться Руйнівник чанків (adv_quarry)',
        'href': '#/mod/quarryplus',
        'text': ('Базовий кар’єр QuarryPlus перенесено в ендгейм (етап 6: усемодій, унобтанієве кайло, кайло зі сплаву затемнення JDT, '
                 'покращений руйнівник JDT, «Покращення: продуктивність омега» ×2). А «Руйнівник чанків» (quarryplus:adv_quarry) '
                 'вимкнено у KubeJS remove("quarryplus:adv_quarry"). На ранніх етапах використовуйте Cobblegen Galore, сита BBL Strainers, GeOre, бджіл та Mystical Agriculture.'),
    },
    {
        'id': 'fact:steel',
        'title': 'Як зробити сталь (Чому не крафтиться сталь MFFS та Oritech)',
        'href': '#/roadmap?node=te_first',
        'text': ('Ручні рецепти сталі MFFS та Oritech прибрані уніфікацією KubeJS. Сталь AllTheOres виплавляється у: '
                 '1) Печі для сплавів (Energized Power), 2) Плавильнику сплавів (Ender IO), 3) Домні (Railcraft Reborn).'),
    },
    {
        'id': 'fact:atm_alloys',
        'title': 'Сплави всемодію (Allthemodium / Vibranium / Unobtainium)',
        'href': '#/mod/powah',
        'text': ('Вібранієво-усемодієвий сплав виготовляється лише у сфері заряджання Powah (1 млрд FE). '
                 'Інші рецепти ATM-сплавів розраховані на Ars Nouveau / Industrial Foregoing, яких у 26.1.2 ще немає.'),
    },
    {
        'id': 'fact:keys_kuma',
        'title': 'Гарячі клавіші та краш Kuma API (Balm / Crafting Tweaks)',
        'href': '#/keys',
        'text': ('Ранець — Миша 4, Curios — Shift+Миша 4 (або Ctrl+G), джетпак — Ctrl+Миша 4, квести — Ctrl+Q, термінал AE2 — Ctrl+E, '
                 'сітка RS — Ctrl+R, пояс — Ctrl+V, шейдери — F8/F10. Модам на Balm (Crafting Tweaks, Inventory Essentials, Waystones, Trash Slot) '
                 'не можна ставити Ctrl/Shift/Alt у options.txt (краш StackOverflowError). Crafting Tweaks у 0.12.0-beta не показує кнопок біля 3×3.'),
    },
]

def load_env():
    """Читає ключі з ATM11-Companion/.env, Server/.env або atm11_guide/.env."""
    env = {}
    for p in (os.path.join(SERVER_PROJECT_DIR, '.env'), os.path.join(COMPANION_PROJECT_DIR, '.env'), os.path.join(ROOT, '.env')):
        if os.path.exists(p):
            for line in open(p, encoding='utf-8', errors='replace'):
                line = line.strip()
                if not line or line.startswith('#') or '=' not in line:
                    continue
                k, v = line.split('=', 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    for k, v in os.environ.items():
        if k in ('TOGETHER_API_KEY', 'OPENROUTER_API_KEY', 'OPENAI_API_KEY', 'DEFAULT_MODEL', 'OLLAMA_URL', 'LOCAL_TEXT_MODEL'):
            env[k] = v
    return env

def stem_uk(w):
    if len(w) <= 3:
        return w
    s = re.sub(r'(ями|ами|ові|еві|ього|ому|им|ім|их|іх|ість|ості|ння|ття|увати|ювати|ати|яти|ити|іти|ою|єю|ах|ях|ів|їв|ей|ам|ям|ом|ем|а|я|о|е|и|і|у|ю|ї|й)$', '', w)
    return s if len(s) >= 3 else w[:3]

def tokenize(text):
    words = re.findall(r'[a-zа-яіїєґ0-9_]+', (text or '').lower().replace("'", '').replace('’', ''))
    out = []
    for w in words:
        if len(w) < 2:
            continue
        out.append(w)
        st = stem_uk(w)
        if len(st) >= 3 and st != w:
            out.append(st)
    return out

def read_log_tail(max_lines=40):
    p = os.path.join(MC, 'logs', 'latest.log')
    if not os.path.exists(p):
        return ''
    try:
        with open(p, 'rb') as f:
            f.seek(0, os.SEEK_END)
            sz = f.tell()
            f.seek(max(0, sz - 24576), os.SEEK_SET)
            lines = f.read().decode('utf-8', errors='replace').splitlines()
            return '\n'.join(lines[-max_lines:])
    except Exception:
        return ''

def analyze_state(world_slug=None):
    prog = jload(os.path.join(DATA, 'progress.json'), {})
    if world_slug and world_slug != prog.get('slug'):
        alt = jload(os.path.join(DATA, 'progress', f'{world_slug}.json'), None)
        if alt:
            prog = dict(alt, default=prog.get('default'), worlds=prog.get('worlds', []))
    roadmap = jload(os.path.join(DATA, 'roadmap.json'), {'nodes': [], 'edges': []})
    stages = jload(os.path.join(DATA, 'stages.json'), {'stages': []}).get('stages', [])
    mods = jload(os.path.join(DATA, 'mods.json'), [])
    items = jload(os.path.join(DATA, 'items.json'), {})
    chapters = jload(os.path.join(DATA, 'chapters.json'), {'chapters': []}).get('chapters', [])

    stage_by_id = {s['id']: s for s in stages}
    mod_by_id = {m['id']: m for m in mods}
    ch_by_file = {c['file']: c for c in chapters}
    q_info = roadmap.get('quest_info') or {}

    q_done = set((prog.get('quests') or {}).get('done') or [])
    q_started = set((prog.get('quests') or {}).get('started') or [])
    t_done = set((prog.get('quests') or {}).get('tasks_done') or [])
    adv_done = set((prog.get('advancements') or {}).get('done') or [])
    obt_items = set((prog.get('items') or {}).get('obtained') or [])

    nodes = roadmap.get('nodes') or []
    edges = roadmap.get('edges') or []

    done_ids = set()
    for n in nodes:
        db = n.get('done_by') or {}
        if any(q in q_done for q in db.get('quests', [])) or any(a in adv_done for a in db.get('advancements', [])) or any(i in obt_items for i in db.get('items', [])):
            done_ids.add(n['id'])

    preds = {n['id']: [] for n in nodes}
    for e in edges:
        if e.get('to') in preds:
            preds[e['to']].append(e)

    done_nodes, avail_nodes, locked_nodes = [], [], []
    for n in nodes:
        nid = n['id']
        if nid in done_ids:
            done_nodes.append(n)
            continue
        p_edges = preds.get(nid, [])
        req = [e for e in p_edges if e.get('kind') == 'req']
        ok = all(e['from'] in done_ids for e in req) if req else (not p_edges or any(e['from'] in done_ids for e in p_edges))
        if ok:
            avail_nodes.append(n)
        else:
            locked_nodes.append(n)

    trunk_next = [n for n in nodes if n.get('trunk') and n['id'] not in done_ids]
    cur_stage_id = trunk_next[0]['stage'] if trunk_next else (avail_nodes[0]['stage'] if avail_nodes else 's0')
    cur_stage = stage_by_id.get(cur_stage_id) or (stages[0] if stages else {'id': 's0', 'n': 0, 'title': 'Старт', 'goal': ''})

    # Деталі розпочатих квестів
    started_details = []
    for ch_file, ch_q in sorted(((prog.get('quests') or {}).get('by_chapter') or {}).items()):
        s_ids = ch_q.get('started') or []
        if not s_ids:
            continue
        ch_data = jload(os.path.join(DATA, 'quests', f'{ch_file}.json'), {})
        q_map = {q['id']: q for q in ch_data.get('quests', [])}
        ch_title = (ch_by_file.get(ch_file) or {}).get('title', ch_file)
        for qid in s_ids:
            q = q_map.get(qid)
            if not q:
                continue
            tasks = []
            for t in q.get('tasks', []):
                td = (t.get('id') in t_done) or (t.get('item') in obt_items) or (t.get('adv') in adv_done)
                cnt_sfx = f" × {t['count']}" if t.get('count') else ''
                t_name = t.get('name') or (t.get('dim') and f"Вимір: {t['dim']}") or (t.get('type') == 'advancement' and 'Виконати досягнення') or t.get('item') or t.get('type')
                lbl = f"{t_name}{cnt_sfx}"
                tasks.append({'text': lbl, 'done': td})
            started_details.append({'id': qid, 'title': q.get('title', qid), 'chapter': ch_file, 'chapter_title': ch_title, 'tasks': tasks})

    return {
        'prog': prog, 'roadmap': roadmap, 'stages': stages, 'mods': mods, 'items': items, 'chapters': chapters,
        'stage_by_id': stage_by_id, 'mod_by_id': mod_by_id, 'q_info': q_info,
        'done_nodes': done_nodes, 'avail_nodes': avail_nodes, 'locked_nodes': locked_nodes,
        'trunk_next': trunk_next, 'cur_stage': cur_stage, 'started_quests': started_details,
    }

def build_corpus(ctx):
    docs = []
    for f in PACK_FACTS:
        docs.append({'id': f['id'], 'kind': 'fact', 'title': f['title'], 'href': f['href'], 'text': f['text']})
    for n in ctx['roadmap'].get('nodes', []):
        st = ctx['stage_by_id'].get(n.get('stage'), {})
        mnames = ', '.join((ctx['mod_by_id'].get(m) or {}).get('name', m) for m in n.get('mods', []))
        docs.append({
            'id': f"node:{n['id']}", 'kind': 'node',
            'title': f"{n['title']} (Етап {st.get('n', '?')}: {st.get('title', '')})",
            'href': f"#/roadmap?node={n['id']}",
            'text': f"{n.get('text', '')} Моди: {mnames}.",
        })
    for m in ctx['mods']:
        if not m.get('uk') and m.get('role') not in ('content', 'addon'):
            continue
        body = ' '.join(filter(None, [
            m.get('uk') or m.get('desc_en') or '',
            ('Можливості: ' + '; '.join(m['what'])) if m.get('what') else '',
            ('Поради: ' + ' '.join(m['tips'])) if m.get('tips') else '',
        ]))
        docs.append({'id': f"mod:{m['id']}", 'kind': 'mod', 'title': m['name'], 'href': f"#/mod/{m['id']}", 'text': body})
    for d in docs:
        toks = tokenize(d['title'] + ' ' + d['text'])
        tf = {}
        for t in toks:
            tf[t] = tf.get(t, 0) + 1
        d['tokens'] = toks
        d['tf'] = tf
    return docs

def search_rag(corpus, query, top_k=6):
    q_toks = tokenize(query)
    if not q_toks:
        return []
    n_docs = len(corpus) or 1
    avg_dl = sum(len(d['tokens']) for d in corpus) / n_docs or 30.0
    idf = {}
    for qt in set(q_toks):
        df = sum(1 for d in corpus if qt in d['tf'])
        idf[qt] = math.log(1.0 + (n_docs - df + 0.5) / (df + 0.5))
    q_low = query.strip().lower()
    scored = []
    for d in corpus:
        dl = len(d['tokens']) or 1
        score = 0.0
        for qt in q_toks:
            f = d['tf'].get(qt, 0)
            if f:
                score += idf[qt] * ((f * 2.2) / (f + 1.2 * (0.25 + 0.75 * (dl / avg_dl))))
        if len(q_low) >= 2 and q_low in d['title'].lower():
            score += 4.0
        if d['kind'] == 'fact' and score > 1.0:
            score += 1.5
        if score > 0.4:
            scored.append((score, d))
    scored.sort(key=lambda x: -x[0])
    return [ {'score': round(s, 2), 'doc': {k: d[k] for k in ('id', 'kind', 'title', 'href', 'text')}} for s, d in scored[:top_k] ]

def format_context_summary(ctx, include_log=False):
    p = ctx['prog']
    items = ctx['items']
    inv = (p.get('items') or {}).get('inventory') or {}
    inv_str = ', '.join(f"{(items.get(k) or {}).get('uk') or k} ×{v}" for k, v in list(inv.items())[:15])
    st = ctx['cur_stage']
    lines = [
        f"Світ: «{p.get('world', '—')}» ({p.get('mode_uk', '—')}, {p.get('play_hours', 0)} год, гра: {p.get('last_played', '—')})",
        f"Гравець: {(p.get('player') or {}).get('name', '—')} | XP: {(p.get('player') or {}).get('xp_level', 0)} | Рівень світу: {(p.get('player') or {}).get('world_tier', 'haven')} | Страв: {(p.get('player') or {}).get('unique_foods', 0)}",
        f"Поточний етап: Етап {st.get('n', 0)} «{st.get('title', '')}» | Віх виконано: {len(ctx['done_nodes'])}/{len(ctx['roadmap'].get('nodes', []))} | Доступно зараз: {len(ctx['avail_nodes'])}",
        f"Виконані віхи: {', '.join(n['title'] for n in ctx['done_nodes']) or 'немає'}",
        f"Наступна віха стовбура: {ctx['trunk_next'][0]['title'] + ' — ' + ctx['trunk_next'][0]['text'] if ctx['trunk_next'] else 'усі виконано'}",
        f"Відкриті віхи розвитку: {', '.join(n['title'] for n in ctx['avail_nodes'][:8])}",
        f"Розпочаті квести ({len(ctx['started_quests'])}): " + ('; '.join(f"«{q['title']}» ({q['chapter_title']})" for q in ctx['started_quests']) or 'немає'),
        f"Інвентар: {inv_str or 'порожньо'}",
    ]
    if include_log:
        lt = read_log_tail(15)
        if lt:
            lines.append(f"Останні рядки latest.log:\n{lt}")
    return '\n'.join(lines)

def call_llm_pipeline(system_prompt, user_prompt, model_override=None):
    """Викликає LLM-пайплайн користувача за зразком ATM11-Companion / Server (.env: Together AI / OpenRouter / Ollama)."""
    env = load_env()
    model = model_override or env.get('DEFAULT_MODEL') or 'deepseek-ai/DeepSeek-V4.1-Flash'
    if model in ('deepseek-ai/DeepSeek-V4-Flash-0731', 'meta-llama/Llama-3.3-70B-Instruct-Turbo'):
        model = 'deepseek-ai/DeepSeek-V4.1-Flash'

    # 1. Якщо модель локальна (local/...) — звертаємось до Ollama
    if model.startswith('local/') or model == env.get('LOCAL_TEXT_MODEL'):
        ollama_url = (env.get('OLLAMA_URL') or 'http://localhost:11434').rstrip('/')
        actual_model = model.replace('local/', '')
        payload = json.dumps({
            'model': actual_model,
            'messages': [{'role': 'system', 'content': system_prompt}, {'role': 'user', 'content': user_prompt}],
            'stream': False,
        }).encode('utf-8')
        req = urllib.request.Request(f'{ollama_url}/api/chat', data=payload, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            msg = ((data.get('message') or {}).get('content') or '').strip()
            msg = re.sub(r'<think>[\s\S]*?</think>', '', msg, flags=re.I).strip()
            return msg, f'Ollama ({actual_model})'

    # 2. Хмарні провайдери (Together AI / OpenRouter) з автоматичним fallback
    candidates = []
    is_together_model = model.startswith('deepseek-ai/') or model.startswith('Qwen/')
    if is_together_model and env.get('TOGETHER_API_KEY'):
        candidates.append(('Together AI', 'https://api.together.xyz/v1/chat/completions', env['TOGETHER_API_KEY'], model, {}))
    if env.get('OPENROUTER_API_KEY'):
        or_model = model if ('/' in model and not is_together_model) else 'qwen/qwen-2.5-72b-instruct'
        candidates.append(('OpenRouter', 'https://openrouter.ai/api/v1/chat/completions', env['OPENROUTER_API_KEY'], or_model, {
            'HTTP-Referer': 'http://localhost:8812', 'X-Title': 'ATM11 Guide Assistant'
        }))
        if or_model != 'deepseek/deepseek-chat':
            candidates.append(('OpenRouter', 'https://openrouter.ai/api/v1/chat/completions', env['OPENROUTER_API_KEY'], 'deepseek/deepseek-chat', {
                'HTTP-Referer': 'http://localhost:8812', 'X-Title': 'ATM11 Guide Assistant'
            }))
    if not is_together_model and env.get('TOGETHER_API_KEY'):
        candidates.append(('Together AI', 'https://api.together.xyz/v1/chat/completions', env['TOGETHER_API_KEY'], 'deepseek-ai/DeepSeek-V4.1-Flash', {}))

    if not candidates:
        raise RuntimeError('Ключі TOGETHER_API_KEY / OPENROUTER_API_KEY не знайдено в .env')

    last_err = None
    for name, url, key, use_model, extra_h in candidates:
        try:
            headers = {'Authorization': f'Bearer {key}', 'Content-Type': 'application/json', 'User-Agent': 'ATM11-Guide/1.0'}
            headers.update(extra_h)
            body_obj = {
                'model': use_model,
                'messages': [{'role': 'system', 'content': system_prompt}, {'role': 'user', 'content': user_prompt}],
                'temperature': 0.35,
                'max_tokens': 1400,
            }
            if use_model in ('deepseek-ai/DeepSeek-V4.1-Flash', 'deepseek-ai/DeepSeek-V4-Pro-0813'):
                body_obj['reasoning_effort'] = 'low'
            payload = json.dumps(body_obj).encode('utf-8')
            req = urllib.request.Request(url, data=payload, headers=headers)
            with urllib.request.urlopen(req, timeout=45) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                choice = (data.get('choices') or [{}])[0]
                msg = ((choice.get('message') or {}).get('content') or choice.get('text') or '').strip()
                msg = re.sub(r'<think>[\s\S]*?</think>', '', msg, flags=re.I).strip()
                if msg:
                    return msg, f'{name} ({use_model})'
        except Exception as e:
            last_err = f'{name} [{use_model}]: {e}'
    raise RuntimeError(f'Усі провайдери повернули помилку ({last_err})')

def serve_bridge(port=8812):
    """Резервний Python HTTP-міст для веб-панелі путівника (#/assistant), якщо не запущено ATM11-Companion."""
    env = load_env()
    provs = [name for name, k in (('Together AI', 'TOGETHER_API_KEY'), ('OpenRouter', 'OPENROUTER_API_KEY'), ('OpenAI', 'OPENAI_API_KEY')) if env.get(k)]

    class Handler(BaseHTTPRequestHandler):
        def _cors(self):
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

        def do_OPTIONS(self):
            self.send_response(204)
            self._cors()
            self.end_headers()

        def do_GET(self):
            if self.path in ('/api/health', '/state'):
                self._json({'ok': True, 'providers': provs, 'defaultModel': 'deepseek-ai/DeepSeek-V4.1-Flash', 'selectedModel': 'deepseek-ai/DeepSeek-V4.1-Flash'})
                return
            self._json({'error': 'Not found'}, 404)

        def do_POST(self):
            length = int(self.headers.get('Content-Length') or 0)
            body = json.loads(self.rfile.read(length).decode('utf-8')) if length else {}
            if self.path == '/api/chat':
                try:
                    sys_p = body.get('systemPrompt') or 'Ти — ШІ-помічник путівника ATM11. Відповідай українською мовою.'
                    usr_p = body.get('userPrompt') or body.get('query') or ''
                    ans, prov = call_llm_pipeline(sys_p, usr_p, body.get('model'))
                    self._json({'answer': ans, 'provider': prov})
                except Exception as e:
                    self._json({'error': str(e)}, 500)
                return
            self._json({'error': 'Not found'}, 404)

        def _json(self, obj, code=200):
            raw = json.dumps(obj, ensure_ascii=False).encode('utf-8')
            self.send_response(code)
            self._cors()
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(raw)))
            self.end_headers()
            self.wfile.write(raw)

        def _file(self, path, mime='application/octet-stream'):
            data = open(path, 'rb').read()
            self.send_response(200)
            self._cors()
            self.send_header('Content-Type', mime)
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def log_message(self, fmt, *args):
            pass

    print(f"[ШІ-міст ATM11]: активний на http://localhost:{port} | провайдери з .env: {', '.join(provs) or 'лише локальний'}")
    HTTPServer(('127.0.0.1', port), Handler).serve_forever()

def main():
    args = sys.argv[1:]
    ask_q = None
    no_llm = '--no-llm' in args
    serve = '--serve' in args
    port = 8812
    world = None
    i = 0
    while i < len(args):
        if args[i] in ('--ask', '-q') and i + 1 < len(args):
            ask_q = args[i + 1]; i += 2
        elif args[i] == '--port' and i + 1 < len(args):
            port = int(args[i + 1]); i += 2
        elif args[i] in ('--world', '-w') and i + 1 < len(args):
            world = args[i + 1]; i += 2
        else:
            i += 1

    if serve:
        serve_bridge(port)
        return

    ctx = analyze_state(world)
    summary = format_context_summary(ctx)
    print(summary)

    if ask_q:
        corpus = build_corpus(ctx)
        hits = search_rag(corpus, ask_q, top_k=5)
        print(f"\n--- RAG-пошук за запитом: «{ask_q}» (знайдено {len(hits)}) ---")
        for h in hits:
            print(f"  * [{h['score']}] {h['doc']['title']} ({h['doc']['href']})\n    {h['doc']['text'][:220]}...")
        if not no_llm:
            env = load_env()
            if any(env.get(k) for k in ('TOGETHER_API_KEY', 'OPENROUTER_API_KEY', 'OPENAI_API_KEY')):
                rag_txt = '\n\n'.join(f"[{h['doc']['title']}]\n{h['doc']['text']}" for h in hits)
                sys_p = ('Ти — ШІ-помічник українського путівника по збірці Minecraft All the Mods 11 (26.1.2). '
                         'Відповідай українською мовою стисло й точно, спираючись на стан сейву та дані путівника.')
                usr_p = f"{summary}\n\nДані путівника:\n{rag_txt}\n\nЗапитання: {ask_q}"
                try:
                    ans, prov = call_llm_pipeline(sys_p, usr_p)
                    print(f"\n--- Відповідь ШІ ({prov}) ---\n{ans}")
                except Exception as e:
                    print(f"\n[Примітка: зовнішній API недоступний ({e}) — вище наведено локальну RAG-відповідь]")

if __name__ == '__main__':
    main()
