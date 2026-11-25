"""Genera el curso en app/public/curso-ia/ (index.html, admin.html, privacidad.html y fuentes).

Uso, desde la raíz del repositorio:  python curso-ia-fuente/build.py
Después: git add -A && git commit && git push origin master  (Hostinger publica solo).
"""
import json, os, shutil, sys
here = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, here)
from data import WEEKS, L
from extras import EXTRAS
FIREBASE = json.load(open(os.path.join(here, "firebase-config.json"), encoding="utf-8"))
course = {
  "weeks": [{k: w[k] for k in ("n", "title", "color", "tint", "icon", "obj")} for w in WEEKS],
  "lessons": [{"n": i+1, "w": l[0], "title": l[1], "axis": l[2], "concept": l[3], "steps": l[4], "settle": l[5],
               "extra": EXTRAS[i+1]} for i, l in enumerate(L)],
}
safe = lambda o: json.dumps(o, ensure_ascii=False).replace("</", "<\\/")
dest = sys.argv[1] if len(sys.argv) > 1 else os.path.join(here, "..", "app", "public", "curso-ia")
os.makedirs(os.path.join(dest, "fonts"), exist_ok=True)
js = open(os.path.join(here, "app.js"), encoding="utf-8").read()
js = js.replace("/*__DATA__*/null", safe(course)).replace("/*__FIREBASE__*/null", safe(FIREBASE))
page = open(os.path.join(here, "app.template.html"), encoding="utf-8").read().replace("/*__SCRIPT__*/", js)
open(os.path.join(dest, "index.html"), "w", encoding="utf-8").write(page)
adm = open(os.path.join(here, "admin.template.html"), encoding="utf-8").read().replace("/*__FIREBASE__*/null", safe(FIREBASE))
open(os.path.join(dest, "admin.html"), "w", encoding="utf-8").write(adm)
shutil.copy(os.path.join(here, "privacidad.html"), dest)
for f in os.listdir(os.path.join(here, "fonts")):
    shutil.copy(os.path.join(here, "fonts", f), os.path.join(dest, "fonts", f))
print("Curso generado en", os.path.abspath(dest))
