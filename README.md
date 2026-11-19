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
| 💰 **Pay 人工** | Gross → net: MPF + salaries tax computed live, with a printed worked example | MPF: 5% employee / 5% employer, floor HK$7,100, cap HK$1,500 (MPFA). Tax: basic allowance HK$132,000, progressive 2/6/10/14/17% vs 15% standard rate, lower wins (IRD 2025/26) |
| ⚖️ **Budget 三個錢桶** | Needs / Wants / Future buckets seeded from real HK graduate costs (not the US 50/30/20) | Rent HK$6,800 (shared flat), food HK$2,800, transport HK$800 (2025–26 student cost surveys) |
| 🛡️ **Runway 跑道** | Emergency-fund target = 3× monthly essentials; "how long can you survive" months; 6-month savings trajectory chart | 3–6 month emergency fund guidance (MPFA/IFEC financial-education standard) |
| 🚨 **Scam Shield 防騙護盾** | Paste any SMS/WhatsApp → instant risk score 0–100, red-flag phrases, typology, next actions, hotlines | 18 transparent rules / 5 typologies built from ADCC-published tactics (43,212 cases in 2025; e-shopping fraud #1 at 12,505 cases / 28.9%) |
| 🌱 **Grow 投資自己** | Self-investment ledger with payback math, ROI framing with disclaimers | — |
| 📝 **Weekly Check-in + Quests + 90-day journey** | The habit loop: log weekly spending, complete quests, unlock 6 milestones | — |

Plus: full 繁體中文 ⇄ English toggle, share-your-runway button, and a student-deals starter list (慳家指南).

## The Scam Shield is transparent by design

Every rule is published **in-app** (18 cards with weights and sources) and runs **100% offline** — your messages never leave the device. We deliberately chose an explainable rule engine over a black-box LLM for a money-safety tool aimed at scam-wary users, including a **negation guard** so legitimate bank safety notes ("we will never ask for your password") don't trigger false alarms. Limitations are stated in-app: educational use, not a guarantee; novel tactics can bypass rules; always verify via official channels.

## Architecture

Single file, modular inside:

```
index.html
├── STATE    — persistence + synthetic demo seed (localStorage)
├── TAX      — IRD-method salaries tax + MPF (band-by-band, self-tested)
├── BUDGET   — HK-realistic bucket engine
├── RUNWAY   — emergency-fund math
├── SHIELD   — 18-rule transparent scam engine + 5 worked examples
├── GROW     — ledger stats
├── I18N     — full zh/en string tables
└── UI       — rendering, journey, navigation
```

**Self-tests run on every load** (`window.__SELFTEST__` in the console): tax engine against verified cases (HK$5,000 / 8,000 / 21,000 / 26,000 / 50,000), shield engine against the 5 worked examples. 32/32 automated E2E checks pass (navigation, math, examples, ledger, check-in, i18n, persistence).

## Data & assumptions

- Tax: annual salary, no bonus, single (non-joint) assessment, MPF mandatory contributions deducted. Printed under the payslip with the IRD link.
- MPF: relevant income capped at HK$30,000/month; employer contribution shown for education.
- Scam stats: HK Police ADCC 2025 figures (43,212 cases, ~HK$8.1bn losses; e-shopping 12,505 cases).
- Salaries: HKU 2025 survey median HK$26,000 (full-time bachelor); average graduate job HK$20,961 (JobsDB 2026).
- All demo data is synthetic (rule 5, fair participation).

## Costs (unit economics)

| Item | Cost |
|---|---|
| Hosting (GitHub Pages / any static host) | **HK$0 / month** |
| LLM API | **HK$0** (no black-box AI in product by design) |
| Per-user cost | ~HK$0 (one static file) |
| Optional custom domain | ~HK$80 / year |
| **Year-one total** | **< HK$100** |

If a hosted-AI tier were added later (optional LLM second opinion), cost would stay under ~HK$0.10/user/month at student scale.

## Limitations (honest list)

1. Tax engine covers standard single-assessment employment; bonuses, joint assessment, and other deductions are out of scope (stated in-app).
2. Scam Shield is educational heuristics from published tactics — it cannot catch novel scams and does not replace official verification (disclaimer in-app).
3. No bank connectivity/open banking — by design for a 48-hour build and privacy.
4. Journey day-counter advances via demo interactions (disclosed); a real product would use real dates.
5. "Expected monthly return" in Grow is the user's own estimate; the app makes no income guarantees.

## AI tools and usage (mandatory disclosure)

| Tool | Role |
|---|---|
| ZCode agent (GLM) | Ideation, app scaffolding, bilingual copy drafting, README editing, E2E test authoring — all code reviewed, tested, and bug-fixed by the team |
| Red-team LLM panel (via z-ai SDK, 3 independent reviewer personas + chair) | Adversarial review of our plan (round 1) and the built app (round 2); we verified every claim — including rejecting one incorrect "tax error" claim after band-by-band recomputation |

**In-product: no black-box AI.** The Scam Shield is a deterministic, fully explainable rule engine — a deliberate trust decision for a money-safety tool, disclosed here and in-app.

## Team & event

Built for **SMBP FinHack 2026** (Small Money, Big Plan × GeNew Technology), 48-hour build 19–21 Nov 2026, Finance Track. All work in this repository was produced during the event window (see commit history).

---

*Educational tool. Not financial, tax, or legal advice. Verify with IRD, MPFA, and your bank.*
