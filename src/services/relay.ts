// ── Minimal typed event emitter (no Node dependency) ─────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Listener = (...args: any[]) => void;

class TypedEmitter {
  private _listeners: Map<string, Listener[]> = new Map();

  on(event: string, fn: Listener): this {
    const list = this._listeners.get(event) ?? [];
    list.push(fn);
    this._listeners.set(event, list);
    return this;
  }

  off(event: string, fn: Listener): this {
    const list = this._listeners.get(event) ?? [];
    this._listeners.set(event, list.filter((l) => l !== fn));
    return this;
  }

  emit(event: string, ...args: unknown[]): void {
    for (const fn of this._listeners.get(event) ?? []) {
      fn(...args);
    }
  }
}

// ── Inbound message types from cmux-relay ──────────────────────────────────

export type AgentEvent = 'agent_complete' | 'agent_error' | 'awaiting_input';

export type RelayMessage =
  | { type: 'ack' }
  | { type: 'output'; workspaceId: string; surfaceId: string; data: string }
  | { type: 'workspaces'; items: WorkspaceItem[] }
  | { type: 'event'; event: AgentEvent; workspaceId: string; message?: string }
  | { type: 'error'; code: string; message: string };

export interface WorkspaceItem {
  id: string;
  name: string;
  surfaces: SurfaceItem[];
  status: 'active' | 'idle';
  lastActivity: number;
}

export interface SurfaceItem {
  id: string;
  name: string;
  cols: number;
  rows: number;
}

// ── Outbound message types ─────────────────────────────────────────────────

type OutboundMessage =
  | { type: 'list' }
  | { type: 'subscribe'; workspaceId: string; surfaceId: string }
  | { type: 'unsubscribe'; workspaceId: string; surfaceId: string }
  | { type: 'input'; data: string };

// ── Relay client ───────────────────────────────────────────────────────────

export type RelayStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

const BACKOFF_STEPS = [1000, 2000, 4000, 8000, 16000, 30000];

class RelayClient extends TypedEmitter {
  private ws: WebSocket | null = null;
  private _status: RelayStatus = 'disconnected';
  private _host = '';
  private _port = 4399;
  private _retryCount = 0;
  private _retryTimer: ReturnType<typeof setTimeout> | null = null;
  private _intentionalClose = false;

  get status(): RelayStatus {
    return this._status;
  }

  connect(host: string, port = 4399): void {
    this._host = host;
    this._port = port;
    this._intentionalClose = false;
    this._retryCount = 0;
    this._openSocket();
  }

  disconnect(): void {
    this._intentionalClose = true;
    if (this._retryTimer) {
      clearTimeout(this._retryTimer);
      this._retryTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this._setStatus('disconnected');
  }

  send(msg: OutboundMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  list(): void {
    this.send({ type: 'list' });
  }

  subscribe(workspaceId: string, surfaceId: string): void {
    this.send({ type: 'subscribe', workspaceId, surfaceId });
  }

  unsubscribe(workspaceId: string, surfaceId: string): void {
    this.send({ type: 'unsubscribe', workspaceId, surfaceId });
  }

  sendInput(data: string): void {
    // data should be base64-encoded
    this.send({ type: 'input', data });
  }

  private _openSocket(): void {
    this._setStatus('connecting');
    const url = `ws://${this._host}:${this._port}/ws`;
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      this._retryCount = 0;
      this._setStatus('connected');
      this.emit('connected');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as RelayMessage;
        this.emit('message', msg);
        this.emit(msg.type, msg);
      } catch {
        // malformed frame — ignore
      }
    };

    ws.onerror = () => {
      this._setStatus('error');
    };

    ws.onclose = () => {
      if (this._intentionalClose) return;
      this._scheduleReconnect();
    };
  }

  private _scheduleReconnect(): void {
    const delay = BACKOFF_STEPS[Math.min(this._retryCount, BACKOFF_STEPS.length - 1)];
    this._retryCount++;
    this._setStatus('disconnected');
    this.emit('reconnecting', { attempt: this._retryCount, delay });
    this._retryTimer = setTimeout(() => {
      if (!this._intentionalClose) this._openSocket();
    }, delay);
  }

  private _setStatus(s: RelayStatus): void {
    if (this._status !== s) {
      this._status = s;
      this.emit('status', s);
    }
  }
}

// ── Singleton per Mac connection ───────────────────────────────────────────
// We keep one client per Mac ID so the connection survives navigation.

const clients = new Map<string, RelayClient>();

export function getRelayClient(macId: string): RelayClient {
  if (!clients.has(macId)) {
    clients.set(macId, new RelayClient());
  }
  return clients.get(macId)!;
}

export function destroyRelayClient(macId: string): void {
  const c = clients.get(macId);
  if (c) {
    c.disconnect();
    clients.delete(macId);
  }
}
