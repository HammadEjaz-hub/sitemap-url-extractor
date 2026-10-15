"""Sitemap URL Extractor backend."""
import os


def _sanitize_proxy_env() -> None:
    """Drop no_proxy entries that httpx cannot parse.

    Some environments export bracketed IPv6 literals (e.g. ``[::1]``) in
    ``no_proxy``/``NO_PROXY``. httpx raises ``InvalidURL`` while parsing
    those entries, which breaks client construction entirely. Removing
    them does not change proxy bypass behaviour for the entries that
    matter (localhost, 127.0.0.1).
    """
    for var in ("no_proxy", "NO_PROXY"):
        val = os.environ.get(var)
        if not val:
            continue
        kept = [p for p in val.split(",") if "[" not in p and "::" not in p]
        if len(kept) != len(val.split(",")):
            os.environ[var] = ",".join(kept)


_sanitize_proxy_env()
