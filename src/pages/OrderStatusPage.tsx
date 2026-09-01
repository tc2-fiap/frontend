import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { catalogApi, ordersApi, paymentsApi } from '../api/endpoints';
import { streamOrderStatus } from '../api/sse';
import type { GameResponse, OrderResponse, PaymentCheckoutResponse } from '../api/types';
import { useLocale } from '../i18n/LocaleContext';
import { useQuotation } from '../hooks/useQuotation';
import { brlToUsd, formatPrice } from '../utils/currency';

const PIX_RETRY_DELAYS_MS = [1000, 2000];

function toImageSrc(base64: string): string {
  return base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
}

export function OrderStatusPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [games, setGames] = useState<Record<string, GameResponse>>({});
  const [payment, setPayment] = useState<PaymentCheckoutResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { t } = useLocale();
  const rate = useQuotation();
  const pixFetchStarted = useRef(false);

  // Order status drives the checkout — this is the only place a purchase's
  // Pending -> Paid/Failed transition (and, while Pending, its PIX checkout
  // data) becomes visible without a manual refresh. Delivered via SSE
  // instead of polling: orders-api pushes the current status immediately,
  // then one more update when the order leaves Pending. See instructions.md
  // §7 and notes.md (polling -> SSE decision).
  useEffect(() => {
    if (!orderId) return;
    const controller = new AbortController();

    ordersApi
      .get(orderId)
      .then((result) => setOrder(result))
      .catch(() => setError(t('orderStatus.loadError')));

    streamOrderStatus(orderId, (status) => setOrder((prev) => (prev ? { ...prev, status } : prev)), controller.signal);

    return () => controller.abort();
  }, [orderId, t]);

  // Each purchased game's own details — fetched once per item id, not on
  // every status update, since a game's title/image doesn't change
  // mid-purchase.
  const itemIds = order?.items.map((item) => item.gameId).join(',') ?? '';
  useEffect(() => {
    if (!itemIds) return;
    let cancelled = false;
    Promise.all(itemIds.split(',').map((id) => catalogApi.get(id).catch(() => null))).then((results) => {
      if (cancelled) return;
      setGames(Object.fromEntries(results.filter((g): g is GameResponse => g !== null).map((g) => [g.id, g])));
    });
    return () => {
      cancelled = true;
    };
  }, [itemIds]);

  // PIX checkout data is fetched once, with a short bounded retry, instead
  // of on every status update — the Payment row is created asynchronously
  // once payments-api consumes OrderPlacedEvent, so it may not exist yet the
  // first time this fires.
  useEffect(() => {
    if (!orderId || order?.status !== 'Pending' || pixFetchStarted.current) return;
    pixFetchStarted.current = true;
    let cancelled = false;

    async function fetchWithRetry(attempt: number): Promise<void> {
      try {
        const result = await paymentsApi.checkout(orderId!);
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
  }, [orderId, order?.status]);

  async function copyPixCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard access denied — the code is still visible to copy by hand */
    }
  }

  if (error) return <p className="error">{error}</p>;
  if (!order) return <p className="muted">{t('orderStatus.loading')}</p>;

  const usdTotal = rate !== null ? brlToUsd(order.totalPrice, rate) : null;
  const showPixSection =
    order.status === 'Pending' && payment && payment.gateway !== 'simulated' && (payment.pixQrCodeBase64 || payment.pixCopyPasteCode);

  const statusKey = order.status.toLowerCase();

  return (
    <div style={{ maxWidth: 900 }}>
      <h1>{t('orderStatus.orderPrefix', { id: order.id.slice(0, 8) })}</h1>

      <div className="order-status-columns">
        <div>
          <h2 className="section-title">{t('orderStatus.itemsTitle')}</h2>
          <div className="card">
            {order.items.map((item) => {
              const game = games[item.gameId];
              return (
                <div key={item.gameId} className="checkout-line-item">
                  {game?.coverImageUrl ? (
                    <img className="game-card-cover" src={game.coverImageUrl} alt={game.title} />
                  ) : (
                    <div className="game-card-cover-fallback" aria-hidden="true">
                      {game?.title.charAt(0) ?? '?'}
                    </div>
                  )}
                  {game && (
                    <>
                      <h3>{game.title}</h3>
                      <div className="meta">
                        {game.genre} · {game.platform} · {t('orderStatus.quantity', { qty: 1 })}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="section-title">{t('orderStatus.statusTitle')}</h2>
          <div className={`card order-status-box order-status-box-${statusKey}`}>
            <span className={`badge ${statusKey} order-status-badge`}>{t(`status.${order.status}`)}</span>

            {order.status === 'Pending' && !showPixSection && <p className="muted">{t('orderStatus.waiting')}</p>}

            {showPixSection && payment && (
              <div className="pix-checkout">
                {payment.pixQrCodeBase64 && (
                  <img className="pix-qr-code" src={toImageSrc(payment.pixQrCodeBase64)} alt={t('orderStatus.pixTitle')} />
                )}
                <p className="muted">{t('orderStatus.pixTitle')}</p>
                {payment.pixCopyPasteCode && (
                  <div className="field">
                    <label>{t('orderStatus.pixCopyPaste')}</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="text" readOnly value={payment.pixCopyPasteCode} />
                      <button type="button" className="btn secondary" onClick={() => copyPixCode(payment.pixCopyPasteCode!)}>
                        {copied ? t('orderStatus.copied') : t('orderStatus.copy')}
                      </button>
                    </div>
                  </div>
                )}
                <p className="muted">{t('orderStatus.autoConfirm')}</p>
              </div>
            )}

            {order.status === 'Paid' && <p>{t('orderStatus.paidMessage')}</p>}
            {order.status === 'Failed' && <p className="error">{t('orderStatus.failedMessage')}</p>}
          </div>

          <h2 className="section-title">{t('orderStatus.priceTitle')}</h2>
          <div className="card">
            <p className="price" style={{ margin: 0 }}>
              {formatPrice(order.totalPrice, 'BRL')}
              {usdTotal !== null && <span className="muted"> (≈ {formatPrice(usdTotal, 'USD')})</span>}
            </p>
          </div>

          <Link to="/library" className="btn secondary" style={{ marginTop: 20, display: 'inline-block' }}>
            {t('orderStatus.goToLibrary')}
          </Link>
        </div>
      </div>
    </div>
  );
}
