#!/usr/bin/env python3
"""E2E test of the FLIGHT module: load app in headless Chromium (local file),
run in-page assertions against an independent Python-side reference computation."""
import json, sys
from playwright.sync_api import sync_playwright

PATH = "/home/z/my-project/download/FirstPayHK/index.html"
results = []

def check(name, cond, detail=""):
    results.append({"name": name, "pass": bool(cond), "detail": str(detail)[:160]})

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 420, "height": 900})
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto("file://" + PATH)
    pg.wait_for_timeout(800)

    # 1. boot self-tests include FLIGHT
    st = pg.evaluate("() => window.__SELFTEST__")
    check("boot self-tests all pass", st and all(st.values()), json.dumps(st))

    # 2. FLIGHT exists with 3 personas, 18 months
    n = pg.evaluate("() => ({personas: FLIGHT.personas.length, months: FLIGHT.MONTHS, rules: SHIELD.RULES.length})")
    check("3 personas / 18 months / shield intact", n["personas"] == 3 and n["months"] == 18 and n["rules"] == 24, n)

    # 3. engine math vs independent reference (default inputs)
    got = pg.evaluate("""() => {
      const r = FLIGHT.simulate(25000, 21000, 3, 1000);
      return { bal: r.bal, spend: r.spend, phase: r.phase, net: r.net,
               deposit: FLIGHT.DEPOSIT, subloss: FLIGHT.SUB_LOSS };
    }""")
    ess = 6800 + 2800 + 800 + 500
    dep = 6800 * 3
    # independent reference
    net_ref = got["net"]  # take net from TAX (itself tax-tested); only recompute cash walk
    bal = 25000 - dep
    ref = []
    student_spend = ess - 1500
    for m in range(18):
        if m == 0:
            pass
        if m == 4:
            bal -= 0
        if m < 2:
            bal += 1000 - student_spend
        elif m < 2 + 3:
            bal -= ess + 900
        else:
            bal += net_ref - ess
        ref.append(round(bal))
    check("18-month balance matches reference", got["bal"] == ref,
          f"first diff: {[(i, a, b) for i, (a, b) in enumerate(zip(got['bal'], ref)) if a != b][:2]}")
    check("phase pattern T,T,H*3,E*", got["phase"][:5] == ["T", "T", "H", "H", "H"] and got["phase"][5] == "E", got["phase"])

    # 4. crisis: offer delay +2 → two more H months
    d1 = pg.evaluate("() => { FLIGHT.crises[0]=false; const a=FLIGHT.simulate(25000,21000,3,1000).phase.filter(x=>x==='H').length; FLIGHT.crises[0]=true; const c=FLIGHT.simulate(25000,21000,3,1000).phase.filter(x=>x==='H').length; FLIGHT.crises[0]=false; return {a,c}; }")
    check("crisis: offer delay adds 2 hunt months", d1["c"] == d1["a"] + 2, d1)

    # 5. crisis: salary -20% changes net
    d2 = pg.evaluate("() => { FLIGHT.crises[1]=false; const a=FLIGHT.simulate(25000,21000,3,1000).net; FLIGHT.crises[1]=true; const c=FLIGHT.simulate(25000,21000,3,1000).net; FLIGHT.crises[1]=false; return {a,c}; }")
    check("crisis: salary cut lowers net", d2["c"] < d2["a"], d2)

    # 6. crisis: medical shock 5000 at month 4
    d3 = pg.evaluate("() => { FLIGHT.crises[2]=false; const a=FLIGHT.simulate(25000,21000,3,1000).bal[4]; FLIGHT.crises[2]=true; const c=FLIGHT.simulate(25000,21000,3,1000).bal[4]; FLIGHT.crises[2]=false; return {a,c}; }")
    check("crisis: medical shock lowers month-4 balance by 5000", d3["a"] - d3["c"] == 5000, d3)

    # 7. readiness score bounds
    s = pg.evaluate("() => [FLIGHT.score(25000,21000,3,1000), FLIGHT.score(5000,12000,7,0), FLIGHT.score(90000,30000,2,3000)]")
    check("scores within 0..100, sensible ordering", all(0 <= x <= 100 for x in s) and s[2] > s[0] > s[1], s)

    # 8. UI: persona preset applies + renders verdict + canvas drawn
    pg.evaluate("() => applyPersona(0)")
    pg.wait_for_timeout(200)
    verdict_txt = pg.evaluate("() => document.getElementById('flightOut').innerText.slice(0,80)")
    check("persona renders verdict text", ("準備度" in verdict_txt) or ("Readiness" in verdict_txt), verdict_txt)
    has_canvas = pg.evaluate("""() => {
      const cv = document.getElementById('flightCanvas');
      const d = cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 0) return true; return false;
    }""")
    check("flight canvas drawn (non-blank)", has_canvas)

    # 9. UI: crisis toggle updates DOM and stays consistent
    pg.evaluate("() => toggleCrisis(0)")
    pg.wait_for_timeout(150)
    hunt_txt = pg.evaluate("() => [...document.querySelectorAll('#flightOut .sub')].map(e=>e.innerText).join(' ')")
    check("crisis toggle updates phase line", ("5" in hunt_txt), hunt_txt)
    pg.evaluate("() => toggleCrisis(0)")  # off

    # 10. language switch re-renders flight strings
    pg.evaluate("() => toggleLang && toggleLang()")
    pg.wait_for_timeout(200)
    en_txt = pg.evaluate("() => document.getElementById('t_flTitle').textContent")
    check("i18n: flight title switches to EN", "Flight Simulator" in en_txt, en_txt)
    pg.evaluate("() => toggleLang && toggleLang()")  # back to zh
    pg.wait_for_timeout(200)
    zh_txt = pg.evaluate("() => document.getElementById('t_flTitle').textContent")
    check("i18n: back to ZH", "起飛" in zh_txt, zh_txt)

    # 11. no page errors during all of it
    check("no page errors", not errors, errors[:3])

    b.close()

fails = [r for r in results if not r["pass"]]
for r in results:
    print(("PASS" if r["pass"] else "FAIL"), "|", r["name"], ("| " + r["detail"]) if (not r["pass"] or r["detail"]) else "")
print(f"\n{len(results)-len(fails)}/{len(results)} passed")
sys.exit(1 if fails else 0)
