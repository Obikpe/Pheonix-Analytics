# Lesson 15 - Regular Expressions for Data Cleaning

**Duration:** 75 min | **Level:** Intermediate | **Goal:** Use regex to validate and extract messy text that string methods cannot handle

## Learning Objectives
- Write regex patterns for email, phone, product codes, and IDs.
- Extract parts from text using groups: area codes, domains, order numbers.
- Replace and clean text with re.sub for real customer data across locations.

---

## 1. Why Regex When String Methods Fail

<svg width="100%" height="190" viewBox="0 0 700 190" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="190" rx="16" fill="#FFFFFF"/>
  <text x="350" y="28" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">STRING METHODS vs REGEX</text>
  <rect x="20" y="50" width="300" height="120" rx="12" fill="#FEE2E2" stroke="#991B1B" stroke-width="1.5"/>
  <text x="170" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#7F1D1D">STRING METHODS - Limited</text>
  <text x="35" y="90" font-family="Arial" font-size="9" fill="#7F1D1D">email.contains("@") -> many false</text>
  <text x="35" y="105" font-family="Arial" font-size="9" fill="#7F1D1D">Cannot extract Order ID pattern</text>
  <text x="35" y="120" font-family="Arial" font-size="9" fill="#7F1D1D">ORD_LAG_001_1234 pattern fails</text>
  <text x="35" y="135" font-family="Arial" font-size="9" fill="#7F1D1D">Phone (555) vs 555- vs +234</text>
  <text x="35" y="150" font-family="Arial" font-size="9" fill="#7F1D1D">Need many ifs</text>
  <rect x="380" y="50" width="300" height="120" rx="12" fill="#D1FAE5" stroke="#065F46" stroke-width="1.5"/>
  <text x="530" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#064E3B">REGEX - Pattern matching</text>
  <text x="395" y="90" font-family="Arial" font-size="9" fill="#064E3B">Pattern for email, phone, ID</text>
  <text x="395" y="105" font-family="Arial" font-size="9" fill="#064E3B">Extract ORD_(.*)_(.*)</text>
  <text x="395" y="120" font-family="Arial" font-size="9" fill="#064E3B">Validate LAG_001_Ikeja format</text>
  <text x="395" y="135" font-family="Arial" font-size="9" fill="#064E3B">One pattern handles 10 variants</text>
  <text x="395" y="150" font-family="Arial" font-size="9" fill="#064E3B">Professional cleaning</text>
</svg>

String methods can check if "@" in email. But they cannot tell if email is valid pattern like `alex@test.com` vs `alex@@test`. They cannot extract Order ID `ORD_LAG_001_5001` into parts: location LAG, store 001, number 5001. Regex can.

## 2. Regex Basics with Real IDs

Python `re` module. Pattern is like search template.

**Real World Example 1 - Validate store and order IDs:**

Your company uses IDs like:
- Store IDs: LAG_001_Ikeja, LAG_002_Lekki, LDN_001_Camden, ABJ_001_Garki
- Order IDs: ORD_LAG_001_5001, ORD_LDN_001_2001, INV_LAG_002_1001
- Customer IDs: CUST_101_LAG, CUST_102_LDN

```
import re

# Store ID pattern: 3 letters underscore 3 digits underscore name
# LAG_001_Ikeja
store_pattern = r"^[A-Z]{3}_\d{3}_[A-Za-z]+$"

tests = ["LAG_001_Ikeja", "LAG_002_Lekki", "LDN_001_Camden", "lag_001_ikeja", "LAG_1_Ikeja", "LAG_001"]

for s in tests:
    match = re.match(store_pattern, s)
    print(f"{s}: {'VALID' if match else 'INVALID'}")

# Order ID pattern: ORD or INV underscore store code underscore 4 digits
# ORD_LAG_001_5001
order_pattern = r"^(ORD|INV)_[A-Z]{3}_\d{3}_\d{4}$"

orders = ["ORD_LAG_001_5001", "INV_LAG_002_1001", "ORD_LDN_001_2001", "ORD_LAG_001_501", "ORDER_LAG_001_5001"]

for o in orders:
    print(f"{o}: {'VALID' if re.match(order_pattern, o) else 'INVALID'}")

# Customer ID: CUST underscore 3 digits underscore 3 letters location
cust_pattern = r"^CUST_\d{3}_[A-Z]{3}$"
print(re.match(cust_pattern, "CUST_101_LAG"))  # VALID
print(re.match(cust_pattern, "CUST_101_LAGOS"))  # INVALID - too long
```

`^` start, `$` end, `[A-Z]` uppercase letter, `{3}` exactly 3 times, `\d` digit, `+` one or more.

**Real World Example 2 - Extract parts with groups:**

```
import re

order_id = "ORD_LAG_001_5001"
pattern = r"^(ORD|INV)_([A-Z]{3})_(\d{3})_(\d{4})$"
# Group1: ORD/INV, Group2: location code, Group3: store number, Group4: order number

match = re.match(pattern, order_id)
if match:
    print(f"Type: {match.group(1)}")  # ORD
    print(f"Location code: {match.group(2)}")  # LAG
    print(f"Store number: {match.group(3)}")  # 001
    print(f"Order number: {match.group(4)}")  # 5001
    print(f"All groups: {match.groups()}")

# Extract location from store ID
store_id = "LAG_001_Ikeja"
# Pattern with named groups
store_pat = r"^(?P<code>[A-Z]{3})_(?P<number>\d{3})_(?P<name>[A-Za-z]+)$"
m = re.match(store_pat, store_id)
if m:
    print(m.groupdict())  # {'code': 'LAG', 'number': '001', 'name': 'Ikeja'}
    print(f"Store {m.group('name')} in {m.group('code')} region")
```

Groups let you split ID into useful parts for reporting.

## 3. Email, Phone, Price Validation with Regex

**Real World Example 3 - Email validation better than "@" check:**

```
import re

# Simple but much better than "@" in
email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"

emails = [
    "alex@ikeja.lagos.ng",  # VALID - Lagos customer
    "sam.lee@camden.london.uk",  # VALID - London
    "invalid@",
    "alex@@test.com",
    "alex@test",
    "alex @ test.com",
    "CUST_101_LAG@shop.com"  # VALID
]

for email in emails:
    is_valid = re.match(email_pattern, email) is not None
    print(f"{email}: {'VALID' if is_valid else 'INVALID'}")

# Extract domain
email = "alex@lekki.lagos.ng"
domain_pattern = r"@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$"
m = re.search(domain_pattern, email)
if m:
    print(f"Domain: {m.group(1)}")  # lekki.lagos.ng
```

**Real World Example 4 - Phone numbers Nigeria and UK:**

Nigeria: +234 801 234 5678, 0801 234 5678, 8012345678
UK: +44 20 1234 5678, 020 1234 5678

```
import re

def clean_and_validate_phone(phone, country="NG"):
    if not phone:
        return None, False
    
    # Remove spaces, dashes, brackets for checking
    digits = re.sub(r"[^\d+]", "", str(phone))
    
    # Nigeria patterns
    ng_pattern = r"^(\+234|0)?[789]\d{9}$"  # Starts with 7,8,9 and 10 digits after 0 or +234
    
    # UK patterns
    uk_pattern = r"^(\+44|0)?\d{10}$"
    
    # US pattern
    us_pattern = r"^(\+1)?\d{10}$"
    
    if country == "NG":
        # Extract last 10 digits
        match = re.search(r"([789]\d{9})$", digits)
        if match:
            ten_digits = match.group(1)
            # Validate
            if re.match(ng_pattern, digits):
                return f"0{ten_digits}" if not digits.startswith("0") else digits[-11:] if digits.startswith("234") else digits, True
            return ten_digits, False
    
    # Simple extraction for demo - get 10 digits
    ten = re.sub(r"\D", "", phone)[-10:]
    if len(ten) == 10:
        return ten, True
    
    return None, False

tests = [
    ("+234 801 234 5678", "NG"),
    ("0801 234 5678", "NG"),
    ("07012345678", "NG"),
    ("+44 20 1234 5678", "UK"),
    ("02012345678", "UK"),
    ("(555) 123-4567", "US"),
]

for phone, country in tests:
    cleaned, valid = clean_and_validate_phone(phone, country)
    print(f"{phone} ({country}) -> {cleaned} Valid: {valid}")

# More precise - extract with re
phone_text = "Contact: Alex Johnson, Phone: +234 801 234 5678, Alt: 0701-234-5678, Lagos store LAG_001_Ikeja"
# Find all phone-like patterns
found = re.findall(r"\+?\d[\d\s-]{8,}\d", phone_text)
print(f"Found phones: {found}")
```

**Real World Example 5 - Price extraction:**

```
import re

def extract_price(text):
    if not text:
        return None
    
    # Pattern: optional $, optional spaces, digits, optional comma, digits, optional . and decimals, optional USD/NGN/GBP
    pattern = r"\$?\s*([\d,]+\.?\d*)\s*(USD|NGN|GBP)?"
    
    match = re.search(pattern, str(text))
    if match:
        number_str = match.group(1).replace(",", "")
        try:
            return float(number_str)
        except:
            return None
    return None

prices = [
    "$25.99",
    "25000 NGN",
    "£45.00",
    "1,299.99 USD",
    "Price: 32000",
    "N/A"
]

for p in prices:
    print(f"{p} -> {extract_price(p)}")
```

## 4. Search, Findall, Sub - Real Cleaning

**Real World Example 6 - Clean product names with codes:**

Product names like "Mouse - SKU: MSE-BLK-001 (Ikeja LAG_001)" - need to extract SKU and location.

```
import re

products = [
    "Wireless Mouse - SKU: MSE-BLK-001 (Store: LAG_001_Ikeja, Lagos, NG)",
    "Keyboard - SKU: KBD-WHT-002 (Store: LDN_001_Camden, London, UK)",
    "Monitor 24inch - SKU: MON-24-003 - Location: LAG_002_Lekki",
    "Cable USB - SKU: CAB-USB-004"
]

sku_pattern = r"SKU:\s*([A-Z]+-[A-Z]+-\d+)"
store_pattern = r"(?:Store:|Location:)\s*([A-Z]{3}_\d{3}_[A-Za-z]+)"

for prod in products:
    sku_match = re.search(sku_pattern, prod)
    store_match = re.search(store_pattern, prod)
    
    sku = sku_match.group(1) if sku_match else "No SKU"
    store = store_match.group(1) if store_match else "No Store"
    
    # Clean product name - remove SKU and store part
    clean_name = re.sub(r"\s*-\s*SKU:.*$", "", prod)  # Remove from - SKU to end
    clean_name = re.sub(r"\s*\(Store:.*\)$", "", clean_name)
    clean_name = re.sub(r"\s*-\s*Location:.*$", "", clean_name)
    
    print(f"Original: {prod}")
    print(f"  Clean: {clean_name} | SKU: {sku} | Store: {store}")

# Replace multiple spaces with single
messy = "Wireless   Mouse   Black   "
cleaned = re.sub(r"\s+", " ", messy).strip()
print(f"'{messy}' -> '{cleaned}'")

# Remove special chars except letters, numbers, space, hyphen
messy2 = "Mouse@#$%Black!!!"
cleaned2 = re.sub(r"[^A-Za-z0-9 -]", "", messy2)
print(f"'{messy2}' -> '{cleaned2}'")
```

**Real World Example 7 - Validate and extract from address:**

```
import re

addresses = [
    "12 Allen Avenue, Ikeja, Lagos, NG 101233, Customer: CUST_101_LAG",
    "45 Camden High Street, Camden, London, UK NW1 0JH, Customer: CUST_102_LDN",
    "Plot 5, Admiralty Way, Lekki, Lagos, NG 105102"
]

# Extract postal code Nigeria 6 digits, UK alphanumeric
ng_postal = r"\b\d{6}\b"
uk_postal = r"\b[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}\b"

# Extract customer ID
cust_pattern = r"CUST_\d{3}_[A-Z]{3}"

for addr in addresses:
    ng = re.findall(ng_postal, addr)
    uk = re.findall(uk_postal, addr)
    cust = re.findall(cust_pattern, addr)
    
    # Extract city - word before Lagos or London
    city_match = re.search(r"([A-Za-z]+),\s*(Lagos|London)", addr)
    city = city_match.group(1) if city_match else "Unknown"
    
    print(f"Address: {addr[:50]}...")
    print(f"  City: {city}, NG Postal: {ng}, UK Postal: {uk}, Customer: {cust}")
```

## 5. Hands-On Assignment with Kaggle Dataset

**Assignment 15: Regex Cleaning for Customer Data**

**Dataset to download:**
Kaggle: Customer Personality Analysis + Messy Data
Links:
- https://www.kaggle.com/datasets/imakash3011/customer-personality-analysis (has IDs, messy text)
- https://www.kaggle.com/datasets/mukulkirti/laptops-with-nice-specs-real-dataset (has product codes, prices)
- https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce (has Order IDs, Customer IDs, zip codes, locations)

Choose one, we will use Olist Brazilian Ecommerce for IDs and locations: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce
Download `olist_customers_dataset.csv`, `olist_orders_dataset.csv`

**Task - Create file `regex_cleaner_L15.py`:**

```
import re
import csv
import os
from collections import defaultdict

# Your store IDs
STORE_IDS = ["LAG_001_Ikeja", "LAG_002_Lekki", "LAG_003_VI", "LDN_001_Camden", "LDN_002_Stratford", "ABJ_001_Garki"]

# Regex patterns
PATTERNS = {
    "store_id": r"^[A-Z]{3}_\d{3}_[A-Za-z]+$",
    "order_id": r"^(ORD|INV)_[A-Z]{3}_\d{3}_\d{4}$",
    "customer_id": r"^CUST_\d{3}_[A-Z]{3}$",
    "email": r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
    "ng_phone": r"^(\+234|0)?[789]\d{9}$",
    "sku": r"[A-Z]{3}-[A-Z]+-\d{3}",
    "price": r"\$?\s*([\d,]+\.?\d*)\s*(USD|NGN|GBP|BRL)?"
}

def validate(pattern_name, text):
    pat = PATTERNS.get(pattern_name)
    if not pat:
        return False
    return re.match(pat, str(text)) is not None

def extract_sku(text):
    m = re.search(PATTERNS["sku"], str(text))
    return m.group(0) if m else None

def extract_price(text):
    m = re.search(PATTERNS["price"], str(text))
    if m:
        try:
            return float(m.group(1).replace(",",""))
        except:
            return None
    return None

def clean_text(text):
    # Remove extra spaces, special chars
    text = re.sub(r"\s+", " ", str(text)).strip()
    text = re.sub(r"[^A-Za-z0-9 .,@_-]", "", text)
    return text

# Test your store IDs
print("Validating Store IDs:")
for sid in STORE_IDS:
    print(f"  {sid}: {validate('store_id', sid)} - Location code: {re.match(r'^([A-Z]{3})_', sid).group(1) if re.match(r'^([A-Z]{3})_', sid) else 'N/A'}")

# Generate sample Lagos orders to test
sample_orders = [
    "ORD_LAG_001_5001 Customer CUST_101_LAG Email alex@ikeja.lagos.ng Phone +234 801 234 5678 Price $25.99 SKU: MSE-BLK-001 Store LAG_001_Ikeja",
    "INV_LAG_002_1001 Customer CUST_102_LAG Email sam.lee@lekki.lagos.ng Phone 0802 345 6789 Price 32000 NGN SKU: KBD-WHT-002 Store LAG_002_Lekki",
    "ORD_LDN_001_2001 Customer CUST_103_LDN Email maria@camden.london.uk Phone +44 20 1234 5678 Price £199.99 SKU: MON-24-003 Store LDN_001_Camden",
]

print("\nParsing sample orders:")
for order_text in sample_orders:
    order_id = re.search(r"(ORD|INV)_[A-Z]{3}_\d{3}_\d{4}", order_text)
    cust_id = re.search(r"CUST_\d{3}_[A-Z]{3}", order_text)
    email = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", order_text)
    sku = extract_sku(order_text)
    price = extract_price(order_text)
    
    print(f"  Order: {order_id.group(0) if order_id else 'N/A'} | Cust: {cust_id.group(0) if cust_id else 'N/A'} | Email: {email.group(0) if email else 'N/A'} | SKU: {sku} | Price: {price}")

# Kaggle dataset processing
filepath = "olist_orders_dataset.csv"
if os.path.exists(filepath):
    print(f"\nProcessing Kaggle file {filepath}:")
    valid_order_ids = 0
    invalid = 0
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            order_id_raw = row.get("order_id", "")
            # Check if order_id matches UUID pattern - common in Olist
            uuid_pat = r"^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$"
            if re.match(uuid_pat, order_id_raw):
                valid_order_ids += 1
            else:
                invalid += 1
            if valid_order_ids + invalid > 1000:
                break
    print(f"  Valid UUID order IDs (first 1000 rows): {valid_order_ids}, Invalid: {invalid}")
    print(f"  This shows how regex validates real IDs")
else:
    print(f"\nDownload Kaggle dataset from https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce")
    print(f"Place olist_orders_dataset.csv here to test ID validation")
    print(f"Also try: https://www.kaggle.com/datasets/imakash3011/customer-personality-analysis for customer IDs")

# Bonus: Clean messy product names
messy_names = [
    "  Wireless Mouse   Black   SKU: MSE-BLK-001  ",
    "Keyboard@#$$%  White  (Store LAG_001_Ikeja)",
    "Monitor   24inch!!!   Price $199.99"
]

print("\nCleaning messy product names:")
for name in messy_names:
    cleaned = clean_text(name)
    cleaned = re.sub(r"\s+", " ", cleaned).strip().title()
    sku = extract_sku(name)
    print(f"  '{name}' -> '{cleaned}' SKU: {sku}")
```

**Deliverable:** Upload `regex_cleaner_L15.py` and output showing:
- Validation of your 6 store IDs LAG_001_Ikeja etc
- Parsing of 3 sample Lagos/London orders extracting order ID, customer ID, email, SKU, price
- If downloaded Kaggle Olist dataset, show count of valid UUID order IDs in first 1000 rows
- Cleaned messy product names

**Kaggle Links for Assignment:**
1. Primary: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce (order_id, customer_id, zip codes, locations)
2. Secondary: https://www.kaggle.com/datasets/imakash3011/customer-personality-analysis (customer IDs, messy text)
3. Optional: https://www.kaggle.com/datasets/mukulkirti/laptops-with-nice-specs-real-dataset (product codes, prices with symbols)

## 6. Checklist

- Can you write regex for store ID LAG_001_Ikeja `^[A-Z]{3}_\d{3}_[A-Za-z]+$` and order ID ORD_LAG_001_5001?
- Can you use groups to extract location code LAG, store number 001 from ID?
- Can you validate email with regex better than "@" in check and extract domain?
- Can you handle Nigeria +234 and UK +44 phone patterns with re.sub and findall?
- Can you extract price with $ and comma and SKU pattern with re.search?
- Can you clean messy product names with re.sub for multiple spaces and special chars?
- Can you load Kaggle Olist dataset and validate order_id UUID pattern with regex?

If yes, you can handle complex text validation that string methods cannot.

Next: Object-Oriented Basics for Data Models.

**Key Takeaway:** String methods check simple things. Regex handles patterns: IDs like ORD_LAG_001_5001, emails, phones +234 801, SKUs MSE-BLK-001, prices with symbols. Use ^ $ for exact match, groups () to extract parts, re.search for find, re.sub for clean, re.findall for all matches. Build pattern library for store IDs, customer IDs, product codes per location.
