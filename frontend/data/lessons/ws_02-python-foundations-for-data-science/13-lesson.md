# Lesson 13 - Virtual Environments and Dependency Management Deep Dive

**Duration:** 60 min | **Level:** Beginner | **Goal:** Make projects reproducible and never break each other

## Learning Objectives
- Create and use venv correctly to isolate projects.
- Manage dependencies with requirements.txt and pip tools.
- Fix real world problems: version conflicts, broken installs, and reproducibility.

---

## 1. Why Virtual Environments Save Your Career

<svg width="100%" height="190" viewBox="0 0 700 190" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="190" rx="16" fill="#FFFFFF"/>
  <text x="350" y="28" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">WITHOUT vs WITH VENV</text>
  <rect x="20" y="50" width="300" height="120" rx="12" fill="#FEE2E2" stroke="#991B1B" stroke-width="1.5"/>
  <text x="170" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#7F1D1D">WITHOUT VENV - Global install</text>
  <text x="35" y="90" font-family="Arial" font-size="9" fill="#7F1D1D">Project A needs pandas 1.5</text>
  <text x="35" y="105" font-family="Arial" font-size="9" fill="#7F1D1D">Project B needs pandas 2.0</text>
  <text x="35" y="120" font-family="Arial" font-size="9" fill="#7F1D1D">pip install upgrades global</text>
  <text x="35" y="135" font-family="Arial" font-size="9" fill="#7F1D1D">Project A breaks</text>
  <text x="35" y="150" font-family="Arial" font-size="9" font-weight="700" fill="#991B1B">One project breaks all</text>
  <rect x="380" y="50" width="300" height="120" rx="12" fill="#D1FAE5" stroke="#065F46" stroke-width="1.5"/>
  <text x="530" y="70" text-anchor="middle" font-family="Arial" font-size="10" font-weight="800" fill="#064E3B">WITH VENV - Isolated</text>
  <text x="395" y="90" font-family="Arial" font-size="9" fill="#064E3B">Project A venv: pandas 1.5</text>
  <text x="395" y="105" font-family="Arial" font-size="9" fill="#064E3B">Project B venv: pandas 2.0</text>
  <text x="395" y="120" font-family="Arial" font-size="9" fill="#064E3B">Each project has own packages</text>
  <text x="395" y="135" font-family="Arial" font-size="9" fill="#064E3B">Never conflict</text>
  <text x="395" y="150" font-family="Arial" font-size="9" font-weight="700" fill="#065F46">Reproducible, safe</text>
</svg>

If you install all packages globally, your second project will break your first. Venv gives each project its own private Python and packages.

## 2. Creating and Using venv Correctly

**Real World Example 1 - Create project with venv:**

```
# Create project folder
mkdir sales_analysis
cd sales_analysis

# Create venv inside project - standard name venv or .venv
python -m venv venv

# Activate - Windows
venv\Scripts\activate

# Activate - Mac / Linux
source venv/bin/activate

# Now prompt shows (venv)
# Install packages - they go inside venv, not global
pip install pandas openpyxl

# Check where pip points
where pip  # Windows
which pip  # Mac - should show .../sales_analysis/venv/bin/pip

# Deactivate when done
deactivate
```

Rule: One venv per project, inside project folder. Always activate before pip install and before running code.

**Real World Example 2 - Common mistakes and fixes:**

Mistake 1 - Forgetting to activate:
```
pip install pandas  # Installs globally if venv not activated - wrong
```
Fix: Check prompt has (venv). If not, activate.

Mistake 2 - Creating venv with wrong Python version:
```
python -m venv venv  # Uses default python, might be 3.9 but you need 3.11
python3.11 -m venv venv  # Specify version if you have multiple
```

Mistake 3 - Committing venv to git:
```
# venv is 300MB, should never be committed
# Add to .gitignore
echo "venv/" >> .gitignore
echo "__pycache__/" >> .gitignore
echo "*.pyc" >> .gitignore
```

File `.gitignore`:
```
venv/
.venv/
__pycache__/
*.pyc
data/raw/
data/processed/
.env
```

## 3. Requirements Files - Reproducibility

**Real World Example 3 - Freeze and restore:**

After installing packages in activated venv:

```
# Save exact versions
pip freeze > requirements.txt

# File requirements.txt now:
# pandas==2.0.3
# openpyxl==3.1.2
# numpy==1.24.3
# python-dateutil==2.8.2
# etc
```

Another person or you on new laptop:

```
# Create fresh venv
python -m venv venv
venv\Scripts\activate  # or source venv/bin/activate

# Install exact same versions
pip install -r requirements.txt

# Now project works same as original
python main.py
```

**Real World Example 4 - requirements.txt best practices:**

Bad - no versions:
```
pandas
openpyxl
# Works today, breaks in 6 months when pandas 3.0 changes API
```

Good - pinned versions from freeze:
```
pandas==2.0.3
openpyxl==3.1.2
```

Better - separate base and exact:

File `requirements.in` (what you need):
```
pandas
openpyxl
```

Generate exact:
```
pip install pip-tools
pip-compile requirements.in -o requirements.txt
# Creates pinned requirements.txt with all dependencies
```

For this course, use simple `pip freeze > requirements.txt`.

**Real World Example 5 - Check for outdated and upgrade safely:**

```
# See outdated packages
pip list --outdated

# Output:
# Package    Version Latest
# pandas     2.0.3   2.1.1

# Upgrade one package in venv
pip install --upgrade pandas

# Test if project still works
python main.py

# If works, freeze new version
pip freeze > requirements.txt

# If breaks, downgrade
pip install pandas==2.0.3
```

Always upgrade inside venv, test, then freeze. Never upgrade globally.

## 4. Fixing Broken Environments

**Real World Example 6 - Recreate venv when broken:**

Sometimes venv breaks after moving folder or Python update.

```
# Delete broken venv
rm -rf venv  # Mac/Linux
rmdir /s /q venv  # Windows

# Recreate
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Since requirements.txt has all versions, you can rebuild in 2 minutes. This is why requirements.txt is critical.

**Real World Example 7 - Two projects different versions:**

```
mkdir project_a
cd project_a
python -m venv venv
venv\Scripts\activate
pip install pandas==1.5.3
pip freeze > requirements.txt
deactivate
cd ..

mkdir project_b
cd project_b
python -m venv venv
venv\Scripts\activate
pip install pandas==2.0.3
pip freeze > requirements.txt
python -c "import pandas; print(pandas.__version__)"  # 2.0.3
deactivate
cd ../project_a
venv\Scripts\activate
python -c "import pandas; print(pandas.__version__)"  # 1.5.3 - still old version, not broken
```

Each venv isolated. Professional workflow.

## 5. Hands-On Task - Reproducible Project

Task: Create `my_store` project with venv and requirements.

Step 1: Setup
```
mkdir my_store
cd my_store
python -m venv venv
# Activate
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

mkdir -p data/raw data/processed src
touch src/__init__.py
```

Step 2: Create `src/cleaning.py` with clean functions from previous lessons.

Step 3: Create `requirements.txt` manually first:
```
pandas
openpyxl
```

Step 4: Install and freeze
```
pip install -r requirements.txt
pip freeze > requirements.txt
# Now requirements.txt has pinned versions like pandas==2.0.3
```

Step 5: Create `.gitignore`:
```
venv/
__pycache__/
*.pyc
data/processed/
```

Step 6: Create `main.py`:
```
from src.cleaning import clean_name, clean_price
import pandas as pd

print("Testing venv and pandas")
print(f"Pandas version: {pd.__version__}")

data = [
    {"customer": "  alex johnson  ", "price": "$25.99"},
    {"customer": "sam lee", "price": "$45.00"}
]

df = pd.DataFrame(data)
print(df)

# Clean using your functions
df["customer"] = df["customer"].apply(clean_name)
df["price"] = df["price"].apply(clean_price)

print("Cleaned:")
print(df)
print("Project works with isolated venv!")
```

Step 7: Run
```
python main.py
```

Step 8: Simulate new laptop - delete and rebuild
```
deactivate
rm -rf venv
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py  # Should work same
```

You now have reproducible project that anyone can setup with two commands: venv creation and pip install -r requirements.txt.

## 6. Checklist

- Can you create venv with python -m venv venv and activate it (Windows vs Mac paths)?
- Can you verify pip points inside venv with which pip / where pip?
- Can you install packages inside venv and freeze to requirements.txt?
- Can you create .gitignore to avoid committing venv and processed data?
- Can you delete and recreate venv from requirements.txt when broken?
- Can you have two projects with different pandas versions without conflict?
- Can you upgrade package safely: upgrade, test, freeze?

If yes, your projects are isolated, reproducible, and professional.

Next: Working with Dates, Times and Calendars for reporting.

**Key Takeaway:** One venv per project, inside project, activated before any pip install. Save exact versions with pip freeze > requirements.txt. Never commit venv. Can delete and rebuild from requirements.txt anytime. This isolates projects so pandas 1.5 in project A and 2.0 in project B never conflict.
