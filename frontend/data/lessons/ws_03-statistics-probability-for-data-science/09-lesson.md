
    
# Lesson 09 - Sampling & Central Limit Theorem - Why Means Are Normal Even If Data Is Not

**Duration:** 90 min | **Level:** Absolute Beginner | **Goal:** Understand why sample means behave nicely and estimate population from sample

## What You Will Learn

By the end of this lesson, you will be able to:

- Distinguish population (all orders, parameters μ σ p unknown) vs sample (subset you have, statistics x̄ s p̂ estimate)
- Explain why sample mean has expected value μ and variance σ²/n and standard error SE=σ/√n
- State why SE decreases as √n and calculate needed sample size n=(σ/SE₍desired₎)² to achieve desired precision
- State Central Limit Theorem: For large n ≥ 30, sample mean approx Normal N(μ,σ²/n) even if population right-skewed not Normal
- Explain why CLT is magic: individual orders right-skewed but means of many orders become symmetric normal
- Calculate sampling distribution for proportion p̂ approx Normal N(p,p(1-p)/n) with SE √(p(1-p)/n)
- Simulate CLT: Show right-skewed exponential population → sample means n=5 less skewed → n=30 approx normal bell
- Apply CLT to estimate population mean from sample and understand why larger samples give more precise estimates


---

## 1. Population vs Sample

- **Population:** All possible data you care about. E.g., all orders ever in your store. Often infinite or too large to collect all. Parameters: μ population mean, σ population std, p population proportion - unknown, want to estimate.
- **Sample:** Subset of population you actually have. E.g., 1000 orders from Kaggle Olist. Statistics: x̄ sample mean, s sample std, p̂ sample proportion - computed from sample, estimate population.

Goal: Use sample statistics to estimate population parameters with uncertainty.

**Sampling methods:**
- Simple random sampling: Every order equally likely to be in sample, independent. Best for inference.
- Convenience sampling: Use whatever data you have - may be biased.

---

## 2. Sample Mean Distribution and Standard Error

Take sample of size n, compute sample mean x̄ = (X1+...+Xn)/n

If population mean μ std σ, then:

- Expected value of sample mean E[x̄]=μ - sample mean unbiased, average of many sample means equals population mean
- Variance Var[x̄]=σ²/n - sample mean variance smaller than population variance, more precise with larger n
- Standard Error SE = std of sample mean = σ/√n - how much sample means vary around μ. SE decreases as √n, double precision need 4x sample.

Why? Averaging reduces noise. Individual orders noisy variable, but average of many orders less variable.

Example: σ=2000, n=100, SE=2000/√100=2000/10=200. Sample mean varies ±200 around μ. n=400, SE=2000/20=100 half as variable.

<svg width="100%" height="200" viewBox="0 0 700 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="200" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">SAMPLE MEAN DISTRIBUTION - E[x̄]=μ VAR=σ²/n SE=σ/√n</text>
  <rect x="20" y="50" width="200" height="130" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
  <text x="120" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#1E40AF">Population σ=2000</text>
  <text x="35" y="90" font-family="Arial" font-size="8" fill="#1E40AF">Individual orders variable</text>
  <text x="35" y="108" font-family="Arial" font-size="8" fill="#1E40AF">Std 2000</text>
  <rect x="250" y="50" width="200" height="130" rx="12" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1"/>
  <text x="350" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#065F46">Sample mean n=100 SE=200</text>
  <text x="265" y="90" font-family="Arial" font-size="8" fill="#065F46">σ/√n=2000/10=200</text>
  <text x="265" y="108" font-family="Arial" font-size="8" fill="#065F46">Less variable than individual</text>
  <text x="265" y="126" font-family="Arial" font-size="8" fill="#065F46">More precise</text>
  <rect x="480" y="50" width="200" height="130" rx="12" fill="#FFFBEB" stroke="#FCD34D" stroke-width="1"/>
  <text x="580" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#92400E">Sample mean n=400 SE=100</text>
  <text x="495" y="90" font-family="Arial" font-size="8" fill="#92400E">σ/√n=2000/20=100</text>
  <text x="495" y="108" font-family="Arial" font-size="8" fill="#92400E">Even less variable</text>
  <text x="495" y="126" font-family="Arial" font-size="8" fill="#92400E">4x sample 2x precision</text>
</svg>

---

## 3. Central Limit Theorem CLT - Magic

CLT: For large n (usually n ≥ 30), sample mean x̄ approx Normal N(μ, σ²/n) even if population not Normal! Provided population has finite mean and variance and sample independent random.

Why magic? Individual orders right-skewed not Normal, but average of many orders becomes symmetric Normal.

Intuition: Sum of many small independent factors, each factor random, sum approx Normal. Sample mean is sum/n, so approx Normal.

**When does CLT work?**
- n large ≥30 rule of thumb, but more skewed population needs larger n
- Sample independent random
- Finite variance

**What does CLT say precisely?**
x̄ ~ N(μ, σ²/n) approx, or Z = (x̄ - μ)/(σ/√n) ~ N(0,1) approx

So we can use Normal methods for sample means even if data not Normal, as long as n large.

**Visual: CLT from Right-Skewed to Normal Means**

<svg width="100%" height="220" viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="220" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">CENTRAL LIMIT THEOREM - SAMPLE MEAN APPROX NORMAL EVEN IF POPULATION RIGHT-SKEWED</text>
  <rect x="20" y="50" width="200" height="150" rx="12" fill="#FEF2F2" stroke="#FCA5A5" stroke-width="1"/>
  <text x="120" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#7F1D1D">Population Right-Skewed</text>
  <text x="35" y="90" font-family="Arial" font-size="8" fill="#7F1D1D">Individual orders skewed</text>
  <text x="35" y="108" font-family="Arial" font-size="8" fill="#7F1D1D">Mean>Median tail right</text>
  <rect x="250" y="50" width="200" height="150" rx="12" fill="#FFFBEB" stroke="#FCD34D" stroke-width="1"/>
  <text x="350" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#92400E">Sample Mean n=5 Somewhat Normal</text>
  <text x="265" y="90" font-family="Arial" font-size="8" fill="#92400E">Means of 5 orders less skewed</text>
  <rect x="480" y="50" width="200" height="150" rx="12" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1"/>
  <text x="580" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#065F46">Sample Mean n=30 Approx Normal</text>
  <text x="495" y="90" font-family="Arial" font-size="8" fill="#065F46">Means of 30 orders bell shape</text>
  <text x="495" y="108" font-family="Arial" font-size="8" fill="#065F46">N(μ, σ²/n) SE=σ/√n</text>
  <text x="495" y="126" font-family="Arial" font-size="8" fill="#065F46">Magic - skewed → normal for means</text>
</svg>

---

## 4. Code Simple→Advanced - Demonstrate CLT

Step 1 Simulate right-skewed population and sample means:

```python
# Step 1: CLT demo - population right-skewed exponential, sample means become normal
import numpy as np
import matplotlib.pyplot as plt
from scipy import stats

np.random.seed(0)

# Population right-skewed - exponential λ=1 mean 1
pop = np.random.exponential(scale=1, size=100000)  # Exponential right-skewed
print(f"Population exponential mean {np.mean(pop):.2f} median {np.median(pop):.2f} Mean>Median right-skewed skew {stats.skew(pop):.2f}")

plt.figure(figsize=(12,4))
plt.subplot(1,3,1)
plt.hist(pop, bins=50, density=True, color="skyblue")
plt.title(f"Population right-skewed skew {stats.skew(pop):.2f}")

# Sample means n=5
n=5
sample_means_n5 = []
for _ in range(10000):
    sample = np.random.choice(pop, size=n)
    sample_means_n5.append(np.mean(sample))

sample_means_n5 = np.array(sample_means_n5)
print(f"\nSample means n={n} mean {np.mean(sample_means_n5):.2f}≈pop mean {np.mean(pop):.2f} std {np.std(sample_means_n5, ddof=0):.3f} SE=σ/√n={np.std(pop,ddof=0)/np.sqrt(n):.3f} skew {stats.skew(sample_means_n5):.2f} less skewed than pop")

plt.subplot(1,3,2)
plt.hist(sample_means_n5, bins=50, density=True, color="lightgreen")
plt.title(f"Sample means n={n} skew {stats.skew(sample_means_n5):.2f} more normal")

# Sample means n=30
n=30
sample_means_n30 = []
for _ in range(10000):
    sample = np.random.choice(pop, size=n)
    sample_means_n30.append(np.mean(sample))

sample_means_n30 = np.array(sample_means_n30)
print(f"Sample means n={n} mean {np.mean(sample_means_n30):.2f} std {np.std(sample_means_n30, ddof=0):.3f} SE=σ/√n={np.std(pop,ddof=0)/np.sqrt(n):.3f} skew {stats.skew(sample_means_n30):.2f} approx normal")

plt.subplot(1,3,3)
plt.hist(sample_means_n30, bins=50, density=True, color="orange", alpha=0.7)
# Overlay normal N(μ, σ²/n)
mu = np.mean(pop)
sigma = np.std(pop, ddof=0)
x = np.linspace(sample_means_n30.min(), sample_means_n30.max(), 100)
pdf = stats.norm.pdf(x, loc=mu, scale=sigma/np.sqrt(n))
plt.plot(x, pdf, color="red", label=f"N({mu:.2f},{sigma**2/n:.3f})")
plt.title(f"Sample means n={n} approx normal skew {stats.skew(sample_means_n30):.2f}")
plt.legend()

plt.tight_layout()
plt.savefig("clt_demo.png")
print("\nSaved clt_demo.png - left population right-skewed, middle n=5 less skewed, right n=30 approx normal bell with red normal overlay N(μ,σ²/n)")
```

Step 2 Standard Error decreases with n:

```python
import numpy as np

pop_std=2000
for n in [10,25,100,400]:
    se = pop_std / np.sqrt(n)
    print(f"n={n} SE=σ/√n={pop_std}/√{n}={pop_std}/{np.sqrt(n):.1f}={se:.1f} - larger n smaller SE more precise sample mean")

# To halve SE need 4x sample: SE ∝1/√n
print(f"\nTo halve SE from 200 to 100 need 4x sample: n=100 SE=200 n=400 SE=100")
```

---

## 5. Sampling Distribution of Proportion

For proportion p̂ = number successes / n

If population proportion p, n large, p̂ approx Normal N(p, p(1-p)/n) via CLT (Binomial approx Normal)

SE proportion = √(p(1-p)/n)

Example: P(NG)=0.7, sample n=100, p̂ approx N(0.7, 0.7*0.3/100)=N(0.7,0.0021) std √0.0021=0.0458

So sample proportion varies ±4.6% around true 70%.

Code:

```python
import numpy as np
from scipy import stats

p=0.7
n=100
se_prop = np.sqrt(p*(1-p)/n)
print(f"Population p={p} n={n} p_hat ~ N(p, p(1-p)/n) = N({p}, {p*(1-p)/n:.4f}) SE={se_prop:.4f}")
print(f"95% interval p_hat within p±1.96*SE = {p}±1.96*{se_prop:.4f} = {p-1.96*se_prop:.3f} to {p+1.96*se_prop:.3f}")

# Simulate
samples = np.random.binomial(n,p,size=10000)/n
print(f"Simulate 10000 samples p_hat mean {np.mean(samples):.3f}≈{p} std {np.std(samples,ddof=0):.4f}≈{se_prop:.4f}")
```

---

## 6. Real Store Example

```python
import pandas as pd
import numpy as np

# Suppose daily orders per store Poisson λ
daily_counts_Ikeja = [18,22,19,20,21,19,20,23,18,20]
mean_Ikeja = np.mean(daily_counts_Ikeja)
std_Ikeja = np.std(daily_counts_Ikeja, ddof=0)
n=len(daily_counts_Ikeja)

# Sample mean distribution
se = std_Ikeja / np.sqrt(n)
print(f"Ikeja daily mean {mean_Ikeja:.1f} std {std_Ikeja:.1f} n={n} SE={se:.2f}")
print(f"Population mean estimate {mean_Ikeja:.1f} ±1.96*SE 95% interval {mean_Ikeja-1.96*se:.1f} to {mean_Ikeja+1.96*se:.1f} (CLT approx normal for mean)")

# If you want more precise estimate, need larger n
# Desired SE=0.5, current SE=?
# n_needed = (σ/SE₍desired₎)^2
desired_se=0.5
n_needed = (std_Ikeja/desired_se)**2
print(f"To get SE={desired_se} need n≈{n_needed:.0f} days")
```

---

## 7. Hands-On Assignment

Dataset: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - payment_value right-skewed population, sample means become normal

Create sampling_clt_L09.py:

Section A Population vs Sample Mean SE:

```python
import numpy as np
pop_std=2000
for n in [10,100,400]:
    se=pop_std/np.sqrt(n)
    print(f"n={n} SE=σ/√n={pop_std}/√{n}={se:.1f} larger n smaller SE")
```

Section B CLT Demo Exponential Right-Skewed → Normal Means:

```python
import numpy as np
from scipy import stats
import matplotlib.pyplot as plt

np.random.seed(0)
pop=np.random.exponential(1,100000)
print(f"Pop mean {np.mean(pop):.2f} median {np.median(pop):.2f} skew {stats.skew(pop):.2f} right-skewed")

for n in [5,30]:
    means=[np.mean(np.random.choice(pop,size=n)) for _ in range(10000)]
    means=np.array(means)
    print(f"Sample means n={n} mean {np.mean(means):.2f} SE {np.std(means,ddof=0):.3f}≈σ/√n={np.std(pop,ddof=0)/np.sqrt(n):.3f} skew {stats.skew(means):.2f} more normal as n increases")

# Plot
plt.figure(figsize=(10,4))
plt.subplot(1,3,1)
plt.hist(pop, bins=50, density=True, color="skyblue")
plt.title("Pop exponential right-skewed")
plt.subplot(1,3,2)
plt.hist([np.mean(np.random.choice(pop,size=5)) for _ in range(10000)], bins=50, density=True, color="lightgreen")
plt.title("Means n=5")
plt.subplot(1,3,3)
plt.hist([np.mean(np.random.choice(pop,size=30)) for _ in range(10000)], bins=50, density=True, color="orange")
plt.title("Means n=30 approx normal")
plt.savefig("clt_demo_assignment.png")
```

Section C Proportion CLT:

```python
import numpy as np
p=0.7
n=100
se=np.sqrt(p*(1-p)/n)
print(f"p={p} n={n} p_hat SE √(p(1-p)/n)={se:.4f} 95% interval {p-1.96*se:.3f} to {p+1.96*se:.3f}")
```

Section D Kaggle:

```python
import os, pandas as pd
import numpy as np
from scipy import stats
import matplotlib.pyplot as plt

if os.path.exists("olist_order_payments_dataset.csv"):
    df=pd.read_csv("olist_order_payments_dataset.csv", nrows=10000)
    vals=df["payment_value"].dropna().values
    print(f"Population payment_value mean {np.mean(vals):.2f} median {np.median(vals):.2f} skew {stats.skew(vals):.2f} right-skewed not normal")
    
    # Sample means n=30
    n=30
    sample_means=[np.mean(np.random.choice(vals,size=n)) for _ in range(5000)]
    print(f"Sample means n={n} mean {np.mean(sample_means):.2f}≈pop mean {np.mean(vals):.2f} SE {np.std(sample_means,ddof=0):.2f} vs σ/√n {np.std(vals,ddof=0)/np.sqrt(n):.2f} skew {stats.skew(sample_means):.2f} approx normal")
    
    plt.figure(figsize=(10,4))
    plt.subplot(1,2,1)
    plt.hist(vals, bins=50, density=True, color="skyblue")
    plt.title(f"Pop right-skewed skew {stats.skew(vals):.2f}")
    plt.subplot(1,2,2)
    plt.hist(sample_means, bins=50, density=True, color="lightgreen")
    plt.title(f"Means n={n} skew {stats.skew(sample_means):.2f} approx normal")
    # Overlay normal N(μ,σ²/n)
    mu=np.mean(vals)
    sigma=np.std(vals,ddof=0)
    x=np.linspace(min(sample_means), max(sample_means), 100)
    plt.plot(x, stats.norm.pdf(x, loc=mu, scale=sigma/np.sqrt(n)), color="red", label=f"N(μ,σ²/n)")
    plt.legend()
    plt.savefig("clt_payment_value.png")
    print("Saved clt_payment_value.png - left pop right-skewed right means n=30 approx normal bell")
else:
    print("Download https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce")
```

Deliverable: Upload sampling_clt_L09.py + images clt_demo.png population right-skewed to normal means, clt_demo_assignment.png, clt_payment_value.png + output E[x̄]=μ Var=σ²/n SE=σ/√n, CLT sample mean approx N(μ,σ²/n) for large n even if pop not normal, SE decreases √n, p̂ approx N(p,p(1-p)/n).

Kaggle:
1. Primary https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - payment_value right-skewed pop means n=30 normal
2. Secondary https://www.kaggle.com/datasets/vivek468/superstore-dataset-final - Sales right-skewed means normal

## 9. Checklist
- Distinguish population all data parameters μ σ p unknown vs sample subset statistics x̄ s p̂ estimate
- Explain sample mean E[x̄]=μ unbiased Var=σ²/n SE=σ/√n averaging reduces noise larger n more precise need 4x sample halve SE
- State CLT for large n ≥ 30 sample mean approx Normal N(μ,σ²/n) even if pop not normal finite mean var independent random skewed pop needs larger n
- Explain why magic sum many factors normal Z=(x̄-μ)/(SE) ~ N(0,1)
- Explain proportion p̂ approx Normal N(p,p(1-p)/n) SE √(p(1-p)/n) via CLT Binomial approx Normal
- Demonstrate CLT via simulation exponential right-skewed pop sample means n=5 less skewed n=30 bell with red normal overlay N(μ,σ²/n)
- Calculate needed n for desired SE n=(σ/SE₍desired₎)²

Key Takeaway: Population parameters unknown sample estimates. Sample mean E=μ Var=σ²/n SE=σ/√n larger n more precise. CLT sample mean approx Normal N(μ,σ²/n) even if pop not normal for large n - allows Normal methods for means.

