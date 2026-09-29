# Lesson 22 - Data Cleaning Project with Pandas

**Duration:** 90 min | **Level:** Intermediate | **Goal:** Combine all cleaning skills into one end-to-end project cleaning messy sales data from Lagos and London stores

## Learning Objectives
- Handle missing values, duplicates, wrong types, messy strings, invalid IDs in one pipeline.
- Build reusable cleaning functions for store_id, customer_id, price, city, country.
- Produce clean dataset ready for reports and Kaggle competition.

---

## 1. Why One Big Cleaning Project

<svg width="100%" height="190" viewBox="0 0 700 190" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="190" rx="16" fill="#FFFFFF"/>
  <text x="350" y="28" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">MESSY INPUT vs CLEAN OUTPUT</text>
  <rect x="20" y="50" width="200" height="120" rx="12" fill="#FEE2E2" stroke="#991B1B" stroke-width="1.5"/>
  <text x="120" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#7F1D1D">MESSY - Real CSV</text>
  <text x="35" y="90" font-family="Arial" font-size="9" fill="#7F1D1D">price: $25,000, N/A, -10</text>
  <text x="35" y="105" font-family="Arial" font-size="9" fill="#7F1D1D">store: lag_001, LAG 001 Ikeja</text>
  <text x="35" y="120" font-family="Arial" font-size="9" fill="#7F1D1D">customer: "  ", alex@@test</text>
  <text x="35" y="135" font-family="Arial" font-size="9" fill="#7F1D1D">city: Ikeja, ikeja, IKEJA</text>
  <text x="35" y="150" font-family="Arial" font-size="9" fill="#7F1D1D">Duplicates, wrong types</text>
  <rect x="250" y="50" width="200" height="120" rx="12" fill="#DBEAFE" stroke="#1E40AF" stroke-width="1.5"/>
  <text x="350" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#1E3A8A">CLEANING STEPS</text>
  <text x="265" y="90" font-family="Arial" font-size="9" fill="#1E3A8A">1. Parse dates 8 formats</text>
  <text x="265" y="105" font-family="Arial" font-size="9" fill="#1E3A8A">2. Validate IDs regex</text>
  <text x="265" y="120" font-family="Arial" font-size="9" fill="#1E3A8A">3. Clean price, city</text>
  <text x="265" y="135" font-family="Arial" font-size="9" fill="#1E3A8A">4. Handle nulls, duplicates</text>
  <text x="265" y="150" font-family="Arial" font-size="9" fill="#1E3A8A">5. Fix types, filter invalid</text>
  <rect x="480" y="50" width="200" height="120" rx="12" fill="#D1FAE5" stroke="#065F46" stroke-width="1.5"/>
  <text x="580" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#064E3B">CLEAN - Ready</text>
  <text x="495" y="90" font-family="Arial" font-size="9" fill="#064E3B">LAG_001_Ikeja Ikeja NG</text>
  <text x="495" y="105" font-family="Arial" font-size="9" fill="#064E3B">ORD_LAG_001_5001 $25000</text>
  <text x="495" y="120" font-family="Arial" font-size="9" fill="#064E3B">CUST_101_LAG Alex Johnson</text>
  <text x="495" y="135" font-family="Arial" font-size="9" fill="#064E3B">No duplicates, correct types</text>
  <text x="495" y="150" font-family="Arial" font-size="9" fill="#064E3B">Report ready</text>
</svg>

Real file from 5 stores LAG_001_Ikeja, LAG_002_Lekki, LAG_003_VI, LDN_001_Camden, ABJ_001_Garki has $25,000 with comma, N/A, negative -10, lag_001 lowercase, "  " empty name, Ikeja vs ikeja vs IKEJA, duplicates ORD_LAG_001_5001 twice, wrong types price as string. Need one pipeline to fix all.

## 2. Building Cleaning Pipeline

**Real World Example 1 - Messy dataset simulation:**

```
import pandas as pd
import numpy as np
import re
from datetime import datetime

# Simulate messy data as you get from 5 stores
messy_orders = [
    {"order_id": "ORD_LAG_001_5001", "store_id": "LAG_001_Ikeja", "city": "Ikeja", "country": "NG", "customer_id": "CUST_101_LAG", "customer_name": "  alex johnson  ", "customer_email": "alex@ikeja.lagos.ng", "product_id": "MSE-BLK-001", "price": "$25,000", "qty": "2", "order_date": "2024-01-15", "address": "12 Allen Ave, Ikeja, Lagos, NG 101233"},
    {"order_id": "ORD_LAG_002_5002", "store_id": "lag_002_lekki", "city": "Lekki", "country": "NG", "customer_id": "CUST_102_LAG", "customer_name": "SAM LEE", "customer_email": "sam.lee@lekki.lagos.ng", "product_id": "KBD-WHT-002", "price": "32000", "qty": "1", "order_date": "01/20/2024", "address": "Admiralty Way, Lekki, Lagos, NG 105102"},
    {"order_id": "ORD_LAG_003_5003", "store_id": "LAG_003_VI", "city": "VI", "country": "NG", "customer_id": "CUST_103_LAG", "customer_name": "  ", "customer_email": "invalid_email", "product_id": "MON-24-003", "price": "N/A", "qty": "1", "order_date": "15-02-2024", "address": "Akin Adesola, VI, Lagos, NG 101241"},
    {"order_id": "ORD_LDN_001_2001", "store_id": "LDN_001_Camden", "city": "Camden", "country": "UK", "customer_id": "CUST_104_LDN", "customer_name": "maria garcia", "customer_email": "maria@camden.london.uk", "product_id": "MSE-BLK-001", "price": "£120.50", "qty": "3", "order_date": "2024-01-10", "address": "45 Camden High St, London, UK NW1 0JH"},
    {"order_id": "ORD_LAG_001_5001", "store_id": "LAG_001_Ikeja", "city": "Ikeja", "state": "Lagos", "country": "NG", "customer_id": "CUST_101_LAG", "customer_name": "Alex Johnson", "customer_email": "alex@ikeja.lagos.ng", "product_id": "MSE-BLK-001", "price": "$25,000", "qty": "2", "order_date": "2024-01-15", "address": "12 Allen Ave, Ikeja, Lagos, NG 101233"},  # Duplicate
    {"order_id": "ORD_ABJ_001_3001", "store_id": "ABJ_001_Garki", "city": "Garki", "country": "NG", "customer_id": "CUST_105_ABJ", "customer_name": "Fatima Bello", "customer_email": "fatima@garki.abuja.ng", "product_id": "CAB-USB-004", "price": "-5000", "qty": "2", "order_date": "2024-02-10", "address": "Plot 123 Garki, Abuja, NG 900242"},  # Negative price
    {"order_id": "ORD_LAG_002_5005", "store_id": "LAG_002_Lekki", "city": "lekki", "country": "ng", "customer_id": "CUST_106_LAG", "customer_name": "Chidi Okoro", "customer_email": "chidi@lekki.lagos.ng", "product_id": "MSE-BLK-001", "price": "25000", "qty": "5", "order_date": "2024-02-20", "address": "Admiralty Way, Lekki, Lagos, NG 105102"},
    {"order_id": "BAD_ID", "store_id": "UNKNOWN", "city": "Unknown", "country": "XX", "customer_id": "BAD", "customer_name": "Test", "customer_email": "test@test.com", "product_id": "TEST", "price": "100", "qty": "1", "order_date": "2024-02-20", "address": "Unknown"},  # Invalid IDs
]

df = pd.DataFrame(messy_orders)
print(f"Messy shape: {df.shape}")
print(df.head())

# Step 1: Standardize store_id to your valid list
VALID_STORES = {
    "LAG_001_Ikeja": {"city": "Ikeja", "state": "Lagos", "country": "NG", "address": "12 Allen Ave, Ikeja, Lagos, NG 101233"},
    "LAG_002_Lekki": {"city": "Lekki", "state": "Lagos", "country": "NG", "address": "Admiralty Way, Lekki, Lagos, NG 105102"},
    "LAG_003_VI": {"city": "Victoria Island", "state": "Lagos", "country": "NG", "address": "Akin Adesola, VI, Lagos, NG 101241"},
    "LDN_001_Camden": {"city": "Camden", "state": "London", "country": "UK", "address": "45 Camden High St, London, UK NW1 0JH"},
    "ABJ_001_Garki": {"city": "Garki", "state": "FCT", "country": "NG", "address": "Plot 123 Garki, Abuja, NG 900242"},
}

def clean_store_id(sid):
    if not sid:
        return np.nan
    sid = str(sid).strip()
    # Normalize: upper case first 3, replace space with underscore, title city
    # Try to match valid stores
    sid_upper = sid.upper()
    for valid in VALID_STORES.keys():
        if valid.split("_")[0] in sid_upper and valid.split("_")[1] in sid_upper:
            return valid
        if sid_upper.replace(" ", "_").replace("-", "_") == valid.upper():
            return valid
    # Direct match case insensitive
    for valid in VALID_STORES.keys():
        if sid_upper == valid.upper():
            return valid
    # If contains LAG_001 etc
    match = re.search(r"([A-Z]{3}_\d{3})", sid_upper)
    if match:
        code = match.group(1)
        for valid in VALID_STORES.keys():
            if code in valid:
                return valid
    return np.nan

df["store_id_clean"] = df["store_id"].apply(clean_store_id)
print("\nStore ID cleaning:")
print(df[["store_id", "store_id_clean"]])

# Step 2: Clean city and country
def clean_city(city):
    if not city:
        return np.nan
    city = str(city).strip().title()
    mapping = {"Vi": "Victoria Island", "Lekki": "Lekki", "Ikeja": "Ikeja", "Camden": "Camden", "Garki": "Garki"}
    return mapping.get(city, city)

def clean_country(country):
    if not country:
        return np.nan
    country = str(country).strip().upper()
    if country in ["NG", "NIGERIA", "NGA"]:
        return "NG"
    if country in ["UK", "GB", "UNITED KINGDOM", "ENGLAND"]:
        return "UK"
    return country

df["city_clean"] = df["city"].apply(clean_city)
df["country_clean"] = df["country"].apply(clean_country)

print("\nCity and country cleaning:")
print(df[["city", "city_clean", "country", "country_clean"]])

# Step 3: Validate order_id and customer_id with regex
def validate_order_id(oid):
    if re.match(r"^(ORD|INV)_[A-Z]{3}_\d{3}_\d{4}$", str(oid)):
        return oid
    return np.nan

def validate_customer_id(cid):
    if re.match(r"^CUST_\d{3}_[A-Z]{3}$", str(cid)):
        return cid
    return np.nan

df["order_id_clean"] = df["order_id"].apply(validate_order_id)
df["customer_id_clean"] = df["customer_id"].apply(validate_customer_id)

print("\nID validation:")
print(df[["order_id", "order_id_clean", "customer_id", "customer_id_clean"]])

# Step 4: Clean price
def clean_price(price):
    if pd.isna(price):
        return np.nan
    price_str = str(price).strip()
    if price_str.upper() in ["N/A", "NA", "NULL", "", "NONE"]:
        return np.nan
    # Remove $, £, comma, spaces
    price_str = re.sub(r"[$£,]", "", price_str)
    price_str = re.sub(r"[^\d.-]", "", price_str)
    try:
        val = float(price_str)
        if val <= 0:
            return np.nan  # Negative price invalid
        return val
    except:
        return np.nan

df["price_clean"] = df["price"].apply(clean_price)
df["qty_clean"] = pd.to_numeric(df["qty"], errors="coerce")
df["qty_clean"] = df["qty_clean"].apply(lambda x: x if pd.notna(x) and x > 0 else np.nan)

print("\nPrice and qty cleaning:")
print(df[["price", "price_clean", "qty", "qty_clean"]])

# Step 5: Clean customer_name and email
def clean_name(name):
    if pd.isna(name) or str(name).strip() == "":
        return np.nan
    name = str(name).strip()
    name = re.sub(r"\s+", " ", name).title()
    if len(name) < 2:
        return np.nan
    return name

def clean_email(email):
    if pd.isna(email):
        return np.nan
    email = str(email).strip().lower()
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    if re.match(pattern, email):
        return email
    return np.nan

df["customer_name_clean"] = df["customer_name"].apply(clean_name)
df["customer_email_clean"] = df["customer_email"].apply(clean_email)

print("\nName and email cleaning:")
print(df[["customer_name", "customer_name_clean", "customer_email", "customer_email_clean"]])

# Step 6: Parse dates multiple formats
def parse_date(date_str):
    if pd.isna(date_str):
        return pd.NaT
    date_str = str(date_str).strip()
    if date_str.upper() in ["N/A", "NA", ""]:
        return pd.NaT
    formats = ["%Y-%m-%d", "%m/%d/%Y", "%d-%m-%Y", "%m-%d-%Y", "%d/%m/%Y", "%Y/%m/%d", "%b %d %Y"]
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except:
            continue
    return pd.NaT

df["order_date_clean"] = df["order_date"].apply(parse_date)
df["order_date_clean"] = pd.to_datetime(df["order_date_clean"], errors="coerce")

print("\nDate cleaning:")
print(df[["order_date", "order_date_clean"]])

# Step 7: Handle duplicates and invalid rows
print(f"\nBefore dedup and filter: {df.shape}")

# Drop duplicates by order_id_clean keep first
df_clean = df.drop_duplicates(subset=["order_id_clean"], keep="first")

print(f"After dedup by order_id_clean: {df_clean.shape}")

# Filter valid: need store_id_clean, order_id_clean, price_clean, qty_clean
df_clean = df_clean.dropna(subset=["store_id_clean", "order_id_clean", "price_clean", "qty_clean", "order_date_clean"])

print(f"After dropping invalid required fields: {df_clean.shape}")

# Add calculated columns
df_clean["subtotal"] = df_clean["price_clean"] * df_clean["qty_clean"]
tax_map = {"LAG_001_Ikeja": 0.075, "LAG_002_Lekki": 0.075, "LAG_003_VI": 0.075, "ABJ_001_Garki": 0.075, "LDN_001_Camden": 0.20}
df_clean["tax_rate"] = df_clean["store_id_clean"].map(tax_map)
df_clean["total_with_tax"] = df_clean["subtotal"] * (1 + df_clean["tax_rate"])
df_clean["location_code"] = df_clean["store_id_clean"].str.split("_").str[0]
df_clean["month"] = df_clean["order_date_clean"].dt.to_period("M")

print("\nFinal cleaned DataFrame:")
print(df_clean[["order_id_clean", "store_id_clean", "city_clean", "country_clean", "customer_id_clean", "customer_name_clean", "price_clean", "qty_clean", "subtotal", "total_with_tax", "month"]])

print(f"\nCleaned {len(df_clean)} orders from {len(df)} messy rows, removed {len(df) - len(df_clean)} bad/duplicates")
```

This pipeline handles store_id, city, country, order_id CUST_101_LAG, price $25,000, qty, name, email, date 8 formats, duplicates, negatives.

**Real World Example 2 - Reusable cleaning functions module:**

```
# src/cleaning_pandas.py - reusable for all stores

import pandas as pd
import numpy as np
import re
from datetime import datetime

VALID_STORES = ["LAG_001_Ikeja", "LAG_002_Lekki", "LAG_003_VI", "LDN_001_Camden", "ABJ_001_Garki"]

def clean_store_id(sid):
    if pd.isna(sid):
        return np.nan
    sid = str(sid).strip()
    sid_upper = sid.upper()
    for valid in VALID_STORES:
        if valid.split("_")[0] in sid_upper and valid.split("_")[1] in sid_upper:
            return valid
        if sid_upper == valid.upper():
            return valid
    match = re.search(r"([A-Z]{3}_\d{3})", sid_upper)
    if match:
        for valid in VALID_STORES:
            if match.group(1) in valid:
                return valid
    return np.nan

def clean_price(price):
    if pd.isna(price) or str(price).strip().upper() in ["N/A", "NA", "NULL", "", "NONE"]:
        return np.nan
    price_str = re.sub(r"[$£,]", "", str(price))
    price_str = re.sub(r"[^\d.-]", "", price_str)
    try:
        val = float(price_str)
        return val if val > 0 else np.nan
    except:
        return np.nan

def clean_customer_id(cid):
    if pd.isna(cid):
        return np.nan
    if re.match(r"^CUST_\d{3}_[A-Z]{3}$", str(cid)):
        return str(cid)
    return np.nan

def clean_order_id(oid):
    if pd.isna(oid):
        return np.nan
    if re.match(r"^(ORD|INV)_[A-Z]{3}_\d{3}_\d{4}$", str(oid)):
        return str(oid)
    return np.nan

def clean_city(city):
    if pd.isna(city) or str(city).strip() == "":
        return np.nan
    city = str(city).strip().title()
    mapping = {"Vi": "Victoria Island", "Lekki": "Lekki", "Ikeja": "Ikeja", "Camden": "Camden", "Garki": "Garki"}
    return mapping.get(city, city)

def parse_date_multi(date_str):
    if pd.isna(date_str) or str(date_str).strip().upper() in ["N/A", "NA", ""]:
        return pd.NaT
    formats = ["%Y-%m-%d", "%m/%d/%Y", "%d-%m-%Y", "%m-%d-%Y", "%d/%m/%Y", "%Y/%m/%d"]
    for fmt in formats:
        try:
            return datetime.strptime(str(date_str).strip(), fmt)
        except:
            continue
    return pd.NaT

def clean_dataframe(df):
    df = df.copy()
    df["store_id_clean"] = df["store_id"].apply(clean_store_id)
    df["order_id_clean"] = df["order_id"].apply(clean_order_id)
    df["customer_id_clean"] = df["customer_id"].apply(clean_customer_id)
    df["price_clean"] = df["price"].apply(clean_price)
    df["qty_clean"] = pd.to_numeric(df["qty"], errors="coerce")
    df["city_clean"] = df["city"].apply(clean_city)
    df["order_date_clean"] = df["order_date"].apply(parse_date_multi)
    df["order_date_clean"] = pd.to_datetime(df["order_date_clean"], errors="coerce")
    
    # Drop invalid
    df = df.drop_duplicates(subset=["order_id_clean"], keep="first")
    df = df.dropna(subset=["store_id_clean", "order_id_clean", "price_clean", "qty_clean"])
    df = df[df["price_clean"] > 0]
    df = df[df["qty_clean"] > 0]
    
    # Calculated
    df["subtotal"] = df["price_clean"] * df["qty_clean"]
    tax_map = {"LAG_001_Ikeja": 0.075, "LAG_002_Lekki": 0.075, "LAG_003_VI": 0.075, "ABJ_001_Garki": 0.075, "LDN_001_Camden": 0.20}
    df["total_with_tax"] = df["subtotal"] * (1 + df["store_id_clean"].map(tax_map))
    
    return df

# Usage
# df_raw = pd.read_csv("messy_sales.csv")
# df_clean = clean_dataframe(df_raw)
```

Reusable functions for any file.

## 3. Hands-On Assignment with Kaggle Dataset

**Assignment 22: End-to-End Cleaning Project**

**Dataset to download:**
Kaggle: Messy real datasets that need full cleaning pipeline
Links:
- Primary: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce (olist_customers_dataset.csv has customer_city with duplicates, misspellings, customer_state, olist_orders_dataset.csv order_status, olist_order_payments_dataset.csv payment_value with nulls, olist_products_dataset.csv product_category_name with nulls, missing values, duplicates - perfect for full pipeline)
- Secondary: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final (Superstore.csv has Sales with $ and comma? Actually clean but has City, State with duplicates, Order Date multiple formats, Customer ID, returns, need dedup, null check, Profit negative)
- Tertiary: https://www.kaggle.com/datasets/carrie1/ecommerce-data (data.csv has Description with special chars, UnitPrice negative for returns, Quantity negative, CustomerID null, InvoiceDate, Country with duplicates - perfect for cleaning project)
- Quaternary: https://www.kaggle.com/datasets/mukulkirti/laptops-with-nice-specs-real-dataset (Price with $, comma, missing values, Company, TypeName with inconsistent casing)

Download olist_customers_dataset.csv, olist_orders_dataset.csv, olist_order_payments_dataset.csv, olist_products_dataset.csv, olist_geolocation_dataset.csv

**Task - Create file `cleaning_project_L22.py`:**

```
import pandas as pd
import numpy as np
import re
import os
from datetime import datetime

VALID_STORES = ["LAG_001_Ikeja", "LAG_002_Lekki", "LAG_003_VI", "LDN_001_Camden", "ABJ_001_Garki"]

def clean_store_id(sid):
    if pd.isna(sid):
        return np.nan
    sid = str(sid).strip()
    sid_upper = sid.upper()
    for valid in VALID_STORES:
        if valid.split("_")[0] in sid_upper and valid.split("_")[1] in sid_upper:
            return valid
        if sid_upper == valid.upper():
            return valid
    match = re.search(r"([A-Z]{3}_\d{3})", sid_upper)
    if match:
        for valid in VALID_STORES:
            if match.group(1) in valid:
                return valid
    return np.nan

def clean_price(price):
    if pd.isna(price) or str(price).strip().upper() in ["N/A", "NA", "NULL", "", "NONE"]:
        return np.nan
    price_str = re.sub(r"[$£,]", "", str(price))
    price_str = re.sub(r"[^\d.-]", "", price_str)
    try:
        val = float(price_str)
        return val if val > 0 else np.nan
    except:
        return np.nan

def clean_city(city):
    if pd.isna(city) or str(city).strip() == "":
        return np.nan
    city = str(city).strip().title()
    mapping = {"Vi": "Victoria Island", "Lekki": "Lekki", "Ikeja": "Ikeja", "Camden": "Camden", "Garki": "Garki", "Sao Paulo": "Sao Paulo", "Rio De Janeiro": "Rio De Janeiro"}
    return mapping.get(city, city)

def parse_date_multi(date_str):
    if pd.isna(date_str) or str(date_str).strip().upper() in ["N/A", "NA", ""]:
        return pd.NaT
    formats = ["%Y-%m-%d", "%m/%d/%Y", "%d-%m-%Y", "%m-%d-%Y", "%d/%m/%Y", "%Y/%m/%d", "%Y-%m-%d %H:%M:%S", "%m/%d/%Y %H:%M"]
    for fmt in formats:
        try:
            return datetime.strptime(str(date_str).strip(), fmt)
        except:
            continue
    return pd.NaT

print("=== Part 1: Your Messy Store Data Cleaning ===")
messy_orders = [
    {"order_id": "ORD_LAG_001_5001", "store_id": "LAG_001_Ikeja", "city": "Ikeja", "country": "NG", "customer_id": "CUST_101_LAG", "customer_name": "  alex johnson  ", "price": "$25,000", "qty": "2", "order_date": "2024-01-15", "address": "12 Allen Ave, Ikeja, Lagos, NG 101233"},
    {"order_id": "ORD_LAG_002_5002", "store_id": "lag_002_lekki", "city": "lekki", "country": "ng", "customer_id": "CUST_102_LAG", "customer_name": "SAM LEE", "price": "32000", "qty": "1", "order_date": "01/20/2024", "address": "Admiralty Way, Lekki, Lagos, NG 105102"},
    {"order_id": "ORD_LAG_003_5003", "store_id": "LAG_003_VI", "city": "VI", "country": "NG", "customer_id": "CUST_103_LAG", "customer_name": "  ", "price": "N/A", "qty": "1", "order_date": "15-02-2024", "address": "Akin Adesola, VI, Lagos, NG 101241"},
    {"order_id": "ORD_LDN_001_2001", "store_id": "LDN_001_Camden", "city": "Camden", "country": "UK", "customer_id": "CUST_104_LDN", "customer_name": "maria garcia", "price": "£120.50", "qty": "3", "order_date": "2024-01-10", "address": "45 Camden High St, London, UK NW1 0JH"},
    {"order_id": "ORD_LAG_001_5001", "store_id": "LAG_001_Ikeja", "city": "Ikeja", "country": "NG", "customer_id": "CUST_101_LAG", "customer_name": "Alex Johnson", "price": "$25,000", "qty": "2", "order_date": "2024-01-15", "address": "12 Allen Ave, Ikeja, Lagos, NG 101233"},
    {"order_id": "ORD_ABJ_001_3001", "store_id": "ABJ_001_Garki", "city": "Garki", "country": "NG", "customer_id": "CUST_105_ABJ", "customer_name": "Fatima Bello", "price": "-5000", "qty": "2", "order_date": "2024-02-10", "address": "Plot 123 Garki, Abuja, NG 900242"},
    {"order_id": "ORD_LAG_002_5005", "store_id": "LAG_002_Lekki", "city": "lekki", "country": "ng", "customer_id": "CUST_106_LAG", "customer_name": "Chidi Okoro", "price": "25000", "qty": "5", "order_date": "2024-02-20", "address": "Admiralty Way, Lekki, Lagos, NG 105102"},
    {"order_id": "BAD_ID", "store_id": "UNKNOWN", "city": "Unknown", "country": "XX", "customer_id": "BAD", "customer_name": "Test", "price": "100", "qty": "1", "order_date": "2024-02-20", "address": "Unknown"},
]

df = pd.DataFrame(messy_orders)
print(f"Messy shape: {df.shape}")
print(df[["order_id", "store_id", "city", "price", "qty"]].head(10))

# Apply cleaning pipeline
df["store_id_clean"] = df["store_id"].apply(clean_store_id)
df["order_id_clean"] = df["order_id"].apply(lambda x: x if re.match(r"^(ORD|INV)_[A-Z]{3}_\d{3}_\d{4}$", str(x)) else np.nan)
df["customer_id_clean"] = df["customer_id"].apply(lambda x: x if re.match(r"^CUST_\d{3}_[A-Z]{3}$", str(x)) else np.nan)
df["price_clean"] = df["price"].apply(clean_price)
df["qty_clean"] = pd.to_numeric(df["qty"], errors="coerce")
df["city_clean"] = df["city"].apply(clean_city)
df["order_date_clean"] = df["order_date"].apply(parse_date_multi)
df["order_date_clean"] = pd.to_datetime(df["order_date_clean"], errors="coerce")

print(f"\nAfter initial cleaning, nulls:")
print(df[["store_id_clean", "order_id_clean", "price_clean", "qty_clean", "city_clean", "order_date_clean"]].isnull().sum())

# Deduplicate
df_dedup = df.drop_duplicates(subset=["order_id_clean"], keep="first")
print(f"\nAfter dedup by order_id_clean: {df_dedup.shape} from {df.shape}")

# Filter valid
df_clean = df_dedup.dropna(subset=["store_id_clean", "order_id_clean", "price_clean", "qty_clean", "order_date_clean"])
df_clean = df_clean[(df_clean["price_clean"] > 0) & (df_clean["qty_clean"] > 0)]
print(f"After filtering valid required fields >0: {df_clean.shape}")

# Calculated
df_clean["subtotal"] = df_clean["price_clean"] * df_clean["qty_clean"]
tax_map = {"LAG_001_Ikeja": 0.075, "LAG_002_Lekki": 0.075, "LAG_003_VI": 0.075, "ABJ_001_Garki": 0.075, "LDN_001_Camden": 0.20}
df_clean["total_with_tax"] = df_clean["subtotal"] * (1 + df_clean["store_id_clean"].map(tax_map))
df_clean["location_code"] = df_clean["store_id_clean"].str.split("_").str[0]
df_clean["month"] = df_clean["order_date_clean"].dt.to_period("M")

print(f"\nFinal cleaned DataFrame {df_clean.shape}:")
print(df_clean[["order_id_clean", "store_id_clean", "city_clean", "price_clean", "qty_clean", "subtotal", "total_with_tax", "month"]])

print(f"\nCleaned {len(df_clean)} from {len(df)} - removed {len(df)-len(df_clean)} bad/duplicates")

# Save
df_clean.to_csv("cleaned_my_stores_L22.csv", index=False)
print(f"Saved cleaned_my_stores_L22.csv")

print("\n=== Part 2: Kaggle Dataset Cleaning ===")
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
    print(f"Found Kaggle file {found} - applying full cleaning pipeline")
    df_kaggle = pd.read_csv(found, encoding="utf-8", low_memory=False, nrows=20000)
    print(f"  Original shape {df_kaggle.shape}, columns {df_kaggle.columns.tolist()[:10]}")
    print(f"  Nulls before:")
    print(df_kaggle.isnull().sum().head(10))
    print(f"  Duplicates: {df_kaggle.duplicated().sum()}")
    
    # Clean based on file type
    if "customer_city" in df_kaggle.columns:
        # Olist customers - clean city, state
        df_kaggle["customer_city_clean"] = df_kaggle["customer_city"].apply(lambda x: str(x).strip().title() if pd.notna(x) else x)
        df_kaggle["customer_state_clean"] = df_kaggle["customer_state"].apply(lambda x: str(x).strip().upper() if pd.notna(x) else x)
        # Remove duplicates by customer_id
        before = len(df_kaggle)
        df_kaggle = df_kaggle.drop_duplicates(subset=["customer_id"], keep="first")
        print(f"  After dedup by customer_id: {len(df_kaggle)} from {before}, removed {before-len(df_kaggle)}")
        print(f"  City value counts after cleaning:")
        print(df_kaggle["customer_city_clean"].value_counts().head())
    
    if "payment_value" in df_kaggle.columns:
        # Payments - clean payment_value, handle nulls, negative
        df_kaggle["payment_value_clean"] = pd.to_numeric(df_kaggle["payment_value"], errors="coerce")
        print(f"  payment_value before cleaning: nulls {df_kaggle['payment_value'].isnull().sum()}, negative {(df_kaggle['payment_value']<0).sum() if pd.api.types.is_numeric_dtype(df_kaggle['payment_value']) else 'N/A'}")
        df_kaggle = df_kaggle.dropna(subset=["payment_value_clean"])
        df_kaggle = df_kaggle[df_kaggle["payment_value_clean"] > 0]
        print(f"  After cleaning payment_value >0: {len(df_kaggle)} rows")
        print(f"  payment_value stats: Mean {df_kaggle['payment_value_clean'].mean():.2f}, Sum {df_kaggle['payment_value_clean'].sum():.2f}")
    
    if "Sales" in df_kaggle.columns:
        # Superstore - clean Sales, check Profit negative, Order Date
        df_kaggle["Sales_clean"] = pd.to_numeric(df_kaggle["Sales"], errors="coerce")
        if "Order Date" in df_kaggle.columns:
            df_kaggle["Order Date_clean"] = pd.to_datetime(df_kaggle["Order Date"], errors="coerce")
            print(f"  Order Date nulls after parse: {df_kaggle['Order Date_clean'].isnull().sum()}")
        print(f"  Duplicates by Order ID: {df_kaggle.duplicated(subset=['Order ID']).sum()}")
        df_kaggle = df_kaggle.drop_duplicates(subset=["Order ID"], keep="first")
        print(f"  After dedup by Order ID: {len(df_kaggle)}")
        print(f"  Sales stats after cleaning: Mean {df_kaggle['Sales_clean'].mean():.2f}")
    
    if "Quantity" in df_kaggle.columns and "UnitPrice" in df_kaggle.columns:
        # Ecommerce-data data.csv - Quantity negative (returns), UnitPrice negative, CustomerID null, Description special chars
        df_kaggle["Quantity_clean"] = pd.to_numeric(df_kaggle["Quantity"], errors="coerce")
        df_kaggle["UnitPrice_clean"] = pd.to_numeric(df_kaggle["UnitPrice"], errors="coerce")
        print(f"  Quantity negative (returns): {(df_kaggle['Quantity_clean']<0).sum()}, nulls {df_kaggle['Quantity_clean'].isnull().sum()}")
        print(f"  UnitPrice negative: {(df_kaggle['UnitPrice_clean']<0).sum()}, nulls {df_kaggle['UnitPrice_clean'].isnull().sum()}")
        print(f"  CustomerID nulls: {df_kaggle['CustomerID'].isnull().sum()}")
        # For cleaning project, remove returns and null CustomerID for sales analysis
        df_kaggle_clean = df_kaggle[(df_kaggle["Quantity_clean"]>0) & (df_kaggle["UnitPrice_clean"]>0)].copy()
        df_kaggle_clean = df_kaggle_clean.dropna(subset=["CustomerID"])
        print(f"  After removing returns (Quantity>0, UnitPrice>0) and null CustomerID: {len(df_kaggle_clean)} from {len(df_kaggle)}")
        df_kaggle_clean["Total"] = df_kaggle_clean["Quantity_clean"] * df_kaggle_clean["UnitPrice_clean"]
        print(f"  Total revenue cleaned: ${df_kaggle_clean['Total'].sum():.2f}")
        df_kaggle = df_kaggle_clean
    
    # Save cleaned Kaggle sample
    df_kaggle.head(1000).to_csv(f"cleaned_{found}", index=False)
    print(f"  Saved cleaned_{found} with 1000 rows after full cleaning pipeline")
    print(f"  Final nulls after cleaning:")
    print(df_kaggle.isnull().sum().head(10))
    
else:
    print(f"No Kaggle file found. Download:")
    print(f"  Primary: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce")
    print(f"    Files: olist_customers_dataset.csv (customer_city duplicates/misspellings, customer_state, customer_id duplicates)")
    print(f"           olist_order_payments_dataset.csv (payment_value nulls, payment_type, order_id duplicates)")
    print(f"           olist_products_dataset.csv (product_category_name nulls, product_name_lenght, product_description_lenght)")
    print(f"           - Perfect for full pipeline: nulls, duplicates, wrong types, messy city names")
    print(f"  Secondary: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final")
    print(f"    File: Superstore.csv - Order ID duplicates, City/State duplicates, Sales, Order Date formats, Profit negative")
    print(f"  Tertiary: https://www.kaggle.com/datasets/carrie1/ecommerce-data")
    print(f"    File: data.csv - Description special chars, Quantity negative (returns), UnitPrice negative, CustomerID null - perfect cleaning project")
    print(f"  Quaternary: https://www.kaggle.com/datasets/mukulkirti/laptops-with-nice-specs-real-dataset - Price with $, comma, missing, Company casing")

print(f"\n=== Summary ===")
print(f"Your stores: Cleaned {len(df_clean)} valid orders from {len(df)} messy")
for store_id in df_clean["store_id_clean"].unique():
    rev = df_clean[df_clean["store_id_clean"]==store_id]["total_with_tax"].sum()
    city = df_clean[df_clean["store_id_clean"]==store_id]["city_clean"].iloc[0] if len(df_clean[df_clean["store_id_clean"]==store_id])>0 else "Unknown"
    print(f"  {store_id} {city}: ${rev:.2f}")
```

**Deliverable:** Upload `cleaning_project_L22.py` plus outputs:
- `cleaned_my_stores_L22.csv` with 5 cleaned orders from 8 messy including order_id_clean ORD_LAG_001_5001, store_id_clean LAG_001_Ikeja, city_clean Ikeja, price_clean 25000, qty_clean 2, subtotal, total_with_tax, month, location_code LAG - removed duplicates, negative price, invalid BAD_ID, N/A price
- Console logs: store_id cleaning lag_002_lekki -> LAG_002_Lekki, city lekki -> Lekki, country ng -> NG, ID validation, price $25,000 -> 25000, £120.50 -> 120.50, N/A -> NaN, -5000 -> NaN, name cleaning, date parsing 8 formats, dedup, filter valid
- If Kaggle file downloaded (olist_customers_dataset.csv, Superstore.csv, data.csv), show original shape, nulls before, duplicates, after cleaning steps: dedup by customer_id/order_id, null handling, negative handling, city cleaning, final shape, nulls after, stats, saved cleaned_{file} 1000 rows

**Kaggle Links:**
1. Primary: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce (customer_city duplicates/misspellings like sao paulo vs Sao Paulo, customer_state, customer_id duplicates, payment_value nulls, product_category_name nulls - perfect for full pipeline)
2. Secondary: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final (Superstore.csv Order ID duplicates, City/State duplicates, Order Date multiple formats, Profit negative - good cleaning)
3. Tertiary: https://www.kaggle.com/datasets/carrie1/ecommerce-data (data.csv Description special chars, Quantity negative returns, UnitPrice negative, CustomerID null 135k nulls - best cleaning project)
4. Quaternary: https://www.kaggle.com/datasets/mukulkirti/laptops-with-nice-specs-real-dataset (Price $ and comma, missing, Company casing)

## 4. Checklist

- Can you build pipeline that cleans store_id lag_002_lekki -> LAG_002_Lekki, city lekki -> Lekki, country ng -> NG using mapping and regex?
- Can you validate order_id ORD_LAG_001_5001 and customer_id CUST_101_LAG with regex and set invalid BAD_ID to NaN?
- Can you clean price $25,000 -> 25000, £120.50 -> 120.50, N/A -> NaN, -5000 -> NaN and qty to numeric >0?
- Can you clean name "  alex johnson  " -> Alex Johnson, empty -> NaN, email invalid_email -> NaN with regex?
- Can you parse dates 8 formats 2024-01-15, 01/20/2024, 15-02-2024 to datetime and handle N/A?
- Can you handle duplicates drop_duplicates by order_id_clean and filter valid required fields dropna and >0?
- Can you load Kaggle olist_customers_dataset.csv and clean customer_city duplicates, customer_state upper, dedup by customer_id, handle nulls?
- Can you load Kaggle data.csv and handle Quantity negative returns, UnitPrice negative, CustomerID nulls, and produce cleaned revenue?

If yes, you can deliver end-to-end cleaning project.

Next: Final Capstone - End-to-End Sales Analysis Pipeline.

**Key Takeaway:** Real data from 5 stores LAG_001_Ikeja, LAG_002_Lekki, LAG_003_VI, LDN_001_Camden, ABJ_001_Garki has 8 problems: $25,000 comma, N/A, negative -5000, lag_001 lowercase, "  " empty, Ikeja vs ikeja, duplicates ORD_LAG_001_5001 twice, wrong types. Build pipeline: clean_store_id with regex matching, clean_city mapping, validate IDs, clean_price removing $£, clean_name, parse_date 8 formats, dedup, filter >0, calculated total_with_tax per location 7.5% vs 20%. Reusable module src/cleaning_pandas.py for any file. Apply same to Kaggle Olist and data.csv.
