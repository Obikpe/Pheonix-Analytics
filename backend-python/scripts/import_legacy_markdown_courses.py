#!/usr/bin/env python3
"""Copy legacy Learnora course metadata and Markdown into Supabase as DRAFT content.

This is intentionally non-destructive:
- source files under frontend/data are read only and never deleted or edited;
- every imported course/module/lesson remains draft until a human reviews it;
- repeated runs update the same rows by stable legacy slugs and module/order keys;
- --dry-run is the default; pass --apply to write to Supabase.

Run from the repository root:
  python backend-python/scripts/import_legacy_markdown_courses.py
  python backend-python/scripts/import_legacy_markdown_courses.py --apply
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from supabase import create_client

ROOT = Path(__file__).resolve().parents[2]
SOURCE_COURSES = ROOT / "frontend" / "data" / "courses.json"
SOURCE_LESSONS = ROOT / "frontend" / "data" / "lessons"
SOURCE_LESSON_INDEX = ROOT / "frontend" / "data" / "lessons_index.json"
ENV_FILE = ROOT / "backend-python" / ".env"
PLACEHOLDER_RE = re.compile(
    r"(write complete explanatory notes here|insert lesson content here|todo:.*lesson)",
    re.IGNORECASE,
)


def read_markdown(path: Path) -> str:
    return path.read_text(encoding="utf-8-sig").replace("\r\n", "\n").strip()


def title_from_markdown(content: str, fallback: str) -> str:
    for line in content.splitlines():
        match = re.match(r"^\s{0,3}#\s+(.+?)\s*#*\s*$", line)
        if match:
            return match.group(1).strip()[:200]
    return fallback[:200]


def slugify(value: str) -> str:
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower()).strip("-")
    return value[:180] or "legacy-course"


def load_sources() -> tuple[list[dict[str, Any]], dict[str, list[Path]]]:
    if not SOURCE_COURSES.exists():
        raise FileNotFoundError(f"Course catalogue not found: {SOURCE_COURSES}")
    catalogue = json.loads(SOURCE_COURSES.read_text(encoding="utf-8-sig"))
    files_by_legacy_id: dict[str, list[Path]] = {}
    if SOURCE_LESSONS.exists():
        for directory in sorted(p for p in SOURCE_LESSONS.iterdir() if p.is_dir()):
            # Directory names begin with the catalogue ID, e.g. c_001-... or ws_01-...
            legacy_id = directory.name.split("-", 1)[0]
            if any(str(row.get("id")) == legacy_id for row in catalogue):
                files_by_legacy_id[legacy_id] = sorted(
                    directory.glob("*.md"),
                    key=lambda p: (
                        int(re.match(r"^(\d+)", p.stem).group(1))
                        if re.match(r"^(\d+)", p.stem) else 999999,
                        p.name.lower(),
                    ),
                )
    return catalogue, files_by_legacy_id


def load_lesson_index() -> dict[str, dict[str, Any]]:
    if not SOURCE_LESSON_INDEX.exists():
        return {}
    rows = json.loads(SOURCE_LESSON_INDEX.read_text(encoding="utf-8-sig"))
    result: dict[str, dict[str, Any]] = {}
    for row in rows:
        source = str(row.get("file") or "").replace("\\\\", "/")
        if source.startswith("data/"):
            source = source[5:]
        if source:
            result[source] = row
    return result


def lesson_duration(content: str, indexed: dict[str, Any] | None) -> int | None:
    match = re.search(r"(?:\\*\\*)?Duration(?:\\*\\*)?\\s*:\\s*(\\d+)\\s*(?:min|minutes)", content, re.IGNORECASE)
    if match:
        return int(match.group(1))
    value = (indexed or {}).get("estimated_minutes")
    try:
        return int(value) if value is not None else None
    except (TypeError, ValueError):
        return None


def build_lesson_rows(course: dict[str, Any], module_id: str, files: list[Path], index_by_file: dict[str, dict[str, Any]]) -> tuple[list[dict], str, int]:
    outline = ""
    lessons: list[dict] = []
    placeholders = 0
    ordered_files = [p for p in files if "outline" in p.stem.lower() or p.stem.lower().startswith("00-")]
    if ordered_files:
        outline = read_markdown(ordered_files[0])
    content_files = [p for p in files if p not in ordered_files]
    for fallback_order, path in enumerate(content_files, start=1):
        content = read_markdown(path)
        numeric = re.match(r"^(\d+)", path.stem)
        order_index = int(numeric.group(1)) if numeric else fallback_order
        legacy_id = str(course.get("id") or "")
        lesson_code = re.search(r"ID\s*:\s*([^\s]+)", content, re.IGNORECASE)
        legacy_lesson_id = lesson_code.group(1).strip() if lesson_code else path.stem
        if PLACEHOLDER_RE.search(content):
            placeholders += 1
        title = title_from_markdown(content, f"Lesson {order_index:02d}")
        relative_source = path.relative_to(ROOT).as_posix()
        index_key = path.relative_to(ROOT / "frontend" / "data").as_posix()
        lessons.append({
            "module_id": module_id,
            "title": title,
            "slug": slugify(f"{legacy_id}-{legacy_lesson_id}"),
            "description": f"Preserved Markdown source: {relative_source}",
            "order_index": order_index,
            "lesson_type": "article",
            # Keep the original Markdown intact. Draft status prevents placeholder
            # text from being presented as finished teaching material.
            "content": content,
            "duration_minutes": lesson_duration(content, index_by_file.get(index_key)),
            "is_preview": False,
            "status": "draft",
        })
    return lessons, outline, placeholders


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="write the copy to Supabase (default is dry-run)")
    parser.add_argument("--limit", type=int, default=0, help="optional limit for a small test run")
    args = parser.parse_args()

    catalogue, files_by_id = load_sources()
    index_by_file = load_lesson_index()
    if args.limit > 0:
        catalogue = catalogue[:args.limit]

    all_markdown = sum(len(files_by_id.get(str(c.get("id")), [])) for c in catalogue)
    all_lessons = sum(
        sum(1 for p in files_by_id.get(str(c.get("id")), []) if "outline" not in p.stem.lower() and not p.stem.lower().startswith("00-"))
        for c in catalogue
    )
    placeholder_count = 0
    for course in catalogue:
        for path in files_by_id.get(str(course.get("id")), []):
            if "outline" not in path.stem.lower() and not path.stem.lower().startswith("00-"):
                if PLACEHOLDER_RE.search(read_markdown(path)):
                    placeholder_count += 1

    report = {
        "mode": "apply" if args.apply else "dry-run",
        "catalogue_courses": len(catalogue),
        "courses_with_markdown": sum(1 for c in catalogue if files_by_id.get(str(c.get("id")))),
        "markdown_files_found": all_markdown,
        "lesson_markdown_files": all_lessons,
        "placeholder_lesson_files": placeholder_count,
        "published_by_this_script": 0,
        "source_directory": str(SOURCE_LESSONS),
    }
    if not args.apply:
        print(json.dumps(report, indent=2, ensure_ascii=False))
        print("\nDry run only. No database writes were made. Review placeholder content before publishing any course.")
        return 0

    load_dotenv(ENV_FILE, override=False)
    url = __import__("os").getenv("SUPABASE_URL", "").strip()
    key = (
        __import__("os").getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
        or __import__("os").getenv("SUPABASE_SECRET_KEY", "").strip()
    )
    if not url or not key:
        print("Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY).", file=sys.stderr)
        return 2

    db = create_client(url, key)
    imported_courses = 0
    imported_modules = 0
    imported_lessons = 0
    courses_without_markdown = 0

    for course in catalogue:
        legacy_id = str(course.get("id") or "").strip()
        if not legacy_id:
            print("Skipping course with missing id", file=sys.stderr)
            continue
        slug = "legacy-" + slugify(legacy_id)
        source_files = files_by_id.get(legacy_id, [])
        track = str(course.get("track") or "").strip()
        desc = str(course.get("desc") or course.get("description") or "").strip()
        settings = {
            "migration_source": "frontend/data",
            "legacy_id": legacy_id,
            "track": track,
            "module": course.get("module"),
            "type": course.get("type"),
            "project": course.get("project"),
            "color": course.get("color"),
            "topics": course.get("topics") or [],
            "witstart": bool(course.get("witstart", False)),
            "expected_lesson_count": int(course.get("lesson_count") or course.get("expected_lesson_count") or 0),
            "total_minutes": int(course.get("total_minutes") or 0),
            "source_markdown_files": len(source_files),
            "content_status": "needs_review",
        }
        course_payload = {
            "organisation_id": None,
            "title": str(course.get("title") or legacy_id).strip()[:200],
            "slug": slug,
            "short_description": desc[:1000] or None,
            "description": desc or None,
            "level": str(course.get("level") or "beginner").strip().lower(),
            "status": "draft",
            "ownership": "learnora",
            "thumbnail_url": None,
            "estimated_hours": round(float(course.get("total_minutes") or 0) / 60, 2) or None,
            "settings": settings,
        }
        existing = (
            db.table("learnora_courses").select("id")
            .eq("slug", slug).is_("organisation_id", "null")
            .eq("ownership", "learnora").limit(1).execute()
        ).data or []
        if existing:
            course_row = db.table("learnora_courses").update(course_payload).eq("id", existing[0]["id"]).execute().data[0]
        else:
            course_row = db.table("learnora_courses").insert(course_payload).execute().data[0]
        course_id = str(course_row["id"])
        imported_courses += 1

        files = source_files
        _, outline, placeholders = build_lesson_rows(course, "pending", files, index_by_file)
        module_payload = {
            "course_id": course_id,
            "title": f"{course_row['title']} — Curriculum",
            "description": outline or "Imported Markdown curriculum. Review lesson content before publishing.",
            "order_index": 0,
            "status": "draft",
        }
        module_row = db.table("course_modules").upsert(module_payload, on_conflict="course_id,order_index").execute().data[0]
        module_id = str(module_row["id"])
        imported_modules += 1

        lesson_rows, _, _ = build_lesson_rows(course, module_id, files, index_by_file)
        for start in range(0, len(lesson_rows), 50):
            chunk = lesson_rows[start:start + 50]
            if chunk:
                result = db.table("learnora_lessons").upsert(chunk, on_conflict="module_id,order_index").execute()
                imported_lessons += len(result.data or [])

        # Keep the quality audit with the imported metadata for later review.
        settings["placeholder_lesson_count"] = placeholders
        settings["content_status"] = "needs_content_authoring" if placeholders else ("needs_review" if lesson_rows else "metadata_only")
        db.table("learnora_courses").update({"settings": settings, "status": "draft"}).eq("id", course_id).execute()
        if not files:
            courses_without_markdown += 1

    report.update({
        "imported_courses": imported_courses,
        "imported_modules": imported_modules,
        "imported_lessons": imported_lessons,
        "courses_without_markdown": courses_without_markdown,
        "published_by_this_script": 0,
    })
    print(json.dumps(report, indent=2, ensure_ascii=False))
    print("\nImport finished. Source Markdown was not modified or deleted; all imported courses/modules/lessons remain draft.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
