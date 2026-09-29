# Lesson 08 - Tools Landscape - No Tool Worship

**Course:** ws_01 | **ID:** ws_01_l08 | **Duration:** 15 min

## Learning Objectives
- Choose tools based on problem, not hype
- Name right tool for each stage

## 1. No Tool Worship

<svg width="100%" height="180" viewBox="0 0 700 180" xmlns="http://www.w3.org/2000/svg" role="img">
  <rect x="0" y="0" width="700" height="180" rx="16" fill="#FFFFFF"/>
  <rect x="20" y="20" width="200" height="140" rx="12" fill="#FEE2E2" stroke="#991B1B" stroke-width="2"/>
  <text x="120" y="50" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#7F1D1D">TOOL WORSHIP</text>
  <text x="120" y="75" text-anchor="middle" font-family="Arial" font-size="10" fill="#7F1D1D">• "We must use AI"</text>
  <text x="120" y="92" text-anchor="middle" font-family="Arial" font-size="10" fill="#7F1D1D">• Learn 10 tools shallow</text>
  <text x="120" y="109" text-anchor="middle" font-family="Arial" font-size="10" fill="#7F1D1D">• Dashboard nobody opens</text>
  <rect x="250" y="20" width="200" height="140" rx="12" fill="#EFF6FF" stroke="#1E40AF" stroke-width="1.5"/>
  <text x="350" y="50" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#1E3A8A">PROBLEM FIRST</text>
  <text x="350" y="75" text-anchor="middle" font-family="Arial" font-size="10" fill="#1E3A8A">• What decision?</text>
  <text x="350" y="92" text-anchor="middle" font-family="Arial" font-size="10" fill="#1E3A8A">• What data available?</text>
  <text x="350" y="109" text-anchor="middle" font-family="Arial" font-size="10" fill="#1E3A8A">• What can team maintain?</text>
  <rect x="480" y="20" width="200" height="140" rx="12" fill="#D1FAE5" stroke="#065F46" stroke-width="2"/>
  <text x="580" y="50" text-anchor="middle" font-family="Arial" font-size="11" font-weight="800" fill="#064E3B">IMPACT</text>
  <text x="580" y="75" text-anchor="middle" font-family="Arial" font-size="10" fill="#064E3B">• Ships tomorrow</text>
  <text x="580" y="92" text-anchor="middle" font-family="Arial" font-size="10" fill="#064E3B">• MD opens in WhatsApp</text>
  <text x="580" y="109" text-anchor="middle" font-family="Arial" font-size="10" fill="#064E3B">• Saves Naira / Time</text>
</svg>

Beginners argue Python vs R. Professionals ask: What decision must be made? What data do we have? What can team maintain? What does stakeholder already use?

Excel can be data science if it changes decision worth N1M. Complex ML model nobody uses is not data science.

## 2. Landscape by Stage

**Ask / Plan (L05, L06):** Pen, paper, Notion, Miro for MECE tree and hypothesis.

**Get Data:** SQL, Excel, Google Sheets, APIs. In Nigeria SMEs, 80% lives in Excel and POS exports.

**Clean / Transform:** SQL is king. Excel Power Query. Python pandas. dbt for analytics engineering.

**Analyze / Visualize:** Power BI, Tableau, Excel Pivot, Python matplotlib. Use what stakeholder already opens. MD who lives in WhatsApp needs screenshot, not Tableau link requiring VPN.

**Model (when needed):** Python scikit-learn. Not needed for first 6 months of most analyst roles.

**Ship:** Power BI Service, Streamlit, Excel file, PDF report. If it does not reach decision maker, useless.

## 3. How to Choose

1. Can it be solved with SQL + bar chart? Do that. Don't build ML.
2. Does team know only Excel? Ship Excel, not Jupyter.
3. Is data <100k rows? Excel/SQL enough. No need Spark.
4. Need daily auto-refresh? Then Power BI dataset or dbt pipeline.
5. Need real-time 200ms? Then API + ML Engineer.

## 4. Anti-Patterns in Nigeria
- Building dashboard in Tableau Public that client cannot refresh.
- Learning 5 tools shallow. Better learn SQL deep, Excel deep, one viz deep for 3 months.
- Spending 2 weeks on model 0.82 accuracy when simple rule gives 0.80 and ships in 1 hour.

Checklist: I can map tool to lifecycle stage and justify why Excel can be right tool.