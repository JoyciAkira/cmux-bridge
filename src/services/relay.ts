// ── Minimal typed event emitter ───────────────────────────────────────────

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
    for (const fn of this._listeners.get(event) ?? []) fn(...args);
  }
}

// ── Wire protocol types (matches cmux-relay WireProtocol.swift) ───────────

export interface Workspace {
  id: string;
  name: string;
  index: number;
}

export interface Surface {
  id: string;
  title: string;
  index: number;
}

export interface ScreenFull {
  type: 'screen.full';
  surface_id: string;
  rev: number;
  rows: string[];
  cols: number;
  rowsCount: number;
  cursor: { x: number; y: number };
}

export interface ScreenDiff {
  type: 'screen.diff';
  surface_id: string;
  rev: number;
  ops: unknown[];
}

export interface EventFrame {
  type: 'event';
  category: string;
  name: string;
  payload: unknown;
}

export type PushFrame = ScreenFull | ScreenDiff | EventFrame | { type: 'ping'; ts: number };

export type RelayStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// ── RPC helpers ───────────────────────────────────────────────────────────

interface RPCRequest { id: string; method: string; params: unknown }
interface RPCResponse { id: string; ok?: boolean; result?: unknown; error?: { code: string; message: string } }

let _rpcSeq = 0;
function newId(): string { return String(++_rpcSeq); }

// ── Relay client ──────────────────────────────────────────────────────────

const BACKOFF_STEPS = [1000, 2000, 4000, 8000, 16000, 30000];

class RelayClient extends TypedEmitter {
  private ws: WebSocket | null = null;
  private _status: RelayStatus = 'disconnected';
  private _host = '';
  private _port = 4399;
  private _token: string | null = null;
  private _deviceId: string | null = null;
  private _retryCount = 0;
  private _retryTimer: ReturnType<typeof setTimeout> | null = null;
  private _intentionalClose = false;
  private _pending = new Map<string, (r: RPCResponse) => void>();

  get status(): RelayStatus { return this._status; }

  connect(host: string, port = 4399): void {
    this._host = host;
    this._port = port;
    this._intentionalClose = false;
    this._retryCount = 0;
    this._registerAndConnect();
  }

  disconnect(): void {
    this._intentionalClose = true;
    if (this._retryTimer) { clearTimeout(this._retryTimer); this._retryTimer = null; }
    this.ws?.close();
    this.ws = null;
    this._setStatus('disconnected');
  }

  // ── Public RPC calls ──

  async listWorkspaces(): Promise<Workspace[]> {
    const res = await this._rpc('workspace.list', {});
    const raw = res as { workspaces?: Array<{ id: string; title: string; index: number }> };
    return (raw.workspaces ?? []).map((w) => ({ id: w.id, name: w.title, index: w.index }));
  }

  async listSurfaces(workspaceId: string): Promise<Surface[]> {
    const res = await this._rpc('surface.list', { workspace_id: workspaceId }) as
      { surfaces?: Array<{ id: string; title: string; index: number }> };
    return (res.surfaces ?? []).map((s) => ({ id: s.id, title: s.title, index: s.index }));
  }

  async subscribe(workspaceId: string, surfaceId: string, lines = 50): Promise<void> {
    await this._rpc('surface.subscribe', { workspace_id: workspaceId, surface_id: surfaceId, lines });
  }

  async unsubscribe(surfaceId: string): Promise<void> {
    await this._rpc('surface.unsubscribe', { surface_id: surfaceId });
  }

  async sendInput(surfaceId: string, data: string): Promise<void> {
    await this._rpc('surface.send_text', { surface_id: surfaceId, text: data });
  }

  // ── Internals ─────────────────────────────────────────────────────────

  private async _registerAndConnect(): Promise<void> {
    try {
      const res = await fetch(`http://${this._host}:${this._port}/v1/devices/me/register`, { method: 'POST' });
      if (!res.ok) { this._setStatus('error'); this.emit('error', `Registration failed: ${res.status}`); return; }
      const data = await res.json() as { device_id: string; token: string };
      this._token = data.token;
      this._deviceId = data.device_id;
      this._openSocket();
    } catch (e) {
      this._setStatus('error');
      this.emit('error', String(e));
    }
  }

  private _openSocket(): void {
    this._setStatus('connecting');
    const url = `ws://${this._host}:${this._port}/v1/ws`;
    const ws = new WebSocket(url, this._token ? [`bearer.${this._token}`] : []);
    this.ws = ws;

    ws.onopen = () => {
      const hello = { deviceId: this._deviceId, appVersion: '1.0.0', protocolVersion: 1 };
      ws.send(JSON.stringify(hello));
      this._retryCount = 0;
      this._setStatus('connected');
      this.emit('connected');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as Record<string, unknown>;
        // RPC response has an `id` field
        if (typeof msg.id === 'string' && this._pending.has(msg.id)) {
          const resolve = this._pending.get(msg.id)!;
          this._pending.delete(msg.id);
          resolve(msg as unknown as RPCResponse);
          return;
        }
        // Push frame (screen.full, screen.diff, event, ping)
        if (typeof msg.type === 'string') {
          if (msg.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong', ts: (msg as { ts: number }).ts }));
            return;
          }
          this.emit('push', msg as PushFrame);
          this.emit(msg.type, msg);
        }
      } catch { /* malformed */ }
    };

    ws.onerror = () => { this._setStatus('error'); };

    ws.onclose = () => {
      if (this._intentionalClose) return;
      this._scheduleReconnect();
    };
  }

  private _rpc(method: string, params: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState !== WebSocket.OPEN) { reject(new Error('not connected')); return; }
      const id = newId();
      const req: RPCRequest = { id, method, params };
      this._pending.set(id, (r) => {
        if (r.error) reject(new Error(r.error.message));
        else resolve(r.result ?? {});
      });
      this.ws.send(JSON.stringify(req));
    });
  }

  private _scheduleReconnect(): void {
    const delay = BACKOFF_STEPS[Math.min(this._retryCount, BACKOFF_STEPS.length - 1)];
    this._retryCount++;
    this._setStatus('disconnected');
    this.emit('reconnecting', { attempt: this._retryCount, delay });
    this._retryTimer = setTimeout(() => {
      if (!this._intentionalClose) this._registerAndConnect();
    }, delay);
  }

  private _setStatus(s: RelayStatus): void {
    if (this._status !== s) { this._status = s; this.emit('status', s); }
  }
}

// ── Singleton per Mac connection ──────────────────────────────────────────

const clients = new Map<string, RelayClient>();

export function getRelayClient(macId: string): RelayClient {
  if (!clients.has(macId)) clients.set(macId, new RelayClient());
  return clients.get(macId)!;
}

export function destroyRelayClient(macId: string): void {
  const c = clients.get(macId);
  if (c) { c.disconnect(); clients.delete(macId); }
}

// Legacy type exports for compatibility
export type { RelayClient };
export type AgentEvent = 'agent_complete' | 'agent_error' | 'awaiting_input';
