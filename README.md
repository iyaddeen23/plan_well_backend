# Magebooks Accounting — NestJS Backend

REST API for the Magebooks Insurance Brokerage accounting dashboard.  
**Stack:** NestJS · TypeScript · Supabase (PostgreSQL + Auth) · Swagger

---

## Quick Start

### 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Note your **Project URL** and **service_role key** (Settings → API)

### 2. Run the database migration

Open **Supabase Dashboard → SQL Editor** and paste/run the contents of:

```
supabase/migrations/001_initial_schema.sql
```

This creates 6 tables with Row-Level Security enabled:
- `journal_entries`
- `imprest_transactions`
- `production_entries`
- `ar_entries`
- `bank_transactions`
- `tb_adjustments`

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env — fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
```

### 4. Install & run

```bash
npm install
npm run start:dev   # development (hot reload)
npm run start:prod  # production
```

API runs at **http://localhost:4000/api/v1**  
Swagger docs at **http://localhost:4000/api/docs**

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/signup` | Register a user |
| POST | `/api/v1/auth/signin` | Sign in, get JWT |
| POST | `/api/v1/auth/refresh` | Refresh JWT |
| POST | `/api/v1/auth/signout` | Sign out |
| GET  | `/api/v1/auth/me` | Current user profile |
| **Journal** | | |
| GET/POST | `/api/v1/journal` | List / create journal entries |
| GET/PATCH/DELETE | `/api/v1/journal/:id` | Single entry |
| GET | `/api/v1/journal/summary?period=Q1 2026` | Summary stats |
| **Imprest** | | |
| GET/POST | `/api/v1/imprest` | List / create cash book entries |
| GET | `/api/v1/imprest/summary` | Cash flow by category |
| **Production** | | |
| GET/POST | `/api/v1/production` | List / create commission entries |
| GET | `/api/v1/production/summary` | Commission by insurer / product |
| **AR** | | |
| GET/POST | `/api/v1/ar` | List / create receivable entries |
| GET | `/api/v1/ar/summary` | Outstanding balance breakdown |
| **Bank** | | |
| GET/POST | `/api/v1/bank` | List / create bank transactions |
| GET | `/api/v1/bank/reconciliation` | Reconciliation summary |
| **Trial Balance** | | |
| GET/POST | `/api/v1/trial-balance` | List / create TB adjustments |
| GET | `/api/v1/trial-balance/balance-check` | Debit/credit balance check |
| **Financials** (read-only) | | |
| GET | `/api/v1/financials/periods` | Available period keys |
| GET | `/api/v1/financials/period/:p` | Full computed data for q1/q2/q3/q4/fy/6y/6ytd |
| GET | `/api/v1/financials/insurers` | Insurer commission table |
| GET | `/api/v1/financials/expenses?period=fy` | Expense breakdown |

All endpoints except `/auth/signup` and `/auth/signin` require:
```
Authorization: Bearer <access_token>
```

---

## Authentication Flow

```
POST /auth/signup   →  create user
POST /auth/signin   →  { accessToken, refreshToken, expiresIn, user }
# Include in every request:
Authorization: Bearer <accessToken>
# When token expires:
POST /auth/refresh  →  { accessToken, refreshToken }
```

Supabase Auth tokens expire after 1 hour by default.

---

## Connecting the Frontend

Add to your Next.js frontend `lib/api.js`:

```js
const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export async function apiGet(path, token) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function apiPost(path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return res.json();
}
```

Then in `Dashboard.jsx`, replace the local `handleSave` to call `POST /api/v1/{type}` and replace `INITIAL_DB` loading to call `GET /api/v1/{type}`.

---

## Project Structure

```
src/
├── supabase/          # Supabase client (global module)
│   ├── supabase.module.ts
│   ├── supabase.service.ts
│   └── database.types.ts
├── auth/              # Supabase Auth + JWT guard
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── dto/auth.dto.ts
│   └── guards/jwt.guard.ts
├── journal/           # Journal entries CRUD
├── imprest/           # Imprest cash book CRUD
├── production/        # Commission by insurer CRUD
├── ar/                # Accounts receivable CRUD
├── bank/              # Bank transactions CRUD
├── trial-balance/     # Trial balance adjustments CRUD
├── financials/        # Read-only computed financial data
├── app.module.ts
└── main.ts

supabase/
└── migrations/
    └── 001_initial_schema.sql   ← Run this in Supabase SQL Editor
```
