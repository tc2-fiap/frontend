import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../cart/CartContext';
import { useLocale } from '../i18n/LocaleContext';
import { LOCALE_CURRENCY } from '../i18n/locale-currency';
import { useQuotation } from '../hooks/useQuotation';
import { brlToUsd, formatPrice } from '../utils/currency';

export function CartPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const { t, locale } = useLocale();
  const rate = useQuotation();
  const displayCurrency = LOCALE_CURRENCY[locale];

  function displayPrice(brlPrice: number): { amount: number; currency: 'USD' | 'BRL' } {
    if (displayCurrency === 'BRL' || rate === null) return { amount: brlPrice, currency: 'BRL' };
    return { amount: brlToUsd(brlPrice, rate), currency: 'USD' };
  }

  if (cart.items.length === 0) {
    return (
      <div>
        <h1>{t('cart.title')}</h1>
        <p className="empty-state">{t('cart.empty')}</p>
        <Link to="/catalog" className="btn secondary">
          {t('cart.backToCatalog')}
        </Link>
      </div>
    );
  }

  const { amount: totalAmount, currency: totalCurrency } = displayPrice(cart.total);

  return (
    <div>
      <h1>{t('cart.title')}</h1>
      <div className="grid">
        {cart.items.map((item) => {
          const { amount, currency } = displayPrice(item.price);
          return (
            <div key={item.gameId} className="card game-card">
              {item.coverImageUrl ? (
                <img className="game-card-cover" src={item.coverImageUrl} alt={item.title} />
              ) : (
                <div className="game-card-cover-fallback" aria-hidden="true">
                  {item.title.charAt(0)}
                </div>
              )}
              <h3>{item.title}</h3>
              <div className="price">{formatPrice(amount, currency)}</div>
              <button type="button" className="btn secondary" onClick={() => cart.removeItem(item.gameId)}>
                {t('cart.remove')}
              </button>
            </div>
          );
        })}
      </div>
      <div className="card" style={{ marginTop: 16, maxWidth: 320 }}>
        <p>
          {t('cart.total')} <strong>{formatPrice(totalAmount, totalCurrency)}</strong>
        </p>
        <button type="button" className="btn" onClick={() => navigate('/checkout')}>
          {t('cart.checkout')}
        </button>
      </div>
    </div>
  );
}
