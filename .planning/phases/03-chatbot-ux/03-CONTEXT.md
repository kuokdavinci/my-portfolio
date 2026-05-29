# Phase 3: Chatbot UX Enhancement - Context

**Gathered:** 2026-05-29
**Status:** Ready for planning (Plan 02 — extension)
**Source:** User request via /gsd-plan-phase

<domain>
## Phase Boundary

This is an extension of Phase 3 (Chatbot UX Enhancement). Plan 01 covers the original requirements (CHAT-01 to CHAT-04: thinking indicator, streaming, animations, smooth scroll). Plan 02 adds two new UX improvements requested by the user:

1. **Agent state visibility** — Show the agent's processing state in the chat UI: when it's retrieving knowledge, when it's generating the answer, and when tools/steps are completed
2. **Link behavior** — When clicking links in chat messages/sources, navigate to them WITHOUT closing the chat panel

</domain>

<decisions>
## Implementation Decisions

### Agent State Display
- Agent state must be visible in the chat UI as a progress indicator during answer generation
- State steps: "Đang phân tích câu hỏi..." → "Đang tìm kiếm thông tin..." → "Đang tạo câu trả lời..." → "Hoàn thành"
- Each step should show completion status (checkmark or similar) when done
- State indicator replaces or enhances the existing thinking dots animation
- State steps should be sequential and visible to the user

### Link Behavior
- Clicking internal links (href starting with #) should navigate to the section WITHOUT closing the chat panel
- Clicking external links (http/https) should open in a new tab (existing behavior) WITHOUT closing the chat panel
- The chat panel must remain open after any link click
- Remove the current `closeChat()` call from the message click handler

### OpenCode's Discretion
- Exact visual design of agent state steps (colors, icons, animation)
- Whether to keep the thinking dots alongside state text or replace them
- Specific CSS styling for state indicators

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Chatbot Implementation
- `src/modules/chatbot/chatbot-ui.js` — Current chatbot UI with askQuestion, streamBotResponse, message click handler
- `src/modules/chatbot/chatbot-rag.js` — Knowledge retrieval (buildKnowledgeBase, retrieveKnowledge, generateChatbotAnswer)
- `.planning/phases/03-chatbot-ux/03-01-PLAN.md` — Existing Plan 01 (thinking time, streaming, animations)

### Portfolio Configuration
- `src/data/portfolio-config.js` — Portfolio data used by knowledge base

</canonical_refs>

<specifics>
## Specific Ideas

- User said: "Hiển thị luôn state của agent như là đang gọi tool, hoàn thành tool chưa?" — Show agent state like "calling tool", "tool completed yet?"
- User said: "khi ấn vào liên kết thì nó nên direct qua và không tắt khung chat" — When clicking links, should navigate directly and NOT close the chat frame
- Current code at chatbot-ui.js line 303-308: `messages.addEventListener('click', ...)` closes chat on internal link click
- The RAG pipeline has natural steps: tokenize → retrieve knowledge → generate answer → stream response

</specifics>

<deferred>
## Deferred Ideas

- None — user request is focused and clear

</deferred>

---

*Phase: 03-chatbot-ux*
*Context gathered: 2026-05-29 via user request*
