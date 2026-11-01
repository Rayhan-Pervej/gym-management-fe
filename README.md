# GymFlow (frontend)

Gym management for small and mid-size gyms in Bangladesh. Members, plans, renewals, payments and dues, SMS reminders, check-in, personal training, a small shop, and multi-branch reporting. Works in Bangla and English, in dark and light mode, on desktop and phone.

> "GymFlow" is a working name. The product name is not final.

This repo is the web app. The API lives in the sibling repo `gym-management-be` (Django 5.2 + Django REST Framework). Its `documents/` folder is the source of truth for business rules and the API contract.

## Quick start

Requirements: Node 20 or newer, and the backend running on `http://localhost:8000`.

```bash
npm install            # use --legacy-peer-deps if npm reports a peer conflict
cp .env.example .env   # VITE_API_URL=http://localhost:8000/api/v1
npm run dev            # http://localhost:3000
```

The dev server is pinned to **port 3000**. The backend only allows that origin in CORS, and it must also allow the `X-Branch-Id` header (`CORS_ALLOW_HEADERS` in the backend settings).

| Script | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check and production build |
| `npm run preview` | Serve the production build |
| `npm run lint` | Oxlint |

### Demo accounts (dev only)

With the backend seeded (`python manage.py seed_demo`), the login page shows one-click demo accounts: owner, manager, two staff and three trainers across two branches. The panel is shown only in dev mode and is removed from production builds. The seed password is defined in the backend's `seed_demo.py`.

The backend rate-limits sign-ins (about 20 per hour per account). If you see "Too many attempts", wait a few minutes.

## What is built

| Area | Highlights |
|---|---|
| Dashboard | Collection (today, month), dues, active and expiring members, shop sales, SMS credits, 12-month chart |
| Members | Search and filters, profile, memberships and renewals, archive, CSV import with dry-run preview |
| Plans | Monthly, quarterly, yearly and personal-training plans, copy a plan to other branches |
| Payments | Cash, bKash, Nagad, Rocket, card, bank. Part payments, void with reason, shareable receipt link, CSV export |
| Discounts | Percent or amount with a required reason, with a live "member pays" preview |
| Check-in | Search and check in, with expiry and dues warnings |
| Personal training | PT packages with a trainer, session log, trainer report |
| Shop | Point of sale, stock, restock and correction, sales history, void, shop report, public receipt page |
| SMS | Reminder rules, templates with preview (Bangla and English), message log, credit balance |
| Branches | Branch switcher, branches page, combined dashboard, collection and dues across branches, move a member between branches |
| Staff | Owner, manager, staff and trainer roles. Managers request staff changes, owners approve or reject |
| Settings | Gym profile, operations, theme, language |
| Public pages | Payment receipt at `/r/:token` and shop receipt at `/s/:token` |

### Roles and permissions

The UI never checks a role name. It checks the **capabilities** list returned by `GET /auth/me` (for example `payments.void`, `reports.view`, `staff.manage`).

- Navigation, routes and buttons are shown or hidden with `useCan` / `useCanAny` and the `RequireCap` route guard.
- Trainers get a reduced member view with no money fields.
- Adding a role later needs no frontend change, only the backend capability table.

### Branches

Every request carries `X-Branch-Id`. After sign-in the app picks the first open branch, and the switcher in the header changes it and refreshes the data. A user with one branch never sees the switcher.

## Tech stack

React 19, TypeScript, Vite, Tailwind CSS 4, React Router, TanStack Query, Zustand, react-hook-form with zod, i18next, Radix UI (dialog, dropdown), lucide-react icons, sonner toasts.

## Project structure

```
src/
  app/        router, route guards, providers, app layout, navigation
  core/       API client, auth store, i18n, theme, config
  shared/     ui kit, hooks, lib (formatting, errors, csv, share), common components
  features/   one folder per area: api/ (React Query hooks), components/, pages/
  locales/    en.json, bn.json
  index.css   design tokens (light and dark), global rules
```

Conventions:

- **Feature folders.** Data hooks live in `features/<name>/api`, screens in `pages`, reusable pieces in `components`. Features import from `shared` and `core`, not from each other's pages.
- **API layer.** `core/api/client.ts` is a small fetch wrapper: bearer token, single-flight refresh on 401, `Accept-Language`, `X-Branch-Id`, and the backend's error shape (`ApiError` with `code`, `message`, `details`).
- **Money** is integer minor units everywhere (`*_minor`). Format with `useFmt().money`, which uses the gym currency and South Asian digit grouping.
- **Dates** are gym-local `YYYY-MM-DD` strings. Instants are shown in the gym timezone.
- **Errors.** `errorMessage(e)` maps backend error codes to translated text (`errors.<code>`), falling back to the server message. Rate limits show a wait time.
- **Idempotency.** Payment and sale requests send a `client_request_id`, so a retry never double-charges.
- **Code style.** Short components, few comments, one shared UI kit. Keep new code in the same style.

## Languages

All text is in `src/locales/en.json` and `src/locales/bn.json`. Add every new key to both files. The default language is Bangla and the choice is remembered.

Bangla notes: the font is Noto Sans Bengali (Latin text keeps Plus Jakarta Sans), and letter-spacing is reset to normal for Bangla because tight tracking breaks conjunct letters. The Bangla wording was written without a native review, so have it checked before a public launch.

## Theming

Colors are CSS variables in `src/index.css` (`:root` for light, `.dark` for dark) exposed to Tailwind as tokens such as `bg-surface`, `text-muted`, `border-border`. Change the palette in one place. The theme (light, dark, system) is a shared store in `core/theme`, applied before first paint to avoid a flash.

## Demo material

The `screenshots/` folder holds marketing screenshots, a demo video, its script and subtitles. They are not part of the app and are not needed to run it.

The demo video uses the track "Funkorama" by Kevin MacLeod (incompetech.com), licensed under Creative Commons: By Attribution 4.0 (https://creativecommons.org/licenses/by/4.0/). Keep that credit anywhere the video is shared.

## Status and known gaps

- SMS reminders are built end to end, but the backend uses a test provider. A live SMS gateway is not connected yet.
- Not built yet: installable app (PWA), member photo and gym logo upload, WhatsApp reminders, online payments, expenses and profit reports, QR check-in, membership freeze, member self-service page.
- There are no automated frontend tests yet. `npm run build` (type-check) must pass before merging.
- The app has only been checked against the seeded demo data.
