# Technology Stack

**Analysis Date:** 2026-05-18

## Languages

**Primary:**
- **JavaScript (ES2022+)** - All application logic in `src/main.js` (629 lines), using ES modules (`type: "module"` in `package.json`)
- **HTML5** - Semantic markup in `index.html` (355 lines) with sections: hero, journey, projects, skills, footer
- **CSS3** - Custom styles in `src/style.css` (650 lines) using Tailwind CSS v4 `@theme` directive

## Runtime

**Environment:**
- **Browser** - Client-side only, no server runtime required
- **ES Modules** - Native browser ESM via `<script type="module">` in `index.html`

**Package Manager:**
- **npm** - Standard npm package management
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- **Vite 5.2** - Build tool and dev server, configured in `vite.config.js`
- **Tailwind CSS 4.0** - Utility-first CSS framework with `@tailwindcss/vite` plugin

**Testing:**
- Not configured - no test framework detected

**Build/Dev:**
- **Vite** - `npm run dev` (dev server), `npm run build` (production build), `npm run preview` (preview build)
- **Rollup** - Bundler (used internally by Vite), configured via `rollupOptions` in `vite.config.js`
- **LightningCSS** - CSS transformer (detected in `node_modules`, used by Tailwind v4)

## Key Dependencies

**Critical:**
- `vite` ^5.2.0 - Build tool and dev server
- `tailwindcss` ^4.0.0 - CSS framework
- `@tailwindcss/vite` ^4.0.0 - Vite plugin for Tailwind v4

**Infrastructure:**
- No other runtime dependencies - zero external JS libraries

## CSS Architecture

**Tailwind CSS v4 Approach:**
- Uses new `@import "tailwindcss"` syntax (not `@tailwind` directives)
- Custom `@variant dark (&:where(.dark, .dark *))` for manual dark mode toggle
- `@theme` block in `src/style.css` (lines 5-63) defines all design tokens:
  - **Color system**: Material Design 3-inspired tokens (`--color-primary`, `--color-surface`, `--color-secondary-container`, etc.)
  - **Font tokens**: `--font-sans`, `--font-headline`, `--font-code`
  - **Radius tokens**: `--radius-sm` through `--radius-full`
  - **Shadow tokens**: `--shadow-sm` through `--shadow-xl`

**Dark Mode Strategy:**
- Manual class-based toggle via `.dark` class on `<html>` element
- Dark theme overrides defined in `src/style.css` lines 512-536 (CSS custom property reassignments)
- Additional dark mode specificity overrides for hero section, cards, and filters (lines 538-650)
- Respects `prefers-color-scheme` system preference as initial value

**Component Layer Architecture:**
- `@layer base` - HTML defaults (scroll behavior, body styles, selection colors)
- `@layer components` - Reusable classes: `.gradient-hero`, `.glass`, `.card-hover`, `.btn-primary`, `.btn-outline`, `.badge`, `.section-title`, `.typing-cursor`, `.reveal`, `.stagger-children`, `.ios-toggle`, full RAG chatbot styles (`.rag-chatbot` through `.rag-chat-form`)
- `@layer utilities` - Font utilities, `.bg-dots` pattern, `.text-gradient`, custom scrollbar

**Custom Animations:**
- `@keyframes blink` - Typing cursor animation
- `@keyframes float` - Hero image floating animation (`.animate-float`)
- `.reveal` / `.reveal.visible` - Scroll-triggered fade-in with translateY
- `.stagger-children` - Sequential child animation with nth-child delays (up to 8 children)

## JavaScript Architecture

**Pattern:** Vanilla JavaScript with function-based module organization
- No framework, no library dependencies
- All code in single `src/main.js` file (629 lines)
- ES module imports: `import './style.css'` and `import { portfolioConfig } from './data/portfolio-config.js'`
- Configuration exposed globally: `window.portfolioConfig = portfolioConfig`

**Initialization Pattern:**
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

**Feature Modules (all in `src/main.js`):**
| Feature | Function | Lines |
|---------|----------|-------|
| Theme toggle | `initTheme`, `syncAllToggles`, `toggleTheme`, `setupThemeToggle` | 6-47 |
| Mobile menu | `setupMobileMenu` (dynamically creates drawer + backdrop) | 49-114 |
| Scroll reveal | `setupScrollReveal` (IntersectionObserver) | 116-128 |
| Typing effect | `setupTypingEffect` (setTimeout-based character animation) | 130-171 |
| Contact form | `setupContactForm` (async fetch to Formspree) | 173-225 |
| Toast notifications | `showToast` (dynamic DOM creation) | 227-254 |
| Counter animation | `animateCounters` (IntersectionObserver + setInterval) | 256-284 |
| Project filters | `setupProjectFilters` (tag-based filtering with animation) | 286-318 |
| RAG chatbot | `setupPortfolioChatbot` + knowledge base + retrieval | 519-618 |

**RAG Chatbot Implementation:**
- **Knowledge base builder**: `buildKnowledgeBase()` - creates document chunks from `portfolioConfig`
- **Tokenizer**: `tokenize()` with Vietnamese + English stop words
- **Retrieval**: `retrieveKnowledge()` - token overlap scoring with title phrase boost
- **Response generation**: `generateChatbotAnswer()` - intent-based routing (contact, projects, skills, AI)
- **XSS protection**: `escapeHtml()` using DOM textContent approach
- **Text normalization**: `normalizeText()` - NFD Unicode normalization, diacritic removal

**DOM Manipulation Approach:**
- `document.querySelector` / `document.querySelectorAll` for element selection
- `document.createElement` + `innerHTML` for dynamic elements (mobile drawer, toast, chatbot)
- `classList.add/remove/toggle` for state changes
- `addEventListener` for all interactions
- `requestAnimationFrame` for smooth transitions

## Font Stack

**Loaded via Google Fonts** (`index.html` line 11):
- **Geist** (weights 100-900) - Headline font via `.font-headline`
- **Inter** (weights 100-900, italic) - Body font via `.font-body` / `--font-sans`
- **JetBrains Mono** (weights 100-800, italic) - Code font via `.font-code`
- **Material Symbols Outlined** - Icon font (opsz 20-48, weight 100-700, fill 0-1, grad -50 to 200)

**CSS Font Variables** (`src/style.css` lines 49-51):
```css
--font-sans: "Inter", system-ui, -apple-system, sans-serif;
--font-headline: "Geist", "Inter", sans-serif;
--font-code: "JetBrains Mono", "Fira Code", monospace;
```

## Configuration

**Build Configuration:**
- `vite.config.js` - Single entry point `index.html`, Tailwind CSS plugin
- No TypeScript configuration - pure JavaScript project
- No environment variables required for build

**Content Configuration:**
- `src/data/portfolio-config.js` (286 lines) - Centralized portfolio data:
  - `personalInfo` - Name, title, bio, avatar, social links
  - `projects` - 10 projects with tags, descriptions, code links
  - `experience` - 3 experience entries with achievements
  - `competencies` - 4 competency categories with items
  - `techStack` - Array of 23 technologies
  - `languages` - Vietnamese (Native), English (Professional)
  - `contact` - Email and Formspree endpoint

## Platform Requirements

**Development:**
- Node.js (version compatible with Vite 5.2)
- npm
- Modern browser with ES module support

**Production:**
- Static file hosting (any HTTP server)
- Build output in `dist/` directory:
  - `dist/index.html` - Bundled HTML
  - `dist/assets/main-*.js` - Minified JavaScript
  - `dist/assets/main-*.css` - Minified CSS

## Performance Characteristics

**Bundle Size:**
- Zero external JS runtime dependencies (only Vite + Tailwind at build time)
- Vanilla JavaScript - no framework overhead
- Single JS bundle, single CSS bundle

**Runtime Performance:**
- No virtual DOM, no reactivity system
- Direct DOM manipulation
- IntersectionObserver for lazy scroll animations (efficient, no scroll event listeners)
- `requestAnimationFrame` for smooth animations

**Network:**
- Google Fonts loaded with `preconnect` hints
- Material Symbols loaded as single font file
- Avatar loaded from GitHub CDN
- No other external resources at runtime

---

*Stack analysis: 2026-05-18*
