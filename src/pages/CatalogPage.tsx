import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalogApi, ordersApi } from '../api/endpoints';
import { ApiError } from '../api/client';
import type { GameResponse } from '../api/types';
import { CatalogIcon } from '../components/NavIcons';
import { Pagination } from '../components/Pagination';
import { useCart } from '../cart/CartContext';
import { useLocale } from '../i18n/LocaleContext';
import { LOCALE_CURRENCY } from '../i18n/locale-currency';
import { useQuotation } from '../hooks/useQuotation';
import { brlToUsd, formatPrice } from '../utils/currency';

const PAGE_SIZE = 12;

type OwnedFilter = 'all' | 'owned' | 'not-owned';

export function CatalogPage() {
  const [games, setGames] = useState<GameResponse[]>([]);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [genreFilter, setGenreFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [search, setSearch] = useState('');
  const [ownedFilter, setOwnedFilter] = useState<OwnedFilter>('all');
  const [page, setPage] = useState(1);
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

  const genres = useMemo(() => Array.from(new Set(games.map((g) => g.genre))).sort(), [games]);
  const platforms = useMemo(() => Array.from(new Set(games.map((g) => g.platform))).sort(), [games]);

  const filtered = games.filter((g) => {
    if (genreFilter !== 'all' && g.genre !== genreFilter) return false;
    if (platformFilter !== 'all' && g.platform !== platformFilter) return false;
    if (minPrice && g.price < Number(minPrice)) return false;
    if (maxPrice && g.price > Number(maxPrice)) return false;
    if (search && !g.title.toLowerCase().includes(search.toLowerCase())) return false;
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
    setMinPrice('');
    setMaxPrice('');
    setSearch('');
    setOwnedFilter('all');
    setPage(1);
  }

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
      <h1 className="page-title">
        <CatalogIcon size={26} />
        {t('catalog.title')}
      </h1>
      {error && <p className="error">{error}</p>}
      {games.length === 0 ? (
        <p className="empty-state">{t('catalog.empty')}</p>
      ) : (
        <div className="catalog-layout">
          <aside className="catalog-filters card">
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
              <label>{t('catalog.filterMinPrice')}</label>
              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="field">
              <label>{t('catalog.filterMaxPrice')}</label>
              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
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
            <button type="button" className="btn secondary" onClick={clearFilters}>
              {t('catalog.clearFilters')}
            </button>
          </aside>

          <div className="catalog-results">
            {filtered.length === 0 ? (
              <p className="empty-state">{t('catalog.noResults')}</p>
            ) : (
              <>
                <div className="grid">
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
          </div>
        </div>
      )}
    </div>
  );
}
