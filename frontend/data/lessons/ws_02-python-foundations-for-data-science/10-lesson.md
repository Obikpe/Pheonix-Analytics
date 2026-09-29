# Lesson 10 - Error Handling - When Data is Messy

**Duration:** 60 min | **Level:** Beginner | **Goal:** Build scripts that never crash on messy data

## Learning Objectives
- Use try, except, else, finally to handle expected errors gracefully.
- Decide when to skip, fix, or stop on errors in data pipelines.
- Build robust functions that return clean data plus error reports.

---

## 1. Why Error Handling Is Critical for Data

<svg width="100%" height="190" viewBox="0 0 700 190" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="190" rx="16" fill="#FFFFFF"/>
  <text x="350" y="28" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">WITHOUT vs WITH ERROR HANDLING</text>
  <rect x="20" y="50" width="300" height="120" rx="12" fill="#FEE2E2" stroke="#991B1B" stroke-width="1.5"/>
  <text x="170" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#7F1D1D">WITHOUT - Crashes</text>
  <text x="35" y="90" font-family="Arial" font-size="9" fill="#7F1D1D">Row 1 OK, Row 2 OK,</text>
  <text x="35" y="105" font-family="Arial" font-size="9" fill="#7F1D1D">Row 3 price = "N/A" - CRASH</text>
  <text x="35" y="120" font-family="Arial" font-size="9" fill="#7F1D1D">Lost 997 rows</text>
  <text x="35" y="135" font-family="Arial" font-size="9" fill="#7F1D1D">No report what broke</text>
  <text x="35" y="150" font-family="Arial" font-size="9" font-weight="700" fill="#991B1B">User loses trust</text>
  <rect x="380" y="50" width="300" height="120" rx="12" fill="#D1FAE5" stroke="#065F46" stroke-width="1.5"/>
  <text x="530" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#064E3B">WITH - Robust</text>
  <text x="395" y="90" font-family="Arial" font-size="9" fill="#064E3B">Row 1 OK, Row 2 OK,</text>
  <text x="395" y="105" font-family="Arial" font-size="9" fill="#064E3B">Row 3 "N/A" -> skip + log</text>
  <text x="395" y="120" font-family="Arial" font-size="9" fill="#064E3B">Processed 1000 rows</text>
  <text x="395" y="135" font-family="Arial" font-size="9" fill="#064E3B">Report: 980 valid, 20 errors</text>
  <text x="395" y="150" font-family="Arial" font-size="9" font-weight="700" fill="#065F46">User can fix 20 rows</text>
</svg>

In real data, 2 percent to 5 percent rows are bad. If your script crashes on first bad row, you lose all work. Professional data scripts handle bad rows, collect them, and finish processing good rows.

## 2. Try, Except, Else, Finally

**Real World Example 1 - Basic try/except for price conversion:**

```
def convert_price(price_str):
    try:
        cleaned = price_str.replace("$","").strip()
        price = float(cleaned)
        return price
    except ValueError:
        print(f"Invalid price: {price_str}, using 0")
        return 0
    except AttributeError:
        print(f"Price is None or not string: {price_str}, using 0")
        return 0

print(convert_price("$25.99"))  # 25.99
print(convert_price("N/A"))  # Invalid price, using 0 -> 0
print(convert_price(None))  # Price is None -> 0
```

Specific except first, general last. ValueError for bad number, AttributeError for None.replace fails.

**Real World Example 2 - Else and Finally:**

Else runs if no error, finally always runs.

```
def process_order_file(filepath):
    file = None
    try:
        file = open(filepath, "r")
        content = file.read()
    except FileNotFoundError:
        print(f"File {filepath} not found")
        return None
    except Exception as e:
        print(f"Error reading file: {e}")
        return None
    else:
        print(f"Successfully read {len(content)} characters")
        return content
    finally:
        if file:
            file.close()
            print("File closed")
        print("Cleanup done - this always runs")
```

Else is useful to separate success logic from try block. Finally ensures cleanup like closing files or database connections.

**Real World Example 3 - Handling multiple error types for quantity:**

```
def parse_quantity(qty_input):
    try:
        if isinstance(qty_input, int):
            qty = qty_input
        elif isinstance(qty_input, str):
            qty_str = qty_input.strip()
            if qty_str == "":
                raise ValueError("Empty quantity")
            qty = int(qty_str)
        else:
            raise TypeError(f"Unsupported type {type(qty_input)}")
        
        if qty < 0:
            raise ValueError(f"Quantity cannot be negative: {qty}")
        
        if qty > 1000:
            raise ValueError(f"Quantity too large, max 1000: {qty}")
        
        return qty
    
    except ValueError as e:
        print(f"Value error: {e}")
        return None
    except TypeError as e:
        print(f"Type error: {e}")
        return None

print(parse_quantity("5"))  # 5
print(parse_quantity(""))  # Value error: Empty quantity -> None
print(parse_quantity("-2"))  # Value error: negative -> None
print(parse_quantity("1500"))  # Value error: too large -> None
print(parse_quantity(None))  # Type error -> None
```

Raise your own errors when data violates business rules.

## 3. Building Robust Data Pipeline

**Real World Example 4 - Process 1000 orders, collect errors:**

```
orders = [
    {"product": "Mouse", "price": "25.99", "qty": "2"},
    {"product": "Keyboard", "price": "N/A", "qty": "1"},
    {"product": "", "price": "45.00", "qty": "1"},
    {"product": "Monitor", "price": "199.99", "qty": "-1"},
    {"product": "Cable", "price": "5.99", "qty": "10"},
]

valid_orders = []
error_log = []

for i, order in enumerate(orders, start=1):
    try:
        product = order.get("product", "").strip()
        if not product:
            raise ValueError("Product name blank")
        
        price_str = order.get("price", "")
        try:
            price = float(str(price_str).replace("$","").strip())
        except ValueError:
            raise ValueError(f"Invalid price '{price_str}'")
        
        qty_str = order.get("qty", "")
        try:
            qty = int(str(qty_str).strip())
        except ValueError:
            raise ValueError(f"Invalid qty '{qty_str}'")
        
        if qty <= 0:
            raise ValueError(f"Qty must be >0, got {qty}")
        
        if price <= 0:
            raise ValueError(f"Price must be >0, got {price}")
        
        total = price * qty
        valid_orders.append({
            "product": product,
            "price": price,
            "qty": qty,
            "total": total
        })
    
    except ValueError as e:
        error_log.append({
            "row": i,
            "order": order,
            "error": str(e)
        })
        continue

print(f"Valid: {len(valid_orders)}, Errors: {len(error_log)}")
print("\nValid orders:")
for o in valid_orders:
    print(f"  {o['product']} x{o['qty']} = ${o['total']}")

print("\nError log:")
for err in error_log:
    print(f"  Row {err['row']}: {err['error']} - {err['order']}")
```

Result: 2 valid, 3 errors reported with row numbers and reasons. Script never crashes.

**Real World Example 5 - Safe division and percentage:**

Division by zero crashes reports.

```
def calculate_margin(sales, cost):
    try:
        profit = sales - cost
        margin = (profit / sales) * 100
        return round(margin, 2)
    except ZeroDivisionError:
        print(f"Sales is 0, cannot calculate margin for sales={sales}, cost={cost}")
        return 0
    except TypeError as e:
        print(f"Invalid types sales={sales} cost={cost}: {e}")
        return None

print(calculate_margin(1000, 700))  # 30.0
print(calculate_margin(0, 700))  # Sales is 0 -> 0
```

**Real World Example 6 - File processing with nested try:**

```
import csv
import os

def safe_read_csv(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return [], [{"error": f"File not found: {filepath}"}]
    
    valid = []
    errors = []
    
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            try:
                reader = csv.DictReader(f)
                if reader.fieldnames is None:
                    raise ValueError("CSV has no header")
                
                required = ["product", "price", "qty"]
                missing = [col for col in required if col not in reader.fieldnames]
                if missing:
                    raise ValueError(f"Missing columns {missing}, found {reader.fieldnames}")
                
                for line_num, row in enumerate(reader, start=2):
                    try:
                        product = row.get("product", "").strip()
                        if not product:
                            raise ValueError("Blank product")
                        
                        price_str = row.get("price", "")
                        price = float(str(price_str).replace("$","").replace(",","").strip())
                        
                        qty_str = row.get("qty", "")
                        qty = int(str(qty_str).strip())
                        
                        if qty <= 0:
                            raise ValueError(f"Qty <=0: {qty}")
                        
                        valid.append({
                            "product": product,
                            "price": price,
                            "qty": qty,
                            "total": price * qty,
                            "line": line_num
                        })
                    except Exception as e:
                        errors.append({
                            "line": line_num,
                            "row": row,
                            "error": str(e)
                        })
                        continue
            
            except Exception as e:
                errors.append({"error": f"CSV parsing failed: {e}"})
    
    except UnicodeDecodeError:
        print("Encoding error, try latin-1")
        errors.append({"error": "Encoding error utf-8 failed"})
    except Exception as e:
        print(f"Unexpected error: {e}")
        errors.append({"error": f"Unexpected: {e}"})
    
    return valid, errors
```

Nested try: outer for file open, inner for CSV parse, innermost for each row.

## 4. When to Stop vs Skip

Not all errors should be skipped.

**Skip - Bad row in 1000 rows:**
- Price "N/A", blank product, qty "-1"
- Action: Log error, continue. User can fix 20 rows later.

**Stop - Critical error:**
- File not found, missing required columns, database connection failed
- Action: Stop script, print clear message, do not process half data and give wrong total.

```
import os
def process_file(filepath):
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Critical: File {filepath} not found. Cannot continue.")
```

## 5. Creating Custom Error Messages

Make errors useful for non-technical user.

```
def validate_order(order):
    if not order.get("product"):
        raise ValueError("Product name is required - check column A")
    
    price = order.get("price")
    if price is None:
        raise ValueError(f"Price missing for product {order.get('product')} - check column B")
    
    try:
        price_val = float(str(price).replace("$",""))
    except:
        raise ValueError(f"Price '{price}' is not a number for product {order.get('product')} - should be like 25.99")
    
    return True
```

Good error says what broke, where, and what it should be.

## 6. Hands-On Task - Robust Sales Processor

Create file robust_processor.py:

```
import csv
import json
from collections import defaultdict

def clean_price(price_input):
    try:
        if price_input is None:
            raise ValueError("Price is None")
        
        if isinstance(price_input, (int, float)):
            price = float(price_input)
        else:
            cleaned = str(price_input).replace("$","").replace(",","").replace("USD","").strip()
            if cleaned.lower() in ["", "n/a", "na", "null"]:
                raise ValueError(f"Price is empty or N/A: '{price_input}'")
            price = float(cleaned)
        
        if price <= 0:
            raise ValueError(f"Price must be >0, got {price}")
        
        if price > 10000:
            raise ValueError(f"Price too high, max 10000, got {price}")
        
        return price
    except ValueError as e:
        raise ValueError(f"Invalid price '{price_input}': {e}")

def clean_quantity(qty_input):
    try:
        if isinstance(qty_input, int):
            qty = qty_input
        else:
            qty_str = str(qty_input).strip()
            if qty_str == "":
                raise ValueError("Quantity blank")
            qty = int(qty_str)
        
        if qty <= 0:
            raise ValueError(f"Qty must be >0, got {qty}")
        
        if qty > 1000:
            raise ValueError(f"Qty too large, max 1000, got {qty}")
        
        return qty
    except ValueError as e:
        raise ValueError(f"Invalid quantity '{qty_input}': {e}")

def process_orders(raw_orders):
    valid = []
    errors = []
    
    for idx, raw in enumerate(raw_orders, start=1):
        try:
            product = raw.get("product", "").strip().title()
            if not product or product.lower() in ["n/a", "na"]:
                raise ValueError(f"Blank product name: '{raw.get('product')}'")
            
            price = clean_price(raw.get("price"))
            qty = clean_quantity(raw.get("qty"))
            
            customer = raw.get("customer", "Unknown").strip().title() or "Unknown"
            
            total = round(price * qty, 2)
            
            valid.append({
                "id": idx,
                "product": product,
                "price": price,
                "qty": qty,
                "customer": customer,
                "total": total
            })
        
        except ValueError as e:
            errors.append({
                "row": idx,
                "data": raw,
                "error": str(e)
            })
            continue
        except Exception as e:
            errors.append({
                "row": idx,
                "data": raw,
                "error": f"Unexpected error: {e}"
            })
            continue
    
    return valid, errors

def generate_report(valid, errors):
    print("="*50)
    print(f"Processed {len(valid) + len(errors)} orders")
    print(f"Valid: {len(valid)}")
    print(f"Errors: {len(errors)}")
    print("="*50)
    
    if valid:
        total_revenue = sum(o["total"] for o in valid)
        print(f"\nTotal Revenue: ${total_revenue:.2f}")
        
        customer_rev = defaultdict(float)
        for o in valid:
            customer_rev[o["customer"]] += o["total"]
        
        print("\nRevenue by customer:")
        for cust, rev in customer_rev.items():
            print(f"  {cust:15} : ${rev:.2f}")
    
    if errors:
        print("\nErrors - needs fixing:")
        for err in errors:
            print(f"  Row {err['row']}: {err['error']}")
            print(f"    Data: {err['data']}")

raw_orders = [
    {"product": "Mouse", "price": "$25.99", "qty": "2", "customer": "Alex Johnson"},
    {"product": "Keyboard", "price": "45.00", "qty": "1", "customer": "sam lee"},
    {"product": "Monitor", "price": "N/A", "qty": "1", "customer": "Maria Garcia"},
    {"product": "", "price": "10.00", "qty": "2", "customer": "Test"},
    {"product": "Cable", "price": "$5.99", "qty": "-5", "customer": "Lee"},
    {"product": "Webcam", "price": "$89.99", "qty": "3", "customer": "  alex johnson "},
    {"product": "Desk", "price": "15000", "qty": "1", "customer": "Big Corp"},
    {"product": "Chair", "price": "$49.99", "qty": "abc", "customer": "Sam Lee"},
]

valid, errors = process_orders(raw_orders)
generate_report(valid, errors)

with open("valid_orders.json", "w") as f:
    json.dump(valid, f, indent=2)

print("\nValid orders saved to valid_orders.json")
```

Run: python robust_processor.py

This processes 8 messy orders, produces 3 valid, 5 errors with clear messages, calculates revenue, groups by customer, and saves clean data. Never crashes.

## 7. Checklist

- Can you use try/except to handle price "N/A" and return 0 or None?
- Can you use except ValueError vs except TypeError for specific handling?
- Can you use else for success logic and finally for cleanup?
- Can you raise ValueError with clear message when business rule fails (qty negative)?
- Can you build pipeline that processes 1000 rows, collects valid and errors, and continues?
- Can you decide when to skip bad row vs stop entire script (file not found)?
- Can you create user-friendly error messages that say what broke and what should be?

If yes, you build robust scripts that handle real world mess without losing data or trust.

Next: Modules and Project Structure - Organize code like a professional team.

**Key Takeaway:** Real data has 2-5 percent bad rows. Use try/except per row to skip bad, collect errors with row numbers and reasons, continue processing good rows. Use specific except types, raise clear errors for business rule violations, and decide skip vs stop. Script should finish with report: valid count, error count, revenue, and list of rows to fix - never crash on row 3 and lose 997 rows.
