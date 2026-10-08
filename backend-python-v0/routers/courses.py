"""
Learnora ME — Course Management API

Course architecture:

    Learnora Course

          │

          ├── ownership = learnora
          │       └── organisation_id = NULL
          │
          └── ownership = organisation
                  └── organisation_id = owning organisation

    Course access is handled separately through:

        course_access

This means course ownership and course availability are
deliberately separate concepts.

Examples:

    Learnora-owned course

        ↓

    assigned to Witstart Academy

        ↓

    assigned to another organisation later

No course duplication is required.
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from .auth import supabase
from .permissions import (
    PermissionContext,
    require_permission,
)


router = APIRouter(
    prefix="/api/courses",
    tags=["Courses"],
)


# ============================================================
# CONSTANTS
# ============================================================

COURSE_STATUSES = {
    "draft",
    "published",
    "archived",
}

COURSE_OWNERSHIPS = {
    "learnora",
    "organisation",
}

COURSE_LEVELS = {
    "beginner",
    "intermediate",
    "advanced",
    "mixed",
}


# ============================================================
# MODELS
# ============================================================

class CreateCourse(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=200,
    )

    slug: str = Field(
        min_length=1,
        max_length=200,
    )

    short_description: Optional[str] = None
    description: Optional[str] = None

    level: Optional[str] = None

    status: str = "draft"
    ownership: str = "learnora"

    organisation_id: Optional[UUID] = None

    thumbnail_url: Optional[str] = None

    estimated_hours: Optional[float] = Field(
        default=None,
        ge=0,
    )

    settings: dict = Field(
        default_factory=dict,
    )


class UpdateCourse(BaseModel):
    title: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=200,
    )

    slug: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=200,
    )

    short_description: Optional[str] = None
    description: Optional[str] = None
    level: Optional[str] = None
    status: Optional[str] = None
    thumbnail_url: Optional[str] = None

    estimated_hours: Optional[float] = Field(
        default=None,
        ge=0,
    )

    settings: Optional[dict] = None


# ============================================================
# VALIDATION HELPERS
# ============================================================

def _normalise_slug(slug: str) -> str:
    """
    Normalise a course slug.

    We keep this intentionally simple for now rather than
    introducing a slugification dependency.
    """

    return (
        slug.strip()
        .lower()
        .replace(" ", "-")
    )


def _validate_status(status: str) -> str:
    status = status.strip().lower()

    if status not in COURSE_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid course status. "
                "Allowed values: draft, published, archived."
            ),
        )

    return status


def _validate_ownership(ownership: str) -> str:
    ownership = ownership.strip().lower()

    if ownership not in COURSE_OWNERSHIPS:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid course ownership. "
                "Allowed values: learnora, organisation."
            ),
        )

    return ownership


def _validate_level(
    level: Optional[str],
) -> Optional[str]:

    if level is None:
        return None

    level = level.strip().lower()

    if level not in COURSE_LEVELS:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid course level. "
                "Allowed values: beginner, intermediate, "
                "advanced, mixed."
            ),
        )

    return level


# ============================================================
# CREATOR HELPERS
# ============================================================

def _get_creator_uuid(
    context: PermissionContext,
) -> Optional[str]:
    """
    Return the authenticated actor's UUID when available.

    Learnora currently has two identity systems:

    1. users
       - UUID-based

    2. admins
       - legacy integer IDs

    learnora_courses.created_by is UUID-based.

    Therefore an admin account whose legacy ID is an integer
    cannot safely be written into created_by.

    Until the unified actor/audit model is introduced,
    admin-created courses leave created_by as NULL.
    """

    user_id = getattr(
        context.user,
        "id",
        None,
    )

    if user_id is None:
        return None

    try:
        return str(UUID(str(user_id)))
    except (ValueError, TypeError, AttributeError):
        return None


# ============================================================
# DATABASE HELPERS
# ============================================================

def _get_course(
    course_id: str,
):
    result = (
        supabase
        .table("learnora_courses")
        .select(
            "id,"
            "organisation_id,"
            "title,"
            "slug,"
            "short_description,"
            "description,"
            "level,"
            "status,"
            "ownership,"
            "thumbnail_url,"
            "estimated_hours,"
            "settings,"
            "created_by,"
            "created_at,"
            "updated_at"
        )
        .eq(
            "id",
            course_id,
        )
        .maybe_single()
        .execute()
    )

    return result.data


def _get_organisation(
    organisation_id: str,
):
    result = (
        supabase
        .table("organisations")
        .select(
            "id,"
            "name,"
            "slug,"
            "is_active"
        )
        .eq(
            "id",
            organisation_id,
        )
        .maybe_single()
        .execute()
    )

    organisation = result.data

    if not organisation:
        raise HTTPException(
            status_code=404,
            detail="Organisation not found.",
        )

    if not organisation.get("is_active"):
        raise HTTPException(
            status_code=400,
            detail="Organisation is inactive.",
        )

    return organisation


def _check_course_slug_available(
    slug: str,
    organisation_id: Optional[str],
    exclude_course_id: Optional[str] = None,
):
    """
    Course slugs are unique within an organisation.

    Learnora-owned courses use organisation_id = NULL.
    """

    query = (
        supabase
        .table("learnora_courses")
        .select("id")
        .eq(
            "slug",
            slug,
        )
    )

    if organisation_id is None:
        query = query.is_(
            "organisation_id",
            "null",
        )
    else:
        query = query.eq(
            "organisation_id",
            organisation_id,
        )

    result = query.execute()

    rows = result.data or []

    if exclude_course_id:
        rows = [
            row
            for row in rows
            if str(row["id"]) != str(exclude_course_id)
        ]

    if rows:
        raise HTTPException(
            status_code=409,
            detail=(
                "A course with this slug already exists "
                "in this scope."
            ),
        )


def _check_course_organisation_access(
    context: PermissionContext,
    organisation_id: Optional[str],
):
    """
    Verify that the current user can operate on the course's
    organisation.

    Platform admins can operate globally.

    Organisation users can only operate within their resolved
    organisation.
    """

    if context.is_platform_admin:
        return

    if not organisation_id:
        raise HTTPException(
            status_code=403,
            detail=(
                "This course does not belong to your "
                "organisation."
            ),
        )

    if not context.organisation_id:
        raise HTTPException(
            status_code=403,
            detail="You do not have organisation access.",
        )

    if str(context.organisation_id) != str(
        organisation_id
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "You do not have access to this "
                "course's organisation."
            ),
        )


# ============================================================
# LIST COURSES
# ============================================================

@router.get("")
def list_courses(
    organisation_id: Optional[UUID] = Query(
        default=None,
        description=(
            "Filter courses belonging to an organisation."
        ),
    ),

    status: Optional[str] = Query(
        default=None,
    ),

    ownership: Optional[str] = Query(
        default=None,
    ),

    context: PermissionContext = Depends(
        require_permission("courses.view")
    ),
):
    """
    List courses visible to the current user.

    Platform admins:
        Can view all courses.

    Organisation users:
        Can view their organisation's courses.

    Learnora-owned courses:
        Are visible to platform admins and can later be
        exposed through catalogue/access rules.
    """

    query = (
        supabase
        .table("learnora_courses")
        .select(
            "id,"
            "organisation_id,"
            "title,"
            "slug,"
            "short_description,"
            "description,"
            "level,"
            "status,"
            "ownership,"
            "thumbnail_url,"
            "estimated_hours,"
            "settings,"
            "created_by,"
            "created_at,"
            "updated_at"
        )
        .order(
            "created_at",
            desc=True,
        )
    )

    # --------------------------------------------------------
    # Organisation scope
    # --------------------------------------------------------

    if not context.is_platform_admin:

        if not context.organisation_id:
            raise HTTPException(
                status_code=403,
                detail=(
                    "You do not have access to an "
                    "organisation."
                ),
            )

        query = query.eq(
            "organisation_id",
            str(context.organisation_id),
        )

    elif organisation_id is not None:

        _get_organisation(
            str(organisation_id)
        )

        query = query.eq(
            "organisation_id",
            str(organisation_id),
        )

    # --------------------------------------------------------
    # Filters
    # --------------------------------------------------------

    if status is not None:
        status = _validate_status(status)

        query = query.eq(
            "status",
            status,
        )

    if ownership is not None:
        ownership = _validate_ownership(
            ownership
        )

        query = query.eq(
            "ownership",
            ownership,
        )

    result = query.execute()

    courses = result.data or []

    return {
        "success": True,
        "count": len(courses),
        "courses": courses,
    }


# ============================================================
# GET COURSE
# ============================================================

@router.get("/{course_id}")
def get_course(
    course_id: UUID,

    context: PermissionContext = Depends(
        require_permission("courses.view")
    ),
):
    """
    Retrieve a single course.
    """

    course = _get_course(
        str(course_id)
    )

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found.",
        )

    _check_course_organisation_access(
        context,
        course.get("organisation_id"),
    )

    return {
        "success": True,
        "course": course,
    }


# ============================================================
# CREATE COURSE
# ============================================================

@router.post("")
def create_course(
    payload: CreateCourse,

    context: PermissionContext = Depends(
        require_permission("courses.create")
    ),
):
    """
    Create a new course.

    Learnora-owned:
        organisation_id must be NULL.

    Organisation-owned:
        organisation_id must identify an organisation
        the caller is allowed to manage.
    """

    ownership = _validate_ownership(
        payload.ownership
    )

    status = _validate_status(
        payload.status
    )

    level = _validate_level(
        payload.level
    )

    slug = _normalise_slug(
        payload.slug
    )

    if not slug:
        raise HTTPException(
            status_code=400,
            detail="Course slug cannot be empty.",
        )

    organisation_id = (
        str(payload.organisation_id)
        if payload.organisation_id
        else None
    )

    # --------------------------------------------------------
    # Ownership rules
    # --------------------------------------------------------

    if ownership == "learnora":

        if organisation_id is not None:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Learnora-owned courses cannot have "
                    "an organisation_id."
                ),
            )

    elif ownership == "organisation":

        if organisation_id is None:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Organisation-owned courses must "
                    "specify an organisation_id."
                ),
            )

        _get_organisation(
            organisation_id
        )

        _check_course_organisation_access(
            context,
            organisation_id,
        )

    # --------------------------------------------------------
    # Slug
    # --------------------------------------------------------

    _check_course_slug_available(
        slug=slug,
        organisation_id=organisation_id,
    )

    # --------------------------------------------------------
    # Creator
    # --------------------------------------------------------

    creator_uuid = _get_creator_uuid(
        context
    )

    # --------------------------------------------------------
    # Create
    # --------------------------------------------------------

    insert_data = {
        "organisation_id": organisation_id,
        "title": payload.title.strip(),
        "slug": slug,
        "short_description": payload.short_description,
        "description": payload.description,
        "level": level,
        "status": status,
        "ownership": ownership,
        "thumbnail_url": payload.thumbnail_url,
        "estimated_hours": payload.estimated_hours,
        "settings": payload.settings,
        "created_by": creator_uuid,
    }

    try:

        result = (
            supabase
            .table("learnora_courses")
            .insert(insert_data)
            .execute()
        )

    except Exception as exc:

        # Return the actual database failure instead of allowing
        # it to surface as a misleading browser CORS error.

        raise HTTPException(
            status_code=400,
            detail=f"Course creation failed: {str(exc)}",
        )

    course = (
        result.data[0]
        if result.data
        else None
    )

    if not course:
        raise HTTPException(
            status_code=500,
            detail="Failed to create course.",
        )

    return {
        "success": True,
        "message": "Course created successfully.",
        "course": course,
    }


# ============================================================
# UPDATE COURSE
# ============================================================

@router.patch("/{course_id}")
def update_course(
    course_id: UUID,

    payload: UpdateCourse,

    context: PermissionContext = Depends(
        require_permission("courses.update")
    ),
):
    """
    Update course metadata.
    """

    course = _get_course(
        str(course_id)
    )

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found.",
        )

    _check_course_organisation_access(
        context,
        course.get("organisation_id"),
    )

    updates = {}

    if payload.title is not None:
        updates["title"] = payload.title.strip()

    if payload.slug is not None:

        slug = _normalise_slug(
            payload.slug
        )

        if not slug:
            raise HTTPException(
                status_code=400,
                detail="Course slug cannot be empty.",
            )

        _check_course_slug_available(
            slug=slug,
            organisation_id=course.get(
                "organisation_id"
            ),
            exclude_course_id=str(course_id),
        )

        updates["slug"] = slug

    if payload.short_description is not None:
        updates["short_description"] = (
            payload.short_description
        )

    if payload.description is not None:
        updates["description"] = (
            payload.description
        )

    if payload.level is not None:
        updates["level"] = _validate_level(
            payload.level
        )

    if payload.status is not None:
        updates["status"] = _validate_status(
            payload.status
        )

    if payload.thumbnail_url is not None:
        updates["thumbnail_url"] = (
            payload.thumbnail_url
        )

    if payload.estimated_hours is not None:
        updates["estimated_hours"] = (
            payload.estimated_hours
        )

    if payload.settings is not None:
        updates["settings"] = (
            payload.settings
        )

    if not updates:
        raise HTTPException(
            status_code=400,
            detail="No course changes were supplied.",
        )

    try:

        result = (
            supabase
            .table("learnora_courses")
            .update(updates)
            .eq(
                "id",
                str(course_id),
            )
            .execute()
        )

    except Exception as exc:

        raise HTTPException(
            status_code=400,
            detail=f"Course update failed: {str(exc)}",
        )

    updated_course = (
        result.data[0]
        if result.data
        else None
    )

    if not updated_course:
        raise HTTPException(
            status_code=500,
            detail="Failed to update course.",
        )

    return {
        "success": True,
        "message": "Course updated successfully.",
        "course": updated_course,
    }


# ============================================================
# PUBLISH COURSE
# ============================================================

@router.post("/{course_id}/publish")
def publish_course(
    course_id: UUID,

    context: PermissionContext = Depends(
        require_permission("courses.publish")
    ),
):
    """
    Publish a course.

    Publishing is deliberately a separate permission from
    editing the course.
    """

    course = _get_course(
        str(course_id)
    )

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found.",
        )

    _check_course_organisation_access(
        context,
        course.get("organisation_id"),
    )

    if course.get("status") == "published":
        return {
            "success": True,
            "message": "Course is already published.",
            "course": course,
        }

    try:

        result = (
            supabase
            .table("learnora_courses")
            .update(
                {
                    "status": "published",
                }
            )
            .eq(
                "id",
                str(course_id),
            )
            .execute()
        )

    except Exception as exc:

        raise HTTPException(
            status_code=400,
            detail=f"Course publishing failed: {str(exc)}",
        )

    updated_course = (
        result.data[0]
        if result.data
        else None
    )

    if not updated_course:
        raise HTTPException(
            status_code=500,
            detail="Failed to publish course.",
        )

    return {
        "success": True,
        "message": "Course published successfully.",
        "course": updated_course,
    }


# ============================================================
# ARCHIVE COURSE
# ============================================================

@router.post("/{course_id}/archive")
def archive_course(
    course_id: UUID,

    context: PermissionContext = Depends(
        require_permission("courses.update")
    ),
):
    """
    Archive a course without deleting it.
    """

    course = _get_course(
        str(course_id)
    )

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found.",
        )

    _check_course_organisation_access(
        context,
        course.get("organisation_id"),
    )

    try:

        result = (
            supabase
            .table("learnora_courses")
            .update(
                {
                    "status": "archived",
                }
            )
            .eq(
                "id",
                str(course_id),
            )
            .execute()
        )

    except Exception as exc:

        raise HTTPException(
            status_code=400,
            detail=f"Course archiving failed: {str(exc)}",
        )

    updated_course = (
        result.data[0]
        if result.data
        else None
    )

    if not updated_course:
        raise HTTPException(
            status_code=500,
            detail="Failed to archive course.",
        )

    return {
        "success": True,
        "message": "Course archived successfully.",
        "course": updated_course,
    }


# ============================================================
# DELETE COURSE
# ============================================================

@router.delete("/{course_id}")
def delete_course(
    course_id: UUID,

    context: PermissionContext = Depends(
        require_permission("courses.delete")
    ),
):
    """
    Delete a course.

    This is intentionally protected by the separate
    courses.delete permission.

    Before deleting, we verify the course exists and that the
    caller can manage its organisation.
    """

    course = _get_course(
        str(course_id)
    )

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found.",
        )

    _check_course_organisation_access(
        context,
        course.get("organisation_id"),
    )

    try:

        result = (
            supabase
            .table("learnora_courses")
            .delete()
            .eq(
                "id",
                str(course_id),
            )
            .execute()
        )

    except Exception as exc:

        raise HTTPException(
            status_code=400,
            detail=f"Course deletion failed: {str(exc)}",
        )

    deleted = result.data or []

    if not deleted:
        raise HTTPException(
            status_code=500,
            detail="Failed to delete course.",
        )

    return {
        "success": True,
        "message": "Course deleted successfully.",
        "course_id": str(course_id),
    }