import sqlite3
import csv
import json
from pathlib import Path
import sys

csv.field_size_limit(sys.maxsize)

csv_path = Path(r"C:\Users\Ayushideep\Documents\data SuvidhaSetu\archive\schemes.csv")
db_path = Path(r"C:\Users\Ayushideep\Documents\SuvidhaSetu\cache\schemes.db")
db_path.parent.mkdir(parents=True, exist_ok=True)

conn = sqlite3.connect(db_path)
conn.execute("PRAGMA journal_mode=WAL")

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
conn.execute(CREATE_LISTINGS)
conn.execute(CREATE_DETAILS)

conn.execute("DELETE FROM listings")
conn.execute("DELETE FROM details")

def parse_tags(t):
    if not t: return "[]"
    return json.dumps([x.strip() for x in str(t).split(';') if x.strip()])

def parse_application_process(t):
    if not t: return "[]"
    return json.dumps([x.strip() for x in str(t).split(' | ') if x.strip()])

listings = []
details = []

with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        slug = row['slug']
        tags_json = parse_tags(row.get('tags', ''))
        cat_json = parse_tags(row.get('categories', ''))
        
        listing = (
            slug,
            row.get('scheme_name', ''),
            row.get('short_title', ''),
            row.get('ministry', ''),
            row.get('state', ''),
            row.get('level', ''),
            cat_json,
            row.get('brief_description', ''),
            tags_json
        )
        listings.append(listing)
        
        app_process_json = parse_application_process(row.get('application_process', ''))
        benefit_types_json = parse_tags(row.get('benefit_type', ''))
        target_ben_json = parse_tags(row.get('target_beneficiaries', ''))
        
        detail = (
            slug,
            row.get('scheme_name', ''),
            row.get('eligibility', ''),
            row.get('benefits', ''),
            row.get('detailed_description', ''),
            app_process_json,
            row.get('documents_required', ''),
            row.get('exclusions', ''),
            row.get('references', '').split(';')[0] if row.get('references') else '',
            row.get('department', ''),
            row.get('ministry', ''),
            row.get('department', ''),
            row.get('level', ''),
            benefit_types_json,
            cat_json,
            target_ben_json,
            parse_tags(row.get('beneficiary_type', '')),
            row.get('dbt_scheme', ''),
            tags_json
        )
        details.append(detail)

conn.executemany(f"INSERT OR REPLACE INTO listings (slug, scheme_name, scheme_short_title, ministry, state, level, category, brief_description, tags) VALUES ({','.join(['?']*9)})", listings)
conn.executemany(f"INSERT OR REPLACE INTO details (slug, scheme_name, eligibility_md, benefits_md, detailed_description_md, application_process_json, documents_required_md, exclusions_md, official_url, implementing_agency, nodal_ministry, nodal_department, scheme_type, benefit_types, scheme_category, target_beneficiaries, scheme_for, dbt_scheme, tags) VALUES ({','.join(['?']*19)})", details)

conn.commit()
conn.close()
print("Successfully imported", len(listings), "schemes.")
