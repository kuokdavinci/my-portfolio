# Portfolio Roadmap

> **Project:** kuokdavinci-portfolio — Vanilla JS portfolio with RAG chatbot
> **Created:** 2026-05-26

## Milestones

### Milestone 1: Core Portfolio Experience
**Status:** Complete

**Phases:**
- ~~Phase 0: Foundation~~ — Initial scaffolding, Vite + Tailwind setup
- ~~Phase 1: Portfolio Content~~ — Personal info, projects, skills, journey sections
- ~~Phase 2: RAG Chatbot~~ — Client-side RAG chatbot with knowledge base retrieval

---

### Milestone 2: Enhanced UX & Engagement
**Status:** In Progress

**Phases:**
- **Phase 3: Chatbot UX Enhancement** — Improve chatbot feedback with visible loading states, streaming effects, and smooth animations

---

### Milestone 3: Analytics & Observability
**Status:** In Progress

**Phases:**
- **Phase 4: Dashboard Page** — Move metrics from homepage to dedicated Dashboard page with theme sync
- Phase 5+: AI backend integration, testing...

---

## Phase Details

### Phase 3: Chatbot UX Enhancement

**Goal:** Enhance chatbot user experience with visible feedback states, smooth message animations, and natural-feeling response delivery — even when responses are instantaneous (local fallback).

**Requirements:**
- CHAT-01: Thinking/loading indicator must be visible for a minimum duration so users perceive it
- CHAT-02: Bot responses should appear with a natural typing/streaming effect
- CHAT-03: Messages should have smooth entrance animations (fade + slide)
- CHAT-04: Chat scroll behavior must remain smooth during animations
- CHAT-05: Agent processing state must be visible — show sequential steps (analyzing, retrieving, generating) with completion indicators
- CHAT-06: Clicking links in chat messages must navigate without closing the chat panel

**Plans:** 2/2 plans complete

**Plans:**
- [x] 03-01-PLAN.md — Chatbot UX Enhancement (fix short circuit + streaming + animations)
- [x] 03-02-PLAN.md — Agent state visibility + link behavior (show tool states, links don't close chat)

---

### Phase 4: Dashboard Page

**Goal:** Create a dedicated Dashboard page to display portfolio metrics (stat cards + Grafana analytics) that are currently embedded on the homepage, with theme synchronization.

**Requirements:**
- DASH-01: Dashboard accessible via `#dashboard` hash route
- DASH-02: Dashboard displays all current metrics (4 stat cards + Grafana iframe)
- DASH-03: Stats section removed from homepage
- DASH-04: Theme sync with homepage (dark/light mode)
- DASH-05: Dashboard link in navigation (desktop + mobile)

**Plans:** 1/1 plans complete

**Plans:**
- [x] 04-01-PLAN.md — Create Dashboard page, update navigation, wire routing

---

## Stakeholders

- **User:** Primary portfolio visitor (HR/recruiter)
- **Owner:** kuokdavinci
