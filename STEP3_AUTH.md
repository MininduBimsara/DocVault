# DocVault — Step 3: Express Auth

## Overview

JWT auth stored in an **HttpOnly cookie**. bcrypt password hashing. Multi-user from day 1.
No upload logic, no RAG calls, no sessions/chat endpoints.

---

## What Changed

| Status  | File                                              | Notes                                                                                              |
| ------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **MOD** | `docvault-api/src/config/env.ts`                  | `JWT_SECRET`, `FRONTEND_ORIGIN` now required; `JWT_EXPIRES_IN`, `COOKIE_NAME`, `NODE_ENV` optional |
| **MOD** | `docvault-api/.env`                               | Added all new auth vars                                                                            |
| **MOD** | `docvault-api/.env.example`                       | Mirrored                                                                                           |
| **NEW** | `docvault-api/src/types/express.d.ts`             | Augments `req.user: SafeUser` globally                                                             |
| **NEW** | `docvault-api/src/utils/password.ts`              | `hashPassword()` / `verifyPassword()` — bcrypt 12 rounds                                           |
| **NEW** | `docvault-api/src/utils/jwt.ts`                   | `signToken()` / `verifyToken()`                                                                    |
| **NEW** | `docvault-api/src/middleware/auth.middleware.ts`  | `requireAuth` — reads cookie, verifies JWT, loads user from DB                                     |
| **NEW** | `docvault-api/src/controllers/auth.controller.ts` | `register`, `login`, `logout`, `me`                                                                |
| **NEW** | `docvault-api/src/routes/auth.route.ts`           | `POST /api/auth/register\|login\|logout`, `GET /api/auth/me`                                       |
| **NEW** | `docvault-api/src/routes/protected.route.ts`      | `GET /api/protected/ping` — test protected route                                                   |
| **MOD** | `docvault-api/src/app.ts`                         | `cookieParser()`, credentialed CORS, `/api` route mounts                                           |
| **NEW** | `docvault-api/src/docs/auth.md`                   | Full API reference + curl verification flow                                                        |

### Dependencies Added

```bash
npm install bcryptjs cookie-parser jsonwebtoken
npm install -D @types/bcryptjs @types/cookie-parser @types/jsonwebtoken
```

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

## Cookie Settings

| Setting    | Value                                             |
| ---------- | ------------------------------------------------- |
| `httpOnly` | `true` always                                     |
| `sameSite` | `"lax"`                                           |
| `secure`   | `false` in dev, `true` when `NODE_ENV=production` |
| `path`     | `/`                                               |
| `maxAge`   | 7 days                                            |

> **`sameSite: "lax"`** — browsers treat all `localhost` ports as same-site, so frontend on `:3001` and API on `:4000` work fine in dev. In production both live under the same apex domain, so `"lax"` remains correct and is more secure than `"none"`.

---

## Security Decisions

| Decision                      | Rationale                                                                     |
| ----------------------------- | ----------------------------------------------------------------------------- |
| HttpOnly cookie               | JavaScript can't read the token — mitigates XSS token theft                   |
| Generic 401 on login fail     | Same message for "not found" and "wrong password" — prevents user enumeration |
| DB roundtrip in `requireAuth` | Catches accounts deleted after token was issued                               |
| `password` never in responses | `safeUser()` helper omits it; `requireAuth` uses `.select("-password")`       |

---

## Environment Variables

| Variable          | Required | Default          | Description                   |
| ----------------- | -------- | ---------------- | ----------------------------- |
| `JWT_SECRET`      | ✅       | —                | Long random string            |
| `JWT_EXPIRES_IN`  | —        | `7d`             | Token TTL                     |
| `COOKIE_NAME`     | —        | `docvault_token` | Cookie key name               |
| `FRONTEND_ORIGIN` | ✅       | —                | CORS allowed origin           |
| `NODE_ENV`        | —        | `development`    | Controls `secure` cookie flag |

---

## Verification

Full curl flow in [`docvault-api/src/docs/auth.md`](docvault-api/src/docs/auth.md).

Quick sequence:

```bash
# Register
curl -i -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123"}'

# Login (save cookie)
curl -i -c cookies.txt -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123"}'

# /me
curl -i -b cookies.txt http://localhost:4000/api/auth/me

# Protected route
curl -i -b cookies.txt http://localhost:4000/api/protected/ping

# Logout
curl -i -b cookies.txt -c cookies.txt -X POST http://localhost:4000/api/auth/logout
```

---

## What's NOT in This Step

- ❌ Document upload / file handling
- ❌ Sessions / chat endpoints
- ❌ RAG pipeline calls
- ❌ Refresh tokens

---

## Next Steps (Step 4 Onwards)

- Document upload endpoint (store file, create `documents` record, trigger RAG)
- Session management routes (create, list, delete sessions)
- Chat endpoints (send message, stream assistant reply)
- Wire FastAPI RAG service from `docvault-api`
