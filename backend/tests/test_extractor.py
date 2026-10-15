"""Extraction tests against a local fixture server (ALLOW_PRIVATE_HOSTS=true)."""
import asyncio

from fastapi.testclient import TestClient

from app.extractor import Limits, extract_sitemap, parse_sitemap
from app.main import app
from .conftest import gz_response, make_index, make_sitemap, redirect_to, xml_response

client = TestClient(app)


def post(url: str):
    return client.post("/api/extract", json={"url": url})


# ---------------------------------------------------------------- parse unit
def test_parse_namespaced_sitemap():
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
        'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" '
        'xmlns:xhtml="http://www.w3.org/1999/xhtml">'
        "<url><loc>https://example.com/a</loc>"
        '<image:image><image:loc>https://example.com/i.png</image:loc></image:image>'
        '<xhtml:link rel="alternate" hreflang="de" href="https://example.com/de/a"/>'
        "<lastmod>2026-01-02</lastmod></url>"
        "</urlset>"
    )
    kind, entries, children, malformed = parse_sitemap(xml.encode())
    assert kind == "urlset"
    assert entries == [("https://example.com/a", "2026-01-02")]
    assert children == [] and malformed == 0


def test_parse_invalid_xml_raises():
    import pytest

    from app.extractor import ParseError

    with pytest.raises(ParseError):
        parse_sitemap(b"<urlset><url><loc>oops")


# ---------------------------------------------------------------- api: basics
def test_standard_sitemap(server, routes):
    routes["/sitemap.xml"] = xml_response(
        make_sitemap(
            server,
            [("/a", "2026-01-01"), ("/b", None), ("/c?x=1", "2026-03-03")],
        )
    )
    r = post(f"{server}/sitemap.xml")
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["stats"]["total_urls"] == 3
    assert data["stats"]["unique_urls"] == 3
    assert data["stats"]["duplicate_entries"] == 0
    assert data["stats"]["sitemaps_processed"] == 1
    assert data["stats"]["lastmod_coverage"] == "67%"
    assert data["discovered_via"] == "direct"
    urls = [u["url"] for u in data["urls"]]
    assert f"{server}/a" in urls
    assert all(u["source_sitemap"] == f"{server}/sitemap.xml" for u in data["urls"])
    assert data["analysis"]["with_query_params"] == 1
    assert data["analysis"]["https_count"] == 0  # fixture uses http
    assert data["analysis"]["http_count"] == 3


def test_sitemap_index_recursive(server, routes):
    routes["/sitemap.xml"] = xml_response(make_index(server, ["/sm1.xml", "/sm2.xml"]))
    routes["/sm1.xml"] = xml_response(make_sitemap(server, [("/a", None), ("/b", None)]))
    routes["/sm2.xml"] = xml_response(make_sitemap(server, [("/c", None)]))
    r = post(f"{server}/sitemap.xml")
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["stats"]["total_urls"] == 3
    assert data["stats"]["sitemaps_processed"] == 3
    assert data["stats"]["lastmod_coverage"] == "0%"


def test_nested_index(server, routes):
    routes["/sitemap.xml"] = xml_response(make_index(server, ["/child-index.xml"]))
    routes["/child-index.xml"] = xml_response(make_index(server, ["/leaf.xml"]))
    routes["/leaf.xml"] = xml_response(make_sitemap(server, [("/deep", None)]))
    r = post(f"{server}/sitemap.xml")
    assert r.status_code == 200, r.text
    assert r.json()["stats"]["total_urls"] == 1


def test_gzipped_sitemap(server, routes):
    routes["/sitemap.xml.gz"] = gz_response(
        make_sitemap(server, [("/gz1", None), ("/gz2", None)])
    )
    r = post(f"{server}/sitemap.xml.gz")
    assert r.status_code == 200, r.text
    assert r.json()["stats"]["total_urls"] == 2


def test_duplicate_detection(server, routes):
    routes["/sitemap.xml"] = xml_response(make_index(server, ["/sm1.xml", "/sm2.xml"]))
    routes["/sm1.xml"] = xml_response(make_sitemap(server, [("/dup", None), ("/a", None)]))
    routes["/sm2.xml"] = xml_response(make_sitemap(server, [("/dup", None), ("/b", None)]))
    r = post(f"{server}/sitemap.xml")
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["stats"]["total_urls"] == 4
    assert data["stats"]["unique_urls"] == 3
    assert data["stats"]["duplicate_entries"] == 1
    assert len(data["duplicates"]) == 1
    dup = data["duplicates"][0]
    assert dup["url"] == f"{server}/dup"
    assert dup["occurrences"] == 2
    assert sorted(dup["sources"]) == [f"{server}/sm1.xml", f"{server}/sm2.xml"]


def test_malformed_entries_skipped(server, routes):
    xml = (
        '<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        "<url><loc></loc></url>"
        "<url><loc>not-a-url</loc></url>"
        f"<url><loc>{server}/ok</loc></url>"
        "</urlset>"
    )
    routes["/sitemap.xml"] = xml_response(xml)
    r = post(f"{server}/sitemap.xml")
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["stats"]["total_urls"] == 1
    assert any(i["type"] == "malformed_urls" for i in data["issues"])


def test_empty_sitemap(server, routes):
    routes["/sitemap.xml"] = xml_response(make_sitemap(server, []))
    r = post(f"{server}/sitemap.xml")
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["stats"]["total_urls"] == 0
    assert data["stats"]["lastmod_coverage"] == "Not provided"
    assert any(i["type"] == "empty_sitemap" for i in data["issues"])


def test_invalid_xml_start_returns_502(server, routes):
    routes["/sitemap.xml"] = xml_response("<urlset><broken", "text/html")
    r = post(f"{server}/sitemap.xml")
    assert r.status_code == 502


def test_http_404_returns_502(server, routes):
    r = post(f"{server}/does-not-exist.xml")
    assert r.status_code == 502


def test_redirect_chain_followed(server, routes):
    routes["/r1"] = redirect_to("/r2")
    routes["/r2"] = redirect_to(f"{server}/sitemap.xml")
    routes["/sitemap.xml"] = xml_response(make_sitemap(server, [("/ok", None)]))
    r = post(f"{server}/r1")
    assert r.status_code == 200, r.text
    assert r.json()["stats"]["total_urls"] == 1


def test_redirect_loop_aborts(server, routes):
    routes["/loop1"] = redirect_to("/loop2")
    routes["/loop2"] = redirect_to("/loop1")
    r = post(f"{server}/loop1")
    assert r.status_code == 502
    assert "redirect" in r.json()["detail"].lower()


def test_redirect_to_blocked_host_aborts(server, routes, monkeypatch):
    monkeypatch.setenv("ALLOW_PRIVATE_HOSTS", "true")  # metadata IP still blocked
    routes["/to-meta"] = redirect_to("http://169.254.169.254/latest/meta-data/")
    r = post(f"{server}/to-meta")
    assert r.status_code == 400
    assert "not allowed" in r.json()["detail"]


def test_circular_sitemap_reference(server, routes):
    routes["/sitemap.xml"] = xml_response(make_index(server, ["/sitemap.xml", "/leaf.xml"]))
    routes["/leaf.xml"] = xml_response(make_sitemap(server, [("/x", None)]))
    r = post(f"{server}/sitemap.xml")
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["stats"]["total_urls"] == 1
    assert any(i["type"] == "circular_reference" for i in data["issues"])


def test_child_sitemap_failure_is_non_fatal(server, routes):
    routes["/sitemap.xml"] = xml_response(make_index(server, ["/good.xml", "/missing.xml"]))
    routes["/good.xml"] = xml_response(make_sitemap(server, [("/ok", None)]))
    r = post(f"{server}/sitemap.xml")
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["stats"]["total_urls"] == 1
    assert any(s["status"] == "error" for s in data["sitemaps"])
    assert any(i["severity"] == "error" for i in data["issues"])


# ---------------------------------------------------------------- discovery
def test_robots_txt_discovery(server, routes):
    routes["/robots.txt"] = (
        200,
        {"Content-Type": "text/plain"},
        f"User-agent: *\nDisallow:\nSitemap: {server}/real-sitemap.xml\n".encode(),
    )
    routes["/real-sitemap.xml"] = xml_response(make_sitemap(server, [("/found", None)]))
    r = post(server)  # bare domain input
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["discovered_via"] == "robots.txt"
    assert data["stats"]["total_urls"] == 1


def test_probe_discovery(server, routes):
    routes["/robots.txt"] = (200, {"Content-Type": "text/plain"}, b"User-agent: *\n")
    routes["/sitemap.xml"] = xml_response(make_sitemap(server, [("/probed", None)]))
    r = post(server + "/")
    assert r.status_code == 200, r.text
    assert r.json()["discovered_via"] == "probe"


def test_bare_domain_no_sitemap_returns_502(server, routes):
    routes["/robots.txt"] = (200, {"Content-Type": "text/plain"}, b"User-agent: *\n")
    r = post(server)
    assert r.status_code == 502


# ---------------------------------------------------------------- limits
def test_url_count_limit_truncates(server, routes):
    items = [(f"/p{i}", None) for i in range(30)]
    routes["/sitemap.xml"] = xml_response(make_sitemap(server, items))
    result = asyncio.run(
        extract_sitemap(f"{server}/sitemap.xml", Limits(max_urls=10, max_sitemaps=500, max_depth=5))
    )
    assert result.stats.total_urls == 10
    assert result.limits.truncated is True
    assert any(i.type == "limit_reached" for i in result.issues)


def test_sitemap_count_limit(server, routes):
    routes["/sitemap.xml"] = xml_response(
        make_index(server, ["/a.xml", "/b.xml", "/c.xml"])
    )
    for name in ("a", "b", "c"):
        routes[f"/{name}.xml"] = xml_response(make_sitemap(server, [(f"/{name}", None)]))
    result = asyncio.run(
        extract_sitemap(f"{server}/sitemap.xml", Limits(max_urls=100000, max_sitemaps=2, max_depth=5))
    )
    assert result.stats.sitemaps_processed == 2
    assert result.limits.truncated is True


def test_max_depth_enforced(server, routes):
    routes["/sitemap.xml"] = xml_response(make_index(server, ["/d1.xml"]))
    routes["/d1.xml"] = xml_response(make_index(server, ["/d2.xml"]))
    routes["/d2.xml"] = xml_response(make_sitemap(server, [("/too-deep", None)]))
    result = asyncio.run(
        extract_sitemap(f"{server}/sitemap.xml", Limits(max_urls=100000, max_sitemaps=500, max_depth=1))
    )
    assert result.stats.total_urls == 0
    assert any(i.type == "max_depth" for i in result.issues)


# ---------------------------------------------------------------- api guards
def test_ssrf_blocked_at_api(monkeypatch):
    monkeypatch.setenv("ALLOW_PRIVATE_HOSTS", "false")
    r = post("http://127.0.0.1/sitemap.xml")
    assert r.status_code == 400
    assert "not allowed" in r.json()["detail"]


def test_invalid_input_returns_400():
    assert client.post("/api/extract", json={"url": "   "}).status_code in (400, 422)
    assert post("ftp://example.com/x.xml").status_code == 400


def test_health():
    assert client.get("/api/health").json() == {"status": "ok"}
