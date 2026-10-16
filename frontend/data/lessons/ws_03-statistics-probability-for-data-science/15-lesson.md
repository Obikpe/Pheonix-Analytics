# Lesson 15 - Bayesian Thinking - Update Your Beliefs With New Data

**Duration:** 90 min | **Level:** Absolute Beginner | **Goal:** Understand Bayes theorem and Bayesian vs frequentist thinking

## What You Will Learn

By the end of this lesson, you will be able to:

- Explain Bayes theorem: P(A|B) = P(B|A)P(A)/P(B) - update prior belief P(A) with new evidence B to get posterior P(A|B)
- Define prior P(A): Belief before seeing data, likelihood P(B|A): Probability of data given hypothesis, posterior P(A|B): Updated belief after data, evidence P(B): Normalizing constant
- Distinguish Bayesian vs frequentist interpretation: Frequentist probability as long-run frequency fixed parameters, Bayesian probability as degree of belief parameters random distributions
- Explain why Bayesian useful: Incorporate prior knowledge, handle small data, intuitive posterior distribution of parameters, update sequentially as new data arrives
- Calculate Bayesian updating for simple example: Coin bias, disease testing, spam filtering
- Explain conjugate priors: Prior and posterior same family e.g., Beta prior + Binomial likelihood = Beta posterior, makes math easy
- Define Beta distribution for proportion p: Beta(α,β) flexible prior for p between 0 and 1, mean α/(α+β)
- Explain Bayesian A/B testing: Posterior distribution of difference μ_B − μ_A or p_B − p_A, probability B better than A = P(μ_B > μ_A | data)
- Calculate Bayesian inference using SciPy beta distribution and simple simulation
- Apply to sales data: Prior belief about P(NG) updated with sample data to posterior

---

## 1. Bayes Theorem - Update Beliefs With Data - Recap From L05

From Lesson 05 Bayes: P(A|B) = P(B|A)P(A)/P(B)

- P(A): Prior probability of A before seeing B - your belief about A
- P(B|A): Likelihood probability of B given A - how likely is data B if A true?
- P(B): Evidence probability of B overall - normalizing constant Σ P(B|A_i)P(A_i) over all hypotheses
- P(A|B): Posterior probability of A after seeing B - updated belief

Example: Disease testing

- A = have disease, P(A)=1% prior prevalence
- B = test positive
- P(B|A)=99% sensitivity true positive if have disease test positive
- P(B|¬A)=5% false positive if no disease test positive 5%
- P(B)=P(B|A)P(A)+P(B|¬A)P(¬A)=0.99×0.01+0.05×0.99=0.0099+0.0495=0.0594 5.94% overall test positive
- P(A|B)=P(B|A)P(A)/P(B)=0.99×0.01/0.0594=0.1667 16.67% posterior probability have disease given test positive! Even though test 99% sensitive, posterior only 16.7% because disease rare prior 1% - base rate fallacy.

This is Bayesian updating: Prior 1% → after positive test posterior 16.7% still low because disease rare.

If you test again positive, you can update posterior becomes new prior, posterior increases further.

---

## 2. Bayesian vs Frequentist - Two Philosophies

### Frequentist

- Probability = long-run frequency of repeatable events. Example: Coin toss 50% heads if toss many times 50% heads.
- Parameters μ, p fixed unknown constants, not random. Data random.
- Inference: Confidence intervals 95% CI means 95% of intervals from repeated sampling contain true μ. p-value probability extreme data if H₀ true.
- Does not incorporate prior knowledge, only data.
- Example: Test H₀: μ=50000 vs H₁: μ≠50000, p-value 0.03 reject H₀.

### Bayesian

- Probability = degree of belief, subjective, can be about one-time event or parameter.
- Parameters μ, p random variables with distributions representing belief. Data fixed once observed.
- Prior distribution P(μ) belief before data, likelihood P(data|μ) data given μ, posterior P(μ|data) ∝ likelihood × prior - updated belief after data.
- Inference: Posterior distribution of μ, credible interval 95% credible interval means 95% probability μ in interval given data and prior - more intuitive than confidence interval.
- Incorporates prior knowledge via prior, useful for small data or sequential updating.

Example: Prior belief μ~N(50000,10000²) before data, after seeing sample x̄=53000 n=30, posterior μ|data ~ N( ... ) updated mean between prior and data weighted by precision.

### When to Use Which?

- Frequentist common in A/B testing, hypothesis testing, large data, want objective without prior.
- Bayesian useful when prior knowledge exists (e.g., previous experiments, expert opinion), small data, want probability statement about parameter, sequential updating as data arrives, e.g., Bayesian A/B testing probability B better than A.

Both valid, different interpretation.

### Visual: Frequentist vs Bayesian

<svg width="100%" height="180" viewBox="0 0 700 180" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="180" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">BAYESIAN vs FREQUENTIST</text>
  <rect x="20" y="50" width="300" height="110" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
  <text x="170" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#1E40AF">Frequentist</text>
  <text x="35" y="90" font-family="Arial" font-size="8" fill="#1E40AF">Probability = long-run frequency</text>
  <text x="35" y="108" font-family="Arial" font-size="8" fill="#1E40AF">Parameters fixed μ, data random</text>
  <text x="35" y="126" font-family="Arial" font-size="8" fill="#1E40AF">95% CI = 95% intervals contain μ</text>
  <rect x="380" y="50" width="300" height="110" rx="12" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1"/>
  <text x="530" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#065F46">Bayesian</text>
  <text x="395" y="90" font-family="Arial" font-size="8" fill="#065F46">Probability = degree of belief</text>
  <text x="395" y="108" font-family="Arial" font-size="8" fill="#065F46">Parameters random distributions</text>
  <text x="395" y="126" font-family="Arial" font-size="8" fill="#065F46">Prior × Likelihood ∝ Posterior</text>
  <text x="395" y="144" font-family="Arial" font-size="8" fill="#065F46">95% credible interval 95% prob μ in interval</text>
</svg>

---

## 3. Bayesian Updating - Prior, Likelihood, Posterior

### Bayes Theorem for Parameter

For parameter θ (e.g., μ or p):

Posterior P(θ|data) = Likelihood P(data|θ) × Prior P(θ) / Evidence P(data)

P(data) = ∫ P(data|θ)P(θ) dθ normalizing constant makes posterior integrate to 1, often not needed for proportional.

So Posterior ∝ Likelihood × Prior

- Prior P(θ): What you believe about θ before seeing data
- Likelihood P(data|θ): How likely is data given θ? For example, if θ = p proportion, data = successes out of n, likelihood = Binomial(n,p) = C(n,k) p^k (1-p)^{n-k}
- Posterior P(θ|data): Updated belief about θ after data

As more data, likelihood dominates prior, posterior converges to data.

### Conjugate Priors - Math Easy

Conjugate prior: Prior and posterior same family distribution, so math easy.

Examples:
- **Beta prior + Binomial likelihood = Beta posterior** for proportion p. Beta(α,β) prior for p between 0 and 1. After seeing k successes n trials, posterior Beta(α+k, β+n-k). Mean posterior = (α+k)/(α+β+n) weighted average of prior mean α/(α+β) and data mean k/n.

- **Normal prior + Normal likelihood (σ known) = Normal posterior** for mean μ. Prior μ~N(μ₀, τ₀²), data x̄~N(μ, σ²/n), posterior μ|data ~ N(μ_n, τ_n²) where precision =1/variance, posterior precision = prior precision + data precision, posterior mean weighted average.

### Beta Distribution for Proportion p

Beta(α,β) distribution for p in [0,1]:

- α, β >0 shape parameters
- Mean = α/(α+β)
- Variance = αβ/((α+β)²(α+β+1))
- α=β=1 uniform prior no information
- α>1 β>1 unimodal
- α<1 β<1 U-shaped

If prior Beta(α,β) and data k successes n trials Binomial, posterior Beta(α+k, β+n-k)

Posterior mean = (α+k)/(α+β+n) = (α+β)/(α+β+n) × prior mean + n/(α+β+n) × data mean k/n - weighted average, weight by sample sizes.

As n large, posterior mean → data mean k/n, prior less important.

### Visual: Beta Prior to Posterior

<svg width="100%" height="200" viewBox="0 0 700 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="200" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">BETA PRIOR + BINOMIAL LIKELIHOOD = BETA POSTERIOR - CONJUGATE</text>
  <rect x="20" y="50" width="200" height="130" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
  <text x="120" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#1E40AF">Prior Beta(α,β)</text>
  <text x="35" y="90" font-family="Arial" font-size="8" fill="#1E40AF">Prior belief about p</text>
  <text x="35" y="108" font-family="Arial" font-size="8" fill="#1E40AF">Mean α/(α+β)</text>
  <text x="35" y="126" font-family="Arial" font-size="8" fill="#1E40AF">Uniform α=β=1 no info</text>
  <rect x="250" y="50" width="200" height="130" rx="12" fill="#FFFBEB" stroke="#FCD34D" stroke-width="1"/>
  <text x="350" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#92400E">Likelihood Binomial(k,n)</text>
  <text x="265" y="90" font-family="Arial" font-size="8" fill="#92400E">Data k successes n trials</text>
  <text x="265" y="108" font-family="Arial" font-size="8" fill="#92400E">P(data|p)=C(n,k)p^k(1-p)^{n-k}</text>
  <rect x="480" y="50" width="200" height="130" rx="12" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1"/>
  <text x="580" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#065F46">Posterior Beta(α+k,β+n-k)</text>
  <text x="495" y="90" font-family="Arial" font-size="8" fill="#065F46">Updated belief about p</text>
  <text x="495" y="108" font-family="Arial" font-size="8" fill="#065F46">Mean (α+k)/(α+β+n) weighted avg</text>
  <text x="495" y="126" font-family="Arial" font-size="8" fill="#065F46">Prior + data, n large data dominates</text>
</svg>

### Code Simple→Advanced - Bayesian Beta-Binomial

**Method 1 Plain Python Manual Beta Prior to Posterior:**

```python
# Method 1: Manual Beta prior + Binomial likelihood = Beta posterior
import math

# Example: Proportion p = P(NG) = probability order from NG
# Prior belief: Beta(α=2, β=2) weakly informative prior mean 0.5, slightly favors 0.5 but not strong
# Equivalent to prior pseudo-counts 2 successes 2 failures prior sample size 4

alpha_prior=2
beta_prior=2

prior_mean = alpha_prior/(alpha_prior+beta_prior)
print(f"Prior Beta(α={alpha_prior},β={beta_prior}) mean={prior_mean:.2f} - prior belief p≈0.5 weakly")
print(f"Prior equivalent to pseudo-counts {alpha_prior} successes {beta_prior} failures total {alpha_prior+beta_prior}")

# Data: 70 NG out of 100 orders
k=70  # successes NG
n=100
p_hat=k/n
print(f"\\nData: k={k} successes NG out of n={n} p̂={p_hat}")

# Posterior Beta(α+k, β+n-k)
alpha_post = alpha_prior + k
beta_post = beta_prior + n - k

posterior_mean = alpha_post/(alpha_post+beta_post)
print(f"Posterior Beta(α={alpha_post},β={beta_post}) = Beta({alpha_prior}+{k}, {beta_prior}+{n}-{k})")
print(f"Posterior mean = (α+k)/(α+β+n) = ({alpha_prior}+{k})/({alpha_prior}+{beta_prior}+{n}) = {alpha_post}/{alpha_post+beta_post} = {posterior_mean:.3f}")

# Weighted average interpretation
weight_prior = (alpha_prior+beta_prior)/(alpha_prior+beta_prior+n)
weight_data = n/(alpha_prior+beta_prior+n)
print(f"\\nPosterior mean weighted average: weight prior {weight_prior:.3f} × prior mean {prior_mean:.2f} + weight data {weight_data:.3f} × data mean {p_hat:.2f} = {weight_prior*prior_mean + weight_data*p_hat:.3f} matches posterior {posterior_mean:.3f}")

# As n large, posterior → data
# If n=1000 k=700 p̂=0.7 with same prior
k_large=700
n_large=1000
alpha_post_large=alpha_prior+k_large
beta_post_large=beta_prior+n_large-k_large
post_mean_large=alpha_post_large/(alpha_post_large+beta_post_large)
print(f"\\nLarge data n={n_large} k={k_large} p̂={k_large/n_large} posterior mean {post_mean_large:.3f}≈data mean {k_large/n_large} prior less important")

# Different priors
# Uniform prior Beta(1,1) no info
alpha_uniform=1
beta_uniform=1
post_mean_uniform=(alpha_uniform+k)/(alpha_uniform+beta_uniform+n)
print(f"\\nUniform prior Beta(1,1) mean 0.5 posterior mean with data 70/100 = {post_mean_uniform:.3f} close to data 0.7")

# Strong prior Beta(10,10) strong belief p≈0.5
alpha_strong=10
beta_strong=10
post_mean_strong=(alpha_strong+k)/(alpha_strong+beta_strong+n)
print(f"Strong prior Beta(10,10) mean 0.5 posterior with data 70/100 = {post_mean_strong:.3f} pulled towards prior 0.5 more than weak prior, prior pseudo-counts 20 vs data 100")
```

**Method 2 SciPy Beta Distribution:**

```python
from scipy import stats
import numpy as np
import matplotlib.pyplot as plt

# Prior Beta(2,2)
alpha_prior=2
beta_prior=2

# Data 70/100
k=70
n=100

alpha_post=alpha_prior+k
beta_post=beta_prior+n-k

# Plot prior and posterior
x = np.linspace(0,1,200)
prior_pdf = stats.beta.pdf(x, alpha_prior, beta_prior)
post_pdf = stats.beta.pdf(x, alpha_post, beta_post)

# Prior mean and 95% credible interval
prior_mean = stats.beta.mean(alpha_prior, beta_prior)
prior_ci = stats.beta.interval(0.95, alpha_prior, beta_prior)

post_mean = stats.beta.mean(alpha_post, beta_post)
post_ci = stats.beta.interval(0.95, alpha_post, beta_post)

print(f"Prior Beta({alpha_prior},{beta_prior}) mean {prior_mean:.3f} 95% CI [{prior_ci[0]:.3f}, {prior_ci[1]:.3f}]")
print(f"Posterior Beta({alpha_post},{beta_post}) mean {post_mean:.3f} 95% CI [{post_ci[0]:.3f}, {post_ci[1]:.3f}]")
print(f"Data p̂={k/n} 70/100")
print(f"Posterior 95% credible interval [{post_ci[0]:.3f}, {post_ci[1]:.3f}] means 95% probability p in this interval given data and prior - more intuitive than frequentist CI")

# Probability p >0.6 given data
prob_gt_06 = 1 - stats.beta.cdf(0.6, alpha_post, beta_post)
print(f"P(p>0.6 | data) = {prob_gt_06:.4f} - probability NG proportion >0.6 given data and prior")

# Plot
plt.figure()
plt.plot(x, prior_pdf, label=f"Prior Beta({alpha_prior},{beta_prior}) mean {prior_mean:.2f}", color="blue")
plt.plot(x, post_pdf, label=f"Posterior Beta({alpha_post},{beta_post}) mean {post_mean:.3f} 95% CI [{post_ci[0]:.2f},{post_ci[1]:.2f}]", color="red")
plt.axvline(k/n, color="black", linestyle="--", label=f"Data p̂={k/n}")
plt.xlabel("p = P(NG)")
plt.ylabel("Density")
plt.title("Bayesian Updating Beta Prior to Posterior")
plt.legend()
plt.savefig("bayesian_beta_posterior.png")
print("Saved bayesian_beta_posterior.png - blue prior broad, red posterior narrow around data 0.7")
```

**Method 3 Bayesian A/B Testing:**

```python
from scipy import stats
import numpy as np

# A/B testing Bayesian: Compare two proportions p_A and p_B
# Prior Beta(1,1) uniform for both

# Data: A Control 100 successes out of 1000 =10% conversion
# B Treatment 130 successes out of 1000 =13% conversion

alpha_prior=1
beta_prior=1

k_A=100
n_A=1000
k_B=130
n_B=1000

alpha_post_A = alpha_prior + k_A
beta_post_A = beta_prior + n_A - k_A

alpha_post_B = alpha_prior + k_B
beta_post_B = beta_prior + n_B - k_B

print(f"A Control: {k_A}/{n_A}={k_A/n_A*100:.1f}% Posterior Beta({alpha_post_A},{beta_post_A}) mean {alpha_post_A/(alpha_post_A+beta_post_A):.3f}")
print(f"B Treatment: {k_B}/{n_B}={k_B/n_B*100:.1f}% Posterior Beta({alpha_post_B},{beta_post_B}) mean {alpha_post_B/(alpha_post_B+beta_post_B):.3f}")

# Probability B better than A: P(p_B > p_A | data)
# Simulate from posteriors
np.random.seed(0)
samples_A = stats.beta.rvs(alpha_post_A, beta_post_A, size=100000)
samples_B = stats.beta.rvs(alpha_post_B, beta_post_B, size=100000)

prob_B_better = np.mean(samples_B > samples_A)
print(f"\\nP(p_B > p_A | data) = {prob_B_better:.4f} = {prob_B_better*100:.1f}% probability B better than A given data")

# Posterior distribution of difference p_B - p_A
diff = samples_B - samples_A
diff_mean = np.mean(diff)
diff_ci = np.percentile(diff, [2.5,97.5])

print(f"Posterior difference p_B - p_A mean {diff_mean:.4f} 95% credible interval [{diff_ci[0]:.4f}, {diff_ci[1]:.4f}]")
print(f"95% credible interval for difference means 95% probability true difference in this interval")

# Probability difference >0.02 (2% absolute increase practically significant)
prob_gt_02 = np.mean(diff > 0.02)
print(f"P(p_B - p_A >0.02 | data) = {prob_gt_02:.4f} probability improvement >2% absolute")

# Compare with frequentist p-value
from scipy import stats
# Frequentist two-proportion z-test
p_pool = (k_A+k_B)/(n_A+n_B)
se_pool = np.sqrt(p_pool*(1-p_pool)*(1/n_A+1/n_B))
z = (k_B/n_B - k_A/n_A)/se_pool
p_two = 2*(1-stats.norm.cdf(abs(z),0,1))
p_one_right = 1-stats.norm.cdf(z,0,1)

print(f"\\nFrequentist two-proportion z-test z={z:.3f} one-tailed right p={p_one_right:.4f} → {'Reject H₀ B better' if p_one_right<=0.05 else 'Fail to reject'}")
print(f"Bayesian gives probability B better {prob_B_better*100:.1f}% more intuitive than p-value")
```

---

## 4. Real Store Example - Bayesian Updating for P(NG)

```python
import pandas as pd
from scipy import stats
import numpy as np

# Simulate store data: Prior belief P(NG)=0.5 Beta(2,2), data shows 70/100 NG
# Posterior Beta(72,32) mean 72/104=0.692

alpha_prior=2
beta_prior=2
k=70
n=100
alpha_post=alpha_prior+k
beta_post=beta_prior+n-k

# 95% credible interval
ci = stats.beta.interval(0.95, alpha_post, beta_post)
print(f"Prior Beta(2,2) mean 0.5, Data 70/100 NG, Posterior Beta({alpha_post},{beta_post}) mean {alpha_post/(alpha_post+beta_post):.3f} 95% credible interval [{ci[0]:.3f}, {ci[1]:.3f}]")
print(f"Interpretation: 95% probability true P(NG) between {ci[0]:.3f} and {ci[1]:.3f} given data and prior - intuitive")

# If new data arrives 30 more NG out of 40, update posterior becomes new prior
k_new=30
n_new=40
alpha_post2 = alpha_post + k_new
beta_post2 = beta_post + n_new - k_new
ci2 = stats.beta.interval(0.95, alpha_post2, beta_post2)
print(f"\\nSequential updating: New data {k_new}/{n_new} NG, new posterior Beta({alpha_post2},{beta_post2}) mean {alpha_post2/(alpha_post2+beta_post2):.3f} CI [{ci2[0]:.3f}, {ci2[1]:.3f}] - prior was previous posterior")
print(f"Bayesian allows sequential updating as data arrives, posterior becomes prior for next batch")
```

---

## 5. Hands-On Assignment

Dataset: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - customer_state

Create bayesian_thinking_L15.py:

Section A Bayes theorem disease testing:

```python
# Disease testing Bayes
p_disease=0.01  # Prior 1%
p_pos_given_disease=0.99  # Sensitivity
p_pos_given_no_disease=0.05  # False positive
p_no_disease=1-p_disease
p_pos = p_pos_given_disease*p_disease + p_pos_given_no_disease*p_no_disease
p_disease_given_pos = p_pos_given_disease*p_disease / p_pos
print(f"Prior P(disease)={p_disease} P(pos|disease)={p_pos_given_disease} P(pos|no disease)={p_pos_given_no_disease}")
print(f"P(pos)={p_pos:.4f} Posterior P(disease|pos)={p_disease_given_pos:.4f}=16.7% even though test 99% sensitive due to rare disease")
```

Section B Beta prior to posterior:

```python
from scipy import stats
alpha_prior=2
beta_prior=2
k=70
n=100
alpha_post=alpha_prior+k
beta_post=beta_prior+n-k
mean_post=alpha_post/(alpha_post+beta_post)
ci=stats.beta.interval(0.95, alpha_post, beta_post)
print(f"Prior Beta({alpha_prior},{beta_prior}) mean {alpha_prior/(alpha_prior+beta_prior):.2f}, Data {k}/{n}, Posterior Beta({alpha_post},{beta_post}) mean {mean_post:.3f} 95% credible interval [{ci[0]:.3f}, {ci[1]:.3f}]")
print(f"P(p>0.6|data)={1-stats.beta.cdf(0.6, alpha_post, beta_post):.4f}")
```

Section C Bayesian A/B testing:

```python
from scipy import stats
import numpy as np
np.random.seed(0)
# A 100/1000 B 130/1000
alpha_prior=1
beta_prior=1
k_A=100
n_A=1000
k_B=130
n_B=1000
alpha_A=alpha_prior+k_A
beta_A=beta_prior+n_A-k_A
alpha_B=alpha_prior+k_B
beta_B=beta_prior+n_B-k_B
samples_A=stats.beta.rvs(alpha_A, beta_A, size=100000)
samples_B=stats.beta.rvs(alpha_B, beta_B, size=100000)
prob_B_better=np.mean(samples_B>samples_A)
diff=samples_B-samples_A
print(f"A {k_A}/{n_A} B {k_B}/{n_B} P(B better than A|data)={prob_B_better:.4f}={prob_B_better*100:.1f}%")
print(f"Difference mean {np.mean(diff):.4f} 95% CI [{np.percentile(diff,2.5):.4f}, {np.percentile(diff,97.5):.4f}]")
```

Section D Kaggle:

```python
import os, pandas as pd
from scipy import stats
import numpy as np

if os.path.exists("olist_customers_dataset.csv"):
    df_cust=pd.read_csv("olist_customers_dataset.csv", nrows=10000)
    # Proportion SP state
    n=len(df_cust)
    k=(df_cust["customer_state"]=="SP").sum()
    p_hat=k/n
    
    # Prior Beta(2,2) mean 0.5
    alpha_prior=2
    beta_prior=2
    alpha_post=alpha_prior+k
    beta_post=beta_prior+n-k
    mean_post=alpha_post/(alpha_post+beta_post)
    ci=stats.beta.interval(0.95, alpha_post, beta_post)
    print(f"Customer_state SP: n={n} k={k} p̂={p_hat:.3f}")
    print(f"Prior Beta(2,2) mean 0.5, Posterior Beta({alpha_post},{beta_post}) mean {mean_post:.3f} 95% credible interval [{ci[0]:.3f}, {ci[1]:.3f}]")
    print(f"P(p_SP>0.4|data)={1-stats.beta.cdf(0.4, alpha_post, beta_post):.4f}")
else:
    print("Download https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce")
```

Deliverable: Upload bayesian_thinking_L15.py + image bayesian_beta_posterior.png showing prior broad blue and posterior narrow red around data + output showing prior mean, posterior mean weighted average, 95% credible interval intuitive, P(p>0.6|data), Bayesian A/B P(B better|A data) probability.

Kaggle:
1. Primary https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - customer_state SP proportion Bayesian updating
2. Secondary https://www.kaggle.com/datasets/vivek468/superstore-dataset-final - Region proportion Bayesian

## 6. Checklist
- Define Bayes theorem P(A|B)=P(B|A)P(A)/P(B) prior P(A) belief before data likelihood P(B|A) data given hypothesis posterior P(A|B) updated belief evidence P(B) normalizing
- Explain disease testing example prior 1% sensitivity 99% false positive 5% posterior 16.7% base rate fallacy
- Distinguish Bayesian probability degree of belief parameters random distributions prior×likelihood∝posterior vs frequentist probability long-run frequency parameters fixed constants data random confidence intervals vs credible intervals
- Explain why Bayesian useful incorporate prior knowledge small data intuitive posterior sequential updating
- Explain conjugate priors prior and posterior same family Beta+Binomial=Beta Beta(α,β) for p mean α/(α+β) posterior Beta(α+k,β+n-k) mean (α+k)/(α+β+n) weighted average prior and data
- Define Beta distribution flexible prior for p between 0 and 1 α=β=1 uniform
- Explain Bayesian A/B testing posterior distribution difference p_B−p_A probability B better P(p_B>p_A|data) via simulation credible interval difference
- Use SciPy beta distribution mean interval pdf cdf rvs

Key Takeaway: Bayes P(A|B)=P(B|A)P(A)/P(B) update prior belief with data likelihood to posterior. Prior P(A) before data, likelihood P(data|A), posterior P(A|data) after data. Beta(α,β) prior for p conjugate with Binomial posterior Beta(α+k,β+n-k) mean weighted average. Bayesian credible interval 95% probability parameter in interval intuitive. Bayesian A/B P(B better|data) probability.