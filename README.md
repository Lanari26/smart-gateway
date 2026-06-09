# SmartPay Gateway

A payment-gateway console: a marketing landing page, a hosted checkout, and a
full merchant **console** (dashboard, projects, billing, developers, invoices,
admin) backed by a real REST API.

Payments are processed live through the **ITECpay** gateway
(`https://pay.itecpay.rw`): a Mobile Money charge is requested, then its status
is polled automatically until it settles **SUCCESSFUL** or **FAILED**. Card
payments are handled via a hosted payment link. See `Credentials.md` for the
upstream API contract.

- **Frontend** — React 19 + Vite + Tailwind, served by a small Express host.
- **Backend** — Express + Prisma + PostgreSQL with JWT auth.
- **Deploy** — Docker Compose, fronted by CloudPanel/Nginx on two domains:
  - `https://pay.lanari.rw` → frontend
  - `https://api-pay.lanari.rw` → backend API

```
smartpay-gateway/
├── src/                  # frontend (React)
│   └── lib/              # API client (api.ts, endpoints.ts)
├── server.ts             # Express host for the frontend
├── backend/              # REST API (Express + Prisma + Postgres)
│   ├── src/
│   │   ├── modules/      # auth, transactions, payments (ITECpay), plans,
│   │   │                 #   subscriptions, api-keys, whitelist, invoices,
│   │   │                 #   dashboard, health
│   │   ├── middleware/   # auth, validate, error
│   │   └── lib/          # prisma, http-error, password, format
│   ├── scripts/          # live-test.mjs — end-to-end gateway test
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
| POST   | `/payments/momo`              | Request a Mobile Money charge *(API key)* |
| GET    | `/payments/:reference/status` | Poll a charge (live verify) *(public)* |
| POST   | `/payments/card`              | Generate a hosted card link *(API key)* |
| GET/POST/DELETE | `/plans`             | Billing plans                    |
| GET/POST | `/subscriptions`            | Subscriptions (+ `/:id/cancel`)  |
| GET/POST/DELETE | `/api-keys`          | Developer API keys               |
| GET/POST/DELETE | `/whitelist`         | Whitelisted IPs                  |
| GET/POST | `/invoices`                 | Invoices (+ `/:id/pay`)          |
| GET    | `/dashboard`                  | Aggregated console metrics       |

## Payments (ITECpay)

The backend ships with the project's registered provider keys as defaults, so
checkout works out of the box. Override per-environment via env vars (root
`.env` for Docker, `backend/.env` for local):

```
ITECPAY_BASE_URL=https://pay.itecpay.rw
ITECPAY_KEY_MTN=...
ITECPAY_KEY_AIRTEL=...        # network auto-detected from the phone (072/073 → Airtel)
ITECPAY_KEY_CARD=...
ITECPAY_POLL_INTERVAL_MS=4000 # status-poll cadence
ITECPAY_POLL_MAX_ATTEMPTS=45  # give up after ~3 min (charge stays PENDING)
```

**Auth & attribution:** `POST /payments/momo` and `/payments/card` require an
API key sent as the `X-API-Key` header (server integrations use a **SECRET**
`sk_…` key; the hosted checkout uses a **PUBLIC**/publishable `pk_…` key passed
in the checkout link, e.g. `pay.lanari.rw/?screen=checkout&key=pk_…`). The key
resolves to its merchant, and every transaction is stamped with that merchant —
so in the console a **MERCHANT sees only its own** transactions/metrics while an
**ADMIN sees all**. Keys are minted in the Developers tab. Status polling stays
public (keyed only by the opaque transaction reference).

**Flow:** `POST /payments/momo` requests the charge and returns a `pending`
transaction. The backend then polls ITECpay's verify endpoint until the charge
settles; the frontend (and any client) also polls `GET /payments/:reference/status`,
which performs a live verify and persists the result — so the status converges
to `paid`/`failed` from either side.

### Live test

`backend/scripts/live-test.mjs` runs the full request→poll→settle lifecycle
against live services (no mocks). Run it **on the server**:

```bash
# Through our deployed API (needs an API key — mint one in the Developers tab):
node backend/scripts/live-test.mjs --phone 0788000000 --amount 100 --key sk_test_xxx

# Straight against ITECpay (validates keys + request body in isolation, no key):
node backend/scripts/live-test.mjs --mode direct --phone 0788000000 --amount 100
```

Approve the Mobile Money prompt on the handset; the script exits `0` only when
the status reaches **SUCCESSFUL**. Each backend deploy also runs non-charging
live checks (validation, 404, and a real ITECpay card-link generation) as part
of the CI smoke test.

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
