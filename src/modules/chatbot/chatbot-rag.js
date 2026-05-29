import { portfolioConfig } from '../../data/portfolio-config.js';

export function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9+#.\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(value) {
  const stopWords = new Set([
    'about', 'tell', 'what', 'which', 'where', 'when', 'who', 'does', 'with', 'your', 'you',
    'toi', 'ban', 've', 'cua', 'la', 'gi', 'nhung', 'cac', 'cho', 'biet', 'co', 'khong',
    'anh', 'quoc', 'le', 'trung', 'portfolio', 'project', 'skill'
  ]);

  return normalizeText(value)
    .split(' ')
    .filter(token => token.length > 1 && !stopWords.has(token));
}

export function buildKnowledgeBase(config) {
  const { personalInfo, projects, experience, competencies, techStack, languages, contact } = config;
  const chunks = [
    {
      title: 'Profile',
      category: 'About',
      text: `${personalInfo.name} is an ${personalInfo.title} based in ${personalInfo.location}. ${personalInfo.description} ${personalInfo.detailedBio}`
    },
    {
      title: 'Current Focus',
      category: 'About',
      text: `${personalInfo.name} focuses on AI/ML, backend engineering, web development, software engineering, Spring Boot, Flutter, Python, LangChain, data science, and machine learning.`
    },
    {
      title: 'Tech Stack',
      category: 'Skills',
      text: `Main technologies: ${techStack.join(', ')}.`
    },
    {
      title: 'Languages',
      category: 'Languages',
      text: `Languages: ${languages.map(language => `${language.name} (${language.level})`).join(', ')}.`
    },
    {
      title: 'Contact',
      category: 'Contact',
      text: `Contact email: ${contact.email}. GitHub: ${personalInfo.socialLinks.github}. LinkedIn: ${personalInfo.socialLinks.linkedin}.`
    },
    {
      title: 'Education at HCMUS',
      category: 'Journey',
      text: `${personalInfo.name} started at University of Science, Ho Chi Minh City (HCMUS) in October 2020.`
    },
    {
      title: 'Software Engineer Internship',
      category: 'Journey',
      text: `${personalInfo.name} worked as a Software Engineer Intern at Phu An Phuoc Investment Company from March to June 2024.`
    },
    {
      title: 'Graduation',
      category: 'Journey',
      text: `${personalInfo.name} graduated from HCMUS in October 2025 with GPA 3.1/4.0.`
    },
    {
      title: 'Self Study',
      category: 'Journey',
      text: `${personalInfo.name} focused on self-study from October 2025 to April 2026, covering system design, distributed systems, and Infrastructure as Code.`
    },
    {
      title: 'AI in Action at VinUni',
      category: 'Journey',
      text: `${personalInfo.name} is currently enrolled in the AI in Action program at VinUni from April 2026 onward.`
    }
  ];

  projects.forEach(project => {
    chunks.push({
      title: project.title,
      category: 'Project',
      text: `${project.title}: ${project.description} Tags: ${project.tags.join(', ')}. Type: ${project.badge}. Language: ${project.language}. Code: ${project.codeLink}.`
    });
  });

  experience.forEach(item => {
    chunks.push({
      title: item.role,
      category: 'Experience',
      text: `${item.role} at ${item.company}, ${item.duration}. ${item.description} Achievements: ${item.achievements.join(', ')}.`
    });
  });

  competencies.forEach(competency => {
    chunks.push({
      title: competency.title,
      category: 'Competency',
      text: `${competency.title}: ${competency.items.map(item => `${item.name} - ${item.desc}`).join(' ')}`
    });
  });

  return chunks.map(chunk => ({
    ...chunk,
    normalizedText: normalizeText(`${chunk.title} ${chunk.category} ${chunk.text}`),
    tokens: tokenize(`${chunk.title} ${chunk.category} ${chunk.text}`)
  }));
}

export function retrieveKnowledge(question, knowledgeBase) {
  const queryTokens = tokenize(question);
  const normalizedQuestion = normalizeText(question);

  if (queryTokens.length === 0) {
    return [];
  }

  return knowledgeBase
    .map(chunk => {
      const score = queryTokens.reduce((total, token) => {
        if (chunk.normalizedText.includes(token)) {
          return total + (chunk.title.toLowerCase().includes(token) ? 3 : 1);
        }
        return total;
      }, 0);

      const phraseBoost = normalizedQuestion.includes(normalizeText(chunk.title)) ? 4 : 0;

      return {
        ...chunk,
        score: score + phraseBoost
      };
    })
    .filter(chunk => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export function generateChatbotAnswer(question, knowledgeBase) {
  const matches = retrieveKnowledge(question, knowledgeBase);

  if (matches.length === 0) {
    return {
      answer: "I could not find a reliable match in Quoc's portfolio data. Try asking about his projects, tech stack, AI work, backend skills, education, or contact information.",
      sources: []
    };
  }

  const context = matches.map(match => match.text).join(' ');
  const loweredQuestion = normalizeText(question);

  let answer;
  if (loweredQuestion.includes('contact') || loweredQuestion.includes('email') || loweredQuestion.includes('lien he')) {
    answer = portfolioConfig.personalInfo.socialLinks.email
      ? `You can contact Quoc at ${portfolioConfig.contact.email}, or visit GitHub at ${portfolioConfig.personalInfo.socialLinks.github} and LinkedIn at ${portfolioConfig.personalInfo.socialLinks.linkedin}.`
      : context;
  } else if (loweredQuestion.includes('project') || loweredQuestion.includes('du an') || loweredQuestion.includes('repo')) {
    const projectMatches = matches.filter(match => match.category === 'Project');
    const projects = projectMatches.length > 0 ? projectMatches : knowledgeBase.filter(chunk => chunk.category === 'Project').slice(0, 3);
    answer = `Relevant projects: ${projects.map(project => project.text).join(' ')}`;
  } else if (loweredQuestion.includes('skill') || loweredQuestion.includes('tech') || loweredQuestion.includes('stack') || loweredQuestion.includes('ky nang')) {
    answer = `Quoc's core stack includes ${portfolioConfig.techStack.join(', ')}. ${context}`;
  } else if (loweredQuestion.includes('ai') || loweredQuestion.includes('machine') || loweredQuestion.includes('ml') || loweredQuestion.includes('rag')) {
    answer = `Quoc focuses on AI/ML through Python, data science, machine learning coursework, LangChain, and hands-on AI projects. ${context}`;
  } else {
    answer = context;
  }

  return {
    answer,
    sources: matches.map(match => `${match.category}: ${match.title}`)
  };
}
