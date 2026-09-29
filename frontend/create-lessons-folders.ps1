# Windows PowerShell - Creates 97 lesson folders (many-to-one)
$base = ".\data\lessons"
New-Item -ItemType Directory -Force -Path $base | Out-Null

$folder = Join-Path $base 'ws_01-introduction-to-data-science-analytical-thinking'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Introduction to Data Science & Analytical Thinking
Course ID: ws_01
Track: Data Science
Level: Beginner
Project: Data Science Problem & Opportunity Map
Witstart: true
Original Duration: 2 weeks

## Description
Understand what Data Science is, how Data Scientists approach problems, and how data is used to solve real-world challenges.
## Topics
- [ ] What Data Science is and why it matters
- [ ] Data Science vs Data Analysis vs Machine Learning
- [ ] Understanding different types and sources of data
- [ ] The Data Science lifecycle
- [ ] Business problems, analytical questions, and success metrics
- [ ] Ethics, privacy, bias, and responsible use of data
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'ws_02-python-foundations-for-data-science'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Python Foundations for Data Science
Course ID: ws_02
Track: Data Science
Level: Beginner
Project: Python Data Exploration Notebook
Witstart: true
Original Duration: 3 weeks

## Description
Learn the programming foundations required to work with data using Python.
## Topics
- [ ] Introduction to Python and Jupyter Notebooks
- [ ] Variables, data types, and basic operations
- [ ] Lists, dictionaries, and other data structures
- [ ] Conditions, loops, and functions
- [ ] Introduction to NumPy and Pandas
- [ ] Loading and exploring datasets with Python
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'ws_03-statistics-probability-for-data-science'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Statistics & Probability for Data Science
Course ID: ws_03
Track: Data Science
Level: Beginner
Project: Statistical Data Investigation
Witstart: true
Original Duration: 2 weeks

## Description
Develop the statistical foundation needed to understand patterns, relationships, and uncertainty in data.
## Topics
- [ ] Mean, median, mode, variance, and standard deviation
- [ ] Understanding distributions and outliers
- [ ] Probability fundamentals
- [ ] Sampling and populations
- [ ] Correlation and relationships between variables
- [ ] Statistical interpretation and avoiding misleading conclusions
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'ws_04-data-cleaning-preparation-exploratory-analysis'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Data Cleaning, Preparation & Exploratory Analysis
Course ID: ws_04
Track: Data Science
Level: Intermediate
Project: Exploratory Data Analysis Report
Witstart: true
Original Duration: 3 weeks

## Description
Learn how to transform raw and messy datasets into reliable information ready for analysis and modelling.
## Topics
- [ ] Understanding data quality
- [ ] Missing values, duplicates, and inconsistent data
- [ ] Cleaning text, dates, numbers, and categories
- [ ] Data transformation with Pandas
- [ ] Identifying trends, patterns, and anomalies
- [ ] Exploratory Data Analysis techniques
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'ws_05-databases-sql-for-data-science'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Databases & SQL for Data Science
Course ID: ws_05
Track: Data Science
Level: Intermediate
Project: SQL Data Investigation
Witstart: true
Original Duration: 2 weeks

## Description
Understand how organisations store data and learn how to retrieve information from relational databases.
## Topics
- [ ] Understanding relational databases
- [ ] Tables, rows, columns, and relationships
- [ ] Primary and foreign keys
- [ ] SELECT, WHERE, ORDER BY, and filtering
- [ ] GROUP BY, aggregate functions, and JOINs
- [ ] Using SQL to prepare data for analysis
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'ws_06-data-visualisation-storytelling'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Data Visualisation & Storytelling
Course ID: ws_06
Track: Data Science
Level: Intermediate
Project: Data Science Visual Story
Witstart: true
Original Duration: 2 weeks

## Description
Learn how to communicate complex data and analytical findings clearly.
## Topics
- [ ] Principles of effective Data Visualisation
- [ ] Choosing the right chart for the question
- [ ] Visualising data with Python
- [ ] Comparing trends, categories, and relationships
- [ ] Building clear analytical reports
- [ ] Turning findings into useful data stories
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'ws_07-machine-learning-fundamentals'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Machine Learning Fundamentals
Course ID: ws_07
Track: Data Science
Level: Intermediate
Project: First Machine Learning Model
Witstart: true
Original Duration: 2 weeks

## Description
Understand how machines learn from data and how predictive models are developed.
## Topics
- [ ] What Machine Learning is
- [ ] Supervised vs unsupervised learning
- [ ] Features, targets, and training data
- [ ] Training and testing datasets
- [ ] Understanding the Machine Learning workflow
- [ ] Introduction to Scikit-learn
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'ws_08-supervised-machine-learning'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Supervised Machine Learning
Course ID: ws_08
Track: Data Science
Level: Intermediate
Project: Predictive Machine Learning Model
Witstart: true
Original Duration: 3 weeks

## Description
Learn how models can use historical data to predict outcomes and classify information.
## Topics
- [ ] Regression and classification problems
- [ ] Linear Regression fundamentals
- [ ] Logistic Regression
- [ ] Decision Trees and Random Forests
- [ ] Building models with Scikit-learn
- [ ] Applying supervised learning to real-world problems
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'ws_09-unsupervised-learning-pattern-discovery'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Unsupervised Learning & Pattern Discovery
Course ID: ws_09
Track: Data Science
Level: Advanced
Project: Customer Segmentation Model
Witstart: true
Original Duration: 2 weeks

## Description
Learn how Machine Learning can uncover hidden patterns when the data does not already contain known outcomes.
## Topics
- [ ] Understanding unsupervised learning
- [ ] Clustering and segmentation
- [ ] K-Means clustering
- [ ] Identifying natural groups within data
- [ ] Dimensionality reduction fundamentals
- [ ] Business applications of pattern discovery
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'ws_10-feature-engineering-model-evaluation-improvement'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Feature Engineering, Model Evaluation & Improvement
Course ID: ws_10
Track: MLOps
Level: Advanced
Project: Machine Learning Model Evaluation Report
Witstart: true
Original Duration: 3 weeks

## Description
Learn how to prepare better inputs, assess model performance, and improve Machine Learning solutions.
## Topics
- [ ] Understanding features and model inputs
- [ ] Feature selection and transformation
- [ ] Encoding categorical variables
- [ ] Evaluating regression and classification models
- [ ] Accuracy, precision, recall, and other model metrics
- [ ] Overfitting, underfitting, and model improvement
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'ws_11-applied-machine-learning-ai-model-deployment'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Applied Machine Learning, AI & Model Deployment
Course ID: ws_11
Track: Data Science
Level: Advanced
Project: Interactive Machine Learning Application
Witstart: true
Original Duration: 3 weeks

## Description
Learn how Data Science models move from experimentation toward practical use.
## Topics
- [ ] Building end-to-end Machine Learning pipelines
- [ ] Saving and using trained models
- [ ] Introduction to model deployment
- [ ] Creating simple interactive data applications
- [ ] Introduction to Generative AI and modern AI systems
- [ ] Responsible AI, monitoring, and model limitations
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'ws_12-professional-data-science-portfolio-capstone'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Professional Data Science, Portfolio & Capstone
Course ID: ws_12
Track: Data Science
Level: Advanced
Project: Final Data Science Capstone Project
Witstart: true
Original Duration: 4 weeks

## Description
Bring your technical and analytical skills together into a complete professional Data Science project.
## Topics
- [ ] Structuring an end-to-end Data Science project
- [ ] Translating business problems into modelling problems
- [ ] Documenting methods and assumptions
- [ ] Communicating model results to non-technical audiences
- [ ] Building strong Data Science case studies
- [ ] Developing and presenting a professional portfolio
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_001-excel-to-dashboard-in-7-days'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Excel to Dashboard in 7 Days
Course ID: c_001
Track: Excel & Business Analytics
Level: Beginner
Project: Ship sales dashboard
Witstart: false
Original Duration: 8h • 32 lessons

## Description
Build exec dashboards that get you promoted
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_002-advanced-excel-power-query-vba'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Advanced Excel: Power Query & VBA
Course ID: c_002
Track: Excel & Business Analytics
Level: Intermediate
Project: Automated report
Witstart: false
Original Duration: 10h • 40 lessons

## Description
Automate monthly reports in 1 click
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_003-business-storytelling-with-data'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Business Storytelling with Data
Course ID: c_003
Track: Excel & Business Analytics
Level: Intermediate
Project: Story deck
Witstart: false
Original Duration: 6h • 24 lessons

## Description
Turn data into decisions executives buy
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_004-financial-modeling-in-excel'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Financial Modeling in Excel
Course ID: c_004
Track: Excel & Business Analytics
Level: Advanced
Project: Startup model
Witstart: false
Original Duration: 14h • 56 lessons

## Description
Model startups like an investment banker
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_005-excel-for-data-cleaning'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Excel for Data Cleaning
Course ID: c_005
Track: Excel & Business Analytics
Level: Beginner
Project: Cleaned dataset
Witstart: false
Original Duration: 5h • 20 lessons

## Description
Clean messy data 10x faster
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_006-power-bi-pro-dax-to-deployment'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Power BI Pro: DAX to Deployment
Course ID: c_006
Track: Power BI, Tableau & Visualization
Level: Intermediate
Project: Power BI dashboard
Witstart: false
Original Duration: 12h • 48 lessons

## Description
Ship enterprise dashboards
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_007-tableau-mastery-2026'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Tableau Mastery 2026
Course ID: c_007
Track: Power BI, Tableau & Visualization
Level: Intermediate
Project: Tableau story
Witstart: false
Original Duration: 10h • 40 lessons

## Description
Visuals that win clients
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_008-looker-studio-for-marketers'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Looker Studio for Marketers
Course ID: c_008
Track: Power BI, Tableau & Visualization
Level: Beginner
Project: Marketing dashboard
Witstart: false
Original Duration: 6h • 24 lessons

## Description
Marketing dashboards that prove ROI
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_009-data-visualization-psychology'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Data Visualization Psychology
Course ID: c_009
Track: Power BI, Tableau & Visualization
Level: Intermediate
Project: Chart redesign
Witstart: false
Original Duration: 5h • 20 lessons

## Description
Design charts that don''t lie
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_010-executive-dashboard-design'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Executive Dashboard Design
Course ID: c_010
Track: Power BI, Tableau & Visualization
Level: Advanced
Project: Exec dashboard
Witstart: false
Original Duration: 8h • 32 lessons

## Description
C-suite dashboards that get budget
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_011-sql-that-gets-you-hired'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# SQL That Gets You Hired
Course ID: c_011
Track: SQL, Warehousing & Data Eng Foundations
Level: Beginner
Project: SQL project
Witstart: false
Original Duration: 10h • 40 lessons

## Description
From SELECT to window functions
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_012-postgresql-for-analytics'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# PostgreSQL for Analytics
Course ID: c_012
Track: SQL, Warehousing & Data Eng Foundations
Level: Intermediate
Project: Optimized DB
Witstart: false
Original Duration: 12h • 48 lessons

## Description
Optimize queries that scan millions
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_013-data-warehousing-with-bigquery'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Data Warehousing with BigQuery
Course ID: c_013
Track: SQL, Warehousing & Data Eng Foundations
Level: Intermediate
Project: Warehouse schema
Witstart: false
Original Duration: 11h • 44 lessons

## Description
Design warehouses that scale
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_014-etl-pipelines-with-dbt-airflow'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# ETL Pipelines with dbt & Airflow
Course ID: c_014
Track: SQL, Warehousing & Data Eng Foundations
Level: Advanced
Project: ETL pipeline
Witstart: false
Original Duration: 14h • 56 lessons

## Description
Build pipelines that never break
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_015-nosql-mongodb-firebase'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# NoSQL: MongoDB & Firebase
Course ID: c_015
Track: SQL, Warehousing & Data Eng Foundations
Level: Intermediate
Project: NoSQL app
Witstart: false
Original Duration: 7h • 28 lessons

## Description
When SQL is not enough
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_016-pandas-to-plotly-analytics-that-pays'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Pandas to Plotly: Analytics That Pays
Course ID: c_016
Track: Python for Data Science
Level: Beginner
Project: Analysis notebook
Witstart: false
Original Duration: 12h • 48 lessons

## Description
Analyze real datasets
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_017-numpy-data-wrangling'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# NumPy & Data Wrangling
Course ID: c_017
Track: Python for Data Science
Level: Beginner
Project: Wrangled data
Witstart: false
Original Duration: 8h • 32 lessons

## Description
Wrangle messy data like a pro
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_018-exploratory-data-analysis-system'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Exploratory Data Analysis System
Course ID: c_018
Track: Python for Data Science
Level: Intermediate
Project: EDA report
Witstart: false
Original Duration: 9h • 36 lessons

## Description
EDA checklist used at FAANG
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_019-data-storytelling-with-python'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Data Storytelling with Python
Course ID: c_019
Track: Python for Data Science
Level: Intermediate
Project: Jupyter story
Witstart: false
Original Duration: 7h • 28 lessons

## Description
Jupyter reports that impress
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_020-python-automation-for-analysts'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Python Automation for Analysts
Course ID: c_020
Track: Python for Data Science
Level: Intermediate
Project: Automation script
Witstart: false
Original Duration: 8h • 32 lessons

## Description
Automate Excel, emails, reports
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_021-statistics-for-data-science'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Statistics for Data Science
Course ID: c_021
Track: ML, Stats & Predictive Analytics
Level: Beginner
Project: Stats project
Witstart: false
Original Duration: 10h • 40 lessons

## Description
Stats without the boring theory
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_022-from-regression-to-random-forest'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# From Regression to Random Forest
Course ID: c_022
Track: ML, Stats & Predictive Analytics
Level: Intermediate
Project: Predictive model
Witstart: false
Original Duration: 14h • 56 lessons

## Description
Predict sales, churn, price
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_023-machine-learning-deployment'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Machine Learning Deployment
Course ID: c_023
Track: ML, Stats & Predictive Analytics
Level: Advanced
Project: Deployed model
Witstart: false
Original Duration: 12h • 48 lessons

## Description
Deploy ML models with FastAPI
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_024-time-series-forecasting'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Time Series Forecasting
Course ID: c_024
Track: ML, Stats & Predictive Analytics
Level: Advanced
Project: Forecast app
Witstart: false
Original Duration: 11h • 44 lessons

## Description
Forecast demand, stocks, traffic
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_025-a-b-testing-experimentation'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# A/B Testing & Experimentation
Course ID: c_025
Track: ML, Stats & Predictive Analytics
Level: Intermediate
Project: A/B test report
Witstart: false
Original Duration: 7h • 28 lessons

## Description
Test like product teams at Netflix
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_026-build-your-first-portfolio-with-html-css'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Build Your First Portfolio with HTML/CSS
Course ID: c_026
Track: Web Development
Level: Beginner
Project: Portfolio site
Witstart: false
Original Duration: 8h • 32 lessons

## Description
Zero to deployed portfolio that gets clients
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_027-javascript-domination-es6-to-async'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# JavaScript Domination: ES6 to Async
Course ID: c_027
Track: Web Development
Level: Beginner
Project: JS apps
Witstart: false
Original Duration: 12h • 48 lessons

## Description
JS fundamentals that don''t confuse
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_028-react-mastery-2026-hooks-performance-testing'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# React Mastery 2026: Hooks, Performance, Testing
Course ID: c_028
Track: Web Development
Level: Intermediate
Project: React app
Witstart: false
Original Duration: 16h • 64 lessons

## Description
React that scales to millions
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_029-node-js-express-api-that-scales'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Node.js & Express: API That Scales
Course ID: c_029
Track: Web Development
Level: Intermediate
Project: REST API
Witstart: false
Original Duration: 14h • 56 lessons

## Description
Backend that handles 10k req/s
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_030-fullstack-saas-dashboard-with-supabase-stripe'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Fullstack SaaS Dashboard with Supabase & Stripe
Course ID: c_030
Track: Web Development
Level: Advanced
Project: SaaS dashboard
Witstart: false
Original Duration: 20h • 80 lessons

## Description
Ship SaaS with auth, payments, charts
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_031-next-js-14-tailwind-premium-ui'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Next.js 14 & Tailwind: Premium UI
Course ID: c_031
Track: Web Development
Level: Intermediate
Project: Landing page
Witstart: false
Original Duration: 10h • 40 lessons

## Description
Build UI like Pheonix landing
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_032-python-deep-dive'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Python Deep Dive
Course ID: c_032
Track: Programming Languages Mastery
Level: Beginner
Project: Python CLI tool
Witstart: false
Original Duration: 14h • 56 lessons

## Description
From scripts to production
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_033-typescript-for-professionals'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# TypeScript for Professionals
Course ID: c_033
Track: Programming Languages Mastery
Level: Intermediate
Project: TS project
Witstart: false
Original Duration: 10h • 40 lessons

## Description
Types that prevent bugs
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_034-go-for-backend-engineers'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Go for Backend Engineers
Course ID: c_034
Track: Programming Languages Mastery
Level: Intermediate
Project: Go microservice
Witstart: false
Original Duration: 12h • 48 lessons

## Description
Go that powers your Python grading
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_035-java-spring-boot'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Java & Spring Boot
Course ID: c_035
Track: Programming Languages Mastery
Level: Intermediate
Project: Spring API
Witstart: false
Original Duration: 15h • 60 lessons

## Description
Enterprise backend
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_036-rust-for-performance'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Rust for Performance
Course ID: c_036
Track: Programming Languages Mastery
Level: Advanced
Project: Rust tool
Witstart: false
Original Duration: 16h • 64 lessons

## Description
Fast, safe systems
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_037-bash-linux-mastery'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Bash & Linux Mastery
Course ID: c_037
Track: Programming Languages Mastery
Level: Beginner
Project: Bash scripts
Witstart: false
Original Duration: 6h • 24 lessons

## Description
Automate servers like DevOps
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_038-ethical-hacking-101'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Ethical Hacking 101
Course ID: c_038
Track: Cybersecurity - Offensive
Level: Beginner
Project: Pentest report
Witstart: false
Original Duration: 12h • 48 lessons

## Description
Hack like a pro, legally
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_039-web-app-hacking-owasp-top-10'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Web App Hacking: OWASP Top 10
Course ID: c_039
Track: Cybersecurity - Offensive
Level: Intermediate
Project: Bug bounty report
Witstart: false
Original Duration: 14h • 56 lessons

## Description
Find bugs in real apps
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_040-api-hacking-break-secure'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# API Hacking: Break & Secure
Course ID: c_040
Track: Cybersecurity - Offensive
Level: Intermediate
Project: API hack demo
Witstart: false
Original Duration: 10h • 40 lessons

## Description
Hack APIs that leak data
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_041-network-pentesting'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Network Pentesting
Course ID: c_041
Track: Cybersecurity - Offensive
Level: Advanced
Project: Network report
Witstart: false
Original Duration: 16h • 64 lessons

## Description
From Nmap to privilege escalation
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_042-red-team-operations'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Red Team Operations
Course ID: c_042
Track: Cybersecurity - Offensive
Level: Advanced
Project: Red team playbook
Witstart: false
Original Duration: 18h • 72 lessons

## Description
Simulate advanced attackers
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_043-soc-analyst-bootcamp'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# SOC Analyst Bootcamp
Course ID: c_043
Track: Cybersecurity - Defensive
Level: Beginner
Project: SOC dashboard
Witstart: false
Original Duration: 12h • 48 lessons

## Description
Defend like a SOC analyst
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_044-incident-response-playbooks'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Incident Response Playbooks
Course ID: c_044
Track: Cybersecurity - Defensive
Level: Intermediate
Project: IR playbook
Witstart: false
Original Duration: 10h • 40 lessons

## Description
Respond to breaches in 15 mins
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_045-cloud-security-for-aws-azure'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Cloud Security for AWS/Azure
Course ID: c_045
Track: Cybersecurity - Defensive
Level: Intermediate
Project: Secure cloud arch
Witstart: false
Original Duration: 13h • 52 lessons

## Description
Secure cloud that auditors love
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_046-grc-compliance'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# GRC & Compliance
Course ID: c_046
Track: Cybersecurity - Defensive
Level: Intermediate
Project: Compliance docs
Witstart: false
Original Duration: 8h • 32 lessons

## Description
ISO 27001, SOC2 made simple
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_047-digital-forensics'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Digital Forensics
Course ID: c_047
Track: Cybersecurity - Defensive
Level: Advanced
Project: Forensics report
Witstart: false
Original Duration: 14h • 56 lessons

## Description
Find evidence after attack
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_048-automate-your-job-with-python-n8n'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Automate Your Job with Python & n8n
Course ID: c_048
Track: AI & Automation
Level: Beginner
Project: Automation workflow
Witstart: false
Original Duration: 8h • 32 lessons

## Description
Kill repetitive work
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_049-computer-vision-with-opencv'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Computer Vision with OpenCV
Course ID: c_049
Track: AI & Automation
Level: Intermediate
Project: CV app
Witstart: false
Original Duration: 12h • 48 lessons

## Description
Build face, object detection
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_050-nlp-from-chatbots-to-sentiment'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# NLP: From Chatbots to Sentiment
Course ID: c_050
Track: AI & Automation
Level: Intermediate
Project: Chatbot
Witstart: false
Original Duration: 13h • 52 lessons

## Description
NLP that understands humans
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_051-ai-voice-image-generation'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# AI Voice & Image Generation
Course ID: c_051
Track: AI & Automation
Level: Intermediate
Project: AI media app
Witstart: false
Original Duration: 9h • 36 lessons

## Description
Clone voices, generate images
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_052-robotic-process-automation-rpa'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Robotic Process Automation (RPA)
Course ID: c_052
Track: AI & Automation
Level: Beginner
Project: RPA bot
Witstart: false
Original Duration: 7h • 28 lessons

## Description
Bots that do your Excel
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_053-aws-cloud-practitioner'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# AWS Cloud Practitioner
Course ID: c_053
Track: Cloud, DevOps & MLOps
Level: Beginner
Project: AWS setup
Witstart: false
Original Duration: 12h • 48 lessons

## Description
AWS that gets you hired
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_054-docker-to-kubernetes'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Docker to Kubernetes
Course ID: c_054
Track: Cloud, DevOps & MLOps
Level: Intermediate
Project: K8s cluster
Witstart: false
Original Duration: 14h • 56 lessons

## Description
Containers that scale
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_055-ci-cd-that-doesn-t-break'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# CI/CD That Doesn''t Break
Course ID: c_055
Track: Cloud, DevOps & MLOps
Level: Intermediate
Project: CI/CD pipeline
Witstart: false
Original Duration: 9h • 36 lessons

## Description
GitHub Actions that deploy safely
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_056-terraform-infrastructure-as-code'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Terraform: Infrastructure as Code
Course ID: c_056
Track: Cloud, DevOps & MLOps
Level: Intermediate
Project: Terraform code
Witstart: false
Original Duration: 10h • 40 lessons

## Description
Provision cloud in code
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_057-mlops-mlflow-kubeflow'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# MLOps: MLflow & Kubeflow
Course ID: c_057
Track: Cloud, DevOps & MLOps
Level: Advanced
Project: MLOps pipeline
Witstart: false
Original Duration: 15h • 60 lessons

## Description
Deploy ML like DevOps
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_058-monitoring-with-prometheus-grafana'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Monitoring with Prometheus & Grafana
Course ID: c_058
Track: Cloud, DevOps & MLOps
Level: Intermediate
Project: Monitoring dashboard
Witstart: false
Original Duration: 8h • 32 lessons

## Description
Know when things break
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_059-build-your-first-ai-agent'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Build Your First AI Agent
Course ID: c_059
Track: Agentic AI & LLM Engineering
Level: Beginner
Project: AI agent
Witstart: false
Original Duration: 8h • 32 lessons

## Description
Agent that books meetings
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_060-prompt-engineering-mastery'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Prompt Engineering Mastery
Course ID: c_060
Track: Agentic AI & LLM Engineering
Level: Beginner
Project: Prompt library
Witstart: false
Original Duration: 6h • 24 lessons

## Description
Prompts that don''t hallucinate
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_061-rag-systems-that-work'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# RAG Systems That Work
Course ID: c_061
Track: Agentic AI & LLM Engineering
Level: Intermediate
Project: RAG app
Witstart: false
Original Duration: 12h • 48 lessons

## Description
Chat with your PDFs
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_062-langchain-langgraph'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# LangChain & LangGraph
Course ID: c_062
Track: Agentic AI & LLM Engineering
Level: Intermediate
Project: Agent chain
Witstart: false
Original Duration: 14h • 56 lessons

## Description
Chain agents that think
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_063-fine-tuning-llms'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Fine-tuning LLMs
Course ID: c_063
Track: Agentic AI & LLM Engineering
Level: Advanced
Project: Fine-tuned model
Witstart: false
Original Duration: 16h • 64 lessons

## Description
Fine-tune Llama 3
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_064-ai-agent-marketplace'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# AI Agent Marketplace
Course ID: c_064
Track: Agentic AI & LLM Engineering
Level: Advanced
Project: Agent SaaS
Witstart: false
Original Duration: 10h • 40 lessons

## Description
Monetize your agents
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_065-product-manager-for-tech'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Product Manager for Tech
Course ID: c_065
Track: Product, No-Code & Low-Code
Level: Beginner
Project: PRD doc
Witstart: false
Original Duration: 9h • 36 lessons

## Description
PRDs that engineers love
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_066-no-code-with-bubble-flutterflow'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# No-Code with Bubble & FlutterFlow
Course ID: c_066
Track: Product, No-Code & Low-Code
Level: Beginner
Project: No-code app
Witstart: false
Original Duration: 12h • 48 lessons

## Description
Ship apps without coding
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_067-low-code-with-retool'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Low-Code with Retool
Course ID: c_067
Track: Product, No-Code & Low-Code
Level: Intermediate
Project: Retool dashboard
Witstart: false
Original Duration: 7h • 28 lessons

## Description
Internal tools in hours
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_068-product-analytics-with-mixpanel'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Product Analytics with Mixpanel
Course ID: c_068
Track: Product, No-Code & Low-Code
Level: Intermediate
Project: Analytics setup
Witstart: false
Original Duration: 6h • 24 lessons

## Description
Track what users do
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_069-roadmapping-prioritization'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Roadmapping & Prioritization
Course ID: c_069
Track: Product, No-Code & Low-Code
Level: Intermediate
Project: Roadmap
Witstart: false
Original Duration: 5h • 20 lessons

## Description
Build what matters
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_070-blockchain-fundamentals'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Blockchain Fundamentals
Course ID: c_070
Track: Blockchain & Web3
Level: Beginner
Project: Blockchain explainer
Witstart: false
Original Duration: 8h • 32 lessons

## Description
How blockchain really works
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_071-smart-contracts-with-solidity'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Smart Contracts with Solidity
Course ID: c_071
Track: Blockchain & Web3
Level: Intermediate
Project: Smart contract
Witstart: false
Original Duration: 14h • 56 lessons

## Description
Deploy on Ethereum
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_072-defi-dashboard-with-web3-js'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# DeFi Dashboard with Web3.js
Course ID: c_072
Track: Blockchain & Web3
Level: Intermediate
Project: DeFi app
Witstart: false
Original Duration: 12h • 48 lessons

## Description
DeFi app that shows yields
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_073-nft-marketplace'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# NFT Marketplace
Course ID: c_073
Track: Blockchain & Web3
Level: Intermediate
Project: NFT marketplace
Witstart: false
Original Duration: 13h • 52 lessons

## Description
Build OpenSea clone
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_074-web3-security'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Web3 Security
Course ID: c_074
Track: Blockchain & Web3
Level: Advanced
Project: Audit report
Witstart: false
Original Duration: 10h • 40 lessons

## Description
Secure your contracts
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_075-data-for-sustainability'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Data for Sustainability
Course ID: c_075
Track: Green Tech & Climate Data
Level: Beginner
Project: Carbon dashboard
Witstart: false
Original Duration: 7h • 28 lessons

## Description
Track carbon with data
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_076-iot-for-green-cities'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# IoT for Green Cities
Course ID: c_076
Track: Green Tech & Climate Data
Level: Intermediate
Project: IoT prototype
Witstart: false
Original Duration: 10h • 40 lessons

## Description
Sensors that save energy
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_077-climate-modeling-with-python'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Climate Modeling with Python
Course ID: c_077
Track: Green Tech & Climate Data
Level: Intermediate
Project: Climate model
Witstart: false
Original Duration: 11h • 44 lessons

## Description
Model climate change
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_078-renewable-energy-analytics'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Renewable Energy Analytics
Course ID: c_078
Track: Green Tech & Climate Data
Level: Intermediate
Project: Energy report
Witstart: false
Original Duration: 9h • 36 lessons

## Description
Optimize solar & wind
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_079-green-blockchain'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Green Blockchain
Course ID: c_079
Track: Green Tech & Climate Data
Level: Beginner
Project: Green token
Witstart: false
Original Duration: 5h • 20 lessons

## Description
Sustainable Web3
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_080-portfolio-that-gets-clients'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Portfolio That Gets Clients
Course ID: c_080
Track: Career Accelerator
Level: Beginner
Project: Portfolio site
Witstart: false
Original Duration: 5h • 20 lessons

## Description
Portfolio that charges $5k+
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_081-linkedin-personal-branding'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# LinkedIn & Personal Branding
Course ID: c_081
Track: Career Accelerator
Level: Beginner
Project: LinkedIn overhaul
Witstart: false
Original Duration: 4h • 16 lessons

## Description
Profile that gets DMs from recruiters
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_082-technical-interview-system'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Technical Interview System
Course ID: c_082
Track: Career Accelerator
Level: Intermediate
Project: Interview prep
Witstart: false
Original Duration: 15h • 60 lessons

## Description
DSA + system design that passes FAANG
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_083-freelance-pricing-contracts'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Freelance Pricing & Contracts
Course ID: c_083
Track: Career Accelerator
Level: Beginner
Project: Pricing sheet
Witstart: false
Original Duration: 6h • 24 lessons

## Description
Charge $50/hr not $5/hr
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_084-build-in-public-tag-strategy'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Build in Public & Tag Strategy
Course ID: c_084
Track: Career Accelerator
Level: Beginner
Project: Viral post
Witstart: false
Original Duration: 3h • 12 lessons

## Description
Post projects, tag @thepheonixanalytics, get clients
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

$folder = Join-Path $base 'c_085-resume-that-beats-ats'
New-Item -ItemType Directory -Force -Path $folder | Out-Null
@'
# Resume That Beats ATS
Course ID: c_085
Track: Career Accelerator
Level: Beginner
Project: ATS resume
Witstart: false
Original Duration: 4h • 16 lessons

## Description
Resume that gets interviews
## Topics
'@ | Set-Content -Path (Join-Path $folder '00-course-outline.md') -Encoding UTF8

Write-Host "DONE: Created 97 folders" -ForegroundColor Green