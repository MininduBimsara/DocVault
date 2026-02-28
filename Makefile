# DocVault Chat — Development helpers
# Usage: make <target>

.PHONY: install backend-install frontend-install backend-run frontend-run backend-lint

# ── Install ─────────────────────────────────────────────

install: backend-install frontend-install

backend-install:
	cd backend && pip install -r requirements.txt

frontend-install:
	cd frontend && npm install

# ── Run ─────────────────────────────────────────────────

backend-run:
	cd backend && uvicorn app.main:app --reload --port 8000

frontend-run:
	cd frontend && npm run dev

# ── Lint (optional) ─────────────────────────────────────

backend-lint:
	cd backend && python -m py_compile app/main.py && echo "OK"
