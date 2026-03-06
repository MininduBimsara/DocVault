# Sessions + Messages API

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

## Sessions

### 1) Create session

```
POST /api/sessions
```

```bash
curl -i -b cookies.txt -X POST http://localhost:4000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"title":"My first chat","selectedDocIds":[]}'
```

**Success `201`**

```json
{
  "session": {
    "id": "67c8d365ccf5dc4e037f43d1",
    "title": "My first chat",
    "selectedDocIds": [],
    "createdAt": "2026-03-06T12:10:00.000Z",
    "updatedAt": "2026-03-06T12:10:00.000Z"
  }
}
```

---

### 2) List sessions

```
GET /api/sessions
```

```bash
curl -i -b cookies.txt http://localhost:4000/api/sessions
```

**Success `200`**

```json
{
  "sessions": [
    {
      "id": "67c8d365ccf5dc4e037f43d1",
      "title": "My first chat",
      "selectedDocIds": [],
      "createdAt": "2026-03-06T12:10:00.000Z",
      "updatedAt": "2026-03-06T12:11:12.000Z"
    }
  ]
}
```

---

### 3) Get session details

```
GET /api/sessions/:sessionId
```

```bash
curl -i -b cookies.txt http://localhost:4000/api/sessions/<sessionId>
```

---

### 4) Update session

```
PATCH /api/sessions/:sessionId
```

```bash
curl -i -b cookies.txt -X PATCH http://localhost:4000/api/sessions/<sessionId> \
  -H "Content-Type: application/json" \
  -d '{"title":"Renamed chat","selectedDocIds":[]}'
```

---

### 5) Delete session (cascade deletes messages)

```
DELETE /api/sessions/:sessionId
```

```bash
curl -i -b cookies.txt -X DELETE http://localhost:4000/api/sessions/<sessionId>
```

**Success `200`**

```json
{ "ok": true }
```

---

## Messages

### 1) Write message

```
POST /api/sessions/:sessionId/messages
```

```bash
curl -i -b cookies.txt -X POST http://localhost:4000/api/sessions/<sessionId>/messages \
  -H "Content-Type: application/json" \
  -d '{"role":"user","content":"Hello, DocVault"}'
```

**Success `201`**

```json
{
  "message": {
    "id": "67c8d3a9ccf5dc4e037f43d5",
    "role": "user",
    "content": "Hello, DocVault",
    "createdAt": "2026-03-06T12:11:12.000Z"
  }
}
```

---

### 2) Fetch last N messages

```
GET /api/sessions/:sessionId/messages?limit=20
```

```bash
curl -i -b cookies.txt "http://localhost:4000/api/sessions/<sessionId>/messages?limit=20"
```

**Success `200`**

```json
{
  "messages": [
    {
      "id": "67c8d3a9ccf5dc4e037f43d5",
      "role": "user",
      "content": "Hello, DocVault",
      "createdAt": "2026-03-06T12:11:12.000Z"
    }
  ]
}
```

Messages are returned in chronological order (`oldest -> newest`) for UI rendering convenience.

---

## Validation and Errors

| Code | Reason |
|------|--------|
| 400 | Invalid ObjectId in path/body |
| 400 | Invalid role (must be `user`, `assistant`, or `system`) |
| 400 | Empty message content |
| 400 | Invalid `limit` values are clamped to `1..100`; default is `20` |
| 401 | Not authenticated |
| 404 | Session not found or not owned by caller |
| 404 | One or more selected documents not found or not owned by caller |

---

## Required Verification Flow

Assume `cookies.txt` exists from login.

```bash
# 1) Create session
curl -i -b cookies.txt -X POST http://localhost:4000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"title":"My first chat","selectedDocIds":[]}'

# 2) List sessions
curl -i -b cookies.txt http://localhost:4000/api/sessions

# 3) Write message
curl -i -b cookies.txt -X POST http://localhost:4000/api/sessions/<sessionId>/messages \
  -H "Content-Type: application/json" \
  -d '{"role":"user","content":"Hello, DocVault"}'

# 4) Fetch last N messages
curl -i -b cookies.txt "http://localhost:4000/api/sessions/<sessionId>/messages?limit=20"
```
