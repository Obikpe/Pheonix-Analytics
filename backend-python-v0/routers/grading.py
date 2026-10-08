#grading.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import subprocess
import tempfile
import os
import uuid
import re

router = APIRouter()

class GradeRequest(BaseModel):
    language: str = "python"
    code: str
    stdin: str = "" # user inputs for input() calls
    course_id: str = ""

@router.post("/grade")
def grade_code(payload: GradeRequest):
    if len(payload.code) > 10000:
        raise HTTPException(status_code=400, detail="Code too long")

    # Block dangerous, allow input()
    blocked = ["os.system", "subprocess.Popen", "shutil.rmtree", "open('/etc", "__import__('os')"]
    for b in blocked:
        if b in payload.code:
            return {"output": f"Blocked: {b} not allowed"}

    # Extract input() prompts to strip from final output
    # input("Enter age: ") -> "Enter age: "
    prompts = re.findall(r'input\s*\(\s*["\'](.*?)["\']\s*\)', payload.code)
    prompts += re.findall(r'input\s*\(\s*f["\'](.*?)["\']\s*\)', payload.code)

    fd, temp_path = tempfile.mkstemp(suffix='.py', prefix=f'phx_{uuid.uuid4().hex}_')
    try:
        os.write(fd, payload.code.encode('utf-8'))
        os.close(fd)
        fd = -1 # mark closed for Windows

        result = subprocess.run(
            ["python", temp_path],
            input=payload.stdin,
            capture_output=True,
            text=True,
            timeout=5,
            cwd=tempfile.gettempdir()
        )

        output = result.stdout
        if result.stderr:
            output += result.stderr

        for p in prompts:
            if p:
                # Remove prompt text from output
                output = output.replace(p, "")
                # Also handle f-string braces left over
                clean = re.sub(r'\{.*?\}', '', p)
                if clean != p:
                    output = output.replace(clean, "")

        # Clean up blank lines and spaces left after stripping
        output = output.strip()
        output = re.sub(r'\n\s*\n', '\n', output)
        output = re.sub(r'[ \t]+', ' ', output) # collapse extra spaces

        return {"output": output or "(no output)"}

    except subprocess.TimeoutExpired:
        return {"output": "Timeout: 5s exceeded - infinite loop?"}
    except Exception as e:
        return {"output": f"Error: {str(e)}"}
    finally:
        if fd != -1:
            try:
                os.close(fd)
            except:
                pass
        try:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
        except:
            pass

@router.get("/health")
def grading_health():
    return {"status": "grading ready", "interactive": True, "stdin": True}