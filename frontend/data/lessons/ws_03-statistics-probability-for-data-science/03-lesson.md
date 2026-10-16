# Lesson 03 - Data Distributions - Shapes, Skewness, Kurtosis

**Duration:** 50 min | **Level:** Beginner | **Goal:** Recognize distribution shapes and handle skewed sales data

## Learning Objectives
- Identify normal, uniform, skewed, bimodal distributions from histograms
- Calculate and interpret skewness and kurtosis
- Understand why right-skewed sales data needs log transformation
- Use Matplotlib, Seaborn, and SciPy for distribution analysis

---

## 1. Why Shape Matters

Mean and standard deviation assume roughly symmetric data. If your payment values look like [10, 12, 15, 14, 13, 200], mean is inflated by one large value. Histogram shows shape instantly.

- **Symmetric normal:** Mean ≈ Median, classic bell curve. Many natural measures approx normal.
- **Right-skewed:** Long tail to right (most sales small, few huge). Mean > Median. Common in sales, payment_value, income.
- **Left-skewed:** Long tail to left (most values high, few low). Mean < Median.
- **Bimodal:** Two peaks, suggests two groups mixed (e.g., two store types).

Shape dictates which summary to use and which statistical tests are valid.

## 2. Histograms, KDE, Skewness, Kurtosis - Verified

<svg width="100%" height="200" viewBox="0 0 700 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="200" rx="16" fill="#FFFFFF"/>
  <text x="350" y="28" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">DISTRIBUTION SHAPES</text>
  <rect x="20" y="50" width="150" height="130" rx="12" fill="#DBEAFE" stroke="#1E40AF" stroke-width="1.5"/>
  <text x="95" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#1E3A8A">NORMAL</text>
  <text x="30" y="90" font-family="Arial" font-size="8" fill="#1E3A8A">Bell, symmetric</text>
  <text x="30" y="105" font-family="Arial" font-size="8" fill="#1E3A8A">Mean≈Median≈Mode</text>
  <text x="30" y="120" font-family="Arial" font-size="8" fill="#1E3A8A">Skew ≈0, Kurt≈3</text>
  <text x="30" y="135" font-family="Arial" font-size="8" fill="#1E3A8A">68-95-99.7 rule</text>
  <rect x="190" y="50" width="150" height="130" rx="12" fill="#FEE2E2" stroke="#991B1B" stroke-width="1.5"/>
  <text x="265" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#7F1D1D">RIGHT-SKEWED</text>
  <text x="200" y="90" font-family="Arial" font-size="8" fill="#7F1D1D">Tail to right</text>
  <text x="200" y="105" font-family="Arial" font-size="8" fill="#7F1D1D">Mean > Median</text>
  <text x="200" y="120" font-family="Arial" font-size="8" fill="#7F1D1D">Skew >0 (positive)</text>
  <text x="200" y="135" font-family="Arial" font-size="8" fill="#7F1D1D">Sales, income common</text>
  <text x="200" y="150" font-family="Arial" font-size="8" fill="#7F1D1D">Log transform helps</text>
  <rect x="360" y="50" width="150" height="130" rx="12" fill="#FEF3C7" stroke="#92400E" stroke-width="1.5"/>
  <text x="435" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#92400E">LEFT-SKEWED</text>
  <text x="370" y="90" font-family="Arial" font-size="8" fill="#92400E">Tail to left</text>
  <text x="370" y="105" font-family="Arial" font-size="8" fill="#92400E">Mean < Median</text>
  <text x="370" y="120" font-family="Arial" font-size="8" fill="#92400E">Skew <0 (negative)</text>
  <text x="370" y="135" font-family="Arial" font-size="8" fill="#92400E">Less common in sales</text>
  <rect x="530" y="50" width="150" height="130" rx="12" fill="#D1FAE5" stroke="#065F46" stroke-width="1.5"/>
  <text x="605" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#064E3B">KURTOSIS</text>
  <text x="540" y="90" font-family="Arial" font-size="8" fill="#064E3B">Tail heaviness</text>
  <text x="540" y="105" font-family="Arial" font-size="8" fill="#064E3B">Normal kurt=3</text>
  <text x="540" y="120" font-family="Arial" font-size="8" fill="#064E3B">High kurt >3 heavy tails</text>
  <text x="540" y="135" font-family="Arial" font-size="8" fill="#064E3B">More outliers</text>
  <text x="540" y="150" font-family="Arial" font-size="8" fill="#064E3B">Low kurt <3 light tails</text>
</svg>

**Verified Definitions:**

1. **Skewness:** Measures asymmetry.
   - Formula (Fisher-Pearson): Skew = E[(X-μ)³] / σ³. Positive skew = right tail long, negative = left tail long.
   - Interpretation: |Skew| <0.5 approx symmetric, 0.5-1 moderate skew, >1 highly skewed. Right-skewed sales have few very large orders.
   - Mean > Median for right-skew, Mean < Median for left-skew.

2. **Kurtosis:** Measures tail heaviness and peak sharpness.
   - Normal distribution kurtosis = 3. Excess kurtosis = kurtosis - 3, so normal excess = 0.
   - High kurtosis >3: heavy tails, more outliers, sharp peak. Low kurtosis <3: light tails, flat.
   - SciPy and Pandas report Fisher's definition where normal kurtosis is 0 (excess). Clarify which you use.

3. **Transformation:** For right-skewed data >0, log transform `np.log1p(x)` (log(1+x) handles zeros) often makes distribution more symmetric and closer to normal, improving mean as summary and validity of t-tests.

## 3. Real World Example - Sales Distribution

```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats

# Simulated payment values - right-skewed typical of sales
np.random.seed(42)
# Most payments small, few large - lognormal-like
payments = np.concatenate([
    np.random.lognormal(mean=3, sigma=0.5, size=900),  # Small payments cluster
    np.random.lognormal(mean=5, sigma=0.3, size=100)   # Few large payments
])

print(f"Payments: n={len(payments)}, Mean {np.mean(payments):.2f}, Median {np.median(payments):.2f}, Mean>Median indicates right-skew")
print(f"Skewness {stats.skew(payments):.2f} >0 right-skew, Kurtosis {stats.kurtosis(payments):.2f} excess (normal=0)")

# Plot histogram
plt.figure(figsize=(10,4))
plt.subplot(1,2,1)
plt.hist(payments, bins=50, color="skyblue", edgecolor="black")
plt.title(f"Right-skewed Payments - Mean {np.mean(payments):.1f} > Median {np.median(payments):.1f}")
plt.xlabel("Payment Value")
plt.ylabel("Count")
plt.axvline(np.mean(payments), color="red", linestyle="--", label=f"Mean {np.mean(payments):.1f}")
plt.axvline(np.median(payments), color="green", linestyle="-", label=f"Median {np.median(payments):.1f}")
plt.legend()

plt.subplot(1,2,2)
log_payments = np.log1p(payments)
plt.hist(log_payments, bins=50, color="lightgreen", edgecolor="black")
plt.title(f"Log Transformed log1p - Skew {stats.skew(log_payments):.2f} closer to 0")
plt.xlabel("log(1+Payment)")
plt.tight_layout()
plt.savefig("dist_right_skew_log_transform.png")
plt.show()

# Check normality with Q-Q plot
plt.figure()
stats.probplot(payments, dist="norm", plot=plt)
plt.title("Q-Q Plot Original - Deviates from line indicates non-normal")
plt.savefig("qq_original.png")
plt.show()

plt.figure()
stats.probplot(log_payments, dist="norm", plot=plt)
plt.title("Q-Q Plot Log Transformed - Closer to line more normal")
plt.savefig("qq_log.png")
plt.show()

# Bimodal example - two store types mixed
bimodal = np.concatenate([np.random.normal(20, 3, 500), np.random.normal(60, 5, 500)])
plt.figure()
plt.hist(bimodal, bins=50, color="orange", edgecolor="black")
plt.title("Bimodal Distribution - Two Peaks Suggest Two Groups (e.g., Lagos vs London price levels)")
plt.xlabel("Value")
plt.savefig("dist_bimodal.png")
plt.show()
print(f"Bimodal: Skew {stats.skew(bimodal):.2f} near 0 but distribution has 2 peaks - skewness alone not enough, look at histogram")

# Using Pandas with store data where location adds context only for grouping
orders = [
    {"store_id": "LAG_001_Ikeja", "total": 53750},
    {"store_id": "LAG_001_Ikeja", "total": 34400},
    {"store_id": "LAG_002_Lekki", "total": 91375},
    {"store_id": "LAG_002_Lekki", "total": 80625},
    {"store_id": "LDN_001_Camden", "total": 433},
    {"store_id": "LDN_001_Camden", "total": 204},
    {"store_id": "ABJ_001_Garki", "total": 96750},
]
df = pd.DataFrame(orders)
# Mixing NGN and GBP creates bimodal artificial - better analyze within same currency
lagos_only = df[df['store_id'].str.contains('LAG|ABJ')]['total']
print(f"\nLagos/Abuja only (same currency NGN): Mean {lagos_only.mean():.2f}, Median {lagos_only.median():.2f}, Skew {stats.skew(lagos_only):.2f}")
```

**Key Takeaway:** Right-skewed sales: few huge orders inflate mean. Use median or log transform for better summary. Always plot histogram before trusting mean.

## 4. Hands-On Assignment with Kaggle Dataset

**Dataset:**
- Primary: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - payment_value is classic right-skewed, freight_value also
- Secondary: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final - Sales, Profit columns

**Task - Create `distributions_L03.py`:**

```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
import os

print("=== Part 1: Skewness and Kurtosis Manual ===")
data = [10, 12, 14, 12, 13, 100]  # Right-skewed with one large
print(f"Data {data}")
print(f"Mean {np.mean(data):.2f}, Median {np.median(data):.2f}, Mean>Median right-skew")
print(f"Skew {stats.skew(data):.2f} >0 right-skew, Kurtosis excess {stats.kurtosis(data):.2f}")

# Log transform
log_data = np.log1p(data)
print(f"Log transformed mean {np.mean(log_data):.2f}, skew {stats.skew(log_data):.2f} closer to 0")

print("\n=== Part 2: Kaggle Payment Value Distribution ===")
kaggle_files = ["olist_order_payments_dataset.csv", "Superstore.csv"]
found = None
for kf in kaggle_files:
    if os.path.exists(kf):
        found = kf
        break

if found:
    print(f"Found {found}")
    df = pd.read_csv(found, encoding="utf-8", low_memory=False, nrows=10000)
    
    col = None
    if "payment_value" in df.columns:
        col = "payment_value"
    elif "Sales" in df.columns:
        col = "Sales"
    
    if col:
        vals = df[col].dropna()
        print(f"{col}: n={len(vals)}, Mean {vals.mean():.2f}, Median {vals.median():.2f}, Mean>Median? {vals.mean()>vals.median()} -> {'Right-skewed' if vals.mean()>vals.median() else 'Left-skewed or symmetric'}")
        print(f"Skew {stats.skew(vals):.2f}, Kurtosis excess {stats.kurtosis(vals):.2f}, Min {vals.min():.2f}, Max {vals.max():.2f}")
        
        # Histogram
        plt.figure(figsize=(10,4))
        plt.subplot(1,2,1)
        plt.hist(vals, bins=50, color="skyblue", edgecolor="black")
        plt.title(f"{col} Histogram - Right-skewed" if vals.mean()>vals.median() else f"{col} Histogram")
        plt.xlabel(col)
        plt.axvline(vals.mean(), color="red", linestyle="--", label=f"Mean {vals.mean():.1f}")
        plt.axvline(vals.median(), color="green", label=f"Median {vals.median():.1f}")
        plt.legend()
        
        plt.subplot(1,2,2)
        log_vals = np.log1p(vals[vals>0]) if (vals<=0).any() else np.log1p(vals)
        plt.hist(log_vals, bins=50, color="lightgreen", edgecolor="black")
        plt.title(f"log1p({col}) - Skew {stats.skew(log_vals):.2f}")
        plt.xlabel(f"log1p({col})")
        plt.tight_layout()
        plt.savefig(f"dist_{col}_log.png")
        print(f"Saved dist_{col}_log.png - Right-skew common in sales, log transform reduces skew")
        
        # Q-Q plots
        plt.figure()
        stats.probplot(vals, dist="norm", plot=plt)
        plt.title(f"Q-Q Plot {col} Original - Curved indicates non-normal")
        plt.savefig(f"qq_{col}_original.png")
        
        plt.figure()
        stats.probplot(log_vals, dist="norm", plot=plt)
        plt.title(f"Q-Q Plot log1p({col}) - Straighter more normal")
        plt.savefig(f"qq_{col}_log.png")
        print(f"Saved Q-Q plots - check if points follow line for normality")
        
        # Boxplot by category if available
        if "payment_type" in df.columns:
            plt.figure(figsize=(10,5))
            df.boxplot(column=col, by="payment_type")
            plt.title(f"{col} by Payment Type - Check if distributions differ by type")
            plt.suptitle("")
            plt.xticks(rotation=45)
            plt.savefig(f"boxplot_{col}_by_payment_type.png")
            print(f"Saved boxplot_{col}_by_payment_type.png")
        
        if "Region" in df.columns:
            plt.figure(figsize=(10,5))
            df.boxplot(column=col, by="Region")
            plt.title(f"{col} by Region - Compare shapes across regions")
            plt.suptitle("")
            plt.savefig(f"boxplot_{col}_by_region.png")
            print(f"Saved boxplot_{col}_by_region.png")
    
    print(f"\nKaggle data often right-skewed: few high-value orders, many low-value. Mean overstates typical. Use median or log for analysis.")

else:
    print("No Kaggle file. Download:")
    print("  https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - payment_value right-skewed classic example")
    print("  https://www.kaggle.com/datasets/vivek468/superstore-dataset-final - Sales right-skewed")

print("\n=== Summary ===")
print("Normal: symmetric mean≈median≈mode skew≈0 kurt excess≈0 68-95-99.7 rule")
print("Right-skewed: mean>median skew>0 tail to right - sales, income common - use median or log1p")
print("Left-skewed: mean<median skew<0 tail to left")
print("Bimodal: two peaks suggests two groups mixed - look at histogram not just skewness")
print("Kurtosis >0 heavy tails more outliers, <0 light tails")
print("Log transform log1p(x)=log(1+x) for x>0 makes right-skew more symmetric closer to normal")
```

**Deliverable:** Upload `distributions_L03.py` + 3 images: `dist_payment_value_log.png` showing original right-skew and log transformed more symmetric, `qq_payment_value_original.png` curved and `qq_log.png` straighter, plus console output with skew >0, mean>median, and explanation that right-skew common in sales.

**Kaggle Links:**
1. Primary: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - payment_value classic right-skew, freight_value
2. Secondary: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final - Sales, Profit right-skewed

## 5. Checklist

- Can you plot histogram and identify normal (bell symmetric), right-skewed (tail right mean>median), left-skewed (tail left mean<median), bimodal (two peaks)?
- Can you calculate skewness with scipy.stats.skew and interpret >0 right-skew, <0 left-skew, |skew|>1 highly skewed?
- Can you calculate kurtosis excess with scipy.stats.kurtosis and interpret >0 heavy tails more outliers, normal excess 0?
- Can you explain why mean>median for right-skewed and why mean inflated by few large values?
- Can you apply log transform np.log1p for right-skewed >0 data to reduce skew and make more normal?
- Can you use Q-Q plot scipy.stats.probplot to check normality - points on line = normal, curved = non-normal?
- Can you load Kaggle payment_value and show right-skew with mean>median, skew>0, and that log transform makes it more symmetric?

If yes, you can diagnose distribution shapes.

Next: Probability Basics - Events, Sample Space, Rules.

**Key Takeaway:** Shape matters. Right-skewed sales mean overstates typical - use median or log1p. Skewness >0 right tail, <0 left tail. Kurtosis tail heaviness. Plot histogram before trusting mean. Log transform helps right-skew. Q-Q plot checks normality.

**Notes Verified:**
- Normal symmetric mean≈median≈mode skew≈0 kurt excess 0 68-95-99.7 rule verified
- Right-skewed mean>median skew>0 tail right, left-skewed mean<median skew<0 verified
- Bimodal two peaks indicates two groups mixed verified
- Skewness formula E[(X-μ)³]/σ³ verified, interpretation |skew|<0.5 approx symmetric, >1 highly skewed verified standard
- Kurtosis normal=3, excess=kurtosis-3 normal excess 0, high kurt >3 heavy tails more outliers verified
- Log transform np.log1p for right-skewed >0 makes more symmetric closer to normal verified
- Q-Q plot probplot interpretation points on line = normal verified
