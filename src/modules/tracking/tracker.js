const TRACK_API_URL = 'http://localhost:8000/api/v1';
const FLUSH_INTERVAL = 5000;
const FLUSH_THRESHOLD = 10;
const HEARTBEAT_INTERVAL = 30000;
const MAX_RETRIES = 3;

export class Tracker {
  constructor() {
    this.queue = [];
    this.retryQueue = [];
    this.sessionId = null;
    this.flushTimer = null;
    this.heartbeatTimer = null;
    this.retries = new Map();
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.sessionId = this._getOrCreateSessionId();
    this.initialized = true;

    this.track('session_start', { session_id: this.sessionId });
    this._startFlushTimer();
    this._startHeartbeat();
    this._bindUnloadHandler();
  }

  track(eventType, payload = {}) {
    const event = {
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
      event_type: eventType,
      payload: { ...payload }
    };
    this.queue.push(event);
    if (this.queue.length >= FLUSH_THRESHOLD) {
      this._flush();
    }
  }

  async flush() {
    await this._flush();
  }

  async _flush() {
    if (this.queue.length === 0) return;
    const batch = [...this.queue];
    this.queue = [];

    try {
      await fetch(`${TRACK_API_URL}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch.length === 1 ? batch[0] : batch)
      });
    } catch (err) {
      // Retry with exponential backoff
      for (const event of batch) {
        const retryCount = this.retries.get(event) || 0;
        if (retryCount < MAX_RETRIES) {
          this.retries.set(event, retryCount + 1);
          this.retryQueue.push({ event, delay: Math.pow(2, retryCount) * 1000 });
        } else {
          // Beacon API fallback for critical events
          this._sendBeacon(event);
          this.retries.delete(event);
        }
      }
      this._processRetryQueue();
    }
  }

  _sendBeacon(event) {
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(event)], { type: 'application/json' });
      navigator.sendBeacon(`${TRACK_API_URL}/track`, blob);
    }
  }

  _processRetryQueue() {
    for (const item of this.retryQueue) {
      setTimeout(async () => {
        try {
          await fetch(`${TRACK_API_URL}/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.event),
            keepalive: true
          });
          this.retries.delete(item.event);
        } catch {
          // Will be retried again or fall back to beacon
        }
      }, item.delay);
    }
    this.retryQueue = [];
  }

  startHeartbeat() {
    this._startHeartbeat();
  }

  _startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(async () => {
      try {
        await fetch(`${TRACK_API_URL}/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: this.sessionId }),
          keepalive: true
        });
      } catch {
        // Heartbeat failure is non-critical
      }
    }, HEARTBEAT_INTERVAL);
  }

  _startFlushTimer() {
    this.flushTimer = setInterval(() => this._flush(), FLUSH_INTERVAL);
  }

  _bindUnloadHandler() {
    window.addEventListener('beforeunload', () => {
      this.track('session_end', { session_id: this.sessionId });
      if (this.queue.length > 0) {
        this._sendBeacon(this.queue[this.queue.length - 1]);
      }
      if (this.flushTimer) clearInterval(this.flushTimer);
      if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    });
  }

  _getOrCreateSessionId() {
    let id = sessionStorage.getItem('portfolio_session_id');
    if (!id) {
      id = 'session_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      sessionStorage.setItem('portfolio_session_id', id);
    }
    return id;
  }

  destroy() {
    if (this.flushTimer) clearInterval(this.flushTimer);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this._flush();
  }
}

// Global singleton
let trackerInstance = null;

export function getTracker() {
  if (!trackerInstance) {
    trackerInstance = new Tracker();
  }
  return trackerInstance;
}

// Backward compatibility — global trackEvent() delegates to Tracker
window.trackEvent = function(eventType, payload = {}) {
  const tracker = getTracker();
  if (tracker.initialized) {
    tracker.track(eventType, payload);
  } else {
    // Fallback: queue until init
    tracker.queue.push({
      session_id: tracker._getOrCreateSessionId(),
      timestamp: new Date().toISOString(),
      event_type: eventType,
      payload
    });
  }
};
