# Lesson 11 - Modules and Project Structure

**Duration:** 60 min | **Level:** Beginner | **Goal:** Organize code like a professional team so it scales

## Learning Objectives
- Split code into modules and import them cleanly.
- Build a professional project structure with data, src, and tests folders.
- Use if __name__ == "__main__" to make modules reusable as both script and library.

---

## 1. Why Project Structure Matters

<svg width="100%" height="190" viewBox="0 0 700 190" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="190" rx="16" fill="#FFFFFF"/>
  <text x="350" y="28" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">ONE FILE vs ORGANIZED PROJECT</text>
  <rect x="20" y="50" width="300" height="120" rx="12" fill="#FEE2E2" stroke="#991B1B" stroke-width="1.5"/>
  <text x="170" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#7F1D1D">ONE FILE - 500 lines</text>
  <text x="35" y="90" font-family="Arial" font-size="9" fill="#7F1D1D">clean_email() + clean_price()</text>
  <text x="35" y="105" font-family="Arial" font-size="9" fill="#7F1D1D">+ read_csv() + calc_total()</text>
  <text x="35" y="120" font-family="Arial" font-size="9" fill="#7F1D1D">+ all code mixed</text>
  <text x="35" y="135" font-family="Arial" font-size="9" fill="#7F1D1D">Hard to find, hard to test</text>
  <text x="35" y="150" font-family="Arial" font-size="9" font-weight="700" fill="#991B1B">Change one breaks all</text>
  <rect x="380" y="50" width="300" height="120" rx="12" fill="#D1FAE5" stroke="#065F46" stroke-width="1.5"/>
  <text x="530" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#064E3B">ORGANIZED - modules</text>
  <text x="395" y="90" font-family="Arial" font-size="9" fill="#064E3B">cleaning.py -> clean functions</text>
  <text x="395" y="105" font-family="Arial" font-size="9" fill="#064E3B">files.py -> read/write</text>
  <text x="395" y="120" font-family="Arial" font-size="9" fill="#064E3B">calculations.py -> business logic</text>
  <text x="395" y="135" font-family="Arial" font-size="9" fill="#064E3B">main.py -> uses all</text>
  <text x="395" y="150" font-family="Arial" font-size="9" font-weight="700" fill="#065F46">Change one, test one</text>
</svg>

When your code grows beyond 100 lines, one file becomes impossible to maintain. You forget where clean_email is, you copy it to new project, you fix bug in one place but not other. Modules solve this.

Module = Python file with functions. You import it.

## 2. Creating and Importing Modules

**Real World Example 1 - Create cleaning module:**

File `cleaning.py`:

```
def clean_name(name):
    if not name or not isinstance(name, str):
        return None
    cleaned = name.strip()
    if cleaned.lower() in ["", "n/a", "na"]:
        return None
    return " ".join([p.title() for p in cleaned.split()])

def clean_email(email):
    if not email or not isinstance(email, str):
        return None
    cleaned = email.strip().lower().replace(" ", "")
    if "@" not in cleaned:
        return None
    return cleaned

def clean_price(price):
    if price is None:
        return None
    if isinstance(price, (int, float)):
        return float(price)
    cleaned = str(price).replace("$","").replace(",","").strip()
    try:
        return float(cleaned)
    except:
        return None
```

File `main.py` in same folder:

```
import cleaning

print(cleaning.clean_name("  alex johnson  "))  # Alex Johnson
print(cleaning.clean_email("ALEX@TEST.COM "))  # alex@test.com
print(cleaning.clean_price("$25.99"))  # 25.99

# Or import specific functions
from cleaning import clean_name, clean_price

print(clean_name("sam lee"))  # Sam Lee
```

`import cleaning` loads entire file as module. `from cleaning import clean_name` loads only one function.

**Real World Example 2 - Module with calculations:**

File `calculations.py`:

```
def calculate_total(price, qty, tax_rate=0.08):
    subtotal = price * qty
    return subtotal * (1 + tax_rate)

def calculate_discount(price, qty, is_vip=False):
    if is_vip and qty >= 10:
        rate = 0.20
    elif qty >= 20:
        rate = 0.15
    elif qty >= 10:
        rate = 0.10
    else:
        rate = 0
    return price * (1 - rate), rate

def calculate_margin(sales, cost):
    if sales == 0:
        return 0
    return round(((sales - cost) / sales) * 100, 2)
```

File `main.py`:

```
import cleaning
import calculations

# Use both modules together
raw_name = "  alex johnson  "
raw_price = "$100"
qty = 5

name = cleaning.clean_name(raw_name)
price = cleaning.clean_price(raw_price)

total, rate = calculations.calculate_discount(price, qty, is_vip=True)

print(f"{name} - Price ${price} Qty {qty} Discount {rate*100}% Total ${total}")
```

Now cleaning and calculations are separate, reusable in any project.

**Real World Example 3 - Import with alias:**

```
import calculations as calc
import cleaning as cl

# Shorter names
price = cl.clean_price("$25.99")
total = calc.calculate_total(price, 2)

print(total)
```

Alias useful for long module names.

## 3. Professional Project Structure

**Real World Example 4 - E-commerce project structure:**

```
sales_project/
  venv/                 # virtual environment - do not edit
  data/
    raw/                # original CSVs never edited
      sales_jan.csv
      sales_feb.csv
    processed/          # cleaned CSVs
      clean_sales.csv
  src/                  # your code
    __init__.py         # makes src a package
    cleaning.py         # clean functions
    calculations.py     # business logic
    file_handler.py     # read/write CSV, JSON
    reports.py          # generate reports
  main.py               # entry point - uses src modules
  requirements.txt      # pip freeze > requirements.txt
  README.md             # how to run project
```

Create this structure:

```
mkdir -p sales_project/data/raw
mkdir -p sales_project/data/processed
mkdir -p sales_project/src
touch sales_project/src/__init__.py
touch sales_project/main.py
touch sales_project/requirements.txt
```

File `src/file_handler.py`:

```
import csv
import os
import json

def read_csv_safe(filepath):
    if not os.path.exists(filepath):
        return [], f"File not found: {filepath}"
    
    valid = []
    errors = []
    
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for line_num, row in enumerate(reader, start=2):
                valid.append(row)
    except Exception as e:
        return [], f"Error reading {filepath}: {e}"
    
    return valid, None

def write_csv(filepath, data, fieldnames):
    try:
        with open(filepath, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(data)
        return True, None
    except Exception as e:
        return False, str(e)

def write_json(filepath, data):
    try:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        return True, None
    except Exception as e:
        return False, str(e)
```

File `main.py`:

```
from src import cleaning, calculations, file_handler

# Real workflow using modules
raw_data = [
    {"product": "  mouse  ", "price": "$25.99", "qty": "2", "customer": "alex johnson"},
    {"product": "Keyboard", "price": "45.00", "qty": "1", "customer": "sam lee"}
]

cleaned_orders = []

for raw in raw_data:
    name = cleaning.clean_name(raw["customer"])
    price = cleaning.clean_price(raw["price"])
    
    if name is None or price is None:
        print(f"Skipping bad row {raw}")
        continue
    
    try:
        qty = int(raw["qty"])
        total = calculations.calculate_total(price, qty)
        cleaned_orders.append({
            "customer": name,
            "product": raw["product"].strip().title(),
            "total": total
        })
    except Exception as e:
        print(f"Error processing {raw}: {e}")

print(cleaned_orders)
```

Run from project root: `python main.py`

Benefits: Each file does one job, easy to find, easy to test, easy to reuse.

## 4. The if __name__ == "__main__" Pattern

**Real World Example 5 - Make module testable and importable:**

File `cleaning.py`:

```
def clean_name(name):
    if not name or not isinstance(name, str):
        return None
    cleaned = name.strip()
    if cleaned.lower() in ["", "n/a"]:
        return None
    return " ".join([p.title() for p in cleaned.split()])

def clean_price(price):
    if isinstance(price, (int, float)):
        return float(price)
    cleaned = str(price).replace("$","").replace(",","").strip()
    try:
        return float(cleaned)
    except:
        return None

# This code runs only when you run cleaning.py directly
# It does NOT run when you import cleaning from main.py
if __name__ == "__main__":
    print("Testing cleaning module")
    print(clean_name("  alex johnson  "))  # Should be Alex Johnson
    print(clean_price("$25.99"))  # Should be 25.99
    print(clean_price("N/A"))  # Should be None
    print("All tests done")
```

When you run `python src/cleaning.py`, the test code runs.

When you run `python main.py` that imports cleaning, test code does NOT run, only functions are imported.

This pattern lets you:
- Test module alone without running entire project
- Keep module clean when imported
- Have example usage inside module file

**Real World Example 6 - main.py as entry point:**

```
from src.cleaning import clean_name, clean_price
from src.calculations import calculate_total

def main():
    # All business logic here
    orders = [
        {"customer": "  alex johnson  ", "price": "$25.99", "qty": 2},
        {"customer": "sam lee", "price": "$45.00", "qty": 1}
    ]
    
    total_revenue = 0
    for order in orders:
        name = clean_name(order["customer"])
        price = clean_price(order["price"])
        qty = order["qty"]
        
        if name and price:
            total = calculate_total(price, qty)
            total_revenue += total
            print(f"{name}: ${total:.2f}")
    
    print(f"Total revenue: ${total_revenue:.2f}")

if __name__ == "__main__":
    main()
```

Now `main()` only runs when you run `python main.py`, not when imported.

## 5. Requirements and README

**Real World Example 7 - requirements.txt:**

After installing packages:

```
pip install pandas openpyxl
pip freeze > requirements.txt
```

File `requirements.txt`:
```
pandas==2.0.3
openpyxl==3.1.2
```

New person can setup with:
```
pip install -r requirements.txt
```

**Real World Example 8 - README.md:**

```
# Sales Project

## Setup
python -m venv venv
venv\Scripts\activate (Windows) or source venv/bin/activate (Mac)
pip install -r requirements.txt

## Run
python main.py

## Structure
- data/raw - original files never edited
- data/processed - cleaned outputs
- src - cleaning, calculations, file_handler modules
- main.py - entry point

## What it does
Reads raw sales CSV, cleans names and prices, calculates totals, writes cleaned CSV and summary report.
```

README saves hours when you return after 2 weeks or share with team.

## 6. Hands-On Task - Build Full Project

Task: Create project `my_store/` with structure and modules.

Step 1: Create folders
```
mkdir -p my_store/data/raw my_store/data/processed my_store/src
```

Step 2: Create `my_store/src/cleaning.py` with clean_name, clean_email, clean_price handling None, N/A, $, spaces.

Step 3: Create `my_store/src/calculations.py` with calculate_total, calculate_discount, calculate_margin with error handling for zero sales.

Step 4: Create `my_store/src/file_handler.py` with read_csv_safe and write_csv that returns valid, error and never crashes.

Step 5: Create `my_store/data/raw/sales.csv`:
```
product,price,qty,customer
Mouse,$25.99,2,alex johnson
Keyboard,$45.00,1,Sam Lee
Monitor,$199.99,1,maria garcia
Cable,$5.99,10,Alex Johnson
```

Step 6: Create `my_store/main.py`:

```
from src.cleaning import clean_name, clean_price
from src.calculations import calculate_total
from src.file_handler import read_csv_safe, write_csv

def main():
    filepath = "data/raw/sales.csv"
    raw_rows, error = read_csv_safe(filepath)
    
    if error:
        print(f"Error: {error}")
        return
    
    cleaned = []
    for row in raw_rows:
        name = clean_name(row.get("customer"))
        price = clean_price(row.get("price"))
        
        try:
            qty = int(row.get("qty", "0"))
        except:
            print(f"Bad qty in row {row}, skipping")
            continue
        
        if not name or not price:
            print(f"Skipping row with bad data {row}")
            continue
        
        total = calculate_total(price, qty)
        cleaned.append({
            "customer": name,
            "product": row["product"].strip().title(),
            "qty": qty,
            "price": price,
            "total": total
        })
    
    # Write cleaned
    success, err = write_csv("data/processed/clean_sales.csv", cleaned, ["customer","product","qty","price","total"])
    if success:
        print(f"Wrote {len(cleaned)} clean rows to data/processed/clean_sales.csv")
    else:
        print(f"Write failed: {err}")
    
    # Summary
    total_rev = sum(c["total"] for c in cleaned)
    print(f"Total revenue: ${total_rev:.2f}")

if __name__ == "__main__":
    main()
```

Run from `my_store/` folder: `python main.py`

This is professional structure you will use for entire data career.

## 7. Checklist

- Can you create cleaning.py module and import it in main.py with import and from import?
- Can you build project structure data/raw, data/processed, src with __init__.py?
- Can you make src/file_handler.py with read_csv_safe that returns valid, error and handles file not found?
- Can you use if __name__ == "__main__" to test module alone and prevent test code running on import?
- Can you create requirements.txt with pip freeze and write README with setup and run steps?
- Can you run main.py that uses all three modules together without mixing code in one file?

If yes, you organize code like professional team. Easy to find, test, and reuse.

Next: First Python Package - Turn your toolbox into installable package.

**Key Takeaway:** One file with 500 lines is unmaintainable. Split into modules: cleaning.py for cleaning, calculations.py for business logic, file_handler.py for IO, main.py uses them. Use professional structure data/raw, data/processed, src, requirements.txt, README. Use if __name__ == "__main__" to make modules testable alone and reusable when imported. Change one module, test one module.
