# Lesson 14 - Simple Linear Regression & A/B Testing - Predict and Test Improvements

**Duration:** 90 min | **Level:** Absolute Beginner | **Goal:** Build prediction line and test if new version is better than old

## What You Will Learn

By the end of this lesson, you will be able to:

- Explain simple linear regression: Predict continuous y from continuous x with line ŷ = β₀ + β₁x
- Define slope β₁ = change in y per unit change in x and intercept β₀ = predicted y when x=0
- Calculate regression coefficients using least squares: Minimize Σ(y − ŷ)² sum of squared errors
- Interpret R² = proportion variance in y explained by x, R² = r² for simple regression where r Pearson correlation
- Explain residual e = y − ŷ = observed − predicted, check residuals for assumptions
- List regression assumptions: Linearity, independence, homoscedasticity (constant variance), normality of residuals (LINE)
- Explain A/B testing: Randomized experiment comparing two versions A (control) and B (treatment) to test if B better
- Define A/B testing steps: Hypothesis H₀: μ_A = μ_B vs H₁: μ_B > μ_A, random assignment, sample size, run experiment, analyze with two-sample t-test, decide
- Calculate required sample size for A/B testing using power analysis: Need effect size, α, power
- Distinguish statistical significance (p ≤ α) vs practical significance (effect size meaningful for business)
- Build regression and A/B test using SciPy linregress and ttest_ind

---

## 1. Simple Linear Regression - Predict y From x

### What is Regression?

Regression predicts continuous y (dependent variable, outcome) from continuous x (independent variable, predictor) with line.

Example: Predict payment_value y from payment_installments x. Does more installments mean higher payment_value? Or predict total sales y from quantity x?

Simple linear regression one x: ŷ = β₀ + β₁x

- ŷ predicted y (y hat)
- β₀ intercept: Predicted y when x=0. Sometimes not meaningful if x=0 not in data (e.g., 0 installments not realistic)
- β₁ slope: Change in y per unit increase in x. If β₁=50, each extra installment increases predicted payment_value by 50.

We estimate β₀, β₁ from data using least squares.

### Least Squares - Minimize Squared Errors

We have data points (x_i, y_i). For each point, residual e_i = y_i − ŷ_i = observed − predicted. We want line minimizing sum of squared residuals Σ e_i² = Σ(y_i − (β₀+β₁x_i))²

Why squared? Penalizes large errors more, math easier, corresponds to maximum likelihood if errors normal.

Solution: β₁ = Σ(x_i − x̄)(y_i − ȳ) / Σ(x_i − x̄)² = Cov(x,y)/Var(x) = r × (s_y/s_x)

β₀ = ȳ − β₁x̄ - line passes through (x̄, ȳ) mean point

Where r Pearson correlation, s_y, s_x stds.

If r=0.7 positive, slope positive.

### R² - How Good is Prediction?

R² = proportion variance in y explained by x via regression line.

For simple regression, R² = r² (Pearson correlation squared)

R² = 1 − (Σ(y − ŷ)² / Σ(y − ȳ)²) = 1 − SS_res/SS_tot

SS_res sum squared residuals (unexplained), SS_tot total sum squares Σ(y − ȳ)² (total variance)

R² = 0 to 1: 0 means x explains none of y variance (no linear relationship), 1 means perfect prediction (all points on line)

Example: r=0.7 R²=0.49 49% variance explained.

### Residuals and Assumptions - LINE

Residual e = y − ŷ observed minus predicted.

For inference (p-values, CIs for β₁), assumptions:

- **L**inearity: Relationship x and y linear (check scatterplot, residual vs fitted plot random no pattern)
- **I**ndependence: Observations independent (no time series autocorrelation)
- **N**ormality of residuals: Residuals approx normal (check Q-Q plot, histogram)
- **E**qual variance homoscedasticity: Residuals have constant variance across x (residual vs fitted plot no funnel shape, spread same)

If violated, transformation or other model.

### Visual: Regression Line and Residuals

<svg width="100%" height="200" viewBox="0 0 700 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="200" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">SIMPLE LINEAR REGRESSION - ŷ=β₀+β₁x - MINIMIZE Σ(y-ŷ)² - β₁=Σ(x-x̄)(y-ȳ)/Σ(x-x̄)²</text>
  <rect x="20" y="50" width="300" height="130" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
  <text x="170" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#1E40AF">Regression Line</text>
  <text x="35" y="90" font-family="Arial" font-size="8" fill="#1E40AF">Data points (x_i,y_i)</text>
  <text x="35" y="108" font-family="Arial" font-size="8" fill="#1E40AF">Line ŷ=β₀+β₁x minimizes Σe²</text>
  <text x="35" y="126" font-family="Arial" font-size="8" fill="#1E40AF">β₁=slope change y per x</text>
  <text x="35" y="144" font-family="Arial" font-size="8" fill="#1E40AF">β₀=intercept y when x=0</text>
  <rect x="380" y="50" width="300" height="130" rx="12" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1"/>
  <text x="530" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#065F46">Residual e=y-ŷ</text>
  <text x="395" y="90" font-family="Arial" font-size="8" fill="#065F46">e=observed-predicted vertical distance</text>
  <text x="395" y="108" font-family="Arial" font-size="8" fill="#065F46">R²=1-SS_res/SS_tot proportion variance explained</text>
  <text x="395" y="126" font-family="Arial" font-size="8" fill="#065F46">R²=r² for simple regression</text>
</svg>

### Code Simple→Advanced - Regression

**Method 1 Plain Python Manual β₀ β₁:**

```python
# Method 1: Manual simple linear regression least squares
import math

# Example: x=installments, y=payment_value
x = [1,2,3,4,5]
y = [100,150,200,250,300]  # Perfect linear y=50+50x

n=len(x)
x_bar=sum(x)/n
y_bar=sum(y)/n

print(f"x={x} x̄={x_bar}")
print(f"y={y} ȳ={y_bar}")

# β₁ = Σ(x-x̄)(y-ȳ)/Σ(x-x̄)²
numer = sum((xi - x_bar)*(yi - y_bar) for xi,yi in zip(x,y))
denom = sum((xi - x_bar)**2 for xi in x)

beta1 = numer/denom
beta0 = y_bar - beta1*x_bar

print(f"\\nNumer Σ(x-x̄)(y-ȳ)={numer}")
print(f"Denom Σ(x-x̄)²={denom}")
print(f"β₁=Numer/Denom={numer}/{denom}={beta1:.2f} slope change y per unit x")
print(f"β₀=ȳ-β₁x̄={y_bar}-{beta1}×{x_bar}={beta0:.2f} intercept y when x=0")

# Predictions ŷ=β₀+β₁x
y_pred = [beta0 + beta1*xi for xi in x]
print(f"\\nPredictions ŷ=β₀+β₁x: {y_pred}")

# Residuals e=y-ŷ
residuals = [yi - ypi for yi,ypi in zip(y,y_pred)]
print(f"Residuals e=y-ŷ: {residuals} all 0 perfect fit")

# SS_res Σe² and SS_tot Σ(y-ȳ)²
ss_res = sum(e**2 for e in residuals)
ss_tot = sum((yi - y_bar)**2 for yi in y)
r2 = 1 - ss_res/ss_tot if ss_tot!=0 else 0

print(f"SS_res=Σe²={ss_res} SS_tot=Σ(y-ȳ)²={ss_tot} R²=1-SS_res/SS_tot={r2:.3f}=100% variance explained perfect")

# Real data with noise
x2=[1,2,3,4,5]
y2=[110,145,205,245,310]  # y≈50+50x + noise
x2_bar=sum(x2)/len(x2)
y2_bar=sum(y2)/len(y2)
numer2=sum((xi-x2_bar)*(yi-y2_bar) for xi,yi in zip(x2,y2))
denom2=sum((xi-x2_bar)**2 for xi in x2)
beta1_2=numer2/denom2
beta0_2=y2_bar-beta1_2*x2_bar
y2_pred=[beta0_2+beta1_2*xi for xi in x2]
res2=[yi-ypi for yi,ypi in zip(y2,y2_pred)]
ss_res2=sum(e**2 for e in res2)
ss_tot2=sum((yi-y2_bar)**2 for yi in y2)
r2_2=1-ss_res2/ss_tot2
print(f"\\nWith noise x={x2} y={y2}")
print(f"β₁={beta1_2:.2f} β₀={beta0_2:.2f} R²={r2_2:.3f} {r2_2*100:.1f}% variance explained less than 100% due to noise")
```

**Method 2 SciPy linregress:**

```python
from scipy import stats
import numpy as np

np.random.seed(0)

# Simulate data with noise
x = np.array([1,2,3,4,5,6,7,8,9,10])
y = 50 + 50*x + np.random.normal(0,20,size=len(x))  # y=50+50x + noise

# SciPy linregress
slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)

print(f"SciPy linregress")
print(f"x={x}")
print(f"y={y}")
print(f"Slope β₁={slope:.2f} Intercept β₀={intercept:.2f}")
print(f"Pearson r={r_value:.3f} R²=r²={r_value**2:.3f} {r_value**2*100:.1f}% variance explained")
print(f"p-value for H₀: β₁=0 vs H₁: β₁≠0 p={p_value:.4e} → {'Significant slope' if p_value<=0.05 else 'No significant slope'}")
print(f"Std err of slope={std_err:.2f}")

# Predictions
y_pred = intercept + slope*x
residuals = y - y_pred
print(f"\\nResiduals e=y-ŷ mean {np.mean(residuals):.2f}≈0")

# Plot
import matplotlib.pyplot as plt

plt.figure()
plt.scatter(x, y, color="blue", label="Data")
plt.plot(x, y_pred, color="red", label=f"Regression ŷ={intercept:.1f}+{slope:.1f}x R²={r_value**2:.2f}")
plt.xlabel("x installments")
plt.ylabel("y payment_value")
plt.title("Simple Linear Regression")
plt.legend()
plt.savefig("regression_simple.png")
print("Saved regression_simple.png - blue points data red line regression")

# Residual vs fitted plot check homoscedasticity
plt.figure()
plt.scatter(y_pred, residuals, color="green")
plt.axhline(0, color="black", linestyle="--")
plt.xlabel("Fitted ŷ")
plt.ylabel("Residual e=y-ŷ")
plt.title("Residual vs Fitted - should be random no pattern, constant variance")
plt.savefig("residual_vs_fitted.png")
print("Saved residual_vs_fitted.png - check LINE assumptions, random cloud good, funnel shape heteroscedasticity bad")
```

**Method 3 Pandas and Statsmodels:**

```python
import pandas as pd
import numpy as np
from scipy import stats

np.random.seed(0)

df = pd.DataFrame({
    "payment_installments": np.random.randint(1,10,100),
    "payment_value": np.random.normal(200,50,100)
})
# Add correlation
df["payment_value"] = 100 + 20*df["payment_installments"] + np.random.normal(0,30,100)

slope, intercept, r_value, p_value, std_err = stats.linregress(df["payment_installments"], df["payment_value"])

print(f"DataFrame regression payment_value ~ installments")
print(f"β₁={slope:.2f} each extra installment increases payment_value by {slope:.2f}")
print(f"β₀={intercept:.2f} predicted value when 0 installments")
print(f"R²={r_value**2:.3f} p={p_value:.4e}")

# Statsmodels for more detailed output
import statsmodels.api as sm

X = sm.add_constant(df["payment_installments"])  # Adds intercept
model = sm.OLS(df["payment_value"], X).fit()
print(f"\\nStatsmodels summary:")
print(model.summary())
```

---

## 2. A/B Testing - Randomized Experiment to Test Improvement

### What is A/B Testing?

A/B testing is randomized experiment comparing two versions:

- **A Control:** Current version, status quo (e.g., old checkout page, old price, old product recommendation)
- **B Treatment:** New version you think better (e.g., new checkout page, new price, new recommendation)

Randomly assign users/orders to A or B, measure outcome metric (e.g., conversion rate, mean total, revenue), test if B significantly better than A.

Example: Test if new product page increases mean total from 50000 to 55000.

### Steps A/B Testing

1. **Hypothesis:** H₀: μ_A = μ_B no difference vs H₁: μ_B > μ_A (one-tailed B better) or H₁: μ_B ≠ μ_A two-tailed
2. **Random assignment:** Randomly assign subjects to A or B to avoid bias, ensure independence
3. **Sample size:** Calculate required n for desired power 80% α 0.05 effect size you want to detect. Larger n needed for smaller effect.
4. **Run experiment:** Collect data for both groups
5. **Analyze:** Two-sample t-test (continuous outcome mean total) or proportion z-test (binary outcome conversion) to get p-value
6. **Decide:** If p ≤ α reject H₀ B better (or different) statistically significant. Check practical significance effect size meaningful for business? Statistical significant but tiny effect may not be worth implementing.

### Sample Size and Power Analysis

Power = 1 − β probability detect real effect. Want power 0.8 (80%).

Required n depends on:
- Effect size d = (μ_B − μ_A)/σ pooled std (Cohen's d) - how big difference relative to variability
- α significance level 0.05
- Power 0.8
- One-tailed vs two-tailed

Smaller effect size needs larger n.

Use statsmodels or simple formula: n ≈ 16/ d² for two-sample t-test α=0.05 power=0.8 two-tailed (approx).

Example: Want detect increase from 50000 to 55000 σ=10000 effect size d=(55000-50000)/10000=0.5 medium effect. n≈16/0.25=64 per group total 128.

### Statistical vs Practical Significance

- **Statistical significance:** p ≤ α difference unlikely due to chance, may be tiny effect but large n makes p small.
- **Practical significance:** Effect size large enough to matter for business, e.g., increase revenue $1000 per order meaningful, increase $1 statistically significant but not practical.

Need both: Statistically significant and practically meaningful.

### Visual: A/B Testing

<svg width="100%" height="200" viewBox="0 0 700 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="200" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">A/B TESTING - RANDOMIZED EXPERIMENT - H₀: μ_A=μ_B vs H₁: μ_B>μ_A</text>
  <rect x="20" y="50" width="150" height="130" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
  <text x="95" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#1E40AF">A Control Old</text>
  <text x="35" y="90" font-family="Arial" font-size="8" fill="#1E40AF">Current version</text>
  <text x="35" y="108" font-family="Arial" font-size="8" fill="#1E40AF">n_A=64 mean 50000</text>
  <rect x="190" y="50" width="150" height="130" rx="12" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1"/>
  <text x="265" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#065F46">B Treatment New</text>
  <text x="205" y="90" font-family="Arial" font-size="8" fill="#065F46">New version</text>
  <text x="205" y="108" font-family="Arial" font-size="8" fill="#065F46">n_B=64 mean 55000</text>
  <rect x="360" y="50" width="320" height="130" rx="12" fill="#FFFBEB" stroke="#FCD34D" stroke-width="1"/>
  <text x="520" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#92400E">Analysis</text>
  <text x="375" y="90" font-family="Arial" font-size="8" fill="#92400E">Random assignment avoids bias</text>
  <text x="375" y="108" font-family="Arial" font-size="8" fill="#92400E">Two-sample t-test H₀: μ_A=μ_B</text>
  <text x="375" y="126" font-family="Arial" font-size="8" fill="#92400E">t=(x̄_B-x̄_A)/√(s_A²/n_A+s_B²/n_B)</text>
  <text x="375" y="144" font-family="Arial" font-size="8" fill="#92400E">p≤0.05 reject H₀ B better</text>
  <text x="375" y="162" font-family="Arial" font-size="8" fill="#92400E">Check practical significance effect size</text>
</svg>

### Code Simple→Advanced - A/B Testing

**Method 1 Plain Python Manual Two-Sample t-test for A/B:**

```python
# Method 1: A/B testing manual two-sample t-test
import math
from scipy import stats
import numpy as np

np.random.seed(0)

# Simulate A/B data
# A Control mean 50000 σ 10000 n=64
# B Treatment mean 55000 σ 10000 n=64 - true increase 5000

n_A=64
n_B=64
mean_A=50000
mean_B=55000
sigma=10000

group_A = np.random.normal(mean_A, sigma, size=n_A)
group_B = np.random.normal(mean_B, sigma, size=n_B)

x_A_bar = np.mean(group_A)
x_B_bar = np.mean(group_B)
s_A = np.std(group_A, ddof=1)
s_B = np.std(group_B, ddof=1)

print(f"A Control n_A={n_A} x̄_A={x_A_bar:.0f} s_A={s_A:.0f}")
print(f"B Treatment n_B={n_B} x̄_B={x_B_bar:.0f} s_B={s_B:.0f}")
print(f"Difference x̄_B-x̄_A={x_B_bar-x_A_bar:.0f} true difference {mean_B-mean_A}")

# Welch t-test H₀: μ_A=μ_B vs H₁: μ_B>μ_A one-tailed right
se_diff = math.sqrt(s_A**2/n_A + s_B**2/n_B)
t_stat = (x_B_bar - x_A_bar) / se_diff

# df Welch
numer = (s_A**2/n_A + s_B**2/n_B)**2
denom = (s_A**2/n_A)**2/(n_A-1) + (s_B**2/n_B)**2/(n_B-1)
df_welch = numer/denom

p_two = 2*(1-stats.t.cdf(abs(t_stat), df=df_welch))
p_one_right = 1-stats.t.cdf(t_stat, df=df_welch)

print(f"\\nWelch t-test H₀: μ_A=μ_B vs H₁: μ_B>μ_A")
print(f"SE difference √(s_A²/n_A+s_B²/n_B)={se_diff:.1f}")
print(f"t=(x̄_B-x̄_A)/SE={t_stat:.3f} df≈{df_welch:.1f}")
print(f"Two-tailed p={p_two:.4f} One-tailed right p={p_one_right:.4f}")
print(f"α=0.05 One-tailed p={p_one_right:.4f} → {'Reject H₀ B better than A statistically significant' if p_one_right<=0.05 else 'Fail to reject no significant difference'}")

# Effect size Cohen's d = (x̄_B-x̄_A)/pooled std
pooled_std = math.sqrt((s_A**2 + s_B**2)/2)
cohen_d = (x_B_bar - x_A_bar)/pooled_std
print(f"\\nEffect size Cohen's d=(x̄_B-x̄_A)/pooled_std={cohen_d:.2f} - small 0.2 medium 0.5 large 0.8")
print(f"Practical significance: Increase {x_B_bar-x_A_bar:.0f} mean {x_A_bar:.0f} → {x_B_bar:.0f} = {(x_B_bar-x_A_bar)/x_A_bar*100:.1f}% increase {'meaningful' if cohen_d>=0.5 else 'small'}")

# Power analysis - required sample size
# Approx formula n≈16/d² per group for α=0.05 power=0.8 two-tailed
d_desired = (mean_B-mean_A)/sigma  # True effect size
n_approx = 16/(d_desired**2)
print(f"\\nPower analysis: Desired effect {mean_B-mean_A} σ={sigma} d={d_desired} → n≈16/d²={n_approx:.0f} per group for 80% power")
print(f"We used n={n_A} per group {'enough' if n_A>=n_approx else 'need larger for desired power'}")

# Using statsmodels for more accurate power
from statsmodels.stats.power import TTestIndPower
power_analysis = TTestIndPower()
n_required = power_analysis.solve_power(effect_size=d_desired, alpha=0.05, power=0.8, alternative='larger')
print(f"Statsmodels power analysis more accurate n required per group for one-tailed larger alternative: {n_required:.1f} vs approx {n_approx:.0f}")
```

**Method 2 SciPy ttest_ind for A/B:**

```python
from scipy import stats
import numpy as np

np.random.seed(0)

group_A = np.random.normal(50000,10000,size=64)
group_B = np.random.normal(55000,10000,size=64)

# Two-sample t-test Welch
t_stat, p_two = stats.ttest_ind(group_B, group_A, equal_var=False)  # B vs A, positive t means B>A

p_one_right = p_two/2 if t_stat>0 else 1-p_two/2

print(f"A/B test Welch t-test B vs A")
print(f"t={t_stat:.3f} two-tailed p={p_two:.4f} one-tailed right p={p_one_right:.4f}")
print(f"→ {'B significantly better than A' if p_one_right<=0.05 and t_stat>0 else 'No significant improvement'}")

# For binary outcome conversion rate use proportion z-test
# Example: A conversion 100/1000=10% B conversion 130/1000=13%
# Test H₀: p_A=p_B vs H₁: p_B>p_A

n_A=1000
success_A=100
n_B=1000
success_B=130

p_A=success_A/n_A
p_B=success_B/n_B
p_pool=(success_A+success_B)/(n_A+n_B)

se_pool = math.sqrt(p_pool*(1-p_pool)*(1/n_A+1/n_B))
z = (p_B - p_A)/se_pool
p_two_prop = 2*(1-stats.norm.cdf(abs(z),0,1))
p_one_right_prop = 1-stats.norm.cdf(z,0,1)

print(f"\\nA/B binary conversion")
print(f"A {success_A}/{n_A}={p_A*100:.1f}% B {success_B}/{n_B}={p_B*100:.1f}%")
print(f"z=(p_B-p_A)/SE_pool={z:.3f} p_two={p_two_prop:.4f} p_one_right={p_one_right_prop:.4f} → {'B better conversion' if p_one_right_prop<=0.05 else 'No significant'}")
```

---

## 3. Real Store Example

```python
import pandas as pd
import numpy as np
from scipy import stats

np.random.seed(0)

# Simulate: Test new recommendation algorithm B vs old A on total sales
# A Old algorithm mean 40000
# B New algorithm mean 45000 true improvement 5000

old_algo = np.random.normal(40000,8000,50)
new_algo = np.random.normal(45000,8000,50)

# Regression: Predict total from quantity
# Quantity vs total positive correlation
quantity = np.random.randint(1,5,100)
total = 10000 + 10000*quantity + np.random.normal(0,5000,100)

slope, intercept, r_value, p_value, std_err = stats.linregress(quantity, total)
print(f"Regression total ~ quantity")
print(f"β₁={slope:.0f} each extra item increases total by {slope:.0f}")
print(f"β₀={intercept:.0f} R²={r_value**2:.3f} p={p_value:.4e} → {'Significant' if p_value<=0.05 else 'Not significant'}")

# A/B test
t_stat, p_two = stats.ttest_ind(new_algo, old_algo, equal_var=False)
p_one_right = p_two/2 if t_stat>0 else 1-p_two/2

print(f"\\nA/B test old vs new algorithm")
print(f"Old mean {np.mean(old_algo):.0f} New mean {np.mean(new_algo):.0f} t={t_stat:.3f} one-tailed p={p_one_right:.4f} → {'New better' if p_one_right<=0.05 else 'No significant improvement'}")
print(f"Effect size practical: Increase {(np.mean(new_algo)-np.mean(old_algo))/np.mean(old_algo)*100:.1f}%")
```

---

## 4. Hands-On Assignment

Dataset: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - payment_value, payment_installments, customer_state

Create regression_ab_testing_L14.py:

Section A Regression:

```python
from scipy import stats
import numpy as np
np.random.seed(0)
x=np.array([1,2,3,4,5,6,7,8,9,10])
y=50+50*x+np.random.normal(0,20,size=len(x))
slope,intercept,r_value,p_value,std_err=stats.linregress(x,y)
print(f"Regression ŷ=β₀+β₁x β₀={intercept:.1f} β₁={slope:.1f} R²={r_value**2:.3f} r={r_value:.3f} p={p_value:.4e} → slope {'significant' if p_value<=0.05 else 'not significant'}")
print(f"Interpretation: Each unit increase in x increases y by {slope:.1f}")
```

Section B Residuals LINE assumptions:

```python
import matplotlib.pyplot as plt
from scipy import stats
import numpy as np
np.random.seed(0)
x=np.array([1,2,3,4,5,6,7,8,9,10])
y=50+50*x+np.random.normal(0,20,size=len(x))
slope,intercept,r_value,p_value,std_err=stats.linregress(x,y)
y_pred=intercept+slope*x
residuals=y-y_pred
plt.figure()
plt.scatter(y_pred, residuals)
plt.axhline(0, color="black", linestyle="--")
plt.xlabel("Fitted ŷ")
plt.ylabel("Residual e=y-ŷ")
plt.title("Residual vs Fitted - random cloud good")
plt.savefig("residual_vs_fitted_L14.png")
print("Saved residual_vs_fitted_L14.png check LINE - linearity random no pattern, homoscedasticity constant spread, normality Q-Q")
```

Section C A/B testing sample size and analysis:

```python
from scipy import stats
import numpy as np
import math
np.random.seed(0)
# Effect size d=0.5 medium need n≈64 per group
n=64
group_A=np.random.normal(50000,10000,size=n)
group_B=np.random.normal(55000,10000,size=n)  # Increase 5000
t_stat,p_two=stats.ttest_ind(group_B, group_A, equal_var=False)
p_one_right=p_two/2 if t_stat>0 else 1-p_two/2
print(f"A/B test n={n} per group A mean {np.mean(group_A):.0f} B mean {np.mean(group_B):.0f} t={t_stat:.3f} one-tailed right p={p_one_right:.4f} → {'B better' if p_one_right<=0.05 else 'No significant'}")
# Power
from statsmodels.stats.power import TTestIndPower
power_analysis=TTestIndPower()
n_req=power_analysis.solve_power(effect_size=0.5, alpha=0.05, power=0.8, alternative='larger')
print(f"Power analysis effect d=0.5 α=0.05 power=0.8 one-tailed n required per group {n_req:.1f} we used {n}")
```

Section D Kaggle:

```python
import os, pandas as pd
from scipy import stats
import numpy as np

if os.path.exists("olist_order_payments_dataset.csv"):
    df=pd.read_csv("olist_order_payments_dataset.csv", nrows=10000)
    # Regression payment_value ~ payment_installments
    vals=df[["payment_value","payment_installments"]].dropna()
    if len(vals)>20:
        slope,intercept,r_value,p_value,std_err=stats.linregress(vals["payment_installments"], vals["payment_value"])
        print(f"Regression payment_value ~ installments β₁={slope:.2f} each extra installment increases value by {slope:.2f} β₀={intercept:.2f} R²={r_value**2:.3f} p={p_value:.4e}")
    
    # A/B test simulate: Split data randomly into A and B and test if mean payment_value differs
    # In real A/B test A and B are different versions, here we just test random split should not differ
    np.random.seed(0)
    vals_shuffled=vals.sample(frac=1).reset_index(drop=True)
    half=len(vals_shuffled)//2
    group_A=vals_shuffled.iloc[:half]["payment_value"]
    group_B=vals_shuffled.iloc[half:]["payment_value"]
    t_stat,p_two=stats.ttest_ind(group_A, group_B, equal_var=False)
    print(f"\\nA/B random split test (should not differ) A mean {group_A.mean():.2f} B mean {group_B.mean():.2f} t={t_stat:.3f} p={p_two:.4f} → {'Difference (false positive)' if p_two<=0.05 else 'No difference (correct)'}")
    
    # Real A/B example: customer_state SP vs RJ mean payment_value
    if os.path.exists("olist_customers_dataset.csv") and os.path.exists("olist_orders_dataset.csv"):
        df_cust=pd.read_csv("olist_customers_dataset.csv", nrows=10000)
        df_orders=pd.read_csv("olist_orders_dataset.csv", nrows=10000)
        merged=pd.merge(df, df_orders[["order_id","customer_id"]], on="order_id", how="inner")
        merged=pd.merge(merged, df_cust[["customer_id","customer_state"]], on="customer_id", how="inner")
        sp=merged[merged["customer_state"]=="SP"]["payment_value"].dropna()
        rj=merged[merged["customer_state"]=="RJ"]["payment_value"].dropna()
        if len(sp)>20 and len(rj)>20:
            t_stat,p_two=stats.ttest_ind(sp, rj, equal_var=False)
            print(f"\\nSP vs RJ payment_value SP mean {sp.mean():.2f} RJ mean {rj.mean():.2f} t={t_stat:.3f} p={p_two:.4e} → {'Difference' if p_two<=0.05 else 'No difference'} - not true A/B test but two-sample comparison")
else:
    print("Download https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce")
```

Deliverable: Upload regression_ab_testing_L14.py + images regression_simple.png, residual_vs_fitted.png, residual_vs_fitted_L14.png + output showing regression ŷ=β₀+β₁x β₁=Σ(x-x̄)(y-ȳ)/Σ(x-x̄)² β₀=ȳ-β₁x̄ R²=1-SS_res/SS_tot =r², residuals e=y-ŷ LINE assumptions, A/B testing H₀: μ_A=μ_B vs H₁: μ_B>μ_A random assignment two-sample t-test t=(x̄_B-x̄_A)/√(s_A²/n_A+s_B²/n_B) p≤0.05 reject B better, sample size n≈16/d² power 0.8 α 0.05 effect size d=(μ_B-μ_A)/σ, statistical vs practical significance.

Kaggle:
1. Primary https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - payment_value ~ installments regression and SP vs RJ A/B-like comparison
2. Secondary https://www.kaggle.com/datasets/vivek468/superstore-dataset-final - Sales ~ Quantity regression and Region A/B

## 5. Checklist
- Explain regression ŷ=β₀+β₁x β₁ change y per x β₀ y when x=0 least squares minimize Σ(y-ŷ)² β₁=Σ(x-x̄)(y-ȳ)/Σ(x-x̄)²= Cov/Var=r×s_y/s_x β₀=ȳ-β₁x̄ passes through (x̄,ȳ)
- Explain R²=1-SS_res/SS_tot proportion variance explained R²=r² simple regression 0 to 1
- Define residual e=y-ŷ observed-predicted LINE assumptions linearity independence normality equal variance homoscedasticity residual vs fitted plot Q-Q
- Explain A/B testing control A vs treatment B randomized experiment steps hypothesis random assignment sample size run analyze two-sample t-test decide
- Define sample size power analysis effect size d=(μ_B-μ_A)/σ n≈16/d² for α=0.05 power=0.8 two-tailed need larger n for smaller effect statsmodels TTestIndPower
- Distinguish statistical significance p≤α unlikely chance vs practical significance effect size meaningful business need both
- Use SciPy linregress for regression and ttest_ind for A/B

Key Takeaway: Regression ŷ=β₀+β₁x minimize Σ(y-ŷ)² β₁=Σ(x-x̄)(y-ȳ)/Σ(x-x̄)² β₀=ȳ-β₁x̄ R² proportion variance explained r². Residual e=y-ŷ LINE assumptions. A/B testing randomized experiment H₀: μ_A=μ_B vs H₁: μ_B>μ_A random assignment two-sample t-test p≤α reject B better check practical significance effect size. Sample size n≈16/d² power 0.8.