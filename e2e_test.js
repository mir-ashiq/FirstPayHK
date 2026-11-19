// E2E test suite for FirstPayHK — runs in agent-browser via eval steps
// Verifies: navigation, pay math, allocation, runway, shield (5 examples),
// grow ledger, check-in flow, i18n toggle, journey milestones.

const results = [];
function check(name, cond, detail) {
  results.push({ name, pass: !!cond, detail: detail || "" });
  console.log((cond ? "PASS" : "FAIL") + " | " + name + (detail ? " | " + detail : ""));
}

// 0. Fresh state
localStorage.removeItem("firstpayhk_v1");
STATE.reset();
UI.$("salaryIn").value = 21000;
computePay();

// 1. Boot state
check("self-tests pass", window.__SELFTEST__ && window.__SELFTEST__.okTax && window.__SELFTEST__.okShield,
  JSON.stringify(window.__SELFTEST__));

// 2. Pay screen: default 21000
go("pay");
check("pay: net for 21000", document.getElementById("v_net").textContent === "HK$19,555",
  "got " + document.getElementById("v_net").textContent);
check("pay: mpf 1050", document.getElementById("v_mpf").textContent.includes("1,050"),
  "got " + document.getElementById("v_mpf").textContent);

// 3. Preset 26000
setSalary(26000);
check("pay: net for 26000 = 23,782", document.getElementById("v_net").textContent === "HK$23,782",
  "got " + document.getElementById("v_net").textContent);

// 4. Allocation buckets sum = net (52/23/25)
const bv = ["bv1","bv2","bv3"].map(i => document.getElementById(i).textContent);
check("alloc: three buckets rendered", bv.every(v => v.startsWith("HK$")), bv.join(" / "));
check("alloc: warn below 15% future", (function(){
  document.getElementById("r_need").value = 75; document.getElementById("r_want").value = 23;
  allocChanged();
  const warn = document.getElementById("bk3").classList.contains("warn");
  document.getElementById("r_need").value = 52; document.getElementById("r_want").value = 23;
  allocChanged();
  return warn; })());

// 5. Runway
go("runway");
const big = document.getElementById("runBig").textContent;
check("runway: months shown", /\d/.test(big), big);
check("runway: canvas drawn", (function(){ const c = document.getElementById("runCanvas");
  const d = c.getContext("2d").getImageData(0,0,c.width,c.height).data;
  for (let i = 3; i < d.length; i += 4) if (d[i] > 0) return true; return false; })());

// 6. Shield: all 5 examples via engine + UI
go("shield");
SHIELD.EXAMPLES.forEach((ex, i) => {
  const r = SHIELD.analyze(ex.zh);
  const want = i === 4 ? ["clean", "low"] : ["high"];
  check("shield: example " + i + " level", want.includes(r.level), r.level + " (" + r.score + ")");
});
// UI flow: load example 0 and check output panel visible
loadExample(0);
check("shield: UI output visible", !document.getElementById("shieldOut").classList.contains("hidden"));
check("shield: risk number rendered", document.getElementById("riskNum").textContent === "96",
  "got " + document.getElementById("riskNum").textContent);
check("shield: flags listed", document.querySelectorAll("#flagList .flag").length >= 4,
  document.querySelectorAll("#flagList .flag").length + " flags");
check("shield: actions listed", document.querySelectorAll("#actList .act").length >= 3);

// 7. Rules sub-screen
go("rules");
check("rules: 18 cards", document.querySelectorAll("#rulesList .card").length === 18,
  document.querySelectorAll("#rulesList .card").length + " cards");

// 8. Grow ledger
go("grow");
check("grow: seeded items", document.querySelectorAll("#growList .growitem").length === 2);
document.getElementById("giName").value = "英文商用寫作班";
document.getElementById("giCost").value = "1800";
document.getElementById("giGain").value = "200";
addGrow();
check("grow: add works", document.querySelectorAll("#growList .growitem").length === 3);
check("grow: stats update", document.getElementById("gs_total").textContent === "HK$5,050",
  "got " + document.getElementById("gs_total").textContent);
delGrow(2);
check("grow: delete works", document.querySelectorAll("#growList .growitem").length === 2);

// 9. Check-in growth loop
go("checkin");
document.getElementById("ci_need").value = 9000;
document.getElementById("ci_want").value = 3500;
ciPreview(); saveCheckin();
check("checkin: logged", document.querySelectorAll("#ciHistory .act").length >= 1,
  document.querySelectorAll("#ciHistory .act").length + " rows");

// 10. Journey milestones react (ms4 done via shield, ms5 via grow)
go("home");
check("journey: ms4 done (scam check)", document.getElementById("ms4").classList.contains("done"));
check("journey: ms5 done (grow)", document.getElementById("ms5").classList.contains("done"));

// 11. i18n toggle to EN and back
toggleLang();
check("i18n: EN hero", document.getElementById("t_hero").textContent.includes("first paycheck"));
check("i18n: EN net label", document.getElementById("t_s_net").textContent.includes("take-home"));
check("i18n: EN nav", document.getElementById("brandSub").textContent.includes("90 days"));
const enNet = document.getElementById("v_net").textContent;
toggleLang();
check("i18n: back to ZH", document.getElementById("t_hero").textContent.includes("第一份人工"));
check("i18n: values persist across toggle", document.getElementById("v_net").textContent === enNet);

// 12. Persistence
check("persistence: salary saved", STATE.data.salary === 26000, "saved " + STATE.data.salary);
check("persistence: localStorage used", !!localStorage.getItem("firstpayhk_v1"));

// Summary
const pass = results.filter(r => r.pass).length;
console.log("\n=== E2E SUMMARY: " + pass + "/" + results.length + " passed ===");
JSON.stringify({ pass, total: results.length, fails: results.filter(r => !r.pass) });
