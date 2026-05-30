import sys
import os
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

print("Connecting to Qdrant...")
try:
    qdrant_url = os.getenv("QDRANT_URL")
    qdrant_api_key = os.getenv("QDRANT_API_KEY")
    if qdrant_url:
        print(f"Connecting to remote Qdrant Cloud at {qdrant_url}...")
        qdrant_client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
    else:
        print("Connecting to local Qdrant container at localhost:6333...")
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


def load_personal_documents(kb_dir: Path, start_id: int) -> list[dict]:
    """Load stable personal profile docs from knowledge_base/personal.md."""
    personal_file = kb_dir / "personal.md"
    if not personal_file.exists():
        return []

    with open(personal_file, "r", encoding="utf-8") as f:
        content = f.read()

    section_category_map = {
        "Personal Info": "personal_info",
        "Education": "education",
        "Experience": "experience",
        "Contact": "contact",
        "Competencies": "competencies",
        "Skills": "skills",
    }

    docs = []
    current_section = None
    current_title = None
    current_lines = []
    doc_title = "Lê Trung Anh Quốc"

    def flush_chunk():
        nonlocal start_id
        if not current_section or not current_title:
            return
        body = "\n".join(current_lines).strip()
        if not body:
            return
        category = section_category_map.get(current_section, "personal_info")
        docs.append({
            "id": start_id,
            "category": category,
            "chunk_level": "parent",
            "text": body,
            "metadata": {
                "doc_title": doc_title,
                "section_title": current_section,
                "chunk_title": current_title,
                "project_id": None,
            }
        })
        start_id += 1

    for line in content.splitlines():
        if line.startswith("## "):
            flush_chunk()
            current_section = line[3:].strip()
            current_title = None
            current_lines = []
            continue
        if line.startswith("### "):
            flush_chunk()
            current_title = line[4:].strip()
            current_lines = []
            continue
        if line.startswith("# ") or line.startswith("> ") or line.strip() == "":
            continue
        current_lines.append(line)

    flush_chunk()
    return docs


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


# ── Base CV documents (loaded from knowledge_base/personal.md) ─────
knowledge_documents = []


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
knowledge_documents.extend(load_personal_documents(kb_dir, start_id=1))
if kb_dir.exists() and kb_dir.is_dir():
    md_files = [f for f in kb_dir.glob("*.md") if f.name not in {"template.md", "personal.md"}]
    print(f"Found {len(md_files)} markdown document(s) in knowledge_base/")

    for md_file in md_files:
        print(f"Processing: {md_file.name}")
        try:
            with open(md_file, "r", encoding="utf-8") as f:
                content = f.read()

            project_id = get_project_id_from_filename(md_file.name)
            doc_title, chunks = parse_markdown_hierarchical(content, project_id)

            # ── Create PARENT chunk for this project ──────────────────────
            # Extract intro/summary section for parent chunk
            intro_text = ""
            tech_stack_text = ""
            lines = content.splitlines()
            in_intro = False
            in_tech_stack = False
            for line in lines:
                if line.startswith("# "):
                    in_intro = True
                    continue
                if line.startswith("> "):
                    if in_intro:
                        intro_text += line[2:].strip() + "\n"
                    continue
                if line.startswith("## "):
                    in_intro = False
                if line.startswith("### Tech Stack"):
                    in_tech_stack = True
                    continue
                if line.startswith("### ") and in_tech_stack:
                    in_tech_stack = False
                if in_tech_stack and line.strip():
                    tech_stack_text += line.strip() + "\n"

            parent_text = f"{doc_title}\n\n{intro_text.strip()}"
            if tech_stack_text.strip():
                parent_text += f"\n\nTech Stack:\n{tech_stack_text.strip()}"

            knowledge_documents.append({
                "id": len(knowledge_documents) + 1,
                "category": "project",
                "chunk_level": "parent",
                "text": parent_text,
                "metadata": {
                    "doc_title": doc_title,
                    "project_id": project_id,
                    "section_title": "Overview",
                    "chunk_title": "Summary",
                }
            })
            print(f"  → 1 parent chunk created for {project_id}")

            # ── Create CHILD chunks ───────────────────────────────────────
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
