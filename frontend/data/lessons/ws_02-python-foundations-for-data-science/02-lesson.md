# Lesson 02 - Setup That Works on Any Laptop

**Duration:** 45 min | **Level:** Beginner | **Goal:** Run Python today without setup hell

## Learning Objectives
- Install Python, VS Code, and create a virtual environment that works offline.
- Run your first script and notebook.
- Understand why setup breaks for many beginners in Nigeria and how to avoid it.

---

## 1. The Setup Problem

<svg width="100%" height="180" viewBox="0 0 700 180" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="180" rx="16" fill="#FFFFFF"/>
  <text x="350" y="28" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">SETUP THAT WORKS - 3 TOOLS ONLY</text>
  <rect x="20" y="50" width="200" height="110" rx="12" fill="#DBEAFE" stroke="#1E40AF" stroke-width="1.5"/>
  <text x="120" y="75" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#1E3A8A">PYTHON</text>
  <text x="35" y="95" font-family="Arial" font-size="10" fill="#1E3A8A">- Download python.org</text>
  <text x="35" y="112" font-family="Arial" font-size="10" fill="#1E3A8A">- Check Add to PATH</text>
  <text x="35" y="129" font-family="Arial" font-size="10" fill="#1E3A8A">- Version 3.11 or 3.12</text>
  <text x="35" y="146" font-family="Arial" font-size="9" font-weight="700" fill="#1E40AF">Engine</text>
  <rect x="250" y="50" width="200" height="110" rx="12" fill="#D1FAE5" stroke="#065F46" stroke-width="1.5"/>
  <text x="350" y="75" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#064E3B">VS CODE</text>
  <text x="265" y="95" font-family="Arial" font-size="10" fill="#064E3B">- Code editor</text>
  <text x="265" y="112" font-family="Arial" font-size="10" fill="#064E3B">- Free, light</text>
  <text x="265" y="129" font-family="Arial" font-size="10" fill="#064E3B">- Extensions: Python</text>
  <text x="265" y="146" font-family="Arial" font-size="9" font-weight="700" fill="#065F46">Where you type code</text>
  <rect x="480" y="50" width="200" height="110" rx="12" fill="#FEF3C7" stroke="#92400E" stroke-width="1.5"/>
  <text x="580" y="75" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#78350F">VENV</text>
  <text x="495" y="95" font-family="Arial" font-size="10" fill="#78350F">- Isolated box</text>
  <text x="495" y="112" font-family="Arial" font-size="10" fill="#78350F">- One per project</text>
  <text x="495" y="129" font-family="Arial" font-size="10" fill="#78350F">- Avoids conflict</text>
  <text x="495" y="146" font-family="Arial" font-size="9" font-weight="700" fill="#92400E">Keeps projects separate</text>
</svg>

Most beginners in Lagos waste 2 days installing Anaconda, different Python versions, and fixing PATH errors. We will use simple setup that works on low RAM laptops, slow internet, and NEPA interruptions.

You need only 3 things: Python, VS Code, and a virtual environment. No Anaconda needed for foundations.

## 2. Step by Step Installation

**Step 1 - Python:**
Go to python.org, download Python 3.11 or 3.12. During install on Windows, tick the box that says Add python.exe to PATH. This is the mistake 80 percent make. If you forget, your terminal will say python not found.

Verify: Open terminal or CMD and type:
```
python --version
```
You should see Python 3.11.x or 3.12.x

If you see error, close terminal, reopen, try python3 --version.

**Step 2 - VS Code:**
Download from code.visualstudio.com. Install. Open it. Go to Extensions on left bar, search Python, install the one by Microsoft. Also install Pylance.

Why VS Code? It is light, works offline, and you can run both .py files and notebooks inside it. No need for separate Jupyter install.

**Step 3 - Create Project Folder:**
Create folder on Desktop called python_foundations. Open that folder in VS Code: File -> Open Folder -> select python_foundations.

Inside VS Code, open terminal: View -> Terminal.

**Step 4 - Virtual Environment:**
In that terminal, type:
```
python -m venv venv
```
This creates a folder venv inside your project. It is an isolated box for your project packages.

Activate it:
- Windows: `venv\Scripts\activate`
- Mac/Linux: `source venv/bin/activate`

After activation, you will see (venv) at start of terminal line. That means you are inside the box.

Why venv? If you install pandas for this project, it stays only in this box. Next project can have different version without conflict. Without venv, you will break things when you work on multiple projects.

**Step 5 - First Script:**
Create file hello.py inside python_foundations:
```
print("Hello from Yaba!")
sales = 250000
expenses = 180000
profit = sales - expenses
print(f"Profit today is N{profit}")
```
Run in terminal:
```
python hello.py
```
You should see profit printed.

**Step 6 - First Notebook:**
Create file first.ipynb. VS Code will ask to install ipykernel - allow it. Inside first cell:
```
sales = [250000, 300000, 180000]
total = sum(sales)
print(total)
```
Run cell with Shift+Enter.

## 3. Common Errors and Fixes

**Error 1 - python not recognized:** You did not tick Add to PATH. Uninstall Python and reinstall with that box ticked. Or add manually to environment variables.

**Error 2 - No internet to pip install:** Use `pip install pandas --no-cache` or download wheel file when you have internet at cafe, then install offline with pip install file.whl. Keep a folder of wheels.

**Error 3 - VS Code says select interpreter:** Press Ctrl+Shift+P, type Python Select Interpreter, choose the one that has ./venv in its path. Not the global one.

**Error 4 - Laptop slow:** Close Chrome tabs. VS Code uses less RAM than Anaconda Navigator. Use .py files instead of notebooks when RAM is low.

**Error 5 - Light goes off:** Save often Ctrl+S. Use autosave in VS Code: File -> Auto Save ticked.

## 4. Project Structure We Will Use

From now on, every lesson project looks like this:
```
python_foundations/
  venv/           (your isolated box - do not touch)
  data/           (CSV files - sales.csv, purchases.csv)
  hello.py
  first.ipynb
  requirements.txt (list of packages)
```

To save package list:

```powershell
pip freeze > requirements.txt
```
To restore on another laptop:

```powershell
pip install -r requirements.txt
```

## 5. Checklist Before Next Lesson

- Can you run `python --version` and see version?
- Can you see (venv) in terminal?
- Can you run hello.py and see profit?
- Can you run a notebook cell?
- Do you have folder structure data/ inside project?

If yes, you are ready. Do not proceed if setup is broken. Fix it now or you will struggle for entire course.

Next lesson: We will learn how Python thinks - variables and memory with real Naira calculations.

**Key Takeaway:** Simple setup - Python + VS Code + venv - works on any laptop. Virtual environment keeps projects separate. Fix PATH once, save 2 days of headache.
