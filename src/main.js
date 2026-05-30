import './style.css';
import './modules/chatbot/chatbot.css';
import './modules/dashboard/dashboard.css';
import { portfolioConfig } from './data/portfolio-config.js';
import { setupPortfolioChatbot } from './modules/chatbot/chatbot-ui.js';
import { getTracker } from './modules/tracking/tracker.js';
import { initDashboard, refreshDashboard, destroyDashboard } from './modules/dashboard/dashboard.js';

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
  
  // Re-render dashboard charts immediately when switching modes to update colors
  if (window.location.hash === '#dashboard') {
    refreshDashboard();
  }
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



// JS Tracking SDK Client Implementation
const getBackendUrl = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8000';
  }
  // Replace this with your production FastAPI backend deployment URL
  return 'https://my-portfolio-mgel.onrender.com';
};

const BACKEND_URL = getBackendUrl();
const TRACKING_API_URL = `${BACKEND_URL}/api/v1/track`;
const CHAT_API_URL = `${BACKEND_URL}/api/v1/chat`;
const scrollReached = new Set();

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
  // Use tracker.js instance if initialized to benefit from queuing/batching
  if (window.trackEvent && typeof window.trackEvent === 'function') {
    window.trackEvent(eventType, payload);
    return;
  }

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
  scrollReached.clear();

  // Show/hide dashboard based on route
  const dashboardSection = document.getElementById('dashboard');
  const mainSections = document.querySelectorAll('main > section:not(#project-details-view):not(#dashboard)');

  if (hash === '#dashboard') {
    // Show dashboard with loading overlay, hide other main sections
    mainSections.forEach(section => section.classList.add('hidden'));
    if (dashboardSection) {
      dashboardSection.classList.remove('hidden');
      // Add loading overlay
      let overlay = dashboardSection.querySelector('.dashboard-loading-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'dashboard-loading-overlay fixed inset-0 z-50 flex items-center justify-center bg-surface/80 dark:bg-background/80 backdrop-blur-sm';
        overlay.innerHTML = `
          <div class="text-center">
            <span class="material-symbols-outlined text-6xl text-primary animate-spin">sync</span>
            <p class="font-code text-sm text-on-surface-variant mt-4">Loading telemetry data...</p>
          </div>
        `;
        dashboardSection.appendChild(overlay);
      }
    }
    if (detailsView) detailsView.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'instant' });
    destroyDashboard();

    // Load data in background
    initDashboard().then(() => {
      // Remove loading overlay when data is ready
      const dashSection = document.getElementById('dashboard');
      if (dashSection) {
        const ov = dashSection.querySelector('.dashboard-loading-overlay');
        if (ov) ov.remove();
      }
    });

    // Bind manual refresh button click
    const refreshBtn = document.getElementById('manual-refresh-btn');
    if (refreshBtn) {
      refreshBtn.onclick = async () => {
        const icon = refreshBtn.querySelector('.material-symbols-outlined');
        if (icon) icon.classList.add('animate-spin');
        refreshBtn.disabled = true;
        await refreshDashboard();
        if (icon) icon.classList.remove('animate-spin');
        refreshBtn.disabled = false;
      };
    }
    return;
  } else {
    // Hide dashboard on other routes
    if (dashboardSection) dashboardSection.classList.add('hidden');
  }

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

    const boldNumbers = (text) => {
      return text.replace(/(\d+(?:\.\d+)?%|\b\d+-\d+\b|\b\d+(?:\.\d+)?\b)/g, '<strong>$1</strong>');
    };

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
          <div class="border-b-8 border-primary pb-6 mb-12">
            <span class="font-code text-sm font-bold uppercase tracking-widest text-secondary dark:text-secondary mb-2 block">Project Case Study</span>
            <h1 class="font-headline text-4xl md:text-7xl font-black uppercase text-primary dark:text-on-background leading-tight mb-4">${escapeHtml(project.title)}</h1>
            <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mt-4">
              <div>
                ${project.duration ? `<p class="font-code text-sm font-bold uppercase tracking-wider text-primary dark:text-primary inline-flex items-center gap-1.5 bg-primary/10 dark:bg-primary/10 px-3 py-1.5 border border-primary/30 dark:border-primary/30"><span class="material-symbols-outlined text-base text-primary dark:text-primary">event</span> ${escapeHtml(project.duration)}</p>` : ''}
              </div>
              <div class="flex flex-row items-center gap-3 flex-nowrap mt-4 md:mt-0">
                <button id="open-demo-btn" class="btn-demo font-code text-sm font-bold bg-primary text-on-primary dark:bg-primary dark:text-on-primary px-6 py-3 border-2 border-primary dark:border-primary hover:bg-transparent hover:text-primary dark:hover:text-primary transition-all rounded-none inline-flex items-center gap-2 cursor-pointer shadow-[4px_4px_0px_0px_var(--color-primary)] dark:shadow-[4px_4px_0px_0px_var(--color-outline)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_var(--color-primary)] dark:hover:shadow-[6px_6px_0px_0px_var(--color-outline)] active:translate-x-0 active:translate-y-0 active:shadow-[4px_4px_0px_0px_var(--color-primary)] whitespace-nowrap">
                  <span class="material-symbols-outlined text-base !text-inherit">play_circle</span> Watch Demo
                </button>
                <a href="${escapeHtml(project.codeLink)}" target="_blank" rel="noopener" class="btn-sourcecode font-code text-sm font-bold bg-primary text-on-primary dark:bg-primary dark:text-on-primary px-6 py-3 border-2 border-primary dark:border-primary hover:bg-transparent hover:text-primary dark:hover:text-primary transition-all rounded-none inline-flex items-center gap-2 cursor-pointer shadow-[4px_4px_0px_0px_var(--color-primary)] dark:shadow-[4px_4px_0px_0px_var(--color-outline)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_var(--color-primary)] dark:hover:shadow-[6px_6px_0px_0px_var(--color-outline)] active:translate-x-0 active:translate-y-0 active:shadow-[4px_4px_0px_0px_var(--color-primary)] whitespace-nowrap">
                  <span class="material-symbols-outlined text-base !text-inherit">code</span> Source Code <span class="material-symbols-outlined text-sm !text-inherit">open_in_new</span>
                </a>
              </div>
            </div>
          </div>

          <!-- Tech Stack Row (Asymmetric Editorial Style) -->
          ${project.details && project.details.systemSpecs ? `
          <div class="mb-12 relative overflow-hidden group/tech pb-4">
            <h2 class="font-headline text-2xl font-black uppercase text-primary dark:text-primary mb-6 tracking-tight">Technology Stack</h2>
            <div class="flex flex-wrap gap-x-8 gap-y-4 items-end relative z-10">
              ${Object.entries(project.details.systemSpecs).map(([key, val], idx) => `
                <div class="tech-item-editorial transition-all duration-300 hover:translate-y-[-2px] cursor-default ${idx % 2 === 0 ? 'mt-0' : 'md:mt-4'}">
                  <span class="font-code text-xs font-bold uppercase tracking-widest text-primary dark:text-primary block mb-0.5">/ 0${idx + 1} ${escapeHtml(key)}</span>
                  <span class="font-headline text-lg md:text-xl font-extrabold uppercase tracking-tight text-on-background dark:text-white transition-colors duration-300 hover:text-primary dark:hover:text-primary">${escapeHtml(val)}</span>
                </div>
              `).join('')}
            </div>
            <!-- Giant background watermark -->
            <div class="absolute right-0 bottom-0 select-none pointer-events-none opacity-[0.02] dark:opacity-[0.015] font-headline text-6xl md:text-[90px] font-black uppercase leading-none tracking-tighter text-on-background dark:text-white transition-transform duration-700 group-hover/tech:scale-105 origin-bottom-right">
              STACK
            </div>
          </div>
          ` : ''}

          <!-- Overview Section (Pushed to the top) -->
          <div class="mb-12">
            <h2 class="font-headline text-2xl font-black uppercase text-primary dark:text-primary mb-4">Project Overview</h2>
            <p class="font-body text-lg leading-relaxed text-black dark:text-white">${escapeHtml(project.details.overview || project.details.longDescription || project.description)}</p>
          </div>

          <!-- Core Modules (Interactive Control Board) -->
          ${project.details.keyModules && project.details.keyModules.length > 0 ? `
          <div class="mb-16">
            <h2 class="font-headline text-2xl font-black uppercase text-primary dark:text-primary mb-6 tracking-tight">Core Modules</h2>
            <div class="border-2 border-primary dark:border-primary flex flex-col md:flex-row h-auto md:h-[400px] bg-surface-container dark:bg-surface-container-lowest overflow-hidden">
              
              <!-- Left Sidebar: Tabs List -->
              <div class="w-full md:w-2/5 border-b-2 md:border-b-0 md:border-r-2 border-primary dark:border-primary flex flex-col divide-y-2 divide-primary dark:divide-primary justify-start">
                ${project.details.keyModules.map((module, idx) => {
                  const isObj = typeof module === 'object';
                  const name = isObj ? module.name : module;
                  const icon = isObj ? module.icon : '';
                  return `
                    <button class="module-tab-btn flex items-center justify-between cursor-pointer hover:bg-primary/5 dark:hover:bg-primary/5 transition-all duration-300 text-left outline-none py-[21px] px-4 ${idx === 0 ? 'bg-primary/10 dark:bg-primary/10 flex-1' : 'flex-none'}" data-index="${idx}">
                      <div class="flex items-center gap-3">
                        ${icon ? `<span class="material-symbols-outlined text-primary dark:text-primary text-xl">${escapeHtml(icon)}</span>` : ''}
                        <span class="font-headline text-sm font-bold uppercase tracking-tight text-on-surface dark:text-white">${escapeHtml(name)}</span>
                      </div>
                      <span class="active-indicator flex items-center gap-1.5 font-code text-xs text-emerald-500 font-bold ${idx === 0 ? 'opacity-100' : 'opacity-0'} transition-opacity">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        [ACTIVE]
                      </span>
                    </button>
                  `;
                }).join('')}
              </div>

              <!-- Right Display Panel: Content Terminal -->
              <div class="w-full md:w-3/5 min-h-[250px] md:min-h-0 relative bg-surface-container-lowest dark:bg-surface-container-lowest/40 overflow-y-auto">
                ${project.details.keyModules.map((module, idx) => {
                  const isObj = typeof module === 'object';
                  const name = isObj ? module.name : module;
                  const details = isObj ? module.details : '';
                  return `
                    <div class="module-console-detail absolute inset-0 p-6 md:p-8 flex flex-col justify-start transition-all duration-300 ${idx === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}" data-index="${idx}">
                      <div class="w-full">
                        <div class="flex items-center justify-between border-b border-primary/20 pb-4 mb-6">
                          <span class="font-code text-xs text-secondary">SYSTEM CORE MODULE // 0${idx + 1}</span>
                          <span class="font-code text-xs text-emerald-500 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 rounded-sm">ONLINE</span>
                        </div>
                        <h3 class="font-headline text-2xl font-black uppercase text-primary dark:text-primary mb-4">${escapeHtml(name)}</h3>
                        <p class="font-body text-base leading-relaxed text-black dark:text-white font-medium">${boldNumbers(escapeHtml(details))}</p>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>

            </div>
          </div>
          ` : ''}

            <!-- Challenges & Solutions (Asymmetric Layered Deck) -->
            <div class="mb-16">
              <h2 class="font-headline text-3xl font-black uppercase text-primary dark:text-primary mb-8 tracking-tight">Key Challenges & Solutions</h2>
              <div class="flex flex-col gap-8">
                ${project.details.challenges.map((challenge, idx) => {
                  const solution = project.details.solutions[idx] || '';
                  return `
                    <div class="group/challenge relative flex flex-col lg:flex-row border-2 border-primary dark:border-primary bg-surface-container dark:bg-surface-container-lowest overflow-hidden transition-all duration-300 hover:shadow-[8px_8px_0px_0px_var(--color-primary)]">
                      <!-- Big index background watermark -->
                      <div class="absolute right-4 bottom-[-20px] select-none pointer-events-none opacity-[0.05] dark:opacity-[0.03] font-headline text-9xl font-black italic transition-transform duration-500 group-hover/challenge:translate-y-[-10px]">
                        0${idx + 1}
                      </div>

                      <!-- Left Column: Challenge (Problem) -->
                      <div class="flex-1 p-8 lg:border-r-2 border-primary dark:border-primary flex flex-col justify-between">
                        <div>
                          <div class="flex items-center gap-2 mb-4">
                            <span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                            <span class="font-code text-xs font-bold uppercase tracking-widest text-rose-500">PROBLEM // 0${idx + 1}</span>
                          </div>
                          <p class="font-body text-lg font-bold leading-relaxed text-black dark:text-white">${boldNumbers(escapeHtml(challenge))}</p>
                        </div>
                      </div>

                      <!-- Right Column: Solution -->
                      ${solution ? `
                      <div class="flex-1 p-8 bg-primary/5 dark:bg-primary/5 flex flex-col justify-between">
                        <div>
                          <div class="flex items-center gap-2 mb-4">
                            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                            <span class="font-code text-xs font-bold uppercase tracking-widest text-emerald-500">ENGINEERING RESOLUTION</span>
                          </div>
                          <p class="font-body text-base leading-relaxed text-on-surface dark:text-on-surface-variant">${boldNumbers(escapeHtml(solution))}</p>
                        </div>
                      </div>
                      ` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- System Architecture (At the bottom, with link edges) -->
            ${project.details.architecture ? `
              <div class="mb-12">
                <h2 class="font-headline text-2xl font-black uppercase text-primary dark:text-primary mb-4">System Architecture</h2>
                <div class="flex flex-col gap-4">
                  ${typeof project.details.architecture === 'object' ? `
                    <p class="font-code text-sm font-bold uppercase tracking-wider text-secondary dark:text-secondary bg-surface-container dark:bg-surface-container-low px-4 py-2 border-l-4 border-primary dark:border-accent">
                      Pattern: ${escapeHtml(project.details.architecture.pattern)}
                    </p>
                    <div class="flex flex-col lg:flex-row items-center lg:items-stretch gap-4">
                      ${project.details.architecture.layers.map((layer, index) => `
                        ${index > 0 ? `
                          <div class="flex items-center justify-center text-primary dark:text-primary shrink-0 py-2 lg:py-0 self-center">
                            <!-- Link line between cards -->
                            <div class="hidden lg:block h-[3px] bg-primary dark:bg-outline-variant w-6 shrink-0"></div>
                            <div class="lg:hidden w-[3px] bg-primary dark:bg-outline-variant h-6 shrink-0"></div>
                          </div>
                        ` : ''}
                        <div class="details-card flex-1 border-2 border-primary dark:border-outline-variant p-6 bg-surface-container-lowest dark:bg-surface-container-low/50 rounded-none shadow-[4px_4px_0px_0px_var(--color-primary)] dark:shadow-[4px_4px_0px_0px_var(--color-outline)] w-full">
                          <h4 class="font-headline text-base font-black uppercase text-primary dark:text-primary mb-3 flex items-center gap-2">
                            <span class="font-code text-xs px-2 py-0.5 bg-primary/10 text-primary dark:bg-accent/10 dark:text-accent-light border border-primary/20 dark:border-accent/20">0${index + 1}</span>
                            ${escapeHtml(layer.name)}
                          </h4>
                          <p class="font-body text-sm text-black dark:text-white leading-relaxed">${escapeHtml(layer.details)}</p>
                        </div>
                      `).join('')}
                    </div>
                  ` : `
                    <p class="font-code text-sm uppercase tracking-wider text-secondary dark:text-secondary">${escapeHtml(project.details.architecture)}</p>
                  `}
                </div>
              </div>
            ` : ''}

            <!-- Notes -->
            ${project.details.notes && project.details.notes.length > 0 ? `
            <div class="mb-12">
              <h2 class="font-headline text-2xl font-black uppercase text-primary dark:text-primary mb-4">Implementation Notes</h2>
              <ul class="flex flex-col gap-3 font-body text-base text-on-surface-variant dark:text-on-surface-variant">
                ${project.details.notes.map(note => `
                  <li class="flex items-start gap-2">
                    <span class="material-symbols-outlined text-primary dark:text-primary text-sm mt-1">info</span>
                    <span>${escapeHtml(note)}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
            ` : ''}
        </div>
      `;
      
      // Bind click listeners to interactive console tabs
      const tabBtns = detailsView.querySelectorAll('.module-tab-btn');
      const consoleDetails = detailsView.querySelectorAll('.module-console-detail');
      
      tabBtns.forEach((btn, idx) => {
        btn.addEventListener('click', () => {
          // Deactivate all tabs (remove active styling and set to flex-none)
          tabBtns.forEach(b => {
            b.classList.remove('bg-primary/10', 'dark:bg-primary/10', 'flex-1');
            b.classList.add('flex-none');
            const indicator = b.querySelector('.active-indicator');
            if (indicator) {
              indicator.classList.remove('opacity-100');
              indicator.classList.add('opacity-0');
            }
          });
          // Hide all details (opacity 0, z-index 0, block clicks)
          consoleDetails.forEach(d => {
            d.classList.remove('opacity-100', 'z-10');
            d.classList.add('opacity-0', 'z-0', 'pointer-events-none');
          });
          
          // Activate clicked tab (set to flex-1 and add active styling)
          btn.classList.remove('flex-none');
          btn.classList.add('bg-primary/10', 'dark:bg-primary/10', 'flex-1');
          const indicator = btn.querySelector('.active-indicator');
          if (indicator) {
            indicator.classList.remove('opacity-0');
            indicator.classList.add('opacity-100');
          }
          
          // Fade in corresponding detail (opacity 100, z-index 10, enable clicks)
          const detail = detailsView.querySelector(`.module-console-detail[data-index="${idx}"]`);
          if (detail) {
            detail.classList.remove('opacity-0', 'z-0', 'pointer-events-none');
            detail.classList.add('opacity-100', 'z-10');
          }
        });
      });

      // Bind Watch Demo click
      const openDemoBtn = detailsView.querySelector('#open-demo-btn');
      if (openDemoBtn) {
        openDemoBtn.addEventListener('click', () => {
          openDemoDrawer(project);
        });
      }

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
    // Show main sections (except dashboard — it's a separate page)
    const mainSections = document.querySelectorAll('main > section:not(#project-details-view):not(#dashboard)');
    mainSections.forEach(section => {
      section.classList.remove('hidden');
    });

    // Hide dashboard (separate page) and destroy all dashboard resources
    const dashboardSection = document.getElementById('dashboard');
    if (dashboardSection) {
      dashboardSection.classList.add('hidden');
    }
    destroyDashboard();

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

  // 2. Scroll depth tracking at 50% and 90%
  const scrollThresholds = [50, 90];

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (docHeight <= 0) return;
    const scrollPercent = (scrollTop / docHeight) * 100;

    for (const threshold of scrollThresholds) {
      if (scrollPercent >= threshold && !scrollReached.has(threshold)) {
        scrollReached.add(threshold);
        trackEvent('scroll_depth', { percent: threshold });
      }
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
  setupPortfolioChatbot(portfolioConfig);
  setupRouter();
  setupTracking();
  getTracker().init();
});

const PROMETHEUS = `${BACKEND_URL}/api/v1/telemetry`;
let prometheusOffline = false;

// Mock database results generator for Prometheus offline/sandbox mode
function getMockQueryResult(query) {
  const nowSec = Math.floor(Date.now() / 1000);
  if (query.includes('chatbot_queries_total') && query.includes('by (category)')) {
    return [
      { metric: { category: 'RAG Retrieval' }, value: [nowSec, '342'] },
      { metric: { category: 'General Info' }, value: [nowSec, '215'] },
      { metric: { category: 'Skills Audit' }, value: [nowSec, '188'] },
      { metric: { category: 'Project Detail' }, value: [nowSec, '294'] },
      { metric: { category: 'Chitchat' }, value: [nowSec, '87'] }
    ];
  }
  if (query.includes('chatbot_queries_total')) {
    return [{ value: [nowSec, '1126'] }];
  }
  if (query.includes('chatbot_cost_usd_total') && !query.includes('rate(')) {
    return [{ value: [nowSec, '12.47'] }];
  }
  if (query.includes('chatbot_cost_usd_total') && query.includes('rate(')) {
    return [{ value: [nowSec, '0.52'] }];
  }
  if (query.includes('cache_hits_total')) {
    return [{ value: [nowSec, '847'] }];
  }
  if (query.includes('cache_misses_total')) {
    return [{ value: [nowSec, '279'] }];
  }
  if (query.includes('api_requests_total') && query.includes('by (endpoint)')) {
    return [
      { metric: { endpoint: '/api/v1/chat' }, value: [nowSec, '1126'] },
      { metric: { endpoint: '/api/v1/track' }, value: [nowSec, '3482'] },
      { metric: { endpoint: '/api/v1/health' }, value: [nowSec, '829'] },
      { metric: { endpoint: '/api/v1/projects' }, value: [nowSec, '512'] }
    ];
  }
  if (query.includes('api_requests_total') && query.includes('by (status)')) {
    return [
      { metric: { status: '200' }, value: [nowSec, '5624'] },
      { metric: { status: '201' }, value: [nowSec, '210'] },
      { metric: { status: '400' }, value: [nowSec, '12'] },
      { metric: { status: '500' }, value: [nowSec, '3'] }
    ];
  }
  if (query.includes('project_case_study_views_total') || query.includes('project_view_total')) {
    return [
      { metric: { project: 'edurag' }, value: [nowSec, '248'] },
      { metric: { project: 'movie-ticket' }, value: [nowSec, '142'] },
      { metric: { project: 'attendance-app' }, value: [nowSec, '95'] }
    ];
  }
  if (query.includes('scroll_depth_reached_bucket') || query.includes('scroll_depth_total')) {
    return [
      { metric: { depth_percentile: '50', depth: '50' }, value: [nowSec, '420'] },
      { metric: { depth_percentile: '90', depth: '90' }, value: [nowSec, '195'] }
    ];
  }
  if (query.includes('api_request_duration_seconds_bucket') || query.includes('histogram_quantile')) {
    const isP99 = query.includes('0.99');
    const isP95 = query.includes('0.95');
    const val = isP99 ? '1.85' : (isP95 ? '1.24' : '0.45');
    return [{ value: [nowSec, val] }];
  }
  if (query.includes('api_requests_total')) {
    return [{ value: [nowSec, '5849'] }];
  }
  return [];
}

function getMockRangeResult(query) {
  const points = 12; 
  const result = [];
  const now = Math.floor(Date.now() / 1000);
  
  if (query.includes('api_requests_total')) {
    const values = [];
    for (let i = points - 1; i >= 0; i--) {
      const time = now - i * 300;
      const rate = 15 + Math.sin(i / 2) * 8 + Math.random() * 4;
      values.push([time, rate.toString()]);
    }
    result.push({ metric: {}, values });
  } else if (query.includes('api_request_duration_seconds_bucket')) {
    const isP95 = query.includes('0.95');
    const values = [];
    for (let i = points - 1; i >= 0; i--) {
      const time = now - i * 300;
      const base = isP95 ? 0.18 : 0.04;
      const val = base + Math.random() * (isP95 ? 0.05 : 0.015);
      values.push([time, val.toString()]);
    }
    result.push({ metric: {}, values });
  } else if (query.includes('chatbot_llm_duration_seconds')) {
    const values = [];
    for (let i = points - 1; i >= 0; i--) {
      const time = now - i * 300;
      const val = 1.6 + Math.sin(i / 3) * 0.3 + Math.random() * 0.4;
      values.push([time, val.toString()]);
    }
    result.push({ metric: {}, values });
  } else if (query.includes('chatbot_input_tokens_total')) {
    const values = [];
    for (let i = points - 1; i >= 0; i--) {
      const time = now - i * 300;
      const val = 12000 + Math.sin(i / 2) * 3000 + Math.random() * 1000;
      values.push([time, val.toString()]);
    }
    result.push({ metric: {}, values });
  } else if (query.includes('chatbot_output_tokens_total')) {
    const values = [];
    for (let i = points - 1; i >= 0; i--) {
      const time = now - i * 300;
      const val = 8000 + Math.sin(i / 2.5) * 2000 + Math.random() * 800;
      values.push([time, val.toString()]);
    }
    result.push({ metric: {}, values });
  }
  return result;
}

function updateConnectionStatus(isOnline) {
  const badge = document.getElementById('prometheus-badge');
  const pulse = document.getElementById('prometheus-pulse');
  const text = document.getElementById('prometheus-status-text');
  if (!badge) return;

  if (isOnline) {
    badge.className = 'skill-tag px-3 py-1.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-sm font-medium inline-flex items-center gap-1.5';
    if (pulse) pulse.className = 'w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse';
    if (text) text.textContent = 'Prometheus Live Connected';
  } else {
    badge.className = 'skill-tag px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-sm font-medium inline-flex items-center gap-1.5';
    if (pulse) pulse.className = 'w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse';
    if (text) text.textContent = 'Telemetry Simulated (Sandbox)';
  }
}

async function promQuery(query) {
  try {
    const res = await fetch(`${PROMETHEUS}/query?query=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Prometheus response error');
    const json = await res.json();
    prometheusOffline = false;
    updateConnectionStatus(true);
    return json.data?.result || [];
  } catch (err) {
    prometheusOffline = true;
    updateConnectionStatus(false);
    return getMockQueryResult(query);
  }
}

async function promRange(query, step = '5m') {
  try {
    const res = await fetch(`${PROMETHEUS}/query_range?query=${encodeURIComponent(query)}&start=${Math.floor(Date.now()/1000)-3600}&end=${Math.floor(Date.now()/1000)}&step=${step}`);
    if (!res.ok) throw new Error('Prometheus response error');
    const json = await res.json();
    prometheusOffline = false;
    updateConnectionStatus(true);
    return json.data?.result || [];
  } catch (err) {
    prometheusOffline = true;
    updateConnectionStatus(false);
    return getMockRangeResult(query);
  }
}

// Expose on window for dashboard section modules
window.promQuery = promQuery;
window.promRange = promRange;

function chartColors() {
  const isDark = document.documentElement.classList.contains('dark');
  const primary = isDark ? '#cebdff' : '#3730a3';
  const secondary = isDark ? '#a4c9ff' : '#6366f1';
  const tertiary = isDark ? '#c4c1fb' : '#4f46e5';
  const text = isDark ? '#e0e3e5' : '#1e1b4b';
  const grid = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(30,27,75,0.06)';
  
  return {
    text,
    grid,
    primary,
    primaryAlpha: isDark ? 'rgba(206,189,255,0.12)' : 'rgba(55,48,163,0.08)',
    secondary,
    secondaryAlpha: isDark ? 'rgba(164,201,255,0.12)' : 'rgba(99,102,241,0.08)',
    tertiary,
    tertiaryAlpha: isDark ? 'rgba(196,193,251,0.12)' : 'rgba(79,70,229,0.08)',
    green: '#22c55e',
    greenAlpha: 'rgba(34,197,94,0.12)',
    amber: '#f59e0b',
    amberAlpha: 'rgba(245,158,11,0.12)',
    rose: '#f43f5e',
    roseAlpha: 'rgba(244,63,94,0.12)',
    cyan: '#06b6d4',
    cyanAlpha: 'rgba(6,182,212,0.12)'
  };
}

window.myCharts = window.myCharts || {};

function safeRenderChart(canvasId, config) {
  if (window.myCharts[canvasId]) {
    window.myCharts[canvasId].destroy();
  }
  const el = document.getElementById(canvasId);
  if (el) {
    window.myCharts[canvasId] = new Chart(el, config);
  }
}

// Expose tracking verification test helper to browser window console
window.testTracking = function() {
  console.log("🚀 [Tracker Test] Simulating Portfolio Activity Events...");
  
  // 1. Simulating Project Views
  console.log("   👉 Simulating project clicks: 'edurag' and 'movie-ticket'...");
  window.trackEvent('project_click', { project_id: 'edurag' });
  window.trackEvent('project_click', { project_id: 'movie-ticket' });
  
  // 2. Simulating Scroll Depths
  console.log("   👉 Simulating page scrolls: 50% and 90%...");
  window.trackEvent('scroll_depth', { percent: 50 });
  window.trackEvent('scroll_depth', { percent: 90 });
  
  // 3. Simulating Resume Download
  console.log("   👉 Simulating resume downloads...");
  window.trackEvent('resume_download', { session_id: sessionStorage.getItem('portfolio_session_id') });

  // 4. Force Flush Event Queue Immediately (skipping default 5s buffer)
  import('./modules/tracking/tracker.js').then(({ getTracker }) => {
    const tracker = getTracker();
    if (tracker && typeof tracker.flush === 'function') {
      tracker.flush();
      console.log("✅ [Tracker Test] Successfully flushed event queue to api/v1/track!");
    } else {
      console.warn("⚠️ [Tracker Test] Tracker instance or flush method not found.");
    }
  }).catch(err => {
    console.error("❌ [Tracker Test] Failed to dynamically load tracker module: ", err);
  });
};


function openDemoDrawer(project) {
  let drawer = document.querySelector('.demo-media-drawer');
  let backdrop = document.querySelector('.demo-media-backdrop');

  if (!drawer) {
    drawer = document.createElement('div');
    drawer.className = 'demo-media-drawer fixed inset-y-0 right-0 z-50 w-full sm:max-w-2xl bg-surface-container dark:bg-background border-l-2 border-primary p-6 shadow-2xl transform translate-x-full transition-transform duration-300 ease-in-out flex flex-col gap-6 overflow-y-auto';
    document.body.appendChild(drawer);
  }

  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'demo-media-backdrop fixed inset-0 bg-black/50 backdrop-blur-sm z-40 hidden opacity-0 transition-opacity duration-300';
    document.body.appendChild(backdrop);

    backdrop.addEventListener('click', closeDemoDrawer);
  }

  const videoHtml = project.demoVideo 
    ? `
      <div class="mb-4">
        <span class="font-code text-xs font-bold uppercase tracking-widest text-secondary mb-2 block">// DEMO VIDEO PLAYBACK</span>
        <div class="border border-outline-variant dark:border-outline rounded-md overflow-hidden bg-black aspect-video relative flex items-center justify-center">
          <video src="${escapeHtml(project.demoVideo)}" controls autoplay loop muted playsinline class="w-full h-full object-contain"></video>
        </div>
      </div>
    `
    : `
      <div class="mb-4 p-8 border-2 border-dashed border-primary/25 rounded-md text-center bg-surface-container-low dark:bg-surface-container-lowest">
        <span class="material-symbols-outlined text-4xl text-primary/40 mb-2">videocam_off</span>
        <p class="font-code text-xs text-on-surface-variant">// NO DEMO VIDEO CONFIGURED</p>
      </div>
    `;

  const screenshotsHtml = project.demoScreenshots && project.demoScreenshots.length > 0
    ? `
      <div>
        <span class="font-code text-xs font-bold uppercase tracking-widest text-secondary mb-3 block">// SCREENSHOT GALLERY</span>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          ${project.demoScreenshots.map((shot, idx) => `
            <div class="group relative border border-outline-variant dark:border-outline rounded-md overflow-hidden bg-surface-container-lowest dark:bg-surface-container-lowest/50 shadow-sm hover:border-primary transition-all">
              <img src="${escapeHtml(shot.url)}" alt="${escapeHtml(shot.label)}" class="demo-screenshot-img w-full aspect-video object-cover cursor-zoom-in hover:scale-105 transition-transform duration-300" data-url="${escapeHtml(shot.url)}">
              <div class="p-2 border-t border-outline-variant/20 bg-surface-container-low dark:bg-surface-container-lowest">
                <span class="font-code text-[10px] text-secondary font-bold">SHOT 0${idx + 1} // ${escapeHtml(shot.label)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `
    : `
      <div class="p-8 border-2 border-dashed border-primary/25 rounded-md text-center bg-surface-container-low dark:bg-surface-container-lowest">
        <span class="material-symbols-outlined text-4xl text-primary/40 mb-2">image_not_supported</span>
        <p class="font-code text-xs text-on-surface-variant">// NO SCREENSHOTS CONFIGURED</p>
      </div>
    `;

  drawer.innerHTML = `
    <div class="flex justify-between items-center border-b border-primary/20 pb-4">
      <div>
        <span class="font-code text-xs font-bold uppercase tracking-widest text-secondary block mb-0.5">/ DEMO CENTER</span>
        <h2 class="font-headline text-lg font-black uppercase text-primary dark:text-white">${escapeHtml(project.title)}</h2>
      </div>
      <button class="close-demo-btn font-code text-xs font-bold bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 border border-primary/30 cursor-pointer">
        [ CLOSE ]
      </button>
    </div>
    <div class="flex-1 flex flex-col gap-6">
      ${videoHtml}
      ${screenshotsHtml}
    </div>
  `;

  drawer.querySelector('.close-demo-btn').addEventListener('click', closeDemoDrawer);

  // Bind click listener for screenshots to open lightbox overlay
  drawer.querySelectorAll('.demo-screenshot-img').forEach(img => {
    img.addEventListener('click', () => {
      openLightbox(img.getAttribute('data-url'));
    });
  });

  // Slide in
  drawer.classList.remove('translate-x-full');
  backdrop.classList.remove('hidden');
  requestAnimationFrame(() => {
    backdrop.classList.add('opacity-100');
  });
}

function closeDemoDrawer() {
  const drawer = document.querySelector('.demo-media-drawer');
  const backdrop = document.querySelector('.demo-media-backdrop');

  if (drawer) {
    // Pause any playing videos to stop audio in background
    const video = drawer.querySelector('video');
    if (video) video.pause();
    
    drawer.classList.add('translate-x-full');
  }

  if (backdrop) {
    backdrop.classList.remove('opacity-100');
    setTimeout(() => {
      backdrop.classList.add('hidden');
    }, 300);
  }
}

function openLightbox(src) {
  let lightbox = document.querySelector('.demo-lightbox');
  if (!lightbox) {
    lightbox = document.createElement('div');
    lightbox.className = 'demo-lightbox fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center cursor-zoom-out opacity-0 transition-opacity duration-300';
    lightbox.innerHTML = `
      <img class="max-w-[90%] max-h-[90%] object-contain border-2 border-primary/50 shadow-2xl transform scale-95 transition-transform duration-300" src="">
      <button class="absolute top-6 right-6 font-code text-xs font-bold bg-primary/20 text-primary px-3 py-1.5 border border-primary/30 cursor-pointer">[ CLOSE ]</button>
    `;
    document.body.appendChild(lightbox);
    
    const closeLightbox = () => {
      lightbox.classList.add('opacity-0');
      lightbox.querySelector('img').classList.add('scale-95');
      setTimeout(() => {
        lightbox.remove();
      }, 300);
    };
    
    lightbox.addEventListener('click', closeLightbox);
  }
  
  lightbox.querySelector('img').src = src;
  
  // Show lightbox with animation
  requestAnimationFrame(() => {
    lightbox.classList.remove('opacity-0');
    lightbox.classList.add('opacity-100');
    setTimeout(() => {
      lightbox.querySelector('img').classList.remove('scale-95');
      lightbox.querySelector('img').classList.add('scale-100');
    }, 50);
  });
}

