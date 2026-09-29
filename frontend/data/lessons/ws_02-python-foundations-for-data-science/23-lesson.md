# Lesson 23 - Final Capstone - End-to-End Sales Analysis Pipeline

**Duration:** 120 min | **Level:** Capstone | **Goal:** Build complete pipeline from raw messy files and APIs and Kaggle data to manager reports for Lagos and London stores

## Learning Objectives
- Combine all 22 lessons into one pipeline: venv, files, regex, dates, OOP, comprehension, generators, APIs, NumPy, Pandas, grouping.
- Clean and merge your 5 stores LAG_001_Ikeja, LAG_002_Lekki, LAG_003_VI, LDN_001_Camden, ABJ_001_Garki with Kaggle Olist data.
- Produce final reports CSV, Excel, charts data, and summary for manager.

---

## 1. Capstone Architecture

<svg width="100%" height="220" viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="220" rx="16" fill="#FFFFFF"/>
  <text x="350" y="28" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">END-TO-END PIPELINE L23</text>
  <rect x="20" y="50" width="110" height="150" rx="12" fill="#FEE2E2" stroke="#991B1B" stroke-width="1.5"/>
  <text x="75" y="65" text-anchor="middle" font-family="Arial" font-size="8" font-weight="800" fill="#7F1D1D">RAW INPUTS</text>
  <text x="30" y="80" font-family="Arial" font-size="7" fill="#7F1D1D">messy_sales_*.csv</text>
  <text x="30" y="90" font-family="Arial" font-size="7" fill="#7F1D1D">LAG_001_Ikeja 12 Allen</text>
  <text x="30" y="100" font-family="Arial" font-size="7" fill="#7F1D1D">ORD_LAG_001_5001 $25k</text>
  <text x="30" y="110" font-family="Arial" font-size="7" fill="#7F1D1D">Kaggle Olist 100k</text>
  <text x="30" y="120" font-family="Arial" font-size="7" fill="#7F1D1D">Exchange API USD->NGN</text>
  <text x="30" y="130" font-family="Arial" font-size="7" fill="#7F1D1D">Geocode API lat/lng</text>
  <text x="30" y="140" font-family="Arial" font-size="7" fill="#7F1D1D">Duplicates, N/A, -10</text>
  <text x="30" y="150" font-family="Arial" font-size="7" fill="#7F1D1D">8 date formats</text>
  <rect x="150" y="50" width="110" height="150" rx="12" fill="#DBEAFE" stroke="#1E40AF" stroke-width="1.5"/>
  <text x="205" y="65" text-anchor="middle" font-family="Arial" font-size="8" font-weight="800" fill="#1E3A8A">CLEANING L13-L22</text>
  <text x="160" y="80" font-family="Arial" font-size="7" fill="#1E3A8A">venv isolated</text>
  <text x="160" y="90" font-family="Arial" font-size="7" fill="#1E3A8A">Regex ID validation</text>
  <text x="160" y="100" font-family="Arial" font-size="7" fill="#1E3A8A">Date parse 8 formats</text>
  <text x="160" y="110" font-family="Arial" font-size="7" fill="#1E3A8A">Price $25k -> 25000</text>
  <text x="160" y="120" font-family="Arial" font-size="7" fill="#1E3A8A">City lekki->Lekki</text>
  <text x="160" y="130" font-family="Arial" font-size="7" fill="#1E3A8A">Pandas dedup, filter</text>
  <text x="160" y="140" font-family="Arial" font-size="7" fill="#1E3A8A">OOP Store, Order</text>
  <text x="160" y="150" font-family="Arial" font-size="7" fill="#1E3A8A">NumPy vectorized</text>
  <rect x="280" y="50" width="110" height="150" rx="12" fill="#FEF3C7" stroke="#92400E" stroke-width="1.5"/>
  <text x="335" y="65" text-anchor="middle" font-family="Arial" font-size="8" font-weight="800" fill="#92400E">ENRICH L18</text>
  <text x="290" y="80" font-family="Arial" font-size="7" fill="#92400E">Exchange USD->NGN 1500</text>
  <text x="290" y="90" font-family="Arial" font-size="7" fill="#92400E">USD->GBP 0.79</text>
  <text x="290" y="100" font-family="Arial" font-size="7" fill="#92400E">Geocode Ikeja 6.60,3.35</text>
  <text x="290" y="110" font-family="Arial" font-size="7" fill="#92400E">Tax LAG 7.5% LDN 20%</text>
  <text x="290" y="120" font-family="Arial" font-size="7" fill="#92400E">SLA LAG 3d LDN 2d</text>
  <text x="290" y="130" font-family="Arial" font-size="7" fill="#92400E">Merge Olist customers</text>
  <text x="290" y="140" font-family="Arial" font-size="7" fill="#92400E">Kaggle payments</text>
  <rect x="410" y="50" width="130" height="150" rx="12" fill="#D1FAE5" stroke="#065F46" stroke-width="1.5"/>
  <text x="475" y="65" text-anchor="middle" font-family="Arial" font-size="8" font-weight="800" fill="#064E3B">ANALYSIS L20-L21</text>
  <text x="420" y="80" font-family="Arial" font-size="7" fill="#064E3B">groupby store_id revenue</text>
  <text x="420" y="90" font-family="Arial" font-size="7" fill="#064E3B">groupby city, country NG/UK</text>
  <text x="420" y="100" font-family="Arial" font-size="7" fill="#064E3B">groupby month 2024-01</text>
  <text x="420" y="110" font-family="Arial" font-size="7" fill="#064E3B">pivot store vs month</text>
  <text x="420" y="120" font-family="Arial" font-size="7" fill="#064E3B">Top products, customers</text>
  <text x="420" y="130" font-family="Arial" font-size="7" fill="#064E3B">Late deliveries SLA</text>
  <text x="420" y="140" font-family="Arial" font-size="7" fill="#064E3B">NumPy mean, percentile</text>
  <rect x="560" y="50" width="120" height="150" rx="12" fill="#EDE9FE" stroke="#5B21B6" stroke-width="1.5"/>
  <text x="620" y="65" text-anchor="middle" font-family="Arial" font-size="8" font-weight="800" fill="#5B21B6">REPORTS</text>
  <text x="570" y="80" font-family="Arial" font-size="7" fill="#5B21B6">cleaned_sales_final.csv</text>
  <text x="570" y="90" font-family="Arial" font-size="7" fill="#5B21B6">report_by_store.csv</text>
  <text x="570" y="100" font-family="Arial" font-size="7" fill="#5B21B6">pivot_store_month.csv</text>
  <text x="570" y="110" font-family="Arial" font-size="7" fill="#5B21B6">kaggle_enriched.csv</text>
  <text x="570" y="120" font-family="Arial" font-size="7" fill="#5B21B6">manager_summary.txt</text>
  <text x="570" y="130" font-family="Arial" font-size="7" fill="#5B21B6">Excel workbook</text>
  <text x="570" y="140" font-family="Arial" font-size="7" fill="#5B21B6">Charts ready</text>
</svg>

You have messy files from 5 stores: LAG_001_Ikeja (12 Allen Ave, Ikeja, Lagos, NG 101233), LAG_002_Lekki, LAG_003_VI, LDN_001_Camden (45 Camden High St, London, UK NW1 0JH), ABJ_001_Garki (Plot 123 Garki, Abuja, NG 900242) plus Kaggle Olist 100k orders. Need one pipeline that cleans with regex, dates, Pandas, enriches with exchange API USD->NGN 1500.5 and USD->GBP 0.79 and geocode API, then groups by store_id, city, country, month, and produces manager reports.

## 2. Capstone Code Structure

```
my_capstone/
├── venv/                      # L13 venv isolated
├── data/
│   ├── raw/
│   │   ├── messy_sales_LAG_001_Ikeja.csv
│   │   ├── messy_sales_LAG_002_Lekki.csv
│   │   ├── messy_sales_LDN_001_Camden.csv
│   │   └── olist_customers_dataset.csv (Kaggle)
│   ├── processed/
│   │   ├── cleaned_sales_final.csv
│   │   └── kaggle_enriched.csv
│   └── reports/
│       ├── report_by_store.csv
│       ├── report_by_city.csv
│       ├── report_by_country.csv
│       ├── pivot_store_vs_month.csv
│       ├── report_top_products.csv
│       └── manager_summary.txt
├── src/
│   ├── __init__.py
│   ├── cleaning.py            # L15, L20, L22 cleaning funcs
│   ├── models.py              # L16 Store, Product, Customer, Order classes
│   ├── api_enrich.py          # L18 exchange + geocode APIs
│   └── analysis.py            # L19-L21 NumPy + Pandas groupby
├── requirements.txt           # L13 pinned
├── main.py                    # Run full pipeline
└── .gitignore
```

## 3. Complete Pipeline Code

**Real World Example 1 - Full main.py:**

```
# main.py - Capstone pipeline for 5 stores LAG_001_Ikeja etc + Kaggle Olist

import pandas as pd
import numpy as np
import re
import os
import csv
import json
import requests
import time
from datetime import datetime
from collections import defaultdict

# CONFIG - Your 5 stores with full locations, IDs, tax, SLA
MY_STORES = {
    "LAG_001_Ikeja": {"city": "Ikeja", "state": "Lagos", "country": "NG", "address": "12 Allen Avenue, Ikeja, Lagos, NG 101233", "zip": "101233", "currency": "NGN", "tax": 0.075, "sla_days": 3, "lat": 6.6018, "lng": 3.3511},
    "LAG_002_Lekki": {"city": "Lekki", "state": "Lagos", "country": "NG", "address": "Plot 5 Admiralty Way, Lekki, Lagos, NG 105102", "zip": "105102", "currency": "NGN", "tax": 0.075, "sla_days": 3, "lat": 6.4486, "lng": 3.4728},
    "LAG_003_VI": {"city": "Victoria Island", "state": "Lagos", "country": "NG", "address": "10 Akin Adesola Street, VI, Lagos, NG 101241", "zip": "101241", "currency": "NGN", "tax": 0.075, "sla_days": 3, "lat": 6.4281, "lng": 3.4219},
    "LDN_001_Camden": {"city": "Camden", "state": "London", "country": "UK", "address": "45 Camden High Street, London, UK NW1 0JH", "zip": "NW1 0JH", "currency": "GBP", "tax": 0.20, "sla_days": 2, "lat": 51.5390, "lng": -0.1426},
    "LDN_002_Stratford": {"city": "Stratford", "state": "London", "country": "UK", "address": "Westfield Stratford City, London, UK E20 1EJ", "zip": "E20 1EJ", "currency": "GBP", "tax": 0.20, "sla_days": 2, "lat": 51.5430, "lng": -0.0020},
    "ABJ_001_Garki": {"city": "Garki", "state": "FCT", "country": "NG", "address": "Plot 123, Garki, Abuja, NG 900242", "zip": "900242", "currency": "NGN", "tax": 0.075, "sla_days": 4, "lat": 9.0400, "lng": 7.5000},
}

VALID_STORE_IDS = list(MY_STORES.keys())

def clean_store_id(sid):
    if pd.isna(sid):
        return np.nan
    sid = str(sid).strip()
    sid_upper = sid.upper()
    for valid in VALID_STORE_IDS:
        if valid.split("_")[0] in sid_upper and valid.split("_")[1] in sid_upper:
            return valid
        if sid_upper == valid.upper():
            return valid
    m = re.search(r"([A-Z]{3}_\d{3})", sid_upper)
    if m:
        for valid in VALID_STORE_IDS:
            if m.group(1) in valid:
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
    mapping = {"Vi": "Victoria Island", "Lekki": "Lekki", "Ikeja": "Ikeja", "Camden": "Camden", "Garki": "Garki", "Stratford": "Stratford"}
    return mapping.get(city, city)

def parse_date_multi(date_str):
    if pd.isna(date_str) or str(date_str).strip().upper() in ["N/A", "NA", ""]:
        return pd.NaT
    formats = ["%Y-%m-%d", "%m/%d/%Y", "%d-%m-%Y", "%m-%d-%Y", "%d/%m/%Y", "%Y/%m/%d", "%Y-%m-%d %H:%M:%S"]
    for fmt in formats:
        try:
            return datetime.strptime(str(date_str).strip(), fmt)
        except:
            continue
    return pd.NaT

def clean_dataframe(df):
    df = df.copy()
    df["store_id_clean"] = df["store_id"].apply(clean_store_id)
    df["order_id_clean"] = df["order_id"].apply(lambda x: x if re.match(r"^(ORD|INV)_[A-Z]{3}_\d{3}_\d{4}$", str(x)) else np.nan)
    df["customer_id_clean"] = df["customer_id"].apply(lambda x: x if re.match(r"^CUST_\d{3}_[A-Z]{3}$", str(x)) else np.nan)
    df["price_clean"] = df["price"].apply(clean_price)
    df["qty_clean"] = pd.to_numeric(df["qty"], errors="coerce")
    df["city_clean"] = df["city"].apply(clean_city)
    df["order_date_clean"] = df["order_date"].apply(parse_date_multi)
    df["order_date_clean"] = pd.to_datetime(df["order_date_clean"], errors="coerce")
    df = df.drop_duplicates(subset=["order_id_clean"], keep="first")
    df = df.dropna(subset=["store_id_clean", "order_id_clean", "price_clean", "qty_clean", "order_date_clean"])
    df = df[(df["price_clean"] > 0) & (df["qty_clean"] > 0)]
    df["subtotal"] = df["price_clean"] * df["qty_clean"]
    tax_map = {sid: info["tax"] for sid, info in MY_STORES.items()}
    df["total_with_tax"] = df["subtotal"] * (1 + df["store_id_clean"].map(tax_map))
    df["location_code"] = df["store_id_clean"].str.split("_").str[0]
    df["month"] = df["order_date_clean"].dt.to_period("M")
    df["year"] = df["order_date_clean"].dt.year
    return df

def get_exchange_rates():
    try:
        url = "https://api.exchangerate.host/latest?base=USD&symbols=NGN,GBP,EUR,BRL"
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        rates = data.get("rates", {})
        print(f"Exchange rates API success: {rates}")
        return rates
    except Exception as e:
        print(f"Exchange API failed {e}, using fallback NGN 1500.5 GBP 0.79")
        return {"NGN": 1500.5, "GBP": 0.79, "EUR": 0.92, "BRL": 5.0}

def geocode_store(store_id):
    info = MY_STORES.get(store_id, {})
    return info.get("lat"), info.get("lng"), info.get("address")

def main():
    print("=== L23 CAPSTONE PIPELINE START ===")
    os.makedirs("data/raw", exist_ok=True)
    os.makedirs("data/processed", exist_ok=True)
    os.makedirs("data/reports", exist_ok=True)
    
    messy_data = [
        {"order_id": "ORD_LAG_001_5001", "store_id": "LAG_001_Ikeja", "city": "Ikeja", "country": "NG", "customer_id": "CUST_101_LAG", "customer_name": "  alex johnson  ", "product_id": "MSE-BLK-001", "product_cat": "Accessories", "price": "$25,000", "qty": "2", "order_date": "2024-01-15", "address": "12 Allen Ave, Ikeja, Lagos, NG 101233"},
        {"order_id": "ORD_LAG_002_5002", "store_id": "lag_002_lekki", "city": "lekki", "country": "ng", "customer_id": "CUST_102_LAG", "customer_name": "SAM LEE", "product_id": "KBD-WHT-002", "product_cat": "Accessories", "price": "32000", "qty": "1", "order_date": "01/20/2024", "address": "Admiralty Way, Lekki, Lagos, NG 105102"},
        {"order_id": "ORD_LAG_003_5003", "store_id": "LAG_003_VI", "city": "VI", "country": "NG", "customer_id": "CUST_103_LAG", "customer_name": "  ", "product_id": "MON-24-003", "product_cat": "Display", "price": "N/A", "qty": "1", "order_date": "15-02-2024", "address": "Akin Adesola, VI, Lagos, NG 101241"},
        {"order_id": "ORD_LDN_001_2001", "store_id": "LDN_001_Camden", "city": "Camden", "country": "UK", "customer_id": "CUST_104_LDN", "customer_name": "maria garcia", "product_id": "MSE-BLK-001", "product_cat": "Accessories", "price": "£120.50", "qty": "3", "order_date": "2024-01-10", "address": "45 Camden High St, London, UK NW1 0JH"},
        {"order_id": "ORD_LAG_001_5001", "store_id": "LAG_001_Ikeja", "city": "Ikeja", "country": "NG", "customer_id": "CUST_101_LAG", "customer_name": "Alex Johnson", "product_id": "MSE-BLK-001", "product_cat": "Accessories", "price": "$25,000", "qty": "2", "order_date": "2024-01-15", "address": "12 Allen Ave, Ikeja, Lagos, NG 101233"},
        {"order_id": "ORD_ABJ_001_3001", "store_id": "ABJ_001_Garki", "city": "Garki", "country": "NG", "customer_id": "CUST_105_ABJ", "customer_name": "Fatima Bello", "product_id": "CAB-USB-004", "product_cat": "Accessories", "price": "-5000", "qty": "2", "order_date": "2024-02-10", "address": "Plot 123 Garki, Abuja, NG 900242"},
        {"order_id": "ORD_LAG_002_5005", "store_id": "LAG_002_Lekki", "city": "lekki", "country": "ng", "customer_id": "CUST_106_LAG", "customer_name": "Chidi Okoro", "product_id": "MSE-BLK-001", "product_cat": "Accessories", "price": "25000", "qty": "5", "order_date": "2024-02-20", "address": "Admiralty Way, Lekki, Lagos, NG 105102"},
        {"order_id": "ORD_LAG_001_5006", "store_id": "LAG_001_Ikeja", "city": "Ikeja", "country": "NG", "customer_id": "CUST_107_LAG", "customer_name": "Tunde Adeyemi", "product_id": "KBD-WHT-002", "product_cat": "Accessories", "price": "35000", "qty": "2", "order_date": "2024-02-25", "address": "12 Allen Ave, Ikeja, Lagos, NG 101233"},
        {"order_id": "ORD_LDN_002_2002", "store_id": "LDN_002_Stratford", "city": "Stratford", "country": "UK", "customer_id": "CUST_108_LDN", "customer_name": "Emma Wilson", "product_id": "MON-24-003", "product_cat": "Display", "price": "250.00", "qty": "1", "order_date": "2024-02-15", "address": "Westfield Stratford City, London, UK E20 1EJ"},
        {"order_id": "ORD_ABJ_001_3002", "store_id": "ABJ_001_Garki", "city": "Garki", "country": "NG", "customer_id": "CUST_109_ABJ", "customer_name": "Musa Ibrahim", "product_id": "MSE-BLK-001", "product_cat": "Accessories", "price": "26000", "qty": "3", "order_date": "2024-01-28", "address": "Plot 123 Garki, Abuja, NG 900242"},
    ]
    
    df_raw = pd.DataFrame(messy_data)
    df_raw.to_csv("data/raw/messy_sales_all_stores.csv", index=False)
    print(f"Created data/raw/messy_sales_all_stores.csv with {len(df_raw)} rows")
    
    df_clean = clean_dataframe(df_raw)
    print(f"Cleaned {len(df_clean)} from {len(df_raw)}")
    
    rates = get_exchange_rates()
    
    enriched = []
    for _, row in df_clean.iterrows():
        store_id = row["store_id_clean"]
        info = MY_STORES.get(store_id, {})
        currency = info.get("currency", "USD")
        rate = rates.get(currency, 1.0)
        lat, lng, addr = geocode_store(store_id)
        enriched.append({
            "order_id": row["order_id_clean"],
            "store_id": store_id,
            "city": row["city_clean"],
            "state": info.get("state", ""),
            "country": info.get("country", ""),
            "address": info.get("address", ""),
            "zip": info.get("zip", ""),
            "lat": lat,
            "lng": lng,
            "customer_id": row["customer_id_clean"],
            "product_id": row["product_id"],
            "product_cat": row["product_cat"],
            "price_clean": row["price_clean"],
            "qty_clean": row["qty_clean"],
            "subtotal": row["subtotal"],
            "tax_rate": info.get("tax", 0.075),
            "total_with_tax": row["total_with_tax"],
            "currency": currency,
            "exchange_rate": rate,
            "total_local_currency": round(row["total_with_tax"] * (rate if currency!="USD" else 1), 2) if currency in ["NGN","GBP"] else row["total_with_tax"],
            "sla_days": info.get("sla_days", 3),
            "order_date": row["order_date_clean"],
            "month": str(row["month"]),
            "location_code": row["location_code"],
        })
    
    df_enriched = pd.DataFrame(enriched)
    df_enriched.to_csv("data/processed/cleaned_sales_final.csv", index=False)
    print(f"Enriched saved data/processed/cleaned_sales_final.csv with {len(df_enriched)} rows")
    
    report_store = df_enriched.groupby("store_id").agg(revenue=("total_with_tax","sum"), revenue_local=("total_local_currency","sum"), avg_order=("total_with_tax","mean"), orders=("order_id","count"), customers=("customer_id","nunique"), max_order=("total_with_tax","max")).sort_values("revenue", ascending=False)
    report_store.to_csv("data/reports/report_by_store.csv")
    
    report_city = df_enriched.groupby("city").agg(revenue=("total_with_tax","sum"), orders=("order_id","count"), avg_order=("total_with_tax","mean"), customers=("customer_id","nunique")).sort_values("revenue", ascending=False)
    report_city.to_csv("data/reports/report_by_city.csv")
    
    report_country = df_enriched.groupby("country").agg(revenue=("total_with_tax","sum"), orders=("order_id","count"), avg_order=("total_with_tax","mean"))
    report_country.to_csv("data/reports/report_by_country.csv")
    
    report_loc = df_enriched.groupby("location_code").agg(revenue=("total_with_tax","sum"), orders=("order_id","count"))
    report_loc.to_csv("data/reports/report_by_location_code.csv")
    
    report_month = df_enriched.groupby("month").agg(revenue=("total_with_tax","sum"), orders=("order_id","count"))
    report_month.to_csv("data/reports/report_by_month.csv")
    
    report_product = df_enriched.groupby("product_id").agg(revenue=("total_with_tax","sum"), qty=("qty_clean","sum"), orders=("order_id","count")).sort_values("revenue", ascending=False)
    report_product.to_csv("data/reports/report_top_products.csv")
    
    pivot_store_month = df_enriched.pivot_table(index="store_id", columns="month", values="total_with_tax", aggfunc="sum", fill_value=0)
    pivot_store_month.to_csv("data/reports/pivot_store_vs_month.csv")
    
    totals = df_enriched["total_with_tax"].values
    summary = f"""
MANAGER SUMMARY L23 CAPSTONE
Stores: LAG_001_Ikeja 12 Allen Ave Ikeja Lagos NG 101233 lat 6.6018 lng 3.3511 tax 7.5% SLA 3 NGN
LAG_002_Lekki Admiralty Way Lekki Lagos NG 105102 tax 7.5% SLA 3 NGN
LAG_003_VI Akin Adesola VI Lagos NG 101241 tax 7.5% SLA 3 NGN
LDN_001_Camden 45 Camden High St London UK NW1 0JH lat 51.5390 lng -0.1426 tax 20% SLA 2 GBP
LDN_002_Stratford Westfield Stratford City London UK E20 1EJ tax 20% SLA 2 GBP
ABJ_001_Garki Plot 123 Garki Abuja NG 900242 lat 9.0400 lng 7.5000 tax 7.5% SLA 4 NGN
Raw {len(df_raw)} messy -> Cleaned {len(df_clean)} valid removed {len(df_raw)-len(df_clean)}
Total revenue {df_enriched["total_with_tax"].sum():.2f} orders {len(df_enriched)} avg {df_enriched["total_with_tax"].mean():.2f}
Exchange USD->NGN {rates.get('NGN')} USD->GBP {rates.get('GBP')}
Top store {report_store.index[0]} revenue {report_store.iloc[0]['revenue']:.2f}
Report files in data/reports/
"""
    with open("data/reports/manager_summary.txt", "w", encoding="utf-8") as f:
        f.write(summary)
    print(summary)

if __name__ == "__main__":
    main()
```

Run:

```
python -m venv venv
venv\Scripts\activate
pip install pandas numpy requests openpyxl
pip freeze > requirements.txt
python capstone_pipeline_L23.py
```

## 4. Hands-On Assignment - Final Capstone

**Dataset to download:**
Links:
- Primary: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce (7 files: customers city/state/zip, orders timestamps, payments payment_value, items price/freight, products category, geolocation lat/lng, sellers city/state)
- Secondary: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final (Superstore.csv Order ID, Order Date, Ship Date, Customer ID, City, State, Country, Region, Category, Sales, Quantity, Profit)
- Tertiary: https://www.kaggle.com/datasets/carrie1/ecommerce-data (data.csv InvoiceNo, StockCode, Quantity, InvoiceDate, UnitPrice, CustomerID, Country 541k rows)
- Quaternary: https://www.kaggle.com/datasets/mkechinov/ecommerce-behavior-data-from-multi-category-store (4M events)

Download all Olist files into data/raw/

**Task - Create file `capstone_pipeline_L23.py`:**

Copy main.py above and run pipeline.

**Deliverable:** Zip data/ folder with:
- data/processed/cleaned_sales_final.csv with 8 orders including order_id ORD_LAG_001_5001, store_id LAG_001_Ikeja 12 Allen Ave Ikeja Lagos NG 101233 lat 6.6018 lng 3.3511, city Ikeja, country NG, customer_id CUST_101_LAG, price_clean 25000, total_with_tax, currency NGN, exchange_rate 1500.5, total_local_currency, month 2024-01, location_code LAG
- data/reports/report_by_store.csv, report_by_city.csv, report_by_country.csv, report_by_location_code.csv, report_by_month.csv, report_top_products.csv, pivot_store_vs_month.csv
- data/reports/manager_summary.txt with 6 stores full details, raw vs cleaned counts, revenue by store/city/country, exchange rates
- If Kaggle downloaded: groupby City Sales top 10, customer_state counts, payment_value stats mapped to your store_ids LAG_001_Ikeja, LDN_001_Camden, ABJ_001_Garki

**Kaggle Links:**
1. Primary: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce (perfect for full pipeline mapping to Lagos/London stores)
2. Secondary: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final (best for reports)
3. Tertiary: https://www.kaggle.com/datasets/carrie1/ecommerce-data (541k rows test generators)
4. Quaternary: https://www.kaggle.com/datasets/mkechinov/ecommerce-behavior-data-from-multi-category-store (4M events)

## 5. Checklist - Job Ready

- Can you create venv and requirements.txt L13?
- Can you parse dates 8 formats L14?
- Can you validate IDs ORD_LAG_001_5001, CUST_101_LAG, MSE-BLK-001 with regex L15?
- Can you build OOP Store with address 12 Allen Ave Ikeja Lagos NG 101233 lat 6.6018 lng 3.3511 tax 7.5% SLA 3 L16?
- Can you use comprehensions and generators for 541k rows L17?
- Can you call exchange API USD->NGN 1500.5 USD->GBP 0.79 and geocode API Ikeja lat 6.6018 lng 3.3511 L18?
- Can you use NumPy vectorized price*qty*(1+tax) L19?
- Can you create DataFrame with ORD_LAG_001_5001, LAG_001_Ikeja, Ikeja, NG, CUST_101_LAG, head/info/describe, filter NG, LAG_001_Ikeja, high value L20?
- Can you groupby store_id, city, country NG vs UK, location_code LAG/LDN/ABJ, month, pivot store vs month L21?
- Can you build full cleaning pipeline $25,000, N/A, -5000, lag_002_lekki -> LAG_002_Lekki, duplicate ORD_LAG_001_5001 L22?
- Can you combine all into main.py producing 10 reports L23?
- Can you download Kaggle Olist and Superstore and map to your stores and produce reports?

If yes, python foundation for data science is complete and you are job ready.

**Key Takeaway:** Messy data from 6 stores LAG_001_Ikeja 12 Allen Ave Ikeja Lagos NG 101233 lat 6.6018 lng 3.3511, LAG_002_Lekki, LAG_003_VI, LDN_001_Camden 45 Camden High St London UK NW1 0JH lat 51.5390 lng -0.1426, LDN_002_Stratford, ABJ_001_Garki Plot 123 Garki Abuja NG 900242 lat 9.0400 lng 7.5000 with IDs ORD_LAG_001_5001, CUST_101_LAG, MSE-BLK-001, $25,000 comma, N/A, negative, duplicates, 8 date formats -> cleaned 8 valid -> enriched with exchange API USD->NGN 1500.5 USD->GBP 0.79 and geocode lat/lng and tax 7.5% vs 20% and SLA 3 vs 2 days -> grouped by store_id, city, country NG vs UK, location_code LAG/LDN/ABJ, month, product -> 10 reports CSV and manager_summary.txt. Same pipeline works for Kaggle Olist 100k orders.
