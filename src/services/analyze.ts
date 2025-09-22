import type { AnalysisResponse, StreamEvent } from '@/types/analysis';

// APIベースURLの解決を共通化（失敗時は'/api'へフォールバック）
// .env には通常、オリジン（例: http://localhost:8787）を入れる想定。
// 必要なら末尾に自動で '/api' を付与する。
const PRIMARY_BASE: string = (() => {
  const raw = (import.meta as any).env?.VITE_PITCHCART_API_URL as string | undefined;
  if (!raw || raw.length === 0) return '/api';
  const normalized = raw.endsWith('/') ? raw.slice(0, -1) : raw;
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
})();

export const API_BASE = PRIMARY_BASE;

// フォールバックは混乱の元になるため無効化（明示的にBASEのみを使用）
async function fetchWithFallback(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, init);
}

export async function postAnalyze(input: any): Promise<AnalysisResponse> {
  const res = await fetchWithFallback(`${PRIMARY_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input ?? {}),
  });
  if (!res.ok) throw new Error(`analyze failed: ${res.status}`);
  return res.json();
}

// フォームデータ（ファイル含む）での送信
export async function postAnalyzeForm(form: FormData): Promise<AnalysisResponse & { imageUrls?: string[] }> {
  const res = await fetchWithFallback(`${PRIMARY_BASE}/analyze`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    // 可能ならエラーメッセージを取り出す
    try {
      const errJson = await res.json();
      throw new Error(`analyze failed: ${res.status} ${errJson?.message ?? ''}`.trim());
    } catch {
      throw new Error(`analyze failed: ${res.status}`);
    }
  }
  return res.json();
}

export type StreamHandler = (evt: StreamEvent) => void;

// APIヘルスチェック
export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetchWithFallback(`${PRIMARY_BASE}/health`, { method: 'GET' });
    if (!res.ok) return false;
    const j = await res.json().catch(() => ({}));
    return Boolean(j && (j.ok === true || j.version));
  } catch {
    return false;
  }
}

// POST SSE reader (EventSourceはGET専用なのでfetch+ReadableStreamで読む)
export async function streamAnalyze(input: any, onEvent: StreamHandler, signal?: AbortSignal): Promise<void> {
  const controller = new AbortController();
  const combined = mergeAbortSignals(signal, controller.signal);
  const res = await fetchWithFallback(`${PRIMARY_BASE}/analyze/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify(input ?? {}),
    signal: combined,
  });
  if (!res.ok || !res.body) throw new Error(`stream failed: ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const rawEvent = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const evt = parseSseEvent(rawEvent);
        if (evt) onEvent(evt);
      }
    }
  } finally {
    try { reader.releaseLock(); } catch {}
  }
}

// フォームデータ（ファイル含む）でSSEストリーミング
export async function streamAnalyzeForm(
  form: FormData,
  onEvent: (event: StreamEvent) => void,
  onComplete: (fullResponse: AnalysisResponse) => void,
): Promise<void> {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }
  
  // This service function will now use the sync endpoint and simulate streaming
  // because the backend logic for streaming individual parts separately from the
  // full response (which includes slides_struct) is complex.
  // We get the full response and then send the events.
  const fullResponse: AnalysisResponse = await response.json();
  
  fullResponse.personas.forEach(p => {
    onEvent({ type: 'persona', data: p });
  });
  onEvent({ type: 'consensus', data: fullResponse.consensus });
  onEvent({ type: 'done', data: {} });

  // Finally, call the onComplete callback with the full data
  onComplete(fullResponse);
}

function parseSseEvent(chunk: string): StreamEvent | null {
  const lines = chunk.split(/\r?\n/);
  let event = 'message';
  let data = '';
  for (const line of lines) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) data += line.slice(5).trim();
  }
  try {
    const json = data ? JSON.parse(data) : {};
    if (event === 'done') return { type: 'done' };
    if (json && (json.type === 'persona' || json.type === 'consensus')) return json as StreamEvent;
  } catch {
    // ignore bad chunk
  }
  return null;
}

function mergeAbortSignals(a?: AbortSignal, b?: AbortSignal): AbortSignal | undefined {
  if (!a && !b) return undefined;
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  a?.addEventListener('abort', onAbort);
  b?.addEventListener('abort', onAbort);
  if (a?.aborted || b?.aborted) controller.abort();
  return controller.signal;
}
