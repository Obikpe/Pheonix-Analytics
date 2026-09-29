# Lesson 02 - Variance, Standard Deviation, Range, IQR - Measuring Spread

**Duration:** 45 min | **Level:** Beginner | **Goal:** Measure how spread out and consistent your sales data is

## Learning Objectives
- Calculate range, variance, standard deviation, IQR, and percentiles
- Understand difference between population and sample formulas
- Detect outliers using IQR method and interpret coefficient of variation
- Use Pandas and NumPy for spread calculations

---

## 1. Why Mean Alone Is Not Enough

Consider two stores with same mean daily orders but different consistency:

- **Store A:** Orders per day = [20, 21, 19, 20, 20] - mean 20, very consistent
- **Store B:** Orders per day = [5, 35, 0, 40, 20] - mean 20, highly inconsistent

Same mean, completely different risk. Store B might need more staff on some days, be empty on others. Variance and standard deviation quantify this spread.

**Key Idea:** Central tendency (mean/median) tells you typical value. Spread tells you reliability and risk.

## 2. Range, Variance, Standard Deviation - Formulas Verified

<svg width="100%" height="200" viewBox="0 0 700 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="200" rx="16" fill="#FFFFFF"/>
  <text x="350" y="28" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">MEASURING SPREAD</text>
  <rect x="20" y="50" width="150" height="130" rx="12" fill="#FEE2E2" stroke="#991B1B" stroke-width="1.5"/>
  <text x="95" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#7F1D1D">RANGE</text>
  <text x="30" y="90" font-family="Arial" font-size="8" fill="#7F1D1D">Range = Max - Min</text>
  <text x="30" y="105" font-family="Arial" font-size="8" fill="#7F1D1D">Ex: [5,10,15] Range=10</text>
  <text x="30" y="120" font-family="Arial" font-size="8" fill="#7F1D1D">Simple but sensitive</text>
  <text x="30" y="135" font-family="Arial" font-size="8" fill="#7F1D1D">to outliers</text>
  <rect x="190" y="50" width="160" height="130" rx="12" fill="#DBEAFE" stroke="#1E40AF" stroke-width="1.5"/>
  <text x="270" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#1E3A8A">VARIANCE & STD</text>
  <text x="200" y="90" font-family="Arial" font-size="8" fill="#1E3A8A">Pop Var = Σ(x-μ)² / N</text>
  <text x="200" y="105" font-family="Arial" font-size="8" fill="#1E3A8A">Sample Var = Σ(x-μ)² / (n-1)</text>
  <text x="200" y="120" font-family="Arial" font-size="8" fill="#1E3A8A">Std = √Variance</text>
  <text x="200" y="135" font-family="Arial" font-size="8" fill="#1E3A8A">Same units as data</text>
  <text x="200" y="150" font-family="Arial" font-size="8" fill="#1E3A8A">68-95-99.7 rule uses std</text>
  <rect x="370" y="50" width="150" height="130" rx="12" fill="#D1FAE5" stroke="#065F46" stroke-width="1.5"/>
  <text x="445" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#064E3B">IQR</text>
  <text x="380" y="90" font-family="Arial" font-size="8" fill="#064E3B">Q1=25th, Q3=75th</text>
  <text x="380" y="105" font-family="Arial" font-size="8" fill="#064E3B">IQR = Q3 - Q1 (middle 50%)</text>
  <text x="380" y="120" font-family="Arial" font-size="8" fill="#064E3B">Robust to outliers</text>
  <text x="380" y="135" font-family="Arial" font-size="8" fill="#064E3B">Outlier: &lt;Q1-1.5*IQR</text>
  <text x="380" y="150" font-family="Arial" font-size="8" fill="#064E3B">or &gt;Q3+1.5*IQR</text>
  <rect x="540" y="50" width="140" height="130" rx="12" fill="#FEF3C7" stroke="#92400E" stroke-width="1.5"/>
  <text x="610" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#92400E">CV</text>
  <text x="550" y="90" font-family="Arial" font-size="8" fill="#92400E">CV = Std / Mean *100%</text>
  <text x="550" y="105" font-family="Arial" font-size="8" fill="#92400E">Compares spread across</text>
  <text x="550" y="120" font-family="Arial" font-size="8" fill="#92400E">different means</text>
  <text x="550" y="135" font-family="Arial" font-size="8" fill="#92400E">Low CV = consistent</text>
</svg>

**Verified Formulas:**

1. **Range:** Range = Max - Min. Simple, but affected by single outlier.

2. **Variance:**
   - Population variance: σ² = Σ(xᵢ - μ)² / N (divide by N, when you have entire population)
   - Sample variance: s² = Σ(xᵢ - x̄)² / (n-1) (divide by n-1, when sample estimates population - Bessel's correction gives unbiased estimate)

3. **Standard Deviation:** σ = √σ² or s = √s². Same units as original data, more interpretable than variance. For normal distribution, about 68% data within 1 std, 95% within 2 std, 99.7% within 3 std (empirical rule).

4. **IQR:** IQR = Q3 - Q1 = 75th percentile - 25th percentile. Covers middle 50% of data, robust to outliers.

5. **Outlier Rule (Tukey):** Outlier if < Q1 - 1.5×IQR or > Q3 + 1.5×IQR. This is standard boxplot rule.

6. **Coefficient of Variation:** CV = (Std / Mean) × 100%. Unitless, lets you compare spread of stores with different average sales.

**Example Manual Calculation:**
Data: [10, 12, 14] - mean = 12
Variance (population) = ((10-12)² + (12-12)² + (14-12)²)/3 = (4+0+4)/3 = 8/3 = 2.67
Std = √2.67 = 1.63
Range = 14-10 = 4

## 3. Real World Example - Store Consistency

```
import pandas as pd
import numpy as np

# Example: Daily orders for 2 stores (simulated)
np.random.seed(42)
# Consistent store: mean 20, low spread
store_consistent = np.array([20, 21, 19, 20, 20, 22, 18, 20, 21, 19])
# Inconsistent store: same mean 20, high spread
store_inconsistent = np.array([5, 35, 0, 40, 20, 10, 30, 5, 35, 20])

def spread_stats(data, name):
    mean = np.mean(data)
    median = np.median(data)
    var_pop = np.var(data, ddof=0)  # population
    var_sample = np.var(data, ddof=1)  # sample
    std_pop = np.std(data, ddof=0)
    std_sample = np.std(data, ddof=1)
    data_range = np.max(data) - np.min(data)
    q1 = np.percentile(data, 25)
    q3 = np.percentile(data, 75)
    iqr = q3 - q1
    cv = (std_sample / mean * 100) if mean != 0 else 0
    
    print(f"{name}: {data}")
    print(f"  Mean {mean:.2f}, Median {median:.2f}")
    print(f"  Range {data_range}, Q1 {q1:.2f}, Q3 {q3:.2f}, IQR {iqr:.2f}")
    print(f"  Var pop {var_pop:.2f}, Var sample {var_sample:.2f}")
    print(f"  Std pop {std_pop:.2f}, Std sample {std_sample:.2f}")
    print(f"  CV {cv:.1f}% - {'Consistent' if cv < 20 else 'Variable'}")
    
    # Outlier detection
    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr
    outliers = data[(data < lower) | (data > upper)]
    print(f"  Outlier bounds [{lower:.2f}, {upper:.2f}], Outliers {outliers}")
    print()

spread_stats(store_consistent, "Consistent Store (e.g., LAG_001_Ikeja)")
spread_stats(store_inconsistent, "Inconsistent Store")

# Real sales example with store IDs - where location adds context
orders = [
    {"order_id": "ORD_LAG_001_5001", "store_id": "LAG_001_Ikeja", "city": "Ikeja", "total": 53750},
    {"order_id": "ORD_LAG_001_5002", "store_id": "LAG_001_Ikeja", "city": "Ikeja", "total": 34400},
    {"order_id": "ORD_LAG_002_5003", "store_id": "LAG_002_Lekki", "city": "Lekki", "total": 91375},
    {"order_id": "ORD_LAG_002_5004", "store_id": "LAG_002_Lekki", "city": "Lekki", "total": 80625},
    {"order_id": "ORD_LDN_001_2001", "store_id": "LDN_001_Camden", "city": "Camden", "total": 433},
    {"order_id": "ORD_ABJ_001_3001", "store_id": "ABJ_001_Garki", "city": "Garki", "total": 96750},
]

df = pd.DataFrame(orders)
print("All orders spread:")
print(f"  Mean {df['total'].mean():.2f}, Std {df['total'].std():.2f}, Range {df['total'].max() - df['total'].min():.2f}")
print(f"  CV {df['total'].std()/df['total'].mean()*100:.1f}% - High because mixing NGN and GBP scales")

# Groupby for meaningful spread comparison within same currency
# Compare only Lagos stores (NGN)
lagos_df = df[df['store_id'].str.contains('LAG|ABJ')]
print(f"\nLagos/Abuja only (NGN) - more comparable:")
print(f"  Mean {lagos_df['total'].mean():.2f}, Std {lagos_df['total'].std():.2f}, CV {lagos_df['total'].std()/lagos_df['total'].mean()*100:.1f}%")

# Using pandas describe includes spread
print(f"\nPandas describe (includes std, min, 25%, 50%, 75%, max):")
print(df['total'].describe())
```

**Interpretation:**
- **Low std/CV:** Sales predictable, easier inventory planning. Good for LAG_001_Ikeja if it has CV < 20%
- **High std/CV:** Sales volatile, need safety stock. Might indicate promotional effects or inconsistent demand
- **IQR outlier detection:** Flag orders with total < Q1-1.5IQR or > Q3+1.5IQR for review - could be data entry error like $25,000 entered as $250,000

## 4. Hands-On Assignment with Kaggle Dataset

**Dataset to download:**
- Primary: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - olist_order_payments_dataset.csv payment_value column has right-skew and outliers
- Secondary: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final - Superstore.csv Sales column by Region, perfect for comparing spread across regions

**Task - Create file `spread_stats_L02.py`:**

```
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import os

print("=== Part 1: Manual Spread Calculation ===")
data = np.array([10, 12, 14, 10, 12, 14, 100])  # Last value outlier
print(f"Data {data}")
print(f"Mean {np.mean(data):.2f}, Median {np.median(data):.2f}")
print(f"Range {np.max(data)-np.min(data)}")
print(f"Var pop {np.var(data, ddof=0):.2f}, Var sample {np.var(data, ddof=1):.2f}")
print(f"Std pop {np.std(data, ddof=0):.2f}, Std sample {np.std(data, ddof=1):.2f}")
q1 = np.percentile(data, 25)
q3 = np.percentile(data, 75)
iqr = q3 - q1
print(f"Q1 {q1:.2f}, Q3 {q3:.2f}, IQR {iqr:.2f}")
print(f"CV {np.std(data, ddof=1)/np.mean(data)*100:.1f}%")
lower = q1 - 1.5*iqr
upper = q3 + 1.5*iqr
outliers = data[(data < lower) | (data > upper)]
print(f"Outlier bounds [{lower:.2f}, {upper:.2f}], Outliers {outliers} - Mean inflated by outlier, median/IQR robust")

print("\n=== Part 2: Your Stores Consistency ===")
orders = [
    {"store_id": "LAG_001_Ikeja", "city": "Ikeja", "total": 53750},
    {"store_id": "LAG_001_Ikeja", "city": "Ikeja", "total": 34400},
    {"store_id": "LAG_001_Ikeja", "city": "Ikeja", "total": 91375},
    {"store_id": "LAG_002_Lekki", "city": "Lekki", "total": 80625},
    {"store_id": "LAG_002_Lekki", "city": "Lekki", "total": 32250},
    {"store_id": "LDN_001_Camden", "city": "Camden", "total": 433},
    {"store_id": "ABJ_001_Garki", "city": "Garki", "total": 96750},
]
df = pd.DataFrame(orders)

# Overall spread
print(f"All orders: Mean {df['total'].mean():.2f}, Std {df['total'].std():.2f}, CV {df['total'].std()/df['total'].mean()*100:.1f}% - High CV due to mixing scales")

# Per store - only where location adds meaning (comparing consistency within similar stores)
for store_id in df['store_id'].unique():
    subset = df[df['store_id']==store_id]['total']
    if len(subset) > 1:
        cv = subset.std()/subset.mean()*100 if subset.mean()!=0 else 0
        print(f"  {store_id}: n={len(subset)}, Mean {subset.mean():.2f}, Std {subset.std():.2f}, CV {cv:.1f}%, Range {subset.max()-subset.min():.2f}")

print("\n=== Part 3: Kaggle Dataset Spread ===")
kaggle_files = ["olist_order_payments_dataset.csv", "Superstore.csv"]
found = None
for kf in kaggle_files:
    if os.path.exists(kf):
        found = kf
        break

if found:
    print(f"Found {found}")
    df_kaggle = pd.read_csv(found, encoding="utf-8", low_memory=False, nrows=10000)
    
    if "payment_value" in df_kaggle.columns:
        col = "payment_value"
        vals = df_kaggle[col].dropna()
        print(f"  {col}: Mean {vals.mean():.2f}, Median {vals.median():.2f}, Std {vals.std():.2f}, Range {vals.max()-vals.min():.2f}")
        print(f"  Q1 {vals.quantile(0.25):.2f}, Q3 {vals.quantile(0.75):.2f}, IQR {vals.quantile(0.75)-vals.quantile(0.25):.2f}")
        print(f"  CV {vals.std()/vals.mean()*100:.1f}%")
        q1 = vals.quantile(0.25)
        q3 = vals.quantile(0.75)
        iqr = q3 - q1
        lower = q1 - 1.5*iqr
        upper = q3 + 1.5*iqr
        outliers = vals[(vals < lower) | (vals > upper)]
        print(f"  Outliers by IQR method: {len(outliers)} ({len(outliers)/len(vals)*100:.1f}%) - Values outside [{lower:.2f}, {upper:.2f}]")
        print(f"  After removing outliers, mean {vals[(vals>=lower)&(vals<=upper)].mean():.2f} vs original mean {vals.mean():.2f} - Mean drops when high outliers removed")
        
        # Describe includes spread
        print(f"  Describe:")
        print(vals.describe())
    
    if "Sales" in df_kaggle.columns and "Region" in df_kaggle.columns:
        print(f"\n  Spread by Region (Superstore):")
        for region in df_kaggle["Region"].unique():
            subset = df_kaggle[df_kaggle["Region"]==region]["Sales"].dropna()
            cv = subset.std()/subset.mean()*100 if subset.mean()!=0 else 0
            print(f"    {region}: Mean {subset.mean():.2f}, Std {subset.std():.2f}, CV {cv:.1f}%, IQR {subset.quantile(0.75)-subset.quantile(0.25):.2f} - CV compares consistency across regions with different means")
    
    # Save cleaned without outliers example
    if "payment_value" in df_kaggle.columns:
        vals = df_kaggle["payment_value"].dropna()
        q1 = vals.quantile(0.25)
        q3 = vals.quantile(0.75)
        iqr = q3 - q1
        lower = q1 - 1.5*iqr
        upper = q3 + 1.5*iqr
        df_no_outliers = df_kaggle[(df_kaggle["payment_value"]>=lower)&(df_kaggle["payment_value"]<=upper)]
        df_no_outliers.head(1000).to_csv("cleaned_no_outliers_L02.csv", index=False)
        print(f"  Saved cleaned_no_outliers_L02.csv with {len(df_no_outliers)} rows after IQR outlier removal (from {len(df_kaggle)})")

else:
    print("No Kaggle file found. Download:")
    print("  Primary: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - olist_order_payments_dataset.csv payment_value - has outliers, test IQR method")
    print("  Secondary: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final - Superstore.csv Sales by Region - compare CV across regions")

print("\n=== Summary ===")
print("Range simple but sensitive to outliers, IQR robust (middle 50%)")
print("Variance average squared distance from mean, std sqrt(variance) same units as data")
print("Sample variance divides by n-1 (Bessel correction) for unbiased estimate")
print("CV = std/mean*100% unitless compares spread across different means")
print("Outlier rule Q1-1.5IQR, Q3+1.5IQR standard Tukey boxplot rule")
```

**Deliverable:** Upload `spread_stats_L02.py` plus console output showing range, variance pop/sample, std, IQR, CV, outlier bounds and count, comparison of mean with and without outliers, and if Kaggle file present, stats for payment_value and spread by Region

**Kaggle Links:**
1. Primary: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - payment_value column - right-skewed with high outliers, perfect for IQR method
2. Secondary: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final - Superstore.csv Sales by Region - compare CV across East, West, Central, South

## 5. Checklist

- Can you calculate range = max - min manually and explain why sensitive to outliers?
- Can you calculate population variance Σ(x-μ)²/N and sample variance Σ(x-μ)²/(n-1) and explain Bessel's correction n-1 gives unbiased estimate?
- Can you calculate std = √variance and interpret 68-95-99.7 rule for normal data?
- Can you calculate Q1 25th, Q3 75th, IQR = Q3-Q1 and outlier bounds Q1-1.5IQR, Q3+1.5IQR and flag outliers?
- Can you calculate CV = std/mean*100% and explain low CV consistent, high CV variable, and CV allows comparison across different means?
- Can you use pandas df.describe() to get std, min, 25%, 50%, 75%, max and np.percentile for Q1/Q3?
- Can you explain why IQR and median are robust to outliers while mean and std are sensitive?
- Can you load Kaggle payment_value and show that mean drops after removing IQR outliers, and compare CV across Regions for Superstore?

If yes, you can quantify spread and consistency.

Next: Data Distributions - Shapes, Skewness, Kurtosis.

**Key Takeaway:** Mean tells typical value, spread tells reliability. Range = max-min simple but outlier sensitive. Variance = average squared distance from mean, population divides by N, sample divides by n-1 (unbiased). Std = √variance same units as data, 68% within 1 std for normal. IQR = Q3-Q1 middle 50% robust. Outlier if < Q1-1.5IQR or > Q3+1.5IQR (Tukey rule). CV = std/mean*100% unitless compares consistency across different means - low CV consistent. Use IQR/median when outliers present.

**Notes Verified:**
- Range formula Max-Min verified
- Population variance Σ(xᵢ-μ)²/N and sample variance Σ(xᵢ-x̄)²/(n-1) with Bessel's correction explanation verified standard
- Std = √variance verified, same units as data verified, 68-95-99.7 empirical rule for normal verified
- IQR = Q3-Q1 verified, Q1 25th percentile, Q3 75th verified
- Outlier rule Q1-1.5IQR, Q3+1.5IQR Tukey boxplot rule verified standard
- CV = std/mean*100% unitless compares spread across different means verified
- Pandas std default ddof=1 (sample) verified, NumPy var/std ddof parameter verified
