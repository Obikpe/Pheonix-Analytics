# Lesson 18 - Working with APIs and JSON Data

**Duration:** 75 min | **Level:** Intermediate | **Goal:** Fetch real data from APIs and turn JSON into clean tables for your Lagos and London stores

## Learning Objectives
- Call REST APIs with requests and handle errors, timeouts, and rate limits.
- Parse nested JSON into flat tables with store IDs and locations.
- Combine API data (exchange rates, geocoding, weather) with your local sales data.

---

## 1. Why APIs Matter for Data Work

<svg width="100%" height="190" viewBox="0 0 700 190" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="190" rx="16" fill="#FFFFFF"/>
  <text x="350" y="28" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">LOCAL CSV vs API ENRICHMENT</text>
  <rect x="20" y="50" width="200" height="120" rx="12" fill="#FEE2E2" stroke="#991B1B" stroke-width="1.5"/>
  <text x="120" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#7F1D1D">ONLY CSV</text>
  <text x="35" y="90" font-family="Arial" font-size="9" fill="#7F1D1D">Order ORD_LAG_001_5001</text>
  <text x="35" y="105" font-family="Arial" font-size="9" fill="#7F1D1D">Price $120 USD</text>
  <text x="35" y="120" font-family="Arial" font-size="9" fill="#7F1D1D">City Ikeja</text>
  <text x="35" y="135" font-family="Arial" font-size="9" fill="#7F1D1D">No exchange rate</text>
  <text x="35" y="150" font-family="Arial" font-size="9" fill="#7F1D1D">No weather, no geocode</text>
  <rect x="250" y="50" width="200" height="120" rx="12" fill="#DBEAFE" stroke="#1E40AF" stroke-width="1.5"/>
  <text x="350" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#1E3A8A">API CALLS</text>
  <text x="265" y="90" font-family="Arial" font-size="9" fill="#1E3A8A">Exchange: 1 USD = 1500 NGN</text>
  <text x="265" y="105" font-family="Arial" font-size="9" fill="#1E3A8A">Geocode Ikeja -> 6.60, 3.35</text>
  <text x="265" y="120" font-family="Arial" font-size="9" fill="#1E3A8A">Weather Lagos 32C rainy</text>
  <text x="265" y="135" font-family="Arial" font-size="9" fill="#1E3A8A">Store LAG_001_Ikeja tax 7.5%</text>
  <text x="265" y="150" font-family="Arial" font-size="9" fill="#1E3A8A">Enriched data</text>
  <rect x="480" y="50" width="200" height="120" rx="12" fill="#D1FAE5" stroke="#065F46" stroke-width="1.5"/>
  <text x="580" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#064E3B">COMBINED REPORT</text>
  <text x="495" y="90" font-family="Arial" font-size="9" fill="#064E3B">ORD_LAG_001_5001 $120 = 180k NGN</text>
  <text x="495" y="105" font-family="Arial" font-size="9" fill="#064E3B">Ikeja 6.60,3.35 delivery 3 days</text>
  <text x="495" y="120" font-family="Arial" font-size="9" fill="#064E3B">Rain may delay SLA</text>
  <text x="495" y="135" font-family="Arial" font-size="9" fill="#064E3B">Location-aware pricing</text>
  <text x="495" y="150" font-family="Arial" font-size="9" fill="#064E3B">Professional analysis</text>
</svg>

Your CSV has price $120 for order ORD_LAG_001_5001 at Ikeja, Lagos, NG store LAG_001_Ikeja. But report for Lagos manager needs NGN, need exchange rate from API. Need geocode for delivery distance, need weather to explain late deliveries.

API = way to get data from other systems via internet. JSON = format APIs return.

## 2. Requests Basics - Real API Calls

**Real World Example 1 - Call free exchange rate API:**

```
import requests
import json

# Free API - no key needed - exchange rates
# Example: exchangerate-api.com free endpoint

def get_exchange_rate(base="USD", target="NGN"):
    try:
        # Using exchangerate.host - free, no key
        url = f"https://api.exchangerate.host/latest?base={base}&symbols={target}"
        response = requests.get(url, timeout=10)
        
        # Check if request succeeded
        response.raise_for_status()  # Raises error for 4xx, 5xx
        
        data = response.json()  # Parse JSON
        rate = data.get("rates", {}).get(target)
        return rate, data
    except requests.exceptions.Timeout:
        print(f"Timeout calling exchange API")
        return None, None
    except requests.exceptions.RequestException as e:
        print(f"API error: {e}")
        return None, None
    except Exception as e:
        print(f"Unexpected error: {e}")
        return None, None

# Test with your stores
rate, full_data = get_exchange_rate("USD", "NGN")
if rate:
    print(f"1 USD = {rate} NGN")
    order_usd = 120.00
    order_ngn = order_usd * rate
    print(f"Order ORD_LAG_001_5001 ${order_usd} USD = {order_ngn:,.2f} NGN for store LAG_001_Ikeja")
else:
    print("Using fallback rate 1500")
    rate = 1500
    print(f"Order ${120} = {120*rate:,.2f} NGN")

# USD to GBP for London stores
rate_gbp, _ = get_exchange_rate("USD", "GBP")
if rate_gbp:
    print(f"1 USD = {rate_gbp} GBP - Order ORD_LDN_001_2001 ${120} = £{120*rate_gbp:.2f} for LDN_001_Camden")
```

`requests.get` calls API, `timeout=10` avoids hanging, `raise_for_status()` checks errors, `response.json()` parses JSON.

**Real World Example 2 - Handle errors and retry:**

```
import requests
import time

def call_api_with_retry(url, retries=3, backoff=2):
    for attempt in range(retries):
        try:
            print(f"Attempt {attempt+1} calling {url}")
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.Timeout:
            print(f"Timeout, retrying in {backoff} seconds...")
            time.sleep(backoff)
            backoff *= 2  # Exponential backoff
        except requests.exceptions.HTTPError as e:
            if response.status_code == 429:  # Rate limit
                print(f"Rate limited, waiting {backoff} seconds...")
                time.sleep(backoff)
                backoff *= 2
            else:
                print(f"HTTP error {response.status_code}: {e}")
                return None
        except Exception as e:
            print(f"Error: {e}")
            return None
    
    print(f"Failed after {retries} attempts")
    return None

# Test with your store geocoding - using free geocoding API
# Nominatim OpenStreetMap - free, requires user-agent
def geocode_location(address):
    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            "q": address,
            "format": "json",
            "limit": 1
        }
        headers = {
            "User-Agent": "MyStoreApp LAG_001_Ikeja project (alex@ikeja.lagos.ng)"
        }
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        if data:
            lat = data[0].get("lat")
            lon = data[0].get("lon")
            display = data[0].get("display_name")
            return float(lat), float(lon), display
        return None, None, None
    except Exception as e:
        print(f"Geocode error for {address}: {e}")
        return None, None, None

# Test with your store addresses
stores = [
    {"store_id": "LAG_001_Ikeja", "address": "12 Allen Avenue, Ikeja, Lagos, Nigeria"},
    {"store_id": "LAG_002_Lekki", "address": "Admiralty Way, Lekki, Lagos, Nigeria"},
    {"store_id": "LDN_001_Camden", "address": "45 Camden High Street, London, UK"},
    {"store_id": "ABJ_001_Garki", "address": "Garki, Abuja, Nigeria"},
]

for store in stores:
    lat, lon, display = geocode_location(store["address"])
    if lat:
        print(f"{store['store_id']} {store['address']} -> Lat {lat}, Lon {lon}")
    else:
        print(f"{store['store_id']} geocode failed")
    time.sleep(1)  # Nominatim requires 1 second between requests
```

Always handle timeout, HTTP errors, rate limit 429, and respect API rules (Nominatim needs User-Agent and 1 sec delay).

## 3. Parsing Nested JSON to Flat Table

**Real World Example 3 - Flatten complex JSON:**

APIs return nested JSON like:

```
{
  "order_id": "ORD_LAG_001_5001",
  "customer": {"id": "CUST_101_LAG", "name": "Alex Johnson", "location": {"city": "Ikeja", "country": "NG"}},
  "store": {"store_id": "LAG_001_Ikeja", "address": "12 Allen Ave, Ikeja, Lagos, NG 101233"},
  "items": [{"product_id": "MSE-BLK-001", "price": 25000, "qty": 2}]
}
```

Need to flatten for CSV/report.

```
import json

api_response = {
    "order_id": "ORD_LAG_001_5001",
    "order_date": "2024-01-15",
    "customer": {
        "customer_id": "CUST_101_LAG",
        "name": "Alex Johnson",
        "email": "alex@ikeja.lagos.ng",
        "location": {
            "city": "Ikeja",
            "state": "Lagos",
            "country": "NG",
            "postal_code": "101233"
        }
    },
    "store": {
        "store_id": "LAG_001_Ikeja",
        "city": "Ikeja",
        "country": "NG",
        "tax_rate": 0.075
    },
    "items": [
        {"product_id": "MSE-BLK-001", "name": "Wireless Mouse", "price": 25000, "qty": 2, "category": "Accessories"},
        {"product_id": "KBD-WHT-002", "name": "Keyboard", "price": 15000, "qty": 1, "category": "Accessories"}
    ],
    "payment": {
        "method": "Transfer",
        "currency": "NGN",
        "total": 65000
    }
}

def flatten_order(api_data):
    # Flatten nested JSON to flat dict for CSV
    flat = {}
    flat["order_id"] = api_data.get("order_id")
    flat["order_date"] = api_data.get("order_date")
    
    # Customer nested
    cust = api_data.get("customer", {})
    flat["customer_id"] = cust.get("customer_id")
    flat["customer_name"] = cust.get("name")
    flat["customer_email"] = cust.get("email")
    
    loc = cust.get("location", {})
    flat["customer_city"] = loc.get("city")
    flat["customer_state"] = loc.get("state")
    flat["customer_country"] = loc.get("country")
    flat["customer_postal"] = loc.get("postal_code")
    
    # Store nested
    store = api_data.get("store", {})
    flat["store_id"] = store.get("store_id")
    flat["store_city"] = store.get("city")
    flat["store_country"] = store.get("country")
    flat["store_tax"] = store.get("tax_rate")
    
    # Payment nested
    pay = api_data.get("payment", {})
    flat["payment_method"] = pay.get("method")
    flat["payment_currency"] = pay.get("currency")
    flat["payment_total"] = pay.get("total")
    
    # Items - need to decide: sum or first item
    items = api_data.get("items", [])
    flat["total_items"] = len(items)
    flat["total_qty"] = sum(i.get("qty",0) for i in items)
    flat["items_sku_list"] = ",".join(i.get("product_id","") for i in items)
    
    return flat

flat_order = flatten_order(api_response)
print("Flattened order for CSV/report:")
for k,v in flat_order.items():
    print(f"  {k}: {v}")

# Write to CSV
import csv
with open("flattened_orders.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=flat_order.keys())
    writer.writeheader()
    writer.writerow(flat_order)

print("\nWritten to flattened_orders.csv - ready for Excel/Pandas")

# Parse list of orders from API
api_list_response = {
    "orders": [api_response, api_response],
    "total": 2,
    "store_id": "LAG_001_Ikeja",
    "location": "Ikeja, Lagos, NG"
}

# Extract orders list
orders_flat = [flatten_order(o) for o in api_list_response.get("orders", [])]
print(f"\nFlattened {len(orders_flat)} orders from API list response")
```

**Real World Example 4 - Handle real exchange API JSON:**

```
import requests

# Real example with exchangerate.host response structure
# {"base": "USD", "rates": {"NGN": 1500, "GBP": 0.79}, "date": "2024-01-15"}

def parse_exchange_response(json_data, base="USD"):
    # Safely parse nested
    if not json_data:
        return None
    
    base_curr = json_data.get("base", base)
    date_str = json_data.get("date", "N/A")
    rates = json_data.get("rates", {})
    
    # Extract for your stores
    ngn_rate = rates.get("NGN")
    gbp_rate = rates.get("GBP")
    eur_rate = rates.get("EUR")
    
    return {
        "base": base_curr,
        "date": date_str,
        "NGN": ngn_rate,
        "GBP": gbp_rate,
        "EUR": eur_rate,
        "all_rates": rates
    }

# Mock data if API fails
mock_response = {
    "base": "USD",
    "date": "2024-01-15",
    "rates": {"NGN": 1500.50, "GBP": 0.79, "EUR": 0.92, "KES": 157.0}
}

parsed = parse_exchange_response(mock_response)
print(parsed)
print(f"Store LAG_001_Ikeja: 1 USD = {parsed['NGN']} NGN")
print(f"Store LDN_001_Camden: 1 USD = {parsed['GBP']} GBP")
```

## 4. Combining API Data with Local Sales

**Real World Example 5 - Enrich sales CSV with exchange rates:**

```
import csv

# Your local sales
local_sales = [
    {"order_id": "ORD_LAG_001_5001", "store_id": "LAG_001_Ikeja", "location": "Ikeja, Lagos, NG", "customer_id": "CUST_101_LAG", "amount_usd": 120.00, "order_date": "2024-01-15"},
    {"order_id": "ORD_LAG_002_5002", "store_id": "LAG_002_Lekki", "location": "Lekki, Lagos, NG", "customer_id": "CUST_102_LAG", "amount_usd": 85.50, "order_date": "2024-01-15"},
    {"order_id": "ORD_LDN_001_2001", "store_id": "LDN_001_Camden", "location": "Camden, London, UK", "customer_id": "CUST_103_LDN", "amount_usd": 200.00, "order_date": "2024-01-15"},
    {"order_id": "ORD_ABJ_001_3001", "store_id": "ABJ_001_Garki", "location": "Garki, Abuja, NG", "customer_id": "CUST_104_ABJ", "amount_usd": 150.00, "order_date": "2024-01-15"},
]

# Get rates from API (or fallback)
# In real code call get_exchange_rate, here use mock for stability
rates = {"NGN": 1500.50, "GBP": 0.79, "USD": 1.0}

enriched = []
for sale in local_sales:
    store_id = sale["store_id"]
    location = sale["location"]
    
    # Determine local currency
    if "NG" in location:
        local_curr = "NGN"
        rate = rates["NGN"]
    elif "UK" in location:
        local_curr = "GBP"
        rate = rates["GBP"]
    else:
        local_curr = "USD"
        rate = 1.0
    
    amount_local = sale["amount_usd"] * rate
    
    enriched.append({
        "order_id": sale["order_id"],
        "store_id": store_id,
        "location": location,
        "customer_id": sale["customer_id"],
        "amount_usd": sale["amount_usd"],
        "local_currency": local_curr,
        "exchange_rate": rate,
        "amount_local": round(amount_local, 2),
        "order_date": sale["order_date"]
    })

print("Enriched sales with exchange rates from API:")
for e in enriched:
    print(f"  {e['order_id']} {e['store_id']} {e['location']} - ${e['amount_usd']} USD = {e['amount_local']} {e['local_currency']} (Rate {e['exchange_rate']})")

# Write enriched CSV
with open("enriched_sales_L18.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=enriched[0].keys())
    writer.writeheader()
    writer.writerows(enriched)

print("\nWritten enriched_sales_L18.csv with local currencies for each location")
```

## 5. Hands-On Assignment with Kaggle and Real APIs

**Assignment 18: Enrich Sales Data with APIs**

**Dataset to download:**
Kaggle: Ecommerce with location and API enrichment potential
Links:
- Primary: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce (has customer_city, customer_state, order_id, customer_id - enrich with geocoding API)
- Secondary: https://www.kaggle.com/datasets/carrie1/ecommerce-data (has Country, CustomerID, InvoiceNo, StockCode, Quantity, UnitPrice - enrich with exchange rate API for UK vs other)
- Tertiary: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final (has City, State, Country, Sales, Order Date - enrich with weather API for delivery delays)
- API practice: https://www.kaggle.com/datasets/mkechinov/ecommerce-behavior-data-from-multi-category-store (has user_id, product category - enrich with product API)

Download olist_customers_dataset.csv and olist_orders_dataset.csv and olist_geolocation_dataset.csv

**Task - Create file `api_enrichment_L18.py`:**

```
import requests
import csv
import json
import os
import time
from collections import defaultdict

# Your stores with full addresses for geocoding
MY_STORES = {
    "LAG_001_Ikeja": {"city": "Ikeja", "state": "Lagos", "country": "NG", "address": "12 Allen Avenue, Ikeja, Lagos, Nigeria 101233", "currency": "NGN"},
    "LAG_002_Lekki": {"city": "Lekki", "state": "Lagos", "country": "NG", "address": "Admiralty Way, Lekki, Lagos, Nigeria 105102", "currency": "NGN"},
    "LAG_003_VI": {"city": "Victoria Island", "state": "Lagos", "country": "NG", "address": "Akin Adesola Street, Victoria Island, Lagos, Nigeria 101241", "currency": "NGN"},
    "LDN_001_Camden": {"city": "Camden", "state": "London", "country": "UK", "address": "45 Camden High Street, London, UK NW1 0JH", "currency": "GBP"},
    "LDN_002_Stratford": {"city": "Stratford", "state": "London", "country": "UK", "address": "Westfield Stratford City, London, UK E20 1EJ", "currency": "GBP"},
    "ABJ_001_Garki": {"city": "Garki", "state": "FCT", "country": "NG", "address": "Plot 123, Garki, Abuja, Nigeria 900242", "currency": "NGN"},
}

def get_exchange_rates():
    # Free API - exchangerate.host
    try:
        url = "https://api.exchangerate.host/latest?base=USD&symbols=NGN,GBP,EUR,BRL"
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        rates = data.get("rates", {})
        print(f"Exchange rates from API: {rates}")
        return rates
    except Exception as e:
        print(f"Exchange API failed: {e}, using fallback")
        return {"NGN": 1500.5, "GBP": 0.79, "EUR": 0.92, "BRL": 5.0}

def geocode_address(address):
    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {"q": address, "format": "json", "limit": 1}
        headers = {"User-Agent": "ws02_L18_project LAG_001_Ikeja (student@ikeja.lagos.ng)"}
        resp = requests.get(url, params=params, headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        if data:
            return float(data[0]["lat"]), float(data[0]["lon"]), data[0]["display_name"]
        return None, None, None
    except Exception as e:
        print(f"Geocode failed for {address}: {e}")
        return None, None, None

def flatten_olist_customer(row):
    # Flatten Olist customer JSON/CSV row
    return {
        "customer_id": row.get("customer_id", "")[:20],
        "customer_city": row.get("customer_city", "Unknown"),
        "customer_state": row.get("customer_state", "Unknown"),
        "customer_zip": row.get("customer_zip_code_prefix", ""),
        "store_id": "LAG_001_Ikeja" if "sao paulo" in row.get("customer_city","").lower() else "LDN_001_Camden",  # demo mapping
    }

# Part 1: Test exchange rates and geocoding with your stores
print("=== Part 1: API Calls for Your Stores ===")
rates = get_exchange_rates()

sample_sales = [
    {"order_id": "ORD_LAG_001_5001", "store_id": "LAG_001_Ikeja", "customer_id": "CUST_101_LAG", "amount_usd": 120.0, "city": "Ikeja"},
    {"order_id": "ORD_LDN_001_2001", "store_id": "LDN_001_Camden", "customer_id": "CUST_102_LDN", "amount_usd": 200.0, "city": "Camden"},
    {"order_id": "ORD_ABJ_001_3001", "store_id": "ABJ_001_Garki", "customer_id": "CUST_103_ABJ", "amount_usd": 150.0, "city": "Garki"},
]

for sale in sample_sales:
    store_info = MY_STORES.get(sale["store_id"], {})
    currency = store_info.get("currency", "USD")
    rate = rates.get(currency, 1.0)
    local_amount = sale["amount_usd"] * rate
    print(f"  {sale['order_id']} {sale['store_id']} {sale['city']} - ${sale['amount_usd']} USD = {local_amount:.2f} {currency} (Rate {rate})")

print("\n=== Part 2: Geocode Your Store Addresses (1 sec delay required) ===")
for store_id, info in list(MY_STORES.items())[:3]:  # Only 3 to respect API rate limit
    lat, lon, display = geocode_address(info["address"])
    if lat:
        print(f"  {store_id} {info['city']}, {info['country']} -> Lat {lat:.4f}, Lon {lon:.4f}")
    else:
        print(f"  {store_id} geocode failed, using mock coords")
    time.sleep(1.1)  # Nominatim requires 1 sec delay

print("\n=== Part 3: Kaggle Dataset + API Enrichment ===")
kaggle_files = ["olist_customers_dataset.csv", "olist_geolocation_dataset.csv", "data.csv", "Superstore.csv"]
found = None
for kf in kaggle_files:
    if os.path.exists(kf):
        found = kf
        break

if found:
    print(f"Found Kaggle file {found}, enriching with API data")
    
    if "olist_customers" in found:
        with open(found, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = list(reader)[:10]  # First 10 for demo
            flat_rows = [flatten_olist_customer(r) for r in rows]
            print(f"  Flattened {len(flat_rows)} customers from Olist")
            for fr in flat_rows[:3]:
                print(f"    {fr['customer_id']} City {fr['customer_city']} State {fr['customer_state']} Mapped to {fr['store_id']}")
            
            # Count by state (like your LAG, LDN)
            state_counts = defaultdict(int)
            for fr in flat_rows:
                state_counts[fr["customer_state"]] += 1
            print(f"  Customers by state:")
            for state, count in sorted(state_counts.items(), key=lambda x: x[1], reverse=True)[:5]:
                print(f"    {state}: {count}")
    
    if "geolocation" in found:
        with open(found, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = list(reader)[:5]
            print(f"  Geolocation data (lat/lng already provided, compare with API geocode):")
            for r in rows:
                print(f"    Zip {r.get('geolocation_zip_code_prefix')} City {r.get('geolocation_city')} Lat {r.get('geolocation_lat')} Lng {r.get('geolocation_lng')}")
    
    if found == "data.csv":  # Carrie1 ecommerce-data
        with open(found, "r", encoding="utf-8", errors="ignore") as f:
            reader = csv.DictReader(f)
            country_revenue = defaultdict(float)
            for i, row in enumerate(reader):
                if i >= 1000:
                    break
                country = row.get("Country", "Unknown")
                try:
                    qty = int(row.get("Quantity", "0"))
                    price = float(row.get("UnitPrice", "0"))
                    if qty > 0 and price > 0:
                        country_revenue[country] += qty * price
                except:
                    continue
            print(f"  Revenue by country (first 1000 rows):")
            for country, rev in sorted(country_revenue.items(), key=lambda x: x[1], reverse=True)[:5]:
                # Enrich with exchange rate
                curr = "GBP" if country == "United Kingdom" else "USD"
                rate = rates.get(curr, 1.0) if curr != "USD" else 1.0
                local = rev * rate
                print(f"    {country}: ${rev:.2f} USD = {local:.2f} {curr} equivalent")
else:
    print(f"No Kaggle file found. Download:")
    print(f"  Primary: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce")
    print(f"    Files: olist_customers_dataset.csv, olist_orders_dataset.csv, olist_geolocation_dataset.csv")
    print(f"    Has customer_id, customer_city, customer_state, geolocation_lat/lng - perfect for geocoding API enrichment")
    print(f"  Secondary: https://www.kaggle.com/datasets/carrie1/ecommerce-data")
    print(f"    File: data.csv - Country, CustomerID, InvoiceNo - enrich with exchange API (UK vs others)")
    print(f"  Tertiary: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final")
    print(f"    Enrich City, State with weather API to explain delivery delays")

# Write enriched output
enriched_output = []
for sale in sample_sales:
    store_info = MY_STORES.get(sale["store_id"], {})
    currency = store_info.get("currency", "USD")
    rate = rates.get(currency, 1.0)
    enriched_output.append({
        "order_id": sale["order_id"],
        "store_id": sale["store_id"],
        "customer_id": sale["customer_id"],
        "city": sale["city"],
        "country": store_info.get("country", "Unknown"),
        "amount_usd": sale["amount_usd"],
        "local_currency": currency,
        "exchange_rate": rate,
        "amount_local": round(sale["amount_usd"]*rate,2),
        "address": store_info.get("address",""),
    })

with open("api_enriched_sales_L18.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=enriched_output[0].keys())
    writer.writeheader()
    writer.writerows(enriched_output)

print(f"\nWritten api_enriched_sales_L18.csv with {len(enriched_output)} orders enriched with exchange rates from API")
print(f"Includes store IDs LAG_001_Ikeja, LDN_001_Camden, ABJ_001_Garki with full addresses and currencies")

with open("api_enriched_sales_L18.json", "w", encoding="utf-8") as f:
    json.dump(enriched_output, f, indent=2)

print(f"Also written api_enriched_sales_L18.json - nested JSON example")
```

**Deliverable:** Upload `api_enrichment_L18.py` plus outputs:
- `api_enriched_sales_L18.csv` with order_id, store_id LAG_001_Ikeja, LDN_001_Camden, ABJ_001_Garki, customer_id CUST_101_LAG, city Ikeja, country NG, amount_usd, local_currency NGN/GBP, exchange_rate from API, amount_local
- `api_enriched_sales_L18.json` same data as nested JSON
- Screenshot or log showing exchange rate API call success (USD->NGN, USD->GBP) and geocode API call for 3 stores with lat/lon
- If Kaggle downloaded, show flattened 3 customers from olist_customers_dataset.csv with customer_id, customer_city, customer_state mapped to your store IDs, and top 5 states by count or top 5 countries by revenue with exchange enrichment

**Kaggle Links:**
1. Primary: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce (customer_id, customer_city, customer_state, customer_zip, geolocation_lat/lng - enrich with geocoding API, map to your Lagos/London stores)
2. Secondary: https://www.kaggle.com/datasets/carrie1/ecommerce-data (Country, CustomerID, InvoiceNo, StockCode, Quantity, UnitPrice - enrich with exchange rate API for United Kingdom GBP vs USD)
3. Tertiary: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final (City, State, Country, Sales, Order Date - enrich with weather API to explain delivery SLA)
4. API Bonus: https://www.kaggle.com/datasets/mkechinov/ecommerce-behavior-data-from-multi-category-store (user_id, category - enrich with product API)

Free APIs to use (no key or free key):
- Exchange: https://api.exchangerate.host/latest?base=USD&symbols=NGN,GBP (free, no key)
- Geocoding: https://nominatim.openstreetmap.org/search?q=Ikeja+Lagos&format=json (free, needs User-Agent, 1 sec delay)
- Weather: https://api.open-meteo.com/v1/forecast?latitude=6.60&longitude=3.35&current_weather=true (free, no key, for Ikeja Lagos)

## 6. Checklist

- Can you call API with requests.get, timeout=10, raise_for_status(), handle Timeout, HTTPError 429 rate limit with retry and backoff?
- Can you parse nested JSON and flatten order with customer.location.city, store.store_id LAG_001_Ikeja, items list into flat dict for CSV?
- Can you geocode store addresses LAG_001_Ikeja 12 Allen Ave Ikeja Lagos NG 101233 with Nominatim, handling User-Agent and 1 sec delay?
- Can you get exchange rates USD->NGN and USD->GBP from API and enrich sales ORD_LAG_001_5001 $120 = 180k NGN, ORD_LDN_001_2001 $200 = £158 GBP?
- Can you combine API data with local CSV: enriched_sales_L18.csv with order_id, store_id, location Ikeja Lagos NG, amount_usd, local_currency, exchange_rate, amount_local?
- Can you load Kaggle olist_customers_dataset.csv, flatten customer_id, customer_city, customer_state, map to your store IDs, and count by state?
- Can you write both CSV and JSON outputs from enriched data?

If yes, you can enrich local sales with real-world APIs.

Next: Introduction to NumPy - Arrays for Data.

**Key Takeaway:** Local CSV alone lacks exchange rates, geocodes, weather. APIs provide it via JSON. Use requests with timeout and error handling, parse nested JSON, flatten to table for CSV. Enrich sales per location: Lagos stores NGN via exchange API, London GBP, geocode Ikeja 6.60,3.35 for delivery distance. Respect API rate limits (Nominatim 1 sec delay). Combine with Kaggle Olist customers to map customer_city to your store IDs LAG_001_Ikeja, LDN_001_Camden, ABJ_001_Garki.
