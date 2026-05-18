# Testing Patterns

**Analysis Date:** 2026-05-18

## Current State: No Testing Infrastructure

**This project has zero testing infrastructure.** There are:
- No test files (`*.test.*`, `*.spec.*`)
- No test scripts in `package.json`
- No test framework dependencies
- No test configuration files
- No CI/CD pipeline
- No linting or type-checking

### package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

No `test`, `test:watch`, `test:coverage`, `lint`, or `typecheck` scripts exist.

### Missing Tooling

| Category | Status |
|----------|--------|
| Test runner | Not installed |
| Linter | Not installed |
| Formatter | Not installed |
| Type checker | Not installed (no TypeScript) |
| CI/CD | No `.github/` directory |
| Pre-commit hooks | Not configured |

---

## Recommended Testing Strategy

### 1. Unit Tests — Vitest

**Recommended tool:** [Vitest](https://vitest.dev/) (native Vite integration, ESM support)

**Setup:**
```bash
npm install -D vitest jsdom
```

**vitest.config.js:**
```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

**package.json additions:**
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

#### Unit Tests for RAG Chatbot Functions

**File:** `src/main.js` — testable pure functions:

**`escapeHtml(value)`** — `src/main.js:320-324`
```javascript
// Test cases
escapeHtml('<script>alert("xss")</script>') // → '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
escapeHtml('Hello & goodbye')               // → 'Hello &amp; goodbye'
escapeHtml('')                               // → ''
```

**`normalizeText(value)`** — `src/main.js:326-334`
```javascript
// Test cases
normalizeText('Café')           // → 'cafe'
normalizeText('Hello   World')  // → 'hello world'
normalizeText('Spring-Boot')    // → 'spring boot'
normalizeText('C# + .NET')      // → 'c   net'
```

**`tokenize(value)`** — `src/main.js:336-346`
```javascript
// Test cases — filters stop words and short tokens
tokenize('What is your portfolio about')  // → ['portfolio']
tokenize('Tell me about Quoc')            // → [] (quoc is stop word)
tokenize('Spring Boot Java')              // → ['spring', 'boot', 'java']
```

**`buildKnowledgeBase(config)`** — `src/main.js:348-432`
```javascript
// Test with mock config
const mockConfig = {
  personalInfo: { name: 'Test', title: 'Dev', location: 'City', description: '', detailedBio: '' },
  projects: [{ title: 'Project A', description: 'A project', tags: ['JS'], badge: 'WEB', language: 'JS', codeLink: '' }],
  experience: [],
  competencies: [],
  techStack: ['JS'],
  languages: [],
  contact: { email: 'test@test.com' }
};
const kb = buildKnowledgeBase(mockConfig);
// Assert: returns array of chunks with normalizedText and tokens
```

**`retrieveKnowledge(question, knowledgeBase)`** — `src/main.js:434-462`
```javascript
// Test scoring and ranking
const results = retrieveKnowledge('What projects has Quoc built?', knowledgeBase);
// Assert: returns top 3 matching chunks sorted by score
// Assert: empty question returns []
```

**`generateChatbotAnswer(question, knowledgeBase)`** — `src/main.js:464-498`
```javascript
// Test intent routing
generateChatbotAnswer('What is Quoc\'s email?', kb)  // → contact info response
generateChatbotAnswer('Show projects', kb)            // → project list response
generateChatbotAnswer('What skills?', kb)             // → tech stack response
generateChatbotAnswer('xyz123unknown', kb)            // → fallback "no match" response
```

#### Unit Tests for Utility Functions

**`addChatMessage(container, role, content, sources)`** — `src/main.js:500-517`
```javascript
// Test DOM creation
const container = document.createElement('div');
addChatMessage(container, 'user', 'Hello');
// Assert: container has 1 child with class 'rag-chat-message is-user'
// Assert: bubble contains escaped text
```

### 2. Integration Tests — Vitest + jsdom

**Theme toggle behavior** — `src/main.js:6-47`
```javascript
// Test: initTheme() respects localStorage preference
// Test: initTheme() respects prefers-color-scheme media query
// Test: toggleTheme() switches dark/light and persists to localStorage
// Test: syncAllToggles() updates all .ios-toggle elements
```

**Mobile menu** — `src/main.js:49-114`
```javascript
// Test: setupMobileMenu() creates drawer element
// Test: openDrawer removes translate-x-full
// Test: closeDrawer adds translate-x-full
// Test: backdrop click closes drawer
// Test: nav link click closes drawer
```

**Scroll reveal** — `src/main.js:116-128`
```javascript
// Test: IntersectionObserver adds 'visible' class on intersect
// Test: .reveal elements are observed
// Test: .stagger-children elements are observed
```

**Project filters** — `src/main.js:286-318`
```javascript
// Test: clicking filter button updates active state
// Test: matching cards are shown with animation
// Test: non-matching cards are hidden (display: none)
// Test: 'all' filter shows all cards
```

**Contact form** — `src/main.js:173-225`
```javascript
// Test: form submission prevents default
// Test: submit button shows loading state
// Test: successful response shows success toast
// Test: failed response shows error toast
// Test: button re-enabled in finally block
```

### 3. E2E Tests — Playwright

**Recommended tool:** [Playwright](https://playwright.dev/)

**Setup:**
```bash
npm install -D @playwright/test
npx playwright install
```

**Test scenarios:**

**Contact form submission** — `index.html` form → Formspree endpoint
```javascript
test('contact form submits and shows success toast', async ({ page }) => {
  await page.goto('/');
  await page.fill('input[name="name"]', 'Test User');
  await page.fill('input[name="email"]', 'test@test.com');
  await page.fill('textarea[name="message"]', 'Hello!');
  await page.click('button[type="submit"]');
  // Assert: toast appears with success message
});
```

**Chatbot interaction** — `src/main.js:519-618`
```javascript
test('chatbot opens and answers questions', async ({ page }) => {
  await page.goto('/');
  await page.click('.rag-chat-toggle');
  await page.fill('#rag-chat-input', 'What projects has Quoc built?');
  await page.click('.rag-chat-form button[type="submit"]');
  // Assert: bot response appears in .rag-chat-messages
  // Assert: sources are displayed
});
```

**Theme toggle persistence**
```javascript
test('theme preference persists across page reload', async ({ page }) => {
  await page.goto('/');
  await page.click('#themeToggle');
  await page.reload();
  // Assert: dark class is still present on html element
});
```

**Mobile menu**
```javascript
test('mobile menu opens and closes', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await page.click('nav > button.md\\:hidden');
  // Assert: mobile-nav-drawer is visible
  await page.click('.close-drawer-btn');
  // Assert: mobile-nav-drawer is hidden
});
```

**Navigation smooth scroll**
```javascript
test('nav links scroll to sections', async ({ page }) => {
  await page.goto('/');
  await page.click('nav a[href="#projects"]');
  // Assert: #projects section is in viewport
});
```

### 4. Visual Regression Tests

**Recommended tool:** Playwright screenshot assertions or [Chromatic](https://www.chromatic.com/)

**Key views to capture:**
- Hero section (light mode) — `index.html:39-107`
- Hero section (dark mode) — `.dark .gradient-hero` overrides
- Journey timeline — `index.html:110-183`
- Project cards grid — `index.html:186-247`
- Skills sections — `index.html:250-336`
- Chatbot panel (open/closed states)
- Mobile layout (375px viewport)
- Toast notifications (success/error states)

### 5. Accessibility Testing

**Recommended tool:** [axe-core](https://www.deque.com/axe/) via `@axe-core/playwright`

**Audit checklist:**
- [ ] All interactive elements have `aria-label` or visible text
- [ ] Color contrast meets WCAG AA (4.5:1 text, 3:1 large text)
- [ ] Focus indicators visible on all interactive elements
- [ ] Keyboard navigation works for:
  - Theme toggle
  - Mobile menu (open/close with Escape)
  - Chatbot (open/close, input, submit, prompt buttons)
  - Project filter buttons
  - Navigation links
- [ ] `aria-expanded` updates correctly on chatbot toggle
- [ ] `aria-live="polite"` region updates with chatbot responses
- [ ] Form inputs have associated labels (or `sr-only` labels)
- [ ] Skip navigation link for keyboard users

### 6. Performance Testing

**Recommended tool:** Lighthouse CI or Playwright performance metrics

**Key metrics:**
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- Time to Interactive (TTI)
- Total Bundle Size (current: Vite build output in `dist/`)

**Performance concerns to monitor:**
- 629-line `src/main.js` — single bundle, no code splitting
- 650-line `src/style.css` — all CSS in one file
- IntersectionObserver usage (6 observers: scroll reveal, counters)
- Multiple `requestAnimationFrame` calls for animations
- Dynamic DOM creation (mobile drawer, chatbot, toast)

---

## Recommended Tool Stack

| Purpose | Tool | Why |
|---------|------|-----|
| Unit testing | **Vitest** | Native Vite integration, fast, ESM support |
| DOM environment | **jsdom** | Lightweight browser simulation for unit tests |
| E2E testing | **Playwright** | Cross-browser, reliable, screenshot support |
| Accessibility | **axe-core** | Industry standard a11y auditing |
| Linting | **ESLint** | Catch errors, enforce conventions |
| Formatting | **Prettier** | Consistent code style |
| Visual regression | **Playwright screenshots** | Built-in, no extra dependency |
| Performance | **Lighthouse CI** | Automated performance budgets |

---

## Test File Organization (Recommended)

```
src/
├── main.js
├── style.css
├── data/
│   └── portfolio-config.js
└── __tests__/
    ├── unit/
    │   ├── escapeHtml.test.js
    │   ├── normalizeText.test.js
    │   ├── tokenize.test.js
    │   ├── buildKnowledgeBase.test.js
    │   ├── retrieveKnowledge.test.js
    │   └── generateChatbotAnswer.test.js
    ├── integration/
    │   ├── themeToggle.test.js
    │   ├── mobileMenu.test.js
    │   ├── scrollReveal.test.js
    │   ├── projectFilters.test.js
    │   └── contactForm.test.js
    └── helpers/
        └── fixtures.js          # Mock config, DOM setup
```

Or co-located pattern:
```
src/
├── main.js
├── main.test.js
├── data/
│   ├── portfolio-config.js
│   └── portfolio-config.test.js
```

---

## Quality Assurance Gaps

### Critical Gaps

1. **No automated tests** — Any code change risks regression with no safety net
2. **No linting** — No enforcement of code style or error detection
3. **No type checking** — Vanilla JS with no JSDoc types; easy to introduce type errors
4. **No CI/CD** — No automated checks on push/PR
5. **No pre-commit hooks** — No guard against committing broken code

### Recommended Immediate Actions

1. **Add Vitest** with tests for pure utility functions (`escapeHtml`, `normalizeText`, `tokenize`) — lowest effort, highest confidence gain
2. **Add ESLint** with recommended config — catches obvious errors
3. **Add Prettier** — enforces consistent formatting
4. **Add GitHub Actions** workflow to run tests on push

### Recommended Follow-up Actions

5. **Add integration tests** for DOM interactions (theme toggle, mobile menu)
6. **Add Playwright E2E tests** for critical user journeys (form, chatbot)
7. **Add axe-core** accessibility audits to CI
8. **Add Lighthouse CI** for performance budgets

---

*Testing analysis: 2026-05-18*
