# Architecture

**Analysis Date:** 2026-05-18

## Pattern Overview

**Overall:** Static single-page application with anchor-based navigation and client-side interactivity.

**Key Characteristics:**
- Vanilla JavaScript with ES modules — no framework or UI library
- Single `index.html` entry point with semantic HTML sections
- All JavaScript logic consolidated in `src/main.js` with function-based module separation
- CSS-driven animations and transitions (Tailwind CSS v4 + custom `@layer` classes)
- Client-side RAG chatbot with in-memory knowledge base
- Theme system using CSS class toggling with `localStorage` persistence

## Layers

**Data Layer:**
- Purpose: Centralized configuration and content source
- Location: `src/data/portfolio-config.js`
- Contains: `portfolioConfig` object with `personalInfo`, `projects`, `experience`, `competencies`, `techStack`, `languages`, `contact`
- Depends on: Nothing (pure data export)
- Used by: `src/main.js` (imported and attached to `window.portfolioConfig`)

**Presentation Layer (HTML):**
- Purpose: Semantic document structure and content
- Location: `index.html`
- Contains: `<header>`, `<main>` with sections (`#home`, `#journey`, `#projects`, `#skills`), `<footer>`
- Depends on: `src/style.css` (styles), `src/main.js` (behavior)
- Used by: Browser rendering engine

**Styling Layer (CSS):**
- Purpose: Visual design system with dark/light theming
- Location: `src/style.css` (650 lines)
- Contains: Tailwind `@theme` design tokens, `@layer base/components/utilities`, dark mode via `.dark` class selector, custom component classes (`.btn-primary`, `.btn-outline`, `.card-hover`, `.section-title`, `.rag-chatbot`, etc.)
- Depends on: Tailwind CSS v4 (`@import "tailwindcss"`)
- Used by: All HTML elements

**Behavior Layer (JavaScript):**
- Purpose: Interactive features and animations
- Location: `src/main.js` (629 lines)
- Contains: 12 top-level functions organized by feature
- Depends on: `portfolioConfig` data, DOM APIs, `localStorage`, `IntersectionObserver`
- Used by: `DOMContentLoaded` event listener

## Data Flow

**Initialization Flow:**

1. Browser loads `index.html`
2. `<script type="module" src="/src/main.js">` triggers ES module loading
3. `main.js` imports `./style.css` (triggers CSS processing via Vite + Tailwind plugin)
4. `main.js` imports `portfolioConfig` from `./data/portfolio-config.js`
5. `portfolioConfig` is attached to `window.portfolioConfig` for global access
6. `DOMContentLoaded` fires, triggering the initialization sequence:
   ```
   initTheme() → setupThemeToggle() → setupMobileMenu() → setupScrollReveal()
   → setupTypingEffect() → animateCounters() → setupProjectFilters()
   → setupPortfolioChatbot()
   ```

**Theme Data Flow:**

1. `initTheme()` reads `localStorage.getItem('theme')` or falls back to `prefers-color-scheme`
2. Adds/removes `.dark` class on `document.documentElement`
3. `syncAllToggles()` updates all `.ios-toggle` elements to match state
4. User clicks toggle → `toggleTheme()` flips class and persists to `localStorage`

**RAG Chatbot Data Flow:**

1. `setupPortfolioChatbot()` builds knowledge base from `portfolioConfig`:
   - `buildKnowledgeBase(config)` → creates structured chunks from personal info, projects, experience, competencies
   - Each chunk is tokenized with `tokenize()` and normalized with `normalizeText()`
2. User submits question → `generateChatbotAnswer(question, knowledgeBase)`
3. `retrieveKnowledge(question, knowledgeBase)` scores chunks via token matching:
   - Token overlap scoring (1 point per match)
   - Title match boost (3 points)
   - Full phrase match boost (4 points)
   - Returns top 3 results
4. Answer generation uses keyword-based routing:
   - Contact/email queries → direct contact info from config
   - Project queries → filtered project matches
   - Skill/tech queries → tech stack from config
   - AI/ML queries → AI-focused response template
   - Default → raw context from matched chunks
5. Response rendered via `addChatMessage()` with DOM element creation

## State Management

**Approach:** DOM-based state with `localStorage` persistence. No global state library.

| State | Storage | Key/Selector |
|-------|---------|-------------|
| Theme preference | `localStorage` | `theme` (`'dark'` / `'light'`) |
| Dark mode active | DOM class | `document.documentElement.classList` (`.dark`) |
| Toggle UI state | DOM class | `.ios-toggle.active` |
| Mobile drawer | DOM class | `.mobile-nav-drawer.translate-x-full` |
| Chat panel visibility | DOM attribute | `panel.hidden` |
| Counter animation | `setInterval` timer | Local variable per counter |
| Typing effect | Closure variables | `textIndex`, `charIndex`, `isDeleting` |

**Config on window:** `window.portfolioConfig` provides global read-only access to portfolio data, used by the chatbot's answer generation.

## Key Abstractions

**Design Token System:**
- Purpose: Material Design 3-inspired color system
- Location: `src/style.css` `@theme` block (lines 5-63)
- Pattern: CSS custom properties with semantic naming (`--color-primary`, `--color-surface-container`, etc.)
- Examples: 40+ color tokens, 3 font families, 5 radius values, 4 shadow levels

**Reveal Animation System:**
- Purpose: Scroll-triggered fade-in animations
- Location: `src/style.css` `.reveal` / `.stagger-children` classes + `src/main.js` `setupScrollReveal()`
- Pattern: `IntersectionObserver` adds `.visible` class → CSS transitions handle animation
- Threshold: 0.1, root margin: `0px 0px -50px 0px`

**Counter Animation:**
- Purpose: Animated number counting on scroll
- Location: `src/main.js` `animateCounters()` (lines 256-284)
- Pattern: `IntersectionObserver` triggers `setInterval` at 16ms (~60fps), unobserves after completion

**Typing Effect:**
- Purpose: Rotating text animation
- Location: `src/main.js` `setupTypingEffect()` (lines 130-171)
- Pattern: Recursive `setTimeout` with state machine (typing → pause → deleting → next text)
- Configured via `data-texts` JSON attribute on `.typing-effect` elements

## Entry Points

**HTML Entry:**
- Location: `index.html`
- Triggers: Browser navigation
- Responsibilities: Document structure, semantic sections, external font loading (Google Fonts: Geist, Inter, JetBrains Mono, Material Symbols)

**JavaScript Entry:**
- Location: `src/main.js` line 620
- Triggers: `DOMContentLoaded` event
- Responsibilities: Sequential initialization of all interactive modules

**CSS Entry:**
- Location: `src/style.css`
- Triggers: Imported by `src/main.js` (line 1)
- Responsibilities: Tailwind processing, design tokens, component classes, dark mode overrides

**Build Entry:**
- Location: `vite.config.js`
- Triggers: `npm run build`
- Responsibilities: Resolves `index.html` as single entry, applies Tailwind plugin, outputs to `dist/`

## Error Handling

**Strategy:** Defensive DOM queries with early returns, try/catch for async operations, user-facing toast notifications.

**Patterns:**
- Null guards: `if (!element) return;` used in `setupMobileMenu()`, `setupContactForm()`, `setupProjectFilters()`
- Async error handling: `try/catch` in `setupContactForm()` with `showToast()` for user feedback
- HTML escaping: `escapeHtml()` function prevents XSS in chatbot output (line 320-324)
- RAG fallback: `generateChatbotAnswer()` returns default message when no knowledge match found

## Cross-Cutting Concerns

**Logging:** `console.error()` only — used in `setupContactForm()` catch block (line 216). No logging framework.

**Validation:** Client-side only — contact form relies on Formspree endpoint validation. Chatbot input trimmed before processing.

**Accessibility:**
- `aria-label` on chatbot toggle and panel
- `aria-expanded` for chat panel state
- `aria-live="polite"` on chat messages container
- `aria-controls` linking toggle to panel
- `sr-only` class for screen-reader-only labels
- `rel="noopener"` on external links

**Performance:**
- `IntersectionObserver` for lazy animations (no scroll event listeners)
- `requestAnimationFrame` for smooth CSS transitions (drawer open, toast slide-in)
- CSS transitions over JS animations where possible
- Single `DOMContentLoaded` listener (no repeated event binding)

## Design Patterns

**Module Pattern:**
- All functions in `src/main.js` are module-scoped (ES module), not polluting global namespace
- Only `window.portfolioConfig` is intentionally exposed globally

**Observer Pattern:**
- `IntersectionObserver` used for scroll reveal (`setupScrollReveal()`) and counter animations (`animateCounters()`)
- `addEventListener` for user interactions (clicks, form submits)

**Factory Pattern:**
- DOM element creation via `document.createElement()` in `setupMobileMenu()`, `showToast()`, `setupPortfolioChatbot()`, `addChatMessage()`
- Template literals used for innerHTML assembly

**Strategy Pattern:**
- Theme toggle supports multiple strategies: `localStorage` preference, `prefers-color-scheme` media query, manual toggle
- Chatbot answer generation routes to different strategies based on keyword detection

---

*Architecture analysis: 2026-05-18*
