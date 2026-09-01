import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalogApi, ordersApi } from '../api/endpoints';
import { ApiError } from '../api/client';
import type { GameResponse } from '../api/types';
import { FilterActions } from '../components/FilterActions';
import { CatalogIcon, ColumnsIcon } from '../components/NavIcons';
import { Pagination } from '../components/Pagination';
import { PriceRangeSlider } from '../components/PriceRangeSlider';
import { useCart } from '../cart/CartContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useLocale } from '../i18n/LocaleContext';
import { LOCALE_CURRENCY } from '../i18n/locale-currency';
import { useQuotation } from '../hooks/useQuotation';
import { brlToUsd, formatPrice } from '../utils/currency';

const PAGE_SIZE = 12;
const GRID_COLS_KEY = 'fiap-games-catalog-grid-cols';
const GRID_COLS_OPTIONS = [2, 3, 4, 5, 6];

type OwnedFilter = 'all' | 'owned' | 'not-owned';

function initialGridCols(): number {
  try {
    const stored = Number(localStorage.getItem(GRID_COLS_KEY));
    if (GRID_COLS_OPTIONS.includes(stored)) return stored;
  } catch {
    // localStorage unavailable — fall through to the default.
  }
  return 4;
}

export function CatalogPage() {
  const [games, setGames] = useState<GameResponse[]>([]);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [catalogEmpty, setCatalogEmpty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [genres, setGenres] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [priceBounds, setPriceBounds] = useState({ min: 0, max: 1000 });
  const [genreFilter, setGenreFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const debouncedMinPrice = useDebouncedValue(minPrice);
  const debouncedMaxPrice = useDebouncedValue(maxPrice);
  const [ownedFilter, setOwnedFilter] = useState<OwnedFilter>('all');
  const [page, setPage] = useState(1);
  const [gridCols, setGridCols] = useState(initialGridCols);
  const [densityMenuOpen, setDensityMenuOpen] = useState(false);
  const navigate = useNavigate();
  const cart = useCart();
  const { t, locale } = useLocale();
  const rate = useQuotation();
  const displayCurrency = LOCALE_CURRENCY[locale];

  function displayPrice(brlPrice: number): { amount: number; currency: 'USD' | 'BRL' } {
    if (displayCurrency === 'BRL' || rate === null) return { amount: brlPrice, currency: 'BRL' };
    return { amount: brlToUsd(brlPrice, rate), currency: 'USD' };
  }

  // One unfiltered fetch on mount, used only to derive the genre/platform
  // option lists and the price slider's bounds — kept static afterwards so
  // the dropdowns and slider range don't shrink as filters narrow results.
  useEffect(() => {
    catalogApi
      .search()
      .then((result) => {
        setCatalogEmpty(result.items.length === 0);
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

  // Every filter here — search/genre/platform/price — is a real backend
  // query param. Owned/not-owned is the one exception: it needs orders-api's
  // ownership data cross-referenced against these already-filtered results,
  // and the hard rule against cross-schema queries means that join can only
  // happen client-side (see notes.md). Price bounds are debounced too — a
  // slider drag fires dozens of onChange events, not just keystrokes.
  function fetchGames() {
    catalogApi
      .search({
        title: debouncedSearch || undefined,
        genre: genreFilter === 'all' ? undefined : genreFilter,
        platform: platformFilter === 'all' ? undefined : platformFilter,
        minPrice: debouncedMinPrice > priceBounds.min ? debouncedMinPrice : undefined,
        maxPrice: debouncedMaxPrice < priceBounds.max ? debouncedMaxPrice : undefined,
      })
      .then((result) => setGames(result.items))
      .catch((err) => setError(err instanceof ApiError ? err.message : t('catalog.loadError')))
      .finally(() => setHasLoadedOnce(true));
  }

  useEffect(fetchGames, [debouncedSearch, genreFilter, platformFilter, debouncedMinPrice, debouncedMaxPrice, priceBounds, t]);

  const filtered = games.filter((g) => {
    const owned = ownedIds.has(g.id);
    if (ownedFilter === 'owned' && !owned) return false;
    if (ownedFilter === 'not-owned' && owned) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function clearFilters() {
    setGenreFilter('all');
    setPlatformFilter('all');
    setSearch('');
    setMinPrice(priceBounds.min);
    setMaxPrice(priceBounds.max);
    setOwnedFilter('all');
    setPage(1);
  }

  function selectGridCols(cols: number) {
    setGridCols(cols);
    setDensityMenuOpen(false);
    try {
      localStorage.setItem(GRID_COLS_KEY, String(cols));
    } catch {
      // best-effort persistence only.
    }
  }

  function addToCart(game: GameResponse) {
    cart.addItem({ gameId: game.id, title: game.title, price: game.price, coverImageUrl: game.coverImageUrl });
  }

  function buyNow(game: GameResponse) {
    addToCart(game);
    navigate('/checkout');
  }

  if (!hasLoadedOnce) return <p className="muted">{t('catalog.loading')}</p>;

  return (
    <div>
      <div className="page-title-row">
        <h1 className="page-title">
          <CatalogIcon size={26} />
          {t('catalog.title')}
        </h1>
        <div className="page-actions">
          <div className="grid-density-toggle">
            <button
              type="button"
              className="icon-btn"
              aria-expanded={densityMenuOpen}
              aria-label={t('catalog.gridDensityLabel')}
              onClick={() => setDensityMenuOpen((open) => !open)}
            >
              <ColumnsIcon size={16} />
              {t('catalog.gridDensityLabel')}
            </button>
            {densityMenuOpen && (
              <div className="nav-dropdown card">
                {GRID_COLS_OPTIONS.map((cols) => (
                  <button
                    key={cols}
                    type="button"
                    className={cols === gridCols ? 'active' : ''}
                    aria-pressed={cols === gridCols}
                    onClick={() => selectGridCols(cols)}
                  >
                    {t('catalog.gridDensity', { cols })}
                  </button>
                ))}
              </div>
            )}
          </div>
          <FilterActions onClear={clearFilters} onRefresh={fetchGames} />
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      {catalogEmpty ? (
        <p className="empty-state">{t('catalog.empty')}</p>
      ) : (
        <>
          <div className="card filter-bar">
            <div className="field">
              <label>{t('catalog.filterSearch')}</label>
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
              <label>{t('catalog.filterGenre')}</label>
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
              <label>{t('catalog.filterPlatform')}</label>
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
              <label>{t('catalog.filterPriceRange')}</label>
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
            <div className="field">
              <label>{t('catalog.filterOwned')}</label>
              <select
                value={ownedFilter}
                onChange={(e) => {
                  setOwnedFilter(e.target.value as OwnedFilter);
                  setPage(1);
                }}
              >
                <option value="all">{t('catalog.ownedAll')}</option>
                <option value="owned">{t('catalog.ownedOwned')}</option>
                <option value="not-owned">{t('catalog.ownedNotOwned')}</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="empty-state">{t('catalog.noResults')}</p>
          ) : (
            <>
              <div className="grid" style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}>
                {paged.map((game) => {
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
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </>
      )}
    </div>
  );
}
