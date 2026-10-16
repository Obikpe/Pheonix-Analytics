# Lesson 05 - Conditional Probability and Bayes Theorem - Updating Beliefs

**Duration:** 90 min | **Level:** Absolute Beginner | **Goal:** Update probability when you get new information

## What You Will Learn

In Lesson 4 you learned P(A) = how likely A is. Now what if you get extra information?

Example: Overall P(high value order) = 0.2 = 20% of orders high value. But if you know order is from Lagos store LAG_001_Ikeja which sells expensive items, probability high value given Lagos = P(high | Lagos) = 0.4 = 40%. Knowing it is from Lagos changes probability from 20% to 40%.

This is conditional probability - probability given some condition happened.

Bayes theorem goes reverse: You know P(high | Lagos) = 0.4, but you want P(Lagos | high) = if order is high value, how likely it came from Lagos? For inventory - if high value order, which store likely?

We build from zero, visuals, simple→advanced.

---

## 1. Conditional Probability P(A | B)

### What is P(A | B)?

P(A | B) = Probability A happens GIVEN B happened. Read as P(A given B).

Example: P(high value | NG) = probability order high value given it is from NG.

How to calculate from data: Among B cases, what fraction are also A?

P(A | B) = Count(A and B) / Count(B) = P(A and B) / P(B)

Why divide by P(B)? Because we restrict to only B cases. Sample space shrinks from all orders to only B orders.

If 100 orders total, 70 NG, 30 NG and high value, then P(high | NG) = 30/70 = 0.428 = 42.8% of NG orders high value.

### Visual: Conditional Probability

<svg width="100%" height="250" viewBox="0 0 700 250" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="250" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">CONDITIONAL PROBABILITY P(A | B) = COUNT(A and B) / COUNT(B)</text>
  <rect x="20" y="50" width="300" height="180" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
  <text x="170" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#1E40AF">Example: P(High | NG)</text>
  <text x="35" y="90" font-family="Arial" font-size="8" fill="#1E40AF">Total 100 orders</text>
  <text x="35" y="108" font-family="Arial" font-size="8" fill="#1E40AF">NG orders = 70</text>
  <text x="35" y="126" font-family="Arial" font-size="8" fill="#1E40AF">NG and High = 30</text>
  <text x="35" y="144" font-family="Arial" font-size="9" font-weight="800" fill="#1E40AF">P(High | NG) = 30/70 = 0.428 =42.8%</text>
  <text x="35" y="162" font-family="Arial" font-size="8" fill="#1E40AF">Among NG only, 42.8% high</text>
  <text x="35" y="180" font-family="Arial" font-size="8" fill="#6B7280">Restrict to NG cases only</text>
  <text x="35" y="200" font-family="Arial" font-size="8" fill="#6B7280">Formula: P(High and NG)/P(NG)</text>
  <rect x="380" y="50" width="300" height="180" rx="12" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1"/>
  <text x="530" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#065F46">Reverse: P(NG | High)</text>
  <text x="395" y="90" font-family="Arial" font-size="8" fill="#065F46">High orders = 40 total</text>
  <text x="395" y="108" font-family="Arial" font-size="8" fill="#065F46">High and NG = 30</text>
  <text x="395" y="126" font-family="Arial" font-size="8" fill="#065F46">P(NG | High)=30/40=0.75=75%</text>
  <text x="395" y="144" font-family="Arial" font-size="9" fill="#065F46">Among High only, 75% from NG</text>
  <text x="395" y="162" font-family="Arial" font-size="8" fill="#DC2626">P(High|NG)=42.8% ≠ P(NG|High)=75%</text>
  <text x="395" y="180" font-family="Arial" font-size="8" fill="#065F46">Order matters! Conditional not symmetric</text>
  <text x="395" y="200" font-family="Arial" font-size="8" fill="#6B7280">Bayes connects them</text>
</svg>

**Important:** P(A|B) ≠ P(B|A) generally. Example P(High|NG)=42.8% but P(NG|High)=75%. Different questions!

### Code Simple→Advanced - Conditional Probability

Method 1 Plain Python:

```python
# Method 1: Manual conditional P(A|B)=count(A and B)/count(B)
orders = [
    {"country": "NG", "high": True},
    {"country": "NG", "high": True},
    {"country": "NG", "high": False},
    {"country": "NG", "high": True},
    {"country": "NG", "high": False},
    {"country": "UK", "high": False},
    {"country": "UK", "high": False},
    {"country": "UK", "high": True},
]

print(f"Orders: {orders}")

# Count NG
count_NG = sum(1 for o in orders if o["country"]=="NG")
print(f"Count NG = {count_NG}")

# Count NG and High
count_NG_and_high = sum(1 for o in orders if o["country"]=="NG" and o["high"]==True)
print(f"Count NG and High = {count_NG_and_high}")

# P(High | NG) = count(NG and High)/count(NG)
p_high_given_NG = count_NG_and_high / count_NG
print(f"P(High | NG) = {count_NG_and_high}/{count_NG} = {p_high_given_NG:.3f} = {p_high_given_NG*100:.1f}% of NG orders high")

# Reverse P(NG | High)
count_high = sum(1 for o in orders if o["high"]==True)
count_high_and_NG = count_NG_and_high  # Same
p_NG_given_high = count_high_and_NG / count_high
print(f"\nCount High = {count_high}")
print(f"P(NG | High) = {count_high_and_NG}/{count_high} = {p_NG_given_high:.3f} = {p_NG_given_high*100:.1f}% of high orders from NG")

print(f"\nP(High|NG)={p_high_given_NG:.3f} != P(NG|High)={p_NG_given_high:.3f} - Different!")
```

Method 2 Pandas:

```python
import pandas as pd

df = pd.DataFrame([
    {"country": "NG", "high": True},
    {"country": "NG", "high": True},
    {"country": "NG", "high": False},
    {"country": "NG", "high": True},
    {"country": "UK", "high": False},
])

# P(High | NG) = mean high among NG only
p_high_given_NG = df[df["country"]=="NG"]["high"].mean()
print(f"P(High | NG) = mean high among NG = {p_high_given_NG:.3f}")

# Using crosstab
ct = pd.crosstab(df["country"], df["high"], normalize="index")  # normalize=index gives P(high|country)
print(f"\nCrosstab P(high|country):\n{ct}")
print(f"P(High|NG) = {ct.loc['NG', True]:.3f}")

# Reverse P(NG | High) = use normalize columns or filter
p_NG_given_high = df[df["high"]==True]["country"].value_counts(normalize=True).get("NG",0)
print(f"P(NG|High) = {p_NG_given_high:.3f}")

# Joint P(NG and High) = count both / total
p_both = ((df["country"]=="NG") & (df["high"]==True)).mean()
print(f"P(NG and High) = {p_both:.3f}")
# Check formula P(A and B) = P(A|B)P(B) = P(B|A)P(A)
print(f"Check: P(High|NG)P(NG) = {p_high_given_NG:.3f} * {(df['country']=='NG').mean():.3f} = {p_high_given_NG*(df['country']=='NG').mean():.3f} = P(both) {p_both:.3f} matches")
```

---

## 2. Multiplication Rule Revisited with Conditional

From Lesson 4: P(A and B) = P(A) * P(B|A)

This is directly from conditional definition: P(B|A) = P(A and B)/P(A) so P(A and B)=P(A)P(B|A)

Example: P(NG and High) = P(NG) * P(High|NG) = 0.625 * 0.6 = 0.375

Chain rule for 3 events: P(A and B and C)=P(A)P(B|A)P(C|A and B)

---

## 3. Law of Total Probability

If you have partition of sample space into mutually exclusive and exhaustive events B1, B2, ... that cover all S, then:

P(A) = P(A|B1)P(B1) + P(A|B2)P(B2) + ... = Sum_i P(A|Bi)P(Bi)

Example: Countries NG and UK partition all orders (every order either NG or UK, cannot both). Then:

P(High) = P(High|NG)P(NG) + P(High|UK)P(UK)

If P(High|NG)=0.4 P(NG)=0.7 P(High|UK)=0.1 P(UK)=0.3, then P(High)=0.4*0.7 + 0.1*0.3 =0.28+0.03=0.31

Why useful? You can compute overall P(High) from conditional per country.

<svg width="100%" height="180" viewBox="0 0 700 180" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="180" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">LAW OF TOTAL PROBABILITY - P(A) = SUM P(A|Bi)P(Bi)</text>
  <rect x="20" y="50" width="660" height="110" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
  <text x="35" y="70" font-family="Arial" font-size="9" fill="#1E40AF">Partition S into NG and UK - mutually exclusive exhaustive cover all orders</text>
  <text x="35" y="90" font-family="Arial" font-size="9" fill="#1E40AF">P(High) = P(High|NG)P(NG) + P(High|UK)P(UK)</text>
  <text x="35" y="110" font-family="Arial" font-size="9" fill="#1E40AF">Example: P(High|NG)=0.4 P(NG)=0.7, P(High|UK)=0.1 P(UK)=0.3</text>
  <text x="35" y="130" font-family="Arial" font-size="10" font-weight="800" fill="#1E40AF">P(High)=0.4*0.7 + 0.1*0.3 =0.28+0.03=0.31 =31% high overall</text>
  <text x="35" y="150" font-family="Arial" font-size="8" fill="#6B7280">Break overall probability into cases - per country high rate weighted by country proportion</text>
</svg>

Code:

```python
# Law of total probability
p_NG = 0.7
p_UK = 0.3
p_high_given_NG = 0.4
p_high_given_UK = 0.1

p_high = p_high_given_NG * p_NG + p_high_given_UK * p_UK
print(f"P(High)=P(High|NG)P(NG)+P(High|UK)P(UK)={p_high_given_NG}*{p_NG}+{p_high_given_UK}*{p_UK}={p_high:.3f}")

# From data
import pandas as pd
df = pd.DataFrame([
    {"country": "NG", "high": True},
    {"country": "NG", "high": False},
    {"country": "NG", "high": True},
    {"country": "UK", "high": False},
])
# Calculate via law
p_NG = (df["country"]=="NG").mean()
p_UK = (df["country"]=="UK").mean()
p_high_given_NG = df[df["country"]=="NG"]["high"].mean()
p_high_given_UK = df[df["country"]=="UK"]["high"].mean()
p_high_law = p_high_given_NG*p_NG + p_high_given_UK*p_UK
p_high_direct = df["high"].mean()
print(f"Law: P(High)={p_high_law:.3f}, Direct mean high {p_high_direct:.3f} matches")
```

---

## 4. Bayes Theorem - Reverse Conditional

### What is Bayes?

Bayes theorem lets you reverse conditional: Get P(B|A) from P(A|B), P(A), P(B).

**Formula:** P(B|A) = P(A|B) * P(B) / P(A)

Where:
- P(B) = prior probability = initial belief about B before seeing A
- P(A|B) = likelihood = how likely A given B
- P(A) = evidence = total probability of A
- P(B|A) = posterior = updated belief about B after seeing A

Example: You know P(High|NG)=0.4, P(NG)=0.7, P(High)=0.31 (from law). Then P(NG|High)= P(High|NG)P(NG)/P(High)=0.4*0.7/0.31=0.903=90.3% If order high, 90.3% from NG.

Why useful? Often we know P(symptom|disease) but want P(disease|symptom). Sales: Know P(high|NG) but want P(NG|high) for inventory - if high order arrives, which store likely?

**Base Rate Fallacy:** People ignore prior P(B). Example fraud detection: Fraud 1% P(Fraud)=0.01, test 99% accurate P(Alert|Fraud)=0.99 P(Alert|not Fraud)=0.01. If alert, P(Fraud|Alert)=P(Alert|Fraud)P(Fraud)/P(Alert). P(Alert)=P(Alert|Fraud)P(Fraud)+P(Alert|not Fraud)P(not Fraud)=0.99*0.01+0.01*0.99=0.0198. So P(Fraud|Alert)=0.99*0.01/0.0198=0.5=50% not 99%! Even accurate test, fraud rare so half alerts false. Base rate matters.

<svg width="100%" height="250" viewBox="0 0 700 250" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="250" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">BAYES THEOREM - P(B|A) = P(A|B)P(B)/P(A) - REVERSE CONDITIONAL</text>
  <rect x="20" y="50" width="300" height="180" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
  <text x="170" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#1E40AF">Example: P(NG|High) from P(High|NG)</text>
  <text x="35" y="90" font-family="Arial" font-size="8" fill="#1E40AF">Prior P(NG)=0.7</text>
  <text x="35" y="108" font-family="Arial" font-size="8" fill="#1E40AF">Likelihood P(High|NG)=0.4</text>
  <text x="35" y="126" font-family="Arial" font-size="8" fill="#1E40AF">Evidence P(High)=0.31</text>
  <text x="35" y="144" font-family="Arial" font-size="9" font-weight="800" fill="#1E40AF">Posterior P(NG|High)=0.4*0.7/0.31=0.903=90.3%</text>
  <text x="35" y="162" font-family="Arial" font-size="8" fill="#1E40AF">If high order, 90% from NG</text>
  <text x="35" y="180" font-family="Arial" font-size="8" fill="#6B7280">Prior → Posterior after seeing evidence</text>
  <rect x="380" y="50" width="300" height="180" rx="12" fill="#FEF2F2" stroke="#FCA5A5" stroke-width="1"/>
  <text x="530" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#7F1D1D">Base Rate Fallacy - Fraud Example</text>
  <text x="395" y="90" font-family="Arial" font-size="8" fill="#7F1D1D">Prior P(Fraud)=1% rare</text>
  <text x="395" y="108" font-family="Arial" font-size="8" fill="#7F1D1D">P(Alert|Fraud)=99% accurate</text>
  <text x="395" y="126" font-family="Arial" font-size="8" fill="#7F1D1D">P(Alert|not Fraud)=1% false alarm</text>
  <text x="395" y="144" font-family="Arial" font-size="8" fill="#7F1D1D">P(Alert)=0.99*0.01+0.01*0.99=0.0198</text>
  <text x="395" y="162" font-family="Arial" font-size="9" font-weight="800" fill="#7F1D1D">P(Fraud|Alert)=0.99*0.01/0.0198=50% NOT 99%!</text>
  <text x="395" y="180" font-family="Arial" font-size="8" fill="#7F1D1D">Even accurate test, fraud rare so half alerts false</text>
  <text x="395" y="200" font-family="Arial" font-size="8" fill="#6B7280">Ignore base rate → wrong conclusion</text>
</svg>

### Code Simple→Advanced - Bayes

Method 1 Plain Python:

```python
# Method 1: Bayes P(NG|High)=P(High|NG)P(NG)/P(High)
p_NG = 0.7  # Prior
p_UK = 0.3
p_high_given_NG = 0.4  # Likelihood
p_high_given_UK = 0.1

# Evidence P(High) via law of total probability
p_high = p_high_given_NG * p_NG + p_high_given_UK * p_UK
print(f"P(High)=P(High|NG)P(NG)+P(High|UK)P(UK)={p_high_given_NG}*{p_NG}+{p_high_given_UK}*{p_UK}={p_high:.3f}")

# Bayes posterior P(NG|High)
p_NG_given_high = p_high_given_NG * p_NG / p_high
print(f"Bayes P(NG|High)=P(High|NG)P(NG)/P(High)={p_high_given_NG}*{p_NG}/{p_high:.3f}={p_NG_given_high:.3f}= {p_NG_given_high*100:.1f}%")

# Reverse check: P(High|NG) known 0.4, P(NG|High) computed 0.903 different!
print(f"P(High|NG)={p_high_given_NG} != P(NG|High)={p_NG_given_high:.3f} - Bayes connects")

# Fraud base rate fallacy
p_fraud = 0.01
p_alert_given_fraud = 0.99
p_alert_given_not_fraud = 0.01
p_not_fraud = 1 - p_fraud

p_alert = p_alert_given_fraud * p_fraud + p_alert_given_not_fraud * p_not_fraud
p_fraud_given_alert = p_alert_given_fraud * p_fraud / p_alert

print(f"\nFraud example:")
print(f"Prior P(Fraud)={p_fraud} rare")
print(f"P(Alert)=P(Alert|Fraud)P(Fraud)+P(Alert|not Fraud)P(not Fraud)={p_alert_given_fraud}*{p_fraud}+{p_alert_given_not_fraud}*{p_not_fraud}={p_alert:.4f}")
print(f"Posterior P(Fraud|Alert)={p_alert_given_fraud}*{p_fraud}/{p_alert:.4f}={p_fraud_given_alert:.3f}=50% not 99%!")
print(f"Base rate matters - fraud rare so many false alerts")
```

Method 2 Pandas from data:

```python
import pandas as pd

df = pd.DataFrame([
    {"country": "NG", "high": True},
    {"country": "NG", "high": True},
    {"country": "NG", "high": False},
    {"country": "UK", "high": False},
    {"country": "UK", "high": False},
])

# Prior P(NG)
p_NG = (df["country"]=="NG").mean()
# Likelihood P(High|NG)
p_high_given_NG = df[df["country"]=="NG"]["high"].mean()
# Evidence P(High)
p_high = df["high"].mean()

# Bayes P(NG|High)
p_NG_given_high_bayes = p_high_given_NG * p_NG / p_high
print(f"From data: P(NG)={p_NG:.2f} P(High|NG)={p_high_given_NG:.2f} P(High)={p_high:.2f}")
print(f"Bayes P(NG|High)={p_NG_given_high_bayes:.3f}")

# Direct count check
p_NG_given_high_direct = df[df["high"]==True]["country"].value_counts(normalize=True).get("NG",0)
print(f"Direct count P(NG|High)={p_NG_given_high_direct:.3f} matches Bayes {p_NG_given_high_bayes:.3f}")
```

---

## 5. Independence via Conditional

A and B independent if P(B|A)=P(B) - occurrence of A doesn't change probability of B.

Equivalently P(A|B)=P(A) and P(A and B)=P(A)P(B)

From data: If P(Accessories|NG)=P(Accessories) approx, then product independent of country.

Code check:

```python
import pandas as pd

df = pd.DataFrame([
    {"country": "NG", "product": "Accessories"},
    {"country": "NG", "product": "Display"},
    {"country": "UK", "product": "Accessories"},
    {"country": "UK", "product": "Display"},
])

p_acc = (df["product"]=="Accessories").mean()
p_acc_given_NG = df[df["country"]=="NG"]["product"].value_counts(normalize=True).get("Accessories",0)
p_acc_given_UK = df[df["country"]=="UK"]["product"].value_counts(normalize=True).get("Accessories",0)

print(f"P(Acc)={p_acc:.2f} P(Acc|NG)={p_acc_given_NG:.2f} P(Acc|UK)={p_acc_given_UK:.2f}")
if abs(p_acc - p_acc_given_NG) < 0.1 and abs(p_acc - p_acc_given_UK) < 0.1:
    print("Approximately independent - country doesn't affect product")
else:
    print("Not independent - product depends on country")
```

---

## 6. Real Store Example - Where Location Matters

```python
import pandas as pd

orders = [
    {"order_id": "ORD_LAG_001_5001", "store_id": "LAG_001_Ikeja", "city": "Ikeja", "country": "NG", "total": 53750, "high": True},
    {"order_id": "ORD_LAG_001_5002", "store_id": "LAG_001_Ikeja", "city": "Ikeja", "country": "NG", "total": 34400, "high": False},
    {"order_id": "ORD_LAG_002_5003", "store_id": "LAG_002_Lekki", "city": "Lekki", "country": "NG", "total": 91375, "high": True},
    {"order_id": "ORD_LDN_001_2001", "store_id": "LDN_001_Camden", "city": "Camden", "country": "UK", "total": 433, "high": False},
]

df = pd.DataFrame(orders)

# Conditional: P(high | NG) vs P(high | UK)
p_high_given_NG = df[df["country"]=="NG"]["high"].mean()
p_high_given_UK = df[df["country"]=="UK"]["high"].mean()
print(f"P(high|NG)={p_high_given_NG:.2f} P(high|UK)={p_high_given_UK:.2f} - High value depends on country?")

# Law total: P(high) = P(high|NG)P(NG)+P(high|UK)P(UK)
p_NG = (df["country"]=="NG").mean()
p_UK = (df["country"]=="UK").mean()
p_high = p_high_given_NG*p_NG + p_high_given_UK*p_UK
print(f"P(high)=P(high|NG)P(NG)+P(high|UK)P(UK)={p_high_given_NG:.2f}*{p_NG:.2f}+{p_high_given_UK:.2f}*{p_UK:.2f}={p_high:.3f} direct {df['high'].mean():.3f} matches")

# Bayes: P(NG | high) - if high order, how likely from NG?
p_NG_given_high = p_high_given_NG * p_NG / p_high
print(f"Bayes P(NG|high)=P(high|NG)P(NG)/P(high)={p_high_given_NG:.2f}*{p_NG:.2f}/{p_high:.3f}={p_NG_given_high:.3f} - If high order, {p_NG_given_high*100:.0f}% from NG, useful for inventory")

# Business: If you get high value order, which store likely?
# Group by store_id for P(store | high)
if p_high>0:
    high_orders = df[df["high"]==True]
    prob_store_given_high = high_orders["store_id"].value_counts(normalize=True)
    print(f"P(store|high):\n{prob_store_given_high}")
```

---

## 7. Hands-On Assignment - Simple to Advanced

Dataset: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - customer_state, payment_type

Create conditional_bayes_L05.py:

Section A Conditional:

```python
orders=[
    {"country":"NG","high":True},
    {"country":"NG","high":False},
    {"country":"UK","high":False},
]
count_NG=sum(1 for o in orders if o["country"]=="NG")
count_NG_and_high=sum(1 for o in orders if o["country"]=="NG" and o["high"]==True)
p_high_given_NG=count_NG_and_high/count_NG
print(f"P(high|NG)={count_NG_and_high}/{count_NG}={p_high_given_NG:.2f}")

# Reverse
count_high=sum(1 for o in orders if o["high"]==True)
p_NG_given_high=count_NG_and_high/count_high
print(f"P(NG|high)={count_NG_and_high}/{count_high}={p_NG_given_high:.2f} != P(high|NG)")
```

Section B Law Total:

```python
p_NG=0.7
p_UK=0.3
p_high_given_NG=0.4
p_high_given_UK=0.1
p_high=p_high_given_NG*p_NG + p_high_given_UK*p_UK
print(f"P(high)=P(high|NG)P(NG)+P(high|UK)P(UK)={p_high:.3f}")
```

Section C Bayes and Base Rate:

```python
p_NG=0.7
p_high_given_NG=0.4
p_high=0.31
p_NG_given_high=p_high_given_NG*p_NG/p_high
print(f"Bayes P(NG|high)=P(high|NG)P(NG)/P(high)={p_NG_given_high:.3f}")

# Fraud base rate fallacy
p_fraud=0.01
p_alert_given_fraud=0.99
p_alert_given_not=0.01
p_alert=p_alert_given_fraud*p_fraud + p_alert_given_not*(1-p_fraud)
p_fraud_given_alert=p_alert_given_fraud*p_fraud/p_alert
print(f"P(Fraud|Alert)={p_fraud_given_alert:.3f}=50% not 99% - base rate matters")
```

Section D Pandas Real:

```python
import pandas as pd
df=pd.DataFrame([
    {"country":"NG","high":True},
    {"country":"NG","high":False},
    {"country":"UK","high":False},
])
print(f"P(high|NG)={df[df['country']=='NG']['high'].mean():.2f}")
print(f"P(NG|high) Bayes={(df['country']=='NG').mean()*df[df['country']=='NG']['high'].mean()/df['high'].mean():.3f}")
```

Section E Kaggle:

```python
import os, pandas as pd
if os.path.exists("olist_customers_dataset.csv") and os.path.exists("olist_order_payments_dataset.csv"):
    df_cust=pd.read_csv("olist_customers_dataset.csv", nrows=10000)
    df_pay=pd.read_csv("olist_order_payments_dataset.csv", nrows=10000)
    # Simplified: P(credit_card | SP) - need merge via order_id - for assignment show logic
    # Use customer_state alone for conditional
    # Example: P(credit_card) overall vs conditional on state requires join - skip for now show P(state) and P(payment_type)
    print(f"P(SP)={df_cust['customer_state'].value_counts(normalize=True).get('SP',0):.3f}")
    print(f"P(credit_card)={df_pay['payment_type'].value_counts(normalize=True).get('credit_card',0):.3f}")
    # For full conditional need order_id join - advanced
else:
    print("Download https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - customer_state payment_type")
    print("For P(credit_card|SP) need to join via order_id: customers->orders->payments")
```

Deliverable: Upload conditional_bayes_L05.py + output showing P(high|NG)=30/70=42.8% vs P(NG|high)=30/40=75% different, law total P(high)=0.31, Bayes P(NG|high)=0.4*0.7/0.31=90.3%, fraud base rate P(Fraud|Alert)=50% not 99%, independence check.

Kaggle:
1. Primary https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - for P(payment_type|customer_state) need join
2. Secondary https://www.kaggle.com/datasets/vivek468/superstore-dataset-final - P(Category|Region)

## 8. Checklist
- Define conditional P(A|B)=count(A and B)/count(B)=P(A and B)/P(B) restrict to B cases
- Explain P(A|B) != P(B|A) generally different questions
- Apply law total P(A)=Sum P(A|Bi)P(Bi) for partition mutually exclusive exhaustive
- Apply Bayes P(B|A)=P(A|B)P(B)/P(A) prior likelihood evidence posterior reverse conditional
- Explain base rate fallacy P(Fraud|Alert) 50% not 99% when fraud rare even accurate test
- Check independence P(B|A)=P(B) or P(A and B)=P(A)P(B)
- Use pandas crosstab normalize index for P(A|B) and value_counts(normalize=True) for P

Key Takeaway: Conditional P(A|B)=count(A and B)/count(B) among B only. Law total P(A)=sum P(A|Bi)P(Bi). Bayes reverse P(B|A)=P(A|B)P(B)/P(A) prior to posterior. Base rate matters. P(A|B) != P(B|A).

