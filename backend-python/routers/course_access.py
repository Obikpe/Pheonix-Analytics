"""
Learnora ME — Course Access API

Course ownership and course access are separate concepts.

Example:

    Learnora-owned course
            │
            ├── Witstart Academy
            ├── Organisation B
            └── Organisation C

Each organisation receives a course_access record.

This router manages those access relationships.
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .auth import supabase
from .permissions import (
    PermissionContext,
    require_permission,
)


router = APIRouter(
    prefix="/api/course-access",
    tags=["Course Access"],
)


# ============================================================
# CONSTANTS
# ============================================================

ACCESS_TYPES = {
    "assigned",
    "catalogue",
    "private",
}

ACCESS_STATUSES = {
    "active",
    "inactive",
}


# ============================================================
# MODELS
# ============================================================

class CreateCourseAccess(BaseModel):
    course_id: UUID
    organisation_id: UUID
    access_type: str = Field(
        default="assigned"
    )


class UpdateCourseAccess(BaseModel):
    access_type: Optional[str] = None
    status: Optional[str] = None


# ============================================================
# VALIDATION
# ============================================================

def _validate_access_type(
    access_type: str,
) -> str:
    access_type = access_type.strip().lower()

    if access_type not in ACCESS_TYPES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid access type. "
                "Allowed values: assigned, catalogue, private."
            ),
        )

    return access_type


def _validate_status(
    status: str,
) -> str:
    status = status.strip().lower()

    if status not in ACCESS_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid access status. "
                "Allowed values: active, inactive."
            ),
        )

    return status


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
            "status,"
            "ownership"
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
            "organisation_type,"
            "is_active"
        )
        .eq(
            "id",
            organisation_id,
        )
        .maybe_single()
        .execute()
    )

    return result.data


def _get_access_record(
    access_id: str,
):
    result = (
        supabase
        .table("course_access")
        .select(
            "id,"
            "course_id,"
            "organisation_id,"
            "access_type,"
            "status,"
            "assigned_by,"
            "assigned_at"
        )
        .eq(
            "id",
            access_id,
        )
        .maybe_single()
        .execute()
    )

    return result.data


def _check_organisation_access(
    context: PermissionContext,
    organisation_id: str,
):
    """
    Platform admins can manage any organisation.

    Organisation users can only operate within their own
    resolved organisation.
    """

    if context.is_platform_admin:
        return

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
                "organisation."
            ),
        )


# ============================================================
# LIST COURSE ACCESS
# ============================================================

@router.get("")
def list_course_access(
    course_id: Optional[UUID] = None,
    organisation_id: Optional[UUID] = None,
    status: Optional[str] = None,
    context: PermissionContext = Depends(
        require_permission("courses.view")
    ),
):
    """
    List course-access relationships.

    Platform admins:
        Can inspect access across the platform.

    Organisation users:
        Can only inspect access belonging to their
        organisation.
    """

    query = (
        supabase
        .table("course_access")
        .select(
            "id,"
            "course_id,"
            "organisation_id,"
            "access_type,"
            "status,"
            "assigned_by,"
            "assigned_at"
        )
        .order(
            "assigned_at",
            desc=True,
        )
    )

    if context.is_platform_admin:
        if course_id is not None:
            query = query.eq(
                "course_id",
                str(course_id),
            )

        if organisation_id is not None:
            query = query.eq(
                "organisation_id",
                str(organisation_id),
            )

    else:
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

        if course_id is not None:
            query = query.eq(
                "course_id",
                str(course_id),
            )

    if status is not None:
        status = _validate_status(status)

        query = query.eq(
            "status",
            status,
        )

    result = query.execute()
    records = result.data or []

    return {
        "success": True,
        "count": len(records),
        "access": records,
    }


# ============================================================
# GET SINGLE ACCESS RECORD
# ============================================================

@router.get("/{access_id}")
def get_course_access(
    access_id: UUID,
    context: PermissionContext = Depends(
        require_permission("courses.view")
    ),
):
    record = _get_access_record(
        str(access_id)
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Course access record not found.",
        )

    _check_organisation_access(
        context,
        record["organisation_id"],
    )

    return {
        "success": True,
        "access": record,
    }


# ============================================================
# ASSIGN COURSE
# ============================================================

@router.post("")
def assign_course(
    payload: CreateCourseAccess,
    context: PermissionContext = Depends(
        require_permission("courses.assign")
    ),
):
    """
    Assign a course to an organisation.

    This does not change course ownership.
    """

    try:
        # --------------------------------------------------------
        # Normalise input
        # --------------------------------------------------------

        course_id = str(payload.course_id)

        organisation_id = str(
            payload.organisation_id
        )

        access_type = _validate_access_type(
            payload.access_type
        )

        # --------------------------------------------------------
        # Verify course
        # --------------------------------------------------------

        course = _get_course(
            course_id
        )

        if not course:
            raise HTTPException(
                status_code=404,
                detail="Course not found.",
            )

        # --------------------------------------------------------
        # Verify organisation
        # --------------------------------------------------------

        organisation = _get_organisation(
            organisation_id
        )

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

        # --------------------------------------------------------
        # Verify organisation access
        # --------------------------------------------------------

        _check_organisation_access(
            context,
            organisation_id,
        )

        # --------------------------------------------------------
        # Ownership protection
        # --------------------------------------------------------

        if (
            course.get("ownership") == "organisation"
            and str(course.get("organisation_id"))
            != organisation_id
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "An organisation-owned course cannot "
                    "be assigned to another organisation."
                ),
            )

        # --------------------------------------------------------
        # Check existing access
        #
        # We intentionally use a normal list query rather
        # than maybe_single().
        #
        # The database already has a unique constraint on:
        # (course_id, organisation_id)
        # --------------------------------------------------------

        try:
            existing_result = (
                supabase
                .table("course_access")
                .select(
                    "id,"
                    "course_id,"
                    "organisation_id,"
                    "access_type,"
                    "status,"
                    "assigned_by,"
                    "assigned_at"
                )
                .eq(
                    "course_id",
                    course_id,
                )
                .eq(
                    "organisation_id",
                    organisation_id,
                )
                .limit(1)
                .execute()
            )

            existing_records = (
                existing_result.data or []
            )

            existing = (
                existing_records[0]
                if existing_records
                else None
            )

        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=(
                    "Failed while checking existing "
                    "course access: "
                    f"{str(exc)}"
                ),
            )

        # --------------------------------------------------------
        # Existing access
        # --------------------------------------------------------

        if existing:

            # Already active
            if existing.get("status") == "active":
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "This course is already assigned "
                        "to this organisation."
                    ),
                )

            # ----------------------------------------------------
            # Reactivate previously inactive access
            # ----------------------------------------------------

            try:
                result = (
                    supabase
                    .table("course_access")
                    .update(
                        {
                            "access_type": access_type,
                            "status": "active",
                            "assigned_by": None,
                        }
                    )
                    .eq(
                        "id",
                        existing["id"],
                    )
                    .execute()
                )

            except Exception as exc:
                raise HTTPException(
                    status_code=500,
                    detail=(
                        "Course access reactivation failed: "
                        f"{str(exc)}"
                    ),
                )

            record = (
                result.data[0]
                if result.data
                else None
            )

            if not record:
                raise HTTPException(
                    status_code=500,
                    detail=(
                        "Course access reactivation "
                        "returned no record."
                    ),
                )

            return {
                "success": True,
                "message": (
                    "Course access reactivated successfully."
                ),
                "access": record,
            }

        # --------------------------------------------------------
        # Create new access record
        # --------------------------------------------------------

        insert_data = {
            "course_id": course_id,
            "organisation_id": organisation_id,
            "access_type": access_type,
            "status": "active",
        }

        try:
            result = (
                supabase
                .table("course_access")
                .insert(insert_data)
                .execute()
            )

        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=(
                    "Course assignment insert failed: "
                    f"{str(exc)}"
                ),
            )

        record = (
            result.data[0]
            if result.data
            else None
        )

        if not record:
            raise HTTPException(
                status_code=500,
                detail=(
                    "Course assignment insert succeeded "
                    "but returned no record."
                ),
            )

        return {
            "success": True,
            "message": "Course assigned successfully.",
            "access": record,
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Unexpected error while assigning course: "
                f"{str(exc)}"
            ),
        )


# ============================================================
# UPDATE COURSE ACCESS
# ============================================================

@router.patch("/{access_id}")
def update_course_access(
    access_id: UUID,
    payload: UpdateCourseAccess,
    context: PermissionContext = Depends(
        require_permission("courses.assign")
    ),
):
    """
    Update course access.

    Used for changing access type or activating/deactivating
    an existing relationship.
    """

    record = _get_access_record(
        str(access_id)
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Course access record not found.",
        )

    _check_organisation_access(
        context,
        record["organisation_id"],
    )

    updates = {}

    if payload.access_type is not None:
        updates["access_type"] = (
            _validate_access_type(
                payload.access_type
            )
        )

    if payload.status is not None:
        updates["status"] = (
            _validate_status(
                payload.status
            )
        )

    if not updates:
        raise HTTPException(
            status_code=400,
            detail="No course access changes were supplied.",
        )

    try:
        result = (
            supabase
            .table("course_access")
            .update(updates)
            .eq(
                "id",
                str(access_id),
            )
            .execute()
        )

    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Course access update failed: {str(exc)}"
            ),
        )

    updated = (
        result.data[0]
        if result.data
        else None
    )

    if not updated:
        raise HTTPException(
            status_code=500,
            detail="Failed to update course access.",
        )

    return {
        "success": True,
        "message": "Course access updated successfully.",
        "access": updated,
    }


# ============================================================
# REVOKE COURSE ACCESS
# ============================================================

@router.delete("/{access_id}")
def revoke_course_access(
    access_id: UUID,
    context: PermissionContext = Depends(
        require_permission("courses.assign")
    ),
):
    """
    Revoke access without deleting the historical record.

    This deliberately performs a soft revoke by setting
    status = inactive.
    """

    record = _get_access_record(
        str(access_id)
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Course access record not found.",
        )

    _check_organisation_access(
        context,
        record["organisation_id"],
    )

    if record.get("status") == "inactive":
        return {
            "success": True,
            "message": "Course access is already inactive.",
            "access": record,
        }

    try:
        result = (
            supabase
            .table("course_access")
            .update(
                {
                    "status": "inactive",
                }
            )
            .eq(
                "id",
                str(access_id),
            )
            .execute()
        )

    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Course access revocation failed: "
                f"{str(exc)}"
            ),
        )

    updated = (
        result.data[0]
        if result.data
        else None
    )

    if not updated:
        raise HTTPException(
            status_code=500,
            detail="Failed to revoke course access.",
        )

    return {
        "success": True,
        "message": "Course access revoked successfully.",
        "access": updated,
    }
