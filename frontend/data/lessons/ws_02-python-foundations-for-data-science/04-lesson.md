# Lesson 04 - Control Flow - Making Decisions in Code

**Duration:** 60 min | **Level:** Beginner | **Goal:** Write code that makes decisions and repeats tasks like a real analyst

## Learning Objectives
- Use if, elif, else to make business decisions in code.
- Use for and while loops to automate repetitive data tasks.
- Apply control flow to real world examples: discounts, inventory, and report generation.

---

## 1. Why Control Flow Matters

<svg width="100%" height="200" viewBox="0 0 700 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="200" rx="16" fill="#FFFFFF"/>
  <text x="350" y="28" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">CODE WITHOUT CONTROL FLOW vs WITH CONTROL FLOW</text>
  <rect x="20" y="50" width="310" height="130" rx="12" fill="#FEE2E2" stroke="#991B1B" stroke-width="1.5"/>
  <text x="175" y="75" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#7F1D1D">WITHOUT - You type everything</text>
  <text x="35" y="95" font-family="Arial" font-size="9" fill="#7F1D1D">total1 = price1 * qty1</text>
  <text x="35" y="110" font-family="Arial" font-size="9" fill="#7F1D1D">total2 = price2 * qty2</text>
  <text x="35" y="125" font-family="Arial" font-size="9" fill="#7F1D1D">total3 = price3 * qty3 ... x 500 times</text>
  <text x="35" y="145" font-family="Arial" font-size="9" font-weight="700" fill="#991B1B">500 lines, 1 mistake breaks all</text>
  <rect x="370" y="50" width="310" height="130" rx="12" fill="#D1FAE5" stroke="#065F46" stroke-width="1.5"/>
  <text x="525" y="75" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#064E3B">WITH - Code decides and repeats</text>
  <text x="385" y="95" font-family="Arial" font-size="9" fill="#064E3B">for item in sales:</text>
  <text x="385" y="110" font-family="Arial" font-size="9" fill="#064E3B">  if item.qty > 10:</text>
  <text x="385" y="125" font-family="Arial" font-size="9" fill="#064E3B">    apply discount</text>
  <text x="385" y="145" font-family="Arial" font-size="9" font-weight="700" fill="#065F46">5 lines, works for 500 or 5M rows</text>
</svg>

Real work is not one calculation. It is thousands of rows with rules: If customer is VIP, give 15% discount. If stock is below 5, alert. If sale is after 6pm, add night shift fee. Control flow lets code make those decisions automatically.

## 2. If, Elif, Else - Business Decisions

**Real World Example 1 - Discount Based on Quantity:**

A store gives discounts: 20% for 20+ units, 10% for 10+ units, no discount otherwise.

```
quantity = 15
unit_price = 100

if quantity >= 20:
    discount_rate = 0.20
    print("20% bulk discount applied")
elif quantity >= 10:
    discount_rate = 0.10
    print("10% discount applied")
else:
    discount_rate = 0
    print("No discount")

total = quantity * unit_price * (1 - discount_rate)
print(f"Total to pay: {total}")
```

Flow: Python checks first condition. If True, runs it and skips rest. If False, checks next elif. If all False, runs else. Order matters - check largest quantity first. If you check >=10 before >=20, you will never reach 20%.

**Real World Example 2 - Shipping Cost by Location and Total:**

Online store: Free shipping if total > 100. Otherwise shipping is 10 for local, 25 for international. International orders over 200 also get free shipping.

```
total_amount = 80
is_local = False

if total_amount > 200:
    shipping = 0
    print("Free shipping - high value order")
elif total_amount > 100 and is_local:
    shipping = 0
    print("Free local shipping")
elif is_local:
    shipping = 10
    print("Local shipping: 10")
else:
    shipping = 25
    print("International shipping: 25")

final_total = total_amount + shipping
print(f"Final total: {final_total}")
```

**Real World Example 3 - Inventory Alert System:**

```
stock = 3
product = "Wireless Mouse"

if stock == 0:
    status = "OUT OF STOCK - Order now!"
elif stock < 5:
    status = "LOW STOCK - Reorder soon"
elif stock < 20:
    status = "In stock - Monitor"
else:
    status = "Well stocked"

print(f"{product}: {status}")
```

Operators you will use daily:
- Comparison: `==` equal, `!=` not equal, `>` greater, `<` less, `>=` , `<=`
- Logic: `and` both True, `or` one True, `not` opposite
```
is_vip = True
total = 150
if is_vip and total > 100:
    print("VIP bonus gift")

if is_vip or total > 200:
    print("Free gift")
```

Common mistake: Using `=` for comparison. `=` is assignment, `==` is comparison.
```
# Wrong: if quantity = 10:
# Right: if quantity == 10:
```

## 3. For Loops - Automate Repetitive Tasks

**Real World Example 4 - Calculate Total Sales for Day:**

Instead of adding one by one, loop.

```
daily_sales = [120.50, 89.99, 45.00, 210.00, 15.99]
total = 0

for sale in daily_sales:
    total = total + sale
    print(f"Adding {sale}, running total: {total}")

print(f"Day total: {total}")
```

**Real World Example 5 - Clean Product Names:**

Raw data has messy names with extra spaces and mixed case.

```
raw_names = ["  wireless MOUSE  ", "KEYBOARD ", "  Monitor", "usb CABLE"]
cleaned = []

for name in raw_names:
    clean = name.strip().lower()
    cleaned.append(clean)
    print(f"Cleaned '{name}' to '{clean}'")

print(cleaned)  # ['wireless mouse', 'keyboard', 'monitor', 'usb cable']
```

`strip()` removes spaces, `lower()` makes lowercase. This is 80% of data cleaning work.

**Real World Example 6 - Apply Discount to All Items:**

```
prices = [100, 200, 150, 80, 300]
discounted_prices = []

for price in prices:
    if price > 200:
        new_price = price * 0.8  # 20% off expensive
    elif price > 100:
        new_price = price * 0.9  # 10% off medium
    else:
        new_price = price
    discounted_prices.append(new_price)

print(discounted_prices)
```

**Loop with Index - When you need position:**

```
products = ["Mouse", "Keyboard", "Monitor"]

for index, product in enumerate(products):
    print(f"{index + 1}. {product}")

# Output:
# 1. Mouse
# 2. Keyboard
# 3. Monitor
```

**Range - Loop a set number of times:**

```
for i in range(5):  # 0,1,2,3,4
    print(f"Processing batch {i+1} of 5")

for i in range(1, 6):  # 1 to 5 inclusive
    print(f"Day {i}")
```

## 4. While Loop - Repeat Until Condition Met

Use when you do not know how many times to repeat.

**Real World Example 7 - Restock Until Target:**

```
stock = 2
target = 10
orders_placed = 0

while stock < target:
    print(f"Stock is {stock}, ordering 2 more")
    stock += 2
    orders_placed += 1

print(f"Reached target {target} after {orders_placed} orders")
```

**Real World Example 8 - User Input Validation:**

```
# Simulate user entering quantity until valid
inputs = ["abc", "-5", "12"]  # first two invalid, third valid
index = 0
valid_quantity = None

while valid_quantity is None:
    user_input = inputs[index]
    print(f"Trying input: {user_input}")
    try:
        qty = int(user_input)
        if qty > 0:
            valid_quantity = qty
        else:
            print("Must be positive")
    except ValueError:
        print("Invalid number, try again")
    index += 1

print(f"Valid quantity: {valid_quantity}")
```

Danger: Infinite loop if condition never becomes False. Always ensure something changes inside while.

```
# Dangerous - never ends if you forget stock += 2
# while stock < target:
#   print(stock)
```

## 5. Break and Continue - Control Inside Loops

**Break - Stop loop early:**

```
orders = [50, 120, 300, 15, 200]

for amount in orders:
    if amount > 250:
        print(f"Fraud alert: {amount} too high, stopping check")
        break
    print(f"Order {amount} OK")
```

**Continue - Skip one item:**

```
emails = ["alex@test.com", "", "sam@test.com", "  ", "lee@test.com"]

for email in emails:
    if email.strip() == "":
        print("Skipping empty email")
        continue
    print(f"Sending to {email}")
```

## 6. Hands-On Task - Real World Combined

Create file `sales_processor.py`:

```
# Real world: Process daily transactions with rules

transactions = [
    {"product": "Mouse", "qty": 2, "price": 25.99, "is_vip": False},
    {"product": "Keyboard", "qty": 15, "price": 45.00, "is_vip": True},
    {"product": "Monitor", "qty": 1, "price": 299.99, "is_vip": False},
    {"product": "Cable", "qty": 25, "price": 5.99, "is_vip": False},
]

total_revenue = 0
alerts = []

for t in transactions:
    qty = t["qty"]
    price = t["price"]
    
    # Discount logic
    if t["is_vip"] and qty >= 10:
        discount = 0.20
    elif qty >= 20:
        discount = 0.15
    elif qty >= 10:
        discount = 0.10
    else:
        discount = 0
    
    line_total = qty * price * (1 - discount)
    total_revenue += line_total
    
    # Stock alert logic
    if qty > 20:
        alerts.append(f"Bulk sale: {qty} x {t['product']}")
    
    print(f"{t['product']}: qty {qty}, discount {discount*100}%, line total {round(line_total,2)}")

print(f"\nTotal Revenue: {round(total_revenue,2)}")
print("Alerts:")
for alert in alerts:
    print(f"- {alert}")
```

Run it. Change data and run again. Notice how 20 lines handle any number of transactions.

## 7. Checklist

- Can you write if/elif/else for discount tiers with correct order?
- Can you combine conditions with and/or/not for shipping rules?
- Can you loop over list of sales to sum total?
- Can you clean list of names with strip() and lower() in loop?
- Can you use break to stop on fraud and continue to skip empty?
- Can you avoid infinite while loop?

If yes, you can automate 80% of analyst repetitive work.

Next: Functions - Stop copying code and build reusable toolbox.

**Key Takeaway:** If/elif/else makes decisions - discount, shipping, stock alerts. For loops automate over thousands of rows. While loops repeat until condition met. Combine them to process real transactions with business rules in a few lines instead of hundreds.
