"""FastAPI application: sitemap extraction API."""
from __future__ import annotations

import asyncio
import os
import time
from collections import deque

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .extractor import FetchError, SitemapNotFoundError, extract_sitemap
from .models import ExtractRequest
from .security import SSRFError

app = FastAPI(title="Sitemap URL Extractor API", version="1.0.0")


def _origins() -> list[str]:
    raw = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
    return [o.strip() for o in raw.split(",") if o.strip()]


app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins(),
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
    max_age=600,
)


# ---- rate limiting (in-memory sliding window, per client IP) ------------
RATE_LIMIT = int(os.getenv("RATE_LIMIT_PER_MINUTE", "30"))
_DISABLE_RL = os.getenv("DISABLE_RATE_LIMIT", "false").strip().lower() == "true"
_hits: dict[str, deque[float]] = {}


@app.middleware("http")
async def _rate_limit(request: Request, call_next):
    if _DISABLE_RL or request.url.path != "/api/extract":
        return await call_next(request)
    ip = request.client.host if request.client else "unknown"
    now = time.monotonic()
    dq = _hits.setdefault(ip, deque())
    while dq and now - dq[0] > 60:
        dq.popleft()
    if len(dq) >= RATE_LIMIT:
        return JSONResponse(
            {"detail": "Rate limit exceeded. Please try again in a minute."},
            status_code=429,
            headers={"Retry-After": "60"},
        )
    dq.append(now)
    return await call_next(request)


_extract_sem = asyncio.Semaphore(int(os.getenv("MAX_CONCURRENT_EXTRACTIONS", "4")))


@app.get("/")
async def root():
    return {"service": "sitemap-url-extractor", "status": "ok"}


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.post("/api/extract")
async def extract(req: ExtractRequest):
    url = (req.url or "").strip()
    if not url:
        raise HTTPException(status_code=400, detail="Please enter a sitemap URL or domain.")
    try:
        async with _extract_sem:
            return await extract_sitemap(url)
    except SSRFError:
        raise HTTPException(status_code=400, detail="URL target is not allowed.")
    except (FetchError, SitemapNotFoundError) as exc:
        # Messages from the extractor are pre-sanitized.
        raise HTTPException(status_code=502, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.exception_handler(Exception)
async def _unhandled(request: Request, exc: Exception):  # noqa: ARG001
    return JSONResponse(
        {"detail": "An unexpected error occurred."}, status_code=500
    )
