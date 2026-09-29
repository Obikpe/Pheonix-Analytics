# Lesson 15 - Deliver Your First End to End Analysis

**Course:** ws_01 | **ID:** ws_01_l15 | **Duration:** 25 min | **Level:** Beginner - Capstone

## Learning Objectives
- Deliver full cycle from L05 to L14 in 1 week.
- Ship something MD can use, not just a notebook.
- Document portfolio story that gets interview.

---

## 1. The Full Flow - From L01 to L14

This is your capstone. You will use everything you learned:

<svg width="100%" height="210" viewBox="0 0 700 210" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="210" rx="16" fill="#FFFFFF"/>
  <rect x="20" y="20" width="90" height="60" rx="8" fill="#FEF3C7" stroke="#92400E" stroke-width="1.5"/>
  <text x="65" y="42" text-anchor="middle" font-family="Arial" font-size="8" font-weight="800" fill="#78350F">L05</text>
  <text x="65" y="55" text-anchor="middle" font-family="Arial" font-size="7" fill="#78350F">Business Q</text>
  <rect x="125" y="20" width="90" height="60" rx="8" fill="#DBEAFE" stroke="#1E40AF" stroke-width="1.5"/>
  <text x="170" y="42" text-anchor="middle" font-family="Arial" font-size="8" font-weight="800" fill="#1E3A8A">L06</text>
  <text x="170" y="55" text-anchor="middle" font-family="Arial" font-size="7" fill="#1E3A8A">MECE + Hypo</text>
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
  <text x="20" y="110" font-family="Arial" font-size="9" fill="#111827">Day 1: Pick problem + scope (L13 template) + KPI definition + ethics check (NDPA)</text>
  <text x="20" y="130" font-family="Arial" font-size="9" fill="#111827">Day 2: Get data Excel/CSV + build data dictionary + clean in SQL/Excel Power Query</text>
  <text x="20" y="150" font-family="Arial" font-size="9" fill="#111827">Day 3: Descriptive - What happened + 80/20 + MECE charts + Information layer</text>
  <text x="20" y="170" font-family="Arial" font-size="9" fill="#111827">Day 4: Diagnostic - Why + test 3 hypotheses + correlation + Knowledge layer</text>
  <text x="20" y="190" font-family="Arial" font-size="9" fill="#111827">Day 5: Wisdom - What to do + 1-page summary Pyramid + README + portfolio post</text>
</svg>

## 2. Day by Day Plan - Detailed with Pharmacy Yaba Example

**Day 1 - Scope (L05, L06, L09, L10):**
- Business Pain: Pharmacy in Yaba wastes N200k monthly in expired drugs. Owner thinks he over-orders because supplier delivers late.
- Analytical Questions:
  - Descriptive: What value of drugs expired in last 6 months by category and supplier? Source: purchases Excel.
  - Diagnostic: Which supplier has highest expiry rate and does late delivery correlate with expiry?
  - Predictive: Which stock will expire in next 30 days if we do not act? Source: expiry_date column.
- MECE: Expiry by Supplier (A,B,C) + by Category (Antibiotics, Analgesics, etc) + by Reason (Late delivery, Over-order, Low demand). No overlap, covers 100 percent.
- Hypotheses:
  - H1: Supplier A late delivery (14 days avg) causes over-order causing expiry. If true, correlation lead time vs expiry greater than 0.6 and expiry of Supplier A greater than 60 percent.
  - H2: 20 percent of drugs cause 80 percent of waste (Pareto). If true, top 5 drugs by expired value equals 80 percent.
  - H3: Drugs with less than 45 days to expiry at purchase expire most. If true, expiry rate greater than 60 percent vs 15 percent for greater than 90 days.
- KPI: Success equals expiry value from N200k per month to N80k per month within 60 days as measured by purchases sheet value column.
- Ethics: No customer names. Only drug names and suppliers. Check NDPA 2023.
- Roles: You are Analyst plus Analytics Engineer. Stakeholder is pharmacy owner.
- Tools: Excel plus Power BI. Keep boring tools that ship.

**Day 2 - Get Data and Clean:**
- Get Excel: Sheet1 purchases (order_date, delivery_date, supplier, drug_name, qty, unit_cost, expiry_date, lead_time_days). Sheet2 sales (date, drug_name, qty_sold).
- Data Dictionary: expiry_date is date printed on pack, delivery_date is when stock arrived, lead_time_days is delivery minus order.
- Clean: Remove duplicates, fix date formats DD/MM/YYYY, calculate days_to_expiry equals expiry_date minus TODAY, flag expired where expiry_date less than TODAY, calculate value equals qty times unit_cost.

**Day 3 - Descriptive (Information layer L12):**
- Total expired value last 6 months: SUM(value where expiry_date less than TODAY)
- Bar chart: expired value by supplier. Finding: Supplier A 70 percent of waste.
- Pareto chart: Top 5 drugs equal 80 percent of expiry value.
- Line chart: expired value trend by month increasing.
- Information message: N1.2M expired last 6 months, Supplier A is 70 percent.

**Day 4 - Diagnostic (Knowledge layer L12, using L06):**
- Test H1: Avg lead time Supplier A equals 14 days, others 3 days. Correlation lead_time vs expired value equals 0.72. Supports H1. Reason over-order due to fear of stock-out.
- Test H2: Top 5 equals 80 percent. True, supports 80/20. Focus on those 5, not all 500 SKUs.
- Test H3: Expiry rate for short-dated purchases less than 45 days equals 65 percent vs 15 percent for greater than 90 days. True.
- Knowledge: Why - Over-order due to late Supplier A plus buying short-dated cheap stock.

**Day 5 - Wisdom plus Ship (L12, L14, L10):**
- Recommendation:
  1. Switch Supplier A to weekly small orders not monthly bulk. Negotiate SLA 3 days max.
  2. Do not buy drugs with less than 60 days to expiry unless discount greater than 50 percent and you can sell in 30 days.
  3. Set Excel alert: alert equals IF days_to_expiry less than 45 then SELL FAST else if less than 90 then Watch else OK. Check daily.
- Expected Impact: Save N120k monthly, N1.44M yearly. KPI moves N200k to N80k in 60 days.
- Deliverables:
  - README.md with question, KPI, source, method, finding, recommendation, limitations.
  - Data dictionary with column meanings.
  - 1-page PDF summary Pyramid: Answer first - We can cut waste from N200k to N80k by weekly orders for Supplier A.
  - 2 to 3 charts with titles that are messages.
  - Clean Excel with alert column owner can use daily on phone.
  - 2-minute Loom video.

## 3. What To Submit and How You Will Be Graded

Self-check:
- Did you define business pain in Naira or hours?
- Did you write 3 analytical questions with source and time window?
- Did you use MECE and hypothesis tree from L06 with If true we will see Z?
- Did you name roles L07 and justify tool choice L08?
- Did you check ethics L09 and define KPI L10 with baseline X to target Y within Z?
- Did you show win pattern vs fail pattern from L11?
- Did you move from Data to Wisdom L12 with evidence at each layer?
- Did you ship docs L14 that MD understands without you?
- Did you ship in 1 week as planned in L13?

If yes to all, you did end-to-end data science, even without ML. That is L01 definition.

## 4. Common Failures in L15 Capstone

- Picking too big problem: Predict stock market. No data, no owner, no KPI. Fail.
- Spending 3 days cleaning 100 percent perfect. Ship 80 percent clean and note limitation.
- Building 10 charts. Build 2 charts with message titles.
- No KPI: If you cannot say Naira saved, you did not succeed (L10).
- No ethics check: Posting raw data with customer phone numbers violates NDPA.

Checklist: Ready to present in interview with 30-sec pitch.
