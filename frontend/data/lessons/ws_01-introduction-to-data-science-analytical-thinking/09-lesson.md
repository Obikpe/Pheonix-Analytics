# Lesson 09 - Ethics, Privacy, Bias and Responsible Use

**Course:** ws_01 | **ID:** ws_01_l09 | **Duration:** 18 min | **Level:** Beginner

## Learning Objectives
- Explain why ethics is not optional in Nigeria.
- Identify privacy, consent, bias, and harm.
- Apply checklist before shipping analysis.

## 1. Why Ethics Matters Here

In Nigeria, data misuse has real consequences:
- POS transaction list posted on WhatsApp -> fraud, account drain.
- Loan app reading contacts to shame defaulters -> NDPA violation.
- Recruitment model trained on past hires from only one tribe -> discrimination.

Data science without ethics is just surveillance.

<svg width="100%" height="190" viewBox="0 0 700 190" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="190" rx="16" fill="#FFFFFF"/>
  <rect x="20" y="20" width="150" height="150" rx="12" fill="#FEE2E2" stroke="#991B1B" stroke-width="1.5"/>
  <text x="95" y="45" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#7F1D1D">PRIVACY</text>
  <text x="35" y="70" font-family="Arial" font-size="10" fill="#7F1D1D">• Can customer say no?</text>
  <text x="35" y="88" font-family="Arial" font-size="10" fill="#7F1D1D">• Is data minimized?</text>
  <text x="35" y="106" font-family="Arial" font-size="10" fill="#7F1D1D">• NDPA 2023 compliance</text>
  <rect x="190" y="20" width="150" height="150" rx="12" fill="#FEF3C7" stroke="#92400E" stroke-width="1.5"/>
  <text x="265" y="45" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#78350F">BIAS</text>
  <text x="205" y="70" font-family="Arial" font-size="10" fill="#78350F">• Training data skewed?</text>
  <text x="205" y="88" font-family="Arial" font-size="10" fill="#78350F">• Lagos only, not Kano?</text>
  <text x="205" y="106" font-family="Arial" font-size="10" fill="#78350F">• Past hires biased?</text>
  <rect x="360" y="20" width="150" height="150" rx="12" fill="#DBEAFE" stroke="#1E40AF" stroke-width="1.5"/>
  <text x="435" y="45" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#1E3A8A">CONSENT</text>
  <text x="375" y="70" font-family="Arial" font-size="10" fill="#1E3A8A">• Did user agree clearly?</text>
  <text x="375" y="88" font-family="Arial" font-size="10" fill="#1E3A8A">• Can they withdraw?</text>
  <text x="375" y="106" font-family="Arial" font-size="10" fill="#1E3A8A">• No hidden contact scrape</text>
  <rect x="530" y="20" width="150" height="150" rx="12" fill="#D1FAE5" stroke="#065F46" stroke-width="1.5"/>
  <text x="605" y="45" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#064E3B">HARM</text>
  <text x="545" y="70" font-family="Arial" font-size="10" fill="#064E3B">• Who is harmed if wrong?</text>
  <text x="545" y="88" font-family="Arial" font-size="10" fill="#064E3B">• Can they appeal?</text>
  <text x="545" y="106" font-family="Arial" font-size="10" fill="#064E3B">• Fail safe, not fail open</text>
</svg>

## 2. Privacy and NDPA 2023

Nigeria Data Protection Act 2023 requires:
- Lawful basis and consent for personal data.
- Purpose limitation: collect for stated purpose, not future maybe.
- Data minimization: don't collect BVN if phone number is enough.
- Storage limitation: delete after purpose.

Practical:
- Never share raw data with customer names in screenshots. Aggregate or mask.
- POS data: remove card PAN, keep last 4 digits only.
- Location: need exact house address or LGA is enough?

## 3. Bias - 3 Places It Enters

1. **Data bias:** Training data from Lagos Island only -> model fails in Ibadan. Example: Credit model trained on salary earners fails for traders.
2. **Label bias:** Past loan officer approved friends -> labels are biased. Model learns bias.
3. **Measurement bias:** Using number of support tickets as proxy for problem severity - silent sufferers ignored.

Check: Is my data representative of who will be affected? If not, say it in report.

## 4. Responsible Use Checklist Before Shipping

Before you send dashboard or model:
- Can I explain this decision to the person affected in plain English?
- If this prediction is wrong, who loses money, job, access?
- Is there appeal path? Can person contact human?
- Did I test on different groups: male/female, Lagos/Kano, new/old users?
- Would I be okay if this was posted on Twitter?

## 5. What To Do Instead

- Anonymize early, not at end.
- Log access: who viewed sensitive table when?
- Build simple rule first: rule is explainable. ML must beat rule by clear margin to justify complexity.
- Document limitations in report: "This analysis covers only MTN users, not Airtel".

Checklist: I can name privacy, bias, consent, harm and apply checklist.