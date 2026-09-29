# Lesson 21 - Pandas Part 2 - Grouping and Aggregation

**Duration:** 80 min | **Level:** Intermediate | **Goal:** Build store, city, and month reports with groupby, agg, pivot for Lagos and London

## Learning Objectives
- Group sales by store_id, city, country, location_code, month for revenue reports.
- Use agg with multiple functions mean, sum, count, max, min.
- Build pivot tables to compare Lagos vs London performance.

---

## 1. Why Grouping is Your Manager's Favorite Report

<svg width="100%" height="190" viewBox="0 0 700 190" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="190" rx="16" fill="#FFFFFF"/>
  <text x="350" y="28" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">RAW ORDERS vs GROUPED REPORT</text>
  <rect x="20" y="50" width="200" height="120" rx="12" fill="#FEE2E2" stroke="#991B1B" stroke-width="1.5"/>
  <text x="120" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#7F1D1D">RAW 100k ROWS</text>
  <text x="35" y="90" font-family="Arial" font-size="9" fill="#7F1D1D">ORD_LAG_001_5001 LAG_001_Ikeja 25000</text>
  <text x="35" y="105" font-family="Arial" font-size="9" fill="#7F1D1D">ORD_LAG_002_5002 LAG_002_Lekki 32000</text>
  <text x="35" y="120" font-family="Arial" font-size="9" fill="#7F1D1D">ORD_LDN_001_2001 LDN_001_Camden 120.5</text>
  <text x="35" y="135" font-family="Arial" font-size="9" fill="#7F1D1D">...</text>
  <text x="35" y="150" font-family="Arial" font-size="9" fill="#7F1D1D">Cannot see totals</text>
  <rect x="250" y="50" width="200" height="120" rx="12" fill="#DBEAFE" stroke="#1E40AF" stroke-width="1.5"/>
  <text x="350" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#1E3A8A">GROUPBY</text>
  <text x="265" y="90" font-family="Arial" font-size="9" fill="#1E3A8A">df.groupby("store_id")["total"].sum()</text>
  <text x="265" y="105" font-family="Arial" font-size="9" fill="#1E3A8A">df.groupby("city")["total"].mean()</text>
  <text x="265" y="120" font-family="Arial" font-size="9" fill="#1E3A8A">df.groupby(["country","month"])</text>
  <text x="265" y="135" font-family="Arial" font-size="9" fill="#1E3A8A">One line per group</text>
  <text x="265" y="150" font-family="Arial" font-size="9" fill="#1E3A8A">Fast aggregation</text>
  <rect x="480" y="50" width="200" height="120" rx="12" fill="#D1FAE5" stroke="#065F46" stroke-width="1.5"/>
  <text x="580" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#064E3B">REPORT</text>
  <text x="495" y="90" font-family="Arial" font-size="9" fill="#064E3B">LAG_001_Ikeja Ikeja NG: $125k, 50 orders</text>
  <text x="495" y="105" font-family="Arial" font-size="9" fill="#064E3B">LDN_001_Camden UK: £2k, 20 orders</text>
  <text x="495" y="120" font-family="Arial" font-size="9" fill="#064E3B">2024-01: $80k, 2024-02: $90k</text>
  <text x="495" y="135" font-family="Arial" font-size="9" fill="#064E3B">LAG vs LDN comparison</text>
  <text x="495" y="150" font-family="Arial" font-size="9" fill="#064E3B">Manager ready</text>
</svg>

Raw table has 100k rows with order_id ORD_LAG_001_5001, store_id LAG_001_Ikeja, city Ikeja. Manager wants summary: total revenue per store LAG_001_Ikeja, per city Ikeja, per country NG vs UK, per month 2024-01 vs 2024-02. Groupby does that in one line.

## 2. Groupby Basics - Your Stores

**Real World Example 1 - Group by store_id, city, country:**

```
import pandas as pd

orders = [
    {"order_id": "ORD_LAG_001_5001", "store_id": "LAG_001_Ikeja", "city": "Ikeja", "state": "Lagos", "country": "NG", "customer_id": "CUST_101_LAG", "product_id": "MSE-BLK-001", "price": 25000, "qty": 2, "order_date": "2024-01-15"},
    {"order_id": "ORD_LAG_001_5002", "store_id": "LAG_001_Ikeja", "city": "Ikeja", "state": "Lagos", "country": "NG", "customer_id": "CUST_102_LAG", "product_id": "KBD-WHT-002", "price": 32000, "qty": 1, "order_date": "2024-01-20"},
    {"order_id": "ORD_LAG_002_5003", "store_id": "LAG_002_Lekki", "city": "Lekki", "state": "Lagos", "country": "NG", "customer_id": "CUST_103_LAG", "product_id": "MON-24-003", "price": 85000, "qty": 1, "order_date": "2024-01-18"},
    {"order_id": "ORD_LAG_002_5004", "store_id": "LAG_002_Lekki", "city": "Lekki", "state": "Lagos", "country": "NG", "customer_id": "CUST_104_LAG", "product_id": "MSE-BLK-001", "price": 25000, "qty": 3, "order_date": "2024-02-05"},
    {"order_id": "ORD_LAG_003_5005", "store_id": "LAG_003_VI", "city": "Victoria Island", "state": "Lagos", "country": "NG", "customer_id": "CUST_105_LAG", "product_id": "CAB-USB-004", "price": 15000, "qty": 2, "order_date": "2024-02-10"},
    {"order_id": "ORD_LDN_001_2001", "store_id": "LDN_001_Camden", "city": "Camden", "state": "London", "country": "UK", "customer_id": "CUST_106_LDN", "product_id": "MSE-BLK-001", "price": 120.50, "qty": 3, "order_date": "2024-01-10"},
    {"order_id": "ORD_LDN_001_2002", "store_id": "LDN_001_Camden", "city": "Camden", "state": "London", "country": "UK", "customer_id": "CUST_107_LDN", "product_id": "KBD-WHT-002", "price": 85.00, "qty": 2, "order_date": "2024-02-12"},
    {"order_id": "ORD_ABJ_001_3001", "store_id": "ABJ_001_Garki", "city": "Garki", "state": "FCT", "country": "NG", "customer_id": "CUST_108_ABJ", "product_id": "MON-24-003", "price": 90000, "qty": 1, "order_date": "2024-01-25"},
]

df = pd.DataFrame(orders)
df["order_date"] = pd.to_datetime(df["order_date"])
df["subtotal"] = df["price"] * df["qty"]

# Tax map
tax_map = {"LAG_001_Ikeja": 0.075, "LAG_002_Lekki": 0.075, "LAG_003_VI": 0.075, "ABJ_001_Garki": 0.075, "LDN_001_Camden": 0.20}
df["total_with_tax"] = df["subtotal"] * (1 + df["store_id"].map(tax_map))
df["location_code"] = df["store_id"].str.split("_").str[0]
df["month"] = df["order_date"].dt.to_period("M")

print("Original DataFrame:")
print(df[["order_id", "store_id", "city", "country", "subtotal", "total_with_tax", "month"]])

# Group by store_id - revenue
revenue_by_store = df.groupby("store_id")["total_with_tax"].sum().sort_values(ascending=False)
print("\nRevenue by store_id:")
print(revenue_by_store)

# Group by city
revenue_by_city = df.groupby("city")["total_with_tax"].sum().sort_values(ascending=False)
print("\nRevenue by city:")
print(revenue_by_city)

# Group by country NG vs UK
revenue_by_country = df.groupby("country")["total_with_tax"].sum()
print("\nRevenue by country:")
print(revenue_by_country)

# Group by location_code LAG, LDN, ABJ
revenue_by_loc_code = df.groupby("location_code")["total_with_tax"].sum()
print("\nRevenue by location_code LAG/LDN/ABJ:")
print(revenue_by_loc_code)

# Group by month
revenue_by_month = df.groupby("month")["total_with_tax"].sum()
print("\nRevenue by month:")
print(revenue_by_month)

# Multiple groups: country and month
revenue_country_month = df.groupby(["country", "month"])["total_with_tax"].sum()
print("\nRevenue by country and month:")
print(revenue_country_month)

# Multiple groups: store_id and product_id
revenue_store_product = df.groupby(["store_id", "product_id"])["total_with_tax"].sum()
print("\nRevenue by store_id and product_id:")
print(revenue_store_product)
```

`df.groupby("store_id")["total"].sum()` - one line gives total per LAG_001_Ikeja, LAG_002_Lekki etc.

**Real World Example 2 - Agg with multiple functions:**

```
import pandas as pd

# Use same df

# Multiple aggregations at once
agg_by_store = df.groupby("store_id").agg(
    total_revenue=("total_with_tax", "sum"),
    avg_order=("total_with_tax", "mean"),
    order_count=("order_id", "count"),
    max_order=("total_with_tax", "max"),
    min_order=("total_with_tax", "min"),
    unique_customers=("customer_id", "nunique")
).sort_values("total_revenue", ascending=False)

print("Aggregation by store_id with multiple metrics:")
print(agg_by_store)

# Group by city with agg
agg_by_city = df.groupby("city").agg(
    revenue=("total_with_tax", "sum"),
    orders=("order_id", "count"),
    avg_price=("price", "mean"),
    customers=("customer_id", "nunique")
).sort_values("revenue", ascending=False)

print("\nAggregation by city:")
print(agg_by_city)

# Group by country and month with agg
agg_country_month = df.groupby(["country", "month"]).agg(
    revenue=("total_with_tax", "sum"),
    orders=("order_id", "count"),
    avg_order=("total_with_tax", "mean")
)

print("\nAggregation by country and month:")
print(agg_country_month)

# Using .agg with list of functions
revenue_stats = df.groupby("store_id")["total_with_tax"].agg(["sum", "mean", "count", "max", "min", "std"])
print("\nRevenue stats per store with list agg:")
print(revenue_stats)
```

`agg()` with named tuple gives multiple metrics per group: total revenue, avg order, count, unique customers.

## 3. Pivot Tables - Lagos vs London Comparison

**Real World Example 3 - Pivot for manager report:**

```
import pandas as pd

# Use same df

# Pivot: rows = store_id, columns = month, values = total_with_tax sum
pivot_month_store = df.pivot_table(
    index="store_id",
    columns="month",
    values="total_with_tax",
    aggfunc="sum",
    fill_value=0
)

print("Pivot: store_id vs month revenue:")
print(pivot_month_store)

# Pivot: rows = country, columns = city, values = revenue
pivot_country_city = df.pivot_table(
    index="country",
    columns="city",
    values="total_with_tax",
    aggfunc="sum",
    fill_value=0
)

print("\nPivot: country vs city revenue:")
print(pivot_country_city)

# Pivot: product_id vs location_code
pivot_product_loc = df.pivot_table(
    index="product_id",
    columns="location_code",
    values="total_with_tax",
    aggfunc="sum",
    fill_value=0
)

print("\nPivot: product_id vs location_code LAG/LDN/ABJ revenue:")
print(pivot_product_loc)

# Pivot with multiple aggfuncs
pivot_multi = df.pivot_table(
    index="store_id",
    columns="month",
    values="total_with_tax",
    aggfunc=["sum", "count", "mean"],
    fill_value=0
)

print("\nPivot multi aggfunc sum, count, mean:")
print(pivot_multi)

# Crosstab - count orders per store vs month
crosstab = pd.crosstab(df["store_id"], df["month"])
print("\nCrosstab count orders per store vs month:")
print(crosstab)
```

Pivot tables let manager see LAG_001_Ikeja vs LDN_001_Camden side by side per month, product vs location.

## 4. Hands-On Assignment with Kaggle Dataset

**Assignment 21: Grouping and Pivot Reports for Real Data**

**Dataset to download:**
Kaggle: Real datasets perfect for groupby and pivot
Links:
- Primary: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce (olist_orders_dataset.csv order_id, customer_id, order_status, order_purchase_timestamp, olist_order_payments_dataset.csv payment_value, payment_type, olist_customers_dataset.csv customer_city, customer_state, olist_products_dataset.csv product_category_name)
- Secondary: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final (Superstore.csv Order ID, Order Date, Customer ID, City, State, Country, Region, Category, Sub-Category, Sales, Quantity, Discount, Profit - perfect for groupby city, state, country, category, month)
- Tertiary: https://www.kaggle.com/datasets/carrie1/ecommerce-data (data.csv InvoiceNo, StockCode, Description, Quantity, InvoiceDate, UnitPrice, CustomerID, Country - 541k rows - groupby Country, CustomerID, month)
- Quaternary: https://www.kaggle.com/datasets/mkechinov/ecommerce-behavior-data-from-multi-category-store (category_code, brand, price, user_id - groupby category)

Download olist_orders_dataset.csv, olist_order_payments_dataset.csv, olist_customers_dataset.csv, olist_products_dataset.csv

**Task - Create file `grouping_agg_L21.py`:**

```
import pandas as pd
import os

# Your stores with locations
MY_STORES = {
    "LAG_001_Ikeja": {"city": "Ikeja", "state": "Lagos", "country": "NG", "address": "12 Allen Ave, Ikeja, Lagos, NG 101233", "tax": 0.075},
    "LAG_002_Lekki": {"city": "Lekki", "state": "Lagos", "country": "NG", "address": "Admiralty Way, Lekki, Lagos, NG 105102", "tax": 0.075},
    "LAG_003_VI": {"city": "Victoria Island", "state": "Lagos", "country": "NG", "address": "Akin Adesola, VI, Lagos, NG 101241", "tax": 0.075},
    "LDN_001_Camden": {"city": "Camden", "state": "London", "country": "UK", "address": "45 Camden High St, London, UK NW1 0JH", "tax": 0.20},
    "ABJ_001_Garki": {"city": "Garki", "state": "FCT", "country": "NG", "address": "Plot 123 Garki, Abuja, NG 900242", "tax": 0.075},
}

print("=== Part 1: Groupby with Your Store IDs LAG_001_Ikeja etc ===")
orders = [
    {"order_id": "ORD_LAG_001_5001", "store_id": "LAG_001_Ikeja", "city": "Ikeja", "state": "Lagos", "country": "NG", "customer_id": "CUST_101_LAG", "product_id": "MSE-BLK-001", "product_cat": "Accessories", "price": 25000, "qty": 2, "order_date": "2024-01-15"},
    {"order_id": "ORD_LAG_001_5002", "store_id": "LAG_001_Ikeja", "city": "Ikeja", "state": "Lagos", "country": "NG", "customer_id": "CUST_102_LAG", "product_id": "KBD-WHT-002", "product_cat": "Accessories", "price": 32000, "qty": 1, "order_date": "2024-01-20"},
    {"order_id": "ORD_LAG_002_5003", "store_id": "LAG_002_Lekki", "city": "Lekki", "state": "Lagos", "country": "NG", "customer_id": "CUST_103_LAG", "product_id": "MON-24-003", "product_cat": "Display", "price": 85000, "qty": 1, "order_date": "2024-01-18"},
    {"order_id": "ORD_LAG_002_5004", "store_id": "LAG_002_Lekki", "city": "Lekki", "state": "Lagos", "country": "NG", "customer_id": "CUST_104_LAG", "product_id": "MSE-BLK-001", "product_cat": "Accessories", "price": 25000, "qty": 3, "order_date": "2024-02-05"},
    {"order_id": "ORD_LAG_003_5005", "store_id": "LAG_003_VI", "city": "Victoria Island", "state": "Lagos", "country": "NG", "customer_id": "CUST_105_LAG", "product_id": "CAB-USB-004", "product_cat": "Accessories", "price": 15000, "qty": 2, "order_date": "2024-02-10"},
    {"order_id": "ORD_LDN_001_2001", "store_id": "LDN_001_Camden", "city": "Camden", "state": "London", "country": "UK", "customer_id": "CUST_106_LDN", "product_id": "MSE-BLK-001", "product_cat": "Accessories", "price": 120.50, "qty": 3, "order_date": "2024-01-10"},
    {"order_id": "ORD_LDN_001_2002", "store_id": "LDN_001_Camden", "city": "Camden", "state": "London", "country": "UK", "customer_id": "CUST_107_LDN", "product_id": "KBD-WHT-002", "product_cat": "Accessories", "price": 85.00, "qty": 2, "order_date": "2024-02-12"},
    {"order_id": "ORD_ABJ_001_3001", "store_id": "ABJ_001_Garki", "city": "Garki", "state": "FCT", "country": "NG", "customer_id": "CUST_108_ABJ", "product_id": "MON-24-003", "product_cat": "Display", "price": 90000, "qty": 1, "order_date": "2024-01-25"},
    {"order_id": "ORD_LAG_001_5005", "store_id": "LAG_001_Ikeja", "city": "Ikeja", "state": "Lagos", "country": "NG", "customer_id": "CUST_101_LAG", "product_id": "MON-24-003", "product_cat": "Display", "price": 85000, "qty": 1, "order_date": "2024-02-20"},
    {"order_id": "ORD_LAG_002_5006", "store_id": "LAG_002_Lekki", "city": "Lekki", "state": "Lagos", "country": "NG", "customer_id": "CUST_103_LAG", "product_id": "CAB-USB-004", "product_cat": "Accessories", "price": 15000, "qty": 4, "order_date": "2024-02-22"},
]

df = pd.DataFrame(orders)
df["order_date"] = pd.to_datetime(df["order_date"])
df["subtotal"] = df["price"] * df["qty"]
tax_map = {sid: info["tax"] for sid, info in MY_STORES.items()}
df["total_with_tax"] = df["subtotal"] * (1 + df["store_id"].map(tax_map))
df["location_code"] = df["store_id"].str.split("_").str[0]
df["month"] = df["order_date"].dt.to_period("M")

print(f"DataFrame {df.shape}")
print(df[["order_id", "store_id", "city", "country", "total_with_tax", "month"]].head())

print("\n--- Revenue by store_id ---")
print(df.groupby("store_id")["total_with_tax"].sum().sort_values(ascending=False))

print("\n--- Revenue by city ---")
print(df.groupby("city")["total_with_tax"].sum().sort_values(ascending=False))

print("\n--- Revenue by country NG vs UK ---")
print(df.groupby("country")["total_with_tax"].sum())

print("\n--- Revenue by location_code LAG/LDN/ABJ ---")
print(df.groupby("location_code")["total_with_tax"].sum())

print("\n--- Revenue by month ---")
print(df.groupby("month")["total_with_tax"].sum())

print("\n--- Agg by store_id multiple metrics ---")
agg_store = df.groupby("store_id").agg(
    revenue=("total_with_tax","sum"),
    avg_order=("total_with_tax","mean"),
    orders=("order_id","count"),
    customers=("customer_id","nunique"),
    max_order=("total_with_tax","max")
).sort_values("revenue", ascending=False)
print(agg_store)

print("\n--- Agg by city ---")
agg_city = df.groupby("city").agg(
    revenue=("total_with_tax","sum"),
    orders=("order_id","count"),
    avg_price=("price","mean"),
    customers=("customer_id","nunique")
).sort_values("revenue", ascending=False)
print(agg_city)

print("\n--- Groupby country and month ---")
print(df.groupby(["country","month"])["total_with_tax"].sum())

print("\n--- Groupby product_cat ---")
print(df.groupby("product_cat")["total_with_tax"].sum())

print("\n--- Pivot: store_id vs month ---")
pivot = df.pivot_table(index="store_id", columns="month", values="total_with_tax", aggfunc="sum", fill_value=0)
print(pivot)

print("\n--- Pivot: country vs city ---")
pivot2 = df.pivot_table(index="country", columns="city", values="total_with_tax", aggfunc="sum", fill_value=0)
print(pivot2)

print("\n--- Pivot: product_cat vs location_code ---")
pivot3 = df.pivot_table(index="product_cat", columns="location_code", values="total_with_tax", aggfunc="sum", fill_value=0)
print(pivot3)

print("\n=== Part 2: Kaggle Dataset Groupby ===")
kaggle_files = ["Superstore.csv", "olist_order_payments_dataset.csv", "olist_customers_dataset.csv", "data.csv"]
found = None
for kf in kaggle_files:
    if os.path.exists(kf):
        found = kf
        break

if found:
    print(f"Found Kaggle file {found}")
    df_kaggle = pd.read_csv(found, encoding="utf-8", low_memory=False, nrows=20000)
    print(f"  Shape {df_kaggle.shape}, Columns {df_kaggle.columns.tolist()[:10]}")
    
    if "City" in df_kaggle.columns and "Sales" in df_kaggle.columns:
        print(f"\n  Groupby City Sales:")
        print(df_kaggle.groupby("City")["Sales"].sum().sort_values(ascending=False).head())
        print(f"\n  Groupby State Sales:")
        print(df_kaggle.groupby("State")["Sales"].sum().sort_values(ascending=False).head())
        print(f"\n  Groupby Country Sales:")
        print(df_kaggle.groupby("Country")["Sales"].sum())
        print(f"\n  Groupby Category Sales:")
        if "Category" in df_kaggle.columns:
            print(df_kaggle.groupby("Category")["Sales"].sum())
        print(f"\n  Agg by City multiple metrics:")
        print(df_kaggle.groupby("City").agg(revenue=("Sales","sum"), orders=("Order ID","count"), avg_sales=("Sales","mean")).sort_values("revenue", ascending=False).head())
        
        # Add month if Order Date exists
        if "Order Date" in df_kaggle.columns:
            df_kaggle["Order Date"] = pd.to_datetime(df_kaggle["Order Date"], errors="coerce")
            df_kaggle["month"] = df_kaggle["Order Date"].dt.to_period("M")
            print(f"\n  Revenue by month:")
            print(df_kaggle.groupby("month")["Sales"].sum().head())
            print(f"\n  Pivot State vs month:")
            print(df_kaggle.pivot_table(index="State", columns="month", values="Sales", aggfunc="sum", fill_value=0).head())
    
    if "customer_state" in df_kaggle.columns:
        print(f"\n  Groupby customer_state count:")
        print(df_kaggle["customer_state"].value_counts().head())
        print(f"\n  Groupby customer_city count:")
        print(df_kaggle["customer_city"].value_counts().head())
    
    if "payment_value" in df_kaggle.columns:
        print(f"\n  payment_value stats by payment_type:")
        if "payment_type" in df_kaggle.columns:
            print(df_kaggle.groupby("payment_type")["payment_value"].agg(["sum","mean","count"]).sort_values("sum", ascending=False))
    
    if "Country" in df_kaggle.columns and "UnitPrice" in df_kaggle.columns:
        # ecommerce-data data.csv
        df_kaggle["Total"] = df_kaggle["Quantity"] * df_kaggle["UnitPrice"]
        print(f"\n  Revenue by Country:")
        print(df_kaggle.groupby("Country")["Total"].sum().sort_values(ascending=False).head())
    
    # Save report
    agg_store.to_csv("report_revenue_by_store_L21.csv")
    pivot.to_csv("pivot_store_vs_month_L21.csv")
    print(f"\n  Saved report_revenue_by_store_L21.csv and pivot_store_vs_month_L21.csv")
    
else:
    print(f"No Kaggle file found. Download:")
    print(f"  Primary: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce")
    print(f"    Files: olist_customers_dataset.csv customer_city, customer_state")
    print(f"           olist_order_payments_dataset.csv payment_value, payment_type")
    print(f"           olist_orders_dataset.csv order_purchase_timestamp -> month")
    print(f"  Secondary: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final")
    print(f"    File: Superstore.csv - Order ID, City, State, Country, Region, Category, Sub-Category, Sales, Quantity, Profit")
    print(f"    Perfect for groupby City, State, Country, Category, month, pivot State vs month, Category vs Region")
    print(f"  Tertiary: https://www.kaggle.com/datasets/carrie1/ecommerce-data")
    print(f"    File: data.csv - Country, CustomerID, InvoiceDate -> month, Quantity*UnitPrice")

print(f"\n=== Summary for Your Stores ===")
total_rev = df["total_with_tax"].sum()
print(f"Total revenue all stores: ${total_rev:.2f}")
for country in df["country"].unique():
    rev = df[df["country"]==country]["total_with_tax"].sum()
    print(f"  {country}: ${rev:.2f} ({rev/total_rev*100:.1f}%)")
for store_id in df["store_id"].unique():
    rev = df[df["store_id"]==store_id]["total_with_tax"].sum()
    city = df[df["store_id"]==store_id]["city"].iloc[0]
    print(f"  {store_id} {city}: ${rev:.2f}")

df.to_csv("my_store_sales_L21.csv", index=False)
print(f"\nSaved my_store_sales_L21.csv with {len(df)} orders")
```

**Deliverable:** Upload `grouping_agg_L21.py` plus outputs:
- `my_store_sales_L21.csv` with your orders
- `report_revenue_by_store_L21.csv` with revenue, avg_order, orders, customers, max_order per store_id LAG_001_Ikeja, LAG_002_Lekki, LAG_003_VI, LDN_001_Camden, ABJ_001_Garki
- `pivot_store_vs_month_L21.csv` pivot store_id vs month 2024-01, 2024-02
- Console logs: revenue by store_id, city Ikeja/Lekki/VI/Camden/Garki, country NG vs UK, location_code LAG/LDN/ABJ, month, product_cat, agg by store multiple metrics, pivot country vs city and product_cat vs location_code
- If Kaggle Superstore.csv downloaded, show groupby City Sales top 5, State Sales top 5, Country Sales, Category Sales, agg by City revenue/orders/avg, revenue by month, pivot State vs month

**Kaggle Links:**
1. Primary: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce (customer_city, customer_state, payment_value, payment_type, order_purchase_timestamp -> month for groupby)
2. Secondary: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final (Superstore.csv City, State, Country, Region, Category, Sub-Category, Sales, Quantity, Profit, Order Date -> month - best for groupby and pivot)
3. Tertiary: https://www.kaggle.com/datasets/carrie1/ecommerce-data (Country, CustomerID, InvoiceDate -> month, Quantity*UnitPrice)
4. Bonus: https://www.kaggle.com/datasets/mkechinov/ecommerce-behavior-data-from-multi-category-store (category_code, brand, price)

## 5. Checklist

- Can you groupby store_id LAG_001_Ikeja, LAG_002_Lekki, LDN_001_Camden, ABJ_001_Garki and sum total_with_tax for revenue per store?
- Can you groupby city Ikeja, Lekki, VI, Camden, Garki and country NG vs UK and location_code LAG/LDN/ABJ?
- Can you groupby month 2024-01, 2024-02 and country+month for monthly reports?
- Can you use agg with multiple metrics revenue sum, avg_order mean, orders count, customers nunique, max_order max per store?
- Can you build pivot_table store_id vs month, country vs city, product_cat vs location_code for manager comparison?
- Can you use crosstab for count orders per store vs month?
- Can you load Kaggle Superstore.csv and groupby City, State, Country, Category Sales sum, agg multiple metrics, and pivot State vs month?

If yes, you build manager-ready reports.

Next: Data Cleaning Project with Pandas.

**Key Takeaway:** Raw 100k rows not useful for manager. Groupby store_id LAG_001_Ikeja, city Ikeja, country NG vs UK, location_code LAG/LDN/ABJ, month 2024-01 gives revenue per group. Agg gives multiple metrics revenue, avg, count, customers, max. Pivot gives side-by-side comparison store vs month, country vs city, product vs location. Use for Kaggle Superstore groupby City, State, Category and pivot State vs month.
