import { useEffect, useState } from 'react';
import { catalogApi, ordersApi } from '../api/endpoints';
import type { GameResponse, LibraryItemResponse } from '../api/types';
import { useLocale } from '../i18n/LocaleContext';
import { formatPrice } from '../utils/currency';

export function LibraryPage() {
  const [items, setItems] = useState<LibraryItemResponse[]>([]);
  const [games, setGames] = useState<Record<string, GameResponse>>({});
  const [loading, setLoading] = useState(true);
  const { t } = useLocale();

  useEffect(() => {
    Promise.all([ordersApi.library(), catalogApi.list()])
      .then(([libraryResult, catalogResult]) => {
        setItems(libraryResult.items);
        setGames(Object.fromEntries(catalogResult.items.map((g) => [g.id, g])));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="muted">{t('library.loading')}</p>;

  return (
    <div>
      <h1>{t('library.title')}</h1>
      {items.length === 0 ? (
        <p className="empty-state">{t('library.empty')}</p>
      ) : (
        <div className="grid">
          {items.map((item) => {
            const game = games[item.gameId];
            return (
              <div key={`${item.orderId}-${item.gameId}`} className="card game-card">
                <h3>{game?.title ?? t('library.unknownGame')}</h3>
                {game && (
                  <div className="meta">
                    {game.genre} · {game.platform}
                  </div>
                )}
                {game && <div className="price">{formatPrice(game.price)}</div>}
                <span className="badge paid">{t('library.owned')}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
