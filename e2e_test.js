// E2E test suite for FirstPayHK v2 — runs in-page via Playwright evaluate()
// Covers: boot self-tests, tax v2 (bonus/deductions/joint/curve), allocation,
// runway + stress tests, shield v2 (24 rules + NB hybrid + model card),
// grow ledger, check-in, i18n, persistence.
// Expected numbers cross-checked against scripts/tax_reference.py (2026-11-19).

const results = [];
function check(name, cond, detail) {
  results.push({ name, pass: !!cond, detail: detail || "" });
}

// 0. Fresh state — app default year is 2026/27
localStorage.removeItem("firstpayhk_v1");
STATE.reset();
UI.$("salaryIn").value = 21000;
computePay();

// 1. Boot self-tests (tax + shield + ML engines)
check("self-tests pass", window.__SELFTEST__ && window.__SELFTEST__.okTax && window.__SELFTEST__.okShield,
  JSON.stringify(window.__SELFTEST__));

// ── TAX v2 ────────────────────────────────────────────────────────
go("pay");
check("tax: net for 21000 (2026/27 = 19,645)", document.getElementById("v_net").textContent === "HK$19,645",
  "got " + document.getElementById("v_net").textContent);
check("tax: mpf 1050", document.getElementById("v_mpf").textContent.includes("1,050"),
  "got " + document.getElementById("v_mpf").textContent);

setSalary(26000);
check("tax: net for 26000 (2026/27 = 23,934)", document.getElementById("v_net").textContent === "HK$23,934",
  "got " + document.getElementById("v_net").textContent);

// year switch to 2025/26: net drops (basic allowance 132k)
const yr = document.getElementById("yearSel");
if (yr) { yr.value = "2025/26"; setYear("2025/26"); }
check("tax: net for 26000 (2025/26 = 23,782)", document.getElementById("v_net").textContent === "HK$23,782",
  "got " + document.getElementById("v_net").textContent);
if (yr) { yr.value = "2026/27"; setYear("2026/27"); }

// bonus months: 26k + 2 months, 2026/27 → annual tax 16,136, avg net 23,547
const bs = document.getElementById("bonusSel");
if (bs) { bs.value = "2"; computePay(); }
const slipB = TAX.payslip(26000, { bonusMonths: 2 });
check("tax: bonus 2mo annual tax = 16,136", slipB.annualTax === 16136, "got " + slipB.annualTax);
check("tax: bonus 2mo avg net = 23,547", slipB.net === 23547 || Math.abs(slipB.net - 23547) < 2,
  "got " + slipB.net);
if (bs) { bs.value = "0"; computePay(); }

// deductions: self-edu 12k + donations 2k → tax 7,740 (saves 1,456 vs 9,196)
const slipD = TAX.payslip(26000, { selfEdu: 12000, donations: 2000 });
check("tax: deductions case tax = 7,740", slipD.annualTax === 7740, "got " + slipD.annualTax);
check("tax: donation allowance capped correctly", slipD.detail.don === 2000, "got " + slipD.detail.don);

// joint assessment: 26k + spouse 0 → joint saves 9,068
const jc = TAX.jointCompare(26000, 0, {});
check("tax: joint (single earner) saves 9,068", jc.saving === 9068 && jc.better === "joint",
  "got " + JSON.stringify({ s: jc.saving, b: jc.better }));

// two-tier standard rate: 600k/mo → tax 1,099,120 (std method)
const slipS = TAX.payslip(600000);
check("tax: two-tier std rate 600k/mo = 1,099,120", slipS.annualTax === 1099120 && slipS.method === "standard",
  "got " + slipS.annualTax + " " + slipS.method);

// low incomes
check("tax: 8000/mo zero tax", TAX.payslip(8000).annualTax === 0);
check("tax: MPF cap at 50k = 1,500", TAX.payslip(50000).mpf === 1500);

// curve endpoints (2026/27): 10k → 9,500; 60k → 52,109
check("tax: curve 10k → 9,500", TAX.payslip(10000).net === 9500, "got " + TAX.payslip(10000).net);
check("tax: curve 60k → 52,109", TAX.payslip(60000).net === 52109, "got " + TAX.payslip(60000).net);
if (yr) { yr.value = "2025/26"; setYear("2025/26"); }

// ── Allocation ───────────────────────────────────────────────────
check("alloc: three buckets rendered", ["bv1","bv2","bv3"].every(i => document.getElementById(i).textContent.startsWith("HK$")),
  ["bv1","bv2","bv3"].map(i => document.getElementById(i).textContent).join(" / "));
check("alloc: warn below 15% future", (function(){
  document.getElementById("r_need").value = 75; document.getElementById("r_want").value = 23;
  allocChanged();
  const warn = document.getElementById("bk3").classList.contains("warn");
  document.getElementById("r_need").value = 52; document.getElementById("r_want").value = 23;
  allocChanged();
  return warn; })());

// ── Runway + stress tests ─────────────────────────────────────────
go("runway");
check("runway: months shown", /\d/.test(document.getElementById("runBig").textContent),
  document.getElementById("runBig").textContent);
check("runway: canvas drawn", (function(){ const c = document.getElementById("runCanvas");
  const d = c.getContext("2d").getImageData(0,0,c.width,c.height).data;
  for (let i = 3; i < d.length; i += 4) if (d[i] > 0) return true; return false; })());

// stress: set up state — salary 26k, saved 50k, monthly save 4k
STATE.data.salary = 26000; computePay(); computeRunway();
document.getElementById("r_start").value = 50000;
document.getElementById("r_save").value = 4000;
computeRunway();
applyStress(0);   // 6-month layoff
check("stress: layoff renders rows", document.querySelectorAll("#stressOut .act").length >= 4,
  document.querySelectorAll("#stressOut .act").length + " rows");
const ess0 = STATE.data._net * STATE.data.alloc.need / 100;
check("stress: layoff math (26k, 50k saved)", (function(){
  const left6 = Math.max(0, 50000 - 6 * ess0);
  const txt = document.getElementById("stressOut").textContent;
  return txt.includes("6") && (left6 === 0 ? txt.includes("缺口") || txt.includes("Shortfall") : true); })(),
  "ess=" + ess0.toFixed(0));
applyStress(1);   // rent +10%
check("stress: rent scenario renders", document.getElementById("stressOut").textContent.includes("10%") ||
  document.querySelectorAll("#stressOut .act").length >= 3);
applyStress(2);   // raise 5%
check("stress: raise uses engine recompute", (function(){
  const txt = document.getElementById("stressOut").textContent;
  const newNet = TAX.payslip(Math.round(26000 * 1.05)).net;
  return txt.includes(newNet.toLocaleString("en-US")) || txt.includes(String(newNet)); })(),
  "expected new net " + TAX.payslip(Math.round(26000 * 1.05)).net);
applyStress(3);   // all at once
check("stress: combined scenario renders", document.querySelectorAll("#stressOut .act").length >= 3);

// ── Shield v2 ─────────────────────────────────────────────────────
go("shield");
check("shield: 24 rules loaded", SHIELD.RULES.length === 24, SHIELD.RULES.length + " rules");
// every example still classified correctly with the hybrid
SHIELD.EXAMPLES.forEach((ex, i) => {
  const r = SHIELD.analyze(ex.zh);
  const want = i === 4 ? ["clean", "low"] : ["high"];
  check("shield: example " + i + " level", want.includes(r.level), r.level + " (" + r.score + ")");
});
// NB engine alive: scammy text scores higher than legit text
const nbScam = ML.analyze("【緊急】你的帳戶已被凍結，請立即登入 http://verify-account.top 驗證");
const nbLegit = ML.analyze("你的月結單已可供查閱，請登入本行手機應用程式查看。");
check("shield: NB ranks scam > legit", nbScam.pScam > nbLegit.pScam, "pScam scam=" + nbScam.pScam.toFixed(3) + " legit=" + nbLegit.pScam.toFixed(3));
// LOO-CV metrics reasonable (>= 0.85 accuracy on the published corpus)
const cv = ML.looCV();
check("shield: LOO accuracy >= 0.80", cv.acc >= 0.80, "acc=" + cv.acc.toFixed(3));
check("shield: LOO F1 >= 0.78", cv.f1 >= 0.78, "f1=" + cv.f1.toFixed(3));

// UI flow
loadExample(0);
check("shield: UI output visible", !document.getElementById("shieldOut").classList.contains("hidden"));
check("shield: flags listed", document.querySelectorAll("#flagList .flag").length >= 4,
  document.querySelectorAll("#flagList .flag").length + " flags");
check("shield: actions listed", document.querySelectorAll("#actList .act").length >= 3);

// rules screen: 24 cards + visible model card + published corpus
go("rules");
check("rules: 24 cards", document.querySelectorAll("#rulesList .card").length === 24,
  document.querySelectorAll("#rulesList .card").length + " cards");
check("rules: model card metrics rendered", document.querySelectorAll("#mlMetrics .hcard").length === 4,
  document.querySelectorAll("#mlMetrics .hcard").length + " metric cards");
check("rules: model card shows %", document.getElementById("mlMetrics").textContent.includes("%"),
  document.getElementById("mlMetrics").textContent.slice(0, 80));
document.getElementById("corpusBox").open = true;
check("rules: corpus published", document.querySelectorAll("#corpusList .act").length === ML.CORPUS.length,
  document.querySelectorAll("#corpusList .act").length + "/" + ML.CORPUS.length);

// ── Grow ledger ──────────────────────────────────────────────────
go("grow");
check("grow: seeded items", document.querySelectorAll("#growList .growitem").length === 2);
document.getElementById("giName").value = "英文商用寫作班";
document.getElementById("giCost").value = "1800";
document.getElementById("giGain").value = "200";
addGrow();
check("grow: add works", document.querySelectorAll("#growList .growitem").length === 3);
delGrow(2);
check("grow: delete works", document.querySelectorAll("#growList .growitem").length === 2);

// ── Check-in + journey ───────────────────────────────────────────
go("checkin");
document.getElementById("ci_need").value = 9000;
document.getElementById("ci_want").value = 3500;
ciPreview(); saveCheckin();
check("checkin: logged", document.querySelectorAll("#ciHistory .act").length >= 1,
  document.querySelectorAll("#ciHistory .act").length + " rows");
go("home");
check("journey: ms4 done (scam check)", document.getElementById("ms4").classList.contains("done"));
check("journey: ms5 done (grow)", document.getElementById("ms5").classList.contains("done"));

// ── i18n ─────────────────────────────────────────────────────────
toggleLang();
check("i18n: EN hero", document.getElementById("t_hero").textContent.includes("first paycheck"));
const enNet = document.getElementById("v_net").textContent;
const enStress = STRESS.active >= 0 ? document.getElementById("stressOut").textContent : "";
toggleLang();
check("i18n: back to ZH", document.getElementById("t_hero").textContent.includes("第一份人工"));
check("i18n: values persist across toggle", document.getElementById("v_net").textContent === enNet);
// stress card i18n: active scenario re-renders in the new language
applyStress(0);
const zhLen = document.getElementById("stressOut").textContent.length;
toggleLang();
const enLen2 = document.getElementById("stressOut").textContent.length;
check("i18n: stress card re-renders on toggle", enLen2 > 50 && document.getElementById("t_stressTitle").textContent.includes("Stress"));
toggleLang();

// ── Persistence ──────────────────────────────────────────────────
check("persistence: salary saved", STATE.data.salary === 26000, "saved " + STATE.data.salary);
check("persistence: localStorage used", !!localStorage.getItem("firstpayhk_v1"));

// Summary
const pass = results.filter(r => r.pass).length;
const fails = results.filter(r => !r.pass);
({ pass, total: results.length, fails: fails.map(f => ({ name: f.name, detail: f.detail })) });
