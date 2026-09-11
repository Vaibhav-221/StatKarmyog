# Skill Intelligence & Learning Platform — Setup Guide

## Competency & Gap Analysis API + Semantic Search

Prototype for Smart India Hackathon PS 26101 — an AI-enabled LMS for
MoSPI/NSSTA officials that identifies competency gaps and recommends training.

> **Note:** All data is synthetic/mock. No real personnel data is used.

---

## Prerequisites

- **Python 3.11+** installed and available on PATH
- **pip** (bundled with Python)

---

## Installation

```bash
# 1. Clone / navigate to the project directory
cd "sih hackathon prototype"

# 2. (Optional) Create a virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt
```

> **Note:** First install downloads the sentence-transformer model
> (`all-MiniLM-L6-v2`, ~90 MB) and PyTorch. This is a one-time download.

---

## Seed the Database

The database is **automatically seeded** when the server starts for the first
time.  If you want to re-run the seed loader manually (or after deleting `data/app.db`):

```bash
python -m app.seed
```

The seed script is **idempotent** — running it multiple times checks natural keys (`officer_id + cid + recorded_on + source`, `attempt_id`, `cid`, etc.) and will not duplicate records. It seeds:
- Roles & Expected Skills (`skill_framework.json`)
- Officer Profiles (`officer_profiles.json`)
- Course Catalogue (`course_catalogue.csv`)
- Officer Enrollments (`enrollment_status.csv`)
- FRAC Competency Dictionary (`frac_competency_dictionary.json`)
- Historical Quiz Attempts (`quiz_attempts_seed.json`)
- Competency Scores History (`competency_history_seed.json`)

**Database location:** `./data/app.db` (SQLite file, auto-created)

---

## Build the Semantic Index (Optional)

The semantic index is built **automatically** on first server startup. To build
it independently (useful for debugging or rebuilding):

```bash
python -m app.build_index
```

This embeds all courses using the `all-MiniLM-L6-v2` model and stores vectors
in ChromaDB at `./data/chroma/`. The build is idempotent — if the collection
already has the correct number of documents, it skips.

> **First startup note:** The server will take a few extra seconds on first
> launch while it downloads the embedding model and builds the index (~83
> courses). Subsequent starts are near-instant.

---

## Run the Server

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at **http://localhost:8000**

Interactive Swagger docs: **http://localhost:8000/docs**

---

## Run Tests

```bash
pytest tests/ -v
```

Tests use an in-memory SQLite database seeded from the same seed data files,
so they don't modify the on-disk `app.db`.

---

## API Endpoints

All endpoints are under the `/api` prefix.

### Health Check

```bash
curl http://localhost:8000/api/health
# → {"status":"ok"}
```

### List All Officers

```bash
curl http://localhost:8000/api/officers
```

### Get Officer Detail

```bash
curl http://localhost:8000/api/officers/OFF001
```

### Competency Gap Analysis (Evidence-Based)

```bash
curl http://localhost:8000/api/officers/OFF001/gaps
```

Returns skills where the officer's evidence-based current level (or profile fallback) is below the role's expected level, sorted by gap size (largest gap first).
Includes `score_source` (`"evidence-based"` or `"profile-fallback"`) and `confidence_level` (`"low (1 source)"`, `"medium (2 sources)"`, or `"profile-only"`).

### Competency Score History

```bash
curl http://localhost:8000/api/competency-scores/OFF001
# Or alias:
curl http://localhost:8000/competency-scores/OFF001
```

Returns all historical competency score records for an officer ordered by `recorded_on` ascending.

### Competency Passport (Phase 5B)

```bash
curl http://localhost:8000/api/passport/OFF001
# Or alias:
curl http://localhost:8000/passport/OFF001
```

Returns grouped competency history trajectory, computing `first_score`, `latest_score`, `improved` (`true`/`false`/`null`), and `delta` per competency.

### Re-Assessment Trigger (Phase 5B)

```bash
curl -X POST http://localhost:8000/api/passport/OFF001/reassess \
  -H "Content-Type: application/json" \
  -d '{"cid": "CID-D-101"}'
```

Validates if `cid` is one of the officer's required role competencies and returns recommended action.
*Note: Re-assessment endpoint validates and routes, it does not itself generate a new quiz — that remains Phase 4's responsibility.*


### Course Recommendations (Tag-based, Phase 1)

```bash
curl http://localhost:8000/api/officers/OFF001/recommendations
# With custom limit:
curl "http://localhost:8000/api/officers/OFF001/recommendations?top_n=10"
```

Matches courses by exact skill_tag overlap with the officer's gap skills.

### Course Recommendations (Hybrid Semantic, Phase 2)

```bash
curl http://localhost:8000/api/officers/OFF001/recommendations/semantic
# With custom limit:
curl "http://localhost:8000/api/officers/OFF001/recommendations/semantic?top_n=10"
```

Combines **semantic similarity** (60% weight) with **tag overlap** (40% weight)
to surface relevant courses that keyword matching alone would miss. Response
includes both component scores for transparency:

```json
{
  "course_id": "C009",
  "course_title": "Advanced Python for Data Science",
  "semantic_score": 0.95,
  "tag_overlap_score": 1.0,
  "final_score": 0.97,
  "matched_skills": ["Data Visualization", "Python"]
}
```

### Officer Enrollments

```bash
curl http://localhost:8000/api/officers/OFF001/enrollments
```

### Course Catalogue (paginated)

```bash
curl http://localhost:8000/api/courses
# With pagination:
curl "http://localhost:8000/api/courses?skip=10&limit=5"
```

### Quiz Generation (Phase 4 / Phase 4B)

```bash
curl -X POST http://localhost:8000/api/quiz/generate \
  -F "file=@sample_learning_content.md" \
  -F "difficulty=medium" \
  -F "language=en" \
  -F "num_questions=3" \
  -F "officer_id=OFF001"
```

Extracts text from an uploaded document, generates MCQs tagged with `competency_tag` from `CompetencyDictionary`, creates a `QuizAttempt` shell with answer keys, and returns:

```json
{
  "attempt_id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "questions": [
    {
      "question": "What is stratified sampling?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0,
      "explanation": "Stratified sampling...",
      "competency_tag": "CID-D-102"
    }
  ]
}
```

### Quiz Submission (Phase 4B)

```bash
curl -X POST http://localhost:8000/api/quiz/submit \
  -H "Content-Type: application/json" \
  -d '{
    "attempt_id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
    "officer_id": "OFF001",
    "answers": [0, 1, 0]
  }'
```

Scores officer answers against the stored answer key, writes `QuizAttemptQuestion` rows and new evidence-based `CompetencyScore` rows, and returns detailed question breakdown and score summaries.

---

## Example End-to-End Curl Flow (Generate → Submit → Evidence Loop)

```bash
# Step 1: Generate Quiz for OFF001
ATTEMPT_ID=$(curl -s -X POST http://localhost:8000/api/quiz/generate \
  -F "file=@sample_learning_content.md" \
  -F "officer_id=OFF001" \
  -F "num_questions=3" | grep -o '"attempt_id":"[^"]*' | cut -d'"' -f4)

echo "Generated Quiz Attempt ID: $ATTEMPT_ID"

# Step 2: Submit Answers (answers array matches question order)
curl -X POST http://localhost:8000/api/quiz/submit \
  -H "Content-Type: application/json" \
  -d "{
    \"attempt_id\": \"$ATTEMPT_ID\",
    \"officer_id\": \"OFF001\",
    \"answers\": [0, 0, 0]
  }"

# Step 3: Verify Evidence Loop in Gap Analysis
curl http://localhost:8000/api/officers/OFF001/gaps
```

---

## Frontend (Phase 5 — Officer Dashboard)

The React frontend lives in the `frontend/` directory. It is a Vite + React
app using Ant Design, Recharts, and Axios.

### Frontend Installation

```bash
cd frontend
npm install
```

### Start the Dev Server

```bash
npm run dev
# → http://localhost:5173
```

The Vite dev server proxies API calls to the FastAPI backend at
`http://localhost:8000`. Start both the backend and frontend for full
functionality.

### Officer Login & Routes

| Route    | Description                          |
|----------|--------------------------------------|
| `/login` | Officer selector (6 demo profiles)   |
| `/`      | **Officer Dashboard** (default)      |
| `/quiz`  | Quiz Generator                       |
| `/admin` | **Admin / MoSPI Analytics Dashboard**|

---

## Admin Outcome Analytics Endpoints (Phase 6B)

The Admin Dashboard is powered by three real backend endpoints that aggregate competency gaps, training improvements, and departmental distributions across all officers:

> **Note:** The Admin Dashboard UI seamlessly falls back to mock data if the backend is unreachable. All responses transparently include a top-level `"note"` field disclosing the 60%/40% quiz & work-artifact heuristic weighting.

### 1. Org-Wide Gap Summary
`GET /api/admin/gap-summary`  
*(Optional query parameter: `department` e.g. `GET /api/admin/gap-summary?department=Industrial%20Statistics%20Division`)*

Computes average current vs required skill levels for every competency required across officers in scope. Includes officers with no `CompetencyScore` history via profile skill fallbacks.

```bash
curl -X GET "http://localhost:8000/api/admin/gap-summary"
```

**Sample Response:**
```json
{
  "department": null,
  "items": [
    {
      "cid": "CID-D-107",
      "skill_label": "Industrial Statistics",
      "officer_count": 18,
      "avg_current_level": 2.6,
      "avg_required_level": 4.0,
      "avg_gap": 1.4,
      "officers_below_required": 15
    }
  ],
  "note": "Scores combine quiz and work-artifact evidence where available (60%/40% weighted), with confidence_level indicating data source strength. See individual officer profiles for per-officer confidence levels."
}
```

### 2. Training Effectiveness
`GET /api/admin/training-effectiveness`

Computes pre/post training improvement deltas for competencies with 2+ score records per officer. If no competencies have 2+ assessment records yet, returns an empty item list with an explanatory message.

```bash
curl -X GET "http://localhost:8000/api/admin/training-effectiveness"
```

**Sample Response (with data):**
```json
{
  "items": [
    {
      "cid": "CID-F-201",
      "skill_label": "Python Programming",
      "officers_reassessed": 18,
      "avg_improvement": 1.3,
      "improved_count": 14,
      "declined_count": 2,
      "no_change_count": 2
    }
  ],
  "message": null,
  "note": "Scores combine quiz and work-artifact evidence where available (60%/40% weighted), with confidence_level indicating data source strength. See individual officer profiles for per-officer confidence levels."
}
```

**Sample Response (no re-assessments yet):**
```json
{
  "items": [],
  "message": "No re-assessment data yet — officers need to retake at least one quiz per competency to populate this view",
  "note": "Scores combine quiz and work-artifact evidence where available (60%/40% weighted), with confidence_level indicating data source strength. See individual officer profiles for per-officer confidence levels."
}
```

### 3. Department Summary
`GET /api/admin/department-summary`

Aggregates average skill gaps across all required skills per department.

```bash
curl -X GET "http://localhost:8000/api/admin/department-summary"
```

**Sample Response:**
```json
{
  "items": [
    {
      "department": "Industrial Statistics Division",
      "officer_count": 12,
      "avg_gap_across_all_skills": 1.1
    }
  ],
  "note": "Scores combine quiz and work-artifact evidence where available (60%/40% weighted), with confidence_level indicating data source strength. See individual officer profiles for per-officer confidence levels."
}
```

---


Officers select their profile from a dropdown and land on the Dashboard at
`/`. The dashboard shows:

1. **Profile header** — name, designation, department, experience badge
2. **Skill radar chart** — Required vs Current skill levels (Recharts)
3. **Gap analysis table** — colored tags (green = on track, amber = gap,
   red = critical gap)
4. **Recommended courses** — horizontally scrollable cards with relevance %
5. **Enrollment progress** — progress bars with status labels

### Mock Data Fallback

Every API call has a built-in fallback: if the backend is unreachable, the
dashboard renders **mock data** matching the real API response shapes (OFF001
— Rakesh Kumar). A subtle info banner indicates demo mode. This means the
frontend always renders something, even without the backend running.

### Custom Theme

The Ant Design theme is configured in `src/theme/antdTheme.js`. Key tokens:

- **Primary color:** `#0C447C` (institutional deep blue)
- **Success/gap-closed:** `#3B6D11` (green)
- **Warning/gap-exists:** `#BA7517` (amber)
- **Font:** Inter (Google Fonts)
- **Border radius:** 10px on cards, 8px on tags

To adjust brand colors, edit the `token` and `components` objects in that file.

---

## Project Structure

```
├── app/
│   ├── main.py              # FastAPI app entry point
│   ├── db.py                # SQLAlchemy engine + session
│   ├── seed.py              # Database seeder (idempotent)
│   ├── build_index.py       # Standalone semantic index builder
│   ├── models/
│   │   └── models.py        # SQLAlchemy ORM models
│   ├── schemas/
│   │   └── schemas.py       # Pydantic v2 request/response schemas
│   ├── routers/
│   │   ├── api.py           # FastAPI route handlers (Phase 1-3)
│   │   └── quiz.py          # Quiz generate + submit (Phase 4 + 4B)
│   └── services/
│       ├── gap_analysis.py  # Gap analysis + tag & hybrid recommendations
│       ├── llm_provider.py  # LLM MCQ generation with competency tagging
│       ├── quiz_cache.py    # In-memory quiz result cache
│       └── semantic_search.py  # ChromaDB + sentence-transformers
├── frontend/                # Phase 5 — React Officer Dashboard
│   ├── src/
│   │   ├── api/client.js          # Axios client + mock fallback
│   │   ├── components/AppShell.jsx  # Layout with sidebar + header
│   │   ├── context/AuthContext.jsx  # Auth state (sessionStorage)
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx      # Officer dashboard (5 sections)
│   │   │   ├── Login.jsx          # Officer selector login
│   │   │   └── QuizPage.jsx       # Quiz placeholder
│   │   ├── theme/antdTheme.js     # AntD ConfigProvider theme
│   │   ├── App.jsx                # Router + ConfigProvider
│   │   ├── main.jsx               # Entry point
│   │   └── index.css              # Design system + global styles
│   ├── package.json
│   └── vite.config.js
├── seed_data/               # Mock data files (JSON + CSV)
│   ├── officer_profiles.json
│   ├── skill_framework.json
│   ├── course_catalogue.csv
│   └── enrollment_status.csv
├── data/
│   ├── app.db               # SQLite database (auto-created)
│   └── chroma/              # ChromaDB vector store (auto-created)
├── tests/
│   ├── test_gap_analysis.py       # Phase 1 tests (gap analysis + tag recs)
│   ├── test_semantic_search.py    # Phase 2 tests (index + hybrid recs)
│   ├── test_quiz_generate_endpoint.py  # Phase 4 tests (quiz generation)
│   └── test_quiz_flow.py         # Phase 4B tests (generate → submit → gap loop)
├── requirements.txt
└── SETUP.md                 # ← You are here
```

---

## Error Responses

All errors return a consistent JSON shape:

```json
{"error": "Officer 'OFF999' not found"}
```

| Status | Meaning                                        |
|--------|------------------------------------------------|
| 400    | Bad request (e.g. officer_id mismatch on submit)|
| 404    | Officer, course, or quiz attempt not found      |
| 409    | Conflict (e.g. quiz already submitted)          |
| 413    | File too large (>5 MB)                          |
| 422    | Invalid query parameters or answer count        |
| 500    | Unhandled server error                          |
