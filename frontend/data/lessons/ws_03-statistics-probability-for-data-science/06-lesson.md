# Lesson 06 - Random Variables - Discrete vs Continuous - What Can Happen and How Likely?

**Duration:** 90 min | **Level:** Absolute Beginner | **Goal:** Model uncertain quantities like order amount or number of orders per day

## What You Will Learn

Lesson 4 to Lesson 5 you learned probability of events. Now random variable X = number or amount whose value uncertain before happening, but you know probabilities of possible values.

Example: X = number of orders per day in LAG_001_Ikeja store. Before day starts, X uncertain - could be 15, 20, 25. But from past data you know P(X=20)=0.3 etc.

Two types:
- **Discrete:** Countable values - number of orders 0,1,2,... You can list them. No fractions like 2.5 orders.
- **Continuous:** Any value in range - order total amount ₦10,000.53 can be any decimal, not just integer. Uncountably infinite possible values.

We model them differently: Discrete uses PMF table, Continuous uses PDF curve area = probability.

We build from zero, visuals, simple→advanced code.

---

## 1. What is Random Variable?

Random variable X is function that assigns number to each outcome in sample space S.

Example: S = {orders today}, X(S) = total amount of that order. Each order maps to amount number.

We write P(X = value) = probability X equals that value.

- X = number of items in order - discrete countable
- Y = payment amount - continuous any value
- Z = customer state SP, RJ etc - not number but can encode as number, categorical

We focus on numeric random variables.

### Visual: Random Variable Mapping

<svg width="100%" height="180" viewBox="0 0 700 180" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="180" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">RANDOM VARIABLE X = NUMBER ASSIGNED TO OUTCOME</text>
  <rect x="20" y="50" width="200" height="100" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
  <text x="120" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#1E40AF">Sample Space S</text>
  <text x="35" y="90" font-family="Arial" font-size="8" fill="#1E40AF">Order 1</text>
  <text x="35" y="108" font-family="Arial" font-size="8" fill="#1E40AF">Order 2</text>
  <text x="35" y="126" font-family="Arial" font-size="8" fill="#1E40AF">Order 3</text>
  <rect x="250" y="80" width="100" height="30" rx="8" fill="#E5E7EB"/>
  <text x="300" y="98" text-anchor="middle" font-family="Arial" font-size="9" fill="#111827">X maps →</text>
  <rect x="380" y="50" width="300" height="100" rx="12" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1"/>
  <text x="530" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#065F46">Random Variable Values</text>
  <text x="395" y="90" font-family="Arial" font-size="8" fill="#065F46">X = total amount 53750, 34400...</text>
  <text x="395" y="108" font-family="Arial" font-size="8" fill="#065F46">X = quantity 2, 3, 1...</text>
  <text x="395" y="126" font-family="Arial" font-size="8" fill="#065F46">X = orders per day 20, 21...</text>
</svg>

---

## 2. Discrete Random Variables - Countable Values

### What is Discrete?

Discrete random variable X takes countable values - you can list them 0,1,2,... or finite set.

Examples:
- X = number of items in an order - 1,2,3,... countable integer
- Y = number of orders per day in store - 0,1,2,... 
- Z = payment installments - 1,2,3... discrete

Cannot be 1.5 items - must be integer count.

### PMF - Probability Mass Function

PMF = table or formula giving P(X = k) for each possible k.

Requirements:
1. 0 ≤ P(X=k) ≤1 for each k
2. Sum over all k P(X=k) =1 - total probability 1

Example: X = quantity in order from past data:

- P(X=1)=0.5
- P(X=2)=0.3
- P(X=3)=0.15
- P(X=4)=0.05
- Sum =0.5+0.3+0.15+0.05=1

If someone orders, 50% chance 1 item, 30% chance 2 items etc.

### CDF - Cumulative Distribution Function

CDF F(x)=P(X ≤ x) = sum of PMF up to x. Probability X less than or equal x.

From PMF above:
- F(1)=P(X≤1)=0.5
- F(2)=P(X≤2)=0.5+0.3=0.8
- F(3)=0.95
- F(4)=1

CDF is non-decreasing, goes from 0 to 1, stepwise for discrete (jumps at possible values).

Why CDF useful? P(a < X ≤ b)=F(b)-F(a). Probability in interval = CDF difference.

### Visual: Discrete PMF and CDF

<svg width="100%" height="250" viewBox="0 0 700 250" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="250" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">DISCRETE - PMF TABLE AND CDF STAIRCASE</text>
  <rect x="20" y="50" width="310" height="180" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
  <text x="175" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="700" fill="#1E40AF">PMF - Prob Mass Function</text>
  <text x="35" y="90" font-family="Arial" font-size="8" fill="#1E40AF">k   P(X=k)</text>
  <text x="35" y="105" font-family="Arial" font-size="8" fill="#1E40AF">1   0.5  █████</text>
  <text x="35" y="120" font-family="Arial" font-size="8" fill="#1E40AF">2   0.3  ███</text>
  <text x="35" y="135" font-family="Arial" font-size="8" fill="#1E40AF">3   0.15 █</text>
  <text x="35" y="150" font-family="Arial" font-size="8" fill="#1E40AF">4   0.05 █</text>
  <text x="35" y="170" font-family="Arial" font-size="8" fill="#1E40AF">Sum=1, each 0-1</text>
  <text x="35" y="185" font-family="Arial" font-size="8" fill="#1E40AF">Bar height = probability</text>
  <rect x="360" y="50" width="320" height="180" rx="12" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1"/>
  <text x="520" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="700" fill="#065F46">CDF - Cumulative P(X≤x)</text>
  <text x="375" y="90" font-family="Arial" font-size="8" fill="#065F46">x  F(x)=P(X≤x)</text>
  <text x="375" y="105" font-family="Arial" font-size="8" fill="#065F46">1  0.5</text>
  <text x="375" y="120" font-family="Arial" font-size="8" fill="#065F46">2  0.8 =0.5+0.3</text>
  <text x="375" y="135" font-family="Arial" font-size="8" fill="#065F46">3  0.95</text>
  <text x="375" y="150" font-family="Arial" font-size="8" fill="#065F46">4  1.0</text>
  <text x="375" y="170" font-family="Arial" font-size="8" fill="#065F46">Staircase jumps at possible k</text>
  <text x="375" y="185" font-family="Arial" font-size="8" fill="#065F46">P(1<X≤3)=F(3)-F(1)=0.95-0.5=0.45</text>
</svg>

### Code Simple→Advanced - Discrete PMF CDF

Step 1 Plain Python - PMF table:

```python
# Step 1: Discrete PMF - manual table
# X = quantity in order
pmf = {1: 0.5, 2: 0.3, 3: 0.15, 4: 0.05}
print(f"PMF: {pmf}")

# Check requirements
total_prob = sum(pmf.values())
print(f"Sum P(X=k) = {total_prob} should be 1 - {'Valid' if abs(total_prob-1)<0.001 else 'Invalid'}")
for k,p in pmf.items():
    print(f"P(X={k})={p} between 0 and 1 {'Valid' if 0<=p<=1 else 'Invalid'}")

# Probability questions
print(f"\nP(X=2) = {pmf[2]}")
print(f"P(X>2) = P(3)+P(4) = {pmf[3]+pmf[4]}")

# CDF
cdf = {}
cum = 0
for k in sorted(pmf.keys()):
    cum += pmf[k]
    cdf[k] = cum
print(f"\nCDF: {cdf}")
print(f"F(2)=P(X≤2)={cdf[2]}")
print(f"P(1<X≤3)=F(3)-F(1)={cdf[3]-cdf[1]} = P(2)+P(3)={pmf[2]+pmf[3]}")
```

Step 2 From real data - estimate PMF:

```python
# Step 2: Estimate PMF from past orders
orders_quantity = [1,2,1,1,3,2,1,1,4,2,1,1,1,2,3]  # 15 orders
print(f"Quantities: {orders_quantity}")

# Count each value
from collections import Counter
counter = Counter(orders_quantity)
total = len(orders_quantity)
pmf_est = {k: counter[k]/total for k in counter}
print(f"Estimated PMF from data: {pmf_est}")
print(f"Sum {sum(pmf_est.values())} =1")

# Using pandas value_counts normalize
import pandas as pd
df = pd.DataFrame({"quantity": orders_quantity})
pmf_pandas = df["quantity"].value_counts(normalize=True).sort_index()
print(f"\nPandas PMF:\n{pmf_pandas}")
```

---

## 3. Continuous Random Variables - Any Value in Range

### What is Continuous?

Continuous random variable X can take any value in an interval - not just integer, any decimal.

Examples:
- X = order total amount - can be 53750.12, any decimal, not just integer
- Y = customer age - can be 25.5 years
- Z = delivery time - can be 3.2 days

Uncountably infinite possible values - you cannot list all. Probability of exactly one specific value is 0! Why? Infinite possibilities, probability of one exact point infinitesimal.

Example: P(X=53750.00 exactly) =0 - chance that total exactly 53750.000... with infinite decimals 0.

But P(53000 ≤ X ≤ 54000) >0 - probability in interval positive.

So for continuous, we talk about probability in interval, not exact value.

### PDF - Probability Density Function

PDF f(x) = curve where area under curve between a and b = P(a ≤ X ≤ b)

Requirements:
1. f(x) ≥0 for all x - density non-negative
2. Total area under curve =1 - ∫ f(x) dx =1 integral over all x

PDF itself is NOT probability - can be >1! But area is probability between 0 and 1.

Example: Normal distribution bell curve - height is density, area between 10k and 14k is probability order between 10k and 14k.

### CDF for Continuous

CDF F(x)=P(X ≤ x)= area under PDF from -∞ to x = integral of f(t) dt from -∞ to x

CDF continuous, non-decreasing, 0 to 1, smooth (no jumps).

P(a ≤ X ≤ b)=F(b)-F(a)= area between a and b.

For continuous, P(X=x)=0, so P(a ≤ X ≤ b)=P(a < X < b) same - inclusive vs exclusive doesn't matter.

### Visual: Continuous PDF Area = Probability

<svg width="100%" height="260" viewBox="0 0 700 260" xmlns="http://www.w3.org/2000/svg">
  <!-- Background Card -->
  <rect x="0" y="0" width="700" height="260" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <!-- Title -->
  <text x="350" y="28" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">CONTINUOUS - PDF CURVE AREA = PROBABILITY, P(X=x) = 0</text>
  <!-- Main Container Box -->
  <g transform="translate(20, 42)">
    <rect width="660" height="200" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
    <!-- Subtitle -->
    <text x="330" y="25" text-anchor="middle" font-family="Arial" font-size="11" font-weight="700" fill="#1E40AF">Normal PDF Bell Curve - Example Order Amount</text>
    <!-- Full Bell Curve Path -->
    <path d="M 50 145 Q 200 145 260 105 Q 310 45 330 42 Q 350 45 400 105 Q 460 145 610 145" fill="#BFDBFE" stroke="#2563EB" stroke-width="2" opacity="0.6"/>
    <!-- Shaded Area Between a and b -->
    <path d="M 260 145 Q 260 75 330 42 Q 400 75 400 145 Z" fill="#60A5FA" opacity="0.8"/>
    <!-- Labels inside shaded region -->
    <text x="330" y="92" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#FFFFFF">Area = P(a ≤ X ≤ b)</text>
    <text x="330" y="107" text-anchor="middle" font-family="Arial" font-size="8" fill="#FFFFFF">e.g., P(10k ≤ X ≤ 14k) = 0.68</text>
    <!-- Axis Markers and Labels -->
    <line x1="260" y1="145" x2="260" y2="160" stroke="#1E40AF" stroke-width="1"/>
    <text x="260" y="172" text-anchor="middle" font-family="Arial" font-size="8" fill="#1E40AF">a = 10k</text>
    <line x1="400" y1="145" x2="400" y2="160" stroke="#1E40AF" stroke-width="1"/>
    <text x="400" y="172" text-anchor="middle" font-family="Arial" font-size="8" fill="#1E40AF">b = 14k</text>
    <line x1="330" y1="145" x2="330" y2="160" stroke="#2563EB" stroke-width="2"/>
    <text x="330" y="185" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#1E40AF">Mean = 12k</text>
    <!-- Bottomplanatory Note -->
    <text x="330" y="196" text-anchor="middle" font-family="Arial" font-size="8" fill="#374151">PDF height = density (can be &gt; 1). Area = probability. Total area = 1. P(X = exact value) = 0 for continuous.</text>
  </g>
</svg>


### Code - Continuous Intuition

```python
# Continuous: P(X=exact) =0, but P(a≤X≤b) >0

# Example: Order amounts continuous
# Simulate normal amounts mean 12k std 2k
import numpy as np

np.random.seed(0)
amounts = np.random.normal(loc=12000, scale=2000, size=10000)  # Normal distribution

# P(X=12000 exactly) - how many exactly 12000?
count_exact_12000 = sum(1 for x in amounts if x==12000)
print(f"Count exactly 12000 in 10000 samples: {count_exact_12000} - almost 0, P(X=12000)=0 for continuous")

# P(10000 ≤ X ≤ 14000) - interval
count_interval = sum(1 for x in amounts if 10000 <= x <= 14000)
p_interval = count_interval / len(amounts)
print(f"P(10000≤X≤14000) ≈ {count_interval}/{len(amounts)} = {p_interval:.3f} = 68% matches normal 1 std rule")

# For continuous, PDF area is probability - we approximate with histogram density
import matplotlib.pyplot as plt

plt.figure(figsize=(6,3))
plt.hist(amounts, bins=50, density=True, color="skyblue", edgecolor="black")  # density=True area=1
plt.title("Histogram density approx PDF - area = probability")
plt.xlabel("Order amount")
plt.ylabel("Density")
plt.axvline(10000, color="red", linestyle="--")
plt.axvline(14000, color="red", linestyle="--")
plt.savefig("continuous_pdf_area.png")
print("Saved continuous_pdf_area.png - histogram density area between 10k and 14k ≈0.68 = probability")
```

---

## 4. Expected Value E[X] - Mean of Random Variable

### What is Expected Value?

Expected value E[X] = mean of random variable = average if you repeat many times.

For discrete: E[X] = Sum_k k * P(X=k) = sum of value times its probability

Example PMF: X=1 prob 0.5, X=2 prob 0.3, X=3 prob 0.15, X=4 prob 0.05
E[X]=1*0.5 +2*0.3 +3*0.15 +4*0.05=0.5+0.6+0.45+0.2=1.75
Expected quantity 1.75 items per order.

For continuous: E[X] = ∫ x f(x) dx integral - continuous version of sum.

### Properties:
- E[aX + b] = a E[X] + b - linearity, constants shift and scale
- E[X+Y]=E[X]+E[Y] - linearity expectation of sum = sum of expectations even if not independent

### Code - Expected Value

Step 1 Plain Python discrete:

```python
# Step 1: Expected value discrete E[X]=sum k*P(k)
pmf = {1:0.5, 2:0.3, 3:0.15, 4:0.05}
print(f"PMF: {pmf}")

expected = 0
for k,p in pmf.items():
    term = k * p
    expected += term
    print(f"k={k} p={p} term k*p={k}*{p}={term}, running sum {expected}")

print(f"E[X] = {expected} - expected quantity per order 1.75")

# From data estimate
orders_quantity = [1,2,1,1,3,2,1,1,4,2,1,1,1,2,3]
mean_quantity = sum(orders_quantity)/len(orders_quantity)
print(f"\nFrom data {orders_quantity} mean {mean_quantity:.2f} approximates E[X] {expected}")
```

Step 2 NumPy:

```python
import numpy as np

# Discrete E[X] from pmf
values = np.array([1,2,3,4])
probs = np.array([0.5,0.3,0.15,0.05])
expected = np.sum(values * probs)
print(f"NumPy E[X]=sum values*probs = {expected}")

# From samples
samples = np.array([1,2,1,1,3,2,1,1,4,2])
print(f"Sample mean {np.mean(samples):.2f} approximates expected {expected:.2f}")
```

Step 3 Continuous - mean of normal:

```python
import numpy as np
amounts = np.random.normal(loc=12000, scale=2000, size=10000)
print(f"Continuous X ~ Normal(12000,2000) E[X] = mean = {np.mean(amounts):.0f} ≈ 12000")
```

---

## 5. Variance Var[X] and Std - Spread of Random Variable

### What is Variance?

Var[X] = E[(X - E[X])^2] = average squared distance from mean.

Discrete: Var = Sum (k - E[X])^2 * P(X=k)

Also Var = E[X^2] - (E[X])^2 - useful formula: E[X^2] average of squares minus square of mean.

Standard deviation = sqrt(Var) same units.

Example PMF earlier: E[X]=1.75
- (1-1.75)^2=0.5625 *0.5=0.28125
- (2-1.75)^2=0.0625*0.3=0.01875
- (3-1.75)^2=1.5625*0.15=0.234375
- (4-1.75)^2=5.0625*0.05=0.253125
- Sum Var=0.7875
- Std= sqrt(0.7875)=0.887

So quantity varies about 0.887 around mean 1.75.

For continuous similar but integral.

### Code - Variance

Step 1 Plain Python discrete var:

```python
pmf = {1:0.5, 2:0.3, 3:0.15, 4:0.05}
# E[X]
E = sum(k*p for k,p in pmf.items())
print(f"E[X]={E}")

# Var = sum (k-E)^2 * p
Var = 0
for k,p in pmf.items():
    term = (k-E)**2 * p
    Var += term
    print(f"k={k} (k-E)^2={(k-E)**2:.4f} *p={p} term {term:.4f} running Var {Var:.4f}")

print(f"Var[X]={Var:.4f} Std={Var**0.5:.4f}")

# Alternative E[X^2] - E^2
E_X2 = sum((k**2)*p for k,p in pmf.items())
Var2 = E_X2 - E**2
print(f"Check via E[X^2]-E^2: E[X^2]={E_X2:.4f} E^2={E**2:.4f} Var={Var2:.4f} matches")

# From samples
import numpy as np
samples = np.array([1,2,1,1,3,2,1,1,4,2,1,1,1,2,3])
print(f"\nSample var pop {np.var(samples, ddof=0):.4f} sample var {np.var(samples, ddof=1):.4f} close to {Var:.4f}")
```

---

## 6. Bernoulli - Simplest Discrete - One Trial Success/Failure

Bernoulli random variable X = 1 if success, 0 if failure. One trial with probability p success.

Example: X = 1 if order is high value, 0 if not. P(X=1)=p, P(X=0)=1-p

PMF: P(X=1)=p, P(X=0)=1-p

E[X]=p, Var=p(1-p)

This is building block for Binomial later.

Code:

```python
# Bernoulli p=0.3 high value order
p=0.3
print(f"Bernoulli p={p} P(X=1)=p={p} P(X=0)=1-p={1-p}")
E=p
Var=p*(1-p)
print(f"E[X]=p={E} Var=p(1-p)={p}*{1-p}={Var:.3f} Std={Var**0.5:.3f}")

# Simulate
import numpy as np
samples = np.random.binomial(n=1, p=p, size=10000)  # n=1 is Bernoulli
print(f"Sample mean {np.mean(samples):.3f} ≈ p {p} sample var {np.var(samples, ddof=0):.3f} ≈ {Var:.3f}")
```

---

## 7. Real Store Example - Where Location Matters

```python
import pandas as pd

orders = [
    {"order_id": "ORD_LAG_001_5001", "store_id": "LAG_001_Ikeja", "quantity": 2, "total": 53750},
    {"order_id": "ORD_LAG_001_5002", "store_id": "LAG_001_Ikeja", "quantity": 1, "total": 34400},
    {"order_id": "ORD_LAG_002_5003", "store_id": "LAG_002_Lekki", "quantity": 3, "total": 91375},
    {"order_id": "ORD_LDN_001_2001", "store_id": "LDN_001_Camden", "quantity": 1, "total": 433},
]

df = pd.DataFrame(orders)

# Discrete: quantity
pmf_quantity = df["quantity"].value_counts(normalize=True).sort_index()
print(f"Discrete X=quantity PMF:\n{pmf_quantity}")
E_quantity = (df["quantity"] * 1).mean()  # Actually mean
# Better E = sum k*P(k)
E_q = sum(k * pmf_quantity.get(k,0) for k in pmf_quantity.index)
print(f"E[quantity]={E_q:.2f}")

# Continuous: total
print(f"\nContinuous Y=total mean {df['total'].mean():.0f} std {df['total'].std():.0f}")
print(f"For continuous P(Y=53750 exact)=0, but P(30000≤Y≤60000)={( (df['total']>=30000) & (df['total']<=60000) ).mean():.2f}")

# Group by store_id for per store distribution
for store in df["store_id"].unique():
    subset = df[df["store_id"]==store]
    print(f"\n{store}: quantity PMF {subset['quantity'].value_counts(normalize=True).to_dict()} mean total {subset['total'].mean():.0f}")
```

---

## 8. Hands-On Assignment - Simple to Advanced

Dataset: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - payment_installments discrete, price continuous

Create random_vars_L06.py:

Section A Discrete PMF CDF:

```python
pmf={1:0.5,2:0.3,3:0.15,4:0.05}
print(f"PMF {pmf} sum {sum(pmf.values())}=1")
cdf={}
cum=0
for k in sorted(pmf):
    cum+=pmf[k]
    cdf[k]=cum
print(f"CDF {cdf} F(2)=P(X≤2)={cdf[2]}")
print(f"P(1<X≤3)=F(3)-F(1)={cdf[3]-cdf[1]}")
```

Section B Estimate PMF from data:

```python
from collections import Counter
quantities=[1,2,1,1,3,2,1,1,4,2]
counter=Counter(quantities)
pmf_est={k:counter[k]/len(quantities) for k in counter}
print(f"Estimated PMF from data {pmf_est}")
```

Section C Continuous intuition:

```python
import numpy as np
np.random.seed(0)
amounts=np.random.normal(12000,2000,10000)
print(f"P(X=12000 exact) count {sum(1 for x in amounts if x==12000)} ≈0")
print(f"P(10000≤X≤14000) {( (amounts>=10000)&(amounts<=14000) ).mean():.3f} ≈0.68")
```

Section D Expected Value Var:

```python
pmf={1:0.5,2:0.3,3:0.15,4:0.05}
E=sum(k*p for k,p in pmf.items())
Var=sum((k-E)**2 *p for k,p in pmf.items())
print(f"E[X]={E} Var={Var:.4f} Std={Var**0.5:.4f}")
# Check E[X^2]-E^2
E_X2=sum((k**2)*p for k,p in pmf.items())
print(f"E[X^2]-E^2={E_X2}-{E**2}={E_X2-E**2:.4f} matches Var")
```

Section E Bernoulli:

```python
p=0.3
print(f"Bernoulli p={p} P(1)={p} P(0)={1-p} E={p} Var={p*(1-p):.3f}")
```

Section F Kaggle:

```python
import os, pandas as pd
if os.path.exists("olist_order_items_dataset.csv"):
    df=pd.read_csv("olist_order_items_dataset.csv", nrows=10000)
    # Discrete: order_item_id? Actually quantity? Use order_item_id count per order
    # Better use payment_installments from payments file
    if os.path.exists("olist_order_payments_dataset.csv"):
        df_pay=pd.read_csv("olist_order_payments_dataset.csv", nrows=10000)
        pmf_inst=df_pay["payment_installments"].value_counts(normalize=True).sort_index().head(10)
        print(f"Discrete payment_installments PMF:\n{pmf_inst}")
        E_inst=(df_pay["payment_installments"]*pmf_inst).sum() if False else df_pay["payment_installments"].mean()
        # Actually E = sum k*P(k)
        E_inst=sum(k*pmf_inst.get(k,0) for k in pmf_inst.index)
        print(f"E[installments]={E_inst:.2f}")
        print(f"Continuous price mean {df_pay['payment_value'].mean():.2f} P(exact)=0 P(100-200)={( (df_pay['payment_value']>=100)&(df_pay['payment_value']<=200) ).mean():.3f}")
else:
    print("Download https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - payment_installments discrete price continuous")
```

Deliverable: Upload random_vars_L06.py + output showing PMF sum=1 CDF P(X≤x) discrete countable PMF table, continuous any value PDF area=1 P(X=x)=0 P(a≤X≤b)=area, E=ΣxP(x) discrete ∫x f(x)dx continuous, linearity, Var=E[X^2]-E^2[X], Bernoulli E=p Var=p(1-p).

Kaggle:
1. Primary https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - payment_installments discrete price continuous
2. Secondary https://www.kaggle.com/datasets/carrie1/ecommerce-data - Quantity discrete UnitPrice continuous

## 9. Checklist
- Explain random variable X number assigned to outcome uncertain before
- Distinguish discrete countable 0,1,2... listable vs continuous any value in interval uncountable
- Define PMF P(X=k) 0-1 sum=1 table bar height probability discrete
- Define CDF F(x)=P(X≤x) sum PMF up to x discrete staircase non-decreasing 0 to 1 P(a<X≤b)=F(b)-F(a)
- Explain continuous P(X=x)=0 exact 0 infinite possibilities but P(a≤X≤b)>0 area
- Define PDF f(x) density curve area between a b = P(a≤X≤b) total area 1 density can >1 but area probability
- Define CDF continuous area from -∞ to x smooth
- Calculate expected E[X]=Σk P(k) discrete average times prob linearity E[aX+b]=aE+b E[X+Y]=E[X]+E[Y]
- Calculate Var=E[(X-E)^2]=Σ(k-E)^2 P(k)=E[X^2]-E^2 Std sqrt Var same units
- Bernoulli one trial 1 success 0 failure P(1)=p E=p Var=p(1-p)

Key Takeaway: Discrete countable PMF sum=1 CDF P(X≤x) stepwise. Continuous any value PDF area=1 P(X=x)=0 P(a≤X≤b)=area. E=ΣxP(x) discrete ∫x f(x)dx continuous linearity. Var=E[X^2]-E^2. Bernoulli p.

