"""
Decision tree definition for the scheme recommender questionnaire.

Each node defines:
  - id: unique string
  - question: display text
  - widget: "selectbox" | "multiselect" | "radio" | "slider" | "number" | "text"
  - options: list of (display_label, value_key) tuples (for select/radio/multiselect)
  - slider_range: (min, max, default, step) for sliders
  - profile_key: key written to the user profile dict
  - next: static next node id, OR a dict mapping value_key → next node id
  - terminal: if True, this is the last node before going to results
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

STATES = [
    "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh",
    "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir",
    "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
    "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
    "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
]

BENEFIT_OPTIONS = [
    ("Scholarship / Educational funding", "scholarship"),
    ("Financial assistance / Cash benefit", "financial"),
    ("Loan / Credit support", "loan"),
    ("Skill training / Vocational course", "training"),
    ("Healthcare / Medical support", "healthcare"),
    ("Housing / Shelter", "housing"),
    ("Insurance / Accident coverage", "insurance"),
    ("Pension / Old-age support", "pension"),
    ("Award / Recognition / Grant", "award"),
    ("Equipment / Tools / Agricultural inputs", "equipment"),
    ("Subsidy (on purchases or services)", "subsidy"),
]

SECTOR_OPTIONS = [
    ("Education & Learning", "Education & Learning"),
    ("Agriculture, Rural & Environment", "Agriculture,Rural & Environment"),
    ("Business & Entrepreneurship", "Business & Entrepreneurship"),
    ("Social Welfare & Empowerment", "Social welfare & Empowerment"),
    ("Health & Wellness", "Health & Wellness"),
    ("Skills & Employment", "Skills & Employment"),
    ("Housing & Shelter", "Housing & Shelter"),
    ("Sports & Culture", "Sports & Culture"),
    ("Banking & Financial Services", "Banking,Financial Services and Insurance"),
    ("Science, IT & Communications", "Science, IT & Communications"),
    ("Women and Child", "Women and Child"),
]

# ── Node definitions ───────────────────────────────────────────────────────────

NODES: dict[str, dict] = {

    # ── ROOT ──────────────────────────────────────────────────────────────────
    "root": {
        "question": "Who is primarily applying for schemes?",
        "hint": "Choose what best describes the applicant.",
        "widget": "radio",
        "profile_key": "applicant_type",
        "options": [
            ("👤 Myself (as an individual)", "individual"),
            ("🏢 My Business / Enterprise", "business"),
            ("🏠 My Family / Household", "family"),
        ],
        "next": {
            "individual": "state",
            "business":   "biz_state",
            "family":     "fam_state",
        },
    },

    # ── INDIVIDUAL BRANCH ─────────────────────────────────────────────────────
    "state": {
        "question": "Which state or UT do you live in?",
        "widget": "selectbox",
        "profile_key": "state",
        "options": [(s, s) for s in STATES],
        "next": "age",
    },

    "age": {
        "question": "How old are you?",
        "widget": "slider",
        "profile_key": "age",
        "slider_range": (5, 100, 25, 1),
        "next": "gender",
    },

    "gender": {
        "question": "What is your gender?",
        "widget": "radio",
        "profile_key": "gender",
        "options": [
            ("Male", "male"),
            ("Female", "female"),
            ("Transgender", "transgender"),
            ("Prefer not to say", "any"),
        ],
        "next": "caste",
    },

    "caste": {
        "question": "What is your caste category?",
        "hint": "This is used to match caste-specific government schemes. Select one.",
        "widget": "radio",
        "profile_key": "caste",
        "options": [
            ("General / Unreserved", "general"),
            ("OBC — Other Backward Class", "obc"),
            ("SC — Scheduled Caste", "sc"),
            ("ST — Scheduled Tribe", "st"),
            ("EWS — Economically Weaker Section", "ews"),
        ],
        "next": "special_status",
    },

    "special_status": {
        "question": "Do any of these apply to you?",
        "hint": "Select all that apply. If none apply, select 'None of the above' — this removes you from schemes exclusively for those groups.",
        "widget": "multiselect",
        "profile_key": "special_status",
        "options": [
            ("BPL card holder (Below Poverty Line)", "bpl"),
            ("Widow / Widower", "widow"),
            ("Person with disability (PwD / Divyang)", "disabled"),
            ("Orphan", "orphan"),
            ("Minority religion (Muslim / Christian / Sikh / Buddhist / Parsi / Jain)", "minority"),
            ("Ex-Serviceman or family member of Ex-Serviceman", "exserviceman"),
            ("None of the above", "none"),
        ],
        "next": "specific_circumstances",
    },

    "specific_circumstances": {
        "question": "Do any of these specific situations apply to you or your immediate family?",
        "hint": "These unlock additional targeted schemes often missed by standard portals. Select all that apply.",
        "widget": "multiselect",
        "profile_key": "specific_circumstances",
        "options": [
            ("My parent / guardian works or worked as a sanitation worker, Safai Karamchari, or manual scavenger", "sanitation_child"),
            ("I belong to a Nomadic or Denotified Tribe (NT / DNT / Vimukta Jati)", "nomadic_tribe"),
            ("A family member is currently imprisoned / incarcerated", "prisoner_family"),
            ("I or a family member is an acid attack survivor", "acid_victim"),
            ("I or a family member is living with HIV / AIDS", "hiv_affected"),
            ("I or a family member is a cancer patient or survivor", "cancer"),
            ("I am a handloom weaver or Khadi artisan", "weaver"),
            ("I am a street vendor / hawker", "street_vendor"),
            ("None of the above", "none"),
        ],
        "next": "occupation",
    },

    "occupation": {
        "question": "What best describes your current primary situation?",
        "hint": "Pick the one that fits best — this drives which sub-questions you'll see next.",
        "widget": "radio",
        "profile_key": "occupation",
        "options": [
            ("🎓 Student (currently enrolled in an educational program)", "student"),
            ("🌾 Farmer / Agricultural worker", "farmer"),
            ("🔨 Construction / Building worker", "construction"),
            ("⚙️ Factory / Industrial / Daily wage worker", "labourer"),
            ("🎨 Artist, Craftsman or Cultural practitioner", "artist"),
            ("🐟 Fisherman / Fisher", "fisherman"),
            ("🏃 Sportsperson / Athlete", "sportsperson"),
            ("💼 Entrepreneur / Self-employed / Running a business", "entrepreneur"),
            ("🏛️ Salaried — Government / PSU employee", "govt_emp"),
            ("💻 Salaried — Private sector employee", "salaried_private"),
            ("🔍 Unemployed / Looking for work", "unemployed"),
            ("🏠 Homemaker (not currently employed)", "homemaker"),
            ("👴 Senior Citizen (60+ years, retired)", "senior"),
            ("👨‍⚕️ Healthcare professional (doctor / nurse / paramedic)", "healthcare"),
            ("📰 Journalist / Media professional", "journalist"),
        ],
        "next": {
            "student":          "student_level",
            "farmer":           "farmer_type",
            "construction":     "construction_board",
            "labourer":         "labourer_type",
            "artist":           "artist_type",
            "fisherman":        "fish_type",
            "sportsperson":     "sport_level",
            "entrepreneur":     "biz_size",
            "govt_emp":         "income_band",
            "salaried_private": "income_band",
            "unemployed":       "unemployed_goal",
            "homemaker":        "income_band",
            "senior":           "senior_income",
            "healthcare":       "income_band",
            "journalist":       "income_band",
        },
    },

    # ── STUDENT SUB-BRANCH ────────────────────────────────────────────────────
    "student_level": {
        "question": "What level are you currently studying at?",
        "widget": "radio",
        "profile_key": "student_level",
        "options": [
            ("Class 1–8 (Primary / Upper Primary school)", "school"),
            ("Class 9–10 (Secondary / Matriculation)", "class10"),
            ("Class 11–12 (Senior Secondary / Intermediate / +2)", "class12"),
            ("Diploma / ITI / Polytechnic", "diploma"),
            ("Undergraduate degree (B.A. / B.Sc. / B.Com. / B.Tech / MBBS / LLB etc.)", "ug"),
            ("Postgraduate degree (M.A. / M.Sc. / M.Tech / MBA / MD etc.)", "pg"),
            ("PhD / Doctoral / Research Scholar / Fellowship", "phd"),
        ],
        "next": {
            "school":   "income_band",       # no marks for primary school
            "class10":  "student_marks",
            "class12":  "student_stream_12",
            "diploma":  "student_trade",
            "ug":       "student_ug_course",
            "pg":       "student_pg_course",
            "phd":      "student_phd_field",
        },
    },

    "student_marks": {
        "question": "What percentage did you score in your last qualifying / board examination?",
        "hint": "Drag to your approximate score. Many scholarships require 60%+ or 75%+. This filters out schemes you likely won't qualify for.",
        "widget": "slider",
        "profile_key": "marks_pct",
        "slider_range": (30, 100, 65, 1),
        "next": "student_achievements",
    },

    "student_achievements": {
        "question": "Do you have any of these achievements? Select all that apply.",
        "hint": "Unlocks merit-based awards, Olympiad fellowships, and sports grants invisible to standard portals.",
        "widget": "multiselect",
        "profile_key": "student_achievements",
        "options": [
            ("Board / University topper, rank holder, or merit list (first class with distinction)", "board_topper"),
            ("NTSE / KVPY / INSPIRE or Science / Maths Olympiad participant or winner", "olympiad"),
            ("National or State level sports achievement / award", "sports_award"),
            ("Research paper published or patent filed / granted", "research"),
            ("National / State level cultural or arts award", "cultural_award"),
            ("None of the above", "none"),
        ],
        "next": "income_band",
    },

    "student_engg_branch": {
        "question": "Which engineering branch / department are you officially enrolled in?",
        "hint": "This is your actual department — used to filter out schemes that are restricted to a different branch.",
        "widget": "radio",
        "profile_key": "engg_branch",
        "options": [
            ("Computer Science / IT / AI / Data Science / Cyber Security", "cs_it"),
            ("Electronics / Electrical / Communication / VLSI / Embedded Systems", "electronics"),
            ("Mechanical / Civil / Aerospace / Automobile / Structural", "mechanical"),
            ("Biotechnology / Biomedical / Bioinformatics / Genetic Engineering", "biotech"),
            ("Chemical / Petrochemical / Process Engineering", "chemical"),
            ("Textile / Leather / Fashion Technology", "textile"),
            ("Mining / Metallurgy / Materials Engineering", "mining"),
            ("Other engineering branch", "other"),
        ],
        "next": "student_engg_interests",
    },

    "student_engg_interests": {
        "question": "Which fields are you open to for scholarships, internships, or research? Select all that interest you.",
        "hint": "Your branch is already set above. This expands your results — e.g. an Electronics student can also see CS internships they qualify for.",
        "widget": "multiselect",
        "profile_key": "engg_interests",
        "options": [
            ("Computer Science / IT / AI / Data Science / Cyber Security", "cs_it"),
            ("Electronics / Electrical / Embedded / Communication", "electronics"),
            ("Mechanical / Civil / Aerospace / Manufacturing", "mechanical"),
            ("Biotechnology / Biomedical / Life Sciences", "biotech"),
            ("Chemical / Process / Energy Engineering", "chemical"),
            ("Textile / Leather / Fashion Technology", "textile"),
            ("Mining / Metallurgy / Materials", "mining"),
            ("Any engineering field", "any"),
        ],
        "next": "student_marks",
    },

    "student_stream_12": {
        "question": "Which stream are you in for Class 11–12?",
        "widget": "radio",
        "profile_key": "student_stream",
        "options": [
            ("Science (Physics, Chemistry, Biology / Maths)", "science"),
            ("Commerce (Accountancy, Economics, Business Studies)", "commerce"),
            ("Arts / Humanities", "arts"),
            ("Vocational / Technical", "vocational"),
        ],
        "next": "student_marks",
    },

    "student_trade": {
        "question": "What trade or field are you studying in your Diploma / ITI?",
        "widget": "radio",
        "profile_key": "student_trade",
        "options": [
            ("Engineering trades (Electrician, Fitter, Mechanic, Welder, etc.)", "engineering"),
            ("Non-engineering trades (Stenography, Data Entry, COPA, etc.)", "non_engineering"),
            ("Agriculture / Horticulture", "agriculture"),
            ("Paramedical / Health care", "paramedical"),
            ("Fashion / Textile / Beauty", "fashion"),
            ("Other", "other"),
        ],
        "next": "student_marks",
    },

    "student_ug_course": {
        "question": "What undergraduate course are you pursuing?",
        "widget": "radio",
        "profile_key": "student_course",
        "options": [
            ("B.Tech / B.E. (Engineering)", "btech"),
            ("MBBS / BDS (Medical / Dental)", "mbbs"),
            ("B.Sc. (Science — Physics / Chemistry / Biology / Maths)", "bsc"),
            ("B.A. (Arts / Humanities / Social Sciences)", "ba"),
            ("B.Com. (Commerce)", "bcom"),
            ("B.Agri / B.Hort. (Agriculture / Horticulture)", "bagri"),
            ("LLB (Law)", "law"),
            ("BBA / BMS / BCA (Management / Computer Applications)", "bba"),
            ("B.Pharm / B.Nursing / Allied Health", "pharma"),
            ("BFA / BPA (Fine Arts / Performing Arts)", "arts"),
            ("Other", "other"),
        ],
        "next": {
            "btech":  "student_engg_branch",   # ask branch for engineering
            "_default": "student_marks",
        },
    },

    "student_pg_course": {
        "question": "What postgraduate course are you pursuing?",
        "widget": "radio",
        "profile_key": "student_course",
        "options": [
            ("M.Tech / M.E. (Engineering)", "mtech"),
            ("MD / MS / MDS (Medical / Dental)", "md"),
            ("M.Sc. (Science)", "msc"),
            ("M.A. (Arts / Humanities / Social Sciences)", "ma"),
            ("M.Com. (Commerce)", "mcom"),
            ("M.Agri / M.Hort. (Agriculture)", "magri"),
            ("MBA / PGDM (Management)", "mba"),
            ("LLM (Law)", "law"),
            ("M.Pharm / M.Nursing / Allied Health", "mpharma"),
            ("MFA / MPA (Fine / Performing Arts)", "arts"),
            ("M.Phil (Pre-PhD research)", "mphil"),
            ("Other", "other"),
        ],
        "next": {
            "mtech": "student_engg_branch",   # ask branch for PG engineering
            "_default": "student_marks",
        },
    },

    "student_phd_field": {
        "question": "What is your research field?",
        "widget": "radio",
        "profile_key": "student_phd_field",
        "options": [
            ("Science & Technology / Engineering", "science_tech"),
            ("Agriculture, Veterinary & Allied Sciences", "agriculture"),
            ("Medical / Health Sciences", "medical"),
            ("Social Sciences / Economics / Political Science", "social"),
            ("Humanities / Language / Literature", "humanities"),
            ("Management / Commerce", "management"),
            ("Law", "law"),
            ("Fine Arts / Performing Arts", "arts"),
            ("Other / Interdisciplinary", "other"),
        ],
        "next": "student_marks",
    },

    # ── FARMER SUB-BRANCH ─────────────────────────────────────────────────────
    "farmer_type": {
        "question": "How much agricultural land do you own or cultivate?",
        "hint": "1 hectare ≈ 2.5 acres",
        "widget": "radio",
        "profile_key": "farmer_land",
        "options": [
            ("Marginal farmer — less than 1 hectare (< 2.5 acres)", "marginal"),
            ("Small farmer — 1 to 2 hectares (2.5–5 acres)", "small"),
            ("Semi-medium — 2 to 4 hectares (5–10 acres)", "semi_medium"),
            ("Medium — 4 to 10 hectares (10–25 acres)", "medium"),
            ("Large — more than 10 hectares (> 25 acres)", "large"),
            ("No land / Tenant / Lease farmer", "no_land"),
        ],
        "next": "farmer_activity",
    },

    "farmer_activity": {
        "question": "What is your primary farming activity? Select all that apply.",
        "widget": "multiselect",
        "profile_key": "farmer_activity",
        "options": [
            ("Food crops (rice, wheat, maize, pulses, etc.)", "food_crops"),
            ("Cash crops (sugarcane, cotton, tobacco, jute)", "cash_crops"),
            ("Horticulture / Fruits & vegetables", "horticulture"),
            ("Spice crops (chillies, turmeric, ginger, etc.)", "spices"),
            ("Organic farming", "organic"),
            ("Dairy / Livestock (cows, buffaloes, goats)", "dairy"),
            ("Poultry", "poultry"),
            ("Sericulture / Silk farming", "sericulture"),
            ("Fisheries / Aquaculture (inland or marine)", "fisheries"),
            ("Beekeeping / Honey production", "beekeeping"),
            ("Forestry / Agroforestry", "forestry"),
        ],
        "next": "farmer_kcc",
    },

    "farmer_kcc": {
        "question": "Do you have a Kisan Credit Card (KCC)?",
        "widget": "radio",
        "profile_key": "farmer_kcc",
        "options": [
            ("Yes", "yes"),
            ("No", "no"),
            ("Applied but pending", "pending"),
        ],
        "next": "income_band",
    },

    # ── WORKER SUB-BRANCHES ───────────────────────────────────────────────────
    "construction_board": {
        "question": "Are you registered with your State's Construction Workers Welfare Board?",
        "hint": "Registration unlocks additional state-specific construction worker schemes.",
        "widget": "radio",
        "profile_key": "construction_board",
        "options": [
            ("Yes, registered", "yes"),
            ("No", "no"),
            ("Applied but not yet registered", "pending"),
        ],
        "next": "income_band",
    },

    "labourer_type": {
        "question": "What type of worker are you?",
        "widget": "radio",
        "profile_key": "labourer_type",
        "options": [
            ("Factory / Industrial worker (organized sector with PF/ESI)", "organized"),
            ("Domestic worker", "domestic"),
            ("Unorganized sector / Daily wage worker", "unorganized"),
            ("Migrant worker", "migrant"),
            ("Street vendor / Hawker", "vendor"),
        ],
        "next": "income_band",
    },

    # ── ARTIST SUB-BRANCH ─────────────────────────────────────────────────────
    "artist_type": {
        "question": "What type of art or craft do you practice?",
        "widget": "radio",
        "profile_key": "artist_type",
        "options": [
            ("Handloom / Weaving / Textile", "handloom"),
            ("Pottery / Ceramics", "pottery"),
            ("Sculpture / Wood carving / Stone carving", "sculpture"),
            ("Painting (including folk / tribal painting)", "painting"),
            ("Classical / Folk music", "music"),
            ("Classical / Folk dance", "dance"),
            ("Theatre / Drama", "theatre"),
            ("Metalwork / Jewellery / Brassware", "metalwork"),
            ("Leather craft / Shoe making", "leather"),
            ("Other traditional / folk craft", "other"),
        ],
        "next": "income_band",
    },

    # ── FISHERMAN SUB-BRANCH ──────────────────────────────────────────────────
    "fish_type": {
        "question": "What type of fishing do you primarily do?",
        "widget": "radio",
        "profile_key": "fish_type",
        "options": [
            ("Inland / Freshwater fishing (rivers, lakes, ponds)", "inland"),
            ("Marine / Sea fishing", "marine"),
            ("Aquaculture / Fish farming (ponds or tanks)", "aquaculture"),
            ("Both inland and marine", "both"),
        ],
        "next": "income_band",
    },

    # ── SPORTSPERSON SUB-BRANCH ───────────────────────────────────────────────
    "sport_level": {
        "question": "What is your highest level of sports participation?",
        "widget": "radio",
        "profile_key": "sport_level",
        "options": [
            ("School / District level", "school"),
            ("State level", "state"),
            ("National level", "national"),
            ("International level (representing India)", "international"),
        ],
        "next": "income_band",
    },

    # ── UNEMPLOYED SUB-BRANCH ─────────────────────────────────────────────────
    "unemployed_goal": {
        "question": "What are you primarily looking for?",
        "widget": "radio",
        "profile_key": "unemployed_goal",
        "options": [
            ("Employment — job placement support", "job"),
            ("Skill training — to improve my chances of getting a job", "skill"),
            ("Start my own business / become self-employed", "business"),
            ("Financial support while I look for work", "financial"),
        ],
        "next": "income_band",
    },

    # ── SENIOR CITIZEN SUB-BRANCH ─────────────────────────────────────────────
    "senior_income": {
        "question": "Do you have a regular income or pension?",
        "widget": "radio",
        "profile_key": "senior_income",
        "options": [
            ("Yes — government / central pension (e.g., NPS, EPFO)", "govt_pension"),
            ("Yes — from savings, family, or private sources", "other_income"),
            ("No regular income", "no_income"),
        ],
        "next": "income_band",
    },

    # ── SHARED: INCOME ────────────────────────────────────────────────────────
    "income_band": {
        "question": "What is your approximate annual household income?",
        "hint": "This helps match income-restricted and BPL schemes precisely.",
        "widget": "radio",
        "profile_key": "income_band",
        "options": [
            ("Below ₹1 lakh per year (very low income / BPL)", "below_1l"),
            ("₹1 lakh – ₹2.5 lakh per year", "1l_2.5l"),
            ("₹2.5 lakh – ₹5 lakh per year", "2.5l_5l"),
            ("₹5 lakh – ₹8 lakh per year", "5l_8l"),
            ("Above ₹8 lakh per year", "above_8l"),
        ],
        "next": "benefit_prefs",
    },

    # ── PREFERENCES (terminal) ────────────────────────────────────────────────
    "benefit_prefs": {
        "question": "What kind of benefit matters most to you? Select up to 4.",
        "hint": "Your selections boost matching schemes in the ranking. This does not filter out other results.",
        "widget": "multiselect",
        "profile_key": "benefit_prefs",
        "options": BENEFIT_OPTIONS,
        "next": "sector_prefs",
    },

    "sector_prefs": {
        "question": "Which sectors are most relevant to you? Select up to 3.",
        "hint": "Optional — helps surface the most personally relevant schemes.",
        "widget": "multiselect",
        "profile_key": "sector_prefs",
        "options": SECTOR_OPTIONS,
        "next": None,  # terminal — go to results
        "terminal": True,
    },

    # ══════════════════════════════════════════════════════════════════════════
    # BUSINESS BRANCH
    # ══════════════════════════════════════════════════════════════════════════
    "biz_state": {
        "question": "Which state or UT is your business located in?",
        "widget": "selectbox",
        "profile_key": "state",
        "options": [(s, s) for s in STATES],
        "next": "biz_size",
    },

    "biz_size": {
        "question": "What is the size of your business / enterprise?",
        "hint": "Based on MSME classification (investment + turnover).",
        "widget": "radio",
        "profile_key": "biz_size",
        "options": [
            ("Micro enterprise (investment < ₹1 Cr, turnover < ₹5 Cr)", "micro"),
            ("Small enterprise (investment < ₹10 Cr, turnover < ₹50 Cr)", "small"),
            ("Medium enterprise (investment < ₹50 Cr, turnover < ₹250 Cr)", "medium"),
            ("Large enterprise (above medium thresholds)", "large"),
            ("Startup (< 2 years old, DPIIT / state recognized)", "startup"),
            ("Sole proprietor / Freelancer / Informal business", "informal"),
        ],
        "next": "biz_sector",
    },

    "biz_sector": {
        "question": "What sector does your business operate in?",
        "widget": "radio",
        "profile_key": "biz_sector",
        "options": [
            ("Manufacturing (production of goods)", "manufacturing"),
            ("Services (consultancy, IT, finance, etc.)", "services"),
            ("Agriculture / Food processing / Agri-tech", "agri"),
            ("Tourism / Hospitality", "tourism"),
            ("Handicrafts / Handloom / Traditional crafts", "handicrafts"),
            ("Retail / Trading", "retail"),
            ("Other", "other"),
        ],
        "next": "biz_registered",
    },

    "biz_registered": {
        "question": "Is your business registered with Udyam (MSME portal)?",
        "widget": "radio",
        "profile_key": "biz_udyam",
        "options": [
            ("Yes, Udyam registered", "yes"),
            ("No", "no"),
            ("Applied / In process", "pending"),
        ],
        "next": "biz_owner_bg",
    },

    "biz_owner_bg": {
        "question": "Does the primary business owner / promoter belong to any of these groups? Select all that apply.",
        "hint": "Many schemes specifically target businesses owned by these groups.",
        "widget": "multiselect",
        "profile_key": "biz_owner_groups",
        "options": [
            ("Woman entrepreneur", "woman"),
            ("SC / ST category", "sc_st"),
            ("Person with disability (PwD)", "disabled"),
            ("Minority community", "minority"),
            ("Ex-Serviceman", "exserviceman"),
            ("None of the above", "none"),
        ],
        "next": "biz_needs",
    },

    "biz_needs": {
        "question": "What support are you looking for? Select up to 3.",
        "widget": "multiselect",
        "profile_key": "benefit_prefs",
        "options": [
            ("Capital investment subsidy", "subsidy"),
            ("Loan / Credit at lower interest", "loan"),
            ("Quality certification reimbursement", "certification"),
            ("Technology / Equipment upgrade support", "equipment"),
            ("Export assistance / Trade fair participation", "export"),
            ("Skill training for workers", "training"),
            ("Land / Infrastructure support", "infrastructure"),
            ("Market development / Branding", "marketing"),
        ],
        "next": None,
        "terminal": True,
    },

    # ══════════════════════════════════════════════════════════════════════════
    # FAMILY BRANCH
    # ══════════════════════════════════════════════════════════════════════════
    "fam_state": {
        "question": "Which state or UT does your family live in?",
        "widget": "selectbox",
        "profile_key": "state",
        "options": [(s, s) for s in STATES],
        "next": "fam_income",
    },

    "fam_income": {
        "question": "What is your approximate annual household income?",
        "widget": "radio",
        "profile_key": "income_band",
        "options": [
            ("Below ₹1 lakh (very low income / BPL card)", "below_1l"),
            ("₹1 lakh – ₹2.5 lakh", "1l_2.5l"),
            ("₹2.5 lakh – ₹5 lakh", "2.5l_5l"),
            ("₹5 lakh – ₹8 lakh", "5l_8l"),
            ("Above ₹8 lakh", "above_8l"),
        ],
        "next": "fam_caste",
    },

    "fam_caste": {
        "question": "What is your caste category?",
        "widget": "radio",
        "profile_key": "caste",
        "options": [
            ("General / Unreserved", "general"),
            ("OBC", "obc"),
            ("SC — Scheduled Caste", "sc"),
            ("ST — Scheduled Tribe", "st"),
            ("EWS", "ews"),
        ],
        "next": "fam_who",
    },

    "fam_who": {
        "question": "Who in your family needs support? Select all that apply.",
        "widget": "multiselect",
        "profile_key": "fam_members",
        "options": [
            ("Pregnant woman / New mother (maternity / nutrition)", "pregnant"),
            ("Child under 6 years (ICDS, nutrition, vaccination)", "child_under6"),
            ("School-age child (6–18 years) needing educational support", "school_child"),
            ("Daughter (for marriage assistance / girl-child schemes)", "daughter"),
            ("Elderly parent (60+ years, pension / healthcare)", "elderly"),
            ("Person with disability in the family", "disabled"),
            ("Widow (self or family member)", "widow"),
        ],
        "next": "fam_needs",
    },

    "fam_needs": {
        "question": "What kind of support are you looking for? Select up to 3.",
        "widget": "multiselect",
        "profile_key": "benefit_prefs",
        "options": [
            ("Nutrition / Food security", "nutrition"),
            ("Healthcare / Medical treatment", "healthcare"),
            ("Education / Scholarship for children", "scholarship"),
            ("Marriage assistance / Girls welfare", "marriage"),
            ("Housing / Shelter", "housing"),
            ("Pension / Old-age support", "pension"),
            ("Financial assistance / Cash transfer", "financial"),
            ("Insurance / Death / Accident benefit", "insurance"),
        ],
        "next": None,
        "terminal": True,
    },
}


def get_node(node_id: str) -> dict:
    return NODES[node_id]


def get_next_node(node_id: str, answer_value: str | list) -> str | None:
    """Return the next node id given the current node and the user's answer."""
    node = NODES[node_id]
    nxt = node.get("next")
    if nxt is None:
        return None
    if isinstance(nxt, str):
        return nxt
    # dict: map answer value → next node
    if isinstance(answer_value, list):
        # For multiselect, use the first selected value to branch (or fallback)
        for v in answer_value:
            if v in nxt:
                return nxt[v]
        return nxt.get("_default")
    return nxt.get(str(answer_value))


def income_band_to_annual(band: str) -> int | None:
    """Convert income band label to approximate annual INR for filtering.
    'above_8l' returns a large concrete number so income-capped schemes are hard-excluded."""
    mapping = {
        "below_1l": 100_000,
        "1l_2.5l":  250_000,
        "2.5l_5l":  500_000,
        "5l_8l":    800_000,
        "above_8l": 10_000_000,   # ₹1 Cr — effectively "no limit" but still comparable
    }
    return mapping.get(band)
