# Mock-iGOT Integration Service — Setup Guide

This document explains how to run the **Mock-iGOT Integration Service**
 alongside the existing LMS backend. The mock service simulates
iGOT Karmayogi's enrollment lifecycle and pushes status updates to the LMS
backend via webhooks.

---

## Prerequisites

- **Python 3.11+** with the project's virtual environment activated
- **Redis** running on `localhost:6379`

### Installing Redis

Choose one of these options:

**Option A — Docker (Recommended)**
```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

**Option B — WSL (Windows Subsystem for Linux)**
```bash
sudo apt update && sudo apt install redis-server
sudo service redis-server start
```

**Option C — Windows native**
Download from https://github.com/microsoftarchive/redis/releases
(community-maintained, older version — Docker is preferred).

### Install Python Dependencies

```bash
pip install -r requirements.txt
```

---

## Startup Order

Run these commands in **separate terminal windows**, all from the **project
root** directory (`sih hackathon prototype/`).

### 1. Start Redis

```bash
# If using Docker:
docker start redis

# If using WSL:
sudo service redis-server start
```

### 2. Start the LMS Backend (Port 8000)

This is the existing Phase 1 app. It must be running to receive webhooks.

```bash
uvicorn app.main:app --reload --port 8000
```

### 3. Start the Mock-iGOT Service (Port 8001)

```bash
uvicorn mock_igot.app:app --reload --port 8001
```

### 4. Start the Celery Worker

```bash
celery -A mock_igot.celery_app worker --loglevel=info --pool=solo
```

> **Note**: `--pool=solo` is required on Windows because Celery's default
> `prefork` pool uses `fork()` which is not available on Windows. The solo
> pool is single-threaded and perfectly fine for demo/dev purposes.

### 5. Start Celery Beat (Scheduler)

```bash
celery -A mock_igot.celery_app beat --loglevel=info
```

---

## Verifying the Setup

### Quick Health Checks

```bash
# LMS backend
curl http://localhost:8000/api/health

# Mock-iGOT service
curl http://localhost:8001/mock-igot/health
```

### End-to-End Webhook Flow

1. **Check initial enrollments** on the LMS side:
   ```bash
   curl http://localhost:8000/api/officers/OFF001/enrollments
   ```

2. **Manually advance an enrollment** (e.g., E0003 which is "Enrolled"):
   ```bash
   curl -X POST http://localhost:8001/mock-igot/advance/E0003
   ```

3. **Verify the webhook updated the LMS** — check enrollments again:
   ```bash
   curl http://localhost:8000/api/officers/OFF001/enrollments
   ```
   E0003 should now show `status: "In-Progress"` with `progress_percent > 0`.

4. **Create a new enrollment** via the mock service:
   ```bash
   curl -X POST http://localhost:8001/mock-igot/enroll \
     -H "Content-Type: application/json" \
     -d '{"officer_id": "OFF001", "course_id": "C012"}'
   ```

5. **Wait 30 seconds** for the Celery Beat cycle, or manually advance the
   new enrollment. Then check the LMS side to see the new enrollment appear.

---

## Architecture

```
┌─────────────────────┐      webhook POST       ┌─────────────────────┐
│  Mock-iGOT Service  │ ──────────────────────>  │   LMS Backend       │
│  (port 8001)        │                          │   (port 8000)       │
│                     │                          │                     │
│  mock_igot.db       │                          │   data/app.db       │
└────────┬────────────┘                          └─────────────────────┘
         │
    Celery Worker + Beat
         │
    Redis (broker)
```

---

## Running Tests

```bash
# Webhook receiver tests (LMS side)
pytest tests/test_webhook_receiver.py -v

# Status advancement logic tests (mock service side)
pytest tests/test_status_advancement.py -v

# All tests
pytest tests/ -v
```

---

## Environment Variables

| Variable          | Default                                      | Description                         |
|-------------------|----------------------------------------------|-------------------------------------|
| `LMS_WEBHOOK_URL` | `http://localhost:8000/webhooks/igot-status`  | URL the mock service POSTs to       |

---

## Notes

- The **30-second Beat interval** is intentionally fast for demo purposes.
  In a real production system, this would be set to hours or days to match
  the actual pace of course completion on iGOT Karmayogi.
- The mock service uses its **own SQLite database** (`data/mock_igot.db`),
  separate from the LMS backend's `data/app.db`. This simulates the fact
  that iGOT is an external system with its own data store.
- To reset the mock service state, delete `data/mock_igot.db` and restart.
