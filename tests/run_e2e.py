#!/usr/bin/env python3
"""Playwright runner for the FirstPayHK E2E suite (portable version).

Resolves paths relative to this file, so it works from any clone of the repo:
    pip install playwright && playwright install chromium
    python3 tests/run_e2e.py

Loads index.html headless, executes e2e_test.js in page context,
prints PASS/FAIL summary. Exit code 1 on any failure or console error."""

import json, sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent      # repo root
SUITE = (ROOT / "tests" / "e2e_test.js").read_text(encoding="utf-8")

def main():
    fails, total = [], 0
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 420, "height": 900})  # phone-first
        console_errors = []
        page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
        page.goto(f"file://{ROOT / 'index.html'}")
        page.wait_for_timeout(400)
        # run the suite in-page; catch mid-run exceptions so we can see where it dies
        result = page.evaluate(f"""
            (() => {{
                try {{ {SUITE}
                    return JSON.stringify({{ pass, total: results.length, fails: results.filter(r => !r.pass).map(f => f.name + " | " + f.detail) }});
                }} catch (e) {{
                    return JSON.stringify({{ error: String(e), stack: e && e.stack, done: results.length }});
                }}
            }})()
        """)
        browser.close()

    data = json.loads(result)
    if "error" in data:
        print("SUITE CRASHED after", data.get("done"), "checks")
        print(data["error"])
        print((data.get("stack") or "")[:800])
        sys.exit(1)
    for r in data["fails"]:
        fails.append(r if isinstance(r, str) else f'{r["name"]} | {r["detail"]}')
    total = data["total"]
    print(f"=== E2E SUMMARY: {data['pass']}/{total} passed ===")
    if fails:
        print("FAILURES:")
        for f in fails:
            print("  FAIL |", f)
    if console_errors:
        print("CONSOLE ERRORS:")
        for e in console_errors[:10]:
            print("  ", e[:200])
    sys.exit(1 if fails or console_errors else 0)

if __name__ == "__main__":
    main()
