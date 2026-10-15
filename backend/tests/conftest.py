"""Test setup: local fixture HTTP server + test-mode env flags.

ALLOW_PRIVATE_HOSTS=true lets the extractor talk to the 127.0.0.1 fixture
server. SSRF-blocking tests override it per-test with monkeypatch.
"""
import gzip
import os
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import pytest

os.environ["ALLOW_PRIVATE_HOSTS"] = "true"
os.environ["DISABLE_RATE_LIMIT"] = "true"

# path -> (status, headers, body)
ROUTES: dict[str, tuple[int, dict, bytes]] = {}


class _Handler(BaseHTTPRequestHandler):
    def do_GET(self):  # noqa: N802
        route = ROUTES.get(self.path)
        if route is None:
            body = b"not found"
            self.send_response(404)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        status, headers, body = route
        if isinstance(body, str):
            body = body.encode("utf-8")
        self.send_response(status)
        for key, value in headers.items():
            self.send_header(key, value)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):  # noqa: ANN002, ANN202
        pass


@pytest.fixture(scope="session")
def server():
    srv = ThreadingHTTPServer(("127.0.0.1", 0), _Handler)
    port = srv.server_address[1]
    thread = threading.Thread(target=srv.serve_forever, daemon=True)
    thread.start()
    yield f"http://127.0.0.1:{port}"
    srv.shutdown()


@pytest.fixture()
def routes():
    ROUTES.clear()
    return ROUTES


def xml_response(body: str, content_type: str = "application/xml"):
    return (200, {"Content-Type": content_type}, body.encode("utf-8"))


def gz_response(xml_text: str):
    return (200, {"Content-Type": "application/gzip"}, gzip.compress(xml_text.encode("utf-8")))


def redirect_to(location: str):
    return (302, {"Location": location}, b"")


def make_sitemap(base: str, items: list[tuple[str, str | None]]) -> str:
    urls = "\n".join(
        "  <url><loc>{base}{path}</loc>{lm}</url>".format(
            base=base,
            path=path,
            lm=f"<lastmod>{lastmod}</lastmod>" if lastmod else "",
        )
        for path, lastmod in items
    )
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{urls}\n</urlset>"
    )


def make_index(base: str, sm_paths: list[str]) -> str:
    sms = "\n".join(
        f"  <sitemap><loc>{base}{path}</loc></sitemap>" for path in sm_paths
    )
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{sms}\n</sitemapindex>"
    )
