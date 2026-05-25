import sys
import os
import re
from pathlib import Path

# Load environment variables from .env if present
def load_env():
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        print(f"Loading environment from: {env_path}")
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    val = val.strip("'\"")
                    os.environ[key.strip()] = val.strip()

load_env()

try:
    from qdrant_client import QdrantClient
    from qdrant_client.http import models
except ImportError:
    print("Installing qdrant-client...")
    os.system(f"{sys.executable} -m pip install qdrant-client")
    from qdrant_client import QdrantClient
    from qdrant_client.http import models

try:
    from openai import OpenAI
except ImportError:
    print("Installing openai...")
    os.system(f"{sys.executable} -m pip install openai")
    from openai import OpenAI

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("ERROR: OPENAI_API_KEY is not set.")
    sys.exit(1)

print("Initializing OpenAI client...")
openai_client = OpenAI(api_key=api_key)

print("Connecting to local Qdrant container at localhost:6333...")
try:
    qdrant_client = QdrantClient(host="localhost", port=6333)
    qdrant_client.get_collections()
except Exception as e:
    print(f"Error connecting to Qdrant: {e}")
    sys.exit(1)

COLLECTION_NAME = "portfolio_knowledge"
EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
EMBEDDING_DIM = int(os.getenv("QDRANT_VECTOR_DIM", "1536"))

def get_embedding(text: str) -> list:
    try:
        response = openai_client.embeddings.create(
            input=text,
            model=EMBEDDING_MODEL
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Error generating embedding for: {text[:30]}... Error: {e}")
        raise e

def get_project_id_from_filename(filename: str) -> str:
    stem = Path(filename).stem
    if stem.endswith("_pj"):
        return stem[:-3].replace("_", "-") + "-app"
    return stem.replace("_", "-")


# ── Parent-Child Chunking Strategy ──────────────────────────────────
#
# PARENT chunks (chunk_level="parent"):
#   - One per project, contains title + description + tech stack
#   - Answers general queries: "what projects?", "tech stack?", "built with?"
#   - High vector similarity for broad/intent queries
#
# CHILD chunks (chunk_level="child"):
#   - Multiple per project, each covers one technical section
#   - Answers specific queries: "how does locking work?", "anti-fraud mechanism?"
#   - High vector similarity for detailed/technical queries
#
# Retrieval: fetch top-k from both levels, parent gets priority in merge
# ─────────────────────────────────────────────────────────────────────


# ── Base CV documents (always parent-level) ─────────────────────────
knowledge_documents = [
    {
        "id": 1,
        "category": "personal_info",
        "chunk_level": "parent",
        "text": "Lê Trung Anh Quốc is an AI & Software Developer based in Ho Chi Minh City, Vietnam. Tagline: Building intelligent systems, one line of code at a time.",
        "metadata": {"name": "Lê Trung Anh Quốc", "role": "AI & Software Developer", "location": "Ho Chi Minh City"}
    },
    {
        "id": 2,
        "category": "education",
        "chunk_level": "parent",
        "text": "Quốc graduated from HCMUS (University of Science - Ho Chi Minh City) with a GPA of 3.1/4.0 in October 2025. Currently enrolled in the AI in Action program at VinUni (started April 2026).",
        "metadata": {"institution": "HCMUS", "gpa": "3.1/4.0", "graduation": "Oct 2025"}
    },
    {
        "id": 3,
        "category": "experience",
        "chunk_level": "parent",
        "text": "Quốc worked as a Software Engineer Intern at Phu An Phuoc Investment Company from March to June 2024, gaining practical industry experience.",
        "metadata": {"role": "Software Engineer Intern", "company": "Phu An Phuoc", "period": "Mar - Jun 2024"}
    },
    {
        "id": 4,
        "category": "project",
        "chunk_level": "parent",
        "text": "Movie Ticket Booking System: A full-stack cinema reservation platform featuring a Spring Boot REST API backend (Java, PostgreSQL) and a Flutter mobile frontend (Dart). Supports user authentication, seat selection, payment integration, and real-time booking management.",
        "metadata": {"project_id": "movie-ticket", "title": "Movie Ticket Booking System", "tech_stack": "Java, Spring Boot, PostgreSQL, Flutter"}
    },
    {
        "id": 5,
        "category": "project",
        "chunk_level": "parent",
        "text": "Attendance Tracking App: A cross-platform mobile application for automated attendance check-ins built with Flutter. Integrates Firebase authentication, QR code scanning, real-time database sync, and an offline-first architecture.",
        "metadata": {"project_id": "attendance-app", "title": "Attendance Tracking App", "tech_stack": "Dart, Flutter, Firebase, QR Code"}
    },
    {
        "id": 6,
        "category": "competencies",
        "chunk_level": "parent",
        "text": "Backend Development Competencies: Building scalable RESTful APIs with Spring Boot and Java. Database design and optimization with PostgreSQL. Security implementation with Spring Security and JWT.",
        "metadata": {"area": "Backend", "tech": "Spring Boot, Java, PostgreSQL, JWT"}
    },
    {
        "id": 7,
        "category": "competencies",
        "chunk_level": "parent",
        "text": "Mobile Development Competencies: Cross-platform mobile development with Flutter and Dart. Real-time DB sync and auth with Firebase. Offline-first local caching and sync strategies.",
        "metadata": {"area": "Mobile", "tech": "Flutter, Dart, Firebase, Offline Cache"}
    },
    {
        "id": 8,
        "category": "competencies",
        "chunk_level": "parent",
        "text": "AI & Machine Learning Competencies: Data cleaning, analysis and preprocessing using Python, pandas, and numpy. Building RAG (Retrieval-Augmented Generation) systems and multi-agent concepts.",
        "metadata": {"area": "AI/ML", "tech": "Python, pandas, numpy, RAG, LangChain"}
    },
    {
        "id": 9,
        "category": "skills",
        "chunk_level": "parent",
        "text": "Complete Tech Stack: Python, Java, Dart, HTML/CSS, Spring Boot, Flutter, Firebase, PostgreSQL, Qdrant, Neo4j, Git, GitHub, Docker, AWS, GCP, LangChain.",
        "metadata": {"skills_list": "Python, Java, Dart, Spring Boot, Flutter, PostgreSQL, Qdrant, Docker, AWS"}
    },
    {
        "id": 10,
        "category": "contact",
        "chunk_level": "parent",
        "text": "Contact Lê Trung Anh Quốc via email at kuokdavinci@gmail.com. GitHub Profile: https://github.com/kuokdavinci, LinkedIn Profile: https://linkedin.com/in/kuokdavinci. Phone: 0768040802.",
        "metadata": {"email": "kuokdavinci@gmail.com", "github": "kuokdavinci", "phone": "0768040802"}
    }
]


def parse_markdown_hierarchical(content: str, project_id: str):
    """Parse markdown into child chunks with project context."""
    lines = content.splitlines()
    doc_title = ""
    current_section = "Tổng quan"
    chunks = []

    # Find document title
    for line in lines:
        if line.startswith("# ") and not line.startswith("##"):
            doc_title = line[2:].strip()
            break
    if not doc_title:
        doc_title = project_id.replace("-", " ").title()

    current_chunk_title = ""
    current_chunk_lines = []
    intro_lines = []
    in_intro = True

    for line in lines:
        if line.startswith("# ") and not line.startswith("##"):
            continue

        if line.startswith("## "):
            current_section = line[3:].strip()
            continue

        if line.startswith("### "):
            # Save previous chunk
            if current_chunk_title and current_chunk_lines:
                chunk_body = "\n".join(current_chunk_lines).strip()
                full_text = f"### {current_chunk_title}\n{chunk_body}"
                contextual_text = f"[{doc_title} > {current_section}]\n\n{full_text}"
                chunks.append({
                    "text": contextual_text,
                    "section": current_section,
                    "title": current_chunk_title
                })
            elif in_intro and intro_lines:
                intro_body = "\n".join(intro_lines).strip()
                contextual_text = f"[{doc_title} > Tổng quan]\n\n{intro_body}"
                chunks.append({
                    "text": contextual_text,
                    "section": "Tổng quan",
                    "title": "Introduction"
                })
                in_intro = False

            current_chunk_title = line[4:].strip()
            current_chunk_lines = []
            continue

        if in_intro:
            intro_lines.append(line)
        else:
            current_chunk_lines.append(line)

    # Save last chunk
    if current_chunk_title and current_chunk_lines:
        chunk_body = "\n".join(current_chunk_lines).strip()
        full_text = f"### {current_chunk_title}\n{chunk_body}"
        contextual_text = f"[{doc_title} > {current_section}]\n\n{full_text}"
        chunks.append({
            "text": contextual_text,
            "section": current_section,
            "title": current_chunk_title
        })

    return doc_title, chunks


# ── Load markdown files → child chunks ──────────────────────────────
kb_dir = Path(__file__).resolve().parent.parent / "knowledge_base"
if kb_dir.exists() and kb_dir.is_dir():
    md_files = [f for f in kb_dir.glob("*.md") if f.name != "template.md"]
    print(f"Found {len(md_files)} markdown document(s) in knowledge_base/")

    for md_file in md_files:
        print(f"Processing: {md_file.name}")
        try:
            with open(md_file, "r", encoding="utf-8") as f:
                content = f.read()

            project_id = get_project_id_from_filename(md_file.name)
            doc_title, chunks = parse_markdown_hierarchical(content, project_id)

            for chunk in chunks:
                knowledge_documents.append({
                    "id": len(knowledge_documents) + 1,
                    "category": "project_detail",
                    "chunk_level": "child",
                    "text": chunk["text"],
                    "metadata": {
                        "project_id": project_id,
                        "section": chunk["title"],
                        "parent_id": None  # Will be set to parent chunk ID
                    }
                })

            print(f"  → {len(chunks)} child chunks from {md_file.name}")
        except Exception as e:
            print(f"  ✗ Error parsing {md_file.name}: {e}")
else:
    print("Warning: knowledge_base/ folder not found or is empty.")

# ── Link child chunks to their parent ───────────────────────────────
# Build a map: project_id → parent chunk ID
parent_id_map = {}
for doc in knowledge_documents:
    if doc["chunk_level"] == "parent" and doc["metadata"].get("project_id"):
        parent_id_map[doc["metadata"]["project_id"]] = doc["id"]

for doc in knowledge_documents:
    if doc["chunk_level"] == "child":
        pid = doc["metadata"].get("project_id")
        if pid and pid in parent_id_map:
            doc["metadata"]["parent_id"] = parent_id_map[pid]

# ── Upload to Qdrant ────────────────────────────────────────────────
print(f"\nRecreating Qdrant collection '{COLLECTION_NAME}' ({EMBEDDING_DIM} dims)...")
qdrant_client.recreate_collection(
    collection_name=COLLECTION_NAME,
    vectors_config=models.VectorParams(
        size=EMBEDDING_DIM,
        distance=models.Distance.COSINE
    )
)

print(f"Generating embeddings and uploading {len(knowledge_documents)} documents...")
points = []
for doc in knowledge_documents:
    embedding = get_embedding(doc["text"])
    points.append(
        models.PointStruct(
            id=doc["id"],
            vector=embedding,
            payload={
                "category": doc["category"],
                "chunk_level": doc["chunk_level"],
                "text": doc["text"],
                "metadata": doc["metadata"]
            }
        )
    )

qdrant_client.upsert(
    collection_name=COLLECTION_NAME,
    wait=True,
    points=points
)

# Summary
parent_count = sum(1 for d in knowledge_documents if d["chunk_level"] == "parent")
child_count = sum(1 for d in knowledge_documents if d["chunk_level"] == "child")
print(f"\n✅ Success! Uploaded {len(points)} documents:")
print(f"   Parent chunks: {parent_count}")
print(f"   Child chunks:  {child_count}")
