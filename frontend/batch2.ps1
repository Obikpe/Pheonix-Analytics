$base = "data/lessons/ws_01-introduction-to-data-science-analytical-thinking"
New-Item -ItemType Directory -Force -Path $base | Out-Null

$c15 = @'
# Lesson 15 - Deliver Your First End to End Analysis

**Course:** ws_01 | **ID:** ws_01_l15 | **Duration:** 25 min | **Level:** Beginner - Capstone

## Learning Objectives
- Deliver full cycle from L05 to L14 in 1 week.
- Ship something MD can use.

## 1. The Full Flow

<svg width="100%" height="210" viewBox="0 0 700 210" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="210" rx="16" fill="#FFFFFF"/>
  <rect x="20" y="20" width="90" height="60" rx="8" fill="#FEF3C7" stroke="#92400E" stroke-width="1.5"/>
  <text x="65" y="42" text-anchor="middle" font-family="Arial" font-size="8" font-weight="800" fill="#78350F">L05</text>
  <text x="65" y="55" text-anchor="middle" font-family="Arial" font-size="7" fill="#78350F">Business Q</text>
  <rect x="125" y="20" width="90" height="60" rx="8" fill="#DBEAFE" stroke="#1E40AF" stroke-width="1.5"/>
  <text x="170" y="42" text-anchor="middle" font-family="Arial" font-size="8" font-weight="800" fill="#1E3A8A">L06</text>
  <text x="170" y="55" text-anchor="middle" font-family="Arial" font-size="7" fill="#1E3A8A">MECE + Hypoth</text>
  <rect x="230" y="20" width="90" height="60" rx="8" fill="#D1FAE5" stroke="#065F46" stroke-width="1.5"/>
  <text x="275" y="42" text-anchor="middle" font-family="Arial" font-size="8" font-weight="800" fill="#064E3B">L07-L08</text>
  <text x="275" y="55" text-anchor="middle" font-family="Arial" font-size="7" fill="#064E3B">Roles + Tools</text>
  <rect x="335" y="20" width="90" height="60" rx="8" fill="#FEE2E2" stroke="#991B1B" stroke-width="1.5"/>
  <text x="380" y="42" text-anchor="middle" font-family="Arial" font-size="8" font-weight="800" fill="#7F1D1D">L09-L10</text>
  <text x="380" y="55" text-anchor="middle" font-family="Arial" font-size="7" fill="#7F1D1D">Ethics + KPI</text>
  <rect x="440" y="20" width="90" height="60" rx="8" fill="#EDE9FE" stroke="#5B21B6" stroke-width="1.5"/>
  <text x="485" y="42" text-anchor="middle" font-family="Arial" font-size="8" font-weight="800" fill="#4C1D95">L12-L14</text>
  <text x="485" y="55" text-anchor="middle" font-family="Arial" font-size="7" fill="#4C1D95">DIKW + Docs</text>
  <rect x="545" y="20" width="135" height="60" rx="8" fill="#111827" stroke="#111827" stroke-width="1.5"/>
  <text x="612" y="42" text-anchor="middle" font-family="Arial" font-size="8" font-weight="800" fill="#FFFFFF">L15 DELIVER</text>
  <text x="612" y="55" text-anchor="middle" font-family="Arial" font-size="7" fill="#FFFFFF">Ship in 1 week</text>
  <text x="20" y="110" font-family="Arial" font-size="9" fill="#111827">Day 1: Pick problem + scope (L13) + KPI + ethics check</text>
  <text x="20" y="130" font-family="Arial" font-size="9" fill="#111827">Day 2: Get data (Excel/CSV) + dictionary + clean in SQL/Excel</text>
  <text x="20" y="150" font-family="Arial" font-size="9" fill="#111827">Day 3: Descriptive (What happened) + 80/20 + MECE charts</text>
  <text x="20" y="170" font-family="Arial" font-size="9" fill="#111827">Day 4: Diagnostic (Why) + test 3 hypotheses + Knowledge</text>
  <text x="20" y="190" font-family="Arial" font-size="9" fill="#111827">Day 5: Wisdom + 1-page summary + README + portfolio post</text>
</svg>

## 2. Day by Day - Pharmacy Example

Day 1 Scope: Pain N200k expiry monthly. Q: What value expired by supplier? KPI: N200k to N80k in 60 days. Ethics: No customer names.

Day 2 Data: Excel purchases (date, supplier, drug, qty, expiry date) and sales (date, drug, qty). Clean duplicates, fix dates, days_to_expiry.

Day 3 Descriptive: Total expired value last 6 months. Bar expired by supplier. Supplier A 70 percent. Pareto Top 5 drugs 80 percent.

Day 4 Diagnostic: Hypothesis Supplier A late delivery leads to over-order leads to expiry. Check lead time 14 days vs 3 days. Correlation 0.72.

Day 5 Wisdom: Switch Supplier A to weekly small orders, alert drugs less than 45 days to expiry. Expected N120k saved. Deliver 1-page PDF plus Excel alert.

## 3. Portfolio Submit

- README with question, KPI, source, date, method, finding, recommendation, limitations
- Data dictionary
- 1-page summary Pyramid Principle
- 2 to 3 charts where title is message
- Clean Excel with alert logic
- 2-min Loom video

No Jupyter with 100 cells. Ship what MD can open on phone.

## 4. Self-Check

Did you define pain in Naira or hours? Did you write 3 analytical questions? Did you use MECE and hypothesis? Did you define KPI and baseline? Did you check ethics? Did you ship in 1 week?
'@

[System.IO.File]::WriteAllText("$base/15-lesson.md", $c15)
Write-Host "15 written - OK" -ForegroundColor Green