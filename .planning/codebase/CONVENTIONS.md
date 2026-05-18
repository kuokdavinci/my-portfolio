# Coding Conventions

**Analysis Date:** 2026-05-18

## Overview

This is a static portfolio site built with Vite, Tailwind CSS v4, and vanilla JavaScript. All application logic lives in a single JS file, all styles in a single CSS file, and content configuration is separated into its own module. No linting, formatting, or type-checking tools are configured.

---

## JavaScript Conventions

### File Organization

- **All application logic** lives in `src/main.js` (629 lines)
- **Configuration data** is separated in `src/data/portfolio-config.js` (286 lines)
- **CSS** is in `src/style.css` (650 lines)
- No barrel files, no module splitting beyond the config separation

### Naming Conventions

**Functions:** camelCase, descriptive verb-noun or verb-object pattern
```javascript
// Initialization functions
function initTheme() { ... }
function setupThemeToggle() { ... }
function setupMobileMenu() { ... }
function setupScrollReveal() { ... }
function setupTypingEffect() { ... }
function setupContactForm() { ... }
function setupProjectFilters() { ... }
function setupPortfolioChatbot() { ... }

// Utility functions
function escapeHtml(value) { ... }
function normalizeText(value) { ... }
function tokenize(value) { ... }

// RAG chatbot functions
function buildKnowledgeBase(config) { ... }
function retrieveKnowledge(question, knowledgeBase) { ... }
function generateChatbotAnswer(question, knowledgeBase) { ... }

// UI helpers
function showToast(message, type = 'success') { ... }
function animateCounters() { ... }
function addChatMessage(container, role, content, sources = []) { ... }
```

**Variables:** camelCase
```javascript
const currentTheme = localStorage.getItem('theme');
const isDark = document.documentElement.classList.contains('dark');
const knowledgeBase = buildKnowledgeBase(portfolioConfig);
```

**Constants:** camelCase (no UPPER_CASE convention observed)
```javascript
const stopWords = new Set([...]);
```

### Code Organization Pattern

**Single entry point** via `DOMContentLoaded`:
```javascript
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupThemeToggle();
  setupMobileMenu();
  setupScrollReveal();
  setupTypingEffect();
  animateCounters();
  setupProjectFilters();
  setupPortfolioChatbot();
});
```

**Module imports:** ES module syntax at top of file
```javascript
import './style.css';
import { portfolioConfig } from './data/portfolio-config.js';
```

**Global exposure:** Config exposed on `window` for runtime access
```javascript
window.portfolioConfig = portfolioConfig;
```

### Function Design

- **No JSDoc or inline comments** — functions are self-documenting through naming
- **Default parameters** used where appropriate: `function showToast(message, type = 'success')`
- **Nested helper functions** defined inside parent functions (e.g., `openDrawer`/`closeDrawer` inside `setupMobileMenu`, `type` inside `setupTypingEffect`)
- **Pure utility functions** at module level: `escapeHtml`, `normalizeText`, `tokenize`

### DOM Manipulation

**Selection pattern:** `querySelector` / `querySelectorAll` throughout
```javascript
const toggle = document.getElementById('themeToggle');
const form = document.querySelector('form');
const counters = document.querySelectorAll('.counter');
```

**Event attachment:** Direct `addEventListener` on elements (no event delegation)
```javascript
toggle.addEventListener('click', (e) => {
  e.preventDefault();
  toggleTheme();
});

filterButtons.forEach(btn => {
  btn.addEventListener('click', () => { ... });
});
```

**Dynamic element creation:** `document.createElement` + `innerHTML` with template literals
```javascript
const toast = document.createElement('div');
toast.className = `toast-notification fixed bottom-6 ...`;
toast.innerHTML = `
  <span class="material-symbols-outlined">${icon}</span>
  <p class="font-body text-sm">${message}</p>
`;
document.body.appendChild(toast);
```

### Error Handling

**Try/catch for async operations:**
```javascript
try {
  const response = await fetch(form.action, { ... });
  if (response.ok) {
    showToast('Message sent successfully!', 'success');
    form.reset();
  } else {
    throw new Error('Form submission failed');
  }
} catch (error) {
  console.error(error);
  showToast('Failed to send message. Please try again.', 'error');
} finally {
  submitBtn.disabled = false;
  submitBtn.innerHTML = originalText;
}
```

**Guard clauses for missing elements:**
```javascript
const form = document.querySelector('form');
if (!form) return;

const toggle = document.getElementById('themeToggle');
if (toggle) { ... }
```

### Security Patterns

**HTML escaping for user-generated content** (chatbot):
```javascript
function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}

// Usage in chatbot
message.innerHTML = `
  <div class="rag-chat-bubble">
    <p>${escapeHtml(content)}</p>
    ${sourceMarkup}
  </div>
`;
```

**Text normalization for chatbot tokenization:**
```javascript
function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9+#.\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
```

---

## CSS / Tailwind Conventions

### Architecture

**Tailwind CSS v4** with `@import "tailwindcss"` syntax (not v3's `@tailwind` directives).

**Layered structure:**
```css
@import "tailwindcss";

@variant dark (&:where(.dark, .dark *));

@theme { ... }           /* Custom design tokens */

@layer base { ... }      /* Global resets and base styles */
@layer components { ... } /* Reusable component classes */
@layer utilities { ... }  /* Utility classes */
```

### Custom Theme Tokens

**Color system** inspired by Material Design 3 roles in `src/style.css`:
```css
@theme {
  --color-primary: #061449;
  --color-on-primary: #ffffff;
  --color-primary-container: #1e2a5e;
  --color-on-primary-container: #8793cd;
  --color-secondary: #725765;
  --color-secondary-container: #fad6e7;
  --color-surface: #f7f9fb;
  --color-on-surface: #191c1e;
  --color-outline: #767680;
  --color-outline-variant: #c6c5d1;
  /* ... 40+ color tokens */
}
```

**Font families:**
```css
--font-sans: "Inter", system-ui, -apple-system, sans-serif;
--font-headline: "Geist", "Inter", sans-serif;
--font-code: "JetBrains Mono", "Fira Code", monospace;
```

**Utility classes for fonts** in `@layer utilities`:
```css
.font-headline { font-family: "Geist", "Inter", sans-serif; }
.font-body { font-family: "Inter", system-ui, -apple-system, sans-serif; }
.font-code { font-family: "JetBrains Mono", "Fira Code", monospace; }
```

### Dark Mode Pattern

**Class-based dark mode** via `.dark` class on `<html>`:
```css
@variant dark (&:where(.dark, .dark *));

/* Dark mode overrides outside @theme */
.dark {
  --color-background: #091a2d;
  --color-on-background: #eff1f3;
  --color-surface: #122136;
  /* ... more overrides */
}
```

**Tailwind `dark:` prefix** used in HTML/JS for conditional styling:
```html
class="bg-surface/90 dark:bg-background/90"
class="text-on-surface dark:text-on-background"
```

**Contextual dark overrides** for specific component combinations:
```css
.dark .gradient-hero .text-gradient {
  background: linear-gradient(135deg, #ffffff 0%, #f0c4dc 50%, #a5b3e0 100%);
}
.dark .bg-secondary-container {
  background-color: #a5b3e0;
}
```

### Component Class Naming

**BEM-like naming** for custom components (in `@layer components`):
```css
/* iOS Toggle */
.ios-toggle { ... }
.ios-toggle::after { ... }
.ios-toggle.active { ... }
.ios-toggle.active::after { ... }

/* RAG Chatbot */
.rag-chatbot { ... }
.rag-chat-toggle { ... }
.rag-chat-toggle-text { ... }
.rag-chat-panel { ... }
.rag-chat-header { ... }
.rag-chat-kicker { ... }
.rag-chat-close { ... }
.rag-chat-messages { ... }
.rag-chat-message { ... }
.rag-chat-message.is-user { ... }
.rag-chat-message.is-bot { ... }
.rag-chat-bubble { ... }
.rag-chat-sources { ... }
.rag-chat-prompts { ... }
.rag-chat-form { ... }
```

**Modifier pattern:** `.is-user`, `.is-bot`, `.active`, `.visible`

**Reusable component classes:**
```css
.gradient-hero { ... }
.glass { ... }
.card-hover { ... }
.btn-primary { ... }
.btn-outline { ... }
.badge { ... }
.badge-primary { ... }
.badge-secondary { ... }
.section-title { ... }
.section-subtitle { ... }
```

### Animation Patterns

**Custom keyframes** in `@layer components`:
```css
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}
```

**Scroll reveal pattern:**
```css
.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
```

**Staggered children animation** (hardcoded up to 8 children):
```css
.stagger-children > * {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.stagger-children.visible > *:nth-child(1) { transition-delay: 0.1s; opacity: 1; transform: translateY(0); }
.stagger-children.visible > *:nth-child(2) { transition-delay: 0.2s; opacity: 1; transform: translateY(0); }
/* ... up to child 8 */
```

### Responsive Breakpoints

**Tailwind prefixes** used throughout HTML:
- `md:` — 768px (tablet)
- `lg:` — 1024px (desktop)

**Custom media query** for chatbot mobile adjustments:
```css
@media (max-width: 640px) {
  .rag-chatbot { right: 0.75rem; bottom: 0.75rem; }
  .rag-chat-toggle { width: 3.25rem; padding: 0; }
  .rag-chat-toggle-text { display: none; }
  .rag-chat-panel { width: calc(100vw - 1.5rem); }
}
```

---

## HTML Conventions

### Semantic Structure

**Semantic HTML5 elements** used throughout `index.html`:
```html
<header>...</header>
<nav>...</nav>
<main class="flex-grow">
  <section id="home">...</section>
  <section id="journey">...</section>
  <section id="projects">...</section>
  <section id="skills">...</section>
</main>
<footer>...</footer>
```

**Article elements** for project cards:
```html
<article class="bg-primary rounded-xl overflow-hidden shadow-md card-hover h-full text-on-primary">
  <h3 class="font-headline text-2xl font-bold">...</h3>
  <p>...</p>
</article>
```

### Accessibility Patterns

**ARIA attributes:**
```html
<button aria-label="Toggle theme">...</button>
<button aria-expanded="false" aria-controls="portfolio-chat-panel">...</button>
<button aria-label="Close chatbot">...</button>
<div aria-live="polite">...</div>
<label class="sr-only" for="rag-chat-input">Ask a question</label>
```

**Screen reader only class:**
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

**External link safety:**
```html
<a href="https://github.com/kuokdavinci" target="_blank" rel="noopener">...</a>
```

### Tailwind Usage Pattern

**Utility-first approach** — Tailwind classes applied directly in HTML:
```html
<div class="max-w-7xl mx-auto px-4 md:px-12 py-20 md:py-28 relative z-10">
  <div class="grid md:grid-cols-2 gap-16 items-center">
    <div class="space-y-6 reveal">
```

**Custom class + utilities combination:**
```html
<h2 class="section-title">My Journey</h2>
<p class="section-subtitle mx-auto">A timeline of my growth.</p>
```

**State-based utilities:**
```html
class="hover:text-primary transition-colors"
class="group-hover:opacity-80 transition-colors"
class="active:scale-95"
```

---

## Configuration Pattern

### Single Config Object Export

**Location:** `src/data/portfolio-config.js`

**Pattern:** Single exported `const` with nested object structure:
```javascript
export const portfolioConfig = {
  personalInfo: { ... },
  projects: [ ... ],
  experience: [ ... ],
  competencies: [ ... ],
  techStack: [ ... ],
  languages: [ ... ],
  contact: { ... }
};
```

**Consistent indentation:** 2 spaces throughout

**Data types:**
- Strings for text content
- Arrays for lists (projects, experience, techStack)
- Nested objects for grouped data (personalInfo, contact)
- Booleans for flags (featured)

### Config Consumption

**Imported in** `src/main.js`:
```javascript
import { portfolioConfig } from './data/portfolio-config.js';
window.portfolioConfig = portfolioConfig;
```

**Used by RAG chatbot** to build knowledge base:
```javascript
const knowledgeBase = buildKnowledgeBase(portfolioConfig);
```

---

## Comments

**No comments** exist in any source file (`src/main.js`, `src/style.css`, `src/data/portfolio-config.js`, `index.html`). Functions rely on descriptive naming for self-documentation.

---

## Import Organization

**Order in `src/main.js`:**
1. CSS import: `import './style.css';`
2. Data import: `import { portfolioConfig } from './data/portfolio-config.js';`
3. Global assignment: `window.portfolioConfig = portfolioConfig;`
4. All function definitions
5. DOMContentLoaded initialization block

---

*Convention analysis: 2026-05-18*
