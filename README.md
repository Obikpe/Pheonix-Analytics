# The Pheonix Analytics - Full Stack (Zero Budget MVP)

## Folder Structure
/frontend - Next.js 14 landing + main website (premium dark #151618 + light #F8F9FA + fire #FF8C00 + teal #005F8C / #0077B6) - centered code hero, no card at right, no vertical line, smooth scroll, login
/backend-node - Express gateway (fast auth, Paystack/Stripe webhooks, community email alerts)
/backend-python - FastAPI (routing, grading 3-layer, video signed URLs, security: JWT HttpOnly + Argon2id + RLS)
/supabase - Postgres + Auth + Storage + migrations

## 16 Tracks, 85 Courses (generated)
- Excel & Business Analytics (5)
- Power BI, Tableau & Viz (5)
- SQL, Warehousing & Data Eng (5)
- Python for Data Science (5)
- ML, Stats & Predictive (5)
- Web Dev (6)
- Programming Languages (6)
- Cybersecurity Offensive (5)
- Cybersecurity Defensive (5)
- AI & Automation (5)
- Cloud, DevOps & MLOps (6)
- Agentic AI & LLM (6)
- Product, No-Code & Low-Code (5)
- Blockchain & Web3 (5)
- Green Tech & Climate Data (5)
- Career Accelerator (6)

Total 85 courses, ~800 lessons. One lesson_id shared across tracks. Notes + images now, videos later via admin upload (no code).

## Zero Budget Deploy
- Supabase Free 500MB DB + 1GB storage
- Vercel Free frontend
- Render Free Node + Python
- Paystack (no monthly) + Stripe test
- Resend free 100 emails/day for Q&A alerts

## Security (Defensive)
- JWT HttpOnly Secure SameSite=Strict 15min access + 7d refresh
- Argon2id hashing
- RLS on all tables
- Signed expiring video URLs 2h via Python
- Pydantic validation, Bleach XSS sanitization, SlowAPI rate limiting 60/min, CORS whitelist, security headers, audit logs

## Run
Frontend: cd frontend && npm install && npm run dev
Node: cd backend-node && npm install && npm run dev
Python: cd backend-python && pip install -r requirements.txt && uvicorn main:app --reload --port 8000

Landing: http://localhost:3000
Library: #library
Playground: #playground - runs via Python sandbox
Pricing at end: geo-pricing Nigeria ₦12k, Africa $15, Global $29, 7-day trial card auth
