"""
One-time preprocessing: parse eligibility_md free text into structured flags.

Run:
    uv run python recommender/parse_eligibility.py

Writes to the `parsed_eligibility` table in cache/schemes.db.
Takes ~30 seconds for 4,669 schemes.
"""
from __future__ import annotations

import re
import sqlite3
from pathlib import Path

DB_PATH = Path("cache/schemes.db")

# ── Table definition ──────────────────────────────────────────────────────────

CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS parsed_eligibility (
    slug TEXT PRIMARY KEY,

    -- Applicant type
    for_individual    INTEGER DEFAULT 1,
    for_business      INTEGER DEFAULT 0,
    for_family        INTEGER DEFAULT 0,
    for_shg           INTEGER DEFAULT 0,
    for_ngo           INTEGER DEFAULT 0,

    -- Gender
    gender_female     INTEGER DEFAULT 0,
    gender_male       INTEGER DEFAULT 0,
    gender_trans      INTEGER DEFAULT 0,
    gender_any        INTEGER DEFAULT 1,

    -- Caste
    caste_sc          INTEGER DEFAULT 0,
    caste_st          INTEGER DEFAULT 0,
    caste_obc         INTEGER DEFAULT 0,
    caste_ews         INTEGER DEFAULT 0,
    caste_general     INTEGER DEFAULT 0,
    caste_any         INTEGER DEFAULT 1,

    -- Special status
    req_bpl           INTEGER DEFAULT 0,
    req_widow         INTEGER DEFAULT 0,
    req_disabled      INTEGER DEFAULT 0,
    req_orphan        INTEGER DEFAULT 0,
    req_minority      INTEGER DEFAULT 0,
    req_exserviceman  INTEGER DEFAULT 0,

    -- Hyper-specific target groups (parent occupation, health, social status)
    req_sanitation_child INTEGER DEFAULT 0,  -- child of sanitation/scavenging worker
    req_nomadic_tribe    INTEGER DEFAULT 0,  -- nomadic/denotified tribe (NT/DNT/Vimukta)
    req_prisoner_family  INTEGER DEFAULT 0,  -- family member in prison
    req_acid_victim      INTEGER DEFAULT 0,  -- acid attack survivor
    req_hiv_affected     INTEGER DEFAULT 0,  -- HIV/AIDS affected person or family
    req_cancer           INTEGER DEFAULT 0,  -- cancer patient/survivor
    req_weaver           INTEGER DEFAULT 0,  -- handloom weaver/Khadi artisan specifically
    req_street_vendor    INTEGER DEFAULT 0,  -- street vendor/hawker

    -- Age bounds (NULL = no bound)
    age_min           INTEGER,
    age_max           INTEGER,

    -- Income cap in INR per year (NULL = no cap)
    income_max        INTEGER,

    -- Occupation flags
    occ_student       INTEGER DEFAULT 0,
    occ_farmer        INTEGER DEFAULT 0,
    occ_construction  INTEGER DEFAULT 0,
    occ_labourer      INTEGER DEFAULT 0,
    occ_artist        INTEGER DEFAULT 0,
    occ_fisherman     INTEGER DEFAULT 0,
    occ_sportsperson  INTEGER DEFAULT 0,
    occ_entrepreneur  INTEGER DEFAULT 0,
    occ_govt_emp      INTEGER DEFAULT 0,
    occ_teacher       INTEGER DEFAULT 0,
    occ_healthcare    INTEGER DEFAULT 0,
    occ_journalist    INTEGER DEFAULT 0,
    occ_unemployed    INTEGER DEFAULT 0,
    occ_senior        INTEGER DEFAULT 0,
    occ_homemaker     INTEGER DEFAULT 0,

    -- Student sub-level flags
    student_school    INTEGER DEFAULT 0,
    student_class10   INTEGER DEFAULT 0,
    student_class12   INTEGER DEFAULT 0,
    student_diploma   INTEGER DEFAULT 0,
    student_ug        INTEGER DEFAULT 0,
    student_pg        INTEGER DEFAULT 0,
    student_phd       INTEGER DEFAULT 0,

    -- Farmer sub-type
    farmer_marginal   INTEGER DEFAULT 0,
    farmer_small      INTEGER DEFAULT 0,
    farmer_any        INTEGER DEFAULT 0,

    -- Business sub-type
    biz_micro         INTEGER DEFAULT 0,
    biz_small         INTEGER DEFAULT 0,
    biz_medium        INTEGER DEFAULT 0,
    biz_startup       INTEGER DEFAULT 0,

    -- Merit / academic achievement requirements
    req_merit_rank     INTEGER DEFAULT 0,  -- board topper, rank holder, meritorious student
    req_olympiad       INTEGER DEFAULT 0,  -- NTSE, KVPY, Olympiad winner/participant
    req_sports_award   INTEGER DEFAULT 0,  -- national/state sports achievement
    req_research       INTEGER DEFAULT 0,  -- research publication, patent holder
    req_cultural_award INTEGER DEFAULT 0,  -- national cultural/arts achievement

    -- Engineering sub-branch (soft scoring, set when scheme specifically mentions branch)
    branch_cs_it       INTEGER DEFAULT 0,
    branch_electronics INTEGER DEFAULT 0,
    branch_mechanical  INTEGER DEFAULT 0,
    branch_biotech     INTEGER DEFAULT 0,
    branch_textile     INTEGER DEFAULT 0,

    -- Academic field restrictions (only set when scheme explicitly limits to a field)
    req_field_engineering INTEGER DEFAULT 0,
    req_field_medical     INTEGER DEFAULT 0,
    req_field_agriculture INTEGER DEFAULT 0,
    req_field_management  INTEGER DEFAULT 0,
    req_field_law         INTEGER DEFAULT 0,
    req_field_media       INTEGER DEFAULT 0,
    req_field_arts        INTEGER DEFAULT 0,
    req_field_science     INTEGER DEFAULT 0,
    has_field_restriction INTEGER DEFAULT 0,   -- 1 if ANY field flag is set

    -- Geographic lock (state name, or NULL for all-India)
    state_locked      TEXT,

    -- Minimum marks / percentage required (0-100); NULL = no requirement
    marks_min         INTEGER,

    -- Whether the scheme has ANY occupation restriction (derived field for fast filtering)
    has_occ_restriction INTEGER DEFAULT 0,

    -- Location type
    req_rural         INTEGER DEFAULT 0,
    req_urban         INTEGER DEFAULT 0,

    parsed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

# ── Regex pattern tables ──────────────────────────────────────────────────────

TARGET_PATTERNS = {
    "for_business": [r"\bmsme\b", r"\budyam\b", r"\bfirm\b", r"\bcompany\b"],
    "for_family":   [r"\bfamily\b", r"\bhousehold\b"],
    "for_shg":      [r"\bself[\s-]?help\s+group\b", r"\bshg\b"],
    "for_ngo":      [r"\bngo\b", r"\bregistered\s+society\b", r"\btrust\b"],
}

GENDER_PATTERNS = {
    "gender_female": [r"\bfemale\b", r"\bwomen\b", r"\bwoman\b", r"\bgirl\b",
                      r"\bwidow\b", r"\bdaughter\b", r"\bmother\b", r"\bwife\b"],
    "gender_male":   [r"\b(?<!fe)male\b", r"\bmen\b(?!\s*and\s*women)", r"\bman\b",
                      r"\bboy\b", r"\bson\b", r"\bfather\b"],
    "gender_trans":  [r"\btransgender\b", r"\bthird\s+gender\b", r"\bkinnar\b"],
}

CASTE_PATTERNS = {
    # Handle plural forms: "Scheduled Castes", "Scheduled Tribes"
    "caste_sc":      [r"\bscheduled\s+castes?\b", r"\b(?<!\w)sc(?!\w)", r"\bdalit\b"],
    "caste_st":      [r"\bscheduled\s+tribes?\b", r"\b(?<!\w)st(?!\w)", r"\btribal\b",
                      r"\badi\s+dravidar\b", r"\badivasi\b"],
    "caste_obc":     [r"\b(?<!\w)obc(?!\w)\b", r"\bother\s+backward\s+class\b",
                      r"\bbackward\s+class\b", r"\bbc(?!\w)"],
    "caste_ews":     [r"\b(?<!\w)ews(?!\w)\b", r"\beconomically\s+weaker\s+section\b"],
    # Must be followed by category/class/candidates — avoid "General Condition", "General Public"
    "caste_general": [r"\bgeneral\s+(?:category|class|candidates?|applicants?|students?)\b",
                      r"\bunreserved\b", r"\bopen\s+category\b"],
}

SPECIAL_PATTERNS = {
    "req_bpl":         [r"\b(?<!\w)bpl(?!\w)\b", r"\bbelow\s+poverty\s+line\b",
                        r"\bration\s+card\b", r"\bantyodaya\b"],
    "req_widow":       [r"\bwidow\b", r"\bwidower\b"],
    "req_disabled":    [r"\bdisabilit\w*", r"\bdivyang\b", r"\b(?<!\w)pwd(?!\w)\b",
                        r"\bhandicap\w*", r"\bperson\s+with\s+disab",
                        r"\bdifferently\s+abl\w+"],
    "req_orphan":      [r"\borphan\b"],
    "req_minority":    [r"\bminority\b", r"\bmuslim\b", r"\bchristian\b",
                        r"\bsikh\b", r"\bbuddh\b", r"\bparsi\b", r"\bjain\b"],
    "req_exserviceman":[r"\bex[\s-]?serviceman\b", r"\bveteran\b",
                        r"\bex[\s-]?service(?:men)?\b", r"\bdefence\s+personnel\b",
                        r"\barmed\s+forces\b"],
}

OCC_PATTERNS = {
    "occ_student":      [r"\bstudent\b"],
    "occ_farmer":       [r"\bfarmer\b", r"\bkisan\b", r"\bagricultur\w+\b",
                         r"\bcultivat\w+\b", r"\bgriculturist\b"],
    "occ_construction": [r"\bconstruction\s+worker\b", r"\bbuilding\s+worker\b",
                         r"\bbuilding\s+and\s+other\s+construction\b"],
    "occ_labourer":     [r"\blaboure?r\b", r"\bunorganized\s+worker\b",
                         r"\bdomestic\s+worker\b", r"\bdaily\s+wage\b",
                         r"\bwage\s+worker\b"],
    "occ_artist":       [r"\bartist\b", r"\bcraftsman\b", r"\bartisan\b",
                         r"\bweaver\b", r"\bpotter\b", r"\bmusician\b",
                         r"\bdancer\b", r"\bpainter\b", r"\bsculptor\b",
                         r"\bfolk\s+artist\b", r"\bhandloom\b"],
    "occ_fisherman":    [r"\bfisherm\w+\b", r"\bfisher\b", r"\bfishing\b",
                         r"\baquaculture\b", r"\bpisciculture\b"],
    "occ_sportsperson": [r"\bsportsperson\b", r"\bathlete\b", r"\bsports(?:man)?\b",
                         r"\bplayer\b"],
    "occ_entrepreneur": [r"\bentrepreneur\b", r"\bself[\s-]?employ\w+\b",
                         r"\b(?<!\w)msme(?!\w)\b", r"\bstartup\b", r"\bstart[\s-]up\b"],
    "occ_govt_emp":     [r"\bgovernment\s+employee\b", r"\bgovernment\s+servant\b",
                         r"\bsarkari\s+karmchari\b", r"\bstate\s+government\s+employee\b"],
    "occ_teacher":      [r"\bteacher\b", r"\bfaculty\b", r"\bprofessor\b",
                         r"\beducator\b", r"\blecturer\b"],
    "occ_healthcare":   [r"\bdoctor\b", r"\bphysician\b", r"\bnurse\b",
                         r"\bhealthcare\s+worker\b", r"\bmedical\s+professional\b",
                         r"\bparamedic\b"],
    "occ_journalist":   [r"\bjournalist\b", r"\bpress\s+reporter\b", r"\bnewspaper\b"],
    "occ_unemployed":   [r"\bunemployed\b", r"\bjobless\b", r"\bjob[\s-]?seeker\b"],
    "occ_senior":       [r"\bsenior\s+citizen\b", r"\belderly\b", r"\bold\s+age\b",
                         r"\bold\s+aged\b"],
    "occ_homemaker":    [r"\bhomemaker\b", r"\bhousewife\b", r"\bnon[\s-]?working\s+woman\b"],
}

STUDENT_LEVEL_PATTERNS = {
    "student_school":  [r"\bclass\s*[1-8]\b", r"\bprimary\s+school\b",
                        r"\bupper\s+primary\b", r"\belementary\s+school\b"],
    "student_class10": [r"\bclass\s*(?:9|10|x\b|ix\b)\b", r"\bmatric(?:ulation)?\b",
                        r"\bsslc\b", r"\bsecondary\s+school\b",
                        r"\b(?<!\+)10(?:th)?\s+(?:pass|standard|class)\b"],
    "student_class12": [r"\bclass\s*(?:11|12|xi|xii)\b", r"\b10\+2\b",
                        r"\bintermediate\b", r"\bhigher\s+secondary\b",
                        r"\bhsc\b", r"\bsenior\s+secondary\b",
                        r"\b12(?:th)?\s+(?:pass|standard|class)\b"],
    "student_diploma": [r"\bdiploma\b", r"\b(?<!\w)iti(?!\w)\b",
                        r"\bpolytechnic\b", r"\bvocational\s+course\b"],
    "student_ug":      [r"\bundergraduat\w*\b", r"\bbachelor\b",
                        r"\bb\.?tech\b",
                        r"\bb\.e\b",         # B.E. — dot required (avoids matching "be")
                        r"\bb\.sc\b",        # B.Sc — dot required (avoids "bsc" in other words)
                        r"\bb\.a\b",         # B.A. — dot required
                        r"\bb\.com\b",       # B.Com — dot required
                        r"\bmbbs\b",
                        r"\bb\.?agri\b", r"\bllb\b", r"\bbba\b",
                        r"\bdegree\s+course\b", r"\bgraduat\w+\s+degree\b"],
    "student_pg":      [r"\bpost[\s-]?graduat\w*\b", r"\bmaster\b",
                        r"\bm\.?tech\b", r"\bm\.?e\b", r"\bm\.?sc\b",
                        r"\bm\.?a\b", r"\bm\.?com\b", r"\bmba\b",
                        r"\bmd\b", r"\bm\.?agri\b", r"\bllm\b",
                        r"\bm\.?phil\b"],
    "student_phd":     [r"\bph\.?d\b", r"\bdoctorate\b",
                        r"\bresearch\s+scholar\b", r"\bfellowship\b",
                        r"\bjrf\b", r"\bsrf\b", r"\bpost[\s-]?doctoral\b"],
}

# Context-sensitive: only fires when the field appears as an explicit requirement
# (after "pursuing", "course in", "enrolled in", "X student/degree")
FIELD_REQ_PATTERNS: dict[str, list[str]] = {
    "req_field_engineering": [
        r"pursuing\s+.{0,120}?\b(?:engineering|b\.?tech|m\.?tech|b\.?e\.?\b)\b",
        r"\b(?:engineering|b\.?tech|m\.?tech)\s+(?:student|graduate|degree|course|college|programs?)",
        r"course\s+in\s+.{0,60}?\bengineering\b",
        r"enrolled\s+in\s+.{0,100}?\bengineering\b",
        r"\baicte[\s-]approved\s+(?:engineering|technical)\b",
    ],
    "req_field_medical": [
        r"pursuing\s+.{0,120}?\b(?:medical|mbbs|b\.?d\.?s\.?|nursing|pharmacy|b\.?pharm)\b",
        r"\b(?:medical|mbbs|b\.?d\.?s)\s+(?:student|graduate|degree|course|program)",
        r"course\s+in\s+.{0,60}?\b(?:medical|mbbs|nursing|pharmacy)\b",
        r"enrolled\s+in\s+.{0,100}?\b(?:medical|nursing|pharmacy)\b",
    ],
    "req_field_agriculture": [
        r"pursuing\s+.{0,120}?\b(?:agricultur\w*|horticultur\w*|veterinary|b\.?\s*sc\.?\s*agri|b\.?\s*agri)\b",
        r"\bagriculture\s+(?:student|graduate|degree|course|universit\w*)\b",
        r"course\s+in\s+.{0,60}?\b(?:agricultur\w*|horticultur\w*|veterinary)\b",
        r"enrolled\s+in\s+.{0,100}?\b(?:agricultur\w*|veterinary)\b",
        r"\bagricultural\s+(?:universit\w*|college|program|degree)\b",   # e.g. "Agricultural University"
        r"\bagricultural\s+universit\w+\b",                              # belt-and-suspenders
        r"admission\s+in\s+.{0,60}?\bagricultural\s+universit\w*\b",
    ],
    "req_field_management": [
        r"pursuing\s+.{0,120}?\b(?:mba|business\s+administration|management)\b",
        r"\bmba\s+(?:student|degree|course|graduate|program)\b",
        r"course\s+in\s+.{0,60}?\b(?:mba|business\s+administration|management)\b",
    ],
    "req_field_law": [
        r"pursuing\s+.{0,120}?\b(?:law\b|l\.?l\.?b|l\.?l\.?m)\b",
        r"\b(?:l\.?l\.?b|l\.?l\.?m|law)\s+(?:student|graduate|degree|course|program)\b",
        r"course\s+in\s+.{0,60}?\b(?:law|l\.?l\.?b|l\.?l\.?m)\b",
        r"\blaw\s+(?:graduate|graduates|degree|school)\b",
    ],
    "req_field_media": [
        r"pursuing\s+.{0,120}?\b(?:mass\s+communication|journalism|public\s+relations)\b",
        r"\b(?:mass\s+communication|journalism)\s+(?:student|graduate|degree|course|program)\b",
        r"course\s+in\s+.{0,60}?\b(?:mass\s+communication|journalism|public\s+relations)\b",
        r"enrolled\s+in\s+.{0,100}?\b(?:mass\s+communication|journalism)\b",
    ],
    "req_field_arts": [
        r"pursuing\s+.{0,120}?\b(?:fine\s+arts|performing\s+arts|b\.?f\.?a|b\.?p\.?a|music\s+degree|dance\s+degree)\b",
        r"\b(?:fine\s+arts|performing\s+arts)\s+(?:student|graduate|degree|course)\b",
        r"course\s+in\s+.{0,60}?\b(?:fine\s+arts|performing\s+arts)\b",
    ],
    "req_field_science": [
        r"pursuing\s+.{0,120}?\b(?:b\.?sc|m\.?sc)\b.{0,40}?\b(?:physics|chemistry|biology|mathematics|zoology|botany)\b",
        r"enrolled\s+in\s+.{0,100}?\b(?:pure\s+science|basic\s+science|b\.?sc\.?\s+(?:hons\.?|honors?))\b",
    ],
}

MERIT_PATTERNS: dict[str, list[str]] = {
    "req_merit_rank": [
        r"\bboard\s+topper\b",
        r"\brank\s+holder\b",
        r"\brank[\s-]?1\b",
        r"\bfirst\s+rank\b",
        r"\bmeritorious\s+student\b",
        r"\btop\s+(?:rank|ranker|student)\b",
        # "merit list" / "merit rank" mean topper contexts — but NOT "merit-cum-means"
        # which is a general scholarship type for passing students, not toppers.
        r"\bmerit\s+(?:list|rank)\b",
        r"\baward.*?meritorious\b",
        r"\bmeritorious.*?award\b",
        r"\bdistinction.*?student\b|\bstudent.*?distinction\b",
    ],
    "req_olympiad": [
        r"\bolympiad\b",
        r"\bntse\b",
        r"\bnational\s+talent\s+search\b",
        r"\bkvpy\b",
        r"\bkishore\s+vaigyanik\b",
        r"\binspire\s+(?:scholarship|fellowship|award)\b",
        r"\bjnvst\b",
        r"\bnational\s+science\s+olympiad\b",
        r"\binternational\s+(?:science|math\w*|olympiad)\b",
    ],
    "req_sports_award": [
        r"\bsports?\s+(?:achievement|award|champion|winner|medal)\b",
        r"\bnational\s+(?:level\s+)?sports?\s+(?:award|achievement|champion)\b",
        r"\bstate\s+(?:level\s+)?sports?\s+(?:award|achievement)\b",
        r"\barjuna\s+award\b",
        r"\bkhelo\s+india\s+(?:award|awardee)\b",
        r"\brepresent(?:ed|ing)\s+(?:india|state)\s+in\s+sports?\b",
        r"\bnational\s+sports\s+day\b",
    ],
    "req_research": [
        r"\bpublished\s+(?:research\s+)?paper\b",
        r"\bpatent\s+(?:holder|filed|granted)\b",
        r"\bresearch\s+publication\b",
        r"\bjrf\s+(?:holder|qualified|award)\b",
        r"\bnet[\s-]qualified\b",
        r"\bpost\s*doctoral\s+(?:research|fellow)\b",
    ],
    "req_cultural_award": [
        r"\bnational\s+(?:level\s+)?(?:arts?|culture|music|dance|theatre)\s+(?:award|achievement|champion)\b",
        r"\bcultural\s+(?:award|achievement|excellence)\b",
        r"\bnational\s+youth\s+festival\s+(?:award|winner)\b",
        r"\bstate\s+(?:level\s+)?(?:arts?|culture)\s+award\b",
    ],
}

BRANCH_PATTERNS: dict[str, list[str]] = {
    "branch_cs_it": [
        r"\bcomputer\s+science\b",
        r"\binformation\s+technology\b",
        r"\bsoftware\s+engineering\b",
        r"\b(?<!\w)cse\b",
        r"\b(?<!\w)mca\b",
        r"\bartificial\s+intelligence\b",
        r"\bdata\s+science\b",
        r"\bcybersecurit\b",
        r"\bdigital\s+(?:technology|india)\b",
    ],
    "branch_electronics": [
        r"\belectronics\s+(?:engineering|and)\b",
        r"\belectrical\s+engineering\b",
        r"\b(?<!\w)ece\b",
        r"\b(?<!\w)eee\b",
        r"\bvlsi\b",
        r"\bembedded\s+systems?\b",
        r"\besdm\b",
        r"\bcommunication\s+engineering\b",
    ],
    "branch_mechanical": [
        r"\bmechanical\s+engineering\b",
        r"\bcivil\s+engineering\b",
        r"\baerospace\s+engineering\b",
        r"\baeronautical\s+engineering\b",
        r"\bautomobile\s+engineering\b",
    ],
    "branch_biotech": [
        r"\bbiotechnology\b",
        r"\bbiomedical\s+engineering\b",
        r"\bbioinformatics\b",
        r"\bbiological\s+engineering\b",
        r"\bgenetic\s+engineering\b",
    ],
    "branch_textile": [
        r"\btextile\s+(?:engineering|technology)\b",
        r"\bleather\s+technology\b",
        r"\bfashion\s+technology\b",
        r"\bjute\s+technology\b",
    ],
}

FARMER_SIZE_PATTERNS = {
    "farmer_marginal": [r"\bmarginal\s+farmer\b", r"\bsmall\s+and\s+marginal\b",
                        r"\bless\s+than\s+1\s+(?:hectare|ha\b|acre)\b",
                        r"\bup\s+to\s+1\s+(?:hectare|ha\b)\b"],
    "farmer_small":    [r"\bsmall\s+farmer\b", r"\b1[\s-]?(?:to|-)[\s-]?2\s+(?:hectare|ha\b)\b",
                        r"\bsmall\s+and\s+marginal\b"],
}

BIZ_PATTERNS = {
    "biz_micro":   [r"\bmicro\s+(?:enterprise|unit|industry|business)\b",
                    r"\bmicro\s+and\s+small\b"],
    "biz_small":   [r"\bsmall\s+(?:enterprise|unit|industry|business)\b",
                    r"\bmicro\s+and\s+small\b", r"\bsmall\s+and\s+medium\b"],
    "biz_medium":  [r"\bmedium\s+(?:enterprise|unit|industry|business)\b",
                    r"\bsmall\s+and\s+medium\b"],
    "biz_startup": [r"\bstartup\b", r"\bstart[\s-]up\b", r"\bnew\s+(?:enterprise|unit|business)\b"],
}

AGE_PATTERNS = [
    (r"(\d+)\s*(?:to|[-–])\s*(\d+)\s*years?",          "range"),
    (r"(?:above|over|more\s+than)\s+(\d+)\s*years?",   "min_only"),
    (r"(?:below|under|less\s+than)\s+(\d+)\s*years?",  "max_only"),
    (r"minimum\s+age[^\d]*(\d+)",                       "min_only"),
    (r"maximum\s+age[^\d]*(\d+)",                       "max_only"),
    (r"(?:not|no\s+more)\s+(?:more\s+than|above|exceed)\s+(\d+)\s*years?", "max_only"),
    (r"at\s+least\s+(\d+)\s*years?",                   "min_only"),
    (r"(\d+)\s*years?\s+(?:of\s+age\s+)?(?:or\s+)?(?:above|older)",       "min_only"),
    (r"(\d+)\s*years?\s+(?:of\s+age\s+)?(?:or\s+)?(?:below|younger)",     "max_only"),
]

INCOME_PATTERNS = [
    r"annual\s+(?:family\s+)?income\D{0,20}(?:rs\.?|₹|inr)?\s*([\d,]+)",
    r"(?:rs\.?|₹|inr)\s*([\d,]+)\s*(?:per\s+)?(?:annum|year|p\.?a\.?)",
    r"income\D{0,20}(?:not\s+)?(?:more\s+than|exceed(?:ing)?)\D{0,10}(?:rs\.?|₹|inr)?\s*([\d,]+)",
    r"income\s+limit\D{0,20}(?:rs\.?|₹|inr)?\s*([\d,]+)",
    r"(?:rs\.?|₹)\s*([\d,]+)\s*/?\s*(?:annum|year)",
]

# Indian state names for geographic lock detection
STATES = [
    "andhra pradesh", "arunachal pradesh", "assam", "bihar", "chhattisgarh",
    "goa", "gujarat", "haryana", "himachal pradesh", "jharkhand", "karnataka",
    "kerala", "madhya pradesh", "maharashtra", "manipur", "meghalaya", "mizoram",
    "nagaland", "odisha", "punjab", "rajasthan", "sikkim", "tamil nadu",
    "telangana", "tripura", "uttar pradesh", "uttarakhand", "west bengal",
    "andaman and nicobar", "chandigarh", "dadra and nagar haveli", "daman and diu",
    "delhi", "jammu and kashmir", "ladakh", "lakshadweep", "puducherry",
]


# ── Parsing functions ─────────────────────────────────────────────────────────

def _matches_any(text: str, patterns: list[str]) -> bool:
    return any(re.search(p, text, re.I) for p in patterns)


def _parse_age(text: str) -> tuple[int | None, int | None]:
    age_min = age_max = None
    for pattern, kind in AGE_PATTERNS:
        for m in re.finditer(pattern, text, re.I):
            try:
                if kind == "range":
                    lo, hi = int(m.group(1)), int(m.group(2))
                    if 0 < lo < hi < 120:
                        age_min = lo if age_min is None else min(age_min, lo)
                        age_max = hi if age_max is None else max(age_max, hi)
                elif kind == "min_only":
                    v = int(m.group(1))
                    if 0 < v < 120:
                        age_min = v if age_min is None else min(age_min, v)
                elif kind == "max_only":
                    v = int(m.group(1))
                    if 0 < v < 120:
                        age_max = v if age_max is None else max(age_max, v)
            except (ValueError, IndexError):
                pass
    return age_min, age_max


def _parse_income(text: str) -> int | None:
    # Reject lines that are clearly benefit/scholarship amounts, not income caps
    _BENEFIT_CTX = re.compile(
        r'(?:scholarship|stipend|fellowship|benefit|honorarium|pension|rate|'
        r'assistance|grant|award|incentive|allowance|amount\s+of|per\s+month'
        r'(?!\s*income))',
        re.I,
    )
    for pattern in INCOME_PATTERNS:
        for m in re.finditer(pattern, text, re.I):
            # Get the surrounding sentence (~150 chars) to check context
            start = max(0, m.start() - 80)
            ctx = text[start: m.end() + 40]
            # Skip if this looks like a benefit amount rather than an income cap
            if _BENEFIT_CTX.search(ctx):
                continue
            raw = m.group(1).replace(",", "")
            try:
                val = int(raw)
                # Real income caps are at least ₹50,000/yr; smaller = benefit amount, not cap
                if 50_000 <= val <= 100_000_000:
                    return val
            except ValueError:
                pass
    return None


def _detect_state_lock(text: str, listing_state: str | None) -> str | None:
    """Return the state name if scheme is geographically restricted."""
    if listing_state and listing_state.lower() not in ("", "all", "all india", "central"):
        return listing_state
    # Also look for strong state residency requirement in eligibility text
    for state in STATES:
        if re.search(rf"\bresident\s+of\s+{re.escape(state)}\b", text, re.I):
            return state.title()
    return None


MARKS_PATTERNS = [
    # "75% marks" / "75% aggregate" / "75% or above"
    r"(\d{2})\s*%\s*(?:marks?|aggregate|percentage|score|or\s+above|or\s+more|and\s+above)",
    r"(?:minimum|at\s+least)\s+(?:of\s+)?(\d{2})\s*%",
    r"secur(?:ing|ed)\s+(\d{2})\s*%",
    r"(\d{2})\s*%\s+in\s+the\s+(?:qualifying|previous|last)",
    r"scored?\s+(?:at\s+least\s+)?(\d{2})\s*%",
    r"(\d{2})\s*%\s*(?:or\s+)?(?:above|higher|more)\s+(?:marks?|aggregate|percentage|in)",
]
MARKS_CLASS_MAP = {"first": 60, "second": 50, "third": 40}

# Location type
LOCATION_PATTERNS = {
    "req_rural": [r"\brural\s+area\b", r"\bvillage\b", r"\bgram\s+panchayat\b"],
    "req_urban": [r"\burban\s+area\b", r"\bmunicip\w+\b", r"\bcity\b", r"\btown\b"],
}

# Hyper-specific target group patterns
SPECIFIC_GROUP_PATTERNS: dict[str, list[str]] = {
    # Children of sanitation/scavenging/hazardous-cleaning workers
    "req_sanitation_child": [
        r"\bscaveng\w*\b",
        r"\bsafai\s+karamchari\b",
        r"\bmanual\s+scaveng\w*\b",
        r"cleaning\s+and\s+prone\s+to\s+health\s+hazard",
        r"occupations?\s+involving\s+cleaning",
        r"\bhazardous\s+(?:and\s+)?cleaning\b",
        r"\bsewer\s+worker\b",
    ],
    # Nomadic / Denotified Tribes
    "req_nomadic_tribe": [
        r"\bnomadic\s+tribe\b",
        r"\bdenotified\s+tribe\b",
        r"\bvimukta\s+jati\b",
        r"\b(?:nt|dnt)\s*\b",
        r"\bsemi[\s-]?nomadic\b",
        r"\bvimukt\w+\b",
    ],
    # Prisoner's family
    "req_prisoner_family": [
        r"\bprisoner\b",
        r"\bjail\w*\b",
        r"\bincarcerat\w*\b",
        r"\bconvict\w*\b",
        r"\bdetenu\b",
        r"family\s+of\s+(?:prisoner|convict|detenu)",
    ],
    # Acid attack survivor
    "req_acid_victim": [
        r"\bacid\s+attack\b",
        r"\bacid\s+(?:victim|survivor|affected)\b",
        r"\bacid\s+violence\b",
    ],
    # HIV / AIDS affected
    "req_hiv_affected": [
        r"\b(?<!\w)hiv\b",
        r"\b(?<!\w)aids\b",
        r"\bhiv[\s-]?positive\b",
        r"\bhiv[\s-]?affected\b",
        r"\bantiretroviral\b",
    ],
    # Cancer patient / survivor
    "req_cancer": [
        r"\bcancer\s+(?:patient|survivor|affected|sufferer)\b",
        r"\bcancer\s+treatment\b",
        r"\bcancerous\b",
        r"\boncolog\w*\b",
    ],
    # Handloom weaver / Khadi artisan (more specific than general occ_artist)
    "req_weaver": [
        r"\bhandloom\s+weaver\b",
        r"\bweaver\b",
        r"\bhandloom\s+worker\b",
        r"\bkhadi\s+(?:worker|artisan|weaver)\b",
        r"\bpowerloom\s+weaver\b",
        r"\bhandloom\s+(?:and|or|&)\s+(?:textile|cottage)\b",
    ],
    # Street vendor / hawker
    "req_street_vendor": [
        r"\bstreet\s+vendor\b",
        r"\bhawker\b",
        r"\bstreet\s+hawker\b",
        r"\bvending\s+(?:stall|business|activity)\b",
        r"\bpm\s+svani\w*\b",
        r"\bsvani\w*\s+scheme\b",
    ],
}


def _parse_marks(text: str) -> int | None:
    """Return minimum marks percentage required (0-100), or None."""
    best = None
    for pattern in MARKS_PATTERNS:
        for m in re.finditer(pattern, text, re.I):
            try:
                v = int(m.group(1))
                if 30 <= v <= 100:
                    best = v if best is None else min(best, v)
            except (ValueError, IndexError):
                pass
    # CGPA (multiply by 10 to convert to percentage)
    for m in re.finditer(r"cgpa\s+(?:of\s+)?(\d+(?:\.\d+)?)\s*(?:or\s+above|or\s+more|and\s+above|minimum)", text, re.I):
        try:
            cgpa = float(m.group(1))
            if 4.0 <= cgpa <= 10.0:
                pct = int(cgpa * 10)
                best = pct if best is None else min(best, pct)
        except (ValueError, IndexError):
            pass
    # First class / second class keywords
    for cls, pct in MARKS_CLASS_MAP.items():
        if re.search(rf"\b{cls}\s+class\b", text, re.I):
            best = pct if best is None else min(best, pct)
    return best


# target_beneficiaries values that indicate individual persons can apply
_INDIVIDUAL_BENEFICIARY_TYPES = {
    "individual", "family", "artists", "sportsperson", "journalist", "all", "visitor"
}

# Eligibility text patterns that indicate the SCHEME IS FOR AN INSTITUTION, not a person
_INSTITUTION_APPLICANT_RE = re.compile(
    r"(?:"
    r"^\s*(?:>?\s*\*{0,2})?for\s+(?:colleges?|institutions?|universities|departments?|schools?)\b"
    r"|the\s+(?:college|institution|university|department|school)\s+(?:must|should|shall|is\s+required)\s+(?:have|be|possess|submit|apply)"
    r"|(?:college|institution|university|department)\s+(?:applying|wishing|intending|that\s+(?:wish|want|intend))\b"
    r"|eligible\s+(?:colleges?|institutions?|universities|departments?)\s+(?:should|must|shall)\b"
    r")",
    re.I | re.MULTILINE,
)

_MINORITY_TAG_WORDS = {"minority", "minority students", "minority community",
                       "muslim", "christian", "sikh", "buddhist", "parsi", "jain"}
_SC_TAG_WORDS       = {"scheduled caste", "sc", "dalit"}
_ST_TAG_WORDS       = {"scheduled tribe", "st", "tribal", "adivasi"}
_DISABLED_TAG_WORDS = {"disability", "disabilities", "person with disability",
                       "pwd", "divyang", "differently abled", "handicapped",
                       "specially abled", "benchmark disabilities"}


def _enrich_from_tags(row: dict, tags_json: str | None, ministry: str | None,
                      target_beneficiaries_json: str | None = None,
                      eligibility_md: str | None = None) -> None:
    """Supplement eligibility_md parsing with signals from tags, ministry, and target_beneficiaries."""
    import json as _json
    tags: list[str] = []
    if tags_json:
        try:
            tags = [t.lower().strip() for t in _json.loads(tags_json)]
        except Exception:
            pass
    min_lower = (ministry or "").lower()

    # Minority
    if (any(w in tags for w in _MINORITY_TAG_WORDS)
            or "minority" in min_lower):
        row["req_minority"] = 1

    # Disability — from tags or ministry
    if (any(w in tags for w in _DISABLED_TAG_WORDS)
            or "disabilit" in min_lower or "divyang" in min_lower):
        row["req_disabled"] = 1

    # SC
    if any(w in tags for w in _SC_TAG_WORDS):
        row["caste_sc"] = 1
        row["caste_any"] = 0

    # ST
    if any(w in tags for w in _ST_TAG_WORDS):
        row["caste_st"] = 1
        row["caste_any"] = 0

    # Agriculture field — Ministry of Agriculture / ICAR student schemes
    if row.get("occ_student") and (
        re.search(r'\bagricultur|\bicar\b', min_lower, re.I)
    ):
        row["req_field_agriculture"] = 1
        row["has_field_restriction"] = 1

    # Institution-only schemes: if target_beneficiaries has NO individual types → for_individual=0
    if target_beneficiaries_json:
        try:
            tb = [t.lower().strip() for t in _json.loads(target_beneficiaries_json)]
            has_individual = any(t in _INDIVIDUAL_BENEFICIARY_TYPES for t in tb)
            if tb and not has_individual:
                row["for_individual"] = 0
        except Exception:
            pass

    # Institution-as-applicant: eligibility text explicitly targets colleges/institutions
    if eligibility_md and _INSTITUTION_APPLICANT_RE.search(eligibility_md):
        row["for_individual"] = 0


def parse_one(slug: str, eligibility_md: str | None, listing_state: str | None,
              tags_json: str | None = None, ministry: str | None = None,
              scheme_name: str | None = None,
              target_beneficiaries_json: str | None = None) -> dict:
    # Include scheme name in the searchable text — many groups are named in the title
    text = ((eligibility_md or "") + " " + (scheme_name or "")).lower()
    row: dict = {
        "slug": slug,
        "for_individual": 1,
        "for_business": 0, "for_family": 0, "for_shg": 0, "for_ngo": 0,
        "gender_female": 0, "gender_male": 0, "gender_trans": 0, "gender_any": 1,
        "caste_sc": 0, "caste_st": 0, "caste_obc": 0, "caste_ews": 0,
        "caste_general": 0, "caste_any": 1,
        "req_bpl": 0, "req_widow": 0, "req_disabled": 0,
        "req_orphan": 0, "req_minority": 0, "req_exserviceman": 0,
        "age_min": None, "age_max": None, "income_max": None,
        "occ_student": 0, "occ_farmer": 0, "occ_construction": 0,
        "occ_labourer": 0, "occ_artist": 0, "occ_fisherman": 0,
        "occ_sportsperson": 0, "occ_entrepreneur": 0, "occ_govt_emp": 0,
        "occ_teacher": 0, "occ_healthcare": 0, "occ_journalist": 0,
        "occ_unemployed": 0, "occ_senior": 0, "occ_homemaker": 0,
        "student_school": 0, "student_class10": 0, "student_class12": 0,
        "student_diploma": 0, "student_ug": 0, "student_pg": 0, "student_phd": 0,
        "farmer_marginal": 0, "farmer_small": 0, "farmer_any": 0,
        "biz_micro": 0, "biz_small": 0, "biz_medium": 0, "biz_startup": 0,
        "state_locked": None,
        "marks_min": None,
        "has_occ_restriction": 0,
        "req_rural": 0, "req_urban": 0,
        "req_sanitation_child": 0, "req_nomadic_tribe": 0, "req_prisoner_family": 0,
        "req_acid_victim": 0, "req_hiv_affected": 0, "req_cancer": 0,
        "req_weaver": 0, "req_street_vendor": 0,
        "req_merit_rank": 0, "req_olympiad": 0, "req_sports_award": 0,
        "req_research": 0, "req_cultural_award": 0,
        "branch_cs_it": 0, "branch_electronics": 0, "branch_mechanical": 0,
        "branch_biotech": 0, "branch_textile": 0,
        "req_field_engineering": 0, "req_field_medical": 0,
        "req_field_agriculture": 0, "req_field_management": 0,
        "req_field_law": 0, "req_field_media": 0,
        "req_field_arts": 0, "req_field_science": 0,
        "has_field_restriction": 0,
    }

    # Applicant type
    for field, patterns in TARGET_PATTERNS.items():
        if _matches_any(text, patterns):
            row[field] = 1

    # Gender
    genders_found = set()
    for field, patterns in GENDER_PATTERNS.items():
        if _matches_any(text, patterns):
            row[field] = 1
            genders_found.add(field)
    if genders_found:
        if genders_found == {"gender_female"} or genders_found == {"gender_male"}:
            row["gender_any"] = 0
        elif genders_found == {"gender_trans"}:
            row["gender_any"] = 0

    # Caste
    caste_found = False
    for field, patterns in CASTE_PATTERNS.items():
        if _matches_any(text, patterns):
            row[field] = 1
            caste_found = True
    if caste_found:
        row["caste_any"] = 0

    # Special status
    for field, patterns in SPECIAL_PATTERNS.items():
        if _matches_any(text, patterns):
            row[field] = 1

    # Age
    row["age_min"], row["age_max"] = _parse_age(text)

    # Income
    row["income_max"] = _parse_income(text)

    # Marks
    row["marks_min"] = _parse_marks(text)

    # Occupation
    for field, patterns in OCC_PATTERNS.items():
        if _matches_any(text, patterns):
            row[field] = 1

    # Derived: does the scheme have ANY occupation restriction?
    occ_fields = ["occ_student", "occ_farmer", "occ_construction", "occ_labourer",
                  "occ_artist", "occ_fisherman", "occ_sportsperson", "occ_entrepreneur",
                  "occ_govt_emp", "occ_teacher", "occ_healthcare", "occ_journalist",
                  "occ_unemployed", "occ_senior", "occ_homemaker"]
    row["has_occ_restriction"] = 1 if any(row[f] for f in occ_fields) else 0

    # Student sub-levels
    if row["occ_student"]:
        for field, patterns in STUDENT_LEVEL_PATTERNS.items():
            if _matches_any(text, patterns):
                row[field] = 1

    # Farmer sub-types
    if row["occ_farmer"]:
        row["farmer_any"] = 1
        for field, patterns in FARMER_SIZE_PATTERNS.items():
            if _matches_any(text, patterns):
                row[field] = 1

    # Business sub-types
    if row["for_business"] or row["occ_entrepreneur"]:
        for field, patterns in BIZ_PATTERNS.items():
            if _matches_any(text, patterns):
                row[field] = 1

    # Location type
    for field, patterns in LOCATION_PATTERNS.items():
        if _matches_any(text, patterns):
            row[field] = 1

    # Hyper-specific target groups (checked against full text including scheme name)
    for field, patterns in SPECIFIC_GROUP_PATTERNS.items():
        if _matches_any(text, patterns):
            row[field] = 1

    # Geographic lock
    row["state_locked"] = _detect_state_lock(text, listing_state)

    # Merit/achievement requirements (checked for all schemes)
    for field, patterns in MERIT_PATTERNS.items():
        if _matches_any(text, patterns):
            row[field] = 1

    # Engineering branch signals (only for student engineering schemes)
    if row["occ_student"]:
        for field, patterns in BRANCH_PATTERNS.items():
            if _matches_any(text, patterns):
                row[field] = 1

    # Field-of-study restrictions (only for student schemes)
    if row["occ_student"]:
        for field_key, patterns in FIELD_REQ_PATTERNS.items():
            if _matches_any(text, patterns):
                row[field_key] = 1

        # Remove false positives where the field is explicitly negated in the text
        # e.g. "non-engineering", "except engineering courses"
        if row.get("req_field_engineering") and re.search(
            r'\bnon[\s-]engineering\b|except\s+engineering|excluding\s+engineering',
            text, re.I
        ):
            row["req_field_engineering"] = 0

        row["has_field_restriction"] = 1 if any(
            row[f] for f in FIELD_REQ_PATTERNS
        ) else 0

    # Supplement with signals from tags, ministry, and target_beneficiaries
    _enrich_from_tags(row, tags_json, ministry,
                      target_beneficiaries_json=target_beneficiaries_json,
                      eligibility_md=eligibility_md)

    return row


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute(CREATE_TABLE)
    conn.commit()

    rows = conn.execute("""
        SELECT d.slug, d.eligibility_md, l.state, d.tags, d.nodal_ministry,
               d.scheme_name, d.target_beneficiaries
        FROM details d
        LEFT JOIN listings l ON d.slug = l.slug
    """).fetchall()

    print(f"Parsing {len(rows)} schemes...")

    cols = [
        "slug", "for_individual", "for_business", "for_family", "for_shg", "for_ngo",
        "gender_female", "gender_male", "gender_trans", "gender_any",
        "caste_sc", "caste_st", "caste_obc", "caste_ews", "caste_general", "caste_any",
        "req_bpl", "req_widow", "req_disabled", "req_orphan", "req_minority", "req_exserviceman",
        "age_min", "age_max", "income_max",
        "marks_min", "has_occ_restriction", "req_rural", "req_urban",
        "req_sanitation_child", "req_nomadic_tribe", "req_prisoner_family",
        "req_acid_victim", "req_hiv_affected", "req_cancer",
        "req_weaver", "req_street_vendor",
        "req_merit_rank", "req_olympiad", "req_sports_award",
        "req_research", "req_cultural_award",
        "branch_cs_it", "branch_electronics", "branch_mechanical",
        "branch_biotech", "branch_textile",
        "req_field_engineering", "req_field_medical", "req_field_agriculture",
        "req_field_management", "req_field_law", "req_field_media",
        "req_field_arts", "req_field_science", "has_field_restriction",
        "occ_student", "occ_farmer", "occ_construction", "occ_labourer", "occ_artist",
        "occ_fisherman", "occ_sportsperson", "occ_entrepreneur", "occ_govt_emp",
        "occ_teacher", "occ_healthcare", "occ_journalist", "occ_unemployed",
        "occ_senior", "occ_homemaker",
        "student_school", "student_class10", "student_class12", "student_diploma",
        "student_ug", "student_pg", "student_phd",
        "farmer_marginal", "farmer_small", "farmer_any",
        "biz_micro", "biz_small", "biz_medium", "biz_startup",
        "state_locked",
    ]
    placeholders = ", ".join(f":{c}" for c in cols)
    col_names = ", ".join(cols)
    sql = f"INSERT OR REPLACE INTO parsed_eligibility({col_names}) VALUES ({placeholders})"

    batch = []
    for i, (slug, elig_md, state, tags_json, ministry, scheme_name, target_ben) in enumerate(rows):
        parsed = parse_one(slug, elig_md, state, tags_json, ministry, scheme_name, target_ben)
        batch.append(parsed)
        if len(batch) >= 500:
            conn.executemany(sql, batch)
            conn.commit()
            batch.clear()
            print(f"  {i+1}/{len(rows)}")

    if batch:
        conn.executemany(sql, batch)
        conn.commit()

    total = conn.execute("SELECT COUNT(*) FROM parsed_eligibility").fetchone()[0]
    print(f"\nDone. {total} rows in parsed_eligibility table.")

    # Quick stats
    stats = [
        ("Female-specific", "SELECT COUNT(*) FROM parsed_eligibility WHERE gender_any=0 AND gender_female=1"),
        ("Caste-restricted", "SELECT COUNT(*) FROM parsed_eligibility WHERE caste_any=0"),
        ("BPL required", "SELECT COUNT(*) FROM parsed_eligibility WHERE req_bpl=1"),
        ("Has age range", "SELECT COUNT(*) FROM parsed_eligibility WHERE age_min IS NOT NULL OR age_max IS NOT NULL"),
        ("State-locked", "SELECT COUNT(*) FROM parsed_eligibility WHERE state_locked IS NOT NULL"),
        ("Student schemes", "SELECT COUNT(*) FROM parsed_eligibility WHERE occ_student=1"),
        ("Farmer schemes", "SELECT COUNT(*) FROM parsed_eligibility WHERE occ_farmer=1"),
    ]
    print("\nParsed stats:")
    for label, query in stats:
        n = conn.execute(query).fetchone()[0]
        print(f"  {label}: {n}")

    conn.close()


if __name__ == "__main__":
    main()
