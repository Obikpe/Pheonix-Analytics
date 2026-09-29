# Lesson 06 - Debugging Like an Analyst

**Duration:** 50 min | **Level:** Beginner | **Goal:** Read errors fast and fix messy data bugs without panic

## Learning Objectives
- Read Python tracebacks and pinpoint exact line and cause.
- Use print debugging and strategic checks to find data bugs.
- Handle real world messy inputs without crashing your script.

---

## 1. Errors Are Normal

<svg width="100%" height="180" viewBox="0 0 700 180" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="180" rx="16" fill="#FFFFFF"/>
  <text x="350" y="28" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">HOW PROS DEBUG - 3 STEPS</text>
  <rect x="20" y="50" width="200" height="110" rx="12" fill="#DBEAFE" stroke="#1E40AF" stroke-width="1.5"/>
  <text x="120" y="72" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#1E3A8A">1. READ</text>
  <text x="35" y="92" font-family="Arial" font-size="9" fill="#1E3A8A">Last line of error</text>
  <text x="35" y="107" font-family="Arial" font-size="9" fill="#1E3A8A">tells type</text>
  <text x="35" y="122" font-family="Arial" font-size="9" fill="#1E3A8A">TypeError, ValueError</text>
  <text x="35" y="137" font-family="Arial" font-size="9" font-weight="700" fill="#1E40AF">What broke?</text>
  <rect x="250" y="50" width="200" height="110" rx="12" fill="#D1FAE5" stroke="#065F46" stroke-width="1.5"/>
  <text x="350" y="72" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#064E3B">2. LOCATE</text>
  <text x="265" y="92" font-family="Arial" font-size="9" fill="#064E3B">Line number</text>
  <text x="265" y="107" font-family="Arial" font-size="9" fill="#064E3B">File -> line 24</text>
  <text x="265" y="122" font-family="Arial" font-size="9" fill="#064E3B">Go there first</text>
  <text x="265" y="137" font-family="Arial" font-size="9" font-weight="700" fill="#065F46">Where broke?</text>
  <rect x="480" y="50" width="200" height="110" rx="12" fill="#FEF3C7" stroke="#92400E" stroke-width="1.5"/>
  <text x="580" y="72" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#78350F">3. PRINT</text>
  <text x="495" y="92" font-family="Arial" font-size="9" fill="#78350F">print(type, value)</text>
  <text x="495" y="107" font-family="Arial" font-size="9" fill="#78350F">before crash line</text>
  <text x="495" y="122" font-family="Arial" font-size="9" fill="#78350F">See what data is</text>
  <text x="495" y="137" font-family="Arial" font-size="9" font-weight="700" fill="#92400E">Why broke?</text>
</svg>

Professional developers get errors every 10 minutes. Beginners panic, pros read. 90% of debugging is reading the last line of the traceback and checking what data you actually have versus what you assumed.

## 2. Reading Tracebacks - Real Examples

**Real World Example 1 - TypeError with price as string:**

Your sales CSV has price as "$25.99" string, you try to multiply.

```
def calculate_total(price, qty):
    return price * qty

# Price came from CSV as string
price = "$25.99"
qty = 2
print(calculate_total(price, qty))
```

Error:
```
TypeError: can't multiply sequence by non-int of type 'str'
```

How to read:
- Last line: TypeError and message. It says you tried to multiply sequence (string) by non-int. Python tried to do "$25.99" * "$25.99" which makes no sense.
- Line above last: Shows File "...", line 5, in calculate_total return price * qty. That is where it broke.
- Fix: Clean price first. Use function from previous lesson.

```
def clean_price(p):
    return float(p.replace("$",""))

price = clean_price("$25.99")
print(calculate_total(price, qty))  # 51.98
```

**Real World Example 2 - ValueError with empty quantity:**

Data entry person left quantity blank.

```
def process_order(qty_str):
    qty = int(qty_str)
    return qty * 25.99

print(process_order(""))  # from blank CSV cell
```

Error:
```
ValueError: invalid literal for int() with base 10: ''
```

Read: ValueError means value is wrong type of content. Trying to convert empty string to int fails. Line number points to int(qty_str).

Fix with check:

```
def process_order(qty_str):
    if qty_str.strip() == "":
        return 0
    try:
        qty = int(qty_str)
        return qty * 25.99
    except ValueError:
        print(f"Invalid quantity: {qty_str}, using 0")
        return 0
```

**Real World Example 3 - IndexError in product list:**

```
products = ["Mouse", "Keyboard"]
print(products[2])  # Only 0 and 1 exist
```

Error:
```
IndexError: list index out of range
```

Means you asked for position 2 but list only has 0,1. Common when looping with manual index. Fix: Check length or use for loop, not manual index.

```
if len(products) > 2:
    print(products[2])
else:
    print("Product 2 does not exist")
```

**Real World Example 4 - KeyError in dictionary:**

```
order = {"product": "Mouse", "qty": 2}
print(order["price"])  # key price not in dict
```

Error:
```
KeyError: 'price'
```

Fix: Use .get() with default, or check if key exists.

```
price = order.get("price", 0)  # returns 0 if missing, no crash
# or
if "price" in order:
    print(order["price"])
else:
    print("Price missing, using default 0")
```

**Real World Example 5 - NameError typo:**

```
total_sales = 1000
print(total_sale)  # typo missing s
```

Error:
```
NameError: name 'total_sale' is not defined
```

You typed variable name wrong. Check spelling. This is why good names and autocomplete in VS Code help.

## 3. Print Debugging - The Analyst Way

When you do not understand what data you have, print type and value before crash.

**Real World Example 6 - Debugging a discount function that fails on some rows:**

```
def apply_discount(price, qty):
    if qty > 10:
        return price * 0.9
    return price

orders = [
    {"price": 100, "qty": 5},
    {"price": "200", "qty": 12},  # price is string from CSV
    {"price": 150, "qty": 15}
]

for order in orders:
    # DEBUG PRINTS
    print(f"DEBUG: Processing {order}, price type={type(order['price'])}, qty type={type(order['qty'])}")
    result = apply_discount(order["price"], order["qty"])
    print(f"Result: {result}")
```

Second order will fail. Debug print shows price type is str, not int. Now you know to clean.

Professional print debugging pattern:

```
print(f"DEBUG: Entering function with price={price}, type={type(price)}, qty={qty}")
```

Add before crash line, run again, see actual values. Remove prints after fixing.

**Real World Example 7 - Debugging with function that handles many cases:**

```
def clean_and_calc(price_str, qty_str):
    print(f"INPUT: price_str='{price_str}' qty_str='{qty_str}'")
    
    if not price_str or price_str.strip() == "":
        print("FAIL: Empty price")
        return None
    
    try:
        price = float(price_str.replace("$","").strip())
        print(f"Cleaned price: {price}")
    except ValueError as e:
        print(f"FAIL: Cannot convert price '{price_str}': {e}")
        return None
    
    try:
        qty = int(qty_str)
        print(f"Cleaned qty: {qty}")
    except ValueError as e:
        print(f"FAIL: Cannot convert qty '{qty_str}': {e}")
        return None
    
    total = price * qty
    print(f"SUCCESS: total={total}")
    return total

# Test with real messy data
print(clean_and_calc("$25.99", "2"))
print(clean_and_calc("", "2"))
print(clean_and_calc("$19.99", "abc"))
```

This prints step by step where it fails. You see exactly which input breaks.

## 4. Using Try Except Properly

Do not wrap everything in try except to hide errors. Use it for expected messy data.

**Real World Example 8 - Processing 1000 CSV rows where some rows are bad:**

```
raw_data = [
    ("Mouse", "25.99", "2"),
    ("Keyboard", "invalid", "5"),  # bad price
    ("Monitor", "199.99", ""),      # missing qty
    ("Cable", "5.99", "10")
]

valid_totals = []
errors = []

for product, price_str, qty_str in raw_data:
    try:
        price = float(price_str)
        qty = int(qty_str) if qty_str.strip() != "" else 0
        total = price * qty
        valid_totals.append((product, total))
    except ValueError as e:
        errors.append((product, f"Bad data price={price_str} qty={qty_str} error={e}"))
        continue  # skip bad row, keep processing

print("Valid:", valid_totals)
print("Errors:")
for err in errors:
    print(f"  {err}")

print(f"Processed {len(valid_totals)} valid, {len(errors)} errors")
```

Output shows 2 valid, 2 errors, but script did not crash. It processed all rows and collected errors for review. This is how analysts handle real data.

## 5. Checklist for Debugging

When error happens:
1. Read last line - what type of error?
2. Read line number - where exactly?
3. Print type and value of variables on that line before crash
4. Ask: What did I assume data is vs what it actually is?
5. Fix data cleaning or add check for edge case (None, empty, string instead of number)
6. Test with good and bad inputs

Common edge cases to always check:
- None
- Empty string ""
- String with spaces "  "
- String with symbols "$25.99"
- Zero
- Negative number
- Very large number

## 6. Hands-On Task

Create file `debug_lab.py` with intentional bugs, fix them:

```
# Buggy code - find and fix 4 bugs using print debugging

def calculate_revenue(orders):
    total = 0
    for order in orders:
        # BUG HINT: order["price"] might be string
        print(f"DEBUG: order={order}")
        price = order["price"]
        qty = order["qty"]
        print(f"DEBUG: price={price} type={type(price)} qty={qty} type={type(qty)}")
        total += price * qty
    return total

def get_customer_discount(customer):
    # BUG HINT: customer might not have is_vip key
    if customer["is_vip"]:
        return 0.15
    return 0

# Test data with real world mess
orders = [
    {"product": "Mouse", "price": 25.99, "qty": 2},
    {"product": "Keyboard", "price": "45.00", "qty": 1},  # price as string
    {"product": "Monitor", "price": 199.99, "qty": 1}
]

customers = [
    {"name": "Alex", "is_vip": True},
    {"name": "Sam"}  # missing is_vip key
]

print("Testing revenue calc:")
try:
    rev = calculate_revenue(orders)
    print(f"Revenue: {rev}")
except Exception as e:
    print(f"ERROR: {e}")

print("\nTesting discount:")
for cust in customers:
    try:
        disc = get_customer_discount(cust)
        print(f"{cust['name']} discount {disc}")
    except Exception as e:
        print(f"ERROR for {cust}: {e}")
```

Task: Fix both functions so they handle messy data without crashing, using cleaning and .get() with defaults. Use print debugging to confirm.

## 7. Checklist

- Can you read last line of traceback to know error type?
- Can you find line number where error happened?
- Can you add print(f"DEBUG: var={var} type={type(var)}") before crash?
- Can you handle None, empty string, string price with try/except and cleaning?
- Can you use .get() for dictionaries to avoid KeyError?
- Can you collect errors and continue processing 1000 rows instead of crashing on row 5?

If yes, you debug like analyst. Errors are clues, not failures.

Next: Lists, Tuples, Dictionaries - storing real data efficiently.

**Key Takeaway:** Read last line of error for type, find line number for location, print type and value to see why. Handle messy data with checks, .get(), and try/except that collects errors and continues. Script should process 1000 rows and report 20 bad ones, not crash on row 3.
