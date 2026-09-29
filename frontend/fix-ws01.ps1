# WS_01 BATCH 3 - Lessons 09 to 12 FULL, no shortening
$courseId = "ws_01"
$base = ".\data\lessons"
$folder = Get-ChildItem $base -Directory | Where-Object { $_.Name -like "$courseId-*" } | Select-Object -First 1
$fp = $folder.FullName
Write-Host "Writing FULL 09-12 to $fp" -ForegroundColor Yellow

# ---------- 09 ----------
$lesson09 = @'
# Lesson 09 - Ethics, Privacy, Bias and Responsible Use - The Part That Can Get You Sued

**Course:** ws_01 | **ID:** ws_01_l09 | **Duration:** 70 min | **Level:** Beginner - Critical

### Learning Objectives
By the end you will be able to:
1. Explain GDPR and Nigeria NDPA privacy principles in simple language
2. Define 3 types of bias: selection bias, measurement bias, algorithmic bias with real examples
3. Describe 2 real scandals: COMPAS recidivism and Amazon hiring tool
4. List 5 practical steps to make your data work responsible and fair

### 1. Why Ethics is Not Optional - Real Consequences

You might think ethics is just theory for big companies. It is not. In 2018, a Data Science team at Amazon built a hiring tool to screen resumes. It was trained on 10 years of resumes, mostly from men because tech industry is male-dominated. The model learned that resumes with words like "women's chess club" were bad. It penalized women. Amazon had to scrap the entire project after spending millions. Careers were affected, company reputation damaged.

In Nigeria, if you build a loan model that denies loans to people from certain states or tribes because your training data is biased, you are not just unfair, you are breaking the law under Nigeria Data Protection Act (NDPA) and you can be sued. Ethics is practical risk management.

### 2. Privacy - What You Must Know

**Nigeria NDPA and GDPR Principles (Simplified):**

1.  **Consent:** You must get clear permission before collecting data. Example: When user signs up on your app, you must have checkbox "I agree to my data being used to improve service" not pre-checked. You cannot hide it in terms and conditions.
2.  **Purpose Limitation:** Collect data for specific purpose and use it only for that purpose. Example: You collected phone number for delivery, you cannot sell it to marketing company for ads without new consent.
3.  **Data Minimization:** Collect only what you need. Do not collect full date of birth if you only need age group. Do not collect BVN if you only need to verify identity.
4.  **Anonymization and Pseudonymization:** Remove or mask identifiable information when possible. Example: Instead of storing "Tobi Adeyemi, 08012345678, lives at 12 Allen Avenue", store "User_123, Lagos, age group 25-34". If data leaks, harm is less.
5.  **Right to be Forgotten:** User can ask you to delete their data. You must have process to delete from all systems, including backups.
6.  **Security:** Must protect data with encryption, access control. If you store customer data in public Google Sheet link, you are negligent.

**Practical Example - POS Business:**
You run POS business and store customer phone numbers to send promo. Are you compliant? Ask: Did customers consent to promo SMS? Did you tell them you will store phone? Can they opt out? Is your Excel sheet with phones password protected? If no to any, you are not compliant.

### 3. Bias - The 3 Types That Will Ruin Your Model

**A. Selection Bias - Your training data does not represent real world.**

Example: You want to build model to predict which students will pass JAMB. You train only on data from private schools in Lekki with 80% pass rate. You deploy to all Nigeria where pass rate is 30%. Model will overpredict passing because it never saw students from public schools with less resources. Your data selection was biased.

How to detect: Compare distribution of your training data vs real world population. If training data is 90% male but real customers are 50% male, you have selection bias.

**B. Measurement Bias - Your instrument or method of measurement is faulty for some groups.**

Example: You use a heart rate monitor that was tested mostly on light-skinned individuals. For dark-skinned individuals, it gives inaccurate readings because light absorption differs. If you train health model on this faulty data, it will be less accurate for dark-skinned patients, leading to wrong diagnoses. This happened with pulse oximeters during COVID.

Example in Nigeria: You measure customer satisfaction via English-only survey in area where many speak Yoruba or Pidgin. Those who don't understand English don't respond, so you only hear from English speakers. Measurement is biased.

**C. Algorithmic Bias - Model amplifies bias present in data or creates new bias.**

Even if data is balanced, algorithm can amplify bias if it optimizes for overall accuracy while ignoring minority group.

Example: Loan model trained on historical data where women were denied loans more often (due to past discrimination). Model learns pattern: women = higher risk, even if not true. It then denies more women, creating feedback loop: women get fewer loans, have less credit history, so future model thinks women are even riskier. Bias amplifies.

### 4. Real Scandals You Must Know (For Interviews)

**Scandal 1: COMPAS Recidivism Tool (USA, 2016)**
Used by US courts to predict if criminal will reoffend. Investigation by ProPublica found: Black defendants who did NOT reoffend were predicted as high risk at 45% rate, while white defendants who did NOT reoffend were predicted high risk at 23% rate. Tool was twice as likely to falsely label Black as high risk. Used to decide sentencing. Lives affected.

**Scandal 2: Amazon Hiring Tool (2018)**
Trained on 10 years resumes, mostly men. Learned to penalize resumes containing word "women's" like "women's chess club captain" and graduates from all-women's colleges. Amazon disbanded team.

**Lesson:** Accuracy is not enough. You must check fairness across groups: gender, state, age, tribe.

### 5. How to Make Your Work Responsible - 5 Practical Steps

1.  **Diverse Data:** Ensure training data includes all groups you will serve. If you serve all Nigeria, include all states, genders, age groups.
2.  **Check Distributions:** Before modeling, compare your data distribution vs real world. If mismatch, collect more data or use sampling techniques.
3.  **Fairness Metrics:** Don't just check overall accuracy. Check accuracy, precision, recall for each group separately. Example: Model accuracy 85% overall, but 95% for men and 60% for women - not fair.
4.  **Human in the Loop:** For high-stakes decisions (loan, hiring, medical), model should recommend, human should decide, with ability to override.
5.  **Documentation and Transparency:** Document what data you used, what bias you checked, what limitations model has. Example: "This model was trained on data from Lagos only, may not generalize to rural areas.[STRIPPED 51 bytes]100%" height="160" viewBox="0 0 700 160" xmlns="http://www.w3.org/2000/svg">
  <rect width="700" height="160" fill="#FEF2F2" rx="12"/>
  <text x="350" y="25" text-anchor="middle" font-weight="800" font-family="sans-serif" font-size="13" fill="#991B1B">Biased Data → Biased Model → Harmful Decision → More Biased Data (Loop)</text>
  <circle cx="120" cy="90" r="45" fill="white" stroke="#DC2626" stroke-width="2.5"/><text x="120" y="85" text-anchor="middle" font-weight="700" font-size="11" font-family="sans-serif">Biased</text><text x="120" y="100" text-anchor="middle" font-weight="700" font-size="11" font-family="sans-serif">Data</text>
  <line x1="165" y1="90" x2="205" y2="90" stroke="#111" stroke-width="2" marker-end="url(#arrow)"/>
  <circle cx="260" cy="90" r="45" fill="white" stroke="#DC2626" stroke-width="2.5"/><text x="260" y="85" text-anchor="middle" font-weight="700" font-size="11" font-family="sans-serif">Biased</text><text x="260" y="100" text-anchor="middle" font-weight="700" font-size="11" font-family="sans-serif">Model</text>
  <line x1="305" y1="90" x2="345" y2="90" stroke="#111" stroke-width="2"/>
  <circle cx="400" cy="90" r="45" fill="white" stroke="#DC2626" stroke-width="2.5"/><text x="400" y="85" text-anchor="middle" font-weight="700" font-size="11" font-family="sans-serif">Harmful</text><text x="400" y="100" text-anchor="middle" font-weight="700" font-size="11" font-family="sans-serif">Decision</text>
  <line x1="445" y1="90" x2="485" y2="90" stroke="#111" stroke-width="2"/>
  <circle cx="560" cy="90" r="55" fill="#FECACA" stroke="#DC2626" stroke-width="2.5"/><text x="560" y="85" text-anchor="middle" font-weight="700" font-size="10" font-family="sans-serif">Future Data Becomes</text><text x="560" y="100" text-anchor="middle" font-weight="700" font-size="10" font-family="sans-serif">Even More Biased</text>
  <defs><marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#111"/></marker></defs>
</svg>

This loop is dangerous because bias amplifies over time.

### 7. Exercise
Take your POS business example. List:
1. What personal data do you collect?
2. Do you have consent?
3. What bias could exist if you train churn model only on customers from Ikeja but deploy to all Lagos?
4. How would you mitigate?

Write 200 words.

### 8. Checklist
- I can explain GDPR/NDPA principles in simple language
- I can define 3 bias types with Nigerian example
- I can tell COMPAS and Amazon stories and what went wrong
- I know 5 steps to make my work responsible
'@
$lesson09 | Set-Content -Path (Join-Path $fp "09-lesson.md") -Encoding UTF8

# ---------- 10 ----------
$lesson10 = @'
# Lesson 10 - Success Metrics - How to Know You Actually Succeeded, Not Just Built a Model

**Course:** ws_01 | **ID:** ws_01_l10 | **Duration:** 70 min | **Level:** Beginner - Critical for Job

### Learning Objectives
- Explain why accuracy alone is dangerous and can be misleading
- Translate confusion matrix into Naira cost for business
- Choose right metric based on business cost: precision vs recall vs F1
- Define business KPI vs model metric and connect them
- Understand A/B testing basics to prove your model works

### 1. Why Accuracy is Dangerous - The 95% Accuracy That is Useless

Imagine you build fraud detection model for Paystack. Out of 1000 transactions, 950 are legitimate, 50 are fraud. You build dumb model that always predicts "Not fraud" for every transaction.

What is accuracy? 950 correct out of 1000 = 95% accuracy! Looks amazing on CV. But what is business value? Zero. You missed all 50 frauds, company loses millions. Accuracy is misleading when classes are imbalanced (fraud is rare).

This happens in real life: Churn is 10%, fraud is 1%, disease is 2%. If you optimize for accuracy, model will always predict majority class and look good but be useless.

You must use better metrics.

### 2. Confusion Matrix - The Truth Table (Must Memorize)

For binary classification (e.g., Fraud vs Not Fraud):

- **True Positive (TP):** You predicted fraud, and it WAS fraud. Good! You caught fraud.
- **True Negative (TN):** You predicted not fraud, and it WAS not fraud. Good! Legit transaction passed.
- **False Positive (FP):** You predicted fraud, but it was NOT fraud. Bad! You blocked legitimate customer. Customer angry, might leave.
- **False Negative (FN):** You predicted not fraud, but it WAS fraud. Very bad! Fraud happened, money lost.

### Visual - Confusion Matrix with Cost

<svg width="100%" height="180" viewBox="0 0 500 180" xmlns="http://www.w3.org/2000/svg">
  <rect width="500" height="180" fill="#F9FAFB" rx="12"/>
  <text x="250" y="20" text-anchor="middle" font-weight="800" font-family="sans-serif">Confusion Matrix + Business Cost</text>
  <text x="100" y="50" text-anchor="middle" font-size="11" font-family="sans-serif">Actual →</text>
  <text x="40" y="90" text-anchor="middle" font-size="11" font-family="sans-serif" transform="rotate(-90 40 90)">Predicted ↓</text>
  <rect x="120" y="35" width="140" height="60" fill="#BBF7D0" stroke="#111" stroke-width="2"/><text x="190" y="55" text-anchor="middle" font-weight="700" font-size="11" font-family="sans-serif">True Positive</text><text x="190" y="75" text-anchor="middle" font-size="9" font-family="sans-serif">Caught fraud - Good</text><text x="190" y="85" text-anchor="middle" font-size="8" font-family="sans-serif">Save ₦1M</text>
  <rect x="260" y="35" width="140" height="60" fill="#FECACA" stroke="#111" stroke-width="2"/><text x="330" y="55" text-anchor="middle" font-weight="700" font-size="11" font-family="sans-serif">False Positive</text><text x="330" y="75" text-anchor="middle" font-size="9" font-family="sans-serif">Blocked legit - Bad</text><text x="330" y="85" text-anchor="middle" font-size="8" font-family="sans-serif">Cost ₦1k + trust</text>
  <rect x="120" y="95" width="140" height="60" fill="#FECACA" stroke="#B91C1C" stroke-width="2.5"/><text x="190" y="115" text-anchor="middle" font-weight="700" font-size="11" font-family="sans-serif" fill="#7F1D1D">False Negative</text><text x="190" y="135" text-anchor="middle" font-size="9" font-family="sans-serif">Missed fraud - Very Bad</text><text x="190" y="145" text-anchor="middle" font-size="8" font-family="sans-serif">Cost ₦1M loss</text>
  <rect x="260" y="95" width="140" height="60" fill="#BBF7D0" stroke="#111" stroke-width="2"/><text x="330" y="115" text-anchor="middle" font-weight="700" font-size="11" font-family="sans-serif">True Negative</text><text x="330" y="135" text-anchor="middle" font-size="9" font-family="sans-serif">Legit passed - Good</text>
</svg>

**Translate to Naira:**

- TP: Save company 1,000,000 naira (fraud prevented)
- TN: No cost, business as usual
- FP: Cost 1,000 naira (customer support time) + customer might leave (lifetime value 50k)
- FN: Cost 1,000,000 naira (fraud loss)

If FN costs 1M and FP costs 1k, you should optimize to reduce FN even if FP increases a bit. This means you want high Recall (catch all frauds) even if Precision drops.

### 3. Precision, Recall, F1 - When to Use Which

**Precision:** Of all transactions you flagged as fraud, how many were actually fraud? TP / (TP + FP). High precision means when you flag fraud, you are usually right. You don't block many legit customers.

Use precision when cost of False Positive is high. Example: Email spam filter. If you mark legit email as spam (FP), user misses important email. So need high precision.

**Recall:** Of all actual frauds, how many did you catch? TP / (TP + FN). High recall means you catch most frauds.

Use recall when cost of False Negative is high. Example: Fraud detection, disease detection. Missing a fraud or disease is very costly, so you want high recall even if you flag some legit as fraud.

**F1 Score:** Harmonic mean of precision and recall. Use when you need balance and classes are imbalanced.

**Accuracy:** (TP+TN)/(All). Use only when classes are balanced (50% fraud, 50% legit) which is rare.

**Decision Framework:**
- Is cost of missing positive (FN) high? (Fraud, disease, churn) → Optimize Recall
- Is cost of false alarm (FP) high? (Spam filter, loan approval) → Optimize Precision
- Need balance? → F1

### 4. Business Metric vs Model Metric - Connect Them

Model metric is what you optimize in Python: precision, recall, F1.

Business metric is what stakeholder cares about: Naira saved, churn reduced, customer satisfaction.

You must translate: "Our model has 85% recall and 80% precision. This means we will catch 85% of frauds, saving estimated 8.5M naira per month, while blocking 20% of flagged transactions incorrectly, costing 200k in support time. Net save 8.3M."

If you only say "F1 is 0.82", stakeholder will not understand value.

### 5. A/B Testing - How to Prove Your Model Works in Real World

You built churn model. How do you prove it works? Not just with test set accuracy, but with real business impact.

A/B test:

- Group A (Control, 50% customers): No model, business as usual
- Group B (Treatment, 50% customers): Use model to predict churners and give them 10% discount

Run for 1 month. Compare churn rate: If Group B churn 10% vs Group A 15%, model saved 5% churn. Calculate statistical significance (p-value <0.05).

This is how companies like Paystack, Flutterwave prove value.

### 6. Visual - Choosing Metric

<svg width="100%" height="100" viewBox="0 0 600 100" xmlns="http://www.w3.org/2000/svg">
  <rect width="600" height="100" fill="#FFFBEB" rx="10"/>
  <text x="300" y="25" text-anchor="middle" font-weight="700" font-family="sans-serif">Choose Metric by Cost</text>
  <rect x="20" y="40" width="170" height="45" rx="8" fill="#FECACA" stroke="#B91C1C"/><text x="105" y="60" text-anchor="middle" font-size="10" font-weight="700" font-family="sans-serif">FN costly? Fraud, Disease</text><text x="105" y="75" text-anchor="middle" font-size="9" font-family="sans-serif">→ Optimize Recall</text>
  <rect x="210" y="40" width="170" height="45" rx="8" fill="#FEF3C7" stroke="#92400E"/><text x="295" y="60" text-anchor="middle" font-size="10" font-weight="700" font-family="sans-serif">FP costly? Spam, Loan</text><text x="295" y="75" text-anchor="middle" font-size="9" font-family="sans-serif">→ Optimize Precision</text>
  <rect x="400" y="40" width="180" height="45" rx="8" fill="#D1FAE5" stroke="#065F46"/><text x="490" y="60" text-anchor="middle" font-size="10" font-weight="700" font-family="sans-serif">Need balance?</text><text x="490" y="75" text-anchor="middle" font-size="9" font-family="sans-serif">→ F1 Score</text>
</svg>

### 7. Exercise

Scenario: You build model to predict which loan applicants will default. 

- What is cost of FP (predict default but they would have paid)?
- What is cost of FN (predict not default but they default)?
- Which metric would you optimize and why?
- How would you translate to business: "If we use model, we save X naira"?

Write 200 words.

### 8. Checklist
- I can explain why 95% accuracy can be useless with imbalanced data
- I can draw confusion matrix and label TP, TN, FP, FN with costs
- I can choose precision vs recall based on business cost
- I can explain A/B testing to prove business impact
'@
$lesson10 | Set-Content -Path (Join-Path $fp "10-lesson.md") -Encoding UTF8

# ---------- 11 ----------
$lesson11 = @'
# Lesson 11 - Case Studies - Real Wins and Real Failures (Learn From Others)

**Course:** ws_01 | **ID:** ws_01_l11 | **Duration:** 70 min | **Level:** Beginner

### Learning Objectives
- Describe 3 real wins: Netflix, Paystack, Jumia and why they won
- Describe 2 real failures: Amazon hiring tool and Target pregnancy prediction and why they failed
- Extract 5 lessons for your own projects

### 1. Win 1 - Netflix Recommendation - Saves $1B Per Year

**Problem:** Netflix has 15,000 titles. User opens app, sees 15,000 options, gets overwhelmed, spends 10 minutes browsing, gets tired, leaves. Churn increases.

**Data Science Solution:** 
- Collect: What you watched, when you paused, what you searched, what device, time of day, what you rated
- Build: Collaborative filtering - "People who watched Stranger Things also watched Dark". Content-based filtering - "You watched action movies with strong female lead, here are similar"
- Deploy: Recommendation row "Top picks for Tobi" on homepage. Personalized thumbnail (same movie, different thumbnail based on what you like: if you like romance, show romantic scene, if you like action, show action scene)

**Result:** 80% of watched content comes from recommendation. User finds content in 2 minutes not 10. Churn reduced. Netflix estimates recommendation saves $1B per year in retention.

**Why it won:** Solved real user pain (choice overload), measured business metric (time to find content, churn), not just model accuracy.

### 2. Win 2 - Paystack Fraud Detection - Protects Money

**Problem:** Fraudsters steal card details and try to make transactions. If Paystack misses fraud, merchant loses money and trust in Paystack drops.

**Data Science Solution:**
- Collect: For each transaction, collect amount, time, location, device, merchant, customer history (typical amount, typical location)
- Build: Anomaly detection model. Learn normal pattern for each customer: Tobi typically spends 5k-20k in Lagos between 9am-9pm. If transaction of 500k at 2am from new device in different country, anomaly score high, flag as fraud.
- Deploy: Real-time API that scores transaction in 100ms. If score high, block and ask for additional verification (OTP).

**Result:** Fraud rate reduced from 0.5% to 0.05%, saving millions per month, increasing trust.

**Why it won:** Focused on speed (100ms) and cost (FN costs 1M, FP costs 1k, so optimize recall), and human in loop (flagged transactions reviewed).

### 3. Win 3 - Jumia Dynamic Pricing and Recommendation

**Problem:** Jumia has 1M products. How to price competitively and recommend relevant products?

**Solution:**
- Dynamic pricing: Scrape competitor prices (Konga, Slot) daily, adjust price automatically to be 2% lower if stock high, or higher if demand high.
- Recommendation: "People who bought this phone also bought phone case" - association rule mining. Increases average order value from 15k to 18k.

**Why it won:** Directly tied to revenue, automated, measurable.

### 4. Failure 1 - Amazon Hiring Tool - Biased Against Women

**What happened:** Amazon wanted to automate resume screening. They had 10 years of resumes, mostly from men because tech industry is male-dominated. They trained model to predict which resumes would lead to successful hire.

**What model learned:** Model learned that resumes containing words like "women's chess club captain" or graduates from all-women's colleges were bad, because historically fewer women were hired (due to past bias). It penalized any resume with word "women's".

**Result:** Model was biased against women. Amazon disbanded team in 2018 after spending millions. Reputation damage.

**Lesson:** Training data was biased (historical hiring bias). Model amplified bias. No fairness check across gender. Accuracy was high overall (because majority male) but 60% for women vs 95% for men - not fair. Must check metrics per group.

### 5. Failure 2 - Target Pregnancy Prediction - Ethical Failure

**What happened:** Target wanted to predict which customers are pregnant to send baby product coupons early and capture loyalty.

**Data Science:** Analyzed buying patterns: Women who buy unscented lotion, cotton balls, supplements, etc. are likely pregnant in second trimester. Model predicted pregnancy with high accuracy.

**What went wrong:** Target sent baby product coupons to a teenage girl[STRIPPED 2184 bytes]t just check overall accuracy, check accuracy for men vs women, Lagos vs Kano, young vs old.
4.  **Consider ethics before building.** Should you predict this? Do you have consent? What harm if wrong?
5.  **Human in loop for high stakes.** Loan, hiring, medical - model recommends, human decides.

### 8. Exercise

Pick one win and one failure. For each, write:
- What was business problem?
- What data was used?
- What was solution?
- Why it won/failed?
- What would you do differently?

200 words each.

### 9. Checklist
- I can tell Netflix, Paystack, Amazon, Target stories with details and lessons
- I can explain why accuracy alone is not enough and why ethics matters
'@
$lesson11 | Set-Content -Path (Join-Path $fp "11-lesson.md") -Encoding UTF8

# ---------- 12 ----------
$lesson12 = @'
# Lesson 12 - From Data to Insight Flow - DIKW Pyramid

**Course:** ws_01 | **ID:** ws_01_l12 | **Duration:** 60 min | **Level:** Beginner

### Learning Objectives
- Explain DIKW pyramid: Data, Information, Knowledge, Wisdom
- Move raw data up pyramid with Nigerian examples
- Understand why most people stop at Information and never reach Wisdom

### 1. The DIKW Pyramid - 4 Levels

**Level 1: Data - Raw numbers, facts, observations without context.**
Example: 2000, 2500, 1800, 3000, 2200. What are these? Just numbers. Could be anything. Could be sales, could be ages. No context, no meaning. This is what you get from database dump.

**Level 2: Information - Data organized and given context. Answers who, what, when, where.**
Example: Take those numbers and organize: Sales on Monday: 2000 naira, Tuesday: 2500, Wednesday: 1800, Thursday: 3000, Friday: 2200. Now we know they are daily sales, with days. We can calculate: Average sales = 2300 naira. Max = 3000 on Thursday. Min = 1800 on Wednesday. This is information. You organized data.

Most analysts stop here. They give you report: Average sales 2300. But so what? What should business do?

**Level 3: Knowledge - Pattern, understanding of how and why. Answers how.**
Example: Look at information over 3 months and find pattern: Sales drop 15% whenever price increased by more than 10%. Sales increase 20% on Fridays because salary week. Sales of rice increase when beans price increases (substitution). This is knowledge. You found pattern and relationship.

How to get knowledge? Through exploratory data analysis, correlation, grouping.

**Level 4: Wisdom - Action, decision, judgment. Answers what should we do, what is best.**
Example: Based on knowledge that sales drop 15% when price increases over 10%, wisdom is: Do not increase price more than 10% without offering discount to loyal customers to retain them. Or: Since sales increase 20% on Fridays, increase stock on Fridays and offer Friday promo to maximize.

Wisdom is where business value is created. It requires experience, domain knowledge, and understanding of business constraints, not just data.

### 2. Nigerian Example - POS Business

- **Data:** Transactions: 5000, 7000, 3000, 8000 (just numbers)
- **Information:** Daily profit: Monday 5000, Tuesday 7000, Wednesday 3000, Thursday 8000. Average profit 5750. Thursday highest.
- **Knowledge:** Pattern: Profit drops on Wednesdays because market is closed, customers fewer. Profit high on Thursdays because market day, more foot traffic. Customers who buy airtime also buy data 60% of time.
- **Wisdom:** Action: Reduce airtime stock on Wednesdays, increase on Thursdays. Place data bundles next to airtime to increase cross-sell. Offer Wednesday discount to attract customers on slow day.

See how value increases as you move up pyramid. Data alone is worthless. Wisdom is worth millions.

### 3. Visual - DIKW Pyramid[STRIPPED 13 bytes]"100%" height="200" viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <polygon points="200,10 30,190 370,190" fill="#FFFBEB" stroke="#92400E" stroke-width="2.5"/>
  <line x1="70" y1="145" x2="330" y2="145" stroke="#92400E" stroke-width="1" stroke-dasharray="4 4"/>
  <line x1="100" y1="105" x2="300" y2="105" stroke="#92400E" stroke-width="1" stroke-dasharray="4 4"/>
  <line x1="130" y1="65" x2="270" y2="65" stroke="#92400E" stroke-width="1" stroke-dasharray="4 4"/>
  <text x="200" y="40" text-anchor="middle" font-weight="800" font-family="sans-serif" font-size="13">Wisdom</text>
  <text x="200" y="55" text-anchor="middle" font-size="9" font-family="sans-serif">What should we do?</text>
  <text x="200" y="85" text-anchor="middle" font-weight="700" font-family="sans-serif" font-size="11">Knowledge</text>
  <text x="200" y="98" text-anchor="middle" font-size="9" font-family="sans-serif">Pattern, Why?</text>
  <text x="200" y="125" text-anchor="middle" font-weight="700" font-family="sans-serif" font-size="11">Information</text>
  <text x="200" y="138" text-anchor="middle" font-size="9" font-family="sans-serif">Organized, Who What When</text>
  <text x="200" y="165" text-anchor="middle" font-weight="700" font-family="sans-serif" font-size="11">Data</text>
  <text x="200" y="178" text-anchor="middle" font-size="9" font-family="sans-serif">Raw numbers, facts</text>
  <text x="350" y="50" text-anchor="middle" font-size="9" font-family="sans-serif" fill="#92400E">Value ↑</text>
  <text x="50" y="50" text-anchor="middle" font-size="9" font-family="sans-serif" fill="#92400E">Few people reach here</text>
</svg>

Most beginners stay at Data and Information (reporting average). Good Data Scientists reach Knowledge (finding pattern). Great Data Scientists reach Wisdom (recommending action that makes money).

### 4. How to Move Up Pyramid - Practical Steps

- **Data to Information:** Organize, clean, add context (what, when, where). Use SQL, Excel, Pandas. Add column names, units, dates.

- **Information to Knowledge:** Explore, find patterns. Use EDA, correlation, grouping, visualization. Ask why? Why sales drop on Wednesday? Why customers churn? Look for relationships.

- **Knowledge to Wisdom:** Add domain expertise and business judgment. Pattern is sales drop when price increase over 10%. Wisdom: Don't increase over 10% without discount, or increase only for new customers not loyal ones. This requires understanding business, not just data.

Wisdom also requires understanding constraints: You may know optimal price is 2000, but supplier cost is 1800, so you cannot sell below 1900. Wisdom considers constraints.

### 5. Exercise

Take your POS business or any business you know:

- Write 5 raw data points (e.g., transactions: 2000, 3000...)
- Convert to Information: Add context (daily sales)
- Convert to Knowledge: Find pattern (sales high on market days)
- Convert to Wisdom: Recommend action (increase stock on market days, offer promo on slow days)

Do this in your notebook. This exercise forces you to move up pyramid.

### 6. Common Pitfall

Many analysts present Information as if it is Wisdom. Example: "Average sales is 2300" - So what? What should owner do? No action. That's Information, not Wisdom.

Wisdom must have action: "Average sales 2300, but Thursday 3000, Wednesday 1800. Recommend increase stock Thursday, offer discount Wednesday to balance."

Always end your analysis with "So what should we do?" That is Wisdom.

### 7. Checklist
- I can explain DIKW with sales example without looking
- I can take raw data and move it up to Wisdom with action
- I understand why most people stop at Information and how to go further to Wisdom
'@
$lesson12 | Set-Content -Path (Join-Path $fp "12-lesson.md") -Encoding UTF8

Write-Host "DONE: 09-12 FULL with detailed explanations and SVG" -ForegroundColor Green
Get-ChildItem $fp | Where-Object { $_.Name -match "0[9]|1[0-2]-lesson.md" } | Sort-Object Name | ForEach-Object { Write-Host $_.Name -ForegroundColor Cyan }