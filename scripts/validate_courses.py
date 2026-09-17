#!/usr/bin/env python3
"""Validate the static multi-course catalog.

Checks:
1. Root courses.json exists and is valid JSON.
2. Every catalog entry has a matching courses/<slug>/ directory.
3. Every course articles.json entry references an existing markdown file.
4. Every relative image referenced from a markdown file exists locally.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
IMG_PATTERN = re.compile(r"!\[[^\]]*\]\(([^)]+)\)")


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8-sig") as handle:
        return json.load(handle)


def iter_courses(catalog: Any) -> list[dict[str, Any]]:
    if isinstance(catalog, list):
        return catalog
    if isinstance(catalog, dict) and isinstance(catalog.get("courses"), list):
        return catalog["courses"]
    return []


def validate_catalog() -> tuple[list[str], list[dict[str, Any]]]:
    errors: list[str] = []
    catalog_path = ROOT / "courses.json"
    if not catalog_path.exists():
        return ["courses.json not found"], []

    try:
        catalog = load_json(catalog_path)
    except json.JSONDecodeError as exc:
        return [f"courses.json is invalid JSON: {exc}"], []

    courses = iter_courses(catalog)
    if not courses:
        return ["courses.json contains no courses"], []

    for course in courses:
        slug = course.get("slug")
        if not slug:
            errors.append("course entry missing slug")
            continue
        course_dir = ROOT / "courses" / slug
        if not course_dir.is_dir():
            errors.append(f"{slug}: directory missing at {course_dir.relative_to(ROOT)}")
        articles_path = course_dir / "articles.json"
        if not articles_path.exists():
            errors.append(f"{slug}: articles.json missing")

    return errors, courses


def validate_course_articles(course: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    slug = course.get("slug")
    course_dir = ROOT / "courses" / slug
    articles_path = course_dir / "articles.json"
    if not articles_path.exists():
        return errors

    try:
        articles = load_json(articles_path)
    except json.JSONDecodeError as exc:
        return [f"{slug}: articles.json is invalid JSON: {exc}"]

    if not isinstance(articles, list):
        return [f"{slug}: articles.json must be an array"]

    article_files = set()
    for index, article in enumerate(articles):
        file = article.get("file") if isinstance(article, dict) else None
        if not file:
            errors.append(f"{slug}: article {index} missing file")
            continue
        file_path = course_dir / file
        if not file_path.exists():
            errors.append(f"{slug}: missing article {file}")
        else:
            article_files.add(file_path)

    for file_path in sorted(article_files):
        try:
            markdown = file_path.read_text(encoding="utf-8")
        except OSError as exc:
            errors.append(f"{slug}: cannot read {file_path.relative_to(course_dir)}: {exc}")
            continue

        base_dir = file_path.parent
        for match in IMG_PATTERN.finditer(markdown):
            raw_src = match.group(1).strip()
            src = raw_src.split(" ", 1)[0]
            if not src or src.startswith(("http://", "https://", "data:", "#", "/")):
                continue
            image_path = (base_dir / src).resolve()
            if not image_path.exists():
                errors.append(
                    f"{slug}: missing image {src} referenced by {file_path.relative_to(course_dir)}"
                )

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args()

    errors, courses = validate_catalog()
    for course in courses:
        errors.extend(validate_course_articles(course))

    if errors:
        print("Course catalog validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print(f"Course catalog valid: {len(courses)} course(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
