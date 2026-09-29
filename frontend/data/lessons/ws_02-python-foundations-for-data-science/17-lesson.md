# Lesson 17 - Iterators, Comprehensions and Generators - Write Faster Code

**Duration:** 70 min | **Level:** Intermediate | **Goal:** Replace slow loops with fast Pythonic code and handle big files without loading all into memory

## Learning Objectives
- Use list, dict, set comprehensions for cleaning and reports.
- Build generators to process million-row Kaggle files without memory crash.
- Apply iterator patterns for real Lagos and London store analytics.

---

## 1. Why Comprehensions and Generators Matter

<svg width="100%" height="190" viewBox="0 0 700 190" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="190" rx="16" fill="#FFFFFF"/>
  <text x="350" y="28" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">LOOP vs COMPREHENSION vs GENERATOR</text>
  <rect x="20" y="50" width="200" height="120" rx="12" fill="#FEE2E2" stroke="#991B1B" stroke-width="1.5"/>
  <text x="120" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#7F1D1D">FOR LOOP - Slow, verbose</text>
  <text x="35" y="90" font-family="Arial" font-size="9" fill="#7F1D1D">cleaned = []</text>
  <text x="35" y="105" font-family="Arial" font-size="9" fill="#7F1D1D">for row in sales:</text>
  <text x="35" y="120" font-family="Arial" font-size="9" fill="#7F1D1D">  if valid: cleaned.append(row)</text>
  <text x="35" y="135" font-family="Arial" font-size="9" fill="#7F1D1D">5 lines, slow for 1M rows</text>
  <text x="35" y="150" font-family="Arial" font-size="9" fill="#7F1D1D">Loads all in memory</text>
  <rect x="250" y="50" width="200" height="120" rx="12" fill="#DBEAFE" stroke="#1E40AF" stroke-width="1.5"/>
  <text x="350" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#1E3A8A">COMPREHENSION - Fast</text>
  <text x="265" y="90" font-family="Arial" font-size="9" fill="#1E3A8A">cleaned = [row for row in sales</text>
  <text x="265" y="105" font-family="Arial" font-size="9" fill="#1E3A8A">           if valid]</text>
  <text x="265" y="120" font-family="Arial" font-size="9" fill="#1E3A8A">1 line, 2x faster</text>
  <text x="265" y="135" font-family="Arial" font-size="9" fill="#1E3A8A">Pythonic, readable</text>
  <text x="265" y="150" font-family="Arial" font-size="9" fill="#1E3A8A">Still loads all</text>
  <rect x="480" y="50" width="200" height="120" rx="12" fill="#D1FAE5" stroke="#065F46" stroke-width="1.5"/>
  <text x="580" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#064E3B">GENERATOR - Memory safe</text>
  <text x="495" y="90" font-family="Arial" font-size="9" fill="#064E3B">(row for row in sales</text>
  <text x="495" y="105" font-family="Arial" font-size="9" fill="#064E3B"> if valid)</text>
  <text x="495" y="120" font-family="Arial" font-size="9" fill="#064E3B">Processes 1 row at a time</text>
  <text x="495" y="135" font-family="Arial" font-size="9" fill="#064E3B">Handles 10M rows Kaggle</text>
  <text x="495" y="150" font-family="Arial" font-size="9" fill="#064E3B">No memory crash</text>
</svg>

When you have 1 million orders from LAG_001_Ikeja to LDN_002_Stratford, for loop with append works but comprehension is faster and shorter. Generator is critical - it does not load all 1M rows at once, it yields one by one.

## 2. List Comprehensions - Real Store Examples

**Real World Example 1 - Clean names and prices fast:**

```
# Raw data from Lagos stores
raw_customers = [
    {"customer_id": "CUST_101_LAG", "name": "  alex johnson  ", "location": "Ikeja, Lagos, NG", "store_id": "LAG_001_Ikeja", "price": "$25.99"},
    {"customer_id": "CUST_102_LAG", "name": "SAM LEE", "location": "Lekki, Lagos, NG", "store_id": "LAG_002_Lekki", "price": "$45.00"},
    {"customer_id": "CUST_103_ABJ", "name": "  ", "location": "Garki, Abuja, NG", "store_id": "ABJ_001_Garki", "price": "N/A"},
    {"customer_id": "CUST_104_LDN", "name": "maria garcia", "location": "Camden, London, UK", "store_id": "LDN_001_Camden", "price": "199.99"},
]

# For loop way - 6 lines
cleaned_loop = []
for c in raw_customers:
    name = c["name"].strip().title()
    if name:
        cleaned_loop.append(name)

# Comprehension way - 1 line
cleaned_comp = [c["name"].strip().title() for c in raw_customers if c["name"].strip()]

print(cleaned_comp)  # ['Alex Johnson', 'Sam Lee', 'Maria Garcia']

# Clean price with comprehension
def clean_price(p):
    if not p:
        return None
    try:
        return float(str(p).replace("$","").replace(",","").strip())
    except:
        return None

prices = [clean_price(c["price"]) for c in raw_customers]
valid_prices = [p for p in prices if p is not None]
print(valid_prices)  # [25.99, 45.0, 199.99]

# Create IDs list for Lagos only
lagos_customers = [c["customer_id"] for c in raw_customers if "LAG" in c["store_id"] or "ABJ" in c["store_id"]]
print(lagos_customers)  # ['CUST_101_LAG', 'CUST_102_LAG', 'CUST_103_ABJ']

# Total revenue comprehension
orders = [
    {"order_id": "ORD_LAG_001_5001", "store_id": "LAG_001_Ikeja", "price": 25000, "qty": 2},
    {"order_id": "ORD_LAG_002_5002", "store_id": "LAG_002_Lekki", "price": 32000, "qty": 1},
    {"order_id": "ORD_LDN_001_2001", "store_id": "LDN_001_Camden", "price": 120.5, "qty": 3},
]

total_revenue = sum([o["price"] * o["qty"] for o in orders])
print(f"Total revenue: {total_revenue}")

# Revenue per store with dict comprehension inside list
store_ids = ["LAG_001_Ikeja", "LAG_002_Lekki", "LDN_001_Camden"]
revenue_by_store = {sid: sum(o["price"] * o["qty"] for o in orders if o["store_id"] == sid) for sid in store_ids}
print(revenue_by_store)
```

Comprehension: `[expression for item in list if condition]`

**Real World Example 2 - Dict and Set comprehensions:**

```
# Dict comprehension - map customer_id to cleaned name
customer_map = {c["customer_id"]: c["name"].strip().title() for c in raw_customers if c["name"].strip()}
print(customer_map)
# {'CUST_101_LAG': 'Alex Johnson', 'CUST_102_LAG': 'Sam Lee', 'CUST_104_LDN': 'Maria Garcia'}

# Dict comprehension - store_id to location
stores = [
    {"store_id": "LAG_001_Ikeja", "city": "Ikeja", "country": "NG", "address": "12 Allen Ave, Ikeja, Lagos, NG 101233"},
    {"store_id": "LAG_002_Lekki", "city": "Lekki", "country": "NG", "address": "Admiralty Way, Lekki, Lagos, NG 105102"},
    {"store_id": "LDN_001_Camden", "city": "Camden", "country": "UK", "address": "45 Camden High St, London, UK NW1 0JH"},
]

store_location_map = {s["store_id"]: f"{s['city']}, {s['country']}" for s in stores}
print(store_location_map)
# {'LAG_001_Ikeja': 'Ikeja, NG', 'LAG_002_Lekki': 'Lekki, NG', 'LDN_001_Camden': 'Camden, UK'}

# Set comprehension - unique cities
cities = {s["city"] for s in stores}
print(cities)  # {'Ikeja', 'Lekki', 'Camden'}

# Unique location codes LAG, LDN, ABJ from store_ids
store_ids = ["LAG_001_Ikeja", "LAG_002_Lekki", "LAG_003_VI", "LDN_001_Camden", "ABJ_001_Garki"]
location_codes = {sid.split("_")[0] for sid in store_ids}
print(location_codes)  # {'LAG', 'LDN', 'ABJ'}
```

Dict comprehension `{key: value for item}`, Set comprehension `{value for item}` - unique automatically.

## 3. Generators - Handle Big Kaggle Files

**Real World Example 3 - Generator for large CSV:**

```
import csv

def read_large_csv_gen(filepath):
    # Generator - yields one row at a time, not all at once
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            yield row

# Using generator - memory safe for 10M rows
# Even if file is 2GB, only one row in memory at a time

def clean_row_gen(rows_gen):
    # Chain generators - clean each row
    for row in rows_gen:
        # Clean price
        try:
            price_str = row.get("Sales", row.get("price", "0")).replace("$","").replace(",","")
            price = float(price_str)
        except:
            continue  # skip bad
        
        # Clean store
        store_id = row.get("store_id", row.get("Store ID", "")).strip()
        if not store_id:
            continue
        
        yield {
            "order_id": row.get("Order ID", row.get("order_id")),
            "store_id": store_id,
            "price": price,
            "city": row.get("City", row.get("city"))
        }

# Real usage - process without loading all
# filepath = "olist_orders_dataset.csv"  # 100k rows Kaggle
# rows = read_large_csv_gen(filepath)
# cleaned = clean_row_gen(rows)
# for clean_row in cleaned:
#     print(clean_row)  # Process one by one
#     # Can break early without reading entire file

# Demo with small list as generator
orders_list = [
    {"order_id": "ORD_LAG_001_5001", "store_id": "LAG_001_Ikeja", "price": "25000", "city": "Ikeja"},
    {"order_id": "ORD_LAG_002_5002", "store_id": "LAG_002_Lekki", "price": "N/A", "city": "Lekki"},
    {"order_id": "ORD_LDN_001_2001", "store_id": "LDN_001_Camden", "price": "120.5", "city": "Camden"},
]

# Generator expression - parentheses not brackets
clean_gen = ( {"order_id": o["order_id"], "price": float(o["price"])} for o in orders_list if o["price"] != "N/A" )
print(clean_gen)  # <generator object>

for c in clean_gen:
    print(c)

# Sum with generator - no intermediate list
total = sum(float(o["price"]) for o in orders_list if o["price"] != "N/A")
print(f"Total via generator sum: {total}")
```

Generator expression `(x for x in list if cond)` - same as list comp but lazy, memory efficient.

**Real World Example 4 - Custom generator function with yield:**

```
def lagos_orders_only(all_orders):
    # Yield only Lagos orders
    for order in all_orders:
        store_id = order.get("store_id", "")
        if store_id.startswith("LAG") or store_id.startswith("ABJ"):
            yield order

def with_tax_calculated(orders_gen):
    # Add tax based on location
    for order in orders_gen:
        store_id = order["store_id"]
        tax_rate = 0.075 if store_id.startswith("LAG") or store_id.startswith("ABJ") else 0.20
        total = order["price"] * 1.0 * (1 + tax_rate) if isinstance(order["price"], (int,float)) else 0
        yield {**order, "total_with_tax": round(total, 2), "tax_rate": tax_rate}

all_orders = [
    {"order_id": "ORD_LAG_001_5001", "store_id": "LAG_001_Ikeja", "price": 25000, "customer_id": "CUST_101_LAG"},
    {"order_id": "ORD_LAG_002_5002", "store_id": "LAG_002_Lekki", "price": 32000, "customer_id": "CUST_102_LAG"},
    {"order_id": "ORD_LDN_001_2001", "store_id": "LDN_001_Camden", "price": 120.5, "customer_id": "CUST_103_LDN"},
    {"order_id": "ORD_ABJ_001_3001", "store_id": "ABJ_001_Garki", "price": 15000, "customer_id": "CUST_104_ABJ"},
]

# Chain generators: filter Lagos then calc tax
lagos_gen = lagos_orders_only(all_orders)
taxed_gen = with_tax_calculated(lagos_gen)

for order in taxed_gen:
    print(f"{order['order_id']} {order['store_id']} Total with tax: {order['total_with_tax']}")

# Count Lagos orders without creating list
count_lagos = sum(1 for _ in lagos_orders_only(all_orders))
print(f"Lagos/Abuja orders count: {count_lagos}")
```

Chaining generators is powerful for pipeline: read -> filter -> clean -> calculate, each step one row at a time.

## 4. Iterator Tools - itertools for Reports

**Real World Example 5 - Grouping and combining:**

```
from itertools import groupby, islice, chain
from collections import defaultdict

# Group orders by store_id for report
orders_sorted = sorted(all_orders, key=lambda x: x["store_id"])

print("Grouped by store_id:")
for store_id, group in groupby(orders_sorted, key=lambda x: x["store_id"]):
    group_list = list(group)
    total = sum(o["price"] for o in group_list)
    print(f"  {store_id}: {len(group_list)} orders, total ${total}")

# islice - take first N without loading all
first_two = list(islice(all_orders, 2))
print(f"First two orders: {first_two}")

# chain - combine Lagos and London orders
lagos_orders = [o for o in all_orders if o["store_id"].startswith("LAG")]
london_orders = [o for o in all_orders if o["store_id"].startswith("LDN")]

combined = list(chain(lagos_orders, london_orders))
print(f"Combined Lagos+London: {len(combined)} orders")

# Enumerate with start for order numbering
for idx, order in enumerate(all_orders, start=5001):
    print(f"  Order #{idx}: {order['order_id']} {order['store_id']}")
```

## 5. Hands-On Assignment with Kaggle Dataset

**Assignment 17: Fast Processing of Big Sales Data**

**Dataset to download:**
Kaggle: Large E-commerce datasets for generator practice
Links:
- Primary: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce (100k orders, 100k customers - need generators)
- Secondary: https://www.kaggle.com/datasets/carrie1/ecommerce-data (500k rows, 1 year transactions - perfect for generator vs list memory)
- Tertiary: https://www.kaggle.com/datasets/mkechinov/ecommerce-behavior-data-from-multi-category-store (4M events, needs generators)
- Bonus: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final (10k rows, good for comprehension practice)

Download `olist_orders_dataset.csv` (100k rows) or `data.csv` from ecommerce-data (500k rows)

**Task - Create file `fast_processing_L17.py`:**

```
import csv
import os
from itertools import groupby, islice
from collections import defaultdict

# Store mapping with locations
STORE_MAP = {
    "LAG_001_Ikeja": {"city": "Ikeja", "state": "Lagos", "country": "NG", "tax": 0.075, "address": "12 Allen Ave, Ikeja, Lagos, NG 101233"},
    "LAG_002_Lekki": {"city": "Lekki", "state": "Lagos", "country": "NG", "tax": 0.075, "address": "Admiralty Way, Lekki, Lagos, NG 105102"},
    "LDN_001_Camden": {"city": "Camden", "state": "London", "country": "UK", "tax": 0.20, "address": "45 Camden High St, London, UK NW1 0JH"},
    "ABJ_001_Garki": {"city": "Garki", "state": "FCT", "country": "NG", "tax": 0.075, "address": "Plot 123 Garki, Abuja, NG 900242"},
}

def csv_generator(filepath):
    # Memory safe generator for large Kaggle files
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        for row in reader:
            yield row

def clean_order_gen(rows_gen):
    for row in rows_gen:
        # Handle different column names from different Kaggle datasets
        order_id = row.get("order_id") or row.get("Order ID") or row.get("InvoiceNo") or "UNKNOWN"
        price_raw = row.get("price") or row.get("Sales") or row.get("UnitPrice") or row.get("payment_value") or "0"
        city = row.get("customer_city") or row.get("City") or row.get("Country") or "Unknown"
        
        try:
            price = float(str(price_raw).replace("$","").replace(",","").strip())
        except:
            continue
        
        if price <= 0:
            continue
        
        # Assign to nearest store based on city for demo, or use real store_id if present
        store_id = row.get("store_id") or ("LAG_001_Ikeja" if "Lagos" in city or "Ikeja" in city else "LDN_001_Camden" if "London" in city or "Camden" in city else "LAG_001_Ikeja")
        
        yield {
            "order_id": order_id[:20],
            "store_id": store_id,
            "price": price,
            "city": city,
            "customer_id": row.get("customer_id") or row.get("CustomerID") or f"CUST_{hash(order_id)%1000:03d}_LAG"
        }

def add_tax_gen(orders_gen):
    for order in orders_gen:
        tax_rate = STORE_MAP.get(order["store_id"], {"tax": 0.075})["tax"]
        total = order["price"] * (1 + tax_rate)
        yield {**order, "total_with_tax": round(total,2), "tax_rate": tax_rate}

# Test with small sample using comprehensions
sample_orders = [
    {"order_id": "ORD_LAG_001_5001", "store_id": "LAG_001_Ikeja", "price": 25000, "city": "Ikeja, Lagos, NG", "customer_id": "CUST_101_LAG"},
    {"order_id": "ORD_LAG_002_5002", "store_id": "LAG_002_Lekki", "price": 32000, "city": "Lekki, Lagos, NG", "customer_id": "CUST_102_LAG"},
    {"order_id": "ORD_ABJ_001_3001", "store_id": "ABJ_001_Garki", "price": 15000, "city": "Garki, Abuja, NG", "customer_id": "CUST_103_ABJ"},
    {"order_id": "ORD_LDN_001_2001", "store_id": "LDN_001_Camden", "price": 120.5, "city": "Camden, London, UK", "customer_id": "CUST_104_LDN"},
    {"order_id": "ORD_LAG_001_5003", "store_id": "LAG_001_Ikeja", "price": 40000, "city": "Ikeja, Lagos, NG", "customer_id": "CUST_105_LAG"},
]

print("=== Comprehension Examples ===")
# List comprehension - Lagos orders only
lagos_only = [o for o in sample_orders if o["store_id"].startswith("LAG") or o["store_id"].startswith("ABJ")]
print(f"Lagos/Abuja orders: {len(lagos_only)}")

# Dict comprehension - order_id to total with tax
order_totals = {o["order_id"]: round(o["price"] * (1 + STORE_MAP[o["store_id"]]["tax"]),2) for o in sample_orders}
print(f"Order totals with tax: {order_totals}")

# Set comprehension - unique cities
unique_cities = {o["city"] for o in sample_orders}
print(f"Unique cities: {unique_cities}")

# Dict comprehension - revenue by store
revenue_by_store = {sid: sum(o["price"] for o in sample_orders if o["store_id"]==sid) for sid in STORE_MAP}
print(f"Revenue by store: {revenue_by_store}")

# Generator expression - sum without list
total_revenue = sum(o["price"] for o in sample_orders)
print(f"Total revenue via generator: {total_revenue}")

print("\n=== Generator Chain Example ===")
# Chain generators: filter Lagos, add tax
lagos_gen = (o for o in sample_orders if o["store_id"].startswith("LAG") or o["store_id"].startswith("ABJ"))
taxed_lagos_gen = ({**o, "total_with_tax": round(o["price"]*1.075,2)} for o in lagos_gen)

for order in taxed_lagos_gen:
    print(f"  {order['order_id']} {order['store_id']} {order['city']} Price {order['price']} Total with Lagos tax {order['total_with_tax']}")

print("\n=== Kaggle Large File Processing (Generator - Memory Safe) ===")
kaggle_files = ["olist_orders_dataset.csv", "data.csv", "olist_order_payments_dataset.csv", "Superstore.csv"]
found_file = None
for kf in kaggle_files:
    if os.path.exists(kf):
        found_file = kf
        break

if found_file:
    print(f"Found Kaggle file: {found_file} - processing with generators (memory safe for 500k rows)")
    
    # Count rows with generator - no list
    row_count = sum(1 for _ in csv_generator(found_file))
    print(f"  Total rows: {row_count}")
    
    # Process first 1000 rows only with islice - does not read entire file into memory
    gen = csv_generator(found_file)
    cleaned_gen = clean_order_gen(gen)
    taxed_gen = add_tax_gen(cleaned_gen)
    
    first_100 = list(islice(taxed_gen, 100))
    print(f"  First 5 cleaned with tax:")
    for o in first_100[:5]:
        print(f"    {o['order_id']} {o['store_id']} {o['city']} Price {o['price']} Total {o['total_with_tax']}")
    
    # Revenue by city using generator - memory safe
    gen2 = csv_generator(found_file)
    cleaned2 = clean_order_gen(gen2)
    city_revenue = defaultdict(float)
    for o in cleaned2:
        city_revenue[o["city"]] += o["price"]
    
    print(f"  Top 5 cities by revenue:")
    for city, rev in sorted(city_revenue.items(), key=lambda x: x[1], reverse=True)[:5]:
        print(f"    {city}: ${rev:.2f}")
    
    print(f"\nGenerator processed {row_count} rows without loading all into memory!")
else:
    print(f"No Kaggle file found. Download one of:")
    print(f"  https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - olist_orders_dataset.csv (100k rows)")
    print(f"  https://www.kaggle.com/datasets/carrie1/ecommerce-data - data.csv (500k rows, best for generator demo)")
    print(f"  https://www.kaggle.com/datasets/mkechinov/ecommerce-behavior-data-from-multi-category-store (4M rows)")
    print(f"Place file in this folder and re-run")

print("\n=== Performance: List vs Generator ===")
import sys
list_comp = [o["price"]*1.075 for o in sample_orders]
gen_exp = (o["price"]*1.075 for o in sample_orders)
print(f"List comprehension size: {sys.getsizeof(list_comp)} bytes (stores all)")
print(f"Generator expression size: {sys.getsizeof(gen_exp)} bytes (one at a time)")
print(f"For 1M rows, list = ~8MB, generator = ~100 bytes - generator wins for big Kaggle files")
```

**Deliverable:** Upload `fast_processing_L17.py` and output showing:
- List comprehension Lagos orders, dict comprehension order totals with tax for LAG_001_Ikeja etc, set comprehension unique cities
- Generator chain filtering Lagos and adding tax
- If Kaggle file downloaded (olist_orders_dataset.csv or data.csv), show total rows count, first 5 cleaned with tax, top 5 cities by revenue, and proof generator processed without memory crash
- Performance comparison list vs generator size

**Kaggle Links:**
1. Primary: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce (100k orders, needs generators)
2. Best for Generator Demo: https://www.kaggle.com/datasets/carrie1/ecommerce-data (541k rows, 8 columns - will crash if you use list, needs generator)
3. Large: https://www.kaggle.com/datasets/mkechinov/ecommerce-behavior-data-from-multi-category-store (4.2M events, 2GB - only generators work)
4. Practice: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final (9k rows, good for comprehension practice before generators)

## 6. Checklist

- Can you write list comprehension to filter Lagos stores LAG_001_Ikeja, LAG_002_Lekki, ABJ_001_Garki and clean names?
- Can you write dict comprehension mapping customer_id CUST_101_LAG to name and order_id to total with tax 7.5% Lagos vs 20% London?
- Can you write set comprehension for unique cities Ikeja, Lekki, Camden, Garki and location codes LAG, LDN, ABJ?
- Can you create generator function with yield that reads CSV one row at a time for 500k Kaggle file?
- Can you chain generators: read -> filter Lagos -> add tax -> calculate total without loading all into memory?
- Can you use islice to take first 100 without reading entire file and groupby to group by store_id?
- Can you explain list vs generator memory difference for 1M rows and why generators needed for Kaggle ecommerce-data?

If yes, you write fast Pythonic code and handle big files.

Next: Working with APIs and JSON Data.

**Key Takeaway:** List comprehension `[x for x in data if cond]` is 2x faster than loop, dict `{k:v for ...}` and set `{x for ...}` for maps and unique. Generator `(x for ...)` or `yield` processes one row at a time - critical for 500k row Kaggle files like ecommerce-data.csv that would crash with list. Chain generators for pipeline: read large CSV -> filter Lagos -> clean -> add tax per location -> sum, all without loading full file. Use itertools groupby, islice for reports.
