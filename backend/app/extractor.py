"""Real sitemap extraction: fetch, parse and analyze XML sitemaps.

Supports standard sitemaps, sitemap indexes (recursive), nested indexes,
gzip-compressed sitemaps and arbitrary XML namespaces. No mock data:
everything returned comes from the fetched documents.
"""
from __future__ import annotations

import gzip
import io
import os
import re
from collections import Counter, deque
from dataclasses import dataclass
from urllib.parse import urlparse, urljoin

import httpx
from defusedxml import ElementTree as DET

from .models import (
    Analysis,
    DuplicateInfo,
    ExtractResponse,
    Issue,
    LimitsInfo,
    SitemapInfo,
    Stats,
    UrlEntry,
)
from .security import SSRFError, normalize_input, validate_url

USER_AGENT = "SitemapUrlExtractor/1.0"
MAX_REDIRECTS = 5


class FetchError(Exception):
    """Upstream fetch failed. Message is always safe to show users."""


class SitemapNotFoundError(FetchError):
    """No sitemap could be discovered for the input."""


class ParseError(Exception):
    """Sitemap XML could not be parsed. Message is always safe to show users."""


@dataclass
class Limits:
    max_sitemaps: int = 500
    max_urls: int = 100_000
    max_depth: int = 5
    max_response_bytes: int = 10 * 1024 * 1024
    max_decompressed_bytes: int = 50 * 1024 * 1024


def default_limits() -> Limits:
    return Limits(
        max_sitemaps=int(os.getenv("MAX_SITEMAPS", "500")),
        max_urls=int(os.getenv("MAX_URLS", "100000")),
        max_depth=int(os.getenv("MAX_SITEMAP_DEPTH", "5")),
        max_response_bytes=int(os.getenv("MAX_RESPONSE_BYTES", str(10 * 1024 * 1024))),
        max_decompressed_bytes=int(
            os.getenv("MAX_DECOMPRESSED_BYTES", str(50 * 1024 * 1024))
        ),
    )


def _timeout() -> httpx.Timeout:
    return httpx.Timeout(connect=10.0, read=30.0, write=10.0, pool=10.0)


async def _fetch_bytes(url: str, limits: Limits) -> tuple[bytes, str]:
    """Fetch *url* with per-hop SSRF validation and redirect handling.

    A fresh HTTP client is used per fetch: shared connection pools have been
    observed to hang on reuse behind certain egress proxies, and sitemap
    extraction is sequential anyway, so pooling buys nothing here.

    Returns (body, final_url). Raises SSRFError (fail closed), FetchError.
    """
    current = validate_url(url)
    async with httpx.AsyncClient(
        timeout=_timeout(),
        follow_redirects=False,
        limits=httpx.Limits(max_connections=10, max_keepalive_connections=0),
    ) as client:
        for _ in range(MAX_REDIRECTS + 1):
            try:
                async with client.stream(
                    "GET",
                    current,
                    headers={"User-Agent": USER_AGENT, "Accept": "text/xml,application/xml,*/*"},
                ) as resp:
                    code = resp.status_code
                    if code in (301, 302, 303, 307, 308):
                        location = resp.headers.get("location")
                        if not location:
                            raise FetchError("The sitemap URL redirected without a target.")
                        # Every redirect hop is re-validated (SSRF fail-closed).
                        current = validate_url(urljoin(current, location))
                        continue
                    if code != 200:
                        raise FetchError(f"The sitemap URL returned HTTP {code}.")
                    body = bytearray()
                    async for chunk in resp.aiter_bytes(65536):
                        body.extend(chunk)
                        if len(body) > limits.max_response_bytes:
                            mb = limits.max_response_bytes // (1024 * 1024)
                            raise FetchError(
                                f"Sitemap exceeds the {mb} MB download limit."
                            )
                    return bytes(body), current
            except httpx.TimeoutException:
                raise FetchError("The request timed out.")
            except httpx.ConnectError:
                raise FetchError("Could not connect to the sitemap host.")
            except httpx.HTTPError:
                raise FetchError("A network error occurred while fetching the sitemap.")
        raise FetchError("Too many redirects while fetching the sitemap.")


def _maybe_decompress(data: bytes, limits: Limits) -> bytes:
    """Decompress gzip bodies (e.g. .xml.gz) with a decompression-bomb cap."""
    if data[:2] != b"\x1f\x8b":
        return data
    out = bytearray()
    total = 0
    try:
        with gzip.GzipFile(fileobj=io.BytesIO(data)) as gz:
            while True:
                chunk = gz.read(65536)
                if not chunk:
                    break
                total += len(chunk)
                if total > limits.max_decompressed_bytes:
                    mb = limits.max_decompressed_bytes // (1024 * 1024)
                    raise FetchError(
                        f"Decompressed sitemap exceeds the {mb} MB limit."
                    )
                out.extend(chunk)
    except (OSError, EOFError):
        raise FetchError("The compressed sitemap data is invalid.")
    return bytes(out)


def _localname(tag: str) -> str:
    return tag.rsplit("}", 1)[-1] if "}" in tag else tag


def parse_sitemap(data: bytes) -> tuple[str, list[tuple[str, str | None]], list[str], int]:
    """Parse sitemap XML.

    Returns (kind, url_entries, child_sitemap_locs, malformed_count) where
    kind is "urlset" or "sitemapindex". Raises ParseError on invalid XML.
    Namespace-agnostic: matches on local element names.
    """
    try:
        root = DET.fromstring(data)
    except DET.ParseError as exc:  # type: ignore[attr-defined]
        raise ParseError(f"The sitemap XML is invalid: {exc}")
    kind = _localname(root.tag)
    if kind == "urlset":
        entries: list[tuple[str, str | None]] = []
        malformed = 0
        for url_el in root:
            if _localname(url_el.tag) != "url":
                continue
            loc: str | None = None
            lastmod: str | None = None
            for child in url_el:
                name = _localname(child.tag)
                if name == "loc" and loc is None:
                    loc = (child.text or "").strip()
                elif name == "lastmod" and lastmod is None:
                    lastmod = (child.text or "").strip() or None
            if not loc:
                malformed += 1
                continue
            parsed = urlparse(loc)
            if parsed.scheme not in ("http", "https") or not parsed.hostname:
                malformed += 1
                continue
            entries.append((loc, lastmod))
        return ("urlset", entries, [], malformed)
    if kind == "sitemapindex":
        locs: list[str] = []
        for sm_el in root:
            if _localname(sm_el.tag) != "sitemap":
                continue
            for child in sm_el:
                if _localname(child.tag) == "loc" and (child.text or "").strip():
                    locs.append((child.text or "").strip())
        return ("sitemapindex", [], locs, 0)
    raise ParseError(f"Unsupported sitemap root element <{kind}>.")


async def _discover(
    normalized: str, limits: Limits, issues: list[Issue]
) -> tuple[str, str, dict[str, tuple[bytes, str]]]:
    """Turn a bare domain into a concrete sitemap URL.

    Returns (start_url, discovered_via, prefetch).
    """
    parsed = urlparse(normalized)
    base = f"{parsed.scheme}://{parsed.netloc}"
    candidates: list[str] = []
    discovered_via = "probe"
    try:
        data, _ = await _fetch_bytes(base + "/robots.txt", limits)
        text = data.decode("utf-8", "replace")
        for match in re.finditer(r"(?im)^\s*Sitemap\s*:\s*(\S+)", text):
            candidates.append(match.group(1).strip())
        if candidates:
            discovered_via = "robots.txt"
    except (FetchError, SSRFError, ValueError):
        issues.append(
            Issue(
                type="discovery",
                severity="warning",
                message="Could not read robots.txt; trying common sitemap locations.",
                sitemap=base + "/robots.txt",
            )
        )
    if not candidates:
        candidates = [base + "/sitemap.xml", base + "/sitemap_index.xml"]
    prefetch: dict[str, tuple[bytes, str]] = {}
    last_err = "no sitemap found"
    for cand in candidates:
        try:
            data, final = await _fetch_bytes(cand, limits)
        except (FetchError, SSRFError, ValueError) as exc:
            last_err = str(exc)
            continue
        prefetch[cand] = (data, final)
        return cand, discovered_via, prefetch
    raise SitemapNotFoundError(
        f"No sitemap discovered for this domain ({last_err})."
    )


async def extract_sitemap(
    raw_url: str, limits: Limits | None = None
) -> ExtractResponse:
    """Extract all URLs from a sitemap URL or bare domain."""
    limits = limits or default_limits()
    normalized = normalize_input(raw_url)
    parsed = urlparse(normalized)

    issues: list[Issue] = []
    sitemap_infos: list[SitemapInfo] = []
    entries: list[UrlEntry] = []
    discovered_via = "direct"
    prefetch: dict[str, tuple[bytes, str]] = {}

    if parsed.path in ("", "/") and not parsed.query and not parsed.fragment:
        start_url, discovered_via, prefetch = await _discover(
            normalized, limits, issues
        )
    else:
        start_url = normalized

    visited: set[str] = set()
    queue: deque[tuple[str, int]] = deque([(start_url, 0)])
    truncated = False
    first_error: str | None = None

    while queue and len(sitemap_infos) < limits.max_sitemaps and not truncated:
        url, depth = queue.popleft()
        if url in visited:
            issues.append(
                Issue(
                    type="circular_reference",
                    severity="warning",
                    message="Sitemap already processed; skipped to avoid a loop.",
                    sitemap=url,
                )
            )
            continue
        visited.add(url)
        try:
            if url in prefetch:
                data, _final = prefetch[url]
            else:
                data, _final = await _fetch_bytes(url, limits)
            data = _maybe_decompress(data, limits)
            kind, url_entries, child_locs, malformed = parse_sitemap(data)
        except SSRFError:
            # Fail closed: a disallowed target aborts the whole extraction.
            raise
        except (FetchError, ParseError) as exc:
            msg = str(exc)
            if first_error is None:
                first_error = msg
            err_type = (
                "fetch_error" if isinstance(exc, FetchError) else "invalid_xml"
            )
            sitemap_infos.append(
                SitemapInfo(url=url, status="error", error=msg)
            )
            issues.append(
                Issue(type=err_type, severity="error", message=msg, sitemap=url)
            )
            continue

        if kind == "sitemapindex":
            sitemap_infos.append(
                SitemapInfo(url=url, status="ok", is_index=True, url_count=0)
            )
            if depth >= limits.max_depth:
                issues.append(
                    Issue(
                        type="max_depth",
                        severity="warning",
                        message=(
                            f"Recursion depth limit ({limits.max_depth}) reached; "
                            "deeper sitemaps were skipped."
                        ),
                        sitemap=url,
                    )
                )
            else:
                for child in child_locs:
                    try:
                        child_url = validate_url(urljoin(url, child))
                    except (SSRFError, ValueError):
                        issues.append(
                            Issue(
                                type="invalid_child",
                                severity="warning",
                                message=(
                                    "Skipped a sitemap reference that is not an "
                                    "allowed http(s) URL."
                                ),
                                sitemap=url,
                            )
                        )
                        continue
                    queue.append((child_url, depth + 1))
        else:
            if malformed:
                issues.append(
                    Issue(
                        type="malformed_urls",
                        severity="warning",
                        message=(
                            f"{malformed} entries had a missing or invalid <loc> "
                            "and were skipped."
                        ),
                        sitemap=url,
                    )
                )
            if not url_entries:
                issues.append(
                    Issue(
                        type="empty_sitemap",
                        severity="warning",
                        message="Sitemap contains no URL entries.",
                        sitemap=url,
                    )
                )
            for loc, lastmod in url_entries:
                if len(entries) >= limits.max_urls:
                    truncated = True
                    break
                entries.append(
                    UrlEntry(url=loc, source_sitemap=url, lastmod=lastmod)
                )
            sitemap_infos.append(
                SitemapInfo(
                    url=url, status="ok", is_index=False, url_count=len(url_entries)
                )
            )

        if queue and len(sitemap_infos) >= limits.max_sitemaps:
            truncated = True
            issues.append(
                Issue(
                    type="limit_reached",
                    severity="warning",
                    message=(
                        f"Sitemap limit ({limits.max_sitemaps}) reached; "
                        "results are partial."
                    ),
                )
            )
        if truncated and not any(i.type == "limit_reached" for i in issues):
            issues.append(
                Issue(
                    type="limit_reached",
                    severity="warning",
                    message=(
                        f"URL limit ({limits.max_urls}) reached; results are partial."
                    ),
                )
            )

    ok_count = sum(1 for s in sitemap_infos if s.status == "ok")
    if ok_count == 0:
        raise FetchError(first_error or "No sitemap could be processed.")

    # ---- statistics -----------------------------------------------------
    total = len(entries)
    seen: dict[str, UrlEntry] = {}
    duplicate_occurrences = 0
    occurrences: dict[str, int] = {}
    sources: dict[str, set[str]] = {}
    for e in entries:
        occurrences[e.url] = occurrences.get(e.url, 0) + 1
        sources.setdefault(e.url, set()).add(e.source_sitemap)
        if e.url in seen:
            duplicate_occurrences += 1
        else:
            seen[e.url] = e
    with_lastmod = sum(1 for e in entries if e.lastmod)
    coverage = f"{round(with_lastmod / total * 100)}%" if total else "Not provided"

    duplicates = [
        DuplicateInfo(url=u, occurrences=c, sources=sorted(sources[u]))
        for u, c in sorted(occurrences.items(), key=lambda kv: kv[1], reverse=True)
        if c > 1
    ]

    # ---- URL structure analysis -----------------------------------------
    https_count = sum(1 for e in entries if e.url.startswith("https://"))
    with_qs = 0
    trailing = 0
    depth_counter: Counter[str] = Counter()
    prefix_counter: Counter[str] = Counter()
    for e in entries:
        p = urlparse(e.url)
        if p.query:
            with_qs += 1
        if p.path.endswith("/"):
            trailing += 1
        segs = [s for s in p.path.split("/") if s]
        depth_counter[str(len(segs))] += 1
        if segs:
            prefix_counter["/" + segs[0] + "/"] += 1

    stats = Stats(
        total_urls=total,
        unique_urls=len(seen),
        duplicate_entries=duplicate_occurrences,
        sitemaps_processed=ok_count,
        with_lastmod=with_lastmod,
        lastmod_coverage=coverage,
    )
    analysis = Analysis(
        https_count=https_count,
        http_count=total - https_count,
        with_query_params=with_qs,
        trailing_slash=trailing,
        no_trailing_slash=total - trailing,
        path_depth=dict(sorted(depth_counter.items(), key=lambda kv: int(kv[0]))),
        common_prefixes=[
            {"prefix": p, "count": c} for p, c in prefix_counter.most_common(10)
        ],
    )

    return ExtractResponse(
        input_url=raw_url.strip(),
        resolved_url=start_url,
        discovered_via=discovered_via,
        sitemaps=sitemap_infos,
        urls=entries,
        stats=stats,
        analysis=analysis,
        duplicates=duplicates,
        issues=issues,
        limits=LimitsInfo(
            max_sitemaps=limits.max_sitemaps,
            max_urls=limits.max_urls,
            max_depth=limits.max_depth,
            max_response_bytes=limits.max_response_bytes,
            truncated=truncated,
        ),
    )
