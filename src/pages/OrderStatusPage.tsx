import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { catalogApi, ordersApi, paymentsApi } from '../api/endpoints';
import type { GameResponse, OrderResponse, PaymentCheckoutResponse } from '../api/types';
import { useLocale } from '../i18n/LocaleContext';
import { useQuotation } from '../hooks/useQuotation';
import { brlToUsd, formatPrice } from '../utils/currency';

const POLL_INTERVAL_MS = 2000;

function toImageSrc(base64: string): string {
  return base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
}

export function OrderStatusPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [game, setGame] = useState<GameResponse | null>(null);
  const [payment, setPayment] = useState<PaymentCheckoutResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { t } = useLocale();
  const rate = useQuotation();

  // Order status drives the checkout — this is the only place a purchase's
  // Pending -> Paid/Failed transition (and, while Pending, its PIX
  // checkout data) becomes visible without a manual refresh. See
  // instructions.md §7 and notes.md 40.
  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const result = await ordersApi.get(orderId!);
        if (cancelled) return;
        setOrder(result);

        if (result.status === 'Pending') {
          // Best-effort: the Payment row is created asynchronously once
          // payments-api consumes OrderPlacedEvent, so it may not exist for
          // the first tick or two — a failure here just means "no PIX data
          // yet," never a page-level error.
          paymentsApi
            .checkout(orderId!)
            .then((p) => {
              if (!cancelled) setPayment(p);
            })
            .catch(() => {
              /* payment row may not exist yet */
            });
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch {
        if (!cancelled) setError(t('orderStatus.loadError'));
      }
    }

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orderId, t]);

  // The purchased game's own details — fetched once, not on every poll
  // tick, since a game's title/image doesn't change mid-purchase. Depends
  // on the gameId string itself, not the whole `order` object, which gets
  // a new reference every poll tick even when gameId hasn't changed.
  const gameId = order?.gameId;
  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;
    catalogApi
      .get(gameId)
      .then((g) => {
        if (!cancelled) setGame(g);
      })
      .catch(() => {
        /* product line item degrades to no image/title if this fails */
      });
    return () => {
      cancelled = true;
    };
  }, [gameId]);

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

  const usdPrice = rate !== null ? brlToUsd(order.price, rate) : null;
  const showPixSection =
    order.status === 'Pending' && payment && payment.gateway !== 'simulated' && (payment.pixQrCodeBase64 || payment.pixCopyPasteCode);

  return (
    <div className="card" style={{ maxWidth: 480 }}>
      <h1>{t('orderStatus.orderPrefix', { id: order.id.slice(0, 8) })}</h1>

      <div className="checkout-line-item">
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

      <p>
        {t('orderStatus.status')} <span className={`badge ${order.status.toLowerCase()}`}>{t(`status.${order.status}`)}</span>
      </p>
      <p>
        {t('orderStatus.price', { price: formatPrice(order.price, 'BRL') })}
        {usdPrice !== null && <span className="muted"> (≈ {formatPrice(usdPrice, 'USD')})</span>}
      </p>

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
      <Link to="/library" className="btn secondary" style={{ marginTop: 12, display: 'inline-block' }}>
        {t('orderStatus.goToLibrary')}
      </Link>
    </div>
  );
}
