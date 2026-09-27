#!/usr/bin/env python3
"""Visual audit via Playwright: desktop (1440x900) vs mobile (390x844) for
every page. Checks: horizontal overflow, broken images, failed requests,
console errors, header/nav integrity, tap target sizes, screenshots."""
import json
import os
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8099"
OUT = "/tmp/audit"

pages = ["/"]
for f in sorted(os.listdir(".")):
    if f.endswith(".html"):
        pages.append("/" + f)
for d in ("discography", "books", "artists"):
    for f in sorted(os.listdir(d)):
        if f.endswith(".html"):
            pages.append(f"/{d}/{f}")

VIEWPORTS = [
    {"name": "desktop", "width": 1440, "height": 900},
    {"name": "mobile", "width": 390, "height": 844, "mobile": True},
]

os.makedirs(OUT, exist_ok=True)
report = []

JS = """(() => {
  const de = document.documentElement;
  const overflowX = Math.max(de.scrollWidth, document.body ? document.body.scrollWidth : 0) - window.innerWidth;
  const badImgs = [...document.images]
    .filter(i => i.complete && i.naturalWidth === 0 && i.src && !i.src.startsWith('data:'))
    .map(i => i.getAttribute('src'));
  const header = !!document.querySelector('.site-header');
  const navLinks = [...document.querySelectorAll('.nav-desktop > a')].filter(a => a.offsetParent !== null);
  const navOk = navLinks.every(a => { const r = a.getBoundingClientRect(); return r.height >= 22 && r.width >= 30; });
  const mobMenu = !!document.querySelector('#mobile-toggle');
  const tapTargets = [...document.querySelectorAll('.hero-actions a, .filter-chip, .press-open, .share-btn, .contact-mail')]
    .filter(el => el.offsetParent !== null)
    .filter(el => { const r = el.getBoundingClientRect(); return r.height > 0 && r.height < 26; })
    .length;
  const fontsLoaded = document.fonts ? document.fonts.status : 'na';
  return {
    overflowX, badImgs, header, navLinks: navLinks.length, navOk, mobMenu,
    tapTargets, fontsLoaded,
    hasH1: !!document.querySelector('h1'),
    lang: de.lang,
    title: document.title.slice(0, 60)
  };
})()"""

with sync_playwright() as p:
    browser = p.chromium.launch(args=["--no-sandbox"])
    for vp in VIEWPORTS:
        ctx = browser.new_context(
            viewport={"width": vp["width"], "height": vp["height"]},
            device_scale_factor=3 if vp.get("mobile") else 1,
            is_mobile=vp.get("mobile", False),
            has_touch=vp.get("mobile", False),
        )
        page = ctx.new_page()
        failed = []
        errors = []
        page.on("response", lambda r: failed.append(f"{r.status} {r.url[-70:]}") if r.status >= 400 else None)
        page.on("pageerror", lambda e: errors.append(str(e)[:100]))
        for u in pages:
            failed.clear(); errors.clear()
            try:
                page.goto(BASE + u, wait_until="networkidle", timeout=20000)
            except Exception:
                page.goto(BASE + u, wait_until="load", timeout=20000)
            page.wait_for_timeout(900)
            v = page.evaluate(JS)
            slug = u.strip("/").replace("/", "__").replace(".html", "") or "home"
            page.screenshot(path=f"{OUT}/{vp['name']}__{slug}.jpg", quality=60, type="jpeg", full_page=False)
            issues = []
            if v["overflowX"] > 1: issues.append(f"h-overflow {v['overflowX']}px")
            if v["badImgs"]: issues.append("broken imgs: " + ",".join(v["badImgs"][:3]))
            if not v["header"]: issues.append("header missing")
            if v["navLinks"] and not v["navOk"]: issues.append("nav too small")
            if vp.get("mobile") and not v["mobMenu"]: issues.append("no mobile menu btn")
            if v["tapTargets"] > 0: issues.append(f"small tap targets: {v['tapTargets']}")
            if not v["hasH1"]: issues.append("no h1")
            if errors: issues.append(f"js errors: {len(errors)}")
            if failed: issues.append(f"bad responses: {failed[0]}")
            status = "OK " if not issues else "[!]"
            print(f"{status} {vp['name']:7s} {u:60s} {' | '.join(issues)}")
            report.append({"vp": vp["name"], "page": u, "issues": issues, "metrics": v})
        ctx.close()
    browser.close()

print(f"\n{len(report)} checks. Screenshots in {OUT}")
with open(f"{OUT}/report.json", "w") as f:
    json.dump(report, f, indent=2)
