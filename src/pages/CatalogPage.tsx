import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalogApi, ordersApi } from '../api/endpoints';
import { ApiError } from '../api/client';
import type { GameResponse } from '../api/types';
import { useLocale } from '../i18n/LocaleContext';
import { LOCALE_CURRENCY } from '../i18n/locale-currency';
import { useQuotation } from '../hooks/useQuotation';
import { brlToUsd, formatPrice } from '../utils/currency';

export function CatalogPage() {
  const [games, setGames] = useState<GameResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const navigate = useNavigate();
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

  async function handleBuy(gameId: string) {
    setBuyingId(gameId);
    setError(null);
    try {
      const order = await ordersApi.create(gameId);
      navigate(`/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('catalog.orderError'));
      setBuyingId(null);
    }
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
                <button type="button" className="btn" disabled={buyingId === game.id} onClick={() => handleBuy(game.id)}>
                  {buyingId === game.id ? t('catalog.placingOrder') : t('catalog.buy')}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
