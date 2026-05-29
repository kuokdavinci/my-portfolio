import { buildKnowledgeBase, generateChatbotAnswer } from './chatbot-rag.js';

const CHAT_API_URL = 'http://localhost:8000/api/v1/chat';
const MIN_THINKING_TIME = 500; // ms

const agentStateSteps = [
  { id: 'analyzing', label: 'Đang phân tích câu hỏi...', icon: 'search' },
  { id: 'retrieving', label: 'Đang tìm kiếm thông tin...', icon: 'database_search' },
  { id: 'generating', label: 'Đang tạo câu trả lời...', icon: 'smart_toy' },
];

function updateAgentState(thinkingMessage, completedStepId) {
  if (!thinkingMessage || !thinkingMessage.parentNode) return;

  const steps = thinkingMessage.querySelectorAll('.agent-state-step');
  let foundCompleted = false;

  steps.forEach(stepEl => {
    const stepId = stepEl.dataset.step;
    const statusEl = stepEl.querySelector('.state-status');
    const iconEl = stepEl.querySelector('.state-icon');

    if (foundCompleted || stepId === completedStepId) {
      // Mark this step as completed
      stepEl.dataset.status = 'completed';
      stepEl.classList.remove('state-pending', 'state-active');
      stepEl.classList.add('state-completed');
      if (statusEl) statusEl.innerHTML = '<span class="material-symbols-outlined state-check" style="color: var(--color-success, #4caf50); font-size: 18px;">check_circle</span>';
      if (iconEl) iconEl.style.color = 'var(--color-success, #4caf50)';
      foundCompleted = true;
    } else if (!foundCompleted) {
      // Mark as active (current step)
      stepEl.dataset.status = 'active';
      stepEl.classList.remove('state-pending', 'state-completed');
      stepEl.classList.add('state-active');
    }
    // Steps after the completed one remain pending
  });
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}

function parseMarkdown(text) {
  if (!text) return '';
  
  let html = escapeHtml(text);
  
  // Bold: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic: *text*
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Inline code: `code`
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  
  // Markdown links: [text](url)
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, (match, text, url) => {
    const isExternal = url.startsWith('http') || url.startsWith('mailto:');
    const targetAttr = isExternal ? 'target="_blank" rel="noopener"' : '';
    return `<a href="${url}" ${targetAttr} class="rag-chat-inline-link" style="color: var(--color-primary); text-decoration: underline;">${text}</a>`;
  });
  
  // Convert lines to lists or paragraphs
  const lines = html.split('\n');
  let result = [];
  let inList = false;
  
  for (let line of lines) {
    let trimmed = line.trim();
    
    // Check for bullet list
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) {
        result.push('<ul class="rag-chat-bullet-list" style="list-style-type: disc; padding-left: 1.25rem; margin: 0.5rem 0;">');
        inList = true;
      }
      let content = trimmed.substring(2);
      result.push(`<li>${content}</li>`);
    } else {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      
      if (trimmed) {
        result.push(`<p style="margin: 0.5rem 0;">${trimmed}</p>`);
      } else {
        result.push('<div style="height: 0.5rem;"></div>');
      }
    }
  }
  
  if (inList) {
    result.push('</ul>');
  }
  
  return result.join('\n');
}

function safeTrackEvent(eventType, payload = {}) {
  if (typeof window.trackEvent === 'function') {
    window.trackEvent(eventType, payload);
  } else if (typeof trackEvent === 'function') {
    // eslint-disable-next-line no-undef
    trackEvent(eventType, payload);
  } else {
    console.debug('Tracking event (no SDK):', eventType, payload);
  }
}

function getSessionId() {
  let sessionId = sessionStorage.getItem('portfolio_session_id');
  if (!sessionId) {
    sessionId = 'session_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('portfolio_session_id', sessionId);
  }
  return sessionId;
}

export function addChatMessage(container, role, content, sources = []) {
  const message = document.createElement('div');
  message.className = `rag-chat-message ${role === 'user' ? 'is-user' : 'is-bot'} is-entering`;

  const sourceMarkup = sources.length
    ? `<div class="rag-chat-sources">${sources.map(source => {
        if (typeof source === 'object' && source.link) {
          const isExternal = source.link.startsWith('http');
          const targetAttr = isExternal ? 'target="_blank" rel="noopener"' : '';
          return `<a href="${escapeHtml(source.link)}" ${targetAttr} class="rag-chat-source-link">${escapeHtml(source.title)}</a>`;
        }
        return `<span>${escapeHtml(source)}</span>`;
      }).join('')}</div>`
    : '';

  const parsedContent = role === 'bot' ? parseMarkdown(content) : `<p>${escapeHtml(content)}</p>`;

  message.innerHTML = `
    <div class="rag-chat-bubble">
      ${parsedContent}
      ${sourceMarkup}
    </div>
  `;

  container.appendChild(message);
  container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });

  setTimeout(() => {
    message.classList.remove('is-entering');
  }, 300);
}

export async function streamBotResponse(container, text, sources = []) {
  const message = document.createElement('div');
  message.className = 'rag-chat-message is-bot is-entering';

  const bubble = document.createElement('div');
  bubble.className = 'rag-chat-bubble';
  const streamContent = document.createElement('div');
  streamContent.innerHTML = '<span class="streaming-text"></span><span class="streaming-cursor">|</span>';
  bubble.appendChild(streamContent);
  message.appendChild(bubble);
  container.appendChild(message);

  const textSpan = streamContent.querySelector('.streaming-text');
  const cursorSpan = streamContent.querySelector('.streaming-cursor');

  let currentText = '';
  const delay = 15; // ms per character

  for (let i = 0; i < text.length; i++) {
    currentText += text[i];
    textSpan.textContent = currentText;
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // Streaming complete — render full markdown and remove cursor
  streamContent.innerHTML = parseMarkdown(text);

  if (sources.length) {
    const sourcesDiv = document.createElement('div');
    sourcesDiv.className = 'rag-chat-sources';
    sourcesDiv.innerHTML = sources.map(source => {
      if (typeof source === 'object' && source.link) {
        const isExternal = source.link.startsWith('http');
        const targetAttr = isExternal ? 'target="_blank" rel="noopener"' : '';
        return `<a href="${escapeHtml(source.link)}" ${targetAttr} class="rag-chat-source-link">${escapeHtml(source.title)}</a>`;
      }
      return `<span>${escapeHtml(source)}</span>`;
    }).join('');
    bubble.appendChild(sourcesDiv);
  }

  setTimeout(() => {
    message.classList.remove('is-entering');
  }, 300);

  container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
}

export function setupPortfolioChatbot(portfolioConfig) {
  if (document.querySelector('.rag-chatbot')) return;

  const knowledgeBase = buildKnowledgeBase(portfolioConfig);
  const chatbot = document.createElement('section');
  chatbot.className = 'rag-chatbot';
  chatbot.setAttribute('aria-label', 'Portfolio RAG chatbot');
  chatbot.innerHTML = `
    <button class="rag-chat-toggle" type="button" aria-expanded="false" aria-controls="portfolio-chat-panel" aria-label="Open chatbot">
      <span class="material-symbols-outlined">forum</span>
    </button>
    <div class="rag-chat-panel" id="portfolio-chat-panel" hidden>
      <div class="rag-chat-header">
        <div>
          <p class="rag-chat-kicker">Portfolio RAG</p>
          <h2>Ask about Quoc</h2>
        </div>
        <button class="rag-chat-close" type="button" aria-label="Close chatbot">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="rag-chat-messages" aria-live="polite"></div>
      <div class="rag-chat-prompts" aria-label="Suggested questions">
        <button type="button">What AI work has Quoc done?</button>
        <button type="button">Which backend skills does he have?</button>
        <button type="button">Show relevant projects</button>
      </div>
      <form class="rag-chat-form">
        <label class="sr-only" for="rag-chat-input">Ask a question</label>
        <input id="rag-chat-input" name="question" autocomplete="off" placeholder="Ask about skills, projects, contact..." />
        <button type="submit" aria-label="Send question">
          <span class="material-symbols-outlined">send</span>
        </button>
      </form>
    </div>
  `;

  document.body.appendChild(chatbot);

  const toggle = chatbot.querySelector('.rag-chat-toggle');
  const panel = chatbot.querySelector('.rag-chat-panel');
  const closeButton = chatbot.querySelector('.rag-chat-close');
  const messages = chatbot.querySelector('.rag-chat-messages');
  const form = chatbot.querySelector('.rag-chat-form');
  const input = chatbot.querySelector('#rag-chat-input');
  const promptButtons = chatbot.querySelectorAll('.rag-chat-prompts button');

  const openChat = () => {
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    toggle.style.display = 'none';
    requestAnimationFrame(() => input.focus());
  };

  const closeChat = () => {
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.style.display = 'inline-flex';
    toggle.focus();
  };

  const heroTrigger = document.getElementById('hero-chat-trigger');
  if (heroTrigger) {
    heroTrigger.addEventListener('click', openChat);
  }

  const askQuestion = async (question) => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) return;

    safeTrackEvent('chat_query', { query: trimmedQuestion });

    addChatMessage(messages, 'user', trimmedQuestion);

    // 1. Add agent state indicator bubble
    const thinkingMessage = document.createElement('div');
    thinkingMessage.className = 'rag-chat-message is-bot is-thinking';
    thinkingMessage.innerHTML = `
      <div class="rag-chat-bubble">
        <div class="agent-state-indicator">
          ${agentStateSteps.map((step, i) => `
            <div class="agent-state-step" data-step="${step.id}" data-status="pending">
              <span class="material-symbols-outlined state-icon">${step.icon}</span>
              <span class="state-label">${step.label}</span>
              <span class="state-status"></span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    messages.appendChild(thinkingMessage);
    messages.scrollTop = messages.scrollHeight;

    const removeThinking = () => {
      if (thinkingMessage.parentNode) {
        thinkingMessage.parentNode.removeChild(thinkingMessage);
      }
    };

    try {
      const sessionId = getSessionId();

      // Step 1: Analyzing
      updateAgentState(thinkingMessage, 'analyzing');

      // Step 2: Retrieving — during fetch
      updateAgentState(thinkingMessage, 'retrieving');

      const [response] = await Promise.all([
        fetch(CHAT_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            session_id: sessionId,
            message: trimmedQuestion
          })
        }),
        new Promise(resolve => setTimeout(resolve, MIN_THINKING_TIME))
      ]);

      // Step 3: Generating — response received
      updateAgentState(thinkingMessage, 'generating');

      removeThinking();

      if (response.ok) {
        const data = await response.json();
        await streamBotResponse(messages, data.answer, data.sources);
      } else {
        throw new Error('API server returned error code ' + response.status);
      }
    } catch (error) {
      console.warn('Backend chatbot API failed, falling back to local generation:', error);

      // For local fallback: retrieving + generating happen together
      updateAgentState(thinkingMessage, 'retrieving');
      await new Promise(resolve => setTimeout(resolve, MIN_THINKING_TIME));
      updateAgentState(thinkingMessage, 'generating');
      removeThinking();

      const localResponse = generateChatbotAnswer(trimmedQuestion, knowledgeBase);
      await streamBotResponse(messages, localResponse.answer, localResponse.sources);
    }
  };

  addChatMessage(
    messages,
    'bot',
    "Hi, I can retrieve information from this portfolio. Ask about Quoc's projects, skills, AI focus, journey, or contact details."
  );

  messages.addEventListener('click', (e) => {
    const link = e.target.closest('.rag-chat-source-link');
    if (link && link.getAttribute('href').startsWith('#')) {
      closeChat();
    }
  });

  toggle.addEventListener('click', () => {
    if (panel.hidden) {
      openChat();
    } else {
      closeChat();
    }
  });

  closeButton.addEventListener('click', closeChat);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    askQuestion(input.value);
    input.value = '';
  });

  promptButtons.forEach(button => {
    button.addEventListener('click', () => {
      openChat();
      askQuestion(button.textContent);
    });
  });
}
