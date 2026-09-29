# Lesson 06 - Analytical Thinking Frameworks

**Course:** ws_01 | **ID:** ws_01_l06 | **Duration:** 20 min | **Level:** Beginner

## Learning Objectives
- Apply MECE to break problems without overlap.
- Apply hypothesis-driven thinking before touching data.
- Apply 80/20 and First Principles.

---

## 1. MECE - Mutually Exclusive, Collectively Exhaustive

Revenue drop for supermarket Lagos:
Not MECE: "Sales and customers dropped" - overlap.
MECE: Revenue = Traffic x Conversion x Basket Size. One of those 3 must have dropped. No overlap, covers 100%.

<svg width="100%" height="200" viewBox="0 0 700 200" xmlns="http://www.w3.org/2000/svg" role="img">
  <rect x="0" y="0" width="700" height="200" rx="16" fill="#FFFFFF"/>
  <rect x="20" y="20" width="660" height="40" rx="8" fill="#DBEAFE" stroke="#1E40AF" stroke-width="2"/>
  <text x="350" y="44" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#1E3A8A">REVENUE DROP</text>
  <rect x="20" y="80" width="200" height="80" rx="10" fill="#EFF6FF" stroke="#1E40AF" stroke-width="1.5"/>
  <text x="120" y="105" text-anchor="middle" font-family="Arial" font-size="11" font-weight="700" fill="#1E3A8A">TRAFFIC</text>
  <text x="120" y="122" text-anchor="middle" font-family="Arial" font-size="10" fill="#1E3A8A">Door counter</text>
  <rect x="250" y="80" width="200" height="80" rx="10" fill="#EFF6FF" stroke="#1E40AF" stroke-width="1.5"/>
  <text x="350" y="105" text-anchor="middle" font-family="Arial" font-size="11" font-weight="700" fill="#1E3A8A">CONVERSION</text>
  <text x="350" y="122" text-anchor="middle" font-family="Arial" font-size="10" fill="#1E3A8A">Bills / Traffic</text>
  <rect x="480" y="80" width="200" height="80" rx="10" fill="#EFF6FF" stroke="#1E40AF" stroke-width="1.5"/>
  <text x="580" y="105" text-anchor="middle" font-family="Arial" font-size="11" font-weight="700" fill="#1E3A8A">BASKET SIZE</text>
  <text x="580" y="122" text-anchor="middle" font-family="Arial" font-size="10" fill="#1E3A8A">Revenue / Bills</text>
</svg>

Transfers fail? MECE by layer:
1. User layer: wrong PIN, insufficient funds
2. App layer: timeout, bug
3. Network layer: bank API down, telco
4. Bank layer: bank downtime

## 2. Hypothesis-Driven Thinking

Format: We believe [X] because [Y]. If true, we will see [Z] in data.

Example: We believe basket size dropped because rice and oil were out of stock 40% of March because supplier failed. If true, correlation >0.7 between stock-out days and basket size.

Hypothesis Tree: Top: Revenue dropped due to Traffic OR Conversion OR Basket. Test Traffic first (5 mins), then Conversion, then Basket.

## 3. 80/20 Principle

80% impact from 20% causes.
- 20% products drive 80% expiry waste
- 20% routes cause 80% delays

<svg width="100%" height="140" viewBox="0 0 700 140" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="140" rx="12" fill="#FFFFFF"/>
  <rect x="20" y="20" width="300" height="100" rx="10" fill="#FEF3C7" stroke="#92400E" stroke-width="1.5"/>
  <text x="170" y="50" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#78350F">WRONG WAY</text>
  <text x="170" y="75" text-anchor="middle" font-family="Arial" font-size="11" fill="#78350F">Analyze all 10,000 products</text>
  <text x="170" y="95" text-anchor="middle" font-family="Arial" font-size="11" fill="#78350F">2 weeks, low impact</text>
  <rect x="380" y="20" width="300" height="100" rx="10" fill="#D1FAE5" stroke="#065F46" stroke-width="1.5"/>
  <text x="530" y="50" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#064E3B">RIGHT WAY (80/20)</text>
  <text x="530" y="75" text-anchor="middle" font-family="Arial" font-size="11" fill="#064E3B">Top 20 by waste value</text>
  <text x="530" y="95" text-anchor="middle" font-family="Arial" font-size="11" fill="#064E3B">5 mins, 80% impact</text>
</svg>

## 4. First Principles
What must be true for business to work? Pharmacy must: have drug when asked, sell before expiry, know what to restock. Everything else is implementation.

Checklist: Can break problem MECE, write 3 testable hypotheses, explain 80/20.