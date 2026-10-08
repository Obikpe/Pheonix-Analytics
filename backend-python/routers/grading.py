"""Safe Learnora code analysis.

The previous implementation executed learner-supplied Python directly inside
the Vercel function. That is not an acceptable isolation boundary for
untrusted code. This API now performs static analysis only.

A real execution grader can later be connected to an isolated sandbox
(Vercel Sandbox or another dedicated execution service) without exposing the
web application process to arbitrary code.
"""

import ast
import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .auth import CurrentUser, require_active

router = APIRouter()


class GradeRequest(BaseModel):
    language: str = Field(default="python", max_length=30)
    code: str = Field(..., min_length=1, max_length=20000)
    stdin: str = Field(default="", max_length=5000)
    course_id: str = Field(default="", max_length=100)


DANGEROUS_NAMES = {
    "eval",
    "exec",
    "compile",
    "__import__",
    "breakpoint",
}

DANGEROUS_MODULES = {
    "os",
    "subprocess",
    "shutil",
    "socket",
    "ctypes",
    "multiprocessing",
}


def _analyse_python(code: str):
    try:
        tree = ast.parse(code)
    except SyntaxError as exc:
        return {
            "valid": False,
            "output": (
                f"Syntax error on line {exc.lineno or '?'}: "
                f"{exc.msg}"
            ),
            "warnings": [],
            "calls": [],
            "imports": [],
        }

    warnings = []
    calls = set()
    imports = set()

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                imports.add(alias.name)
                root = alias.name.split(".")[0]
                if root in DANGEROUS_MODULES:
                    warnings.append(
                        f"Restricted module import detected: {alias.name}"
                    )

        elif isinstance(node, ast.ImportFrom):
            module = node.module or ""
            imports.add(module)
            root = module.split(".")[0]
            if root in DANGEROUS_MODULES:
                warnings.append(
                    f"Restricted module import detected: {module}"
                )

        elif isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name):
                calls.add(node.func.id)
                if node.func.id in DANGEROUS_NAMES:
                    warnings.append(
                        f"Restricted function detected: {node.func.id}()"
                    )
            elif isinstance(node.func, ast.Attribute):
                calls.add(node.func.attr)

    warnings = sorted(set(warnings))
    calls = sorted(calls)
    imports = sorted(imports)

    output = "Static analysis passed."
    if warnings:
        output = (
            "Static analysis completed with restricted constructs. "
            "The code was not executed."
        )

    return {
        "valid": True,
        "output": output,
        "warnings": warnings,
        "calls": calls,
        "imports": imports,
    }


@router.post("/grade")
def grade_code(
    payload: GradeRequest,
    user: CurrentUser = Depends(require_active),
):
    language = payload.language.strip().lower()

    if language not in {"python", "py"}:
        raise HTTPException(
            status_code=400,
            detail=(
                "This grading endpoint currently supports Python static "
                "analysis only. It does not execute untrusted code."
            ),
        )

    result = _analyse_python(payload.code)

    # Preserve a compact output field for existing clients while returning
    # structured analysis for the future grading UI.
    return {
        "success": True,
        "executed": False,
        "course_id": payload.course_id or None,
        **result,
    }


@router.get("/health")
def grading_health():
    return {
        "status": "grading analysis ready",
        "executed": False,
        "interactive": False,
        "reason": (
            "Untrusted learner code is not executed inside the API process."
        ),
    }
