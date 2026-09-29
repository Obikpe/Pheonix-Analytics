# Lesson 14 - Working with Dates, Times and Calendars

**Duration:** 70 min | **Level:** Beginner | **Goal:** Handle dates for real reporting, sales by month, customer age, delivery times

## Learning Objectives
- Parse and format dates from messy CSVs.
- Calculate differences: days between orders, customer age, overdue invoices.
- Group sales by day, week, month, quarter for reports using locations and IDs.

---

## 1. Why Dates Break Reports

<svg width="100%" height="190" viewBox="0 0 700 190" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="190" rx="16" fill="#FFFFFF"/>
  <text x="350" y="28" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">MESSY DATES IN REAL DATA</text>
  <rect x="20" y="50" width="200" height="120" rx="12" fill="#FEE2E2" stroke="#991B1B" stroke-width="1.5"/>
  <text x="120" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#7F1D1D">WHAT YOU GET</text>
  <text x="35" y="90" font-family="Arial" font-size="9" fill="#7F1D1D">01/15/2024, 15-01-2024</text>
  <text x="35" y="105" font-family="Arial" font-size="9" fill="#7F1D1D">2024-01-15, Jan 15 2024</text>
  <text x="35" y="120" font-family="Arial" font-size="9" fill="#7F1D1D">Empty, N/A, 0000-00-00</text>
  <text x="35" y="135" font-family="Arial" font-size="9" fill="#7F1D1D">LAG_001 Lagos vs LDN_002 London</text>
  <text x="35" y="150" font-family="Arial" font-size="9" fill="#7F1D1D">Same customer different format</text>
  <rect x="250" y="50" width="200" height="120" rx="12" fill="#DBEAFE" stroke="#1E40AF" stroke-width="1.5"/>
  <text x="350" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#1E3A8A">PROBLEM</text>
  <text x="265" y="90" font-family="Arial" font-size="9" fill="#1E3A8A">Cannot sort chronologically</text>
  <text x="265" y="105" font-family="Arial" font-size="9" fill="#1E3A8A">Month grouping fails</text>
  <text x="265" y="120" font-family="Arial" font-size="9" fill="#1E3A8A">Age calc crashes</text>
  <text x="265" y="135" font-family="Arial" font-size="9" fill="#1E3A8A">Delivery SLA wrong</text>
  <text x="265" y="150" font-family="Arial" font-size="9" fill="#1E3A8A">Reports show wrong totals</text>
  <rect x="480" y="50" width="200" height="120" rx="12" fill="#D1FAE5" stroke="#065F46" stroke-width="1.5"/>
  <text x="580" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#064E3B">CLEANED</text>
  <text x="495" y="90" font-family="Arial" font-size="9" fill="#064E3B">datetime(2024,1,15)</text>
  <text x="495" y="105" font-family="Arial" font-size="9" fill="#064E3B">Standard YYYY-MM-DD</text>
  <text x="495" y="120" font-family="Arial" font-size="9" fill="#064E3B">Calculate days, age, SLA</text>
  <text x="495" y="135" font-family="Arial" font-size="9" fill="#064E3B">Group by month, store ID</text>
  <text x="495" y="150" font-family="Arial" font-size="9" fill="#064E3B">Correct reports per location</text>
</svg>

Sales data from 3 stores in Lagos (Store IDs: LAG_001_Ikeja, LAG_002_Lekki, LAG_003_VI) and 2 in London (LDN_001_Camden, LDN_002_Stratford) comes with different date formats. You must standardize to datetime objects before any analysis.

## 2. datetime Basics - Creating and Parsing

**Real World Example 1 - Create dates:**

```
from datetime import datetime, date, timedelta

# Today
today = date.today()
print(today)  # 2024-01-15

# Specific date
order_date = date(2024, 1, 15)
print(order_date)

# Date and time
order_datetime = datetime(2024, 1, 15, 14, 30, 0)  # 2024-01-15 14:30:00
print(order_datetime)

# Now
now = datetime.now()
print(now)

# Parts
print(f"Year {now.year}, Month {now.month}, Day {now.day}, Weekday {now.weekday()}")
# weekday 0=Monday, 6=Sunday
```

**Real World Example 2 - Parse messy date strings from CSV:**

Sales file `sales_lagos_ikeja_LAG_001.csv` has dates like 01/15/2024, 15-01-2024, 2024/01/15.

```
from datetime import datetime

def parse_date(date_str):
    if not date_str or str(date_str).strip().lower() in ["", "n/a", "na", "null", "0000-00-00"]:
        return None
    
    date_str = str(date_str).strip()
    
    # Try common formats
    formats = [
        "%Y-%m-%d",      # 2024-01-15
        "%m/%d/%Y",      # 01/15/2024
        "%d-%m-%Y",      # 15-01-2024
        "%Y/%m/%d",      # 2024/01/15
        "%d/%m/%Y",      # 15/01/2024
        "%b %d %Y",      # Jan 15 2024
        "%B %d %Y",      # January 15 2024
        "%d %b %Y",      # 15 Jan 2024
    ]
    
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.date()  # return date only
        except ValueError:
            continue
    
    # If none works
    print(f"Failed to parse date: {date_str}")
    return None

print(parse_date("2024-01-15"))  # 2024-01-15
print(parse_date("01/15/2024"))  # 2024-01-15
print(parse_date("15-01-2024"))  # 2024-01-15
print(parse_date("Jan 15 2024"))  # 2024-01-15
print(parse_date("N/A"))  # None
```

This function handles 8 formats. Real data needs this.

**Real World Example 3 - Format dates for reports:**

```
from datetime import date

d = date(2024, 1, 15)

print(d.strftime("%Y-%m-%d"))  # 2024-01-15 - for file names and sorting
print(d.strftime("%d/%m/%Y"))  # 15/01/2024 - for Lagos reports
print(d.strftime("%B %d, %Y"))  # January 15, 2024 - for customer facing
print(d.strftime("%Y-%m"))  # 2024-01 - for month grouping key
print(d.strftime("%A"))  # Monday - weekday name
```

Use YYYY-MM-DD for storage, format for display per location.

## 3. Date Math - Differences, Age, SLA

**Real World Example 4 - Days between order and delivery:**

```
from datetime import date

def days_between(start_date, end_date):
    if not start_date or not end_date:
        return None
    delta = end_date - start_date
    return delta.days

order = date(2024, 1, 10)
delivery = date(2024, 1, 15)

print(days_between(order, delivery))  # 5 days

# SLA check - Lagos stores promise 3 days, London 2 days
orders = [
    {"order_id": "ORD_LAG_001_101", "store_id": "LAG_001_Ikeja", "location": "Ikeja, Lagos, NG", "order_date": date(2024,1,10), "delivery_date": date(2024,1,15)},
    {"order_id": "ORD_LAG_002_102", "store_id": "LAG_002_Lekki", "location": "Lekki, Lagos, NG", "order_date": date(2024,1,10), "delivery_date": date(2024,1,12)},
    {"order_id": "ORD_LDN_001_201", "store_id": "LDN_001_Camden", "location": "Camden, London, UK", "order_date": date(2024,1,10), "delivery_date": date(2024,1,12)},
]

for o in orders:
    days = days_between(o["order_date"], o["delivery_date"])
    sla = 3 if "LAG" in o["store_id"] else 2
    status = "ON TIME" if days <= sla else "LATE"
    print(f"{o['order_id']} {o['store_id']} {o['location']} - {days} days - {status} (SLA {sla})")
```

**Real World Example 5 - Customer age calculation:**

```
from datetime import date

def calculate_age(birth_date, today=None):
    if not birth_date:
        return None
    if today is None:
        today = date.today()
    
    age = today.year - birth_date.year
    # Adjust if birthday not yet this year
    if (today.month, today.day) < (birth_date.month, birth_date.day):
        age -= 1
    return age

customers = [
    {"customer_id": "CUST_101_LAG", "name": "Alex Johnson", "location": "Lekki, Lagos, NG", "dob": date(1990, 5, 20)},
    {"customer_id": "CUST_102_LDN", "name": "Sam Lee", "location": "Camden, London, UK", "dob": date(1985, 12, 10)},
]

for c in customers:
    age = calculate_age(c["dob"])
    print(f"{c['customer_id']} {c['name']} {c['location']} - Age {age}")
```

**Real World Example 6 - Add days, months for due dates:**

```
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta  # pip install python-dateutil

today = date(2024, 1, 15)

# Due in 30 days
due_30 = today + timedelta(days=30)
print(due_30)  # 2024-02-14

# Due in 3 months - use relativedelta for month math
due_3months = today + relativedelta(months=3)
print(due_3months)  # 2024-04-15

# Invoice example
invoices = [
    {"invoice_id": "INV_LAG_001_1001", "store_id": "LAG_001_Ikeja", "issue_date": date(2024,1,15), "term_days": 30},
    {"invoice_id": "INV_LDN_001_2001", "store_id": "LDN_001_Camden", "issue_date": date(2024,1,15), "term_days": 45},
]

for inv in invoices:
    due = inv["issue_date"] + timedelta(days=inv["term_days"])
    days_left = (due - date.today()).days if due else None
    print(f"{inv['invoice_id']} {inv['store_id']} Issue {inv['issue_date']} Due {due} Days left {days_left}")
```

## 4. Grouping Sales by Date for Reports

**Real World Example 7 - Group by month and store:**

```
from datetime import date
from collections import defaultdict

sales = [
    {"order_id": "ORD_001", "store_id": "LAG_001_Ikeja", "location": "Ikeja, Lagos, NG", "date": date(2024,1,15), "amount": 25000},
    {"order_id": "ORD_002", "store_id": "LAG_001_Ikeja", "location": "Ikeja, Lagos, NG", "date": date(2024,1,20), "amount": 15000},
    {"order_id": "ORD_003", "store_id": "LAG_002_Lekki", "location": "Lekki, Lagos, NG", "date": date(2024,1,18), "amount": 30000},
    {"order_id": "ORD_004", "store_id": "LAG_001_Ikeja", "location": "Ikeja, Lagos, NG", "date": date(2024,2,5), "amount": 40000},
    {"order_id": "ORD_005", "store_id": "LDN_001_Camden", "location": "Camden, London, UK", "date": date(2024,1,10), "amount": 120.50},
]

# Group by month YYYY-MM
monthly = defaultdict(float)
for s in sales:
    key = s["date"].strftime("%Y-%m")
    monthly[key] += s["amount"]

print("Monthly revenue:")
for month, total in sorted(monthly.items()):
    print(f"  {month}: {total}")

# Group by store and month
store_monthly = defaultdict(lambda: defaultdict(float))
for s in sales:
    month = s["date"].strftime("%Y-%m")
    store_monthly[s["store_id"]][month] += s["amount"]

print("\nRevenue by store and month:")
for store_id, months in store_monthly.items():
    for month, total in months.items():
        print(f"  {store_id} {month}: {total}")

# Group by location
location_monthly = defaultdict(float)
for s in sales:
    location_monthly[s["location"]] += s["amount"]

print("\nRevenue by location:")
for loc, total in location_monthly.items():
    print(f"  {loc}: {total}")
```

## 5. Hands-On Assignment with Kaggle Dataset

**Assignment 14: Store Sales Date Analysis**

**Dataset to download:**
Kaggle: Superstore Sales Dataset - perfect for date grouping with Store IDs and Locations
Link: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final
Alternative: https://www.kaggle.com/datasets/rohitsahoo/sales-prediction-dataset (has Order Date, Store ID)

Download `SampleSuperstore.csv` - contains Order Date, Ship Date, Sales, Customer ID, State, City.

**Task - Create file `sales_date_analysis_L14.py`:**

Requirements: Use locations and IDs from dataset, handle messy dates, include your own Lagos/London store IDs for practice.

```
from datetime import datetime, date
from collections import defaultdict
import csv
import os

# Your stores for this assignment
MY_STORES = {
    "LAG_001_Ikeja": "Ikeja, Lagos, NG",
    "LAG_002_Lekki": "Lekki, Lagos, NG", 
    "LAG_003_VI": "Victoria Island, Lagos, NG",
    "LDN_001_Camden": "Camden, London, UK",
    "LDN_002_Stratford": "Stratford, London, UK"
}

def parse_date(date_str):
    if not date_str or str(date_str).strip().lower() in ["", "n/a", "na"]:
        return None
    formats = ["%Y-%m-%d", "%m/%d/%Y", "%d-%m-%Y", "%m-%d-%Y", "%d/%m/%Y", "%Y/%m/%d"]
    for fmt in formats:
        try:
            return datetime.strptime(str(date_str).strip(), fmt).date()
        except:
            continue
    return None

def days_between(d1, d2):
    if not d1 or not d2:
        return None
    return (d2 - d1).days

# Load Kaggle dataset
filepath = "SampleSuperstore.csv"  # Download from Kaggle link above
if not os.path.exists(filepath):
    print(f"Download dataset from https://www.kaggle.com/datasets/vivek468/superstore-dataset-final")
    print(f"Place SampleSuperstore.csv in this folder")
else:
    monthly_sales = defaultdict(float)
    shipping_days = []
    late_shipments = []
    
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Parse dates - columns may be Order Date and Ship Date
            order_date = parse_date(row.get("Order Date") or row.get("order_date"))
            ship_date = parse_date(row.get("Ship Date") or row.get("ship_date"))
            
            # Amount - column may be Sales
            try:
                amount = float(str(row.get("Sales", "0")).replace("$","").replace(",",""))
            except:
                amount = 0
            
            if order_date:
                month_key = order_date.strftime("%Y-%m")
                monthly_sales[month_key] += amount
            
            if order_date and ship_date:
                days = days_between(order_date, ship_date)
                shipping_days.append(days)
                if days > 5:  # SLA 5 days
                    late_shipments.append((row.get("Order ID", "N/A"), days))
    
    print(f"Monthly sales from Kaggle dataset:")
    for month in sorted(monthly_sales.keys())[:12]:
        print(f"  {month}: ${monthly_sales[month]:.2f}")
    
    if shipping_days:
        avg_ship = sum(shipping_days) / len(shipping_days)
        print(f"\nAverage shipping days: {avg_ship:.1f}")
        print(f"Late shipments (>5 days): {len(late_shipments)}")
        for order_id, days in late_shipments[:5]:
            print(f"  Order {order_id} - {days} days")

# Also create your own Lagos data
my_sales = [
    {"order_id": "ORD_LAG_001_5001", "store_id": "LAG_001_Ikeja", "location": MY_STORES["LAG_001_Ikeja"], "order_date": "2024-01-15", "ship_date": "2024-01-18", "amount": 25000},
    {"order_id": "ORD_LAG_002_5002", "store_id": "LAG_002_Lekki", "location": MY_STORES["LAG_002_Lekki"], "order_date": "01/20/2024", "ship_date": "01/22/2024", "amount": 32000},
    {"order_id": "ORD_LAG_003_5003", "store_id": "LAG_003_VI", "location": MY_STORES["LAG_003_VI"], "order_date": "15-02-2024", "ship_date": "18-02-2024", "amount": 15000},
    {"order_id": "ORD_LDN_001_5004", "store_id": "LDN_001_Camden", "location": MY_STORES["LDN_001_Camden"], "order_date": "2024-02-10", "ship_date": "2024-02-12", "amount": 200.00},
]

print("\nMy Lagos/London stores analysis:")
for sale in my_sales:
    od = parse_date(sale["order_date"])
    sd = parse_date(sale["ship_date"])
    days = days_between(od, sd)
    print(f"  {sale['order_id']} {sale['store_id']} {sale['location']} - {days} days shipping - ${sale['amount']}")
```

**Deliverable:** Upload `sales_date_analysis_L14.py` and screenshot of monthly sales output from Kaggle dataset plus your Lagos stores analysis.

**Bonus:** Calculate customer age if dataset has birth date, or add SLA check per location (Lagos SLA 3 days, London SLA 2 days).

## 6. Checklist

- Can you parse 5+ date formats with strptime and handle N/A, None, 0000-00-00?
- Can you format dates with strftime for YYYY-MM and display per location?
- Can you calculate days_between, age with birthday adjustment, and due dates with timedelta/relativedelta?
- Can you group sales by month YYYY-MM and by store_id and location using defaultdict?
- Can you check SLA per location (LAG_001_Ikeja 3 days vs LDN_001_Camden 2 days) and flag late?
- Can you load Kaggle Superstore dataset and produce monthly revenue and average shipping days?

If yes, you can handle real date reporting across multiple stores and locations.

Next: Regular Expressions for Data Cleaning.

**Key Takeaway:** Real dates come in 8 formats plus blanks. Build parse_date that tries many formats and returns None for bad. Use date math for SLA per store_id and location, age, due dates. Always store as date object, format only for display. Group by YYYY-MM for monthly reports per store.
