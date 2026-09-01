import { useEffect, useState } from 'react';
import { catalogApi, ordersApi } from '../api/endpoints';
import { ConfirmModal } from '../components/ConfirmModal';
import type { GameResponse, LibraryItemResponse } from '../api/types';
import { useLocale } from '../i18n/LocaleContext';
import { formatPrice } from '../utils/currency';

export function LibraryPage() {
  const [items, setItems] = useState<LibraryItemResponse[]>([]);
  const [games, setGames] = useState<Record<string, GameResponse>>({});
  const [loading, setLoading] = useState(true);
  const [confirmGameId, setConfirmGameId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const { t } = useLocale();

  useEffect(() => {
    Promise.all([ordersApi.library(), catalogApi.list()])
      .then(([libraryResult, catalogResult]) => {
        setItems(libraryResult.items);
        setGames(Object.fromEntries(catalogResult.items.map((g) => [g.id, g])));
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleConfirmRemove() {
    if (!confirmGameId) return;
    setRemoving(true);
    setRemoveError(null);
    try {
      await ordersApi.removeFromLibrary(confirmGameId);
      setItems((prev) => prev.filter((item) => item.gameId !== confirmGameId));
      setConfirmGameId(null);
    } catch {
      setRemoveError(t('library.removeError'));
    } finally {
      setRemoving(false);
    }
  }

  if (loading) return <p className="muted">{t('library.loading')}</p>;

  const confirmGame = confirmGameId ? games[confirmGameId] : undefined;

  return (
    <div>
      <h1>{t('library.title')}</h1>
      {removeError && <p className="error">{removeError}</p>}
      {items.length === 0 ? (
        <p className="empty-state">{t('library.empty')}</p>
      ) : (
        <div className="grid">
          {items.map((item) => {
            const game = games[item.gameId];
            return (
              <div key={`${item.orderId}-${item.gameId}`} className="card game-card">
                {game?.coverImageUrl ? (
                  <img className="game-card-cover" src={game.coverImageUrl} alt={game.title} />
                ) : (
                  <div className="game-card-cover-fallback" aria-hidden="true">
                    {(game?.title ?? t('library.unknownGame')).charAt(0)}
                  </div>
                )}
                <h3>{game?.title ?? t('library.unknownGame')}</h3>
                {game && (
                  <div className="meta">
                    {game.genre} · {game.platform}
                  </div>
                )}
                {game && <div className="price">{formatPrice(game.price)}</div>}
                <span className="badge paid">{t('library.owned')}</span>
                <div className="game-card-actions">
                  <button type="button" className="btn secondary" onClick={() => setConfirmGameId(item.gameId)}>
                    {t('library.remove')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {confirmGameId && (
        <ConfirmModal
          title={t('library.removeTitle')}
          message={t('library.removeMessage', { title: confirmGame?.title ?? t('library.unknownGame') })}
          confirmLabel={t('library.removeConfirm')}
          cancelLabel={t('library.removeCancel')}
          danger
          busy={removing}
          onCancel={() => setConfirmGameId(null)}
          onConfirm={handleConfirmRemove}
        />
      )}
    </div>
  );
}
