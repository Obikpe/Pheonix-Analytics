# Lesson 10 - Success Metrics - How to Know You Succeeded

**Course:** ws_01 | **ID:** ws_01_l10 | **Duration:** 17 min | **Level:** Beginner

## Learning Objectives
- Define success in business terms, not model terms.
- Create KPI tree and distinguish leading vs lagging.
- Avoid vanity metrics.

## 1. Model Accuracy is Not Success

Beginner says: "My model has 92% accuracy, I succeeded."
Business says: "Did we save money? Did churn reduce? Did delivery get faster?"

Accuracy without business impact is academic.

Example: Fraud model 99% accuracy but blocks 30% of good customers. Business loses more than fraud saves.

<svg width="100%" height="180" viewBox="0 0 700 180" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="180" rx="16" fill="#FFFFFF"/>
  <rect x="20" y="20" width="200" height="140" rx="12" fill="#FEE2E2" stroke="#991B1B" stroke-width="2"/>
  <text x="120" y="50" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#7F1D1D">VANITY METRIC</text>
  <text x="120" y="80" text-anchor="middle" font-family="Arial" font-size="10" fill="#7F1D1D">• 92% accuracy</text>
  <text x="120" y="97" text-anchor="middle" font-family="Arial" font-size="10" fill="#7F1D1D">• Dashboard views 1000</text>
  <text x="120" y="114" text-anchor="middle" font-family="Arial" font-size="10" fill="#7F1D1D">• No business link</text>
  <rect x="250" y="20" width="200" height="140" rx="12" fill="#DBEAFE" stroke="#1E40AF" stroke-width="1.5"/>
  <text x="350" y="50" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#1E3A8A">KPI TREE</text>
  <text x="270" y="80" font-family="Arial" font-size="10" fill="#1E3A8A">• Business Goal: Reduce churn</text>
  <text x="270" y="97" font-family="Arial" font-size="10" fill="#1E3A8A">• KPI: Churn rate %</text>
  <text x="270" y="114" font-family="Arial" font-size="10" fill="#1E3A8A">• Metric: 7-day second bet rate</text>
  <rect x="480" y="20" width="200" height="140" rx="12" fill="#D1FAE5" stroke="#065F46" stroke-width="2"/>
  <text x="580" y="50" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#064E3B">IMPACT</text>
  <text x="580" y="80" text-anchor="middle" font-family="Arial" font-size="10" fill="#064E3B">• Naira saved</text>
  <text x="580" y="97" text-anchor="middle" font-family="Arial" font-size="10" fill="#064E3B">• Hours saved</text>
  <text x="580" y="114" text-anchor="middle" font-family="Arial" font-size="10" fill="#064E3B">• Churn -2%</text>
</svg>

## 2. KPI Tree

Business Goal at top, KPIs middle, metrics bottom.

Example - POS Business Yaba:

Goal: Increase profit by 20%

KPI 1: Daily transactions count, KPI 2: Avg transaction value, KPI 3: Cost per transaction

Metric for KPI 1: Transactions per hour, peak vs off-peak
Metric for KPI 3: Data cost + charges per transaction

If you cannot draw KPI tree, you cannot define success.

## 3. Leading vs Lagging

- Lagging: Revenue, profit, churn. Happens after. Easy to measure, hard to change quickly.
- Leading: Stock-out days, delivery time, number of calls to support. Happens before. You can act on it daily.

Good analyst reports both. MD wants lagging, operations needs leading.

Example Pharmacy:
Lagging: Value of expired drugs last month (Naira)
Leading: Days of stock remaining, supplier lead time, number of SKUs with <30 days to expiry today

Fix leading, lagging improves.

## 4. Vanity vs Actionable Metrics

Vanity: Number of dashboard views, total users registered, total downloads.
Actionable: % of users who completed KYC after registration, % of orders delivered within SLA.

Test: If metric goes up 20% tomorrow, do you know what to do? If not, it is vanity.

Nigerian example - Betting:
Vanity: Total registered users 500k
Actionable: % of first depositors who place 2nd bet within 24h - if low, trigger bonus SMS, measure lift.

## 5. How to Set Success Before Analysis

Use this template before you touch data (from L05):

We will know we succeeded if [KPI] moves from [baseline] to [target] within [time] as measured by [source], because we did [intervention informed by analysis].

Example: We will know we succeeded if 7-day second bet rate moves from 18% to 25% within 30 days as measured by bets table, because we send bonus for 2nd bet within 24h to users identified by churn analysis.

No baseline, no success definition.

Checklist: Can define KPI tree, leading vs lagging, avoid vanity, write success statement.