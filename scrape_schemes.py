"""
Scrape scheme data from myscheme.gov.in and build cache/schemes.db.

This script:
  1. Fetches the sitemap to get all scheme slugs
  2. Fetches listing data (name, ministry, state, etc.) from the scheme listing pages
  3. Fetches detailed data (eligibility, benefits, application process, etc.) from each scheme page
  4. Writes everything into cache/schemes.db (listings + details tables)
  5. Runs parse_eligibility to build the parsed_eligibility table

Usage:
    python scrape_schemes.py
"""
from __future__ import annotations

import json
import re
import sqlite3
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urljoin

import httpx
from tqdm import tqdm

DB_PATH = Path("cache/schemes.db")

# ── API endpoints discovered from the myScheme frontend ─────────────────────

BASE_URL = "https://www.myscheme.gov.in"
# The myScheme frontend is a Next.js app that fetches data from these endpoints:
API_BASE = "https://api.myscheme.gov.in"

SITEMAP_URL = "https://www.myscheme.gov.in/sitemap.xml"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}

JSON_HEADERS = {
    **HEADERS,
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "Origin": "https://www.myscheme.gov.in",
    "Referer": "https://www.myscheme.gov.in/",
}

# ── DB schema ────────────────────────────────────────────────────────────────

CREATE_LISTINGS = """
CREATE TABLE IF NOT EXISTS listings (
    slug TEXT PRIMARY KEY,
    scheme_name TEXT,
    scheme_short_title TEXT,
    ministry TEXT,
    state TEXT,
    level TEXT DEFAULT 'Central',
    category TEXT,
    brief_description TEXT,
    tags TEXT,
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

CREATE_DETAILS = """
CREATE TABLE IF NOT EXISTS details (
    slug TEXT PRIMARY KEY,
    scheme_name TEXT,
    eligibility_md TEXT,
    benefits_md TEXT,
    detailed_description_md TEXT,
    application_process_json TEXT,
    documents_required_md TEXT,
    exclusions_md TEXT,
    official_url TEXT,
    implementing_agency TEXT,
    nodal_ministry TEXT,
    nodal_department TEXT,
    scheme_type TEXT,
    benefit_types TEXT,
    scheme_category TEXT,
    target_beneficiaries TEXT,
    scheme_for TEXT,
    dbt_scheme TEXT,
    tags TEXT,
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""


def init_db() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute(CREATE_LISTINGS)
    conn.execute(CREATE_DETAILS)
    conn.commit()
    return conn


# ── Sitemap parsing ──────────────────────────────────────────────────────────

def get_scheme_slugs_from_sitemap(client: httpx.Client) -> list[str]:
    """Extract scheme slugs from the sitemap."""
    print("Fetching sitemap...")
    try:
        resp = client.get(SITEMAP_URL, headers=HEADERS, timeout=30)
        resp.raise_for_status()
    except Exception as e:
        print(f"  Could not fetch main sitemap: {e}")
        return []

    slugs = []
    # The sitemap may reference sub-sitemaps
    root = ET.fromstring(resp.text)
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}

    # Check for sitemap index (sitemapindex)
    sitemap_refs = root.findall(".//sm:sitemap/sm:loc", ns)
    if sitemap_refs:
        for ref in sitemap_refs:
            url = ref.text.strip()
            if "scheme" in url.lower():
                print(f"  Fetching sub-sitemap: {url}")
                try:
                    sub_resp = client.get(url, headers=HEADERS, timeout=30)
                    sub_resp.raise_for_status()
                    sub_root = ET.fromstring(sub_resp.text)
                    for loc in sub_root.findall(".//sm:url/sm:loc", ns):
                        page_url = loc.text.strip()
                        m = re.search(r"/schemes/([a-z0-9_-]+)", page_url)
                        if m:
                            slugs.append(m.group(1))
                except Exception as e:
                    print(f"    Error: {e}")

    # Also check direct URLs
    for loc in root.findall(".//sm:url/sm:loc", ns):
        page_url = loc.text.strip()
        m = re.search(r"/schemes/([a-z0-9_-]+)", page_url)
        if m and m.group(1) not in slugs:
            slugs.append(m.group(1))

    return slugs


# ── Scrape individual scheme pages (HTML + Next.js data) ─────────────────────

def _extract_next_data(html: str) -> dict | None:
    """Extract __NEXT_DATA__ JSON from the page HTML."""
    m = re.search(r'<script\s+id="__NEXT_DATA__"\s+type="application/json">(.*?)</script>', html, re.S)
    if m:
        try:
            return json.loads(m.group(1))
        except json.JSONDecodeError:
            pass
    return None


def _extract_text_sections(html: str) -> dict:
    """Fallback: extract key content from visible HTML when __NEXT_DATA__ is absent."""
    sections = {}
    # Try to find scheme name from <h1> or <title>
    title_m = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.S)
    if title_m:
        from html import unescape
        sections["scheme_name"] = unescape(re.sub(r'<[^>]+>', '', title_m.group(1)).strip())
    return sections


def _walk_next_data(data: dict, slug: str) -> tuple[dict, dict]:
    """Navigate the __NEXT_DATA__ structure to extract listing and detail info."""
    listing = {}
    detail = {}

    # Try to locate the scheme data in pageProps
    props = data.get("props", {}).get("pageProps", {})
    scheme = props.get("schemeData", {}) or props.get("scheme", {}) or props

    # --- Listing fields ---
    listing["slug"] = slug
    listing["scheme_name"] = (
        scheme.get("schemeName") or scheme.get("scheme_name")
        or scheme.get("title") or scheme.get("name") or ""
    )
    listing["scheme_short_title"] = scheme.get("schemeShortTitle", "")
    listing["ministry"] = (
        scheme.get("nodalMinistryName", {}).get("name", "")
        if isinstance(scheme.get("nodalMinistryName"), dict)
        else scheme.get("nodalMinistryName", "")
    ) or scheme.get("ministry", "")
    listing["state"] = scheme.get("state", "") or scheme.get("stateName", "")
    listing["level"] = scheme.get("level", "Central")
    listing["category"] = (
        json.dumps(scheme["schemeCategory"]) if isinstance(scheme.get("schemeCategory"), list)
        else scheme.get("schemeCategory", "")
    )
    listing["brief_description"] = scheme.get("briefDescription", "") or scheme.get("brief_description", "")
    listing["tags"] = (
        json.dumps(scheme["tags"]) if isinstance(scheme.get("tags"), list)
        else scheme.get("tags", "[]")
    )

    # --- Detail fields ---
    detail["slug"] = slug
    detail["scheme_name"] = listing["scheme_name"]
    detail["eligibility_md"] = _join_md(scheme, "eligibility", "eligibilityCriteria")
    detail["benefits_md"] = _join_md(scheme, "benefits", "benefitDescription")
    detail["detailed_description_md"] = _join_md(scheme, "detailedDescription", "description")
    detail["documents_required_md"] = _join_md(scheme, "documentsRequired", "documents_required")
    detail["exclusions_md"] = _join_md(scheme, "exclusions")
    detail["official_url"] = scheme.get("officialUrl", "") or scheme.get("schemeUrl", "")
    detail["implementing_agency"] = scheme.get("implementingAgency", "")
    detail["nodal_ministry"] = listing["ministry"]
    detail["nodal_department"] = scheme.get("nodalDepartment", "")
    detail["scheme_type"] = scheme.get("schemeType", "")
    detail["benefit_types"] = (
        json.dumps(scheme["benefitTypes"]) if isinstance(scheme.get("benefitTypes"), list)
        else scheme.get("benefitTypes", "[]")
    )
    detail["scheme_category"] = listing["category"]
    detail["target_beneficiaries"] = (
        json.dumps(scheme["targetBeneficiaries"]) if isinstance(scheme.get("targetBeneficiaries"), list)
        else scheme.get("targetBeneficiaries", "[]")
    )
    detail["scheme_for"] = (
        json.dumps(scheme["schemeFor"]) if isinstance(scheme.get("schemeFor"), list)
        else scheme.get("schemeFor", "")
    )
    detail["dbt_scheme"] = str(scheme.get("dbtScheme", ""))
    detail["tags"] = listing["tags"]

    # Application process
    ap = scheme.get("applicationProcess", [])
    if isinstance(ap, list):
        detail["application_process_json"] = json.dumps(ap)
    elif isinstance(ap, str):
        detail["application_process_json"] = ap
    else:
        detail["application_process_json"] = "[]"

    return listing, detail


def _join_md(scheme: dict, *keys: str) -> str:
    """Try multiple keys and return the first non-empty one, handling lists of objects."""
    for key in keys:
        val = scheme.get(key)
        if not val:
            continue
        if isinstance(val, str):
            return val
        if isinstance(val, list):
            parts = []
            for item in val:
                if isinstance(item, str):
                    parts.append(item)
                elif isinstance(item, dict):
                    # Handle structures like {"title": "...", "description": "..."}
                    title = item.get("title", "")
                    desc = item.get("description", "") or item.get("text", "") or item.get("value", "")
                    if title and desc:
                        parts.append(f"**{title}**: {desc}")
                    elif desc:
                        parts.append(desc)
                    elif title:
                        parts.append(title)
            if parts:
                return "\n\n".join(parts)
    return ""


def scrape_scheme_page(client: httpx.Client, slug: str) -> tuple[dict, dict] | None:
    """Scrape a scheme page and extract listing + detail data."""
    url = f"{BASE_URL}/schemes/{slug}"
    try:
        resp = client.get(url, headers=HEADERS, timeout=30, follow_redirects=True)
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
    except httpx.HTTPStatusError:
        return None
    except httpx.TimeoutException:
        return None

    html = resp.text
    next_data = _extract_next_data(html)
    if next_data:
        listing, detail = _walk_next_data(next_data, slug)
        if listing.get("scheme_name"):
            return listing, detail

    # Fallback
    sections = _extract_text_sections(html)
    if sections.get("scheme_name"):
        listing = {"slug": slug, "scheme_name": sections["scheme_name"]}
        detail = {"slug": slug, "scheme_name": sections["scheme_name"]}
        return listing, detail

    return None


# ── Alternative: use myScheme search API ─────────────────────────────────────

def fetch_schemes_via_search(client: httpx.Client) -> list[dict]:
    """Try to fetch scheme listings via the search endpoint."""
    all_schemes = []
    page = 1
    per_page = 50

    # Try multiple possible API patterns
    api_patterns = [
        f"{API_BASE}/search/v4/schemes",
        f"{API_BASE}/search/schemes",
        f"{BASE_URL}/api/search/schemes",
        f"{BASE_URL}/_next/data/{{build_id}}/search.json",
    ]

    for pattern in api_patterns:
        try:
            params = {"lang": "en", "page": str(page), "size": str(per_page)}
            resp = client.get(pattern, params=params, headers=JSON_HEADERS, timeout=30)
            if resp.status_code == 200:
                data = resp.json()
                print(f"  Found working API: {pattern}")
                return data.get("data", [])
        except Exception:
            continue

    return []


# ── Main pipeline ────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("Suvidha Setu — Scheme Data Pipeline")
    print("=" * 60)

    conn = init_db()

    # Check for existing data
    try:
        existing_listings = conn.execute("SELECT COUNT(*) FROM listings").fetchone()[0]
        existing_details = conn.execute("SELECT COUNT(*) FROM details").fetchone()[0]
        if existing_listings > 0:
            print(f"\nExisting data: {existing_listings} listings, {existing_details} details")
            print("Will update/add missing schemes.\n")
    except Exception:
        existing_listings = 0
        existing_details = 0

    client = httpx.Client(http2=True, follow_redirects=True, timeout=30)

    # Step 1: Get all scheme slugs from sitemap
    slugs = get_scheme_slugs_from_sitemap(client)
    print(f"\nFound {len(slugs)} scheme slugs from sitemap")

    if not slugs:
        print("\nSitemap returned no schemes. Trying alternative approach...")
        # Try fetching from the __NEXT_DATA__ on the search page
        try:
            resp = client.get(f"{BASE_URL}/search", headers=HEADERS, timeout=30, follow_redirects=True)
            next_data = _extract_next_data(resp.text)
            if next_data:
                # Try to extract build ID for data fetching
                build_id = next_data.get("buildId", "")
                print(f"  Got build ID: {build_id}")

                # Try __NEXT_DATA__ from each page
                props = next_data.get("props", {}).get("pageProps", {})
                schemes_data = props.get("schemes", []) or props.get("data", [])
                if schemes_data:
                    print(f"  Found {len(schemes_data)} schemes in search page data")
                    for s in schemes_data:
                        slug_val = s.get("slug", "")
                        if slug_val and slug_val not in slugs:
                            slugs.append(slug_val)
        except Exception as e:
            print(f"  Search page approach failed: {e}")

    if not slugs:
        print("\n⚠ Could not discover scheme slugs automatically.")
        print("  Will try to scrape the first 100 pages of search results...\n")

        # Last resort: try paginating through search results
        for page_num in range(1, 101):
            try:
                resp = client.get(
                    f"{BASE_URL}/search",
                    params={"page": str(page_num)},
                    headers=HEADERS,
                    timeout=30,
                    follow_redirects=True,
                )
                next_data = _extract_next_data(resp.text)
                if next_data:
                    props = next_data.get("props", {}).get("pageProps", {})
                    schemes = props.get("schemes", []) or props.get("data", [])
                    if not schemes:
                        break
                    for s in schemes:
                        slug_val = s.get("slug", "")
                        if slug_val and slug_val not in slugs:
                            slugs.append(slug_val)
                    print(f"  Page {page_num}: {len(schemes)} schemes (total: {len(slugs)})")
                else:
                    break
            except Exception:
                break
            time.sleep(0.3)

    if not slugs:
        print("\n❌ Unable to discover scheme URLs.")
        print("   The myScheme website may have changed its structure.")
        print("   Please provide a list of slugs or a pre-built database.\n")
        print("   Alternative: Download from the project's data source.")
        client.close()
        conn.close()
        sys.exit(1)

    # Step 2: Scrape each scheme page
    print(f"\nScraping {len(slugs)} scheme pages...")
    print("(This will take a while — ~1 request/second to be respectful)\n")

    # Get already scraped slugs to skip
    existing_slugs = set()
    try:
        rows = conn.execute("SELECT slug FROM details WHERE eligibility_md IS NOT NULL AND eligibility_md != ''").fetchall()
        existing_slugs = {r[0] for r in rows}
    except Exception:
        pass

    new_slugs = [s for s in slugs if s not in existing_slugs]
    if existing_slugs:
        print(f"  Skipping {len(existing_slugs)} already-scraped schemes")
    print(f"  {len(new_slugs)} schemes to scrape\n")

    success = 0
    failed = 0
    batch_listings = []
    batch_details = []

    for i, slug in enumerate(tqdm(new_slugs, desc="Scraping")):
        result = scrape_scheme_page(client, slug)
        if result:
            listing, detail = result
            batch_listings.append(listing)
            batch_details.append(detail)
            success += 1
        else:
            failed += 1

        # Write in batches of 50
        if len(batch_listings) >= 50:
            _write_batch(conn, batch_listings, batch_details)
            batch_listings.clear()
            batch_details.clear()

        # Rate limit
        time.sleep(0.5)

    # Write remaining
    if batch_listings:
        _write_batch(conn, batch_listings, batch_details)

    client.close()

    total_listings = conn.execute("SELECT COUNT(*) FROM listings").fetchone()[0]
    total_details = conn.execute("SELECT COUNT(*) FROM details").fetchone()[0]
    print(f"\n✓ Scraping complete: {success} succeeded, {failed} failed")
    print(f"  Total: {total_listings} listings, {total_details} details\n")

    # Step 3: Run parse_eligibility
    if total_details > 0:
        print("Running eligibility parser...")
        try:
            from recommender.parse_eligibility import main as parse_main
            parse_main()
            print("\n✓ Eligibility parsing complete!")
        except Exception as e:
            print(f"\n⚠ Eligibility parsing failed: {e}")
            print("  You can run it manually: python -m recommender.parse_eligibility")

    conn.close()
    print(f"\n{'='*60}")
    print(f"Database ready at: {DB_PATH.resolve()}")
    print(f"{'='*60}")


def _write_batch(conn: sqlite3.Connection, listings: list[dict], details: list[dict]):
    """Write a batch of listings and details to the database."""
    listing_cols = [
        "slug", "scheme_name", "scheme_short_title", "ministry",
        "state", "level", "category", "brief_description", "tags"
    ]
    detail_cols = [
        "slug", "scheme_name", "eligibility_md", "benefits_md",
        "detailed_description_md", "application_process_json",
        "documents_required_md", "exclusions_md", "official_url",
        "implementing_agency", "nodal_ministry", "nodal_department",
        "scheme_type", "benefit_types", "scheme_category",
        "target_beneficiaries", "scheme_for", "dbt_scheme", "tags"
    ]

    for listing in listings:
        placeholders = ", ".join(f":{c}" for c in listing_cols)
        col_names = ", ".join(listing_cols)
        row = {c: listing.get(c, "") for c in listing_cols}
        conn.execute(
            f"INSERT OR REPLACE INTO listings({col_names}) VALUES ({placeholders})",
            row,
        )

    for detail in details:
        placeholders = ", ".join(f":{c}" for c in detail_cols)
        col_names = ", ".join(detail_cols)
        row = {c: detail.get(c, "") for c in detail_cols}
        conn.execute(
            f"INSERT OR REPLACE INTO details({col_names}) VALUES ({placeholders})",
            row,
        )

    conn.commit()


if __name__ == "__main__":
    main()
