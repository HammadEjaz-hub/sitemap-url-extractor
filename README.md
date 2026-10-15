# Sitemap URL Extractor

A free, production-ready SEO tool website that extracts every URL from any public
XML sitemap. Paste a sitemap URL — or just a domain — and get an interactive
dashboard with statistics, duplicate detection, URL structure analysis, and
one-click TXT/CSV export.

**Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + Framer Motion +
lucide-react on the frontend; Python FastAPI + httpx + defusedxml on the backend.
No database, no accounts, no paid APIs.

---

## Features

- **Real extraction** — standard sitemaps, sitemap indexes (recursive, nested),
  gzip-compressed (`.xml.gz`) sitemaps, WordPress / Shopify / custom namespaces.
  Zero mock data.
- **Domain discovery** — enter a bare domain and the tool checks `robots.txt`
  `Sitemap:` declarations, then `/sitemap.xml` and `/sitemap_index.xml`.
- **Results dashboard** — stat cards (total / unique / duplicates / sitemaps
  processed / lastmod coverage), interactive table (search, filter by source
  sitemap, sort, pagination, row selection, per-row copy & open), exports
  (copy all/selected, TXT, CSV, unique-only, metadata CSV with UTF-8 BOM).
- **Analysis** — duplicate URL report, HTTP vs HTTPS, query params, trailing
  slashes, path-depth distribution, common path prefixes, sitemap structure
  viewer, issue detection (invalid XML, empty sitemaps, broken references,
  limits reached).
- **Hardened backend** — SSRF protection (scheme allow-list, DNS resolution +
  IP validation per redirect hop, private/loopback/link-local/reserved ranges
  blocked, cloud metadata endpoints always blocked), XML bomb protection via
  defusedxml, response & decompression size caps, sitemap/URL/depth caps,
  request timeouts, per-IP rate limiting, concurrency limits, safe error
  messages.
- **SEO-ready frontend** — semantic HTML, JSON-LD (SoftwareApplication +
  FAQPage), OG/Twitter tags, canonical, `sitemap.xml`, `robots.txt`,
  responsive + accessible (keyboard nav, focus rings, reduced-motion support).

---

## Project structure

```
sitemap-url-extractor/
├── backend/
│   ├── app/
│   │   ├── __init__.py      # proxy-env sanitizer (see note below)
│   │   ├── main.py          # FastAPI app, CORS, rate limiting, routes
│   │   ├── extractor.py     # fetch / parse / analyze logic
│   │   ├── security.py      # SSRF protection
│   │   └── models.py        # Pydantic schemas
│   ├── tests/
│   │   ├── conftest.py      # local fixture HTTP server
│   │   ├── test_security.py # SSRF unit tests (no network)
│   │   └── test_extractor.py# extraction tests incl. API tests
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/                 # layout, page, privacy, terms, sitemap.ts, robots.ts
│   ├── components/          # Navbar, Hero, ExtractorTool, ResultsDashboard, ...
│   ├── lib/                 # api.ts, export.ts, cn.ts
│   ├── package.json
│   └── .env.example
└── README.md
```

---

## Local development

### Backend (Linux / macOS)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # optional; defaults work for local dev
uvicorn app.main:app --reload --port 8000
```

API: `http://localhost:8000` · health: `http://localhost:8000/api/health` ·
docs: `http://localhost:8000/docs`

### Backend (Windows 11)

```powershell
cd backend
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env   # optional
uvicorn app.main:app --reload --port 8000
```

(If PowerShell blocks the activation script: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`)

### Frontend (any OS)

```bash
cd frontend
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL to your backend URL
npm run dev
```

Site: `http://localhost:3000`. Production build check: `npm run build`.

### Quick smoke test (backend running)

```bash
curl -X POST http://localhost:8000/api/extract \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.sitemaps.org/sitemap.xml"}'
```

### Run the test suite

```bash
cd backend
source .venv/bin/activate   # or .venv\Scripts\Activate.ps1 on Windows
python -m pytest tests/ -q
```

---

## Environment variables

### Backend

| Variable | Default | Purpose |
|---|---|---|
| `FRONTEND_ORIGIN` | `http://localhost:3000` | CORS allow-list (comma-separated) |
| `RATE_LIMIT_PER_MINUTE` | `30` | Per-IP request cap on `/api/extract` |
| `MAX_CONCURRENT_EXTRACTIONS` | `4` | Concurrent extraction semaphore |
| `MAX_SITEMAPS` | `500` | Max sitemap files per extraction |
| `MAX_URLS` | `100000` | Max URL entries per extraction |
| `MAX_SITEMAP_DEPTH` | `5` | Max sitemap-index recursion depth |
| `MAX_RESPONSE_BYTES` | `10485760` | Max download size per file (10 MB) |
| `MAX_DECOMPRESSED_BYTES` | `52428800` | Gunzip bomb cap (50 MB) |
| `ALLOW_PRIVATE_HOSTS` | `false` | **TEST ONLY** — never enable in production |
| `DISABLE_RATE_LIMIT` | `false` | **TEST ONLY** |

### Frontend

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL (no trailing slash) |
| `NEXT_PUBLIC_SITE_URL` | Public site URL (canonical, sitemap.xml, OG tags) |

---

## Production deployment

> The Next.js frontend and the FastAPI backend deploy as two separate
> services. This project does **not** run on classic shared hosting —
> it needs a Node host (frontend) and a Python host (backend).

### Backend → Render (recommended)

1. Push this repo to GitHub.
2. Render Dashboard → **New → Web Service** → select the repo.
3. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance:** Free tier works for light use.
4. Environment variables:
   - `FRONTEND_ORIGIN` = your Vercel URL (e.g. `https://sitemap-url-extractor.vercel.app`)
   - `ALLOW_PRIVATE_HOSTS` = `false` (default; leave unset)
   - `RATE_LIMIT_PER_MINUTE` = `30`
5. Deploy. Note the service URL, e.g. `https://sitemap-extractor-api.onrender.com`.
   (Free-tier Render services sleep when idle — the first request may take ~30s.)

### Backend → Railway (alternative)

1. New Project → Deploy from GitHub repo.
2. Add a service with **Root Directory** `backend`.
3. Railway auto-detects Python; set the start command to
   `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
4. Add the same environment variables as above (`FRONTEND_ORIGIN`, etc.).

### Frontend → Vercel

1. Vercel Dashboard → **Add New → Project** → import the repo.
2. **Root Directory:** `frontend` (Framework Preset: Next.js is auto-detected).
3. Environment variables:
   - `NEXT_PUBLIC_API_URL` = your backend URL from above (no trailing slash)
   - `NEXT_PUBLIC_SITE_URL` = your production domain (e.g. `https://yourdomain.com`)
4. Deploy. Then go back to the backend service and set `FRONTEND_ORIGIN` to
   the Vercel URL so CORS allows the frontend.

### Post-deploy checklist

- [ ] `GET /api/health` returns `{"status":"ok"}` on the backend URL.
- [ ] Frontend loads and an extraction of `https://www.sitemaps.org/sitemap.xml`
      returns results.
- [ ] `ALLOW_PRIVATE_HOSTS` is **not** set to `true` anywhere in production.
- [ ] `FRONTEND_ORIGIN` exactly matches the production frontend origin.

---

## Security notes

- Every fetched URL (initial, `robots.txt` probes, redirect targets, child
  sitemap references) is validated: http/https only, no credentials, hostname
  resolved and **every** resolved IP checked against private/loopback/
  link-local/multicast/reserved/unspecified ranges.
- Cloud metadata endpoints (`169.254.169.254`, `100.100.100.200`) are blocked
  unconditionally, even in test mode.
- Redirects are followed manually (max 5) with each hop re-validated.
- XML parsing uses `defusedxml` (entities forbidden → no billion-laughs).
- Known limitation: validation happens per request/hop, so a hostile DNS that
  changes answers between validation and connection (DNS rebinding TOCTOU) is
  narrowed but not fully eliminated — acceptable for this threat model.
- A fresh HTTP client is used per fetch: shared connection pools were observed
  to hang on reuse behind certain egress proxies; extraction is sequential, so
  pooling buys nothing here.
- `app/__init__.py` strips `no_proxy` entries that crash httpx's parser
  (bracketed IPv6 literals) — defensive, no behavior change otherwise.

## Known limitations / deliberate deviations

- The footer has no "Contact" link: the spec asked for one, but inventing a
  contact address would be fake company information. Privacy Policy and Terms
  pages are real and accurate (no registration, no permanent storage of
  submitted URLs).
- No testimonials, usage statistics, or company details anywhere — per spec.
- Test-suite SSRF tests run with `ALLOW_PRIVATE_HOSTS=true` plus per-test
  overrides; the flag is test-only and documented as such.
