# Lesson 05 - Functions - Stop Copying Code

**Duration:** 60 min | **Level:** Beginner | **Goal:** Build reusable tools that save hours of copy-paste

## Learning Objectives
- Write functions with parameters and return values to avoid repeating code.
- Understand why functions are the core of professional data work.
- Build a small toolbox of real world functions for calculations, cleaning, and reports.

---

## 1. The Copy-Paste Problem

<svg width="100%" height="190" viewBox="0 0 700 190" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="190" rx="16" fill="#FFFFFF"/>
  <rect x="20" y="20" width="300" height="150" rx="12" fill="#FEE2E2" stroke="#991B1B" stroke-width="1.5"/>
  <text x="170" y="45" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#7F1D1D">WITHOUT FUNCTIONS</text>
  <text x="35" y="70" font-family="Arial" font-size="9" fill="#7F1D1D">discount1 = price1 * 0.9 if qty1>10 else price1</text>
  <text x="35" y="85" font-family="Arial" font-size="9" fill="#7F1D1D">discount2 = price2 * 0.9 if qty2>10 else price2</text>
  <text x="35" y="100" font-family="Arial" font-size="9" fill="#7F1D1D">discount3 = price3 * 0.9 if qty3>10 else price3</text>
  <text x="35" y="118" font-family="Arial" font-size="9" fill="#7F1D1D">... 100 times ...</text>
  <text x="35" y="135" font-family="Arial" font-size="9" fill="#7F1D1D">If rule changes to 15%? Edit 100 places.</text>
  <text x="35" y="152" font-family="Arial" font-size="9" font-weight="700" fill="#991B1B">Risk: Miss one, lose money.</text>
  <rect x="380" y="20" width="300" height="150" rx="12" fill="#D1FAE5" stroke="#065F46" stroke-width="1.5"/>
  <text x="530" y="45" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#064E3B">WITH FUNCTIONS</text>
  <text x="395" y="70" font-family="Arial" font-size="9" fill="#064E3B">def calc_discount(price, qty):</text>
  <text x="395" y="85" font-family="Arial" font-size="9" fill="#064E3B">  if qty > 10: return price * 0.9</text>
  <text x="395" y="100" font-family="Arial" font-size="9" fill="#064E3B">  return price</text>
  <text x="395" y="120" font-family="Arial" font-size="9" fill="#064E3B">discount1 = calc_discount(price1, qty1)</text>
  <text x="395" y="135" font-family="Arial" font-size="9" fill="#064E3B">discount2 = calc_discount(price2, qty2)</text>
  <text x="395" y="152" font-family="Arial" font-size="9" font-weight="700" fill="#065F46">Rule changes? Edit 1 place only.</text>
</svg>

If you copy the same calculation 100 times, you will make a mistake on row 73 and not notice until a customer is overcharged. Professional analysts write the rule once as a function and reuse it 1000 times.

Function = named block of code that does one job. You give it inputs (parameters), it returns output.

## 2. First Function - Basic Structure

**Real World Example 1 - Calculate Profit:**

```
def calculate_profit(sales, cost):
    profit = sales - cost
    return profit

# Use it
p1 = calculate_profit(5000, 3200)
print(p1)  # 1800

p2 = calculate_profit(12000, 8500)
print(p2)  # 3500
```

Breakdown:
- `def` starts function definition
- `calculate_profit` is name - verb + noun, clear
- `(sales, cost)` are parameters - inputs
- `return` sends result back
- When you call `calculate_profit(5000, 3200)`, sales=5000, cost=3200 inside function

Without return, function returns None. Always return what you need.

**Real World Example 2 - Calculate Total with Tax:**

```
def total_with_tax(price, quantity, tax_rate=0.08):
    subtotal = price * quantity
    tax = subtotal * tax_rate
    total = subtotal + tax
    return total

# Call with all args
print(total_with_tax(100, 2, 0.1))  # 220

# Call using default tax_rate 0.08
print(total_with_tax(100, 2))  # 216
```

`tax_rate=0.08` is default parameter. If caller does not give tax, use 0.08. Useful for standard rates.

## 3. Functions for Business Rules

**Real World Example 3 - Discount Calculator for E-commerce:**

Store rule: VIP + bulk = 20% off, bulk 20+ = 15% off, bulk 10+ = 10% off, VIP alone = 5% off.

```
def calculate_discount(price, quantity, is_vip=False):
    if is_vip and quantity >= 10:
        discount_rate = 0.20
    elif quantity >= 20:
        discount_rate = 0.15
    elif quantity >= 10:
        discount_rate = 0.10
    elif is_vip:
        discount_rate = 0.05
    else:
        discount_rate = 0
    
    discounted_price = price * (1 - discount_rate)
    return discounted_price, discount_rate

# Test
final_price, rate = calculate_discount(100, 15, is_vip=True)
print(f"Final price: {final_price}, discount: {rate*100}%")
# Final price: 80.0, discount: 20.0%

# Can return two values - price and rate
# Use tuple unpacking
price, discount = calculate_discount(100, 5)
```

Returning tuple is common in data work when you need result plus metadata.

**Real World Example 4 - Inventory Status:**

```
def get_stock_status(product_name, stock_count):
    if stock_count == 0:
        status = "OUT OF STOCK"
        action = "Order immediately"
    elif stock_count < 5:
        status = "LOW STOCK"
        action = "Reorder soon"
    elif stock_count < 20:
        status = "In stock"
        action = "Monitor"
    else:
        status = "Well stocked"
        action = "No action"
    
    return f"{product_name}: {status} - {action}"

print(get_stock_status("Mouse", 0))
# Mouse: OUT OF STOCK - Order immediately

print(get_stock_status("Keyboard", 3))
# Keyboard: LOW STOCK - Reorder soon
```

Now you can use this for 500 products with loop, not 500 if statements.

```
products = [("Mouse", 0), ("Keyboard", 3), ("Monitor", 25)]
for name, stock in products:
    print(get_stock_status(name, stock))
```

## 4. Functions for Data Cleaning

**Real World Example 5 - Clean Email:**

Raw data has spaces, uppercase, missing.

```
def clean_email(email):
    if email is None:
        return None
    
    cleaned = email.strip().lower()
    
    if cleaned == "":
        return None
    
    if "@" not in cleaned:
        return None
    
    return cleaned

# Test
print(clean_email("  Alex@TEST.COM  "))  # alex@test.com
print(clean_email(""))  # None
print(clean_email(None))  # None
print(clean_email("invalid-email"))  # None
```

One function handles all edge cases. Without it, you would write same checks everywhere.

**Real World Example 6 - Clean Price String:**

Prices come as "$199.99", "199.99 USD", " 199.99 "

```
def clean_price(price_str):
    if price_str is None:
        return None
    
    # Remove common symbols and words
    cleaned = price_str.replace("$", "").replace("USD", "").strip()
    
    try:
        value = float(cleaned)
        return value
    except ValueError:
        return None

print(clean_price("$199.99"))  # 199.99
print(clean_price("  89.50 USD "))  # 89.5
print(clean_price("N/A"))  # None
```

Now you can clean entire column with loop or later with pandas.

## 5. Functions That Call Functions

Build big jobs from small functions.

```
def calculate_subtotal(price, qty):
    return price * qty

def calculate_tax(subtotal, rate=0.08):
    return subtotal * rate

def calculate_total(price, qty, tax_rate=0.08):
    subtotal = calculate_subtotal(price, qty)
    tax = calculate_tax(subtotal, tax_rate)
    return subtotal + tax

print(calculate_total(100, 3))  # 324.0
```

Each function does one job. Easy to test, easy to fix.

**Real World Example 7 - Generate Report Line:**

```
def format_sales_line(product, qty, price):
    total = calculate_total(price, qty)
    return f"{product:15} | Qty: {qty:3} | Total: ${total:7.2f}"

print(format_sales_line("Mouse", 2, 25.99))
# Mouse           | Qty:   2 | Total: $  56.14

print(format_sales_line("Keyboard", 15, 45.00))
# Keyboard        | Qty:  15 | Total: $ 729.00
```

`:15` means 15 characters wide, `:7.2f` means float with 2 decimals. Makes report aligned.

## 6. Hands-On Task - Build Your Toolbox

Create file `business_toolbox.py`:

```
def clean_product_name(name):
    if not name:
        return None
    return name.strip().title()  # Title case: wireless mouse -> Wireless Mouse

def calculate_profit_margin(sales, cost):
    if sales == 0:
        return 0
    profit = sales - cost
    margin = (profit / sales) * 100
    return round(margin, 2)

def is_bulk_order(qty, threshold=10):
    return qty >= threshold

def generate_invoice_line(product, qty, unit_price, discount_rate=0):
    cleaned_name = clean_product_name(product)
    subtotal = qty * unit_price
    discount_amount = subtotal * discount_rate
    total = subtotal - discount_amount
    margin = calculate_profit_margin(total, total * 0.7)  # assume cost 70% of price
    
    return {
        "product": cleaned_name,
        "quantity": qty,
        "subtotal": round(subtotal, 2),
        "discount": round(discount_amount, 2),
        "total": round(total, 2),
        "margin_percent": margin,
        "is_bulk": is_bulk_order(qty)
    }

# Test toolbox
invoice = generate_invoice_line("  wireless mouse ", 12, 25.99, 0.10)
print(invoice)

# Use in loop for many products
orders = [
    ("  mouse ", 2, 25.99, 0),
    ("KEYBOARD", 15, 45.00, 0.10),
    ("monitor", 1, 299.99, 0.05)
]

for prod, qty, price, disc in orders:
    line = generate_invoice_line(prod, qty, price, disc)
    print(f"{line['product']} | Total: ${line['total']} | Margin: {line['margin_percent']}% | Bulk: {line['is_bulk']}")
```

Run it: `python business_toolbox.py`

Notice how 4 small functions build a complete invoice system. If discount rule changes, edit one place.

## 7. Rules for Good Functions

1. One function, one job. Calculate discount only, not discount plus email.
2. Name is verb + noun: `calculate_total`, `clean_email`, not `func1`.
3. Keep short: 5-15 lines. If longer, split into two functions.
4. Return value, do not just print. Printing inside makes it hard to reuse.
5. Handle edge cases: None, 0, empty string.

## 8. Checklist

- Can you write function with parameters and return?
- Can you use default parameter for tax rate?
- Can you write discount calculator that returns price and rate?
- Can you build cleaning function for email and price string handling None?
- Can you make functions call other functions to build report?
- Can you use toolbox in loop for 100 products without copy-paste?

If yes, you stopped copying code and started building tools. That is professional level.

Next: Debugging - How to read errors and fix them fast when data is messy.

**Key Takeaway:** Write rule once as function, reuse 1000 times. Small functions that do one job, handle edge cases, and return values are the foundation of maintainable data code. If business rule changes, you edit one place, not 100.
