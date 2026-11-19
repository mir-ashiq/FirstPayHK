# Devpost Submission Kit — FirstPayHK 第一份人工

Copy-paste-ready sections for the Devpost form (~200 words each, as required).

---

## Problem Introduction (~200 words)

**Target users:** final-year Hong Kong university students about to receive their first salary — "Cherry", 22, graduating into a HK$20,961 average graduate job (HK$26,000 median for HKU 2025 full-time bachelor graduates).

**The problem:** the first paycheck is the single most consequential money event of a student's life — and Hong Kong students meet it financially unprepared. Campus life never teaches what a payslip means: why HK$1,050 disappears into MPF, how salaries tax is computed, what "take-home" actually is. Rent for a shared flat (HK$6,500–8,000) alone swallows 30–40% of a graduate salary, so US-style budgeting rules like 50/30/20 simply do not apply here. Meanwhile, first earners are prime fraud targets: Hong Kong recorded 43,212 deception cases in 2025 with losses around HK$8.1 billion, and e-shopping fraud — the scam students fall for most — was the most prevalent category at 12,505 cases (28.9%).

**Why it matters:** the money habits formed in the first 90 days of earning — spending blind, saving nothing, trusting the wrong message — compound for years. Existing expense apps are either Taiwan-market products, generic trackers with no Hong Kong rules, or black-box "AI detectors" students can't verify. Nobody walks a Hong Kong first-earner through the whole journey: pay → runway → scam defense → self-investment.

## Solution Introduction (~200 words)

**FirstPayHK 第一份人工** is a mobile-first web app that turns a student's first paycheck into one guided 90-day journey, with every number computed from real Hong Kong rules.

Four moments, one flow: **(1) Pay 人工** — enter your salary, see true take-home pay with MPF (5%, HK$1,500 cap) and IRD salaries tax (HK$132,000 allowance, progressive 2/6/10/14/17% vs 15% standard, lower wins) computed live, with a printed worked example. **(2) Runway 跑道** — an emergency-fund simulator: target = 3× monthly essentials; visualises "how many months could you survive without a job" and the savings path to get there. **(3) Scam Shield 防騙護盾** — paste any suspicious SMS/WhatsApp; an 18-rule transparent engine (built from ADCC-published tactics across 5 typologies) returns an instant 0–100 risk score, the exact red-flag phrases, typology, next actions and hotlines (18222). **(4) Grow 投資自己** — a self-investment ledger with payback math. A weekly check-in, quests, and a 6-milestone journey ring make it a habit, not a one-shot calculator.

Built during the event: the full single-file app (4 pillars, bilingual 繁中/English, offline, localStorage persistence), the tax/MPF engine, all 18 scam rules, E2E tests — all verified by 32 automated checks.

## Technical Introduction (~200 words)

**Architecture:** one self-contained `index.html` (~90KB) — no build step, no backend, no dependencies, no API keys. Modular inside: `STATE` (localStorage + synthetic demo seed), `TAX`, `BUDGET`, `RUNWAY`, `SHIELD`, `GROW`, `I18N`, `UI`. Runs offline after first load; works on any phone browser.

**Languages/frameworks:** vanilla HTML/CSS/JS (ES6). Charts drawn with hand-rolled Canvas. No frameworks — a deliberate choice so the demo can never break from a network or dependency failure, and hosting costs HK$0 on GitHub Pages.

**Data sources:** IRD 2025/26 tax rates & allowances; MPFA contribution rules; HK Police ADCC 2025 scam statistics; HKU 2025 graduate employment survey & JobsDB 2026 figures; 2025–26 Hong Kong student cost-of-living guides. All demo data is synthetic.

**Key engineering:** the tax engine implements the exact IRD method (annual gross − mandatory MPF − basic allowance → banded progressive vs standard rate) and self-tests on every load against 5 salary cases; the scam engine includes a negation guard so legitimate bank safety notes ("we never ask for your password") don't false-positive. `window.__SELFTEST__` exposes boot verification; 32 E2E checks pass.

**Deployment:** open `index.html` or any static server. **Limitations:** single-assumption tax model (no bonus/joint assessment); rule-based scam heuristics can't catch novel tactics; no open banking.

## AI Tools and Usage

- **ZCode agent (GLM)** — ideation, code scaffolding, bilingual copy drafting, README editing, E2E test authoring. All code was reviewed, tested, and debugged by the team during the event.
- **Red-team LLM panel** (z-ai SDK; 3 independent reviewer personas + chair synthesis) — adversarial reviews of our plan (round 1) and the built app (round 2). Every claim was verified by the team; one incorrect "tax error" claim was rejected after band-by-band recomputation.
- **In-product: no black-box AI.** The Scam Shield is a deterministic, fully explainable rule engine — a deliberate trust decision for a money-safety tool.

---

# 5-Minute Demo Video Script

**Style:** phone-screen recording + voiceover (Cantonese-accented English or 繎體中文, matching on-screen language toggle). Total 4:50.

| Time | Beat | On screen | Voiceover |
|---|---|---|---|
| 0:00–0:20 | Hook | Fake SMS notification pops up: "【香港郵政】你的包裹因未付運費 HK$2.5 滯留，24小時內到 hkpost-pay.example 繳費" then salary alert: "你的薪資 HK$21,000 已入帳" | "Your first salary lands in your account. Three months earlier, you'd have no idea what to do with it. And this — this is trying to steal it." |
| 0:20–0:50 | Problem | Home screen: 90-day journey ring, badges, HK stats | "Hong Kong logged 43,212 scam cases last year — eight-point-one billion dollars lost. Average graduate pay: under HK$21,000. The first 90 days of earning shape the next ten years. FirstPayHK walks the whole journey." |
| 0:50–1:50 | Pillar 1: Pay | Tap 人工. Type 21000. Payslip animates: gross → −MPF 1,050 → −tax 395 → net 19,555. Scroll to worked example. Tap preset 26,000 → numbers update | "Enter your salary. Real rules, not guesses: MPF at five percent, salaries tax computed exactly like the IRD does it — allowance, bands, and the lower of progressive versus standard rate. The worked example is printed right there, because you should be able to check us." |
| 1:50–2:30 | Pillar 2: Budget + Runway | Drag buckets slider; warning fires at future<15%. Tap 跑道: runway months animate, savings trajectory chart draws | "Not the American 50/30/20 — Hong Kong rent eats forty percent of your pay. Then the question that matters: if the job disappears, how many months can you survive? That number is your runway." |
| 2:30–3:30 | Pillar 3: Scam Shield (money shot) | Tap 防騙. Paste the hook SMS. Risk ring sweeps to 96, red flags listed one by one, typology tag, actions, hotlines. Then paste a real bank SMS → CLEAN 0 | "Now paste that suspicious message. Ninety-six — very likely a scam. Every rule that fired is listed with its reason: urgency, fake HK Post domain, small-fee bait. And it works offline — your message never leaves your phone. A real bank SMS? Clean. Our rules handle even the tricky cases." |
| 3:30–4:00 | Pillar 4: Grow + habit loop | Tap 成長: ledger with payback. Tap 記錄: weekly check-in, quests complete, journey ring advances D30→D60 | "Investing in yourself is the highest-return asset a student has — log it, see the payback. Weekly check-ins and quests make it a habit: the journey ring keeps moving." |
| 4:00–4:25 | Costs & honesty | README cost table on screen: HK$0/month, <HK$100/year. Limitations list | "It costs nothing to run — one file, no backend. And we're honest about what it can't do: no bonuses in the tax model, heuristics can't catch every scam. Check us — everything is published." |
| 4:25–4:50 | Close | Language toggles to English mid-screen; share button; logo | "Your first paycheck, without the panic. FirstPayHK — 第一份人工，唔使驚。" |

**Recording notes:** record at 1080p phone aspect or responsive desktop; pre-seed demo state; do ONE full take of the scam check live (it's instant — no network); keep every click visible ≥1s.
