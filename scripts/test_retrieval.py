import os
import sys
from pathlib import Path

# Load env variables
def load_env():
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip().strip("'\"")

load_env()

try:
    from qdrant_client import QdrantClient
    from openai import OpenAI
except ImportError as e:
    print(f"Error: Required library missing. {e}")
    sys.exit(1)

# Add parent dir to path for retrieval_boost import
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))
from retrieval_boost import detect_boost, build_qdrant_filter, merge_parent_child

# Configuration
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("Error: OPENAI_API_KEY is not set in env.")
    sys.exit(1)

openai_client = OpenAI(api_key=api_key)
qdrant_client = QdrantClient(host="localhost", port=6333)

COLLECTION_NAME = "portfolio_knowledge"
EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")

# Define retrieval test cases evaluated via Recall@3
# (Query, Expected keywords, Expected metadata properties)
test_cases = [
    {
        "id": 1,
        "query": "Làm thế nào để chống gian lận điểm danh trong app attendance?",
        "expected_keywords": ["ML Kit", "GPS", "gian lận"],
        "expected_category": "project_detail"
    },
    {
        "id": 2,
        "query": "Làm thế nào hệ thống tránh việc đặt trùng ghế (double-booking)?",
        "expected_keywords": ["Pessimistic", "Locking", "@Lock"],
        "expected_category": "project_detail"
    },
    {
        "id": 3,
        "query": "Redis cache giúp cải thiện hiệu năng và giảm độ trễ bao nhiêu phần trăm?",
        "expected_keywords": ["Redis", "15%"],
        "expected_category": "project_detail"
    },
    {
        "id": 4,
        "query": "Cơ chế phân trang trong API đặt vé movie ticket hoạt động như thế nào?",
        "expected_keywords": ["phân trang", "pageable", "tải"],
        "expected_category": "project_detail"
    },
    {
        "id": 5,
        "query": "Cách liên hệ với Lê Trung Anh Quốc?",
        "expected_keywords": ["email", "kuokdavinci@gmail.com", "phone"],
        "expected_category": "contact"
    },
    {
        "id": 6,
        "query": "Thông tin về trường đại học và năm tốt nghiệp của Quốc?",
        "expected_keywords": ["HCMUS", "2025", "VinUni"],
        "expected_category": "education"
    },
    {
        "id": 7,
        "query": "Attendance app dùng công nghệ gì và kiến trúc Firebase như thế nào?",
        "expected_keywords": ["Flutter", "Firebase", "Serverless"],
        "expected_category": "project_detail"
    },
    {
        "id": 8,
        "query": "Movie ticket booking system sử dụng công nghệ gì cho backend và authentication?",
        "expected_keywords": ["Spring Boot", "JWT", "Java"],
        "expected_category": "project_detail"
    },
    {
        "id": 9,
        "query": "Quốc có những kỹ năng nào về AI và Machine Learning?",
        "expected_keywords": ["pandas", "RAG", "numpy"],
        "expected_category": "competencies"
    },
    {
        "id": 10,
        "query": "App attendance chống gian lận điểm danh bằng cách nào?",
        "expected_keywords": ["ML Kit", "khuôn mặt", "GPS"],
        "expected_category": "project_detail"
    },
    {
        "id": 11,
        "query": "Attendance app dùng database và kiến trúc gì?",
        "expected_keywords": ["Firebase", "Cloud Firestore", "Serverless"],
        "expected_category": "project_detail"
    },
    # ── General queries (previously would fail without boosting) ──
    {
        "id": 12,
        "query": "Quốc là ai và làm gì?",
        "expected_keywords": ["AI", "Software Developer", "Ho Chi Minh"],
        "expected_category": "personal_info"
    },
    {
        "id": 13,
        "query": "Tech stack của Quốc có những gì?",
        "expected_keywords": ["Python", "Java", "Spring Boot", "Flutter"],
        "expected_category": "skills"
    },
    {
        "id": 14,
        "query": "Quốc đã làm những dự án nào?",
        # Each project summary chunk describes ONE project, so check for either
        "expected_keywords": ["Attendance", "Flutter"],
        "expected_category": "project"
    },
    {
        "id": 15,
        "query": "Làm sao để liên hệ hoặc gặp Quốc?",
        "expected_keywords": ["email", "kuokdavinci@gmail.com", "GitHub"],
        "expected_category": "contact"
    },
    {
        "id": 16,
        "query": "Quốc có kinh nghiệm làm việc ở đâu?",
        "expected_keywords": ["Software Engineer", "Intern", "Phu An Phuoc"],
        "expected_category": "experience"
    },
    # ── LegalRAG project queries ──
    {
        "id": 17,
        "query": "Hệ thống tra cứu luật giáo dục hoạt động như thế nào?",
        "expected_keywords": ["Triple-Gated", "Semantic Routing", "GraphRAG"],
        "expected_category": "project_detail"
    },
    {
        "id": 18,
        "query": "LegalRAG sử dụng công nghệ gì cho vector search và knowledge graph?",
        "expected_keywords": ["Qdrant", "Neo4j", "RRF"],
        "expected_category": "project_detail"
    },
    {
        "id": 19,
        "query": "Hệ thống có bao nhiêu intent class và cơ chế routing hoạt động ra sao?",
        "expected_keywords": ["6 intent", "LEGAL_EDU", "FAQ shortcut", "semantic centroid"],
        "expected_category": "project_detail"
    },
    {
        "id": 20,
        "query": "Citation trong LegalRAG hoạt động như thế nào?",
        "expected_keywords": ["trích dẫn", "Điều", "Khoản", "văn bản"],
        "expected_category": "project_detail"
    },
    {
        "id": 21,
        "query": "Admin có thể làm gì trong hệ thống LegalRAG?",
        "expected_keywords": ["quản lý", "API key", "audit log", "Langfuse"],
        "expected_category": "project_detail"
    }
]

def get_embedding(text: str) -> list:
    resp = openai_client.embeddings.create(
        input=text,
        model=EMBEDDING_MODEL
    )
    return resp.data[0].embedding

def run_retrieval_tests():
    print("=" * 80)
    print(f"RUNNING RAG RETRIEVAL ACCURACY TESTS (Recall@3)")
    print(f"Collection: {COLLECTION_NAME} | Model: {EMBEDDING_MODEL}")
    print(f"Mode: Parent-Child Hybrid Retrieval")
    print("=" * 80)
    
    passed_count = 0
    total_count = len(test_cases)
    
    for case in test_cases:
        print(f"\nTest Case #{case['id']}: '{case['query']}'")
        try:
            # Generate query embedding
            query_vector = get_embedding(case['query'])
            
            # Rule-based intent detection
            boost = detect_boost(case['query'])
            qdrant_filter = build_qdrant_filter(boost)
            
            # General vector search (fetch more to allow parent-child merge)
            general_results = qdrant_client.query_points(
                collection_name=COLLECTION_NAME,
                query=query_vector,
                limit=8,
            ).points
            
            # Filtered search if rule matched
            filtered_results = []
            if qdrant_filter:
                filtered_results = qdrant_client.query_points(
                    collection_name=COLLECTION_NAME,
                    query=query_vector,
                    query_filter=qdrant_filter,
                    limit=5,
                ).points
            
            # Merge with parent-child awareness
            search_results = merge_parent_child(
                general_results, filtered_results,
                boost=boost,
                top_k=3,
            )
            
            if boost.best_rule:
                print(f"  🎯 Rule: {boost.best_rule.name}")
            
            if not search_results:
                print("  ❌ FAIL: No results returned from Qdrant.")
                continue
                
            # Check if any of the top-3 hits contain all expected keywords
            match_found = False
            best_snippet = ""
            best_score = 0.0
            best_category = ""
            best_metadata = {}
            
            for idx, hit in enumerate(search_results):
                text = hit.payload.get("text", "")
                category = hit.payload.get("category", "")
                metadata = hit.payload.get("metadata", {})
                
                keywords_found = [kw.lower() in text.lower() for kw in case['expected_keywords']]
                if all(keywords_found):
                    match_found = True
                    best_snippet = text
                    best_score = hit.score
                    best_category = category
                    best_metadata = metadata
                    break
            
            if match_found:
                print(f"  ✅ PASS (Recall Rank: {idx+1}, Score: {best_score:.4f})")
                print(f"    - Match Snippet: \"{best_snippet[:120].strip().replace('\n', ' ')}...\"")
                print(f"    - Metadata: category={best_category}, section={best_metadata.get('section') or 'N/A'}")
                passed_count += 1
            else:
                # If no match in top-3, print the details of the first hit
                top_hit = search_results[0]
                top_text = top_hit.payload.get("text", "")
                print(f"  ❌ FAIL (No top-3 chunk contains all keywords: {case['expected_keywords']})")
                print(f"    - Top hit section: {top_hit.payload.get('metadata', {}).get('section')}")
                print(f"    - Top hit snippet: \"{top_text[:120].strip().replace('\n', ' ')}...\"")
                
        except Exception as e:
            print(f"  ❌ ERROR: {e}")
            
    print("\n" + "=" * 80)
    accuracy = (passed_count / total_count) * 100
    print(f"RETRIEVAL TEST SUMMARY: {passed_count}/{total_count} PASSED ({accuracy:.1f}% Accuracy)")
    print("=" * 80)
    
    if passed_count == total_count:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    run_retrieval_tests()
