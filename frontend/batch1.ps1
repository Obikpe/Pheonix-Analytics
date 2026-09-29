$ErrorActionPreference = "Stop"
$base = "data/lessons/ws_01"
New-Item -ItemType Directory -Force -Path $base | Out-Null

# --- 01-lesson.md ---
@'
# Lesson 01 - What is Data Science? The Complete Definition

**Course:** ws_01 | **ID:** ws_01_l01 | **Duration:** 12 min | **Level:** Beginner

## Learning Objectives
- Define data science in one sentence that a business owner understands.
- Explain the 3 pillars: Domain + Math/Stats + Engineering.
- Give 3 Nigerian examples where data science creates impact.
- Distinguish data science from just coding or just statistics.

---

## 1. The One Sentence Definition

**Data Science is using data to make better decisions that create measurable impact.**

Not just analysis. Not just models. Not just dashboards. If it does not change a decision or create impact, it is not data science, it is a hobby project.

In Nigeria:
- Paystack uses data to decide which transactions are fraud vs legit in 200ms.
- Jumia uses data to decide how much stock to keep in Lagos warehouse vs Abuja.
- A POS business in Yaba uses data to decide what time to open to catch most customers.

All 3 are data science, even though only one uses AI.

## 2. The 3 Pillars

<svg width="100%" height="210" viewBox="0 0 700 210" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="210" rx="16" fill="#FFFFFF"/>
  <rect x="20" y="20" width="200" height="160" rx="14" fill="#DBEAFE" stroke="#1E40AF" stroke-width="2"/>
  <text x="120" y="50" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#1E3A8A">DOMAIN</text>
  <text x="120" y="80" text-anchor="middle" font-family="Arial" font-size="11" fill="#1E3A8A">Business +</text>
  <text x="120" y="98" text-anchor="middle" font-family="Arial" font-size="11" fill="#1E3A8A">Problem +</text>
  <text x="120" y="116" text-anchor="middle" font-family="Arial" font-size="11" fill="#1E3A8A">Context</text>
  <rect x="250" y="20" width="200" height="160" rx="14" fill="#FEF3C7" stroke="#92400E" stroke-width="2"/>
  <text x="350" y="50" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#78350F">MATH / STATS</text>
  <text x="350" y="80" text-anchor="middle" font-family="Arial" font-size="11" fill="#78350F">Inference +</text>
  <text x="350" y="98" text-anchor="middle" font-family="Arial" font-size="11" fill="#78350F">Experiment +</text>
  <text x="350" y="116" text-anchor="middle" font-family="Arial" font-size="11" fill="#78350F">Modeling</text>
  <rect x="480" y="20" width="200" height="160" rx="14" fill="#D1FAE5" stroke="#065F46" stroke-width="2"/>
  <text x="580" y="50" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#064E3B">ENGINEERING</text>
  <text x="580" y="80" text-anchor="middle" font-family="Arial" font-size="11" fill="#064E3B">Data Pipelines +</text>
  <text x="580" y="98" text-anchor="middle" font-family="Arial" font-size="11" fill="#064E3B">Tools +</text>
  <text x="580" y="116" text-anchor="middle" font-family="Arial" font-size="11" fill="#064E3B">Delivery</text>
</svg>

- **Domain:** You must understand the business. A doctor + data is better than data alone for health.
- **Math/Stats:** You must know how to separate signal from noise, not just run .fit()
- **Engineering:** You must be able to get data, clean it, and ship result to users.

Remove one, you are not a data scientist. You are either a business analyst, a statistician, or a data engineer.

## 3. What Data Science is NOT

- Not magic. It does not create data. If data was not collected, you cannot invent it.
- Not only Machine Learning. 80% of time is getting, cleaning, understanding data.
- Not tool worship. Excel can be data science if it changes a decision.

## 4. Exercise

Pick a business you know. Write: Decision they make today by gut, Data they already have, One impact if data is used.

Checklist:
- I can define data science in 1 sentence
- I can explain 3 pillars with example
- I can give Nigerian example for each pillar
'@ | Set-Content -Path "$base/01-lesson.md" -Encoding utf8

# --- 02-lesson.md ---
@'
# Lesson 02 - Data Science vs Data Analysis vs Machine Learning vs AI

**Course:** ws_01 | **ID:** ws_01_l02 | **Duration:** 14 min | **Level:** Beginner

## Learning Objectives
- Place Data Analysis, Data Science, ML, and AI in correct hierarchy.
- Explain when you need analysis vs when you need ML.
- Stop using AI as buzzword for everything.

---

## 1. The Hierarchy

**AI is the biggest circle. ML is a subset of AI. Data Science uses ML and Analysis as tools.**

<svg width="100%" height="210" viewBox="0 0 700 210" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="210" rx="16" fill="#FFFFFF"/>
  <rect x="100" y="15" width="500" height="180" rx="20" fill="#EFF6FF" stroke="#1E40AF" stroke-width="2"/>
  <text x="350" y="35" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#1E3A8A">ARTIFICIAL INTELLIGENCE - Any system that mimics human intelligence</text>
  <rect x="150" y="50" width="400" height="130" rx="18" fill="#FEF3C7" stroke="#92400E" stroke-width="2"/>
  <text x="350" y="70" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#78350F">MACHINE LEARNING - Systems that learn from data</text>
  <rect x="180" y="85" width="340" height="85" rx="14" fill="#D1FAE5" stroke="#065F46" stroke-width="2"/>
  <text x="350" y="105" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#064E3B">DATA SCIENCE - Uses analysis + ML + domain to create impact</text>
  <text x="350" y="130" text-anchor="middle" font-family="Arial" font-size="11" fill="#064E3B">DATA ANALYSIS is a core skill inside it</text>
</svg>

- **Data Analysis:** What happened? Why? Descriptive + diagnostic. Tools: Excel, SQL, Power BI. Example: Why did sales drop in Surulere last month?
- **Data Science:** What will happen? What should we do? Predictive + prescriptive. Uses analysis + ML + engineering. Example: Predict which customers will churn next month and what to do to keep them.
- **Machine Learning:** A set of algorithms that learn patterns from data to predict. Example: Fraud detection model learns from past fraud labels.
- **AI:** Any technique that mimics human intelligence. ML is one way to build AI, but rule-based systems are also AI (e.g., if amount > 1M and new device then block).

## 2. When to Use What?

| Problem | You Need | Why |
|---|---|---|
| Sales dropped, find why | Data Analysis | Past data, no prediction needed |
| Predict delivery time | Data Science + ML | Need model + deployment |
| Chatbot that answers in Pidgin | AI (NLP + ML + rules) | Mimic human conversation |
| Monthly report for MD | Data Analysis | No ML, just clarity |

If you can solve it with a SQL query and a bar chart, do not build an ML model. That is over-engineering.

## 3. Nigerian Clarification

- **Jumia product recommendation "You may like"** = ML inside Data Science product.
- **Bank monthly profit report in Excel** = Data Analysis, still valuable.
- **CCTV that detects car plate numbers in Lagos** = AI using Computer Vision (ML).
- **Paystack Dashboard showing transaction trends** = Data Analysis + Data Science.

## 4. The Job Market Truth

In Nigeria, 90% of entry roles advertised as "Data Scientist" are actually "Data Analyst" + dashboard + SQL + Excel. Learn analysis first, then ML. Do not start by calling yourself AI Engineer if you cannot do GROUP BY.

Checklist:
- I can place AI, ML, Data Science, Analysis in hierarchy
- I can give 1 Nigerian example for each
- I know when NOT to use ML
'@ | Set-Content -Path "$base/02-lesson.md" -Encoding utf8

Write-Host "Batch 1 done: 01 and 02 updated" -ForegroundColor Green
