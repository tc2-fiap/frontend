import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { catalogApi, ordersApi } from '../api/endpoints';
import type { GameResponse, OrderResponse } from '../api/types';
import { OrderIcon } from '../components/NavIcons';
import { PaymentStatusCard } from '../components/PaymentStatusCard';
import { useOrderPaymentStatus } from '../hooks/useOrderPaymentStatus';
import { useLocale } from '../i18n/LocaleContext';
import { useQuotation } from '../hooks/useQuotation';
import { brlToUsd, formatPrice } from '../utils/currency';

export function OrderStatusPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [games, setGames] = useState<Record<string, GameResponse>>({});
  const [error, setError] = useState<string | null>(null);
  const { t } = useLocale();

  useEffect(() => {
    if (!orderId) return;
    ordersApi
      .get(orderId)
      .then((result) => setOrder(result))
      .catch(() => setError(t('orderStatus.loadError')));
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

  if (error) return <p className="error">{error}</p>;
  if (!order) return <p className="muted">{t('orderStatus.loading')}</p>;

  return <OrderStatusBody order={order} games={games} />;
}

// useOrderPaymentStatus subscribes to SSE for a concrete order id/status —
// split out so it's only ever mounted once `order` exists, keeping the
// parent's own conditional loading/error returns from breaking the Rules of
// Hooks.
function OrderStatusBody({ order, games }: { order: OrderResponse; games: Record<string, GameResponse> }) {
  const { t } = useLocale();
  const rate = useQuotation();
  const payment = useOrderPaymentStatus(order.id, order.status);

  const usdTotal = rate !== null ? brlToUsd(order.totalPrice, rate) : null;

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 className="page-title">
        <OrderIcon size={26} />
        {t('orderStatus.orderPrefix', { id: order.id.slice(0, 8) })}
      </h1>

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
          <PaymentStatusCard {...payment} onCopy={payment.copyPixCode} />

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
