---
phase: 03-chatbot-ux
verified: 2026-05-29T04:30:00Z
status: human_needed
score: 10/10 must-haves verified
overrides_applied: 0
gaps:
deferred:
human_verification:
  - test: "Open portfolio in browser, ask a question, observe thinking dots visible for ≥500ms"
    expected: "Thinking indicator stays visible for at least 500ms before answer appears"
    why_human: "Cannot verify timing/visual duration programmatically without running browser"
  - test: "Ask a question, observe bot response streams character by character with blinking cursor"
    expected: "Text appears one character at a time (~15ms/char), cursor blinks during streaming, disappears when complete"
    why_human: "Streaming animation is a visual runtime behavior — code exists but cannot verify perceptual quality without browser"
  - test: "Ask a question, observe messages slide in with fade+translate animation"
    expected: "Both user and bot messages animate in with opacity 0→1 and translateY(12px)→0 over 0.3s"
    why_human: "CSS animation quality and smoothness is a visual/UX judgment"
  - test: "Click an internal link (#section) in a bot response or source"
    expected: "Page scrolls to the target section smoothly, chat panel stays open"
    why_human: "Requires live DOM interaction — scrollIntoView behavior and chat-open state must be observed together"
  - test: "Click an external link in a bot response or source"
    expected: "New browser tab opens with the link URL, chat panel stays open on original tab"
    why_human: "Cross-tab behavior cannot be verified without running browser"
  - test: "Observe agent state steps transition: analyzing → retrieving → generating with completion checkmarks"
    expected: "Three sequential steps appear; active step highlighted, completed steps show green check_circle, pending steps dimmed"
    why_human: "Sequential state transitions and visual feedback are runtime UI behaviors"
---

# Phase 03: Chatbot UX Enhancement Verification Report

**Phase Goal:** Enhance Chatbot UX with visible feedback states, streaming effect, and smooth animations + agent state visibility and link behavior
**Verified:** 2026-05-29T04:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1 | User sees the thinking dots animation for at least 500ms when asking a question | ✓ VERIFIED | `MIN_THINKING_TIME = 500` at line 4; `Promise.all([fetch(...), new Promise(resolve => setTimeout(resolve, MIN_THINKING_TIME))])` at lines 314-326; catch block has `await new Promise(resolve => setTimeout(resolve, MIN_THINKING_TIME))` at line 344 |
| 2 | Bot response appears character by character (streaming effect), not all at once | ✓ VERIFIED | `async function streamBotResponse` at line 157; character loop with `await new Promise(resolve => setTimeout(resolve, delay))` at 15ms/char (lines 175-180); cursor `<span class="streaming-cursor">|</span>` at line 164 |
| 3 | New messages slide in with a smooth fade+translate animation | ✓ VERIFIED | `@keyframes message-enter` with `translateY(12px)` in chatbot.css lines 166-175; `.rag-chat-message.is-entering` animation at line 177-179; `is-entering` class applied in `addChatMessage` (line 127) and `streamBotResponse` (line 159) |
| 4 | Chat auto-scrolls smoothly to bottom during streaming | ✓ VERIFIED | `container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })` at 4 locations: lines 150, 178, 203 in chatbot-ui.js |
| 5 | User message appears instantly (no delay on own message) | ✓ VERIFIED | `addChatMessage(messages, 'user', trimmedQuestion)` called directly at line 278 — no timer or await before it |
| 6 | User sees sequential agent state steps (analyzing → retrieving → generating) when asking a question | ✓ VERIFIED | `agentStateSteps` array at lines 6-10 with 3 steps; `updateAgentState(thinkingMessage, 'analyzing')` at line 309, `'retrieving'` at line 312, `'generating'` at line 329; catch block also calls retrieving/generating at lines 343-345 |
| 7 | Each state step shows a completion indicator (checkmark) when finished | ✓ VERIFIED | `updateAgentState` function (lines 12-39) sets `data-status='completed'`, adds `state-completed` class, injects `<span class="material-symbols-outlined">check_circle</span>` into `.state-status` |
| 8 | Clicking any link in chat messages navigates without closing the chat panel | ✓ VERIFIED | Link click handler (lines 359-377) has NO `closeChat()` call; `closeChat()` only appears in function definition (line 260), toggle handler (line 383), and close button (line 387) |
| 9 | Internal links (#section) scroll to the section in background | ✓ VERIFIED | `e.preventDefault()` + `targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' })` at lines 368-373 |
| 10 | External links (http/https) open in a new tab | ✓ VERIFIED | `target="_blank" rel="noopener"` in `parseMarkdown` (line 64), `addChatMessage` source rendering (line 133), `streamBotResponse` source rendering (line 191) |

**Score:** 10/10 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `src/modules/chatbot/chatbot-ui.js` | MIN_THINKING_TIME constant, Promise.all pattern, streamBotResponse with cursor, smooth scrollTo, agentStateSteps, updateAgentState, link handler without closeChat | ✓ VERIFIED | 401 lines; all patterns present and substantive |
| `src/modules/chatbot/chatbot.css` | message-enter keyframes, is-entering class, streaming-cursor with cursor-blink, agent-state-indicator + step states, link cursor styles | ✓ VERIFIED | 435 lines; all CSS classes present within @layer components |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `askQuestion` (try block) | thinking indicator minimum timer | `Promise.all([fetch(...), setTimeout(MIN_THINKING_TIME)])` | ✓ WIRED | Lines 314-326 — fetch and timer run in parallel |
| `askQuestion` (catch block) | thinking indicator minimum timer | `await setTimeout(MIN_THINKING_TIME)` before `removeThinking()` | ✓ WIRED | Line 344 — ensures minimum delay in fallback path |
| `addChatMessage` | CSS animation class | `is-entering` class on message div | ✓ WIRED | Line 127; class removed after 300ms (line 152-154) |
| `streamBotResponse` | CSS animation class | `is-entering` class on message div | ✓ WIRED | Line 159; class removed after 300ms (line 199-201) |
| `askQuestion` | agent state indicator DOM | `updateAgentState()` calls at analyzing/retrieving/generating stages | ✓ WIRED | Lines 309, 312, 329 (try); 343, 345 (catch) |
| messages click handler | link navigation | `scrollIntoView` for #links, `target="_blank"` for external, NO closeChat() | ✓ WIRED | Lines 359-377 — handler catches all `a` elements |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `streamBotResponse` | `text` parameter | `data.answer` (API) or `localResponse.answer` (fallback) | ✓ Real data from API response or `generateChatbotAnswer()` | ✓ FLOWING |
| `streamBotResponse` sources | `sources` parameter | `data.sources` (API) or `localResponse.sources` (fallback) | ✓ Real data — rendered as `.rag-chat-sources` with links | ✓ FLOWING |
| `addChatMessage` (user) | `content` parameter | `trimmedQuestion` from input | ✓ Real data — user's typed question | ✓ FLOWING |
| Agent state indicator | `thinkingMessage` DOM element | Created in `askQuestion`, updated by `updateAgentState` | ✓ Real DOM manipulation — steps transition through pending→active→completed | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Build succeeds | `npm run build` | `✓ built in 395ms` | ✓ PASS |
| MIN_THINKING_TIME constant exists | `grep -c "MIN_THINKING_TIME" chatbot-ui.js` | 3 (declaration + 2 usages) | ✓ PASS |
| Promise.all pattern exists | `grep -c "Promise.all" chatbot-ui.js` | 1 | ✓ PASS |
| streamBotResponse function exists | `grep -c "async function streamBotResponse" chatbot-ui.js` | 1 | ✓ PASS |
| Streaming cursor CSS exists | `grep -c "streaming-cursor" chatbot.css` | 1 | ✓ PASS |
| Message entrance animation exists | `grep -c "message-enter" chatbot.css` | 2 (keyframes + class) | ✓ PASS |
| Smooth scroll behavior | `grep -c "behavior.*smooth" chatbot-ui.js` | 4 | ✓ PASS |
| is-entering class applied | `grep -c "is-entering" chatbot-ui.js` | 4 | ✓ PASS |
| agentStateSteps defined | `grep -c "agentStateSteps" chatbot-ui.js` | 2 (declaration + usage) | ✓ PASS |
| updateAgentState function exists | `grep -c "function updateAgentState" chatbot-ui.js` | 1 | ✓ PASS |
| updateAgentState calls in askQuestion | `grep -c "updateAgentState(thinkingMessage" chatbot-ui.js` | 6 (3 try + 2 catch + 1 function def context) | ✓ PASS |
| Agent state CSS exists | `grep -c "agent-state-indicator" chatbot.css` | 1 | ✓ PASS |
| scrollIntoView for internal links | `grep -c "scrollIntoView" chatbot-ui.js` | 1 | ✓ PASS |
| Link cursor style exists | `grep -c "cursor: pointer" chatbot.css` | 5 | ✓ PASS |
| closeChat NOT in link handler | `grep "closeChat" chatbot-ui.js` | Only in function def (260), toggle (383), close button (387) — none in link handler (359-377) | ✓ PASS |
| No TODO/FIXME/placeholder | `grep -E "TODO|FIXME|PLACEHOLDER" chatbot-ui.js chatbot.css` | No matches | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| CHAT-01 | 03-01 | Thinking/loading indicator visible for minimum duration | ✓ SATISFIED | MIN_THINKING_TIME=500, Promise.all pattern ensures ≥500ms display |
| CHAT-02 | 03-01 | Bot responses with natural typing/streaming effect | ✓ SATISFIED | streamBotResponse with 15ms/char loop, blinking cursor |
| CHAT-03 | 03-01 | Messages with smooth entrance animations (fade + slide) | ✓ SATISFIED | @keyframes message-enter, is-entering class on all messages |
| CHAT-04 | 03-01 | Chat scroll behavior remains smooth during animations | ✓ SATISFIED | scrollTo with behavior: 'smooth' at 4 locations |
| CHAT-05 | 03-02 | Agent processing state visible — sequential steps with completion indicators | ✓ SATISFIED | agentStateSteps (3 steps), updateAgentState with pending/active/completed transitions, check_circle icons |
| CHAT-06 | 03-02 | Clicking links navigates without closing chat panel | ✓ SATISFIED | Link handler has no closeChat(); internal links use scrollIntoView, external links use target="_blank" |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | No TODO/FIXME/placeholder comments found | ℹ️ Info | Clean implementation |
| — | — | No empty returns or stub implementations | ℹ️ Info | All functions substantive |
| — | — | No console.log-only implementations | ℹ️ Info | Only console.warn for API fallback (appropriate) |

### Human Verification Required

All automated checks pass (10/10 truths verified, build succeeds, no anti-patterns). The following items require browser-based testing to confirm the UX goals are truly achieved:

### 1. Thinking Indicator Visibility

**Test:** Open `http://localhost:5173`, click "Ask Quoc", type a question and submit. Observe the thinking indicator.
**Expected:** Thinking dots (or agent state steps) remain visible for at least 500ms before the answer starts appearing.
**Why human:** Timing perception requires running the browser — the code has the Promise.all pattern but actual paint timing depends on browser rendering.

### 2. Streaming Text Effect

**Test:** Ask a question and watch the bot response appear.
**Expected:** Text appears character by character (~15ms per character), with a blinking cursor `|` following the text. Cursor disappears when streaming is complete.
**Why human:** Visual animation quality — whether the streaming feels natural vs. too fast/slow — is a perceptual judgment.

### 3. Message Entrance Animations

**Test:** Ask a question, observe both your message and the bot's message appearing.
**Expected:** Both messages fade in and slide up slightly (translateY 12px → 0) over ~0.3s with a cubic-bezier easing.
**Why human:** CSS animation smoothness and aesthetic quality cannot be verified without rendering.

### 4. Internal Link Navigation

**Test:** Click a `#section` link in a bot response or source citation.
**Expected:** Page scrolls smoothly to the target section in the background. Chat panel stays open.
**Why human:** Requires live DOM — scrollIntoView behavior and chat-open state must be observed together.

### 5. External Link Navigation

**Test:** Click an external (http/https) link in a bot response or source.
**Expected:** New browser tab opens with the link. Chat panel stays open on the original tab.
**Why human:** Cross-tab behavior cannot be verified without running a browser.

### 6. Agent State Step Transitions

**Test:** Ask a question and watch the agent state indicator.
**Expected:** Three steps appear sequentially: "Đang phân tích câu hỏi..." → "Đang tìm kiếm thông tin..." → "Đang tạo câu trả lời...". Active step is highlighted, completed steps show green check_circle, pending steps are dimmed.
**Why human:** Sequential state transitions and visual feedback are runtime UI behaviors.

---

_Verified: 2026-05-29T04:30:00Z_
_Verifier: OpenCode (gsd-verifier)_
