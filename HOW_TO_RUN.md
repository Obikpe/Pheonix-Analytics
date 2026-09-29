# The Pheonix Analytics - How to Run (Frontend + Backend)

## What you need installed
- Node.js 18+ (https://nodejs.org)
- Python 3.11+ (https://python.org)
- Git

Check:
```
node -v
python --version  # or python3 --version
pip --version
```

## 1. Setup (one time)

```bash
# Unzip
unzip the-pheonix-analytics-SECURE.zip
cd the-pheonix-analytics

# Copy env
cp .env.example .env
# Edit .env and put your Supabase keys (get from supabase.com dashboard)
# For quick local test you can leave Paystack keys as sk_test_xxx

# Install ALL packages
npm install
cd frontend && npm install && cd ..
cd backend-node && npm install && cd ..
pip install -r requirements.txt
# or pip3 install -r requirements.txt
```

## 2. Run for Test (you need BOTH frontend and backend running)

You need 3 terminals (or use npm run dev which runs all together):

### Terminal 1 - Frontend (Next.js) :3000
```bash
cd frontend
npm run dev
# Open http://localhost:3000
# Landing: centered code hero, no card, no vertical line, smooth scroll
# Library: 16 tracks, 85 courses
# Pricing at end
# Admin: http://localhost:3000/admin
```

### Terminal 2 - Node Gateway :4000
```bash
cd backend-node
npm run dev
# Runs Express secure gateway - handles webhooks, Q&A email alerts
# Test: http://localhost:4000/ -> {status: Node Gateway secure alive}
```

### Terminal 3 - Python Backend :8000 (FastAPI - main security gatekeeper)
```bash
cd backend-python
uvicorn main:app --reload --port 8000
# Test: http://localhost:8000/ -> secure v2
# Docs: http://localhost:8000/docs (Swagger with auth)
# Video stream: GET /api/videos/{uuid}/stream with Authorization: Bearer <JWT> header - returns signed URL 2h + watermark
# Grading: POST /api/grading/grade with {language, code} - sandboxed
```

### OR One command runs all 3:
```bash
# From root
npm run dev
# This uses concurrently to run frontend :3000 + node :4000 + python :8000 together
```

## 3. Supabase Setup (for real videos)

1. Create project at supabase.com (free)
2. SQL Editor -> paste content of supabase/migrations/001_initial.sql and run
3. Copy URL, anon key, service_role key into .env
4. Storage -> Create bucket 'videos' private (SQL already does it)

## 4. Testing Checklist

- [ ] http://localhost:3000 loads dark landing #151618 with glowing #FF8C00 logo centered (not side card)
- [ ] No vertical line in header (logo transparent + 12px gap)
- [ ] Scroll is smooth regular (no zoom jacking)
- [ ] Library shows 85 courses, filter by 16 tracks works
- [ ] http://localhost:3000/admin -> Video Manager, Private Accounts, Revenue, Q&A Inbox
- [ ] http://localhost:8000/docs -> try /api/videos/{uuid}/stream without token -> should 401
- [ ] http://localhost:4000/api/webhooks/paystack without signature -> 401 (secure)

## 5. Deploy Zero Budget (when ready)

- Frontend -> Vercel (import frontend folder, set NEXT_PUBLIC_* env)
- Node Gateway -> Render free (root: backend-node, start: node index.js)
- Python Backend -> Render free (root: backend-python, start: uvicorn main:app --host 0.0.0.0 --port $PORT)
- Supabase -> already hosted

## Security Notes (fixed)

- RLS locked: lessons only for enrolled + trial active + private bypass
- Paystack webhook verifies HMAC SHA512 signature
- Python CORS strict whitelist, helmet headers
- Grading sandboxed: --network none --memory 128m --pids-limit 64 --read-only --timeout 5s
- JWT HttpOnly Secure SameSite Strict, Argon2id hashing
- Body limit 10kb prevents DoS
- All inputs validated with Pydantic / express-validator + bleach escape

Questions? Open an issue or email admin.
