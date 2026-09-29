# Lesson 03 - Variables, Data Types and Calculations

**Duration:** 50 min | **Level:** Beginner | **Goal:** Understand how Python stores and calculates business numbers

## Learning Objectives
- Create variables and understand how Python stores data in memory.
- Use int, float, string, boolean, and None correctly in data work.
- Perform calculations for profit, discounts, and totals without errors.

---

## 1. What is a Variable?

<svg width="100%" height="180" viewBox="0 0 700 180" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="180" rx="16" fill="#FFFFFF"/>
  <text x="350" y="28" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">VARIABLE = LABELED BOX IN MEMORY</text>
  <rect x="50" y="50" width="120" height="60" rx="8" fill="#DBEAFE" stroke="#1E40AF" stroke-width="1.5"/>
  <text x="110" y="75" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#1E3A8A">sales</text>
  <text x="110" y="92" text-anchor="middle" font-family="Arial" font-size="12" fill="#1E3A8A">250000</text>
  <rect x="200" y="50" width="120" height="60" rx="8" fill="#D1FAE5" stroke="#065F46" stroke-width="1.5"/>
  <text x="260" y="75" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#064E3B">product</text>
  <text x="260" y="92" text-anchor="middle" font-family="Arial" font-size="11" fill="#064E3B">"Laptop"</text>
  <rect x="350" y="50" width="120" height="60" rx="8" fill="#FEF3C7" stroke="#92400E" stroke-width="1.5"/>
  <text x="410" y="75" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#78350F">is_paid</text>
  <text x="410" y="92" text-anchor="middle" font-family="Arial" font-size="12" fill="#78350F">True</text>
  <rect x="500" y="50" width="120" height="60" rx="8" fill="#FEE2E2" stroke="#991B1B" stroke-width="1.5"/>
  <text x="560" y="75" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#7F1D1D">discount</text>
  <text x="560" y="92" text-anchor="middle" font-family="Arial" font-size="12" fill="#7F1D1D">None</text>
  <text x="50" y="140" font-family="Arial" font-size="10" fill="#111827">Variable name is label. Value is what is inside box. Type is kind of data inside.</text>
  <text x="50" y="158" font-family="Arial" font-size="10" fill="#111827">Good names: total_sales, customer_name. Bad names: x, data, temp, a1.</text>
</svg>

Think of memory as shelf of boxes. When you write `sales = 250000`, you create a box labeled sales and put number 250000 inside. Later you can read box, change value, or use it for calculations.

Rule: Variable name must start with letter or underscore, no spaces, no dash, case sensitive. `total_sales` and `Total_Sales` are different.

```python
total_sales = 250000
customer_name = "Alex"
is_paid = True
```

Good naming saves hours when you return to code after 2 weeks. Name should say what it is.

## 2. The 5 Core Data Types for Data Work

**int - Integer - Whole numbers:**
Used for quantity, count, units. No decimal.
```python
quantity = 15
units_sold = 120
print(type(quantity))  # <class 'int'>
```

**float - Decimal numbers:**
Used for price, cost, profit, percentage. Has decimal point.
```python
unit_price = 199.99
discount_rate = 0.15
total = quantity * unit_price  # 15 * 199.99 = 2999.85
```
Common error: Adding int and float gives float. That is normal.

**str - String - Text:**
Used for names, product codes, categories. Always in quotes.
```python
product_name = "Wireless Mouse"
category = 'Electronics'
message = f"Product {product_name} costs {unit_price}"
```
f-string lets you put variables inside text. Use it for reports.

**bool - Boolean - True or False:**
Used for decisions - is paid, is in stock, is expired. Only two values.
```py
is_in_stock = True
is_expired = False
has_discount = quantity > 10  # True if quantity greater than 10
```
This will be critical for filtering data later.

**None - No value, missing:**
Used when data is missing, not yet known.
```py
delivery_date = None
customer_email = None
```
Different from 0 or empty string. None means we do not know. Important for cleaning messy data.

Check type anytime:
```py
print(type(total))
print(type(customer_name))
```

## 3. Calculations for Business

**Basic math:**
```py
sales = 5000
cost = 3200
profit = sales - cost          # 1800
profit_margin = profit / sales # 0.36 = 36 percent
final_price = 1000 * (1 - 0.15)  # 15 percent discount = 850
quantity = 12
total = quantity * 199.99
```

**Order matters:**
Python follows BODMAS. Use brackets to be clear.
```py
# Wrong if you mean discount on total
price = 100 + 20 * 0.1   # = 102
# Right
price = (100 + 20) * 0.1  # = 12
price = (100 + 20) * 0.9  # after 10 percent discount = 108
```

**String calculations:**
```py
first_name = "Sam"
last_name = "Lee"
full_name = first_name + " " + last_name  # "Sam Lee"
repeat = "Sale! " * 3  # "Sale! Sale! Sale! "
```

You cannot add string and number:
```py
# This fails
# total = "Sales: " + 250000
# Fix with f-string or str()
total = f"Sales: {250000}"
total = "Sales: " + str(250000)
```

**Boolean calculations:**
```py
age = 20
is_adult = age >= 18  # True
stock = 0
is_available = stock > 0  # False
```

## 4. Common Mistakes Beginners Make

**Mistake 1 - Using wrong type:**
```py
quantity = "15"  # this is string, not number
total = quantity * 2  # gives "1515" not 30
# Fix: Convert
quantity = int("15")
total = quantity * 2
```

Convert functions: `int()`, `float()`, `str()`, `bool()`
```py
price_str = "199.99"
price = float(price_str)
qty_str = "15"
qty = int(qty_str)
```

**Mistake 2 - Float precision:**
```py
print(0.1 + 0.2)  # 0.30000000000000004 not 0.3
# For money, round
total = round(0.1 + 0.2, 2)  # 0.3
```

**Mistake 3 - Overwriting built-in names:**
Do not name variable `list`, `str`, `type`, `sum`. You will break Python.
Bad: `list = [1,2,3]`
Good: `product_list = [1,2,3]`

## 5. Hands-On Task

Create file `calculations.py`:

```python
# Sales data for one day
product = "Wireless Keyboard"
quantity = 8
unit_price = 45.50
tax_rate = 0.08

# Calculations
subtotal = quantity * unit_price
tax = subtotal * tax_rate
total = subtotal + tax

# Boolean
is_bulk = quantity >= 10
needs_restock = quantity < 5

# Report using f-string
print(f"Product: {product}")
print(f"Subtotal: {subtotal}")
print(f"Tax: {tax}")
print(f"Total: {total}")
print(f"Is bulk order? {is_bulk}")
print(f"Needs restock? {needs_restock}")
print(f"Type of total: {type(total)}")
```

Run it: `python calculations.py`

Experiment: Change quantity to 12 and run again. Change to "12" as string and see error. Fix it.

## 6. Checklist

- Can you create variables with good names?
- Can you explain int vs float vs str vs bool vs None?
- Can you calculate profit, margin, discount with correct brackets?
- Can you use f-string to build report?
- Can you convert string "199.99" to float and calculate total?

If yes, you understand how Python stores business data. Next we learn how Python makes decisions with control flow.

**Key Takeaway:** Variable is a labeled box. Choose type correctly - int for counts, float for prices, str for names, bool for decisions, None for missing. Name variables clearly. Use f-strings for reports.
