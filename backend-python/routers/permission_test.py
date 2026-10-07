"""
Temporary Learnora permission-system test routes.

IMPORTANT:
This router is for development/testing only.
Remove it after the permission system has been verified.
"""

from fastapi import APIRouter, Depends

from .permissions import (
    PermissionContext,
    get_permission_context,
    permission_summary,
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
    Return the complete permission context for the
    currently authenticated account.
    """

    return {
        "success": True,
        "permission_context": permission_summary(
            context
        ),
    }
