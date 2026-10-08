from fastapi import APIRouter, Depends
from .auth import supabase
from .internal_auth import InternalStaffContext, require_internal_permission

router = APIRouter(prefix="/api/internal/content", tags=["Internal Content"])

@router.get("/courses")
def courses(staff: InternalStaffContext = Depends(require_internal_permission("courses.view"))):
    rows = supabase.table("learnora_courses").select("id,title,slug,organisation_id,ownership,status,created_at,updated_at").order("created_at", desc=True).execute()
    return {"success": True, "courses": rows.data or []}
