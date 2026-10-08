import os, httpx
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException
from routers.auth import require_active, CurrentUser

router = APIRouter()

class Question(BaseModel):
    lesson: str = Field(min_length=1, max_length=200)
    question: str = Field(min_length=3, max_length=2000)

@router.post("/question")
async def community_question(body: Question, user: CurrentUser = Depends(require_active)):
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {os.getenv('RESEND_API_KEY', '')}"},
            json={
                "from": os.getenv("EMAIL_FROM"),
                "to": [os.getenv("ADMIN_NOTIFY_EMAIL")],
                "subject": f"New question in {body.lesson}",
                "text": f"From: {user.email}\n\n{body.question}",  # plain text, no HTML injection
            },
        )
    if r.status_code >= 300:
        raise HTTPException(502, "Could not send your question. Try again later.")
    return {"ok": True}