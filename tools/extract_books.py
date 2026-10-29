# Назви книг-посібників (Patchouli, Modonomicon) з jar модів → raw/books_auto.json: {"ns:книга": {"name": ключ або текст, "jar": …}}.
# Потрібно мосту ATM11-Companion (C2): предмет-книга в інвентарі має компонент patchouli:book / modonomicon:book_id,
# а назву книги дає book.json → name (здебільшого ключ мови; українською — через effective.tsv у build_names.py).
import os, sys, re, json, zipfile, glob
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))   # -I не додає теку скрипта
from common import MODS, RAW, jsave
RX = re.compile(r'^(?:assets|data)/([a-z0-9_.-]+)/(?:patchouli_books|modonomicon/books|modonomicon_books)/([a-z0-9_.-]+)/book\.json$')

def main():
    out = {}
    jars = sorted(glob.glob(os.path.join(MODS, '*.jar')))
    for j in jars:
        try:
            with zipfile.ZipFile(j) as z:
                for n in z.namelist():
                    m = RX.match(n)
                    if not m: continue
                    try: d = json.loads(z.read(n).decode('utf-8-sig'))
                    except Exception: continue
                    name = d.get('name') if isinstance(d, dict) else None
                    if isinstance(name, str) and name:
                        out.setdefault(f'{m.group(1)}:{m.group(2)}', {'name': name, 'jar': os.path.basename(j)})
        except zipfile.BadZipFile:
            continue
    jsave(os.path.join(RAW, 'books_auto.json'), dict(sorted(out.items())))
    print('jar', len(jars), '| книг', len(out))

if __name__ == '__main__': main()
