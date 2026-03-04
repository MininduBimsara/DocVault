# Documents API

Base URL: `http://localhost:4000`  
All endpoints require a valid session cookie (`docvault_token`).

---

## Prerequisites

Login first and save the cookie:

```bash
curl -i -c cookies.txt -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"yourpassword"}'
```

---

## Endpoints

### 1. Upload a PDF

```
POST /api/documents/upload
Content-Type: multipart/form-data
Field name: file
```

```bash
curl -i -b cookies.txt -X POST http://localhost:4000/api/documents/upload \
  -F "file=@/absolute/path/to/sample.pdf"
```

**Success `201`**

```json
{
  "document": {
    "id": "663f1a2b4c5d6e7f8a9b0c1d",
    "fileName": "sample.pdf",
    "status": "UPLOADED",
    "progress": {},
    "createdAt": "2026-03-03T17:45:00.000Z"
  }
}
```

**Errors**
| Code | Reason |
|------|--------|
| 400 | No file attached, or file is not a PDF |
| 401 | Not authenticated |
| 413 | File exceeds `MAX_UPLOAD_MB` (default 25 MB) |

---

### 2. List Documents

```
GET /api/documents
```

```bash
curl -i -b cookies.txt http://localhost:4000/api/documents
```

**Success `200`**

```json
{
  "documents": [
    {
      "id": "663f1a2b4c5d6e7f8a9b0c1d",
      "fileName": "sample.pdf",
      "status": "UPLOADED",
      "progress": {},
      "createdAt": "2026-03-03T17:45:00.000Z"
    }
  ]
}
```

---

### 3. Delete a Document

```
DELETE /api/documents/:docId
```

```bash
curl -i -b cookies.txt -X DELETE \
  http://localhost:4000/api/documents/663f1a2b4c5d6e7f8a9b0c1d
```

**Success `200`**

```json
{ "ok": true }
```

**Errors**
| Code | Reason |
|------|--------|
| 401 | Not authenticated |
| 404 | Document not found or belongs to another user |

---

## Quick Verification Flow

```bash
# 1. Upload
curl -i -b cookies.txt -X POST http://localhost:4000/api/documents/upload \
  -F "file=@./sample.pdf"

# save the returned id, e.g. DOC_ID=663f1a2b4c5d6e7f8a9b0c1d

# 2. List — should show status=UPLOADED
curl -i -b cookies.txt http://localhost:4000/api/documents

# 3. Confirm file exists on disk
# FILE_STORAGE_PATH is set in .env (default: ../shared-storage relative to repo root)
# Expected: shared-storage/{userId}/{docId}.pdf

# 4. Delete
curl -i -b cookies.txt -X DELETE http://localhost:4000/api/documents/$DOC_ID

# 5. List again — document should be gone
curl -i -b cookies.txt http://localhost:4000/api/documents
```

---

## Reject Non-PDF Test

```bash
curl -i -b cookies.txt -X POST http://localhost:4000/api/documents/upload \
  -F "file=@./image.png"
# Expected: 400 {"error":"Only PDF files are accepted."}
```

---

## Storage Layout

```
shared-storage/
└── {userId}/
    └── {docId}.pdf
```

Path is controlled by `FILE_STORAGE_PATH` in `.env`.  
`MAX_UPLOAD_MB` (default `25`) controls the per-file size cap.
