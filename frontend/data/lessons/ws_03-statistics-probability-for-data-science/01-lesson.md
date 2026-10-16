# Lesson 01 - Descriptive Statistics - Mean, Median, Mode - BEGINNER FRIENDLY

**Duration:** 90 min | **Level:** Absolute Beginner | **Goal:** Understand typical value

## 1. Why Need Descriptive Statistics?

You have 5 orders: 10k,12k,13k,11k,14k. Manager asks typical order? With 1000 orders you cannot list all. Need one number summarizing - central tendency: Mean, Median, Mode.

## 2. Mean - Balancing Point

Mean = average = sum / count. Like sharing money equally. 5 friends have 10,12,13,11,14 total 60 shared equally each gets 12.

Mean is like seesaw balance point. One heavy weight far shifts balance.

**Step-by-Step Code - Simple to Advanced**

Step 1 - Plain Python no libraries:

```python
orders = [10, 12, 13, 11, 14]
total = 0
for amount in orders:
    total += amount
    print(f"Adding {amount}, total={total}")
count = len(orders)
mean = total / count
print(f"Mean = {total}/{count} = {mean}")
```

Step 2 - Using sum() built-in:

```python
orders = [10, 12, 13, 11, 14]
mean = sum(orders) / len(orders)
print(f"Mean = {mean}")
```

Step 3 - Using NumPy for large data:

```python
import numpy as np
orders = np.array([10, 12, 13, 11, 14])
print(f"NumPy mean = {np.mean(orders)}")
big = np.random.randint(10,15,size=1000000)
print(f"1M orders mean {np.mean(big):.2f} fast")
```

Step 4 - Using Pandas for table:

```python
import pandas as pd
df = pd.DataFrame({"order_id": ["ORD_LAG_001_5001","ORD_LAG_001_5002"], "total": [10000,12000]})
print(df["total"].mean())
```

Outlier demo:

```python
normal = [10,12,13,11,14]
outlier = [10,12,13,11,100]
print(f"Normal mean {sum(normal)/len(normal)} vs outlier mean {sum(outlier)/len(outlier)} - 100 pulls mean up!")
```

## 3. Median - Middle Person

Median = middle value when sorted smallest to largest. 5 people ordered by height, 3rd person median height. Half shorter half taller.

Odd n=5: [10,11,12,13,14] middle 3rd =12. Even n=6: [10,11,12,13,14,15] two middle 12 and 13 average (12+13)/2=12.5

Median robust - cares about order not size. Outlier doesn't change median.

Step 1 - Plain Python:

```python
orders = [14,10,13,11,12]
sorted_orders = sorted(orders)
print(f"Sorted {sorted_orders}")
n = len(sorted_orders)
median = sorted_orders[n//2]
print(f"Median index {n}//2={n//2} value {median}")

# With outlier
outlier = [100,10,13,11,12]
print(f"Outlier sorted {sorted(outlier)} median {sorted(outlier)[len(outlier)//2]} still 12!")
```

Step 2 - Even:

```python
orders_even = [14,10,13,11,12,15]
sorted_even = sorted(orders_even)
n=len(sorted_even)
v1=sorted_even[n//2-1]
v2=sorted_even[n//2]
median_even=(v1+v2)/2
print(f"Even {sorted_even} two middle {v1},{v2} median {median_even}")
```

Step 3 - NumPy Pandas:

```python
import numpy as np, pandas as pd
print(f"NumPy median [100,10,13,11,12] {np.median([100,10,13,11,12])} vs mean {np.mean([100,10,13,11,12])}")
df=pd.DataFrame({"total":[10000,12000,13000,11000,100000]})
print(f"Pandas median {df['total'].median()} robust vs mean {df['total'].mean()} inflated")
```

## 4. Mode - Most Frequent

Mode = value appears most often. Voting analogy - most votes wins. For categories like product Accessories vs Display, mode best.

Step 1 counting:

```python
orders=[10,12,12,11,12,14]
counts={}
for v in orders:
    counts[v]=counts.get(v,0)+1
print(counts)
mode=max(counts, key=counts.get)
print(f"Mode {mode}")
```

Step 2 Counter Pandas:

```python
from collections import Counter
orders=[10,12,12,11,12,14]
print(Counter(orders).most_common(1)[0][0])
import pandas as pd
df=pd.DataFrame({"product":["Acc","Display","Acc","Acc"]})
print(f"Product mode {df['product'].mode()[0]}")
```

## 5. When to Use Which

- SYMMETRIC No Outliers [10,11,12,13,14] Mean=12 Median=12 Use MEAN uses all data precise
- RIGHT-SKEWED Few Huge [10,11,12,13,100] Mean 29.2 Median 12 Use MEDIAN robust
- CATEGORICAL [Acc,Display,Acc] Mean impossible Use MODE most frequent

Sales often right-skewed many small few huge Mean>Median Median better for typical Report both

## 6. Real Store Example - Location Only Where Needed

```python
import pandas as pd
orders_data = [
    {"order_id": "ORD_LAG_001_5001", "store_id": "LAG_001_Ikeja", "total": 53750},
    {"order_id": "ORD_LAG_001_5002", "store_id": "LAG_001_Ikeja", "total": 34400},
    {"order_id": "ORD_LAG_002_5003", "store_id": "LAG_002_Lekki", "total": 91375},
    {"order_id": "ORD_LAG_001_5005", "store_id": "LAG_001_Ikeja", "total": 120000},
]
df=pd.DataFrame(orders_data)
for store in df["store_id"].unique():
    subset=df[df["store_id"]==store]["total"]
    print(f"{store} Mean {subset.mean():.0f} Median {subset.median():.0f} Mean>Median outlier!")
```

Note: Use store_id only for grouping. Don't mix NGN and GBP scales.

## 7. Assignment - Simple to Advanced

Dataset: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - olist_order_payments_dataset.csv payment_value right-skewed

Create descriptive_stats_L01.py:

Section A Plain Python:
```python
orders=[10,12,13,11,14]
mean=sum(orders)/len(orders)
median=sorted(orders)[len(orders)//2]
from collections import Counter
mode=Counter(orders).most_common(1)[0][0]
print(f"Mean {mean} Median {median} Mode {mode}")
```

Section B With Outlier:
```python
normal=[10,11,12,13,14]
outlier=[10,11,12,13,100]
print(f"Normal mean {sum(normal)/len(normal)} median {sorted(normal)[2]} vs outlier mean {sum(outlier)/len(outlier)} median {sorted(outlier)[2]} median robust")
```

Section C NumPy:
```python
import numpy as np
print(f"Mean {np.mean([10,11,12,13,100])} Median {np.median([10,11,12,13,100])}")
```

Section D Pandas Store:
```python
import pandas as pd
df=pd.DataFrame({"store_id":["LAG_001_Ikeja","LAG_001_Ikeja","LAG_002_Lekki"],"total":[53750,34400,91375]})
print(df.groupby("store_id")["total"].agg(["mean","median"]))
```

Section E Kaggle:
```python
import os, pandas as pd
if os.path.exists("olist_order_payments_dataset.csv"):
    df=pd.read_csv("olist_order_payments_dataset.csv", nrows=10000)
    vals=df["payment_value"].dropna()
    print(f"Mean {vals.mean():.2f} > Median {vals.median():.2f} right-skewed median better Top 5 {vals.nlargest(5).tolist()} inflate mean")
else:
    print("Download https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce")
```

Deliverable: Upload descriptive_stats_L01.py + output showing mean sensitive median robust.

Kaggle: Primary https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce payment_value Secondary https://www.kaggle.com/datasets/vivek468/superstore-dataset-final Sales

## 8. Checklist
- Explain mean equal share Sum/n seesaw balance sensitive outlier 146/5=29.2
- Explain median middle sorted odd middle even avg two middle robust order not size
- Explain mode most frequent voting categorical bimodal
- Decide mean symmetric median skewed/mode categorical
- Code plain Python sum/len sorted() to NumPy np.mean to Pandas df.mean()

Key Takeaway: Mean Sum/Count sensitive. Median middle robust. Mode most frequent categorical. Sales right-skewed Mean>Median report both.
