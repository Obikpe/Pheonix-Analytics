# Lesson 20 - Introduction to Pandas - DataFrames Part 1

**Duration:** 80 min | **Level:** Intermediate | **Goal:** Load, explore, clean, and filter real sales data with Pandas DataFrames for Lagos and London stores

## Learning Objectives
- Create DataFrames from lists, dicts, and Kaggle CSVs.
- Use head, info, describe, isnull, dtypes to explore data quality.
- Filter, sort, select columns, and clean with Pandas for store reports.

---

## 1. Why Pandas for Data Work

<svg width="100%" height="190" viewBox="0 0 700 190" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="190" rx="16" fill="#FFFFFF"/>
  <text x="350" y="28" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">NUMPY vs PANDAS</text>
  <rect x="20" y="50" width="200" height="120" rx="12" fill="#FEE2E2" stroke="#991B1B" stroke-width="1.5"/>
  <text x="120" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#7F1D1D">NUMPY - Numbers only</text>
  <text x="35" y="90" font-family="Arial" font-size="9" fill="#7F1D1D">np.array([25000, 32000])</text>
  <text x="35" y="105" font-family="Arial" font-size="9" fill="#7F1D1D">No column names</text>
  <text x="35" y="120" font-family="Arial" font-size="9" fill="#7F1D1D">No store_id, city</text>
  <text x="35" y="135" font-family="Arial" font-size="9" fill="#7F1D1D">Hard to filter by Lagos</text>
  <text x="35" y="150" font-family="Arial" font-size="9" fill="#7F1D1D">Good for math</text>
  <rect x="250" y="50" width="200" height="120" rx="12" fill="#DBEAFE" stroke="#1E40AF" stroke-width="1.5"/>
  <text x="350" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#1E3A8A">PANDAS - Table</text>
  <text x="265" y="90" font-family="Arial" font-size="9" fill="#1E3A8A">DataFrame with columns</text>
  <text x="265" y="105" font-family="Arial" font-size="9" fill="#1E3A8A">order_id, store_id, city, price</text>
  <text x="265" y="120" font-family="Arial" font-size="9" fill="#1E3A8A">Filter store_id == LAG_001_Ikeja</text>
  <text x="265" y="135" font-family="Arial" font-size="9" fill="#1E3A8A">Group by city, country</text>
  <text x="265" y="150" font-family="Arial" font-size="9" fill="#1E3A8A">Best for CSV, reports</text>
  <rect x="480" y="50" width="200" height="120" rx="12" fill="#D1FAE5" stroke="#065F46" stroke-width="1.5"/>
  <text x="580" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#064E3B">REAL USE</text>
  <text x="495" y="90" font-family="Arial" font-size="9" fill="#064E3B">Load olist 100k orders</text>
  <text x="495" y="105" font-family="Arial" font-size="9" fill="#064E3B">df.head() explore</text>
  <text x="495" y="120" font-family="Arial" font-size="9" fill="#064E3B">Filter LAG_001_Ikeja</text>
  <text x="495" y="135" font-family="Arial" font-size="9" fill="#064E3B">Clean price, city</text>
  <text x="495" y="150" font-family="Arial" font-size="9" fill="#064E3B">Ready for report</text>
</svg>

NumPy is for numbers. Pandas DataFrame is for tables with columns: order_id ORD_LAG_001_5001, store_id LAG_001_Ikeja, city Ikeja, country NG, customer_id CUST_101_LAG, price. You can filter `df[df.store_id == "LAG_001_Ikeja"]` and group by city.

## 2. Creating DataFrames - Your Stores

**Real World Example 1 - From list of dicts:**

```
import pandas as pd

# Your store data with full locations and IDs
orders = [
    {"order_id": "ORD_LAG_001_5001", "store_id": "LAG_001_Ikeja", "city": "Ikeja", "state": "Lagos", "country": "NG", "address": "12 Allen Ave, Ikeja, Lagos, NG 101233", "customer_id": "CUST_101_LAG", "customer_name": "Alex Johnson", "product_id": "MSE-BLK-001", "price": 25000, "qty": 2, "order_date": "2024-01-15"},
    {"order_id": "ORD_LAG_002_5002", "store_id": "LAG_002_Lekki", "city": "Lekki", "state": "Lagos", "country": "NG", "address": "Admiralty Way, Lekki, Lagos, NG 105102", "customer_id": "CUST_102_LAG", "customer_name": "Sam Lee", "product_id": "KBD-WHT-002", "price": 32000, "qty": 1, "order_date": "2024-01-20"},
    {"order_id": "ORD_LAG_003_5003", "store_id": "LAG_003_VI", "city": "Victoria Island", "state": "Lagos", "country": "NG", "address": "Akin Adesola, VI, Lagos, NG 101241", "customer_id": "CUST_103_LAG", "customer_name": "Maria Garcia", "product_id": "MON-24-003", "price": 85000, "qty": 1, "order_date": "2024-02-05"},
    {"order_id": "ORD_LDN_001_2001", "store_id": "LDN_001_Camden", "city": "Camden", "state": "London", "country": "UK", "address": "45 Camden High St, London, UK NW1 0JH", "customer_id": "CUST_104_LDN", "customer_name": "John Smith", "product_id": "MSE-BLK-001", "price": 120.50, "qty": 3, "order_date": "2024-01-10"},
    {"order_id": "ORD_ABJ_001_3001", "store_id": "ABJ_001_Garki", "city": "Garki", "state": "FCT", "country": "NG", "address": "Plot 123 Garki, Abuja, NG 900242", "customer_id": "CUST_105_ABJ", "customer_name": "Fatima Bello", "product_id": "CAB-USB-004", "price": 15000, "qty": 2, "order_date": "2024-02-10"},
    {"order_id": "ORD_LAG_001_5004", "store_id": "LAG_001_Ikeja", "city": "Ikeja", "state": "Lagos", "country": "NG", "address": "12 Allen Ave, Ikeja, Lagos, NG 101233", "customer_id": "CUST_106_LAG", "customer_name": "  ", "product_id": "KBD-WHT-002", "price": 40000, "qty": 1, "order_date": "2024-02-15"},
]

df = pd.DataFrame(orders)
print(df)
print(f"\nShape: {df.shape}")  # (6, 12)
print(f"\nColumns: {df.columns.tolist()}")

# Explore
print("\n=== df.head() ===")
print(df.head(3))

print("\n=== df.info() ===")
print(df.info())

print("\n=== df.describe() for numeric ===")
print(df.describe())

print("\n=== df.dtypes ===")
print(df.dtypes)
```

`pd.DataFrame(list_of_dicts)` creates table. `head()`, `info()`, `describe()` explore quality.

**Real World Example 2 - Cleaning with Pandas:**

```
import pandas as pd
import numpy as np

# Use same df from above

# Check nulls / empty names
print("Null counts:")
print(df.isnull().sum())
print("\nEmpty customer_name:")
print(df[df["customer_name"].str.strip() == ""])

# Clean customer_name: strip, title, replace empty with Unknown
df["customer_name_clean"] = df["customer_name"].str.strip().str.title()
df["customer_name_clean"] = df["customer_name_clean"].replace("", np.nan).fillna("Unknown")

# Clean price - ensure numeric
df["price"] = pd.to_numeric(df["price"], errors="coerce")

# Add calculated columns vectorized - no loop
df["subtotal"] = df["price"] * df["qty"]

# Tax per store: Lagos 7.5% vs London 20%
tax_map = {
    "LAG_001_Ikeja": 0.075,
    "LAG_002_Lekki": 0.075,
    "LAG_003_VI": 0.075,
    "ABJ_001_Garki": 0.075,
    "LDN_001_Camden": 0.20
}
df["tax_rate"] = df["store_id"].map(tax_map)
df["total_with_tax"] = df["subtotal"] * (1 + df["tax_rate"])

# Location code
df["location_code"] = df["store_id"].str.split("_").str[0]

print("\nCleaned DataFrame with calculated columns:")
print(df[["order_id", "store_id", "location_code", "city", "country", "customer_name_clean", "price", "qty", "subtotal", "tax_rate", "total_with_tax"]])

# Sort by total_with_tax descending
df_sorted = df.sort_values("total_with_tax", ascending=False)
print("\nSorted by total_with_tax descending:")
print(df_sorted[["order_id", "store_id", "city", "total_with_tax"]].head())
```

`str.strip()`, `map()`, vectorized `price * qty` without loops.

## 3. Filtering and Selecting - Store Reports

**Real World Example 3 - Filter for reports:**

```
# Filter Lagos only
lagos_df = df[df["country"] == "NG"]
print(f"Lagos/Nigeria orders: {len(lagos_df)}")
print(lagos_df[["order_id", "store_id", "city", "total_with_tax"]])

# Filter specific store LAG_001_Ikeja
ikeja_df = df[df["store_id"] == "LAG_001_Ikeja"]
print(f"\nLAG_001_Ikeja Ikeja store: {len(ikeja_df)} orders, Total ${ikeja_df['total_with_tax'].sum():.2f}")

# Filter high value >30000
high_value = df[df["total_with_tax"] > 30000]
print(f"\nHigh value >30000: {len(high_value)} orders")
print(high_value[["order_id", "store_id", "city", "total_with_tax"]])

# Multiple conditions: Lagos and high value
lagos_high = df[(df["country"] == "NG") & (df["total_with_tax"] > 30000)]
print(f"\nLagos high value >30000: {len(lagos_high)} orders")

# Select specific columns
report_cols = df[["order_id", "store_id", "city", "country", "customer_id", "total_with_tax", "order_date"]]
print("\nReport columns:")
print(report_cols)

# Filter by date after Jan 31 2024
df["order_date"] = pd.to_datetime(df["order_date"])
feb_df = df[df["order_date"] > "2024-01-31"]
print(f"\nFeb orders after Jan 31: {len(feb_df)}")
print(feb_df[["order_id", "store_id", "order_date", "total_with_tax"]])
```

`df[condition]`, `&` for and, `|` for or, `map()` for tax per store_id.

**Real World Example 4 - Loading Kaggle CSV with Pandas:**

```
import pandas as pd

# Load Kaggle file - much easier than csv module
# pd.read_csv handles encoding, header, parsing automatically

# Example: olist_customers_dataset.csv
# df_kaggle = pd.read_csv("olist_customers_dataset.csv")
# print(df_kaggle.head())
# print(df_kaggle.info())
# print(df_kaggle.describe())
# print(df_kaggle["customer_state"].value_counts().head())

# Simulate with your data as if Kaggle
# For demo, create DataFrame and save to CSV then reload

df.to_csv("my_store_sales_L20.csv", index=False)
print("Saved my_store_sales_L20.csv")

# Reload like Kaggle file
df_reloaded = pd.read_csv("my_store_sales_L20.csv")
print(f"\nReloaded CSV shape: {df_reloaded.shape}")
print(df_reloaded.head())

# Handle messy Kaggle data - example from Superstore or Olist
# - parse dates
# - handle currency symbols
# - fill nulls

# Simulate messy price with $ and comma
messy_data = [
    {"order_id": "ORD_LAG_001_5001", "store_id": "LAG_001_Ikeja", "price": "$25,000", "qty": "2"},
    {"order_id": "ORD_LAG_002_5002", "store_id": "LAG_002_Lekki", "price": "32000", "qty": "1"},
    {"order_id": "ORD_LDN_001_2001", "store_id": "LDN_001_Camden", "price": "£120.50", "qty": "3"},
]

df_messy = pd.DataFrame(messy_data)
print("\nMessy price column:")
print(df_messy)

# Clean price with pandas str methods
df_messy["price_clean"] = df_messy["price"].str.replace("$","", regex=False).str.replace("£","", regex=False).str.replace(",","", regex=False)
df_messy["price_clean"] = pd.to_numeric(df_messy["price_clean"], errors="coerce")
df_messy["qty"] = pd.to_numeric(df_messy["qty"], errors="coerce")
df_messy["subtotal"] = df_messy["price_clean"] * df_messy["qty"]

print("\nCleaned messy:")
print(df_messy)
```

`pd.read_csv` is 10x easier than csv module, `pd.to_datetime`, `str.replace` for cleaning.

## 4. Hands-On Assignment with Kaggle Dataset

**Assignment 20: Pandas Exploration of Real Sales Data**

**Dataset to download:**
Kaggle: Real sales data perfect for DataFrame Part 1
Links:
- Primary: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce (olist_customers_dataset.csv, olist_orders_dataset.csv, olist_order_payments_dataset.csv, olist_geolocation_dataset.csv - 100k rows, has customer_id, customer_city, customer_state, customer_zip, order_id, payment_value)
- Secondary: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final (Superstore.csv - Order ID, Customer ID, City, State, Country, Sales, Quantity, Discount, Profit - 9k rows, perfect for head/info/describe/filter)
- Tertiary: https://www.kaggle.com/datasets/carrie1/ecommerce-data (data.csv - InvoiceNo, StockCode, Description, Quantity, InvoiceDate, UnitPrice, CustomerID, Country - 541k rows)
- Quaternary: https://www.kaggle.com/datasets/mkechinov/ecommerce-behavior-data-from-multi-category-store (events.csv - 4M rows, tests memory)

Download olist_customers_dataset.csv, olist_orders_dataset.csv, olist_order_payments_dataset.csv

**Task - Create file `pandas_intro_L20.py`:**

```
import pandas as pd
import numpy as np
import os
from collections import defaultdict

# Your stores mapping with full details
MY_STORES = {
    "LAG_001_Ikeja": {"city": "Ikeja", "state": "Lagos", "country": "NG", "address": "12 Allen Ave, Ikeja, Lagos, NG 101233", "tax": 0.075, "sla": 3},
    "LAG_002_Lekki": {"city": "Lekki", "state": "Lagos", "country": "NG", "address": "Admiralty Way, Lekki, Lagos, NG 105102", "tax": 0.075, "sla": 3},
    "LAG_003_VI": {"city": "Victoria Island", "state": "Lagos", "country": "NG", "address": "Akin Adesola, VI, Lagos, NG 101241", "tax": 0.075, "sla": 3},
    "LDN_001_Camden": {"city": "Camden", "state": "London", "country": "UK", "address": "45 Camden High St, London, UK NW1 0JH", "tax": 0.20, "sla": 2},
    "ABJ_001_Garki": {"city": "Garki", "state": "FCT", "country": "NG", "address": "Plot 123 Garki, Abuja, NG 900242", "tax": 0.075, "sla": 4},
}

print("=== Part 1: Create DataFrame with Your Store IDs and Locations ===")
orders = [
    {"order_id": "ORD_LAG_001_5001", "store_id": "LAG_001_Ikeja", "city": "Ikeja", "state": "Lagos", "country": "NG", "address": "12 Allen Ave, Ikeja, Lagos, NG 101233", "customer_id": "CUST_101_LAG", "customer_name": "Alex Johnson", "product_id": "MSE-BLK-001", "price": 25000, "qty": 2, "order_date": "2024-01-15"},
    {"order_id": "ORD_LAG_002_5002", "store_id": "LAG_002_Lekki", "city": "Lekki", "state": "Lagos", "country": "NG", "address": "Admiralty Way, Lekki, Lagos, NG 105102", "customer_id": "CUST_102_LAG", "customer_name": "Sam Lee", "product_id": "KBD-WHT-002", "price": 32000, "qty": 1, "order_date": "2024-01-20"},
    {"order_id": "ORD_LAG_003_5003", "store_id": "LAG_003_VI", "city": "Victoria Island", "state": "Lagos", "country": "NG", "address": "Akin Adesola, VI, Lagos, NG 101241", "customer_id": "CUST_103_LAG", "customer_name": "Maria Garcia", "product_id": "MON-24-003", "price": 85000, "qty": 1, "order_date": "2024-02-05"},
    {"order_id": "ORD_LDN_001_2001", "store_id": "LDN_001_Camden", "city": "Camden", "state": "London", "country": "UK", "address": "45 Camden High St, London, UK NW1 0JH", "customer_id": "CUST_104_LDN", "customer_name": "John Smith", "product_id": "MSE-BLK-001", "price": 120.50, "qty": 3, "order_date": "2024-01-10"},
    {"order_id": "ORD_ABJ_001_3001", "store_id": "ABJ_001_Garki", "city": "Garki", "state": "FCT", "country": "NG", "address": "Plot 123 Garki, Abuja, NG 900242", "customer_id": "CUST_105_ABJ", "customer_name": "Fatima Bello", "product_id": "CAB-USB-004", "price": 15000, "qty": 2, "order_date": "2024-02-10"},
    {"order_id": "ORD_LAG_001_5004", "store_id": "LAG_001_Ikeja", "city": "Ikeja", "state": "Lagos", "country": "NG", "address": "12 Allen Ave, Ikeja, Lagos, NG 101233", "customer_id": "CUST_106_LAG", "customer_name": "  ", "product_id": "KBD-WHT-002", "price": 40000, "qty": 1, "order_date": "2024-02-15"},
    {"order_id": "ORD_LAG_002_5005", "store_id": "LAG_002_Lekki", "city": "Lekki", "state": "Lagos", "country": "NG", "address": "Admiralty Way, Lekki, Lagos, NG 105102", "customer_id": "CUST_107_LAG", "customer_name": "Chidi Okoro", "product_id": "MSE-BLK-001", "price": 25000, "qty": 5, "order_date": "2024-02-20"},
]

df = pd.DataFrame(orders)
print(f"DataFrame shape: {df.shape}")
print(df.head())

print("\n=== Part 2: Explore with head, info, describe, isnull ===")
print("df.head(3):")
print(df.head(3))
print("\ndf.info():")
print(df.info())
print("\ndf.describe() numeric:")
print(df.describe())
print("\ndf.isnull().sum():")
print(df.isnull().sum())
print("\ndf.dtypes:")
print(df.dtypes)
print("\ndf['city'].value_counts():")
print(df["city"].value_counts())
print("\ndf['country'].value_counts():")
print(df["country"].value_counts())
print("\ndf['store_id'].value_counts():")
print(df["store_id"].value_counts())

print("\n=== Part 3: Cleaning with Pandas ===")
# Clean customer_name
df["customer_name_clean"] = df["customer_name"].str.strip().str.title()
df["customer_name_clean"] = df["customer_name_clean"].replace("", np.nan).fillna("Unknown")
print("Cleaned customer_name:")
print(df[["customer_name", "customer_name_clean"]])

# Ensure numeric
df["price"] = pd.to_numeric(df["price"], errors="coerce")
df["qty"] = pd.to_numeric(df["qty"], errors="coerce")

# Add calculated columns vectorized
df["subtotal"] = df["price"] * df["qty"]
tax_map = {sid: info["tax"] for sid, info in MY_STORES.items()}
df["tax_rate"] = df["store_id"].map(tax_map)
df["total_with_tax"] = df["subtotal"] * (1 + df["tax_rate"])
df["location_code"] = df["store_id"].str.split("_").str[0]
df["order_date"] = pd.to_datetime(df["order_date"])

print("\nDataFrame with calculated columns subtotal, tax_rate, total_with_tax, location_code:")
print(df[["order_id", "store_id", "location_code", "city", "country", "customer_name_clean", "price", "qty", "subtotal", "tax_rate", "total_with_tax", "order_date"]])

print("\n=== Part 4: Filtering and Selecting for Reports ===")
# Lagos only
lagos_df = df[df["country"] == "NG"]
print(f"Lagos/Nigeria orders: {len(lagos_df)}")
print(lagos_df[["order_id", "store_id", "city", "total_with_tax"]])

# Specific store LAG_001_Ikeja
ikeja_df = df[df["store_id"] == "LAG_001_Ikeja"]
print(f"\nLAG_001_Ikeja Ikeja, Lagos, NG 101233: {len(ikeja_df)} orders, Total ${ikeja_df['total_with_tax'].sum():.2f}")
print(ikeja_df[["order_id", "customer_id", "customer_name_clean", "total_with_tax"]])

# High value
high_df = df[df["total_with_tax"] > 30000]
print(f"\nHigh value >30000: {len(high_df)} orders")
print(high_df[["order_id", "store_id", "city", "total_with_tax"]])

# Multiple conditions Lagos and high value
lagos_high = df[(df["country"] == "NG") & (df["total_with_tax"] > 30000)]
print(f"\nLagos high value >30000: {len(lagos_high)} orders")

# Sort
df_sorted = df.sort_values("total_with_tax", ascending=False)
print(f"\nSorted by total_with_tax descending:")
print(df_sorted[["order_id", "store_id", "city", "total_with_tax"]].head())

# Select columns for report
report = df[["order_id", "store_id", "city", "country", "address", "customer_id", "customer_name_clean", "total_with_tax", "order_date"]]
print(f"\nReport columns shape: {report.shape}")
print(report.head())

print("\n=== Part 5: Kaggle Dataset with Pandas ===")
kaggle_files = [
    "olist_customers_dataset.csv",
    "olist_orders_dataset.csv",
    "olist_order_payments_dataset.csv",
    "Superstore.csv",
    "data.csv"
]

found = None
for kf in kaggle_files:
    if os.path.exists(kf):
        found = kf
        break

if found:
    print(f"Found Kaggle file {found} - loading with pd.read_csv")
    df_kaggle = pd.read_csv(found, encoding="utf-8", low_memory=False, nrows=10000)  # First 10k for demo
    print(f"  Shape: {df_kaggle.shape}")
    print(f"  Columns: {df_kaggle.columns.tolist()[:10]}")
    print(f"  Head:")
    print(df_kaggle.head(3))
    print(f"  Info:")
    print(df_kaggle.info())
    print(f"  Describe:")
    print(df_kaggle.describe(include='all').head())
    print(f"  Nulls:")
    print(df_kaggle.isnull().sum().head(10))
    
    if "customer_state" in df_kaggle.columns:
        print(f"  Value counts customer_state:")
        print(df_kaggle["customer_state"].value_counts().head())
    
    if "customer_city" in df_kaggle.columns:
        print(f"  Value counts customer_city:")
        print(df_kaggle["customer_city"].value_counts().head())
    
    if "Sales" in df_kaggle.columns:
        print(f"  Sales stats: Mean {df_kaggle['Sales'].mean():.2f}, Sum {df_kaggle['Sales'].sum():.2f}")
        high_sales = df_kaggle[df_kaggle["Sales"] > 500]
        print(f"  High Sales >500: {len(high_sales)} orders")
    
    if "payment_value" in df_kaggle.columns:
        print(f"  payment_value stats: Mean {df_kaggle['payment_value'].mean():.2f}, Sum {df_kaggle['payment_value'].sum():.2f}")
    
    # Save cleaned sample
    df_kaggle.head(1000).to_csv(f"cleaned_sample_{found}", index=False)
    print(f"  Saved cleaned_sample_{found} with 1000 rows")
    
else:
    print(f"No Kaggle file found. Download:")
    print(f"  Primary: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce")
    print(f"    Files: olist_customers_dataset.csv (customer_id, customer_city, customer_state, customer_zip_code_prefix)")
    print(f"           olist_orders_dataset.csv (order_id, customer_id, order_status, order_purchase_timestamp)")
    print(f"           olist_order_payments_dataset.csv (order_id, payment_value, payment_type)")
    print(f"           olist_geolocation_dataset.csv (geolocation_zip_code_prefix, geolocation_lat, geolocation_lng, geolocation_city)")
    print(f"  Secondary: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final")
    print(f"    File: Superstore.csv - Order ID, Customer ID, City, State, Country, Sales, Quantity, Discount, Profit")
    print(f"    Perfect for head/info/describe, filtering by City, State, Country")
    print(f"  Tertiary: https://www.kaggle.com/datasets/carrie1/ecommerce-data")
    print(f"    File: data.csv - InvoiceNo, StockCode, Description, Quantity, InvoiceDate, UnitPrice, CustomerID, Country - 541k rows")
    print(f"  Place file in this folder and re-run")

# Save your store DataFrame
df.to_csv("my_store_sales_L20.csv", index=False)
print(f"\nSaved my_store_sales_L20.csv with {len(df)} orders including LAG_001_Ikeja, LAG_002_Lekki, LDN_001_Camden, ABJ_001_Garki")
df.to_excel("my_store_sales_L20.xlsx", index=False)
print(f"Also saved my_store_sales_L20.xlsx")

print(f"\n=== Summary ===")
print(f"Total orders: {len(df)}")
print(f"Total revenue with tax: ${df['total_with_tax'].sum():.2f}")
for country in df["country"].unique():
    mask = df["country"] == country
    print(f"  {country}: {mask.sum()} orders, Total ${df[mask]['total_with_tax'].sum():.2f}")
for store_id in df["store_id"].unique():
    mask = df["store_id"] == store_id
    city = df[mask]["city"].iloc[0]
    print(f"  {store_id} {city}: {mask.sum()} orders, Total ${df[mask]['total_with_tax'].sum():.2f}")
```

**Deliverable:** Upload `pandas_intro_L20.py` plus outputs:
- `my_store_sales_L20.csv` and `.xlsx` with 7 orders including order_id ORD_LAG_001_5001, store_id LAG_001_Ikeja 12 Allen Ave Ikeja Lagos NG 101233, city Ikeja, country NG, customer_id CUST_101_LAG, customer_name_clean, price, qty, subtotal, tax_rate, total_with_tax, location_code LAG, order_date
- Console output showing head, info, describe, isnull, dtypes, value_counts for city, country, store_id
- Filtering results: Lagos NG orders, LAG_001_Ikeja specific total, high value >30000, sorted descending
- If Kaggle downloaded (olist_customers_dataset.csv etc), show shape, columns, head 3, info, describe, nulls, value_counts for customer_state, customer_city, Sales mean/sum if Superstore

**Kaggle Links:**
1. Primary: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce (olist_customers_dataset.csv customer_id, customer_city, customer_state, customer_zip, olist_orders_dataset.csv order_id, order_status, olist_order_payments_dataset.csv payment_value - 100k rows)
2. Secondary: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final (Superstore.csv Order ID, Customer ID, City, State, Country, Sales, Quantity - perfect for head/info/describe/filter)
3. Tertiary: https://www.kaggle.com/datasets/carrie1/ecommerce-data (data.csv InvoiceNo, StockCode, Description, Quantity, InvoiceDate, UnitPrice, CustomerID, Country - 541k rows)
4. Bonus: https://www.kaggle.com/datasets/mkechinov/ecommerce-behavior-data-from-multi-category-store (4M rows)

## 6. Checklist

- Can you create DataFrame from list of dicts with order_id ORD_LAG_001_5001, store_id LAG_001_Ikeja, city Ikeja, country NG, customer_id CUST_101_LAG, address 12 Allen Ave Ikeja Lagos NG 101233?
- Can you use head(), info(), describe(), isnull().sum(), dtypes, value_counts() to explore data quality and find empty customer_name?
- Can you clean with str.strip().str.title(), replace empty with Unknown, pd.to_numeric with errors=coerce, add subtotal = price * qty vectorized?
- Can you map tax per store_id LAG_001_Ikeja 7.5% vs LDN_001_Camden 20% and calculate total_with_tax?
- Can you filter df[df.country==NG] for Lagos, df[df.store_id==LAG_001_Ikeja] for specific store total, df[df.total_with_tax>30000] high value, and multiple conditions with &?
- Can you sort with sort_values descending and select columns for report?
- Can you load Kaggle olist_customers_dataset.csv with pd.read_csv, show shape, head, info, describe, nulls, value_counts for customer_state?
- Can you save to CSV and Excel with to_csv and to_excel?

If yes, you can explore and clean real sales data with Pandas.

Next: Pandas Part 2 - Grouping and Aggregation.

**Key Takeaway:** NumPy is numbers only, Pandas DataFrame is table with columns order_id, store_id LAG_001_Ikeja, city Ikeja, country NG, customer_id CUST_101_LAG, price. Use pd.DataFrame(list_of_dicts), pd.read_csv for Kaggle olist 100k rows, head/info/describe/isnull/value_counts to explore, str methods and map and vectorized calc for cleaning, df[condition] for filtering Lagos, LAG_001_Ikeja, high value, sort_values for reports. Save to CSV/Excel.
