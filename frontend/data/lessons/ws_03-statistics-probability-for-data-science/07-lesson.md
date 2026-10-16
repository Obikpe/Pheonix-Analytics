# Lesson 07 - Common Distributions - Binomial, Poisson, Normal, Exponential - Which Shape Fits Your Data?

**Duration:** 90 min | **Level:** Absolute Beginner | **Goal:** Choose correct distribution to model sales and use it for predictions

## What You Will Learn

random variables - PMF PDF. Now specific famous distributions that appear everywhere in sales.

- **Bernoulli/Binomial:** Count successes in n trials - e.g., number of high-value orders out of 100 orders, each order high with prob p
- **Poisson:** Count events in time/area - e.g., number of orders per day, orders arrive randomly at rate λ
- **Normal:** Bell curve - e.g., order total amount if many small factors add, symmetric mean≈median
- **Exponential:** Time between events - e.g., time between orders, memoryless

You will learn when to use which, formulas, expected values, and how to check if data fits.

We build from zero, visuals, simple→advanced.

---

## 1. Bernoulli and Binomial - Count Successes in n Trials

### Bernoulli Recap

Bernoulli X = 1 success prob p, 0 failure prob 1-p. One trial.

Example: One order - high value? X=1 high with p=0.3, X=0 not high with 0.7. E=p=0.3 Var=p(1-p)=0.21

### Binomial - Sum of n Bernoulli

Binomial Y = number of successes in n independent Bernoulli trials each prob p.

Example: You have n=100 orders, each high with p=0.3 independently. Y = number of high orders among 100. Possible 0 to 100.

**PMF Binomial:** P(Y=k) = C(n,k) * p^k * (1-p)^(n-k)

Where C(n,k)= n!/(k!(n-k)!) combinations - ways to choose which k trials are successes. p^k prob k successes, (1-p)^(n-k) prob n-k failures.

**When to use Binomial?**
- Fixed n trials
- Each trial independent same p
- Count successes
- Two outcomes success/failure

Examples: Number of returned orders out of 50, number of NG orders out of 100, number of Accessories out of 30 orders.

**Expected and Variance:**
- E[Y]= n*p - expected successes n times p
- Var= n*p*(1-p) - variance n times Bernoulli variance

### Visual: Binomial PMF

<svg width="100%" height="240" viewBox="0 0 700 240" xmlns="http://www.w3.org/2000/svg">
  <!-- Background Card -->
  <rect x="0" y="0" width="700" height="240" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <!-- Title -->
  <text x="350" y="26" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#111827">BINOMIAL - COUNT SUCCESSES IN n TRIALS - P(Y=k) = C(n,k)p^k(1-p)^(n-k)</text>
  <!-- Column 1: Symmetric-ish -->
  <g transform="translate(20, 42)">
    <rect width="210" height="182" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
    <text x="105" y="24" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#1E40AF">n = 10, p = 0.3 (Symmetric-ish)</text>
    <text x="14" y="46" font-family="Arial" font-size="8" fill="#1E40AF"><tspan font-weight="bold">E</tspan> = 3, <tspan font-weight="bold">Var</tspan> = 2.1</text>
    <text x="14" y="66" font-family="Arial" font-size="8" fill="#1E40AF">k = 0: █ (low)</text>
    <text x="14" y="86" font-family="Arial" font-size="8" fill="#1E40AF">k = 3: █████ (peak near E = 3)</text>
    <text x="14" y="106" font-family="Arial" font-size="8" fill="#1E40AF">k = 10: █ (low)</text>
    <line x1="14" y1="125" x2="196" y2="125" stroke="#93C5FD" stroke-width="0.75" />
    <text x="14" y="144" font-family="Arial" font-size="8" fill="#1E40AF">Balanced spread around</text>
    <text x="14" y="158" font-family="Arial" font-size="8" fill="#1E40AF">the expected value.</text>
  </g>
  <!-- Column 2: Right-skewed -->
  <g transform="translate(245, 42)">
    <rect width="210" height="182" rx="12" fill="#FEF2F2" stroke="#FCA5A5" stroke-width="1"/>
    <text x="105" y="24" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#7F1D1D">n = 10, p = 0.1 (Right-skewed)</text>
    <text x="14" y="46" font-family="Arial" font-size="8" fill="#7F1D1D"><tspan font-weight="bold">E</tspan> = 1, <tspan font-weight="bold">Var</tspan> = 0.9</text>
    <text x="14" y="66" font-family="Arial" font-size="8" fill="#7F1D1D">p small → many 0, 1 successes</text>
    <text x="14" y="86" font-family="Arial" font-size="8" fill="#7F1D1D">Tail stretches to the right</text>
    <text x="14" y="106" font-family="Arial" font-size="8" fill="#7F1D1D">with very few high k values.</text>
    <line x1="14" y1="125" x2="196" y2="125" stroke="#FCA5A5" stroke-width="0.75" />
    <text x="14" y="144" font-family="Arial" font-size="8" fill="#7F1D1D">Asymmetric distribution</text>
    <text x="14" y="158" font-family="Arial" font-size="8" fill="#7F1D1D">clumped near zero.</text>
  </g>
  <!-- Column 3: Approx Normal -->
  <g transform="translate(470, 42)">
    <rect width="210" height="182" rx="12" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1"/>
    <text x="105" y="24" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#065F46">n = 100, p = 0.3 (Approx Normal)</text>
    <text x="14" y="46" font-family="Arial" font-size="8" fill="#065F46"><tspan font-weight="bold">E</tspan> = 30, <tspan font-weight="bold">Var</tspan> = 21, <tspan font-weight="bold">Std</tspan> = 4.58</text>
    <text x="14" y="66" font-family="Arial" font-size="8" fill="#065F46">Large n creates bell shape</text>
    <text x="14" y="86" font-family="Arial" font-size="8" fill="#065F46">Normal approximation applies</text>
    <text x="14" y="106" font-family="Arial" font-size="8" fill="#065F46">due to Central Limit Theorem.</text>
    <line x1="14" y1="125" x2="196" y2="125" stroke="#86EFAC" stroke-width="0.75" />
    <text x="14" y="144" font-family="Arial" font-size="8" fill="#065F46">Simplifies probability</text>
    <text x="14" y="158" font-family="Arial" font-size="8" fill="#065F46">calculations for large trials.</text>
  </g>
</svg>


### Code Simple→Advanced - Binomial

Step 1 Plain Python - Calculate PMF C(n,k) p^k (1-p)^(n-k):

```python
# Step 1: Manual Binomial PMF
import math

def comb(n,k):
    return math.factorial(n)//(math.factorial(k)*math.factorial(n-k))

n=10  # 10 orders
p=0.3  # Prob high per order

# P(Y=3) = C(10,3) * 0.3^3 * 0.7^7
k=3
c = comb(n,k)
prob = c * (p**k) * ((1-p)**(n-k))
print(f"Binomial n={n} p={p} P(Y={k})=C({n},{k})*p^{k}*(1-p)^{n-k}= {c}*{p}^{k}*{1-p}^{n-k} = {prob:.4f}")

# All k 0 to n
print(f"\nPMF for n={n} p={p}:")
for k in range(n+1):
    c = comb(n,k)
    prob = c * (p**k) * ((1-p)**(n-k))
    print(f"P(Y={k})={prob:.4f} {'*' * int(prob*50)}")

# Expected and Var
E = n * p
Var = n * p * (1-p)
print(f"\nE[Y]=n*p={n}*{p}={E} expected {E} high orders out of {n}")
print(f"Var=n*p*(1-p)={n}*{p}*{1-p}={Var:.2f} Std={Var**0.5:.2f}")
```

Step 2 SciPy:

```python
# Step 2: SciPy - one line PMF CDF
from scipy import stats

n=10
p=0.3

# PMF
k=3
pmf = stats.binom.pmf(k, n, p)
print(f"SciPy binom pmf P(Y={k}) n={n} p={p} = {pmf:.4f} matches manual")

# CDF P(Y≤k)
cdf = stats.binom.cdf(k, n, p)
print(f"P(Y≤{k}) = CDF = {cdf:.4f} = sum PMF 0 to {k}")

# P(Y>k) =1-CDF
print(f"P(Y>{k})=1-CDF={1-cdf:.4f}")

# P(a≤Y≤b)=CDF(b)-CDF(a-1) discrete inclusive
a=2
b=4
p_interval = stats.binom.cdf(b,n,p) - stats.binom.cdf(a-1,n,p)
print(f"P({a}≤Y≤{b})=CDF({b})-CDF({a-1})={p_interval:.4f}")

# Simulate
import numpy as np
samples = stats.binom.rvs(n, p, size=10000)  # rvs = random variates samples
print(f"\nSimulate {len(samples)} samples mean {np.mean(samples):.2f} ≈ E={n*p} var {np.var(samples, ddof=0):.2f} ≈ Var={n*p*(1-p):.2f}")
```

Step 3 Pandas real data - estimate p:

```python
import pandas as pd

# Estimate p from data - proportion high
orders = [
    {"high": True},
    {"high": False},
    {"high": True},
    {"high": False},
    {"high": False},
]
df = pd.DataFrame(orders)
p_est = df["high"].mean()  # Proportion high = estimate of p
print(f"From data p_est = proportion high = {p_est:.2f}")

# If you have 100 future orders, expected high = n*p_est = 100*{p_est:.2f}={100*p_est:.0f}
n_future=100
print(f"Future {n_future} orders expected high {n_future*p_est:.0f} var {n_future*p_est*(1-p_est):.1f}")

# Check if Binomial fits: each order independent same p? Need to check data not have clusters
```

---

## 2. Poisson - Count Events in Time/Area with Rate λ

### What is Poisson?

Poisson X = number of events happening in fixed interval (time, area) when events happen randomly at constant average rate λ.

Example: Number of orders per day in store - orders arrive randomly at rate λ=20 per day. X can be 0,1,2,... No upper bound theoretically but prob of huge numbers tiny.

**When to use Poisson?**
- Count events in interval
- Events happen independently at constant average rate
- No fixed n like Binomial, but average rate λ
- Rate λ = average count per interval

Examples: Orders per day, customers per hour, errors per page, returns per week.

**PMF Poisson:** P(X=k)= λ^k * e^(-λ) / k!

e=2.718... natural constant.

**Expected and Variance:**
- E= λ
- Var= λ - mean equals variance! Special property.

For large λ, Poisson approx Normal with mean λ var λ.

**Relation Binomial→Poisson:** If n large, p small, λ=n*p moderate, Binomial ≈ Poisson(λ). Poisson is limit of Binomial when n→∞ p→0 λ=n p fixed.

### Visual: Poisson

<svg width="100%" height="180" viewBox="0 0 700 180" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="180" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">POISSON - COUNT EVENTS IN INTERVAL RATE λ - P(X=k)=λ^k e^-λ/k! - E=Var=λ</text>
  <rect x="20" y="50" width="200" height="110" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
  <text x="120" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#1E40AF">λ=2 Small Rate</text>
  <text x="35" y="90" font-family="Arial" font-size="8" fill="#1E40AF">Mean 2 right-skewed</text>
  <text x="35" y="108" font-family="Arial" font-size="8" fill="#1E40AF">Many 0,1,2 few high</text>
  <rect x="250" y="50" width="200" height="110" rx="12" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1"/>
  <text x="350" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#065F46">λ=10 Moderate</text>
  <text x="265" y="90" font-family="Arial" font-size="8" fill="#065F46">Mean 10 more symmetric</text>
  <rect x="480" y="50" width="200" height="110" rx="12" fill="#FFFBEB" stroke="#FCD34D" stroke-width="1"/>
  <text x="580" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#92400E">λ=20 Large Approx Normal</text>
  <text x="495" y="90" font-family="Arial" font-size="8" fill="#92400E">Bell shape mean=var=20</text>
</svg>

### Code - Poisson

Step 1 Manual:

```python
import math

# Poisson PMF λ^k e^-λ / k!
lam=5  # Average 5 orders per day
k=3
prob = (lam**k) * math.exp(-lam) / math.factorial(k)
print(f"Poisson λ={lam} P(X={k})=λ^k e^-λ/k! = {lam}^{k} * e^-{lam} / {k}! = {prob:.4f}")

print(f"\nPMF λ={lam}:")
for k in range(10):
    prob = (lam**k) * math.exp(-lam) / math.factorial(k)
    print(f"P(X={k})={prob:.4f}")

print(f"\nE=Var=λ={lam}")
```

Step 2 SciPy:

```python
from scipy import stats

lam=5
k=3
pmf = stats.poisson.pmf(k, lam)
print(f"SciPy Poisson pmf P(X={k}) λ={lam} = {pmf:.4f}")

cdf = stats.poisson.cdf(k, lam)
print(f"P(X≤{k}) CDF = {cdf:.4f}")

# P(X>10) =1-CDF(10)
print(f"P(X>10)=1-CDF(10)={1-stats.poisson.cdf(10,lam):.4f}")

# Simulate
import numpy as np
samples = stats.poisson.rvs(lam, size=10000)
print(f"\nSimulate mean {np.mean(samples):.2f} ≈ λ={lam} var {np.var(samples, ddof=0):.2f} ≈ λ={lam}")
```

Step 3 From data estimate λ = mean count:

```python
import pandas as pd

# Daily orders count for 10 days
daily_counts = [18,22,19,20,21,19,20,23,18,20]  # Orders per day
lam_est = sum(daily_counts)/len(daily_counts)
print(f"Daily counts {daily_counts} λ_est = mean = {lam_est:.2f} orders per day")

# If λ=20, P(X=25) = ?
from scipy import stats
print(f"P(X=25) when λ={lam_est:.1f} = {stats.poisson.pmf(25, lam_est):.4f}")

# Poisson assumes events independent constant rate - check if daily counts stable no trend
```

---

## 3. Normal Distribution - Bell Curve - Most Famous Continuous

### What is Normal?

Normal X ~ N(μ, σ²) - bell curve symmetric around mean μ, spread σ. Most data many small factors add - central limit theorem says sum of many independent factors approx Normal.

**When to use Normal?**
- Continuous data symmetric around mean
- Many small independent factors additive
- Order total amount if many items, each item price random additive
- Errors, measurements

Not good for skewed sales with few huge orders - right-skewed not Normal, use log Normal or transform.

**PDF Normal:** f(x)= 1/(σ√(2π)) * e^(-(x-μ)²/(2σ²))

Don't memorize formula, understand shape: peak at μ, width σ.

**68-95-99.7 Rule:**
- 68% within μ±1σ
- 95% within μ±2σ
- 99.7% within μ±3σ

**Standard Normal:** Z = (X-μ)/σ ~ N(0,1) mean 0 std 1. Convert any Normal to standard Normal to use tables.

Z-score = how many stds away from mean. Z=1 means 1 std above mean.

**CDF Normal:** No closed formula, use SciPy.

### Visual: Normal

<svg width="100%" height="200" viewBox="0 0 700 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="200" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">NORMAL N(μ,σ²) BELL SYMMETRIC - 68-95-99.7 RULE - Z=(X-μ)/σ</text>
  <rect x="20" y="50" width="660" height="130" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
  <path d="M 50 150 Q 200 150 250 110 Q 300 50 350 40 Q 400 50 450 110 Q 500 150 650 150" fill="#BFDBFE" stroke="#2563EB" stroke-width="2" opacity="0.6"/>
  <line x1="350" y1="40" x2="350" y2="150" stroke="#2563EB" stroke-width="1" stroke-dasharray="5,5"/>
  <text x="350" y="170" text-anchor="middle" font-family="Arial" font-size="8" font-weight="800" fill="#1E40AF">μ Mean</text>
  <rect x="250" y="90" width="200" height="60" fill="#DBEAFE" opacity="0.7"/>
  <text x="350" y="100" text-anchor="middle" font-family="Arial" font-size="8" fill="#1E40AF">68% within μ±1σ</text>
  <text x="350" y="115" text-anchor="middle" font-family="Arial" font-size="8" fill="#1E40AF">95% within μ±2σ</text>
  <text x="350" y="130" text-anchor="middle" font-family="Arial" font-size="8" fill="#1E40AF">99.7% within μ±3σ</text>
  <text x="50" y="190" font-family="Arial" font-size="7" fill="#6B7280">μ-3σ μ-2σ μ-1σ μ μ+1σ μ+2σ μ+3σ  Z=(X-μ)/σ standard normal N(0,1)</text>
</svg>

### Code - Normal

Step 1 SciPy PDF CDF:

```python
from scipy import stats
import numpy as np

mu=12000
sigma=2000

# PDF f(x)
x=12000
pdf = stats.norm.pdf(x, loc=mu, scale=sigma)
print(f"Normal N({mu},{sigma}²) PDF f({x})={pdf:.6f} density not prob")

# CDF P(X≤x)
cdf = stats.norm.cdf(x, loc=mu, scale=sigma)
print(f"CDF P(X≤{x})=F({x})={cdf:.4f}=0.5 because x=mean symmetric")

# P(10000≤X≤14000)=68% within 1σ
a=10000
b=14000
p_interval = stats.norm.cdf(b, mu, sigma) - stats.norm.cdf(a, mu, sigma)
print(f"P({a}≤X≤{b})=CDF({b})-CDF({a})={p_interval:.4f}=68% within μ±1σ")

# P(X>15000)=?
p_greater = 1 - stats.norm.cdf(15000, mu, sigma)
print(f"P(X>15000)=1-CDF(15000)={p_greater:.4f}")

# Z-score
x=15000
z = (x-mu)/sigma
print(f"Z= (X-μ)/σ = ({x}-{mu})/{sigma}={z} - {z} std above mean")
# Standard Normal CDF
p_std = stats.norm.cdf(z, loc=0, scale=1)
print(f"P(Z≤{z}) standard normal CDF = {p_std:.4f} same as P(X≤{x})")

# Percentile - inverse CDF - what X has 95% below?
p=0.95
x_95 = stats.norm.ppf(p, mu, sigma)  # ppf = percent point function = inverse CDF
print(f"95th percentile: X where P(X≤X)=0.95 is {x_95:.0f} - 95% orders below {x_95:.0f}")

# Simulate
samples = stats.norm.rvs(loc=mu, scale=sigma, size=10000)
print(f"\nSimulate mean {np.mean(samples):.0f}≈{mu} std {np.std(samples, ddof=0):.0f}≈{sigma}")
```

Step 2 Check normality - Q-Q plot from L03:

```python
from scipy import stats
import matplotlib.pyplot as plt
import numpy as np

amounts = np.random.normal(12000,2000,1000)

plt.figure()
stats.probplot(amounts, dist="norm", plot=plt)
plt.title("Q-Q Normal data - straight line")
plt.savefig("qq_normal_check.png")
print("Q-Q straight line indicates normal - use normal distribution")
```

---

## 4. Exponential - Time Between Poisson Events

### What is Exponential?

Exponential X = time between Poisson events (or time until next event) when events happen at rate λ.

Example: If orders arrive Poisson with rate λ=20 per day, time between orders Exponential with mean 1/λ.

**When to use Exponential?**
- Time between events
- Time until next order, time until failure
- Memoryless property: P(X> s+t | X> s)=P(X> t) - remaining time doesn't depend on how long waited. If you waited s, extra t prob same as fresh start. Like bus - if Poisson arrivals, expected wait same regardless how long already waited.

**PDF:** f(x)= λ e^(-λ x) for x≥0

**CDF:** F(x)=1- e^(-λ x)

**Expected:** E=1/λ, Var=1/λ²

### Code - Exponential

```python
from scipy import stats

lam=0.5  # Rate 0.5 per hour - average time 1/λ=2 hours between events

# PDF
x=2
pdf = stats.expon.pdf(x, scale=1/lam)  # scale =1/λ = mean
print(f"Exponential rate λ={lam} mean {1/lam} PDF f({x})={pdf:.4f}")

# CDF P(X≤2)
cdf = stats.expon.cdf(x, scale=1/lam)
print(f"P(Time ≤{x} hours) = {cdf:.4f}")

# P(Time >2) = e^-λx
p_greater = 1 - cdf
print(f"P(Time >{x}) = {p_greater:.4f} = e^-λx = e^-{lam*x}={2.718**(-lam*x):.4f}")

# Memoryless demo
# P(X>3 | X>1) = P(X>2) ?
s=1
t=2
p_X_gt_s = 1 - stats.expon.cdf(s, scale=1/lam)
p_X_gt_s_plus_t = 1 - stats.expon.cdf(s+t, scale=1/lam)
cond = p_X_gt_s_plus_t / p_X_gt_s
p_X_gt_t = 1 - stats.expon.cdf(t, scale=1/lam)
print(f"\nMemoryless: P(X>{s+t}|X>{s})={cond:.4f} P(X>{t})={p_X_gt_t:.4f} equal!")
```

---

## 5. Log-Normal - When Log is Normal - For Right-Skewed Positive Data

If log(X) ~ Normal, then X ~ Log-Normal. Good for right-skewed positive data like sales amounts - can't be negative, few huge.

Many sales amounts fit Log-Normal better than Normal because right-skewed.

If Y=log(X) ~ N(μ,σ²), then X ~ LogNormal.

**When to use Log-Normal?**
- Positive values only >0
- Right-skewed
- Log transformed more symmetric

Example: Order amounts 10k to 100k right-skewed, log(amount) more normal → log-normal fit.

### Code - Log-Normal

```python
from scipy import stats
import numpy as np

# Simulate log-normal - log of data normal
# If Y ~ N(0,1), X = exp(Y) log-normal
Y = np.random.normal(0,1,10000)
X = np.exp(Y)  # Log-normal

print(f"Y=log(X) mean {np.mean(Y):.2f}≈0 std {np.std(Y):.2f}≈1 normal")
print(f"X log-normal mean {np.mean(X):.2f} median {np.median(X):.2f} Mean>Median right-skewed")

# Fit log-normal to sales
# sales amounts right-skewed
sales = np.random.lognormal(mean=9, sigma=0.5, size=1000)  # lognormal mean of log 9
print(f"\nSales log-normal sample mean {np.mean(sales):.0f} median {np.median(sales):.0f} right-skewed")

# SciPy lognorm
# lognorm parameters: s=sigma shape, scale=exp(mean)
# Check PDF
import matplotlib.pyplot as plt
plt.figure()
plt.hist(sales, bins=50, density=True, color="skyblue", alpha=0.5, label="Data")
x = np.linspace(sales.min(), sales.max(), 100)
pdf = stats.lognorm.pdf(x, s=0.5, scale=np.exp(9))
plt.plot(x, pdf, color="red", label="LogNormal PDF")
plt.title("Sales Log-Normal Fit")
plt.legend()
plt.savefig("lognormal_sales.png")
print("Saved lognormal_sales.png - log-normal fits right-skewed positive sales")
```

---

## 6. Uniform - All Values Equally Likely in Interval

Uniform X ~ U(a,b) - any value between a and b equally likely.

PDF f(x)=1/(b-a) for a≤x≤b else 0. Flat.

CDF F(x)= (x-a)/(b-a) for a≤x≤b

E=(a+b)/2 midpoint, Var=(b-a)²/12

When to use? When no information, all equally likely - e.g., random time arrival between 9am-5pm equally likely any time.

Code:

```python
from scipy import stats

a=0
b=10
# PDF flat 1/(10-0)=0.1
pdf = stats.uniform.pdf(5, loc=a, scale=b-a)
print(f"Uniform U({a},{b}) PDF f(5)=1/(b-a)={1/(b-a)}={pdf}")

# P(2≤X≤5)= (5-2)/(10-0)=0.3
p = stats.uniform.cdf(5, loc=a, scale=b-a) - stats.uniform.cdf(2, loc=a, scale=b-a)
print(f"P(2≤X≤5)={p:.2f}= (5-2)/(10-0)=0.3")

# E=(a+b)/2=5 Var=(b-a)^2/12=8.33
print(f"E=(a+b)/2={(a+b)/2} Var=(b-a)^2/12={(b-a)**2/12:.2f}")
```

---

## 7. Real Store Example - Choose Distribution

```python
import pandas as pd
from scipy import stats
import numpy as np

orders = [
    {"order_id": "ORD_LAG_001_5001", "store_id": "LAG_001_Ikeja", "quantity": 2, "total": 53750, "high": True},
    {"order_id": "ORD_LAG_001_5002", "store_id": "LAG_001_Ikeja", "quantity": 1, "total": 34400, "high": False},
    {"order_id": "ORD_LAG_002_5003", "store_id": "LAG_002_Lekki", "quantity": 3, "total": 91375, "high": True},
]

df = pd.DataFrame(orders)

# Quantity discrete 1,2,3 - Binomial? n= max quantity? Actually quantity per order small, maybe Poisson λ=mean quantity
mean_q = df["quantity"].mean()
print(f"Quantity mean {mean_q:.2f} - if Poisson λ={mean_q:.2f} E=Var=λ")
print(f"Poisson P(quantity=2) λ={mean_q:.2f} = {stats.poisson.pmf(2, mean_q):.3f} vs actual proportion {(df['quantity']==2).mean():.3f}")

# High value Bernoulli/Binomial
p_high = df["high"].mean()
n=10
print(f"\nHigh p={p_high:.2f} Binomial n={n} P(Y=2)={stats.binom.pmf(2,n,p_high):.3f} - if 10 future orders prob 2 high")

# Total continuous right-skewed? Check log-normal vs normal
# With only 3 values not enough, but for large data:
# If total right-skewed positive, try log-normal
log_total = np.log(df["total"])
print(f"\nTotal log mean {log_total.mean():.2f} std {log_total.std():.2f} - if log normal, log(total) normal")

# Time between orders - if daily counts Poisson λ, time Exponential mean 1/λ days
daily_counts = [20,22,19,21]  # Example
lam = np.mean(daily_counts)
mean_time = 1/lam  # Days between orders average
print(f"\nIf orders per day Poisson λ={lam:.1f}, time between orders Exponential mean {mean_time:.4f} days = {mean_time*24:.2f} hours")
```

---

## 8. Hands-On Assignment - Simple to Advanced

Dataset: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - payment_installments discrete Binomial/Poisson? payment_value continuous Normal vs LogNormal

Create distributions_common_L07.py:

Section A Binomial:

```python
import math
from scipy import stats
def comb(n,k): return math.factorial(n)//(math.factorial(k)*math.factorial(n-k))
n=10
p=0.3
k=3
manual=comb(n,k)*(p**k)*((1-p)**(n-k))
scipy=stats.binom.pmf(k,n,p)
print(f"Binomial n={n} p={p} P(Y={k}) manual {manual:.4f} scipy {scipy:.4f} E={n*p} Var={n*p*(1-p)}")
```

Section B Poisson:

```python
import math
from scipy import stats
lam=5
k=3
manual=(lam**k)*math.exp(-lam)/math.factorial(k)
scipy=stats.poisson.pmf(k,lam)
print(f"Poisson λ={lam} P(X={k}) manual {manual:.4f} scipy {scipy:.4f} E=Var=λ={lam}")
```

Section C Normal:

```python
from scipy import stats
mu=12000
sigma=2000
p_interval=stats.norm.cdf(14000,mu,sigma)-stats.norm.cdf(10000,mu,sigma)
print(f"Normal N({mu},{sigma}²) P(10000≤X≤14000)={p_interval:.4f}=68%")
z=(15000-mu)/sigma
print(f"Z for 15000 = (15000-{mu})/{sigma}={z} P(Z≤{z})={stats.norm.cdf(z,0,1):.4f}")
print(f"95th percentile {stats.norm.ppf(0.95,mu,sigma):.0f}")
```

Section D Exponential:

```python
from scipy import stats
lam=0.5
mean_time=1/lam
print(f"Exponential λ={lam} mean time {mean_time} P(Time≤2)={stats.expon.cdf(2,scale=1/lam):.4f} memoryless P(X>3|X>1)=P(X>2)")
```

Section E LogNormal:

```python
import numpy as np
from scipy import stats
sales=np.random.lognormal(9,0.5,1000)
print(f"Sales log-normal mean {np.mean(sales):.0f} median {np.median(sales):.0f} Mean>Median right-skewed log(sales) mean {np.mean(np.log(sales)):.2f} normal")
```

Section F Kaggle:

```python
import os, pandas as pd
from scipy import stats
import numpy as np
import matplotlib.pyplot as plt

if os.path.exists("olist_order_payments_dataset.csv"):
    df=pd.read_csv("olist_order_payments_dataset.csv", nrows=10000)
    # Discrete payment_installments - Binomial? n max installments? Poisson λ mean?
    lam_inst=df["payment_installments"].mean()
    print(f"payment_installments mean {lam_inst:.2f} var {df['payment_installments'].var():.2f} - if Poisson E=Var={lam_inst:.2f} check var≈mean?")
    print(f"P(installments=1) Poisson λ={lam_inst:.2f} = {stats.poisson.pmf(1,lam_inst):.3f} vs actual {(df['payment_installments']==1).mean():.3f}")
    
    # Continuous payment_value - Normal vs LogNormal?
    vals=df["payment_value"].dropna()
    print(f"\npayment_value mean {vals.mean():.2f} median {vals.median():.2f} Mean>Median right-skewed")
    print(f"Skew {stats.skew(vals):.2f} >0 right-skewed")
    log_vals=np.log1p(vals)
    print(f"log1p skew {stats.skew(log_vals):.2f} more symmetric - log-normal better than normal")
    
    # Plot
    plt.figure(figsize=(12,4))
    plt.subplot(1,3,1)
    plt.hist(vals, bins=50, density=True, color="skyblue")
    plt.title(f"Original skew {stats.skew(vals):.2f} right-skewed")
    
    plt.subplot(1,3,2)
    plt.hist(log_vals, bins=50, density=True, color="lightgreen")
    plt.title(f"log1p skew {stats.skew(log_vals):.2f} more normal")
    
    plt.subplot(1,3,3)
    # Fit normal to log
    mu_log=log_vals.mean()
    sigma_log=log_vals.std()
    plt.hist(vals, bins=50, density=True, color="skyblue", alpha=0.5)
    x=np.linspace(vals.min(), vals.max(), 200)
    # Lognormal pdf
    pdf_lognorm=stats.lognorm.pdf(x, s=sigma_log, scale=np.exp(mu_log))
    plt.plot(x, pdf_lognorm, color="red", label="LogNormal")
    plt.title("LogNormal fit right-skewed")
    plt.legend()
    plt.tight_layout()
    plt.savefig("dist_common_payment_value.png")
    print("Saved dist_common_payment_value.png - original right-skewed log more symmetric lognormal fit")
    
    # Check Q-Q
    plt.figure()
    stats.probplot(vals, dist="norm", plot=plt)
    plt.title("Q-Q payment_value original curved non-normal")
    plt.savefig("qq_payment_common_original.png")
    
    plt.figure()
    stats.probplot(log_vals, dist="norm", plot=plt)
    plt.title("Q-Q log1p straighter log-normal")
    plt.savefig("qq_payment_common_log.png")
else:
    print("Download https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - payment_value right-skewed lognormal")
```

Deliverable: Upload distributions_common_L07.py + images dist_common_payment_value.png showing original right-skew log more symmetric lognormal fit, qq plots + output showing Binomial P(Y=k)=C(n,k)p^k(1-p)^(n-k) E=n p, Poisson λ^k e^-λ/k! E=Var=λ, Normal 68-95-99.7 Z=(X-μ)/σ, Exponential time between Poisson memoryless, LogNormal for right-skewed positive.

Kaggle:
1. Primary https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - payment_installments Poisson/Binomial payment_value LogNormal
2. Secondary https://www.kaggle.com/datasets/vivek468/superstore-dataset-final - Quantity Poisson Sales LogNormal

## 9. Checklist
- Explain Bernoulli one trial success/failure p E=p Var=p(1-p) building block
- Explain Binomial count successes n trials C(n,k)p^k(1-p)^(n-k) E=n p Var=n p(1-p) fixed n independent same p
- Explain Poisson count events interval λ^k e^-λ/k! E=Var=λ rate λ average count constant rate independent
- Explain Normal bell N(μ,σ²) symmetric 68-95-99.7 Z=(X-μ)/σ standard normal N(0,1) approx sum many factors central limit
- Explain Exponential time between Poisson λ e^-λx mean 1/λ memoryless P(X>s+t|X>s)=P(X>t)
- Explain LogNormal log(X) normal for right-skewed positive sales positive >0 right-skewed log more normal
- Explain Uniform U(a,b) flat all equally likely
- Choose distribution: Count successes fixed n → Binomial, Count events time → Poisson, Continuous symmetric many factors → Normal, Time between → Exponential, Positive right-skewed → LogNormal, All equal → Uniform
- Fit from data estimate p proportion mean λ mean μ mean σ std check Q-Q and skew

Key Takeaway: Binomial C(n,k)p^k(1-p)^(n-k) n fixed count successes. Poisson λ^k e^-λ/k! count events rate λ E=Var. Normal bell μ σ 68-95-99.7 Z=(X-μ)/σ. Exponential time between Poisson mean 1/λ memoryless. LogNormal right-skewed positive log normal. Choose by data shape question.

