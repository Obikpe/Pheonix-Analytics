# Lesson 14 - Documenting and Presenting Analytical Work

**Course:** ws_01 | **ID:** ws_01_l14 | **Duration:** 18 min | **Level:** Beginner

## Learning Objectives
- Structure analysis so MD understands in 5 minutes.
- Write README, data dictionary, limitations.
- Present with Pyramid Principle.

## 1. Why Documentation Beats Fancy Model

Your analysis will be forgotten in 2 weeks if no one can reproduce it. Good docs = your analysis survives after you leave.

Many analysts send "final_final_v3.xlsx" on WhatsApp with no explanation. MD deletes it. Professional sends: 1-page summary + chart + CSV + README.

<svg width="100%" height="180" viewBox="0 0 700 180" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="180" rx="16" fill="#FFFFFF"/>
  <rect x="20" y="20" width="320" height="140" rx="12" fill="#FEE2E2" stroke="#991B1B" stroke-width="1.5"/>
  <text x="180" y="45" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#7F1D1D">BAD DOCS</text>
  <text x="35" y="75" font-family="Arial" font-size="10" fill="#7F1D1D">- final_final_v3.xlsx</text>
  <text x="35" y="92" font-family="Arial" font-size="10" fill="#7F1D1D">- No source, no date, no owner</text>
  <text x="35" y="109" font-family="Arial" font-size="10" fill="#7F1D1D">- 20 charts, no answer</text>
  <text x="35" y="126" font-family="Arial" font-size="10" fill="#7F1D1D">- WhatsApp forward, lost</text>
  <rect x="360" y="20" width="320" height="140" rx="12" fill="#D1FAE5" stroke="#065F46" stroke-width="1.5"/>
  <text x="520" y="45" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#064E3B">GOOD DOCS</text>
  <text x="375" y="75" font-family="Arial" font-size="10" fill="#064E3B">- README: Question, KPI, source, date</text>
  <text x="375" y="92" font-family="Arial" font-size="10" fill="#064E3B">- Data dictionary: column meanings</text>
  <text x="375" y="109" font-family="Arial" font-size="10" fill="#064E3B">- 1-page summary: Answer first</text>
  <text x="375" y="126" font-family="Arial" font-size="10" fill="#064E3B">- Limitations + next steps</text>
</svg>

## 2. The 4 Documents You Need

1. **README.md:** What question, what KPI, where data came from, when last updated, who to contact, how to refresh.
2. **Data Dictionary:** For each column: meaning, type, example, source. Example: sold_at = datetime when POS completed.
3. **Analysis Log:** What hypothesis you tested, what you found, what you dropped.
4. **Limitations:** "This covers only Surulere branch, Jan-Mar 2024, MTN users only". Prevents over-claim.

Template README:
- Title: Pharmacy Expiry Analysis - Yaba
- Question: What value expired and why?
- KPI: Expiry value Naira
- Data: Excel from pharmacy, Jan-Jun 2024
- Method: MECE by supplier, 80/20 top drugs
- Finding: Supplier A 70% of expiry
- Recommendation: Weekly delivery, alert <45 days
- Limitations: No data for Ibadan branch

## 3. Presenting - Pyramid Principle

MD has 5 minutes. Dont start with methodology. Start with answer.

Top: Recommendation + Impact (30 sec)
Middle: 3 supporting insights with evidence (2 mins)
Bottom: Methodology, limitations, next steps

Bad: "I collected data, cleaned, then plotted..."
Good: "We can cut expiry waste from N200k to N80k by switching Supplier A to weekly delivery. Why: Supplier A causes 70% expiry because 14-day late delivery forces over-order. Evidence: Chart 1... Limitation: Only Yaba branch."

Speak Naira and time, not accuracy.

## 4. Visual Rules

- One chart = one message. Title is the message: "Supplier A causes 70% of expiry", not "Expiry by supplier".
- No 3D charts. No pie with 10 slices.
- Bar for comparison, line for trend.
- Label directly, not legend far away.

Checklist: Can stakeholder understand first slide without you? Is source and date written? Did you state limitation? Did you mask personal data?