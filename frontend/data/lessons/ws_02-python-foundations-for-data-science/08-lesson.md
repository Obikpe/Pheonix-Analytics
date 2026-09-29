# Lesson 08 - Strings - Cleaning Dirty Data

**Duration:** 60 min | **Level:** Beginner | **Goal:** Clean messy text data that breaks reports

## Learning Objectives
- Clean names, emails, phones, and prices that come dirty from forms and CSVs.
- Use string methods and slicing to extract and standardize text.
- Build reusable cleaning functions for real world datasets.

---

## 1. Why Strings Are 80% of Cleaning Work

<svg width="100%" height="190" viewBox="0 0 700 190" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="190" rx="16" fill="#FFFFFF"/>
  <text x="350" y="28" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">DIRTY DATA IN REAL FORMS</text>
  <rect x="20" y="50" width="200" height="120" rx="12" fill="#FEE2E2" stroke="#991B1B" stroke-width="1.5"/>
  <text x="120" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#7F1D1D">WHAT YOU GET</text>
  <text x="35" y="90" font-family="Arial" font-size="9" fill="#7F1D1D">"  ALEX johnson  "</text>
  <text x="35" y="105" font-family="Arial" font-size="9" fill="#7F1D1D">"alex@TEST.com "</text>
  <text x="35" y="120" font-family="Arial" font-size="9" fill="#7F1D1D">"(555) 123-4567"</text>
  <text x="35" y="135" font-family="Arial" font-size="9" fill="#7F1D1D">"$199.99 USD"</text>
  <text x="35" y="150" font-family="Arial" font-size="9" fill="#7F1D1D">"" , None, "N/A"</text>
  <rect x="250" y="50" width="200" height="120" rx="12" fill="#DBEAFE" stroke="#1E40AF" stroke-width="1.5"/>
  <text x="350" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#1E3A8A">PROBLEM</text>
  <text x="265" y="90" font-family="Arial" font-size="9" fill="#1E3A8A">Alex != alex != ALEX</text>
  <text x="265" y="105" font-family="Arial" font-size="9" fill="#1E3A8A">Duplicate customers</text>
  <text x="265" y="120" font-family="Arial" font-size="9" fill="#1E3A8A">Cannot sum prices</text>
  <text x="265" y="135" font-family="Arial" font-size="9" fill="#1E3A8A">Email fails to send</text>
  <text x="265" y="150" font-family="Arial" font-size="9" fill="#1E3A8A">Phone cannot dial</text>
  <rect x="480" y="50" width="200" height="120" rx="12" fill="#D1FAE5" stroke="#065F46" stroke-width="1.5"/>
  <text x="580" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#064E3B">CLEANED</text>
  <text x="495" y="90" font-family="Arial" font-size="9" fill="#064E3B">"Alex Johnson"</text>
  <text x="495" y="105" font-family="Arial" font-size="9" fill="#064E3B">"alex@test.com"</text>
  <text x="495" y="120" font-family="Arial" font-size="9" fill="#064E3B">"5551234567"</text>
  <text x="495" y="135" font-family="Arial" font-size="9" fill="#064E3B">"199.99" -> 199.99</text>
  <text x="495" y="150" font-family="Arial" font-size="9" fill="#064E3B">None for missing</text>
</svg>

Real data entry is messy. Customers type names with spaces, caps lock on, emails with typos, phones with brackets. If you do not clean strings, your reports show 3 different Alex Johnsons and total sales fails because price is "$199.99" not 199.99.

## 2. Core String Methods - Your Daily Tools

**strip(), lower(), upper(), title() - Whitespace and case:**

```
name = "  alex JOHNSON  "
print(name.strip())  # "alex JOHNSON" - removes start and end spaces
print(name.strip().lower())  # "alex johnson"
print(name.strip().title())  # "Alex Johnson" - title case for names

# Real world - clean list of names
raw_names = ["  alex johnson  ", "SAM LEE", "  maria Garcia ", ""]
cleaned_names = []
for n in raw_names:
    if n.strip() == "":
        continue
    cleaned_names.append(n.strip().title())

print(cleaned_names)  # ['Alex Johnson', 'Sam Lee', 'Maria Garcia']
```

`strip()` is most used method in data cleaning. Always strip first.

**replace() - Remove symbols:**

```
price = "$199.99 USD"
clean = price.replace("$", "").replace("USD", "").strip()
print(clean)  # "199.99"
print(float(clean))  # 199.99

phone = "(555) 123-4567"
clean_phone = phone.replace("(", "").replace(")", "").replace("-", "").replace(" ", "")
print(clean_phone)  # "5551234567"
```

Chain replace for multiple symbols.

**split() and join() - Break and rebuild:**

```
full_name = "Alex Johnson"
parts = full_name.split(" ")  # ["Alex", "Johnson"]
print(parts[0])  # First name
print(parts[1])  # Last name

# Email split
email = "alex@test.com"
username, domain = email.split("@")
print(username)  # alex
print(domain)  # test.com

# Rebuild
words = ["Wireless", "Mouse", "Black"]
product = " ".join(words)  # "Wireless Mouse Black"
print(product)

# CSV line split
csv_line = "Mouse,25.99,2"
product, price, qty = csv_line.split(",")
print(product, price, qty)
```

**startswith(), endswith(), in - Check content:**

```
email = "alex@test.com"
print(email.endswith("@test.com"))  # True
print(email.startswith("alex"))  # True
print("@" in email)  # True

filename = "sales_january.csv"
if filename.endswith(".csv"):
    print("This is CSV file")

if "Mouse" in "Wireless Mouse Black":
    print("Contains Mouse")
```

**isdigit(), isalpha(), isalnum() - Check type:**

```
print("123".isdigit())  # True
print("Alex".isalpha())  # True
print("Alex123".isalnum())  # True
print("Alex Johnson".isalpha())  # False because space
```

Useful for validating phone contains only digits.

## 3. Slicing - Extract Parts

```
text = "Order-12345-2024"
print(text[0:5])  # "Order" - first 5 chars
print(text[6:11])  # "12345" - extract order number
print(text[-4:])  # "2024" - last 4 chars year
print(text[:5])  # Same as 0:5
print(text[6:])  # From 6 to end

# Real world - extract year from date string
date_str = "2024-01-15"
year = date_str[0:4]  # "2024"
month = date_str[5:7]  # "01"
day = date_str[8:10]  # "15"
print(year, month, day)

# Phone - get area code
phone = "5551234567"
area = phone[0:3]  # "555"
print(area)
```

## 4. Real World Cleaning Functions

**Real World Example 1 - Clean Customer Name:**

Names come as "  ALEX johnson  ", "sam lee-smith", empty.

```
def clean_name(name):
    if name is None:
        return None
    if not isinstance(name, str):
        return None
    
    cleaned = name.strip()
    
    if cleaned == "" or cleaned.lower() in ["n/a", "na", "null", "none"]:
        return None
    
    # Title case but keep hyphen names correct
    # "sam lee-smith" -> "Sam Lee-Smith"
    parts = cleaned.split(" ")
    titled_parts = []
    for part in parts:
        if "-" in part:
            subparts = part.split("-")
            titled = "-".join([s.title() for s in subparts])
            titled_parts.append(titled)
        else:
            titled_parts.append(part.title())
    
    result = " ".join(titled_parts)
    # Remove extra spaces inside
    result = " ".join(result.split())
    
    return result

print(clean_name("  alex JOHNSON  "))  # Alex Johnson
print(clean_name("sam lee-smith"))  # Sam Lee-Smith
print(clean_name("  "))  # None
print(clean_name("N/A"))  # None
print(clean_name(None))  # None
```

**Real World Example 2 - Clean Email:**

```
def clean_email(email):
    if email is None:
        return None
    
    if not isinstance(email, str):
        return None
    
    cleaned = email.strip().lower()
    
    if cleaned == "" or cleaned in ["n/a", "na"]:
        return None
    
    if "@" not in cleaned:
        return None
    
    if "." not in cleaned.split("@")[-1]:
        return None
    
    # Remove spaces inside email - common typo "alex @ test.com"
    cleaned = cleaned.replace(" ", "")
    
    return cleaned

print(clean_email("  Alex@TEST.COM  "))  # alex@test.com
print(clean_email("alex @ test.com"))  # alex@test.com
print(clean_email("invalid"))  # None
print(clean_email("alex@test"))  # None - no dot in domain
```

**Real World Example 3 - Clean Phone Number:**

Phones come as "(555) 123-4567", "555-123-4567", "555 123 4567", "+1 555 123 4567"

```
def clean_phone(phone):
    if phone is None:
        return None
    
    if not isinstance(phone, str):
        phone = str(phone)
    
    # Keep only digits
    digits = "".join([c for c in phone if c.isdigit()])
    
    if digits == "":
        return None
    
    # Handle country code - if 11 digits starting with 1, remove first
    if len(digits) == 11 and digits.startswith("1"):
        digits = digits[1:]
    
    # Valid US number should be 10 digits now
    if len(digits) != 10:
        return None  # Invalid length
    
    return digits

print(clean_phone("(555) 123-4567"))  # 5551234567
print(clean_phone("555-123-4567"))  # 5551234567
print(clean_phone("+1 555 123 4567"))  # 5551234567
print(clean_phone("123"))  # None
print(clean_phone("abc"))  # None

# Format back for display
def format_phone(digits):
    if digits is None or len(digits) != 10:
        return None
    return f"({digits[0:3]}) {digits[3:6]}-{digits[6:10]}"

print(format_phone("5551234567"))  # (555) 123-4567
```

**Real World Example 4 - Clean Price:**

```
def clean_price(price):
    if price is None:
        return None
    
    if isinstance(price, (int, float)):
        return float(price)
    
    if not isinstance(price, str):
        return None
    
    cleaned = price.strip()
    
    if cleaned.lower() in ["", "n/a", "na", "null", "free"]:
        return None
    
    # Remove currency symbols and words
    for symbol in ["$", "USD", "usd", ",", " "]:
        cleaned = cleaned.replace(symbol, "")
    
    try:
        value = float(cleaned)
        return value
    except ValueError:
        return None

print(clean_price("$199.99"))  # 199.99
print(clean_price("199.99 USD"))  # 199.99
print(clean_price("1,299.99"))  # 1299.99
print(clean_price(199.99))  # 199.99 already number
print(clean_price("N/A"))  # None
```

**Real World Example 5 - Clean Product Category:**

Categories come as "electronics", "ELECTRONICS", " Elec ", "elec.", Should be standardized.

```
def clean_category(cat):
    if cat is None:
        return None
    
    cleaned = cat.strip().lower()
    
    # Map variations to standard
    mapping = {
        "electronics": "Electronics",
        "elec": "Electronics",
        "elec.": "Electronics",
        "accessories": "Accessories",
        "acc": "Accessories",
        "display": "Display",
        "monitors": "Display"
    }
    
    # Remove extra punctuation
    cleaned_key = cleaned.replace(".", "")
    
    return mapping.get(cleaned_key, cleaned.title())

print(clean_category("  ELECTRONICS "))  # Electronics
print(clean_category("elec."))  # Electronics
print(clean_category("acc"))  # Accessories
```

Mapping dictionary standardizes many variations to one value. Critical for grouping.

## 5. F-Strings for Reports

Build clean reports after cleaning.

```
name = clean_name("  alex johnson  ")
email = clean_email("ALEX@TEST.COM")
phone = clean_phone("(555) 123-4567")

report = f"Customer: {name} | Email: {email} | Phone: {format_phone(phone)}"
print(report)
# Customer: Alex Johnson | Email: alex@test.com | Phone: (555) 123-4567

# Aligned table
products = [("Mouse", 25.99), ("Keyboard", 45.00)]
for prod, price in products:
    print(f"{prod:15} | ${price:8.2f}")
```

`:15` width, `:8.2f` float with 2 decimals. Makes reports readable.

## 6. Hands-On Task

Create file `data_cleaner.py`:

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
    if "@" not in cleaned or "." not in cleaned.split("@")[-1]:
        return None
    return cleaned

def clean_price(price):
    if price is None:
        return None
    if isinstance(price, (int, float)):
        return float(price)
    cleaned = price.replace("$","").replace("USD","").replace(",","").strip()
    try:
        return float(cleaned)
    except:
        return None

# Messy customer data from form
raw_customers = [
    {"name": "  alex johnson  ", "email": "ALEX@TEST.COM ", "price": "$25.99"},
    {"name": "SAM LEE", "email": "sam @ test.com", "price": "45.00 USD"},
    {"name": "  ", "email": "invalid", "price": "N/A"},
    {"name": "maria garcia", "email": "Maria@test.com", "price": "$1,299.99"},
    {"name": None, "email": None, "price": None}
]

cleaned_customers = []

for raw in raw_customers:
    cleaned = {
        "name": clean_name(raw["name"]),
        "email": clean_email(raw["email"]),
        "price": clean_price(raw["price"])
    }
    # Only keep if at least name is valid
    if cleaned["name"] is not None:
        cleaned_customers.append(cleaned)
    else:
        print(f"Skipping invalid row: {raw}")

print("\nCleaned customers:")
for cust in cleaned_customers:
    print(f"  {cust['name']:15} | {cust['email']:20} | ${cust['price']}")

print(f"\nCleaned {len(cleaned_customers)} of {len(raw_customers)} rows")
```

Run it. See how 5 messy rows become 3 clean rows ready for analysis. This is daily work.

## 7. Checklist

- Can you use strip(), lower(), title() to clean names and skip empty?
- Can you use replace() chain to remove $, USD, commas from prices?
- Can you use split() to get first name, domain from email, and join() to rebuild?
- Can you slice text to extract year from date string?
- Can you build clean_name, clean_email, clean_phone, clean_price handling None, N/A, spaces, symbols?
- Can you use mapping dict to standardize category variations to one value?
- Can you build f-string report with aligned columns?

If yes, you can clean 80% of text mess that breaks analysis.

Next: Files - Reading CSV and Excel without breaking on messy data.

**Key Takeaway:** Real data is dirty - spaces, caps, symbols, missing. Always strip first, then lower or title, then remove symbols with replace, then validate. Build small cleaning functions that return None for bad data and handle edge cases. Use mapping dict to standardize categories. Clean once, reuse everywhere.
