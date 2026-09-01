import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { catalogApi, ordersApi } from '../api/endpoints';
import { ApiError } from '../api/client';
import type { GameResponse } from '../api/types';
import { useCart } from '../cart/CartContext';
import { useLocale } from '../i18n/LocaleContext';
import { LOCALE_CURRENCY } from '../i18n/locale-currency';
import { useQuotation } from '../hooks/useQuotation';
import { brlToUsd, formatPrice } from '../utils/currency';

interface CheckoutItem {
  gameId: string;
  title: string;
  price: number;
  coverImageUrl?: string | null;
}

interface CheckoutLocationState {
  buyNowGameId?: string;
}

// Both Add to Cart and Buy Now land here — neither path creates an order
// directly. Buy Now pre-loads this review with just the one game (never
// touching the persistent cart) instead of skipping the confirmation step.
export function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const cart = useCart();
  const { t, locale } = useLocale();
  const rate = useQuotation();
  const displayCurrency = LOCALE_CURRENCY[locale];

  const buyNowGameId = (location.state as CheckoutLocationState | null)?.buyNowGameId;
  const isBuyNow = Boolean(buyNowGameId);

  const [buyNowGame, setBuyNowGame] = useState<GameResponse | null>(null);
  const [loadingBuyNow, setLoadingBuyNow] = useState(isBuyNow);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!buyNowGameId) return;
    let cancelled = false;
    catalogApi
      .get(buyNowGameId)
      .then((game) => {
        if (!cancelled) setBuyNowGame(game);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : t('checkout.loadError'));
      })
      .finally(() => {
        if (!cancelled) setLoadingBuyNow(false);
      });
    return () => {
      cancelled = true;
    };
  }, [buyNowGameId, t]);

  const items: CheckoutItem[] = useMemo(() => {
    if (isBuyNow) {
      return buyNowGame
        ? [{ gameId: buyNowGame.id, title: buyNowGame.title, price: buyNowGame.price, coverImageUrl: buyNowGame.coverImageUrl }]
        : [];
    }
    return cart.items;
  }, [isBuyNow, buyNowGame, cart.items]);

  function displayPrice(brlPrice: number): { amount: number; currency: 'USD' | 'BRL' } {
    if (displayCurrency === 'BRL' || rate === null) return { amount: brlPrice, currency: 'BRL' };
    return { amount: brlToUsd(brlPrice, rate), currency: 'USD' };
  }

  async function confirm() {
    setSubmitting(true);
    setError(null);
    try {
      const order = await ordersApi.create(items.map((item) => item.gameId));
      if (!isBuyNow) {
        for (const item of items) cart.removeItem(item.gameId);
      }
      navigate(`/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('checkout.orderError'));
      setSubmitting(false);
    }
  }

  if (isBuyNow && loadingBuyNow) return <p className="muted">{t('checkout.loading')}</p>;

  if (items.length === 0) {
    return (
      <div>
        <h1>{t('checkout.title')}</h1>
        {error && <p className="error">{error}</p>}
        <p className="empty-state">{t('checkout.emptyState')}</p>
        <button type="button" className="btn secondary" onClick={() => navigate('/catalog')}>
          {t('cart.backToCatalog')}
        </button>
      </div>
    );
  }

  const total = items.reduce((sum, item) => sum + item.price, 0);
  const { amount: totalAmount, currency: totalCurrency } = displayPrice(total);

  return (
    <div className="card" style={{ maxWidth: 480 }}>
      <h1>{t('checkout.title')}</h1>
      {error && <p className="error">{error}</p>}
      {items.map((item) => {
        const { amount, currency } = displayPrice(item.price);
        return (
          <div key={item.gameId} className="checkout-line-item">
            {item.coverImageUrl ? (
              <img className="game-card-cover" src={item.coverImageUrl} alt={item.title} />
            ) : (
              <div className="game-card-cover-fallback" aria-hidden="true">
                {item.title.charAt(0)}
              </div>
            )}
            <h3>{item.title}</h3>
            <div className="price">{formatPrice(amount, currency)}</div>
          </div>
        );
      })}
      <p>
        {t('checkout.total')} <strong>{formatPrice(totalAmount, totalCurrency)}</strong>
      </p>
      <button type="button" className="btn" disabled={submitting} onClick={confirm}>
        {submitting ? t('checkout.submitting') : t('checkout.confirm')}
      </button>
    </div>
  );
}
