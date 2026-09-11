# AI-Enabled Skill Intelligence & Learning Platform

> **Prototype developed for Smart India Hackathon (SIH) — Problem Statement PS 26101**  
> **Target Organizations:** Ministry of Statistics and Programme Implementation (MoSPI) & National Statistical Systems Training Academy (NSSTA).

---

## 📌 Executive Summary

The **AI-Enabled Skill Intelligence & Learning Platform** provides automated, evidence-based competency mapping, gap analysis, dynamic quiz assessment generation, and outcome analytics for statistical officials (JSO, SSO, ISS Officers).

It operates as an intelligence layer integrated with platforms like **iGOT Karmayogi**, transitioning competency tracking from static self-declarations to a dynamic, multi-source evidence system (quizzes + work artifacts).

---

## 🏗️ Technology Stack

- **Backend Core:** FastAPI (Python 3.13), Uvicorn
- **Database & ORM:** SQLite (SQLAlchemy 2.0)
- **Vector Search & AI:** ChromaDB (embeddings), LangChain, Google Gemini API / Local LLM ready
- **Frontend UI:** React 18 (Vite), Ant Design (custom theme `#0C447C`), Recharts
- **Async & Integration:** Celery, Redis (Mock-iGOT webhook service)
- **Testing:** Pytest (88 unit/integration tests)

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- (Optional) Redis server on `localhost:6379` for async background workers

### 2. Environment Setup
Create a `.env` file in the project root:
```env
GOOGLE_API_KEY=your_gemini_api_key_here
```

### 3. Install Dependencies
```powershell
# Install Python backend dependencies
pip install -r requirements.txt

# Install React frontend dependencies
cd frontend
npm install
```

### 4. Running the Application
For full, copy-pasteable startup instructions across all terminals, refer to **[`DEMO_RUNBOOK.md`](file:///c:/Users/acer/OneDrive/Apps/sih%20hackathon%20prototype/DEMO_RUNBOOK.md)**.

```powershell
# Terminal 1: Backend API (Port 8000)
uvicorn app.main:app --port 8000 --reload

# Terminal 2: Mock-iGOT Integration Service (Port 8001)
uvicorn mock_igot.app:app --port 8001 --reload

# Terminal 3: React Frontend (Port 5173)
cd frontend
npm run dev
```

Open **`http://localhost:5173`** in your browser to launch the web application.

---

## 🧪 System Architecture & Key Capabilities

```
┌─────────────────────────────────────────────────────────┐
│                 React Frontend (Vite)                   │
│   - Officer Dashboard (Radar Chart, Gaps, Recommendations)│
│   - Competency Passport (Score Trajectory & History)    │
│   - AI Quiz Generator & Submission                      │
│   - MoSPI Admin Outcome Analytics Dashboard             │
└────────────────────────────┬────────────────────────────┘
                             │ REST API / JSON
                             ▼
┌─────────────────────────────────────────────────────────┐
│               FastAPI Backend (Port 8000)               │
│   - Competency & Gap Engine (60% Quiz / 40% Artifact)   │
│   - Passport & History Tracking Endpoint                │
│   - LLM Provider Abstraction & MCQ Generator            │
│   - Hybrid Semantic Course Recommendations (ChromaDB)   │
└────────────────────────────┬────────────────────────────┘
                             │ Webhook Updates
                             ▼
┌─────────────────────────────────────────────────────────┐
│          Mock-iGOT Service & Webhook (Port 8001)        │
│   - Enrollment Lifecycle (Enrolled -> In-Progress -> Completed)│
│   - Event Pushes via Celery/Redis & Direct Trigger      │
└─────────────────────────────────────────────────────────┘
```

---

## 📄 Documentation Links & Runbook

- **[`DEMO_RUNBOOK.md`](file:///c:/Users/acer/OneDrive/Apps/sih%20hackathon%20prototype/DEMO_RUNBOOK.md)** — Comprehensive presentation script, judge Q&A guide, step-by-step startup commands, and end-to-end evidence loop test logs.
- **[`SETUP.md`](file:///c:/Users/acer/OneDrive/Apps/sih%20hackathon%20prototype/SETUP.md)** — Additional background setup notes for developers.

---

## ⚠️ Known Prototype Constraints
- **Database Engine:** Uses SQLite for local prototype convenience; production environments can switch to PostgreSQL via SQLAlchemy connection strings.
- **Async Workers:** Status auto-advancement relies on Celery + Redis; manual trigger endpoints are provided for standalone environments without Redis.
