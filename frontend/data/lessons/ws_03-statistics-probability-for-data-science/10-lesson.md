
  
# Lesson 10 - Confidence Intervals - How Sure Are You About Your Estimate?

**Duration:** 90 min | **Level:** Absolute Beginner | **Goal:** Build intervals that contain true population mean with 95% confidence

## What You Will Learn

By the end of this lesson, you will be able to:

- Explain why point estimate x̄ alone is not enough and why we need an interval with uncertainty
- Define confidence interval as range of plausible values for population parameter μ with confidence level 95%
- Calculate confidence interval for mean when σ known using z: x̄ ± z × σ/√n and explain z critical values 1.96 for 95% 2.576 for 99% 1.645 for 90%
- Calculate confidence interval for mean when σ unknown (more common in real life) using t: x̄ ± t × s/√n and explain t-distribution with df = n − 1 heavier tails than normal
- Distinguish when to use z vs t: z for σ known or large n ≥ 30 where s ≈ σ, t for σ unknown small n < 30 and need population approx normal
- Interpret 95% confidence interval correctly: If you repeat sampling many times, 95% of intervals will contain true μ, not 95% chance μ is in this specific interval - common misconception
- Explain factors affecting interval width: Larger n → narrower more precise, higher confidence 99% → wider, larger σ or s → wider, trade-off precision vs confidence
- Calculate confidence interval for proportion p̂ ± z × √(p̂(1 − p̂)/n) and check condition np ≥ 5 n(1 − p) ≥ 5 for normal approximation
- Build confidence intervals from real sales data and decide if estimate precise enough or need larger sample

---

## 1. Why Confidence Intervals? Point Estimate Not Enough

In Lesson 9 you learned sample mean x̄ estimates population mean μ, and x̄ varies sample to sample with standard error SE = σ/√n.

Example: True μ unknown, you take sample 100 orders, x̄=12000. Another sample of 100 orders might give x̄=11800. Which is true μ? Neither exactly - x̄ is random, varies.

Point estimate alone doesn't tell how precise. Confidence interval CI adds uncertainty: Range of plausible μ values.

Example: x̄=12000 SE=200 95% CI =12000 ±1.96 × 200 =12000 ±392 =[11608, 12392]. We are 95% confident true μ lies between 11608 and 12392.

If CI wide [10000,14000] imprecise, need larger n to narrow. If CI narrow [11900,12100] precise, good enough.

Without CI, you might think μ=12000 exactly, but actually uncertainty ±392.

Think of archery: x̄ is one arrow hitting near target, CI is circle around arrow saying true target likely inside circle. Larger n smaller circle more precise.

### Visual: Point Estimate vs Confidence Interval

<svg width="100%" height="200" viewBox="0 0 700 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="200" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">POINT ESTIMATE vs CONFIDENCE INTERVAL - UNCERTAINTY MATTERS</text>
  <rect x="20" y="50" width="300" height="130" rx="12" fill="#FEF2F2" stroke="#FCA5A5" stroke-width="1"/>
  <text x="170" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#7F1D1D">Point Estimate Only</text>
  <text x="35" y="90" font-family="Arial" font-size="8" fill="#7F1D1D">x̄=12000 alone</text>
  <text x="35" y="108" font-family="Arial" font-size="8" fill="#7F1D1D">No uncertainty info</text>
  <text x="35" y="126" font-family="Arial" font-size="8" fill="#7F1D1D">Is true μ 12000 exactly? No!</text>
  <text x="35" y="144" font-family="Arial" font-size="8" fill="#7F1D1D">Varies sample to sample</text>
  <text x="35" y="162" font-family="Arial" font-size="8" fill="#DC2626">✗ Misleading precision</text>
  <rect x="380" y="50" width="300" height="130" rx="12" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1"/>
  <text x="530" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#065F46">Confidence Interval</text>
  <text x="395" y="90" font-family="Arial" font-size="8" fill="#065F46">x̄=12000 SE=200</text>
  <text x="395" y="108" font-family="Arial" font-size="9" font-weight="800" fill="#065F46">95% CI =12000±1.96 × 200=[11608,12392]</text>
  <text x="395" y="126" font-family="Arial" font-size="8" fill="#065F46">Range plausible μ values</text>
  <text x="395" y="144" font-family="Arial" font-size="8" fill="#065F46">Width tells precision</text>
  <text x="395" y="162" font-family="Arial" font-size="8" fill="#059669">✓ Shows uncertainty</text>
</svg>

---

## 2. CI for Mean When σ Known - z Interval - Foundation

### Derivation From CLT

From Lesson 9 CLT, x̄ ~ N(μ, σ²/n) approx, so Z=(x̄-μ)/(σ/√n) ~ N(0,1)

We want interval that contains μ with 95% confidence. For standard normal N(0,1), 95% of values between -1.96 and 1.96 (2.5% in each tail).

So P(-1.96 ≤ (x̄-μ)/SE ≤1.96)=0.95 where SE = σ/√n

Rearrange: P(x̄ -1.96 × SE ≤ μ ≤ x̄ +1.96 × SE)=0.95

Thus 95% CI: x̄ ± z_{α/2} * SE = x̄ ± z_{α/2} * σ/√n

Where α =1-confidence, for 95% α=0.05 α/2=0.025 z_{0.025}=1.96

General:
- 90% confidence α=0.10 α/2=0.05 z=1.645
- 95% confidence α=0.05 α/2=0.025 z=1.96
- 99% confidence α=0.01 α/2=0.005 z=2.576

Higher confidence needs larger z wider interval.

### Visual: 95% CI Construction

<svg width="100%" height="250" viewBox="0 0 700 250" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="250" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">95% CI = x̄ ± z × SE - STANDARD NORMAL 95% BETWEEN -1.96 AND 1.96</text>
  <rect x="20" y="50" width="660" height="180" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
  <!-- Normal curve -->
  <path d="M 50 150 Q 200 150 250 110 Q 300 50 350 40 Q 400 50 450 110 Q 500 150 650 150" fill="#BFDBFE" stroke="#2563EB" stroke-width="2" opacity="0.6"/>
  <!-- 95% area shaded -->
  <path d="M 200 150 Q 250 110 300 50 Q 350 40 400 50 Q 450 110 500 150 Z" fill="#60A5FA" opacity="0.8"/>
  <text x="350" y="90" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#FFFFFF">95% area between -1.96 and 1.96</text>
  <text x="350" y="105" text-anchor="middle" font-family="Arial" font-size="8" fill="#FFFFFF">2.5% tail each side</text>
  <line x1="200" y1="150" x2="200" y2="170" stroke="#1E40AF" stroke-width="1"/>
  <text x="200" y="185" text-anchor="middle" font-family="Arial" font-size="8" fill="#1E40AF">-1.96</text>
  <line x1="500" y1="150" x2="500" y2="170" stroke="#1E40AF" stroke-width="1"/>
  <text x="500" y="185" text-anchor="middle" font-family="Arial" font-size="8" fill="#1E40AF">+1.96</text>
  <line x1="350" y1="150" x2="350" y2="170" stroke="#2563EB" stroke-width="2"/>
  <text x="350" y="200" text-anchor="middle" font-family="Arial" font-size="8" font-weight="800" fill="#1E40AF">0 mean Z=(x̄-μ)/SE</text>
  <text x="350" y="215" text-anchor="middle" font-family="Arial" font-size="8" fill="#374151">x̄ ±1.96 × SE contains μ with 95% confidence: x̄=12000 SE=200 → [11608,12392]</text>
</svg>

### Code Simple→Advanced - z CI

**Method 1 Plain Python Manual z CI σ known:**

```python
# Method 1: Most basic - z CI σ known
import math

# Data: sample mean 12000, population σ known 2000, n=100
x_bar = 12000
sigma = 2000
n = 100

# Standard Error SE = σ/√n
se = sigma / math.sqrt(n)
print(f"x̄={x̄}, sigma={sigma}, n={n}")
print(f"SE = σ/√n = {sigma}/√{n} = {sigma}/{math.sqrt(n):.0f} = {se:.1f}")

# z critical values
# 95% confidence: 2.5% each tail, z=1.96 from standard normal table
z_95 = 1.96
print(f"\n95% confidence z_{{α/2}} = z_{{0.025}} = {z_95} - 95% of N(0,1) between -{z_95} and +{z_95}")

# CI
margin = z_95 * se
ci_low = x_bar - margin
ci_high = x_bar + margin

print(f"Margin = z*SE = {z_95}*{se:.1f} = {margin:.1f}")
print(f"95% CI = x̄ ± margin = {x̄} ±{margin:.1f} = [{ci_low:.1f}, {ci_high:.1f}]")
print(f"Interpretation: We are 95% confident true μ between {ci_low:.1f} and {ci_high:.1f}")

# Different confidence levels
for conf, z in [(0.90, 1.645), (0.95, 1.96), (0.99, 2.576)]:
    margin = z * se
    low = x_bar - margin
    high = x_bar + margin
    print(f"\n{int(conf*100)}% confidence z={z} CI [{low:.1f}, {high:.1f}] width {high-low:.1f} - higher confidence wider")

# What affects width?
# Larger n smaller SE narrower
print(f"\nFactors affecting width:")
for n_test in [25, 100, 400]:
    se_test = sigma / math.sqrt(n_test)
    width = 2 * 1.96 * se_test
    print(f"n={n_test} SE={se_test:.1f} 95% CI width {width:.1f} - larger n narrower, need 4x n to halve width")
```

What this does: Calculate SE = σ/√n, margin=z × SE, CI x̄±margin. Shows higher confidence wider, larger n narrower.

**Method 2 SciPy - Get z critical from standard normal:**

```python
# Method 2: SciPy - get z critical via norm.ppf
from scipy import stats

# z critical is inverse CDF of standard normal N(0,1)
# For 95% confidence, α=0.05, α/2=0.025, we need z where P(Z≤z)=1-α/2=0.975
alpha=0.05
z_95 = stats.norm.ppf(1 - alpha/2, loc=0, scale=1)  # ppf = percent point function = inverse CDF
print(f"z 95% critical = norm.ppf(0.975) = {z_95:.4f} =1.96")

# 99% confidence α=0.01
alpha=0.01
z_99 = stats.norm.ppf(1 - alpha/2, loc=0, scale=1)
print(f"z 99% critical = {z_99:.4f}=2.576")

# 90% confidence α=0.10
alpha=0.10
z_90 = stats.norm.ppf(1 - alpha/2, loc=0, scale=1)
print(f"z 90% critical = {z_90:.4f}=1.645")

# CI using z
x_bar=12000
sigma=2000
n=100
se=sigma/(n**0.5)
z=stats.norm.ppf(0.975,0,1)
ci_low=x_bar - z*se
ci_high=x_bar + z*se
print(f"\n95% CI = {x̄} ±{z:.4f}*{se:.1f} = [{ci_low:.1f}, {ci_high:.1f}]")

# Direct interval function
ci = stats.norm.interval(0.95, loc=x_bar, scale=se)
print(f"SciPy norm.interval 95% CI = [{ci[0]:.1f}, {ci[1]:.1f}] matches manual")
```

**Method 3 Simulate interpretation - 95% of CIs contain true μ:**

```python
# Method 3: Simulate interpretation - correct meaning of 95% CI
import numpy as np
from scipy import stats

np.random.seed(0)

true_mu=12000
sigma=2000
n=100
se=sigma/np.sqrt(n)
z=stats.norm.ppf(0.975,0,1)

# Generate 100 samples, each compute 95% CI
num_samples=100
cis=[]
contains_true=0

for i in range(num_samples):
    sample = np.random.normal(true_mu, sigma, size=n)
    x_bar = np.mean(sample)
    ci_low = x_bar - z*se
    ci_high = x_bar + z*se
    cis.append((ci_low, ci_high))
    if ci_low <= true_mu <= ci_high:
        contains_true+=1

print(f"True μ={true_mu}, {num_samples} samples n={n}")
print(f"Number of 95% CIs containing true μ = {contains_true}/{num_samples} = {contains_true/num_samples*100:.0f}% ≈95%")
print(f"Interpretation: If repeat many times, 95% of CIs contain true μ. This specific CI either contains or not, but procedure 95% works.")

# Plot first 20 CIs
import matplotlib.pyplot as plt

plt.figure(figsize=(10,6))
for i in range(20):
    ci_low, ci_high = cis[i]
    color = "green" if ci_low <= true_mu <= ci_high else "red"
    plt.plot([ci_low, ci_high], [i, i], color=color, linewidth=2)
plt.axvline(true_mu, color="blue", linestyle="--", label=f"True μ={true_mu}")
plt.xlabel("CI")
plt.ylabel("Sample number")
plt.title(f"20 95% CIs - green contain true μ red don't - ~95% green")
plt.legend()
plt.savefig("ci_interpretation.png")
print("Saved ci_interpretation.png - green CIs contain true μ, red don't, about 95% green - correct interpretation")
```

---

## 3. CI for Mean When σ Unknown - t Interval - Real Life Common

In real life σ unknown, we estimate with sample std s (ddof=1). SE = s/√n

But s is estimate, adds extra uncertainty, especially small n. Use t-distribution with df = n − 1 degrees of freedom instead of normal.

t-distribution: Similar to normal bell but heavier tails (more probability in tails) for small df, accounts for extra uncertainty from estimating σ. As df large ≥30, t≈z normal.

Formula: 95% CI = x̄ ± t_{α/2, df} * s/√n

Where t_{α/2, df} critical from t-table with df = n − 1

Example: n=10 df=9 95% t_{0.025,9}=2.262 >1.96 wider than z, because small sample more uncertainty.

n=100 df=99 t=1.984 ≈1.96 almost same as z.

**When to use z vs t?**

- σ known: Use z (rare in real life, usually σ unknown)
- σ unknown and n large ≥30: z approx ok because s ≈ σ and t≈z, but t more accurate use t
- σ unknown and n small <30: Must use t, and need population approx normal or not too skewed (CLT needs larger n for skewed). If population very skewed and n small, CI may not be valid, consider bootstrap.

### Visual: t vs Normal - Heavier Tails

<svg width="100%" height="200" viewBox="0 0 700 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="200" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">t-DISTRIBUTION vs NORMAL - HEAVIER TAILS FOR SMALL n, t → z AS n LARGE</text>
  <rect x="20" y="50" width="200" height="130" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
  <text x="120" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#1E40AF">t df=9 (n=10) Heavy tails</text>
  <text x="35" y="90" font-family="Arial" font-size="8" fill="#1E40AF">95% critical 2.262 >1.96</text>
  <text x="35" y="108" font-family="Arial" font-size="8" fill="#1E40AF">Wider CI more uncertainty</text>
  <text x="35" y="126" font-family="Arial" font-size="8" fill="#1E40AF">Must use for small n</text>
  <rect x="250" y="50" width="200" height="130" rx="12" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1"/>
  <text x="350" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#065F46">t df=29 (n=30) Closer to normal</text>
  <text x="265" y="90" font-family="Arial" font-size="8" fill="#065F46">95% critical 2.045 ≈1.96</text>
  <rect x="480" y="50" width="200" height="130" rx="12" fill="#FFFBEB" stroke="#FCD34D" stroke-width="1"/>
  <text x="580" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#92400E">t df=99 (n=100) ≈ Normal</text>
  <text x="495" y="90" font-family="Arial" font-size="8" fill="#92400E">95% critical 1.984 ≈1.96</text>
  <text x="495" y="108" font-family="Arial" font-size="8" fill="#92400E">t → z as n large</text>
</svg>

### Code Simple→Advanced - t CI

**Method 1 Plain Python vs t manual:**

```python
# Method 1: t interval manual - compare z vs t
import math
from scipy import stats

# Small sample n=10
n=10
df=n-1

# Critical values
z_95 = stats.norm.ppf(0.975,0,1)
t_95_df9 = stats.t.ppf(0.975, df=df)

print(f"n={n} df={df}")
print(f"z 95% critical = {z_95:.4f}=1.96")
print(f"t 95% critical df={df} = {t_95_df9:.4f}=2.262 >1.96")
print(f"t wider because small n more uncertainty estimating σ")

# Sample data small n
import numpy as np
np.random.seed(0)
sample = np.random.normal(12000,2000,size=n)
x_bar = np.mean(sample)
s = np.std(sample, ddof=1)  # Sample std ddof=1 unbiased
se = s / math.sqrt(n)

print(f"\nSample n={n} x̄={x̄:.1f} s={s:.1f} SE=s/√n={se:.1f}")

# z CI (wrong for small n - underestimates uncertainty)
ci_low_z = x_bar - z_95*se
ci_high_z = x_bar + z_95*se
print(f"95% z CI (incorrect for small n) = [{ci_low_z:.1f}, {ci_high_z:.1f}] width {ci_high_z-ci_low_z:.1f} too narrow overconfident")

# t CI (correct)
ci_low_t = x_bar - t_95_df9*se
ci_high_t = x_bar + t_95_df9*se
print(f"95% t CI (correct) = [{ci_low_t:.1f}, {ci_high_t:.1f}] width {ci_high_t-ci_low_t:.1f} wider more honest about uncertainty")
```

**Method 2 SciPy t interval from data:**

```python
from scipy import stats
import numpy as np

np.random.seed(0)

# Simulate data n=30 more typical
sample = np.random.normal(12000,2000,size=30)
x_bar = np.mean(sample)
s = np.std(sample, ddof=1)
n=len(sample)
se = s / np.sqrt(n)
df=n-1

t_crit = stats.t.ppf(0.975, df=df)
print(f"Sample n={n} x̄={x̄:.1f} s={s:.1f} SE={se:.1f} df={df} t_95={t_crit:.4f}")

ci_low = x_bar - t_crit*se
ci_high = x_bar + t_crit*se
print(f"95% t CI = [{ci_low:.1f}, {ci_high:.1f}]")

# Using stats.t.interval directly - does same
ci = stats.t.interval(0.95, df=df, loc=x_bar, scale=se)
print(f"SciPy t.interval 95% CI = [{ci[0]:.1f}, {ci[1]:.1f}] matches manual")

# For large n=100 t≈z
sample_large = np.random.normal(12000,2000,size=100)
x_bar_l = np.mean(sample_large)
s_l = np.std(sample_large, ddof=1)
se_l = s_l/np.sqrt(100)
t_crit_l = stats.t.ppf(0.975, df=99)
z_crit = stats.norm.ppf(0.975,0,1)
print(f"\nLarge n=100 t_95={t_crit_l:.4f} z_95={z_crit:.4f} almost same, t→z")
print(f"95% t CI [{x̄_l - t_crit_l*se_l:.1f}, {x̄_l + t_crit_l*se_l:.1f}]")
print(f"95% z CI [{x̄_l - z_crit*se_l:.1f}, {x̄_l + z_crit*se_l:.1f}] almost same for large n")
```

**Method 3 Pandas:**

```python
import pandas as pd
import numpy as np
from scipy import stats

np.random.seed(0)
df = pd.DataFrame({"total": np.random.normal(12000,2000,30)})

x_bar = df["total"].mean()
s = df["total"].std(ddof=1)
n=len(df)
se = s/np.sqrt(n)
df_deg=n-1
t_crit = stats.t.ppf(0.975, df=df_deg)

ci_low = x_bar - t_crit*se
ci_high = x_bar + t_crit*se

print(f"Data n={n} x̄={x̄:.1f} s={s:.1f} SE={se:.1f} df={df_deg} t_95={t_crit:.3f}")
print(f"95% t CI = [{ci_low:.1f}, {ci_high:.1f}] - we are 95% confident true mean total between those")

# Using t.interval
ci = stats.t.interval(0.95, df=df_deg, loc=x_bar, scale=se)
print(f"SciPy t.interval = [{ci[0]:.1f}, {ci[1]:.1f}]")
```

---

## 4. Correct Interpretation vs Common Misconception

**Correct interpretation:** If we repeat sampling 100 times, each time compute 95% CI, about 95 of 100 CIs will contain true μ. Procedure works 95% of time. This specific interval either contains μ or not, but we are 95% confident in procedure.

**Incorrect interpretation (common mistake):** There is 95% probability true μ is in this specific interval [11608,12392]. Wrong because μ fixed unknown not random, interval random. Probability statement is about procedure, not this interval.

Think: True μ=12000 fixed, interval [11608,12392] fixed after sample, either contains μ or not - probability 0 or 1, not 95%. But before sampling, procedure has 95% chance to produce interval containing μ.

Visual: 100 CIs from 100 samples - 95 green contain μ, 5 red don't. You don't know if your CI is green or red, but 95% confident it's green.

### Code - Visualize Interpretation (from Method 3 earlier):

```python
# Already shown in Section 2 Method 3 - ci_interpretation.png
# Green CIs contain true μ, red don't, about 95% green
```

---

## 5. Factors Affecting Width - Precision vs Confidence Trade-off

- **Larger n:** SE = σ/√n smaller → narrower CI more precise. To halve width need 4x n because SE ∝1/√n. Example n=25 width 1000, n=100 width 500 halved need 4x.
- **Higher confidence:** 99% z=2.576 >95% 1.96 → wider CI. More confidence need wider interval to be more sure contain μ. Trade-off.
- **Larger σ or s:** More variable data → larger SE → wider CI less precise.

If CI too wide imprecise, increase n.

### Code - Factors:

```python
import math
from scipy import stats

sigma=2000
print(f"Factors affecting 95% CI width =2*z*SE =2*z*σ/√n")
print(f"Base: sigma={sigma}")

# Effect of n
for n in [25,100,400]:
    se=sigma/math.sqrt(n)
    width=2*1.96*se
    print(f"n={n} SE={se:.1f} width {width:.1f} - larger n narrower, 4x n halves width")

# Effect of confidence
se=200
for conf, z in [(0.90,1.645),(0.95,1.96),(0.99,2.576)]:
    width=2*z*se
    print(f"\n{int(conf*100)}% confidence z={z} width {width:.1f} - higher confidence wider")

# Effect of sigma
n=100
for sigma_test in [1000,2000,4000]:
    se=sigma_test/math.sqrt(n)
    width=2*1.96*se
    print(f"\nsigma={sigma_test} n={n} SE={se:.1f} width {width:.1f} - larger sigma wider")
```

---

## 6. CI for Proportion - P(NG) Example

For proportion p̂ = successes/n, when n large enough np ≥ 5 n(1 − p) ≥ 5, p̂ approx Normal N(p, p(1 − p)/n) via CLT.

SE proportion = √(p̂(1 − p̂)/n) - use p̂ because p unknown.

95% CI: p̂ ± z × √(p̂(1 − p̂)/n)

Example: 70 NG out of 100, p̂=0.7 SE=√(0.7*0.3/100)=0.0458 95% CI =0.7±1.96 × 0.0458=[0.610,0.790] We are 95% confident true P(NG) between 61% and 79%.

Check condition: np=70≥5 n(1 − p)=30≥5 ok normal approx valid.

If n small or p near 0 or 1, np<5, normal approx not good, use exact binomial CI (Clopper-Pearson) or Wilson.

### Code Simple→Advanced - Proportion CI

**Method 1 Plain Python:**

```python
# Method 1: Proportion CI manual
import math

n=100
successes=70
p_hat=successes/n
print(f"n={n} successes={successes} p̂={successes}/{n}={p̂}")

# Check condition np≥5 n(1-p)≥5
print(f"Check np={n*p̂}≥5? {n*p̂>=5} and n(1-p)={n*(1-p̂)}≥5? {n*(1-p̂)>=5} - {'OK normal approx' if n*p̂>=5 and n*(1-p̂)>=5 else 'Too small need exact'}")

se_prop = math.sqrt(p_hat*(1-p_hat)/n)
print(f"SE = √(p̂(1-p̂)/n) = √({p̂}*{1-p̂}/{n}) = {se_prop:.4f}")

z=1.96
margin=z*se_prop
ci_low=p_hat-margin
ci_high=p_hat+margin
print(f"95% CI = p̂ ± z*SE = {p̂} ±{z}*{se_prop:.4f} = {p̂} ±{margin:.4f} = [{ci_low:.3f}, {ci_high:.3f}]")
print(f"We are 95% confident true P(NG) between {ci_low*100:.1f}% and {ci_high*100:.1f}%")
```

**Method 2 SciPy:**

```python
from scipy import stats
import math

n=100
p_hat=0.7
se=math.sqrt(p_hat*(1-p_hat)/n)
z=stats.norm.ppf(0.975,0,1)
ci_low=p_hat - z*se
ci_high=p_hat + z*se
print(f"95% CI p̂ {p̂} [{ci_low:.3f}, {ci_high:.3f}]")

# Using proportion_ztest? Actually statsmodels for CI
# For small n use binom exact CI
# SciPy binomtest
from scipy.stats import binomtest
result = binomtest(70,100,p=0.7)  # Not CI but test
# For exact CI use statsmodels or manual Clopper-Pearson
# Simple Wilson interval better for small n
```

---

## 7. Real Store Example - Where Location Matters

```python
import pandas as pd
import numpy as np
from scipy import stats

# Example: LAG_001_Ikeja totals
orders = [
    {"store_id": "LAG_001_Ikeja", "total": 53750},
    {"store_id": "LAG_001_Ikeja", "total": 34400},
    {"store_id": "LAG_001_Ikeja", "total": 50000},
    {"store_id": "LAG_001_Ikeja", "total": 42000},
    {"store_id": "LAG_001_Ikeja", "total": 48000},
    {"store_id": "LAG_001_Ikeja", "total": 51000},
    {"store_id": "LAG_001_Ikeja", "total": 46000},
]

df = pd.DataFrame(orders)

x_bar = df["total"].mean()
s = df["total"].std(ddof=1)
n=len(df)
se = s/np.sqrt(n)
df_deg=n-1
t_crit=stats.t.ppf(0.975, df=df_deg)
ci_low=x_bar-t_crit*se
ci_high=x_bar+t_crit*se

print(f"{df['store_id'].iloc[0]} n={n} mean {x̄:.0f} s {s:.0f} SE {se:.0f} df {df_deg} t_95 {t_crit:.3f}")
print(f"95% CI for true mean total [{ci_low:.0f}, {ci_high:.0f}]")
print(f"Width {ci_high-ci_low:.0f} - if too wide need larger n, 4x n halves width")
print(f"We are 95% confident true mean daily total for Ikeja between {ci_low:.0f} and {ci_high:.0f}")

# Proportion example: P(high value) in Ikeja
# Define high as >50000
high_threshold=50000
p_hat = (df["total"]>high_threshold).mean()
se_prop = np.sqrt(p_hat*(1-p_hat)/n)
z=stats.norm.ppf(0.975,0,1)
ci_low_prop=p_hat - z*se_prop
ci_high_prop=p_hat + z*se_prop
print(f"\nP(total>{high_threshold}) p̂ {p̂:.2f} n={n} 95% CI [{ci_low_prop:.2f}, {ci_high_prop:.2f}] - wide because small n")
```

---

## 8. Hands-On Assignment - Simple to Advanced

Dataset: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - payment_value

Create confidence_interval_L10.py:

Section A z CI σ known simple:

```python
import math
x_bar=12000
sigma=2000
n=100
se=sigma/math.sqrt(n)
z=1.96
print(f"z CI σ known: x̄ {x̄} SE {se:.1f} 95% CI [{x̄-z*se:.1f}, {x̄+z*se:.1f}]")
```

Section B t CI σ unknown gradual:

```python
import numpy as np
from scipy import stats
np.random.seed(0)

# Small n=10
sample=np.random.normal(12000,2000,10)
x_bar=np.mean(sample)
s=np.std(sample, ddof=1)
se=s/np.sqrt(len(sample))
t_crit=stats.t.ppf(0.975, df=len(sample)-1)
z_crit=stats.norm.ppf(0.975,0,1)
print(f"Small n=10 x̄ {x̄:.1f} s {s:.1f} SE {se:.1f}")
print(f"t CI 95% [{x̄-t_crit*se:.1f}, {x̄+t_crit*se:.1f}] width {2*t_crit*se:.1f} wider")
print(f"z CI 95% (wrong) [{x̄-z_crit*se:.1f}, {x̄+z_crit*se:.1f}] width {2*z_crit*se:.1f} narrower overconfident")

# Large n=100 t≈z
sample_large=np.random.normal(12000,2000,100)
x_bar_l=np.mean(sample_large)
s_l=np.std(sample_large, ddof=1)
se_l=s_l/np.sqrt(100)
t_crit_l=stats.t.ppf(0.975, df=99)
print(f"\nLarge n=100 t_95 {t_crit_l:.4f}≈z_95 {z_crit:.4f} t≈z")
```

Section C Interpretation simulation:

```python
import numpy as np
from scipy import stats
np.random.seed(0)
true_mu=12000
sigma=2000
n=100
se=sigma/np.sqrt(n)
z=stats.norm.ppf(0.975,0,1)
contains=0
for _ in range(100):
    sample=np.random.normal(true_mu,sigma,size=n)
    x_bar=np.mean(sample)
    ci_low=x_bar-z*se
    ci_high=x_bar+z*se
    if ci_low<=true_mu<=ci_high:
        contains+=1
print(f"100 95% CIs contain true μ {true_mu}: {contains}/100={contains}%≈95% - correct interpretation")
```

Section D Factors width:

```python
import math
sigma=2000
print("Effect n:")
for n in [25,100,400]:
    se=sigma/math.sqrt(n)
    width=2*1.96*se
    print(f"n={n} SE {se:.1f} width {width:.1f} larger n narrower need 4x to halve")
print("\nEffect confidence:")
for conf,z in [(0.90,1.645),(0.95,1.96),(0.99,2.576)]:
    width=2*z*200
    print(f"{int(conf*100)}% z {z} width {width:.1f} higher confidence wider")
```

Section E Proportion CI:

```python
import math
n=100
successes=70
p_hat=successes/n
se=math.sqrt(p_hat*(1-p_hat)/n)
z=1.96
print(f"p̂ {p̂} 95% CI [{p̂-z*se:.3f}, {p̂+z*se:.3f}] Check np={n*p̂}≥5 n(1-p)={n*(1-p̂)}≥5")
```

Section F Kaggle:

```python
import os, pandas as pd
import numpy as np
from scipy import stats

if os.path.exists("olist_order_payments_dataset.csv"):
    df=pd.read_csv("olist_order_payments_dataset.csv", nrows=10000)
    vals=df["payment_value"].dropna()
    np.random.seed(0)
    sample=np.random.choice(vals, size=100)
    x_bar=np.mean(sample)
    s=np.std(sample, ddof=1)
    n=len(sample)
    se=s/np.sqrt(n)
    t_crit=stats.t.ppf(0.975, df=n-1)
    ci_low=x_bar-t_crit*se
    ci_high=x_bar+t_crit*se
    print(f"payment_value sample n={n} mean {x̄:.2f} s {s:.2f} 95% t CI [{ci_low:.2f}, {ci_high:.2f}]")
    print(f"True pop mean {vals.mean():.2f} within CI? {ci_low <= vals.mean() <= ci_high} - 95% of CIs contain true mean")
    
    # Proportion credit_card
    if "payment_type" in df.columns:
        p_hat=(df["payment_type"]=="credit_card").mean()
        n=len(df)
        se_prop=np.sqrt(p_hat*(1-p_hat)/n)
        ci_low_prop=p_hat-1.96*se_prop
        ci_high_prop=p_hat+1.96*se_prop
        print(f"P(credit_card) p̂ {p̂:.3f} 95% CI [{ci_low_prop:.3f}, {ci_high_prop:.3f}]")
else:
    print("Download https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce")
```

Deliverable: Upload confidence_interval_L10.py + image ci_interpretation.png showing 20 CIs green contain true μ red don't about 95% green + output z CI x̄±1.96 × σ/√n, t CI x̄±t × s/√n t>z small n, width factors larger n narrower higher confidence wider, interpretation 95% of CIs contain μ, proportion CI p̂±z√(p̂(1 − p̂)/n).

Kaggle:
1. Primary https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - payment_value CI and payment_type proportion CI
2. Secondary https://www.kaggle.com/datasets/vivek468/superstore-dataset-final - Sales CI

## 9. Checklist
- Explain point estimate no uncertainty need interval range plausible μ
- Derive z CI from CLT Z=(x̄-μ)/SE ~N(0,1) 95% between -1.96 and 1.96 CI x̄±z × SE SE = σ/√n
- Explain z critical 1.645 90% 1.96 95% 2.576 99%
- Explain t CI σ unknown s/√n t_{α/2,df} df = n − 1 heavier tails wider small n t → z large n
- Distinguish z vs t when use z σ known large n vs t σ unknown small n need approx normal
- Interpret correctly 95% of intervals from repeated samples contain true μ not 95% chance μ in this interval - show simulation 100 CIs 95 green
- Explain width factors larger n narrower 4x halves width higher confidence wider larger σ wider trade-off
- Calculate proportion CI p̂±z√(p̂(1 − p̂)/n) condition np ≥ 5
- Use SciPy norm.ppf for z t.ppf for t t.interval for CI

Key Takeaway: Point estimate not enough need interval. z CI x̄±z × σ/√n σ known. t CI x̄±t × s/√n σ unknown small n t heavier tails. 95% CI procedure 95% of intervals contain μ. Width ∝1/√n. Proportion CI p̂±z√(p̂(1 − p̂)/n).

