export const portfolioConfig = {
  personalInfo: {
    name: "Lê Trung Anh Quốc",
    title: "AI & Software Developer",
    shortTitle: "QUOC.DEV",
    status: "AVAILABLE FOR WORK",
    tagline: "Building intelligent systems, one line of code at a time",
    description: "Passionate developer based in Ho Chi Minh City, focusing on AI/ML, web development, and software engineering. Currently expanding my expertise through hands-on projects and continuous learning.",
    detailedBio: "I'm a developer with a strong foundation in Python, JavaScript, and modern web technologies. My journey spans from building full-stack web applications with Spring Boot and Flutter to exploring the frontiers of AI with LangChain, data science, and machine learning. I believe in learning by doing — every project is an opportunity to push boundaries and write cleaner, more efficient code.",
    avatar: "https://avatars.githubusercontent.com/u/163934382?v=4",
    location: "Ho Chi Minh City, Vietnam",
    githubProfile: "https://github.com/kuokdavinci",
    publicRepos: 41,
    resumeLink: "#",
    socialLinks: {
      github: "https://github.com/kuokdavinci",
      linkedin: "https://linkedin.com/in/kuokdavinci",
      email: "mailto:kuokdavinci@gmail.com"
    }
  },
  projects: [
    {
      id: "edurag",
      title: "EduRAG - Vietnamese Education Law RAG",
      description: "A high-fidelity legal retrieval system for Vietnamese Education Law, combining semantic routing, GraphRAG, and cited answers.",
      image: "",
      tags: ["Python", "LangChain", "Qdrant", "Neo4j", "FastAPI", "Next.js", "Redis"],
      badge: "AI/ML",
      featured: true,
      codeLink: "https://github.com/kuokdavinci/EduRAG",
      language: "Python",
      stars: 0,
      forks: 0,
      duration: "Apr 2026 — Present",
      featureHighlights: [
        { icon: "route", label: "Semantic Routing", desc: "4-tier query intent classification" },
        { icon: "hub", label: "Hybrid Search", desc: "Qdrant Vector + Neo4j Graph RRF fusion" },
        { icon: "psychology", label: "Agent Reflection", desc: "LangChain self-correction loop" },
        { icon: "monitoring", label: "Langfuse Tracing", desc: "Complete observability & costs" }
      ],
      details: {
        overview: "EduRAG is an intelligent Vietnamese Education Law retrieval system that answers legal questions with traceable citations and law-aware context.",
        architecture: {
          pattern: "Triple-Gated Cascading Flow (Semantic Routing -> GraphRAG -> Agent Reflection)",
          layers: [
            { name: "Gate 1: Semantic Routing", details: "Pre-agent intent classifier using dual rule-based patterns (30-40 regex filters) and centroid semantic matching. Classifies queries across 6 intent classes (LEGAL_EDU, AMBIGUOUS, etc.) to skip heavy retrieval for non-legal topics." },
            { name: "Gate 2: Hybrid Search", details: "Generates dynamic search configs based on query features. Executes Qdrant hybrid vector search (dense + BM25) and Neo4j Cypher relationship traversal in parallel via asyncio.gather." },
            { name: "Gate 3: Fusion & Rerank", details: "Merges parallel retrieval streams using Reciprocal Rank Fusion (RRF, k=20). Filters duplicates with TF-IDF cosine check, applies dynamic metadata filters, and feeds snippets into Cohere Multilingual Reranker with dynamic retries." },
            { name: "Gate 4: Agent Reflection", details: "LangChain ReAct Agent evaluates context coverage, auto-correcting query terms if retrieval is empty. Integrates full trace tracking, bottleneck detection, and cost logging via Langfuse." }
          ]
        },
        challenges: [
          "Information overload and conflicting rules in Vietnamese education circulars and decrees.",
          "Recall was low in a legacy vector-only RAG setup.",
          "Maintaining query speed and low latency across multiple routing, retrieval, and reranking gates."
        ],
        solutions: [
          "Semantic router reduces unnecessary retrieval work and cuts average latency by about 30%.",
          "GraphRAG combines Qdrant vector retrieval with Neo4j graph traversal to improve legal recall.",
          "Dynamic top-k tuning raises recall from roughly 54% to about 80% (Recall@1 reaching 84%) with better retrieval selection."
        ],
        benchmark: [
          "Baseline recall: ~54%",
          "Optimized recall (Recall@1 / Recall@10): ~84%",
          "Average latency improvement: ~30%"
        ],
        keyModules: [
          { 
            name: "Semantic Router", 
            icon: "route", 
            details: "Implements a 4-tier cascade routing system (Regex Pattern Match → Soft Out-Of-Scope filter → FAQ collection shortcut with Qdrant threshold > 0.85 → Centroid Semantic Similarity). Classifies queries into 6 distinct intent classes (LEGAL_EDU, AMBIGUOUS, NON_LEGAL, CLARIFY, CHITCHAT, OUT_OF_SCOPE) using 30-40 regex filters and embedding cosine distance matching to bypass heavy retrieval for non-legal queries." 
          },
          { 
            name: "GraphRAG Retriever", 
            icon: "hub", 
            details: "Executes parallel query execution using asyncio.gather to query dense vector search in Qdrant (coupled with BM25 hybrid indexing, K=60) and Cypher-based graph traversals in Neo4j. Driven by a dynamic PipelineConfigBuilder that adjusts weights (graph weight boosted to 0.7 for entity-dense queries) and top-k search parameters dynamically based on router output." 
          },
          { 
            name: "Agent Reflection Loop", 
            icon: "psychology", 
            details: "An agentic self-correction loop built using LangChain and LangGraph. Evaluates retrieved document context coverage and quality inside the agent chain; if retrieval is flagged as empty or low relevance, the agent triggers a retry event, automatically reformulating search terms and query parameters for subsequent turns." 
          },
          { 
            name: "Citation Normalization", 
            icon: "fact_check", 
            details: "A comprehensive citation enforcement and verification engine. Normalizes source document metadata formatting (Decree, Circular, Decision, Law, etc.), maps structural indices (Chapter > Section > Article > Paragraph), and validates output citation accuracy to enforce a strict 100% citation coverage constraint with zero hallucination tolerance." 
          },
          { 
            name: "Langfuse Observability", 
            icon: "monitoring", 
            details: "Complete system monitoring integrated via Langfuse SDK wrappers and custom TracingTimers. Tracks per-step latencies (routing, vector search, graph search, RRF fusion, Cohere reranking, agent generation), calculates token counts/API costs, and passes execution traces to a Single-Prompt Judge evaluating LLM-judge metrics (Faithfulness, Relevancy, Context Precision)." 
          }
        ],
        systemSpecs: {
          "Backend": "FastAPI, LangChain, LangGraph, Python",
          "Frontend": "Next.js Chat UI, Tailwind CSS",
          "Databases": "PostgreSQL, Qdrant, Neo4j, Redis",
          "LLM / Embedding": "OpenAI GPT-4o, text-embedding-3-small",
          "Reranker": "Cohere Multilingual",
          "Observability": "Langfuse"
        },
        notes: [
          "If semantic routing misclassifies a query, the system may enter an inappropriate retrieval branch and return irrelevant results.",
          "Citation quality depends heavily on input context quality and source document normalization — poor context leads to weak citations.",
          "Keep `edurag-app` consistent as the project_id across all references.",
          "When updating content, separate chunks for routing, retrieval, and citation to maintain retrieval clarity.",
          "Avoid cramming too many technical layers into a single chunk unless the query specifically requires it."
        ]
      }
    },
    {
      id: "movie-ticket",
      title: "Movie Ticket Booking System",
      description: "A full-stack cinema reservation platform with Spring Boot REST API backend and Flutter mobile frontend, optimized for seat locking and responsive booking flows.",
      image: "",
      tags: ["Java", "Spring Boot", "PostgreSQL", "Redis", "Flutter", "Dart", "JWT"],
      badge: "FULL-STACK",
      featured: true,
      codeLink: "https://github.com/kuokdavinci/movie-ticket-app-backend",
      language: "Java",
      stars: 0,
      forks: 0,
      duration: "Jan 2026 — Mar 2026",
      featureHighlights: [
        { icon: "lock", label: "Pessimistic Locking", desc: "Prevents double-booking" },
        { icon: "grid_on", label: "Dynamic Seat Grid", desc: "Auto-scales to screen size" },
        { icon: "security", label: "JWT Auth", desc: "Stateless session management" },
        { icon: "cached", label: "Redis Cache", desc: "15% latency reduction" },
      ],
      details: {
        overview: "Movie Ticket Booking System is a full-stack cinema reservation platform supporting movie selection, seat picking, ticket booking, and transaction history tracking. The system is designed to handle high concurrency during seat selection and optimize the mobile booking experience.",
        architecture: {
          pattern: "Layered REST API with Caching & Concurrency Control",
          layers: [
            { name: "Backend Layer", details: "Spring Boot REST API handling business logic, security, and data management. Uses Spring Data JPA for ORM and Spring Security for authentication/authorization with JWT tokens." },
            { name: "Database Layer", details: "PostgreSQL as primary storage for movies, showtimes, seats, bookings, and user accounts. Uses @Lock(LockModeType.PESSIMISTIC_WRITE) on seat entities to prevent double-booking during concurrent operations." },
            { name: "Cache Layer", details: "Redis caching for high-access resources like movie lists and showtime schedules. Reduces latency by approximately 15% for frequently queried endpoints. Requires TTL strategy to avoid stale data." },
            { name: "Client Layer", details: "Flutter mobile app with custom seat grid layout that adapts to device screen constraints. Communicates with backend via REST API for seat selection, booking, and account management." }
          ]
        },
        challenges: [
          "Preventing double-booking during peak traffic when multiple users select the same seat simultaneously.",
          "Building a responsive seat grid that adapts cleanly across different mobile screen sizes.",
          "Managing secure JWT session tokens on the mobile client without compromising UX.",
          "Balancing cache freshness with performance — avoiding stale movie/showtime data while keeping latency low."
        ],
        solutions: [
          "Pessimistic locking at the database level using @Lock(LockModeType.PESSIMISTIC_WRITE) to serialize seat selection and avoid conflicts.",
          "Custom Flutter layout builder that dynamically adjusts grid dimensions based on device constraints and seat count.",
          "Stateless JWT authentication with secure local storage token management on the Flutter client.",
          "Redis cache with appropriate TTL for movie lists and showtime schedules, reducing latency by ~15% for read-heavy endpoints."
        ],
        benchmark: [
          "Redis cache reduced average response latency by ~15% for movie and showtime listing APIs.",
          "Pagination keeps response sizes stable at 10-20 records per page for large movie/history lists.",
          "Pessimistic locking ensures zero double-booking incidents under concurrent load."
        ],
        keyModules: [
          {
            name: "Seat Booking Flow",
            icon: "event_seat",
            details: "End-to-end booking pipeline: user selects movie → theater → showtime → seat grid display → temporary seat hold → payment confirmation → ticket creation. Uses pessimistic locking to prevent seat conflicts during the hold window."
          },
          {
            name: "Admin Movie Management",
            icon: "admin_panel_settings",
            details: "CRUD operations for movies including title, trailer URL, description, duration, and genre. Admin can manage the full movie catalog with image uploads and metadata editing."
          },
          {
            name: "Showtime Scheduling",
            icon: "schedule",
            details: "Admin creates showtimes by assigning movies to theaters with specific time slots. System validates time conflicts to prevent overlapping screenings in the same room."
          },
          {
            name: "Auth & RBAC",
            icon: "security",
            details: "Spring Security with JWT-based stateless authentication. Role-based access control separates user and admin permissions. Users can book tickets and view history; admins manage movies, showtimes, and bookings."
          },
          {
            name: "Cache-Backed Listing APIs",
            icon: "cached",
            details: "Redis-backed caching for high-read endpoints including movie listings, showtime schedules, and theater information. Implements cache invalidation on admin updates to maintain data consistency."
          }
        ],
        systemSpecs: {
          "Backend": "Java, Spring Boot, Spring Security, Spring Data JPA, JWT",
          "Frontend": "Flutter, Provider, HTTP Client",
          "Database": "PostgreSQL, Redis (cache)",
          "Deployment": "Docker"
        },
        notes: [
          "Under high load on the same showtime, pessimistic locks may cause increased wait times for competing booking sessions.",
          "Redis cache requires proper TTL or invalidation strategy to prevent stale movie/showtime data.",
          "If adding real payment integration, separate the payment flow into its own module for cleaner retrieval."
        ]
      }
    },
    {
      id: "attendance-app",
      title: "Attendance Tracking App",
      description: "Cross-platform attendance app using Flutter, Firebase, on-device face detection, and GPS verification.",
      image: "",
      tags: ["Dart", "Flutter", "Firebase", "ML Kit", "GPS", "Offline First"],
      badge: "MOBILE",
      featured: true,
      codeLink: "https://github.com/kuokdavinci/attendance_app",
      language: "Dart",
      stars: 0,
      forks: 0,
      duration: "Feb 2026 — Apr 2026",
      featureHighlights: [
        { icon: "face", label: "Face Detection", desc: "ML Kit on-device" },
        { icon: "location_on", label: "GPS Verification", desc: "Geofencing validation" },
        { icon: "cloud_off", label: "Offline-First", desc: "Hive + queue sync" },
        { icon: "notifications", label: "FCM Push", desc: "Real-time alerts" },
      ],
      details: {
        overview: "Attendance Tracking App is a cross-platform mobile application that automates the attendance process for educational and enterprise environments. The system uses dual authentication — on-device face detection via Google ML Kit and GPS position verification — to reduce attendance fraud. Designed for teachers to manage classes and students to check in quickly from their personal devices.",
        architecture: {
          pattern: "Serverless Offline-First with Dual Verification",
          layers: [
            { name: "Presentation Layer", details: "Flutter UI with clean architecture (Data → Domain → Presentation). Handles class selection, camera preview for face detection, GPS status display, and attendance history. Uses Provider for state management." },
            { name: "Domain Layer", details: "Business logic for attendance validation including face verification pipeline, GPS geofencing checks, and attendance record creation. Implements use cases for check-in, class management, and real-time monitoring." },
            { name: "Data Layer", details: "Hive local database for offline-first storage with queue-based sync to Firestore. Firebase Authentication for user login, Cloud Firestore for real-time attendance data sync, and Firebase Cloud Messaging for push notifications." },
            { name: "ML & Location Layer", details: "Google ML Kit Face Detection runs entirely on-device to reduce latency and avoid sending images to servers. Geolocator package with GPS API for position verification and geofencing validation." }
          ]
        },
        challenges: [
          "Syncing offline check-ins without creating duplicate records when network reconnects.",
          "Preventing spoofed check-ins via screenshot QRs, fake GPS coordinates, or camera manipulation.",
          "Minimizing battery drain during continuous camera and location service usage.",
          "Maintaining attendance reliability in poor lighting or weak GPS signal conditions."
        ],
        solutions: [
          "Idempotent queue sync using Hive DB as local storage and Firestore snapshot listeners for conflict resolution. Each check-in gets a unique ID to prevent duplicates.",
          "On-device face detection via Google ML Kit reduces privacy risk and network dependency. GPS geofencing validates that check-in occurs within the authorized location boundary.",
          "Camera and GPS services are managed with lifecycle-aware resource control — activated only during check-in and released immediately after.",
          "Fallback mechanisms for low-light conditions and GPS signal loss with user feedback and retry options."
        ],
        benchmark: [
          "Designed for real-time sync and offline resilience — check-ins queue locally and sync when connectivity restores.",
          "Built to reduce manual attendance overhead and improve fraud resistance through dual verification (face + GPS).",
          "On-device ML processing eliminates server-side image transfer latency and reduces cloud costs."
        ],
        keyModules: [
          {
            name: "Attendance Check-In",
            icon: "check_circle",
            details: "Core workflow: student selects active class → app captures face via camera → ML Kit verifies face presence → GPS captures current position → if both checks pass, attendance record is created and synced to Firestore. Supports offline queuing with Hive for unreliable network conditions."
          },
          {
            name: "Face Verification",
            icon: "face",
            details: "Google ML Kit Face Detection runs on-device to verify that a real face is present during check-in. Processes camera frames locally without sending images to any server, reducing privacy risk and network dependency. Validates face count, position, and confidence score."
          },
          {
            name: "GPS Validation",
            icon: "location_on",
            details: "Geolocator package captures device coordinates and validates against the class's authorized geofence boundary. Prevents check-ins from outside the allowed radius. Includes spoof detection for fake GPS apps and coordinate manipulation."
          },
          {
            name: "Realtime Monitoring",
            icon: "dashboard",
            details: "Teacher dashboard showing live attendance status for their classes. Uses Firestore snapshot listeners to update attendance counts in real-time. Displays check-in timestamps, face verification status, and GPS validation results for each student."
          },
          {
            name: "Push Notifications",
            icon: "notifications",
            details: "Firebase Cloud Messaging (FCM) for targeted push notifications to specific classes. Teachers can send attendance reminders, class updates, or alerts. Students receive notifications for class status changes and attendance confirmations."
          }
        ],
        systemSpecs: {
          "Architecture": "Offline-first with queue sync, Clean Architecture (Data → Domain → Presentation)",
          "Storage": "Hive (local), Firebase Firestore (cloud sync)",
          "Authentication": "Firebase Authentication",
          "ML": "Google ML Kit Face Detection (on-device)",
          "Location": "Geolocator, GPS API, Geofencing",
          "Notifications": "Firebase Cloud Messaging (FCM)"
        },
        notes: [
          "Attendance accuracy depends on camera quality and GPS signal strength — reliability may decrease in poor lighting or weak signal areas.",
          "Real-time data sync requires stable network connection for optimal Firestore performance.",
          "Keep admin features separate from student check-in flow in separate chunks/modules for cleaner architecture.",
          "If adding new features, create separate modules per workflow or constraint to maintain retrieval clarity."
        ]
      }
    },
    {
      id: "lab-day9",
      title: "Lab Day 9 - Advanced Web Project",
      description: "Web development lab focused on responsive UI patterns, API integration, and modern HTML/CSS/JavaScript implementation.",
      image: "",
      tags: ["HTML", "CSS", "JavaScript"],
      badge: "LAB",
      featured: false,
      codeLink: "https://github.com/kuokdavinci/lab_day9",
      language: "HTML",
      stars: 0,
      forks: 0
    },
    {
      id: "lab-day08",
      title: "Lab Day 08 - UI Components",
      description: "UI lab centered on reusable components and layout techniques with Flexbox, Grid, and responsive breakpoints.",
      image: "",
      tags: ["HTML", "CSS", "JavaScript"],
      badge: "LAB",
      featured: false,
      codeLink: "https://github.com/kuokdavinci/lab_day08",
      language: "HTML",
      stars: 0,
      forks: 0
    },
    {
      id: "data-foundations",
      title: "Data Foundations - Day 7",
      description: "Data science lab covering cleaning, transformation, and analysis with Python, pandas, and numpy.",
      image: "",
      tags: ["Python", "Pandas", "Analytics"],
      badge: "AI/ML",
      featured: false,
      codeLink: "https://github.com/kuokdavinci/20A202600108-LeTrungAnhQuoc-Day7",
      language: "Python",
      stars: 0,
      forks: 0
    },
    {
      id: "demo-day6",
      title: "Demo Day 6 - TypeScript Project",
      description: "TypeScript demo showcasing type-safe frontend patterns and component-based architecture.",
      image: "",
      tags: ["TypeScript", "JavaScript", "Web"],
      badge: "DEMO",
      featured: false,
      codeLink: "https://github.com/kuokdavinci/Demo_Day6",
      language: "TypeScript",
      stars: 0,
      forks: 0
    },
    {
      id: "ai-day06",
      title: "AI Course - Day 06",
      description: "AI/ML coursework focused on neural networks, model training, and evaluation experiments with Python.",
      image: "",
      tags: ["Python", "AI", "Machine Learning"],
      badge: "AI/ML",
      featured: false,
      codeLink: "https://github.com/kuokdavinci/AI20K108-LeTrungAnhQuoc-Day06",
      language: "Python",
      stars: 0,
      forks: 0
    },
    {
      id: "ai-day05",
      title: "AI Course - Day 05",
      description: "AI coursework focused on preprocessing, feature engineering, and model selection.",
      image: "",
      tags: ["Python", "AI", "Data Processing"],
      badge: "AI/ML",
      featured: false,
      codeLink: "https://github.com/kuokdavinci/AI20K108-LeTrungAnhQuoc-Day05",
      language: "Python",
      stars: 0,
      forks: 0
    },
    {
      id: "lab-4",
      title: "Python Lab 4",
      description: "Python lab covering algorithms, data structures, and problem-solving patterns.",
      image: "",
      tags: ["Python", "Algorithms"],
      badge: "LAB",
      featured: false,
      codeLink: "https://github.com/kuokdavinci/2A202600108_lab_4",
      language: "Python",
      stars: 0,
      forks: 0
    },
    {
      id: "lab-1",
      title: "Python Lab 1",
      description: "Introductory Python lab covering syntax, control flow, and basic data structures.",
      image: "",
      tags: ["Python", "Beginner"],
      badge: "LAB",
      featured: false,
      codeLink: "https://github.com/kuokdavinci/_lab_1",
      language: "Python",
      stars: 0,
      forks: 0
    }
  ],
  experience: [
    {
      id: "education",
      role: "AI & Software Engineering Student",
      company: "Self-Directed Learning",
      duration: "2024 — Present",
      description: "Intensive self-study program covering full-stack development, AI/ML fundamentals, and software engineering best practices.",
      achievements: [
        "Completed 41+ hands-on projects and labs",
        "Mastered Python, Java, Dart, and TypeScript",
        "Built full-stack applications with Spring Boot & Flutter"
      ],
      icon: "school"
    },
    {
      id: "ai-coursework",
      role: "AI/ML Coursework",
      company: "Structured Learning Path",
      duration: "2026",
      description: "Systematic progression through AI fundamentals including data science, neural networks, and practical ML applications.",
      achievements: [
        "Data foundations and preprocessing pipelines",
        "Model training and evaluation techniques",
        "Hands-on experiments with real datasets"
      ],
      icon: "psychology"
    },
    {
      id: "web-dev",
      role: "Full-Stack Development",
      company: "Project-Based Learning",
      duration: "2026",
      description: "Building production-ready applications from concept to deployment, covering both backend APIs and mobile frontends.",
      achievements: [
        "Spring Boot REST API with PostgreSQL",
        "Flutter cross-platform mobile apps",
        "Firebase integration and real-time sync"
      ],
      icon: "code"
    }
  ],
  competencies: [
    {
      title: "Backend Development",
      icon: "dns",
      items: [
        {
          name: "RESTful APIs",
          desc: "Building scalable server-side applications with Spring Boot, Java, and PostgreSQL."
        },
        {
          name: "Database Design",
          desc: "Relational database modeling, query optimization, and data integrity with PostgreSQL."
        },
        {
          name: "Authentication & Security",
          desc: "Implementing Spring Security, JWT tokens, and secure API endpoints."
        }
      ]
    },
    {
      title: "Mobile Development",
      icon: "smartphone",
      items: [
        {
          name: "Flutter & Dart",
          desc: "Cross-platform mobile applications with native performance and beautiful UI."
        },
        {
          name: "Firebase Integration",
          desc: "Real-time databases, authentication, cloud storage, and push notifications."
        },
        {
          name: "Offline-First Architecture",
          desc: "Local caching, sync strategies, and resilient mobile experiences."
        }
      ]
    },
    {
      title: "AI & Machine Learning",
      icon: "model_training",
      items: [
        {
          name: "Data Analysis",
          desc: "Data cleaning, transformation, and analysis with Python, pandas, and numpy."
        },
        {
          name: "Model Development",
          desc: "Training, evaluation, and optimization of machine learning models."
        },
        {
          name: "AI Applications",
          desc: "Building intelligent systems that solve real-world problems."
        }
      ]
    },
    {
      title: "Frontend Development",
      icon: "web",
      items: [
        {
          name: "HTML/CSS/JavaScript",
          desc: "Modern web standards, responsive design, and interactive user interfaces."
        },
        {
          name: "TypeScript",
          desc: "Type-safe frontend development with modern tooling and patterns."
        },
        {
          name: "UI/UX Principles",
          desc: "User-centered design, accessibility, and component-based architecture."
        }
      ]
    }
  ],
  techStack: [
    "Python", "Java", "Dart", "TypeScript", "HTML/CSS",
    "Spring Boot", "Flutter", "Firebase",
    "PostgreSQL", "Qdrant", "Neo4j",
    "Git", "Docker",
    "pandas", "numpy", "LangChain",
    "REST API", "AWS", "GCP"
  ],
  languages: [
    { name: "Vietnamese", level: "Native" },
    { name: "English", level: "Professional" }
  ],
  contact: {
    email: "kuokdavinci@gmail.com",
    formspreeEndpoint: "https://formspree.io/f/xvonzndk"
  }
};
