# Lesson 03 - Types of Data - Structured, Unstructured and Semi-Structured

**Course:** ws_01 | **ID:** ws_01_l03 | **Duration:** 13 min | **Level:** Beginner

## Learning Objectives
- Classify any dataset as structured, semi-structured, or unstructured.
- Explain why unstructured data is 80% of real world data in Nigeria.
- Choose the right tool for each type.

## 1. The 3 Types

<svg width="100%" height="260" viewBox="0 0 700 260" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="700" height="260" rx="16" fill="#FFFFFF"/>
  <rect x="15" y="20" width="210" height="220" rx="12" fill="#EFF6FF" stroke="#1E40AF" stroke-width="2"/>
  <text x="120" y="45" text-anchor="middle" font-family="Arial" font-size="13" font-weight="800" fill="#1E3A8A">STRUCTURED</text>
  <text x="120" y="70" text-anchor="middle" font-family="Arial" font-size="11" fill="#1E3A8A">Tables, Rows, Columns</text>
  <text x="30" y="95" font-family="Arial" font-size="11" fill="#1E3A8A">ID | Name | Price</text>
  <text x="30" y="115" font-family="Arial" font-size="11" fill="#1E3A8A">1 | Rice | 2000</text>
  <text x="30" y="135" font-family="Arial" font-size="11" fill="#1E3A8A">2 | Beans | 1500</text>
  <text x="30" y="165" font-family="Arial" font-size="10" fill="#1E3A8A">Tool: SQL, Excel, Pandas</text>
  <rect x="245" y="20" width="210" height="220" rx="12" fill="#FEF3C7" stroke="#92400E" stroke-width="2"/>
  <text x="350" y="45" text-anchor="middle" font-family="Arial" font-size="13" font-weight="800" fill="#78350F">SEMI-STRUCTURED</text>
  <text x="350" y="70" text-anchor="middle" font-family="Arial" font-size="11" fill="#78350F">Has tags, but flexible</text>
  <text x="260" y="95" font-family="Arial" font-size="10" fill="#78350F">{ "user": "Tobi",</text>
  <text x="260" y="112" font-family="Arial" font-size="10" fill="#78350F">  "orders": [ ... ] }</text>
  <text x="260" y="135" font-family="Arial" font-size="10" fill="#78350F">&lt;order&gt;&lt;id&gt;1&lt;/id&gt;&lt;/order&gt;</text>
  <text x="260" y="165" font-family="Arial" font-size="10" fill="#78350F">Tool: JSON, XML parsers</text>
  <rect x="475" y="20" width="210" height="220" rx="12" fill="#F3E8FF" stroke="#6B21A8" stroke-width="2"/>
  <text x="580" y="45" text-anchor="middle" font-family="Arial" font-size="13" font-weight="800" fill="#581C87">UNSTRUCTURED</text>
  <text x="580" y="70" text-anchor="middle" font-family="Arial" font-size="11" fill="#581C87">No table, needs AI</text>
  <text x="490" y="95" font-family="Arial" font-size="11" fill="#581C87">Image, Video, Audio,</text>
  <text x="490" y="115" font-family="Arial" font-size="11" fill="#581C87">Voice note, Chat</text>
  <text x="490" y="135" font-family="Arial" font-size="11" fill="#581C87">Instagram caption</text>
  <text x="490" y="165" font-family="Arial" font-size="10" fill="#581C87">Tool: CV, NLP, Whisper</text>
</svg>

**Structured:** Fits in table. Every row same columns. Example: Bank transactions, Jumia orders table, POS sales from Excel.

**Semi-structured:** Has structure but not rigid. Example: Paystack API response JSON, WhatsApp export, XML from NIBSS, Firebase logs. Needs parsing.

**Unstructured:** No table. Example: Customer voice note complaining in Yoruba, CCTV video in shop, product photo, Instagram comment.

## 2. Reality in Nigeria

80% of valuable data in Nigerian businesses is unstructured and ignored. The supermarket owner has CCTV but never counts foot traffic from video. The bank has call center audio but never analyzes why customers shout about USSD.

Structured is easy to analyze, but competitive advantage comes from semi and unstructured.

## 3. Checklist
- I can classify any data I see daily
- I know which tool for each type
