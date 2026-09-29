# Lesson 04 - Data Science Lifecycle - From Problem to Impact

**Course:** ws_01 | **ID:** ws_01_l04 | **Duration:** 15 min | **Level:** Beginner

## Learning Objectives
- List 6 stages of lifecycle in order.
- Explain why 70% of projects fail at stages 1 and 6, not modeling.
- Apply lifecycle to a Nigerian case.

## 1. The Lifecycle

1. **Business Understanding:** What pain? Who owns it? What is success? (L05, L06)
2. **Data Understanding:** What data exists? Where? Quality?
3. **Data Preparation:** Clean, join, transform - 60% of time.
4. **Modeling / Analysis:** Build model or analysis to answer question.
5. **Evaluation:** Does it meet KPI from L06? Would business trust it?
6. **Deployment & Impact:** Put in production, train users, measure impact.

<svg width="100%" height="180" viewBox="0 0 700 180" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="180" rx="16" fill="#FFFFFF"/>
  <rect x="10" y="20" width="95" height="50" rx="10" fill="#DBEAFE" stroke="#1E40AF" stroke-width="1.5"/><text x="57" y="50" text-anchor="middle" font-family="Arial" font-size="10" font-weight="700" fill="#1E3A8A">1. Business</text>
  <text x="112" y="48" font-family="Arial" font-size="14" fill="#6B7280">→</text>
  <rect x="130" y="20" width="95" height="50" rx="10" fill="#DBEAFE" stroke="#1E40AF" stroke-width="1.5"/><text x="177" y="50" text-anchor="middle" font-family="Arial" font-size="10" font-weight="700" fill="#1E3A8A">2. Data</text>
  <text x="232" y="48" font-family="Arial" font-size="14" fill="#6B7280">→</text>
  <rect x="250" y="20" width="95" height="50" rx="10" fill="#FEF3C7" stroke="#92400E" stroke-width="1.5"/><text x="297" y="50" text-anchor="middle" font-family="Arial" font-size="10" font-weight="700" fill="#78350F">3. Prep</text>
  <text x="352" y="48" font-family="Arial" font-size="14" fill="#6B7280">→</text>
  <rect x="370" y="20" width="95" height="50" rx="10" fill="#FEF3C7" stroke="#92400E" stroke-width="1.5"/><text x="417" y="50" text-anchor="middle" font-family="Arial" font-size="10" font-weight="700" fill="#78350F">4. Model</text>
  <text x="472" y="48" font-family="Arial" font-size="14" fill="#6B7280">→</text>
  <rect x="490" y="20" width="95" height="50" rx="10" fill="#D1FAE5" stroke="#065F46" stroke-width="1.5"/><text x="537" y="50" text-anchor="middle" font-family="Arial" font-size="10" font-weight="700" fill="#064E3B">5. Evaluate</text>
  <text x="592" y="48" font-family="Arial" font-size="14" fill="#6B7280">→</text>
  <rect x="610" y="20" width="80" height="50" rx="10" fill="#D1FAE5" stroke="#065F46" stroke-width="1.5"/><text x="650" y="50" text-anchor="middle" font-family="Arial" font-size="10" font-weight="700" fill="#064E3B">6. Deploy</text>
  <text x="350" y="120" text-anchor="middle" font-family="Arial" font-size="11" fill="#111827">Loop: Deployment reveals new business questions → back to 1</text>
</svg>

## 2. Why Projects Fail

- **Fail at Stage 1:** Built churn model but business wanted to increase sales, not reduce churn. No owner.
- **Fail at Stage 6:** Model 95% accurate but never deployed because no API, no training for staff.
- **Success:** Start small, deploy early, measure impact.

Nigerian example: Bank builds fraud model in Jupyter, never connects to transaction stream. Fraud still happens. Need engineering for deployment.

Checklist: I can name 6 stages and what fails at each.
