import ast
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from .auth import require_active, CurrentUser

router = APIRouter()

class GradeRequest(BaseModel):
    project_id: str = Field(max_length=50)
    code: str = Field(max_length=20000)

# project_id -> (function names, any one required, failure hint, success message)
CHECKS = {
    "proj-2": ({"read_csv", "head", "describe"},
               "Use pandas functions like read_csv(), head() or describe() to explore the dataset.",
               "Dataset exploration methods found."),
    "proj-4": ({"dropna", "fillna"},
               "Your code must use cleaning methods like dropna() or fillna().",
               "Missing-value handling found."),
}

def _called_names(tree: ast.AST) -> set[str]:
    names = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Call):
            f = node.func
            if isinstance(f, ast.Attribute):
                names.add(f.attr)
            elif isinstance(f, ast.Name):
                names.add(f.id)
    return names

@router.post("/grade")
def grade_project(req: GradeRequest, user: CurrentUser = Depends(require_active)):
    try:
        tree = ast.parse(req.code)
    except SyntaxError as e:
        return {"success": False, "error_type": "SyntaxError", "line": e.lineno,
                "output": f"Syntax error on line {e.lineno}: {e.msg}",
                "suggestion": "Fix the syntax error and submit again."}

    note = "Static review only; your code was not executed."
    check = CHECKS.get(req.project_id)
    if check:
        wanted, fail_msg, ok_msg = check
        ok = bool(wanted & _called_names(tree))
        return {"success": ok, "line": None, "output": note,
                "suggestion": ok_msg if ok else fail_msg}

    ok = len(req.code.strip()) > 50
    return {"success": ok, "line": None, "output": note,
            "suggestion": "Submission accepted." if ok else
            "Your submission is too brief. Implement the full project logic."}