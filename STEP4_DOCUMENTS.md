# DocVault — Step 4: Documents API + PDF Upload

## Overview

Auth-protected document management. PDF-only upload stored to disk at `FILE_STORAGE_PATH/{userId}/{docId}.pdf`. Mongo record created with `status=UPLOADED`.  
No RAG ingestion, no background jobs, no FastAPI calls — documents only.

---

## What Changed

| Status  | File                                                   | Notes                                                                          |
| ------- | ------------------------------------------------------ | ------------------------------------------------------------------------------ |
| **NEW** | `docvault-api/src/middleware/upload.middleware.ts`     | Multer memory-storage, PDF-only filter (mimetype + extension), 25 MB cap       |
| **NEW** | `docvault-api/src/utils/fileStorage.ts`                | `resolveDocPath`, `ensureUserDir`, `removeFileSafe`                            |
| **NEW** | `docvault-api/src/repositories/document.repository.ts` | Mongoose queries; all filtered by `userId` for multi-tenancy                   |
| **NEW** | `docvault-api/src/services/documents.service.ts`       | Upload / list / delete business logic; pre-generated ObjectId (see note below) |
| **NEW** | `docvault-api/src/controllers/documents.controller.ts` | HTTP handlers; logs `userId + docId + size` on upload success                  |
| **NEW** | `docvault-api/src/routes/documents.route.ts`           | POST /upload · GET / · DELETE /:docId                                          |
| **NEW** | `docvault-api/src/docs/documents-api.md`               | Full API reference + curl verification flow                                    |
| **MOD** | `docvault-api/src/app.ts`                              | Mounted `documentsRouter` at `/api/documents`                                  |
| **MOD** | `docvault-api/.env.example`                            | Added `MAX_UPLOAD_MB=25`                                                       |

### Dependencies Added

```bash
npm install multer
npm install -D @types/multer
```

---

## Endpoints

| Method | Path                    | Auth | Description                                           |
| ------ | ----------------------- | ---- | ----------------------------------------------------- |
| POST   | `/api/documents/upload` | ✅   | Upload PDF (`multipart/form-data`, field name `file`) |
| GET    | `/api/documents`        | ✅   | List caller's documents (newest first)                |
| DELETE | `/api/documents/:docId` | ✅   | Remove PDF from disk + delete Mongo record            |

---

## Storage Layout

```
shared-storage/
└── {userId}/
    └── {docId}.pdf
```

Controlled by `FILE_STORAGE_PATH` in `.env`. Already resolved to an absolute path by `config/env.ts` (no change needed).

---

## Key Design Decision

The `Document` schema marks `storage.path` as `required: true`. Instead of saving a placeholder empty string and patching it afterwards, the service **pre-generates the Mongo `_id`** before any DB or disk call:

```
docId    = new Types.ObjectId()
filePath = FILE_STORAGE_PATH/{userId}/{docId}.pdf
write file to disk → save DB record with real path already set
```

This satisfies the validator in a single `save()` with no two-step create + update.

---

## Environment Variables

| Variable            | Required | Default | Description                 |
| ------------------- | -------- | ------- | --------------------------- |
| `FILE_STORAGE_PATH` | ✅       | —       | Root dir for uploaded files |
| `MAX_UPLOAD_MB`     | —        | `25`    | Per-file size cap           |

---

## Security

| Rule                              | How                                                                    |
| --------------------------------- | ---------------------------------------------------------------------- |
| Auth required on all endpoints    | `requireAuth` middleware from Step 3                                   |
| Users see only their own docs     | Every query filters by `userId`                                        |
| `storage.path` never in responses | Repository projection excludes it; client receives id/name/status only |
| PDF-only enforcement              | Multer filter checks both `mimetype` and `.pdf` extension              |

---

## Response Shape

```jsonc
// POST /api/documents/upload  →  201
{ "document": { "id", "fileName", "status": "UPLOADED", "progress": { "stage": "uploaded" }, "createdAt" } }

// GET /api/documents  →  200
{ "documents": [ { "id", "fileName", "status", "progress", "createdAt" } ] }

// DELETE /api/documents/:docId  →  200
{ "ok": true }
```

---

## Verification

Full curl examples in [`docvault-api/src/docs/documents-api.md`](docvault-api/src/docs/documents-api.md).

Quick sequence (assumes `cookies.txt` from Step 3 login):

```bash
# Upload
curl -i -b cookies.txt -X POST http://localhost:4000/api/documents/upload \
  -F "file=@/path/to/sample.pdf"

# List — status should be "UPLOADED"
curl -i -b cookies.txt http://localhost:4000/api/documents

# Delete
curl -i -b cookies.txt -X DELETE http://localhost:4000/api/documents/{docId}
```

---

## What's NOT in This Step

- ❌ RAG ingestion / embedding pipeline
- ❌ Background processing jobs
- ❌ FastAPI calls
- ❌ Sessions / chat endpoints
- ❌ Document status updates beyond `UPLOADED`

---

## Next Steps (Step 5 Onwards)

- Trigger RAG ingestion on upload (`PROCESSING` → `READY`)
- Session management routes (create, list, delete)
- Chat endpoints (send message, stream assistant reply)
- Wire docvault-rag FastAPI service
