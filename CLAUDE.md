# Bill Splitter - Project Guide

## Overview
CS-320 group project: a bill-splitting web app. Django REST backend + Next.js frontend.

## Architecture
- **Backend**: Django 6.0.2 + DRF, in project root (`bill_splitter/` config, `core/` app)
- **Frontend**: Next.js 16 + React 19 + Tailwind v4 + Shadcn UI, in `frontend/`
- **Database**: PostgreSQL on Supabase (requires `DATABASE_PASSWORD` env var)
- **Auth**: Session-based with CSRF-exempt DRF authentication

## Running Locally
Both servers must run simultaneously in separate terminals:

```bash
# Backend (port 8000)
export DATABASE_PASSWORD="<password>"
python manage.py runserver

# Frontend (port 3000)
cd frontend
npm run dev
```

CORS is configured for localhost:3000 <-> localhost:8000. The frontend API base URL defaults to `http://localhost:8000` (override with `NEXT_PUBLIC_API_URL`).

## Django Models (core/models.py)
- **User** - Custom user (email, display_name, profile_picture). `AUTH_USER_MODEL = 'core.User'`
- **Household** - Groups of users. M2M with User via `members`
- **Bill** - Expense within a household, linked to user_owed
- **Debt** - Amount one user owes another for a bill, tracks `is_resolved`
- **Payment** - Payment against a debt, auto-updates debt resolved status

## API Endpoints (bill_splitter/urls.py)
- Auth: `POST /register/`, `POST /login/`, `POST /logout/`, `GET /me/`
- Households: `/households/` (list/create), `/households/<pk>/` (detail), `/households/<pk>/leave/`, `/households/<pk>/summary/`
- Bills: `/bills/list/<household_id>/`, `/bills/create/<household_id>/`

## Frontend Structure (frontend/)
- `src/app/` - Next.js App Router pages
- `src/components/` - React components (Shadcn UI based)
- `src/services/` - API client (`api.ts`, `auth.ts`, `groups.ts`, `bills.ts`)
- `src/context/` - React context for state management
- `src/hooks/` - Custom React hooks
- `src/types/` - TypeScript type definitions

## Key Notes
- Custom user model uses email as USERNAME_FIELD
- Seed data command exists at `core/management/commands/seed_data.py`
- No Docker setup; local dev only
- `django-cors-headers` handles CORS
- Frontend uses `@/*` path alias mapping to `./src/*`
