# Suvidha Setu — सुविधा सेतु

**Find the schemes you're actually eligible for. And the ones you never knew you were owed.**

*A precision recommender engine for India's 4,669 government welfare schemes.*

---

India has more welfare schemes than almost any country on earth. Scholarships, stipends, subsidies, free equipment, monthly cash transfers — for farmers and students and weavers and fishermen and cancer patients and acid attack survivors and the children of sanitation workers.

Most of them go unclaimed. Not because people don't need the money. Because nobody told them it existed.

The official portal returns 500 to 3,000 schemes for a single query. It asks eight flat questions. It shows everything. It explains nothing. It trusts you to read through hundreds of PDFs and figure out — on your own — whether you actually qualify, what you'd actually get, and how you'd actually apply.

That's not a discovery tool. That's a document dump.

**Suvidha Setu asks the right questions — and gives you the short list.**

> **Status:** Working prototype (Streamlit). A web / mobile version is in progress — the recommender engine below is UI-agnostic and backs both.

---

## What Makes This Different

| Feature | myscheme.gov.in | Suvidha Setu |
|---------|----------------|---------------|
| Questions asked | 6–8 flat filters | 8–16 branching, depth-variable questions |
| Student specificity | "Student" checkbox | Level (Class 8 → PhD) + stream + branch + marks |
| Farmer specificity | "Farmer" checkbox | Land size + crop type + KCC status |
| Business specificity | "Business" checkbox | MSME tier + sector + Udyam status + owner background |
| Hard eligibility filters | Binary in/out | 13 distinct hard-exclusion dimensions |
| Invisible schemes unlocked | None | 86+ hyper-specific schemes (sanitation workers' children, Olympiad winners, acid attack survivors, etc.) |
| Output size | 500–3,000 schemes | 20–50 schemes at score ≥ 50 |
| Scoring | Binary | 0–100 relevance score with per-criterion explanation |
| Benefit display | Buried in text | ₹ amount extracted, course-specific for tiered scholarships |
| Application process | Link to external site | Step-by-step rendered inline |
| "What you need" guidance | None | Exact gaps shown for near-misses |

---

## Architecture Overview

```
Data Layer
  cache/schemes.db          ← SQLite with 4,669 scraped schemes
    ├── listings             ← Basic metadata per scheme
    ├── details              ← Full content (eligibility, benefits, application, docs)
    └── parsed_eligibility   ← Structured flags extracted from free text (70+ columns)

Recommender Engine
  recommender/
    ├── parse_eligibility.py ← One-time preprocessing: text → structured flags
    ├── questions.py         ← Decision-tree questionnaire (40+ nodes, 3 branches)
    ├── scorer.py            ← Hard filters + soft 0–100 scoring
    ├── utils.py             ← Benefit extraction, course matching, non-monetary descriptions
    └── app.py               ← Streamlit UI
```

---

## Eligibility Parsing

`parse_eligibility.py` runs once and converts free-text `eligibility_md` fields into 70+ structured boolean/integer columns in the `parsed_eligibility` table. This is what makes sub-second filtering possible.

### Dimensions parsed

**Demographic**
- Gender: `gender_female`, `gender_male`, `gender_trans`, `gender_any`
- Caste: `caste_sc`, `caste_st`, `caste_obc`, `caste_ews`, `caste_general`, `caste_any`
- Age bounds: `age_min`, `age_max`
- Income cap: `income_max` (INR/year — disambiguated from benefit amounts via context-keyword check)

**Special status** (each from eligibility text + tags + ministry name)
- `req_bpl`, `req_widow`, `req_disabled` (fixed: `\bdisabilit\b` → `\bdisabilit\w*`; was matching zero schemes), `req_orphan`, `req_minority`, `req_exserviceman`

**Hyper-specific target groups** (unlock 86+ invisible schemes)
- `req_sanitation_child` — child of safai karamchari / manual scavenger
- `req_nomadic_tribe` — NT / DNT / Vimukta Jati
- `req_prisoner_family` — family member incarcerated
- `req_acid_victim` — acid attack survivor
- `req_hiv_affected` — HIV/AIDS affected person or family
- `req_cancer` — cancer patient / survivor
- `req_weaver` — handloom weaver / Khadi artisan
- `req_street_vendor` — street vendor / hawker

**Occupation** (15 flags: student, farmer, construction, labourer, artist, fisherman, sportsperson, entrepreneur, govt employee, teacher, healthcare, journalist, unemployed, senior, homemaker)

**Student sub-levels** (7 flags: school, class10, class12, diploma, ug, pg, phd)

**Farmer sub-types**: `farmer_marginal`, `farmer_small`, `farmer_any`

**Business sub-types**: `biz_micro`, `biz_small`, `biz_medium`, `biz_startup`

**Field of study restrictions** (context-sensitive — only fires on "pursuing X", "course in X", "X student", not stray mentions)
- `req_field_engineering`, `req_field_medical`, `req_field_agriculture`, `req_field_management`, `req_field_law`, `req_field_media`, `req_field_arts`, `req_field_science`
- `has_field_restriction` — derived flag for fast filtering

**Engineering sub-branch signals** (soft scoring)
- `branch_cs_it`, `branch_electronics`, `branch_mechanical`, `branch_biotech`, `branch_textile`

**Merit / achievement requirements**
- `req_merit_rank` — board toppers, rank holders, meritorious student awards (not "merit-cum-means" scholarships, which is a different category)
- `req_olympiad` — NTSE, KVPY, INSPIRE, Science/Maths Olympiad
- `req_sports_award` — national/state sports achievement
- `req_research` — published research / patent holder
- `req_cultural_award` — national cultural / arts award

**Academic marks**: `marks_min` — minimum percentage required, parsed from patterns like "minimum 75% marks", "first class", "CGPA 8.0 or above" (CGPA × 10 → percentage). Context-filtered to avoid grabbing scholarship benefit amounts as income caps.

**Institutional targeting**: `for_individual` — set to 0 when `target_beneficiaries` contains only institution types (NGO, University/Institution, Government Organisation, etc.) OR when eligibility text starts with "**For Colleges**" / "The institution must have..." — excludes 635 institution-only schemes from individual applicants.

**Geographic**: `state_locked` — state name if scheme is state-specific, NULL for all-India.

**Location type**: `req_rural`, `req_urban`

### Enrichment from non-eligibility fields

Many schemes express eligibility through their tags, ministry name, or scheme name rather than the eligibility text. The parser cross-references:
- **Tags** → `req_minority`, `req_disabled`, `caste_sc`, `caste_st`
- **Ministry name** → `req_field_agriculture` (if Ministry of Agriculture + student scheme)
- **Scheme name** → hyper-specific group detection (e.g. "Pre-Matric Scholarship for Children of Those Engaged in Cleaning…")

---

## The Questionnaire

A branching decision tree with 40+ nodes across three main branches: Individual, Business, and Family. Questions are not flat — early answers determine which follow-up questions appear, matching the actual depth of scheme eligibility criteria.

### Question flow (Individual branch)

```
Root: Who is applying?
└── Individual
    ├── State / UT  (dropdown — 37 states)
    ├── Age         (slider)
    ├── Gender      (radio — Male / Female / Transgender / Prefer not to say)
    ├── Caste       (radio — General / OBC / SC / ST / EWS)
    ├── Special Status  (multiselect — BPL / Widow / Disabled / Orphan / Minority / Ex-Serviceman / None)
    ├── Specific Circumstances  (multiselect — 8 hyper-specific groups + None)
    └── Occupation  (radio — 15 options)
        ├── Student →
        │   ├── Level (school / class10 / class12 / diploma / UG / PG / PhD)
        │   ├── [if class12] Stream (Science / Commerce / Arts / Vocational)
        │   ├── [if diploma] Trade / field
        │   ├── [if UG] Course (B.Tech / MBBS / B.Sc. / B.A. / …)
        │   │   └── [if B.Tech] Engineering Branch (8 options)
        │   │       └── Engineering Interests  (multiselect — cross-branch discovery)
        │   ├── [if PG] Course (M.Tech / MD / M.Sc. / M.A. / …)
        │   │   └── [if M.Tech] Engineering Branch + Interests
        │   ├── [if PhD] Research field (8 domains)
        │   ├── Marks / Percentage  (slider 30–100%)
        │   └── Achievements  (multiselect — topper / Olympiad / sports / research / cultural)
        ├── Farmer →
        │   ├── Land size (Marginal <1ha / Small 1–2ha / Medium / Large / No land)
        │   ├── Farming activity  (multiselect — 11 options)
        │   └── Kisan Credit Card?
        ├── Construction Worker → Board registration?
        ├── Artist / Craftsman → Art type (10 options)
        ├── Fisherman → Type (Inland / Marine / Aquaculture)
        ├── Sportsperson → Level (School to International)
        ├── Entrepreneur → Business Branch (size, sector, Udyam, owner background)
        └── [other occupations] → direct to income + preferences
    ├── Annual household income  (radio — 5 bands; "above ₹8L" maps to ₹1 Crore for hard filtering)
    ├── Benefit preferences      (multiselect)
    └── Sector preferences       (multiselect)
```

**Widget types are chosen semantically:**
- **Radio** — caste (single), gender (single), student level (single), farmer land size (single)
- **Slider** — age, marks percentage (continuous values with visual feedback)
- **Dropdown** — state (too many for radio)
- **Multiselect** — special status, farming activity, benefit preferences (multiple can apply)

---

## Scoring Engine

### Hard exclusions (score = −1, scheme removed entirely)

Applied in order — first match wins:

0. **Institution-only** — `for_individual=0` and user is an individual
1. **State mismatch** — scheme locked to a different state
2. **Gender restriction** — female-only scheme + male user (etc.)
3. **Age bounds** — user outside `[age_min, age_max]`
4. **Caste restriction** — `caste_any=0` and user's caste not in the scheme's allowed list
5. **Occupation mismatch** — scheme targets specific occupations and user's is not among them
6. **Special status** — scheme requires a special status (widow/minority/disabled/etc.) user doesn't have AND scheme has no caste restriction (rule: if the scheme has caste restriction, the caste check already gates eligibility; special status is co-listed, not exclusive)
7. **Hyper-specific circumstance** — same rule applied to the 8 new target groups
8. **Student level — minimum** — user is below the scheme's minimum level (e.g. UG student vs PhD-only scheme)
9. **Student level — maximum** — user exceeds the scheme's maximum level (e.g. PG student vs Class 9–UG scheme, e.g. ESDM skill scheme)
10. **Field of study** — scheme is restricted to a specific academic field and user's course is in a different specialised field (broad courses like B.A./M.A. are never hard-excluded)
11. **Merit/achievement** — scheme requires a specific achievement (board topper, Olympiad) user hasn't claimed — but NOT for "merit-cum-means" scholarships which are need-based, not achievement-based
12. **Income** — user's declared income exceeds the scheme's annual income cap (income becomes a hard filter; "above ₹8L" users are hard-excluded from income-capped schemes)
13. **Marks** — user's declared marks % is below the scheme's `marks_min`

### Soft scoring (0–100)

| Component | Max pts | Signal |
|-----------|---------|--------|
| Geographic match | 15 | State-specific scheme matching user's state (+15); all-India (+10) |
| Occupation match | 25 | Scheme targets user's occupation |
| Student level bonus | 10 | Scheme's education level matches user's exact level |
| Farmer size bonus | 5 | Scheme's land size category matches |
| Caste specificity | 10 | Scheme is caste-targeted and user's caste qualifies |
| Income eligibility | 8 | User's income within scheme's cap (or no cap) |
| Gender-specific bonus | 5 | Women-targeted scheme + female user |
| Benefit preference | 10 | User's chosen benefit types overlap scheme's (2 pts/match) |
| Sector preference | 7 | User's sector interests match scheme category |
| Special status bonus | 5 | Scheme targets user's claimed special status |
| Engineering branch | 5 | Scheme mentions user's branch or stated interest |
| Achievement bonus | 5 | Scheme targets user's claimed achievement |

**Default score threshold in UI: 50** — ensures only genuinely relevant schemes are shown by default. User can lower it to see more.

---

## Benefit Extraction

`extract_monetary()` in `utils.py` runs four passes to find the best monetary benefit amount:

1. **Lakh / Crore multiplier** — `₹6.25 lakh/year` → `"₹6.25 Lakh/year"` (prevents the ₹6 decimal-fragment bug where the integer before the decimal was incorrectly extracted)
2. **Recurring amounts** — `₹2,000/- per student per month` → `"₹2,000/month"` (handles "per student per month", "per academic year", "per day" — no minimum threshold, ₹65/day is a real benefit)
3. **Bare amounts with `/−`** — `20,000/-` → `"₹20,000"`
4. **Plain ₹ amounts** — minimum ₹10 to filter decimal fragments from lakh amounts

**Priority**: recurring (per month/year/day) > lakh/crore > lump sum — because a ₹5,000/month stipend is more informative than a ₹1,00,000 loan as the headline number.

**Non-monetary fallback** (`describe_benefit()`): when no ₹ amount is found, returns descriptive text — "Free hostel accommodation", "Full fee reimbursement", "Free bicycle", etc. — rather than showing nothing. Clearly labelled as "Non-monetary benefit" in the UI.

**Course-specific benefit extraction** (`find_course_benefit()`): For scholarships with tiered benefit tables (e.g. SVMCM — different rates for UG Arts, UG Science, UG Engineering, PG, PhD), the user's selected course/level is matched against extracted `(course_label → ₹amount)` pairs. Handles both pipe-table markdown and the concatenated-string format used by many state scholarship tables.

Example — SVMCM correct per-course benefits:
- B.Tech → `₹5,000/month`
- B.Sc. Science → `₹1,500/month`
- B.A. Arts → `₹1,000/month`
- PhD (Non-NET) → `₹5,000/month`

---

## Known Edge Cases Fixed

A partial list of correctness issues discovered and fixed during development:

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| ICAR SC/ST scholarship showed for General users | `\bscheduled\s+caste\b` doesn't match plural "Castes"; `\bgeneral\b` matched "General Condition" | Made patterns handle plurals (`castes?`, `tribes?`); tightened `caste_general` to require "general category/class/candidates" |
| E-YUVA PG-only scheme showed for UG students | `r'\bb\.?e\b'` matched "cannot **be** considered" (hyphen = word boundary before "b") | Required dot: `b\.e` |
| Padho Pardesh (minority) showed for non-minority | "minority" only in tags field, not in `eligibility_md` | Parser now reads tags + ministry for minority/SC/ST/disabled signals |
| All disability schemes showed for everyone | `\bdisabilit\b` never matched "disability" (trailing `\b` fires between "t" and "y" = no boundary) | Fixed to `\bdisabilit\w*` — was matching 78 schemes, now 483 |
| SVMCM disappeared after merit filter | `\bmerit[\s-]cum[\s-]means\b` matched "Merit-cum-Means" and classified it as a topper-only scheme | Removed; merit-cum-means is a need-based category, not a topper award |
| "₹6.25 lakh" extracted as "₹6" | Regex stopped at `.` before "25" | Added lakh/crore pass that captures the full decimal amount |
| Star College showed for individual students | `target_beneficiaries = ["Individual", "Institution"]` but scheme is for colleges | Added `_INSTITUTION_APPLICANT_RE` to detect "For Colleges" / "The institution must have..." language |
| ESDM (non-engineering) showed for engineers | `\bengineering\b` matched inside "non-**engineering**" (hyphen creates word boundary) | Clear `req_field_engineering` flag if text contains `non-engineering` |
| Ex-serviceman scholarship showed for non-veterans | Occupation restriction meant the special-status filter was bypassed | New rule: hard-exclude if scheme has no caste restriction and user lacks the required special status |
| Agriculture NTS-PG showed for engineering students | `universit\b` never matches "University" (trailing `\b` between "t" and "y") | Fixed to `universit\w*`; added ministry-based agriculture field inference |
| Mass Communication internship showed for engineers | No field-of-study filter existed | Added context-sensitive field detection ("pursuing X course") with 7 field categories |
| National Talent Scholarship (Agriculture) showed for engineers | Ministry was Agriculture but `req_field_agriculture` wasn't being set | Ministry-based field inference: Agriculture ministry + student scheme → `req_field_agriculture=1` |
| Income filter bypassed for high-income users | `above_8L` mapped to `None` → income comparisons were skipped | Changed to `₹1 Crore` concrete value; income is now a hard filter |
| ₹1,000 monthly benefit extracted as income cap | Benefit amount patterns overlapped income cap patterns | Added context check: reject ₹ amounts preceded by "scholarship/stipend/rate" keywords; minimum ₹50,000 for income cap |
| Caste eligibility grid showed ❌ for ST users on ST schemes | `caste_sc`, `caste_st` etc. missing from `rank_schemes` results dict | Added all individual caste flags to the results dict |
| 635 institution schemes showed to individuals | `for_individual` always defaulted to 1 | Added `target_beneficiaries` parsing + institution-applicant text detection |

---

## Setup

### Prerequisites

- Python 3.12
- [`uv`](https://github.com/astral-sh/uv) package manager
- `cache/schemes.db` — SQLite database of scraped scheme data (**not included in this repo**; see [Data](#data) below)

### Data

The recommender reads from `cache/schemes.db`, which holds the scraped scheme corpus (`listings` + `details`). It is generated by the scraper, which pulls schemes from the myScheme public API and per-scheme detail endpoint. Generate or supply this file before running the app. The `parsed_eligibility` table is then built from it by the preprocessing step below.

### Install

```bash
uv venv .venv --python 3.12
uv sync
```

### One-time preprocessing

Parse the raw eligibility text into structured filter flags (~30 seconds):

```bash
uv run python recommender/parse_eligibility.py
```

### Run the app

```bash
uv run streamlit run recommender/app.py
```

Opens at [http://localhost:8501](http://localhost:8501).

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Language | Python 3.12 |
| UI | Streamlit (prototype) |
| Database | SQLite (WAL mode) |
| Package manager | uv |

---

## Project Structure

```
recommender/
├── __init__.py
├── parse_eligibility.py   # One-time: free text → 70+ structured flags
├── questions.py           # Decision-tree questionnaire (40+ nodes)
├── scorer.py              # 13 hard filters + 0–100 soft scoring
├── utils.py               # Benefit extraction, course matching, non-monetary fallback
└── app.py                 # Streamlit UI (questionnaire → results → detail view)

pyproject.toml             # Dependencies
uv.lock                    # Locked dependency versions
.python-version            # Python 3.12
```

---

## Roadmap

- Web / mobile app frontend over the existing recommender engine
- *(Engine internals are tracked separately)*

---

## Disclaimer

Suvidha Setu is an independent, informational tool and is **not affiliated with, endorsed by, or operated by the Government of India** or any state government. Scheme data is sourced from the public [myScheme](https://www.myscheme.gov.in) portal and may be incomplete or out of date. Eligibility results are indicative only — always verify details and apply through the official scheme portal.

---

## License

Not yet specified. For an open civic-tech tool, a permissive licence such as MIT is a reasonable default.
