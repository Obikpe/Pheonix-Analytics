# Lesson 01 - Why Python for Data Science

**Course:** ws_02 | **ID:** ws_02_l01 | **Duration:** 45 min | **Level:** Beginner | **Prereq:** ws_01

## Learning Objectives
- Decide when to use Excel vs Python vs SQL in Nigerian SME context.
- Explain why Python is the foundation for ws_03 to ws_12.
- Avoid tool worship - choose tool based on problem size, not hype.

---

## 1. The Tool Problem

<svg width="100%" height="200" viewBox="0 0 700 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="200" rx="16" fill="#FFFFFF"/>
  <rect x="20" y="20" width="200" height="160" rx="12" fill="#D1FAE5" stroke="#065F46" stroke-width="1.5"/>
  <text x="120" y="45" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#064E3B">EXCEL</text>
  <text x="35" y="70" font-family="Arial" font-size="10" fill="#064E3B">- 1k to 100k rows</text>
  <text x="35" y="88" font-family="Arial" font-size="10" fill="#064E3B">- POS, pharmacy sales</text>
  <text x="35" y="106" font-family="Arial" font-size="10" fill="#064E3B">- MD opens on phone</text>
  <text x="35" y="124" font-family="Arial" font-size="10" fill="#064E3B">- Fast for 1 file</text>
  <text x="35" y="145" font-family="Arial" font-size="9" font-weight="700" fill="#065F46">Use when: Small, quick</text>
  <rect x="250" y="20" width="200" height="160" rx="12" fill="#DBEAFE" stroke="#1E40AF" stroke-width="1.5"/>
  <text x="350" y="45" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#1E3A8A">PYTHON</text>
  <text x="265" y="70" font-family="Arial" font-size="10" fill="#1E3A8A">- 100k to 10M rows</text>
  <text x="265" y="88" font-family="Arial" font-size="10" fill="#1E3A8A">- 10 CSVs, API, JSON</text>
  <text x="265" y="106" font-family="Arial" font-size="10" fill="#1E3A8A">- Repeatable, automate</text>
  <text x="265" y="124" font-family="Arial" font-size="10" fill="#1E3A8A">- Foundation for ML</text>
  <text x="265" y="145" font-family="Arial" font-size="9" font-weight="700" fill="#1E40AF">Use when: Repeat, large, automate</text>
  <rect x="480" y="20" width="200" height="160" rx="12" fill="#FEF3C7" stroke="#92400E" stroke-width="1.5"/>
  <text x="580" y="45" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#78350F">SQL</text>
  <text x="495" y="70" font-family="Arial" font-size="10" fill="#78350F">- Database, many tables</text>
  <text x="495" y="88" font-family="Arial" font-size="10" fill="#78350F">- Jumia, Paystack data</text>
  <text x="495" y="106" font-family="Arial" font-size="10" fill="#78350F">- Fast filter, join</text>
  <text x="495" y="124" font-family="Arial" font-size="10" fill="#78350F">- Data lives in DB</text>
  <text x="495" y="145" font-family="Arial" font-size="9" font-weight="700" fill="#92400E">Use when: Data in DB</text>
</svg>

Many beginners think data science = Python. Wrong. Data science = using data to create impact in Naira. Python is just one tool.

In Lagos SME:
- Pharmacy Yaba has Excel with 5k rows purchases. Excel is enough. Python is overkill.
- POS chain with 20 branches, 2 years data, 2M rows across 24 CSVs, needs cleaning daily. Excel crashes. Python wins.
- Fintech with Postgres DB, 50M transactions. Need SQL first, then Python for analysis.


## 2. Why Python Wins for Repeatable Work

In previous course, you did pharmacy expiry in Excel with alert column = IF(days<45, "SELL FAST"). It works, but every month you must open file, refresh manually, copy formula.

In Python, you write script once:

```python
import pandas as pd
df = pd.read_csv("purchases.csv")
df["alert"] = df["days_to_expiry"].apply(lambda x: "SELL FAST" if x < 45 else "OK")
df.to_csv("alert_today.csv", index=False)
```

Run daily with one click. That is automation. That is why companies pay for Python.

Python also is foundation:
- statistics - you will use Python scipy, not calculator.
- cleaning - you will use pandas, not just Power Query.
- vizualization - matplotlib, seaborn.
- ML - sklearn, all Python.

So learn foundations well now.

## 3. Problem-First, Not Tool-First - Same as ws_01 L08

Do not start with "I want to use Python". Start with business pain (L05), then choose tool.

Rule:
- If data <100k rows, 1 file, MD needs to open on phone today: Use Excel. Ship fast.
- If data >100k, many files, need to repeat daily, or need to call API: Use Python.
- If data in database: Use SQL (ws_05) to get it, then Python to analyze.

Bad: "I will build AI in Python for pharmacy" when Excel alert would save N120k monthly already.

Good: "Pharmacy Excel crashes with 500k rows, I will write Python script to generate daily alert CSV automatically, saving 2 hours daily."

## 4. What You Will Build in ws_02

By the end of this course, you will build CLI tool:

```
python pos_calculator.py --input sales_jan.csv --branch Yaba
```

Output: total sales N2.3M, top 5 products, alert for low stock.

That tool uses:
- variables, types, control flow, lists, dicts, functions, error handling
- reading files, paths, modules
- numpy and pandas foundations

No ML. No fancy charts. Just solid Python that works.

## 5. Mindset for learning this course

- Type code, do not copy-paste. Muscle memory matters.
- Read error messages - they tell you line number and problem.
- Build small, test small. Do not write 100 lines then run.
- Break big problem to small functions.

Checklist:
- Can you explain when to use Excel vs Python vs SQL to a pharmacy owner?
- Can you give example where Python saves time vs Excel?

Next: L02 - Setup That Works on Any Laptop - Python, VS Code, venv, first run.

**Key Takeaway:** Python is not magic. It is a tool for repeatable, large, automated data work. Learn it as foundation for the remaining courses, but keep problem-first thinking.