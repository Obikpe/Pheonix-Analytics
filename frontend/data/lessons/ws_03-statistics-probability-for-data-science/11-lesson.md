# Lesson 11 - Hypothesis Testing - Is Your Store Really Better?

**Duration:** 90 min | **Level:** Absolute Beginner | **Goal:** Test claims about your data with statistical evidence

## What You Will Learn

By the end of this lesson, you will be able to:

- Explain what hypothesis testing is: Testing a claim about population parameter μ or p using sample data
- Define null hypothesis H₀ (status quo, no effect) and alternative hypothesis H₁ (what you want to prove, effect exists)
- Explain p-value: Probability of seeing data as extreme or more extreme than observed if H₀ true - small p-value means evidence against H₀
- Define significance level α (e.g., 0.05) and decision rule: Reject H₀ if p-value ≤ α, otherwise fail to reject H₀
- Distinguish Type I error (false positive, reject true H₀) probability α and Type II error (false negative, fail to reject false H₀) probability β and power = 1 − β
- Calculate one-sample z-test for mean when σ known: z = (x̄ − μ₀)/(σ/√n)
- Calculate one-sample t-test for mean when σ unknown: t = (x̄ − μ₀)/(s/√n) with df = n − 1
- Explain one-tailed vs two-tailed tests: Two-tailed H₁: μ ≠ μ₀ tests both sides, one-tailed H₁: μ > μ₀ or μ < μ₀ tests one side
- Build hypothesis test from real sales data: Test if mean payment_value > 12000 or if P(NG) ≠ 0.5

---

## 1. Why Hypothesis Testing? Claim About Population

In Lesson 10 you built confidence intervals for μ. Now you want to test claim.

Example: Your Lagos store manager claims mean daily total μ = 50000. You have sample n=30 x̄=53750 s=10000. Is claim believable? Or is mean really different?

Another: You claim P(NG) = 0.7. Sample 100 orders 60 NG p̂=0.6. Is 0.6 significantly different from 0.7 or just sampling variation?

Hypothesis testing gives framework to test claim with statistical evidence and control error rates.

---

## 2. Null H₀ and Alternative H₁ - Two Competing Claims

- **H₀ Null Hypothesis:** Status quo, no effect, claim to be tested, assumed true until evidence strong against. Example H₀: μ = 50000, H₀: p = 0.7. H₀ contains equality =.

- **H₁ Alternative Hypothesis:** What you want to prove, effect exists, contradicts H₀. Example H₁: μ ≠ 50000 (two-sided different) or H₁: μ > 50000 (one-sided greater) or H₁: μ < 50000 (less). H₁ contains ≠ or > or <.

We test H₀ vs H₁ using sample data.

Example: Test if mean payment_value > 12000
- H₀: μ = 12000 (or μ ≤ 12000)
- H₁: μ > 12000 (one-tailed right)

If data strongly against H₀ (x̄ much larger than 12000), reject H₀ in favor of H₁.

Why H₀ contains equality? Because we need specific value μ₀ to compute p-value assuming H₀ true.

### Visual: H₀ vs H₁

<svg width="100%" height="180" viewBox="0 0 700 180" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="180" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">H₀ NULL STATUS QUO vs H₁ ALTERNATIVE WHAT YOU WANT TO PROVE</text>
  <rect x="20" y="50" width="300" height="110" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
  <text x="170" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#1E40AF">H₀: μ = 50000</text>
  <text x="35" y="90" font-family="Arial" font-size="8" fill="#1E40AF">Status quo, assumed true</text>
  <text x="35" y="108" font-family="Arial" font-size="8" fill="#1E40AF">Contains = equality</text>
  <text x="35" y="126" font-family="Arial" font-size="8" fill="#1E40AF">Need specific μ₀ for p-value</text>
  <rect x="380" y="50" width="300" height="110" rx="12" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1"/>
  <text x="530" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#065F46">H₁: μ ≠ 50000 or μ > 50000</text>
  <text x="395" y="90" font-family="Arial" font-size="8" fill="#065F46">What you want to prove</text>
  <text x="395" y="108" font-family="Arial" font-size="8" fill="#065F46">Contains ≠ > <</text>
  <text x="395" y="126" font-family="Arial" font-size="8" fill="#065F46">Evidence against H₀ supports H₁</text>
</svg>

---

## 3. Test Statistic, p-value, α, Decision

### Test Statistic

Test statistic measures how far sample statistic x̄ is from H₀ value μ₀ in SE units.

- z-test σ known: z = (x̄ − μ₀)/(σ/√n) = (x̄ − μ₀)/SE
- t-test σ unknown: t = (x̄ − μ₀)/(s/√n) with df = n − 1

Large |z| or |t| means x̄ far from μ₀, evidence against H₀.

### p-value

p-value = Probability of seeing test statistic as extreme or more extreme than observed, assuming H₀ true.

Example: H₀: μ=50000, sample x̄=53750, z=2.06, p-value two-tailed = P(|Z|≥2.06 | H₀ true)=0.039. If H₀ true (μ=50000), chance of seeing x̄ as far as 53750 or farther is only 3.9% small, so evidence against H₀.

Small p-value → data unlikely if H₀ true → evidence against H₀.

Large p-value → data plausible if H₀ true → no strong evidence against H₀.

### Significance Level α and Decision Rule

α = significance level, threshold for p-value, probability of Type I error you tolerate. Common α=0.05 (5%).

Decision:
- If p-value ≤ α → Reject H₀, result statistically significant, evidence supports H₁
- If p-value > α → Fail to reject H₀, not enough evidence against H₀, not proof H₀ true, just insufficient evidence

Why fail to reject not accept H₀? Because p-value large could be H₀ true or sample too small to detect difference. Absence of evidence not evidence of absence.

### Visual: p-value and Rejection Region

<svg width="100%" height="260" viewBox="0 0 700 260" xmlns="http://www.w3.org/2000/svg">
  <!-- Background Card -->
  <rect x="0" y="0" width="700" height="260" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <!-- Title -->
  <text x="350" y="26" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#111827">p-VALUE = PROBABILITY EXTREME DATA IF H₀ TRUE - REJECT H₀ IF p ≤ α</text>
  <!-- Left Box: Two-tailed test -->
  <g transform="translate(20, 42)">
    <rect width="320" height="200" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
    <text x="160" y="24" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#1E40AF">Two-tailed test H₁: μ ≠ μ₀</text>
    <!-- Curve path -->
    <path d="M 30 135 Q 70 135 90 115 Q 110 50 160 40 Q 210 50 230 115 Q 250 135 290 135" fill="#BFDBFE" stroke="#2563EB" stroke-width="1" opacity="0.6"/>
    <path d="M 30 135 L 30 155 L 70 155 Z" fill="#EF4444" opacity="0.8"/>
    <path d="M 250 135 L 290 135 L 290 155 L 250 155 Z" fill="#EF4444" opacity="0.8"/>
    <text x="50" y="148" font-family="Arial" font-size="7" fill="#FFFFFF">α/2 = 2.5%</text>
    <text x="262" y="148" font-family="Arial" font-size="7" fill="#FFFFFF">2.5%</text>
    <text x="160" y="95" text-anchor="middle" font-family="Arial" font-size="8" fill="#1E40AF">95% non-rejection region</text>
    <line x1="16" y1="165" x2="304" y2="165" stroke="#93C5FD" stroke-width="0.75" />
    <text x="16" y="180" font-family="Arial" font-size="8" font-weight="bold" fill="#1E40AF">Reject H₀ if |z| ≥ 1.96 (p ≤ 0.05)</text>
    <text x="16" y="195" font-family="Arial" font-size="8" fill="#1E40AF">z = (x̄ - μ₀) / SE</text>
  </g>
  <!-- Right Box: One-tailed test -->
  <g transform="translate(360, 42)">
    <rect width="320" height="200" rx="12" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1"/>
    <text x="160" y="24" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#065F46">One-tailed test H₁: μ > μ₀</text>
    <!-- Curve path -->
    <path d="M 30 135 Q 70 135 90 115 Q 110 50 160 40 Q 210 50 230 115 Q 250 135 290 135" fill="#BBF7D0" stroke="#059669" stroke-width="1" opacity="0.6"/>
    <path d="M 245 135 L 290 135 L 290 155 L 245 155 Z" fill="#EF4444" opacity="0.8"/>
    <text x="260" y="148" font-family="Arial" font-size="7" fill="#FFFFFF">α = 5%</text>
    <text x="150" y="95" text-anchor="middle" font-family="Arial" font-size="8" fill="#065F46">95% non-rejection region</text>
    <line x1="16" y1="165" x2="304" y2="165" stroke="#86EFAC" stroke-width="0.75" />
    <text x="16" y="180" font-family="Arial" font-size="8" font-weight="bold" fill="#065F46">Reject H₀ if z ≥ 1.645 (p ≤ 0.05)</text>
    <text x="16" y="195" font-family="Arial" font-size="8" fill="#065F46">p-value = P(Z ≥ z_obs | H₀)</text>
  </g>
</svg>


---

## 5. One-Sample Tests for Mean

### z-test σ Known

If σ known (rare), use z:

z = (x̄ − μ₀)/(σ/√n)

p-value:
- Two-tailed H₁: μ ≠ μ₀: p = 2 × P(Z ≥ |z|) = 2 × (1 − Φ(|z|))
- One-tailed right H₁: μ > μ₀: p = P(Z ≥ z) = 1 − Φ(z)
- One-tailed left H₁: μ < μ₀: p = P(Z ≤ z) = Φ(z)

Where Φ is standard normal CDF.

### t-test σ Unknown - More Common

σ unknown, use s, t with df = n − 1:

t = (x̄ − μ₀)/(s/√n)

p-value using t-distribution df = n − 1.

### Code Simple→Advanced

**Method 1 Plain Python Manual z-test:**

```python
# Method 1: Manual one-sample z-test σ known
import math
from scipy import stats

# Example: Test H₀: μ=50000 vs H₁: μ≠50000
# Sample n=30 x̄=53750 σ=10000 known
x_bar=53750
mu0=50000
sigma=10000
n=30

se = sigma / math.sqrt(n)
z = (x_bar - mu0) / se

print(f"H₀: μ={mu0} H₁: μ≠{mu0}")
print(f"x̄={x_bar} μ₀={mu0} σ={sigma} n={n} SE=σ/√n={se:.1f}")
print(f"z = (x̄-μ₀)/SE = ({x_bar}-{mu0})/{se:.1f} = {z:.3f}")

# Two-tailed p-value =2×P(Z≥|z|)
p_two = 2 * (1 - stats.norm.cdf(abs(z),0,1))
print(f"Two-tailed p-value =2×P(Z≥|{z:.3f}|)=2×{1-stats.norm.cdf(abs(z),0,1):.4f}={p_two:.4f}")

# One-tailed right H₁: μ>μ₀ p =P(Z≥z)
p_one_right = 1 - stats.norm.cdf(z,0,1)
print(f"One-tailed right H₁: μ>μ₀ p-value =P(Z≥{z:.3f})={p_one_right:.4f}")

# Decision α=0.05
alpha=0.05
print(f"\\nα={alpha}")
print(f"Two-tailed: p={p_two:.4f} {'≤' if p_two<=alpha else '>'} α={alpha} → {'Reject H₀ significant evidence μ≠{mu0}'.format(mu0=mu0) if p_two<=alpha else 'Fail to reject H₀ not enough evidence'}")
print(f"One-tailed right: p={p_one_right:.4f} {'≤' if p_one_right<=alpha else '>'} α → {'Reject H₀ μ>{mu0}'.format(mu0=mu0) if p_one_right<=alpha else 'Fail to reject'}")
```

**Method 2 SciPy t-test σ unknown:**

```python
# Method 2: t-test σ unknown - more common
from scipy import stats
import numpy as np

np.random.seed(0)

# Sample data n=30 from population with true mean 53000 but test H₀ μ=50000
true_mu=53000
sample = np.random.normal(true_mu, 10000, size=30)

x_bar = np.mean(sample)
s = np.std(sample, ddof=1)
n=len(sample)
mu0=50000

se = s / np.sqrt(n)
t_stat = (x_bar - mu0) / se
df=n-1

print(f"H₀: μ={mu0} H₁: μ≠{mu0}")
print(f"Sample n={n} x̄={x_bar:.1f} s={s:.1f} SE=s/√n={se:.1f}")
print(f"t = (x̄-μ₀)/SE = ({x_bar:.1f}-{mu0})/{se:.1f} = {t_stat:.3f} df={df}")

# p-values using t
p_two = 2 * (1 - stats.t.cdf(abs(t_stat), df=df))
p_one_right = 1 - stats.t.cdf(t_stat, df=df)
p_one_left = stats.t.cdf(t_stat, df=df)

print(f"Two-tailed p-value =2×P(T≥|{t_stat:.3f}|) df={df} = {p_two:.4f}")
print(f"One-tailed right p =P(T≥{t_stat:.3f})={p_one_right:.4f}")
print(f"One-tailed left p =P(T≤{t_stat:.3f})={p_one_left:.4f}")

alpha=0.05
print(f"\\nα={alpha} Two-tailed p={p_two:.4f} → {'Reject H₀' if p_two<=alpha else 'Fail to reject H₀'}")

# SciPy built-in ttest_1samp
t_scipy, p_scipy_two = stats.ttest_1samp(sample, popmean=mu0)
print(f"\\nSciPy ttest_1samp t={t_scipy:.3f} p_two={p_scipy_two:.4f} matches manual {t_stat:.3f} {p_two:.4f}")
print(f"One-tailed p right =p_two/2 if t>0 else 1-p_two/2 → {p_scipy_two/2 if t_scipy>0 else 1-p_scipy_two/2:.4f}")
```

**Method 3 Pandas and Visualization:**

```python
import pandas as pd
import numpy as np
from scipy import stats
import matplotlib.pyplot as plt

np.random.seed(0)
df = pd.DataFrame({"total": np.random.normal(53000,10000,30)})

mu0=50000
t_stat, p_two = stats.ttest_1samp(df["total"], popmean=mu0)

print(f"One-sample t-test H₀: μ={mu0} H₁: μ≠{mu0}")
print(f"x̄={df['total'].mean():.1f} t={t_stat:.3f} p={p_two:.4f} α=0.05 → {'Reject H₀' if p_two<=0.05 else 'Fail to reject'}")

# Plot sampling distribution under H₀
x_bar = df["total"].mean()
s = df["total"].std(ddof=1)
n=len(df)
se=s/np.sqrt(n)

# Under H₀ μ=50000, x̄ ~ t with mean μ₀
# Show where observed x̄ falls
plt.figure()
# t distribution centered at mu0
x = np.linspace(mu0-4*se, mu0+4*se, 200)
# Actually t pdf for x̄: x̄ = μ₀ + t*SE
# For visualization, plot t pdf
t_vals = np.linspace(-4,4,200)
pdf = stats.t.pdf(t_vals, df=n-1)
plt.plot(t_vals, pdf, color="blue", label=f"t df={n-1} under H₀")
plt.axvline(t_stat, color="red", linestyle="--", label=f"Observed t={t_stat:.2f} p={p_two:.3f}")
plt.axvline(stats.t.ppf(0.975, df=n-1), color="black", linestyle=":", label="Critical 1.96 for 95%")
plt.axvline(-stats.t.ppf(0.975, df=n-1), color="black", linestyle=":")
plt.title(f"t-test H₀: μ={mu0} observed t={t_stat:.2f} p={p_two:.4f}")
plt.legend()
plt.savefig("ttest_onesample.png")
print("Saved ttest_onesample.png - red line observed t, black lines critical ±1.96, if red beyond black reject H₀")
```

---

## 6. One-Sample Test for Proportion

Test H₀: p = p₀ vs H₁: p ≠ p₀ (or > or <)

When n large np₀≥5 n(1-p₀)≥5, use z:

z = (p̂ − p₀)/√(p₀(1−p₀)/n)

Note SE uses p₀ under H₀, not p̂.

p-value from normal.

Example: Test if P(NG)=0.7, sample 100 orders 60 NG p̂=0.6, n=100

z=(0.6-0.7)/√(0.7*0.3/100)= -0.1/0.0458= -2.18 p two-tailed 2×P(Z≥2.18)=0.029 significant at α=0.05 reject H₀ P(NG)≠0.7

Code:

```python
from scipy import stats
import math

# Test H₀: p=0.7 vs H₁: p≠0.7
p0=0.7
n=100
successes=60
p_hat=successes/n

se = math.sqrt(p0*(1-p0)/n)  # Use p0 under H₀
z = (p_hat - p0)/se

p_two = 2*(1-stats.norm.cdf(abs(z),0,1))
p_one_right = 1-stats.norm.cdf(z,0,1)

print(f"H₀: p={p0} H₁: p≠{p0}")
print(f"n={n} successes={successes} p̂={p_hat} SE=√(p₀(1-p₀)/n)=√({p0}*{1-p0}/{n})={se:.4f}")
print(f"z=(p̂-p₀)/SE=({p_hat}-{p0})/{se:.4f}={z:.3f}")
print(f"Two-tailed p-value = {p_two:.4f} α=0.05 → {'Reject H₀' if p_two<=0.05 else 'Fail to reject'} P(NG) significantly different from 0.7")

# SciPy binomtest for exact when n small
from scipy.stats import binomtest
result = binomtest(successes, n, p=p0)
print(f"\\nExact binomtest p-value two-sided = {result.pvalue:.4f} (better for small n)")
```

---

## 7. Real Store Example

```python
import pandas as pd
import numpy as np
from scipy import stats

# Example: Test if mean total in LAG_001_Ikeja > 45000
orders = [
    {"store_id": "LAG_001_Ikeja", "total": 53750},
    {"store_id": "LAG_001_Ikeja", "total": 34400},
    {"store_id": "LAG_001_Ikeja", "total": 50000},
    {"store_id": "LAG_001_Ikeja", "total": 42000},
    {"store_id": "LAG_001_Ikeja", "total": 48000},
    {"store_id": "LAG_001_Ikeja", "total": 51000},
    {"store_id": "LAG_001_Ikeja", "total": 46000},
    {"store_id": "LAG_001_Ikeja", "total": 53000},
]

df = pd.DataFrame(orders)

mu0=45000
t_stat, p_two = stats.ttest_1samp(df["total"], popmean=mu0)
# One-tailed right
p_one_right = p_two/2 if t_stat>0 else 1-p_two/2

print(f"Test H₀: μ={mu0} H₁: μ>{mu0} for Ikeja")
print(f"n={len(df)} x̄={df['total'].mean():.0f} s={df['total'].std(ddof=1):.0f} t={t_stat:.3f}")
print(f"Two-tailed p={p_two:.4f} One-tailed right p={p_one_right:.4f} α=0.05 → {'Reject H₀ mean >45000' if p_one_right<=0.05 else 'Fail to reject'}")
```

---

## 8. Hands-On Assignment

Dataset: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - payment_value

Create hypothesis_testing_L11.py:

Section A z-test σ known:

```python
import math
from scipy import stats
x_bar=53750
mu0=50000
sigma=10000
n=30
se=sigma/math.sqrt(n)
z=(x_bar-mu0)/se
p_two=2*(1-stats.norm.cdf(abs(z),0,1))
print(f"z-test H₀: μ={mu0} x̄={x_bar} z={z:.3f} p={p_two:.4f} α=0.05 → {'Reject' if p_two<=0.05 else 'Fail to reject'}")
```

Section B t-test σ unknown:

```python
from scipy import stats
import numpy as np
np.random.seed(0)
sample=np.random.normal(53000,10000,30)
mu0=50000
t_stat,p_two=stats.ttest_1samp(sample, popmean=mu0)
print(f"t-test H₀: μ={mu0} x̄={np.mean(sample):.1f} t={t_stat:.3f} p={p_two:.4f} → {'Reject' if p_two<=0.05 else 'Fail to reject'}")
print(f"One-tailed right p={p_two/2 if t_stat>0 else 1-p_two/2:.4f}")
```

Section C Proportion test:

```python
import math
from scipy import stats
p0=0.7
n=100
p_hat=0.6
se=math.sqrt(p0*(1-p0)/n)
z=(p_hat-p0)/se
p_two=2*(1-stats.norm.cdf(abs(z),0,1))
print(f"Proportion test H₀: p={p0} p̂={p_hat} z={z:.3f} p={p_two:.4f} → {'Reject H₀' if p_two<=0.05 else 'Fail to reject'}")
```

Section D Errors:

```python
print("Type I Error α=0.05 - reject true H₀ false positive say effect when none")
print("Type II Error β - fail to reject false H₀ false negative miss real effect")
print("Power=1-β want high 0.8 larger n increases power")
```

Section E Kaggle:

```python
import os, pandas as pd
from scipy import stats

if os.path.exists("olist_order_payments_dataset.csv"):
    df=pd.read_csv("olist_order_payments_dataset.csv", nrows=10000)
    vals=df["payment_value"].dropna()
    
    # Test H₀: μ=200 vs H₁: μ≠200
    mu0=200
    t_stat,p_two=stats.ttest_1samp(vals, popmean=mu0)
    print(f"payment_value H₀: μ={mu0} x̄={vals.mean():.2f} t={t_stat:.3f} p={p_two:.4e} → {'Reject H₀ mean ≠200' if p_two<=0.05 else 'Fail to reject'}")
    
    # Test H₀: μ>100 one-tailed
    mu0=100
    t_stat,p_two=stats.ttest_1samp(vals, popmean=mu0)
    p_one_right=p_two/2 if t_stat>0 else 1-p_two/2
    print(f"H₀: μ={mu0} H₁: μ>{mu0} t={t_stat:.3f} one-tailed right p={p_one_right:.4e} → {'Reject' if p_one_right<=0.05 else 'Fail to reject'}")
    
    # Proportion test P(credit_card)=0.7?
    if "payment_type" in df.columns:
        n=len(df)
        successes=(df["payment_type"]=="credit_card").sum()
        p_hat=successes/n
        p0=0.7
        import math
        se=math.sqrt(p0*(1-p0)/n)
        z=(p_hat-p0)/se
        p_two=2*(1-stats.norm.cdf(abs(z),0,1))
        print(f"P(credit_card) H₀: p={p0} p̂={p_hat:.3f} z={z:.3f} p={p_two:.4e} → {'Reject' if p_two<=0.05 else 'Fail to reject'}")
else:
    print("Download https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce")
```

Deliverable: Upload hypothesis_testing_L11.py + image ttest_onesample.png + output showing z=(x̄-μ₀)/SE, t=(x̄-μ₀)/(s/√n), p-value small → reject H₀, α=0.05 Type I false positive Type II false negative Power=1-β, one-tailed vs two-tailed, proportion z=(p̂-p₀)/√(p₀(1-p₀)/n).

Kaggle:
1. Primary https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - payment_value mean test and payment_type proportion test
2. Secondary https://www.kaggle.com/datasets/vivek468/superstore-dataset-final - Sales mean test

## 9. Checklist
- Define H₀ null status quo contains = and H₁ alternative what you want to prove ≠ > <
- Explain test statistic z=(x̄-μ₀)/(σ/√n) t=(x̄-μ₀)/(s/√n) df=n-1 measures distance in SE units
- Define p-value probability extreme data if H₀ true small p evidence against H₀
- Define α significance level 0.05 decision reject H₀ if p≤α else fail to reject not accept
- Explain Type I α false positive reject true H₀ Type II β false negative fail to reject false H₀ Power=1-β larger n increases power
- Explain one-tailed vs two-tailed H₁: μ≠μ₀ two-tailed both sides H₁: μ>μ₀ or μ<μ₀ one-tailed one side p-value different
- Calculate one-sample z-test and t-test and proportion test z=(p̂-p₀)/√(p₀(1-p₀)/n)
- Use SciPy ttest_1samp for t-test binomtest for exact proportion test

Key Takeaway: H₀ status quo = H₁ what you want to prove ≠><. Test statistic z=(x̄-μ₀)/SE t=(x̄-μ₀)/(s/√n). p-value probability extreme if H₀ true small p reject H₀ if p≤α=0.05. Type I α false positive Type II β false negative Power=1-β. One-tailed tests one side two-tailed both.

