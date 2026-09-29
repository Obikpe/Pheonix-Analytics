from fastapi import APIRouter, HTTPException
import json
import os
import sqlite3

router = APIRouter(prefix="/api/progress", tags=["Progress"])

DB_File = "users.db"

# Ensure local progress table exists in SQLite
def init_progress_db():
    conn = sqlite3.connect(DB_File)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_lesson_progress (
            user_email TEXT,
            lesson_id TEXT,
            completed BOOLEAN,
            PRIMARY KEY (user_email, lesson_id)
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_project_progress (
            user_email TEXT,
            course_id TEXT,
            completed BOOLEAN,
            PRIMARY KEY (user_email, course_id)
        )
    """)
    conn.commit()
    conn.close()

init_progress_db()

@router.get("/{user_email}/{track_id}")
def get_user_progress(user_email: str, track_id: str):
    try:
        # 1. Load courses locally from courses.json
        courses_path = os.path.join("data", "courses.json")
        if not os.path.exists(courses_path):
            # Fallback path check if running from different root
            courses_path = "courses.json"
            
        with open(courses_path, "r") as f:
            all_courses = json.load(f)

        # Filter courses by track
        courses = [c for c in all_courses if c.get("track", "").lower() == track_id.lower() or track_id.lower() == "all"]
        if not courses:
            # If no track match, return all witstart or general courses
            courses = all_courses

        # 2. Load lessons index locally from lessons_index.json
        lessons_path = os.path.join("data", "lessons_index.json")
        if not os.path.exists(lessons_path):
            lessons_path = "lessons_index.json"

        all_lessons = []
        if os.path.exists(lessons_path):
            with open(lessons_path, "r") as f:
                all_lessons = json.load(f)

        # 3. Fetch user progress from local SQLite
        conn = sqlite3.connect(DB_File)
        cursor = conn.cursor()
        
        cursor.execute("SELECT lesson_id, completed FROM user_lesson_progress WHERE user_email = ?", (user_email.lower(),))
        user_lessons = cursor.fetchall()
        completed_lesson_ids = {row[0] for row in user_lessons if row[1]}

        cursor.execute("SELECT course_id, completed FROM user_project_progress WHERE user_email = ?", (user_email.lower(),))
        user_projects = cursor.fetchall()
        project_map = {row[0]: row[1] for row in user_projects}
        
        conn.close()

        evaluated_modules = []
        prev_lessons_completed = True
        prev_project_completed = True

        for index, course in enumerate(courses):
            course_id = course.get("id")
            module_index = index + 1

            # Get lessons belonging to this course ID
            course_lesson_ids = [l.get("id") for l in all_lessons if l.get("course_id") == course_id]
            total_lessons = len(course_lesson_ids) or 16 # Default fallback count if lessons_index is empty

            completed_count = sum(1 for lid in course_lesson_ids if lid in completed_lesson_ids)
            all_lessons_done = total_lessons > 0 and completed_count >= total_lessons

            is_project_done = project_map.get(course_id, False)

            # Unlocking Rule Evaluation
        #     if module_index == 1:
        #         is_lessons_unlocked = True
        #     elif module_index == 2:
        #         is_lessons_unlocked != prev_lessons_completed
        #     else:
        #         is_lessons_unlocked != prev_lessons_completed and prev_project_completed

        #     is_project_unlocked = is_lessons_unlocked and all_lessons_done

        #     evaluated_modules.append({
        #         "course_id": course_id,
        #         "title": course.get("title"),
        #         "module_index": module_index,
        #         "lessons_unlocked": is_lessons_unlocked,
        #         "all_lessons_completed": all_lessons_done,
        #         "project_unlocked": is_project_unlocked,
        #         "project_completed": is_project_done,
        #         "total_lessons": total_lessons,
        #         "completed_lessons": completed_count
        #     })

        #     prev_lessons_completed = all_lessons_done
        #     prev_project_completed = is_project_done

        # return {"modules": evaluated_modules}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))