import { getToken } from './client';
import type { OrderResponse } from './types';

// A hand-rolled SSE reader instead of the browser's EventSource: EventSource
// can't send an Authorization header, and putting the JWT in the URL as a
// workaround would leak it into server logs and browser history.
export function streamOrderStatus(
  orderId: string,
  onStatus: (status: OrderResponse['status']) => void,
  signal: AbortSignal,
): void {
  const token = getToken();
  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  fetch(`/api/orders/${orderId}/stream`, { headers, signal })
    .then(async (response) => {
      if (!response.ok || !response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) return;
        buffer += decoder.decode(value, { stream: true });

        let separatorIndex = buffer.indexOf('\n\n');
        while (separatorIndex !== -1) {
          const frame = buffer.slice(0, separatorIndex);
          buffer = buffer.slice(separatorIndex + 2);

          const dataLine = frame.split('\n').find((line) => line.startsWith('data:'));
          if (dataLine) {
            try {
              const parsed = JSON.parse(dataLine.slice(5).trim()) as { status: OrderResponse['status'] };
              onStatus(parsed.status);
            } catch {
              /* malformed/partial frame — the next complete one still arrives */
            }
          }

          separatorIndex = buffer.indexOf('\n\n');
        }
      }
    })
    .catch((err) => {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      /* stream failed — the page keeps whatever status it last knew */
    });
}
