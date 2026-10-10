"""Public, deliberately minimal discovery endpoints for Learnora.

Only approved creator accounts are listed. Organisations must explicitly opt
in through settings.public_directory=true; active status alone is not consent
to be discoverable.
"""
from fastapi import APIRouter, HTTPException
from urllib.parse import urlparse

from .auth import supabase

router = APIRouter(prefix="/api/public", tags=["Public discovery"])


def _is_public_course(course: dict, organisation_map: dict, creator_map: dict) -> bool:
    if course.get("status") != "published":
        return False
    settings = course.get("settings") or {}
    ownership = course.get("ownership")
    if ownership == "learnora":
        return True
    if ownership == "creator":
        creator = creator_map.get(str(course.get("creator_id")))
        return bool(creator and creator.get("status") in {"approved", "active"})
    if ownership == "organisation":
        if settings.get("public_catalogue") is not True:
            return False
        organisation = organisation_map.get(str(course.get("organisation_id")))
        org_settings = (organisation or {}).get("settings") or {}
        return bool(organisation and organisation.get("is_active") and org_settings.get("public_directory") is True)
    return False


def _public_course_payload(course: dict) -> dict:
    settings = course.get("settings") or {}
    is_free = settings.get("is_free") is True or settings.get("access_type") == "free" or settings.get("price") == 0
    return {
        "id": course.get("id"),
        "organisation_id": course.get("organisation_id"),
        "creator_id": course.get("creator_id"),
        "title": course.get("title"),
        "slug": course.get("slug"),
        "short_description": course.get("short_description"),
        "description": course.get("description"),
        "level": course.get("level"),
        "status": course.get("status"),
        "ownership": course.get("ownership"),
        "thumbnail_url": course.get("thumbnail_url"),
        "estimated_hours": course.get("estimated_hours"),
        "created_at": course.get("created_at"),
        "settings": {
            "public_catalogue": True,
            "is_free": bool(is_free),
            "access_type": "free" if is_free else "restricted",
        },
    }


def _public_course_lookup(course_id: str) -> dict:
    result = (
        supabase.table("learnora_courses")
        .select("id,organisation_id,creator_id,title,slug,short_description,description,level,status,ownership,thumbnail_url,estimated_hours,settings,created_at")
        .eq("id", course_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "Course not found.")
    course = result.data[0]
    organisation_map = {}
    creator_map = {}
    if course.get("organisation_id"):
        org_result = supabase.table("organisations").select("id,is_active,settings").eq("id", course["organisation_id"]).limit(1).execute()
        if org_result.data:
            organisation_map[str(course["organisation_id"])] = org_result.data[0]
    if course.get("creator_id"):
        creator_result = supabase.table("learnora_creator_accounts").select("id,status").eq("id", course["creator_id"]).limit(1).execute()
        if creator_result.data:
            creator_map[str(course["creator_id"])] = creator_result.data[0]
    if not _is_public_course(course, organisation_map, creator_map):
        raise HTTPException(404, "Course not found.")
    return course


@router.get("/courses")
def public_courses():
    result = (
        supabase.table("learnora_courses")
        .select("id,organisation_id,creator_id,title,slug,short_description,description,level,status,ownership,thumbnail_url,estimated_hours,settings,created_at")
        .eq("status", "published")
        .order("created_at", desc=True)
        .execute()
    )
    course_rows = result.data or []
    organisation_ids = list({str(row["organisation_id"]) for row in course_rows if row.get("organisation_id")})
    creator_ids = list({str(row["creator_id"]) for row in course_rows if row.get("creator_id")})
    organisation_map = {}
    creator_map = {}
    if organisation_ids:
        organisations = (supabase.table("organisations").select("id,is_active,settings").in_("id", organisation_ids).execute()).data or []
        organisation_map = {str(row["id"]): row for row in organisations}
    if creator_ids:
        creators = (supabase.table("learnora_creator_accounts").select("id,status").in_("id", creator_ids).execute()).data or []
        creator_map = {str(row["id"]): row for row in creators}
    visible = [_public_course_payload(row) for row in course_rows if _is_public_course(row, organisation_map, creator_map)]
    return {"success": True, "count": len(visible), "courses": visible}


@router.get("/courses/{course_id}")
def public_course(course_id: str):
    course = _public_course_lookup(course_id)
    return {"success": True, "course": _public_course_payload(course)}


@router.get("/courses/{course_id}/structure")
def public_course_structure(course_id: str):
    course = _public_course_lookup(course_id)
    modules = (
        supabase.table("course_modules")
        .select("id,course_id,title,description,order_index,status")
        .eq("course_id", course_id)
        .eq("status", "published")
        .order("order_index")
        .execute()
    ).data or []
    module_ids = [str(row["id"]) for row in modules]
    lessons = []
    if module_ids:
        lessons = (
            supabase.table("learnora_lessons")
            .select("id,module_id,title,slug,description,order_index,lesson_type,duration_minutes,is_preview,status")
            .in_("module_id", module_ids)
            .eq("status", "published")
            .order("order_index")
            .execute()
        ).data or []
    by_module = {}
    for lesson in lessons:
        by_module.setdefault(str(lesson["module_id"]), []).append(lesson)
    shaped = [{**module, "lessons": by_module.get(str(module["id"]), [])} for module in modules]
    return {"success": True, "course": _public_course_payload(course), "modules": shaped}


@router.get("/tutors")
def public_tutors():
    result = (
        supabase
        .table("learnora_creator_accounts")
        .select("id,display_name,bio,created_at,application_id")
        .eq("status", "approved")
        .order("display_name")
        .limit(100)
        .execute()
    )
    tutors = result.data or []
    application_ids = list({str(row["application_id"]) for row in tutors if row.get("application_id")})
    applications = []
    if application_ids:
        applications = (
            supabase.table("learnora_creator_applications")
            .select("id,application_data")
            .in_("id", application_ids)
            .execute()
        ).data or []
    application_map = {str(row["id"]): (row.get("application_data") or {}) for row in applications}
    public_tutors = []
    for tutor in tutors:
        application = application_map.get(str(tutor.get("application_id")), {})
        portfolio_url = str(application.get("portfolio_url") or "").strip()
        parsed = urlparse(portfolio_url) if portfolio_url else None
        if not parsed or parsed.scheme not in {"http", "https"} or not parsed.netloc:
            portfolio_url = None
        public_tutors.append({
            "id": tutor.get("id"),
            "display_name": tutor.get("display_name"),
            "bio": tutor.get("bio"),
            "expertise": str(application.get("expertise") or "").strip()[:200] or None,
            "portfolio_url": portfolio_url,
            "sample_course": str(application.get("sample_course") or "").strip()[:200] or None,
            "created_at": tutor.get("created_at"),
        })
    return {"success": True, "tutors": public_tutors}


@router.get("/organisations")
def public_organisations():
    result = (
        supabase
        .table("organisations")
        .select(
            "id,name,slug,organisation_type,description,logo_url,"
            "brand_primary,brand_secondary,template"
        )
        .eq("is_active", True)
        .contains("settings", {"public_directory": True})
        .order("name")
        .limit(100)
        .execute()
    )
    return {"success": True, "organisations": result.data or []}
