"""
Temporary Learnora permission-system test routes.

IMPORTANT:
These routes are for development/testing only.
Remove this router after permission enforcement
has been verified.
"""

from fastapi import APIRouter, Depends

from .permissions import (
    PermissionContext,
    get_permission_context,
    permission_summary,
    require_permission,
)

router = APIRouter(
    prefix="/permission-test",
    tags=["Permission Test"],
)


@router.get("/me")
def test_my_permissions(
    context: PermissionContext = Depends(
        get_permission_context
    ),
):
    """
    Return the complete permission context
    for the currently authenticated account.
    """

    return {
        "success": True,
        "permission_context": permission_summary(
            context
        ),
    }


@router.get("/courses-create")
def test_courses_create(
    context: PermissionContext = Depends(
        require_permission("courses.create")
    ),
):
    """
    Test courses.create permission.
    """

    return {
        "success": True,
        "message": "courses.create permission granted.",
        "permission": "courses.create",
        "user_id": str(context.user.id),
        "account_type": context.user.account_type,
        "organisation_id": context.organisation_id,
        "organisation_role": context.organisation_role,
    }


@router.get("/courses-delete")
def test_courses_delete(
    context: PermissionContext = Depends(
        require_permission("courses.delete")
    ),
):
    """
    Test courses.delete permission.
    """

    return {
        "success": True,
        "message": "courses.delete permission granted.",
        "permission": "courses.delete",
        "user_id": str(context.user.id),
        "account_type": context.user.account_type,
        "organisation_id": context.organisation_id,
        "organisation_role": context.organisation_role,
    }