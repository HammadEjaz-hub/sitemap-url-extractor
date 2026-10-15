"""SSRF protection unit tests — no network access needed."""
import pytest

from app.security import SSRFError, normalize_input, validate_url


@pytest.mark.parametrize(
    "url",
    [
        "http://localhost/sitemap.xml",
        "http://localhost:8000/sitemap.xml",
        "http://127.0.0.1/sitemap.xml",
        "http://127.0.0.1:9/sitemap.xml",
        "http://[::1]/sitemap.xml",
        "http://0.0.0.0/sitemap.xml",
        "http://10.0.0.1/sitemap.xml",
        "http://192.168.1.1/sitemap.xml",
        "http://172.16.5.4/sitemap.xml",
        "http://169.254.169.254/latest/meta-data/",
        "http://100.100.100.200/latest/meta-data/",
        "http://2130706433/sitemap.xml",  # integer-encoded 127.0.0.1
        "http://0x7f.0.0.1/sitemap.xml",  # hex-encoded 127.0.0.1
    ],
)
def test_blocked_targets_rejected(monkeypatch, url):
    monkeypatch.setenv("ALLOW_PRIVATE_HOSTS", "false")
    with pytest.raises(SSRFError):
        validate_url(url)


@pytest.mark.parametrize("url", ["ftp://example.com/sitemap.xml", "file:///etc/passwd"])
def test_non_http_schemes_rejected(monkeypatch, url):
    monkeypatch.setenv("ALLOW_PRIVATE_HOSTS", "false")
    with pytest.raises(SSRFError):
        validate_url(url)


def test_credentials_in_url_rejected(monkeypatch):
    monkeypatch.setenv("ALLOW_PRIVATE_HOSTS", "false")
    with pytest.raises(ValueError):
        validate_url("http://user:pass@example.com/sitemap.xml")


def test_metadata_blocked_even_when_private_allowed(monkeypatch):
    monkeypatch.setenv("ALLOW_PRIVATE_HOSTS", "true")
    with pytest.raises(SSRFError):
        validate_url("http://169.254.169.254/latest/meta-data/")


def test_private_allowed_only_with_explicit_flag(monkeypatch):
    # Without the flag, loopback is blocked...
    monkeypatch.setenv("ALLOW_PRIVATE_HOSTS", "false")
    with pytest.raises(SSRFError):
        validate_url("http://127.0.0.1:8000/sitemap.xml")
    # ...with the flag (test mode), it passes validation.
    monkeypatch.setenv("ALLOW_PRIVATE_HOSTS", "true")
    assert validate_url("http://127.0.0.1:8000/sitemap.xml") == "http://127.0.0.1:8000/sitemap.xml"


def test_public_literal_ip_passes(monkeypatch):
    monkeypatch.setenv("ALLOW_PRIVATE_HOSTS", "false")
    # 93.184.216.34 is a public unicast address; no DNS needed.
    assert validate_url("http://93.184.216.34/sitemap.xml")


def test_normalize_adds_scheme():
    assert normalize_input("example.com/sitemap.xml") == "https://example.com/sitemap.xml"


def test_normalize_rejects_empty():
    with pytest.raises(ValueError):
        normalize_input("   ")
