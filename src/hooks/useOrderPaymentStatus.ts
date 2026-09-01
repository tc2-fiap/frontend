import { useEffect, useRef, useState } from 'react';
import { paymentsApi } from '../api/endpoints';
import { streamOrderStatus } from '../api/sse';
import type { OrderResponse, PaymentCheckoutResponse } from '../api/types';

const PIX_RETRY_DELAYS_MS = [1000, 2000];

interface OrderPaymentStatus {
  status: OrderResponse['status'];
  payment: PaymentCheckoutResponse | null;
  pixVisible: boolean;
  isGenericPix: boolean;
  copied: boolean;
  copyPixCode: (code: string) => Promise<void>;
}

// Shared by OrderStatusPage and CheckoutPage's post-order phase: the order's
// Pending -> Paid/Failed transition is delivered via SSE (orders-api pushes
// the current status immediately, then one more update on transition — see
// notes.md entry 53), and PIX checkout data is fetched once, with a short
// bounded retry, since the Payment row is created asynchronously once
// payments-api consumes OrderPlacedEvent.
export function useOrderPaymentStatus(orderId: string, initialStatus: OrderResponse['status']): OrderPaymentStatus {
  const [status, setStatus] = useState(initialStatus);
  const [payment, setPayment] = useState<PaymentCheckoutResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const pixFetchStarted = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    streamOrderStatus(orderId, setStatus, controller.signal);
    return () => controller.abort();
  }, [orderId]);

  useEffect(() => {
    if (status !== 'Pending' || pixFetchStarted.current) return;
    pixFetchStarted.current = true;
    let cancelled = false;

    async function fetchWithRetry(attempt: number): Promise<void> {
      try {
        const result = await paymentsApi.checkout(orderId);
        if (!cancelled) setPayment(result);
      } catch {
        if (cancelled || attempt >= PIX_RETRY_DELAYS_MS.length) return;
        await new Promise((resolve) => setTimeout(resolve, PIX_RETRY_DELAYS_MS[attempt]));
        if (!cancelled) await fetchWithRetry(attempt + 1);
      }
    }

    fetchWithRetry(0);
    return () => {
      cancelled = true;
    };
  }, [orderId, status]);

  async function copyPixCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard access denied — the code is still visible to copy by hand */
    }
  }

  // The simulated gateway's Payment row isn't created until its own
  // artificial delay (default 5s, see notes.md 7/58) finishes — by which
  // point the order has already resolved, so the PIX fetch above almost
  // never wins the race for it. pixVisible therefore shows a placeholder
  // the moment the order is Pending, rather than waiting on that fetch;
  // isGenericPix only flips to the real QR once a real gateway's payment
  // data actually arrives in time.
  const pixVisible = status === 'Pending';
  const hasRealPix = payment !== null && payment.gateway !== 'simulated' && (payment.pixQrCodeBase64 !== null || payment.pixCopyPasteCode !== null);
  const isGenericPix = !hasRealPix;

  return { status, payment, pixVisible, isGenericPix, copied, copyPixCode };
}
