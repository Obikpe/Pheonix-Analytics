# Lesson 05 - Business Problems to Analytical Questions

**Course:** ws_01 | **ID:** ws_01_l05 | **Duration:** 18 min | **Level:** Beginner

## Learning Objectives
- Translate vague business complaints into analytical questions data can answer.
- Use the 4-question framework: Descriptive, Diagnostic, Predictive, Prescriptive.
- Write problem statements that do not prescribe the solution.

---

## 1. Why Translation is Your Real Job

A business owner will never say "Build me a logistic regression with 0.85 AUC". They will say:

> "Our delivery is too slow in Kano and customers are angry."

If you open Excel and start plotting delivery times, you have already failed. You have not clarified what slow means, for whom, when, and what the cost is.

**Business Problem != Analytical Question**

Business Problem is pain felt by humans. Analytical Question is a question data can answer with a specific source, time window, and comparison.

<svg width="100%" height="180" viewBox="0 0 700 180" xmlns="http://www.w3.org/2000/svg" role="img">
  <rect x="0" y="0" width="700" height="180" rx="16" fill="#FFFFFF"/>
  <rect x="20" y="20" width="300" height="140" rx="12" fill="#FEF3C7" stroke="#92400E" stroke-width="2"/>
  <text x="170" y="45" text-anchor="middle" font-family="Arial" font-size="13" font-weight="800" fill="#78350F">BUSINESS PROBLEM</text>
  <text x="40" y="75" font-family="Arial" font-size="11" fill="#78350F">• Vague: "Sales down"</text>
  <text x="40" y="95" font-family="Arial" font-size="11" fill="#78350F">• Emotional, no source</text>
  <text x="40" y="115" font-family="Arial" font-size="11" fill="#78350F">• Example: "Customers complain"</text>
  <rect x="380" y="20" width="300" height="140" rx="12" fill="#D1FAE5" stroke="#065F46" stroke-width="2"/>
  <text x="530" y="45" text-anchor="middle" font-family="Arial" font-size="13" font-weight="800" fill="#064E3B">ANALYTICAL QUESTION</text>
  <text x="400" y="75" font-family="Arial" font-size="11" fill="#064E3B">• Specific: "Avg delivery time last 90d vs SLA?"</text>
  <text x="400" y="95" font-family="Arial" font-size="11" fill="#064E3B">• Measurable, has source</text>
  <text x="400" y="115" font-family="Arial" font-size="11" fill="#064E3B">• Time window + comparison</text>
</svg>

## 2. The Translation Framework

**Step 1: Clarify the Pain**
- Who is affected? Customer, rider, staff?
- How do you know it is true? Anecdote or data?
- What is the cost if not fixed? Naira, churn, time?

**Step 2: Decompose into 4 Types**
- Descriptive: What happened?
- Diagnostic: Why did it happen?
- Predictive: What will happen?
- Prescriptive: What should we do?

Example - Betting company: "Users leave after first deposit"
- Descriptive: What % of users who deposit never place a second bet within 7 days?
- Diagnostic: Which games did churned users play vs retained?
- Predictive: Does time to first withdrawal predict churn?
- Prescriptive: If we give bonus for 2nd bet within 24h, does retention increase?

**Step 3: Prioritize**
Which hurts most and is fastest to answer? Start with Descriptive. It takes 5 minutes in SQL.

## 3. What Makes a Good Analytical Question

- **Specific:** Not "why sales dropped" but "why did Product A sales drop 23% in Surulere in March vs Feb?"
- **Measurable:** You can name table/column: pos_sales.branch, pos_sales.sold_at
- **Time-bound:** Last 90 days, not forever
- **No Solution Inside:** Bad: "Should we build ML?" Good: "Is failure rate higher for transfers >100k on MTN?"

## 4. Nigerian Examples
1. POS Yaba: "I am not making profit" -> What is profit by hour last 30 days?
2. Pharmacy Yaba: "Drugs waste" -> What value expired last 6 months by category?
3. Logistics Apapa: "Waybill entry slow" -> What is avg manual entry time per waybill?

## 5. Exercise
Take: "Our pharmacy wastes drugs". Write Descriptive, Diagnostic, Predictive.