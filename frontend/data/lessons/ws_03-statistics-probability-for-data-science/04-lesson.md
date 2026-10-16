# Lesson 04 - Probability Basics - How Likely Is It?

**Duration:** 90 min | **Level:** Absolute Beginner | **Goal:** Calculate how likely events are from your sales data

## What You Will Learn

In Lesson 1 to Lesson 3, you described data you already have. Now you ask: If next order arrives, how likely it is from Lagos? How likely it is high value? Probability quantifies uncertainty.

Example: You have 100 orders - 70 from Nigeria (NG), 30 from UK. If you pick random order, probability it is from NG = 70/100 = 0.7 = 70%. This helps inventory planning - expect 70% NG orders.

We build from zero, visuals, simple→advanced code.

---

## 1. Why Probability for Sales?

Probability = favorable / total, between 0 and 1, or 0% to 100%.

- 0 = impossible, never happens
- 1 = certain, always happens
- 0.5 = 50% equally likely

Real examples:
- P(NG) = 0.7 means 70% of orders from NG
- P(return) = 0.05 means 5% chance order returned
- P(high value | Lagos) = 0.3 means given order from Lagos, 30% chance high value

---

## 2. Core Concepts - Sample Space, Event, Complement

### Sample Space S

Sample space S = set of all possible outcomes. Like list of all possibilities.

- If you look at country, S = {NG, UK} - only two possible countries
- If you look at city, S = {Ikeja, Lekki, Camden, Garki} - all cities you operate
- If you look at all orders, S = {ORD_001, ORD_002, ..., ORD_100} - all 100 order IDs

### Event A

Event A = subset of S - some outcomes you care about.

- A = {NG} = orders from NG, subset of {NG, UK}
- A = {Ikeja, Lekki} = orders from Lagos area
- A = {high value orders}

### Probability P(A) = Count(A) / Count(S) = favorable / total

If equally likely outcomes, P(A) = number of outcomes in A divided by total outcomes in S.

From data: P(A) = count of A / total count.

Example: 70 NG orders out of 100 total, P(NG) =70/100=0.7

### Complement P(not A) = 1 - P(A)

Probability not A happens = 1 minus probability A happens.

If P(NG)=0.7, then P(not NG)=P(UK)=1-0.7=0.3

Why? Because either NG or not NG must happen, total probability 1.

<svg width="100%" height="250" viewBox="0 0 700 250" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="250" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">SAMPLE SPACE, EVENT, COMPLEMENT</text>
  <rect x="20" y="50" width="200" height="170" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
  <text x="120" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#1E40AF">Sample Space S</text>
  <text x="35" y="90" font-family="Arial" font-size="8" fill="#1E40AF">All possible outcomes</text>
  <text x="35" y="108" font-family="Arial" font-size="8" fill="#1E40AF">S = {NG, UK} countries</text>
  <text x="35" y="126" font-family="Arial" font-size="8" fill="#1E40AF">S = 100 orders</text>
  <text x="35" y="144" font-family="Arial" font-size="8" fill="#1E40AF">S = {Ikeja, Lekki, Camden}</text>
  <text x="35" y="165" font-family="Arial" font-size="9" font-weight="800" fill="#1E40AF">P(S)=1 =100% certain</text>
  <text x="35" y="185" font-family="Arial" font-size="8" fill="#6B7280">Something in S must happen</text>
  <rect x="250" y="50" width="200" height="170" rx="12" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1"/>
  <text x="350" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#065F46">Event A Subset of S</text>
  <text x="265" y="90" font-family="Arial" font-size="8" fill="#065F46">A = {NG} subset of {NG,UK}</text>
  <text x="265" y="108" font-family="Arial" font-size="8" fill="#065F46">A = {Ikeja, Lekki} Lagos</text>
  <text x="265" y="126" font-family="Arial" font-size="8" fill="#065F46">P(A)=count(A)/count(S)</text>
  <text x="265" y="144" font-family="Arial" font-size="8" fill="#065F46">70 NG out of 100 total</text>
  <text x="265" y="162" font-family="Arial" font-size="9" font-weight="800" fill="#065F46">P(NG)=70/100=0.7=70%</text>
  <text x="265" y="180" font-family="Arial" font-size="8" fill="#6B7280">Favorable / Total</text>
  <rect x="480" y="50" width="200" height="170" rx="12" fill="#FFFBEB" stroke="#FCD34D" stroke-width="1"/>
  <text x="580" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#92400E">Complement not A</text>
  <text x="495" y="90" font-family="Arial" font-size="8" fill="#92400E">not A = everything in S</text>
  <text x="495" y="108" font-family="Arial" font-size="8" fill="#92400E">except A</text>
  <text x="495" y="126" font-family="Arial" font-size="8" fill="#92400E">P(not A)=1-P(A)</text>
  <text x="495" y="144" font-family="Arial" font-size="9" fill="#92400E">P(NG)=0.7</text>
  <text x="495" y="162" font-family="Arial" font-size="9" font-weight="800" fill="#92400E">P(not NG)=1-0.7=0.3= P(UK)</text>
  <text x="495" y="180" font-family="Arial" font-size="8" fill="#6B7280">A and not A cover all S</text>
</svg>

### Code Simple→Advanced - Sample Space and Complement

Method 1 Plain Python - Count favorable / total:

```python
# Method 1: Most basic - count favorable over total
orders_country = ["NG"]*70 + ["UK"]*30  # 70 NG, 30 UK
print(f"Total orders: {len(orders_country)}")
print(f"First 5: {orders_country[:5]}, last 5: {orders_country[-5:]}")

# Count NG
count_NG = 0
for country in orders_country:
    if country == "NG":
        count_NG += 1

print(f"Count NG = {count_NG}")

# Probability NG
total = len(orders_country)
p_NG = count_NG / total
print(f"P(NG) = Count NG / Total = {count_NG}/{total} = {p_NG} = {p_NG*100}%")

# Complement P(not NG) = 1 - P(NG)
p_not_NG = 1 - p_NG
print(f"P(not NG) = 1 - P(NG) = 1 - {p_NG} = {p_not_NG} = P(UK)")

# Direct count UK
count_UK = 0
for country in orders_country:
    if country == "UK":
        count_UK += 1
print(f"Direct count UK = {count_UK}, P(UK) = {count_UK}/{total} = {count_UK/total} matches complement {p_not_NG}")

# Rules: 0 ≤ P ≤1, P(S)=1
print(f"Check: 0 ≤ P(NG)={p_NG} ≤1 True, P(S)=P(NG)+P(UK)={p_NG+count_UK/total}=1")
```

Method 2 Using count() method:

```python
# Method 2: Shorter - list.count()
orders_country = ["NG"]*70 + ["UK"]*30
count_NG = orders_country.count("NG")  # count() counts occurrences
total = len(orders_country)
p_NG = count_NG / total
print(f"P(NG) = {count_NG}/{total} = {p_NG}")
print(f"P(not NG) = 1 - {p_NG} = {1-p_NG}")
```

Method 3 NumPy:

```python
import numpy as np
orders = np.array(["NG"]*70 + ["UK"]*30)
p_NG = np.mean(orders == "NG")  # Mean of True/False where True=1 False=0
print(f"P(NG) = mean(orders==NG) = {p_NG} - True=1 False=0 average gives proportion")
print(f"P(not NG) = 1 - {p_NG} = {1-p_NG}")
```

Step 4 Pandas value_counts(normalize=True):

```python
import pandas as pd
df = pd.DataFrame({"country": ["NG"]*70 + ["UK"]*30})
prob = df["country"].value_counts(normalize=True)  # normalize=True gives proportions = probabilities
print(f"P(country):\n{prob}")
print(f"P(NG) = {prob.get('NG',0):.2f}")
print(f"P(not NG) = 1 - P(NG) = {1-prob.get('NG',0):.2f}")
```

---

## 3. Addition Rule - P(A or B)

### What is P(A or B)?

Probability that either A happens or B happens (or both).

Example: P(NG or Accessories) = probability order from NG OR product is Accessories (or both NG and Accessories).

If you add P(NG) + P(Accessories), you double-count orders that are both NG AND Accessories - they counted in both P(NG) and P(Accessories). So subtract intersection once.

**Formula:** P(A or B) = P(A) + P(B) - P(A and B)

Visual: Two circles overlapping (Venn diagram). Adding both circles counts overlap twice, subtract once to count correctly.

### When are Events Mutually Exclusive?

Mutually exclusive = cannot both happen at same time.

Example: One order cannot be both from Ikeja and from Camden at same time (assuming one store per order). So P(Ikeja and Camden)=0, they cannot both happen.

If mutually exclusive, formula simplifies: P(A or B) = P(A) + P(B) - 0 = P(A) + P(B)

Example: P(Ikeja or Camden) = P(Ikeja) + P(Camden) because cannot be both.

<svg width="100%" height="260" viewBox="0 0 700 260" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="260" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="28" text-anchor="middle" font-family="Arial" font-size="13" font-weight="800" fill="#111827">ADDITION RULE - P(A or B) = P(A) + P(B) - P(A and B)</text>
  <g transform="translate(20, 45)">
    <rect width="320" height="200" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
    <text x="160" y="25" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#1E40AF">General - Overlap Subtract</text>
    <text x="16" y="50" font-family="Arial" font-size="9" fill="#1E40AF"><tspan font-weight="bold">A</tspan> = NG, <tspan font-weight="bold">B</tspan> = Accessories</text>
    <text x="16" y="68" font-family="Arial" font-size="9" fill="#1E40AF">Some orders are both NG and Accessories</text>
    <text x="16" y="86" font-family="Arial" font-size="9" fill="#1E40AF">Overlap = P(A and B)</text>
    <text x="16" y="104" font-family="Arial" font-size="9" fill="#1E40AF">P(A or B) = P(A) + P(B) - P(A and B)</text>
    <text x="16" y="122" font-family="Arial" font-size="9" fill="#1E40AF">Subtract overlap to avoid double counting</text>
    <line x1="16" y1="135" x2="304" y2="135" stroke="#93C5FD" stroke-width="0.75" />
    <text x="16" y="153" font-family="Arial" font-size="9" font-weight="800" fill="#1E40AF">Example: P(NG)=0.7, P(Acc)=0.6</text>
    <text x="16" y="171" font-family="Arial" font-size="9" fill="#1E40AF">P(NG and Acc) = 0.4</text>
    <text x="16" y="189" font-family="Arial" font-size="9" font-weight="bold" fill="#1E40AF">P(NG or Acc) = 0.7 + 0.6 - 0.4 = 0.9</text>
  </g>
  <g transform="translate(360, 45)">
    <rect width="320" height="200" rx="12" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1"/>
    <text x="160" y="25" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#065F46">Mutually Exclusive - No Overlap</text>
    <text x="16" y="50" font-family="Arial" font-size="9" fill="#065F46"><tspan font-weight="bold">A</tspan> = Ikeja, <tspan font-weight="bold">B</tspan> = Camden</text>
    <text x="16" y="68" font-family="Arial" font-size="9" fill="#065F46">One order cannot be from both stores</text>
    <text x="16" y="86" font-family="Arial" font-size="9" fill="#065F46">P(A and B) = 0 (cannot happen together)</text>
    <text x="16" y="104" font-family="Arial" font-size="9" fill="#065F46">P(A or B) = P(A) + P(B) - 0</text>
    <line x1="16" y1="135" x2="304" y2="135" stroke="#86EFAC" stroke-width="0.75" />
    <text x="16" y="153" font-family="Arial" font-size="9" font-weight="800" fill="#065F46">P(Ikeja or Camden) = P(Ikeja) + P(Camden)</text>
    <text x="16" y="171" font-family="Arial" font-size="9" fill="#065F46">No subtraction needed</text>
    <text x="16" y="189" font-family="Arial" font-size="9" font-weight="bold" fill="#065F46">Mutually exclusive simplifies addition</text>
  </g>
</svg>




### Code Simple→Advanced - Addition Rule

Method 1 Plain Python - Count or:

```python
# Method 1: Manual P(A or B)
orders = [
    {"country": "NG", "product": "Accessories"},
    {"country": "NG", "product": "Display"},
    {"country": "UK", "product": "Accessories"},
    {"country": "NG", "product": "Accessories"},
    {"country": "UK", "product": "Display"},
]
print(f"Orders: {orders}")

# Count P(NG)
count_NG = sum(1 for o in orders if o["country"]=="NG")
# Count P(Accessories)
count_Acc = sum(1 for o in orders if o["product"]=="Accessories")
# Count P(NG and Accessories)
count_both = sum(1 for o in orders if o["country"]=="NG" and o["product"]=="Accessories")
# Count P(NG or Accessories) - direct
count_or = sum(1 for o in orders if o["country"]=="NG" or o["product"]=="Accessories")

total = len(orders)
p_NG = count_NG/total
p_Acc = count_Acc/total
p_both = count_both/total
p_or_formula = p_NG + p_Acc - p_both
p_or_direct = count_or/total

print(f"P(NG)={count_NG}/{total}={p_NG:.2f}")
print(f"P(Acc)={count_Acc}/{total}={p_Acc:.2f}")
print(f"P(NG and Acc)={count_both}/{total}={p_both:.2f}")
print(f"P(NG or Acc)=P(NG)+P(Acc)-P(both)={p_NG:.2f}+{p_Acc:.2f}-{p_both:.2f}={p_or_formula:.2f}")
print(f"Direct count P(NG or Acc)={count_or}/{total}={p_or_direct:.2f} matches formula")
```

Method 2 Pandas:

```python
import pandas as pd
df = pd.DataFrame([
    {"country": "NG", "product": "Accessories"},
    {"country": "NG", "product": "Display"},
    {"country": "UK", "product": "Accessories"},
    {"country": "NG", "product": "Accessories"},
])

p_NG = (df["country"]=="NG").mean()  # mean of True/False gives proportion
p_Acc = (df["product"]=="Accessories").mean()
p_both = ((df["country"]=="NG") & (df["product"]=="Accessories")).mean()
p_or = p_NG + p_Acc - p_both

print(f"P(NG)={p_NG:.2f}, P(Acc)={p_Acc:.2f}, P(both)={p_both:.2f}, P(or)={p_or:.2f}")
print(f"Direct or {( (df['country']=='NG') | (df['product']=='Accessories') ).mean():.2f} matches")

# Mutually exclusive example: city Ikeja or Camden cannot both
df_city = pd.DataFrame({"city": ["Ikeja", "Camden", "Ikeja", "Lekki"]})
p_Ikeja = (df_city["city"]=="Ikeja").mean()
p_Camden = (df_city["city"]=="Camden").mean()
p_Ikeja_or_Camden = p_Ikeja + p_Camden  # No subtraction because mutually exclusive P(both)=0
print(f"\nMutually exclusive: P(Ikeja)={p_Ikeja:.2f} P(Camden)={p_Camden:.2f} P(Ikeja or Camden)={p_Ikeja_or_Camden:.2f}=P(Ikeja)+P(Camden)")
```

---

## 4. Multiplication Rule - P(A and B)

### What is P(A and B)?

Probability both A and B happen.

Example: P(NG and Accessories) = probability order from NG AND product Accessories.

**Formula:** P(A and B) = P(A) * P(B|A) = P(B) * P(A|B)

P(B|A) = conditional probability = probability B given A happened. We will deep dive in next lesson L05, but preview: P(Accessories | NG) = probability product is Accessories given order from NG.

If A and B independent (occurrence of A does not affect B), then P(B|A)=P(B), so P(A and B)=P(A)*P(B)

**Important Distinction:**
- Mutually exclusive = cannot both happen, P(A and B)=0
- Independent = occurrence of one does not affect probability of other, P(B|A)=P(B), P(A and B)=P(A)P(B)

Mutually exclusive with P>0 cannot be independent! If they cannot both happen, occurrence of one affects other (makes it impossible).

### Code Simple→Advanced - Multiplication

Method 1 Plain Python:

```python
# Method 1: P(A and B) = P(A) * P(B|A)
orders = [
    {"country": "NG", "product": "Accessories"},
    {"country": "NG", "product": "Display"},
    {"country": "NG", "product": "Accessories"},
    {"country": "UK", "product": "Accessories"},
]

total = len(orders)
count_NG = sum(1 for o in orders if o["country"]=="NG")
count_Acc_given_NG = sum(1 for o in orders if o["country"]=="NG" and o["product"]=="Accessories")

p_NG = count_NG/total
# P(Acc | NG) = count(NG and Acc) / count(NG)
p_Acc_given_NG = count_Acc_given_NG / count_NG if count_NG>0 else 0

p_both = p_NG * p_Acc_given_NG
print(f"P(NG)={count_NG}/{total}={p_NG:.2f}")
print(f"P(Acc|NG)=count(NG and Acc)/count(NG)={count_Acc_given_NG}/{count_NG}={p_Acc_given_NG:.2f}")
print(f"P(NG and Acc)=P(NG)*P(Acc|NG)={p_NG:.2f}*{p_Acc_given_NG:.2f}={p_both:.2f}")

# Direct count check
count_both = sum(1 for o in orders if o["country"]=="NG" and o["product"]=="Accessories")
print(f"Direct count P(NG and Acc)={count_both}/{total}={count_both/total:.2f} matches")
```

Method 2 Pandas with independence check:

```python
import pandas as pd
df = pd.DataFrame([
    {"country": "NG", "product": "Accessories"},
    {"country": "NG", "product": "Display"},
    {"country": "NG", "product": "Accessories"},
    {"country": "UK", "product": "Accessories"},
])

p_NG = (df["country"]=="NG").mean()
p_Acc = (df["product"]=="Accessories").mean()
p_Acc_given_NG = df[df["country"]=="NG"]["product"].value_counts(normalize=True).get("Accessories",0)
p_both = (df["country"]=="NG").mean() * p_Acc_given_NG

print(f"P(NG)={p_NG:.2f}, P(Acc)={p_Acc:.2f}, P(Acc|NG)={p_Acc_given_NG:.2f}")
print(f"P(NG and Acc)=P(NG)*P(Acc|NG)={p_both:.2f}")
print(f"Check independence: P(Acc|NG)={p_Acc_given_NG:.2f} vs P(Acc)={p_Acc:.2f} - {'Approximately independent' if abs(p_Acc_given_NG-p_Acc)<0.1 else 'Not independent, product depends on country'}")

# If independent, P(NG and Acc) should ≈ P(NG)*P(Acc)
p_both_independent = p_NG * p_Acc
print(f"If independent, P(NG and Acc) should be P(NG)*P(Acc)={p_NG:.2f}*{p_Acc:.2f}={p_both_independent:.2f}, actual {p_both:.2f} - close? {abs(p_both-p_both_independent)<0.05}")
```

---

## 5. Permutations and Combinations - Counting Ways

### What are They?

- **Permutations:** Order matters. Ways to arrange k items from n in order.
- **Combinations:** Order doesn't matter. Ways to choose k items from n.

Example: You have 5 stores, want to choose 2 for promotion.
- If order matters (first store gets gold award, second silver), permutations count.
- If order doesn't matter (both get promotion), combinations count.

**Formulas:**
- Permutations P(n,k)= n! / (n-k)! 
- Combinations C(n,k)= n! / (k! (n-k)!)

n! = n factorial = n * (n-1)*...*1, 0! =1

Example: C(5,2)=5!/(2!3!)=10 ways to choose 2 stores from 5.

<svg width="100%" height="150" viewBox="0 0 700 150" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="150" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">PERMUTATIONS vs COMBINATIONS</text>
  <rect x="20" y="50" width="300" height="80" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
  <text x="170" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#1E40AF">Permutations Order Matters</text>
  <text x="35" y="90" font-family="Arial" font-size="8" fill="#1E40AF">P(5,2)=5!/(5-2)!=20 arrangements</text>
  <text x="35" y="108" font-family="Arial" font-size="8" fill="#1E40AF">Gold/Silver award - order matters</text>
  <rect x="380" y="50" width="300" height="80" rx="12" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1"/>
  <text x="530" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#065F46">Combinations Order Doesn't Matter</text>
  <text x="395" y="90" font-family="Arial" font-size="8" fill="#065F46">C(5,2)=5!/(2!3!)=10 choices</text>
  <text x="395" y="108" font-family="Arial" font-size="8" fill="#065F46">Both get promotion - order irrelevant</text>
</svg>

### Code:

```python
import math

def perm(n,k):
    return math.factorial(n)//math.factorial(n-k)

def comb(n,k):
    return math.factorial(n)//(math.factorial(k)*math.factorial(n-k))

print(f"P(5,3)=arrangements of 3 stores from 5 for display order matters = {perm(5,3)}")
print(f"C(5,2)=choices of 2 stores from 5 for promo order doesn't matter = {comb(5,2)}")

# Example: Stores [LAG_001_Ikeja, LAG_002_Lekki, LDN_001_Camden, ABJ_001_Garki, LAG_003_VI] choose 2 for promo = 10 ways
stores = ["LAG_001_Ikeja", "LAG_002_Lekki", "LDN_001_Camden", "ABJ_001_Garki", "LAG_003_VI"]
print(f"Stores {stores}")
print(f"Number of ways to choose 2 for promotion C(5,2)={comb(5,2)}")
```

---

## 6. Real Store Example - Where Location Adds Context

```python
import pandas as pd

orders = [
    {"order_id": "ORD_LAG_001_5001", "store_id": "LAG_001_Ikeja", "city": "Ikeja", "country": "NG", "product_cat": "Accessories"},
    {"order_id": "ORD_LAG_002_5002", "store_id": "LAG_002_Lekki", "city": "Lekki", "country": "NG", "product_cat": "Accessories"},
    {"order_id": "ORD_LAG_003_5003", "store_id": "LAG_003_VI", "city": "Victoria Island", "country": "NG", "product_cat": "Display"},
    {"order_id": "ORD_LDN_001_2001", "store_id": "LDN_001_Camden", "city": "Camden", "country": "UK", "product_cat": "Accessories"},
    {"order_id": "ORD_ABJ_001_3001", "store_id": "ABJ_001_Garki", "city": "Garki", "country": "NG", "product_cat": "Accessories"},
]

df = pd.DataFrame(orders)

# P(NG) and P(UK)
prob_country = df["country"].value_counts(normalize=True)
print(f"P(Country):\n{prob_country}")
print(f"P(NG)={prob_country.get('NG',0):.2f}, P(UK)={prob_country.get('UK',0):.2f}, sum 1")

# Complement
p_ikeja = (df["city"]=="Ikeja").mean()
print(f"P(Ikeja)={p_ikeja:.2f}, P(not Ikeja)={1-p_ikeja:.2f}")

# Addition: P(NG or Accessories)
p_ng = (df["country"]=="NG").mean()
p_acc = (df["product_cat"]=="Accessories").mean()
p_both = ((df["country"]=="NG") & (df["product_cat"]=="Accessories")).mean()
p_or = p_ng + p_acc - p_both
print(f"P(NG)={p_ng:.2f} P(Acc)={p_acc:.2f} P(both)={p_both:.2f} P(NG or Acc)={p_or:.2f}")

# Mutually exclusive: Ikeja or Camden cannot both in same order
p_ikeja = (df["city"]=="Ikeja").mean()
p_camden = (df["city"]=="Camden").mean()
print(f"Mutually exclusive P(Ikeja or Camden)=P(Ikeja)+P(Camden)={p_ikeja+p_camden:.2f} because P(both)=0")

# Multiplication and independence
p_acc_given_ng = df[df["country"]=="NG"]["product_cat"].value_counts(normalize=True).get("Accessories",0)
print(f"P(Acc|NG)={p_acc_given_ng:.2f} P(Acc)={p_acc:.2f} - check independence")
```

---

## 7. Hands-On Assignment - Simple to Advanced

Dataset: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - customer_state, payment_type categorical

Create probability_basics_L04.py:

Section A Plain Python Basic Prob:

```python
orders=["NG"]*70+["UK"]*30
count_NG=orders.count("NG")
total=len(orders)
p_NG=count_NG/total
print(f"P(NG)={count_NG}/{total}={p_NG} P(not NG)=1-P(NG)={1-p_NG}")
```

Section B Addition Rule:

```python
orders=[
    {"country":"NG","product":"Accessories"},
    {"country":"NG","product":"Display"},
    {"country":"UK","product":"Accessories"},
]
total=len(orders)
p_NG=sum(1 for o in orders if o["country"]=="NG")/total
p_Acc=sum(1 for o in orders if o["product"]=="Accessories")/total
p_both=sum(1 for o in orders if o["country"]=="NG" and o["product"]=="Accessories")/total
p_or=p_NG+p_Acc-p_both
print(f"P(NG or Acc)=P(NG)+P(Acc)-P(both)={p_NG:.2f}+{p_Acc:.2f}-{p_both:.2f}={p_or:.2f}")
# Mutually exclusive
print(f"Mutually exclusive P(Ikeja or Camden)=P(Ikeja)+P(Camden) because cannot both")
```

Section C Multiplication Independence:

```python
orders=[
    {"country":"NG","product":"Accessories"},
    {"country":"NG","product":"Display"},
    {"country":"NG","product":"Accessories"},
]
total=len(orders)
p_NG=sum(1 for o in orders if o["country"]=="NG")/total
# P(Acc|NG)=count(NG and Acc)/count(NG)
count_NG=sum(1 for o in orders if o["country"]=="NG")
count_both=sum(1 for o in orders if o["country"]=="NG" and o["product"]=="Accessories")
p_Acc_given_NG=count_both/count_NG if count_NG>0 else 0
p_both=p_NG*p_Acc_given_NG
print(f"P(NG and Acc)=P(NG)*P(Acc|NG)={p_NG:.2f}*{p_Acc_given_NG:.2f}={p_both:.2f}")
```

Section D Permutations Combinations:

```python
import math
def perm(n,k): return math.factorial(n)//math.factorial(n-k)
def comb(n,k): return math.factorial(n)//(math.factorial(k)*math.factorial(n-k))
print(f"P(5,3)={perm(5,3)} arrangements C(5,2)={comb(5,2)} choices")
```

Section E Kaggle:

```python
import os, pandas as pd
if os.path.exists("olist_customers_dataset.csv"):
    df=pd.read_csv("olist_customers_dataset.csv", nrows=10000)
    prob=df["customer_state"].value_counts(normalize=True)
    print(f"P(SP)={prob.get('SP',0):.3f} P(not SP)={1-prob.get('SP',0):.3f}")
    # Need payments file for payment_type
    if os.path.exists("olist_order_payments_dataset.csv"):
        df_pay=pd.read_csv("olist_order_payments_dataset.csv", nrows=10000)
        # Merge logic simplified - just show P(payment_type)
        prob_pay=df_pay["payment_type"].value_counts(normalize=True)
        print(f"P(payment_type):\n{prob_pay}")
        # P(SP and credit_card) requires join - for assignment show concept
else:
    print("Download https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - customer_state payment_type")
```

Deliverable: Upload probability_basics_L04.py + output showing P(NG)=0.7 P(not NG)=0.3 addition with subtraction P(NG or Acc), mutually exclusive P(Ikeja or Camden)=P(Ikeja)+P(Camden), multiplication P(NG and Acc)=P(NG)P(Acc|NG), independence check, permutations combinations, and Kaggle P(state) P(payment_type).

Kaggle:
1. Primary https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce customer_state payment_type
2. Secondary https://www.kaggle.com/datasets/vivek468/superstore-dataset-final Region Category

## 8. Checklist
- Define sample space S all outcomes, event A subset, P(A)=count(A)/total 0≤P≤1 P(S)=1 P(not A)=1-P(A)
- Apply addition P(A or B)=P(A)+P(B)-P(A and B) subtract overlap
- Identify mutually exclusive cannot both happen P(A and B)=0 so P(A or B)=P(A)+P(B)
- Apply multiplication P(A and B)=P(A)P(B|A) conditional preview
- Distinguish independent P(B|A)=P(B) so P(A and B)=P(A)P(B) vs mutually exclusive different concepts
- Calculate permutations P(n,k)=n!/(n-k)! order matters combinations C(n,k)=n!/(k!(n-k)!) order doesn't
- Calculate prob from data value_counts(normalize=True) or mean of boolean mask

Key Takeaway: P(A)=favorable/total 0-1 P(not A)=1-P(A). Addition P(A or B)=P(A)+P(B)-P(A and B). Mutually exclusive cannot both P(A and B)=0 addition no subtraction. Multiplication P(A and B)=P(A)P(B|A). Independent occurrence doesn't affect probability P(B|A)=P(B) so P(A and B)=P(A)P(B). Permutations order matters combinations doesn't.

