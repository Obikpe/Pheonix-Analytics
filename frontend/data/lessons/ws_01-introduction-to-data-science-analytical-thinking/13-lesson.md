# Lesson 13 - Portfolio Project Intro - Pick a Real Problem

**Course:** ws_01 | **ID:** ws_01_l13 | **Duration:** 18 min | **Level:** Beginner

## Learning Objectives
- Pick a portfolio problem that is real, small, and shippable in 1 week.
- Apply L05-L10 to scope project.
- Avoid fake Titanic and Iris projects.

## 1. Why Real Problem > Titanic

Recruiters in Lagos see 100 Titanic notebooks. They ignore them. No business question, no KPI, no stakeholder.

Real problem: "My uncle's pharmacy in Yaba wastes N200k monthly in expired drugs." That has pain, data, KPI, and you can talk about it with passion.

Pick problem where you can get data in 1 day and talk to owner.

<svg width="100%" height="190" viewBox="0 0 700 190" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="190" rx="16" fill="#FFFFFF"/>
  <rect x="20" y="20" width="200" height="150" rx="12" fill="#FEE2E2" stroke="#991B1B" stroke-width="2"/>
  <text x="120" y="45" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#7F1D1D">BAD PROJECT</text>
  <text x="35" y="70" font-family="Arial" font-size="10" fill="#7F1D1D">- Titanic, Iris, Kaggle copy</text>
  <text x="35" y="88" font-family="Arial" font-size="10" fill="#7F1D1D">- No business owner</text>
  <text x="35" y="106" font-family="Arial" font-size="10" fill="#7F1D1D">- No KPI, no impact</text>
  <text x="35" y="124" font-family="Arial" font-size="10" fill="#7F1D1D">- Cant defend in interview</text>
  <rect x="250" y="20" width="200" height="150" rx="12" fill="#D1FAE5" stroke="#065F46" stroke-width="2"/>
  <text x="350" y="45" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#064E3B">GOOD PROJECT</text>
  <text x="265" y="70" font-family="Arial" font-size="10" fill="#064E3B">- Real SME near you</text>
  <text x="265" y="88" font-family="Arial" font-size="10" fill="#064E3B">- Data in 1 day</text>
  <text x="265" y="106" font-family="Arial" font-size="10" fill="#064E3B">- KPI in Naira / hours</text>
  <text x="265" y="124" font-family="Arial" font-size="10" fill="#064E3B">- Ships in 1 week</text>
  <rect x="480" y="20" width="200" height="150" rx="12" fill="#DBEAFE" stroke="#1E40AF" stroke-width="1.5"/>
  <text x="580" y="45" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#1E3A8A">CHECK</text>
  <text x="495" y="70" font-family="Arial" font-size="10" fill="#1E3A8A">- Can I talk to owner?</text>
  <text x="495" y="88" font-family="Arial" font-size="10" fill="#1E3A8A">- Can I get data CSV/Excel?</text>
  <text x="495" y="106" font-family="Arial" font-size="10" fill="#1E3A8A">- Can I measure success?</text>
  <text x="495" y="124" font-family="Arial" font-size="10" fill="#1E3A8A">- Is it ethical?</text>
</svg>

## 2. How to Pick - 3 Sources

1. **Your circle:** POS business, pharmacy, barber, thrift collector (ajo), logistics rider, restaurant. They all have Excel or book.
2. **Your own life:** MTN data usage, transport cost Lagos, betting history.
3. **Public Nigeria data:** NBS, CBN, fuel price, Jumia listings.

Best is 1. You can interview owner and show impact.

## 3. Scoping Template - Use L05 to L10

Fill before touching data:

- **Business Pain (L05):** Who, what, when, cost?
- **Analytical Questions:** Descriptive, Diagnostic, Predictive?
- **MECE + Hypotheses (L06):** 3 buckets, 3 testable hypotheses.
- **Roles (L07):** You are Analyst + Analytics Engineer.
- **Tools (L08):** SQL + Excel + Power BI. Keep boring.
- **Ethics (L09):** Any personal data? How will you mask? NDPA?
- **Success (L10):** KPI from X to Y within Z days as measured by source.
- **DIKW (L12):** What Wisdom action will you recommend?

Example: Pharmacy Yaba
Pain: N200k expiry monthly.
Q: What value expired last 6 months by supplier?
Hypothesis: Supplier A late delivery -> over-order -> expiry.
Tools: Excel + Power BI.
Success: Expiry N200k -> N80k in 60 days.
Ethics: No customer names.

## 4. What Not To Do

- Dont pick "Predict stock market". No data, no owner.
- Dont pick "Build AI that..." Pick "Reduce waste by...".
- Dont pick problem needing real-time API if you have no engineer.

Your task for L15: Pick 1 problem today. Write scoping template in 1 page. Get data tomorrow. Analyze day 3-4. Ship day 5.

Checklist: Problem is real, data accessible in 1 day, KPI in Naira/hours, ethical.