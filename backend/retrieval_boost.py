"""
Parent-child retrieval for portfolio knowledge base.

Strategy:
1. Pure vector search (no rule filters needed for basic queries)
2. Parent chunks naturally match general/intent queries
3. Child chunks naturally match specific/technical queries
4. Merge: ensure parent appears if child is found (context first),
   then fill with highest-scored results
"""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class BoostRule:
    """A single rule that maps keywords to a Qdrant filter condition."""
    name: str
    keywords: list[str]
    filter_condition: dict
    boost_factor: float = 1.0


@dataclass
class RetrievalBoost:
    """Result of rule matching."""
    matched_rules: list[BoostRule] = field(default_factory=list)
    best_rule: Optional[BoostRule] = None


# ── Rule definitions ──────────────────────────────────────────────
BOOST_RULES: list[BoostRule] = [
    # ── Project: Attendance Tracking App ──
    BoostRule(
        name="project:attendance",
        keywords=[
            "attendance", "điểm danh", "chống gian lận", "check-in",
            "sinh viên", "giảng viên", "lớp học", "khóa học",
            "ML Kit", "khuôn mặt", "face detection", "gps",
            "firebase", "firestore", "FCM", "push notification",
            "offline", "Hive", "đồng bộ", "sync",
            "QR", "geofencing", "geolocator",
        ],
        filter_condition={"key": "metadata.project_id", "match": {"value": "attendance-app"}},
        boost_factor=1.2,
    ),

    # ── Project: Movie Ticket Booking ──
    BoostRule(
        name="project:movie_ticket",
        keywords=[
            "movie", "phim", "vé", "ticket", "booking", "đặt vé",
            "cinema", "rạp", "suất chiếu", "ghế", "seat",
            "double-booking", "trùng ghế", "locking", "Pessimistic",
            "Redis", "cache", "hiệu năng", "độ trễ",
            "phân trang", "pagination", "pageable",
            "Spring Boot", "JWT", "authentication", "xác thực",
            "Java", "JPA", "Hibernate",
        ],
        filter_condition={"key": "metadata.project_id", "match": {"value": "movie-ticket"}},
        boost_factor=1.2,
    ),

    # ── Category: contact ──
    BoostRule(
        name="category:contact",
        keywords=[
            "liên hệ", "contact", "email", "phone", "số điện thoại",
            "github", "linkedin", "gặp", "hợp tác", "hire", "thuê",
            "kuokdavinci",
        ],
        filter_condition={"key": "category", "match": {"value": "contact"}},
        boost_factor=1.5,
    ),

    # ── Category: education ──
    BoostRule(
        name="category:education",
        keywords=[
            "đại học", "trường", "tốt nghiệp", "graduate", "GPA",
            "HCMUS", "VinUni", "học", "education", "bằng cấp",
            "khoa", "ngành", "major",
        ],
        filter_condition={"key": "category", "match": {"value": "education"}},
        boost_factor=1.5,
    ),

    # ── Category: competencies / skills ──
    BoostRule(
        name="category:competencies",
        keywords=[
            "kỹ năng", "skill", "competency", "năng lực", "chuyên môn",
            "expertise", "proficient", "thành thạo", "giỏi",
            "AI", "machine learning", "deep learning", "data science",
            "pandas", "numpy", "LangChain", "RAG",
            "backend", "frontend", "mobile", "full-stack",
        ],
        filter_condition={"key": "category", "match": {"value": "competencies"}},
        boost_factor=1.3,
    ),

    # ── Category: project (general project listing) ──
    BoostRule(
        name="category:project",
        keywords=[
            "dự án", "project", "đã làm", "đã xây", "built",
            "portfolio", "case study", "sản phẩm", "product",
        ],
        filter_condition={"key": "category", "match": {"value": "project"}},
        boost_factor=1.5,
    ),

    # ── Category: personal_info ──
    BoostRule(
        name="category:personal_info",
        keywords=[
            "Quốc", "Quoc", "giới thiệu", "about", "bio", "tiểu sử",
            "là ai", "who is", "làm gì", "developer", "lập trình viên",
        ],
        filter_condition={"key": "category", "match": {"value": "personal_info"}},
        boost_factor=1.5,
    ),

    # ── Category: skills (tech stack listing) ──
    BoostRule(
        name="category:skills",
        keywords=[
            "tech stack", "công nghệ", "technology", "framework",
            "Spring Boot", "Flutter", "Dart", "Python", "Java",
            "dùng gì", "sử dụng gì", "gồm những gì",
        ],
        filter_condition={"key": "category", "match": {"value": "skills"}},
        boost_factor=1.5,
    ),

    # ── Category: experience ──
    BoostRule(
        name="category:experience",
        keywords=[
            "kinh nghiệm", "experience", "làm việc", "work", "intern",
            "thực tập", "công ty", "company", "job", "nghề",
            "Phu An Phuoc", "engineer",
        ],
        filter_condition={"key": "category", "match": {"value": "experience"}},
        boost_factor=1.5,
    ),
]


def detect_boost(query: str) -> RetrievalBoost:
    """Scan query against all rules and return matched filters."""
    query_lower = query.lower()
    boost = RetrievalBoost()

    for rule in BOOST_RULES:
        matched = any(kw.lower() in query_lower for kw in rule.keywords)
        if matched:
            boost.matched_rules.append(rule)

    # Pick best rule by priority (project > category with high specificity)
    priority = {
        "project:attendance": 10,
        "project:movie_ticket": 10,
        "category:contact": 7,
        "category:education": 7,
        "category:experience": 7,
        "category:skills": 6,
        "category:project": 5,
        "category:personal_info": 4,
        "category:competencies": 3,
    }
    if boost.matched_rules:
        boost.best_rule = max(boost.matched_rules, key=lambda r: priority.get(r.name, 0))

    return boost


def build_qdrant_filter(boost: RetrievalBoost) -> Optional[dict]:
    """Build a Qdrant filter from the best matched rule only."""
    if not boost.best_rule:
        return None
    return {"must": [boost.best_rule.filter_condition]}


def merge_parent_child(
    general_results: list,
    filtered_results: list,
    boost: RetrievalBoost,
    top_k: int = 3,
) -> list:
    """Merge results with parent-child awareness.

    Strategy:
    1. If filtered results exist (rule matched), use them as primary
    2. Ensure parent chunk is included if a child chunk is present
    3. Fill remaining slots from general results
    4. Deduplicate by ID
    """
    seen_ids = set()
    merged = []

    # Step 1: Add filtered results first (intent-matched)
    for hit in filtered_results:
        if hit.id not in seen_ids and len(merged) < top_k:
            seen_ids.add(hit.id)
            merged.append(hit)

    # Step 2: If we have a child chunk, try to include its parent
    parent_ids = set()
    for hit in list(merged):
        payload = hit.payload if hasattr(hit, 'payload') else {}
        metadata = payload.get("metadata", {})
        chunk_level = payload.get("chunk_level", "")
        if chunk_level == "child" and metadata.get("parent_id"):
            parent_ids.add(metadata["parent_id"])

    # Add parent chunks if not already present
    for hit in general_results:
        if hit.id in parent_ids and hit.id not in seen_ids and len(merged) < top_k:
            seen_ids.add(hit.id)
            merged.insert(0, hit)  # Parent goes first

    # Step 3: Fill remaining from general results
    for hit in general_results:
        if hit.id not in seen_ids and len(merged) < top_k:
            seen_ids.add(hit.id)
            merged.append(hit)

    return merged[:top_k]
