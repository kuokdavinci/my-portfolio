# External Integrations

**Analysis Date:** 2026-05-18

## APIs & External Services

### Formspree (Contact Form)
- **Purpose:** Contact form submission endpoint
- **Endpoint:** `https://formspree.io/f/xvonzndk` (configured in `src/data/portfolio-config.js` line 284)
- **Auth:** None (public endpoint)
- **Implementation:** `src/main.js` lines 173-225 (`setupContactForm`)
  - POST request with `Content-Type: application/json`
  - Sends form data as JSON: `JSON.stringify(data)`
  - Accepts `application/json` responses
  - Loading state with spinner animation on submit button
  - Success/error toast notifications via `showToast()`

```javascript
// src/main.js - Contact form submission
const response = await fetch(form.action, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify(data)
});
```

### GitHub
- **Purpose:** Profile links, repository links, avatar image
- **Profile:** `https://github.com/kuokdavinci`
- **Avatar:** `https://avatars.githubusercontent.com/u/163934382?v=4` (loaded in `index.html` line 90)
- **Repository links:** All project cards link to individual repos via `codeLink` in `portfolioConfig`
- **Implementation:**
  - Hero section: GitHub profile button (`index.html` lines 63-66)
  - Hero contact info: GitHub link (`index.html` lines 81-84)
  - Project cards: Each project links to its repo (`index.html` lines 193, 216)
  - "View All on GitHub" button (`index.html` lines 241-245)
  - All links use `target="_blank" rel="noopener"` for security

### LinkedIn
- **Purpose:** Professional profile link
- **Profile:** `https://linkedin.com/in/kuokdavinci`
- **Implementation:** Hero section contact info (`index.html` lines 77-80)
- Configured in `src/data/portfolio-config.js` line 17

### Google Fonts
- **Purpose:** Typography (Geist, Inter, JetBrains Mono) and icons (Material Symbols)
- **URL:** `https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap`
- **Loaded in:** `index.html` line 11
- **Preconnect hints:** `index.html` lines 9-10
  - `https://fonts.googleapis.com`
  - `https://fonts.gstatic.com`

### Google Material Symbols
- **Purpose:** Icon library throughout the portfolio
- **Font family:** `Material Symbols Outlined`
- **Usage:** `<span class="material-symbols-outlined">icon_name</span>` pattern
- **Icons used:**
  - `menu` - Mobile menu button
  - `close` - Close buttons (mobile drawer, chatbot)
  - `mail` - Email contact
  - `phone` - Phone contact
  - `work` - LinkedIn link
  - `code` - GitHub links, code icon
  - `arrow_forward` - CTA button
  - `school` - Education timeline item
  - `emoji_events` - Graduation timeline item
  - `menu_book` - Self-study timeline item
  - `psychology` - AI timeline item
  - `local_movies` - Movie ticket project
  - `badge` - Attendance app project
  - `open_in_new` - External link indicators
  - `circle` - Language indicators
  - `smart_toy` - Chatbot toggle
  - `send` - Chatbot send button
  - `check_circle` - Success toast
  - `error` - Error toast
  - `dns`, `smartphone`, `model_training`, `web` - Competency icons (in config)

## Data Storage

### LocalStorage
- **Purpose:** Theme preference persistence
- **Key:** `'theme'`
- **Values:** `'dark'` or `'light'`
- **Implementation:** `src/main.js` lines 6-37
  - Read on init: `localStorage.getItem('theme')`
  - Write on toggle: `localStorage.setItem('theme', 'dark'/'light')`
  - Falls back to `prefers-color-scheme` if no stored value

```javascript
// src/main.js - Theme persistence
const currentTheme = localStorage.getItem('theme') || 
  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
```

### No Databases
- Static site with no server-side database
- All content defined in `src/data/portfolio-config.js`

### No File Storage
- No file upload or storage functionality
- Avatar image served from GitHub CDN

### No Caching Layer
- No Redis, no service worker, no caching strategy beyond browser defaults

## Authentication & Identity

**Auth Provider:** None
- No user authentication system
- Contact form uses public Formspree endpoint (no auth required)
- No protected routes or authenticated content

## Browser APIs Used

### IntersectionObserver
- **Purpose:** Scroll-triggered animations and counter animations
- **Usage 1 - Scroll Reveal:** `src/main.js` lines 116-128
  - Threshold: `0.1`
  - Root margin: `'0px 0px -50px 0px'`
  - Observes elements with `.reveal` and `.stagger-children` classes
  - Adds `.visible` class when element enters viewport

- **Usage 2 - Counter Animation:** `src/main.js` lines 256-284
  - Threshold: `0.5`
  - Observes elements with `.counter` class
  - Triggers counting animation once, then unobserves

### matchMedia API
- **Purpose:** Detect system color scheme preference
- **Usage:** `src/main.js` line 7
  - `window.matchMedia('(prefers-color-scheme: dark)').matches`

### requestAnimationFrame
- **Purpose:** Smooth animation timing
- **Usage:**
  - Mobile drawer backdrop opacity transition (`src/main.js` line 88)
  - Toast notification slide-in (`src/main.js` line 246)
  - Project filter card animations (`src/main.js` lines 307-311)
  - Chatbot input focus (`src/main.js` line 570)

## Monitoring & Observability

**Error Tracking:** None
- No Sentry, no LogRocket, no analytics

**Logs:**
- `console.error(error)` in contact form error handler (`src/main.js` line 217)
- No structured logging framework

## CI/CD & Deployment

**Hosting:** Static hosting (any HTTP file server)
- Build output: `dist/` directory
- No specific platform configured (no Vercel, Netlify, GitHub Actions detected)

**CI Pipeline:** None detected
- No `.github/workflows/` directory
- No CI configuration files

## Environment Configuration

**Required env vars:** None
- Static site with no environment-dependent configuration
- Formspree endpoint hardcoded in `src/data/portfolio-config.js`
- All social links hardcoded in config

**Secrets location:** None
- No secrets required for this portfolio site
- Formspree endpoint is public (designed for public form submissions)

## Webhooks & Callbacks

**Incoming:** None
- No webhook endpoints

**Outgoing:**
- **Formspree POST:** Contact form submissions sent to `https://formspree.io/f/xvonzndk`
  - Triggered on form submit in `src/main.js` `setupContactForm()`
  - JSON payload with form field data

## RAG Chatbot (Local, No External API)

The portfolio includes a **client-side RAG (Retrieval-Augmented Generation) chatbot** that operates entirely locally:

- **Knowledge base:** Built from `portfolioConfig` at runtime (`buildKnowledgeBase()`, `src/main.js` lines 348-432)
- **Retrieval:** Token-based scoring with Vietnamese + English stop word filtering (`retrieveKnowledge()`, lines 434-462)
- **Response generation:** Intent-based template matching (`generateChatbotAnswer()`, lines 464-498)
- **No external LLM API calls** - all processing happens in the browser
- **No API keys required**

**Chatbot UI:**
- Floating toggle button with `smart_toy` icon (`src/main.js` lines 526-529)
- Chat panel with message history, suggested prompts, and input form
- Sources displayed as tags below bot responses
- Accessibility: `aria-label`, `aria-expanded`, `aria-live="polite"`

## Security Considerations

**XSS Protection:**
- `escapeHtml()` function in `src/main.js` lines 320-324 uses DOM textContent approach
- Applied to all chatbot user input and source labels

**Link Security:**
- All external links use `target="_blank" rel="noopener"`
- No `rel="noreferrer"` (analytics could be tracked by linked sites)

**Form Security:**
- Formspree handles spam protection server-side
- No CSRF tokens (Formspree public endpoint)
- Client-side validation only (no server-side validation)

---

*Integration audit: 2026-05-18*
