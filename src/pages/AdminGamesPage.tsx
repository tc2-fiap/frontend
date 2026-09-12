import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { catalogApi } from '../api/endpoints';
import { ApiError } from '../api/client';
import type { GameResponse } from '../api/types';
import { ConfirmModal } from '../components/ConfirmModal';
import { FilterActions } from '../components/FilterActions';
import { AdminIcon, ArrowLeftIcon, PlusIcon } from '../components/NavIcons';
import { Pagination } from '../components/Pagination';
import { PriceRangeSlider } from '../components/PriceRangeSlider';
import { SkeletonTableRows } from '../components/Skeleton';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useLocale } from '../i18n/LocaleContext';
import { formatPrice } from '../utils/currency';

const PAGE_SIZE = 10;

export function AdminGamesPage() {
  const [games, setGames] = useState<GameResponse[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [genres, setGenres] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [priceBounds, setPriceBounds] = useState({ min: 0, max: 1000 });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [genreFilter, setGenreFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const debouncedMinPrice = useDebouncedValue(minPrice);
  const debouncedMaxPrice = useDebouncedValue(maxPrice);
  const [page, setPage] = useState(1);
  const [confirmGameId, setConfirmGameId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useLocale();

  // One unfiltered fetch on mount, used only to derive the genre/platform
  // option lists and the price slider's bounds — same pattern as CatalogPage.
  useEffect(() => {
    catalogApi
      .search()
      .then((result) => {
        setGenres(Array.from(new Set(result.items.map((g) => g.genre))).sort());
        setPlatforms(Array.from(new Set(result.items.map((g) => g.platform))).sort());
        const maxSeen = Math.ceil(result.items.reduce((max, g) => Math.max(max, g.price), 0)) || 1000;
        setPriceBounds({ min: 0, max: maxSeen });
        setMaxPrice(maxSeen);
      })
      .catch(() => {
        /* option lists just stay empty; the filter bar still works */
      });
  }, []);

  function fetchGames() {
    catalogApi
      .search({
        page,
        pageSize: PAGE_SIZE,
        title: debouncedSearch || undefined,
        genre: genreFilter === 'all' ? undefined : genreFilter,
        platform: platformFilter === 'all' ? undefined : platformFilter,
        minPrice: debouncedMinPrice > priceBounds.min ? debouncedMinPrice : undefined,
        maxPrice: debouncedMaxPrice < priceBounds.max ? debouncedMaxPrice : undefined,
      })
      .then((result) => {
        setGames(result.items);
        setTotalPages(Math.max(1, result.totalPages));
      })
      .finally(() => setLoading(false));
  }

  useEffect(fetchGames, [page, debouncedSearch, genreFilter, platformFilter, debouncedMinPrice, debouncedMaxPrice, priceBounds]);

  function clearFilters() {
    setSearch('');
    setGenreFilter('all');
    setPlatformFilter('all');
    setMinPrice(priceBounds.min);
    setMaxPrice(priceBounds.max);
    setPage(1);
  }

  async function handleConfirmDelete() {
    if (!confirmGameId) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await catalogApi.delete(confirmGameId);
      setGames((prev) => prev.filter((g) => g.id !== confirmGameId));
      setConfirmGameId(null);
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : t('adminGames.deleteError'));
    } finally {
      setDeleting(false);
    }
  }

  const confirmGame = confirmGameId ? games.find((g) => g.id === confirmGameId) : undefined;

  return (
    <div>
      <div className="page-title-row">
        <h1 className="page-title">
          <Link to="/catalog" className="page-title-back" aria-label={t('common.backToCatalog')} title={t('common.backToCatalog')}>
            <ArrowLeftIcon size={20} />
          </Link>
          <AdminIcon size={26} />
          {t('adminGames.title')}
        </h1>
        <div className="page-actions">
          <button type="button" className="btn" onClick={() => navigate('/admin/games/new')}>
            <PlusIcon size={16} />
            {t('adminGames.createButton')}
          </button>
          <FilterActions onClear={clearFilters} onRefresh={fetchGames} />
        </div>
      </div>
      <p className="muted">{t('adminGames.subtitle')}</p>
      {deleteError && <p className="error">{deleteError}</p>}

      <div className="card filter-bar">
        <div className="field">
          <label>{t('adminGames.filterSearch')}</label>
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
          <label>{t('adminGames.filterGenre')}</label>
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
          <label>{t('adminGames.filterPlatform')}</label>
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
        <div className="field">
          <label>{t('adminGames.filterPriceRange')}</label>
          <PriceRangeSlider
            min={priceBounds.min}
            max={priceBounds.max}
            valueMin={minPrice}
            valueMax={maxPrice}
            onChangeMin={(value) => {
              setMinPrice(value);
              setPage(1);
            }}
            onChangeMax={(value) => {
              setMaxPrice(value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {loading ? (
        <table aria-busy="true" aria-label={t('adminGames.loading')}>
          <thead>
            <tr>
              <th>{t('adminGames.colTitle')}</th>
              <th>{t('adminGames.colGenre')}</th>
              <th>{t('adminGames.colPlatform')}</th>
              <th>{t('adminGames.colPrice')}</th>
              <th>{t('adminGames.colReleaseDate')}</th>
              <th>{t('adminGames.colActions')}</th>
            </tr>
          </thead>
          <SkeletonTableRows rows={5} columns={6} />
        </table>
      ) : games.length === 0 ? (
        <p className="empty-state">{t('adminGames.empty')}</p>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>{t('adminGames.colTitle')}</th>
                <th>{t('adminGames.colGenre')}</th>
                <th>{t('adminGames.colPlatform')}</th>
                <th>{t('adminGames.colPrice')}</th>
                <th>{t('adminGames.colReleaseDate')}</th>
                <th>{t('adminGames.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {games.map((game) => (
                <tr key={game.id}>
                  <td>{game.title}</td>
                  <td>{game.genre}</td>
                  <td>{game.platform}</td>
                  <td>{formatPrice(game.price)}</td>
                  <td>{game.releaseDate}</td>
                  <td>
                    <div className="table-row-actions">
                      <button type="button" className="btn secondary small" onClick={() => navigate(`/admin/games/${game.id}/edit`)}>
                        {t('adminGames.edit')}
                      </button>
                      <button type="button" className="btn danger small" onClick={() => setConfirmGameId(game.id)}>
                        {t('adminGames.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {confirmGameId && (
        <ConfirmModal
          title={t('adminGames.deleteTitle')}
          message={t('adminGames.deleteMessage', { title: confirmGame?.title ?? '' })}
          confirmLabel={t('adminGames.deleteConfirm')}
          cancelLabel={t('adminGames.deleteCancel')}
          danger
          busy={deleting}
          onCancel={() => setConfirmGameId(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
