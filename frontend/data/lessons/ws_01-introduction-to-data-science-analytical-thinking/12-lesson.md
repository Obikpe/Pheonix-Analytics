# Lesson 12 - From Data to Insight Flow - DIKW Pyramid

**Course:** ws_01 | **ID:** ws_01_l12 | **Duration:** 16 min | **Level:** Beginner

## Learning Objectives
- Explain DIKW: Data, Information, Knowledge, Wisdom.
- Show where analysis adds value at each layer.
- Avoid staying at Data layer.

## 1. The Pyramid

<svg width="100%" height="240" viewBox="0 0 700 240" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="240" rx="16" fill="#FFFFFF"/>
  <polygon points="350,20 150,210 550,210" fill="#EFF6FF" stroke="#1E40AF" stroke-width="2"/>
  <line x1="200" y1="165" x2="500" y2="165" stroke="#1E40AF" stroke-dasharray="4 4"/>
  <line x1="250" y1="120" x2="450" y2="120" stroke="#1E40AF" stroke-dasharray="4 4"/>
  <line x1="300" y1="75" x2="400" y2="75" stroke="#1E40AF" stroke-dasharray="4 4"/>
  <text x="350" y="55" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#1E3A8A">WISDOM</text>
  <text x="350" y="68" text-anchor="middle" font-family="Arial" font-size="9" fill="#1E3A8A">What to do</text>
  <text x="350" y="102" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#1E3A8A">KNOWLEDGE</text>
  <text x="350" y="115" text-anchor="middle" font-family="Arial" font-size="9" fill="#1E3A8A">Why + Patterns</text>
  <text x="350" y="147" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#1E3A8A">INFORMATION</text>
  <text x="350" y="160" text-anchor="middle" font-family="Arial" font-size="9" fill="#1E3A8A">What happened (charts)</text>
  <text x="350" y="195" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#1E3A8A">DATA</text>
  <text x="350" y="208" text-anchor="middle" font-family="Arial" font-size="9" fill="#1E3A8A">Raw transactions</text>
</svg>

- **Data:** Raw facts. POS: 2024-03-01, transaction 5k, card 5399...
- **Information:** Data organized. Daily sales by branch last 30 days.
- **Knowledge:** Patterns + why. Sales drop in Surulere because stock-out of rice/oil 40% days, confirmed by correlation.
- **Wisdom:** What to do. Change supplier order schedule, increase safety stock for rice/oil, measure basket size next month.

Most beginners stay at Information: "Here is a dashboard". Value is at Knowledge and Wisdom.

## 2. How to Move Up Each Layer

Data -> Information: Clean, aggregate, visualize. Tools: SQL, Excel, Power BI. Question: What happened?

Information -> Knowledge: Apply MECE, hypothesis, 80/20, segment. Tools: L06 frameworks. Question: Why did it happen? What pattern?

Knowledge -> Wisdom: Combine with domain and business cost. Decide action, define KPI (L10), check ethics (L09). Question: What should we do? What if we are wrong?

Example Pharmacy Yaba:
- Data: 10,000 rows of drug sales and expiry dates.
- Information: Chart: Value expired per month = N200k, top 5 drugs = Amox, Paracetamol...
- Knowledge: 80% of expiry from supplier A, who delivers 14 days late, causing over-ordering to compensate.
- Wisdom: Switch supplier A to weekly delivery or reduce order qty, set alert for drugs with <45 days to expiry. Target: expiry waste N200k -> N50k in 60 days.

## 3. Common Trap

Staying at Data: "Here is Excel with 10k rows". No value.

Staying at Information: "Sales dropped". No why, no action.

Jumping to Wisdom without Knowledge: "We should change supplier" without data showing supplier is cause. Opinion, not data science.

Good analyst moves layer by layer and shows evidence at each.

## 4. Exercise

Take your L05 question: "What value expired last 6 months?"
Push it up:
- Information: Bar chart by category.
- Knowledge: Which supplier and why over-order?
- Wisdom: What change in ordering and what KPI will tell us it worked?

Checklist: Can explain DIKW with Nigerian example and show how you move from dashboard to decision.