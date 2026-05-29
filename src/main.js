import './style.css';
import './modules/chatbot/chatbot.css';
import { portfolioConfig } from './data/portfolio-config.js';
import { setupPortfolioChatbot } from './modules/chatbot/chatbot-ui.js';

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
          <div class="flex flex-col md:flex-row justify-between items-start md:items-end border-b-8 border-primary dark:border-outline-variant pb-6 mb-12 gap-4">
            <div>
              <span class="font-code text-sm font-bold uppercase tracking-widest text-secondary dark:text-secondary mb-2 block">Project Case Study</span>
              <h1 class="font-headline text-4xl md:text-7xl font-black uppercase text-primary dark:text-on-background leading-none">${escapeHtml(project.title)}</h1>
              ${project.duration ? `<p class="font-code text-sm font-bold uppercase tracking-wider text-primary dark:text-primary mt-2 inline-flex items-center gap-1.5 bg-primary/10 dark:bg-primary/10 px-3 py-1.5 border border-primary/30 dark:border-primary/30"><span class="material-symbols-outlined text-base text-primary dark:text-primary">event</span> ${escapeHtml(project.duration)}</p>` : ''}
            </div>
            <a href="${escapeHtml(project.codeLink)}" target="_blank" rel="noopener" class="btn-sourcecode font-code text-sm font-bold bg-primary text-on-primary dark:bg-primary dark:text-on-primary px-6 py-3 border-2 border-primary dark:border-primary hover:bg-transparent hover:text-primary dark:hover:text-primary transition-all rounded-none inline-flex items-center gap-2 cursor-pointer shadow-[4px_4px_0px_0px_var(--color-primary)] dark:shadow-[4px_4px_0px_0px_var(--color-outline)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_var(--color-primary)] dark:hover:shadow-[6px_6px_0px_0px_var(--color-outline)] active:translate-x-0 active:translate-y-0 active:shadow-[4px_4px_0px_0px_var(--color-primary)]">
              <span class="material-symbols-outlined text-base !text-inherit">code</span> Source Code <span class="material-symbols-outlined text-sm !text-inherit">open_in_new</span>
            </a>
          </div>

          <!-- Tech Stack Row (Horizontal, above Core Features) -->
          ${project.details && project.details.systemSpecs ? `
          <div class="mb-12">
            <h2 class="font-headline text-2xl font-black uppercase text-primary dark:text-primary mb-4">Technology Stack</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              ${Object.entries(project.details.systemSpecs).map(([key, val]) => `
                <div class="details-card border-2 border-primary dark:border-outline-variant p-4 bg-surface-container dark:bg-surface-container-low rounded-none shadow-[4px_4px_0px_0px_var(--color-primary)] dark:shadow-[4px_4px_0px_0px_var(--color-outline)]">
                  <span class="font-code text-xs font-bold uppercase tracking-wider text-secondary dark:text-secondary mb-1 block">${escapeHtml(key)}</span>
                  <span class="font-body text-sm font-semibold text-on-surface dark:text-on-surface-variant">${escapeHtml(val)}</span>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Overview Section (Pushed to the top) -->
          <div class="mb-12">
            <h2 class="font-headline text-2xl font-black uppercase text-primary dark:text-primary mb-4">Project Overview</h2>
            <p class="font-body text-lg leading-relaxed text-black dark:text-white">${escapeHtml(project.details.overview || project.details.longDescription || project.description)}</p>
          </div>

          <!-- Core Modules -->
          ${project.details.keyModules && project.details.keyModules.length > 0 ? `
          <div class="mb-12">
            <h2 class="font-headline text-2xl font-black uppercase text-primary dark:text-primary mb-4">Core Modules</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <!-- Left Column (Even Indices) -->
              <div class="flex flex-col gap-4">
                ${project.details.keyModules.filter((_, idx) => idx % 2 === 0).map(module => {
                  const isObj = typeof module === 'object';
                  const name = isObj ? module.name : module;
                  const icon = isObj ? module.icon : '';
                  const details = isObj ? module.details : '';
                  return `
                    <div class="module-accordion-item details-card border-2 border-primary dark:border-outline-variant p-4 bg-surface-container dark:bg-surface-container-low rounded-none shadow-[4px_4px_0px_0px_var(--color-primary)] dark:shadow-[4px_4px_0px_0px_var(--color-outline)] cursor-pointer flex flex-col">
                      <div class="flex justify-between items-center w-full">
                        <div class="flex items-center">
                          ${icon ? `<span class="material-symbols-outlined text-primary dark:text-primary mr-2 text-xl">${escapeHtml(icon)}</span>` : ''}
                          <h4 class="font-headline text-base font-black uppercase text-primary dark:text-primary">${escapeHtml(name)}</h4>
                        </div>
                        ${details ? `<span class="expand-icon material-symbols-outlined text-primary dark:text-primary transition-transform duration-300">chevron_right</span>` : ''}
                      </div>
                      ${details ? `
                        <div class="module-details mt-3 pt-3 border-t border-outline-variant/20 font-body text-sm font-medium text-black dark:text-white leading-relaxed">
                          ${escapeHtml(details)}
                        </div>
                      ` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
              <!-- Right Column (Odd Indices) -->
              <div class="flex flex-col gap-4">
                ${project.details.keyModules.filter((_, idx) => idx % 2 !== 0).map(module => {
                  const isObj = typeof module === 'object';
                  const name = isObj ? module.name : module;
                  const icon = isObj ? module.icon : '';
                  const details = isObj ? module.details : '';
                  return `
                    <div class="module-accordion-item details-card border-2 border-primary dark:border-outline-variant p-4 bg-surface-container dark:bg-surface-container-low rounded-none shadow-[4px_4px_0px_0px_var(--color-primary)] dark:shadow-[4px_4px_0px_0px_var(--color-outline)] cursor-pointer flex flex-col">
                      <div class="flex justify-between items-center w-full">
                        <div class="flex items-center">
                          ${icon ? `<span class="material-symbols-outlined text-primary dark:text-primary mr-2 text-xl">${escapeHtml(icon)}</span>` : ''}
                          <h4 class="font-headline text-base font-black uppercase text-primary dark:text-primary">${escapeHtml(name)}</h4>
                        </div>
                        ${details ? `<span class="expand-icon material-symbols-outlined text-primary dark:text-primary transition-transform duration-300">chevron_right</span>` : ''}
                      </div>
                      ${details ? `
                        <div class="module-details mt-3 pt-3 border-t border-outline-variant/20 font-body text-sm font-medium text-black dark:text-white leading-relaxed">
                          ${escapeHtml(details)}
                        </div>
                      ` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
          ` : ''}

            <!-- Challenges & Solutions (Paired Neobrutalist Cards) -->
            <div class="mb-12">
              <h2 class="font-headline text-2xl font-black uppercase text-primary dark:text-primary mb-4">Challenges & Solutions</h2>
              <div class="grid grid-cols-1 gap-4">
                ${project.details.challenges.map((challenge, idx) => {
                  const solution = project.details.solutions[idx] || '';
                  return `
                    <div class="details-card border-2 border-primary dark:border-outline-variant p-6 bg-surface-container dark:bg-surface-container-low rounded-none shadow-[4px_4px_0px_0px_var(--color-primary)] dark:shadow-[4px_4px_0px_0px_var(--color-outline)] flex flex-col gap-4">
                      <!-- Challenge -->
                      <div class="flex gap-3 items-start border-b border-outline-variant/20 pb-4">
                        <span class="material-symbols-outlined text-rose-500 mt-0.5 icon-filled">error</span>
                        <div>
                          <h4 class="font-code text-sm font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1">Challenge ${idx + 1}</h4>
                          <p class="font-body text-base leading-relaxed text-on-surface dark:text-on-surface-variant">${boldNumbers(escapeHtml(challenge))}</p>
                        </div>
                      </div>
                      <!-- Solution -->
                      ${solution ? `
                      <div class="flex gap-3 items-start pt-2">
                        <span class="material-symbols-outlined text-emerald-500 mt-0.5 icon-filled">check_circle</span>
                        <div>
                          <h4 class="font-code text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">Engineering Solution</h4>
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
      
      // Bind click listeners to accordion modules
      detailsView.querySelectorAll('.module-accordion-item').forEach(item => {
        item.addEventListener('click', () => {
          item.classList.toggle('active');
        });
      });

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
  } else if (hash === '#dashboard') {
    // Hide all main sections except dashboard
    const mainSections = document.querySelectorAll('main > section:not(#project-details-view):not(#dashboard)');
    mainSections.forEach(section => {
      section.classList.add('hidden');
    });

    // Show dashboard section
    const dashboardSection = document.getElementById('dashboard');
    if (dashboardSection) {
      dashboardSection.classList.remove('hidden');
    }

    // Hide project details
    detailsView.classList.add('hidden');

    // Refresh stats on dashboard navigation
    loadPortfolioStats();

    // Track page view
    trackEvent('page_view', { page: 'dashboard' });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });
  } else {
    // Show main sections (except dashboard — it's a separate page)
    const mainSections = document.querySelectorAll('main > section:not(#project-details-view):not(#dashboard)');
    mainSections.forEach(section => {
      section.classList.remove('hidden');
    });

    // Hide dashboard (separate page)
    const dashboardSection = document.getElementById('dashboard');
    if (dashboardSection) {
      dashboardSection.classList.add('hidden');
    }

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
  setupPortfolioChatbot(portfolioConfig);
  setupRouter();
  setupTracking();
  loadPortfolioStats();
});

async function loadPortfolioStats() {
  try {
    const res = await fetch('http://localhost:9090/api/v1/query?query=sum(chatbot_queries_total)');
    const data = await res.json();
    const queries = data?.data?.result?.[0]?.value?.[1] || '0';
    const el = document.getElementById('stat-queries');
    if (el) el.textContent = Math.round(parseFloat(queries));
  } catch {
    const el = document.getElementById('stat-queries');
    if (el) el.textContent = '—';
  }

  try {
    const res = await fetch('http://localhost:9090/api/v1/query?query=count(count(api_requests_total) by (session_id))');
    const data = await res.json();
    const sessions = data?.data?.result?.[0]?.value?.[1] || '0';
    const el = document.getElementById('stat-sessions');
    if (el) el.textContent = Math.round(parseFloat(sessions));
  } catch {
    const el = document.getElementById('stat-sessions');
    if (el) el.textContent = '—';
  }
}
