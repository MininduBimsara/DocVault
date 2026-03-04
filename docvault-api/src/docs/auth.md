# DocVault API — Auth Reference

## Overview

JWT issued on login/register and stored as an **HttpOnly cookie**. The cookie is opaque to JavaScript — no `localStorage`, no bearer header needed.

### Cookie settings

| Setting    | Value                                             |
| ---------- | ------------------------------------------------- |
| `httpOnly` | `true` always                                     |
| `sameSite` | `"lax"` — works for same-site dev & production    |
| `secure`   | `false` in dev, `true` when `NODE_ENV=production` |
| `path`     | `/`                                               |
| `maxAge`   | 7 days (matches JWT expiry)                       |

> **Why `sameSite: "lax"`?** Browsers treat all `localhost` ports as same-site, so frontend on `:3001` talking to API on `:4000` works fine. In production, both services live under the same apex domain, so `"lax"` remains correct and more secure than `"none"`.

---

## Endpoints

| Method | Path                  | Auth | Description                     |
| ------ | --------------------- | ---- | ------------------------------- |
| POST   | `/api/auth/register`  | ❌   | Create account + set cookie     |
| POST   | `/api/auth/login`     | ❌   | Verify credentials + set cookie |
| POST   | `/api/auth/logout`    | ✅   | Clear cookie                    |
| GET    | `/api/auth/me`        | ✅   | Return current user             |
| GET    | `/api/protected/ping` | ✅   | Test protected route            |

---

## Request / Response Shapes

### `POST /api/auth/register`

**Request body**

```json
{ "email": "alice@example.com", "password": "Password123" }
```

**201 Created**

```json
{
  "user": {
    "id": "64ab1234ef5678901234abcd",
    "email": "alice@example.com",
    "plan": "FREE",
    "createdAt": "2026-03-03T13:00:00.000Z"
  }
}
```

**Errors**

| Code | Reason                              |
| ---- | ----------------------------------- |
| 400  | Invalid email or password < 8 chars |
| 409  | Email already registered            |

---

### `POST /api/auth/login`

**Request body**

```json
{ "email": "alice@example.com", "password": "Password123" }
```

**200 OK**

```json
{
  "user": {
    "id": "64ab1234ef5678901234abcd",
    "email": "alice@example.com",
    "plan": "FREE",
    "createdAt": "2026-03-03T13:00:00.000Z"
  }
}
```

**Errors**

| Code | Reason                              |
| ---- | ----------------------------------- |
| 400  | Invalid email or password < 8 chars |
| 401  | Invalid email or password (generic) |

> Generic 401 message is intentional — avoids user enumeration.

---

### `POST /api/auth/logout`

No body required.

**200 OK**

```json
{ "ok": true }
```

---

### `GET /api/auth/me`

No body required. Reads cookie automatically.

**200 OK**

```json
{
  "user": {
    "id": "64ab1234ef5678901234abcd",
    "email": "alice@example.com",
    "plan": "FREE"
  }
}
```

**401** if cookie is missing or expired.

---

### `GET /api/protected/ping`

**200 OK**

```json
{
  "ok": true,
  "user": {
    "id": "64ab1234ef5678901234abcd",
    "email": "alice@example.com",
    "plan": "FREE"
  }
}
```

**401** if not authenticated.

---

## Verification (curl)

Run these in order. Make sure `mongod` is running and `npm run dev` is active.

### 1 — Register

```bash
curl -i -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123"}'
```

Expected: `HTTP 201`, body contains `user` object. Response headers include `Set-Cookie: docvault_token=...`.

---

### 2 — Login (save cookie to file)

```bash
curl -i -c cookies.txt -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123"}'
```

Expected: `HTTP 200`, `cookies.txt` now contains the `docvault_token` cookie.

---

### 3 — GET /me (send saved cookie)

```bash
curl -i -b cookies.txt http://localhost:4000/api/auth/me
```

Expected: `HTTP 200`, body contains your user object.

---

### 4 — Protected route

```bash
curl -i -b cookies.txt http://localhost:4000/api/protected/ping
```

Expected: `HTTP 200 { "ok": true, "user": { ... } }`.

---

### 5 — WITHOUT cookie (should 401)

```bash
curl -i http://localhost:4000/api/auth/me
```

Expected: `HTTP 401 { "error": "Not authenticated" }`.

---

### 6 — Logout

```bash
curl -i -b cookies.txt -c cookies.txt -X POST http://localhost:4000/api/auth/logout
```

Expected: `HTTP 200 { "ok": true }`. Response clears the cookie (`Max-Age=0`).

---

### 7 — /me after logout (should 401)

```bash
curl -i -b cookies.txt http://localhost:4000/api/auth/me
```

Expected: `HTTP 401` — cookie was cleared by logout.

---

## Error Response Format

All errors follow the same shape:

```json
{ "error": "<human readable message>" }
```
