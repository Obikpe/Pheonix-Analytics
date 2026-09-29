# Lesson 09 - Files - Reading CSV and Excel Without Breaking

**Duration:** 60 min | **Level:** Beginner | **Goal:** Read real CSV files safely even when they are messy

## Learning Objectives
- Read and write CSV, TXT, and JSON files with Python built-in tools.
- Handle real world file problems: missing files, wrong encoding, blank rows.
- Build safe file reader that collects errors instead of crashing.

---

## 1. Why File Handling Breaks

<svg width="100%" height="190" viewBox="0 0 700 190" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="190" rx="16" fill="#FFFFFF"/>
  <text x="350" y="28" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">REAL FILE PROBLEMS</text>
  <rect x="20" y="50" width="200" height="120" rx="12" fill="#FEE2E2" stroke="#991B1B" stroke-width="1.5"/>
  <text x="120" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#7F1D1D">WHAT HAPPENS</text>
  <text x="35" y="90" font-family="Arial" font-size="9" fill="#7F1D1D">File not found</text>
  <text x="35" y="105" font-family="Arial" font-size="9" fill="#7F1D1D">Blank lines</text>
  <text x="35" y="120" font-family="Arial" font-size="9" fill="#7F1D1D">Wrong encoding â‚¬</text>
  <text x="35" y="135" font-family="Arial" font-size="9" fill="#7F1D1D">$25.99 not 25.99</text>
  <text x="35" y="150" font-family="Arial" font-size="9" fill="#7F1D1D">Comma inside "Mouse, Black"</text>
  <rect x="250" y="50" width="200" height="120" rx="12" fill="#DBEAFE" stroke="#1E40AF" stroke-width="1.5"/>
  <text x="350" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#1E3A8A">BEGINNER CODE</text>
  <text x="265" y="90" font-family="Arial" font-size="9" fill="#1E3A8A">open() and crash</text>
  <text x="265" y="105" font-family="Arial" font-size="9" fill="#1E3A8A">Stops on row 3</text>
  <text x="265" y="120" font-family="Arial" font-size="9" fill="#1E3A8A">Loses 997 rows</text>
  <text x="265" y="135" font-family="Arial" font-size="9" fill="#1E3A8A">No error report</text>
  <text x="265" y="150" font-family="Arial" font-size="9" fill="#1E3A8A">Manual fix needed</text>
  <rect x="480" y="50" width="200" height="120" rx="12" fill="#D1FAE5" stroke="#065F46" stroke-width="1.5"/>
  <text x="580" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#064E3B">PRO CODE</text>
  <text x="495" y="90" font-family="Arial" font-size="9" fill="#064E3B">Check file exists</text>
  <text x="495" y="105" font-family="Arial" font-size="9" fill="#064E3B">Skip blank, collect errors</text>
  <text x="495" y="120" font-family="Arial" font-size="9" fill="#064E3B">Clean $ and symbols</text>
  <text x="495" y="135" font-family="Arial" font-size="9" fill="#064E3B">Process 1000, report 20 bad</text>
  <text x="495" y="150" font-family="Arial" font-size="9" fill="#064E3B">Never crash</text>
</svg>

Real files are messy. Export from point of sale system has blank lines, headers in middle, price as $25.99, product name "Mouse, Black" with comma inside quotes that breaks simple split. Professional code anticipates this.

## 2. Reading TXT and CSV - Basics

**Real World Example 1 - Read simple TXT:**

File `notes.txt`:
```
Mouse sold 2
Keyboard sold 1
```

```
# Basic open - always use with to auto close file
with open("notes.txt", "r") as f:
    content = f.read()
    print(content)

# Read line by line - better for big files
with open("notes.txt", "r") as f:
    for line in f:
        print(line.strip())  # strip removes \n newline
```

`with open` ensures file closes even if error happens. Never use `f = open()` without close.

**Real World Example 2 - Write TXT report:**

```
sales = [120.50, 89.99, 210.00]
with open("report.txt", "w") as f:
    f.write("Daily Sales Report\n")
    f.write("==================\n")
    for amount in sales:
        f.write(f"${amount:.2f}\n")
    f.write(f"\nTotal: ${sum(sales):.2f}\n")

print("Report written")
```

"w" overwrites, "a" appends. Use "w" for new report.

**Real World Example 3 - Read CSV with csv module - Safe way:**

File `sales.csv`:
```
product,price,quantity
Mouse,25.99,2
Keyboard,45.00,1
"Mouse, Black",30.99,1
```

Note row 3 has comma inside product name but inside quotes. If you do `line.split(",")` you get 4 parts and break. csv module handles quotes correctly.

```
import csv

with open("sales.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)  # Reads header as keys
    for row in reader:
        print(row)
        # {'product': 'Mouse', 'price': '25.99', 'quantity': '2'}
        # {'product': 'Mouse, Black', 'price': '30.99', 'quantity': '1'} - correctly kept together

# Calculate total safely
total_revenue = 0
with open("sales.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        try:
            price = float(row["price"])
            qty = int(row["quantity"])
            total_revenue += price * qty
        except ValueError as e:
            print(f"Skipping bad row {row}: {e}")
            continue

print(f"Total revenue: {total_revenue}")
```

`DictReader` uses first row as header and gives dict per row. Much safer than manual split.

**Real World Example 4 - Write CSV:**

```
import csv

orders = [
    {"product": "Mouse", "price": 25.99, "qty": 2},
    {"product": "Keyboard", "price": 45.00, "qty": 1}
]

with open("output.csv", "w", newline="", encoding="utf-8") as f:
    fieldnames = ["product", "price", "qty"]
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(orders)

print("CSV written")
```

`newline=""` is required on Windows to avoid blank lines.

## 3. Handling Real World File Errors

**Real World Example 5 - File not found:**

```
import os

filepath = "sales_january.csv"

if not os.path.exists(filepath):
    print(f"File {filepath} not found. Check folder.")
    print(f"Current files: {os.listdir('.')}")
else:
    with open(filepath, "r") as f:
        print(f.read())
```

Always check exists before open in production scripts. Saves confusing traceback.

**Real World Example 6 - Encoding errors:**

File exported from old system might have € symbol or different encoding.

```
# Try utf-8 first
try:
    with open("old_sales.csv", "r", encoding="utf-8") as f:
        content = f.read()
except UnicodeDecodeError:
    # Try common alternative encodings
    print("UTF-8 failed, trying latin-1")
    with open("old_sales.csv", "r", encoding="latin-1") as f:
        content = f.read()

print(content[:100])
```

`latin-1` reads anything without crashing, good fallback for unknown exports.

**Real World Example 7 - Blank lines and dirty rows:**

```
import csv

valid_rows = []
errors = []

with open("sales.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for line_num, row in enumerate(reader, start=2):  # start=2 because header is line 1
        # Skip blank product
        if not row.get("product") or row["product"].strip() == "":
            errors.append((line_num, row, "Blank product"))
            continue
        
        # Clean price with $ and comma
        price_str = row["price"].replace("$","").replace(",","").strip()
        qty_str = row["quantity"].strip()
        
        try:
            price = float(price_str)
            qty = int(qty_str)
            if qty < 0:
                errors.append((line_num, row, "Negative qty"))
                continue
            
            valid_rows.append({
                "product": row["product"].strip().title(),
                "price": price,
                "qty": qty,
                "total": price * qty
            })
        except ValueError as e:
            errors.append((line_num, row, str(e)))
            continue

print(f"Valid: {len(valid_rows)}, Errors: {len(errors)}")
for line_num, row, err in errors:
    print(f"Line {line_num}: {err} - {row}")
```

This processes entire file, collects good rows, reports bad rows with line numbers. Never crashes on row 10 and loses 990 rows.

## 4. JSON - For API and Config

**Real World Example 8 - Read JSON:**

File `customers.json`:
```json
[
  {"id": 1, "name": "Alex", "email": "alex@test.com"},
  {"id": 2, "name": "Sam", "email": "sam@test.com"}
]
```

```
import json

with open("customers.json", "r", encoding="utf-8") as f:
    customers = json.load(f)

print(f"Loaded {len(customers)} customers")
for cust in customers:
    print(cust["name"], cust["email"])

# Write JSON
new_customer = {"id": 3, "name": "Lee", "email": "lee@test.com"}
customers.append(new_customer)

with open("customers.json", "w", encoding="utf-8") as f:
    json.dump(customers, f, indent=2)

print("Updated JSON")
```

JSON is common for API data and config files.

## 5. Hands-On Task - Safe Sales Reader

Create files first:

Create `sample_sales.csv`:
```
product,price,quantity,customer
Mouse,$25.99,2,Alex Johnson
Keyboard,$45.00,1, Sam Lee
"Mouse, Black",$30.99,1, Maria Garcia
Monitor,"$199.99",1,Alex Johnson
Cable,$5.99,,Lee
, $10.00,2,Invalid Product
Keyboard,invalid,1,Test
```

Create file `safe_reader.py`:

```
import csv
import os
import json

def clean_price(price_str):
    if not price_str:
        return None
    cleaned = price_str.replace("$","").replace(",","").replace("USD","").strip()
    try:
        return float(cleaned)
    except:
        return None

def clean_name(name):
    if not name or name.strip() == "":
        return None
    return name.strip().title()

def read_sales_csv(filepath):
    if not os.path.exists(filepath):
        print(f"ERROR: File {filepath} not found")
        print(f"Available files: {os.listdir('.')}")
        return [], []
    
    valid_orders = []
    errors = []
    
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            
            # Check required columns
            required = ["product", "price", "quantity"]
            if not all(col in reader.fieldnames for col in required):
                print(f"ERROR: Missing columns. Found {reader.fieldnames}, need {required}")
                return [], []
            
            for line_num, row in enumerate(reader, start=2):
                product_raw = row.get("product", "")
                price_raw = row.get("price", "")
                qty_raw = row.get("quantity", "")
                customer_raw = row.get("customer", "")
                
                product = clean_name(product_raw)
                price = clean_price(price_raw)
                
                # Quantity clean
                try:
                    qty = int(qty_raw.strip()) if qty_raw and qty_raw.strip() != "" else 0
                except:
                    errors.append((line_num, row, f"Invalid qty '{qty_raw}'"))
                    continue
                
                # Validate
                if product is None:
                    errors.append((line_num, row, "Blank product name"))
                    continue
                
                if price is None:
                    errors.append((line_num, row, f"Invalid price '{price_raw}'"))
                    continue
                
                if qty <= 0:
                    errors.append((line_num, row, f"Qty must be >0 got {qty}"))
                    continue
                
                valid_orders.append({
                    "product": product,
                    "price": price,
                    "quantity": qty,
                    "customer": clean_name(customer_raw) or "Unknown",
                    "total": round(price * qty, 2),
                    "line_num": line_num
                })
    
    except UnicodeDecodeError:
        print("UTF-8 failed, retrying with latin-1")
        with open(filepath, "r", encoding="latin-1") as f:
            reader = csv.DictReader(f)
            # Same logic would go here - simplified for example
            pass
    except Exception as e:
        print(f"Unexpected error reading file: {e}")
        return [], []
    
    return valid_orders, errors

def write_summary(valid, errors, output_path="summary.json"):
    summary = {
        "total_valid": len(valid),
        "total_errors": len(errors),
        "total_revenue": round(sum(o["total"] for o in valid), 2),
        "valid_orders": valid,
        "errors": [{"line": line, "row": row, "error": err} for line, row, err in errors]
    }
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    
    print(f"\nSummary written to {output_path}")
    print(f"Valid: {summary['total_valid']}, Errors: {summary['total_errors']}, Revenue: ${summary['total_revenue']}")

# Run
valid, errors = read_sales_csv("sample_sales.csv")

print("\nValid Orders:")
for o in valid:
    print(f"  Line {o['line_num']}: {o['product']} x{o['quantity']} = ${o['total']} - {o['customer']}")

print("\nErrors:")
for line_num, row, err in errors:
    print(f"  Line {line_num}: {err} | Row: {row}")

write_summary(valid, errors)
```

Run: `python safe_reader.py`

This is production pattern: check file exists, check columns, clean each field, collect valid and errors, never crash, write summary JSON with revenue.

## 6. Checklist

- Can you read TXT with with open and strip newline?
- Can you read CSV with csv.DictReader so comma inside quotes works?
- Can you write CSV with DictWriter and newline=""?
- Can you check os.path.exists before opening and list files if missing?
- Can you handle encoding error with fallback to latin-1?
- Can you skip blank rows, clean $ and commas, and collect errors with line numbers instead of crashing?
- Can you read and write JSON for config and summary?

If yes, you can handle real files from any system without losing data.

Next: Error handling - When data is messy and you need robust scripts.

**Key Takeaway:** Real CSV has blank lines, $ symbols, commas inside quotes, wrong encoding, missing files. Use csv module not split, always with open, check file exists, clean price strings, collect errors with line numbers and continue. Process 1000 rows, report 20 bad, never crash on row 5.
