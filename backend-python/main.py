import os
from pathlib import Path
from dotenv import load_dotenv

# 1. LOAD ENV BEFORE ANYTHING THAT READS IT
ENV_PATH = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=True)

# 2. NOW import routers
from routers import auth, grading, progress, billing, webhooks, community, grader, admin, organisations, organisation_members, courses, course_access, course_content, internal_auth, internal_staff, internal_teams, commercial, creator, lifecycle, learning_structure, media
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from contextlib import asynccontextmanager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Supabase is managed externally via SQL, no local init_db needed
    print("Backend startup: Connected to Supabase PostgreSQL")
    yield

app = FastAPI(
    title="Learnora - Python Backend",
    version="2.0.0-secure",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Rate limiter middleware
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request, exc):
    return JSONResponse(status_code=429, content={"error": "Rate limit exceeded, try again in 15 minutes"})

# CORS Middleware (Correctly placed to handle preflight OPTIONS requests)
origins = [
    "http://localhost:3000",
    "https://thepheonixanalytics.com",
    "https://www.thepheonixanalytics.com",
    "https://learnora-me.vercel.app",
]

internal_frontend = os.getenv("INTERNAL_FRONTEND_URL", "").rstrip("/")
if internal_frontend and internal_frontend not in origins:
    origins.append(internal_frontend)

frontend = os.getenv("FRONTEND_URL", "").rstrip("/")
if frontend and frontend not in origins:
    origins.append(frontend)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-Organisation-ID",
    ],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(grading.router, prefix="/api/grading", tags=["grading"])
app.include_router(progress.router, prefix="/api/progress", tags=["progress"])
app.include_router(billing.router, prefix="/api/billing", tags=["billing"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(webhooks.router, prefix="/api/webhooks", tags=["webhooks"])
app.include_router(community.router, prefix="/api/community", tags=["community"])
app.include_router(grader.router, prefix="/api/grader", tags=["grader"])


# Learnora V1 organisation architecture
app.include_router(organisations.router)
app.include_router(organisation_members.router)
app.include_router(courses.router)
app.include_router(course_access.router)
app.include_router(course_content.router)

# Internal Learnora staff platform. Security is enforced by backend authentication + staff membership + granular permissions.
app.include_router(internal_auth.router)
app.include_router(internal_staff.router)
app.include_router(internal_teams.router)
app.include_router(commercial.router)
app.include_router(creator.router)
app.include_router(lifecycle.router)
app.include_router(learning_structure.router)
app.include_router(media.router)
@app.get("/")
def health():
    return {"status": "ok", "service": "pheonix-python-secure", "routers": ["auth", "grading", "admin", "progress","grader", "billing", "webhooks"]}

@app.get("/api/health")
def api_health():
    return {"status": "healthy", "version": "2.0.0"}