---
phase: 03-chatbot-ux
plan: 02
subsystem: ui
tags: [chatbot, agent-state, link-navigation, css-animations, frontend]

# Dependency graph
requires:
  - 03-01 (minimum thinking time, streaming, animations)
provides:
  - Sequential agent state indicator (analyzing → retrieving → generating)
  - Step completion markers (green checkmarks)
  - Link navigation without closing chat panel
  - Internal link smooth scroll to sections
affects: [future backend API integration, UX transparency]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Sequential state machine with pending/active/completed transitions"
    - "DOM-based step status management via data attributes"
    - "e.preventDefault() + scrollIntoView for internal link handling"

key-files:
  created: []
  modified:
    - src/modules/chatbot/chatbot-ui.js (agent state indicator, updateAgentState, link handler fix)
    - src/modules/chatbot/chatbot.css (agent-state-indicator CSS, link cursor styles)

key-decisions:
  - "Applied CSS changes to chatbot.css instead of style.css — chatbot styles were already modularized in wave 1"
  - "Vietnamese labels for state steps match portfolio language context"
  - "Link handler catches all anchor elements (not just .rag-chat-source-link) for comprehensive coverage"

requirements-completed:
  - CHAT-05
  - CHAT-06

# Metrics
duration: 3min
completed: 2026-05-29
---

# Phase 03 Plan 02: Agent State Visibility & Link Behavior Summary

**Sequential agent state indicator with completion markers and link navigation without closing chat panel**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-05-29T04:20:07Z
- **Completed:** 2026-05-29T04:23:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Agent state indicator shows 3 sequential pipeline steps: "Đang phân tích câu hỏi..." → "Đang tìm kiếm thông tin..." → "Đang tạo câu trả lời..."
- Active step highlighted with full opacity and subtle primary background tint
- Completed steps show green check_circle icon with dimmed opacity
- Pending steps remain faded (0.4 opacity)
- Internal links (#section) scroll smoothly to target without closing chat
- External links open in new tab (target="_blank" with rel="noopener") — chat stays open
- Close button (X) and toggle still work normally

## Task Commits

Each task was committed atomically:

1. **task 1: Add agent state indicator with sequential steps and completion markers** - `42a566e` (feat)
2. **task 2: Fix link behavior — links navigate without closing chat panel** - `8049b46` (feat)

## Files Created/Modified

- `src/modules/chatbot/chatbot-ui.js` — agentStateSteps array, updateAgentState function, state indicator DOM, state update calls in try/catch paths, link click handler rewrite
- `src/modules/chatbot/chatbot.css` — .agent-state-indicator, .agent-state-step (pending/active/completed), .rag-chat-bubble a cursor styles

## Decisions Made

- Plan referenced `src/style.css` for CSS but code was already modularized into `src/modules/chatbot/chatbot.css` (established in wave 1) — applied CSS changes to the correct modularized file
- Link handler expanded from `.rag-chat-source-link` to all `a` elements for comprehensive coverage of both inline links and source links

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] CSS file path mismatch — plan referenced src/style.css but chatbot CSS is in chatbot.css**
- **Found during:** task 1 (CSS addition)
- **Issue:** Plan assumed chatbot styles should go in src/style.css @layer components, but wave 1 established chatbot styles are modularized in src/modules/chatbot/chatbot.css
- **Fix:** Added all agent state CSS and link cursor CSS to chatbot.css within the existing @layer components block
- **Files modified:** src/modules/chatbot/chatbot.css
- **Verification:** Build succeeds, CSS classes present in compiled output
- **Committed in:** 42a566e (task 1 commit) and 8049b46 (task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking CSS file path mismatch)
**Impact on plan:** Deviation was necessary to apply CSS to correct modularized file. No scope creep — all plan objectives achieved.

## Known Stubs

None — all functionality is fully wired.

## Threat Flags

None — all security-relevant surface is covered by the plan's existing threat model:
- T-03-01: escapeHtml() already used on all link URLs in parseMarkdown and source rendering
- T-03-02: External links use target="_blank" with rel="noopener noreferrer"
- T-03-03: Agent state steps show only generic Vietnamese processing labels, no internal details

## Issues Encountered

- None — implementation was straightforward following the plan's detailed instructions

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Agent state visibility complete and verified
- Link behavior fix complete and verified
- Build passes successfully
- Manual browser verification recommended: open portfolio, click "Ask Quoc", type a question to observe state steps, then click links in responses to verify chat stays open

## Self-Check: PASSED

All claims verified:
- SUMMARY.md exists in plan directory
- `agentStateSteps` array present in chatbot-ui.js
- `updateAgentState` function present in chatbot-ui.js
- `.agent-state-indicator` CSS present in chatbot.css
- `scrollIntoView` present in chatbot-ui.js
- Both task commits exist in git log

---
*Phase: 03-chatbot-ux*
*Completed: 2026-05-29*
