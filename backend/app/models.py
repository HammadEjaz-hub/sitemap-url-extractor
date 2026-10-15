"""Pydantic models for the extraction API."""
from __future__ import annotations

from pydantic import BaseModel, Field


class ExtractRequest(BaseModel):
    url: str = Field(min_length=1, max_length=2048)


class UrlEntry(BaseModel):
    url: str
    source_sitemap: str
    lastmod: str | None = None


class SitemapInfo(BaseModel):
    url: str
    status: str  # "ok" | "error"
    is_index: bool = False
    url_count: int = 0
    error: str | None = None


class Stats(BaseModel):
    total_urls: int
    unique_urls: int
    duplicate_entries: int
    sitemaps_processed: int
    with_lastmod: int
    lastmod_coverage: str  # e.g. "42%" or "Not provided"


class Analysis(BaseModel):
    https_count: int
    http_count: int
    with_query_params: int
    trailing_slash: int
    no_trailing_slash: int
    path_depth: dict[str, int]
    common_prefixes: list[dict]


class Issue(BaseModel):
    type: str
    severity: str  # "error" | "warning"
    message: str
    sitemap: str | None = None


class DuplicateInfo(BaseModel):
    url: str
    occurrences: int
    sources: list[str]


class LimitsInfo(BaseModel):
    max_sitemaps: int
    max_urls: int
    max_depth: int
    max_response_bytes: int
    truncated: bool = False


class ExtractResponse(BaseModel):
    input_url: str
    resolved_url: str
    discovered_via: str  # "direct" | "robots.txt" | "probe"
    sitemaps: list[SitemapInfo]
    urls: list[UrlEntry]
    stats: Stats
    analysis: Analysis
    duplicates: list[DuplicateInfo]
    issues: list[Issue]
    limits: LimitsInfo
