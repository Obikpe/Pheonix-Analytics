# Lesson 07 - Data Roles and Team Structure - Who Does What

**Course:** ws_01 | **ID:** ws_01_l07 | **Duration:** 16 min

## Learning Objectives
- Name 5 core roles and what they own
- Explain why one person cannot do everything

## 1. The 5 Core Roles

<svg width="100%" height="220" viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg" role="img">
  <rect x="0" y="0" width="700" height="220" rx="16" fill="#FFFFFF"/>
  <rect x="20" y="20" width="320" height="85" rx="10" fill="#DBEAFE" stroke="#1E40AF" stroke-width="1.5"/>
  <text x="35" y="40" font-family="Arial" font-size="11" font-weight="800" fill="#1E3A8A">DATA ANALYST</text>
  <text x="35" y="60" font-family="Arial" font-size="10" fill="#1E3A8A">Owns: SQL, Excel, Power BI, Dashboards</text>
  <text x="35" y="76" font-family="Arial" font-size="10" fill="#1E3A8A">Answers: What happened? Why?</text>
  <rect x="360" y="20" width="320" height="85" rx="10" fill="#FEF3C7" stroke="#92400E" stroke-width="1.5"/>
  <text x="375" y="40" font-family="Arial" font-size="11" font-weight="800" fill="#78350F">DATA SCIENTIST</text>
  <text x="375" y="60" font-family="Arial" font-size="10" fill="#78350F">Owns: Hypothesis, Experiment, Model, Impact</text>
  <text x="375" y="76" font-family="Arial" font-size="10" fill="#78350F">Answers: What will happen? What to do?</text>
  <rect x="20" y="120" width="320" height="85" rx="10" fill="#D1FAE5" stroke="#065F46" stroke-width="1.5"/>
  <text x="35" y="140" font-family="Arial" font-size="11" font-weight="800" fill="#064E3B">DATA ENGINEER</text>
  <text x="35" y="160" font-family="Arial" font-size="10" fill="#064E3B">Owns: Pipelines, ETL, Reliability</text>
  <text x="35" y="176" font-family="Arial" font-size="10" fill="#064E3B">Goal: Data by 6am daily, no duplicates</text>
  <rect x="360" y="120" width="320" height="85" rx="10" fill="#EDE9FE" stroke="#5B21B6" stroke-width="1.5"/>
  <text x="375" y="140" font-family="Arial" font-size="11" font-weight="800" fill="#4C1D95">ANALYTICS + ML ENGINEER</text>
  <text x="375" y="160" font-family="Arial" font-size="10" fill="#4C1D95">Owns: dbt models, API, Monitoring</text>
  <text x="375" y="176" font-family="Arial" font-size="10" fill="#4C1D95">Bridge between Engineer and Analyst</text>
</svg>

**Analyst:** Uses L05 and L06 daily. Translates pain to SQL. Builds report MD can use tomorrow. 90% of entry jobs in Nigeria labeled "Data Scientist" are this.

**Scientist:** Predicts churn, fraud, delivery time. Must know experiment design, not just.fit(). Must measure impact in Naira.

**Engineer:** If fails, everyone works on stale Excel. Owns POS data from 3 branches landing in one table by 6am.

**Analytics Engineer:** Owns dbt clean tables so 5 analysts don't write 5 versions of same logic.

**ML Engineer:** Ships model to prod. Fraud model must score in 200ms, 99.9% uptime.

## 2. Who Does What
- Business Problem -> Product Manager + Analyst
- Hypothesis + MECE -> Analyst + Scientist
- Get Data -> Engineer
- Clean -> Engineer + Analytics Engineer
- Analyze / Model -> Analyst / Scientist
- Ship -> Analytics + ML + Analyst for storytelling

## 3. How Teams Fail
- Everyone wants Scientist, nobody cleans data. No reliable table.
- Engineer builds pipeline for data nobody uses because L05 skipped.
- Analyst builds dashboard nobody opens because no KPI and owner.

Fix: Start with L05 question, L06 KPI and hypothesis, assign one owner per deliverable.

Checklist: Can explain 5 roles in one sentence and map to L05-L06.