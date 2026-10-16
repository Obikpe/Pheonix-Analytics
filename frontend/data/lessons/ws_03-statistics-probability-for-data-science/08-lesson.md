# Lesson 08 - Normal Distribution & Z-Scores - The Most Important Distribution

**Duration:** 90 min | **Level:** Absolute Beginner | **Goal:** Standardize data and find probabilities for normal data

## What You Will Learn

You learned Normal bell is important. Now deep dive: Normal appears everywhere because sum of many small independent factors approx Normal - Central Limit Theorem.

If order total = sum of many item prices, each price random, total approx Normal.

Z-score converts any Normal to Standard Normal N(0,1) mean 0 std 1 - makes probabilities easy via tables or SciPy.

We build from zero, visuals, simple→advanced.

---

## 1. Normal Distribution Recap - Why Most Important?

Normal X ~ N(μ, σ²) bell symmetric around μ mean median mode same, spread σ.

Why important?
- Many natural measurements approx Normal: heights, errors, sum of many factors
- Central Limit Theorem: Sample mean approx Normal even if data not Normal, for large n
- Many statistical tests assume Normal - if data Normal, tests valid
- Easy math - 68-95-99.7 rule

But sales often right-skewed not Normal - few huge orders tail right - not Normal, need log-normal or transform.

---

## 2. Properties - PDF and 68-95-99.7 Rule

PDF f(x)=1/(σ√(2π)) e^-(x-μ)²/(2σ²) - peak at μ, width σ.

68% within μ±1σ, 95% within μ±2σ, 99.7% within μ±3σ

Example: Orders N(12000,2000²) mean 12k std 2k
- 68% between 10000 and 14000 (12k±2k)
- 95% between 8000 and 16000 (12k±4k)
- 99.7% between 6000 and 18000 (12k±6k)

So if order 18000, it's 3 std above mean, only 0.15% chance above - rare outlier.

---

## 3. Z-Score - Standardization - How Many Stds Away?

Z = (X - μ) / σ

Z tells how many stds X is away from mean.

- Z=0 means X=μ exactly at mean
- Z=1 means X=μ+1σ 1 std above mean
- Z=-1 means 1 std below mean
- Z=2 means 2 std above, rare about 2.3% above

Why useful? Converts any Normal to Standard Normal N(0,1) mean 0 std 1. Then you can use one table or one SciPy call for any Normal.

Example: Order X=15000, μ=12000 σ=2000 Z=(15000-12000)/2000=3000/2000=1.5 - 1.5 std above mean. P(X≤15000)=P(Z≤1.5)=0.9332 from standard normal table - 93.32% orders below 15000.

Standardization steps:
1. Calculate μ mean σ std from data
2. For each X compute Z=(X-μ)/σ
3. Z now N(0,1) approx
4. Use standard normal CDF for probabilities

<svg width="100%" height="220" viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="220" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">Z-SCORE STANDARDIZATION - Z=(X-μ)/σ - ANY NORMAL → STANDARD NORMAL N(0,1)</text>
  <rect x="20" y="50" width="300" height="150" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
  <text x="170" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#1E40AF">Original Normal N(μ=12k, σ=2k)</text>
  <text x="35" y="90" font-family="Arial" font-size="8" fill="#1E40AF">X=15k</text>
  <text x="35" y="108" font-family="Arial" font-size="8" fill="#1E40AF">μ=12k σ=2k</text>
  <text x="35" y="126" font-family="Arial" font-size="9" font-weight="800" fill="#1E40AF">Z=(15000-12000)/2000=1.5</text>
  <text x="35" y="144" font-family="Arial" font-size="8" fill="#1E40AF">1.5 std above mean</text>
  <rect x="380" y="50" width="300" height="150" rx="12" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1"/>
  <text x="530" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#065F46">Standard Normal N(0,1)</text>
  <text x="395" y="90" font-family="Arial" font-size="8" fill="#065F46">Z=1.5 mean 0 std 1</text>
  <text x="395" y="108" font-family="Arial" font-size="8" fill="#065F46">P(Z≤1.5)=0.9332</text>
  <text x="395" y="126" font-family="Arial" font-size="8" fill="#065F46">So P(X≤15k)=93.32%</text>
  <text x="395" y="144" font-family="Arial" font-size="8" fill="#065F46">Tables for N(0,1) only needed</text>
  <text x="395" y="162" font-family="Arial" font-size="8" fill="#065F46">Standardize once use standard table</text>
</svg>

---

## 4. Using SciPy for Normal Probabilities

SciPy stats.norm handles Normal.

- pdf(x, loc=μ, scale=σ) density
- cdf(x, μ, σ) = P(X≤x)
- ppf(p, μ, σ) = inverse CDF percentile - X where P(X≤X)=p
- rvs(μ, σ, size) random samples

For standard normal loc=0 scale=1.

Code Simple→Advanced:

Step 1 Manual Z:

```python
# Step 1: Manual Z-score
mu=12000
sigma=2000
X=15000
Z = (X - mu) / sigma
print(f"X={X} mu={mu} sigma={sigma} Z=(X-mu)/sigma=({X}-{mu})/{sigma}={Z}")
print(f"Interpretation: {Z} std above mean")

# If Z=1.5, how likely?
# Need standard normal CDF table - approximate 0.9332 for Z=1.5
```

Step 2 SciPy:

```python
from scipy import stats

mu=12000
sigma=2000
X=15000

# CDF P(X≤15000)
p_le = stats.norm.cdf(X, loc=mu, scale=sigma)
print(f"P(X≤{X}) = CDF = {p_le:.4f} = {p_le*100:.1f}% orders below {X}")

# P(X>15000)=1-CDF
p_gt = 1 - p_le
print(f"P(X>{X}) = {p_gt:.4f} = {p_gt*100:.1f}% orders above {X} rare")

# Z-score and standard normal
Z = (X-mu)/sigma
p_le_std = stats.norm.cdf(Z, loc=0, scale=1)
print(f"Z={Z} P(Z≤{Z}) standard normal = {p_le_std:.4f} matches P(X≤{X}) {p_le:.4f}")

# Interval P(10000≤X≤14000)=68%
a=10000
b=14000
p_interval = stats.norm.cdf(b, mu, sigma) - stats.norm.cdf(a, mu, sigma)
print(f"P({a}≤X≤{b}) = CDF({b})-CDF({a}) = {p_interval:.4f}=68% within 1σ")

# 95% interval μ±2σ
print(f"95% interval {mu-2*sigma} to {mu+2*sigma} P = {stats.norm.cdf(mu+2*sigma,mu,sigma)-stats.norm.cdf(mu-2*sigma,mu,sigma):.4f}")

# Percentile - 95th percentile X where 95% below
p=0.95
x_95 = stats.norm.ppf(p, loc=mu, scale=sigma)
print(f"95th percentile: P(X≤X)=0.95 X={x_95:.0f} - 95% orders below {x_95:.0f}")

# Z for 95th percentile
z_95 = stats.norm.ppf(0.95, loc=0, scale=1)
print(f"Z for 95th percentile standard normal = {z_95:.4f} - often 1.645 for 95% one-sided 1.96 for 95% two-sided")
```

Step 3 Standardize dataset:

```python
import numpy as np
import pandas as pd

# Simulate order amounts normal
np.random.seed(0)
amounts = np.random.normal(12000,2000,1000)

mu = np.mean(amounts)
sigma = np.std(amounts, ddof=0)

# Z-scores
z_scores = (amounts - mu) / sigma

print(f"Original mean {mu:.0f} std {sigma:.0f}")
print(f"Z-scores mean {np.mean(z_scores):.2f}≈0 std {np.std(z_scores, ddof=0):.2f}≈1 - standardized N(0,1)")

# Now 95% of Z between -1.96 and 1.96
print(f"95% Z between -1.96 and 1.96 check: {( (z_scores>=-1.96) & (z_scores<=1.96) ).mean():.3f}≈0.95")

# Convert back: X = Z*σ + μ
X_recovered = z_scores * sigma + mu
print(f"Recovered mean {np.mean(X_recovered):.0f} matches original")
```

---

## 5. Q-Q Plot - Check Normality

Q-Q plot straight line = normal, curved = not normal.

Code:

```python
from scipy import stats
import matplotlib.pyplot as plt
import numpy as np

# Normal data - straight line
normal_data = np.random.normal(12000,2000,1000)
plt.figure()
stats.probplot(normal_data, dist="norm", plot=plt)
plt.title("Q-Q Normal data - straight line indicates normal")
plt.savefig("qq_normal_08.png")
print("Saved qq_normal_08.png - straight line normal")

# Right-skewed data - curved
skewed_data = np.random.lognormal(9,0.5,1000)
plt.figure()
stats.probplot(skewed_data, dist="norm", plot=plt)
plt.title("Q-Q Right-skewed - curved not normal")
plt.savefig("qq_skewed_08.png")
print("Saved qq_skewed_08.png - curved not normal, consider log transform")

# Log of skewed - straighter
plt.figure()
stats.probplot(np.log1p(skewed_data), dist="norm", plot=plt)
plt.title("Q-Q log1p skewed - straighter more normal")
plt.savefig("qq_log_skewed_08.png")
```

---

## 6. Central Limit Theorem Preview - Sample Mean Approx Normal

CLT: For large n, sample mean approx Normal even if data not Normal.

If X1...Xn independent same distribution mean μ var σ², then sample mean X_bar = (X1+...+Xn)/n approx N(μ, σ²/n)

Std of sample mean = σ/√n - called standard error. Larger n, smaller error, more precise.

This is why Normal important - means of samples approx Normal, so we can test means.

We deep dive in L10-L12.

---

## 7. Real Store Example

```python
import pandas as pd
import numpy as np
from scipy import stats

orders = [
    {"store_id": "LAG_001_Ikeja", "total": 53750},
    {"store_id": "LAG_001_Ikeja", "total": 34400},
    {"store_id": "LAG_002_Lekki", "total": 91375},
]

df = pd.DataFrame(orders)

# For each store, check if total approx normal? With 2-3 values not enough, but for large data:
# Suppose LAG_001 has many totals approx normal N(40000,10000)
mu=40000
sigma=10000
# P(total>60000)?
p_gt = 1 - stats.norm.cdf(60000, mu, sigma)
print(f"LAG_001 N({mu},{sigma}) P(total>60000)={p_gt:.4f} rare")

# Z-score for 60000
Z=(60000-mu)/sigma
print(f"Z for 60000 = {Z} - {Z} std above mean")

# Standardize totals for comparison across stores with different means
# Store A mean 40000 std 10000, Store B mean 50000 std 15000
# Order 60000 in A Z=2 rare, in B Z=0.67 not rare - standardization allows comparison
```

---

## 8. Hands-On Assignment

Dataset: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - payment_value right-skewed not normal, but log1p more normal

Create normal_zscore_L08.py:

Section A Z-score manual:

```python
mu=12000
sigma=2000
X=15000
Z=(X-mu)/sigma
print(f"Z=({X}-{mu})/{sigma}={Z} - {Z} std above mean")
```

Section B SciPy Normal probs:

```python
from scipy import stats
mu=12000
sigma=2000
print(f"P(X≤15000)={stats.norm.cdf(15000,mu,sigma):.4f} P(X>15000)={1-stats.norm.cdf(15000,mu,sigma):.4f}")
print(f"P(10000≤X≤14000)={stats.norm.cdf(14000,mu,sigma)-stats.norm.cdf(10000,mu,sigma):.4f}=68%")
print(f"95th percentile {stats.norm.ppf(0.95,mu,sigma):.0f} Z 95% {stats.norm.ppf(0.95,0,1):.4f}")
```

Section C Standardize dataset:

```python
import numpy as np
np.random.seed(0)
amounts=np.random.normal(12000,2000,1000)
mu=np.mean(amounts)
sigma=np.std(amounts,ddof=0)
z=(amounts-mu)/sigma
print(f"Original mean {mu:.0f} std {sigma:.0f} Z mean {np.mean(z):.2f} std {np.std(z):.2f} N(0,1)")
print(f"95% Z between -1.96 and 1.96 check {( (z>=-1.96)&(z<=1.96) ).mean():.3f}")
```

Section D Q-Q:

```python
from scipy import stats
import matplotlib.pyplot as plt
import numpy as np
normal_data=np.random.normal(12000,2000,1000)
plt.figure()
stats.probplot(normal_data, dist="norm", plot=plt)
plt.title("Q-Q Normal straight")
plt.savefig("qq_normal_08.png")
skewed=np.random.lognormal(9,0.5,1000)
plt.figure()
stats.probplot(skewed, dist="norm", plot=plt)
plt.title("Q-Q Skewed curved")
plt.savefig("qq_skewed_08.png")
plt.figure()
stats.probplot(np.log1p(skewed), dist="norm", plot=plt)
plt.title("Q-Q log1p straighter")
plt.savefig("qq_log_skewed_08.png")
```

Section E Kaggle:

```python
import os, pandas as pd
from scipy import stats
import numpy as np
import matplotlib.pyplot as plt

if os.path.exists("olist_order_payments_dataset.csv"):
    df=pd.read_csv("olist_order_payments_dataset.csv", nrows=10000)
    vals=df["payment_value"].dropna()
    print(f"payment_value mean {vals.mean():.2f} median {vals.median():.2f} Mean>Median right-skewed not normal")
    # Log more normal
    log_vals=np.log1p(vals)
    print(f"log1p mean {log_vals.mean():.2f} std {log_vals.std():.2f} skew {stats.skew(log_vals):.2f} more normal")
    
    # Standardize log vals
    mu=log_vals.mean()
    sigma=log_vals.std()
    z_scores=(log_vals-mu)/sigma
    print(f"log1p standardized Z mean {z_scores.mean():.2f} std {z_scores.std():.2f} N(0,1)")
    print(f"P(log1p ≤ {mu+sigma:.2f}) = P(Z≤1) = {stats.norm.cdf(1,0,1):.4f} = 84.13%")
    
    plt.figure()
    stats.probplot(vals, dist="norm", plot=plt)
    plt.title("Q-Q payment_value original curved")
    plt.savefig("qq_payment_08_original.png")
    
    plt.figure()
    stats.probplot(log_vals, dist="norm", plot=plt)
    plt.title("Q-Q log1p payment_value straighter")
    plt.savefig("qq_payment_08_log.png")
else:
    print("Download https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce")
```

Deliverable: Upload normal_zscore_L08.py + images qq_normal_08.png straight line, qq_skewed_08.png curved, qq_log_skewed_08.png straighter, qq_payment_08_original.png curved qq_payment_08_log.png straighter + output Z=(X-μ)/σ, P(X≤15000)=93.32%, 68-95-99.7 rule, standardized mean 0 std 1, 95th percentile.

Kaggle:
1. Primary https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - payment_value right-skewed not normal log1p more normal
2. Secondary https://www.kaggle.com/datasets/vivek468/superstore-dataset-final - Sales right-skewed

## 9. Checklist
- Explain Normal N(μ,σ²) bell symmetric mean median mode same why important CLT sum many factors
- Explain 68% μ±1σ 95% μ±2σ 99.7% μ±3σ rule
- Define Z=(X-μ)/σ how many stds away from mean standardization converts any Normal to N(0,1)
- Use SciPy norm.cdf P(X≤x) norm.ppf percentile inverse norm.rvs samples
- Standardize dataset (X-μ)/σ mean 0 std 1 N(0,1) allows comparison across stores different means
- Check normality Q-Q plot probplot straight line normal curved not normal log helps right-skewed
- Explain Central Limit Theorem preview sample mean approx N(μ,σ²/n) std error σ/√n

Key Takeaway: Normal bell important CLT. Z=(X-μ)/σ stds away converts to N(0,1) standard normal. 68-95-99.7. Standardize (X-μ)/σ mean 0 std 1 comparison. Q-Q straight normal.

