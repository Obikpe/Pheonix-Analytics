# Lesson 16 - Object-Oriented Basics for Data Models

**Duration:** 75 min | **Level:** Intermediate | **Goal:** Build Product, Customer, Order classes to replace messy dicts and enforce business rules

## Learning Objectives
- Create classes with __init__, methods, and properties for real store models.
- Use OOP to enforce validation for IDs, locations, and prices.
- Build reusable models that work across Lagos and London stores.

---

## 1. Why Dicts Break and Classes Fix

<svg width="100%" height="190" viewBox="0 0 700 190" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="190" rx="16" fill="#FFFFFF"/>
  <text x="350" y="28" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">DICT vs CLASS FOR ORDER</text>
  <rect x="20" y="50" width="300" height="120" rx="12" fill="#FEE2E2" stroke="#991B1B" stroke-width="1.5"/>
  <text x="170" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#7F1D1D">DICT - No rules</text>
  <text x="35" y="90" font-family="Arial" font-size="9" fill="#7F1D1D">order = {"id": "ORD_LAG_001_5001"</text>
  <text x="35" y="105" font-family="Arial" font-size="9" fill="#7F1D1D">         "price": -10  } // allowed!</text>
  <text x="35" y="120" font-family="Arial" font-size="9" fill="#7F1D1D">order["prce"] typo -> KeyError</text>
  <text x="35" y="135" font-family="Arial" font-size="9" fill="#7F1D1D">No calc method, manual total</text>
  <text x="35" y="150" font-family="Arial" font-size="9" fill="#7F1D1D">Every place repeats validation</text>
  <rect x="380" y="50" width="300" height="120" rx="12" fill="#D1FAE5" stroke="#065F46" stroke-width="1.5"/>
  <text x="530" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#064E3B">CLASS - Rules enforced</text>
  <text x="395" y="90" font-family="Arial" font-size="9" fill="#064E3B">order = Order("ORD_LAG_001_5001", 25.99, 2)</text>
  <text x="395" y="105" font-family="Arial" font-size="9" fill="#064E3B">price -10 -> raises ValueError</text>
  <text x="395" y="120" font-family="Arial" font-size="9" fill="#064E3B">order.total -> auto calc</text>
  <text x="395" y="135" font-family="Arial" font-size="9" fill="#064E3B">order.store_location -> LAG</text>
  <text x="395" y="150" font-family="Arial" font-size="9" fill="#064E3B">Validation in one place</text>
</svg>

Dict lets you put price -10, qty "abc", store_id "invalid". Class stops bad data at creation and gives you methods like total, discount, validation.

## 2. Building Product, Store, Customer, Order Classes

**Real World Example 1 - Product class with validation:**

```
import re
from datetime import date

class Product:
    def __init__(self, product_id, name, price, category, store_id, stock=0):
        # Validate product_id pattern: PROD_001, SKU MSE-BLK-001
        if not re.match(r"^(PROD_\d{3}|[A-Z]{3}-[A-Z]+-\d{3})$", product_id):
            raise ValueError(f"Invalid product_id {product_id}, should be PROD_001 or MSE-BLK-001")
        
        # Validate store_id
        if not re.match(r"^[A-Z]{3}_\d{3}_[A-Za-z]+$", store_id):
            raise ValueError(f"Invalid store_id {store_id}, should be LAG_001_Ikeja")
        
        if price <= 0:
            raise ValueError(f"Price must be >0, got {price}")
        
        if stock < 0:
            raise ValueError(f"Stock cannot be negative, got {stock}")
        
        self.product_id = product_id
        self.name = name.strip().title()
        self.price = float(price)
        self.category = category.strip().title()
        self.store_id = store_id
        self.stock = int(stock)
        self.location_code = store_id.split("_")[0]  # LAG, LDN, ABJ
    
    @property
    def is_low_stock(self):
        return self.stock < 10
    
    @property
    def price_with_tax(self):
        tax_rate = 0.075 if self.location_code == "LAG" else 0.20 if self.location_code == "LDN" else 0.08
        return round(self.price * (1 + tax_rate), 2)
    
    def apply_discount(self, qty, is_vip=False):
        if is_vip and qty >= 10:
            rate = 0.20
        elif qty >= 20:
            rate = 0.15
        elif qty >= 10:
            rate = 0.10
        else:
            rate = 0
        final_price = self.price * qty * (1 - rate)
        return round(final_price, 2), rate
    
    def __repr__(self):
        return f"Product({self.product_id}, {self.name}, ${self.price}, Stock {self.stock}, Store {self.store_id})"

# Test
try:
    p1 = Product("MSE-BLK-001", "wireless mouse black", 25.99, "accessories", "LAG_001_Ikeja", stock=50)
    print(p1)
    print(f"Low stock? {p1.is_low_stock}")
    print(f"Price with tax Lagos 7.5%: ${p1.price_with_tax}")
    total, rate = p1.apply_discount(12, is_vip=True)
    print(f"Total for 12 VIP: ${total} discount {rate*100}%")
    
    p2 = Product("PROD_002", "Keyboard", 45.00, "Accessories", "LDN_001_Camden", stock=5)
    print(p2)
    print(f"London price with 20% VAT: ${p2.price_with_tax}")
    print(f"Low stock alert: {p2.is_low_stock}")
    
    p_bad = Product("BAD_ID", "Mouse", -10, "Acc", "LAG_001_Ikeja")
except ValueError as e:
    print(f"Validation caught: {e}")
```

Class enforces rules, calculates tax per location, discount, low stock check.

**Real World Example 2 - Store class:**

```
class Store:
    LOCATIONS = {
        "LAG_001_Ikeja": {"city": "Ikeja", "state": "Lagos", "country": "NG", "address": "12 Allen Avenue, Ikeja, Lagos, NG 101233", "sla_days": 3, "tax": 0.075},
        "LAG_002_Lekki": {"city": "Lekki", "state": "Lagos", "country": "NG", "address": "Plot 5 Admiralty Way, Lekki, Lagos, NG 105102", "sla_days": 3, "tax": 0.075},
        "LAG_003_VI": {"city": "Victoria Island", "state": "Lagos", "country": "NG", "address": "10 Akin Adesola St, VI, Lagos, NG 101241", "sla_days": 3, "tax": 0.075},
        "LDN_001_Camden": {"city": "Camden", "state": "London", "country": "UK", "address": "45 Camden High St, London, UK NW1 0JH", "sla_days": 2, "tax": 0.20},
        "LDN_002_Stratford": {"city": "Stratford", "state": "London", "country": "UK", "address": "Westfield Stratford, London, UK E20 1EJ", "sla_days": 2, "tax": 0.20},
        "ABJ_001_Garki": {"city": "Garki", "state": "FCT", "country": "NG", "address": "Plot 123 Garki, Abuja, NG 900242", "sla_days": 4, "tax": 0.075},
    }
    
    def __init__(self, store_id):
        if store_id not in self.LOCATIONS:
            raise ValueError(f"Unknown store_id {store_id}, known: {list(self.LOCATIONS.keys())}")
        self.store_id = store_id
        info = self.LOCATIONS[store_id]
        self.city = info["city"]
        self.state = info["state"]
        self.country = info["country"]
        self.address = info["address"]
        self.sla_days = info["sla_days"]
        self.tax_rate = info["tax"]
        self.location_code = store_id.split("_")[0]
    
    @property
    def full_location(self):
        return f"{self.city}, {self.state}, {self.country} - {self.store_id}"
    
    def is_delivery_late(self, order_date, delivery_date):
        from datetime import date
        if not order_date or not delivery_date:
            return None
        days = (delivery_date - order_date).days
        return days > self.sla_days
    
    def __repr__(self):
        return f"Store({self.store_id}, {self.full_location}, SLA {self.sla_days} days, Tax {self.tax_rate*100}%)"

# Test
store_lag = Store("LAG_001_Ikeja")
print(store_lag)
print(store_lag.full_location)

store_ldn = Store("LDN_001_Camden")
print(store_ldn)

from datetime import date
print(f"Late? {store_lag.is_delivery_late(date(2024,1,10), date(2024,1,15))}")  # 5 days > 3 SLA = True
```

Store class centralizes location data, SLA, tax per store.

**Real World Example 3 - Customer and Order classes:**

```
from datetime import date

class Customer:
    def __init__(self, customer_id, name, email, phone, dob, city, country):
        if not re.match(r"^CUST_\d{3}_[A-Z]{3}$", customer_id):
            raise ValueError(f"Invalid customer_id {customer_id}, should be CUST_101_LAG")
        
        if "@" not in email:
            raise ValueError(f"Invalid email {email}")
        
        self.customer_id = customer_id
        self.name = name.strip().title()
        self.email = email.strip().lower()
        self.phone = phone
        self.dob = dob
        self.city = city
        self.country = country
        self.location_code = customer_id.split("_")[-1]
        self.orders = []
    
    @property
    def age(self):
        today = date.today()
        age = today.year - self.dob.year
        if (today.month, today.day) < (self.dob.month, self.dob.day):
            age -= 1
        return age
    
    @property
    def is_vip(self):
        total = sum(o.total for o in self.orders)
        return total > 1000
    
    def add_order(self, order):
        self.orders.append(order)
    
    def total_spent(self):
        return sum(o.total for o in self.orders)
    
    def __repr__(self):
        return f"Customer({self.customer_id}, {self.name}, {self.city}, {self.country}, Age {self.age}, VIP {self.is_vip})"

class Order:
    def __init__(self, order_id, product, customer, qty, order_date, store):
        if not re.match(r"^(ORD|INV)_[A-Z]{3}_\d{3}_\d{4}$", order_id):
            raise ValueError(f"Invalid order_id {order_id}")
        
        if qty <= 0:
            raise ValueError(f"Qty must be >0, got {qty}")
        
        self.order_id = order_id
        self.product = product
        self.customer = customer
        self.qty = qty
        self.order_date = order_date
        self.store = store
        self.delivery_date = None
    
    @property
    def subtotal(self):
        return self.product.price * self.qty
    
    @property
    def total(self):
        final, _ = self.product.apply_discount(self.qty, self.customer.is_vip)
        return final * (1 + self.store.tax_rate)
    
    def set_delivery(self, delivery_date):
        self.delivery_date = delivery_date
    
    @property
    def is_late(self):
        if not self.delivery_date:
            return None
        return self.store.is_delivery_late(self.order_date, self.delivery_date)
    
    def __repr__(self):
        return f"Order({self.order_id}, {self.product.name} x{self.qty} = ${self.total:.2f}, Store {self.store.store_id}, Customer {self.customer.customer_id})"

# Test real workflow with Lagos and London
store_lag = Store("LAG_001_Ikeja")
store_ldn = Store("LDN_001_Camden")

product_mouse = Product("MSE-BLK-001", "Wireless Mouse", 25000, "Accessories", "LAG_001_Ikeja", stock=100)
product_kbd = Product("KBD-WHT-002", "Keyboard", 120.50, "Accessories", "LDN_001_Camden", stock=20)

cust_lag = Customer("CUST_101_LAG", "Alex Johnson", "alex@ikeja.lagos.ng", "+2348012345678", date(1990,5,20), "Ikeja", "NG")
cust_ldn = Customer("CUST_102_LDN", "Sam Lee", "sam@camden.london.uk", "+44 20 1234 5678", date(1985,12,10), "Camden", "UK")

order1 = Order("ORD_LAG_001_5001", product_mouse, cust_lag, 2, date(2024,1,10), store_lag)
order1.set_delivery(date(2024,1,12))
cust_lag.add_order(order1)

order2 = Order("ORD_LDN_001_2001", product_kbd, cust_ldn, 1, date(2024,1,10), store_ldn)
order2.set_delivery(date(2024,1,15))
cust_ldn.add_order(order2)

print(order1)
print(f"  Subtotal: {order1.subtotal}, Total with tax and discount: {order1.total:.2f}, Late? {order1.is_late}")
print(cust_lag)
print(f"  Total spent: {cust_lag.total_spent():.2f}")

print(order2)
print(f"  Late? {order2.is_late} (London SLA 2 days, took 5)")
print(cust_ldn)
```

Now validation in one place, business logic inside classes, easy to understand.

## 3. Hands-On Assignment with Kaggle Dataset

**Assignment 16: Build Store Models from Real Data**

**Dataset to download:**
Kaggle: Olist Brazilian Ecommerce + Superstore + Ecommerce Data
Links:
- Primary: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce (has customer_id, order_id, customer_city, customer_state, geolocation)
- Secondary: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final (has Customer ID, Order ID, City, State, Sales, Category)
- Tertiary: https://www.kaggle.com/datasets/carrie1/ecommerce-data (has CustomerID, StockCode, Quantity, UnitPrice, Country)

Download `olist_customers_dataset.csv` and `olist_orders_dataset.csv` and `olist_geolocation_dataset.csv`

**Task - Create file `store_models_L16.py`:**

```
import re
from datetime import date, datetime
import csv
import os

class Store:
    LOCATIONS = {
        "LAG_001_Ikeja": {"city": "Ikeja", "state": "Lagos", "country": "NG", "address": "12 Allen Ave, Ikeja, Lagos, NG 101233", "sla": 3, "tax": 0.075},
        "LAG_002_Lekki": {"city": "Lekki", "state": "Lagos", "country": "NG", "address": "Admiralty Way, Lekki, Lagos, NG 105102", "sla": 3, "tax": 0.075},
        "LAG_003_VI": {"city": "Victoria Island", "state": "Lagos", "country": "NG", "address": "Akin Adesola, VI, Lagos, NG 101241", "sla": 3, "tax": 0.075},
        "LDN_001_Camden": {"city": "Camden", "state": "London", "country": "UK", "address": "45 Camden High St, London, UK NW1 0JH", "sla": 2, "tax": 0.20},
        "ABJ_001_Garki": {"city": "Garki", "state": "FCT", "country": "NG", "address": "Plot 123 Garki, Abuja, NG 900242", "sla": 4, "tax": 0.075},
    }
    def __init__(self, store_id):
        if store_id not in self.LOCATIONS:
            raise ValueError(f"Unknown store {store_id}")
        self.store_id = store_id
        self.info = self.LOCATIONS[store_id]
        self.city = self.info["city"]
        self.country = self.info["country"]
        self.sla = self.info["sla"]
    def __repr__(self):
        return f"Store({self.store_id}, {self.city}, {self.country}, SLA {self.sla})"

class Product:
    def __init__(self, product_id, name, price, stock, store_id):
        if price <= 0:
            raise ValueError(f"Price >0 required, got {price}")
        self.product_id = product_id
        self.name = name.title()
        self.price = float(price)
        self.stock = stock
        self.store_id = store_id
    @property
    def is_low(self):
        return self.stock < 10
    def __repr__(self):
        return f"Product({self.product_id}, {self.name}, ${self.price}, Stock {self.stock}, Store {self.store_id})"

class Customer:
    def __init__(self, customer_id, name, email, city, country, dob):
        if not re.match(r"^CUST_\d{3}_[A-Z]{3}$", customer_id):
            # Allow Kaggle IDs too
            if not re.match(r"^[a-f0-9]{8}-", customer_id):
                raise ValueError(f"Invalid customer_id {customer_id}")
        self.customer_id = customer_id
        self.name = name.title() if name else "Unknown"
        self.email = email
        self.city = city
        self.country = country
        self.dob = dob
        self.orders = []
    @property
    def age(self):
        if not self.dob:
            return None
        today = date.today()
        return today.year - self.dob.year - ((today.month, today.day) < (self.dob.month, self.dob.day))
    def add_order(self, order):
        self.orders.append(order)
    def total_spent(self):
        return sum(o.total for o in self.orders)
    def __repr__(self):
        return f"Customer({self.customer_id}, {self.name}, {self.city}, {self.country})"

class Order:
    def __init__(self, order_id, product, customer, qty, order_date, store):
        self.order_id = order_id
        self.product = product
        self.customer = customer
        self.qty = qty
        self.order_date = order_date
        self.store = store
    @property
    def total(self):
        return self.product.price * self.qty * (1 + self.store.info["tax"])
    def __repr__(self):
        return f"Order({self.order_id}, {self.product.name} x{self.qty}=${self.total:.2f}, {self.store.store_id}, {self.customer.customer_id})"

# Test with your Lagos/London stores
print("Testing models with Lagos/London IDs:")
stores = [Store(sid) for sid in ["LAG_001_Ikeja", "LAG_002_Lekki", "LDN_001_Camden", "ABJ_001_Garki"]]
for s in stores:
    print(f"  {s}")

products = [
    Product("MSE-BLK-001", "wireless mouse", 25000, 100, "LAG_001_Ikeja"),
    Product("KBD-WHT-002", "keyboard white", 120.5, 5, "LDN_001_Camden"),
    Product("PROD_003", "monitor 24inch", 85000, 3, "LAG_003_VI"),
]

for p in products:
    print(f"  {p} Low? {p.is_low}")

customers = [
    Customer("CUST_101_LAG", "Alex Johnson", "alex@ikeja.lagos.ng", "Ikeja", "NG", date(1990,5,20)),
    Customer("CUST_102_LDN", "Sam Lee", "sam@camden.london.uk", "Camden", "UK", date(1985,12,10)),
    Customer("CUST_103_ABJ", "Fatima Bello", "fatima@garki.abuja.ng", "Garki", "NG", date(1992,8,15)),
]

for c in customers:
    print(f"  {c} Age {c.age}")

# Create orders
orders = [
    Order("ORD_LAG_001_5001", products[0], customers[0], 2, date(2024,1,10), stores[0]),
    Order("ORD_LDN_001_2001", products[1], customers[1], 1, date(2024,1,10), stores[2]),
]

for o in orders:
    o.customer.add_order(o)
    print(f"  {o}")

print("\nCustomer totals:")
for c in customers:
    print(f"  {c.name} {c.customer_id} spent ${c.total_spent():.2f} in {c.city}, {c.country}")

# Kaggle integration
filepath = "olist_customers_dataset.csv"
if os.path.exists(filepath):
    print(f"\nLoading Kaggle dataset {filepath} into Customer models:")
    kaggle_customers = []
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if i >= 5:
                break
            cid = row.get("customer_id", f"CUST_{i}_BRA")[:20]
            city = row.get("customer_city", "Unknown")
            state = row.get("customer_state", "Unknown")
            # Create Customer object with Kaggle data
            try:
                cust = Customer(cid, f"Customer {i}", f"cust{i}@test.com", city, "BR", date(1990,1,1))
                kaggle_customers.append(cust)
            except Exception as e:
                print(f"  Skipping {cid}: {e}")
    for kc in kaggle_customers:
        print(f"  {kc}")
    print(f"Loaded {len(kaggle_customers)} Kaggle customers into OOP models")
else:
    print(f"\nDownload Kaggle dataset https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce")
    print(f"Place olist_customers_dataset.csv here to test loading real IDs into classes")
    print(f"Also: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final for Superstore")
```

**Deliverable:** Upload `store_models_L16.py` showing:
- 4 Store objects LAG_001_Ikeja, LAG_002_Lekki, LDN_001_Camden, ABJ_001_Garki with city, country, SLA, tax
- 3 Product objects with low stock check
- 3 Customer objects CUST_101_LAG, CUST_102_LDN, CUST_103_ABJ with age and location
- 2 Order objects linking product, customer, store with total including tax
- If Kaggle downloaded, 5 Kaggle customers loaded into Customer class from olist_customers_dataset.csv

**Kaggle Links:**
1. Primary: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce (customer_id, customer_city, customer_state, geolocation - map to your Lagos/London store model)
2. Secondary: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final (Customer ID, Order ID, City, State, Sales - build Product/Customer from it)
3. Tertiary: https://www.kaggle.com/datasets/carrie1/ecommerce-data (CustomerID, StockCode, Country, Quantity, UnitPrice - perfect for Product/Customer/Order classes)

## 4. Checklist

- Can you create Product class with validation for product_id pattern MSE-BLK-001, price >0, stock >=0, store_id LAG_001_Ikeja?
- Can you create Store class with LOCATIONS dict for Ikeja, Lekki, VI, Camden, Garki with address, SLA, tax, and full_location property?
- Can you create Customer class with CUST_101_LAG validation, age property, is_vip based on orders, total_spent?
- Can you create Order class linking product, customer, store with total property including tax and discount and is_late checking SLA?
- Can you enforce rules: price negative raises ValueError, unknown store_id raises, invalid customer_id raises?
- Can you load Kaggle Olist customers into your Customer class and print 5?
- Can you explain why class better than dict for preventing bad data and adding methods?

If yes, you can model real store data with OOP.

Next: Iterators, Comprehensions and Generators.

**Key Takeaway:** Dict allows any bad data. Class validates at __init__ for IDs like CUST_101_LAG, ORD_LAG_001_5001, store LAG_001_Ikeja, price >0. Centralizes business logic: tax per location (Lagos 7.5% vs London 20%), SLA per store, low stock, age, total with discount. One place to fix, all orders use it. Use classes for Product, Store, Customer, Order when data has rules and calculations.
