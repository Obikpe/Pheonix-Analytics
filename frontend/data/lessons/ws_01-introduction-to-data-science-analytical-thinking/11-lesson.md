# Lesson 11 - Case Studies - Real Wins and Failures

**Course:** ws_01 | **ID:** ws_01_l11 | **Duration:** 20 min | **Level:** Beginner

## Learning Objectives
- Extract pattern from wins and failures.
- Explain why most projects fail before model.
- Apply lessons to your first project.

## 1. Win - Paystack Fraud Detection

Problem: Fraudulent transactions using stolen cards.
Data: Transaction amount, device, time, past behavior.
Analytical Question: Is this transaction different from this user's past pattern?

Win Pattern:
- Started with rule: block amount >3x user's avg in last 30 days + new device. Shipped in 1 day.
- Then added ML to reduce false positives.
- Metric: Fraud loss Naira down, good user block rate <1%.

Lesson: Rule first, ML second. Ship fast, measure Naira, not accuracy.

<svg width="100%" height="160" viewBox="0 0 700 160" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="160" rx="16" fill="#FFFFFF"/>
  <rect x="20" y="20" width="200" height="120" rx="10" fill="#D1FAE5" stroke="#065F46" stroke-width="1.5"/>
  <text x="120" y="45" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#064E3B">WIN PATTERN</text>
  <text x="35" y="70" font-family="Arial" font-size="10" fill="#064E3B">• Rule first, ships day 1</text>
  <text x="35" y="88" font-family="Arial" font-size="10" fill="#064E3B">• Measure Naira / time</text>
  <text x="35" y="106" font-family="Arial" font-size="10" fill="#064E3B">• Then improve with ML</text>
  <rect x="250" y="20" width="200" height="120" rx="10" fill="#FEE2E2" stroke="#991B1B" stroke-width="1.5"/>
  <text x="350" y="45" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#7F1D1D">FAIL PATTERN</text>
  <text x="265" y="70" font-family="Arial" font-size="10" fill="#7F1D1D">• Start with complex ML</text>
  <text x="265" y="88" font-family="Arial" font-size="10" fill="#7F1D1D">• No business question</text>
  <text x="265" y="106" font-family="Arial" font-size="10" fill="#7F1D1D">• Never ships</text>
  <rect x="480" y="20" width="200" height="120" rx="10" fill="#DBEAFE" stroke="#1E40AF" stroke-width="1.5"/>
  <text x="580" y="45" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#1E3A8A">YOUR CHECK</text>
  <text x="495" y="70" font-family="Arial" font-size="10" fill="#1E3A8A">• Did I define KPI first?</text>
  <text x="495" y="88" font-family="Arial" font-size="10" fill="#1E3A8A">• Can it ship in 1 week?</text>
  <text x="495" y="106" font-family="Arial" font-size="10" fill="#1E3A8A">• Who will use it daily?</text>
</svg>

## 2. Win - Jumia Stock Placement

Problem: Stock in Lagos warehouse, demand in Abuja -> delivery 5 days, customer cancels.
Data: Past orders by LGA, delivery time, return rate.
Question: For each SKU, what % demand comes from which region?

Result: Place top 20% SKUs by region demand closer to region. Delivery time 5 days -> 2 days. Cancellation -15%.

Lesson: No ML. Just SQL GROUP BY LGA, 80/20, and operational change. Biggest wins are often not ML.

## 3. Failure - Bank Dashboard That Nobody Opened

Project: Build 20 dashboards for executives.
What went wrong:
- Never asked L05: What decision will you make with this?
- No KPI tree. 100 metrics, no owner.
- Data refreshed manually, always late.
- Executives already used Excel, not Power BI.

Result: Abandoned after 3 months. Cost: 6 months salary.

Lesson: If you don't define user, decision, and refresh plan before building, you build shelfware.

## 4. Failure - Loan Model Trained on Biased Past

Bank used past loan officer approvals as labels. Officer favored salary earners from certain companies.
Model learned: If company = X, approve. Failed for traders who actually repay well.

Lesson from L09: Label bias. Check who is in training data vs who you will score. Test on different segments.

## 5. Pattern for Your First Project

Wins have:
1. Clear business question (L05)
2. MECE + hypothesis (L06)
3. Simple first solution that ships
4. KPI defined before (L10)
5. Ethics check (L09)

Failures have: Starts with tool, no question, complex model, no owner, never ships.

Apply to your L15 project: Choose problem where you can get data in 1 day and ship insight in 1 week.