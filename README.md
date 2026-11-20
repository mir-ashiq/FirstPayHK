# FirstPayHK 第一份人工 — Your first paycheck, without the panic.

**SMBP FinHack 2026 · Finance Track (理財賽道)**

A mobile-first web app for final-year Hong Kong students facing their **first paycheck**. One 90-day journey, four money moments: understand your take-home pay, build an emergency runway, check suspicious messages before you pay, and invest in yourself — every number computed from **real Hong Kong rules** (MPF, IRD salaries tax) and real scam data (ADCC).

> Everything runs in **one self-contained HTML file**. No build step, no backend, no API keys, no tracking. Open `index.html` and it works — even offline after first load.

---

## Quick start

```sh
# Option 1: just open it
open index.html            # macOS
start index.html           # Windows
xdg-open index.html        # Linux

# Option 2: serve it (any static server works)
python3 -m http.server 8000
# → http://localhost:8000
```

Demo mode loads a **synthetic persona** ("阿芝 / Cherry", 22, first job HK$21,000) so every screen has data. Use the ↺ Reset button any time. No real personal data is collected — everything stays in your browser's localStorage.

## What's inside (4 pillars + growth loop)

| Pillar | What it does | Real HK rules used |
|---|---|---|
| 💰 **Pay 人工** | Gross → net: MPF + salaries tax computed live, with a printed worked example, **bonus months, self-education & donation deductions, joint-assessment comparison, and a 10k–60k take-home curve** — switchable 2025/26 ⇄ 2026/27 | MPF: 5% employee / 5% employer, floor HK$7,100, cap HK$1,500 (MPFA). Tax: basic allowance HK$132,000 (2025/26) / HK$145,000 (2026/27), married HK$264,000 / HK$290,000, progressive 2/6/10/14/17% vs two-tier standard rate 15%/16% (first HK$5M), lower wins (IRD) |
| ⚖️ **Budget 三個錢桶** | Needs / Wants / Future buckets seeded from real HK graduate costs (not the US 50/30/20) | Rent HK$6,800 (shared flat), food HK$2,800, transport HK$800 (2025–26 student cost surveys) |
| 🛡️ **Runway 跑道** | Emergency-fund target = 3× monthly essentials; survival months; savings trajectory chart; **stress tests: 6-month layoff / rent +10% / raise +5% / all at once** with scenario-specific verdicts | 3–6 month emergency fund guidance (MPFA/IFEC financial-education standard); HK has no statutory unemployment insurance (stated in-app) |
| ✈️ **First-Job Flight Simulator 起飛模擬器** | 18-month month-by-month cash simulation across three life phases — final term 學期 → job hunt 搵工 → employed 開工 — with a **0–100 readiness score**, lowest-balance KPI, survival-buffer days, phase-banded timeline chart with a HK$0 cliff line, 3 HK persona presets (畢業留守者／返鄉候鳥／返學深造), and crisis toggles (offer +2 months, salary −20%, HK$5,000 medical shock). Employed take-home is computed live by the app's own **MPF + salaries-tax engine** — not a hardcoded net number | Move-in cost modelled as **兩按一上** (2 months deposit + 1 month advance on a HK$6,800 shared-flat room); loss of campus meal/transit subsidies (~HK$900/mo) on graduation; HK 2025–26 student cost basket (rent 6,800 / food 2,800 / transport 800 / bills 500) |
| 🚨 **Scam Shield 防騙護盾** | Paste any SMS/WhatsApp → instant risk score 0–100, red-flag phrases, typology, next actions, hotlines. **Hybrid: rules + on-device Naive Bayes** | **24 transparent rules / 5 typologies** built from ADCC-published tactics incl. 2025–26 emerging tactics (deepfake/trojan app, boss impersonation, rental deposit, gift cards) — 43,212 cases in 2025; e-shopping fraud #1 at 12,505 cases / 28.9% |
| 🌱 **Grow 投資自己** | Self-investment ledger with payback math, ROI framing with disclaimers | — |
| 📝 **Weekly Check-in + Quests + 90-day journey** | The habit loop: log weekly spending, complete quests, unlock 6 milestones | — |

Plus: full 繁體中文 ⇄ English toggle, share-your-runway button, and a student-deals starter list (慳家指南).

## The Scam Shield is transparent by design

Every rule is published **in-app** (24 cards with weights and sources) and runs **100% offline** — your messages never leave the device. v2 adds a **hybrid second opinion**: a character-bigram Naive Bayes classifier trained in-browser on a fully published corpus, whose live leave-one-out cross-validation metrics (accuracy / precision / recall / F1) are shown on a **model card** — recomputed on your device every time you open it, not a marketing number. We deliberately kept the explainable rule engine as the backbone for a money-safety tool aimed at scam-wary users, including a **negation guard** so legitimate bank safety notes ("we will never ask for your password") don't trigger false alarms. Limitations are stated in-app: educational use, not a guarantee; novel tactics can bypass rules; always verify via official channels.

## Architecture

Single file, modular inside:

```
index.html
├── STATE    — persistence + synthetic demo seed (localStorage)
├── TAX      — IRD-method salaries tax + MPF (band-by-band, self-tested)
├── BUDGET   — HK-realistic bucket engine
├── RUNWAY   — emergency-fund math
├── FLIGHT   — 18-month first-job flight simulator (phases, readiness score, crises)
├── SHIELD   — 24-rule transparent scam engine + 5 worked examples
├── ML       — on-device Naive Bayes (binarized bigrams, LOO-CV model card)
├── STRESS   — bad-day scenarios on top of RUNWAY + TAX engines
├── GROW     — ledger stats
├── I18N     — full zh/en string tables
└── UI       — rendering, journey, navigation
```

**Self-tests run on every load** (`window.__SELFTEST__` in the console): tax engine against IRD-verified cases (2025/26 and 2026/27, bonus, deductions, joint assessment, two-tier standard rate), shield engine against the 5 worked examples, ML LOO-CV quality gate, and the flight simulator's cash-walk invariants (deposit timing, crisis deltas, phase math). **66/66 automated E2E checks pass** — 52 legacy checks (navigation, tax v2 math, stress scenarios, hybrid shield + model card + published corpus, ledger, check-in, i18n, persistence) plus 14 flight-simulator checks (engine matches an independent reference implementation, personas, all three crises, readiness bounds, canvas rendering, bilingual switch). Expected values cross-checked against an independent Python reference implementation (`scripts/tax_reference.py` in the build repo).

## Data & assumptions

- Tax: default 2026/27 (allowance HK$145,000) with 2025/26 switchable; bonus months, self-education (cap HK$100,000) and approved charity donations (min HK$100, cap 35%) modelled; joint assessment compared on demand (married allowance HK$290,000). Two-tier standard rate applies above HK$5M net income. Printed under the payslip with the IRD link.
- MPF: relevant income capped at HK$30,000/month; employer contribution shown for education.
- Scam stats: HK Police ADCC 2025 figures (43,212 cases, ~HK$8.1bn losses; e-shopping 12,505 cases).
- Salaries: HKU 2025 survey median HK$26,000 (full-time bachelor); average graduate job HK$20,961 (JobsDB 2026).
- All demo data is synthetic (rule 5, fair participation).

## Costs (unit economics)

| Item | Cost |
|---|---|
| Hosting (GitHub Pages / any static host) | **HK$0 / month** |
| LLM API | **HK$0** (no cloud AI in product by design — the on-device Naive Bayes runs free in the browser) |
| Per-user cost | ~HK$0 (one static file, no server compute) |
| Custom domain (optional; the default github.io URL is free) | ~HK$80 / year |
| Team labour | Volunteer (hackathon build) — the real cost, and it's already paid |
| **Year-one total** | **HK$0 with the free github.io URL; < HK$100 with a custom domain** |

Honest framing: this is a lean MVP, not a zero-cost fantasy — if a hosted-LLM tier were added later (optional second opinion), it would cost under ~HK$0.10/user/month at student scale, and content updates (new scam rules, tax-year bumps) need a human once per tax year (~1 hour).

## Limitations (honest list)

1. Tax engine models salary income with MPF/bonus/deductions/joint assessment; other income types (property, dividends), provisional tax timing and tax reduction rebates are out of scope (stated in-app).
2. Scam Shield is educational heuristics + a small-corpus statistical model (LOO accuracy ~84%, F1 ~86% on 73 published messages) — it cannot catch novel scams and does not replace official verification (disclaimer in-app).
3. No bank connectivity/open banking — by design for a 48-hour build and privacy.
4. Journey day-counter advances via demo interactions (disclosed); a real product would use real dates.
5. "Expected monthly return" in Grow is the user's own estimate; the app makes no income guarantees.

## AI tools and usage (mandatory disclosure)

| Tool | Role |
|---|---|
| ZCode agent (GLM) | Ideation, app scaffolding, bilingual copy drafting, README editing, E2E test authoring — all code reviewed, tested, and bug-fixed by the team |
| Red-team LLM panel (via z-ai SDK, 3 independent reviewer personas + chair) | Adversarial review of our plan (round 1), the built app (round 2) and the v2 upgrade (round 3); we verified every claim — including rejecting one incorrect "tax error" claim after band-by-band recomputation |

**In-product: no black-box AI.** The Scam Shield is a deterministic, fully explainable rule engine — a deliberate trust decision for a money-safety tool, disclosed here and in-app.

## Team & event

Built for **SMBP FinHack 2026** (Small Money, Big Plan × GeNew Technology), 48-hour build 19–21 Nov 2026, Finance Track. All work in this repository was produced during the event window (see commit history).

---

*Educational tool. Not financial, tax, or legal advice. Verify with IRD, MPFA, and your bank.*
