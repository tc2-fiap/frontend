import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { catalogApi, ordersApi } from '../api/endpoints';
import { ConfirmModal } from '../components/ConfirmModal';
import { FilterActions } from '../components/FilterActions';
import { LibraryIcon, OpenInNewIcon } from '../components/NavIcons';
import { Pagination } from '../components/Pagination';
import { SkeletonGameCard } from '../components/Skeleton';
import type { GameResponse, LibraryItemResponse } from '../api/types';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useLocale } from '../i18n/LocaleContext';
import { formatPrice } from '../utils/currency';

const PAGE_SIZE = 12;

export function LibraryPage() {
  const [items, setItems] = useState<LibraryItemResponse[]>([]);
  const [games, setGames] = useState<Record<string, GameResponse>>({});
  const [loading, setLoading] = useState(true);
  const [confirmGameId, setConfirmGameId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [genreFilter, setGenreFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(1);
  const { t } = useLocale();

  function fetchLibrary() {
    Promise.all([ordersApi.library(), catalogApi.search()])
      .then(([libraryResult, catalogResult]) => {
        setItems(libraryResult.items);
        setGames(Object.fromEntries(catalogResult.items.map((g) => [g.id, g])));
      })
      .finally(() => setLoading(false));
  }

  useEffect(fetchLibrary, []);

  function clearFilters() {
    setGenreFilter('all');
    setPlatformFilter('all');
    setSearch('');
    setPage(1);
  }

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

  const genres = useMemo(
    () => Array.from(new Set(items.map((i) => games[i.gameId]?.genre).filter((g): g is string => !!g))).sort(),
    [items, games],
  );
  const platforms = useMemo(
    () => Array.from(new Set(items.map((i) => games[i.gameId]?.platform).filter((p): p is string => !!p))).sort(),
    [items, games],
  );

  const filtered = items.filter((item) => {
    const game = games[item.gameId];
    if (genreFilter !== 'all' && game?.genre !== genreFilter) return false;
    if (platformFilter !== 'all' && game?.platform !== platformFilter) return false;
    if (debouncedSearch && !(game?.title ?? '').toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading)
    return (
      <div>
        <h1 className="page-title">
          <LibraryIcon size={26} />
          {t('library.title')}
        </h1>
        <div className="grid" aria-busy="true" aria-label={t('library.loading')}>
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonGameCard key={i} />
          ))}
        </div>
      </div>
    );

  const confirmGame = confirmGameId ? games[confirmGameId] : undefined;

  return (
    <div>
      <div className="page-title-row">
        <h1 className="page-title">
          <LibraryIcon size={26} />
          {t('library.title')}
        </h1>
        <FilterActions onClear={clearFilters} onRefresh={fetchLibrary} />
      </div>
      {removeError && <p className="error">{removeError}</p>}
      {items.length === 0 ? (
        <p className="empty-state">{t('library.empty')}</p>
      ) : (
        <>
          <div className="card filter-bar">
            <div className="field">
              <label>{t('library.filterSearch')}</label>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="field">
              <label>{t('library.filterGenre')}</label>
              <select
                value={genreFilter}
                onChange={(e) => {
                  setGenreFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">{t('adminEvents.all')}</option>
                {genres.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{t('library.filterPlatform')}</label>
              <select
                value={platformFilter}
                onChange={(e) => {
                  setPlatformFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">{t('adminEvents.all')}</option>
                {platforms.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="empty-state">{t('library.noResults')}</p>
          ) : (
            <>
              <div className="grid">
                {paged.map((item) => {
                  const game = games[item.gameId];
                  return (
                    <div key={`${item.orderId}-${item.gameId}`} className="card game-card">
                      <Link
                        to={`/orders/${item.orderId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="game-card-open-order"
                        aria-label={t('library.openOrder')}
                        title={t('library.openOrder')}
                      >
                        <OpenInNewIcon size={16} />
                      </Link>
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
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </>
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
