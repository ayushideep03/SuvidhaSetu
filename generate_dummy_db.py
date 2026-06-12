import sqlite3
from pathlib import Path
import json

DB_PATH = Path("cache/schemes.db")
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

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

def generate_dummy_db():
    print("Generating dummy database...")
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute(CREATE_LISTINGS)
    conn.execute(CREATE_DETAILS)
    
    # 1. PM Kisan
    pm_kisan_slug = "pradhan-mantri-kisan-samman-nidhi"
    pm_kisan_listing = (
        pm_kisan_slug, "Pradhan Mantri Kisan Samman Nidhi", "PM-KISAN", "Ministry of Agriculture & Farmers Welfare", "", "Central",
        json.dumps(["Agriculture", "Farmers"]), "Financial benefit of ₹6000/- per year to eligible farmers.", json.dumps(["farmer", "agriculture"])
    )
    pm_kisan_detail = (
        pm_kisan_slug, "Pradhan Mantri Kisan Samman Nidhi",
        "The scheme is for all landholding farmers' families in the country, except those in the higher income brackets.\n\nAll landholding farmers' families, which have cultivable landholding in their names are eligible to get benefit under the scheme.",
        "Financial benefit of ₹6000/- per year is transferred in three equal four-monthly installments of ₹2000/- each directly into the bank accounts of the eligible farmers.",
        "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN) is a Central Sector scheme with 100% funding from Government of India.",
        "[]", "Aadhaar Card, Bank Passbook, Land ownership records.", "Institutional land holders, farmer families holding constitutional posts, serving or retired officers.",
        "https://pmkisan.gov.in/", "Department of Agriculture, Cooperation & Farmers Welfare", "Ministry of Agriculture & Farmers Welfare", "",
        "Central Sector Scheme", json.dumps(["Cash"]), json.dumps(["Agriculture"]), json.dumps(["Individuals"]), json.dumps(["Citizens"]), "Yes", json.dumps(["farmer", "agriculture"])
    )

    # 2. Pre-Matric Scholarship for SC Students
    pre_matric_sc_slug = "pre-matric-scholarship-for-sc-students"
    pre_matric_sc_listing = (
        pre_matric_sc_slug, "Pre-Matric Scholarship to the SC Students studying in classes 9 and 10", "Pre-Matric SC", "Ministry of Social Justice and Empowerment", "", "Central",
        json.dumps(["Education", "Scholarship"]), "Financial assistance for SC students at pre-matriculation level.", json.dumps(["student", "sc", "education"])
    )
    pre_matric_sc_detail = (
        pre_matric_sc_slug, "Pre-Matric Scholarship to the SC Students studying in classes 9 and 10",
        "1. The student should belong to Scheduled Caste (SC).\n2. Student should be studying in class 9 or 10.\n3. Parent/Guardian's income should not exceed ₹ 2,50,000 per annum.",
        "Day Scholars get ₹225 per month for 10 months and ad-hoc grant of ₹750 per year. Hostellers get ₹525 per month for 10 months and ad-hoc grant of ₹1000 per year.",
        "The objective of the scheme is to support parents of SC children for education of their wards studying in classes IX and X so that the incidence of drop-out, especially in the transition from the elementary to the secondary stage is minimized.",
        "[]", "Caste Certificate, Income Certificate, Bank Details, Marksheet of previous class.", "",
        "https://scholarships.gov.in/", "State Governments", "Ministry of Social Justice and Empowerment", "",
        "Centrally Sponsored Scheme", json.dumps(["Cash"]), json.dumps(["Education"]), json.dumps(["Individuals"]), json.dumps(["Citizens"]), "Yes", json.dumps(["student", "sc", "education"])
    )

    # 3. Startup India Seed Fund
    startup_india_slug = "startup-india-seed-fund-scheme"
    startup_india_listing = (
        startup_india_slug, "Startup India Seed Fund Scheme", "SISFS", "Ministry of Commerce and Industry", "", "Central",
        json.dumps(["Business", "Startup"]), "Financial assistance to startups for proof of concept, prototype development, product trials, market entry, and commercialization.", json.dumps(["business", "startup", "entrepreneur"])
    )
    startup_india_detail = (
        startup_india_slug, "Startup India Seed Fund Scheme",
        "A startup, recognized by DPIIT, incorporated not more than 2 years ago at the time of application. The startup must have a business idea to develop a product or a service with a market fit, viable commercialization, and scope of scaling. The startup should be using technology in its core product.",
        "Up to ₹20 Lakhs as grant for validation of Proof of Concept, or prototype development, or product trials. Up to ₹50 Lakhs of investment for market entry, commercialization, or scaling up through convertible debentures or debt or debt-linked instruments.",
        "Startup India Seed Fund Scheme (SISFS) aims to provide financial assistance to startups...",
        "[]", "Incorporation Certificate, DPIIT Recognition, Pitch Deck.", "",
        "https://seedfund.startupindia.gov.in/", "Incubators", "Ministry of Commerce and Industry", "DPIIT",
        "Central Sector Scheme", json.dumps(["Cash", "Financial Assistance"]), json.dumps(["Business"]), json.dumps(["Individuals", "Businesses"]), json.dumps(["Businesses"]), "No", json.dumps(["business", "startup"])
    )
    
    # 4. SWADHAR Greh
    swadhar_greh_slug = "swadhar-greh-scheme"
    swadhar_greh_listing = (
        swadhar_greh_slug, "Swadhar Greh Scheme", "Swadhar Greh", "Ministry of Women and Child Development", "", "Central",
        json.dumps(["Women", "Social Welfare"]), "Scheme for Women in Difficult Circumstances.", json.dumps(["women", "widow", "shelter"])
    )
    swadhar_greh_detail = (
        swadhar_greh_slug, "Swadhar Greh Scheme",
        "Women above 18 years of age who are deserted and are without any social and economic support. Women survivors of natural disasters who have been rendered homeless. Women prisoners released from jail and without family support. Women survivors of domestic violence, widows discarded by their families.",
        "Shelter, food, clothing, and health as well as economic and social security are provided. Free legal aid and guidance are also given.",
        "The scheme aims to provide a supportive institutional framework for women victims of difficult circumstances.",
        "[]", "Identity proof if available, though destitute women are accommodated without prior documents.", "",
        "https://wcd.nic.in/", "NGOs and State Governments", "Ministry of Women and Child Development", "",
        "Centrally Sponsored Scheme", json.dumps(["Shelter", "Food", "Legal Aid"]), json.dumps(["Social Welfare"]), json.dumps(["Individuals"]), json.dumps(["Women"]), "No", json.dumps(["women", "widow", "shelter"])
    )

    listings = [pm_kisan_listing, pre_matric_sc_listing, startup_india_listing, swadhar_greh_listing]
    details = [pm_kisan_detail, pre_matric_sc_detail, startup_india_detail, swadhar_greh_detail]

    # Insert into database
    conn.executemany(f"INSERT OR REPLACE INTO listings VALUES ({','.join(['?']*10)})", listings)
    conn.executemany(f"INSERT OR REPLACE INTO details VALUES ({','.join(['?']*20)})", details)
    conn.commit()
    conn.close()
    print("Database populated with 4 realistic schemes.")

if __name__ == "__main__":
    generate_dummy_db()
