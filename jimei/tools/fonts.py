"""Copy only the Noto Serif SC (OFL) woff2 chunks the film needs into fonts/, plus fonts.css.

    python3 tools/fonts.py <@fontsource/noto-serif-sc package dir>
"""
import json, re, shutil, sys, pathlib
pkg = pathlib.Path(sys.argv[1]); here = pathlib.Path(__file__).resolve().parent.parent
tl = json.loads((here / 'film' / 'timeline.json').read_text())
chars = set('极美0123456789《》，。、：——　 ')
for c in tl['captions']: chars |= set(c['text'])
cps = {ord(c) for c in chars}
def covers(rng):
    for part in rng.split(','):
        part = part.strip().replace('U+', '')
        if '-' in part: a, b = [int(x, 16) for x in part.split('-')]
        else: a = b = int(part, 16)
        if any(a <= cp <= b for cp in cps): return True
    return False
out = []
(here / 'fonts').mkdir(exist_ok=True)
for w in (500, 700, 900):
    css = (pkg / f'{w}.css').read_text()
    for block in re.findall(r'@font-face\s*{[^}]*}', css):
        url = re.search(r"url\(\./files/([^)]+\.woff2)\)", block).group(1)
        ur = re.search(r'unicode-range:\s*([^;]+);', block).group(1)
        if covers(ur):
            shutil.copy(pkg / 'files' / url, here / 'fonts' / url)
            out.append("@font-face{font-family:'Noto Serif SC';font-style:normal;font-display:block;font-weight:%d;src:url(./%s) format('woff2');unicode-range:%s;}" % (w, url, ur))
(here / 'fonts' / 'fonts.css').write_text('\n'.join(out) + '\n')
shutil.copy(pkg / 'LICENSE', here / 'fonts' / 'OFL.txt')
print(len(out), 'chunks;', len(chars), 'chars')
