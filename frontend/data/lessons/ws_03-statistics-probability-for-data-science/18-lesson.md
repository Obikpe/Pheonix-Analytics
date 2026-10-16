# Lesson 18 - Capstone Project & Review - Full Statistical Analysis of Your Store

**Duration:** 120 min | **Level:** Absolute Beginner | **Goal:** Combine all statistical methods from L1-L17 to analyze real sales data end-to-end

## What You Will Learn

By the end of this lesson, you will be able to:

- Apply complete statistical workflow: Define question, collect data via proper sampling, explore data EDA, visualize distributions, calculate descriptive statistics x̄, s, median, IQR, check assumptions, build confidence intervals, test hypotheses, check correlation, build regression, forecast time series, interpret results with statistical and practical significance, make business recommendations
- Review key concepts from all lessons L01-L17 with proper notation x̄, μ, σ, p̂, z, t, χ², r, β₀, β₁, P(A|B)
- Build capstone project analyzing Brazilian e-commerce dataset or Superstore dataset end-to-end
- Explain how to avoid common pitfalls: Sampling bias, p-hacking, confusing correlation vs causation, misinterpreting p-value and confidence interval, ignoring assumptions LINE, overfitting
- Present statistical findings to non-technical audience: Use simple language, visuals, focus on business impact not just p-values

---

## 1. Statistical Workflow - End-to-End

### Steps

1. **Define Business Question:** What do you want to know? Example: Is mean payment_value different across customer_states? Does payment_installments predict payment_value? Is new checkout page better than old?

2. **Collect Data via Proper Sampling:** Use SRS, stratified, cluster, systematic to get representative sample, avoid convenience voluntary bias, calculate required n = (zσ/E)² for mean or n = (z²p(1-p))/E² for proportion for desired margin.

3. **Explore Data EDA:** Descriptive statistics x̄ mean, median, s std, IQR, min max, missing values, distributions histogram, boxplot outliers, check data types categorical vs continuous.

4. **Visualize:** Histogram for distribution, boxplot for groups comparison, scatterplot for correlation, time series plot for trend seasonality.

5. **Check Assumptions:** For t-test need approximate normal or large n≥30 CLT, for ANOVA normality within groups and equal variances, for regression LINE linearity independence normality equal variance homoscedasticity, for Chi-Square E≥5.

6. **Build Confidence Intervals:** For mean x̄ ± z×σ/√n σ known or x̄ ± t×s/√n σ unknown df=n-1, for proportion p̂ ± z×√(p̂(1-p̂)/n), interpret correctly 95% of intervals from repeated sampling contain true parameter, not 95% chance parameter in this specific interval.

7. **Test Hypotheses:** Define H₀ null status quo = and H₁ alternative what you want to prove ≠ ><, calculate test statistic z=(x̄-μ₀)/(σ/√n) or t=(x̄-μ₀)/(s/√n) or χ²=Σ(O-E)²/E or r correlation, get p-value probability extreme data if H₀ true, decision reject H₀ if p≤α=0.05 statistically significant, fail to reject otherwise.

8. **Check Correlation and Regression:** Pearson r=Σ(x-x̄)(y-ȳ)/√(Σ(x-x̄)²Σ(y-ȳ)²) -1 to +1 linear relationship, Spearman ρ rank monotonic, regression ŷ=β₀+β₁x β₁=Σ(x-x̄)(y-ȳ)/Σ(x-x̄)² β₀=ȳ-β₁x̄ minimize Σ(y-ŷ)² R²=1-SS_res/SS_tot proportion variance explained.

9. **Forecast Time Series:** If data time ordered, check trend seasonality noise, autocorrelation r_k=Corr(y_t,y_{t-k}) lag k, naive ŷ_{t+1}=y_t baseline, SMA_k average last k, exponential smoothing ŷ_{t+1}=α×y_t+(1-α)×ŷ_t, evaluate MAE Σ|y-ŷ|/n RMSE √(Σ(y-ŷ)²/n) MAPE.

10. **Interpret with Statistical and Practical Significance:** Statistical significance p≤α unlikely chance, practical significance effect size meaningful business e.g., Cohen's d=(x̄₁-x̄₂)/pooled_std 0.2 small 0.5 medium 0.8 large, need both.

11. **Make Business Recommendations:** Translate statistical findings to business actions, avoid jargon, use visuals, focus on impact.

### Common Pitfalls

- **Sampling bias:** Convenience sample not representative, large n doesn't fix bias.
- **p-hacking:** Test many hypotheses until find significant p≤0.05 by chance, inflate Type I error. Need pre-register hypotheses and adjust for multiple comparisons (Bonferroni α/k).
- **Correlation vs causation:** Correlation doesn't imply causation, lurking variable, need experiment randomization for causation.
- **Misinterpret p-value:** p-value not probability H₀ true or H₁ true, not probability of replication, just probability extreme data if H₀ true. Small p not large effect.
- **Misinterpret confidence interval:** 95% CI not 95% probability parameter in this specific interval, parameter fixed interval random, 95% of intervals from repeated sampling contain true parameter.
- **Ignoring assumptions:** t-test needs approx normal or large n, regression needs LINE, Chi-Square needs E≥5.
- **Overfitting:** Complex model fits training data well but fails new data, need train/test split.

### Visual: Statistical Workflow

<svg width="100%" height="200" viewBox="0 0 700 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="200" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">STATISTICAL WORKFLOW END-TO-END</text>
  <rect x="20" y="20" width="660" height="160" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
  <text x="35" y="60" font-family="Arial" font-size="8" font-weight="800" fill="#1E40AF">1. Question → 2. Sampling SRS Stratified n=(zσ/E)² → 3. EDA x̄ s median IQR → 4. Visualize hist boxplot scatter</text>
  <text x="35" y="80" font-family="Arial" font-size="8" fill="#1E40AF">5. Check assumptions normal large n LINE E≥5 → 6. CI x̄±zσ/√n x̄±t s/√n p̂±z√(p̂(1-p̂)/n) → 7. Test H₀: μ=μ₀ vs H₁: μ≠μ₀ z=(x̄-μ₀)/SE p≤α reject</text>
  <text x="35" y="100" font-family="Arial" font-size="8" fill="#1E40AF">8. Correlation r=Σ(x-x̄)(y-ȳ)/√(...) -1 to +1 Regression ŷ=β₀+β₁x β₁=Σ(x-x̄)(y-ȳ)/Σ(x-x̄)² R²=1-SS_res/SS_tot</text>
  <text x="35" y="120" font-family="Arial" font-size="8" fill="#1E40AF">9. Time Series y_t Trend Seasonality Noise r_k=Corr(y_t,y_{t-k}) Naive ŷ_{t+1}=y_t SMA_k Exp α×y_t+(1-α)ŷ_t MAE RMSE MAPE</text>
  <text x="35" y="140" font-family="Arial" font-size="8" fill="#1E40AF">10. Statistical p≤α vs Practical effect size d=(x̄₁-x̄₂)/pooled_std → 11. Business Recommendations avoid pitfalls bias p-hacking correlation≠causation</text>
</svg>

---

## 2. Review L01-L17 Key Formulas With Proper Notation

### L01-L04 Descriptive Statistics
- Mean x̄ = Σx_i/n
- Median middle value
- Variance s² = Σ(x_i−x̄)²/(n-1) sample ddof=1
- Std s = √s²
- IQR = Q3−Q1

### L05 Probability
- P(A|B)=P(B|A)P(A)/P(B) Bayes
- P(A∩B)=P(A)P(B|A)

### L06 Random Variables
- Expected value E[X]=Σ x P(x)
- Variance Var(X)=E[(X−E[X])²]

### L07 Distributions
- Normal N(μ,σ²) bell curve 68-95-99.7 rule
- Binomial n trials p success P(X=k)=C(n,k)p^k(1-p)^{n-k}

### L08 Sampling Distributions
- x̄ ~ N(μ, σ²/n) approx via CLT if n large or population normal
- SE = σ/√n

### L09 CLT
- CLT: x̄ approx Normal even if population not normal if n≥30

### L10 Confidence Intervals
- z CI σ known: x̄ ± z_{α/2}×σ/√n z 1.96 95% 2.576 99% 1.645 90%
- t CI σ unknown: x̄ ± t_{α/2,df}×s/√n df=n-1 heavier tails t→z as n large
- Proportion: p̂ ± z×√(p̂(1−p̂)/n) need np≥5 n(1-p)≥5
- Correct interpretation 95% of intervals from repeated sampling contain true μ

### L11 Hypothesis Testing
- H₀ null = status quo H₁ alternative ≠>< what you want to prove
- Test statistic z=(x̄−μ₀)/(σ/√n) t=(x̄−μ₀)/(s/√n) df=n-1
- p-value P(extreme data|H₀ true) small p evidence against H₀
- Decision reject H₀ if p≤α=0.05 else fail to reject not accept
- Type I α false positive reject true H₀ Type II β false negative fail to reject false H₀ Power=1−β want 0.8 larger n increases power
- One-tailed vs two-tailed

### L12 Two-Sample & ANOVA
- Two-sample independent Welch t=(x̄₁−x̄₂)/√(s₁²/n₁+s₂²/n₂) H₀: μ₁=μ₂ df Welch-Satterthwaite equal_var=False recommended
- Paired d=X₁−X₂ per pair d̄ mean differences s_d std t=d̄/(s_d/√n) H₀: μ_d=0 df=n-1 more powerful if pairing meaningful
- ANOVA H₀: μ₁=μ₂=...=μ_k all equal H₁ at least one different F=between-group variance/within-group variance F large groups differ F≈1 no difference df₁=k-1 df₂=N-k post-hoc Tukey HSD

### L13 Chi-Square & Correlation
- Chi-Square independence H₀ independent vs H₁ dependent E=(row×col)/grand χ²=Σ(O−E)²/E df=(r-1)(c-1) p=P(χ²_df≥χ²|H₀) E≥5 assumption
- Goodness-of-fit one categorical vs expected E=n×p_expected df=categories-1
- Pearson r=Σ(x−x̄)(y−ȳ)/√(Σ(x−x̄)²Σ(y−ȳ)²) -1 to +1 r=1 perfect positive linear r=-1 perfect negative r=0 no linear but may have non-linear r² proportion variance explained
- Spearman ρ rank correlation monotonic non-linear ordinal robust
- Correlation≠causation lurking variable spurious

### L14 Regression & A/B Testing
- Regression ŷ=β₀+β₁x β₁=Σ(x−x̄)(y−ȳ)/Σ(x−x̄)²=Cov/Var=r×s_y/s_x change y per x β₀=ȳ−β₁x̄ y when x=0 passes through (x̄,ȳ) minimize Σ(y−ŷ)² R²=1-SS_res/SS_tot=r² simple
- Residual e=y−ŷ LINE assumptions linearity independence normality equal variance homoscedasticity
- A/B testing randomized experiment A control vs B treatment H₀: μ_A=μ_B H₁: μ_B>μ_A random assignment two-sample t-test t=(x̄_B−x̄_A)/√(s_A²/n_A+s_B²/n_B) sample size n≈16/d² per group α=0.05 power=0.8 effect size d=(μ_B−μ_A)/σ statistical vs practical significance

### L15 Bayesian
- Bayes P(A|B)=P(B|A)P(A)/P(B) prior belief P(A) before data likelihood P(B|A) data given hypothesis posterior P(A|B) updated belief evidence P(B) normalizing
- Frequentist probability long-run frequency parameters fixed data random vs Bayesian probability degree of belief parameters random distributions prior×likelihood∝posterior credible interval 95% probability parameter in interval intuitive
- Conjugate Beta prior+Binomial likelihood=Beta posterior Beta(α,β) for p mean α/(α+β) posterior Beta(α+k,β+n-k) mean (α+k)/(α+β+n) weighted average
- Bayesian A/B P(B better|A data)=P(p_B>p_A|data) via simulation posterior difference credible interval

### L16 Time Series
- y_t time ordered trend long-term seasonality repeating fixed period weekly yearly cyclical long non-fixed noise random
- Stationary constant mean variance autocorrelation vs non-stationary trend seasonality
- Autocorrelation r_k=Corr(y_t,y_{t-k}) lag k value k steps ago lag1 yesterday lag7 weekly peak stationary decays quickly non-stationary decays slowly differencing d_t=y_t−y_{t-1} makes stationary
- Naive ŷ_{t+1}=y_t baseline seasonal naive ŷ_{t+1}=y_{t+1-7} SMA_k average last k ŷ_{t+1}=(y_t+...+y_{t-k+1})/k exponential smoothing ŷ_{t+1}=α×y_t+(1-α)×ŷ_t weighted recent more weight
- MAE Σ|y−ŷ|/n RMSE √(Σ(y−ŷ)²/n) MAPE Σ|(y−ŷ)/y|/n×100%

### L17 Sampling & Experimental Design
- Sampling bias selection undercoverage non-response vs non-sampling measurement
- SRS every unit equal chance gold standard need list
- Stratified divide into strata homogeneous within SRS within ensures representation more precise proportional vs equal allocation mean Σ(N_h/N)x̄_h
- Cluster divide into clusters heterogeneous within randomly select clusters sample all within cheaper less precise
- Systematic every k-th k=N/n random start risk periodicity
- Convenience voluntary biased avoid
- Observational association not causation confounding vs experiment random assignment causation randomization replication blocking principles
- Sample size n=(zσ/E)² mean E=zσ/√n n=(z²p(1-p))/E² proportion E=z√(p(1-p)/n) worst case p=0.5

---

## 3. Capstone Project - Brazilian E-Commerce Full Analysis

We will apply all methods to Brazilian e-commerce dataset https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce

Dataset includes:
- olist_orders_dataset.csv order_id customer_id order_status order_purchase_timestamp
- olist_order_payments_dataset.csv order_id payment_sequential payment_type payment_installments payment_value
- olist_customers_dataset.csv customer_id customer_city customer_state
- olist_products_dataset.csv etc.

### Business Questions

1. What is mean payment_value? 95% CI? (L10)
2. Is mean payment_value different across customer_states SP vs RJ vs MG? Two-sample t-test and ANOVA (L12)
3. Is customer_state associated with payment_type? Chi-Square independence (L13)
4. Does payment_installments predict payment_value? Correlation and regression (L13, L14)
5. Daily orders time series trend seasonality? Forecast next 7 days with SMA and exponential smoothing (L16)
6. What sample size needed to estimate mean payment_value with margin ±10? (L17)
7. Bayesian updating for P(SP) proportion (L15)
8. A/B testing simulation: If we had two checkout versions, how to test if new better? (L14)

### Code Simple→Advanced - Capstone Full Analysis

```python
# Capstone Full Statistical Analysis - Brazilian E-Commerce
# Combine L01-L17

import os, pandas as pd, numpy as np, math
from scipy import stats
import matplotlib.pyplot as plt
from statsmodels.tsa.stattools import acf

print("=== CAPSTONE PROJECT - BRAZILIAN E-COMMERCE FULL ANALYSIS ===")
print("Dataset: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce")

# Check if files exist
required_files = ["olist_orders_dataset.csv", "olist_order_payments_dataset.csv", "olist_customers_dataset.csv"]
files_exist = all(os.path.exists(f) for f in required_files)

if not files_exist:
    print("Files not found, using simulated data for demo")
    print("Download from https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce")
    # Simulate
    np.random.seed(0)
    n=5000
    df_pay = pd.DataFrame({
        "order_id": range(n),
        "payment_type": np.random.choice(["credit_card","boleto","voucher"], size=n, p=[0.7,0.2,0.1]),
        "payment_installments": np.random.randint(1,10,size=n),
        "payment_value": np.random.normal(200,50,size=n)
    })
    df_cust = pd.DataFrame({
        "customer_id": range(n),
        "customer_state": np.random.choice(["SP","RJ","MG","RS"], size=n, p=[0.5,0.2,0.15,0.15])
    })
    df_orders = pd.DataFrame({
        "order_id": range(n),
        "customer_id": range(n),
        "order_purchase_timestamp": pd.date_range("2017-01-01", periods=n, freq="H")
    })
else:
    df_orders = pd.read_csv("olist_orders_dataset.csv", nrows=10000)
    df_pay = pd.read_csv("olist_order_payments_dataset.csv", nrows=10000)
    df_cust = pd.read_csv("olist_customers_dataset.csv", nrows=10000)

# Merge to get full data
df_merged = pd.merge(df_pay, df_orders[["order_id","customer_id","order_purchase_timestamp"]], on="order_id", how="inner")
df_merged = pd.merge(df_merged, df_cust[["customer_id","customer_state"]], on="customer_id", how="inner")
df_merged["order_purchase_timestamp"] = pd.to_datetime(df_merged["order_purchase_timestamp"])

print(f"\\n1. DESCRIPTIVE STATISTICS EDA L01-L04")
print(f"Data shape {df_merged.shape}")
print(f"Columns {df_merged.columns.tolist()}")
print(f"\\nPayment_value descriptive:")
print(df_merged["payment_value"].describe())
print(f"x̄={df_merged['payment_value'].mean():.2f} s={df_merged['payment_value'].std():.2f} median={df_merged['payment_value'].median():.2f} IQR={(df_merged['payment_value'].quantile(0.75)-df_merged['payment_value'].quantile(0.25)):.2f}")

print(f"\\n2. CONFIDENCE INTERVAL L10")
# 95% CI for mean payment_value σ unknown t interval
x_bar = df_merged["payment_value"].mean()
s = df_merged["payment_value"].std(ddof=1)
n = len(df_merged)
se = s/np.sqrt(n)
t_crit = stats.t.ppf(0.975, df=n-1)
ci_low = x_bar - t_crit*se
ci_high = x_bar + t_crit*se
print(f"Mean payment_value x̄={x_bar:.2f} s={s:.2f} n={n} SE=s/√n={se:.2f} df={n-1} t_95={t_crit:.3f}")
print(f"95% t CI = x̄±t×s/√n = [{ci_low:.2f}, {ci_high:.2f}] - we are 95% confident true mean between those")
print(f"Correct interpretation: 95% of intervals from repeated sampling contain true μ")

# Proportion CI P(credit_card)
p_hat = (df_merged["payment_type"]=="credit_card").mean()
se_prop = np.sqrt(p_hat*(1-p_hat)/n)
ci_low_prop = p_hat - 1.96*se_prop
ci_high_prop = p_hat + 1.96*se_prop
print(f"\\nProportion credit_card p̂={p_hat:.3f} n={n} 95% CI [{ci_low_prop:.3f}, {ci_high_prop:.3f}]")

print(f"\\n3. HYPOTHESIS TESTING L11")
# Test H₀: μ=200 vs H₁: μ≠200
mu0=200
t_stat, p_two = stats.ttest_1samp(df_merged["payment_value"], popmean=mu0)
print(f"One-sample t-test H₀: μ={mu0} vs H₁: μ≠{mu0} x̄={x_bar:.2f} t={t_stat:.3f} p={p_two:.4e} α=0.05 → {'Reject H₀ mean ≠200' if p_two<=0.05 else 'Fail to reject'}")
# Type I α false positive Type II β false negative Power=1-β

print(f"\\n4. TWO-SAMPLE & ANOVA L12")
# Two-sample SP vs RJ payment_value
sp = df_merged[df_merged["customer_state"]=="SP"]["payment_value"].dropna()
rj = df_merged[df_merged["customer_state"]=="RJ"]["payment_value"].dropna()
mg = df_merged[df_merged["customer_state"]=="MG"]["payment_value"].dropna()

if len(sp)>10 and len(rj)>10:
    t_stat2, p_two2 = stats.ttest_ind(sp, rj, equal_var=False)  # Welch
    print(f"Two-sample independent SP vs RJ H₀: μ_SP=μ_RJ")
    print(f"SP x̄={sp.mean():.2f} s={sp.std():.2f} n={len(sp)} RJ x̄={rj.mean():.2f} s={rj.std():.2f} n={len(rj)}")
    print(f"Welch t=(x̄₁-x̄₂)/√(s₁²/n₁+s₂²/n₂) t={t_stat2:.3f} p={p_two2:.4e} → {'Difference' if p_two2<=0.05 else 'No difference'}")
    # Effect size Cohen's d
    pooled_std = np.sqrt((sp.std()**2 + rj.std()**2)/2)
    cohen_d = (sp.mean()-rj.mean())/pooled_std
    print(f"Cohen's d={(sp.mean()-rj.mean()):.2f}/{pooled_std:.2f}={cohen_d:.2f} small 0.2 medium 0.5 large 0.8 practical significance")

# ANOVA SP RJ MG
if len(sp)>10 and len(rj)>10 and len(mg)>10:
    f_stat, p_anova = stats.f_oneway(sp, rj, mg)
    print(f"\\nANOVA SP RJ MG H₀: μ_SP=μ_RJ=μ_MG all equal")
    print(f"F=between/within={f_stat:.3f} p={p_anova:.4e} → {'At least one different' if p_anova<=0.05 else 'All equal'}")
    if p_anova<=0.05:
        # Tukey HSD
        from statsmodels.stats.multicomp import pairwise_tukeyhsd
        df_anova = pd.DataFrame({
            "payment_value": list(sp)[:100] + list(rj)[:100] + list(mg)[:100],
            "state": ["SP"]*min(100,len(sp)) + ["RJ"]*min(100,len(rj)) + ["MG"]*min(100,len(mg))
        })
        tukey = pairwise_tukeyhsd(endog=df_anova["payment_value"], groups=df_anova["state"], alpha=0.05)
        print(f"Tukey HSD post-hoc:\\n{tukey}")

print(f"\\n5. CHI-SQUARE & CORRELATION L13")
# Chi-Square customer_state vs payment_type
# Take top 2 states SP RJ and top 2 payment types credit boleto for 2x2
filtered = df_merged[df_merged["customer_state"].isin(["SP","RJ"]) & df_merged["payment_type"].isin(["credit_card","boleto"])]
if len(filtered)>20:
    contingency = pd.crosstab(filtered["customer_state"], filtered["payment_type"])
    chi2, p_chi, df_chi, expected = stats.chi2_contingency(contingency)
    print(f"Chi-Square SP,RJ vs credit,boleto H₀: independent")
    print(f"Contingency:\\n{contingency}")
    print(f"Expected E=(row×col)/grand:\\n{expected}")
    print(f"χ²=Σ(O-E)²/E={chi2:.3f} df={df_chi} p={p_chi:.4e} → {'Dependent associated' if p_chi<=0.05 else 'Independent'}")

# Correlation payment_value vs payment_installments
vals_corr = df_merged[["payment_value","payment_installments"]].dropna()
if len(vals_corr)>20:
    r, p_corr = stats.pearsonr(vals_corr["payment_value"], vals_corr["payment_installments"])
    rho, p_spear = stats.spearmanr(vals_corr["payment_value"], vals_corr["payment_installments"])
    print(f"\\nCorrelation payment_value vs installments")
    print(f"Pearson r=Σ(x-x̄)(y-ȳ)/√(Σ(x-x̄)²Σ(y-ȳ)²) r={r:.3f} p={p_corr:.4e} r²={r**2:.3f} {r**2*100:.1f}% variance explained")
    print(f"Spearman ρ rank monotonic ρ={rho:.3f} p={p_spear:.4e}")
    print(f"Correlation≠causation - lurking variable maybe product price?")

print(f"\\n6. REGRESSION & A/B TESTING L14")
# Regression payment_value ~ payment_installments
if len(vals_corr)>20:
    slope, intercept, r_value, p_value, std_err = stats.linregress(vals_corr["payment_installments"], vals_corr["payment_value"])
    print(f"Regression ŷ=β₀+β₁x payment_value ~ installments")
    print(f"β₁=Σ(x-x̄)(y-ȳ)/Σ(x-x̄)² β₁={slope:.2f} each extra installment increases value by {slope:.2f}")
    print(f"β₀=ȳ-β₁x̄ β₀={intercept:.2f} R²=r²={r_value**2:.3f} p={p_value:.4e} → {'Significant slope' if p_value<=0.05 else 'Not significant'}")
    print(f"Residual e=y-ŷ check LINE linearity independence normality equal variance")

# A/B testing simulation
np.random.seed(0)
# Simulate A Control mean 200 B Treatment mean 220
group_A = np.random.normal(200,50,100)
group_B = np.random.normal(220,50,100)
t_ab, p_ab_two = stats.ttest_ind(group_B, group_A, equal_var=False)
p_ab_one = p_ab_two/2 if t_ab>0 else 1-p_ab_two/2
print(f"\\nA/B testing simulation A Control mean 200 B Treatment mean 220")
print(f"A x̄={np.mean(group_A):.1f} B x̄={np.mean(group_B):.1f} Welch t=(x̄_B-x̄_A)/√(s_A²/n_A+s_B²/n_B) t={t_ab:.3f} one-tailed right p={p_ab_one:.4f} → {'B better significant' if p_ab_one<=0.05 else 'No significant'}")
# Effect size practical significance
pooled = np.sqrt((np.std(group_A,ddof=1)**2 + np.std(group_B,ddof=1)**2)/2)
d = (np.mean(group_B)-np.mean(group_A))/pooled
print(f"Cohen's d={d:.2f} practical significance {'medium' if d>=0.5 else 'small'} increase {(np.mean(group_B)-np.mean(group_A))/np.mean(group_A)*100:.1f}%")

print(f"\\n7. BAYESIAN THINKING L15")
# Bayesian updating P(SP)
n_total=len(df_merged)
k_sp=(df_merged["customer_state"]=="SP").sum()
p_hat_sp=k_sp/n_total
# Prior Beta(2,2) mean 0.5
alpha_prior=2
beta_prior=2
alpha_post=alpha_prior+k_sp
beta_post=beta_prior+n_total-k_sp
mean_post=alpha_post/(alpha_post+beta_post)
ci_bayes=stats.beta.interval(0.95, alpha_post, beta_post)
print(f"P(SP) Bayesian prior Beta(2,2) mean 0.5 data {k_sp}/{n_total} p̂={p_hat_sp:.3f} posterior Beta({alpha_post},{beta_post}) mean {mean_post:.3f} 95% credible interval [{ci_bayes[0]:.3f}, {ci_bayes[1]:.3f}]")
print(f"95% credible interval means 95% probability true P(SP) in interval given data and prior - intuitive")
print(f"P(p_SP>0.4|data)={1-stats.beta.cdf(0.4, alpha_post, beta_post):.4f}")

# Bayesian A/B
np.random.seed(0)
k_A=100
n_A=1000
k_B=130
n_B=1000
alpha_A=1+k_A
beta_A=1+n_A-k_A
alpha_B=1+k_B
beta_B=1+n_B-k_B
samples_A=stats.beta.rvs(alpha_A, beta_A, size=100000)
samples_B=stats.beta.rvs(alpha_B, beta_B, size=100000)
prob_B_better=np.mean(samples_B>samples_A)
diff=samples_B-samples_A
print(f"\\nBayesian A/B A 100/1000=10% B 130/1000=13% P(B better|A data)={prob_B_better:.4f}={prob_B_better*100:.1f}% difference mean {np.mean(diff):.4f} 95% CI [{np.percentile(diff,2.5):.4f}, {np.percentile(diff,97.5):.4f}]")

print(f"\\n8. TIME SERIES & FORECASTING L16")
# Daily orders time series
if "order_purchase_timestamp" in df_merged.columns:
    daily = df_merged.groupby(df_merged["order_purchase_timestamp"].dt.date).size()
    daily.index=pd.to_datetime(daily.index)
    daily=daily.sort_index()
    print(f"Daily orders time series {len(daily)} days from {daily.index.min()} to {daily.index.max()}")
    # ACF
    if len(daily)>20:
        acf_vals=acf(daily.values, nlags=14)
        print(f"ACF lag1={acf_vals[1]:.3f} lag7={acf_vals[7]:.3f} - peak at lag7 weekly seasonality?")
        # SMA and Exp smoothing
        daily_df=pd.DataFrame({"orders": daily.values}, index=daily.index)
        daily_df["SMA_7"]=daily_df["orders"].rolling(7).mean()
        daily_df["Exp_0.5"]=daily_df["orders"].ewm(alpha=0.5).mean()
        daily_df["Naive"]=daily_df["orders"].shift(1)
        # Forecast accuracy last 20 days
        test_size=20
        if len(daily_df)>test_size:
            test=daily_df.iloc[-test_size:]
            mae_naive=np.mean(np.abs(test["orders"]-test["Naive"]))
            mae_sma7=np.mean(np.abs(test["orders"]-test["SMA_7"]))
            mae_exp=np.mean(np.abs(test["orders"]-test["Exp_0.5"]))
            print(f"Last {test_size} days MAE Naive={mae_naive:.2f} SMA7={mae_sma7:.2f} Exp0.5={mae_exp:.2f} - lower better")
            last_sma7=daily_df["SMA_7"].iloc[-1]
            last_exp=daily_df["Exp_0.5"].iloc[-1]
            last_actual=daily_df["orders"].iloc[-1]
            print(f"Next day forecasts: Naive={last_actual} SMA7={last_sma7:.1f} Exp0.5={last_exp:.1f}")

print(f"\\n9. SAMPLING & SAMPLE SIZE L17")
# Sample size for mean margin ±10
sigma_est=df_merged["payment_value"].std()
E=10
z=1.96
n_req=(z*sigma_est/E)**2
print(f"Sample size for mean payment_value margin ±{E} σ_est={sigma_est:.1f} z={z} n=(zσ/E)²={(z*sigma_est/E):.1f}²={n_req:.0f} need {math.ceil(n_req)} orders")
# For proportion margin ±0.03
E_prop=0.03
p=0.5
n_prop=(z**2 * p*(1-p))/E_prop**2
print(f"Sample size for proportion margin ±{E_prop*100:.0f}% p={p} worst case n=(z²p(1-p))/E²={n_prop:.0f} need {math.ceil(n_prop)}")

print(f"\\n10. BUSINESS RECOMMENDATIONS")
print(f"- Mean payment_value x̄={x_bar:.2f} 95% CI [{ci_low:.2f}, {ci_high:.2f}] - true mean likely in this range")
print(f"- SP vs RJ difference effect size d={cohen_d:.2f} {'practically significant' if abs(cohen_d)>=0.5 else 'small practical'} - consider marketing")
print(f"- Customer_state associated with payment_type? Chi-Square p={p_chi:.4e} - if dependent, target payment methods by state")
print(f"- Installments predicts value β₁={slope:.2f} R²={r_value**2:.3f} - higher installments higher value? Maybe product price lurking")
print(f"- Daily orders trend seasonality weekly peak? Forecast next 7 days using SMA/Exp - plan inventory")
print(f"- Need n={math.ceil(n_req)} orders to estimate mean within ±{E} - collect that many")
print(f"- Avoid pitfalls: Sampling bias ensure SRS, p-hacking pre-register hypotheses, correlation≠causation need experiment for causation, correct interpretation CI 95% intervals contain μ not 95% prob in this interval")

# Save plots
plt.figure()
plt.hist(df_merged["payment_value"], bins=30, edgecolor="black")
plt.title(f"Payment_value distribution x̄={x_bar:.1f} s={s:.1f}")
plt.xlabel("payment_value")
plt.ylabel("Frequency")
plt.savefig("capstone_payment_value_hist.png")

plt.figure()
df_merged.boxplot(column="payment_value", by="customer_state")
plt.title("Payment_value by customer_state - ANOVA")
plt.savefig("capstone_boxplot_state.png")

plt.figure()
plt.scatter(vals_corr["payment_installments"], vals_corr["payment_value"], alpha=0.5)
plt.xlabel("payment_installments")
plt.ylabel("payment_value")
plt.title(f"Correlation r={r:.3f} Regression β₁={slope:.2f} R²={r_value**2:.3f}")
# Add regression line
x_line=np.linspace(vals_corr["payment_installments"].min(), vals_corr["payment_installments"].max(), 100)
y_line=intercept+slope*x_line
plt.plot(x_line, y_line, color="red")
plt.savefig("capstone_scatter_regression.png")

print("\\nSaved plots capstone_payment_value_hist.png, capstone_boxplot_state.png, capstone_scatter_regression.png")
```

---

## 4. Hands-On Assignment - Capstone Project

Dataset: Choose one:

- **Primary:** https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - olist_orders_dataset.csv, olist_order_payments_dataset.csv, olist_customers_dataset.csv - full analysis as in code above

- **Secondary:** https://www.kaggle.com/datasets/vivek468/superstore-dataset-final - Superstore Sales - full analysis: mean Sales CI, Region vs Sales ANOVA, Region vs Category Chi-Square, Sales vs Quantity correlation regression, Order Date daily Sales time series forecast

Create capstone_project_L18.py using code above as template, adapt to your chosen dataset, run all analyses, generate plots, write business recommendations.

Sections to include:

1. Define business questions
2. Load data, check shape, missing, EDA descriptive x̄, s, median, IQR
3. Sampling method used? SRS? How you would sample if population large?
4. Confidence intervals for mean and proportion with correct interpretation
5. Hypothesis testing one-sample and two-sample and ANOVA with p-values and effect sizes Cohen's d
6. Chi-Square independence and correlation Pearson r and Spearman ρ
7. Regression ŷ=β₀+β₁x with R² and LINE assumptions check residual vs fitted
8. Time series trend seasonality autocorrelation r_k lag 1 lag 7 naive SMA exponential smoothing MAE RMSE MAPE forecast next 7 days
9. Bayesian updating Beta prior to posterior credible interval and Bayesian A/B P(B better|data)
10. Sample size calculation n=(zσ/E)² and n=(z²p(1-p))/E²
11. Business recommendations with statistical and practical significance, avoid pitfalls

Deliverable: Upload capstone_project_L18.py + 3 plots (histogram, boxplot by state/region, scatter with regression) + output showing all analyses with proper notation x̄, μ, σ, p̂, z, t, χ², r, β₀, β₁, P(A|B), etc. + 1-page business summary non-technical.

Kaggle:
1. Primary https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - full end-to-end as above
2. Secondary https://www.kaggle.com/datasets/vivek468/superstore-dataset-final - full end-to-end Sales analysis

## 5. Checklist - Review L01-L17

- Descriptive: x̄ mean median s std IQR
- Probability: P(A|B)=P(B|A)P(A)/P(B) Bayes
- Random variables E[X] Var(X)
- Distributions Normal N(μ,σ²) Binomial C(n,k)p^k(1-p)^{n-k}
- Sampling distributions x̄~N(μ,σ²/n) SE=σ/√n CLT n≥30
- CI: x̄±z_{α/2}×σ/√n σ known z 1.96 95% 2.576 99% 1.645 90%, x̄±t_{α/2,df}×s/√n df=n-1 t heavier tails t→z large n, p̂±z×√(p̂(1-p̂)/n) np≥5 correct interpretation 95% intervals contain μ
- Hypothesis testing: H₀ = status quo H₁ ≠>< what you want to prove z=(x̄-μ₀)/(σ/√n) t=(x̄-μ₀)/(s/√n) p-value extreme data if H₀ true p≤α reject H₀ else fail to reject Type I α false positive Type II β false negative Power=1-β
- Two-sample Welch t=(x̄₁-x̄₂)/√(s₁²/n₁+s₂²/n₂) H₀: μ₁=μ₂ paired d=X₁-X₂ t=d̄/(s_d/√n) H₀: μ_d=0 ANOVA H₀: μ₁=...=μ_k F=between/within
- Chi-Square χ²=Σ(O-E)²/E E=(row×col)/grand df=(r-1)(c-1) E≥5 Pearson r=Σ(x-x̄)(y-ȳ)/√(...) -1 to +1 r² variance explained Spearman ρ rank correlation≠causation
- Regression ŷ=β₀+β₁x β₁=Σ(x-x̄)(y-ȳ)/Σ(x-x̄)² β₀=ȳ-β₁x̄ R²=1-SS_res/SS_tot LINE residual e=y-ŷ A/B testing randomized H₀: μ_A=μ_B t=(x̄_B-x̄_A)/√(s_A²/n_A+s_B²/n_B) sample size n≈16/d² statistical vs practical significance
- Bayesian P(A|B)=P(B|A)P(A)/P(B) prior likelihood posterior Beta prior+Binomial=Beta posterior Beta(α,β) mean α/(α+β) posterior Beta(α+k,β+n-k) credible interval 95% probability parameter in interval Bayesian A/B P(B better|data)
- Time series y_t trend seasonality noise stationary vs non-stationary autocorrelation r_k=Corr(y_t,y_{t-k}) lag k differencing d_t=y_t-y_{t-1} naive ŷ_{t+1}=y_t SMA_k average last k exponential smoothing α×y_t+(1-α)ŷ_t MAE RMSE MAPE
- Sampling SRS gold standard stratified divide into strata homogeneous SRS within ensures representation more precise cluster divide into clusters randomly select clusters cheaper less precise systematic every k-th risk periodicity convenience voluntary biased observational association not causation confounding vs experiment random assignment causation randomization replication blocking sample size n=(zσ/E)² mean n=(z²p(1-p))/E² proportion

Key Takeaway: Full workflow question→sampling→EDA→visualize→check assumptions→CI→test hypotheses→correlation→regression→time series→Bayesian→sample size→business recommendations with statistical and practical significance avoid pitfalls bias p-hacking correlation≠causation misinterpret p-value CI.

