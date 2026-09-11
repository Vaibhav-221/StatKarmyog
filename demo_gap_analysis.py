"""
Demo script: proves the mock data is wired together correctly.
Run: python3 demo_gap_analysis.py

Shows: skill-gap analysis -> course recommendation -> enrollment/status sync
for every officer, end-to-end.
"""
import json
import csv
from collections import defaultdict

with open("skill_framework.json") as f:
    framework = json.load(f)
with open("officer_profiles.json") as f:
    profiles = json.load(f)
with open("course_catalogue.csv") as f:
    courses = list(csv.DictReader(f))
with open("enrollment_status.csv") as f:
    enrollments = list(csv.DictReader(f))

roles_by_id = {r["role_id"]: r for r in framework["roles"]}

enrollments_by_officer = defaultdict(list)
for e in enrollments:
    enrollments_by_officer[e["officer_id"]].append(e)


def analyze_officer(officer):
    role = roles_by_id[officer["role_id"]]
    expected = role["expected_skills"]
    current = officer["current_skills"]
    gaps = []
    for skill, expected_level in expected.items():
        current_level = current.get(skill, 0)
        if current_level < expected_level:
            gaps.append({
                "skill": skill,
                "expected": expected_level,
                "current": current_level,
                "gap_size": expected_level - current_level
            })
    gaps.sort(key=lambda g: -g["gap_size"])
    return gaps


def recommend_courses(gaps, top_n=5):
    gap_skills = {g["skill"] for g in gaps}
    scored = []
    for c in courses:
        tags = set(t.strip() for t in c["skill_tags"].split(","))
        overlap = tags & gap_skills
        if overlap:
            scored.append((len(overlap), c["course_title"], sorted(overlap)))
    scored.sort(key=lambda x: -x[0])
    return scored[:top_n]


if __name__ == "__main__":
    for officer in profiles["officers"]:
        print(f"\n=== {officer['name']} ({officer['designation']}) ===")

        gaps = analyze_officer(officer)
        print(f"Skill gaps found: {len(gaps)}")
        for g in gaps[:5]:
            print(f"  - {g['skill']}: current={g['current']} expected={g['expected']} (gap={g['gap_size']})")

        recs = recommend_courses(gaps)
        print("Top recommended courses:")
        for score, title, matched in recs:
            print(f"  - {title}  [matches: {', '.join(matched)}]")

        officer_enrollments = enrollments_by_officer.get(officer["officer_id"], [])
        print(f"Enrollment status ({len(officer_enrollments)} courses tracked via mock-iGOT sync):")
        for e in officer_enrollments:
            print(f"  - {e['course_title']}: {e['status']} ({e['progress_percent']}%)")
