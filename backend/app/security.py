"""SSRF protection for fetching user-supplied URLs.

Every URL fetched by the extractor (the initial URL, robots.txt probes,
redirect targets and child sitemap references) is validated here:

* only http/https schemes
* no embedded credentials
* every resolved IP address must be a public unicast address
  (loopback, private, link-local, multicast, reserved and unspecified
  ranges are rejected)
* well-known cloud metadata endpoints are always rejected, even when
  ALLOW_PRIVATE_HOSTS=true (test mode)

Known limitation: validation happens at request time per redirect hop,
so a hostile DNS that changes answers between validation and connection
(DNS rebinding TOCTOU) is not fully mitigated. Hosts are re-resolved and
re-validated on every redirect hop to narrow the window.
"""
from __future__ import annotations

import ipaddress
import os
import socket
from urllib.parse import urlparse

# Cloud metadata endpoints: blocked unconditionally, even in test mode.
_ALWAYS_BLOCKED_IPS = {"169.254.169.254", "100.100.100.200"}


class SSRFError(ValueError):
    """Raised when a URL target is not allowed to be fetched."""


def private_hosts_allowed() -> bool:
    """Test-only escape hatch. NEVER enable in production."""
    return os.getenv("ALLOW_PRIVATE_HOSTS", "false").strip().lower() == "true"


def _is_blocked_ip(ip: ipaddress._BaseAddress) -> bool:
    return (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_multicast
        or ip.is_reserved
        or ip.is_unspecified
    )


def resolve_host(host: str) -> list[str]:
    """Return all IP addresses for *host* (literal, integer-encoded or DNS)."""
    h = host.strip().rstrip(".").lower()
    if not h or len(h) > 253:
        raise SSRFError("URL target is not allowed")
    # Literal IP address (v4 or v6).
    try:
        return [str(ipaddress.ip_address(h))]
    except ValueError:
        pass
    # Integer-encoded IPv4, e.g. http://2130706433/ == http://127.0.0.1/
    if h.isdigit():
        try:
            return [str(ipaddress.IPv4Address(int(h)))]
        except (ValueError, ipaddress.AddressValueError):
            pass
    try:
        infos = socket.getaddrinfo(h, None, family=socket.AF_UNSPEC, type=socket.SOCK_STREAM)
    except socket.gaierror:
        raise SSRFError("URL target is not allowed")
    ips = sorted({info[4][0] for info in infos if info[4]})
    if not ips:
        raise SSRFError("URL target is not allowed")
    return ips


def validate_host(host: str) -> None:
    """Raise SSRFError if *host* resolves to a disallowed address."""
    for ip_str in resolve_host(host):
        try:
            ip = ipaddress.ip_address(ip_str)
        except ValueError:
            raise SSRFError("URL target is not allowed")
        if str(ip) in _ALWAYS_BLOCKED_IPS:
            raise SSRFError("URL target is not allowed")
        if _is_blocked_ip(ip) and not private_hosts_allowed():
            raise SSRFError("URL target is not allowed")


def normalize_input(raw: str) -> str:
    """Clean user input and add a scheme when missing.

    Raises ValueError for malformed input, SSRFError for disallowed schemes.
    """
    raw = (raw or "").strip()
    if not raw:
        raise ValueError("Please enter a sitemap URL or domain.")
    if len(raw) > 2048:
        raise ValueError("The URL is too long.")
    if "://" not in raw:
        raw = "https://" + raw
    parsed = urlparse(raw)
    if parsed.scheme not in ("http", "https"):
        raise SSRFError("Only http and https URLs are allowed")
    if not parsed.hostname:
        raise ValueError("Could not find a hostname in the URL.")
    if parsed.username or parsed.password:
        raise ValueError("URLs containing credentials are not allowed.")
    return raw


def validate_url(url: str) -> str:
    """Full validation of a URL that is about to be fetched. Returns the URL."""
    normalized = normalize_input(url)
    validate_host(urlparse(normalized).hostname or "")
    return normalized
