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
      id: "movie-ticket",
      title: "Movie Ticket Booking System",
      description: "A full-stack cinema reservation platform with Spring Boot REST API backend and Flutter mobile frontend. Features user authentication, seat selection, payment integration, and real-time booking management.",
      image: "",
      tags: ["Java", "Spring Boot", "PostgreSQL", "Flutter", "Dart"],
      badge: "FULL-STACK",
      featured: true,
      codeLink: "https://github.com/kuokdavinci/movie-ticket-app-backend",
      language: "Java",
      stars: 0,
      forks: 0,
      details: {
        longDescription: "A high-performance full-stack cinema ticket booking system designed to provide seamless movie ticketing experiences. The backend utilizes Spring Boot to expose RESTful APIs secured with JWT, while the PostgreSQL database stores movies, showtimes, seats, and booking records. The frontend is built as a cross-platform mobile application using Flutter and Dart, supporting interactive seat grids, payment simulators, and real-time showtime updates.",
        challenges: [
          "Preventing double-booking of seats during high-traffic movies and peak times.",
          "Designing a responsive, dynamic seat layout grid that scales across different mobile screen sizes.",
          "Ensuring secure client-side API authentication persistence and session refresh cycles."
        ],
        solutions: [
          "Implemented optimistic locking at the database level and synchronized transactions in Spring Boot service layers.",
          "Developed a custom layout builder in Flutter that calculates grid dimensions based on device screen constraints.",
          "Secured endpoints with stateless JWT authentication and implemented a secure local storage token management system in Flutter."
        ],
        systemSpecs: {
          "Backend": "Spring Boot (Java 17), Spring Security, JWT, JPA/Hibernate",
          "Frontend": "Flutter (Dart), Provider (State Management), HTTP Client",
          "Database": "PostgreSQL 15, Spring Data JPA",
          "Deployment": "Dockerized stack with environment configurations"
        }
      }
    },
    {
      id: "attendance-app",
      title: "Attendance Tracking App",
      description: "Cross-platform mobile application for automated attendance check-ins using Flutter. Integrates Firebase authentication, QR code scanning, real-time database sync, and offline-first architecture.",
      image: "",
      tags: ["Dart", "Flutter", "Firebase", "QR Code"],
      badge: "MOBILE",
      featured: true,
      codeLink: "https://github.com/kuokdavinci/attendance_app",
      language: "Dart",
      stars: 0,
      forks: 0,
      details: {
        longDescription: "A smart attendance tracking application designed to automate check-ins for organizations and schools. It features Firebase authentication for instant access and stores real-time check-in records. The core feature is a dynamic QR code scanning module that validates location and time. It employs an offline-first architecture with Hive for local storage, synchronizing local attendance records with Firebase once internet connection is restored.",
        challenges: [
          "Synchronizing offline-recorded check-ins reliably without duplicate entries when connectivity returns.",
          "Preventing spoofed attendance check-ins using screenshot QR codes or manual coordinate adjustments.",
          "Minimizing battery drain during continuous location tracking and camera utilization."
        ],
        solutions: [
          "Implemented an idempotent queue syncing mechanism in Flutter using Hive DB and Firebase Firestore listeners.",
          "Designed a time-bounded dynamic QR code generation pattern paired with geofencing validation.",
          "Optimized location updates using adaptive distance filters and lazy camera controller initialization."
        ],
        systemSpecs: {
          "Architecture": "Offline-first dynamic queue sync",
          "Storage": "Hive (Local NoSQL Database), Firebase Firestore",
          "Authentication": "Firebase Auth (Email, Google Sign-in)",
          "Scanner Core": "Mobile Scanner Package (Flutter), Geofencing API"
        }
      }
    },
    {
      id: "lab-day9",
      title: "Lab Day 9 - Advanced Web Project",
      description: "Comprehensive web development lab covering advanced frontend patterns, API integration, and responsive design principles. Built with modern HTML5, CSS3, and JavaScript.",
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
      description: "Focused lab on building reusable UI components and mastering CSS layout techniques including Flexbox, Grid, and responsive breakpoints.",
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
      description: "Data science fundamentals lab covering data cleaning, transformation, and analysis with Python. Explores pandas, numpy, and visualization libraries.",
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
      description: "TypeScript-based application demonstrating modern frontend development practices, type-safe code, and component architecture.",
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
      description: "AI/ML coursework covering neural networks, model training, and evaluation techniques. Hands-on experiments with Python and ML frameworks.",
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
      description: "Continuation of AI coursework focusing on data preprocessing, feature engineering, and model selection strategies.",
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
      description: "Python programming lab covering algorithms, data structures, and problem-solving patterns. Focus on writing clean, efficient code.",
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
      description: "Introductory Python lab covering basics of programming, syntax, control flow, and fundamental data structures.",
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
    "Python", "Java", "Dart", "HTML/CSS",
    "Spring Boot", "Flutter", "Firebase",
    "PostgreSQL", "Qdrant", "Neo4j",
    "Git", "GitHub", "VS Code", "Firebase CLI", "antigravity",
    "pandas", "numpy", "LangChain",
    "RAG", "Multi-Agent Concepts",
    "REST APIs", "JSON", "Markdown",
    "Docker", "AWS", "GCP"
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
