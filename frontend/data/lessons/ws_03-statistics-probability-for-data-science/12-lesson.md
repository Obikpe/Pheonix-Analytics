# Lesson 12 - Two-Sample Tests & ANOVA - Is Lagos Different From London?

**Duration:** 90 min | **Level:** Absolute Beginner | **Goal:** Compare means of two or more groups to see if difference is real

## What You Will Learn

By the end of this lesson, you will be able to:

- Explain why two-sample tests needed: Compare two groups e.g., Lagos vs London mean totals, not just one sample vs fixed value
- Define H₀: μ₁ = μ₂ (no difference) vs H₁: μ₁ ≠ μ₂ (difference) for two-sample tests
- Calculate two-sample t-test for independent samples when comparing means of two independent groups
- Distinguish paired vs independent samples: Paired same subjects before/after, independent different subjects
- Explain equal variance vs unequal variance (Welch's t-test) - Welch more robust use by default
- Calculate paired t-test: d = X₁ − X₂ differences, test H₀: μ_d = 0 using one-sample t-test on differences
- Explain ANOVA (Analysis of Variance) for comparing more than two groups: H₀: μ₁ = μ₂ = μ₃ all equal vs H₁: at least one different
- Define F-statistic in ANOVA: F = between-group variance / within-group variance, large F means groups differ more than within-group variation
- Use SciPy ttest_ind, ttest_rel, f_oneway for two-sample and ANOVA tests
- Apply to real sales data: Test if mean payment_value differs by customer_state or if Sales differ by Region

---

## 1. Why Compare Two Groups?

one-sample test: Test if μ = μ₀ single group vs fixed value.

Now real question: Is Lagos mean different from London mean? Two groups.

Example:
- Lagos Ikeja totals: 53750, 34400, 50000 mean x̄₁=46038
- London Camden totals: 433, 500, 600 mean x̄₂=511
Difference large, but is it statistically significant or just sampling variation? Need test.

H₀: μ₁ = μ₂ no difference, same population mean
H₁: μ₁ ≠ μ₂ difference exists (two-tailed) or μ₁ > μ₂ (one-tailed)

We have two samples, need to account for variation in both.

---

## 2. Two-Sample Independent t-test

### Independent Samples

Independent: Two groups different subjects, no pairing. Example: Orders from Lagos store vs London store different orders.

If same orders before/after promotion, paired.

For independent, we compare means.

### Formula - Welch's t-test (Unequal Variances) - Recommended Default

Most robust, don't assume equal variances.

t = (x̄₁ − x̄₂) / √(s₁²/n₁ + s₂²/n₂)

SE = √(s₁²/n₁ + s₂²/n₂) - standard error of difference

df approx Welch-Satterthwaite formula (complex, SciPy handles), not n₁+n₂-2.

If equal variances assumed (Student's t), pooled variance s_p² = ((n₁-1)s₁² + (n₂-1)s₂²)/(n₁+n₂-2), SE = s_p × √(1/n₁ + 1/n₂), df = n₁+n₂-2. But Welch better, use equal_var=False in SciPy.

p-value from t-distribution with df.

### Visual: Two Groups Comparison

<svg width="100%" height="200" viewBox="0 0 700 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="200" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">TWO-SAMPLE TEST - H₀: μ₁=μ₂ vs H₁: μ₁≠μ₂ - t=(x̄₁-x̄₂)/√(s₁²/n₁+s₂²/n₂)</text>
  <rect x="20" y="50" width="300" height="130" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
  <text x="170" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#1E40AF">Lagos Group 1</text>
  <text x="35" y="90" font-family="Arial" font-size="8" fill="#1E40AF">x̄₁=46038 s₁=8000 n₁=30</text>
  <text x="35" y="108" font-family="Arial" font-size="8" fill="#1E40AF">Mean higher</text>
  <rect x="380" y="50" width="300" height="130" rx="12" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1"/>
  <text x="530" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#065F46">London Group 2</text>
  <text x="395" y="90" font-family="Arial" font-size="8" fill="#065F46">x̄₂=511 s₂=100 n₂=30</text>
  <text x="395" y="108" font-family="Arial" font-size="8" fill="#065F46">Mean lower</text>
  <text x="350" y="165" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#111827">Difference x̄₁-x̄₂=45527 SE=√(s₁²/n₁+s₂²/n₂) t=45527/SE large p small reject H₀ Lagos≠London</text>
</svg>

### Code Simple→Advanced

**Method 1 Plain Python Manual Welch t-test:**

```python
# Method 1: Manual two-sample Welch t-test independent
import math
from scipy import stats

# Example: Lagos vs London
# Group1 Lagos
x1_bar=46038
s1=8000
n1=30

# Group2 London
x2_bar=511
s2=100
n2=30

# Difference
diff = x1_bar - x2_bar
print(f"Group1 Lagos x̄₁={x1_bar} s₁={s1} n₁={n1}")
print(f"Group2 London x̄₂={x2_bar} s₂={s2} n₂={n2}")
print(f"Difference x̄₁-x̄₂={diff}")

# SE of difference Welch
se_diff = math.sqrt(s1**2/n1 + s2**2/n2)
print(f"SE difference = √(s₁²/n₁ + s₂²/n₂) = √({s1}²/{n1} + {s2}²/{n2}) = √({s1**2/n1:.1f}+{s2**2/n2:.1f}) = {se_diff:.1f}")

# t statistic
t_stat = diff / se_diff
print(f"t = (x̄₁-x̄₂)/SE = {diff}/{se_diff:.1f} = {t_stat:.3f}")

# df Welch-Satterthwaite approx
# df = (s₁²/n₁ + s₂²/n₂)² / [ (s₁²/n₁)²/(n₁-1) + (s₂²/n₂)²/(n₂-1) ]
numer = (s1**2/n1 + s2**2/n2)**2
denom = (s1**2/n1)**2/(n1-1) + (s2**2/n2)**2/(n2-1)
df_welch = numer/denom
print(f"Welch df ≈ {df_welch:.1f}")

# p-value two-tailed
p_two = 2*(1-stats.t.cdf(abs(t_stat), df=df_welch))
print(f"Two-tailed p-value =2×P(T≥|{t_stat:.3f}|) df={df_welch:.1f} = {p_two:.4e} very small → Reject H₀ μ₁≠μ₂ Lagos≠London significant")

# One-tailed right H₁: μ₁>μ₂
p_one_right = 1-stats.t.cdf(t_stat, df=df_welch)
print(f"One-tailed right H₁: μ₁>μ₂ p={p_one_right:.4e} → Reject H₀ Lagos greater")
```

**Method 2 SciPy ttest_ind:**

```python
# Method 2: SciPy ttest_ind Welch default equal_var=False
from scipy import stats
import numpy as np

np.random.seed(0)

# Simulate two independent groups
group1 = np.random.normal(46038, 8000, size=30)  # Lagos
group2 = np.random.normal(511, 100, size=30)  # London

# Welch t-test independent
t_stat, p_two = stats.ttest_ind(group1, group2, equal_var=False)  # Welch
print(f"Welch two-sample independent t-test")
print(f"Group1 mean {np.mean(group1):.0f} Group2 mean {np.mean(group2):.0f}")
print(f"t={t_stat:.3f} p_two={p_two:.4e} → {'Reject H₀' if p_two<=0.05 else 'Fail to reject'} significant difference")

# Equal var Student t (less robust)
t_eq, p_eq = stats.ttest_ind(group1, group2, equal_var=True)
print(f"\\nStudent t-test equal_var=True t={t_eq:.3f} p={p_eq:.4e} - similar but Welch more robust recommended")

# One-tailed p
# SciPy only gives two-tailed, one-tailed = p_two/2 if t>0
p_one_right = p_two/2 if t_stat>0 else 1-p_two/2
print(f"One-tailed right H₁: μ₁>μ₂ p={p_one_right:.4e}")

# Effect size: Cohen's d = (x̄₁-x̄₂)/pooled std
# For Welch, use sqrt((s1²+s2²)/2) approx
s1=np.std(group1, ddof=1)
s2=np.std(group2, ddof=1)
pooled_std = math.sqrt((s1**2 + s2**2)/2)
cohen_d = (np.mean(group1)-np.mean(group2))/pooled_std
print(f"Cohen's d effect size = (x̄₁-x̄₂)/pooled_std = {cohen_d:.2f} - large effect if >0.8")
```

**Method 3 Pandas:**

```python
import pandas as pd
import numpy as np
from scipy import stats

np.random.seed(0)

# Create DataFrame with store_id
df = pd.DataFrame({
    "store_id": ["LAG_001_Ikeja"]*30 + ["LDN_001_Camden"]*30,
    "total": list(np.random.normal(46038,8000,30)) + list(np.random.normal(511,100,30))
})

group1 = df[df["store_id"]=="LAG_001_Ikeja"]["total"]
group2 = df[df["store_id"]=="LDN_001_Camden"]["total"]

t_stat, p_two = stats.ttest_ind(group1, group2, equal_var=False)

print(f"DataFrame two groups")
print(f"LAG mean {group1.mean():.0f} LDN mean {group2.mean():.0f}")
print(f"Welch t={t_stat:.3f} p={p_two:.4e} → {'Significant difference' if p_two<=0.05 else 'No significant difference'}")

# Boxplot visualization
import matplotlib.pyplot as plt

plt.figure()
df.boxplot(column="total", by="store_id")
plt.title("Boxplot Lagos vs London - visual difference")
plt.savefig("boxplot_two_sample.png")
print("Saved boxplot_two_sample.png - boxes don't overlap suggests significant difference")
```

---

## 3. Paired t-test - Before/After Same Subjects

### Paired Samples

Paired: Same subjects measured twice, e.g., same stores before and after promotion, same customers before/after. Data paired, not independent.

We care about difference d = X₁ − X₂ per pair.

Test H₀: μ_d = 0 no difference in population mean difference vs H₁: μ_d ≠ 0

Procedure: Compute differences d_i for each pair, then do one-sample t-test on d_i: H₀: μ_d =0

t = d̄ / (s_d/√n) where d̄ mean of differences, s_d std of differences, df = n−1 (n = number of pairs)

Paired more powerful than independent if pairing meaningful, because removes between-subject variation.

Example: 10 stores sales before promotion and after, difference per store, test if promotion increased mean.

### Visual: Paired vs Independent

<svg width="100%" height="150" viewBox="0 0 700 150" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="150" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">PAIRED vs INDEPENDENT</text>
  <rect x="20" y="50" width="300" height="80" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
  <text x="170" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#1E40AF">Paired - Same subjects twice</text>
  <text x="35" y="90" font-family="Arial" font-size="8" fill="#1E40AF">Before/After same stores, d=X₁-X₂</text>
  <text x="35" y="108" font-family="Arial" font-size="8" fill="#1E40AF">Test H₀: μ_d=0 one-sample t on d</text>
  <rect x="380" y="50" width="300" height="80" rx="12" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1"/>
  <text x="530" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#065F46">Independent - Different subjects</text>
  <text x="395" y="90" font-family="Arial" font-size="8" fill="#065F46">Lagos vs London different orders</text>
  <text x="395" y="108" font-family="Arial" font-size="8" fill="#065F46">Test H₀: μ₁=μ₂ two-sample t</text>
</svg>

### Code - Paired t-test

**Method 1 Plain Python Manual:**

```python
# Method 1: Manual paired t-test
import math
from scipy import stats

# Example: 10 stores before and after promotion
before = [40000,42000,38000,41000,39500,40500,39800,41200,38700,40000]
after = [45000,47000,42000,46000,43000,45500,44000,46200,43000,44500]

# Differences d = after - before
differences = [a - b for a,b in zip(after, before)]
n=len(differences)

d_bar = sum(differences)/n
# s_d
import numpy as np
s_d = np.std(differences, ddof=1)

se_d = s_d / math.sqrt(n)
t_stat = d_bar / se_d
df=n-1

print(f"Before: {before}")
print(f"After: {after}")
print(f"Differences d=after-before: {differences}")
print(f"d̄={d_bar:.1f} s_d={s_d:.1f} SE_d=s_d/√n={se_d:.1f} n={n}")
print(f"t = d̄/SE_d = {d_bar:.1f}/{se_d:.1f} = {t_stat:.3f} df={df}")

p_two = 2*(1-stats.t.cdf(abs(t_stat), df=df))
print(f"Two-tailed p-value H₀: μ_d=0 vs H₁: μ_d≠0 p={p_two:.4f} α=0.05 → {'Reject H₀ promotion effect' if p_two<=0.05 else 'Fail to reject no effect'}")
```

**Method 2 SciPy ttest_rel:**

```python
from scipy import stats
import numpy as np

np.random.seed(0)

before = np.random.normal(40000,2000,size=10)
after = before + np.random.normal(5000,1000,size=10)  # Increase 5000 on average

# Paired t-test
t_stat, p_two = stats.ttest_rel(after, before)  # after - before

print(f"Paired t-test H₀: μ_d=0")
print(f"Before mean {np.mean(before):.0f} After mean {np.mean(after):.0f} Difference mean {np.mean(after-before):.0f}")
print(f"t={t_stat:.3f} p_two={p_two:.4f} → {'Significant increase' if p_two<=0.05 else 'No significant'}")

# Compare with independent t-test (wrong for paired data - less powerful)
t_ind, p_ind = stats.ttest_ind(after, before, equal_var=False)
print(f"\\nIndependent t-test (incorrect for paired) t={t_ind:.3f} p={p_ind:.4f} - p larger less powerful because ignores pairing")
```

---

## 4. ANOVA - Analysis of Variance - Compare More Than Two Groups

### Why ANOVA Not Many t-tests?

If you have 3 groups A,B,C, you could do t-tests A vs B, A vs C, B vs C 3 tests. But multiple tests increase Type I error chance. With α=0.05 per test, chance at least one false positive among 3 tests =1-(1-0.05)³≈0.14 14% >5%. With many groups worse.

ANOVA tests all groups at once with one test, controls Type I error.

### H₀ and H₁ ANOVA

- H₀: μ₁ = μ₂ = μ₃ = ... = μ_k all group means equal
- H₁: At least one mean different (not all equal)

ANOVA doesn't say which group different, only at least one different. Need post-hoc tests (Tukey HSD) to find which pairs differ after ANOVA significant.

### F-statistic

F = Between-group variance / Within-group variance

- Between-group variance: Variation of group means around overall mean, measures how far groups apart
- Within-group variance: Variation of individual values around their group mean, measures noise within groups

If groups really different, between-group variance large compared to within-group variance → F large → p small → reject H₀.

If groups not different, between and within similar → F≈1 → p large → fail to reject.

F follows F-distribution with df₁ = k−1 (between) and df₂ = N−k (within), N total sample size, k number groups.

### Visual: ANOVA F

<svg width="100%" height="180" viewBox="0 0 700 180" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="180" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">ANOVA F = BETWEEN-GROUP VARIANCE / WITHIN-GROUP VARIANCE</text>
  <rect x="20" y="50" width="200" height="110" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
  <text x="120" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#1E40AF">H₀: μ₁=μ₂=μ₃</text>
  <text x="35" y="90" font-family="Arial" font-size="8" fill="#1E40AF">All means equal</text>
  <text x="35" y="108" font-family="Arial" font-size="8" fill="#1E40AF">F≈1 between≈within</text>
  <rect x="250" y="50" width="200" height="110" rx="12" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1"/>
  <text x="350" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#065F46">Between variance</text>
  <text x="265" y="90" font-family="Arial" font-size="8" fill="#065F46">Group means far apart</text>
  <rect x="480" y="50" width="200" height="110" rx="12" fill="#FEF2F2" stroke="#FCA5A5" stroke-width="1"/>
  <text x="580" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#7F1D1D">Within variance</text>
  <text x="495" y="90" font-family="Arial" font-size="8" fill="#495">Noise within groups</text>
  <text x="350" y="165" text-anchor="middle" font-family="Arial" font-size="9" fill="#111827">F large = between large / within small → groups differ → reject H₀</text>
</svg>

### Code Simple→Advanced - ANOVA

**Method 1 SciPy f_oneway:**

```python
# Method 1: ANOVA one-way
from scipy import stats
import numpy as np

np.random.seed(0)

# 3 groups: Ikeja, Lekki, Camden
group_ikeja = np.random.normal(50000,5000,size=30)
group_lekki = np.random.normal(52000,5000,size=30)
group_camden = np.random.normal(40000,5000,size=30)  # Different mean

# ANOVA H₀: μ₁=μ₂=μ₃
f_stat, p_value = stats.f_oneway(group_ikeja, group_lekki, group_camden)

print(f"ANOVA H₀: μ_Ikeja=μ_Lekki=μ_Camden all equal")
print(f"Group means: Ikeja {np.mean(group_ikeja):.0f} Lekki {np.mean(group_lekki):.0f} Camden {np.mean(group_camden):.0f}")
print(f"F={f_stat:.3f} p={p_value:.4e} α=0.05 → {'Reject H₀ at least one mean different' if p_value<=0.05 else 'Fail to reject all equal'}")

# If ANOVA significant, need post-hoc to find which pairs differ
# Tukey HSD
from statsmodels.stats.multicomp import pairwise_tukeyhsd
import pandas as pd

# Create DataFrame for Tukey
df = pd.DataFrame({
    "total": list(group_ikeja) + list(group_lekki) + list(group_camden),
    "store": ["Ikeja"]*30 + ["Lekki"]*30 + ["Camden"]*30
})

tukey = pairwise_tukeyhsd(endog=df["total"], groups=df["store"], alpha=0.05)
print(f"\\nTukey HSD post-hoc which pairs differ:")
print(tukey)

# If ANOVA not significant, e.g., 3 groups with same mean
group_same1 = np.random.normal(50000,5000,size=30)
group_same2 = np.random.normal(50000,5000,size=30)
group_same3 = np.random.normal(50000,5000,size=30)
f_same, p_same = stats.f_oneway(group_same1, group_same2, group_same3)
print(f"\\nANOVA same means: F={f_same:.3f} p={p_same:.4f} → {'Reject' if p_same<=0.05 else 'Fail to reject all equal'}")
```

**Method 2 Pandas and Visualization:**

```python
import pandas as pd
import numpy as np
from scipy import stats
import matplotlib.pyplot as plt

np.random.seed(0)

df = pd.DataFrame({
    "store_id": ["LAG_001_Ikeja"]*30 + ["LAG_002_Lekki"]*30 + ["LDN_001_Camden"]*30,
    "total": list(np.random.normal(50000,5000,30)) + list(np.random.normal(52000,5000,30)) + list(np.random.normal(40000,5000,30))
})

# ANOVA
groups = [df[df["store_id"]==store]["total"] for store in df["store_id"].unique()]
f_stat, p_value = stats.f_oneway(*groups)

print(f"ANOVA F={f_stat:.3f} p={p_value:.4e}")

# Boxplot
plt.figure()
df.boxplot(column="total", by="store_id")
plt.title(f"ANOVA F={f_stat:.1f} p={p_value:.2e} - Camden lower than Lagos groups")
plt.savefig("anova_boxplot.png")
print("Saved anova_boxplot.png - boxes visual difference, ANOVA tests if difference significant")
```

---

## 5. Real Store Example

```python
import pandas as pd
import numpy as np
from scipy import stats

# Simulate store data
np.random.seed(0)

# Lagos Ikeja vs Lekki two-sample
ikeja = np.random.normal(50000,8000,30)
lekki = np.random.normal(55000,8000,30)

t_stat, p_two = stats.ttest_ind(ikeja, lekki, equal_var=False)
print(f"Two-sample independent Ikeja vs Lekki H₀: μ₁=μ₂")
print(f"x̄₁={np.mean(ikeja):.0f} x̄₂={np.mean(lekki):.0f} t={t_stat:.3f} p={p_two:.4f} → {'Significant difference' if p_two<=0.05 else 'No significant difference'}")

# Paired before/after promotion same stores
before = np.random.normal(40000,3000,15)
after = before + np.random.normal(5000,2000,15)
t_paired, p_paired = stats.ttest_rel(after, before)
print(f"\\nPaired before/after H₀: μ_d=0 t={t_paired:.3f} p={p_paired:.4f} → {'Promotion increased sales' if p_paired<=0.05 else 'No significant increase'}")

# ANOVA 3 stores
f_stat, p_anova = stats.f_oneway(ikeja, lekki, np.random.normal(40000,8000,30))
print(f"\\nANOVA 3 stores F={f_stat:.3f} p={p_anova:.4e} → {'At least one store different' if p_anova<=0.05 else 'All equal'}")
```

---

## 6. Hands-On Assignment

Dataset: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - customer_state, payment_value

Create two_sample_anova_L12.py:

Section A Two-sample independent:

```python
from scipy import stats
import numpy as np
np.random.seed(0)
group1=np.random.normal(50000,8000,30)
group2=np.random.normal(40000,8000,30)
t_stat,p_two=stats.ttest_ind(group1, group2, equal_var=False)
print(f"Two-sample independent H₀: μ₁=μ₂ x̄₁={np.mean(group1):.0f} x̄₂={np.mean(group2):.0f} t={t_stat:.3f} p={p_two:.4e} → {'Reject H₀ different' if p_two<=0.05 else 'Fail to reject'}")
print(f"Welch t=(x̄₁-x̄₂)/√(s₁²/n₁+s₂²/n₂) df approx Welch-Satterthwaite")
```

Section B Paired:

```python
from scipy import stats
import numpy as np
np.random.seed(0)
before=np.random.normal(40000,2000,10)
after=before+np.random.normal(5000,1000,10)
t_stat,p_two=stats.ttest_rel(after, before)
print(f"Paired H₀: μ_d=0 d̄={np.mean(after-before):.0f} t={t_stat:.3f} p={p_two:.4f} → {'Reject H₀ promotion effect' if p_two<=0.05 else 'Fail to reject'}")
```

Section C ANOVA:

```python
from scipy import stats
import numpy as np
np.random.seed(0)
g1=np.random.normal(50000,5000,30)
g2=np.random.normal(52000,5000,30)
g3=np.random.normal(40000,5000,30)
f_stat,p_value=stats.f_oneway(g1,g2,g3)
print(f"ANOVA H₀: μ₁=μ₂=μ₃ F={f_stat:.3f} p={p_value:.4e} → {'Reject at least one different' if p_value<=0.05 else 'Fail to reject all equal'}")
print(f"F=between-group variance/within-group variance")
```

Section D Kaggle:

```python
import os, pandas as pd
from scipy import stats
import numpy as np

if os.path.exists("olist_order_payments_dataset.csv") and os.path.exists("olist_customers_dataset.csv"):
    df_pay=pd.read_csv("olist_order_payments_dataset.csv", nrows=10000)
    df_cust=pd.read_csv("olist_customers_dataset.csv", nrows=10000)
    # Need join via order_id -> orders dataset
    if os.path.exists("olist_orders_dataset.csv"):
        df_orders=pd.read_csv("olist_orders_dataset.csv", nrows=10000)
        # Merge pay with orders to get customer_id
        merged=pd.merge(df_pay, df_orders[["order_id","customer_id"]], on="order_id", how="inner")
        merged=pd.merge(merged, df_cust[["customer_id","customer_state"]], on="customer_id", how="inner")
        # Two groups SP vs RJ payment_value
        sp=merged[merged["customer_state"]=="SP"]["payment_value"].dropna()
        rj=merged[merged["customer_state"]=="RJ"]["payment_value"].dropna()
        if len(sp)>10 and len(rj)>10:
            t_stat,p_two=stats.ttest_ind(sp, rj, equal_var=False)
            print(f"Two-sample SP vs RJ payment_value SP mean {sp.mean():.2f} RJ mean {rj.mean():.2f} t={t_stat:.3f} p={p_two:.4e} → {'Difference' if p_two<=0.05 else 'No difference'}")
        # ANOVA 3 states SP RJ MG
        mg=merged[merged["customer_state"]=="MG"]["payment_value"].dropna()
        if len(sp)>10 and len(rj)>10 and len(mg)>10:
            f_stat,p_anova=stats.f_oneway(sp, rj, mg)
            print(f"ANOVA SP RJ MG F={f_stat:.3f} p={p_anova:.4e} → {'At least one different' if p_anova<=0.05 else 'All equal'}")
    else:
        print("Need olist_orders_dataset.csv for join")
else:
    print("Download https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - customer_state and payment_value need join via order_id and customer_id")
```

Deliverable: Upload two_sample_anova_L12.py + images boxplot_two_sample.png and anova_boxplot.png + output showing two-sample Welch t=(x̄₁-x̄₂)/√(s₁²/n₁+s₂²/n₂), paired t=d̄/(s_d/√n) H₀: μ_d=0, ANOVA F=between/within H₀: μ₁=μ₂=μ₃.

Kaggle:
1. Primary https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - SP vs RJ two-sample, SP RJ MG ANOVA
2. Secondary https://www.kaggle.com/datasets/vivek468/superstore-dataset-final - Region vs Sales two-sample and ANOVA Region

## 7. Checklist
- Explain why compare two groups H₀: μ₁=μ₂ vs H₁: μ₁≠μ₂
- Distinguish independent different subjects vs paired same subjects before/after
- Calculate two-sample independent Welch t=(x̄₁-x̄₂)/√(s₁²/n₁+s₂²/n₂) SE difference df Welch-Satterthwaite equal_var=False recommended
- Explain Student t pooled variance equal variances assumed vs Welch unequal more robust
- Calculate paired t-test d=X₁-X₂ per pair d̄ mean differences s_d std differences t=d̄/(s_d/√n) df=n-1 one-sample t on differences more powerful if pairing meaningful
- Explain ANOVA for >2 groups why not many t-tests Type I error inflates 1-(1-α)ᵏ
- Define ANOVA H₀: μ₁=μ₂=...=μ_k all equal vs H₁ at least one different
- Define F=between-group variance/within-group variance F large groups differ F≈1 no difference F-distribution df₁=k-1 df₂=N-k
- Explain post-hoc Tukey HSD needed after ANOVA significant to find which pairs differ
- Use SciPy ttest_ind equal_var=False, ttest_rel for paired, f_oneway for ANOVA, pairwise_tukeyhsd for post-hoc

Key Takeaway: Two-sample independent Welch t=(x̄₁-x̄₂)/√(s₁²/n₁+s₂²/n₂) H₀: μ₁=μ₂. Paired t=d̄/(s_d/√n) H₀: μ_d=0 same subjects. ANOVA F=between/within H₀: μ₁=μ₂=...=μ_k all equal vs at least one different, use when >2 groups to control Type I error.

