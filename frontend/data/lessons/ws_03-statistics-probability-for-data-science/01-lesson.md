# WS_03 Lesson 01 - Descriptive Statistics - Mean, Median, Mode

**Duration:** 45 min | **Level:** Beginner | **Goal:** Summarize sales data with central tendency correctly

## Learning Objectives
- Calculate mean, median, mode and understand when each is appropriate
- Explain why mean is sensitive to outliers while median is robust
- Use Pandas and NumPy to compute descriptive stats on real sales data

---

## 1. Why Central Tendency Matters

<svg width="100%" height="190" viewBox="0 0 700 190" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="190" rx="16" fill="#FFFFFF"/>
  <text x="350" y="28" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">MEAN vs MEDIAN vs MODE</text>
  <rect x="20" y="50" width="200" height="120" rx="12" fill="#FEE2E2" stroke="#991B1B" stroke-width="1.5"/>
  <text x="120" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#7F1D1D">MEAN - Average</text>
  <text x="35" y="90" font-family="Arial" font-size="9" fill="#7F1D1D">Sum all / count</text>
  <text x="35" y="105" font-family="Arial" font-size="9" fill="#7F1D1D">Sensitive to outlier</text>
  <text x="35" y="120" font-family="Arial" font-size="9" fill="#7F1D1D">100, 120, 130, 1000 -></text>
  <text x="35" y="135" font-family="Arial" font-size="9" fill="#7F1D1D">Mean 337.5 inflated</text>
  <text x="35" y="150" font-family="Arial" font-size="9" fill="#7F1D1D">Use when symmetric</text>
  <rect x="250" y="50" width="200" height="120" rx="12" fill="#DBEAFE" stroke="#1E40AF" stroke-width="1.5"/>
  <text x="350" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#1E3A8A">MEDIAN - Middle</text>
  <text x="265" y="90" font-family="Arial" font-size="9" fill="#1E3A8A">Sort, pick middle</text>
  <text x="265" y="105" font-family="Arial" font-size="9" fill="#1E3A8A">Robust to outlier</text>
  <text x="265" y="120" font-family="Arial" font-size="9" fill="#1E3A8A">100, 120, 130, 1000 -></text>
  <text x="265" y="135" font-family="Arial" font-size="9" fill="#1E3A8A">Median 125 realistic</text>
  <text x="265" y="150" font-family="Arial" font-size="9" fill="#1E3A8A">Use when skewed</text>
  <rect x="480" y="50" width="200" height="120" rx="12" fill="#D1FAE5" stroke="#065F46" stroke-width="1.5"/>
  <text x="580" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#064E3B">MODE - Frequent</text>
  <text x="495" y="90" font-family="Arial" font-size="9" fill="#064E3B">Most common value</text>
  <text x="495" y="105" font-family="Arial" font-size="9" fill="#064E3B">For categorical</text>
  <text x="495" y="120" font-family="Arial" font-size="9" fill="#064E3B">Ikeja, Lekki, Ikeja -></text>
  <text x="495" y="135" font-family="Arial" font-size="9" fill="#064E3B">Mode Ikeja</text>
  <text x="495" y="150" font-family="Arial" font-size="9" fill="#064E3B">Use for categories</text>
</svg>

If sales are $100, $120, $130, $1000 - mean is $337.5 but median is $125. The $1000 outlier inflates mean. For skewed sales data, median better represents typical order.

## 2. Definitions - Verified

**Mean (Arithmetic Mean):**
Formula: mean = sum(x_i) / n
Example: mean of [100, 120, 130] = (100+120+130)/3 = 116.67
Use when data symmetric, no extreme outliers. Sensitive to outliers.

**Median:**
Formula: Sort data, middle value. If even count, average of two middle.
Example: [100, 120, 130, 1000] sorted -> [100, 120, 130, 1000] median = (120+130)/2 = 125
Robust to outliers. Use when skewed.

**Mode:**
Most frequent value. Can have multiple modes or no mode.
Example: [Ikeja, Lekki, Ikeja, VI] mode = Ikeja
Use for categorical data, or to find most common price.

Verified: These definitions standard in statistics textbooks.

## 3. Python Implementation

**Real Example 1 - Basic calculation:**

```
import numpy as np
import pandas as pd

# Sales data example - 6 orders
sales = [25000, 32000, 15000, 120000, 18000, 25000]

mean_sales = np.mean(sales)
median_sales = np.median(sales)
# Mode with pandas or scipy
mode_sales = pd.Series(sales).mode().iloc[0]

print(f"Sales: {sales}")
print(f"Mean: {mean_sales:.2f}")  # 40833.33 - inflated by 120000
print(f"Median: {median_sales:.2f}")  # 25000 - more realistic typical
print(f"Mode: {mode_sales}")  # 25000 - most frequent

# With outlier explanation
print(f"\nWithout outlier 120000:")
sales_no_outlier = [25000, 32000, 15000, 18000, 25000]
print(f"Mean: {np.mean(sales_no_outlier):.2f} vs Median: {np.median(sales_no_outlier):.2f} - now close")

# Pandas DataFrame example
orders = [
    {"order_id": "ORD_LAG_001_5001", "store_id": "LAG_001_Ikeja", "price": 25000},
    {"order_id": "ORD_LAG_002_5002", "store_id": "LAG_002_Lekki", "price": 32000},
    {"order_id": "ORD_LAG_003_5003", "store_id": "LAG_001_Ikeja", "price": 15000},
    {"order_id": "ORD_LDN_001_2001", "store_id": "LDN_001_Camden", "price": 120000},
]

df = pd.DataFrame(orders)
print(f"\nDataFrame mean: {df['price'].mean():.2f}")
print(f"DataFrame median: {df['price'].median():.2f}")
print(f"DataFrame mode: {df['price'].mode().iloc[0]}")
print(f"DataFrame value_counts for store_id (mode for categorical):")
print(df['store_id'].value_counts())
# Mode for store_id = LAG_001_Ikeja appears 2 times
```

Mean vs median difference shows skewness. When mean >> median, right-skewed (few high values).

**Real Example 2 - With Kaggle data:**

```
import pandas as pd
import numpy as np
import os

# Load Kaggle file if exists
kaggle_file = "olist_order_payments_dataset.csv"

if os.path.exists(kaggle_file):
    df_kaggle = pd.read_csv(kaggle_file, nrows=10000)
    print(f"Loaded {kaggle_file} shape {df_kaggle.shape}")
    
    # Payment_value is numeric - often right-skewed
    payment = df_kaggle['payment_value'].dropna()
    
    print(f"payment_value stats:")
    print(f"  Count: {len(payment)}")
    print(f"  Mean: {payment.mean():.2f}")
    print(f"  Median: {payment.median():.2f}")
    print(f"  Mode: {payment.mode().iloc[0] if not payment.mode().empty else 'No mode'}")
    print(f"  Mean vs Median difference: {payment.mean() - payment.median():.2f}")
    
    if payment.mean() > payment.median() * 1.2:
        print(f"  Right-skewed: mean {payment.mean():.2f} > median {payment.median():.2f} - few high payments inflate mean")
        print(f"  Recommendation: Use median for typical payment")
    else:
        print(f"  Roughly symmetric")
    
    # Also describe
    print(f"\n  Describe:")
    print(payment.describe())
    
else:
    print(f"{kaggle_file} not found. Download from https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce")
    print(f"File has payment_value column - perfect for mean/median/mode lesson")
    print(f"Alternative: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final - Sales column")
    
    # Simulate with sample data
    np.random.seed(42)
    # Right-skewed sales: most orders small, few large
    sample_sales = np.concatenate([
        np.random.randint(10000, 40000, 90),  # 90 small orders
        np.random.randint(100000, 200000, 10)  # 10 large orders
    ])
    
    print(f"\nSimulated 100 sales (90 small 10k-40k, 10 large 100k-200k):")
    print(f"  Mean: {sample_sales.mean():.2f}")
    print(f"  Median: {np.median(sample_sales):.2f}")
    print(f"  Mean > Median by {sample_sales.mean() - np.median(sample_sales):.2f} - right skewed")
```

Kaggle Olist payment_value is typically right-skewed, making median better for typical order.

## 4. When to Use Which - Decision Guide

| Situation | Use | Why |
|-----------|-----|-----|
| Symmetric data, no outliers | Mean | Uses all data, mathematically convenient |
| Skewed data, outliers | Median | Robust, represents typical value |
| Categorical data | Mode | Most frequent category |
| Need most common price | Mode | Shows popular price point |
| Reporting to manager about typical order | Median | Not inflated by few huge orders |
| Calculating total revenue | Mean * count | Mean needed for total = mean * n |

Verified: Standard guidance in introductory statistics.

## 5. Hands-On Assignment

**Assignment 01: Descriptive Stats with Kaggle**

**Dataset:**
- Primary: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - olist_order_payments_dataset.csv payment_value column (100k values, right-skewed, perfect for mean vs median)
- Secondary: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final - Superstore.csv Sales column (9k values)
- Tertiary: https://www.kaggle.com/datasets/carrie1/ecommerce-data - data.csv Quantity and UnitPrice

Download olist_order_payments_dataset.csv

**Task - Create file `descriptive_stats_L01.py`:**

```
import pandas as pd
import numpy as np
import os
import matplotlib.pyplot as plt

print("=== L01 Descriptive Statistics ===")

# Part 1: Your store data
orders = [
    {"order_id": "ORD_LAG_001_5001", "store_id": "LAG_001_Ikeja", "price": 25000},
    {"order_id": "ORD_LAG_002_5002", "store_id": "LAG_002_Lekki", "price": 32000},
    {"order_id": "ORD_LAG_003_5003", "store_id": "LAG_001_Ikeja", "price": 15000},
    {"order_id": "ORD_LDN_001_2001", "store_id": "LDN_001_Camden", "price": 120000},
    {"order_id": "ORD_ABJ_001_3001", "store_id": "ABJ_001_Garki", "price": 18000},
    {"order_id": "ORD_LAG_001_5004", "store_id": "LAG_001_Ikeja", "price": 25000},
]

df = pd.DataFrame(orders)
print(f"Your stores data shape {df.shape}")
print(df)

mean_price = df['price'].mean()
median_price = df['price'].median()
mode_price = df['price'].mode().iloc[0]
mode_store = df['store_id'].mode().iloc[0]

print(f"\nYour stores stats:")
print(f"  Mean price: {mean_price:.2f}")
print(f"  Median price: {median_price:.2f}")
print(f"  Mode price: {mode_price}")
print(f"  Mode store_id (most frequent store): {mode_store}")
print(f"  Mean vs Median diff: {mean_price - median_price:.2f} - {'Right skewed' if mean_price > median_price else 'Left skewed or symmetric'}")

# Part 2: Kaggle dataset
kaggle_files = ["olist_order_payments_dataset.csv", "Superstore.csv", "data.csv"]
found = None
for kf in kaggle_files:
    if os.path.exists(kf):
        found = kf
        break

if found:
    print(f"\nFound Kaggle file {found}")
    df_kaggle = pd.read_csv(found, low_memory=False, nrows=10000)
    print(f"  Shape {df_kaggle.shape}")
    
    # Find numeric column
    numeric_col = None
    for col in ['payment_value', 'Sales', 'UnitPrice', 'price']:
        if col in df_kaggle.columns:
            numeric_col = col
            break
    
    if numeric_col:
        series = pd.to_numeric(df_kaggle[numeric_col], errors='coerce').dropna()
        print(f"  Column {numeric_col} stats:")
        print(f"    Count {len(series)}")
        print(f"    Mean {series.mean():.2f}")
        print(f"    Median {series.median():.2f}")
        print(f"    Mode {series.mode().iloc[0] if not series.mode().empty else 'N/A'}")
        print(f"    Mean - Median = {series.mean() - series.median():.2f}")
        
        if series.mean() > series.median() * 1.2:
            print(f"    Right-skewed: mean inflated by high values, use median for typical")
        elif series.median() > series.mean() * 1.2:
            print(f"    Left-skewed")
        else:
            print(f"    Roughly symmetric")
        
        print(f"\n  Full describe:")
        print(series.describe())
        
        # Plot histogram to see skew
        plt.figure(figsize=(10,4))
        plt.subplot(1,2,1)
        plt.hist(series, bins=50, edgecolor='black')
        plt.title(f"{numeric_col} histogram - see skew")
        plt.xlabel(numeric_col)
        plt.ylabel("Count")
        
        plt.subplot(1,2,2)
        plt.boxplot(series, vert=False)
        plt.title(f"{numeric_col} boxplot - outliers")
        plt.tight_layout()
        plt.savefig("L01_descriptive_histogram.png")
        print(f"  Saved L01_descriptive_histogram.png")
    
    if 'store_id' in df_kaggle.columns or 'City' in df_kaggle.columns:
        cat_col = 'store_id' if 'store_id' in df_kaggle.columns else 'City' if 'City' in df_kaggle.columns else 'customer_city' if 'customer_city' in df_kaggle.columns else None
        if cat_col:
            print(f"\n  Categorical {cat_col} mode:")
            print(df_kaggle[cat_col].value_counts().head(5))
            print(f"  Mode = {df_kaggle[cat_col].mode().iloc[0]}")
    
else:
    print(f"\nNo Kaggle file found. Download:")
    print(f"  Primary: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - payment_value")
    print(f"  Secondary: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final - Sales")
    
    # Simulate
    np.random.seed(42)
    sim = np.concatenate([np.random.randint(10000, 40000, 90), np.random.randint(100000, 200000, 10)])
    print(f"\nSimulated 100 sales: Mean {sim.mean():.2f}, Median {np.median(sim):.2f}, Mode {pd.Series(sim).mode().iloc[0]}")

print("\n=== Summary ===")
print(f"Mean sensitive to outlier 120000, median robust at 25000")
print(f"For right-skewed sales, median better for typical order")
print(f"Mode useful for most frequent store_id or product")
```

**Deliverable:**
- `descriptive_stats_L01.py` with outputs
- Mean, median, mode for your store data and Kaggle payment_value or Sales
- Explanation of which to use and why (right-skewed -> median)
- Histogram image L01_descriptive_histogram.png showing skew

**Kaggle Links:**
- Primary: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - payment_value right-skewed perfect for mean vs median lesson
- Secondary: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final - Sales column

## 6. Checklist

- Can you calculate mean sum/n, median middle sorted, mode most frequent and explain difference?
- Can you explain why mean 40833 inflated by outlier 120000 while median 25000 robust?
- Can you compute with NumPy np.mean, np.median and Pandas df.mean(), median(), mode()?
- Can you identify right-skewed when mean > median and recommend median for typical value?
- Can you find mode for categorical store_id LAG_001_Ikeja most frequent?
- Can you load Kaggle olist_order_payments_dataset.csv payment_value and report mean vs median and skewness?

If yes, you understand central tendency.

Next: Variance, Standard Deviation, Range, IQR.

**Key Takeaway:** Mean = average, sensitive to outliers, use when symmetric. Median = middle sorted, robust to outliers, use when skewed. Mode = most frequent, use for categorical like most frequent store_id LAG_001_Ikeja. For sales data $100, $120, $130, $1000, mean $337.5 inflated, median $125 realistic. Kaggle Olist payment_value right-skewed, median better for typical order.
