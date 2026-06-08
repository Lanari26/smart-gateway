# SmartPay Gateway

A payment-gateway console: a marketing landing page, a hosted checkout, and a
full merchant **console** (dashboard, projects, billing, developers, invoices,
admin) backed by a real REST API.

- **Frontend** — React 19 + Vite + Tailwind, served by a small Express host.
- **Backend** — Express + Prisma + PostgreSQL with JWT auth.
- **Deploy** — Docker Compose, fronted by CloudPanel/Nginx on two domains:
  - `https://pay.lanari.rw` → frontend
  - `https://api-pay.lanari.rw` → backend API

```
smartpay-gateway/
├── src/                  # frontend (React)
│   └── lib/              # API client (api.ts, endpoints.ts)
├── server.ts             # Express host for the frontend + AI sandbox
├── backend/              # REST API (Express + Prisma + Postgres)
│   ├── src/
│   │   ├── modules/      # auth, transactions, plans, subscriptions,
│   │   │                 #   api-keys, whitelist, invoices, dashboard, health
│   │   ├── middleware/   # auth, validate, error
│   │   └── lib/          # prisma, http-error, password, format
│   └── prisma/           # schema.prisma + seed.ts
├── Dockerfile            # frontend image
├── docker-compose.yml        # local development
└── docker-compose.prod.yml   # production (CloudPanel-fronted)
```

## Quick start (Docker)

```bash
cp .env.example .env          # then edit secrets
docker compose up --build
```

- Frontend → http://localhost:3000
- API      → http://localhost:4000/api/health
- Postgres → localhost:5432

The backend auto-applies the schema (`prisma db push`) and seeds demo data on
boot. **Demo login:** `merchant@smartpay.rw` / `SmartPay#2026`.

## Manual dev (without Docker)

```bash
# backend
cd backend
cp .env.example .env          # set DATABASE_URL to a local Postgres
npm install
npm run prisma:generate
npm run db:seed
npm run dev                   # :4000

# frontend (new shell, repo root)
npm install
echo "VITE_API_BASE_URL=http://localhost:4000/api" > .env
npm run dev                   # :3000
```

## API

All routes are under `/api`. Everything except `/health` and `/auth/*`
requires a `Bearer` access token.

| Method | Path                          | Purpose                          |
|--------|-------------------------------|----------------------------------|
| GET    | `/health`, `/health/ready`    | Liveness / readiness             |
| POST   | `/auth/register`              | Create a merchant account        |
| POST   | `/auth/login`                 | Sign in (email **or** phone)     |
| POST   | `/auth/refresh` `/auth/logout`| Token rotation / revoke          |
| GET    | `/auth/me`                    | Current merchant                 |
| GET/POST | `/transactions`             | List / create a charge           |
| POST   | `/transactions/:id/refund`    | Refund a charge                  |
| GET/POST/DELETE | `/plans`             | Billing plans                    |
| GET/POST | `/subscriptions`            | Subscriptions (+ `/:id/cancel`)  |
| GET/POST/DELETE | `/api-keys`          | Developer API keys               |
| GET/POST/DELETE | `/whitelist`         | Whitelisted IPs                  |
| GET/POST | `/invoices`                 | Invoices (+ `/:id/pay`)          |
| GET    | `/dashboard`                  | Aggregated console metrics       |

## Production deploy (CloudPanel)

1. On the server, clone the repo and create `.env` from `.env.example`.
   Generate real secrets: `openssl rand -hex 32`. Set:
   - `CORS_ORIGIN=https://pay.lanari.rw`
   - `VITE_API_BASE_URL=https://api-pay.lanari.rw/api`
2. Build & run the stack:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```
   This binds the frontend to `127.0.0.1:3000` and the API to `127.0.0.1:4000`.
3. In CloudPanel, create two **Reverse Proxy** sites (TLS via Let's Encrypt):
   - `pay.lanari.rw`     → `http://127.0.0.1:3000`
   - `api-pay.lanari.rw` → `http://127.0.0.1:4000`

DNS: point both `pay` and `api-pay` A records at the server.

## GitHub

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/Lanari26/smart-gateway.git
git push -u origin main
```
