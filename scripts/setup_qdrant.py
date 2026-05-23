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
                    # Strip quotes if present
                    val = val.strip("'\"")
                    os.environ[key.strip()] = val.strip()

load_env()

# Ensure dependencies are installed
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

# Initialize OpenAI client
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("ERROR: OPENAI_API_KEY is not set. Please check your .env file or environment.")
    sys.exit(1)

print("Initializing OpenAI client...")
openai_client = OpenAI(api_key=api_key)

# Initialize Qdrant client
print("Connecting to local Qdrant container at localhost:6333...")
try:
    qdrant_client = QdrantClient(host="localhost", port=6333)
    # Check connection
    qdrant_client.get_collections()
except Exception as e:
    print(f"Error connecting to Qdrant: {e}")
    print("Please make sure Docker container is running and port 6333 is open.")
    sys.exit(1)

COLLECTION_NAME = "portfolio_knowledge"
EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIM = 1536

# Helper to generate OpenAI embeddings
def get_embedding(text: str) -> list:
    try:
        response = openai_client.embeddings.create(
            input=text,
            model=EMBEDDING_MODEL
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Error generating embedding for text: {text[:30]}... Error: {e}")
        raise e

# Helper to get project_id from filename
def get_project_id_from_filename(filename: str) -> str:
    stem = Path(filename).stem
    if stem.endswith("_pj"):
        return stem[:-3].replace("_", "-") + "-app"
    return stem.replace("_", "-")

# Base knowledge documents representing Quoc's core CV info
knowledge_documents = [
    {
        "id": 1,
        "category": "personal_info",
        "text": "Lê Trung Anh Quốc is an AI & Software Developer based in Ho Chi Minh City, Vietnam. Tagline: Building intelligent systems, one line of code at a time.",
        "metadata": {"name": "Lê Trung Anh Quốc", "role": "AI & Software Developer", "location": "Ho Chi Minh City"}
    },
    {
        "id": 2,
        "category": "education",
        "text": "Quốc graduated from HCMUS (University of Science - Ho Chi Minh City) with a GPA of 3.1/4.0 in October 2025. Currently enrolled in the AI in Action program at VinUni (started April 2026).",
        "metadata": {"institution": "HCMUS", "gpa": "3.1/4.0", "graduation": "Oct 2025"}
    },
    {
        "id": 3,
        "category": "experience",
        "text": "Quốc worked as a Software Engineer Intern at Phu An Phuoc Investment Company from March to June 2024, gaining practical industry experience.",
        "metadata": {"role": "Software Engineer Intern", "company": "Phu An Phuoc", "period": "Mar - Jun 2024"}
    },
    {
        "id": 4,
        "category": "project",
        "text": "Movie Ticket Booking System: A full-stack cinema reservation platform featuring a Spring Boot REST API backend (Java, PostgreSQL) and a Flutter mobile frontend (Dart). Supports user authentication, seat selection, payment integration, and real-time booking management.",
        "metadata": {"project_id": "movie-ticket", "title": "Movie Ticket Booking System", "tech_stack": "Java, Spring Boot, PostgreSQL, Flutter"}
    },
    {
        "id": 5,
        "category": "project",
        "text": "Attendance Tracking App: A cross-platform mobile application for automated attendance check-ins built with Flutter. Integrates Firebase authentication, QR code scanning, real-time database sync, and an offline-first architecture.",
        "metadata": {"project_id": "attendance-app", "title": "Attendance Tracking App", "tech_stack": "Dart, Flutter, Firebase, QR Code"}
    },
    {
        "id": 6,
        "category": "competencies",
        "text": "Backend Development Competencies: Building scalable RESTful APIs with Spring Boot and Java. Database design and optimization with PostgreSQL. Security implementation with Spring Security and JWT.",
        "metadata": {"area": "Backend", "tech": "Spring Boot, Java, PostgreSQL, JWT"}
    },
    {
        "id": 7,
        "category": "competencies",
        "text": "Mobile Development Competencies: Cross-platform mobile development with Flutter and Dart. Real-time DB sync and auth with Firebase. Offline-first local caching and sync strategies.",
        "metadata": {"area": "Mobile", "tech": "Flutter, Dart, Firebase, Offline Cache"}
    },
    {
        "id": 8,
        "category": "competencies",
        "text": "AI & Machine Learning Competencies: Data cleaning, analysis and preprocessing using Python, pandas, and numpy. Building RAG (Retrieval-Augmented Generation) systems and multi-agent concepts.",
        "metadata": {"area": "AI/ML", "tech": "Python, pandas, numpy, RAG, LangChain"}
    },
    {
        "id": 9,
        "category": "skills",
        "text": "Complete Tech Stack: Python, Java, Dart, HTML/CSS, Spring Boot, Flutter, Firebase, PostgreSQL, Qdrant, Neo4j, Git, GitHub, Docker, AWS, GCP, LangChain.",
        "metadata": {"skills_list": "Python, Java, Dart, Spring Boot, Flutter, PostgreSQL, Qdrant, Docker, AWS"}
    },
    {
        "id": 10,
        "category": "contact",
        "text": "Contact Lê Trung Anh Quốc via email at kuokdavinci@gmail.com. GitHub Profile: https://github.com/kuokdavinci, LinkedIn Profile: https://linkedin.com/in/kuokdavinci. Phone: 0768040802.",
        "metadata": {"email": "kuokdavinci@gmail.com", "github": "kuokdavinci", "phone": "0768040802"}
    }
]

# Dynamically scan and load all markdown files in knowledge_base/
kb_dir = Path(__file__).resolve().parent.parent / "knowledge_base"
if kb_dir.exists() and kb_dir.is_dir():
    md_files = list(kb_dir.glob("*.md"))
    print(f"Found {len(md_files)} markdown document(s) in knowledge_base/")
    
    for md_file in md_files:
        print(f"Processing: {md_file.name}")
        try:
            with open(md_file, "r", encoding="utf-8") as f:
                content = f.read()
            
            project_id = get_project_id_from_filename(md_file.name)
            
            # Split by level-3 markdown headings (###)
            sections = content.split("###")
            intro = sections[0].strip()
            if intro:
                knowledge_documents.append({
                    "id": len(knowledge_documents) + 1,
                    "category": "project_detail",
                    "text": intro,
                    "metadata": {"project_id": project_id, "section": "intro"}
                })
            
            for idx, section in enumerate(sections[1:]):
                section_text = ("###" + section).strip()
                title_match = re.match(r"###\s*(.*)", section_text)
                section_title = title_match.group(1).strip() if title_match else f"Section {idx+1}"
                
                knowledge_documents.append({
                    "id": len(knowledge_documents) + 1,
                    "category": "project_detail",
                    "text": section_text,
                    "metadata": {"project_id": project_id, "section": section_title}
                })
            print(f"Loaded {len(sections)} sections from {md_file.name} successfully.")
        except Exception as e:
            print(f"Error parsing {md_file.name}: {e}")
else:
    print("Warning: knowledge_base/ folder not found or is empty.")

# Recreate Qdrant collection with 1536 dimensions
print(f"Recreating Qdrant collection '{COLLECTION_NAME}' with {EMBEDDING_DIM} vector dimensions...")
qdrant_client.recreate_collection(
    collection_name=COLLECTION_NAME,
    vectors_config=models.VectorParams(
        size=EMBEDDING_DIM,
        distance=models.Distance.COSINE
    )
)

# Generate embeddings and upload points
print("Generating embeddings via OpenAI and uploading to Qdrant...")
points = []
for doc in knowledge_documents:
    embedding = get_embedding(doc["text"])
    points.append(
        models.PointStruct(
            id=doc["id"],
            vector=embedding,
            payload={
                "category": doc["category"],
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

print(f"Success! Uploaded {len(points)} documents into Qdrant collection '{COLLECTION_NAME}'.")
