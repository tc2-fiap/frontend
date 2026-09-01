import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalogApi, ordersApi } from '../api/endpoints';
import { ApiError } from '../api/client';
import type { GameResponse } from '../api/types';
import { useCart } from '../cart/CartContext';
import { useLocale } from '../i18n/LocaleContext';
import { LOCALE_CURRENCY } from '../i18n/locale-currency';
import { useQuotation } from '../hooks/useQuotation';
import { brlToUsd, formatPrice } from '../utils/currency';

export function CatalogPage() {
  const [games, setGames] = useState<GameResponse[]>([]);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const cart = useCart();
  const { t, locale } = useLocale();
  const rate = useQuotation();
  const displayCurrency = LOCALE_CURRENCY[locale];

  function displayPrice(brlPrice: number): { amount: number; currency: 'USD' | 'BRL' } {
    if (displayCurrency === 'BRL' || rate === null) return { amount: brlPrice, currency: 'BRL' };
    return { amount: brlToUsd(brlPrice, rate), currency: 'USD' };
  }

  useEffect(() => {
    catalogApi
      .list()
      .then((result) => setGames(result.items))
      .catch((err) => setError(err instanceof ApiError ? err.message : t('catalog.loadError')))
      .finally(() => setLoading(false));
  }, [t]);

  // Used only to hide Add to Cart / Buy Now for games already owned — the
  // backend's own conflict guard on POST /api/orders remains the authority,
  // this just avoids surfacing that 409 in the common case.
  useEffect(() => {
    ordersApi
      .library()
      .then((result) => setOwnedIds(new Set(result.items.map((item) => item.gameId))))
      .catch(() => {
        /* if this fails, worst case a purchase attempt hits the backend's own conflict guard */
      });
  }, []);

  function addToCart(game: GameResponse) {
    cart.addItem({ gameId: game.id, title: game.title, price: game.price, coverImageUrl: game.coverImageUrl });
  }

  function buyNow(game: GameResponse) {
    addToCart(game);
    navigate('/checkout');
  }

  if (loading) return <p className="muted">{t('catalog.loading')}</p>;

  return (
    <div>
      <h1>{t('catalog.title')}</h1>
      {error && <p className="error">{error}</p>}
      {games.length === 0 ? (
        <p className="empty-state">{t('catalog.empty')}</p>
      ) : (
        <div className="grid">
          {games.map((game) => {
            const { amount, currency } = displayPrice(game.price);
            const owned = ownedIds.has(game.id);
            const inCart = cart.items.some((item) => item.gameId === game.id);
            return (
              <div key={game.id} className="card game-card">
                {game.coverImageUrl ? (
                  <img className="game-card-cover" src={game.coverImageUrl} alt={game.title} />
                ) : (
                  <div className="game-card-cover-fallback" aria-hidden="true">
                    {game.title.charAt(0)}
                  </div>
                )}
                <h3>{game.title}</h3>
                <div className="meta">
                  {game.genre} · {game.platform}
                </div>
                <div className="price">{formatPrice(amount, currency)}</div>
                {owned ? (
                  <span className="badge paid">{t('catalog.owned')}</span>
                ) : (
                  <div className="game-card-actions">
                    <div className="cart-row">
                      <button
                        type="button"
                        className="btn secondary"
                        disabled={inCart}
                        onClick={() => addToCart(game)}
                      >
                        {inCart ? t('catalog.inCart') : t('catalog.addToCart')}
                      </button>
                      {inCart && (
                        <button
                          type="button"
                          className="btn danger small"
                          aria-label={t('cart.remove')}
                          title={t('cart.remove')}
                          onClick={() => cart.removeItem(game.id)}
                        >
                          {t('cart.remove')}
                        </button>
                      )}
                    </div>
                    <button type="button" className="btn" onClick={() => buyNow(game)}>
                      {t('catalog.buyNow')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
