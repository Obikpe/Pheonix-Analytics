# Lesson 16 - Time Series & Forecasting Basics - Predict Tomorrow's Sales

**Duration:** 90 min | **Level:** Absolute Beginner | **Goal:** Understand time series patterns and make simple forecasts

## What You Will Learn

By the end of this lesson, you will be able to:

- Define time series: Data ordered by time, e.g., daily sales, hourly orders, dependence on previous values
- Explain components of time series: Trend (long-term increase/decrease), seasonality (repeating pattern period e.g., weekly, yearly), cyclical (longer non-fixed period), noise/residual (random variation)
- Distinguish stationary vs non-stationary: Stationary mean, variance, autocorrelation constant over time, no trend seasonality, easier to forecast
- Explain autocorrelation and lag: Correlation of series with itself at lag k, e.g., lag 1 yesterday's sales correlates with today's
- Calculate simple moving average SMA: Average of last k values smooths noise, forecast = SMA
- Calculate exponential smoothing: Weighted average recent values more weight, forecast = α×y_t + (1−α)×forecast_{t-1}
- Explain naive forecast: Forecast tomorrow = today (last value), baseline to beat
- Calculate forecast accuracy metrics: MAE = mean absolute error Σ|y − ŷ|/n, RMSE = √(Σ(y−ŷ)²/n) penalizes large errors, MAPE = mean absolute percentage error
- Build time series forecast using pandas rolling and simple methods
- Apply to sales data: Daily orders time series, decompose trend seasonality, forecast next 7 days with SMA and exponential smoothing

---

## 1. What is Time Series? Time Ordered Data

Time series data points ordered by time, each observation y_t at time t.

Examples:
- Daily total sales: y_1 Jan1, y_2 Jan2, ...
- Hourly orders: y_t orders at hour t
- Monthly payment_value average

Unlike previous lessons where data was independent, time series often is dependent: Today's sales related to yesterday's sales (autocorrelation).

Goal: Understand patterns and forecast future y_{t+1}, y_{t+2}, ...

### Components

Time series y_t can be decomposed:

y_t = Trend_t + Seasonality_t + Cyclical_t + Noise_t (additive) or y_t = Trend × Seasonality × Noise (multiplicative if seasonality amplitude grows with trend)

- **Trend:** Long-term increase/decrease direction. Example: Sales growing over years due to business growth.
- **Seasonality:** Repeating pattern fixed period, e.g., weekly seasonality higher sales weekends, yearly seasonality higher sales December holidays, daily seasonality higher orders evening.
- **Cyclical:** Longer period non-fixed length, e.g., business cycles 5 years boom bust, not as regular as seasonality.
- **Noise/Residual:** Random variation after removing trend seasonality cyclical, unpredictable.

For forecasting, need to capture trend and seasonality.

### Stationary vs Non-Stationary

- **Stationary:** Statistical properties constant over time: Mean constant (no trend), variance constant (no changing spread), autocorrelation constant. Easier to forecast with simple models. Example: Residuals after removing trend seasonality.

- **Non-stationary:** Mean changes (trend), variance changes, seasonality. Most raw sales data non-stationary due to trend seasonality. Need to make stationary by differencing (y_t − y_{t-1}) or detrending.

### Visual: Time Series Components

<svg width="100%" height="220" viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="220" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">TIME SERIES COMPONENTS - y = Trend + Seasonality + Noise</text>
  <rect x="20" y="50" width="150" height="150" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
  <text x="95" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#1E40AF">Trend Long-term</text>
  <text x="35" y="90" font-family="Arial" font-size="8" fill="#1E40AF">Increase/decrease</text>
  <text x="35" y="108" font-family="Arial" font-size="8" fill="#1E40AF">Sales growing over years</text>
  <rect x="190" y="50" width="150" height="150" rx="12" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1"/>
  <text x="265" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#065F46">Seasonality Repeating</text>
  <text x="205" y="90" font-family="Arial" font-size="8" fill="#065F46">Fixed period weekly yearly</text>
  <text x="205" y="108" font-family="Arial" font-size="8" fill="#065F46">Weekend higher December higher</text>
  <rect x="360" y="50" width="150" height="150" rx="12" fill="#FFFBEB" stroke="#FCD34D" stroke-width="1"/>
  <text x="435" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#92400E">Cyclical Long non-fixed</text>
  <text x="375" y="90" font-family="Arial" font-size="8" fill="#92400E">Business cycles 5 years</text>
  <rect x="530" y="50" width="150" height="150" rx="12" fill="#FEF2F2" stroke="#FCA5A5" stroke-width="1"/>
  <text x="605" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#7F1D1D">Noise Random</text>
  <text x="545" y="90" font-family="Arial" font-size="8" fill="#7F1D1D">Unpredictable variation</text>
  <text x="545" y="108" font-family="Arial" font-size="8" fill="#7F1D1D">Residual after trend season</text>
</svg>

---

## 2. Autocorrelation and Lag

### Lag

Lag k means value k steps ago. y_{t-1} lag 1 yesterday, y_{t-7} lag 7 one week ago.

### Autocorrelation

Autocorrelation at lag k = correlation between y_t and y_{t-k}

r_k = Corr(y_t, y_{t-k})

- r_1 lag 1 autocorrelation: How much today's sales correlate with yesterday's. If r_1 high positive ~0.8, today's sales similar to yesterday's, strong persistence.
- r_7 lag 7: Weekly seasonality, sales today correlate with same weekday last week.

If r_k significant, past values help forecast future.

### Stationary vs Non-Stationary via Autocorrelation

- Stationary: Autocorrelation decays quickly to 0, r_k small after few lags.
- Non-stationary with trend: Autocorrelation decays slowly, stays high many lags because trend makes values correlated long time.

Differencing y_t − y_{t-1} removes trend makes stationary autocorrelation decays.

### Code Simple→Advanced - Autocorrelation

**Method 1 Plain Python Manual Lag 1 Autocorrelation:**

```python
# Method 1: Manual autocorrelation lag 1
import math

# Example daily sales
y = [100,110,105,115,120,118,125,130,128,135]  # Increasing trend + noise

n=len(y)

# Lag 1 pairs: (y_t, y_{t-1}) for t=1 to n-1
# y_t = y[1..n-1], y_{t-1}=y[0..n-2]
y_t = y[1:]
y_lag1 = y[:-1]

print(f"y={y}")
print(f"y_t (today)={y_t}")
print(f"y_{{t-1}} (yesterday)={y_lag1}")

# Means
y_t_bar = sum(y_t)/len(y_t)
y_lag1_bar = sum(y_lag1)/len(y_lag1)

# Autocorrelation r1 = Σ(y_t - ȳ_t)(y_{t-1} - ȳ_{lag1}) / √(Σ(y_t-ȳ_t)² Σ(y_{t-1}-ȳ_{lag1})²) - Pearson correlation between y_t and y_{t-1}
numer = sum((a - y_t_bar)*(b - y_lag1_bar) for a,b in zip(y_t, y_lag1))
denom_t = sum((a - y_t_bar)**2 for a in y_t)
denom_lag = sum((b - y_lag1_bar)**2 for b in y_lag1)
denom = math.sqrt(denom_t * denom_lag)

r1 = numer/denom if denom!=0 else 0

print(f"\\nLag 1 autocorrelation r1 = Σ(y_t-ȳ_t)(y_{{t-1}}-ȳ_{{t-1}})/√(Σ(y_t-ȳ_t)²Σ(y_{{t-1}}-ȳ_{{t-1}})²)")
print(f"Numer={numer:.1f} Denom=√({denom_t:.1f}×{denom_lag:.1f})=√{denom_t*denom_lag:.1f}={denom:.1f}")
print(f"r1={r1:.3f} - high positive {r1:.2f} means today's sales similar to yesterday's, trend present")

# Lag 7 weekly if we had more data
# For non-stationary trend, r1 stays high, differencing removes trend
# Differenced series d_t = y_t - y_{t-1}
d = [y[i]-y[i-1] for i in range(1,len(y))]
print(f"\\nDifferenced d_t=y_t-y_{{t-1}}={d} - removes trend, should be more stationary")
```

**Method 2 Pandas and Statsmodels Autocorrelation:**

```python
import pandas as pd
import numpy as np
from statsmodels.tsa.stattools import acf, pacf
import matplotlib.pyplot as plt

np.random.seed(0)

# Simulate stationary series: white noise no autocorrelation
stationary = np.random.normal(0,1,100)

# Simulate non-stationary trend
trend = np.cumsum(np.random.normal(0,1,100)) + 0.5  # Random walk with drift trend

# Simulate seasonality weekly + trend + noise
t = np.arange(100)
seasonal = 10*np.sin(2*np.pi*t/7)  # Weekly seasonality period 7
seasonal_trend = 0.1*t + seasonal + np.random.normal(0,1,100)

# Autocorrelation for stationary - decays quickly
acf_stationary = acf(stationary, nlags=20)
print(f"Stationary white noise acf lag1={acf_stationary[1]:.3f} should be ≈0 no autocorrelation")

# Autocorrelation for trend - decays slowly stays high
acf_trend = acf(trend, nlags=20)
print(f"Trend random walk acf lag1={acf_trend[1]:.3f} high lag10={acf_trend[10]:.3f} still high decays slowly non-stationary")

# Autocorrelation for seasonal
acf_seasonal = acf(seasonal_trend, nlags=20)
print(f"Seasonal+trend acf lag7={acf_seasonal[7]:.3f} higher than lag6={acf_seasonal[6]:.3f} weekly seasonality peak at lag 7")

# Plot ACF
fig, axes = plt.subplots(3,1, figsize=(8,8))

axes[0].stem(range(len(acf_stationary)), acf_stationary)
axes[0].set_title(f"Stationary white noise ACF - decays quickly to 0")

axes[1].stem(range(len(acf_trend)), acf_trend)
axes[1].set_title(f"Non-stationary trend ACF - decays slowly stays high")

axes[2].stem(range(len(acf_seasonal)), acf_seasonal)
axes[2].set_title(f"Seasonal+trend ACF - peak at lag 7 weekly seasonality")

plt.tight_layout()
plt.savefig("acf_examples.png")
print("Saved acf_examples.png - stationary quick decay, trend slow decay, seasonal peak at lag 7")

# Differencing makes trend stationary
diff_trend = np.diff(trend)
acf_diff = acf(diff_trend, nlags=20)
print(f"\\nAfter differencing trend d_t=y_t-y_{{t-1}} acf lag1={acf_diff[1]:.3f}≈0 now stationary")
```

---

## 3. Simple Forecasting Methods - Baseline to Beat

### Naive Forecast

Simplest: Forecast tomorrow = today value

ŷ_{t+1} = y_t

For daily sales, forecast tomorrow's sales = today's sales.

Baseline to beat: If your fancy model can't beat naive, not useful.

For seasonal data, seasonal naive: Forecast tomorrow = same weekday last week ŷ_{t+1} = y_{t+1-7} = y_{t-6} (if weekly seasonality)

### Simple Moving Average SMA

SMA_k = average of last k values

ŷ_{t+1} = (y_t + y_{t-1} + ... + y_{t-k+1})/k

Smooths noise, captures recent average.

Example k=3: Forecast tomorrow = average last 3 days.

Larger k more smoothing less responsive to recent changes, smaller k more responsive but more noise.

### Exponential Smoothing (Simple Exponential Smoothing)

Weighted average with exponentially decaying weights: Recent values more weight.

ŷ_{t+1} = α×y_t + (1−α)×ŷ_t where α smoothing parameter 0<α<1

Equivalently ŷ_{t+1} = α y_t + α(1−α) y_{t-1} + α(1−α)² y_{t-2} + ... weights decay exponentially.

α close to 1: More weight recent, responsive but noisy
α close to 0: More weight past, smooth but slow to adapt

Choose α via minimizing forecast error.

### Visual: Forecasting Methods

<svg width="100%" height="180" viewBox="0 0 700 180" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="180" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="350" y="25" text-anchor="middle" font-family="Arial" font-size="12" font-weight="800" fill="#111827">FORECASTING METHODS - NAIVE, SMA, EXPONENTIAL SMOOTHING</text>
  <rect x="20" y="50" width="200" height="110" rx="12" fill="#EFF6FF" stroke="#93C5FD" stroke-width="1"/>
  <text x="120" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#1E40AF">Naive ŷ_{t+1}=y_t</text>
  <text x="35" y="90" font-family="Arial" font-size="8" fill="#1E40AF">Forecast tomorrow=today</text>
  <text x="35" y="108" font-family="Arial" font-size="8" fill="#1E40AF">Baseline to beat</text>
  <rect x="250" y="50" width="200" height="110" rx="12" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1"/>
  <text x="350" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#065F46">SMA_k average last k</text>
  <text x="265" y="90" font-family="Arial" font-size="8" fill="#065F46">ŷ_{t+1}=(y_t+...+y_{t-k+1})/k</text>
  <text x="265" y="108" font-family="Arial" font-size="8" fill="#065F46">k=3 last 3 days average smooths noise</text>
  <rect x="480" y="50" width="200" height="110" rx="12" fill="#FFFBEB" stroke="#FCD34D" stroke-width="1"/>
  <text x="580" y="70" text-anchor="middle" font-family="Arial" font-size="9" font-weight="800" fill="#92400E">Exponential α×y_t+(1-α)×ŷ_t</text>
  <text x="495" y="90" font-family="Arial" font-size="8" fill="#92400E">Weighted avg recent more weight</text>
  <text x="495" y="108" font-family="Arial" font-size="8" fill="#92400E">α=0.8 responsive α=0.2 smooth</text>
</svg>

### Code Simple→Advanced - Forecasting

**Method 1 Plain Python Manual:**

```python
# Method 1: Manual naive, SMA, exponential smoothing
import math

y = [100,110,105,115,120,118,125]  # Daily sales last 7 days

print(f"y={y}")

# Naive forecast tomorrow = today last value
naive_forecast = y[-1]
print(f"\\nNaive forecast ŷ_{{t+1}}=y_t={y[-1]} = {naive_forecast}")

# SMA k=3 forecast = average last 3
k=3
sma_forecast = sum(y[-k:])/k
print(f"SMA k={k} forecast ŷ_{{t+1}}=(y_t+...+y_{{t-k+1}})/k = ({y[-3]}+{y[-2]}+{y[-1]})/{k} = {sum(y[-k:])}/{k} = {sma_forecast:.1f}")

# SMA k=7 average last 7
k7=7
sma7_forecast = sum(y[-k7:])/k7
print(f"SMA k={k7} forecast = {sma7_forecast:.1f} more smoothing")

# Exponential smoothing α=0.5
alpha=0.5
# Initialize forecast first value = y0
forecast = [y[0]]  # ŷ_1 = y_1 initial
for t in range(1,len(y)):
    # ŷ_{t+1} = α×y_t + (1-α)×ŷ_t
    # For fitting, forecast for y_t is ŷ_t
    # y_t observed, ŷ_t forecast for y_t
    # We'll compute forecast for next step
    # Simple: iterative
    # Let's compute forecasts for each t
    pass

# More precise: Simple exponential smoothing level
# l_t = α y_t + (1-α) l_{t-1}, forecast ŷ_{t+1}=l_t
level = y[0]
forecasts = [level]  # Forecast for y1 is level initial
for t in range(1,len(y)):
    level = alpha*y[t-1] + (1-alpha)*level  # Actually level_t-1 based on y_{t-1}
    # Let's do standard: l_t = α y_t + (1-α) l_{t-1}, forecast for t+1 is l_t
    # We'll recalculate correctly below

# Correct simple exponential smoothing
level = y[0]
levels = [level]
for t in range(1,len(y)):
    level = alpha*y[t] + (1-alpha)*level
    levels.append(level)

# Forecast for t+1 is last level
exp_forecast = levels[-1]
print(f"\\nExponential smoothing α={alpha}")
print(f"Levels l_t=α y_t+(1-α)l_{{t-1}}: {levels}")
print(f"Forecast ŷ_{{t+1}}=l_t={exp_forecast:.1f}")

# With α=0.8 more responsive
alpha2=0.8
level2=y[0]
levels2=[level2]
for t in range(1,len(y)):
    level2 = alpha2*y[t] + (1-alpha2)*level2
    levels2.append(level2)
print(f"\\nα={alpha2} more weight recent levels: {levels2} forecast {levels2[-1]:.1f} more responsive to last values")

# α=0.2 smooth
alpha3=0.2
level3=y[0]
levels3=[level3]
for t in range(1,len(y)):
    level3 = alpha3*y[t] + (1-alpha3)*level3
    levels3.append(level3)
print(f"α={alpha3} smooth levels: {levels3} forecast {levels3[-1]:.1f} smoother less responsive")
```

**Method 2 Pandas Rolling for SMA:**

```python
import pandas as pd
import numpy as np

# Create time series daily sales
dates = pd.date_range("2024-01-01", periods=30, freq="D")
sales = np.random.normal(100,10,30) + np.linspace(0,20,30)  # Trend + noise

df = pd.DataFrame({"date": dates, "sales": sales})
df.set_index("date", inplace=True)

# SMA k=3
df["SMA_3"] = df["sales"].rolling(window=3).mean()
# SMA k=7
df["SMA_7"] = df["sales"].rolling(window=7).mean()

# Naive forecast: shift 1
df["Naive_forecast"] = df["sales"].shift(1)  # Forecast for today is yesterday

# Exponential smoothing using pandas ewm
# α = 1 - exp(log(0.5)/halflife) approx but use alpha directly
# ewm alpha parameter
df["ExpSmooth_0.5"] = df["sales"].ewm(alpha=0.5).mean()
df["ExpSmooth_0.8"] = df["sales"].ewm(alpha=0.8).mean()

print(df.tail(10))

# Forecast next day = last SMA or last ExpSmooth
last_sma3 = df["SMA_3"].iloc[-1]
last_sma7 = df["SMA_7"].iloc[-1]
last_exp05 = df["ExpSmooth_0.5"].iloc[-1]
last_exp08 = df["ExpSmooth_0.8"].iloc[-1]
last_naive = df["sales"].iloc[-1]

print(f"\\nForecasts for next day (t+1):")
print(f"Naive ŷ=y_t={last_naive:.1f}")
print(f"SMA k=3 {last_sma3:.1f}")
print(f"SMA k=7 {last_sma7:.1f}")
print(f"Exp α=0.5 {last_exp05:.1f}")
print(f"Exp α=0.8 {last_exp08:.1f}")

# Plot
import matplotlib.pyplot as plt

plt.figure()
plt.plot(df.index, df["sales"], label="Actual sales", color="blue")
plt.plot(df.index, df["SMA_3"], label="SMA k=3", color="red")
plt.plot(df.index, df["SMA_7"], label="SMA k=7", color="green")
plt.plot(df.index, df["ExpSmooth_0.5"], label="Exp α=0.5", color="orange")
plt.legend()
plt.title("Forecasting Methods")
plt.savefig("forecasting_methods.png")
print("Saved forecasting_methods.png - blue actual, red SMA3, green SMA7 more smooth, orange ExpSmooth")
```

**Method 3 Forecast Accuracy MAE RMSE MAPE:**

```python
import numpy as np
import math

# Example actual vs forecast
actual = np.array([100,110,105,115,120])
forecast = np.array([100,105,110,110,118])

# Errors e = y - ŷ
errors = actual - forecast
print(f"Actual {actual}")
print(f"Forecast {forecast}")
print(f"Errors e=y-ŷ {errors}")

# MAE = mean absolute error Σ|y-ŷ|/n
mae = np.mean(np.abs(errors))
print(f"\\nMAE = Σ|y-ŷ|/n = {mae:.2f} average absolute error")

# RMSE = √(Σ(y-ŷ)²/n) penalizes large errors more than MAE
rmse = math.sqrt(np.mean(errors**2))
print(f"RMSE = √(Σ(y-ŷ)²/n) = {rmse:.2f} penalizes large errors more, RMSE≥MAE")

# MAPE = mean absolute percentage error Σ| (y-ŷ)/y |/n ×100%
mape = np.mean(np.abs(errors/actual))*100
print(f"MAPE = Σ| (y-ŷ)/y |/n ×100% = {mape:.2f}% percentage error")

# Which forecast better? Lower MAE RMSE MAPE better
# Naive vs SMA vs Exp compare MAE
```

---

## 4. Real Store Example - Daily Sales Forecast

```python
import pandas as pd
import numpy as np
from statsmodels.tsa.stattools import acf
import matplotlib.pyplot as plt

np.random.seed(0)

# Simulate daily sales for Ikeja 90 days with weekly seasonality + trend + noise
dates = pd.date_range("2024-01-01", periods=90, freq="D")
trend = np.linspace(40000,50000,90)  # Growing trend
seasonality = 5000*np.sin(2*np.pi*np.arange(90)/7)  # Weekly seasonality period 7 higher weekends
noise = np.random.normal(0,2000,90)
sales = trend + seasonality + noise

df = pd.DataFrame({"date": dates, "sales": sales})
df.set_index("date", inplace=True)

# Check components visually
plt.figure(figsize=(10,6))
plt.subplot(3,1,1)
plt.plot(df.index, df["sales"])
plt.title("Daily Sales - Trend + Weekly Seasonality + Noise")

plt.subplot(3,1,2)
# Trend via SMA 7 smooths seasonality
df["Trend_SMA7"] = df["sales"].rolling(7).mean()
plt.plot(df.index, df["Trend_SMA7"])
plt.title("Trend estimated via SMA 7 - removes seasonality")

plt.subplot(3,1,3)
# Autocorrelation to see seasonality
from statsmodels.tsa.stattools import acf
acf_vals = acf(df["sales"], nlags=21)
plt.stem(range(len(acf_vals)), acf_vals)
plt.title("ACF - peak at lag 7 weekly seasonality")
plt.tight_layout()
plt.savefig("timeseries_decompose.png")
print("Saved timeseries_decompose.png")

# Forecasting
# SMA 7 forecast next day
df["SMA_7"] = df["sales"].rolling(7).mean()
df["Exp_0.5"] = df["sales"].ewm(alpha=0.5).mean()
df["Naive"] = df["sales"].shift(1)

# Evaluate last 20 days as test set
test_size=20
train=df.iloc[:-test_size]
test=df.iloc[-test_size:]

# Forecasts for test period using train data last values?
# Simple: Use rolling forecasts from train
# For simplicity, calculate MAE for each method on test set

# Naive MAE
mae_naive = np.mean(np.abs(test["sales"] - test["Naive"]))
# SMA7 MAE (need SMA from train? For simplicity use SMA already computed)
mae_sma7 = np.mean(np.abs(test["sales"] - test["SMA_7"]))
mae_exp05 = np.mean(np.abs(test["sales"] - test["Exp_0.5"]))

print(f"\\nForecast accuracy on last {test_size} days test set:")
print(f"Naive MAE={mae_naive:.0f}")
print(f"SMA7 MAE={mae_sma7:.0f}")
print(f"Exp α=0.5 MAE={mae_exp05:.0f} - lower MAE better")

# Forecast next 7 days
last_sma7 = df["SMA_7"].iloc[-1]
last_exp = df["Exp_0.5"].iloc[-1]
last_actual = df["sales"].iloc[-1]

print(f"\\nForecast next 7 days:")
print(f"Next day forecasts: Naive={last_actual:.0f} SMA7={last_sma7:.0f} Exp05={last_exp:.0f}")
print(f"For 7 days ahead, naive would forecast same last value for all 7 days, SMA7 average last 7, more realistic to use trend + seasonality models like Holt-Winters")
```

---

## 5. Hands-On Assignment

Dataset: https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - order_purchase_timestamp daily orders count time series

Create timeseries_forecast_L16.py:

Section A Time series components and autocorrelation:

```python
import pandas as pd
import numpy as np
from statsmodels.tsa.stattools import acf

np.random.seed(0)
# Simulate trend + seasonality + noise
t=np.arange(90)
trend=np.linspace(40000,50000,90)
seasonality=5000*np.sin(2*np.pi*t/7)
noise=np.random.normal(0,2000,90)
sales=trend+seasonality+noise

# Autocorrelation
acf_vals=acf(sales, nlags=14)
print(f"ACF lag1={acf_vals[1]:.3f} lag7={acf_vals[7]:.3f} - peak at lag7 weekly seasonality")
print(f"Trend present ACF decays slowly, differencing removes trend")

# Differencing
diff_sales=np.diff(sales)
acf_diff=acf(diff_sales, nlags=14)
print(f"After differencing d_t=y_t-y_{{t-1}} ACF lag1={acf_diff[1]:.3f} more stationary")
```

Section B Naive, SMA, Exponential smoothing:

```python
import pandas as pd
import numpy as np

sales=np.array([100,110,105,115,120,118,125])
k=3
sma=np.mean(sales[-k:])
naive=sales[-1]
print(f"Sales {sales} Naive forecast {naive} SMA k={k} forecast {sma:.1f}")

# Exponential smoothing α=0.5
alpha=0.5
level=sales[0]
levels=[level]
for t in range(1,len(sales)):
    level=alpha*sales[t]+(1-alpha)*level
    levels.append(level)
print(f"Exp smoothing α={alpha} levels {levels} forecast {levels[-1]:.1f}")
```

Section C Forecast accuracy:

```python
import numpy as np
import math
actual=np.array([100,110,105,115,120])
forecast=np.array([100,105,110,110,118])
errors=actual-forecast
mae=np.mean(np.abs(errors))
rmse=math.sqrt(np.mean(errors**2))
mape=np.mean(np.abs(errors/actual))*100
print(f"Actual {actual} Forecast {forecast} Errors {errors}")
print(f"MAE={mae:.2f} RMSE={rmse:.2f} MAPE={mape:.2f}% - lower better")
```

Section D Kaggle daily orders time series:

```python
import os, pandas as pd
from statsmodels.tsa.stattools import acf
import numpy as np
import matplotlib.pyplot as plt

if os.path.exists("olist_orders_dataset.csv"):
    df_orders=pd.read_csv("olist_orders_dataset.csv", nrows=10000)
    # Convert order_purchase_timestamp to datetime and daily counts
    df_orders["order_purchase_timestamp"]=pd.to_datetime(df_orders["order_purchase_timestamp"])
    df_orders["date"]=df_orders["order_purchase_timestamp"].dt.date
    daily_counts=df_orders.groupby("date").size()
    daily_counts.index=pd.to_datetime(daily_counts.index)
    daily_counts=daily_counts.sort_index()
    
    print(f"Daily orders time series {len(daily_counts)} days from {daily_counts.index.min()} to {daily_counts.index.max()}")
    print(daily_counts.head())
    
    # Plot
    plt.figure()
    plt.plot(daily_counts.index, daily_counts.values)
    plt.title("Daily Orders Time Series - trend seasonality noise")
    plt.savefig("kaggle_daily_orders.png")
    print("Saved kaggle_daily_orders.png")
    
    # ACF to see weekly seasonality
    acf_vals=acf(daily_counts.values, nlags=21)
    print(f"ACF lag1={acf_vals[1]:.3f} lag7={acf_vals[7]:.3f} - check weekly seasonality peak at lag7")
    
    # SMA 7 and Exp smoothing
    daily_df=pd.DataFrame({"orders": daily_counts.values}, index=daily_counts.index)
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
        print(f"\\nLast {test_size} days MAE Naive={mae_naive:.2f} SMA7={mae_sma7:.2f} Exp0.5={mae_exp:.2f} - lower better")
        
        # Forecast next 7 days
        last_sma7=daily_df["SMA_7"].iloc[-1]
        last_exp=daily_df["Exp_0.5"].iloc[-1]
        last_actual=daily_df["orders"].iloc[-1]
        print(f"Next day forecasts: Naive={last_actual} SMA7={last_sma7:.1f} Exp0.5={last_exp:.1f}")
else:
    print("Download https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - olist_orders_dataset.csv")
```

Deliverable: Upload timeseries_forecast_L16.py + images acf_examples.png, forecasting_methods.png, timeseries_decompose.png, kaggle_daily_orders.png + output showing trend seasonality noise components, autocorrelation r_k=Corr(y_t,y_{t-k}) lag 1 yesterday lag 7 weekly peak, stationary quick decay vs non-stationary slow decay differencing y_t−y_{t-1} makes stationary, naive ŷ_{t+1}=y_t baseline, SMA_k average last k smooths noise, exponential smoothing ŷ_{t+1}=α×y_t+(1−α)×ŷ_t weighted recent more weight α=0.8 responsive α=0.2 smooth, MAE Σ|y−ŷ|/n RMSE √(Σ(y−ŷ)²/n) MAPE.

Kaggle:
1. Primary https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce - daily orders time series trend seasonality ACF weekly peak SMA Exp forecast next 7 days MAE
2. Secondary https://www.kaggle.com/datasets/vivek468/superstore-dataset-final - Order Date daily Sales time series

## 6. Checklist
- Define time series ordered by time dependence on previous values
- Explain components trend long-term increase/decrease seasonality repeating fixed period weekly yearly cyclical long non-fixed noise random
- Distinguish stationary constant mean variance autocorrelation no trend seasonality vs non-stationary trend seasonality
- Explain autocorrelation r_k=Corr(y_t,y_{t-k}) lag k value k steps ago lag1 yesterday lag7 weekly seasonality peak at lag7 stationary decays quickly non-stationary decays slowly
- Explain differencing d_t=y_t−y_{t-1} removes trend makes stationary
- Calculate naive forecast ŷ_{t+1}=y_t baseline seasonal naive ŷ_{t+1}=y_{t+1-7}
- Calculate SMA_k average last k ŷ_{t+1}=(y_t+...+y_{t-k+1})/k smooths noise larger k more smoothing
- Calculate exponential smoothing ŷ_{t+1}=α×y_t+(1−α)×ŷ_t weighted recent more weight α close 1 responsive α close 0 smooth
- Calculate forecast accuracy MAE Σ|y−ŷ|/n RMSE √(Σ(y−ŷ)²/n) penalizes large errors MAPE Σ|(y−ŷ)/y|/n×100%
- Use pandas rolling for SMA ewm for exponential smoothing statsmodels acf for autocorrelation

Key Takeaway: Time series ordered by time y_t trend long-term seasonality repeating period noise random. Autocorrelation r_k=Corr(y_t,y_{t-k}) lag k, stationary quick decay non-stationary slow decay differencing makes stationary. Naive ŷ_{t+1}=y_t baseline, SMA_k average last k smooths noise, exponential smoothing weighted recent more weight. MAE RMSE MAPE measure accuracy lower better.

