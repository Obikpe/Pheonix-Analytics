# Lesson 03 - Data Distributions - Shapes, Skewness, Kurtosis - What Does Your Data Look Like?

**Duration:** 90 min | **Level:** Absolute Beginner | **Goal:** Recognize shapes of data and why mean can mislead

## What You Will Learn

L01 mean/median typical, L02 spread. But what does whole data look like? Is it symmetric like bell? Or skewed with long tail? Shape dictates which summary to use.

Imagine two stores:
- Store A sales per day symmetric around 12k: [10,11,12,12,13,14] - bell shape, mean ≈ median
- Store B sales right-skewed: many small 10k orders, few huge 100k corporate orders [10,11,11,12,12,100] - long tail to right, mean > median

If you plot histogram (bar chart of how many values in each range), you see shape instantly.

We build from zero, visuals, simple→advanced code.

---

## 1. Histograms - Picture of Distribution

### What is Histogram?

Histogram = bar chart showing frequency. X-axis = value ranges (bins), Y-axis = how many orders in that range.

If many orders cluster around 12k, bar at 12k tall. If few huge orders at 100k, small bar far right - tail.

### Visual: Histogram Types

<svg width="100%" height="300" viewBox="0 0 700 300" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="300" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">HISTOGRAM - PICTURE OF DATA SHAPE</text>
  <rect x="20" y="50" width="200" height="110" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
  <text x="120" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#1E40AF">Normal - Bell Symmetric</text>
  <line x1="40" y1="150" x2="200" y2="150" stroke="#6B7280" stroke-width="1"/>
  <rect x="60" y="135" width="15" height="15" fill="#93C5FD"/><rect x="80" y="125" width="15" height="25" fill="#93C5FD"/><rect x="100" y="110" width="15" height="40" fill="#2563EB"/><rect x="120" y="110" width="15" height="40" fill="#2563EB"/><rect x="140" y="125" width="15" height="25" fill="#93C5FD"/><rect x="160" y="135" width="15" height="15" fill="#93C5FD"/>
  <text x="120" y="170" text-anchor="middle" font-family="Arial" font-size="8" fill="#1E40AF">Mean≈Median symmetric</text>
  <rect x="250" y="50" width="200" height="110" rx="12" fill="#FEF2F2" stroke="#FCA5A5" stroke-width="1"/>
  <text x="350" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#7F1D1D">Right-Skewed - Tail to Right</text>
  <line x1="270" y1="150" x2="430" y2="150" stroke="#6B7280" stroke-width="1"/>
  <rect x="280" y="105" width="15" height="45" fill="#FCA5A5"/><rect x="300" y="115" width="15" height="35" fill="#FCA5A5"/><rect x="320" y="130" width="15" height="20" fill="#FCA5A5"/><rect x="340" y="140" width="15" height="10" fill="#FCA5A5"/><rect x="400" y="135" width="15" height="15" fill="#EF4444"/>
  <text x="350" y="170" text-anchor="middle" font-family="Arial" font-size="8" fill="#7F1D1D">Mean>Median few huge tail right</text>
  <text x="350" y="185" text-anchor="middle" font-family="Arial" font-size="7" fill="#7F1D1D">Sales common - many small few huge</text>
  <rect x="480" y="50" width="200" height="110" rx="12" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1"/>
  <text x="580" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#065F46">Bimodal - Two Peaks</text>
  <line x1="500" y1="150" x2="660" y2="150" stroke="#6B7280" stroke-width="1"/>
  <rect x="510" y="120" width="15" height="30" fill="#86EFAC"/><rect x="530" y="110" width="15" height="40" fill="#10B981"/><rect x="550" y="130" width="15" height="20" fill="#86EFAC"/><rect x="600" y="120" width="15" height="30" fill="#86EFAC"/><rect x="620" y="110" width="15" height="40" fill="#10B981"/>
  <text x="580" y="170" text-anchor="middle" font-family="Arial" font-size="8" fill="#065F46">Two groups mixed e.g. Lagos low</text>
  <text x="580" y="185" text-anchor="middle" font-family="Arial" font-size="7" fill="#065F46">and London high prices</text>
  <rect x="20" y="180" width="660" height="100" rx="12" fill="#FFFBEB" stroke="#FCD34D" stroke-width="1"/>
  <text x="350" y="200" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#92400E">WHY SHAPE MATTERS FOR MEAN vs MEDIAN</text>
  <text x="35" y="220" font-family="Arial" font-size="8" fill="#111827">Symmetric [10,11,12,13,14] Mean 12 Median 12 - mean good</text>
  <text x="35" y="235" font-family="Arial" font-size="8" fill="#111827">Right-skewed [10,11,12,13,100] Mean 29.2 Median 12 - mean inflated by tail, median better for typical</text>
  <text x="35" y="250" font-family="Arial" font-size="8" fill="#111827">Bimodal [10,10,10,20,20,20] Mean 15 Median 15 but data has two peaks - mean/median misleading, need two groups</text>
  <text x="35" y="270" font-family="Arial" font-size="8" font-style="italic" fill="#92400E">Always plot histogram before trusting mean!</text>
</svg>

### Code Simple→Advanced - Histogram

Step 1 Plain Python - Count bins manually:

```python
# Step 1: Manual histogram - count how many in each bin
orders = [10, 11, 12, 12, 13, 14, 10, 11, 12, 100]  # Includes outlier
print(f"Orders: {orders}")

# Define bins: 0-20, 20-40, 40-60, 60-80, 80-100, 100-120
bins = [(0,20), (20,40), (40,60), (60,80), (80,100), (100,120)]
print(f"Bins: {bins}")

for bin_start, bin_end in bins:
    count = 0
    for value in orders:
        if bin_start <= value < bin_end:
            count += 1
    print(f"Bin {bin_start}-{bin_end}: {count} orders {'*' * count}")

print("You see many in 0-20, few in 100-120 - right-skewed tail")
```

Step 2 Matplotlib - One line histogram:

```python
# Step 2: Matplotlib - plots histogram automatically
import matplotlib.pyplot as plt

orders = [10, 11, 12, 12, 13, 14, 10, 11, 12, 100]

plt.figure(figsize=(6,3))
plt.hist(orders, bins=10, color="skyblue", edgecolor="black")
plt.title("Histogram of Orders - Right-Skewed Tail at 100")
plt.xlabel("Order Value")
plt.ylabel("Count")
plt.axvline(sum(orders)/len(orders), color="red", linestyle="--", label="Mean")
plt.axvline(sorted(orders)[len(orders)//2], color="green", label="Median")
plt.legend()
plt.savefig("hist_simple.png")
print("Saved hist_simple.png - see tall bar left many small orders, small bar right few huge")
```

Step 3 Seaborn + KDE (smooth curve):

```python
import seaborn as sns
import matplotlib.pyplot as plt

orders = [10, 11, 12, 12, 13, 14, 10, 11, 12, 100]

plt.figure(figsize=(6,3))
sns.histplot(orders, kde=True, color="skyblue")  # kde=True adds smooth density curve
plt.title("Histogram + KDE - Smooth curve shows shape")
plt.savefig("hist_kde.png")
print("KDE = Kernel Density Estimate - smooth version of histogram, shows shape clearer")
```

---

## 2. Skewness - How Skewed Is It?

### What is Skewness?

Skewness measures asymmetry - how much tail to one side.

- **Skew = 0:** Symmetric like bell, mean ≈ median
- **Skew > 0:** Right-skewed (positive skew), tail to right, mean > median, few huge values pull mean up. Sales, income common.
- **Skew < 0:** Left-skewed (negative skew), tail to left, mean < median, few small values pull mean down.

**Interpretation:**
- |Skew| <0.5 approx symmetric
- 0.5-1 moderate skew
- >1 highly skewed

**Formula (Fisher-Pearson):** Skew = Average of (x - mean)^3 / std^3

Cubing keeps sign: positive distance cubed positive, negative cubed negative. If right tail has huge positive distances cubed huge positive, skew positive.

### Visual: Skewness

<svg width="100%" height="200" viewBox="0 0 700 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="200" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">SKEWNESS - MEASURES ASYMMETRY</text>
  <rect x="20" y="50" width="200" height="120" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
  <text x="120" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#1E40AF">Symmetric Skew≈0</text>
  <text x="35" y="90" font-family="Arial" font-size="8" fill="#1E40AF">Bell shape</text>
  <text x="35" y="105" font-family="Arial" font-size="8" fill="#1E40AF">Mean≈Median≈Mode</text>
  <text x="35" y="120" font-family="Arial" font-size="8" fill="#1E40AF">No tail</text>
  <rect x="250" y="50" width="200" height="120" rx="12" fill="#FEF2F2" stroke="#FCA5A5" stroke-width="1"/>
  <text x="350" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#7F1D1D">Right-Skewed Skew>0</text>
  <text x="265" y="90" font-family="Arial" font-size="8" fill="#7F1D1D">Tail to right</text>
  <text x="265" y="105" font-family="Arial" font-size="8" fill="#7F1D1D">Mean>Median</text>
  <text x="265" y="120" font-family="Arial" font-size="8" fill="#7F1D1D">Few huge values</text>
  <text x="265" y="135" font-family="Arial" font-size="8" fill="#7F1D1D">Sales, income common</text>
  <text x="265" y="150" font-family="Arial" font-size="8" fill="#7F1D1D">Log transform helps</text>
  <rect x="480" y="50" width="200" height="120" rx="12" fill="#FEF3C7" stroke="#FCD34D" stroke-width="1"/>
  <text x="580" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#92400E">Left-Skewed Skew<0</text>
  <text x="495" y="90" font-family="Arial" font-size="8" fill="#92400E">Tail to left</text>
  <text x="495" y="105" font-family="Arial" font-size="8" fill="#92400E">Mean<Median</text>
  <text x="495" y="120" font-family="Arial" font-size="8" fill="#92400E">Few small values</text>
  <text x="495" y="135" font-family="Arial" font-size="8" fill="#92400E">Less common in sales</text>
</svg>

### Code Simple→Advanced - Skewness

Step 1 Plain Python - Calculate skew manually:

```python
# Step 1: Manual skewness - average cubed distance / std^3
orders = [10, 11, 12, 13, 100]
print(f"Orders: {orders}")

# Mean
mean = sum(orders) / len(orders)
print(f"Mean = {mean}")

# Std pop
import math
squared_dist = [(x-mean)**2 for x in orders]
var = sum(squared_dist) / len(orders)
std = math.sqrt(var)
print(f"Std = {std:.2f}")

# Cubed distances
cubed_dist = [(x-mean)**3 for x in orders]
print(f"Cubed distances: {cubed_dist} - huge positive for 100 because (100-29.2)^3 large")

# Skew = mean of cubed distances / std^3
mean_cubed = sum(cubed_dist) / len(orders)
skew = mean_cubed / (std**3)
print(f"Mean cubed distance = {mean_cubed:.2f}")
print(f"Skew = {mean_cubed:.2f} / {std:.2f}^3 = {skew:.2f} >0 right-skewed")

# Symmetric data skew near 0
sym = [10,11,12,13,14]
mean_s = sum(sym)/len(sym)
var_s = sum((x-mean_s)**2 for x in sym)/len(sym)
std_s = math.sqrt(var_s)
skew_s = (sum((x-mean_s)**3 for x in sym)/len(sym)) / (std_s**3)
print(f"\nSymmetric {sym} skew {skew_s:.2f} near 0")
```

Step 2 SciPy:

```python
# Step 2: SciPy - one line
from scipy import stats

orders = [10, 11, 12, 13, 100]
skew = stats.skew(orders)
print(f"SciPy skew {orders} = {skew:.2f} >0 right-skewed")

sym = [10,11,12,13,14]
print(f"Symmetric {sym} skew {stats.skew(sym):.2f} approx 0")

# Interpretation
if abs(skew) < 0.5:
    print("Approximately symmetric")
elif abs(skew) < 1:
    print("Moderate skew")
else:
    print("Highly skewed - mean misleading, use median")
```

Step 3 Pandas:

```python
import pandas as pd
df = pd.DataFrame({"total": [10,11,12,13,100]})
print(f"Pandas skew {df['total'].skew():.2f}")  # Pandas skew same as SciPy
```

---

## 3. Kurtosis - How Heavy Are Tails?

### What is Kurtosis?

Kurtosis measures tail heaviness and peak sharpness - how much data in tails vs center, how peaked.

- **Normal kurtosis = 3, excess kurtosis = 0:** Normal tails, normal peak
- **High kurtosis >3 (excess >0):** Heavy tails, more outliers, sharp peak. Many values near mean and few far outliers.
- **Low kurtosis <3 (excess <0):** Light tails, few outliers, flat peak.

SciPy and Pandas report **excess kurtosis** = kurtosis -3, so normal excess =0. Be careful which definition!

**Why matters?** High kurtosis means more outliers than normal - need robust methods like median/IQR.

### Visual: Kurtosis

<svg width="100%" height="150" viewBox="0 0 700 150" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="150" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">KURTOSIS - TAIL HEAVINESS AND PEAK SHARPNESS</text>
  <rect x="20" y="50" width="200" height="80" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
  <text x="120" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#1E40AF">Normal Kurt=3 Excess 0</text>
  <text x="35" y="90" font-family="Arial" font-size="8" fill="#1E40AF">Bell normal tails</text>
  <rect x="250" y="50" width="200" height="80" rx="12" fill="#FEF2F2" stroke="#FCA5A5" stroke-width="1"/>
  <text x="350" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#7F1D1D">High Kurt>3 Heavy Tails</text>
  <text x="265" y="90" font-family="Arial" font-size="8" fill="#7F1D1D">Sharp peak, heavy tails</text>
  <text x="265" y="105" font-family="Arial" font-size="8" fill="#7F1D1D">More outliers</text>
  <rect x="480" y="50" width="200" height="80" rx="12" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1"/>
  <text x="580" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#065F46">Low Kurt<3 Light Tails</text>
  <text x="495" y="90" font-family="Arial" font-size="8" fill="#065F46">Flat peak, light tails</text>
  <text x="495" y="105" font-family="Arial" font-size="8" fill="#065F46">Few outliers</text>
</svg>

### Code - Kurtosis

```python
from scipy import stats

# Normal-ish data
normal = [10,11,12,12,13,14]
print(f"Normal-ish {normal} kurtosis excess {stats.kurtosis(normal):.2f} near 0")

# Data with outlier - heavy tails
heavy = [10,11,12,12,13,100]
print(f"With outlier {heavy} kurtosis excess {stats.kurtosis(heavy):.2f} high >0 heavy tails more outliers")

# Pandas
import pandas as pd
df = pd.DataFrame({"total": heavy})
print(f"Pandas kurtosis excess {df['total'].kurtosis():.2f}")
```

---

## 4. Log Transformation - Fix Right-Skew

### Why Log Transform?

Right-skewed data [10,11,12,13,100] has few huge values. Mean inflated. If we take log, huge values shrink.

log(10)=2.3, log(100)=4.6 - 100 not 10x bigger than 10 after log, only 2x. Log compresses large values.

We use **log1p = log(1+x)** instead of log(x) to handle zeros (log(0) undefined, log(1+0)=log(1)=0).

After log, data more symmetric, closer to normal, mean more meaningful, statistical tests more valid.

### Visual: Log Transform

<svg width="100%" height="200" viewBox="0 0 700 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="200" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">LOG TRANSFORM - MAKES RIGHT-SKEWED MORE SYMMETRIC</text>
  <rect x="20" y="50" width="300" height="120" rx="12" fill="#FEF2F2" stroke="#FCA5A5" stroke-width="1"/>
  <text x="170" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#7F1D1D">Original Right-Skewed [10,11,12,13,100]</text>
  <text x="35" y="90" font-family="Arial" font-size="8" fill="#7F1D1D">Mean 29.2 > Median 12</text>
  <text x="35" y="108" font-family="Arial" font-size="8" fill="#7F1D1D">Skew high >1</text>
  <text x="35" y="126" font-family="Arial" font-size="8" fill="#7F1D1D">Few huge dominate mean</text>
  <rect x="380" y="50" width="300" height="120" rx="12" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1"/>
  <text x="530" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#065F46">Log Transformed log1p(x)=log(1+x)</text>
  <text x="395" y="90" font-family="Arial" font-size="8" fill="#065F46">log1p(10)=2.4, log1p(100)=4.6</text>
  <text x="395" y="108" font-family="Arial" font-size="8" fill="#065F46">Huge compressed, more symmetric</text>
  <text x="395" y="126" font-family="Arial" font-size="8" fill="#065F46">Mean≈Median, skew closer to 0</text>
  <text x="395" y="144" font-family="Arial" font-size="8" fill="#065F46">Better for analysis</text>
</svg>

### Code Simple→Advanced - Log Transform

Step 1 Plain Python:

```python
import math

orders = [10, 11, 12, 13, 100]
print(f"Original: {orders}")

# log1p = log(1+x)
log_orders = []
for x in orders:
    log_x = math.log1p(x)  # log(1+x)
    log_orders.append(log_x)
    print(f"x={x}, log1p({x})=log({1+x})={log_x:.2f} - 100 compressed from 100 to {log_x:.2f}")

print(f"\nOriginal mean {sum(orders)/len(orders):.2f} median {sorted(orders)[len(orders)//2]} diff large")
print(f"Log mean {sum(log_orders)/len(log_orders):.2f} median {sorted(log_orders)[len(log_orders)//2]:.2f} diff smaller more symmetric")
```

Step 2 NumPy:

```python
import numpy as np
from scipy import stats

orders = np.array([10, 11, 12, 13, 100])
log_orders = np.log1p(orders)

print(f"Original skew {stats.skew(orders):.2f} high")
print(f"Log skew {stats.skew(log_orders):.2f} closer to 0 more symmetric")

# Plot
import matplotlib.pyplot as plt
plt.figure(figsize=(10,4))
plt.subplot(1,2,1)
plt.hist(orders, bins=10, color="skyblue", edgecolor="black")
plt.title(f"Original skew {stats.skew(orders):.2f}")
plt.subplot(1,2,2)
plt.hist(log_orders, bins=10, color="lightgreen", edgecolor="black")
plt.title(f"Log transformed skew {stats.skew(log_orders):.2f}")
plt.savefig("log_transform.png")
print("Saved log_transform.png - right-skewed left plot, more symmetric right plot")
```

---

## 5. Q-Q Plot - Check if Normal

### What is Q-Q Plot?

Q-Q plot = Quantile-Quantile plot. Compares your data quantiles vs normal distribution quantiles. If data normal, points fall on straight line. If curved, not normal.

- Straight line = normal
- Curved = skewed or heavy tails

### Code - Q-Q Plot

```python
from scipy import stats
import matplotlib.pyplot as plt
import numpy as np

# Right-skewed data
orders = np.array([10, 11, 12, 13, 100, 10, 11, 12, 11, 12, 13, 14, 15, 10, 11])

plt.figure()
stats.probplot(orders, dist="norm", plot=plt)
plt.title("Q-Q Plot Original - Curved not normal")
plt.savefig("qq_original.png")
print("Saved qq_original.png - points deviate from line indicates non-normal skewed")

log_orders = np.log1p(orders)
plt.figure()
stats.probplot(log_orders, dist="norm", plot=plt)
plt.title("Q-Q Plot Log Transformed - Straighter more normal")
plt.savefig("qq_log.png")
print("Saved qq_log.png - closer to line more normal")
```

---

## 6. Real Store Example - Where Location Matters Only for Grouping

```python
import pandas as pd

orders_data = [
    {"store_id": "LAG_001_Ikeja", "total": 53750},
    {"store_id": "LAG_001_Ikeja", "total": 34400},
    {"store_id": "LAG_002_Lekki", "total": 91375},
    {"order_id": "ORD_LDN_001_2001", "store_id": "LDN_001_Camden", "total": 433},
]

df = pd.DataFrame(orders_data)
print(df)

# Mixing NGN and GBP creates bimodal artificial - two peaks
# Better analyze within same currency
lagos = df[df["store_id"].str.contains("LAG")]["total"]
print(f"Lagos only (NGN) mean {lagos.mean():.0f} median {lagos.median():.0f} skew - check shape within same currency")

# If you mix NGN (50k) and GBP (433) you get bimodal [433, 34400, 53750, 91375] two groups - not real shape
# Always check currency/scale before histogram
```

---

## 7. Hands-On Assignment - Simple to Advanced

Dataset: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - payment_value classic right-skewed

Create distributions_L03.py:

Section A Plain Python Skew:

```python
orders=[10,11,12,13,100]
mean=sum(orders)/len(orders)
import math
var=sum((x-mean)**2 for x in orders)/len(orders)
std=math.sqrt(var)
skew=sum((x-mean)**3 for x in orders)/len(orders)/(std**3)
print(f"Skew {skew:.2f} >0 right-skewed Mean {mean:.1f} > Median {sorted(orders)[len(orders)//2]}")
```

Section B SciPy Skew Kurtosis:

```python
from scipy import stats
orders=[10,11,12,13,100]
print(f"SciPy skew {stats.skew(orders):.2f} kurtosis excess {stats.kurtosis(orders):.2f}")
```

Section C Histogram Log Transform:

```python
import matplotlib.pyplot as plt, numpy as np
from scipy import stats
orders=np.array([10,11,12,13,100]*20)  # Repeat to have more data
plt.figure()
plt.hist(orders, bins=20)
plt.savefig("hist_right_skew.png")
log_orders=np.log1p(orders)
print(f"Original skew {stats.skew(orders):.2f} vs log skew {stats.skew(log_orders):.2f} log more symmetric")
```

Section D Q-Q Plot:

```python
from scipy import stats
import matplotlib.pyplot as plt
import numpy as np
orders=np.array([10,11,12,13,100]*20)
plt.figure()
stats.probplot(orders, dist="norm", plot=plt)
plt.title("Q-Q Original curved")
plt.savefig("qq_original.png")
plt.figure()
stats.probplot(np.log1p(orders), dist="norm", plot=plt)
plt.title("Q-Q Log straighter")
plt.savefig("qq_log.png")
```

Section E Kaggle Real Data:

```python
import os, pandas as pd
from scipy import stats
import numpy as np
import matplotlib.pyplot as plt

if os.path.exists("olist_order_payments_dataset.csv"):
    df=pd.read_csv("olist_order_payments_dataset.csv", nrows=10000)
    vals=df["payment_value"].dropna()
    print(f"payment_value Mean {vals.mean():.2f} Median {vals.median():.2f} Mean>Median right-skewed")
    print(f"Skew {stats.skew(vals):.2f} >0 right-skewed Kurtosis excess {stats.kurtosis(vals):.2f} heavy tails")
    
    # Histogram
    plt.figure(figsize=(10,4))
    plt.subplot(1,2,1)
    plt.hist(vals, bins=50, color="skyblue", edgecolor="black")
    plt.title(f"Original skew {stats.skew(vals):.2f}")
    plt.axvline(vals.mean(), color="red", linestyle="--", label="Mean")
    plt.axvline(vals.median(), color="green", label="Median")
    plt.legend()
    
    plt.subplot(1,2,2)
    log_vals=np.log1p(vals)
    plt.hist(log_vals, bins=50, color="lightgreen", edgecolor="black")
    plt.title(f"log1p skew {stats.skew(log_vals):.2f} more symmetric")
    plt.tight_layout()
    plt.savefig("dist_payment_value_log.png")
    print("Saved dist_payment_value_log.png - left right-skewed right more symmetric")
    
    # Q-Q
    plt.figure()
    stats.probplot(vals, dist="norm", plot=plt)
    plt.title("Q-Q Original curved non-normal")
    plt.savefig("qq_payment_original.png")
    
    plt.figure()
    stats.probplot(log_vals, dist="norm", plot=plt)
    plt.title("Q-Q Log straighter more normal")
    plt.savefig("qq_payment_log.png")
    print("Q-Q plots show original curved non-normal log straighter")
else:
    print("Download https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - payment_value right-skewed")
```

Deliverable: Upload distributions_L03.py + 3 images dist_payment_value_log.png showing original right-skew and log more symmetric, qq_payment_original.png curved, qq_payment_log.png straighter + console output Mean>Median skew>0.

Kaggle:
1. Primary https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce payment_value right-skewed classic
2. Secondary https://www.kaggle.com/datasets/vivek468/superstore-dataset-final Sales right-skewed

## 8. Checklist
- Plot histogram identify normal bell symmetric, right-skewed tail right Mean>Median, left-skewed tail left, bimodal two peaks two groups
- Calculate skewness stats.skew >0 right-skew <0 left-skew |skew|>1 highly skewed
- Calculate kurtosis excess stats.kurtosis >0 heavy tails more outliers normal excess 0
- Explain why Mean>Median right-skew few huge inflate mean
- Apply log transform np.log1p for right-skewed >0 reduces skew more symmetric
- Use Q-Q plot probplot check normality points on line normal curved non-normal
- Load Kaggle payment_value show right-skew Mean>Median skew>0 log more symmetric

Key Takeaway: Shape matters. Right-skewed sales mean overstates typical use median or log1p. Skewness >0 right tail <0 left. Kurtosis tail heaviness. Plot histogram before trusting mean. Log helps right-skew. Q-Q checks normality.

