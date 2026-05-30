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


@dataclass
class RouteDecision:
    """Normalized routing result for portfolio chatbot queries."""
    category: str = "general"
    project_id: Optional[str] = None
    intent: str = "general"
    confidence: float = 0.0
    matched_rules: list[str] = field(default_factory=list)


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

    # ── Project: EduRAG (Legal Education) ──
    BoostRule(
        name="project:edurag",
        keywords=[
            "luật", "pháp luật", "văn bản", "pháp lý", "legal",
            "giáo dục", "education", "thông tư", "nghị định", "quyết định",
            "tra cứu", "điều khoản", "chương", "mục", "khoản",
            "RAG", "GraphRAG", "Neo4j", "Qdrant", "reranker",
            "routing", "intent", "semantic", "LLM", "GPT",
            "citation", "trích dẫn", "hiệu lực", "văn bản pháp luật",
            "giảng viên", "cán bộ", "quản lý giáo dục",
            "Langfuse", "LangChain", "LangGraph", "streaming", "SSE",
            "guardrail", "toxicity", "audit", "API key", "edurag",
        ],
        filter_condition={"key": "metadata.project_id", "match": {"value": "edurag-app"}},
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
            "distributed system", "distributed systems", "microservice", "microservices",
            "fintech", "financial technology", "system design",
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
            "distributed systems", "microservices", "fintech",
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
        "project:edurag": 10,
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


def route_query(query: str) -> RouteDecision:
    """Route a portfolio query to a category and optional project target."""
    query_lower = query.lower()
    boost = detect_boost(query)

    route = RouteDecision()
    route.matched_rules = [rule.name for rule in boost.matched_rules]

    project_priority = [
        ("attendance-app", "attendance"),
        ("movie-ticket", "movie"),
        ("edurag-app", "edurag"),
    ]

    category_priority = [
        ("contact", "category:contact"),
        ("education", "category:education"),
        ("experience", "category:experience"),
        ("skills", "category:skills"),
        ("competencies", "category:competencies"),
        ("project", "category:project"),
        ("personal_info", "category:personal_info"),
    ]

    if any(token in query_lower for token in ["distributed system", "distributed systems", "microservice", "microservices", "fintech", "financial technology", "system design"]):
        route.category = "competencies"
        route.intent = "category:competencies"
        route.confidence = 0.9
        return route

    if any(word in query_lower for word in ["liên hệ", "contact", "email", "phone", "số điện thoại", "github", "linkedin", "hire", "thuê", "gặp"]):
        route.category = "contact"
        route.intent = "category:contact"
        route.confidence = 0.88
        return route

    if any(word in query_lower for word in ["đại học", "truong", "trường", "tốt nghiệp", "gpa", "vinuni", "hcmus", "học vấn", "education"]):
        route.category = "education"
        route.intent = "category:education"
        route.confidence = 0.87
        return route

    if any(word in query_lower for word in ["kinh nghiệm", "experience", "intern", "thực tập", "company", "công ty", "làm việc", "work"]):
        route.category = "experience"
        route.intent = "category:experience"
        route.confidence = 0.86
        return route

    if boost.best_rule:
        best_name = boost.best_rule.name
        if any(token in query_lower for token in ["kỹ năng", "ky nang", "skill", "competency", "năng lực", "nang luc"]):
            if any(token in query_lower for token in ["ai", "machine learning", "deep learning", "data science", "pandas", "numpy", "backend", "frontend", "mobile", "full-stack"]):
                route.category = "competencies"
                route.intent = "category:competencies"
                route.confidence = 0.92
                return route

        for project_id, needle in project_priority:
            if needle in best_name:
                route.category = "project_detail"
                route.project_id = project_id
                route.intent = best_name
                route.confidence = 0.95
                return route

        for category, needle in category_priority:
            if needle == best_name:
                route.category = category
                route.intent = best_name
                route.confidence = 0.9
                return route

    if any(word in query_lower for word in ["hi", "hello", "xin chào", "chào", "chao", "hey"]):
        route.category = "greeting"
        route.intent = "greeting"
        route.confidence = 0.99
        return route

    if any(word in query_lower for word in ["project", "dự án", "du an", "đã làm", "da lam", "built"]):
        route.category = "project"
        route.intent = "category:project"
        route.confidence = 0.7
        return route

    if any(word in query_lower for word in ["kỹ năng", "ky nang", "skill", "competency", "năng lực", "nang luc"]):
        route.category = "competencies"
        route.intent = "category:competencies"
        route.confidence = 0.65
        return route

    if any(word in query_lower for word in ["quốc", "quoc", "giới thiệu", "gioi thieu", "about", "bio"]):
        route.category = "personal_info"
        route.intent = "category:personal_info"
        route.confidence = 0.6
        return route

    route.category = "general"
    route.intent = "general"
    route.confidence = 0.2
    return route


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


def get_dynamic_top_k(query: str, boost: RetrievalBoost) -> int:
    """Determine dynamic top_k search limit based on matched query intent.
    
    1. Greeting queries: returns 0 (skips vector search).
    2. Contact or Personal Info queries: returns 1 (keeps context highly focused).
    3. Project specific queries: returns 4 (collects parent + multiple child chunks).
    4. General/Default queries: returns 3.
    """
    import re
    query_lower = query.lower().strip()
    words = re.findall(r'\w+', query_lower)
    
    # 1. Simple Greetings Check
    greetings = {"hi", "hello", "xin chào", "chào bạn", "chào", "helo"}
    if any(w in greetings for w in words) and len(words) <= 3:
        if not boost.best_rule:
            return 0
            
    # 2. Dynamic top_k based on matched best intent
    if boost.best_rule:
        name = boost.best_rule.name
        if name == "category:contact":
            return 1
        elif name.startswith("project:"):
            return 4
            
    # 3. Default top_k
    return 3
