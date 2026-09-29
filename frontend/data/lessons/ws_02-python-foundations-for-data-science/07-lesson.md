# Lesson 07 - Lists, Tuples, Dictionaries - Storing Real Data

**Duration:** 60 min | **Level:** Beginner | **Goal:** Store and organize real business data efficiently

## Learning Objectives
- Choose between list, tuple, and dictionary for different data shapes.
- Manipulate collections with real world examples: orders, products, customers.
- Understand which structure to use for which job to avoid slow code.

---

## 1. Why Collections Matter

<svg width="100%" height="190" viewBox="0 0 700 190" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="190" rx="16" fill="#FFFFFF"/>
  <text x="350" y="28" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">3 COLLECTIONS - DIFFERENT JOBS</text>
  <rect x="20" y="50" width="200" height="120" rx="12" fill="#DBEAFE" stroke="#1E40AF" stroke-width="1.5"/>
  <text x="120" y="72" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#1E3A8A">LIST</text>
  <text x="35" y="92" font-family="Arial" font-size="9" fill="#1E3A8A">[ "Mouse", "Keyboard" ]</text>
  <text x="35" y="108" font-family="Arial" font-size="9" fill="#1E3A8A">Ordered, changeable</text>
  <text x="35" y="124" font-family="Arial" font-size="9" fill="#1E3A8A">Add, remove, sort</text>
  <text x="35" y="142" font-family="Arial" font-size="9" font-weight="700" fill="#1E40AF">Use: Daily sales list</text>
  <rect x="250" y="50" width="200" height="120" rx="12" fill="#D1FAE5" stroke="#065F46" stroke-width="1.5"/>
  <text x="350" y="72" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#064E3B">TUPLE</text>
  <text x="265" y="92" font-family="Arial" font-size="9" fill="#064E3B">( "Mouse", 25.99, 2 )</text>
  <text x="265" y="108" font-family="Arial" font-size="9" fill="#064E3B">Ordered, NOT changeable</text>
  <text x="265" y="124" font-family="Arial" font-size="9" fill="#064E3B">Fixed record</text>
  <text x="265" y="142" font-family="Arial" font-size="9" font-weight="700" fill="#065F46">Use: Product record</text>
  <rect x="480" y="50" width="200" height="120" rx="12" fill="#FEF3C7" stroke="#92400E" stroke-width="1.5"/>
  <text x="580" y="72" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#78350F">DICT</text>
  <text x="495" y="92" font-family="Arial" font-size="9" fill="#78350F">{ "name": "Mouse", "price": 25.99 }</text>
  <text x="495" y="108" font-family="Arial" font-size="9" fill="#78350F">Key -> Value, changeable</text>
  <text x="495" y="124" font-family="Arial" font-size="9" fill="#78350F">Lookup by name</text>
  <text x="495" y="142" font-family="Arial" font-size="9" font-weight="700" fill="#92400E">Use: Customer, order</text>
</svg>

Single variable holds one value. Real business has thousands: 500 sales today, 200 products, 1000 customers. Collections store many values in one structure.

## 2. Lists - Ordered, Changeable, For Growing Data

**Real World Example 1 - Daily Sales Amounts:**

List is ordered, you can add, remove, change, and loop.

```
daily_sales = [120.50, 89.99, 45.00, 210.00]
print(daily_sales[0])  # First sale: 120.50
print(daily_sales[-1]) # Last sale: 210.00 - negative index counts from end
print(len(daily_sales)) # 4 sales

# Add new sale
daily_sales.append(15.99)
print(daily_sales)  # [120.5, 89.99, 45.0, 210.0, 15.99]

# Add multiple
daily_sales.extend([300.00, 12.50])

# Insert at position
daily_sales.insert(0, 500.00)  # Insert at start

# Remove
daily_sales.remove(45.00)  # Remove first occurrence of 45.00
last = daily_sales.pop()  # Remove and return last

# Sort
daily_sales.sort()  # Small to large
daily_sales.sort(reverse=True)  # Large to small
```

**Real World Example 2 - Process Sales List with Functions:**

```
sales = [120.50, 89.99, 45.00, 210.00, 15.99, 300.00]

# Total
total = sum(sales)
average = total / len(sales)
print(f"Total: {total}, Average: {average:.2f}")

# Count high value sales > 100
high_value = []
for amount in sales:
    if amount > 100:
        high_value.append(amount)

print(f"High value sales: {high_value}")

# Using list comprehension - short version of loop
high_value2 = [amount for amount in sales if amount > 100]
print(high_value2)  # Same result, one line

# Apply tax to all
tax_rate = 0.08
with_tax = [amount * (1 + tax_rate) for amount in sales]
print(with_tax)
```

List comprehension is professional way to transform lists quickly.

**Real World Example 3 - Product Names Cleaning in List:**

```
raw_products = ["  mouse  ", "KEYBOARD ", " Monitor", "USB cable"]
cleaned = [name.strip().title() for name in raw_products if name.strip() != ""]
print(cleaned)  # ['Mouse', 'Keyboard', 'Monitor', 'Usb Cable']
```

One line does strip, title case, and skip empty. This pattern appears daily in data work.

## 3. Tuples - Ordered, Fixed, For Records That Should Not Change

Tuple looks like list but with parentheses and cannot be changed after creation.

**Real World Example 4 - Product Record:**

Product should be (name, price, quantity) and stay together. You should not accidentally change price inside record.

```
product = ("Mouse", 25.99, 2)
print(product[0])  # Mouse
print(product[1])  # 25.99

# product[1] = 30.00  # ERROR: tuple does not support item assignment
# This protection is good - prevents accidental change

# Unpacking
name, price, qty = product
print(f"{name} costs {price} qty {qty}")

# List of tuples - common for database rows
inventory = [
    ("Mouse", 25.99, 50),
    ("Keyboard", 45.00, 20),
    ("Monitor", 199.99, 5)
]

for name, price, stock in inventory:
    if stock < 10:
        print(f"LOW STOCK: {name} only {stock} left")
```

Use tuple when record is fixed: product details, coordinates, RGB color. Use list when collection grows: daily sales, customer list.

**Real World Example 5 - Returning Multiple Values from Function:**

Functions return tuple when returning multiple values.

```
def get_order_summary(price, qty):
    subtotal = price * qty
    tax = subtotal * 0.08
    total = subtotal + tax
    return (subtotal, tax, total)  # returns tuple

summary = get_order_summary(100, 2)
print(summary)  # (200, 16.0, 216.0)

sub, tax, tot = get_order_summary(100, 2)  # unpack
print(f"Subtotal {sub}, Tax {tax}, Total {tot}")
```

## 4. Dictionaries - Key to Value, For Lookup

Dictionary stores key -> value pairs. Best for real objects like customer, order, product with named fields.

**Real World Example 6 - Customer Record:**

```
customer = {
    "id": 101,
    "name": "Alex Johnson",
    "email": "alex@test.com",
    "is_vip": True,
    "total_spent": 1250.50
}

print(customer["name"])  # Alex Johnson
print(customer.get("email"))  # alex@test.com
print(customer.get("phone", "No phone"))  # Default if missing, no crash

# Add new field
customer["phone"] = "555-1234"

# Update
customer["total_spent"] = 1300.00

# Loop
for key, value in customer.items():
    print(f"{key}: {value}")

# Only keys
print(customer.keys())

# Only values
print(customer.values())
```

**Real World Example 7 - Product Catalog Lookup:**

List is slow for lookup, dict is fast.

```
# Slow way - list, must loop to find
product_list = [("Mouse", 25.99), ("Keyboard", 45.00)]
# To find price of Keyboard, loop entire list

# Fast way - dict, direct lookup by name
product_catalog = {
    "Mouse": 25.99,
    "Keyboard": 45.00,
    "Monitor": 199.99,
    "Cable": 5.99
}

print(product_catalog["Mouse"])  # 25.99 instant, no loop

# Check if product exists
if "Keyboard" in product_catalog:
    print(f"Price: {product_catalog['Keyboard']}")

# Add new product
product_catalog["Webcam"] = 89.99

# Calculate order total using catalog
order = ["Mouse", "Keyboard", "Mouse"]
total = 0
for item in order:
    total += product_catalog.get(item, 0)

print(f"Order total: {total}")
```

This is how real e-commerce pricing works.

**Real World Example 8 - List of Dictionaries - Most Common Data Shape:**

CSV and database rows become list of dicts. This is 80% of data work.

```
orders = [
    {"id": 1, "product": "Mouse", "qty": 2, "price": 25.99, "customer": "Alex"},
    {"id": 2, "product": "Keyboard", "qty": 1, "price": 45.00, "customer": "Sam"},
    {"id": 3, "product": "Monitor", "qty": 1, "price": 199.99, "customer": "Alex"},
    {"id": 4, "product": "Mouse", "qty": 5, "price": 25.99, "customer": "Lee"}
]

# Total revenue
total_revenue = sum(order["qty"] * order["price"] for order in orders)
print(f"Total revenue: {total_revenue}")

# Orders by customer
from collections import defaultdict
customer_totals = defaultdict(float)

for order in orders:
    key = order["customer"]
    customer_totals[key] += order["qty"] * order["price"]

print(dict(customer_totals))  # {'Alex': 251.97, 'Sam': 45.0, 'Lee': 129.95}

# Find all orders for Alex
alex_orders = [o for o in orders if o["customer"] == "Alex"]
print(alex_orders)
```

`defaultdict` automatically creates 0 for new customer, avoids checking if exists.

**Real World Example 9 - Nested Dictionary - Customer with Orders:**

```
customers = {
    "Alex": {
        "email": "alex@test.com",
        "orders": [
            {"product": "Mouse", "qty": 2},
            {"product": "Monitor", "qty": 1}
        ],
        "total_spent": 251.97
    },
    "Sam": {
        "email": "sam@test.com",
        "orders": [
            {"product": "Keyboard", "qty": 1}
        ],
        "total_spent": 45.00
    }
}

print(customers["Alex"]["email"])
print(customers["Alex"]["orders"][0]["product"])

# Add order to Alex
customers["Alex"]["orders"].append({"product": "Cable", "qty": 3})
customers["Alex"]["total_spent"] += 5.99 * 3
```

## 5. Choosing Right Structure

| Situation | Use | Why | Example |
| --- | --- | --- | --- |
| Growing list of same type | List | Add, remove, sort, loop | daily_sales = [120, 89, 45] |
| Fixed record that should not change | Tuple | Protects from accidental edit | product = ("Mouse", 25.99, 2) |
| Lookup by name/id | Dict | Fast, no loop needed | catalog = {"Mouse": 25.99} |
| Table of rows from CSV | List of Dicts | Each row is dict with named fields | orders = [{"product": "Mouse", ...}] |
| Counting occurrences | Dict | Key count | counts = {"Mouse": 10, "Keyboard": 5} |

**Real World Example 10 - Counting Product Sales:**

```
sales = ["Mouse", "Keyboard", "Mouse", "Monitor", "Mouse", "Keyboard"]

# Manual way with dict
counts = {}
for product in sales:
    if product in counts:
        counts[product] += 1
    else:
        counts[product] = 1

print(counts)  # {'Mouse': 3, 'Keyboard': 2, 'Monitor': 1}

# Professional way with Counter
from collections import Counter
counts2 = Counter(sales)
print(counts2)
print(counts2.most_common(2))  # Top 2: [('Mouse', 3), ('Keyboard', 2)]
```

Counter is built-in tool for counting, saves 4 lines.

## 6. Hands-On Task

Create file `store_data.py`:

```
# Product catalog
catalog = {
    "Mouse": {"price": 25.99, "stock": 50, "category": "Accessories"},
    "Keyboard": {"price": 45.00, "stock": 20, "category": "Accessories"},
    "Monitor": {"price": 199.99, "stock": 5, "category": "Display"},
    "Cable": {"price": 5.99, "stock": 100, "category": "Accessories"}
}

# Orders list
orders = [
    {"customer": "Alex", "product": "Mouse", "qty": 2},
    {"customer": "Sam", "product": "Monitor", "qty": 1},
    {"customer": "Alex", "product": "Keyboard", "qty": 1},
    {"customer": "Lee", "product": "Mouse", "qty": 10},
    {"customer": "Alex", "product": "Cable", "qty": 5}
]

# Task 1: Calculate total per order using catalog
for order in orders:
    product_info = catalog.get(order["product"])
    if product_info:
        order["total"] = product_info["price"] * order["qty"]
        order["category"] = product_info["category"]

print("Orders with totals:")
for o in orders:
    print(o)

# Task 2: Total revenue per customer
from collections import defaultdict
customer_revenue = defaultdict(float)
for order in orders:
    customer_revenue[order["customer"]] += order["total"]

print("\nRevenue per customer:")
for cust, rev in customer_revenue.items():
    print(f"{cust}: ${rev:.2f}")

# Task 3: Low stock alert after orders
# Simulate stock reduction
for order in orders:
    catalog[order["product"]]["stock"] -= order["qty"]

print("\nLow stock alerts:")
for product, info in catalog.items():
    if info["stock"] < 10:
        print(f"LOW STOCK: {product} only {info['stock']} left - Category {info['category']}")

# Task 4: Top category by revenue
category_revenue = defaultdict(float)
for order in orders:
    category_revenue[order["category"]] += order["total"]

print("\nRevenue by category:")
for cat, rev in category_revenue.items():
    print(f"{cat}: ${rev:.2f}")
```

Run it and see how list, dict, and list of dicts work together for real store operations.

## 7. Checklist

- Can you add, remove, sort list and use list comprehension to clean names?
- Can you explain why tuple protects product record from accidental change?
- Can you lookup product price instantly with dict vs looping list?
- Can you build list of dicts for orders and calculate total revenue with sum and comprehension?
- Can you use defaultdict and Counter to count sales per product and per customer?
- Can you build nested dict for customers with orders inside?

If yes, you can store real business data efficiently.

Next: Strings - Cleaning dirty data like names, phones, addresses.

**Key Takeaway:** List for growing ordered data like daily sales. Tuple for fixed records like product details that should not change. Dict for fast lookup by name and for real objects like customer. Most real data is list of dicts - each row is a dict, table is list. Master Counter and defaultdict to count and group without manual checks.
