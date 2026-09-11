"""Smoke test — compare Phase 1 (tag-only) and Phase 2 (hybrid) recommendations."""
import httpx

base = "http://localhost:8000/api"
# Longer timeout for first semantic call (model cold-load)
client = httpx.Client(timeout=60.0)

# Tag-only recommendations (Phase 1)
print("=== Phase 1: Tag-Only Recommendations (OFF001) ===")
r = client.get(f"{base}/officers/OFF001/recommendations", params={"top_n": 5})
print(f"Status: {r.status_code}")
for rec in r.json():
    print(f"  {rec['course_id']}: {rec['course_title']}")
    print(f"    score={rec['score']}, matched={rec['matched_skills']}")

print()

# Hybrid semantic recommendations (Phase 2)
print("=== Phase 2: Hybrid Semantic Recommendations (OFF001) ===")
r = client.get(f"{base}/officers/OFF001/recommendations/semantic", params={"top_n": 5})
print(f"Status: {r.status_code}")
for rec in r.json():
    print(f"  {rec['course_id']}: {rec['course_title']}")
    print(f"    final={rec['final_score']:.3f}  semantic={rec['semantic_score']:.3f}  tag_overlap={rec['tag_overlap_score']:.3f}  matched={rec['matched_skills']}")

print()

# Compare another officer (OFF003)
print("=== Phase 2: Hybrid Semantic Recommendations (OFF003) ===")
r = client.get(f"{base}/officers/OFF003/recommendations/semantic", params={"top_n": 5})
print(f"Status: {r.status_code}")
for rec in r.json():
    print(f"  {rec['course_id']}: {rec['course_title']}")
    print(f"    final={rec['final_score']:.3f}  semantic={rec['semantic_score']:.3f}  tag_overlap={rec['tag_overlap_score']:.3f}  matched={rec['matched_skills']}")

print()

# 404 test
print("=== 404 Test ===")
r = client.get(f"{base}/officers/OFF999/recommendations/semantic")
print(f"Status: {r.status_code} -> {r.json()}")

client.close()
