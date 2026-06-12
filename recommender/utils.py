"""
Utility helpers for the recommender app.
"""
from __future__ import annotations

import json
import re


def _parse_rupee_val(raw: str) -> int | None:
    """Convert Indian-format digit string ('1,00,000') to int."""
    try:
        return int(raw.replace(',', ''))
    except ValueError:
        return None


def extract_monetary(benefits_md: str | None) -> str | None:
    """
    Extract the primary monetary benefit amount from benefits_md.

    Handles:
    - ₹ / Rs. / INR notation
    - Lakh / Crore multipliers  (₹6.25 lakh → "₹6.25 Lakh")
    - Recurring qualifiers       (₹5,000/month)
    - Indian number format       (₹1,00,000)
    - Filters amounts < ₹100    (application fees / decimal fragments)

    Priority order: recurring (per month/year) > lakh/crore > large lump-sum.
    """
    if not benefits_md:
        return None

    CUR = r'(?:₹|rs\.?|inr)\s*'
    candidates: list[tuple[int, str, str]] = []  # (sort_value, display_str, type)
    # Recurring period keywords — also handles "per student per month", "per academic year"
    PERIOD_RE = re.compile(
        r'per\s+(?:\w+\s+)?(?:month|year|annum|day|academic\s+year)'
        r'|p\.?m\.?(?!\w)|p\.?a\.?(?!\w)|monthly|annually|daily',
        re.I,
    )

    # ── Pass 1: Lakh / Crore (e.g. "₹6.25 lakh", "up to ₹1.5 crore") ─────────
    for m in re.finditer(
        r'(?:up\s+to\s+|upto\s+|maximum\s+of?\s+)?' + CUR
        + r'([\d,]+(?:\.\d+)?)\s*(lakh|lakhs?|crore|crores?|cr\.?)\b',
        benefits_md, re.I,
    ):
        raw = m.group(1).replace(',', '')
        try:
            val = float(raw)
        except ValueError:
            continue
        unit = m.group(2).lower()
        is_crore = 'crore' in unit or unit.startswith('cr')
        rupee_val = int(val * (10_000_000 if is_crore else 100_000))
        display = f"₹{m.group(1)} {'Crore' if is_crore else 'Lakh'}"
        tail = benefits_md[m.end(): m.end() + 50]
        pm = PERIOD_RE.search(tail)
        if pm:
            w = pm.group(0).lower()
            display += '/day' if 'day' in w else '/month' if 'month' in w else '/year'
        candidates.append((rupee_val, display, 'lakh_crore'))

    # ── Pass 2: Recurring — look for amount then period within 60 chars ───────
    # No minimum threshold for recurring: ₹65/day is a real benefit.
    # But skip if the digits are a decimal fragment of a lakh/crore (e.g. ₹6 from ₹6.25 lakh).
    _LAKH_CRORE_FRAGMENT = re.compile(r'\.\d+\s*(?:lakh|lakhs?|crore|crores?)\b', re.I)
    for m in re.finditer(CUR + r'([\d,]+)\s*(?:/-\s*)?', benefits_md, re.I):
        val = _parse_rupee_val(m.group(1))
        if not val or val < 1:
            continue
        # Skip decimal fragment: "₹6" in "₹6.25 lakh"
        lookahead = benefits_md[m.end(): m.end() + 20]
        if _LAKH_CRORE_FRAGMENT.match(lookahead):
            continue
        tail = benefits_md[m.end(): m.end() + 60]
        pm = PERIOD_RE.search(tail)
        if pm:
            w = pm.group(0).lower()
            sfx = '/day' if 'day' in w else '/month' if 'month' in w else '/year'
            candidates.append((val, f"₹{val:,}{sfx}", 'recurring'))

    # ── Pass 3: Bare amounts with /- suffix (e.g. "20,000/-") ────────────────
    for m in re.finditer(r'([\d,]{3,})\s*/-', benefits_md):
        val = _parse_rupee_val(m.group(1))
        if val and val >= 10:
            if not any(abs(v - val) < 10 for v, _, t in candidates if t == 'recurring'):
                candidates.append((val, f"₹{val:,}", 'lump'))

    # ── Pass 4: Plain ₹/Rs amounts (threshold ₹10 — only to skip decimal fragments) ──
    for m in re.finditer(CUR + r'([\d,]+)(?:\s*/-)?', benefits_md, re.I):
        val = _parse_rupee_val(m.group(1))
        if val and val >= 10:
            tail = benefits_md[m.end(): m.end() + 60]
            if PERIOD_RE.search(tail):
                continue  # already handled by Pass 2
            if not any(abs(v - val) < 10 for v, _, _ in candidates):
                candidates.append((val, f"₹{val:,}", 'lump'))

    if not candidates:
        return None

    # Priority: recurring (direct cash) → lakh_crore (large amounts) → lump
    for ptype in ('recurring', 'lakh_crore', 'lump'):
        group = [(v, d) for v, d, t in candidates if t == ptype]
        if group:
            group.sort(reverse=True)
            return group[0][1]

    return None


# Non-monetary benefit descriptions (fallback when no ₹ amount found)
_NONMONETARY_PATTERNS: list[tuple[re.Pattern, str]] = [
    (re.compile(r'free\s+(?:bicycles?|cycles?)\b', re.I),          "Free bicycle"),
    (re.compile(r'free\s+(?:laptops?|tablets?|computers?)\b', re.I), "Free laptop/tablet"),
    (re.compile(r'free\s+(?:sewing\s+machine|tool\s*kit|equipment|machinery)\b', re.I), "Free equipment/tools"),
    (re.compile(r'hostel\s+(?:facility|accommodation|rooms?)\b|free\s+(?:hostel|accommodation|boarding)', re.I), "Free hostel accommodation"),
    (re.compile(r'free\s+(?:textbooks?|books?|stationery|uniforms?|kits?)', re.I), "Free books / stationery / uniform"),
    (re.compile(r'free\s+education|free\s+schooling|free\s+enrolment|free\s+admission', re.I), "Free education"),
    (re.compile(r'full\s+(?:fee\s+)?reimbursement|reimburs\w+\s+(?:of\s+)?(?:tuition|fees?)', re.I), "Full fee reimbursement"),
    (re.compile(r'fee\s+reimburs|reimburse\w+\s+fees?', re.I), "Fee reimbursement"),
    (re.compile(r'interest\s+subsi', re.I),                        "Interest subsidy on loan"),
    (re.compile(r'free\s+(?:meals?|food|midday\s+meal)', re.I),    "Free meals"),
    (re.compile(r'free\s+(?:medical|health\s*care|treatment|medicine)', re.I), "Free medical care"),
    (re.compile(r'free\s+(?:training|coaching|skill\s+development)', re.I), "Free training/coaching"),
    (re.compile(r'free\s+distribution\b', re.I),                   "Free distribution of items"),
    (re.compile(r'free\s+(?:house|housing|flat|accommodation)\b', re.I), "Free/subsidised housing"),
    (re.compile(r'subsidis?ed\s+(?:loan|credit|interest)', re.I),  "Subsidised loan"),
    (re.compile(r'financial\s+(?:assistance|support|aid)\b', re.I), "Financial assistance (amount varies)"),
    (re.compile(r'scholar\w+', re.I),                              "Scholarship (amount varies)"),
]


def describe_benefit(benefits_md: str | None) -> str | None:
    """
    For schemes with no extractable ₹ amount, return a short description
    of what the scheme provides (hostel, bicycle, fee waiver, etc.).
    """
    if not benefits_md:
        return None
    for pattern, label in _NONMONETARY_PATTERNS:
        if pattern.search(benefits_md):
            return label
    return None


def render_application_process(ap_json: str | None) -> str:
    """Convert application_process_json to readable markdown."""
    if not ap_json:
        return ""
    try:
        ap = json.loads(ap_json)
    except (json.JSONDecodeError, TypeError):
        return ""

    parts = []
    for block in ap:
        mode = block.get("mode", "")
        process_md = block.get("process_md", "")
        if mode:
            parts.append(f"**Mode: {mode}**\n\n{process_md}")
        elif process_md:
            parts.append(process_md)

    return "\n\n---\n\n".join(parts)


def eligibility_grid(scheme: dict, user: dict) -> list[dict]:
    """
    Build the eligibility sub-column grid for a scheme.
    Returns a list of dicts: {label, requirement, user_value, match}
    """
    grid = []

    # Age
    age_min = scheme.get("age_min")
    age_max = scheme.get("age_max")
    user_age = user.get("age")
    if age_min or age_max:
        if age_min and age_max:
            req = f"{age_min}–{age_max} years"
        elif age_min:
            req = f"≥ {age_min} years"
        else:
            req = f"≤ {age_max} years"
        match = True
        if age_min and user_age and user_age < age_min:
            match = False
        if age_max and user_age and user_age > age_max:
            match = False
        grid.append({"label": "Age", "requirement": req,
                     "user_value": f"{user_age} yrs" if user_age else "—", "match": match})
    else:
        grid.append({"label": "Age", "requirement": "Any", "user_value": "—", "match": True})

    # Gender
    gender_any = scheme.get("gender_any", 1)
    if gender_any:
        grid.append({"label": "Gender", "requirement": "Any", "user_value": "—", "match": True})
    else:
        req_parts = []
        if scheme.get("gender_female"):
            req_parts.append("Female")
        if scheme.get("gender_male"):
            req_parts.append("Male")
        if scheme.get("gender_trans"):
            req_parts.append("Transgender")
        req = " / ".join(req_parts) or "Specific"
        user_gender = user.get("gender", "any")
        match = (
            (scheme.get("gender_female") and user_gender == "female") or
            (scheme.get("gender_male") and user_gender == "male") or
            (scheme.get("gender_trans") and user_gender == "transgender")
        )
        grid.append({"label": "Gender", "requirement": req,
                     "user_value": user_gender.capitalize(), "match": match})

    # Caste
    caste_any = scheme.get("caste_any", 1)
    if caste_any:
        grid.append({"label": "Caste", "requirement": "Any", "user_value": "—", "match": True})
    else:
        req_parts = []
        for key, label in [("caste_sc","SC"), ("caste_st","ST"), ("caste_obc","OBC"),
                           ("caste_ews","EWS"), ("caste_general","General")]:
            if scheme.get(key):
                req_parts.append(label)
        req = " / ".join(req_parts) or "Specific"
        user_caste = user.get("caste", "general").upper()
        match = scheme.get(f"caste_{user_caste.lower()}", False)
        grid.append({"label": "Caste", "requirement": req,
                     "user_value": user_caste, "match": bool(match)})

    # Income
    income_max = scheme.get("income_max")
    if income_max:
        from recommender.questions import income_band_to_annual
        user_income = income_band_to_annual(user.get("income_band", "above_8l"))
        match = user_income is None or user_income <= income_max
        grid.append({"label": "Income", "requirement": f"≤ ₹{income_max:,}/yr",
                     "user_value": user.get("income_band", "—"), "match": match})
    else:
        grid.append({"label": "Income", "requirement": "No limit", "user_value": "—", "match": True})

    # State
    state_locked = scheme.get("state_locked")
    if state_locked:
        user_state = user.get("state", "")
        match = state_locked.lower() == user_state.lower()
        grid.append({"label": "State", "requirement": state_locked,
                     "user_value": user_state, "match": match})
    else:
        grid.append({"label": "State", "requirement": "All India", "user_value": "—", "match": True})

    return grid


def status_badge(score: int) -> tuple[str, str]:
    """Return (emoji, label) for a given score."""
    if score >= 70:
        return "✅", "Eligible"
    elif score >= 40:
        return "⚠️", "Likely Eligible"
    else:
        return "ℹ️", "Possibly Eligible"


def parse_tags(tags_json: str | None) -> list[str]:
    if not tags_json:
        return []
    try:
        return json.loads(tags_json)
    except Exception:
        return []


def truncate(text: str | None, n: int = 200) -> str:
    if not text:
        return ""
    text = text.strip()
    return text[:n] + "…" if len(text) > n else text


# ── Course-specific benefit lookup ────────────────────────────────────────────

# Maps user profile values → keywords to match against course labels in benefit tables
# Order matters: more specific first
_COURSE_KEYWORDS: dict[str, list[str]] = {
    # UG Engineering
    "btech":    ["engg", "engineering", "b.tech", "b.e", "aicte", "technical"],
    # UG Medical
    "mbbs":     ["medical", "mbbs", "bds", "ug (medical", "ug(medical"],
    # UG Science
    "bsc":      ["ug (science", "ug(science", "b.sc", "science"],
    # UG Arts
    "ba":       ["ug (art", "ug(art", "b.a", "arts", "humanities"],
    # UG Commerce
    "bcom":     ["ug (commerce", "ug(commerce", "b.com", "commerce"],
    # UG Agriculture
    "bagri":    ["agriculture", "b.agri", "horticulture", "agri"],
    # UG Management/IT
    "bba":      ["management", "bba", "bca", "bms", "computer"],
    # UG Pharmacy/Nursing
    "pharma":   ["pharmacy", "nursing", "paramedic", "b.pharm", "allied health"],
    # UG Other professional (AICTE/UGC)
    "other":    ["other professional", "ugc approved", "professional"],

    # PG Engineering
    "mtech":    ["pg (engg", "pg(engg", "m.tech", "m.e", "engineering"],
    # PG Medical
    "md":       ["pg (medical", "pg(medical", "m.d", "m.s", "medical"],
    # PG Science
    "msc":      ["pg (science", "pg(science", "m.sc", "science"],
    # PG Arts
    "ma":       ["pg (art", "pg(art", "m.a", "arts", "humanities"],
    # PG Commerce
    "mcom":     ["pg (commerce", "pg(commerce", "m.com", "commerce"],
    # PG Agriculture
    "magri":    ["agriculture", "m.agri", "agri"],
    # MBA/Management
    "mba":      ["mba", "management", "pgdm"],
    # PG Pharmacy
    "mpharma":  ["pharmacy", "nursing", "m.pharm", "allied health"],
    # M.Phil
    "mphil":    ["m.phil", "non net", "mphil"],

    # PhD / Research
    "phd":              ["ph.d", "phd", "doctorate", "non net ph.d", "net ph.d"],
    "science_tech":     ["science", "technology", "engineering", "engg"],
    "agriculture":      ["agriculture", "veterinary", "agri", "horticulture"],
    "medical":          ["medical", "health", "pharmacy", "nursing"],
    "social":           ["social science", "economics", "political"],
    "humanities":       ["humanities", "language", "literature", "arts"],
    "management":       ["management", "commerce", "business"],
    "law":              ["law", "legal", "llm"],

    # Class 12 streams
    "science":  ["hs", "higher secondary", "h.s", "science", "10+2", "+2"],
    "commerce": ["hs", "higher secondary", "h.s", "commerce", "10+2", "+2"],
    "arts":     ["hs", "higher secondary", "h.s", "arts", "10+2", "+2"],
    "vocational":["vocational", "technical", "iti", "trade"],

    # Level-based fallbacks
    "school":   ["pre-matric", "pre matric", "class", "school", "primary"],
    "class10":  ["matric", "class x", "class 10", "10th", "secondary"],
    "class12":  ["hs", "higher secondary", "class xii", "class 12", "12th", "intermediate"],
    "diploma":  ["diploma", "polytechnic", "d.el.ed", "iti"],
    "ug":       ["ug", "undergraduate", "bachelor", "degree"],
    "pg":       ["pg", "postgraduate", "master"],
}


def _extract_course_amount_pairs(text: str) -> list[tuple[str, str]]:
    """
    Extract (course_label, amount) pairs from a benefits markdown string.
    Handles both markdown tables (| col | col |) and concatenated text.
    Returns list of (label, amount_string) tuples.
    """
    pairs: list[tuple[str, str]] = []

    # Strategy 1: Markdown pipe-table rows  →  | Course | ₹ 1,500/- |
    table_row = re.compile(
        r'\|\s*([^|₹\n]+?)\s*\|\s*(?:₹\s*|rs\.?\s*)([\d,]+(?:[/\s]*-?)?)\s*\|?',
        re.I,
    )
    for m in table_row.finditer(text):
        label = m.group(1).strip()
        amount = m.group(2).strip().rstrip('/-').strip().replace(',', '')
        if label and amount.isdigit():
            pairs.append((label, f"₹{int(amount):,}"))

    if pairs:
        return pairs

    # Strategy 2: Line-by-line — only for lines with EXACTLY one ₹ (not concatenated)
    for line in text.splitlines():
        line = line.strip()
        if not line or line.count('₹') != 1:
            continue  # multi-₹ lines are concatenated → handled by Strategy 3
        m = re.search(r'(?:₹|rs\.?)\s*([\d,]+)', line, re.I)
        if not m:
            continue
        label_part = line[:m.start()].strip().strip('|').strip()
        if len(label_part) > 3 and not re.search(r'^\d+$', label_part):
            amount_raw = m.group(1).replace(',', '')
            try:
                pairs.append((label_part, f"₹{int(amount_raw):,}"))
            except ValueError:
                pass

    if pairs:
        return pairs

    # Strategy 3: Concatenated string — "CourseLabel₹1000/-CourseLabel₹1500/-"
    # Walk forward through every ₹ marker; label = text between prev-end and this ₹.
    flat = " ".join(text.split())

    # Strip the table header from the very beginning (before any course entries)
    # e.g. "CourseScholarship Rate Per Month (Rs.)" or "Course Name | Rate"
    flat = re.sub(r'^.*?(?:\(rs\.?\)|per\s+month)\s*', '', flat, flags=re.I)

    amt_matches = list(re.finditer(r'₹\s*([\d,]+)', flat))
    cursor = 0
    for m in amt_matches:
        label = flat[cursor: m.start()].strip()

        # Strip leading separators left from previous entry ("/-", "/", "-", etc.)
        label = re.sub(r'^[\s/\-.,;|]+', '', label).strip()
        # Strip leading "(Rs.)" fragment from first entry after header removal
        label = re.sub(r'^\(rs\.?\)\s*', '', label, flags=re.I).strip()
        # Strip "respectively" artifact that can merge with the next label
        label = re.sub(r'^respectively\s*', '', label, flags=re.I).strip()

        raw = m.group(1).replace(',', '')
        # Advance cursor past this amount + trailing "/-" separator
        tail = re.match(r'\s*/?\s*-?', flat[m.end():])
        cursor = m.end() + (len(tail.group()) if tail else 0)

        # Skip empty, pure-number, or header-fragment labels
        if not label or len(label) < 2 or re.match(r'^\d+$', label):
            continue
        if re.search(r'\b(?:rate|scholarship\s+rate|amount\s+per|per\s+month)\b', label, re.I):
            continue

        try:
            pairs.append((label, f"₹{int(raw):,}"))
        except ValueError:
            pass

    return pairs


def find_course_benefit(benefits_md: str | None, user: dict) -> str | None:
    """
    Return the course-specific benefit entry for this user, or None.
    Works across ALL schemes with tiered scholarship tables.
    """
    if not benefits_md:
        return None

    level = user.get("student_level", "")
    course = (
        user.get("student_course")
        or user.get("student_stream")
        or user.get("student_phd_field")
        or ""
    )

    if not level and not course:
        return None

    # Build ordered keyword list — course-specific first, then level fallback
    keywords: list[str] = []
    if course and course in _COURSE_KEYWORDS:
        keywords.extend(_COURSE_KEYWORDS[course])
    if level and level in _COURSE_KEYWORDS:
        # Only add level keywords that aren't already covered by course
        for kw in _COURSE_KEYWORDS[level]:
            if kw not in keywords:
                keywords.append(kw)

    if not keywords:
        return None

    # Extract all (label, amount) pairs from the benefits text
    pairs = _extract_course_amount_pairs(benefits_md)
    if not pairs:
        return None

    # Match: score each pair against our keywords, take best match
    best_label, best_amount, best_score = None, None, 0
    for label, amount in pairs:
        label_lower = label.lower()
        for i, kw in enumerate(keywords):
            if kw in label_lower:
                # Earlier keywords = higher priority
                match_score = len(keywords) - i
                if match_score > best_score:
                    best_score = match_score
                    best_label = label
                    best_amount = amount
                break

    if best_label:
        return f"{best_label.strip()}: {best_amount}/month"
    return None
