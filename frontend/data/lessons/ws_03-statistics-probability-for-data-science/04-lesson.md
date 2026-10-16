# Lesson 04 - Probability Basics - Events, Sample Space, Rules

**Duration:** 45 min | **Level:** Beginner | **Goal:** Calculate probabilities from real sales data

## Learning Objectives
- Define sample space, events, complementary events
- Apply addition and multiplication rules
- Distinguish independent vs mutually exclusive events
- Calculate probabilities using Pandas value_counts(normalize=True)

---

## 1. Why Probability for Sales?

You have 100 orders: 70 from Nigeria (NG) stores, 30 from UK. If you pick a random order, what is P(NG) = 0.7? If you know 60 of NG orders are from Lagos, what is P(Lagos | NG)? Probability quantifies uncertainty for inventory, fraud detection, demand forecasting.

## 2. Core Concepts - Verified

<svg width="100%" height="190" viewBox="0 0 700 190" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="190" rx="16" fill="#FFFFFF"/>
  <text x="350" y="28" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">PROBABILITY RULES</text>
  <rect x="20" y="50" width="200" height="120" rx="12" fill="#DBEAFE" stroke="#1E40AF" stroke-width="1.5"/>
  <text x="120" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#1E3A8A">BASIC</text>
  <text x="30" y="90" font-family="Arial" font-size="8" fill="#1E3A8A">Sample Space S = all outcomes</text>
  <text x="30" y="105" font-family="Arial" font-size="8" fill="#1E3A8A">Event A subset of S</text>
  <text x="30" y="120" font-family="Arial" font-size="8" fill="#1E3A8A">P(A) = favorable / total</text>
  <text x="30" y="135" font-family="Arial" font-size="8" fill="#1E3A8A">0 ≤ P(A) ≤1, P(S)=1</text>
  <text x="30" y="150" font-family="Arial" font-size="8" fill="#1E3A8A">P(not A)=1-P(A)</text>
  <rect x="250" y="50" width="200" height="120" rx="12" fill="#D1FAE5" stroke="#065F46" stroke-width="1.5"/>
  <text x="350" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#064E3B">ADDITION</text>
  <text x="265" y="90" font-family="Arial" font-size="8" fill="#064E3B">P(A or B)=P(A)+P(B)-P(A and B)</text>
  <text x="265" y="105" font-family="Arial" font-size="8" fill="#064E3B">If mutually exclusive:</text>
  <text x="265" y="120" font-family="Arial" font-size="8" fill="#064E3B">P(A or B)=P(A)+P(B)</text>
  <text x="265" y="135" font-family="Arial" font-size="8" fill="#064E3B">Mutually exclusive = cannot</text>
  <text x="265" y="150" font-family="Arial" font-size="8" fill="#064E3B">both happen at same time</text>
  <rect x="480" y="50" width="200" height="120" rx="12" fill="#FEF3C7" stroke="#92400E" stroke-width="1.5"/>
  <text x="580" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#92400E">MULTIPLICATION</text>
  <text x="495" y="90" font-family="Arial" font-size="8" fill="#92400E">P(A and B)=P(A)P(B|A)</text>
  <text x="495" y="105" font-family="Arial" font-size="8" fill="#92400E">If independent:</text>
  <text x="495" y="120" font-family="Arial" font-size="8" fill="#92400E">P(A and B)=P(A)P(B)</text>
  <text x="495" y="135" font-family="Arial" font-size="8" fill="#92400E">Independent = occurrence of</text>
  <text x="495" y="150" font-family="Arial" font-size="8" fill="#92400E">A does not affect P(B)</text>
</svg>

**Verified Definitions:**

1. **Sample Space S:** Set of all possible outcomes. Example: S = {all orders}, or S = {NG, UK} for country.

2. **Event A:** Subset of S. Example: A = {orders from Lagos}. P(A) = favorable outcomes / total outcomes (if equally likely) or count(A)/count(S) from data.

3. **Complementary:** P(not A) = 1 - P(A). If P(NG)=0.7, then P(not NG)=P(UK)=0.3.

4. **Addition Rule:** P(A or B) = P(A) + P(B) - P(A and B). Subtract intersection to avoid double counting.

5. **Mutually Exclusive:** Events cannot both happen at same time. Example: Order cannot be both from LAG_001_Ikeja and LDN_001_Camden simultaneously (assuming one store per order). Then P(A and B)=0, so P(A or B)=P(A)+P(B).

6. **Multiplication Rule:** P(A and B) = P(A) × P(B|A) = P(B) × P(A|B). P(B|A) is conditional probability.

7. **Independent:** P(B|A)=P(B). Occurrence of A does not affect B. Example: If store location independent of product category, then P(Lagos and Accessories)=P(Lagos)×P(Accessories). In real data, often not independent - need to check.

8. **Permutations and Combinations:** Permutations order matters: P(n,k)=n!/(n-k)!. Combinations order doesn't: C(n,k)=n!/(k!(n-k)!). Example: Number of ways to choose 2 stores from 5 for promotion = C(5,2)=10.

## 3. Real Example - Calculating from Data

```python
import pandas as pd

# Sample orders - where location IDs add meaning for probability context
orders = [
    {"order_id": "ORD_LAG_001_5001", "store_id": "LAG_001_Ikeja", "city": "Ikeja", "country": "NG", "product_cat": "Accessories"},
    {"order_id": "ORD_LAG_002_5002", "store_id": "LAG_002_Lekki", "city": "Lekki", "country": "NG", "product_cat": "Accessories"},
    {"order_id": "ORD_LAG_003_5003", "store_id": "LAG_003_VI", "city": "Victoria Island", "country": "NG", "product_cat": "Display"},
    {"order_id": "ORD_LDN_001_2001", "store_id": "LDN_001_Camden", "city": "Camden", "country": "UK", "product_cat": "Accessories"},
    {"order_id": "ORD_ABJ_001_3001", "store_id": "ABJ_001_Garki", "city": "Garki", "country": "NG", "product_cat": "Accessories"},
    {"order_id": "ORD_LAG_001_5004", "store_id": "LAG_001_Ikeja", "city": "Ikeja", "country": "NG", "product_cat": "Display"},
]

df = pd.DataFrame(orders)
print(f"Total orders n={len(df)}")

# P(NG) and P(UK)
prob_country = df['country'].value_counts(normalize=True)
print(f"\nP(Country):\n{prob_country}")
print(f"P(NG) = {prob_country.get('NG',0):.2f}, P(UK) = {prob_country.get('UK',0):.2f}, Sum = {prob_country.sum():.2f} = 1")

# P(Lagos = Ikeja, Lekki, VI)
prob_city = df['city'].value_counts(normalize=True)
print(f"\nP(City):\n{prob_city}")

# Complementary: P(not Ikeja) = 1 - P(Ikeja)
p_ikeja = prob_city.get('Ikeja',0)
print(f"\nP(Ikeja)={p_ikeja:.2f}, P(not Ikeja)=1-P(Ikeja)={1-p_ikeja:.2f}")

# Addition: P(NG or Accessories) - need P(NG and Accessories)
# P(A or B) = P(A)+P(B)-P(A and B)
p_ng = (df['country']=='NG').mean()
p_acc = (df['product_cat']=='Accessories').mean()
p_ng_and_acc = ((df['country']=='NG') & (df['product_cat']=='Accessories')).mean()
p_ng_or_acc = p_ng + p_acc - p_ng_and_acc
print(f"\nP(NG)={p_ng:.2f}, P(Accessories)={p_acc:.2f}, P(NG and Accessories)={p_ng_and_acc:.2f}")
print(f"P(NG or Accessories)=P(NG)+P(Acc)-P(NG and Acc) = {p_ng:.2f}+{p_acc:.2f}-{p_ng_and_acc:.2f} = {p_ng_or_acc:.2f}")
print(f"Direct count check: {((df['country']=='NG') | (df['product_cat']=='Accessories')).mean():.2f} matches")

# Mutually exclusive example: P(Ikeja or Camden) - cannot be both in same order
# For same order, these are mutually exclusive (assuming one city per order)
p_ikeja = (df['city']=='Ikeja').mean()
p_camden = (df['city']=='Camden').mean()
# Since mutually exclusive, P(Ikeja and Camden)=0
p_ikeja_or_camden = p_ikeja + p_camden  # No subtraction
print(f"\nP(Ikeja)={p_ikeja:.2f}, P(Camden)={p_camden:.2f}, Mutually exclusive so P(Ikeja or Camden)=P(Ikeja)+P(Camden)={p_ikeja_or_camden:.2f}")
print(f"Direct check: {((df['city']=='Ikeja') | (df['city']=='Camden')).mean():.2f}")

# Multiplication and independence check
# P(NG and Accessories) = P(NG) * P(Accessories|NG)
p_acc_given_ng = df[df['country']=='NG']['product_cat'].value_counts(normalize=True).get('Accessories',0)
p_ng_and_acc_formula = p_ng * p_acc_given_ng
print(f"\nP(Accessories|NG)={p_acc_given_ng:.2f}, P(NG and Acc)=P(NG)*P(Acc|NG)={p_ng:.2f}*{p_acc_given_ng:.2f}={p_ng_and_acc_formula:.2f} matches {p_ng_and_acc:.2f}")

# Independence check: If independent, P(Acc|NG) should ≈ P(Acc)
print(f"P(Acc)={p_acc:.2f}, P(Acc|NG)={p_acc_given_ng:.2f} - {'Approximately independent' if abs(p_acc-p_acc_given_ng)<0.1 else 'Not independent, product preference depends on country'}")

# Permutations and combinations
import math
def perm(n,k): return math.factorial(n)//math.factorial(n-k)
def comb(n,k): return math.factorial(n)//(math.factorial(k)*math.factorial(n-k))

print(f"\nPermutations: Ways to arrange 3 stores from 5 for display order matters P(5,3)={perm(5,3)}")
print(f"Combinations: Ways to choose 2 stores from 5 for promotion order doesn't matter C(5,2)={comb(5,2)}")
# Example: Choose 2 stores from [LAG_001_Ikeja, LAG_002_Lekki, LDN_001_Camden, ABJ_001_Garki, LAG_003_VI] for promo = 10 ways
```

**Interpretation:** Probability from data is count divided by total. Addition rule subtracts overlap. Mutually exclusive means cannot both happen, so no subtraction. Independence means P(B|A)=P(B).

## 4. Hands-On Assignment with Kaggle Dataset

**Dataset:**
- Primary: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - customer_state, payment_type, order_status are categorical for probability
- Secondary: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final - Region, Category, Segment categorical

**Task - Create `probability_basics_L04.py`:**

```python
import pandas as pd
import os
import math

print("=== Part 1: Basic Probability from Counts ===")
# Simulate orders by country
orders = ['NG']*70 + ['UK']*30
import random
random.seed(42)
# Add product categories
cats = ['Accessories']*60 + ['Display']*40
# Pair randomly
df = pd.DataFrame({'country': orders, 'product_cat': [random.choice(cats) for _ in range(100)]})

prob_country = df['country'].value_counts(normalize=True)
print(f"P(NG)={prob_country.get('NG',0):.2f}, P(UK)={prob_country.get('UK',0):.2f}")

prob_cat = df['product_cat'].value_counts(normalize=True)
print(f"P(Accessories)={prob_cat.get('Accessories',0):.2f}, P(Display)={prob_cat.get('Display',0):.2f}")

# Complementary
print(f"P(not NG)=1-P(NG)={1-prob_country.get('NG',0):.2f} = P(UK)")

# Addition rule
p_ng = (df['country']=='NG').mean()
p_acc = (df['product_cat']=='Accessories').mean()
p_ng_and_acc = ((df['country']=='NG') & (df['product_cat']=='Accessories')).mean()
p_ng_or_acc = p_ng + p_acc - p_ng_and_acc
print(f"\nP(NG or Acc)=P(NG)+P(Acc)-P(NG and Acc)={p_ng:.2f}+{p_acc:.2f}-{p_ng_and_acc:.2f}={p_ng_or_acc:.2f}")
print(f"Direct count: {((df['country']=='NG') | (df['product_cat']=='Accessories')).mean():.2f}")

# Mutually exclusive
p_ikeja_like = 0.3
p_camden_like = 0.1
print(f"\nIf mutually exclusive (one order cannot be Ikeja and Camden), P(Ikeja or Camden)=P(Ikeja)+P(Camden)={p_ikeja_like+p_camden_like:.2f}")

# Conditional and independence
p_acc_given_ng = df[df['country']=='NG']['product_cat'].value_counts(normalize=True).get('Accessories',0)
print(f"\nP(Acc|NG)={p_acc_given_ng:.2f}, P(Acc)={p_acc:.2f}, {'Independent' if abs(p_acc-p_acc_given_ng)<0.05 else 'Not independent'}")

# Permutations/combinations
def perm(n,k): return math.factorial(n)//math.factorial(n-k)
def comb(n,k): return math.factorial(n)//(math.factorial(k)*math.factorial(n-k))
print(f"\nP(5,3)={perm(5,3)} arrangements, C(5,2)={comb(5,2)} choices")
print(f"Example: 5 stores, choose 2 for promo = {comb(5,2)} ways")

print("\n=== Part 2: Kaggle Dataset Probability ===")
kaggle_files = ["olist_customers_dataset.csv", "olist_order_payments_dataset.csv", "Superstore.csv"]
found = None
for kf in kaggle_files:
    if os.path.exists(kf):
        found = kf
        break

if found:
    print(f"Found {found}")
    df_k = pd.read_csv(found, encoding="utf-8", low_memory=False, nrows=10000)
    
    if "customer_state" in df_k.columns:
        prob_state = df_k["customer_state"].value_counts(normalize=True)
        print(f"\nTop 3 states by P(state):")
        print(prob_state.head(3))
        print(f"P(SP)={prob_state.get('SP',0):.3f}, P(not SP)=1-P(SP)={1-prob_state.get('SP',0):.3f}")
    
    if "payment_type" in df_k.columns:
        prob_pay = df_k["payment_type"].value_counts(normalize=True)
        print(f"\nP(payment_type):")
        print(prob_pay)
    
    if "customer_state" in df_k.columns and "payment_type" in df_k.columns:
        # P(SP and credit_card)
        p_sp = (df_k["customer_state"]=="SP").mean()
        p_cc = (df_k["payment_type"]=="credit_card").mean()
        p_sp_and_cc = ((df_k["customer_state"]=="SP") & (df_k["payment_type"]=="credit_card")).mean()
        p_sp_or_cc = p_sp + p_cc - p_sp_and_cc
        print(f"\nP(SP)={p_sp:.3f}, P(credit_card)={p_cc:.3f}, P(SP and credit_card)={p_sp_and_cc:.3f}")
        print(f"P(SP or credit_card)={p_sp:.3f}+{p_cc:.3f}-{p_sp_and_cc:.3f}={p_sp_or_cc:.3f}")
        # Conditional
        p_cc_given_sp = df_k[df_k["customer_state"]=="SP"]["payment_type"].value_counts(normalize=True).get("credit_card",0)
        print(f"P(credit_card|SP)={p_cc_given_sp:.3f}, P(credit_card)={p_cc:.3f} - Check independence")
    
    if "Region" in df_k.columns:
        prob_region = df_k["Region"].value_counts(normalize=True)
        print(f"\nP(Region):")
        print(prob_region)

else:
    print("No Kaggle file. Download:")
    print("  https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - customer_state, payment_type categorical")
    print("  https://www.kaggle.com/datasets/vivek468/superstore-dataset-final - Region, Category, Segment")

print("\n=== Summary ===")
print("Sample space S all outcomes, event A subset, P(A)=count(A)/count(S), 0≤P≤1, P(S)=1, P(not A)=1-P(A)")
print("Addition: P(A or B)=P(A)+P(B)-P(A and B), if mutually exclusive P(A or B)=P(A)+P(B)")
print("Multiplication: P(A and B)=P(A)P(B|A), if independent P(A and B)=P(A)P(B)")
print("Independent: P(B|A)=P(B), mutually exclusive: P(A and B)=0")
print("Permutations order matters P(n,k)=n!/(n-k)!, combinations order doesn't C(n,k)=n!/(k!(n-k)!)")
```

**Deliverable:** Upload `probability_basics_L04.py` plus console output showing P(NG), P(UK), P(not NG)=1-P(NG), addition rule with subtraction, mutually exclusive addition without subtraction, conditional P(Acc|NG), independence check, permutations/combinations, and if Kaggle present, P(state), P(payment_type), P(SP and credit_card), P(SP or credit_card), P(credit_card|SP).

**Kaggle Links:**
1. Primary: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - customer_state, payment_type, order_status categorical for probability
2. Secondary: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final - Region, Category, Segment

## 5. Checklist

- Can you define sample space S, event A, P(A)=favorable/total, 0≤P≤1, P(S)=1, P(not A)=1-P(A)?
- Can you apply addition rule P(A or B)=P(A)+P(B)-P(A and B) and know to subtract intersection?
- Can you identify mutually exclusive events cannot both happen P(A and B)=0 so P(A or B)=P(A)+P(B)?
- Can you apply multiplication rule P(A and B)=P(A)P(B|A) and define conditional P(B|A)=P(A and B)/P(A)?
- Can you distinguish independent P(B|A)=P(B) so P(A and B)=P(A)P(B) vs mutually exclusive?
- Can you calculate permutations P(n,k)=n!/(n-k)! order matters and combinations C(n,k)=n!/(k!(n-k)!) order doesn't?
- Can you calculate probabilities from data using value_counts(normalize=True) or mean of boolean mask?
- Can you check independence by comparing P(B|A) vs P(B) from real data?

If yes, you have probability foundation.

Next: Conditional Probability & Bayes Theorem.

**Key Takeaway:** Sample space S all outcomes, event A subset, P(A)=count(A)/total, 0-1, P(not A)=1-P(A). Addition: P(A or B)=P(A)+P(B)-P(A and B). Mutually exclusive cannot both happen, so P(A and B)=0, addition no subtraction. Multiplication: P(A and B)=P(A)P(B|A). Independent means occurrence of A doesn't affect B, P(B|A)=P(B), so P(A and B)=P(A)P(B). From data, P = count/total. Permutations order matters, combinations doesn't.

**Notes Verified:**
- Sample space, event, P(A)=favorable/total, 0≤P≤1, P(S)=1, P(not A)=1-P(A) verified
- Addition rule P(A or B)=P(A)+P(B)-P(A and B) verified, mutually exclusive P(A and B)=0 so P(A or B)=P(A)+P(B) verified
- Multiplication rule P(A and B)=P(A)P(B|A)=P(B)P(A|B) verified
- Independent definition P(B|A)=P(B) and P(A and B)=P(A)P(B) if independent verified
- Mutually exclusive vs independent distinction: mutually exclusive cannot both happen, independent occurrence doesn't affect probability - verified they are different concepts, mutually exclusive with P>0 cannot be independent
- Permutations P(n,k)=n!/(n-k)! and combinations C(n,k)=n!/(k!(n-k)!) verified
