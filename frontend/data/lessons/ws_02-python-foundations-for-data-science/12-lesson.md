# Lesson 12 - First Python Package

**Duration:** 60 min | **Level:** Beginner | **Goal:** Turn your toolbox into installable package you can reuse in any project

## Learning Objectives
- Turn modules into installable package with setup file.
- Understand pip install -e for local development.
- Build and share your cleaning toolbox across projects without copy-paste.

---

## 1. Why Packages Matter

<svg width="100%" height="190" viewBox="0 0 700 190" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="190" rx="16" fill="#FFFFFF"/>
  <text x="350" y="28" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">FROM COPY-PASTE TO PACKAGE</text>
  <rect x="20" y="50" width="200" height="120" rx="12" fill="#FEE2E2" stroke="#991B1B" stroke-width="1.5"/>
  <text x="120" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#7F1D1D">COPY-PASTE</text>
  <text x="35" y="90" font-family="Arial" font-size="9" fill="#7F1D1D">Project A has cleaning.py</text>
  <text x="35" y="105" font-family="Arial" font-size="9" fill="#7F1D1D">Project B copy cleaning.py</text>
  <text x="35" y="120" font-family="Arial" font-size="9" fill="#7F1D1D">Fix bug in A, B still broken</text>
  <text x="35" y="135" font-family="Arial" font-size="9" fill="#7F1D1D">5 projects = 5 copies</text>
  <text x="35" y="150" font-family="Arial" font-size="9" font-weight="700" fill="#991B1B">Maintenance nightmare</text>
  <rect x="250" y="50" width="200" height="120" rx="12" fill="#DBEAFE" stroke="#1E40AF" stroke-width="1.5"/>
  <text x="350" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#1E3A8A">PACKAGE</text>
  <text x="265" y="90" font-family="Arial" font-size="9" fill="#1E3A8A">mytools package</text>
  <text x="265" y="105" font-family="Arial" font-size="9" fill="#1E3A8A">pip install -e . once</text>
  <text x="265" y="120" font-family="Arial" font-size="9" fill="#1E3A8A">All projects import mytools</text>
  <text x="265" y="135" font-family="Arial" font-size="9" fill="#1E3A8A">Fix once, all fixed</text>
  <text x="265" y="150" font-family="Arial" font-size="9" font-weight="700" fill="#1E40AF">One source of truth</text>
  <rect x="480" y="50" width="200" height="120" rx="12" fill="#D1FAE5" stroke="#065F46" stroke-width="1.5"/>
  <text x="580" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#064E3B">BENEFIT</text>
  <text x="495" y="90" font-family="Arial" font-size="9" fill="#064E3B">Reusable across projects</text>
  <text x="495" y="105" font-family="Arial" font-size="9" fill="#064E3B">Versioned</text>
  <text x="495" y="120" font-family="Arial" font-size="9" fill="#064E3B">Installable with pip</text>
  <text x="495" y="135" font-family="Arial" font-size="9" fill="#064E3B">Share with team</text>
  <text x="495" y="150" font-family="Arial" font-size="9" font-weight="700" fill="#065F46">Professional workflow</text>
</svg>

You built cleaning.py and calculations.py that work well. Now you start new project for different client and you copy those files again. After 5 projects, you find bug in clean_email. You must fix in 5 places and you will miss one. Package solves this - one place, all projects use it.

Package = folder with __init__.py that can be installed with pip.

## 2. Building Your First Package

**Real World Example 1 - Package structure:**

```
mytools/
  setup.py                # install info
  README.md
  mytools/                # package folder same name as project
    __init__.py           # makes it package
    cleaning.py
    calculations.py
    file_handler.py
```

Create structure:

```
mkdir mytools
mkdir mytools/mytools
touch mytools/setup.py
touch mytools/mytools/__init__.py
touch mytools/mytools/cleaning.py
touch mytools/mytools/calculations.py
touch mytools/mytools/file_handler.py
touch mytools/README.md
```

File `mytools/mytools/cleaning.py`:

```
def clean_name(name):
    if not name or not isinstance(name, str):
        return None
    cleaned = name.strip()
    if cleaned.lower() in ["", "n/a", "na", "null"]:
        return None
    return " ".join([p.title() for p in cleaned.split()])

def clean_email(email):
    if not email or not isinstance(email, str):
        return None
    cleaned = email.strip().lower().replace(" ", "")
    if "@" not in cleaned:
        return None
    if "." not in cleaned.split("@")[-1]:
        return None
    return cleaned

def clean_price(price):
    if price is None:
        return None
    if isinstance(price, (int, float)):
        return float(price)
    cleaned = str(price).replace("$","").replace(",","").replace("USD","").strip()
    try:
        val = float(cleaned)
        if val <= 0:
            return None
        return val
    except:
        return None

def clean_phone(phone):
    if not phone:
        return None
    digits = "".join([c for c in str(phone) if c.isdigit()])
    if len(digits) == 11 and digits.startswith("1"):
        digits = digits[1:]
    if len(digits) != 10:
        return None
    return digits
```

File `mytools/mytools/calculations.py`:

```
def calculate_total(price, qty, tax_rate=0.08):
    if price is None or qty is None:
        return None
    try:
        subtotal = float(price) * int(qty)
        return round(subtotal * (1 + tax_rate), 2)
    except:
        return None

def calculate_discount(price, qty, is_vip=False):
    if price is None or qty is None:
        return None, 0
    
    try:
        qty = int(qty)
        price = float(price)
    except:
        return None, 0
    
    if is_vip and qty >= 10:
        rate = 0.20
    elif qty >= 20:
        rate = 0.15
    elif qty >= 10:
        rate = 0.10
    elif is_vip:
        rate = 0.05
    else:
        rate = 0
    
    final = round(price * qty * (1 - rate), 2)
    return final, rate

def calculate_margin(sales, cost):
    try:
        if float(sales) == 0:
            return 0
        profit = float(sales) - float(cost)
        return round((profit / float(sales)) * 100, 2)
    except:
        return None
```

File `mytools/mytools/file_handler.py`:

```
import csv
import os
import json

def read_csv(filepath):
    if not os.path.exists(filepath):
        return [], f"File not found: {filepath}"
    
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = list(reader)
            return rows, None
    except Exception as e:
        return [], str(e)

def write_csv(filepath, data, fieldnames):
    try:
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)
        return True, None
    except Exception as e:
        return False, str(e)
```

File `mytools/mytools/__init__.py` - controls what is importable:

```
# This file makes mytools a package
# You can control what users can import

from .cleaning import clean_name, clean_email, clean_price, clean_phone
from .calculations import calculate_total, calculate_discount, calculate_margin
from .file_handler import read_csv, write_csv

__version__ = "0.1.0"

# Now user can do: from mytools import clean_name
# Instead of: from mytools.cleaning import clean_name
```

File `mytools/setup.py`:

```
from setuptools import setup, find_packages

setup(
    name="mytools",
    version="0.1.0",
    description="My data cleaning and calculation toolbox",
    author="Your Name",
    author_email="your@email.com",
    packages=find_packages(),
    python_requires=">=3.8",
    install_requires=[],  # Add pandas etc if needed
)

# find_packages() finds all folders with __init__.py
# name is what pip install will use
# version helps track changes
```

File `mytools/README.md`:

```
# MyTools

Reusable toolbox for data cleaning and calculations.

## Install for development
pip install -e .

## Use
from mytools import clean_name, clean_price, calculate_total

clean_name("  alex johnson  ") -> Alex Johnson
clean_price("$25.99") -> 25.99
calculate_total(25.99, 2) -> 56.14

## Structure
- cleaning.py - clean_name, clean_email, clean_price, clean_phone
- calculations.py - calculate_total, calculate_discount, calculate_margin
- file_handler.py - read_csv, write_csv
```

## 3. Installing Package in Editable Mode

**Real World Example 2 - Install and use:**

From inside `mytools/` folder where setup.py is:

```
# Create venv if not exists
python -m venv venv
venv\Scripts\activate  # Windows
# or source venv/bin/activate # Mac/Linux

# Install your package in editable mode
pip install -e .

# What -e does: Creates link, not copy
# When you edit mytools/mytools/cleaning.py, changes work immediately
# No need to reinstall after each edit

# Test install
pip list | grep mytools  # Should show mytools 0.1.0

# Now use in any Python file anywhere
python -c "from mytools import clean_name; print(clean_name('  alex johnson  '))"
# Alex Johnson
```

Editable mode is for development. When you edit source files, installed package updates automatically. Without -e, you would need reinstall after each change.

**Real World Example 3 - Use package in different project:**

```
# Create new project
mkdir client_project
cd client_project
python -m venv venv
venv\Scripts\activate
pip install -e ../mytools

# Create main.py in client_project
# File main.py:
from mytools import clean_name, clean_price, calculate_total, read_csv

rows, err = read_csv("../data/sales.csv")
# Or with your own data

for row in rows:
    name = clean_name(row["customer"])
    price = clean_price(row["price"])
    total = calculate_total(price, row["qty"])
    print(name, total)
```

Now both projects use same mytools package. Fix bug in mytools/cleaning.py once, both projects get fix.

## 4. Versioning and Updating

**Real World Example 4 - Update package version:**

You add new function clean_category.

File `mytools/mytools/cleaning.py` add:

```
def clean_category(cat):
    if not cat:
        return None
    mapping = {
        "electronics": "Electronics",
        "elec": "Electronics",
        "accessories": "Accessories",
        "acc": "Accessories",
        "display": "Display"
    }
    key = cat.strip().lower().replace(".","")
    return mapping.get(key, cat.strip().title())
```

Update `mytools/mytools/__init__.py`:

```
from .cleaning import clean_name, clean_email, clean_price, clean_phone, clean_category
```

Update `mytools/setup.py` version to 0.2.0:

```
version="0.2.0",
```

Reinstall:

```
pip install -e . --upgrade
```

Now all projects can use clean_category.

```
from mytools import clean_category
print(clean_category("elec"))  # Electronics
```

This is how professional teams share tools.

## 5. Publishing Concepts - Local vs Real

For now you use local install with -e . For team, you can share mytools folder or push to private git.

Future steps (not required now):
- Build wheel: `python -m build`
- Publish to PyPI: `twine upload dist/*` - then anyone can pip install mytools
- For now, local is enough and professional.

## 6. Hands-On Task - Build and Use Your Package

Step 1: Build package structure as above with 3 modules.

Step 2: Install:

```
cd mytools
pip install -e .
```

Step 3: Create test script `test_mytools.py` outside mytools folder:

```
from mytools import clean_name, clean_email, clean_price, clean_phone, calculate_total, calculate_discount, calculate_margin

# Real world test data
customers = [
    {"name": "  alex johnson  ", "email": "ALEX@TEST.COM ", "price": "$25.99", "qty": 2, "is_vip": True},
    {"name": "SAM LEE", "email": "sam @ test.com", "price": "45.00 USD", "qty": 15, "is_vip": False},
    {"name": "  ", "email": "invalid", "price": "N/A", "qty": 1, "is_vip": False},
]

print("Testing mytools package")
print("="*40)

for cust in customers:
    name = clean_name(cust["name"])
    email = clean_email(cust["email"])
    price = clean_price(cust["price"])
    
    if not name or not price:
        print(f"Skipping invalid: {cust}")
        continue
    
    total, discount_rate = calculate_discount(price, cust["qty"], cust["is_vip"])
    margin = calculate_margin(total, total * 0.7)
    
    print(f"{name:15} | {email:20} | Price ${price} Qty {cust['qty']} | Total ${total} Discount {discount_rate*100}% Margin {margin}%")

print("="*40)
print("Package works!")
```

Run: `python test_mytools.py`

Step 4: Create second project `another_project/` that also uses mytools:

```
mkdir another_project
cd another_project
pip install -e ../mytools

# Create main.py that uses mytools to process different data
from mytools import read_csv, write_csv, clean_name, calculate_total

# Simulate different client data
orders = [
    {"customer": "maria garcia", "product": "Monitor", "price": "$199.99", "qty": 1},
    {"customer": "lee chen", "product": "Mouse", "price": "25.99", "qty": 5}
]

cleaned = []
for o in orders:
    cleaned.append({
        "customer": clean_name(o["customer"]),
        "product": o["product"],
        "total": calculate_total(clean_price(o["price"]), o["qty"])
    })

print(cleaned)
print("Reused same package in different project without copy-paste!")
```

You now have one toolbox used in two projects. Fix bug once, both benefit.

## 7. Checklist

- Can you create package structure mytools/mytools with __init__.py, cleaning.py, calculations.py, file_handler.py, setup.py?
- Can you write __init__.py that imports functions so users can do from mytools import clean_name?
- Can you write setup.py with name, version, find_packages()?
- Can you install with pip install -e . and understand editable mode means edits apply instantly?
- Can you use package in different project without copying files?
- Can you add new function clean_category, bump version to 0.2.0, and reinstall with --upgrade?
- Can you explain why package is better than copy-paste for 5 projects?

If yes, you built your first Python package like professional data scientist. Your toolbox is now reusable across all future work.

Next: Final capstone - Build complete data pipeline using your package.

**Key Takeaway:** Copy-paste across projects leads to 5 copies with bugs. Package is one folder with __init__.py and setup.py, installed with pip install -e . All projects import from mytools, fix once applies everywhere. Use __init__.py to expose clean API, bump version when adding features, reinstall with --upgrade. This is how professionals share tools across team and projects.
