"""
Scheme Recommender — Streamlit app.

Run:
    uv run streamlit run recommender/app.py
"""
from __future__ import annotations

import sqlite3
from functools import lru_cache
from pathlib import Path

import streamlit as st

from recommender.questions import NODES, get_next_node
from recommender.scorer import load_all_data, rank_schemes
from recommender.utils import (
    describe_benefit,
    eligibility_grid,
    extract_monetary,
    find_course_benefit,
    parse_tags,
    render_application_process,
    status_badge,
    truncate,
)

DB_PATH = Path("cache/schemes.db")

st.set_page_config(
    page_title="Scheme Finder",
    page_icon="🏛️",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ── CSS ───────────────────────────────────────────────────────────────────────
st.markdown("""
<style>
.scheme-card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px; }
.score-badge { font-size: 1.1rem; font-weight: 700; }
.money-highlight { font-size: 1.2rem; color: #1a7a4a; font-weight: 700; }
.grid-match { color: #1a7a4a; font-weight: 600; }
.grid-miss  { color: #c0392b; font-weight: 600; }
.tag-chip { background: #f0f2f6; border-radius: 12px; padding: 2px 10px;
            font-size: 0.78rem; margin-right: 4px; display: inline-block; }
.gap-item { color: #b7590a; }
</style>
""", unsafe_allow_html=True)


# ── Data loading (cached) ─────────────────────────────────────────────────────

@st.cache_resource(show_spinner="Loading scheme database…")
def get_all_data():
    conn = sqlite3.connect(DB_PATH)
    try:
        count = conn.execute("SELECT COUNT(*) FROM parsed_eligibility").fetchone()[0]
        if count == 0:
            return None, "Run `uv run python recommender/parse_eligibility.py` first."
    except Exception:
        return None, "Run `uv run python recommender/parse_eligibility.py` first."
    data = load_all_data(conn)
    conn.close()
    return data, None


# ── Session state helpers ─────────────────────────────────────────────────────

def init_state():
    defaults = {
        "screen":      "welcome",
        "node_stack":  [],         # list of visited node ids (for Back button)
        "current_node": "root",
        "profile":     {},
        "results":     None,
        "detail_slug": None,
    }
    for k, v in defaults.items():
        if k not in st.session_state:
            st.session_state[k] = v


def go_to(node_id: str | None):
    if node_id is None:
        # Terminal — run scoring
        st.session_state["screen"] = "results"
        st.session_state["results"] = None  # will be computed on results screen
    else:
        st.session_state["node_stack"].append(st.session_state["current_node"])
        st.session_state["current_node"] = node_id
        st.session_state["screen"] = "questionnaire"


def go_back():
    if st.session_state["node_stack"]:
        prev = st.session_state["node_stack"].pop()
        st.session_state["current_node"] = prev
        st.session_state["screen"] = "questionnaire"
    else:
        st.session_state["screen"] = "welcome"


def reset():
    for k in ["screen", "node_stack", "current_node", "profile", "results", "detail_slug"]:
        if k in st.session_state:
            del st.session_state[k]
    init_state()


# ── Widget renderer ───────────────────────────────────────────────────────────

def render_widget(node: dict) -> tuple[bool, object]:
    """
    Render the appropriate Streamlit widget for this node.
    Returns (submitted, answer_value).
    """
    widget = node["widget"]
    options = node.get("options", [])
    labels = [o[0] for o in options]
    values = [o[1] for o in options]
    hint = node.get("hint", "")

    if hint:
        st.caption(hint)

    answer = None

    if widget == "radio":
        default_idx = 0
        prev = st.session_state["profile"].get(node["profile_key"])
        if prev in values:
            default_idx = values.index(prev)
        chosen_label = st.radio(
            label=" ",
            options=labels,
            index=default_idx,
            label_visibility="collapsed",
        )
        answer = values[labels.index(chosen_label)]

    elif widget == "selectbox":
        prev = st.session_state["profile"].get(node["profile_key"])
        default_idx = 0
        if prev in values:
            default_idx = values.index(prev)
        chosen_label = st.selectbox(
            label=" ",
            options=labels,
            index=default_idx,
            label_visibility="collapsed",
        )
        answer = values[labels.index(chosen_label)]

    elif widget == "multiselect":
        prev = st.session_state["profile"].get(node["profile_key"], [])
        # Convert stored values back to labels for default
        default_labels = [labels[values.index(v)] for v in prev if v in values]
        chosen_labels = st.multiselect(
            label=" ",
            options=labels,
            default=default_labels,
            label_visibility="collapsed",
        )
        answer = [values[labels.index(l)] for l in chosen_labels]

    elif widget == "slider":
        lo, hi, default, step = node["slider_range"]
        prev = st.session_state["profile"].get(node["profile_key"], default)
        answer = st.slider(
            label=" ",
            min_value=lo,
            max_value=hi,
            value=int(prev) if prev else default,
            step=step,
            label_visibility="collapsed",
        )

    elif widget == "number":
        prev = st.session_state["profile"].get(node["profile_key"], 25)
        answer = st.number_input(
            label=" ",
            min_value=0,
            max_value=120,
            value=int(prev) if prev else 25,
            label_visibility="collapsed",
        )

    col1, col2, col3 = st.columns([1, 3, 1])
    with col1:
        if st.session_state["node_stack"]:
            if st.button("← Back", use_container_width=True):
                st.session_state["profile"][node["profile_key"]] = answer
                go_back()
                st.rerun()
    with col3:
        submitted = st.button("Next →", type="primary", use_container_width=True)

    return submitted, answer


# ── Screens ───────────────────────────────────────────────────────────────────

def screen_welcome():
    st.title("🏛️ Government Scheme Finder")
    st.markdown("""
Find government schemes **actually relevant to you** — not a generic list of thousands.

Answer a short series of questions and get a **personalised, ranked shortlist** with:
- ✅ Eligibility check against your exact profile
- 💰 Monetary benefit highlighted upfront
- 📝 Step-by-step How to Apply
- ⚠️ What you still need to qualify (for near-misses)

> Your answers stay on your device and are never stored or sent anywhere.
""")

    _, col, _ = st.columns([1, 2, 1])
    with col:
        if st.button("Find My Schemes →", type="primary", use_container_width=True):
            st.session_state["screen"] = "questionnaire"
            st.session_state["current_node"] = "root"
            st.rerun()


def screen_questionnaire():
    node_id = st.session_state["current_node"]
    node = NODES[node_id]

    # Progress indicator
    total_depth = 7
    depth = len(st.session_state["node_stack"]) + 1
    st.progress(min(depth / total_depth, 1.0))
    st.caption(f"Step {depth}")

    st.subheader(node["question"])

    submitted, answer = render_widget(node)

    if submitted:
        st.session_state["profile"][node["profile_key"]] = answer
        next_node = get_next_node(node_id, answer)
        if node.get("terminal") or next_node is None:
            st.session_state["screen"] = "results"
            st.session_state["results"] = None
        else:
            go_to(next_node)
        st.rerun()


def screen_results():
    all_data, err = get_all_data()
    if err:
        st.error(err)
        return

    if st.session_state["results"] is None:
        with st.spinner("Finding your best matching schemes…"):
            ranked = rank_schemes(st.session_state["profile"], all_data)
        st.session_state["results"] = ranked

    ranked = st.session_state["results"]
    user = st.session_state["profile"]

    # Header
    col_title, col_reset = st.columns([5, 1])
    with col_title:
        st.title(f"Your Top Matches")
        st.caption(f"{len(ranked)} schemes match your profile out of {len(all_data)} total")
    with col_reset:
        st.markdown("<br>", unsafe_allow_html=True)
        if st.button("🔄 Start over", use_container_width=True):
            reset()
            st.rerun()

    if not ranked:
        st.warning("No schemes matched your profile exactly. Try adjusting your answers.")
        return

    # Filters
    with st.expander("🔍 Filter results", expanded=False):
        fcol1, fcol2, fcol3 = st.columns(3)
        with fcol1:
            search_text = st.text_input("Search by name or keyword", placeholder="e.g. scholarship, farming")
        with fcol2:
            all_cats = sorted(set(r["category"] for r in ranked if r["category"]))
            cat_filter = st.multiselect("Category", all_cats)
        with fcol3:
            score_min = st.slider("Minimum relevance score", 0, 100, 50, 5)

    # Apply filters
    filtered = ranked
    if search_text:
        q = search_text.lower()
        filtered = [r for r in filtered if
                    q in (r["scheme_name"] or "").lower() or
                    q in (r["brief_description"] or "").lower() or
                    q in " ".join(parse_tags(r["tags"])).lower()]
    if cat_filter:
        filtered = [r for r in filtered if r["category"] in cat_filter]
    if score_min > 0:
        filtered = [r for r in filtered if r["score"] >= score_min]

    st.markdown(f"**Showing {len(filtered)} schemes**")
    st.divider()

    # Results list
    for i, scheme in enumerate(filtered[:100], 1):
        render_scheme_row(i, scheme, user)


def _benefit_summary(scheme: dict, user: dict) -> tuple[str, bool]:
    """
    Return (display_text, is_monetary).
    Tries course-specific first, then general monetary, then non-monetary description.
    """
    # Course-specific (e.g. SVMCM tiers)
    course_benefit = find_course_benefit(scheme.get("benefits_md"), user)
    if course_benefit:
        return course_benefit, True
    # General monetary amount
    money = extract_monetary(scheme.get("benefits_md"))
    if money:
        return money, True
    # Non-monetary fallback
    desc = describe_benefit(scheme.get("benefits_md"))
    if desc:
        return desc, False
    return "Benefit details inside ↓", False


def render_scheme_row(rank: int, scheme: dict, user: dict):
    score = scheme["score"]
    emoji, label = status_badge(score)
    benefit_text, is_monetary = _benefit_summary(scheme, user)
    tags = parse_tags(scheme.get("tags"))[:4]

    # Card header
    title_col, score_col = st.columns([6, 1])
    with title_col:
        st.markdown(f"**#{rank} &nbsp; {scheme['scheme_name']}**")
        meta_parts = []
        if scheme.get("ministry"):
            meta_parts.append(scheme["ministry"][:50])
        if scheme.get("state") and scheme["state"] not in ("", "All", "All India"):
            meta_parts.append(scheme["state"])
        if meta_parts:
            st.caption(" · ".join(meta_parts))
    with score_col:
        st.markdown(f"<div class='score-badge'>{emoji} {score}/100<br><small>{label}</small></div>",
                    unsafe_allow_html=True)

    # Benefit highlight
    if is_monetary:
        st.markdown(f"<span class='money-highlight'>💰 {benefit_text}</span>",
                    unsafe_allow_html=True)
    else:
        st.caption(f"🎁 {benefit_text}")

    # Tags row
    if tags:
        tag_html = " ".join(f"<span class='tag-chip'>{t}</span>" for t in tags)
        st.markdown(tag_html, unsafe_allow_html=True)

    # Brief preview
    brief = truncate(scheme.get("brief_description"), 180)
    if brief:
        st.caption(brief)

    # Expander with full detail
    with st.expander(f"📋 View details — {scheme['scheme_name'][:60]}"):
        render_scheme_detail(scheme, user)

    st.divider()


def render_scheme_detail(scheme: dict, user: dict):
    # ── Eligibility grid ─────────────────────────────────────────────────────
    st.markdown("**Eligibility Check — Your Profile vs Scheme Requirements**")
    grid = eligibility_grid(scheme, user)
    cols = st.columns(len(grid))
    for col, cell in zip(cols, grid):
        with col:
            match_class = "grid-match" if cell["match"] else "grid-miss"
            tick = "✅" if cell["match"] else "❌"
            st.markdown(
                f"<div style='text-align:center'>"
                f"<div style='font-size:0.75rem;color:#666'>{cell['label']}</div>"
                f"<div style='font-size:0.85rem'>{cell['requirement']}</div>"
                f"<div class='{match_class}'>{tick}</div>"
                f"</div>",
                unsafe_allow_html=True,
            )

    st.markdown("---")

    # ── Primary benefit highlight ─────────────────────────────────────────────
    benefits_md = scheme.get("benefits_md", "")
    course_benefit = find_course_benefit(benefits_md, user)
    money = extract_monetary(benefits_md)
    nonmon = describe_benefit(benefits_md)

    if course_benefit:
        st.markdown(
            f"<div class='money-highlight'>💰 Your benefit ({user.get('student_level','').upper() or 'your course'}): {course_benefit}</div>",
            unsafe_allow_html=True,
        )
        if money and money not in course_benefit:
            st.caption(f"Other tiers: see Benefits section below")
    elif money:
        st.markdown(f"<div class='money-highlight'>💰 {money}</div>", unsafe_allow_html=True)
    elif nonmon:
        st.info(f"🎁 Non-monetary benefit: **{nonmon}**")
    st.markdown(" ")
    if benefits_md:
        st.markdown("**🎁 Benefits**")
        st.markdown(benefits_md)

    # ── What you still need ───────────────────────────────────────────────────
    gaps = scheme.get("gaps", [])
    matched = scheme.get("matched", [])
    if gaps:
        st.markdown("**⚠️ What to Verify**")
        for gap in gaps:
            st.markdown(f"<div class='gap-item'>• {gap}</div>", unsafe_allow_html=True)
    if matched:
        with st.expander("✅ Why this matched your profile"):
            for m in matched:
                st.markdown(f"• {m}")

    # ── Full eligibility ─────────────────────────────────────────────────────
    elig = scheme.get("eligibility_md", "")
    if elig:
        with st.expander("📋 Full Eligibility Criteria"):
            st.markdown(elig)

    # ── Exclusions ───────────────────────────────────────────────────────────
    excl = scheme.get("exclusions_md", "")
    if excl:
        with st.expander("🚫 Exclusions"):
            st.markdown(excl)

    # ── How to Apply ─────────────────────────────────────────────────────────
    ap_md = render_application_process(scheme.get("application_process_json"))
    if ap_md:
        st.markdown("**📝 How to Apply**")
        st.markdown(ap_md)

    # ── Documents ────────────────────────────────────────────────────────────
    docs = scheme.get("documents_required_md", "")
    if docs:
        with st.expander("📄 Documents Required"):
            st.markdown(docs)

    # ── Official link ─────────────────────────────────────────────────────────
    url = scheme.get("official_url", "")
    if url:
        st.markdown(f"🔗 [Open Official Link]({url})", unsafe_allow_html=False)

    # ── Agency info ───────────────────────────────────────────────────────────
    agency = scheme.get("implementing_agency", "")
    if agency:
        st.caption(f"Implementing agency: {agency}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    init_state()

    screen = st.session_state["screen"]

    if screen == "welcome":
        screen_welcome()
    elif screen == "questionnaire":
        screen_questionnaire()
    elif screen == "results":
        screen_results()


if __name__ == "__main__":
    main()
