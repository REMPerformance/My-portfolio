"""Vykreslí všetky *-sN.html v aktuálnom priečinku do out/*.jpg (1080 x 1350). Použitie: python3 render.py [prefix]"""
import glob, os, sys
from playwright.sync_api import sync_playwright
pre = sys.argv[1] if len(sys.argv) > 1 else ""
files = sorted(glob.glob(f"{pre}*-s*.html"), key=lambda f: (f.rsplit("-s", 1)[0], int(f.rsplit("-s", 1)[1].split(".")[0])))
os.makedirs("out", exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1080, "height": 1350})
    for f in files:
        pg.goto("file://" + os.path.abspath(f)); pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(400)
        out = "out/" + f.replace(".html", ".jpg")
        pg.screenshot(path=out, type="jpeg", quality=92); print(out)
    b.close()
