#!/usr/bin/env python3
"""Reference computation for FirstPayHK TAX v2 — all expected values for E2E.
Facts (verified 2026-11-19, IRD pam61e + GovHK):
  - Allowances: 2025/26 basic 132,000 / married 264,000; 2026/27 basic 145,000 / married 290,000
  - Progressive bands: 50k x 2/6/10/14/17%
  - Standard rate: two-tier 15% on first 5M net income, 16% on remainder
  - MPF employee: 5%, min income 7,100, cap 30,000/mo -> max 1,500/mo
  - Self-education deduction cap 100,000; donations >=100, cap 35% of income after other deductions
"""
BANDS = [(50000, .02), (50000, .06), (50000, .10), (50000, .14), (float("inf"), .17)]
STD_TIERS = [(5_000_000, .15), (float("inf"), .16)]

def mpf_monthly(m):
    if m < 7100: return 0
    return round(min(m, 30000) * 0.05)

def progressive(nc):
    tax, rem = 0.0, max(0, nc)
    for w, r in BANDS:
        s = min(rem, w); tax += s * r; rem -= s
        if rem <= 0: break
    return tax

def standard(net_income):
    tax, rem = 0.0, net_income
    for w, r in STD_TIERS:
        s = min(rem, w); tax += s * r; rem -= s
        if rem <= 0: break
    return tax

def annual_tax(gross, mpf, self_edu=0, donations=0, basic=145000):
    # donation cap: 35% of income after MPF + self-edu (simplified order)
    don_cap = 0.35 * max(0, gross - mpf - self_edu)
    don = 0 if donations < 100 else min(donations, don_cap)
    deductions = mpf + min(self_edu, 100000) + don
    net_income = max(0, gross - deductions)
    net_chargeable = max(0, net_income - basic)
    prog = progressive(net_chargeable)
    std = standard(net_income)
    return dict(tax=round(min(prog, std)), prog=round(prog), std=round(std),
                net_income=net_income, net_chargeable=net_chargeable, don=don, method="prog" if prog <= std else "std")

def payslip(s, bonus_months=0, self_edu=0, donations=0, basic=145000):
    mpf = (12 + bonus_months) * mpf_monthly(s)
    gross = s * (12 + bonus_months)
    t = annual_tax(gross, mpf, self_edu, donations, basic)
    months = 12 + bonus_months
    return dict(gross=gross, mpf=mpf, tax=t, tax_m=round(t["tax"] / months),
                net_avg=round((gross - mpf - t["tax"]) / months))

B26, B27 = 132000, 145000   # 2025/26 vs 2026/27 basic allowance

print("=== A. Base payslips (no bonus/deductions) ===")
for s in (21000, 26000, 18000):
    for yr, b in (("2025/26", B26), ("2026/27", B27)):
        p = payslip(s, basic=b)
        print(f"{s}/mo {yr}: annual={p['gross']} mpf={p['mpf']} tax={p['tax']['tax']} "
              f"(prog={p['tax']['prog']} std={p['tax']['std']}) taxM={p['tax_m']} net={p['net_avg']}")

print("\n=== B. Bonus: 26,000 + 2 months, 2026/27 ===")
p = payslip(26000, bonus_months=2, basic=B27)
print(f"gross={p['gross']} mpf={p['mpf']} tax={p['tax']['tax']} (prog={p['tax']['prog']} std={p['tax']['std']}) "
      f"taxM={p['tax_m']} avgNet={p['net_avg']}  netInBonusMonths={26000*3 - 1300*2*0 - 0 - round(p['tax']['tax']/14)}")
# honest presentation: avg monthly net across 14 payment months
print(f"  monthly-equivalent net (14-mo avg): {p['net_avg']}")

print("\n=== C. Deductions: 26,000 + self-edu 12,000 + donations 2,000, 2026/27 ===")
p = payslip(26000, self_edu=12000, donations=2000, basic=B27)
print(f"tax={p['tax']['tax']} vs no-deduction {payslip(26000, basic=B27)['tax']['tax']} "
      f"=> saving={payslip(26000, basic=B27)['tax']['tax'] - p['tax']['tax']}")
print(f"  donation allowed: {p['tax']['don']}")

print("\n=== D. Joint assessment 2026/27 (married allowance 290,000) ===")
def joint(A, B):
    mpfA, mpfB = 12*mpf_monthly(A), 12*mpf_monthly(B)
    sepA = annual_tax(A*12, mpfA, basic=B27)["tax"]
    sepB = annual_tax(B*12, mpfB, basic=B27)["tax"]
    jt = annual_tax(A*12 + B*12, mpfA + mpfB, basic=290000)
    return sepA + sepB, jt["tax"], jt
for A, B in ((26000, 0), (26000, 18000), (30000, 28000)):
    sep, j, detail = joint(A, B)
    print(f"A={A} B={B}: separate={sep} joint={j} -> {'JOINT saves ' + str(sep-j) if j < sep else 'SEPARATE saves ' + str(j-sep)} (joint prog={detail['prog']} std={detail['std']})")

print("\n=== E. Two-tier standard rate check: 600,000/mo ===")
p = payslip(600000, basic=B27)
print(f"net_income={p['tax']['net_income']} prog={p['tax']['prog']} std={p['tax']['std']} tax={p['tax']['tax']} method={p['tax']['method']}")
# manual: net = 7.2M - 18k mpf = 7,182,000; std = 5M*.15 + 2.182M*.16 = 750,000 + 349,120 = 1,099,120
print("  manual std check:", 5_000_000*.15 + (7_200_000-18_000-5_000_000)*.16)

print("\n=== F. Net-pay curve 2026/27 (salary -> monthly net) ===")
curve = [(s, payslip(s, basic=B27)["net_avg"]) for s in range(10000, 60001, 5000)]
for s, n in curve: print(f"  {s} -> {n}")
print("\nAll figures rounded per IRD convention (tax rounded to integer).")
