# Lesson 02 - Variance, Standard Deviation, Range, IQR - How Spread Out Is Your Data?

**Duration:** 90 min | **Level:** Absolute Beginner | **Goal:** Understand how consistent or variable your sales are

## What You Will Learn

In L01 you learned typical value (mean/median). But two stores can have same mean and be completely different:

- **Store A consistent:** Orders per day = [20, 21, 19, 20, 20] - mean 20, always around 20
- **Store B inconsistent:** Orders per day = [5, 35, 0, 40, 20] - mean 20, but some days empty, some days crowded

Same mean, different risk! Store B needs extra staff some days, wastes staff other days.

This lesson teaches you to measure **spread** - how far data is from the mean. Spread tells you reliability, risk, and consistency.

We build from zero, everyday examples, pictures, tiny code steps.

---

## 1. Range - The Simplest Spread

### What is Range?

Range = Maximum - Minimum. How wide is your data from smallest to largest?

If orders are [10, 12, 13, 11, 14], Min=10, Max=14, Range=14-10=4. All orders within 4k window.

If orders are [10, 12, 13, 11, 100], Min=10, Max=100, Range=90. Huge spread because one outlier.

**Strength:** Very simple, easy to calculate.
**Weakness:** Sensitive to one outlier. One huge order makes range huge, even if other 99 orders consistent.

### Visual: Range

<svg width="100%" height="180" viewBox="0 0 700 180" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="180" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">RANGE = MAX - MIN</text>
  <rect x="20" y="50" width="300" height="100" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
  <text x="170" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="700" fill="#1E40AF">Small Range - Consistent</text>
  <text x="35" y="90" font-family="Arial" font-size="9" fill="#1E40AF">Data: [10, 11, 12, 13, 14]</text>
  <text x="35" y="108" font-family="Arial" font-size="9" fill="#1E40AF">Min=10, Max=14, Range=4</text>
  <text x="35" y="126" font-family="Arial" font-size="9" fill="#059669">✓ All close together, predictable</text>
  <rect x="380" y="50" width="300" height="100" rx="12" fill="#FEF2F2" stroke="#FCA5A5" stroke-width="1"/>
  <text x="530" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="700" fill="#7F1D1D">Large Range - Variable</text>
  <text x="395" y="90" font-family="Arial" font-size="9" fill="#7F1D1D">Data: [10, 11, 12, 13, 100]</text>
  <text x="395" y="108" font-family="Arial" font-size="9" fill="#7F1D1D">Min=10, Max=100, Range=90</text>
  <text x="395" y="126" font-family="Arial" font-size="9" fill="#DC2626">✗ One outlier makes range huge</text>
</svg>

### Code Step-by-Step - Range Simple to Advanced

**Step 1 Plain Python - No Libraries:**

```python
# Step 1: Most basic - find min and max by looping
orders = [10, 12, 13, 11, 14]
print(f"Orders: {orders}")

# Find min - smallest
smallest = orders[0]  # Start with first value
for value in orders:
    if value < smallest:
        smallest = value
    print(f"Checking {value}, smallest so far {smallest}")

print(f"Min = {smallest}")

# Find max - largest
largest = orders[0]
for value in orders:
    if value > largest:
        largest = value

print(f"Max = {largest}")

# Range
range_val = largest - smallest
print(f"Range = Max - Min = {largest} - {smallest} = {range_val}")
```

What this does: Loop through each value, keep track of smallest and largest seen so far. Range is difference.

**Step 2 Using built-in min() max():**

```python
# Step 2: Shorter - Python built-ins do looping for you
orders = [10, 12, 13, 11, 14]
min_val = min(orders)  # min() finds smallest automatically
max_val = max(orders)  # max() finds largest automatically
range_val = max_val - min_val
print(f"Min {min_val}, Max {max_val}, Range {range_val}")
```

**Step 3 NumPy:**

```python
import numpy as np
orders = np.array([10, 12, 13, 11, 14])
range_val = np.max(orders) - np.min(orders)
print(f"NumPy Range = {range_val}")
# Or np.ptp = peak to peak = max-min
print(f"NumPy ptp = {np.ptp(orders)} same as range")
```

**Step 4 Pandas:**

```python
import pandas as pd
df = pd.DataFrame({"total": [10,12,13,11,14]})
range_val = df["total"].max() - df["total"].min()
print(f"Pandas Range = {range_val}")
```

---

## 2. Variance - Average Squared Distance from Mean

### What is Variance in Plain English?

Variance measures how far each value is from the mean, on average. But with a twist: we square the distances.

Why square?
1. Distance can be negative (if value below mean). Squaring makes all positive.
2. Squaring punishes large distances more - a value far from mean counts more.

Think of it like this: If most orders are close to mean 12k, variance small. If orders are spread far from mean, variance large.

**Formula - Don't be scared, we break it down:**

Population Variance = Sum of (each value - mean)^2 / N
Sample Variance = Sum of (each value - mean)^2 / (n-1)

Where N = total population size, n = sample size.

Why n-1 for sample? Called Bessel's correction. When you only have sample not entire population, dividing by n-1 gives better estimate of true population variance. Unbiased estimate. If you have entire population, divide by N.

### Visual: Variance - Distances from Mean

<svg width="100%" height="250" viewBox="0 0 700 250" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="250" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">VARIANCE - AVERAGE SQUARED DISTANCE FROM MEAN</text>
  
  <rect x="20" y="50" width="310" height="180" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
  <text x="175" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="700" fill="#1E40AF">Low Variance - Close to Mean</text>
  <text x="35" y="90" font-family="Arial" font-size="8" fill="#1E40AF">Data: [11,12,12,13,12] Mean=12</text>
  <text x="35" y="108" font-family="Arial" font-size="8" fill="#1E40AF">Distances from mean:</text>
  <text x="35" y="122" font-family="Arial" font-size="8" fill="#1E40AF">11-12=-1 squared=1</text>
  <text x="35" y="136" font-family="Arial" font-size="8" fill="#1E40AF">12-12=0 squared=0</text>
  <text x="35" y="150" font-family="Arial" font-size="8" fill="#1E40AF">12-12=0 squared=0</text>
  <text x="35" y="164" font-family="Arial" font-size="8" fill="#1E40AF">13-12=1 squared=1</text>
  <text x="35" y="178" font-family="Arial" font-size="8" fill="#1E40AF">12-12=0 squared=0</text>
  <text x="35" y="198" font-family="Arial" font-size="9" font-weight="800" fill="#1E40AF">Sum squared=2, Var=2/5=0.4 Small!</text>
  <text x="35" y="212" font-family="Arial" font-size="8" fill="#059669">✓ All near mean, consistent, low risk</text>

  <rect x="360" y="50" width="320" height="180" rx="12" fill="#FEF2F2" stroke="#FCA5A5" stroke-width="1"/>
  <text x="520" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="700" fill="#7F1D1D">High Variance - Far from Mean</text>
  <text x="375" y="90" font-family="Arial" font-size="8" fill="#7F1D1D">Data: [5,12,20,2,21] Mean=12</text>
  <text x="375" y="108" font-family="Arial" font-size="8" fill="#7F1D1D">Distances from mean:</text>
  <text x="375" y="122" font-family="Arial" font-size="8" fill="#7F1D1D">5-12=-7 squared=49</text>
  <text x="375" y="136" font-family="Arial" font-size="8" fill="#7F1D1D">12-12=0 squared=0</text>
  <text x="375" y="150" font-family="Arial" font-size="8" fill="#7F1D1D">20-12=8 squared=64</text>
  <text x="375" y="164" font-family="Arial" font-size="8" fill="#7F1D1D">2-12=-10 squared=100</text>
  <text x="375" y="178" font-family="Arial" font-size="8" fill="#7F1D1D">21-12=9 squared=81</text>
  <text x="375" y="198" font-family="Arial" font-size="9" font-weight="800" fill="#7F1D1D">Sum squared=294, Var=294/5=58.8 Large!</text>
  <text x="375" y="212" font-family="Arial" font-size="8" fill="#DC2626">✗ Far from mean, inconsistent, high risk</text>
</svg>

### Code Step-by-Step - Variance

**Step 1 Plain Python - Understand Logic:**

```python
# Step 1: Calculate variance by hand - no libraries
orders = [11, 12, 12, 13, 12]
print(f"Orders: {orders}")

# Step A: Calculate mean
mean = sum(orders) / len(orders)
print(f"Mean = {mean}")

# Step B: For each value, distance from mean and square it
squared_distances = []
for value in orders:
    distance = value - mean
    squared = distance ** 2  # **2 means squared
    squared_distances.append(squared)
    print(f"Value {value}, distance from mean {value}-{mean}={distance}, squared={squared}")

print(f"Squared distances: {squared_distances}")

# Step C: Average the squared distances
sum_squared = sum(squared_distances)
print(f"Sum of squared distances = {sum_squared}")

# Population variance divide by N
N = len(orders)
var_pop = sum_squared / N
print(f"Population variance = Sum/N = {sum_squared}/{N} = {var_pop}")

# Sample variance divide by n-1 (Bessel's correction)
var_sample = sum_squared / (N - 1)
print(f"Sample variance = Sum/(n-1) = {sum_squared}/{N-1} = {var_sample} - slightly larger, unbiased")

print(f"\nLow variance {var_pop} means all close to mean, consistent")
```

What this does: For each order, find how far from mean, square it, then average squares. Squaring makes negatives positive and punishes far values more.

**Step 2 Using sum() and list comprehension:**

```python
# Step 2: Shorter
orders = [11, 12, 12, 13, 12]
mean = sum(orders) / len(orders)
# List comprehension - one line to calculate all squared distances
squared_distances = [(x - mean)**2 for x in orders]
print(f"Squared distances: {squared_distances}")
var_pop = sum(squared_distances) / len(orders)
var_sample = sum(squared_distances) / (len(orders)-1)
print(f"Var pop {var_pop}, Var sample {var_sample}")
```

**Step 3 NumPy:**

```python
import numpy as np
orders = np.array([11, 12, 12, 13, 12])
mean = np.mean(orders)
var_pop = np.var(orders, ddof=0)  # ddof=0 divide by N population
var_sample = np.var(orders, ddof=1)  # ddof=1 divide by n-1 sample
print(f"Mean {mean}, Var pop (ddof=0) {var_pop}, Var sample (ddof=1) {var_sample}")

# Why ddof? Delta Degrees of Freedom - how many less than N you divide by
# ddof=0 divide by N, ddof=1 divide by N-1
```

**Step 4 Pandas:**

```python
import pandas as pd
df = pd.DataFrame({"total": [11,12,12,13,12]})
print(f"Pandas var pop {df['total'].var(ddof=0)}")  # Pandas default ddof=1 sample!
print(f"Pandas var sample {df['total'].var(ddof=1)} default is sample")
# Important: Pandas .var() default is sample (n-1), NumPy default is population (N)
```

**Important Difference:** Pandas .var() default ddof=1 (sample), NumPy np.var default ddof=0 (population). Always check!

---

## 3. Standard Deviation - Square Root of Variance, Same Units as Data

### What is Standard Deviation?

Variance is squared units. If orders are in Naira, variance is in Naira squared - hard to interpret.

Standard deviation = square root of variance. Same units as original data (Naira), easy to interpret.

If mean = 12k and std = 2k, you know typical order deviates about 2k from mean.

**For normal distribution:**
- About 68% of data within 1 std of mean (mean ± 1*std)
- About 95% within 2 std (mean ± 2*std)
- About 99.7% within 3 std (mean ± 3*std)

This is called empirical rule or 68-95-99.7 rule.

### Visual: Standard Deviation and 68-95-99.7 Rule

<svg width="100%" height="220" viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="220" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">STANDARD DEVIATION - SAME UNITS AS DATA, 68-95-99.7 RULE</text>
  
  <!-- Bell curve simplified -->
  <rect x="20" y="50" width="660" height="150" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
  <text x="350" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="700" fill="#1E40AF">Normal Distribution with Mean=12k, Std=2k</text>
  
  <!-- Axis -->
  <line x1="50" y1="160" x2="650" y2="160" stroke="#9CA3AF" stroke-width="1"/>
  <text x="50" y="175" font-family="Arial" font-size="8" fill="#6B7280">6k</text>
  <text x="150" y="175" font-family="Arial" font-size="8" fill="#6B7280">8k</text>
  <text x="250" y="175" font-family="Arial" font-size="8" fill="#6B7280">10k</text>
  <text x="350" y="175" font-family="Arial" font-size="9" font-weight="800" fill="#1E40AF">12k Mean</text>
  <text x="450" y="175" font-family="Arial" font-size="8" fill="#6B7280">14k</text>
  <text x="550" y="175" font-family="Arial" font-size="8" fill="#6B7280">16k</text>
  <text x="630" y="175" font-family="Arial" font-size="8" fill="#6B7280">18k</text>

  <!-- Bell shape using path -->
  <path d="M 50 160 Q 200 160 250 120 Q 300 60 350 50 Q 400 60 450 120 Q 500 160 650 160" fill="#BFDBFE" stroke="#2563EB" stroke-width="1.5" opacity="0.6"/>

  <!-- Std bands -->
  <rect x="250" y="90" width="200" height="70" fill="#DBEAFE" opacity="0.5"/>
  <text x="350" y="100" text-anchor="middle" font-family="Arial" font-size="8" fill="#1E40AF">68% within 1 std</text>
  <text x="350" y="115" text-anchor="middle" font-family="Arial" font-size="8" fill="#1E40AF">Mean ±1*Std = 10k to 14k</text>

  <text x="100" y="195" font-family="Arial" font-size="8" fill="#6B7280">Mean-3Std Mean-2Std Mean-1Std Mean Mean+1Std Mean+2Std Mean+3Std</text>
  <text x="350" y="210" text-anchor="middle" font-family="Arial" font-size="8" font-style="italic" fill="#374151">Std = √Variance, same units as data (Naira), easy to interpret. Small std = consistent, large std = variable.</text>
</svg>

### Code Step-by-Step - Standard Deviation

**Step 1 Plain Python:**

```python
# Step 1: Std is sqrt of variance
import math

orders = [11, 12, 12, 13, 12]
mean = sum(orders) / len(orders)
squared_distances = [(x-mean)**2 for x in orders]
var_pop = sum(squared_distances) / len(orders)

# Std = sqrt(var)
std_pop = math.sqrt(var_pop)  # sqrt() square root
print(f"Var pop {var_pop}, Std pop sqrt({var_pop}) = {std_pop}")

# Interpretation
print(f"Mean {mean}k, Std {std_pop:.2f}k - typical order deviates about {std_pop:.2f}k from mean")
print(f"68% of orders within {mean-std_pop:.2f}k to {mean+std_pop:.2f}k (if normal)")
```

**Step 2 NumPy:**

```python
import numpy as np
orders = np.array([11,12,12,13,12])
std_pop = np.std(orders, ddof=0)
std_sample = np.std(orders, ddof=1)
print(f"NumPy std pop {std_pop:.2f}, std sample {std_sample:.2f}")
```

**Step 3 Pandas:**

```python
import pandas as pd
df = pd.DataFrame({"total": [11,12,12,13,12]})
print(f"Pandas std pop {df['total'].std(ddof=0):.2f}, std sample {df['total'].std(ddof=1):.2f} default sample")
```

---

## 4. IQR - Interquartile Range, Robust Spread

### What is IQR?

IQR = Q3 - Q1. Middle 50% of data.

- Q1 = 25th percentile = 25% of data below it
- Q2 = Median = 50th percentile
- Q3 = 75th percentile = 75% of data below it

IQR covers middle 50% - from 25% to 75%. Robust to outliers because it ignores top 25% and bottom 25% extremes.

**Outlier detection using IQR (Tukey's rule):**
- Lower bound = Q1 - 1.5 * IQR
- Upper bound = Q3 + 1.5 * IQR
- Any value outside [lower, upper] is outlier.

This is how boxplots detect outliers.

### Visual: Quartiles and IQR

<svg width="100%" height="220" viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="220" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">IQR = Q3 - Q1 = MIDDLE 50% - ROBUST TO OUTLIERS</text>
  
  <rect x="20" y="50" width="660" height="150" rx="12" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1"/>
  <text x="350" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="700" fill="#065F46">Sorted Data: [5, 10, 11, 12, 13, 14, 15, 20, 100]</text>
  
  <!-- Number line -->
  <line x1="40" y1="120" x2="640" y2="120" stroke="#6B7280" stroke-width="2"/>
  
  <!-- Q1 -->
  <line x1="150" y1="100" x2="150" y2="140" stroke="#059669" stroke-width="2"/>
  <text x="150" y="95" text-anchor="middle" font-family="Arial" font-size="8" font-weight="800" fill="#065F46">Q1=10</text>
  <text x="150" y="155" text-anchor="middle" font-family="Arial" font-size="7" fill="#065F46">25% below</text>

  <!-- Median -->
  <line x1="350" y1="100" x2="350" y2="140" stroke="#2563EB" stroke-width="3"/>
  <text x="350" y="95" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#1E40AF">Median=12</text>
  <text x="350" y="155" text-anchor="middle" font-family="Arial" font-size="7" fill="#1E40AF">50% below</text>

  <!-- Q3 -->
  <line x1="500" y1="100" x2="500" y2="140" stroke="#059669" stroke-width="2"/>
  <text x="500" y="95" text-anchor="middle" font-family="Arial" font-size="8" font-weight="800" fill="#065F46">Q3=15</text>
  <text x="500" y="155" text-anchor="middle" font-family="Arial" font-size="7" fill="#065F46">75% below</text>

  <!-- IQR bracket -->
  <line x1="150" y1="80" x2="500" y2="80" stroke="#10B981" stroke-width="2"/>
  <line x1="150" y1="75" x2="150" y2="85" stroke="#10B981" stroke-width="2"/>
  <line x1="500" y1="75" x2="500" y2="85" stroke="#10B981" stroke-width="2"/>
  <text x="325" y="75" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#065F46">IQR = Q3-Q1 = 15-10=5 (middle 50%)</text>

  <!-- Outlier bounds -->
  <text x="350" y="180" text-anchor="middle" font-family="Arial" font-size="8" fill="#374151">Outlier bounds: Lower = Q1 -1.5*IQR =10-7.5=2.5, Upper= Q3+1.5*IQR=15+7.5=22.5</text>
  <text x="350" y="195" text-anchor="middle" font-family="Arial" font-size="8" fill="#DC2626">Values outside [2.5, 22.5] are outliers → 100 is outlier, 5 is not (but close)</text>
  <text x="350" y="210" text-anchor="middle" font-family="Arial" font-size="8" font-style="italic" fill="#065F46">IQR robust because it ignores bottom 25% and top 25% extremes, only middle 50%</text>
</svg>

### Code Step-by-Step - IQR and Outlier Detection

**Step 1 Plain Python - Percentiles:**

```python
# Step 1: Find Q1, Q3 manually - percentile is value below which % of data falls
orders = [5, 10, 11, 12, 13, 14, 15, 20, 100]
sorted_orders = sorted(orders)
n = len(sorted_orders)
print(f"Sorted: {sorted_orders}, n={n}")

# Simple percentile method: index = p*(n-1)
# Q1 25th percentile index = 0.25*(9-1)=2 -> value at index 2 = 11
# Q3 75th percentile index = 0.75*(9-1)=6 -> value at index 6 = 15
# Different methods exist, but concept same: 25% below Q1, 75% below Q3

# For simplicity use linear interpolation concept
def simple_percentile(data, p):
    # p between 0 and 100
    sorted_data = sorted(data)
    n = len(sorted_data)
    # Index = p/100 * (n-1)
    idx = (p/100) * (n-1)
    lower = int(idx)
    upper = lower + 1
    if upper >= n:
        return sorted_data[lower]
    # Interpolate between lower and upper
    weight = idx - lower
    return sorted_data[lower] * (1-weight) + sorted_data[upper] * weight

q1 = simple_percentile(orders, 25)
q3 = simple_percentile(orders, 75)
print(f"Q1 25th percentile = {q1}, Q3 75th percentile = {q3}")

iqr = q3 - q1
print(f"IQR = Q3-Q1 = {q3}-{q1} = {iqr} - middle 50% spread")

# Outlier bounds
lower_bound = q1 - 1.5 * iqr
upper_bound = q3 + 1.5 * iqr
print(f"Lower bound Q1-1.5*IQR = {q1}-1.5*{iqr} = {lower_bound}")
print(f"Upper bound Q3+1.5*IQR = {q3}+1.5*{iqr} = {upper_bound}")

outliers = [x for x in orders if x < lower_bound or x > upper_bound]
print(f"Outliers outside [{lower_bound}, {upper_bound}]: {outliers}")

print(f"\nIQR robust - outlier 100 does not affect Q1, Q3 much because it is in top 25% which IQR ignores")
```

**Step 2 NumPy:**

```python
import numpy as np
orders = np.array([5, 10, 11, 12, 13, 14, 15, 20, 100])
q1 = np.percentile(orders, 25)
q3 = np.percentile(orders, 75)
iqr = q3 - q1
print(f"NumPy Q1 {q1}, Q3 {q3}, IQR {iqr}")
print(f"Lower {q1-1.5*iqr}, Upper {q3+1.5*iqr}, Outliers {[x for x in orders if x < q1-1.5*iqr or x > q3+1.5*iqr]}")

# Also np.quantile 0-1 scale
q1_q = np.quantile(orders, 0.25)
print(f"np.quantile 0.25 = {q1_q} same as percentile 25")
```

**Step 3 Pandas:**

```python
import pandas as pd
df = pd.DataFrame({"total": [5, 10, 11, 12, 13, 14, 15, 20, 100]})
q1 = df["total"].quantile(0.25)
q3 = df["total"].quantile(0.75)
iqr = q3 - q1
print(f"Pandas Q1 {q1}, Q3 {q3}, IQR {iqr}")
print(f"Describe gives Q1, Q3, IQR info:")
print(df["total"].describe())
# describe shows count, mean, std, min, 25% (Q1), 50% (median), 75% (Q3), max
```

---

## 5. Coefficient of Variation - Compare Spread Across Different Means

### What is CV?

CV = (Std / Mean) * 100%. Unitless percentage, lets you compare spread of stores with different average sales.

If Store A mean 20 std 2 CV=10% and Store B mean 100 std 10 CV=10% - both equally consistent relative to their means, even though absolute std different.

Low CV (<20%) = consistent, High CV (>50%) = variable.

### Visual: CV

<svg width="100%" height="150" viewBox="0 0 700 150" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="150" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">COEFFICIENT OF VARIATION CV = STD / MEAN *100%</text>
  <rect x="20" y="50" width="300" height="80" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
  <text x="170" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="700" fill="#1E40AF">Store A: Mean 20, Std 2</text>
  <text x="170" y="90" text-anchor="middle" font-family="Arial" font-size="9" fill="#1E40AF">CV = 2/20*100% = 10% - Consistent</text>
  <text x="170" y="110" text-anchor="middle" font-family="Arial" font-size="8" fill="#6B7280">Small std relative to mean</text>
  <rect x="380" y="50" width="300" height="80" rx="12" fill="#FEF2F2" stroke="#FCA5A5" stroke-width="1"/>
  <text x="530" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="700" fill="#7F1D1D">Store B: Mean 100, Std 50</text>
  <text x="530" y="90" text-anchor="middle" font-family="Arial" font-size="9" fill="#7F1D1D">CV = 50/100*100% = 50% - Variable</text>
  <text x="530" y="110" text-anchor="middle" font-family="Arial" font-size="8" fill="#6B7280">Large std relative to mean</text>
</svg>

### Code - CV

```python
# CV calculation
mean_a = 20
std_a = 2
cv_a = (std_a / mean_a) * 100
print(f"Store A mean {mean_a} std {std_a} CV {cv_a:.1f}% consistent")

mean_b = 100
std_b = 50
cv_b = (std_b / mean_b) * 100
print(f"Store B mean {mean_b} std {std_b} CV {cv_b:.1f}% variable")

# Using real data
import numpy as np
orders_a = np.array([20,21,19,20,20])
orders_b = np.array([5,35,0,40,20])
cv_a_real = np.std(orders_a, ddof=1) / np.mean(orders_a) * 100
cv_b_real = np.std(orders_b, ddof=1) / np.mean(orders_b) * 100
print(f"\nReal Store A orders {orders_a} CV {cv_a_real:.1f}% consistent")
print(f"Real Store B orders {orders_b} CV {cv_b_real:.1f}% variable - same mean 20 but more risk")
```

---

## 6. Real Store Example - Where Location Adds Context

```python
import pandas as pd

orders_data = [
    {"order_id": "ORD_LAG_001_5001", "store_id": "LAG_001_Ikeja", "total": 53750},
    {"order_id": "ORD_LAG_001_5002", "store_id": "LAG_001_Ikeja", "total": 34400},
    {"order_id": "ORD_LAG_001_5003", "store_id": "LAG_001_Ikeja", "total": 50000},
    {"order_id": "ORD_LAG_002_5003", "store_id": "LAG_002_Lekki", "total": 91375},
    {"order_id": "ORD_LAG_002_5004", "store_id": "LAG_002_Lekki", "total": 80625},
    {"order_id": "ORD_LDN_001_2001", "store_id": "LDN_001_Camden", "total": 433},
]

df = pd.DataFrame(orders_data)
print(df)

# Group by store - location ID adds value for consistency comparison
for store_id in df["store_id"].unique():
    subset = df[df["store_id"]==store_id]["total"]
    if len(subset) > 1:
        mean = subset.mean()
        std = subset.std(ddof=1)
        cv = std/mean*100 if mean!=0 else 0
        q1 = subset.quantile(0.25)
        q3 = subset.quantile(0.75)
        iqr = q3-q1
        print(f"\n{store_id}:")
        print(f"  Orders {subset.tolist()}")
        print(f"  Mean {mean:.0f}, Std {std:.0f}, Range {subset.max()-subset.min():.0f}")
        print(f"  Q1 {q1:.0f}, Q3 {q3:.0f}, IQR {iqr:.0f}")
        print(f"  CV {cv:.1f}% - {'Consistent' if cv<20 else 'Variable' if cv<50 else 'Highly variable'}")
        # Outlier bounds per store
        lower = q1 - 1.5*iqr
        upper = q3 + 1.5*iqr
        outliers = subset[(subset<lower)|(subset>upper)].tolist()
        print(f"  Outlier bounds [{lower:.0f}, {upper:.0f}], Outliers {outliers}")

print(f"\nDon't mix NGN and GBP stores when comparing spread - different scales inflate CV artificially")
```

---

## 7. Hands-On Assignment - Simple to Advanced

Dataset: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - payment_value has outliers perfect for IQR

Create spread_stats_L02.py:

Section A Plain Python Range Var Std:

```python
orders=[10,12,13,11,14]
min_val=min(orders)
max_val=max(orders)
range_val=max_val-min_val
print(f"Range {range_val}")

mean=sum(orders)/len(orders)
squared=[(x-mean)**2 for x in orders]
var_pop=sum(squared)/len(orders)
var_sample=sum(squared)/(len(orders)-1)
import math
std_pop=math.sqrt(var_pop)
print(f"Var pop {var_pop} var sample {var_sample} std pop {std_pop}")
```

Section B NumPy Pandas:

```python
import numpy as np, pandas as pd
orders=np.array([10,12,13,11,14])
print(f"NumPy var pop {np.var(orders,ddof=0)} var sample {np.var(orders,ddof=1)} std {np.std(orders,ddof=0)}")
df=pd.DataFrame({"total":orders})
print(df["total"].describe())  # includes std min 25% 50% 75% max
```

Section C IQR Outlier:

```python
import numpy as np
orders=np.array([5,10,11,12,13,14,15,20,100])
q1=np.percentile(orders,25)
q3=np.percentile(orders,75)
iqr=q3-q1
lower=q1-1.5*iqr
upper=q3+1.5*iqr
outliers=[x for x in orders if x<lower or x>upper]
print(f"Q1 {q1} Q3 {q3} IQR {iqr} bounds [{lower},{upper}] outliers {outliers}")
```

Section D CV:

```python
import numpy as np
a=np.array([20,21,19,20,20])
b=np.array([5,35,0,40,20])
cv_a=np.std(a,ddof=1)/np.mean(a)*100
cv_b=np.std(b,ddof=1)/np.mean(b)*100
print(f"Store A CV {cv_a:.1f}% consistent vs Store B CV {cv_b:.1f}% variable same mean")
```

Section E Kaggle Real Data:

```python
import os, pandas as pd
if os.path.exists("olist_order_payments_dataset.csv"):
    df=pd.read_csv("olist_order_payments_dataset.csv", nrows=10000)
    vals=df["payment_value"].dropna()
    print(f"payment_value Mean {vals.mean():.2f} Median {vals.median():.2f} Std {vals.std():.2f} Range {vals.max()-vals.min():.2f}")
    q1=vals.quantile(0.25)
    q3=vals.quantile(0.75)
    iqr=q3-q1
    lower=q1-1.5*iqr
    upper=q3+1.5*iqr
    outliers=vals[(vals<lower)|(vals>upper)]
    print(f"Q1 {q1:.2f} Q3 {q3:.2f} IQR {iqr:.2f} bounds [{lower:.2f},{upper:.2f}] outliers {len(outliers)} ({len(outliers)/len(vals)*100:.1f}%)")
    print(f"After removing outliers mean {vals[(vals>=lower)&(vals<=upper)].mean():.2f} vs original {vals.mean():.2f} mean drops")
    print(f"CV {vals.std()/vals.mean()*100:.1f}%")
else:
    print("Download https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce")
```

Deliverable: Upload spread_stats_L02.py + output showing range, var pop/sample, std, IQR, CV, outlier bounds and count, mean drops after removing outliers.

Kaggle Links:
1. Primary https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce payment_value outliers perfect for IQR
2. Secondary https://www.kaggle.com/datasets/vivek468/superstore-dataset-final Sales by Region compare CV

## 8. Checklist
- Calculate range Max-Min simple but sensitive to outlier
- Calculate population var Sum(x-mean)^2/N and sample var Sum/(n-1) Bessel correction unbiased why n-1 better estimate
- Calculate std sqrt(var) same units 68-95-99.7 rule normal
- Calculate Q1 25th Q3 75th IQR Q3-Q1 middle 50% robust
- Outlier bounds Q1-1.5IQR Q3+1.5IQR Tukey rule flag outliers
- Calculate CV std/mean*100% unitless compare consistency different means low CV consistent
- Use pandas describe gives std min 25% 50% 75% max and np.percentile
- Explain IQR median robust mean std sensitive

Key Takeaway: Range simple sensitive. Var average squared distance pop N sample n-1 Bessel. Std sqrt var same units 68% within 1 std normal. IQR Q3-Q1 middle 50% robust outlier Q1-1.5IQR Q3+1.5IQR. CV std/mean*100% compares consistency.

