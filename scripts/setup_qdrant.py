import sys
import os

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
    from sentence_transformers import SentenceTransformer
except ImportError:
    print("Installing sentence-transformers...")
    os.system(f"{sys.executable} -m pip install sentence-transformers")
    from sentence_transformers import SentenceTransformer

# Initialize clients
print("Connecting to local Qdrant container at localhost:6333...")
try:
    client = QdrantClient(host="localhost", port=6333)
    # Check connection
    client.get_collections()
except Exception as e:
    print(f"Error connecting to Qdrant: {e}")
    print("Please make sure Docker container is running and port 6333 is open.")
    sys.exit(1)

# Initialize local embedding model (free, offline, 384 dimensions)
print("Loading local sentence-transformer model 'all-MiniLM-L6-v2'...")
model = SentenceTransformer('all-MiniLM-L6-v2')

COLLECTION_NAME = "portfolio_knowledge"

# Define data payload representing Quoc's CV and projects
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

# Dynamically load and chunk attendance_pj.md if it exists
import re
attendance_pj_path = os.path.join(os.path.dirname(__file__), "..", "attendance_pj.md")
if os.path.exists(attendance_pj_path):
    print(f"Reading advanced project documentation from: {attendance_pj_path}")
    try:
        with open(attendance_pj_path, "r", encoding="utf-8") as f:
            attendance_content = f.read()
        
        # Split document by markdown level-3 headings (###) to create semantically distinct chunks
        sections = attendance_content.split("###")
        intro = sections[0].strip()
        if intro:
            knowledge_documents.append({
                "id": len(knowledge_documents) + 1,
                "category": "project_detail",
                "text": intro,
                "metadata": {"project_id": "attendance-app", "section": "intro"}
            })
        
        for idx, section in enumerate(sections[1:]):
            section_text = ("###" + section).strip()
            # Extract section title for metadata tracking
            title_match = re.match(r"###\s*(.*)", section_text)
            section_title = title_match.group(1).strip() if title_match else f"Section {idx+1}"
            
            knowledge_documents.append({
                "id": len(knowledge_documents) + 1,
                "category": "project_detail",
                "text": section_text,
                "metadata": {"project_id": "attendance-app", "section": section_title}
            })
        print(f"Loaded {len(sections)} sections from attendance_pj.md successfully.")
    except Exception as e:
        print(f"Error parsing attendance_pj.md: {e}")

# Recreate collection
print(f"Recreating Qdrant collection '{COLLECTION_NAME}' with 384 vector dimensions...")
client.recreate_collection(
    collection_name=COLLECTION_NAME,
    vectors_config=models.VectorParams(
        size=384,  # Matching all-MiniLM-L6-v2 embedding dimensions
        distance=models.Distance.COSINE
    )
)

# Insert documents
print("Generating embeddings and uploading to Qdrant...")
points = []
for doc in knowledge_documents:
    embedding = model.encode(doc["text"]).tolist()
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

client.upsert(
    collection_name=COLLECTION_NAME,
    wait=True,
    points=points
)

print(f"Success! Successfully uploaded {len(points)} documents into '{COLLECTION_NAME}' collection.")
