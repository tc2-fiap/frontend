import { useEffect, useState } from 'react';
import { catalogApi, ordersApi } from '../api/endpoints';
import type { GameResponse, OrderResponse } from '../api/types';
import { useLocale } from '../i18n/LocaleContext';
import { formatPrice } from '../utils/currency';

export function LibraryPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [games, setGames] = useState<Record<string, GameResponse>>({});
  const [loading, setLoading] = useState(true);
  const { t } = useLocale();

  useEffect(() => {
    Promise.all([ordersApi.library(), catalogApi.list()])
      .then(([libraryResult, catalogResult]) => {
        setOrders(libraryResult.items);
        setGames(Object.fromEntries(catalogResult.items.map((g) => [g.id, g])));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="muted">{t('library.loading')}</p>;

  return (
    <div>
      <h1>{t('library.title')}</h1>
      {orders.length === 0 ? (
        <p className="empty-state">{t('library.empty')}</p>
      ) : (
        <div className="grid">
          {orders.map((order) => {
            const game = games[order.gameId];
            return (
              <div key={order.id} className="card game-card">
                <h3>{game?.title ?? t('library.unknownGame')}</h3>
                {game && (
                  <div className="meta">
                    {game.genre} · {game.platform}
                  </div>
                )}
                <div className="price">{formatPrice(order.price)}</div>
                <span className="badge paid">{t('library.owned')}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
