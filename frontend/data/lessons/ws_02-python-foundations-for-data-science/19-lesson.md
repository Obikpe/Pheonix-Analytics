# Lesson 19 - Introduction to NumPy - Arrays for Data

**Duration:** 75 min | **Level:** Intermediate | **Goal:** Replace slow loops with fast NumPy arrays for sales calculations across Lagos and London stores

## Learning Objectives
- Create NumPy arrays from lists and Kaggle CSV data.
- Use vectorized operations to calculate totals, taxes, and profits for thousands of orders without loops.
- Apply broadcasting, filtering, and aggregation for store-wise reports.

---

## 1. Why NumPy Beats Python Lists

<svg width="100%" height="190" viewBox="0 0 700 190" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="190" rx="16" fill="#FFFFFF"/>
  <text x="350" y="28" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">LIST LOOP vs NUMPY VECTORIZED</text>
  <rect x="20" y="50" width="200" height="120" rx="12" fill="#FEE2E2" stroke="#991B1B" stroke-width="1.5"/>
  <text x="120" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#7F1D1D">PYTHON LIST - Loop</text>
  <text x="35" y="90" font-family="Arial" font-size="9" fill="#7F1D1D">prices = [25000, 32000, 120.5]</text>
  <text x="35" y="105" font-family="Arial" font-size="9" fill="#7F1D1D">totals = []</text>
  <text x="35" y="120" font-family="Arial" font-size="9" fill="#7F1D1D">for p in prices: totals.append(p*1.075)</text>
  <text x="35" y="135" font-family="Arial" font-size="9" fill="#7F1D1D">Slow for 100k Olist rows</text>
  <text x="35" y="150" font-family="Arial" font-size="9" fill="#7F1D1D">1M loops = 2 sec</text>
  <rect x="250" y="50" width="200" height="120" rx="12" fill="#DBEAFE" stroke="#1E40AF" stroke-width="1.5"/>
  <text x="350" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#1E3A8A">NUMPY - Vectorized</text>
  <text x="265" y="90" font-family="Arial" font-size="9" fill="#1E3A8A">prices = np.array([25000, 32000, 120.5])</text>
  <text x="265" y="105" font-family="Arial" font-size="9" fill="#1E3A8A">totals = prices * 1.075</text>
  <text x="265" y="120" font-family="Arial" font-size="9" fill="#1E3A8A">No loop, C-level fast</text>
  <text x="265" y="135" font-family="Arial" font-size="9" fill="#1E3A8A">100k rows = 0.01 sec</text>
  <text x="265" y="150" font-family="Arial" font-size="9" fill="#1E3A8A">100x faster</text>
  <rect x="480" y="50" width="200" height="120" rx="12" fill="#D1FAE5" stroke="#065F46" stroke-width="1.5"/>
  <text x="580" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#064E3B">BENEFIT FOR STORES</text>
  <text x="495" y="90" font-family="Arial" font-size="9" fill="#064E3B">LAG_001_Ikeja 50k orders</text>
  <text x="495" y="105" font-family="Arial" font-size="9" fill="#064E3B">Tax 7.5% applied in one line</text>
  <text x="495" y="120" font-family="Arial" font-size="9" fill="#064E3B">LDN_001_Camden 20% VAT</text>
  <text x="495" y="135" font-family="Arial" font-size="9" fill="#064E3B">All stores at once</text>
  <text x="495" y="150" font-family="Arial" font-size="9" fill="#064E3B">Kaggle 100k ready</text>
</svg>

Python loop for 100k orders from LAG_001_Ikeja, LAG_002_Lekki, LDN_001_Camden takes 2 seconds. NumPy does same in 0.01 sec with one line `prices * 1.075`. For Kaggle Olist 100k orders, NumPy is essential.

## 2. Creating Arrays - Real Store Data

**Real World Example 1 - From lists:**

```
import numpy as np

# Sales amounts from Lagos stores
lagos_sales = np.array([25000, 32000, 15000, 40000, 18000])
print(lagos_sales)  # [25000 32000 15000 40000 18000]
print(f"Type: {type(lagos_sales)}, Dtype: {lagos_sales.dtype}")

# With store IDs as separate array
store_ids = np.array(["LAG_001_Ikeja", "LAG_002_Lekki", "LAG_003_VI", "LAG_001_Ikeja", "ABJ_001_Garki"])
order_ids = np.array(["ORD_LAG_001_5001", "ORD_LAG_002_5002", "ORD_LAG_003_5003", "ORD_LAG_001_5004", "ORD_ABJ_001_3001"])

# Prices and quantities as 2D array
# Each row: [price, qty]
prices_qty = np.array([
    [25000, 2],
    [32000, 1],
    [15000, 3],
    [40000, 1],
    [18000, 2]
])
print(prices_qty)
print(f"Shape: {prices_qty.shape}")  # (5, 2) - 5 orders, 2 columns

# Create arrays with np.zeros, np.ones, np.arange
zeros = np.zeros(5)
print(f"Zeros for 5 new products LAG_001: {zeros}")

# Price range for new stock
price_range = np.arange(10000, 50000, 5000)  # 10000 to 45000 step 5000
print(f"Price range for LAG_001_Ikeja: {price_range}")

# Random sales simulation for 100 orders
np.random.seed(42)
random_sales = np.random.randint(5000, 100000, size=100)  # 100 random sales between 5k and 100k
print(f"Random 100 sales for LAG_001_Ikeja: mean {random_sales.mean():.2f}, max {random_sales.max()}")
```

**Real World Example 2 - From Kaggle CSV with NumPy:**

```
import numpy as np
import csv

# Load numeric columns from Kaggle file using numpy
# For olist_order_payments_dataset.csv - has payment_value

def load_payments_numpy(filepath):
    payments = []
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                val = float(row.get("payment_value", "0"))
                payments.append(val)
            except:
                continue
    return np.array(payments)

# Test with small sample
sample_payments = np.array([25000, 32000, 15000, 40000, 120.5, 85.5, 200.0, 150.0])
print(f"Sample payments array: {sample_payments}")
print(f"Mean: {sample_payments.mean():.2f}, Median: {np.median(sample_payments):.2f}, Std: {sample_payments.std():.2f}")
```

## 3. Vectorized Operations - No Loops

**Real World Example 3 - Calculate totals, tax per location:**

```
import numpy as np

# Your stores data
orders = np.array([
    # price, qty, store tax rate: Lagos 7.5%, London 20%, Abuja 7.5%
    [25000, 2, 0.075],  # ORD_LAG_001_5001 LAG_001_Ikeja Ikeja Lagos NG
    [32000, 1, 0.075],  # ORD_LAG_002_5002 LAG_002_Lekki Lekki Lagos NG
    [120.5, 3, 0.20],   # ORD_LDN_001_2001 LDN_001_Camden Camden London UK
    [15000, 2, 0.075],  # ORD_ABJ_001_3001 ABJ_001_Garki Garki Abuja NG
    [40000, 1, 0.075],  # ORD_LAG_003_5003 LAG_003_VI VI Lagos NG
])

prices = orders[:, 0]  # First column
qty = orders[:, 1]
tax_rates = orders[:, 2]

print(f"Prices: {prices}")
print(f"Qty: {qty}")
print(f"Tax rates: {tax_rates}")

# Vectorized - no loop
subtotals = prices * qty
totals_with_tax = subtotals * (1 + tax_rates)
discounts = np.where(qty >= 2, 0.10, 0.0)  # 10% discount if qty >=2
totals_after_discount = subtotals * (1 - discounts) * (1 + tax_rates)

print(f"Subtotals: {subtotals}")
print(f"Totals with tax: {totals_with_tax}")
print(f"Discounts: {discounts}")
print(f"Totals after discount + tax: {totals_after_discount}")

# Apply different tax per store_id array
store_ids = np.array(["LAG_001_Ikeja", "LAG_002_Lekki", "LDN_001_Camden", "ABJ_001_Garki", "LAG_003_VI"])
# Map store to tax
tax_map = {"LAG_001_Ikeja": 0.075, "LAG_002_Lekki": 0.075, "LAG_003_VI": 0.075, "ABJ_001_Garki": 0.075, "LDN_001_Camden": 0.20}
tax_rates_map = np.array([tax_map[sid] for sid in store_ids])
print(f"Tax rates mapped from store IDs: {tax_rates_map}")

# Revenue by location code LAG, LDN, ABJ
location_codes = np.array([sid.split("_")[0] for sid in store_ids])
print(f"Location codes: {location_codes}")

for code in np.unique(location_codes):
    mask = location_codes == code
    revenue = totals_with_tax[mask].sum()
    print(f"  {code} revenue: ${revenue:.2f} - Stores: {store_ids[mask]}")
```

No loops, all vectorized. `prices * qty` multiplies each element.

**Real World Example 4 - Filtering and masking:**

```
import numpy as np

# Sales amounts from 6 stores
sales = np.array([25000, 32000, 15000, 40000, 18000, 500, 120000, 200.5])
store_ids = np.array(["LAG_001_Ikeja", "LAG_002_Lekki", "LAG_003_VI", "LAG_001_Ikeja", "ABJ_001_Garki", "LDN_001_Camden", "LAG_002_Lekki", "LDN_001_Camden"])
order_ids = np.array(["ORD_LAG_001_5001", "ORD_LAG_002_5002", "ORD_LAG_003_5003", "ORD_LAG_001_5004", "ORD_ABJ_001_3001", "ORD_LDN_001_2001", "ORD_LAG_002_5005", "ORD_LDN_001_2002"])

# Filter high value orders > 30000
high_value_mask = sales > 30000
print(f"High value sales >30000: {sales[high_value_mask]}")
print(f"  Order IDs: {order_ids[high_value_mask]}")
print(f"  Store IDs: {store_ids[high_value_mask]}")

# Filter Lagos only
lagos_mask = np.array([sid.startswith("LAG") or sid.startswith("ABJ") for sid in store_ids])
print(f"\nLagos/Abuja sales: {sales[lagos_mask]} - Stores {store_ids[lagos_mask]} - Total ${sales[lagos_mask].sum()}")

# Filter London
london_mask = np.array(["LDN" in sid for sid in store_ids])
print(f"London sales: {sales[london_mask]} - Stores {store_ids[london_mask]}")

# Multiple conditions: Lagos and high value
lagos_high = (lagos_mask) & (sales > 30000)
print(f"\nLagos high value: {sales[lagos_high]} - Orders {order_ids[lagos_high]}")

# Replace N/A or invalid with mean
sales_with_nan = np.array([25000, 32000, np.nan, 40000, 18000, 500])
print(f"\nWith NaN: {sales_with_nan}")
mean_val = np.nanmean(sales_with_nan)
sales_cleaned = np.where(np.isnan(sales_with_nan), mean_val, sales_with_nan)
print(f"Cleaned (NaN -> mean {mean_val:.2f}): {sales_cleaned}")
```

Masking with `sales > 30000` returns boolean array, use it to filter.

## 4. Aggregation and Stats for Reports

**Real World Example 5 - Store reports:**

```
import numpy as np

# 100 orders random for 5 stores
np.random.seed(42)
sales = np.random.randint(5000, 100000, size=100)
store_ids = np.random.choice(["LAG_001_Ikeja", "LAG_002_Lekki", "LAG_003_VI", "LDN_001_Camden", "ABJ_001_Garki"], size=100)

print(f"Total 100 orders stats:")
print(f"  Mean: {sales.mean():.2f}, Median: {np.median(sales):.2f}, Std: {sales.std():.2f}")
print(f"  Min: {sales.min()}, Max: {sales.max()}, Sum: {sales.sum()}")

# Revenue per store using aggregation
unique_stores, counts = np.unique(store_ids, return_counts=True)
print(f"\nOrders per store:")
for store, count in zip(unique_stores, counts):
    mask = store_ids == store
    store_sales = sales[mask]
    print(f"  {store}: {count} orders, Total ${store_sales.sum()}, Avg ${store_sales.mean():.2f}, Max ${store_sales.max()}")

# Overall location LAG vs LDN vs ABJ
location_codes = np.array([sid.split("_")[0] for sid in store_ids])
for code in np.unique(location_codes):
    mask = location_codes == code
    print(f"  Location {code}: {mask.sum()} orders, Total ${sales[mask].sum():.2f}")

# Percentiles for pricing strategy
print(f"\nPercentiles:")
for p in [25, 50, 75, 90, 95]:
    print(f"  {p}th percentile: {np.percentile(sales, p):.2f}")

# Top 10 orders
top_10_idx = np.argsort(sales)[-10:][::-1]
print(f"\nTop 10 orders:")
for idx in top_10_idx:
    print(f"  Order {idx} Store {store_ids[idx]} Sale ${sales[idx]}")
```

`np.unique` with `return_counts`, `np.argsort` for top N, `np.percentile` for pricing.

## 5. Hands-On Assignment with Kaggle Dataset

**Assignment 19: NumPy Analysis of Big Sales Data**

**Dataset to download:**
Kaggle: Large numeric datasets perfect for NumPy vectorization
Links:
- Primary: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce (olist_order_payments_dataset.csv has payment_value - 100k numeric values)
- Secondary: https://www.kaggle.com/datasets/carrie1/ecommerce-data (data.csv - Quantity * UnitPrice - 541k rows vectorized calc)
- Tertiary: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final (Superstore.csv - Sales column - 9k rows)
- Bonus: https://www.kaggle.com/datasets/mkechinov/ecommerce-behavior-data-from-multi-category-store (price column 4M rows - needs NumPy)

Download olist_order_payments_dataset.csv and data.csv

**Task - Create file `numpy_analysis_L19.py`:**

```
import numpy as np
import csv
import os
from collections import defaultdict

# Store tax mapping with locations
STORE_TAX = {
    "LAG_001_Ikeja": {"city": "Ikeja", "state": "Lagos", "country": "NG", "tax": 0.075, "address": "12 Allen Ave, Ikeja, Lagos, NG 101233"},
    "LAG_002_Lekki": {"city": "Lekki", "state": "Lagos", "country": "NG", "tax": 0.075, "address": "Admiralty Way, Lekki, Lagos, NG 105102"},
    "LAG_003_VI": {"city": "Victoria Island", "state": "Lagos", "country": "NG", "tax": 0.075, "address": "Akin Adesola, VI, Lagos, NG 101241"},
    "LDN_001_Camden": {"city": "Camden", "state": "London", "country": "UK", "tax": 0.20, "address": "45 Camden High St, London, UK NW1 0JH"},
    "ABJ_001_Garki": {"city": "Garki", "state": "FCT", "country": "NG", "tax": 0.075, "address": "Plot 123 Garki, Abuja, NG 900242"},
}

def load_numeric_column(filepath, column_name):
    values = []
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                val = float(str(row.get(column_name, "0")).replace("$","").replace(",","").strip())
                if val > 0:
                    values.append(val)
            except:
                continue
    return np.array(values)

print("=== Part 1: Vectorized Calculations for Your Stores ===")
# Sample data with your IDs
order_ids = np.array(["ORD_LAG_001_5001", "ORD_LAG_002_5002", "ORD_LAG_003_5003", "ORD_LDN_001_2001", "ORD_ABJ_001_3001", "ORD_LAG_001_5004", "ORD_LDN_001_2002"])
store_ids = np.array(["LAG_001_Ikeja", "LAG_002_Lekki", "LAG_003_VI", "LDN_001_Camden", "ABJ_001_Garki", "LAG_001_Ikeja", "LDN_001_Camden"])
prices = np.array([25000, 32000, 15000, 120.5, 18000, 40000, 200.0])
qty = np.array([2, 1, 3, 2, 1, 1, 5])
customer_ids = np.array(["CUST_101_LAG", "CUST_102_LAG", "CUST_103_LAG", "CUST_104_LDN", "CUST_105_ABJ", "CUST_106_LAG", "CUST_107_LDN"])

# Vectorized totals
subtotals = prices * qty
tax_rates = np.array([STORE_TAX[sid]["tax"] for sid in store_ids])
totals_with_tax = subtotals * (1 + tax_rates)

# Discount vectorized
discount_rates = np.where(qty >= 3, 0.15, np.where(qty >= 2, 0.10, 0.0))
totals_final = subtotals * (1 - discount_rates) * (1 + tax_rates)

print(f"Order IDs: {order_ids}")
print(f"Store IDs: {store_ids}")
print(f"Subtotals: {subtotals}")
print(f"Tax rates per store: {tax_rates}")
print(f"Totals with tax: {totals_with_tax}")
print(f"Discount rates (qty>=3 15%, qty>=2 10%): {discount_rates}")
print(f"Final totals: {totals_final}")

# Revenue per store - vectorized aggregation
print(f"\nRevenue per store:")
for sid in np.unique(store_ids):
    mask = store_ids == sid
    rev = totals_final[mask].sum()
    city = STORE_TAX[sid]["city"]
    country = STORE_TAX[sid]["country"]
    print(f"  {sid} {city}, {country} - {mask.sum()} orders - Total ${rev:.2f} - Avg ${totals_final[mask].mean():.2f}")

# Location code LAG, LDN, ABJ
loc_codes = np.array([sid.split("_")[0] for sid in store_ids])
for code in np.unique(loc_codes):
    mask = loc_codes == code
    print(f"  Location {code}: {mask.sum()} orders, Total ${totals_final[mask].sum():.2f}")

# Filtering
high_value_mask = totals_final > 30000
print(f"\nHigh value >30000: {totals_final[high_value_mask]} Orders {order_ids[high_value_mask]} Stores {store_ids[high_value_mask]}")

lagos_mask = np.array([sid.startswith("LAG") or sid.startswith("ABJ") for sid in store_ids])
print(f"Lagos/Abuja total: ${totals_final[lagos_mask].sum():.2f}")

print("\n=== Part 2: Kaggle Dataset with NumPy ===")
kaggle_files = [
    ("olist_order_payments_dataset.csv", "payment_value"),
    ("data.csv", "UnitPrice"),
    ("Superstore.csv", "Sales"),
    ("olist_orders_dataset.csv", "payment_value"),
]

found_file = None
found_col = None
for kf, col in kaggle_files:
    if os.path.exists(kf):
        found_file = kf
        found_col = col
        break

if found_file:
    print(f"Found Kaggle file {found_file}, column {found_col} - loading as NumPy array")
    values = load_numeric_column(found_file, found_col)
    print(f"  Loaded {len(values)} values")
    print(f"  Stats: Mean {values.mean():.2f}, Median {np.median(values):.2f}, Std {values.std():.2f}, Min {values.min():.2f}, Max {values.max():.2f}, Sum {values.sum():.2f}")
    
    # Percentiles
    print(f"  Percentiles:")
    for p in [25, 50, 75, 90, 95, 99]:
        print(f"    {p}th: {np.percentile(values, p):.2f}")
    
    # Vectorized operations - apply tax simulation
    # Assume 70% Lagos 7.5% tax, 30% London 20% tax
    np.random.seed(42)
    tax_rates_random = np.random.choice([0.075, 0.20], size=len(values), p=[0.7, 0.3])
    totals_with_tax_kaggle = values * (1 + tax_rates_random)
    print(f"  Totals with random Lagos 7.5% / London 20% tax: Mean {totals_with_tax_kaggle.mean():.2f}, Sum {totals_with_tax_kaggle.sum():.2f}")
    
    # High value filter
    high_mask = values > np.percentile(values, 90)
    print(f"  High value >90th percentile ({np.percentile(values,90):.2f}): {high_mask.sum()} orders, Total ${values[high_mask].sum():.2f}")
    
    # Top 10
    top_10_idx = np.argsort(values)[-10:][::-1]
    print(f"  Top 10 values: {values[top_10_idx]}")
    
    # Handling NaN demo
    values_with_nan = values.copy()
    values_with_nan[::100] = np.nan  # Every 100th as NaN
    print(f"  With NaN introduced: {np.isnan(values_with_nan).sum()} NaNs, nanmean {np.nanmean(values_with_nan):.2f} vs mean would be nan")
    cleaned = np.where(np.isnan(values_with_nan), np.nanmean(values_with_nan), values_with_nan)
    print(f"  Cleaned NaN -> mean: mean still {cleaned.mean():.2f}")
    
else:
    print(f"No Kaggle file found. Download:")
    print(f"  Primary: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce")
    print(f"    File: olist_order_payments_dataset.csv - column payment_value (100k numeric)")
    print(f"  Secondary: https://www.kaggle.com/datasets/carrie1/ecommerce-data")
    print(f"    File: data.csv - columns Quantity, UnitPrice (541k rows, Quantity*UnitPrice vectorized)")
    print(f"  Tertiary: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final")
    print(f"    File: Superstore.csv - column Sales")
    print(f"  Bonus: https://www.kaggle.com/datasets/mkechinov/ecommerce-behavior-data-from-multi-category-store - price column 4M rows")

print("\n=== Part 3: Performance Loop vs NumPy ===")
import time
size = 100000
prices_large = np.random.randint(5000, 100000, size=size)
qty_large = np.random.randint(1, 5, size=size)

# Loop way
start = time.time()
totals_loop = []
for p,q in zip(prices_large, qty_large):
    totals_loop.append(p*q*1.075)
loop_time = time.time() - start

# NumPy way
start = time.time()
totals_numpy = prices_large * qty_large * 1.075
numpy_time = time.time() - start

print(f"  100k orders - Loop: {loop_time:.4f} sec, NumPy: {numpy_time:.4f} sec, Speedup {loop_time/numpy_time:.1f}x")
print(f"  NumPy is {loop_time/numpy_time:.1f}x faster - critical for Kaggle 100k+ rows")

# Save results
np.save("sales_totals_L19.npy", totals_final)
print(f"\nSaved sales totals for your stores LAG_001_Ikeja etc to sales_totals_L19.npy")
np.savetxt("sales_totals_L19.csv", totals_final, delimiter=",")
print(f"Also saved to sales_totals_L19.csv")
```

**Deliverable:** Upload `numpy_analysis_L19.py` plus outputs:
- Vectorized totals for 7 orders with IDs ORD_LAG_001_5001 etc, store IDs LAG_001_Ikeja etc, customer IDs CUST_101_LAG, tax per location, discounts, revenue per store and per location code LAG/LDN/ABJ, high value filter
- If Kaggle file downloaded (olist_order_payments_dataset.csv or data.csv), show loaded count, mean/median/std/min/max/sum, percentiles, totals with random Lagos/London tax, high value >90th percentile count and sum, top 10 values, NaN handling with nanmean, performance loop vs NumPy speedup for 100k rows
- Files sales_totals_L19.npy and sales_totals_L19.csv

**Kaggle Links:**
1. Primary: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - olist_order_payments_dataset.csv payment_value 100k numeric perfect for NumPy
2. Secondary: https://www.kaggle.com/datasets/carrie1/ecommerce-data - data.csv Quantity * UnitPrice 541k rows vectorized
3. Tertiary: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final - Superstore.csv Sales column
4. Bonus: https://www.kaggle.com/datasets/mkechinov/ecommerce-behavior-data-from-multi-category-store - price column 4M rows

## 6. Checklist

- Can you create NumPy array from lists of prices for LAG_001_Ikeja, LAG_002_Lekki, LDN_001_Camden and store IDs ORD_LAG_001_5001?
- Can you do vectorized subtotal = price * qty, total with tax per store (Lagos 7.5% vs London 20%) without loop?
- Can you filter with mask sales >30000 and Lagos mask startswith LAG/ABJ to get Lagos high value orders?
- Can you aggregate revenue per store using np.unique and mask, and per location code LAG/LDN/ABJ?
- Can you calculate mean, median, std, min, max, percentile, argsort top 10 without loops?
- Can you load Kaggle olist_order_payments_dataset.csv payment_value as NumPy array and show stats?
- Can you handle NaN with np.nanmean and np.where to replace NaN with mean?
- Can you show performance loop vs NumPy for 100k rows and speedup?

If yes, you handle big numeric data fast.

Next: Introduction to Pandas - DataFrames.

**Key Takeaway:** Python loop for 100k orders = 2 sec, NumPy vectorized = 0.01 sec, 100x faster. Use np.array, vectorized ops price*qty*(1+tax), masking for filtering Lagos LAG_001_Ikeja vs London LDN_001_Camden, np.unique for revenue per store, percentiles and argsort for top orders. Essential for Kaggle 100k+ rows like olist_order_payments_dataset.csv.
