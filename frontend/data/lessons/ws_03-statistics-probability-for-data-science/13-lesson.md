# Lesson 13 - Chi-Square Test & Correlation - Are Two Variables Related?

**Duration:** 90 min | **Level:** Absolute Beginner | **Goal:** Test if categorical variables are associated and measure linear relationship between continuous variables

## What You Will Learn

By the end of this lesson, you will be able to:

- Explain difference between categorical vs continuous variables and which tests for which
- Define Chi-Square test for independence: Test if two categorical variables are independent H₀: independent vs H₁: dependent associated
- Calculate expected frequencies E = (row total × column total)/grand total and Chi-Square statistic χ² = Σ (O − E)²/E where O observed frequency
- Explain degrees of freedom for Chi-Square df = (rows − 1) × (columns − 1) and interpret χ² large means observed far from expected under independence
- Distinguish Chi-Square goodness-of-fit (one categorical variable vs expected distribution) vs independence (two categorical variables)
- Define correlation coefficient r for continuous variables: Measures linear relationship −1 to +1, r=1 perfect positive, r=-1 perfect negative, r=0 no linear relationship
- Explain Pearson correlation formula and when to use vs Spearman rank correlation for monotonic non-linear or ordinal data
- Distinguish correlation vs causation: Correlation doesn't imply causation, lurking variable, spurious correlation
- Calculate Chi-Square and correlation using SciPy chi2_contingency and pearsonr, spearmanr
- Apply to sales data: Test if customer_state and payment_type associated, correlation between payment_value and payment_installments

---

## 1. Categorical vs Continuous - Which Test?

- **Categorical:** Values are categories, groups, not numbers with meaning. Example: customer_state SP, RJ, customer_city, payment_type credit_card, boleto, store_id LAG_001_Ikeja, product category. You count frequencies per category.

- **Continuous:** Numeric values where mean makes sense. Example: payment_value, price, quantity, total, age. You can calculate correlation between two continuous.

**Tests:**
- Two categorical variables related? Use Chi-Square test of independence. Example: Is customer_state related to payment_type? Do SP customers prefer credit_card more than RJ?
- Two continuous variables related linearly? Use correlation r. Example: Does payment_value increase with payment_installments?
- One categorical vs one continuous? Use t-test or ANOVA (L12) - compare mean continuous across categories.

---

## 2. Chi-Square Test of Independence - Two Categorical Variables

### What is Chi-Square Test?

Test if two categorical variables independent (no association) or dependent (associated).

Example: customer_state (SP, RJ) and payment_type (credit_card, boleto). Are they independent? If independent, distribution of payment_type same for SP and RJ. If dependent, SP prefers credit_card more.

H₀: Variables independent, no association
H₁: Variables dependent, associated

### Observed vs Expected Frequencies

Make contingency table (cross-tab) counts.

Example: 100 orders

|               | credit_card | boleto | Row total |
|---------------|-------------|--------|-----------|
| SP            | 50          | 10     | 60        |
| RJ            | 20          | 20     | 40        |
| Column total  | 70          | 30     | 100 grand |

Observed O: O_SP_credit=50 etc.

If H₀ independent, expected frequency E = (row total × column total)/grand total

E_SP_credit = (60×70)/100 =42
E_SP_boleto = (60×30)/100=18
E_RJ_credit = (40×70)/100=28
E_RJ_boleto = (40×30)/100=12

If observed far from expected, evidence against independence.

### Chi-Square Statistic

χ² = Σ (O − E)² / E sum over all cells

Large χ² means O far from E, evidence against H₀ independence.

For example:
χ² = (50−42)²/42 + (10−18)²/18 + (20−28)²/28 + (20−12)²/12 = 64/42 +64/18 +64/28 +64/12 =1.52+3.56+2.29+5.33=12.70

Degrees of freedom df = (rows−1)×(columns−1) = (2−1)×(2−1)=1

p-value = P(χ²_df ≥ observed χ² | H₀ true) using Chi-Square distribution with df.

If p ≤ α=0.05 reject H₀ dependent associated.

In example χ²=12.7 df=1 p≈0.00036 small reject H₀, SP and payment_type dependent.

### Assumptions

- Expected frequencies E ≥5 in each cell (or at least 80% cells E≥5 and no E<1) for Chi-Square approximation valid. If small expected, use Fisher exact test for 2×2.

### Visual: Observed vs Expected

<svg width="100%" height="200" viewBox="0 0 700 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="200" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">CHI-SQUARE TEST - χ²=Σ(O-E)²/E - E=(row×column)/grand total - df=(r-1)(c-1)</text>
  <rect x="20" y="50" width="300" height="130" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
  <text x="170" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#1E40AF">Observed O</text>
  <text x="35" y="90" font-family="Arial" font-size="8" fill="#1E40AF">SP credit 50 boleto 10 total 60</text>
  <text x="35" y="108" font-family="Arial" font-size="8" fill="#1E40AF">RJ credit 20 boleto 20 total 40</text>
  <text x="35" y="126" font-family="Arial" font-size="8" fill="#1E40AF">Total credit 70 boleto 30 grand 100</text>
  <rect x="380" y="50" width="300" height="130" rx="12" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1"/>
  <text x="530" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#065F46">Expected E if H₀ independent</text>
  <text x="395" y="90" font-family="Arial" font-size="8" fill="#065F46">E_SP_credit=(60×70)/100=42</text>
  <text x="395" y="108" font-family="Arial" font-size="8" fill="#065F46">E_SP_boleto=(60×30)/100=18</text>
  <text x="395" y="126" font-family="Arial" font-size="8" fill="#065F46">χ²=Σ(O-E)²/E=12.7 df=1 p=0.00036 reject H₀ dependent</text>
</svg>

### Code Simple→Advanced - Chi-Square

**Method 1 Plain Python Manual:**

```python
# Method 1: Manual Chi-Square independence
import math
from scipy import stats

# Observed table 2x2
# SP: credit 50 boleto 10 total 60
# RJ: credit 20 boleto 20 total 40
# Col totals credit 70 boleto 30 grand 100

observed = [
    [50, 10],  # SP row
    [20, 20]   # RJ row
]

row_totals = [sum(row) for row in observed]
col_totals = [sum(observed[i][j] for i in range(len(observed))) for j in range(len(observed[0]))]
grand_total = sum(row_totals)

print(f"Observed:")
for i,row in enumerate(observed):
    print(f"Row {i} {row} total {row_totals[i]}")
print(f"Col totals {col_totals} grand {grand_total}")

# Expected E = (row×col)/grand
expected = []
for i in range(len(observed)):
    exp_row=[]
    for j in range(len(observed[0])):
        e = row_totals[i]*col_totals[j]/grand_total
        exp_row.append(e)
    expected.append(exp_row)

print(f"\\nExpected if H₀ independent E=(row×col)/grand:")
for i,row in enumerate(expected):
    print(f"Row {i} {row}")

# Chi-Square χ²=Σ(O-E)²/E
chi2=0
for i in range(len(observed)):
    for j in range(len(observed[0])):
        o=observed[i][j]
        e=expected[i][j]
        chi2 += (o-e)**2 / e
        print(f"Cell ({i},{j}) O={o} E={e:.1f} (O-E)²/E={(o-e)**2/e:.3f} running χ²={chi2:.3f}")

print(f"\\nχ²=Σ(O-E)²/E={chi2:.3f}")

# df = (r-1)(c-1)
r=len(observed)
c=len(observed[0])
df=(r-1)*(c-1)
print(f"df=(r-1)(c-1)=({r}-1)({c}-1)={df}")

# p-value P(χ²_df ≥ observed | H₀)
p_value = 1 - stats.chi2.cdf(chi2, df=df)
print(f"p-value =P(χ²_{df}≥{chi2:.3f}|H₀)={p_value:.5f}")

alpha=0.05
print(f"α={alpha} p={p_value:.5f} → {'Reject H₀ dependent associated' if p_value<=alpha else 'Fail to reject H₀ independent'}")
```

**Method 2 SciPy chi2_contingency:**

```python
# Method 2: SciPy chi2_contingency
from scipy import stats
import numpy as np

observed = np.array([
    [50,10],
    [20,20]
])

chi2, p, df, expected = stats.chi2_contingency(observed)

print(f"SciPy chi2_contingency")
print(f"Observed:\\n{observed}")
print(f"Expected:\\n{expected}")
print(f"χ²={chi2:.3f} df={df} p={p:.5f} → {'Reject H₀ dependent' if p<=0.05 else 'Fail to reject'}")

# With Yates correction for 2x2? chi2_contingency has correction=True by default for 2x2
# correction reduces χ² slightly more conservative
chi2_no_corr, p_no_corr, df_no_corr, exp_no_corr = stats.chi2_contingency(observed, correction=False)
print(f"\\nWithout Yates correction χ²={chi2_no_corr:.3f} p={p_no_corr:.5f} - Yates correction more conservative")
```

**Method 3 Pandas crosstab:**

```python
import pandas as pd
from scipy import stats

# Create DataFrame
df = pd.DataFrame({
    "customer_state": ["SP"]*60 + ["RJ"]*40,
    "payment_type": ["credit_card"]*50 + ["boleto"]*10 + ["credit_card"]*20 + ["boleto"]*20
})

# Contingency table
contingency = pd.crosstab(df["customer_state"], df["payment_type"])
print(f"Contingency table:\\n{contingency}")

chi2, p, df, expected = stats.chi2_contingency(contingency)
print(f"\\nχ²={chi2:.3f} df={df} p={p:.5f} → {'Dependent' if p<=0.05 else 'Independent'}")

# Expected DataFrame
expected_df = pd.DataFrame(expected, index=contingency.index, columns=contingency.columns)
print(f"Expected:\\n{expected_df}")
```

---

## 3. Chi-Square Goodness-of-Fit - One Categorical vs Expected Distribution

Test if one categorical variable follows expected distribution.

Example: Payment_type distribution expected 70% credit_card 20% boleto 10% voucher. Sample 100 orders 60 credit 30 boleto 10 voucher. Does sample follow expected?

H₀: Observed follows expected distribution
H₁: Observed does not follow expected

χ² = Σ (O − E)² / E where E = n × p_expected

df = categories − 1 − parameters estimated (usually categories−1)

Code:

```python
from scipy import stats

# Observed
observed = [60,30,10]  # credit, boleto, voucher
n=sum(observed)
# Expected proportions
expected_props = [0.7,0.2,0.1]
expected = [n*p for p in expected_props]

chi2= sum((o-e)**2/e for o,e in zip(observed, expected))
df=len(observed)-1
p_value=1-stats.chi2.cdf(chi2, df=df)

print(f"Goodness-of-fit H₀: follows expected {expected_props}")
print(f"Observed {observed} Expected {expected}")
print(f"χ²={chi2:.3f} df={df} p={p_value:.4f} → {'Reject H₀ not follow expected' if p_value<=0.05 else 'Fail to reject follows expected'}")

# SciPy chisquare
chi2_scipy, p_scipy = stats.chisquare(f_obs=observed, f_exp=expected)
print(f"SciPy chisquare χ²={chi2_scipy:.3f} p={p_scipy:.4f} matches manual")
```

---

## 4. Correlation - Linear Relationship Between Two Continuous Variables

### What is Correlation?

Correlation measures linear relationship between two continuous variables.

Pearson correlation r = covariance / (std₁ × std₂)

Formula: r = Σ(x_i − x̄)(y_i − ȳ) / √(Σ(x_i − x̄)² Σ(y_i − ȳ)²)

Range −1 to +1:
- r = 1 perfect positive linear: As x increases, y increases perfectly linear
- r = −1 perfect negative linear: As x increases, y decreases perfectly linear
- r = 0 no linear relationship (but may have non-linear relationship!)
- r = 0.7 strong positive, r = 0.3 weak positive

r² = coefficient of determination = proportion of variance in y explained by x linear relationship. r=0.7 r²=0.49 49% variance explained.

### Pearson vs Spearman

- **Pearson r:** Measures linear relationship, requires continuous approx normal, sensitive to outliers, assumes linear.

- **Spearman ρ (rho):** Rank correlation, measures monotonic relationship (increasing/decreasing not necessarily linear), based on ranks, robust to outliers, works for ordinal data or non-linear monotonic.

If relationship non-linear but monotonic (e.g., y = x² increasing), Pearson may be low but Spearman high.

### Correlation vs Causation

Correlation does not imply causation! Two variables may correlate due to lurking third variable or coincidence.

Example: Ice cream sales and drowning deaths correlate positive (both increase in summer, lurking variable temperature), but ice cream doesn't cause drowning.

Spurious correlation: Random correlation with no causal link.

Need experiments or domain knowledge for causation, not just correlation.

### Visual: Correlation Examples

<svg width="100%" height="200" viewBox="0 0 700 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="200" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">CORRELATION r -1 TO +1 - LINEAR RELATIONSHIP</text>
  <rect x="20" y="50" width="150" height="130" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
  <text x="95" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#1E40AF">r=1 Perfect Positive</text>
  <text x="35" y="90" font-family="Arial" font-size="8" fill="#1E40AF">• • • • diagonal up</text>
  <text x="35" y="108" font-family="Arial" font-size="8" fill="#1E40AF">As x↑ y↑ linear</text>
  <rect x="190" y="50" width="150" height="130" rx="12" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1"/>
  <text x="265" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#065F46">r=-1 Perfect Negative</text>
  <text x="205" y="90" font-family="Arial" font-size="8" fill="#065F46">• • • • diagonal down</text>
  <text x="205" y="108" font-family="Arial" font-size="8" fill="#065F46">As x↑ y↓ linear</text>
  <rect x="360" y="50" width="150" height="130" rx="12" fill="#FFFBEB" stroke="#FCD34D" stroke-width="1"/>
  <text x="435" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#92400E">r=0 No Linear</text>
  <text x="375" y="90" font-family="Arial" font-size="8" fill="#92400E">• • random cloud</text>
  <text x="375" y="108" font-family="Arial" font-size="8" fill="#92400E">No linear pattern</text>
  <rect x="530" y="50" width="150" height="130" rx="12" fill="#FEF2F2" stroke="#FCA5A5" stroke-width="1"/>
  <text x="605" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#7F1D1D">r=0 but non-linear!</text>
  <text x="545" y="90" font-family="Arial" font-size="8" fill="#7F1D1D">• • parabola y=x²</text>
  <text x="545" y="108" font-family="Arial" font-size="8" fill="#7F1D1D">r=0 no linear but y=x² relation</text>
  <text x="545" y="126" font-family="Arial" font-size="8" fill="#7F1D1D">Need Spearman or plot</text>
</svg>

### Code Simple→Advanced - Correlation

**Method 1 Plain Python Manual Pearson:**

```python
# Method 1: Manual Pearson r
import math

# Example: payment_value vs payment_installments
x = [100,200,300,400,500]  # payment_value
y = [1,2,3,4,5]  # installments - perfect positive linear

n=len(x)
x_bar = sum(x)/n
y_bar = sum(y)/n

# Numerator Σ(x-x̄)(y-ȳ)
numer = sum((xi - x_bar)*(yi - y_bar) for xi,yi in zip(x,y))
# Denom √(Σ(x-x̄)² Σ(y-ȳ)²)
denom_x = sum((xi - x_bar)**2 for xi in x)
denom_y = sum((yi - y_bar)**2 for yi in y)
denom = math.sqrt(denom_x * denom_y)

r = numer/denom if denom!=0 else 0

print(f"x={x} x̄={x_bar}")
print(f"y={y} ȳ={y_bar}")
print(f"Numer Σ(x-x̄)(y-ȳ)={numer}")
print(f"Denom √(Σ(x-x̄)²Σ(y-ȳ)²)=√({denom_x}×{denom_y})=√{denom_x*denom_y}={denom:.1f}")
print(f"Pearson r={numer}/{denom:.1f}={r:.3f} perfect positive linear")

# No linear example
x2=[1,2,3,4,5]
y2=[1,4,9,16,25]  # y=x² non-linear monotonic
x2_bar=sum(x2)/len(x2)
y2_bar=sum(y2)/len(y2)
numer2=sum((xi-x2_bar)*(yi-y2_bar) for xi,yi in zip(x2,y2))
denom_x2=sum((xi-x2_bar)**2 for xi in x2)
denom_y2=sum((yi-y2_bar)**2 for yi in y2)
r2=numer2/math.sqrt(denom_x2*denom_y2)
print(f"\\nNon-linear y=x² x={x2} y={y2} Pearson r={r2:.3f} <1 even though monotonic increasing - Pearson measures linear only")
```

**Method 2 SciPy pearsonr, spearmanr:**

```python
from scipy import stats
import numpy as np

np.random.seed(0)

# Perfect positive linear
x = np.array([100,200,300,400,500])
y = np.array([1,2,3,4,5])

r_pearson, p_pearson = stats.pearsonr(x, y)
print(f"Perfect linear x={x} y={y}")
print(f"Pearson r={r_pearson:.3f} p={p_pearson:.4f} - p tests H₀: r=0 vs H₁: r≠0")

# Non-linear monotonic y=x²
x2 = np.array([1,2,3,4,5])
y2 = np.array([1,4,9,16,25])

r_pearson2, p_pearson2 = stats.pearsonr(x2, y2)
r_spearman2, p_spearman2 = stats.spearmanr(x2, y2)

print(f"\\nNon-linear monotonic y=x² x={x2} y={y2}")
print(f"Pearson r={r_pearson2:.3f} <1 measures linear only")
print(f"Spearman ρ={r_spearman2:.3f}=1 perfect monotonic rank correlation - Spearman captures monotonic non-linear")

# No correlation random
x_rand = np.random.normal(0,1,100)
y_rand = np.random.normal(0,1,100)
r_rand, p_rand = stats.pearsonr(x_rand, y_rand)
print(f"\\nRandom no correlation r={r_rand:.3f} p={p_rand:.4f} → {'No significant linear' if p_rand>0.05 else 'Significant'}")

# Real example: payment_value vs installments may have weak positive correlation
# Higher value may have more installments?
# Simulate
payment_value = np.random.normal(200,50,100)
payment_installments = payment_value/50 + np.random.normal(0,1,100)  # Weak positive
r_real, p_real = stats.pearsonr(payment_value, payment_installments)
print(f"\\nSimulated payment_value vs installments r={r_real:.3f} p={p_real:.4f} - weak positive if r~0.3")
```

**Method 3 Pandas:**

```python
import pandas as pd
import numpy as np
from scipy import stats

np.random.seed(0)

df = pd.DataFrame({
    "payment_value": np.random.normal(200,50,100),
    "payment_installments": np.random.randint(1,10,100)
})

# Pandas corr
r_pandas = df["payment_value"].corr(df["payment_installments"])
print(f"Pandas corr payment_value vs installments r={r_pandas:.3f}")

# Full correlation matrix
corr_matrix = df.corr()
print(f"\\nCorrelation matrix:\\n{corr_matrix}")

# SciPy with p-value
r, p = stats.pearsonr(df["payment_value"], df["payment_installments"])
print(f"\\nSciPy Pearson r={r:.3f} p={p:.4f} H₀: r=0 vs H₁: r≠0 → {'Significant correlation' if p<=0.05 else 'No significant correlation'}")
```

---

## 5. Real Store Example

```python
import pandas as pd
import numpy as np
from scipy import stats

# Simulate store data with categorical and continuous
np.random.seed(0)

# Categorical: customer_state SP,RJ and payment_type credit, boleto
# Test independence
data_cat = pd.DataFrame({
    "customer_state": ["SP"]*60 + ["RJ"]*40,
    "payment_type": ["credit_card"]*50 + ["boleto"]*10 + ["credit_card"]*20 + ["boleto"]*20
})

contingency = pd.crosstab(data_cat["customer_state"], data_cat["payment_type"])
chi2, p, df, expected = stats.chi2_contingency(contingency)
print(f"Chi-Square SP vs payment_type χ²={chi2:.3f} p={p:.5f} → {'Dependent' if p<=0.05 else 'Independent'}")
print(f"Contingency:\\n{contingency}")

# Continuous correlation: payment_value vs installments
data_cont = pd.DataFrame({
    "payment_value": np.random.normal(200,50,100),
    "payment_installments": np.random.normal(5,2,100)
})
# Add some correlation
data_cont["payment_installments"] = data_cont["payment_value"]/50 + np.random.normal(0,1,100)

r, p_corr = stats.pearsonr(data_cont["payment_value"], data_cont["payment_installments"])
print(f"\\nCorrelation payment_value vs installments r={r:.3f} p={p_corr:.4f} → {'Significant' if p_corr<=0.05 else 'Not significant'}")
print(f"r²={r**2:.3f} {r**2*100:.1f}% variance explained")
print(f"Correlation ≠ causation - lurking variable maybe product category?")
```

---

## 6. Hands-On Assignment

Dataset: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - customer_state categorical, payment_type categorical, payment_value continuous, payment_installments continuous

Create chisquare_correlation_L13.py:

Section A Chi-Square independence:

```python
from scipy import stats
import numpy as np
observed=np.array([[50,10],[20,20]])
chi2,p,df,expected=stats.chi2_contingency(observed)
print(f"Chi-Square independence H₀: independent χ²={chi2:.3f} df={df} p={p:.5f} → {'Reject H₀ dependent' if p<=0.05 else 'Fail to reject'}")
print(f"E=(row×col)/grand Expected:\\n{expected}")
print(f"Assumption E≥5 check {(expected>=5).all()} OK")
```

Section B Goodness-of-fit:

```python
from scipy import stats
observed=[60,30,10]
expected=[70,20,10]  # n=100 × props 0.7,0.2,0.1
chi2,p=stats.chisquare(f_obs=observed, f_exp=expected)
print(f"Goodness-of-fit H₀: follows expected χ²={chi2:.3f} p={p:.4f} → {'Reject' if p<=0.05 else 'Fail to reject'}")
```

Section C Pearson vs Spearman:

```python
from scipy import stats
import numpy as np
x=np.array([1,2,3,4,5])
y_linear=np.array([1,2,3,4,5])
y_nonlinear=np.array([1,4,9,16,25])
r_lin,p_lin=stats.pearsonr(x,y_linear)
r_nonlin,p_nonlin=stats.pearsonr(x,y_nonlinear)
rho_nonlin,p_rho=stats.spearmanr(x,y_nonlinear)
print(f"Linear y=x Pearson r={r_lin:.3f}=1 perfect linear")
print(f"Non-linear y=x² Pearson r={r_nonlin:.3f}<1 linear only")
print(f"Non-linear y=x² Spearman ρ={rho_nonlin:.3f}=1 perfect monotonic")
```

Section D Kaggle:

```python
import os, pandas as pd
from scipy import stats

if os.path.exists("olist_customers_dataset.csv") and os.path.exists("olist_order_payments_dataset.csv") and os.path.exists("olist_orders_dataset.csv"):
    df_cust=pd.read_csv("olist_customers_dataset.csv", nrows=10000)
    df_pay=pd.read_csv("olist_order_payments_dataset.csv", nrows=10000)
    df_orders=pd.read_csv("olist_orders_dataset.csv", nrows=10000)
    
    merged=pd.merge(df_pay, df_orders[["order_id","customer_id"]], on="order_id", how="inner")
    merged=pd.merge(merged, df_cust[["customer_id","customer_state"]], on="customer_id", how="inner")
    
    # Chi-Square customer_state vs payment_type
    # Take top 2 states SP RJ and top 2 payment types credit_card boleto for 2x2
    merged_filtered=merged[merged["customer_state"].isin(["SP","RJ"]) & merged["payment_type"].isin(["credit_card","boleto"])]
    if len(merged_filtered)>20:
        contingency=pd.crosstab(merged_filtered["customer_state"], merged_filtered["payment_type"])
        chi2,p,df,expected=stats.chi2_contingency(contingency)
        print(f"Chi-Square customer_state SP,RJ vs payment_type credit,boleto")
        print(f"Contingency:\\n{contingency}")
        print(f"χ²={chi2:.3f} df={df} p={p:.4e} → {'Dependent associated' if p<=0.05 else 'Independent'}")
    
    # Correlation payment_value vs payment_installments
    vals=merged[["payment_value","payment_installments"]].dropna()
    if len(vals)>20:
        r,p_corr=stats.pearsonr(vals["payment_value"], vals["payment_installments"])
        print(f"\\nCorrelation payment_value vs installments r={r:.3f} p={p_corr:.4e} r²={r**2:.3f} → {'Significant' if p_corr<=0.05 else 'Not significant'}")
        print(f"Correlation ≠ causation - lurking variable maybe product price?")
else:
    print("Download https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce need customers, orders, payments for joins")
```

Deliverable: Upload chisquare_correlation_L13.py + output showing χ²=Σ(O-E)²/E E=(row×col)/grand df=(r-1)(c-1) p small reject H₀ dependent, goodness-of-fit χ²=Σ(O-E)²/E df=categories-1, Pearson r Σ(x-x̄)(y-ȳ)/√(Σ(x-x̄)²Σ(y-ȳ)²) -1 to +1 r=1 perfect positive r=-1 perfect negative r=0 no linear but may have non-linear, Spearman rank monotonic, correlation≠causation lurking variable.

Kaggle:
1. Primary https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - customer_state vs payment_type Chi-Square, payment_value vs installments correlation
2. Secondary https://www.kaggle.com/datasets/vivek468/superstore-dataset-final - Region vs Category Chi-Square, Sales vs Profit correlation

## 7. Checklist
- Distinguish categorical categories count frequencies vs continuous numeric mean meaningful which test for which
- Define Chi-Square independence H₀ independent vs H₁ dependent observed vs expected E=(row×col)/grand χ²=Σ(O-E)²/E large means far from expected under independence df=(r-1)(c-1) p=P(χ²_df≥χ²|H₀)
- Explain expected E≥5 assumption Fisher exact for 2x2 small expected
- Explain goodness-of-fit one categorical vs expected distribution E=n×p_expected df=categories-1
- Define Pearson r=Σ(x-x̄)(y-ȳ)/√(Σ(x-x̄)²Σ(y-ȳ)²) -1 to +1 r=1 perfect positive linear r=-1 perfect negative r=0 no linear but may have non-linear r² proportion variance explained
- Explain Spearman ρ rank correlation monotonic non-linear ordinal robust to outliers
- Distinguish correlation vs causation lurking third variable spurious correlation need experiments domain knowledge
- Use SciPy chi2_contingency, chisquare, pearsonr, spearmanr

Key Takeaway: Two categorical related? Chi-Square χ²=Σ(O-E)²/E E=(row×col)/grand df=(r-1)(c-1) large χ² evidence against independence. One categorical vs expected goodness-of-fit. Two continuous linear related? Pearson r -1 to +1 linear, Spearman rank monotonic. Correlation≠causation.

