import './style.css';
import { portfolioConfig } from './data/portfolio-config.js';

window.portfolioConfig = portfolioConfig;

function initTheme() {
  const currentTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  if (currentTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  syncAllToggles();
}

function syncAllToggles() {
  const isDark = document.documentElement.classList.contains('dark');
  document.querySelectorAll('.ios-toggle').forEach(toggle => {
    if (isDark) {
      toggle.classList.add('active');
    } else {
      toggle.classList.remove('active');
    }
  });
}

function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  if (isDark) {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  } else {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }
  syncAllToggles();
}

function setupThemeToggle() {
  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      toggleTheme();
    });
  }
}

function setupMobileMenu() {
  const mobileMenuBtn = document.querySelector('nav > button.md\\:hidden');
  if (!mobileMenuBtn) return;

  let mobileDrawer = document.querySelector('.mobile-nav-drawer');
  
  if (!mobileDrawer) {
    mobileDrawer = document.createElement('div');
    mobileDrawer.className = 'mobile-nav-drawer fixed inset-y-0 right-0 z-50 w-64 max-w-sm bg-surface dark:bg-background border-l border-outline-variant p-6 shadow-xl transform translate-x-full transition-transform duration-300 ease-in-out flex flex-col gap-6';
    
    const navLinks = Array.from(document.querySelectorAll('nav ul li a')).map(link => {
      return `<li><a class="font-code text-base text-on-surface dark:text-on-background hover:text-primary dark:hover:text-primary-fixed py-2 block border-b border-outline-variant dark:border-outline" href="${link.getAttribute('href')}">${link.textContent}</a></li>`;
    }).join('');

    mobileDrawer.innerHTML = `
      <div class="flex justify-between items-center border-b border-outline-variant dark:border-outline pb-4">
        <span class="font-headline font-bold text-lg text-primary dark:text-primary-fixed">MENU</span>
        <button class="close-drawer-btn text-primary dark:text-primary-fixed cursor-pointer">
          <span class="material-symbols-outlined text-[24px]">close</span>
        </button>
      </div>
      <ul class="flex flex-col gap-4">
        ${navLinks}
      </ul>
      <div class="mt-auto flex items-center justify-between">
        <span class="text-on-surface-variant dark:text-on-tertiary-container text-sm">Dark Mode</span>
        <button class="ios-toggle mobile-theme-toggle"></button>
      </div>
    `;
    
    document.body.appendChild(mobileDrawer);

    const backdrop = document.createElement('div');
    backdrop.className = 'mobile-nav-backdrop fixed inset-0 bg-black/40 z-40 hidden opacity-0 transition-opacity duration-300';
    document.body.appendChild(backdrop);

    const openDrawer = () => {
      mobileDrawer.classList.remove('translate-x-full');
      backdrop.classList.remove('hidden');
      requestAnimationFrame(() => backdrop.classList.add('opacity-100'));
      syncAllToggles();
    };

    const closeDrawer = () => {
      mobileDrawer.classList.add('translate-x-full');
      backdrop.classList.remove('opacity-100');
      setTimeout(() => backdrop.classList.add('hidden'), 300);
    };

    mobileMenuBtn.addEventListener('click', openDrawer);
    mobileDrawer.querySelector('.close-drawer-btn').addEventListener('click', closeDrawer);
    backdrop.addEventListener('click', closeDrawer);
    
    mobileDrawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeDrawer);
    });

    const mobileToggle = mobileDrawer.querySelector('.mobile-theme-toggle');
    if (mobileToggle) {
      mobileToggle.addEventListener('click', (e) => {
        e.preventDefault();
        toggleTheme();
      });
    }
  }
}

function setupScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal, .stagger-children').forEach(el => {
    observer.observe(el);
  });
}

function setupTypingEffect() {
  const typingElements = document.querySelectorAll('.typing-effect');
  
  typingElements.forEach(el => {
    const texts = el.dataset.texts ? JSON.parse(el.dataset.texts) : [el.textContent];
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let currentText = '';
    
    el.classList.add('typing-cursor');
    
    function type() {
      const fullText = texts[textIndex];
      
      if (isDeleting) {
        currentText = fullText.substring(0, charIndex - 1);
        charIndex--;
      } else {
        currentText = fullText.substring(0, charIndex + 1);
        charIndex++;
      }
      
      el.textContent = currentText;
      
      let typeSpeed = isDeleting ? 50 : 100;
      
      if (!isDeleting && charIndex === fullText.length) {
        typeSpeed = 2000;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        textIndex = (textIndex + 1) % texts.length;
        typeSpeed = 500;
      }
      
      setTimeout(type, typeSpeed);
    }
    
    setTimeout(type, 1000);
  });
}

function setupContactForm() {
  const form = document.querySelector('form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : 'Send Message';
    
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span class="inline-flex items-center gap-2">
          Sending...
          <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      `;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        showToast('Message sent successfully! I will get back to you soon.', 'success');
        form.reset();
      } else {
        throw new Error('Form submission failed');
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to send message. Please try again or email me directly.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
  });
}

function showToast(message, type = 'success') {
  const existingToast = document.querySelector('.toast-notification');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.className = `toast-notification fixed bottom-6 right-6 z-50 p-4 rounded-lg border shadow-lg max-w-md transform translate-y-10 opacity-0 transition-all duration-300 flex items-center gap-3 ${
    type === 'success' 
      ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-800 dark:text-emerald-200' 
      : 'bg-rose-50 dark:bg-rose-950/80 border-rose-500 text-rose-800 dark:text-rose-200'
  }`;

  const icon = type === 'success' ? 'check_circle' : 'error';
  toast.innerHTML = `
    <span class="material-symbols-outlined text-[24px] ${type === 'success' ? 'text-emerald-500' : 'text-rose-500'}">${icon}</span>
    <p class="font-body text-sm font-medium">${message}</p>
  `;

  document.body.appendChild(toast);
  
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-10', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('translate-y-10', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

function animateCounters() {
  const counters = document.querySelectorAll('.counter');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counter = entry.target;
        const target = parseInt(counter.dataset.target);
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const timer = setInterval(() => {
          current += step;
          if (current >= target) {
            counter.textContent = target;
            clearInterval(timer);
          } else {
            counter.textContent = Math.floor(current);
          }
        }, 16);
        
        observer.unobserve(counter);
      }
    });
  }, { threshold: 0.5 });
  
  counters.forEach(counter => observer.observe(counter));
}

function setupProjectFilters() {
  const filterButtons = document.querySelectorAll('.project-filter');
  const projectCards = document.querySelectorAll('.project-card');
  
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => {
        b.classList.remove('bg-primary', 'text-on-primary');
        b.classList.add('bg-secondary-container', 'text-primary');
      });
      btn.classList.remove('bg-secondary-container', 'text-primary');
      btn.classList.add('bg-primary', 'text-on-primary');
      
      const filter = btn.dataset.filter;
      
      projectCards.forEach(card => {
        const tags = card.dataset.tags || '';
        if (filter === 'all' || tags.includes(filter)) {
          card.style.display = '';
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
          requestAnimationFrame(() => {
            card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          });
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9+#.\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value) {
  const stopWords = new Set([
    'about', 'tell', 'what', 'which', 'where', 'when', 'who', 'does', 'with', 'your', 'you',
    'toi', 'ban', 've', 'cua', 'la', 'gi', 'nhung', 'cac', 'cho', 'biet', 'co', 'khong',
    'anh', 'quoc', 'le', 'trung', 'portfolio', 'project', 'skill'
  ]);

  return normalizeText(value)
    .split(' ')
    .filter(token => token.length > 1 && !stopWords.has(token));
}

function buildKnowledgeBase(config) {
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
      text: `Contact email: ${contact.email}. Portfolio email: leanhquoc128@gmail.com. Phone: 0768040802. GitHub: ${personalInfo.socialLinks.github}. LinkedIn: ${personalInfo.socialLinks.linkedin}.`
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

function retrieveKnowledge(question, knowledgeBase) {
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

function generateChatbotAnswer(question, knowledgeBase) {
  const matches = retrieveKnowledge(question, knowledgeBase);

  if (matches.length === 0) {
    return {
      answer: 'I could not find a reliable match in Quoc\'s portfolio data. Try asking about his projects, tech stack, AI work, backend skills, education, or contact information.',
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

function addChatMessage(container, role, content, sources = []) {
  const message = document.createElement('div');
  message.className = `rag-chat-message ${role === 'user' ? 'is-user' : 'is-bot'}`;

  const sourceMarkup = sources.length
    ? `<div class="rag-chat-sources">${sources.map(source => {
        if (typeof source === 'object' && source.link) {
          return `<a href="${escapeHtml(source.link)}" class="rag-chat-source-link">${escapeHtml(source.title)}</a>`;
        }
        return `<span>${escapeHtml(source)}</span>`;
      }).join('')}</div>`
    : '';

  message.innerHTML = `
    <div class="rag-chat-bubble">
      <p>${escapeHtml(content)}</p>
      ${sourceMarkup}
    </div>
  `;

  container.appendChild(message);
  container.scrollTop = container.scrollHeight;
}

function setupPortfolioChatbot() {
  if (document.querySelector('.rag-chatbot')) return;

  const knowledgeBase = buildKnowledgeBase(portfolioConfig);
  const chatbot = document.createElement('section');
  chatbot.className = 'rag-chatbot';
  chatbot.setAttribute('aria-label', 'Portfolio RAG chatbot');
  chatbot.innerHTML = `
    <button class="rag-chat-toggle" type="button" aria-expanded="false" aria-controls="portfolio-chat-panel">
      <span class="material-symbols-outlined">smart_toy</span>
      <span class="rag-chat-toggle-text">Ask Quoc</span>
    </button>
    <div class="rag-chat-panel" id="portfolio-chat-panel" hidden>
      <div class="rag-chat-header">
        <div>
          <p class="rag-chat-kicker">Portfolio RAG</p>
          <h2>Ask about Quoc</h2>
        </div>
        <button class="rag-chat-close" type="button" aria-label="Close chatbot">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="rag-chat-messages" aria-live="polite"></div>
      <div class="rag-chat-prompts" aria-label="Suggested questions">
        <button type="button">What AI work has Quoc done?</button>
        <button type="button">Which backend skills does he have?</button>
        <button type="button">Show relevant projects</button>
      </div>
      <form class="rag-chat-form">
        <label class="sr-only" for="rag-chat-input">Ask a question</label>
        <input id="rag-chat-input" name="question" autocomplete="off" placeholder="Ask about skills, projects, contact..." />
        <button type="submit" aria-label="Send question">
          <span class="material-symbols-outlined">send</span>
        </button>
      </form>
    </div>
  `;

  document.body.appendChild(chatbot);

  const toggle = chatbot.querySelector('.rag-chat-toggle');
  const panel = chatbot.querySelector('.rag-chat-panel');
  const closeButton = chatbot.querySelector('.rag-chat-close');
  const messages = chatbot.querySelector('.rag-chat-messages');
  const form = chatbot.querySelector('.rag-chat-form');
  const input = chatbot.querySelector('#rag-chat-input');
  const promptButtons = chatbot.querySelectorAll('.rag-chat-prompts button');

  const openChat = () => {
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => input.focus());
  };

  const closeChat = () => {
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.focus();
  };

  const askQuestion = async (question) => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) return;

    // Track chat query event
    trackEvent('chat_query', { query: trimmedQuestion });

    addChatMessage(messages, 'user', trimmedQuestion);

    // 1. Add temporary thinking indicator bubble
    const thinkingMessage = document.createElement('div');
    thinkingMessage.className = 'rag-chat-message is-bot is-thinking';
    thinkingMessage.innerHTML = `
      <div class="rag-chat-bubble">
        <div class="thinking-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    messages.appendChild(thinkingMessage);
    messages.scrollTop = messages.scrollHeight;

    const removeThinking = () => {
      if (thinkingMessage.parentNode) {
        thinkingMessage.parentNode.removeChild(thinkingMessage);
      }
    };

    try {
      const sessionId = getSessionId();
      // 2. Fetch answer from backend gateway chatbot endpoint
      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: trimmedQuestion
        })
      });

      removeThinking();

      if (response.ok) {
        const data = await response.json();
        addChatMessage(messages, 'bot', data.answer, data.sources);
      } else {
        throw new Error('API server returned error code ' + response.status);
      }
    } catch (error) {
      console.warn('Backend chatbot API failed, falling back to local generation:', error);
      removeThinking();
      
      // 3. Fallback to client-side rule-based response
      const localResponse = generateChatbotAnswer(trimmedQuestion, knowledgeBase);
      addChatMessage(messages, 'bot', localResponse.answer, localResponse.sources);
    }
  };

  addChatMessage(
    messages,
    'bot',
    'Hi, I can retrieve information from this portfolio. Ask about Quoc\'s projects, skills, AI focus, journey, or contact details.'
  );

  toggle.addEventListener('click', () => {
    if (panel.hidden) {
      openChat();
    } else {
      closeChat();
    }
  });

  closeButton.addEventListener('click', closeChat);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    askQuestion(input.value);
    input.value = '';
  });

  promptButtons.forEach(button => {
    button.addEventListener('click', () => {
      openChat();
      askQuestion(button.textContent);
    });
  });
}

// JS Tracking SDK Client Implementation
const TRACKING_API_URL = 'http://localhost:8000/api/v1/track';
const CHAT_API_URL = 'http://localhost:8000/api/v1/chat';
let scrolled50 = false;
let scrolled90 = false;

function getSessionId() {
  let sessionId = sessionStorage.getItem('portfolio_session_id');
  if (!sessionId) {
    // Generate UUIDv4-like session identifier
    sessionId = 'session_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('portfolio_session_id', sessionId);
  }
  return sessionId;
}

async function trackEvent(eventType, payload = {}) {
  const sessionId = getSessionId();
  const event = {
    session_id: sessionId,
    timestamp: new Date().toISOString(),
    event_type: eventType,
    payload: payload
  };
  
  try {
    const response = await fetch(TRACKING_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });
    if (!response.ok) {
      console.warn('Failed to send tracking event:', response.statusText);
    }
  } catch (error) {
    // Fail silently in background
    console.error('Error sending tracking event:', error);
  }
}

function handleRoute() {
  const hash = window.location.hash || '#home';
  const detailsView = document.getElementById('project-details-view');
  if (!detailsView) return;

  const projectMatch = hash.match(/^#\/project\/([a-zA-Z0-9_-]+)$/);
  
  // Reset scroll flags for the new view/page
  scrolled50 = false;
  scrolled90 = false;

  if (projectMatch) {
    const projectId = projectMatch[1];
    const project = portfolioConfig.projects.find(p => p.id === projectId);
    
    // Hide main sections
    const mainSections = document.querySelectorAll('main > section:not(#project-details-view)');
    mainSections.forEach(section => {
      section.classList.add('hidden');
    });
    
    // Show project details view
    detailsView.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Track Case Study View event
    trackEvent('page_view', { page: `project_${projectId}` });

    if (project && project.details) {
      detailsView.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 md:px-12 opacity-0 transition-opacity duration-300" id="project-details-content">
          <!-- Back navigation button -->
          <div class="mb-8">
            <a href="#projects" class="inline-flex items-center gap-2 font-code text-sm font-bold uppercase tracking-wider text-primary dark:text-primary hover:-translate-x-1 transition-transform">
              <span class="material-symbols-outlined text-base">arrow_back</span> Back to Projects
            </a>
          </div>

          <!-- Massive Typographic Header -->
          <div class="flex flex-col md:flex-row justify-between items-start md:items-end border-b-8 border-primary dark:border-outline-variant pb-6 mb-12 gap-4">
            <div>
              <span class="font-code text-sm font-bold uppercase tracking-widest text-secondary dark:text-accent-light mb-2 block">Project Case Study</span>
              <h1 class="font-headline text-4xl md:text-7xl font-black uppercase text-primary dark:text-on-background leading-none">${escapeHtml(project.title)}</h1>
            </div>
            <a href="${escapeHtml(project.codeLink)}" target="_blank" rel="noopener" class="font-code text-sm font-bold bg-primary text-on-primary dark:bg-primary-container dark:text-on-primary-container px-6 py-3 border-2 border-primary dark:border-primary-container hover:bg-transparent hover:text-primary dark:hover:text-on-background transition-all rounded-none inline-flex items-center gap-2 cursor-pointer shadow-[4px_4px_0px_0px_rgba(114,87,101,1)] dark:shadow-[4px_4px_0px_0px_rgba(240,196,220,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(114,87,101,1)] dark:hover:shadow-[6px_6px_0px_0px_rgba(240,196,220,1)] active:translate-x-0 active:translate-y-0 active:shadow-[4px_4px_0px_0px_rgba(114,87,101,1)]">
              <span class="material-symbols-outlined text-base">code</span> Source Code <span class="material-symbols-outlined text-sm">open_in_new</span>
            </a>
          </div>

          <!-- Asymmetric Grid-Shift Layout -->
          <div class="grid grid-cols-1 lg:grid-cols-4 gap-12 items-start">
            <!-- Left column: Sidebar (1/4 width) -->
            <div class="lg:col-span-1 border-4 border-primary dark:border-outline-variant p-6 bg-surface-container dark:bg-surface-container-lowest rounded-none flex flex-col gap-6 shadow-[8px_8px_0px_0px_rgba(6,20,73,1)] dark:shadow-[8px_8px_0px_0px_rgba(45,65,95,1)]">
              <div>
                <h3 class="font-code text-xs font-bold uppercase tracking-widest text-on-surface-variant dark:text-on-surface-variant mb-3 border-b-2 border-primary dark:border-outline-variant pb-1">Type</h3>
                <span class="inline-block px-3 py-1 bg-primary text-on-primary dark:bg-primary-container dark:text-on-primary-container text-xs font-bold uppercase tracking-wider rounded-none">${escapeHtml(project.badge)}</span>
              </div>

              <div>
                <h3 class="font-code text-xs font-bold uppercase tracking-widest text-on-surface-variant dark:text-on-surface-variant mb-3 border-b-2 border-primary dark:border-outline-variant pb-1">Primary Tech</h3>
                <span class="inline-block px-3 py-1 bg-secondary-container text-on-secondary-fixed-variant text-xs font-bold uppercase tracking-wider rounded-none">${escapeHtml(project.language)}</span>
              </div>

              <div>
                <h3 class="font-code text-xs font-bold uppercase tracking-widest text-on-surface-variant dark:text-on-surface-variant mb-3 border-b-2 border-primary dark:border-outline-variant pb-1">Tech Stack</h3>
                <div class="flex flex-wrap gap-2">
                  ${project.tags.map(tag => `<span class="px-2.5 py-1 bg-surface-container-high dark:bg-surface-container-high text-on-surface dark:text-on-background text-xs font-medium border border-outline rounded-none">${escapeHtml(tag)}</span>`).join('')}
                </div>
              </div>

              <div>
                <h3 class="font-code text-xs font-bold uppercase tracking-widest text-on-surface-variant dark:text-on-surface-variant mb-3 border-b-2 border-primary dark:border-outline-variant pb-1">System Specs</h3>
                <dl class="flex flex-col gap-3 font-body text-sm">
                  ${Object.entries(project.details.systemSpecs).map(([key, val]) => `
                    <div>
                      <dt class="font-bold text-primary dark:text-primary-fixed">${escapeHtml(key)}</dt>
                      <dd class="text-on-surface-variant dark:text-on-surface-variant/80">${escapeHtml(val)}</dd>
                    </div>
                  `).join('')}
                </dl>
              </div>
            </div>

            <!-- Right column: Content narrative (3/4 width) -->
            <div class="lg:col-span-3 flex flex-col gap-10 border-t-4 lg:border-t-0 lg:border-l-4 border-primary dark:border-outline-variant pt-8 lg:pt-0 lg:pl-10">
              <!-- Long Description -->
              <div class="flex flex-col gap-3">
                <h2 class="font-headline text-2xl font-black uppercase text-primary dark:text-on-background">Project Overview</h2>
                <p class="font-body text-lg leading-relaxed text-on-surface-variant dark:text-on-surface-variant/90">${escapeHtml(project.details.longDescription)}</p>
              </div>

              <!-- Challenges & Solutions side by side -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <!-- Challenges -->
                <div class="border-2 border-primary dark:border-outline-variant p-6 bg-rose-50/50 dark:bg-rose-950/10 rounded-none shadow-[4px_4px_0px_0px_rgba(114,87,101,1)] dark:shadow-[4px_4px_0px_0px_rgba(240,196,220,1)]">
                  <h3 class="font-headline text-xl font-bold uppercase text-rose-700 dark:text-rose-400 mb-4 inline-flex items-center gap-2">
                    <span class="material-symbols-outlined">warning</span> Key Challenges
                  </h3>
                  <ul class="flex flex-col gap-4 font-body text-base text-on-surface-variant dark:text-on-surface-variant list-disc pl-5">
                    ${project.details.challenges.map(challenge => `<li>${escapeHtml(challenge)}</li>`).join('')}
                  </ul>
                </div>

                <!-- Solutions -->
                <div class="border-2 border-primary dark:border-outline-variant p-6 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-none shadow-[4px_4px_0px_0px_rgba(6,20,73,1)] dark:shadow-[4px_4px_0px_0px_rgba(165,179,224,1)]">
                  <h3 class="font-headline text-xl font-bold uppercase text-emerald-700 dark:text-emerald-400 mb-4 inline-flex items-center gap-2">
                    <span class="material-symbols-outlined">task_alt</span> Solutions & Engineering
                  </h3>
                  <ul class="flex flex-col gap-4 font-body text-base text-on-surface-variant dark:text-on-surface-variant list-disc pl-5">
                    ${project.details.solutions.map(solution => `<li>${escapeHtml(solution)}</li>`).join('')}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Trigger opacity fade-in
      setTimeout(() => {
        const content = document.getElementById('project-details-content');
        if (content) content.classList.remove('opacity-0');
      }, 50);
    } else {
      detailsView.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 md:px-12 text-center py-20">
          <h1 class="font-headline text-4xl font-bold text-primary dark:text-on-background mb-4">Project Not Found</h1>
          <p class="text-on-surface-variant mb-8">The project you are looking for does not exist or has been removed.</p>
          <a href="#projects" class="btn-primary">Back to Projects</a>
        </div>
      `;
    }
  } else {
    // Show main sections
    const mainSections = document.querySelectorAll('main > section:not(#project-details-view)');
    mainSections.forEach(section => {
      section.classList.remove('hidden');
    });
    
    // Hide project details
    detailsView.classList.add('hidden');
    
    // Track Page View Event for standard hash route
    trackEvent('page_view', { page: hash.substring(1) || 'home' });

    // Scroll to specific section if hash exists, else to top
    if (window.location.hash) {
      const targetId = hash.substring(1);
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        // Wait briefly for display transition to settle, then scroll
        setTimeout(() => {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      }
    }
  }
}

function setupRouter() {
  window.addEventListener('hashchange', handleRoute);
  // Handle initial page load
  handleRoute();
}

function setupTracking() {
  // 1. Project card click tracking
  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', () => {
      const href = card.getAttribute('href');
      const match = href.match(/#\/project\/([a-zA-Z0-9_-]+)$/);
      if (match) {
        trackEvent('project_click', { project_id: match[1] });
      }
    });
  });

  // 2. Scroll depth tracking listener
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (docHeight <= 0) return;
    const scrollPercent = (scrollTop / docHeight) * 100;

    if (scrollPercent >= 50 && !scrolled50) {
      scrolled50 = true;
      trackEvent('scroll_depth', { percent: 50 });
    }
    if (scrollPercent >= 90 && !scrolled90) {
      scrolled90 = true;
      trackEvent('scroll_depth', { percent: 90 });
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupThemeToggle();
  setupMobileMenu();
  setupScrollReveal();
  setupTypingEffect();
  animateCounters();
  setupProjectFilters();
  setupPortfolioChatbot();
  setupRouter();
  setupTracking();
});
