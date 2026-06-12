"""
Scoring engine: takes a user profile dict and returns ranked scheme results.

Each scheme gets a score 0–100 and a match summary.
Score -1 = hard excluded (definitely ineligible).

Usage (standalone test):
    uv run python -m recommender.scorer
"""
from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from recommender.questions import income_band_to_annual

DB_PATH = Path("cache/schemes.db")

# ── Weights ───────────────────────────────────────────────────────────────────

W_GEOGRAPHIC        = 15
W_OCCUPATION        = 25
W_STUDENT_SUBLEVEL  = 10
W_FARMER_SIZE       = 5
W_CASTE_SPECIFIC    = 10
W_INCOME            = 8
W_GENDER_FEMALE     = 5
W_BENEFIT_PREF      = 10
W_SECTOR_PREF       = 7
W_SPECIAL_STATUS    = 5

ALL_OCC_KEYS = [
    "occ_student", "occ_farmer", "occ_construction", "occ_labourer", "occ_artist",
    "occ_fisherman", "occ_sportsperson", "occ_entrepreneur", "occ_govt_emp",
    "occ_teacher", "occ_healthcare", "occ_journalist", "occ_unemployed",
    "occ_senior", "occ_homemaker",
]
OCC_ALIAS = {
    "salaried_private": "occ_govt_emp",
    "govt_emp":         "occ_govt_emp",
}
REQ_MAP = {
    "req_bpl":          "bpl",
    "req_widow":        "widow",
    "req_disabled":     "disabled",
    "req_orphan":       "orphan",
    "req_minority":     "minority",
    "req_exserviceman": "exserviceman",
}


def _caste_flags_str(pe: dict) -> str:
    labels = {"caste_sc": "SC", "caste_st": "ST", "caste_obc": "OBC",
              "caste_ews": "EWS", "caste_general": "General"}
    return ", ".join(v for k, v in labels.items() if pe.get(k))


def _farmer_size_matches(pe: dict, land: str | None) -> bool:
    if not land:
        return False
    if land == "marginal" and pe.get("farmer_marginal"):
        return True
    if land == "small" and pe.get("farmer_small"):
        return True
    if pe.get("farmer_any"):
        return True
    return False


def score_scheme(pe: dict, listing: dict, detail: dict, user: dict) -> tuple[int, dict]:
    """
    Returns (score, explanation).
    score == -1 → hard excluded.
    score 0-100 → eligible, higher = more relevant.
    """
    user_state  = user.get("state", "")
    user_age    = int(user.get("age", 0))
    user_gender = user.get("gender", "any")
    user_caste  = user.get("caste", "general")
    user_special = set(s for s in user.get("special_status", []) if s != "none")
    user_occ    = user.get("occupation", "")
    user_income = income_band_to_annual(user.get("income_band", "above_8l"))
    user_marks  = user.get("marks_pct")  # integer 30-100 or None

    # ── HARD EXCLUSIONS ───────────────────────────────────────────────────────

    # 0. Institution-only scheme: this recommender is for individual applicants only
    applicant_type = user.get("applicant_type", "individual")
    if applicant_type == "individual" and not pe.get("for_individual", 1):
        return -1, {"excluded_by": "not_for_individuals"}

    # 1. State lock
    state_locked = pe.get("state_locked")
    if state_locked and state_locked.lower() != user_state.lower():
        return -1, {"excluded_by": "state", "requires": state_locked}

    # 2. Gender restriction
    gender_any = pe.get("gender_any", 1)
    if not gender_any:
        is_f, is_m, is_t = user_gender=="female", user_gender=="male", user_gender=="transgender"
        if pe.get("gender_female") and not pe.get("gender_male") and not is_f and not is_t:
            return -1, {"excluded_by": "gender", "requires": "Female"}
        if pe.get("gender_male") and not pe.get("gender_female") and not is_m:
            return -1, {"excluded_by": "gender", "requires": "Male"}
        if pe.get("gender_trans") and not pe.get("gender_female") and not pe.get("gender_male") and not is_t:
            return -1, {"excluded_by": "gender", "requires": "Transgender"}

    # 3. Age bounds
    age_min, age_max = pe.get("age_min"), pe.get("age_max")
    if age_min and user_age and user_age < age_min:
        return -1, {"excluded_by": "age", "requires": f"≥ {age_min} years"}
    if age_max and user_age and user_age > age_max:
        return -1, {"excluded_by": "age", "requires": f"≤ {age_max} years"}

    # 4. Caste restriction
    caste_any = pe.get("caste_any", 1)
    if not caste_any:
        if not pe.get(f"caste_{user_caste}"):
            return -1, {"excluded_by": "caste", "requires": _caste_flags_str(pe)}

    # 5. Occupation hard filter
    #    Scheme has explicit occupation targeting → user must match one of them.
    if pe.get("has_occ_restriction"):
        occ_key = OCC_ALIAS.get(user_occ, f"occ_{user_occ}")
        if not pe.get(occ_key):
            return -1, {"excluded_by": "occupation"}

    # 6. Special status hard filter
    #
    # Rule: hard-exclude when user meets NONE of the scheme's special-status requirements
    #       AND the scheme has no caste restriction (caste_any=1).
    #
    # Why caste matters here:
    #   - Caste-restricted schemes (caste_any=0) list "SC/ST/OBC/BPL" as a group —
    #     the caste check (step 4) already determined eligibility. req_bpl is a co-listed
    #     category, not the sole filter.
    #   - Caste-unrestricted schemes (caste_any=1) use special status as the PRIMARY filter:
    #     "ex-serviceman ward", "widow", "minority" — if you don't have that status you can't apply.
    #
    # Examples that work correctly:
    #   Ex-serviceman scholarship (caste_any=1, req_exserviceman=1):
    #     → non-ex-serviceman is EXCLUDED ✓
    #   SC/ST/BPL farmer scheme (caste_any=0, req_bpl=1):
    #     → SC farmer (not BPL) already passed the caste check → NOT excluded here ✓
    #   Widow pension (caste_any=1, req_widow=1):
    #     → non-widow is EXCLUDED ✓
    scheme_req_special = {f: uk for f, uk in REQ_MAP.items() if pe.get(f)}
    if scheme_req_special:
        user_meets_any_special = any(uk in user_special for uk in scheme_req_special.values())
        if not user_meets_any_special:
            scheme_is_caste_restricted = not pe.get("caste_any", 1)
            if not scheme_is_caste_restricted:
                # Special status IS the primary filter — hard exclude
                return -1, {"excluded_by": "special_status",
                            "requires": list(scheme_req_special.values())}
            # Caste-restricted scheme: user's caste already qualified them in step 4;
            # special status here is a co-listed category, not an exclusive requirement.
            # Fall through to soft scoring.

    # 7. Hyper-specific circumstance hard filter
    #    Same rule as special_status: hard-exclude when scheme has no caste restriction
    #    (meaning the specific circumstance IS the primary targeting criterion).
    _CIRCUMSTANCE_FLAGS = {
        "sanitation_child": "req_sanitation_child",
        "nomadic_tribe":    "req_nomadic_tribe",
        "prisoner_family":  "req_prisoner_family",
        "acid_victim":      "req_acid_victim",
        "hiv_affected":     "req_hiv_affected",
        "cancer":           "req_cancer",
        "weaver":           "req_weaver",
        "street_vendor":    "req_street_vendor",
    }
    user_circumstances = set(
        c for c in user.get("specific_circumstances", []) if c != "none"
    )
    scheme_is_caste_restricted = not pe.get("caste_any", 1)
    if not scheme_is_caste_restricted:
        for user_key, pe_flag in _CIRCUMSTANCE_FLAGS.items():
            if pe.get(pe_flag) and user_key not in user_circumstances:
                return -1, {"excluded_by": "specific_circumstance", "requires": user_key}

    # Bonus: if user has a specific circumstance that the scheme targets → soft bonus
    for user_key, pe_flag in _CIRCUMSTANCE_FLAGS.items():
        if pe.get(pe_flag) and user_key in user_circumstances:
            pass  # handled in soft scoring below

    # 8. Student education level hard filter
    #    If a scheme targets specific education levels and user is below the minimum, exclude.
    LEVEL_ORDER = {"school": 0, "class10": 1, "class12": 2, "diploma": 3, "ug": 4, "pg": 5, "phd": 6}
    if user_occ == "student":
        user_level = user.get("student_level", "")
        user_rank = LEVEL_ORDER.get(user_level, -1)
        if user_rank >= 0:
            scheme_level_flags = {
                lvl: pe.get(f"student_{lvl}", 0)
                for lvl in LEVEL_ORDER
            }
            scheme_levels = {lvl for lvl, flag in scheme_level_flags.items() if flag}
            if scheme_levels:
                min_scheme_rank = min(LEVEL_ORDER[l] for l in scheme_levels)
                max_scheme_rank = max(LEVEL_ORDER[l] for l in scheme_levels)
                # Exclude if user is strictly below the minimum level the scheme targets
                if user_rank < min_scheme_rank:
                    min_level = min(scheme_levels, key=lambda x: LEVEL_ORDER[x])
                    return -1, {"excluded_by": "student_level",
                                "requires": f"Minimum {min_level} level"}
                # Exclude if user is strictly above the maximum level the scheme targets
                # (e.g. scheme is for Class 9 to UG; a PG/PhD student doesn't qualify)
                if user_rank > max_scheme_rank:
                    max_level = max(scheme_levels, key=lambda x: LEVEL_ORDER[x])
                    return -1, {"excluded_by": "student_level",
                                "requires": f"Maximum {max_level} level"}

    # 8. Field-of-study hard filter
    #    If the scheme requires a specific academic field AND the user's course is a
    #    different specialised field → exclude.
    #    Broad courses (ba/ma) are left as empty set so they never get excluded.
    _COURSE_TO_FIELDS: dict[str, set] = {
        "btech": {"engineering"}, "mtech": {"engineering"},
        "mbbs": {"medical"}, "md": {"medical"}, "pharma": {"medical"}, "mpharma": {"medical"},
        "bagri": {"agriculture"}, "magri": {"agriculture"},
        "bba": {"management"}, "mba": {"management"}, "mcom": {"management"},
        "bcom": {"management"},
        "law": {"law"},
        "arts": {"arts"},            # BFA/BPA
        "bsc": {"science"}, "msc": {"science"},
        # PhD field keys
        "science_tech": {"engineering", "science"},
        "agriculture":  {"agriculture"},
        "medical":      {"medical"},
        "management":   {"management"},
        "law_field":    {"law"},
        "humanities":   {"arts", "media"},
        # ba/ma/mphil → empty (too broad — could be any arts/social/media subject)
    }
    if user_occ == "student" and pe.get("has_field_restriction"):
        user_course = (
            user.get("student_course")
            or user.get("student_phd_field")
            or ""
        )
        user_fields = _COURSE_TO_FIELDS.get(user_course, set())
        if user_fields:   # only filter when user's field is known and specialised
            scheme_fields = {
                k.replace("req_field_", "")
                for k in ("req_field_engineering", "req_field_medical", "req_field_agriculture",
                          "req_field_management", "req_field_law", "req_field_media",
                          "req_field_arts", "req_field_science")
                if pe.get(k)
            }
            if scheme_fields and not (user_fields & scheme_fields):
                return -1, {"excluded_by": "field_of_study",
                            "requires": f"Field: {', '.join(scheme_fields)}"}

    # 9. Merit / achievement hard filter
    #    Same rule as special_status: hard-exclude when scheme has no caste restriction
    #    (the merit/achievement IS the primary eligibility criterion).
    _MERIT_FLAGS = {
        "board_topper":   "req_merit_rank",
        "olympiad":       "req_olympiad",
        "sports_award":   "req_sports_award",
        "research":       "req_research",
        "cultural_award": "req_cultural_award",
    }
    user_achievements = set(
        a for a in user.get("student_achievements", []) if a != "none"
    )
    if not scheme_is_caste_restricted:
        for user_key, pe_flag in _MERIT_FLAGS.items():
            if pe.get(pe_flag) and user_key not in user_achievements:
                return -1, {"excluded_by": "merit_required", "requires": user_key}

    # 10. Marks hard filter
    marks_min = pe.get("marks_min")
    if marks_min and user_marks is not None and user_marks < marks_min:
        return -1, {"excluded_by": "marks", "requires": f"≥ {marks_min}% in qualifying exam"}

    # ── SOFT SCORING ─────────────────────────────────────────────────────────
    score = 0
    matched: list[str] = []
    gaps: list[str] = []

    # Geographic (15 pts)
    if not state_locked:
        score += 10   # all-India
        matched.append("All-India scheme")
    elif state_locked.lower() == user_state.lower():
        score += W_GEOGRAPHIC
        matched.append(f"Available in {user_state}")

    # Occupation (25 pts)
    occ_key = f"occ_{user_occ}"
    if pe.get(occ_key):
        score += W_OCCUPATION
        matched.append(f"Targets {user_occ}s")

        # Student sub-level bonus (10 pts)
        if user_occ == "student":
            student_level = user.get("student_level", "")
            level_key = f"student_{student_level}"
            if student_level and pe.get(level_key):
                score += W_STUDENT_SUBLEVEL
                matched.append(f"Matches {student_level} level")
            elif student_level and any(pe.get(f"student_{l}") for l in
                                       ["school","class10","class12","diploma","ug","pg","phd"]):
                gaps.append(f"May target a different education level — verify")

        # Farmer size bonus (5 pts)
        if user_occ == "farmer":
            land = user.get("farmer_land")
            if _farmer_size_matches(pe, land):
                score += W_FARMER_SIZE
                matched.append("Matches your farm size")

    # Caste specificity bonus (10 pts — scheme IS caste-targeted and user qualifies)
    if not caste_any:
        score += W_CASTE_SPECIFIC
        matched.append(f"Reserved for {_caste_flags_str(pe)}")

    # Income — hard filter + soft bonus
    income_max = pe.get("income_max")
    if income_max is not None and user_income is not None:
        if user_income > income_max:
            # Hard exclude: user's income clearly exceeds the scheme's cap
            return -1, {"excluded_by": "income",
                        "requires": f"Family income ≤ ₹{income_max:,}/yr",
                        "user_income": user_income}
        else:
            score += W_INCOME
            matched.append(f"Income within limit (≤ ₹{income_max:,}/yr)")
    else:
        score += W_INCOME  # no income cap known — assume eligible

    # Gender specific bonus (5 pts)
    if pe.get("gender_female") and user_gender == "female":
        score += W_GENDER_FEMALE
        matched.append("Scheme designed for women")

    # Benefit preference alignment (2 pts per match, max 10)
    user_benefit_prefs = set(user.get("benefit_prefs", []))
    raw_benefit_types = detail.get("benefit_types") or "[]"
    try:
        scheme_benefit_types = set(json.loads(raw_benefit_types))
    except Exception:
        scheme_benefit_types = set()
    # Also check tags for benefit keywords
    raw_tags = listing.get("tags") or detail.get("tags") or "[]"
    try:
        scheme_tags = set(t.lower() for t in json.loads(raw_tags))
    except Exception:
        scheme_tags = set()

    benefit_keyword_map = {
        "scholarship": {"scholarship", "fellowship", "stipend"},
        "financial":   {"financial assistance", "financial support", "cash transfer"},
        "loan":        {"loan", "credit"},
        "training":    {"training", "skill", "skill development"},
        "healthcare":  {"health", "medical", "hospital"},
        "housing":     {"housing", "shelter", "house"},
        "insurance":   {"insurance", "accident"},
        "pension":     {"pension", "old age"},
        "award":       {"award", "grant", "recognition"},
        "equipment":   {"equipment", "tools", "machinery", "tractor"},
        "subsidy":     {"subsidy", "interest subsidy"},
    }
    benefit_score = 0
    for pref in user_benefit_prefs:
        keywords = benefit_keyword_map.get(pref, {pref})
        if any(kw in scheme_tags for kw in keywords):
            benefit_score += 2
    score += min(benefit_score, W_BENEFIT_PREF)

    # Sector preference (7 pts)
    user_sector_prefs = set(user.get("sector_prefs", []))
    raw_categories = detail.get("scheme_category") or listing.get("category") or "[]"
    try:
        scheme_cats = set(json.loads(raw_categories))
    except Exception:
        scheme_cats = {raw_categories}
    if user_sector_prefs & scheme_cats:
        score += W_SECTOR_PREF
        matched.append("Matches your sector preference")

    # Special status bonus (5 pts per match)
    for req_f, uk in REQ_MAP.items():
        if pe.get(req_f) and uk in user_special:
            score += W_SPECIAL_STATUS
            matched.append(f"Specifically for {uk}")

    # Engineering branch/interest soft bonus (up to 8 pts)
    #   - engg_branch is the user's actual department (set by branch question)
    #   - engg_interests is the expanded set the user opted into (multi-select)
    #   Both contribute to boosting relevant branch-specific schemes.
    _BRANCH_MAP = {
        "cs_it":       "branch_cs_it",
        "electronics": "branch_electronics",
        "mechanical":  "branch_mechanical",
        "biotech":     "branch_biotech",
        "textile":     "branch_textile",
    }
    user_branch    = user.get("engg_branch", "")
    user_interests = set(user.get("engg_interests", []))
    # Build combined set: branch + explicitly selected interests
    user_branch_set = set()
    if user_branch and user_branch in _BRANCH_MAP:
        user_branch_set.add(user_branch)
    user_branch_set.update(b for b in user_interests if b in _BRANCH_MAP)
    # "any" interest = interested in all branches
    if "any" in user_interests:
        user_branch_set.update(_BRANCH_MAP.keys())

    for branch_key, pe_flag in _BRANCH_MAP.items():
        if pe.get(pe_flag) and branch_key in user_branch_set:
            score += 5
            matched.append(f"Matches {branch_key.replace('_', '/')} interest")
            break  # cap at 5 pts for branch match

    # Merit/achievement bonus (5 pts per match)
    _MERIT_FLAG_MAP = {
        "board_topper":   "req_merit_rank",
        "olympiad":       "req_olympiad",
        "sports_award":   "req_sports_award",
        "research":       "req_research",
        "cultural_award": "req_cultural_award",
    }
    for user_key, pe_flag in _MERIT_FLAG_MAP.items():
        if pe.get(pe_flag) and user_key in user_achievements:
            score += 5
            matched.append(f"Achievement: {user_key.replace('_', ' ')}")

    return min(score, 100), {"matched": matched, "gaps": gaps}


def load_all_data(conn: sqlite3.Connection) -> list[dict]:
    """Load all schemes joined with parsed eligibility."""
    conn.row_factory = sqlite3.Row
    cur = conn.execute("""
        SELECT
            pe.slug,
            pe.for_individual, pe.for_business, pe.for_family,
            pe.gender_female, pe.gender_male, pe.gender_trans, pe.gender_any,
            pe.caste_sc, pe.caste_st, pe.caste_obc, pe.caste_ews, pe.caste_general, pe.caste_any,
            pe.req_bpl, pe.req_widow, pe.req_disabled, pe.req_orphan,
            pe.req_minority, pe.req_exserviceman,
            pe.age_min, pe.age_max, pe.income_max,
            pe.occ_student, pe.occ_farmer, pe.occ_construction, pe.occ_labourer,
            pe.occ_artist, pe.occ_fisherman, pe.occ_sportsperson, pe.occ_entrepreneur,
            pe.occ_govt_emp, pe.occ_teacher, pe.occ_healthcare, pe.occ_journalist,
            pe.occ_unemployed, pe.occ_senior, pe.occ_homemaker,
            pe.student_school, pe.student_class10, pe.student_class12,
            pe.student_diploma, pe.student_ug, pe.student_pg, pe.student_phd,
            pe.farmer_marginal, pe.farmer_small, pe.farmer_any,
            pe.biz_micro, pe.biz_small, pe.biz_medium, pe.biz_startup,
            pe.state_locked, pe.marks_min, pe.has_occ_restriction,
            pe.req_rural, pe.req_urban,
            pe.req_sanitation_child, pe.req_nomadic_tribe, pe.req_prisoner_family,
            pe.req_acid_victim, pe.req_hiv_affected, pe.req_cancer,
            pe.req_weaver, pe.req_street_vendor,
            pe.req_merit_rank, pe.req_olympiad, pe.req_sports_award,
            pe.req_research, pe.req_cultural_award,
            pe.branch_cs_it, pe.branch_electronics, pe.branch_mechanical,
            pe.branch_biotech, pe.branch_textile,
            pe.req_field_engineering, pe.req_field_medical, pe.req_field_agriculture,
            pe.req_field_management, pe.req_field_law, pe.req_field_media,
            pe.req_field_arts, pe.req_field_science, pe.has_field_restriction,
            l.scheme_name, l.scheme_short_title, l.ministry,
            l.state AS listing_state, l.level, l.category,
            l.brief_description AS listing_brief, l.tags AS listing_tags,
            d.benefit_types, d.scheme_category, d.tags AS detail_tags,
            d.eligibility_md, d.benefits_md, d.detailed_description_md,
            d.application_process_json, d.documents_required_md,
            d.exclusions_md, d.official_url, d.implementing_agency,
            d.nodal_ministry, d.nodal_department, d.scheme_type,
            d.target_beneficiaries, d.scheme_for, d.dbt_scheme
        FROM parsed_eligibility pe
        JOIN listings l ON pe.slug = l.slug
        LEFT JOIN details d ON pe.slug = d.slug
    """)
    rows = cur.fetchall()
    conn.row_factory = None  # reset
    return [dict(row) for row in rows]


def rank_schemes(user: dict, all_data: list[dict]) -> list[dict]:
    """Score all schemes and return sorted list (excluded schemes omitted)."""
    results = []
    for row in all_data:
        pe = row          # parsed_eligibility fields are in the same dict
        listing = row
        detail = row

        score, expl = score_scheme(pe, listing, detail, user)
        if score == -1:
            continue  # excluded

        raw_tags = row.get("listing_tags") or row.get("detail_tags") or "[]"
        try:
            parsed_tags = json.loads(raw_tags)
            if not isinstance(parsed_tags, list):
                parsed_tags = []
        except Exception:
            parsed_tags = []

        results.append({
            "slug":              row["slug"],
            "scheme_name":       row["scheme_name"],
            "scheme_short_title": row.get("scheme_short_title", ""),
            "ministry":          row.get("ministry", "") or row.get("nodal_ministry", ""),
            "state":             row.get("listing_state", ""),
            "category":          row.get("category", ""),
            "brief_description": row.get("listing_brief", "") or row.get("detailed_description_md", ""),
            "eligibility_md":    row.get("eligibility_md", ""),
            "benefits_md":       row.get("benefits_md", ""),
            "application_process_json": row.get("application_process_json"),
            "documents_required_md": row.get("documents_required_md", ""),
            "exclusions_md":     row.get("exclusions_md", ""),
            "official_url":      row.get("official_url", ""),
            "implementing_agency": row.get("implementing_agency", ""),
            "benefit_types":     row.get("benefit_types", "[]"),
            "tags":              parsed_tags,
            "age_min":           row.get("age_min"),
            "age_max":           row.get("age_max"),
            "gender_any":        row.get("gender_any", 1),
            "gender_female":     row.get("gender_female", 0),
            "gender_male":       row.get("gender_male", 0),
            "caste_any":         row.get("caste_any", 1),
            "caste_sc":          row.get("caste_sc", 0),
            "caste_st":          row.get("caste_st", 0),
            "caste_obc":         row.get("caste_obc", 0),
            "caste_ews":         row.get("caste_ews", 0),
            "caste_general":     row.get("caste_general", 0),
            "income_max":        row.get("income_max"),
            "score":             score,
            "eligibility_category": "Likely Eligible" if score >= 90 else ("Possibly Eligible" if score >= 60 else "Additional Verification Needed"),
            "matched":           expl.get("matched", []),
            "gaps":              expl.get("gaps", []),
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results


# ── Standalone test ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    sample_profiles = [
        {
            "name": "SC woman PhD student in Rajasthan",
            "state": "Rajasthan",
            "age": 26,
            "gender": "female",
            "caste": "sc",
            "special_status": [],
            "occupation": "student",
            "student_level": "phd",
            "income_band": "1l_2.5l",
            "benefit_prefs": ["scholarship", "financial"],
            "sector_prefs": ["Education & Learning"],
        },
        {
            "name": "Marginal farmer in Gujarat (ST)",
            "state": "Gujarat",
            "age": 45,
            "gender": "male",
            "caste": "st",
            "special_status": [],
            "occupation": "farmer",
            "farmer_land": "marginal",
            "income_band": "below_1l",
            "benefit_prefs": ["equipment", "subsidy"],
            "sector_prefs": ["Agriculture, Rural & Environment"],
        },
        {
            "name": "Construction worker in Maharashtra (BPL)",
            "state": "Maharashtra",
            "age": 35,
            "gender": "male",
            "caste": "obc",
            "special_status": ["bpl"],
            "occupation": "construction",
            "income_band": "below_1l",
            "benefit_prefs": ["financial", "insurance"],
            "sector_prefs": [],
        },
    ]

    conn = sqlite3.connect(DB_PATH)
    try:
        count = conn.execute("SELECT COUNT(*) FROM parsed_eligibility").fetchone()[0]
        if count == 0:
            print("parsed_eligibility table is empty — run parse_eligibility.py first.")
            exit(1)
    except Exception:
        print("parsed_eligibility table missing — run parse_eligibility.py first.")
        exit(1)

    print(f"Loading {count} schemes from DB...")
    all_data = load_all_data(conn)
    conn.close()

    for profile in sample_profiles:
        name = profile.pop("name")
        ranked = rank_schemes(profile, all_data)
        print(f"\n{'='*60}")
        print(f"Profile: {name}")
        print(f"Matching schemes: {len(ranked)} / {len(all_data)}")
        print(f"\nTop 5:")
        for i, r in enumerate(ranked[:5], 1):
            print(f"  {i}. [{r['score']:>3}] {r['scheme_name'][:60]}")
            if r['matched']:
                print(f"       ✓ {', '.join(r['matched'][:3])}")
