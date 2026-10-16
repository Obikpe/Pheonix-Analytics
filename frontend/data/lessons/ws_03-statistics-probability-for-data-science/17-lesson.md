# Lesson 17 - Sampling Methods & Experimental Design - How to Collect Good Data

**Duration:** 90 min | **Level:** Absolute Beginner | **Goal:** Understand how to collect representative data and design experiments to avoid bias

## What You Will Learn

By the end of this lesson, you will be able to:

- Explain why sampling method matters: Bad sampling leads to biased results even with large n, garbage in garbage out
- Define population vs sample: Population all units you care about, sample subset you actually observe, census vs sample
- Distinguish sampling bias vs non-sampling bias: Sampling bias from non-representative sample selection, non-sampling bias from measurement, non-response, etc.
- Explain simple random sampling SRS: Every unit equal chance selected, every sample of size n equal chance, gold standard unbiased but may need list of all units
- Explain stratified sampling: Divide population into strata (groups) e.g., by region, then random sample within each stratum, ensures representation of each stratum, more precise if strata homogeneous
- Explain cluster sampling: Divide population into clusters e.g., stores, randomly select clusters and sample all units within selected clusters, cheaper when population spread out but less precise
- Explain systematic sampling: Select every k-th unit from list, e.g., every 10th order, simple but risk periodicity if list has pattern
- Explain convenience and voluntary response bias: Convenience sample easy to reach but biased, voluntary response self-selected biased, e.g., online reviews only unhappy customers respond
- Define experimental design vs observational study: Experiment researcher assigns treatment randomly, can infer causation, observational study researcher observes without assigning, can only infer association not causation due to confounding
- Explain randomization, replication, blocking in experiments: Randomization randomly assign treatments to avoid confounding, replication repeat treatments to estimate variability, blocking group similar units together to reduce variability
- Calculate sample size needed for desired margin of error: n = (z×σ/E)² for mean, n = (z²×p̂(1−p̂))/E² for proportion
- Apply to sales data: How to sample orders to estimate mean payment_value with margin ±100

---

## 1. Why Sampling Method Matters - Garbage In Garbage Out

You have population all orders, say 100k orders in year. You can't analyze all? You sample 100 orders to estimate mean payment_value.

If sampling method biased, your estimate biased even with large n.

Example: You want mean payment_value for all customers, but you only sample orders from SP state (largest state) because easy. SP customers may have higher payment_value than other states, so your estimate overestimates true mean for all customers - sampling bias.

Bad sampling → biased results, even large n doesn't fix bias, only increases precision of biased estimate.

Need representative sample that reflects population.

Population vs sample:
- Population: All units you care about, e.g., all orders in 2024, all customers, parameters μ, σ, p fixed unknown
- Sample: Subset you observe, e.g., 100 orders, statistics x̄, s, p̂ estimate population parameters
- Census: Try to get all population, expensive, sometimes impossible

---

## 2. Sampling Bias vs Non-Sampling Bias

### Sampling Bias

Bias from how sample selected, sample not representative of population.

Examples:
- **Selection bias:** Some units more likely selected than others, e.g., only sample orders from one store, only online orders not in-store.
- **Undercoverage:** Some population units not in sampling frame list, e.g., frame only includes customers with email, misses customers without email.
- **Non-response bias:** Selected units don't respond, e.g., survey 100 customers only 20 respond, responders may differ from non-responders.

### Non-Sampling Bias

Bias not from sampling but from data collection process.

Examples:
- **Measurement bias:** Instrument or question biased, e.g., scale always +5kg, leading question "Don't you agree product is great?"
- **Processing error:** Data entry error.
- **Response bias:** Respondent lies or misremembers.

Sampling bias we can control via sampling method, non-sampling bias via careful design.

### Visual: Sampling Bias

<svg width="100%" height="180" viewBox="0 0 700 180" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="180" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">SAMPLING BIAS vs NON-SAMPLING BIAS</text>
  <rect x="20" y="50" width="300" height="110" rx="12" fill="#FEF2F2" stroke="#FCA5A5" stroke-width="1"/>
  <text x="170" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#7F1D1D">Sampling Bias Selection</text>
  <text x="35" y="90" font-family="Arial" font-size="8" fill="#7F1D1D">Sample not representative</text>
  <text x="35" y="108" font-family="Arial" font-size="8" fill="#7F1D1D">Only SP state, only online</text>
  <text x="35" y="126" font-family="Arial" font-size="8" fill="#7F1D1D">Large n doesn't fix bias</text>
  <rect x="380" y="50" width="300" height="110" rx="12" fill="#FFFBEB" stroke="#FCD34D" stroke-width="1"/>
  <text x="530" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#92400E">Non-Sampling Bias Measurement</text>
  <text x="395" y="90" font-family="Arial" font-size="8" fill="#92400E">Instrument/question biased</text>
  <text x="395" y="108" font-family="Arial" font-size="8" fill="#92400E">Scale +5kg leading question</text>
</svg>

---

## 3. Probability Sampling Methods - Gold Standard

Probability sampling: Every unit has known non-zero chance of selection, allows unbiased estimates and quantification of sampling error via SE.

### Simple Random Sampling SRS

Every unit equal chance selected, every sample of size n equal chance.

How: Number all units 1 to N, use random number generator to select n units.

Advantages: Unbiased, simple, gold standard, easy analysis.

Disadvantages: Need list of all population units (sampling frame), may be expensive if population spread out, may miss subgroups if small.

Example: N=1000 orders, want n=100, assign random numbers 1-1000, pick 100 random numbers, sample those orders.

### Stratified Sampling

Divide population into strata (groups) that are homogeneous within, heterogeneous between, e.g., by region SP, RJ, MG, or by store_id, or by customer_type.

Then SRS within each stratum.

Why: Ensures representation of each stratum, more precise than SRS if strata homogeneous (within-stratum variance small), allows estimates per stratum.

Example: Population 70% SP 20% RJ 10% MG. Stratified sample n=100: Take 70 from SP, 20 from RJ, 10 from MG via SRS within each. Ensures MG represented even though small.

Allocation:
- Proportional: Sample size per stratum proportional to population size, e.g., 70,20,10
- Equal: Same n per stratum, useful if want precise per stratum and small stratum important

Formula: Overall mean estimate = Σ (N_h/N) × x̄_h where N_h stratum size, x̄_h stratum mean.

SE smaller than SRS if strata homogeneous.

### Cluster Sampling

Divide population into clusters, e.g., stores are clusters, each cluster contains many orders. Clusters should be heterogeneous within, homogeneous between (each cluster mini-population).

Then randomly select clusters, and sample all units within selected clusters (one-stage) or sample within clusters (two-stage).

Why: Cheaper when population spread out geographically, don't need list of all units only list of clusters.

Example: 100 stores each 1000 orders total 100k orders. Want n=1000 orders. Instead of SRS across all 100k (need list of all 100k), cluster sample: Randomly select 10 stores out of 100, then sample 100 orders from each selected store (or all orders in selected stores).

Less precise than SRS because orders within same store may be similar (intra-cluster correlation), need larger n for same precision.

### Systematic Sampling

Select every k-th unit from ordered list.

Steps: Determine k = N/n (population size/sample size), random start r between 1 and k, then select r, r+k, r+2k, ...

Example: N=1000 n=100 k=10 random start 7, sample orders 7,17,27,...,997

Advantages: Simple, evenly spread.

Disadvantages: Risk periodicity if list has pattern with period k, e.g., list ordered by store and every 10th order same store, sample biased to one store. Need random order list.

### Visual: Sampling Methods

<svg width="100%" height="220" viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="220" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">PROBABILITY SAMPLING METHODS</text>
  <rect x="20" y="50" width="150" height="150" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
  <text x="95" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#1E40AF">SRS Simple Random</text>
  <text x="35" y="90" font-family="Arial" font-size="8" fill="#1E40AF">Every unit equal chance</text>
  <text x="35" y="108" font-family="Arial" font-size="8" fill="#1E40AF">Gold standard unbiased</text>
  <text x="35" y="126" font-family="Arial" font-size="8" fill="#1E40AF">Need list of all N</text>
  <rect x="190" y="50" width="150" height="150" rx="12" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1"/>
  <text x="265" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#065F46">Stratified</text>
  <text x="205" y="90" font-family="Arial" font-size="8" fill="#065F46">Divide into strata homogeneous</text>
  <text x="205" y="108" font-family="Arial" font-size="8" fill="#065F46">SRS within each stratum</text>
  <text x="205" y="126" font-family="Arial" font-size="8" fill="#065F46">Ensures representation</text>
  <text x="205" y="144" font-family="Arial" font-size="8" fill="#065F46">More precise if strata homo</text>
  <rect x="360" y="50" width="150" height="150" rx="12" fill="#FFFBEB" stroke="#FCD34D" stroke-width="1"/>
  <text x="435" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#92400E">Cluster</text>
  <text x="375" y="90" font-family="Arial" font-size="8" fill="#92400E">Divide into clusters stores</text>
  <text x="375" y="108" font-family="Arial" font-size="8" fill="#92400E">Random select clusters</text>
  <text x="375" y="126" font-family="Arial" font-size="8" fill="#92400E">Sample all within cluster</text>
  <text x="375" y="144" font-family="Arial" font-size="8" fill="#92400E">Cheaper less precise</text>
  <rect x="530" y="50" width="150" height="150" rx="12" fill="#FEF2F2" stroke="#FCA5A5" stroke-width="1"/>
  <text x="605" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#7F1D1D">Systematic</text>
  <text x="545" y="90" font-family="Arial" font-size="8" fill="#7F1D1D">Every k-th unit</text>
  <text x="545" y="108" font-family="Arial" font-size="8" fill="#7F1D1D">k=N/n random start</text>
  <text x="545" y="126" font-family="Arial" font-size="8" fill="#7F1D1D">Simple risk periodicity</text>
</svg>

---

## 4. Non-Probability Sampling - Biased Avoid

### Convenience Sampling

Sample easy to reach units, e.g., sample orders from your own store only, sample customers who walk in today, sample friends.

Biased: Not representative, easy units may differ from population.

### Voluntary Response Sampling

Self-selected, e.g., online survey link, customers who choose to review product. Usually only strong opinions (very happy or very unhappy) respond, biased.

Example: Product reviews online biased positive because unhappy customers may not bother, or biased negative because only complainers respond.

Avoid for inference, can be used for exploratory.

---

## 5. Experimental Design vs Observational Study

### Observational Study

Researcher observes without assigning treatment, just collects data.

Example: Observe customers who bought product A vs product B and compare mean payment_value. Customers self-selected product, not random assignment.

Can infer association: Product A buyers have higher payment_value than B buyers, but cannot infer causation: Does A cause higher value or do richer customers choose A? Confounding variable e.g., customer income.

Confounding variable: Variable related to both treatment and outcome, e.g., income affects both product choice and payment_value.

### Experiment

Researcher randomly assigns treatment to units.

Example: Randomly assign 100 customers to product A and 100 to product B, then compare mean payment_value. Random assignment balances confounding variables on average, so difference can be attributed to product, can infer causation.

Gold standard for causation: Randomized controlled experiment.

### Principles of Experimental Design

- **Randomization:** Randomly assign treatments to units to avoid selection bias and balance confounders. Example: Randomly assign orders to control vs new checkout page in A/B testing.
- **Replication:** Repeat treatments on many units to estimate variability and increase precision. Need n large enough.
- **Blocking:** Group similar units together into blocks, then randomize within blocks to reduce variability. Example: Block by region SP, RJ, then randomize treatment within each region. Similar to stratified sampling but for experiments. Reduces within-block variation, more precise.

---

## 6. Sample Size Calculation - How Large n Needed?

### For Mean

Want margin of error E = desired half-width of CI, e.g., want estimate mean payment_value within ±100.

For 95% CI: E = z_{α/2} × σ/√n → Solve n = (z_{α/2} × σ / E)²

Need estimate of σ (from pilot study or previous data).

Example: Want E=100, σ=2000, z=1.96 for 95% confidence, n = (1.96×2000/100)² = (39.2)² =1537 need 1537 orders.

If σ unknown use s.

### For Proportion

Want margin E for proportion, e.g., estimate P(SP) within ±0.03 3%

E = z_{α/2} × √(p̂(1−p̂)/n) → n = (z² × p̂(1−p̂))/E²

If p̂ unknown, use worst case p̂=0.5 maximizes p(1-p)=0.25 gives largest n conservative.

Example: Want E=0.03 3%, p̂=0.5 worst case, z=1.96, n=(1.96²×0.25)/0.03² =0.9604/0.0009=1067 need 1067.

### Code Simple→Advanced - Sampling

**Method 1 Plain Python SRS, Stratified, Cluster, Systematic:**

```python
# Method 1: Sampling methods manual
import random
import numpy as np

np.random.seed(0)

# Population 1000 orders with region SP,RJ,MG 70%,20%,10%
population = [{"id": i, "region": np.random.choice(["SP","RJ","MG"], p=[0.7,0.2,0.1]), "payment_value": np.random.normal(200,50)} for i in range(1000)]

# SRS n=100
n=100
srs_sample = random.sample(population, n)
print(f"SRS n={n} from N=1000")
# Check region distribution should be approx 70% SP etc.
from collections import Counter
region_counts = Counter([o["region"] for o in srs_sample])
print(f"SRS region counts {region_counts} - approx population 70% SP 20% RJ 10% MG, unbiased")

# Stratified n=100 proportional 70 SP 20 RJ 10 MG
# Divide into strata
strata = {"SP": [o for o in population if o["region"]=="SP"], "RJ": [o for o in population if o["region"]=="RJ"], "MG": [o for o in population if o["region"]=="MG"]}
stratified_sample=[]
for region, pop in strata.items():
    # Proportional allocation
    n_h = int(n * len(pop)/len(population))
    if region=="SP":
        n_h=70
    elif region=="RJ":
        n_h=20
    else:
        n_h=10
    sample_h = random.sample(pop, n_h)
    stratified_sample.extend(sample_h)

region_counts_strat = Counter([o["region"] for o in stratified_sample])
print(f"\\nStratified proportional n={n} 70 SP 20 RJ 10 MG")
print(f"Stratified region counts {region_counts_strat} - exactly proportional ensures representation")

# Cluster sampling: Clusters are stores? Simulate 10 clusters each 100 orders
clusters = [population[i*100:(i+1)*100] for i in range(10)]
# Randomly select 2 clusters
selected_clusters = random.sample(clusters, 2)
cluster_sample=[]
for cl in selected_clusters:
    cluster_sample.extend(cl)  # Sample all within selected clusters one-stage

print(f"\\nCluster sampling: 10 clusters each 100 orders, select 2 clusters, sample all 200 orders")
print(f"Cluster sample n={len(cluster_sample)} from {len(selected_clusters)} clusters - cheaper no need list of all 1000, but less precise if clusters homogeneous")

# Systematic sampling k=N/n=1000/100=10
N=len(population)
k=N//n
random_start = random.randint(0,k-1)
systematic_sample = [population[random_start + i*k] for i in range(n)]

print(f"\\nSystematic k=N/n={N}/{n}={k} random start {random_start}")
print(f"Systematic sample n={n} every {k}th - simple evenly spread")

# Convenience bias example: Only first 100 orders (e.g., SP heavy if population ordered by region)
# If population ordered by region SP first, convenience first 100 all SP biased
population_ordered_by_region = sorted(population, key=lambda x: x["region"])
convenience_sample = population_ordered_by_region[:100]
region_counts_conv = Counter([o["region"] for o in convenience_sample])
print(f"\\nConvenience sample first 100 from ordered by region (SP first) counts {region_counts_conv} - biased all SP if SP first, not representative")
```

**Method 2 Pandas Sampling:**

```python
import pandas as pd
import numpy as np

np.random.seed(0)

df = pd.DataFrame({
    "order_id": range(1000),
    "region": np.random.choice(["SP","RJ","MG"], size=1000, p=[0.7,0.2,0.1]),
    "payment_value": np.random.normal(200,50,1000)
})

# SRS
srs = df.sample(n=100, random_state=0)
print(f"SRS n=100 region distribution:\\n{srs['region'].value_counts()} approx 70% SP")

# Stratified - pandas groupby sample
# Proportional stratified
stratified = df.groupby("region", group_keys=False).apply(lambda x: x.sample(frac=0.1, random_state=0))  # 10% from each stratum = proportional
print(f"\\nStratified 10% from each region n={len(stratified)}")
print(f"Stratified region distribution:\\n{stratified['region'].value_counts()} - ensures each region represented")

# Equal allocation stratified n=30 per region
equal_strat = df.groupby("region", group_keys=False).apply(lambda x: x.sample(n=30, random_state=0) if len(x)>=30 else x)
print(f"\\nEqual stratified 30 per region n={len(equal_strat)}")

# Cluster: Assume cluster_id store 10 stores
df["cluster_id"] = df["order_id"] // 100
# Select 2 clusters randomly
selected_clusters = np.random.choice(df["cluster_id"].unique(), size=2, replace=False)
cluster_sample = df[df["cluster_id"].isin(selected_clusters)]
print(f"\\nCluster sample select clusters {selected_clusters} n={len(cluster_sample)}")

# Systematic
k=10
random_start = np.random.randint(0,k)
systematic = df.iloc[random_start::k][:100]
print(f"\\nSystematic k={k} random start {random_start} n={len(systematic)}")
```

**Method 3 Sample Size Calculation:**

```python
import math

# Sample size for mean: n=(z×σ/E)²
# Want margin E=100 payment_value σ=2000 95% z=1.96
z=1.96
sigma=2000
E=100

n_mean = (z*sigma/E)**2
print(f"Sample size for mean: Want margin ±{E} σ={sigma} z={z} 95%")
print(f"n=(z×σ/E)²=({z}×{sigma}/{E})²=({z*sigma/E:.1f})²={n_mean:.0f} need {math.ceil(n_mean)} orders")

# If want smaller margin E=50 need larger n
E2=50
n_mean2=(z*sigma/E2)**2
print(f"Want margin ±{E2} n=({z*sigma/E2:.1f})²={n_mean2:.0f} - halving margin requires 4× n (since n∝1/E²)")

# Sample size for proportion: n=(z²×p(1-p))/E²
# Want margin E=0.03 3% for P(SP) p=0.5 worst case
E_prop=0.03
p=0.5  # worst case max variance
z=1.96
n_prop = (z**2 * p*(1-p))/E_prop**2
print(f"\\nSample size for proportion: Want margin ±{E_prop*100:.0f}% p={p} worst case z={z}")
print(f"n=(z²×p(1-p))/E²=({z}²×{p}×{1-p})/{E_prop}²={n_prop:.0f} need {math.ceil(n_prop)}")

# If p=0.7 not worst case, n smaller
p2=0.7
n_prop2=(z**2 * p2*(1-p2))/E_prop**2
print(f"p={p2} n=({z}²×{p2}×{1-p2})/{E_prop}²={n_prop2:.0f} smaller than worst case because variance p(1-p) smaller")
```

---

## 7. Real Store Example - Sampling for Ikeja

```python
import pandas as pd
import numpy as np
import random

np.random.seed(0)

# Population: All orders 2024 100k orders
# Want estimate mean total for Ikeja store with margin ±1000 95% confidence
# Need σ estimate from pilot 100 orders s=8000

sigma_est=8000
E=1000
z=1.96
n_required=(z*sigma_est/E)**2
print(f"Want estimate Ikeja mean total margin ±{E} σ_est={sigma_est} z={z}")
print(f"n=(zσ/E)²={n_required:.0f} need {math.ceil(n_required)} orders")

# Sampling methods for Ikeja
# If population spread across many stores, cluster sampling cheaper: Select Ikeja cluster and sample within
# If want representation by day of week, stratified by weekday

# Example: Stratified by weekday to ensure weekend represented
# Population orders with weekday
dates=pd.date_range("2024-01-01", periods=1000, freq="D")
df=pd.DataFrame({
    "order_id": range(1000),
    "weekday": [d.weekday() for d in dates],  # 0 Mon 6 Sun
    "total": np.random.normal(50000,8000,1000)
})

# Stratified by weekday (0-6) proportional n=100
stratified_weekday = df.groupby("weekday", group_keys=False).apply(lambda x: x.sample(frac=0.1, random_state=0))
print(f"\\nStratified by weekday 10% each n={len(stratified_weekday)} ensures weekend (5,6) represented")
print(stratified_weekday["weekday"].value_counts().sort_index())
```

---

## 8. Hands-On Assignment

Dataset: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - olist_orders_dataset.csv

Create sampling_experimental_L17.py:

Section A SRS vs Stratified vs Cluster vs Systematic:

```python
import pandas as pd
import numpy as np
np.random.seed(0)
df=pd.DataFrame({
    "order_id": range(1000),
    "region": np.random.choice(["SP","RJ","MG"], size=1000, p=[0.7,0.2,0.1]),
    "payment_value": np.random.normal(200,50,1000)
})
# SRS
srs=df.sample(n=100, random_state=0)
print(f"SRS region:\\n{srs['region'].value_counts()}")
# Stratified proportional 10%
strat=df.groupby("region", group_keys=False).apply(lambda x: x.sample(frac=0.1, random_state=0))
print(f"\\nStratified 10% each region:\\n{strat['region'].value_counts()}")
# Cluster
df["cluster"]=df["order_id"]//100
selected=np.random.choice(df["cluster"].unique(),2,replace=False)
cluster_sample=df[df["cluster"].isin(selected)]
print(f"\\nCluster select {selected} n={len(cluster_sample)}")
# Systematic k=10
k=10
random_start=np.random.randint(0,k)
syst=df.iloc[random_start::k][:100]
print(f"\\nSystematic k={k} start {random_start} n={len(syst)}")
```

Section B Convenience bias:

```python
import pandas as pd
import numpy as np
np.random.seed(0)
df=pd.DataFrame({
    "order_id": range(1000),
    "region": ["SP"]*700 + ["RJ"]*200 + ["MG"]*100,  # Ordered by region
    "payment_value": np.random.normal(200,50,1000)
})
convenience=df.iloc[:100]  # First 100 all SP
print(f"Convenience first 100 from ordered by region (SP first) region:\\n{convenience['region'].value_counts()} - biased all SP not representative of 70% SP 20% RJ 10% MG")
```

Section C Experimental vs observational:

```python
print("Observational: Observe customers who bought A vs B and compare payment_value - can infer association but not causation due to confounding e.g., income")
print("Experiment: Randomly assign 100 customers to A and 100 to B then compare - randomization balances confounders can infer causation")
print("Principles: Randomization randomly assign treatments avoid bias, Replication repeat treatments estimate variability, Blocking group similar units together reduce variability")
```

Section D Sample size:

```python
import math
z=1.96
sigma=2000
E=100
n=(z*sigma/E)**2
print(f"Sample size for mean margin ±{E} σ={sigma} z={z} n=(zσ/E)²={n:.0f} need {math.ceil(n)}")
# Proportion
E_prop=0.03
p=0.5
n_prop=(z**2 * p*(1-p))/E_prop**2
print(f"Sample size for proportion margin ±{E_prop*100:.0f}% p={p} worst case n=(z²p(1-p))/E²={n_prop:.0f} need {math.ceil(n_prop)}")
```

Section E Kaggle:

```python
import os, pandas as pd
import numpy as np

if os.path.exists("olist_orders_dataset.csv"):
    df_orders=pd.read_csv("olist_orders_dataset.csv", nrows=5000)
    print(f"Population N={len(df_orders)} orders")
    # SRS n=500
    srs=df_orders.sample(n=500, random_state=0)
    print(f"SRS n=500")
    # Sample size for mean order? Need payment_value but orders dataset has no payment_value need join
    # For demo, sample size calculation for estimating mean order value?
    # If we had payment_value, we could calculate required n for margin ±100
    # Example using random payment_value
    np.random.seed(0)
    df_orders["payment_value"]=np.random.normal(200,50,len(df_orders))
    sigma_est=df_orders["payment_value"].std()
    E=10
    z=1.96
    n_req=(z*sigma_est/E)**2
    print(f"Estimate payment_value mean margin ±{E} σ_est={sigma_est:.1f} n=(zσ/E)²={n_req:.0f} need {math.ceil(n_req)} orders")
    
    # Stratified by customer_state if available via join
    if os.path.exists("olist_customers_dataset.csv"):
        df_cust=pd.read_csv("olist_customers_dataset.csv", nrows=5000)
        # Need orders with customer_id join
        merged=pd.merge(df_orders[["order_id","customer_id"]].dropna(), df_cust[["customer_id","customer_state"]], on="customer_id", how="inner")
        print(f"\\nMerged with customers N={len(merged)}")
        # Stratified by state proportional 10%
        stratified=merged.groupby("customer_state", group_keys=False).apply(lambda x: x.sample(frac=0.1, random_state=0) if len(x)>=10 else x)
        print(f"Stratified by customer_state 10% each n={len(stratified)} region distribution:\\n{stratified['customer_state'].value_counts().head()}")
else:
    print("Download https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - olist_orders_dataset.csv")
```

Deliverable: Upload sampling_experimental_L17.py + output showing SRS unbiased approx population 70% SP, stratified ensures representation 70 20 10, cluster cheaper less precise, systematic every k-th risk periodicity, convenience bias first 100 all SP biased, sample size n=(zσ/E)² for mean n=(z²p(1-p))/E² for proportion, experimental vs observational randomization replication blocking.

Kaggle:
1. Primary https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - orders SRS stratified by state cluster systematic sample size for mean payment_value margin
2. Secondary https://www.kaggle.com/datasets/vivek468/superstore-dataset-final - Sales sampling methods

## 9. Checklist
- Explain why sampling method matters bad sampling biased even large n garbage in garbage out population all units sample subset census vs sample
- Distinguish sampling bias selection undercoverage non-response sample not representative vs non-sampling bias measurement processing response
- Define SRS every unit equal chance every sample equal chance gold standard unbiased need list of all units
- Define stratified divide into strata homogeneous within heterogeneous between SRS within each stratum ensures representation more precise if strata homogeneous proportional vs equal allocation mean estimate Σ(N_h/N)x̄_h
- Define cluster divide into clusters heterogeneous within homogeneous between stores randomly select clusters sample all within selected clusters cheaper when spread out less precise intra-cluster correlation
- Define systematic every k-th unit k=N/n random start r simple evenly spread risk periodicity if list pattern
- Explain convenience easy to reach biased voluntary response self-selected biased online reviews
- Define observational study observe without assigning association not causation confounding vs experiment randomly assign treatment can infer causation
- Explain experimental principles randomization randomly assign avoid bias balance confounders replication repeat estimate variability blocking group similar units reduce variability
- Calculate sample size n=(zσ/E)² for mean E=zσ/√n and n=(z²p(1-p))/E² for proportion E=z√(p(1-p)/n) worst case p=0.5 max variance

Key Takeaway: Bad sampling biased even large n. SRS gold standard every unit equal chance. Stratified divide into strata homogeneous SRS within ensures representation more precise. Cluster divide into clusters randomly select clusters cheaper less precise. Systematic every k-th risk periodicity. Convenience voluntary biased avoid. Observational association not causation confounding vs experiment random assignment causation. Randomization replication blocking principles. Sample size n=(zσ/E)² mean n=(z²p(1-p))/E² proportion.