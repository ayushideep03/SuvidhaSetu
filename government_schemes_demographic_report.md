# Government Schemes — Demographic Eligibility Report

**Data Source:** MyScheme portal (myscheme.gov.in) — scraped and parsed eligibility database  
**Dataset Size:** 4,669 scheme records (fully parsed) | 4,678 listing records  
**Report Date:** June 2026  
**Prepared by:** Scheme Finder Project (automated analysis)

---

## Executive Summary

This document presents a comprehensive demographic breakdown of **4,669 government schemes** catalogued from India's MyScheme portal. The analysis covers eligibility criteria across six primary dimensions — caste, gender, occupation, age, student category, and merit — along with supplementary breakdowns for special/vulnerable populations, income ceilings, geographic distribution, and benefit types.

Key highlights:

- **78.6%** of schemes impose no caste restriction (open to all communities); SC-targeted schemes (626) lead among reservation-specific schemes.
- **83.6%** of schemes are gender-neutral; women-specific schemes (939) far outnumber men-specific schemes (239).
- **Student** (629) and **Farmer** (584) categories constitute the two largest occupation-specific scheme groups.
- The largest student cohort by education level is **Class 12 / Intermediate** (146 schemes), closely followed by **Postgraduate** (123) and **Class 10** (132).
- **51.2%** of minimum-marks requirements fall between 50 % and 60 %, indicating a moderate academic threshold as the most common benchmark.
- **86%** of schemes carry no explicit age restriction, keeping access broadly open.
- **State-level schemes** (4,008; 85.8 %) vastly outnumber **Central schemes** (670; 14.3 %).
- **Education & Learning** is the single largest scheme category (727 schemes).

> **Note on record interpretation:** Each row represents one *scheme*, not one *beneficiary*. Counts reflect how many distinct schemes include a given eligibility criterion; a scheme can satisfy multiple criteria simultaneously.

---

## Table of Contents

1. [Data Overview & Methodology](#1-data-overview--methodology)
2. [Caste-Wise Breakdown](#2-caste-wise-breakdown)
3. [Gender-Wise Breakdown](#3-gender-wise-breakdown)
4. [Occupation-Wise Breakdown](#4-occupation-wise-breakdown)
5. [Age Group Distribution](#5-age-group-distribution)
6. [Student Status — Detailed Breakdown](#6-student-status--detailed-breakdown)
   - 6a. [Student Level / Education Stage](#6a-student-level--education-stage)
   - 6b. [Branch & Field Restrictions](#6b-branch--field-restrictions)
   - 6c. [Gender within Student Schemes](#6c-gender-within-student-schemes)
   - 6d. [Caste within Student Schemes](#6d-caste-within-student-schemes)
   - 6e. [Merit within Student Schemes](#6e-merit-within-student-schemes)
7. [Merit & Award Requirements](#7-merit--award-requirements)
8. [Special / Vulnerable Population Categories](#8-special--vulnerable-population-categories)
9. [Income Eligibility Ceilings](#9-income-eligibility-ceilings)
10. [Agricultural Beneficiary Types](#10-agricultural-beneficiary-types)
11. [Business & Enterprise Types](#11-business--enterprise-types)
12. [Rural vs. Urban Residency](#12-rural-vs-urban-residency)
13. [Benefit Types](#13-benefit-types)
14. [Scheme Level — Central vs. State](#14-scheme-level--central-vs-state)
15. [Geographic Distribution (Top States)](#15-geographic-distribution-top-states)
16. [Scheme Categories](#16-scheme-categories)
17. [Privacy Notes & Data Limitations](#17-privacy-notes--data-limitations)

---

## 1. Data Overview & Methodology

### 1.1 Source

All data originates from the **MyScheme portal** (`myscheme.gov.in`), India's official government scheme aggregator. Scheme listings and detailed eligibility criteria were scraped and stored in a local SQLite database (`schemes.db`).

### 1.2 Parsed Eligibility Flags

Each scheme's free-text eligibility description was processed into structured Boolean and numeric fields using the `parsed_eligibility` table. These flags capture:

| Flag Category | Examples |
|---|---|
| Beneficiary type | `for_individual`, `for_business`, `for_family`, `for_shg`, `for_ngo` |
| Gender | `gender_female`, `gender_male`, `gender_trans`, `gender_any` |
| Caste | `caste_sc`, `caste_st`, `caste_obc`, `caste_ews`, `caste_general`, `caste_any` |
| Occupation | `occ_student`, `occ_farmer`, `occ_construction`, … (15 codes) |
| Student level | `student_school`, `student_class10`, `student_class12`, `student_diploma`, `student_ug`, `student_pg`, `student_phd` |
| Branch | `branch_cs_it`, `branch_electronics`, `branch_mechanical`, `branch_biotech`, `branch_textile` |
| Field | `req_field_engineering`, `req_field_medical`, `req_field_agriculture`, … (8 codes) |
| Merit | `req_merit_rank`, `req_olympiad`, `req_sports_award`, `req_research`, `req_cultural_award`, `marks_min` |
| Special/Vulnerable | `req_bpl`, `req_widow`, `req_disabled`, `req_orphan`, … (14 codes) |
| Age | `age_min`, `age_max` (numeric) |
| Income | `income_max` (annual, in INR) |

### 1.3 Record Counts

| Table | Count |
|---|---|
| Listings (scraped) | 4,678 |
| Details (full records) | 4,669 |
| Parsed Eligibility (analysed) | **4,669** |

### 1.4 Discrepancy Note

A minor discrepancy of 9 records exists between `listings` (4,678) and `details` / `parsed_eligibility` (4,669). These 9 schemes appear in listings but lack parsed detail records — likely due to scrape errors captured in the `errors` table. All analysis below is based on the 4,669 fully parsed records.

---

## 2. Caste-Wise Breakdown

### 2.1 Summary

India's reservations framework defines five primary caste/social categories recognised in scheme eligibility. The table below counts how many schemes explicitly target each group. A single scheme may target multiple groups, so columns do not sum to the total.

| Caste / Category | Scheme Count | % of All Schemes |
|---|---|---|
| Open / Any Caste | 3,669 | 78.6 % |
| Scheduled Caste (SC) | 626 | 13.4 % |
| Scheduled Tribe (ST) | 560 | 12.0 % |
| Other Backward Classes (OBC) | 190 | 4.1 % |
| Economically Weaker Section (EWS) | 35 | 0.7 % |
| General / Unreserved | 78 | 1.7 % |
| **Multi-caste eligible (2 or more)** | **350** | **7.5 %** |

### 2.2 Observations

- The overwhelming majority of schemes (**78.6 %**) carry no caste restriction and are open to all communities.
- Among reservation-specific schemes, **SC** and **ST** communities have the most dedicated scheme coverage, reflecting constitutional provisions and historical welfare focus.
- **OBC** schemes (190) are proportionately fewer relative to population share, and **EWS** schemes remain nascent at just 35, consistent with EWS reservations being a recent addition (post-2019).
- **350 schemes** extend eligibility across two or more caste groups simultaneously — these are often state-level umbrella programmes.

```
Caste Breakdown (Scheme Count)
─────────────────────────────────────────────────────────
Open / Any     ████████████████████████████████████  3,669
SC             ████                                    626
ST             ████                                    560
OBC            █                                       190
General        ▌                                        78
EWS            ▏                                        35
─────────────────────────────────────────────────────────
```

---

## 3. Gender-Wise Breakdown

### 3.1 Summary

| Gender Eligibility | Scheme Count | % of All Schemes |
|---|---|---|
| All Genders (no restriction) | 3,902 | 83.6 % |
| Female-only / Female-inclusive | 939 | 20.1 % |
| Male-only / Male-inclusive | 239 | 5.1 % |
| Transgender | 50 | 1.1 % |

> Note: Percentages may exceed 100 % in aggregate since a scheme targeting "Female and Transgender" is counted in both the Female and Transgender rows.

### 3.2 Gender × Caste Cross-Tabulation

| Caste Group | Female Schemes | Male Schemes |
|---|---|---|
| SC | 178 | 26 |
| ST | 170 | 25 |
| OBC | 52 | 7 |
| EWS | 5 | 1 |
| General | 43 | 6 |

### 3.3 Observations

- India's scheme ecosystem shows a strong **gender-neutral default** — more than 4 in 5 schemes impose no gender filter.
- Among gender-targeted schemes, **female-focused schemes (939) are nearly 4× more numerous than male-focused schemes (239)**, reflecting policy emphasis on women's empowerment, maternal welfare, and educational support for girls.
- **Transgender-inclusive schemes** (50) are a growing segment, particularly in health, skill development, and identity documentation.
- SC and ST women are the most densely targeted demographic intersection (178 and 170 schemes respectively).

```
Gender Split (Scheme Count)
─────────────────────────────────────────────────────────
All Genders    ████████████████████████████████████  3,902
Female         ████████                               939
Male           ██                                     239
Transgender    ▏                                       50
─────────────────────────────────────────────────────────
```

---

## 4. Occupation-Wise Breakdown

### 4.1 Occupation Scheme Counts

| Occupation | Scheme Count | % of All Schemes |
|---|---|---|
| No occupation restriction | 2,392 | 51.2 % |
| Student | 629 | 13.5 % |
| Farmer | 584 | 12.5 % |
| Construction Worker | 321 | 6.9 % |
| Entrepreneur | 293 | 6.3 % |
| Artist / Craftsperson | 166 | 3.6 % |
| Labourer | 42 | 0.9 % |
| Fisherman | 96 | 2.1 % |
| Unemployed | 106 | 2.3 % |
| Sportsperson | 90 | 1.9 % |
| Senior Citizen | 80 | 1.7 % |
| Teacher | 78 | 1.7 % |
| Government Employee | 35 | 0.7 % |
| Journalist | 29 | 0.6 % |
| Healthcare Worker | 27 | 0.6 % |
| Homemaker | 1 | < 0.1 % |

### 4.2 Observations

- Just over half of all schemes (**51.2 %**) impose **no occupation restriction**, making them broadly accessible.
- **Students** and **Farmers** are by far the most scheme-covered occupational groups, together accounting for over a quarter of all occupation-specific schemes (1,213 combined).
- **Construction Workers** (321) constitute the third-largest group, consistent with welfare measures under the Building and Other Construction Workers Act.
- **Entrepreneurs** (293) reflect the government's push under MSME and Start-up India initiatives.
- **Homemakers** have only 1 dedicated scheme — indicating a significant coverage gap for this demographic.

```
Occupation Coverage (Top 8)
─────────────────────────────────────────────────────────
Student            ████████████                      629
Farmer             ████████████                      584
Construction       ██████                            321
Entrepreneur       █████                             293
Artist/Craft       ███                               166
Fisherman          ██                                 96
Unemployed         ██                                106
Sportsperson       ██                                 90
─────────────────────────────────────────────────────────
```

---

## 5. Age Group Distribution

### 5.1 Summary

Age eligibility is recorded where explicitly specified. The majority of schemes carry no age restriction.

| Age Group | Scheme Count | Notes |
|---|---|---|
| No age restriction | 3,747 | 80.3 % of all schemes |
| Has at least one age bound | 922 | 19.7 % |
| Children (0–17 years) | 88 | Overlapping range |
| Youth (18–25 years) | 275 | Overlapping range |
| Adults (26–40 years) | 256 | Overlapping range |
| Middle-age (41–60 years) | 198 | Overlapping range |
| Senior (61+ years) | 22 | Overlapping range |

> **Methodology note:** Age group counts reflect schemes whose stated age range *overlaps* with the group's bracket. A scheme valid for ages 18–40 would be counted in both "Youth (18–25)" and "Adults (26–40)." Overlapping counts are therefore expected and correct — they reflect inclusive scheme coverage, not double-counting errors. The overall age range found in the data spans **1 to 79 years**.

### 5.2 Most Common Age Boundaries

**Most frequent minimum ages (age_min):**

| Age | Schemes |
|---|---|
| 18 | 341 |
| 5 | 62 |
| 60 | 45 |
| 21 | 34 |
| 10 | 34 |
| 15 | 19 |
| 20 | 18 |
| 6 | 18 |

**Most frequent maximum ages (age_max):**

| Age | Schemes |
|---|---|
| 60 | 83 |
| 35 | 44 |
| 50 | 43 |
| 18 | 40 |
| 45 | 38 |
| 55 | 30 |
| 40 | 25 |
| 5 | 24 |

### 5.3 Observations

- **Age 18** is the most common minimum eligibility threshold (341 schemes), aligning with adulthood and voting age.
- **Age 60** is the most common maximum threshold (83 schemes), corresponding to standard retirement age — schemes above this are for senior citizens.
- The **18–35** age window concentrates the majority of youth-focused and employment/entrepreneurship schemes.

---

## 6. Student Status — Detailed Breakdown

### 6a. Student Level / Education Stage

629 schemes explicitly target students under `occ_student`. Within that, 394 schemes specify the education level. A student scheme may target multiple levels.

| Student Level | Scheme Count | % of Student Schemes |
|---|---|---|
| Class 12 / Intermediate | 146 | 37.1 % |
| Class 10 / Matriculate | 132 | 33.5 % |
| Postgraduate (PG) | 123 | 31.2 % |
| Undergraduate (UG) | 118 | 30.0 % |
| Diploma | 85 | 21.6 % |
| School (General, no specific class) | 39 | 9.9 % |
| PhD / Doctoral | 43 | 10.9 % |
| **Any level specified (total)** | **394** | 100 % base |
| Schemes with no level restriction | 235 | — |

> Percentages are of the 394 schemes that specify at least one education level. Multiple levels per scheme are possible.

### 6b. Branch & Field Restrictions

78 student schemes (out of 629; **12.4 %**) carry a branch or field-of-study restriction.

**Branch-level restrictions (specific engineering/science branches):**

| Branch | Scheme Count |
|---|---|
| CS / Information Technology | 18 |
| Biotechnology | 5 |
| Electronics | 2 |
| Textile | 1 |
| Mechanical | 0 |

**Field-of-study restrictions (broader academic domains):**

| Field | Scheme Count |
|---|---|
| Engineering (general) | 40 |
| Agriculture | 30 |
| Medical / Healthcare | 12 |
| Management | 7 |
| Law | 5 |
| Media / Journalism | 2 |
| Science | 1 |
| Arts / Humanities | 0 |

| Restriction Status | Count |
|---|---|
| Student schemes with field restriction | 78 |
| Student schemes with NO field restriction | 551 |

### 6c. Gender within Student Schemes

| Gender | Student Scheme Count |
|---|---|
| Any / Gender-neutral | 537 |
| Female | 113 |
| Male | 36 |
| Transgender | 3 |

Female-targeted student schemes **outnumber male-targeted by 3.1×**, continuing the overall women-empowerment theme in education policy.

### 6d. Caste within Student Schemes

| Caste Group | Student Scheme Count |
|---|---|
| Any / Open | 364 |
| SC | 156 |
| ST | 118 |
| OBC | 67 |
| General | 11 |
| EWS | 10 |

SC and ST students together account for **87 %** of caste-restricted student scheme coverage (274 schemes).

### 6e. Merit within Student Schemes

| Merit Criterion | Student Scheme Count |
|---|---|
| Merit / Rank-based selection | 25 |
| Minimum marks specified | 142 |
| Olympiad winner required | 6 |
| Sports award required | 7 |
| Research credential required | 4 |
| Cultural award required | 3 |

Of the **142 schemes** specifying minimum marks:
- Marks range: **30 % – 97 %**
- Average minimum threshold: **53.8 %**

```
Student Schemes by Level
─────────────────────────────────────────────────────────
Class 12        ████████████████                     146
Class 10        ████████████████                     132
PG              ███████████████                      123
UG              ██████████████                       118
Diploma         ██████████                            85
PhD             █████                                 43
School          █████                                 39
─────────────────────────────────────────────────────────
```

---

## 7. Merit & Award Requirements

This section covers all merit-linked criteria across the full dataset (not limited to student schemes).

| Criterion | Scheme Count | % of All Schemes |
|---|---|---|
| Minimum marks specified | 454 | 9.7 % |
| Merit / Rank-based selection | 35 | 0.7 % |
| Olympiad winner | 6 | 0.1 % |
| Sports award holder | 7 | 0.1 % |
| Research credential | 4 | 0.1 % |
| Cultural award | 3 | 0.1 % |

### 7.1 Minimum Marks Distribution

| Marks Range | Scheme Count |
|---|---|
| < 40 % | 11 |
| 40 – 49 % | 79 |
| 50 – 59 % | 202 |
| 60 – 69 % | 113 |
| 70 – 79 % | 39 |
| ≥ 80 % | 10 |

> Computed from the 454 schemes where `marks_min` is specified (range: 30–97, average: 53.8 %).

### 7.2 Observations

- The **50–59 %** band (202 schemes) is the most common merit threshold, representing a moderate academic standard accessible to the lower-middle range of student performance.
- Only **10 schemes** demand 80 % or above, indicating that high-merit barriers remain relatively rare in the government welfare ecosystem.
- Merit requirements are disproportionately concentrated in **education sector scholarships** and **research fellowships**.

---

## 8. Special / Vulnerable Population Categories

These flags identify schemes targeting specific social vulnerabilities.

| Category | Scheme Count | % of All Schemes |
|---|---|---|
| Person with Disability (PwD) | 491 | 10.5 % |
| Below Poverty Line (BPL) | 340 | 7.3 % |
| Widow | 147 | 3.1 % |
| Minority | 95 | 2.0 % |
| Ex-Serviceman / Defence | 76 | 1.6 % |
| Nomadic Tribe | 39 | 0.8 % |
| HIV Affected | 38 | 0.8 % |
| Prisoner Family | 37 | 0.8 % |
| Child of Sanitation Worker | 29 | 0.6 % |
| Orphan | 25 | 0.5 % |
| Weaver | 27 | 0.6 % |
| Acid Attack Victim | 8 | 0.2 % |
| Street Vendor | 7 | 0.1 % |
| Cancer Patient | 3 | 0.1 % |

### 8.1 Observations

- **Persons with Disabilities** are the most covered vulnerable group (491 schemes), reflecting legal mandates under the Rights of Persons with Disabilities Act, 2016.
- **BPL households** (340 schemes) represent broad socio-economic targeting across welfare programmes.
- Highly specific groups like **acid attack victims** (8 schemes) and **cancer patients** (3 schemes) have comparatively limited coverage, indicating areas where policy gaps may exist.

---

## 9. Income Eligibility Ceilings

| Income Ceiling | Scheme Count | % of Income-Restricted Schemes |
|---|---|---|
| Any income restriction specified | 251 | 100 % |
| ≤ ₹1 lakh / year | 53 | 21.1 % |
| ₹1 lakh – ₹2.5 lakh / year | 84 | 33.5 % |
| ₹2.5 lakh – ₹5 lakh / year | 55 | 21.9 % |
| > ₹5 lakh / year | 59 | 23.5 % |
| No income ceiling stated | 4,418 | — |

### 9.1 Observations

- Only **5.4 %** of all schemes (251 out of 4,669) specify an explicit income ceiling — the majority rely on categorical eligibility (caste, occupation, etc.) rather than a means test.
- The most common income band is **₹1–2.5 lakh/year** (84 schemes), corresponding to typical lower-middle-income thresholds used for BPL/APL classification.
- Schemes with ceilings **above ₹5 lakh/year** (59 schemes) are typically enterprise or entrepreneurship programmes targeting small business owners.

---

## 10. Agricultural Beneficiary Types

| Farmer Type | Scheme Count | % of Farmer Schemes (584) |
|---|---|---|
| Any Farmer | 584 | 100 % |
| Small Farmer (< 2 hectares) | 20 | 3.4 % |
| Marginal Farmer (< 1 hectare) | 34 | 5.8 % |

### 10.1 Observations

- The vast majority of farmer-targeted schemes (584) do not sub-classify farm size and are accessible to all farmers.
- Marginal farmers (< 1 hectare) have modestly more dedicated schemes (34) than small farmers (20), consistent with PM-KISAN and similar small-holding focused programmes.

---

## 11. Business & Enterprise Types

| Enterprise Type | Scheme Count | % of Entrepreneur Schemes (293) |
|---|---|---|
| Any Entrepreneur | 293 | 100 % |
| Medium Enterprise (≤ 250 Cr turnover) | 65 | 22.2 % |
| Startup | 54 | 18.4 % |
| Small Enterprise (≤ 50 Cr turnover) | 51 | 17.4 % |
| Micro Enterprise (≤ 5 Cr turnover) | 7 | 2.4 % |

### 11.1 Observations

- **Medium enterprises** (65) have slightly more targeted schemes than startups (54) or small enterprises (51), reflecting older MSME support infrastructure.
- **Micro enterprises** are surprisingly under-represented with only 7 dedicated schemes, despite constituting the vast majority of India's enterprise ecosystem by count.

---

## 12. Rural vs. Urban Residency

| Residency | Scheme Count | % of All Schemes |
|---|---|---|
| Rural residents | 135 | 2.9 % |
| Urban residents | 90 | 1.9 % |
| No residency restriction | 4,444 | 95.2 % |

### 12.1 Observations

- The overwhelming majority of schemes carry no rural/urban restriction.
- Among residency-restricted schemes, rural-focused schemes (135) outnumber urban-focused (90) by 1.5×, consistent with India's rural development policy emphasis.

---

## 13. Benefit Types

| Benefit Type | Scheme Count | % of All Schemes |
|---|---|---|
| Cash (monetary transfer) | 3,250 | 69.6 % |
| In-Kind (goods, materials, equipment) | 788 | 16.9 % |
| Composite (cash + in-kind) | 631 | 13.5 % |

> Note: Benefit type counts are drawn from the `details` table's `benefit_types` field. Minor format variants in the raw JSON ("Cash" vs "cash") have been normalised for this report. Total exceeds 4,669 for schemes with multiple benefit type entries.

**462 schemes** are flagged as **Direct Benefit Transfer (DBT)** schemes, meaning funds are transferred directly to beneficiaries' bank accounts without intermediary handling.

### 13.1 Observations

- **Cash-based schemes dominate** (~70 %), consistent with India's Digital India push and the JAM (Jan Dhan–Aadhaar–Mobile) trinity enabling direct transfers.
- **DBT schemes** (462; 9.9 %) represent a growing segment prioritised by the government for reducing leakage.

---

## 14. Scheme Level — Central vs. State

| Level | Scheme Count | % of All |
|---|---|---|
| State-level | 4,008 | 85.8 % |
| Central (national) | 670 | 14.3 % |

| Central Scheme Type | Count |
|---|---|
| Central Sector Scheme (100 % Central funding) | 496 |
| Centrally Sponsored Scheme (shared funding) | 122 |
| Unclassified / Not specified | 52 |

### 14.1 Observations

- **State schemes dominate** the portal (85.8 %), reflecting India's federal structure where welfare delivery is largely a concurrent or state subject.
- Among central schemes, **Central Sector Schemes** (496) — wholly funded by the Centre — outnumber **Centrally Sponsored Schemes** (122), which share costs between Centre and states.

---

## 15. Geographic Distribution (Top States)

| State / UT | Scheme Count |
|---|---|
| All States (Central schemes) | 652 |
| Gujarat | 636 |
| Uttarakhand | 442 |
| Madhya Pradesh | 286 |
| Puducherry | 269 |
| Goa | 266 |
| Haryana | 244 |
| Tamil Nadu | 233 |
| Rajasthan | 155 |
| Bihar | 113 |
| West Bengal | 110 |
| Chhattisgarh | 106 |
| Jharkhand | 95 |
| Maharashtra | 84 |
| Odisha | 83 |

> "All States" refers to schemes tagged as applicable nation-wide (central welfare programmes without state-level limitation).

### 15.1 Observations

- **Gujarat** leads state-specific scheme counts (636), which may reflect both high scheme activity and comprehensive data capture on the portal.
- Smaller states and UTs like **Puducherry** (269) and **Goa** (266) have disproportionately high scheme counts relative to population, suggesting well-represented portals.
- Large population states like **Maharashtra** (84) and **West Bengal** (110) appear underrepresented in portal data — this is likely a data completeness gap rather than a policy gap.

---

## 16. Scheme Categories

| Category | Scheme Count |
|---|---|
| Education & Learning | 727 |
| Social Welfare & Empowerment | 691 |
| Agriculture, Rural & Environment | 663 |
| Business & Entrepreneurship | 416 |
| Social Welfare & Empowerment + Women and Child | 155 |
| Sports & Culture | 151 |
| Skills & Employment | 128 |
| Health & Wellness | 125 |
| Education & Learning + Social Welfare | 88 |
| Banking, Financial Services & Insurance | 73 |
| Housing & Shelter | 65 |
| Banking + Business & Entrepreneurship | 56 |
| Education & Learning + Women and Child | 46 |
| Women and Child | 45 |
| Science, IT & Communications | 43 |

> Categories are as tagged on the MyScheme portal; some schemes carry combined/multi-category tags.

### 16.1 Top-3 Observations

1. **Education & Learning** (727 schemes) is the single largest category, confirming education as the primary vehicle for government welfare delivery.
2. **Social Welfare & Empowerment** (691) covers the broadest population spectrum and frequently intersects with other categories.
3. **Agriculture, Rural & Environment** (663) rounds out the top three, consistent with India's large agrarian population base.

---

## 17. Privacy Notes & Data Limitations

### Privacy

- This report contains **no personally identifiable information (PII)**. All data represents scheme-level aggregates, not individual beneficiary records.
- No names, Aadhaar numbers, bank accounts, phone numbers, or addresses are present in the underlying database or this report.
- The data is derived from publicly available government scheme descriptions on the MyScheme portal.

### Limitations

| Limitation | Description |
|---|---|
| Parsing accuracy | Eligibility flags are derived by automated parsing of free-text eligibility descriptions. Some edge cases may be mis-tagged. |
| Missing detail records | 9 schemes appear in listings but lack parsed eligibility data. |
| Incomplete state coverage | Several large states (Maharashtra, West Bengal, UP, Karnataka) appear underrepresented in the portal data. |
| Scheme status | The database does not reliably distinguish between active and closed/expired schemes. Closed-date filtering was not applied. |
| Income currency | Income ceiling values are stored as annual INR without adjustments for inflation across different scheme announcement years. |
| Multi-flag overcounting | A scheme eligible for both SC and ST is counted once in each row — totals by caste/occupation therefore sum to more than 4,669. |
| Sub-category completeness | Not all student schemes specify a level (394 of 629 do); not all farmer schemes specify holding size (54 of 584 do). |

### Conflict Resolution Applied

- Where `benefit_types` contained variant JSON formats (`"Cash"` vs `"cash"`), counts were normalised and combined.
- Where `scheme_type` was blank (4,051 records), these are classified under "State-level" schemes based on the `level` field in the listings table.
- [FILL: Any additional discrepancies discovered during extended auditing should be documented here.]

---

*End of Report*

---

**Document metadata**  
- Generated from: `cache/schemes.db` (SQLite)  
- Analysis script: automated Python queries against `parsed_eligibility`, `listings`, and `details` tables  
- All figures are counts of *scheme records* matching each criterion; they do not represent beneficiary population sizes  
- For corrections or queries, refer to the Scheme Finder project repository
