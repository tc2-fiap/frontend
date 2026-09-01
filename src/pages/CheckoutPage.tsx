import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ordersApi } from '../api/endpoints';
import { ApiError } from '../api/client';
import type { OrderResponse } from '../api/types';
import { type CartItem, useCart } from '../cart/CartContext';
import { PaymentStatusCard, type PaymentMethod } from '../components/PaymentStatusCard';
import { useOrderPaymentStatus } from '../hooks/useOrderPaymentStatus';
import { useLocale } from '../i18n/LocaleContext';
import { LOCALE_CURRENCY } from '../i18n/locale-currency';
import { useQuotation } from '../hooks/useQuotation';
import { brlToUsd, formatPrice } from '../utils/currency';

function displayPriceFor(displayCurrency: 'USD' | 'BRL', rate: number | null) {
  return (brlPrice: number): { amount: number; currency: 'USD' | 'BRL' } => {
    if (displayCurrency === 'BRL' || rate === null) return { amount: brlPrice, currency: 'BRL' };
    return { amount: brlToUsd(brlPrice, rate), currency: 'USD' };
  };
}

// Both Add to Cart and Buy Now land here — neither path creates an order
// directly. Buy Now adds the chosen game to the persistent cart (if it
// isn't already there) before navigating, so checkout always reflects the
// cart rather than a separate single-item path.
//
// Confirming no longer navigates to /orders/:id — the page transitions
// in-place into a live payment/status view (CheckoutPaymentPhase below),
// so the PIX QR (real or, under the simulated gateway, a generic
// placeholder) appears right here once the order/payment exist.
export function CheckoutPage() {
  const navigate = useNavigate();
  const cart = useCart();
  const { t, locale } = useLocale();
  const rate = useQuotation();
  const displayCurrency = LOCALE_CURRENCY[locale];
  const displayPrice = displayPriceFor(displayCurrency, rate);

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [purchasedItems, setPurchasedItems] = useState<CartItem[] | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The live cart, used while reviewing (Phase A). Once confirmed, the cart
  // is cleared and purchasedItems (a frozen snapshot taken right before
  // that) is what Phase B renders instead — they are deliberately two
  // different values.
  const items = cart.items;

  async function confirm() {
    setSubmitting(true);
    setError(null);
    try {
      const created = await ordersApi.create(items.map((item) => item.gameId));
      setPurchasedItems(items);
      for (const item of items) cart.removeItem(item.gameId);
      setOrder(created);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('checkout.orderError'));
      setSubmitting(false);
    }
  }

  if (order && purchasedItems) {
    return <CheckoutPaymentPhase order={order} items={purchasedItems} paymentMethod={paymentMethod} />;
  }

  if (items.length === 0) {
    return (
      <div>
        <h1>{t('checkout.title')}</h1>
        {error && <p className="error">{error}</p>}
        <p className="empty-state">{t('checkout.emptyState')}</p>
        <button type="button" className="btn secondary" onClick={() => navigate('/catalog')}>
          {t('cart.backToCatalog')}
        </button>
      </div>
    );
  }

  const total = items.reduce((sum, item) => sum + item.price, 0);
  const { amount: totalAmount, currency: totalCurrency } = displayPrice(total);

  return (
    <div style={{ maxWidth: 900 }}>
      <h1>{t('checkout.title')}</h1>
      {error && <p className="error">{error}</p>}
      <div className="order-status-columns">
        <div>
          <h2 className="section-title">{t('orderStatus.itemsTitle')}</h2>
          <div className="card">
            {items.map((item) => {
              const { amount, currency } = displayPrice(item.price);
              return (
                <div key={item.gameId} className="checkout-line-item">
                  {item.coverImageUrl ? (
                    <img className="game-card-cover" src={item.coverImageUrl} alt={item.title} />
                  ) : (
                    <div className="game-card-cover-fallback" aria-hidden="true">
                      {item.title.charAt(0)}
                    </div>
                  )}
                  <h3>{item.title}</h3>
                  <div className="price">{formatPrice(amount, currency)}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="section-title">{t('checkout.paymentTitle')}</h2>
          <div className="card">
            <p className="price" style={{ marginTop: 0 }}>
              {t('checkout.total')} {formatPrice(totalAmount, totalCurrency)}
            </p>

            <div className="payment-method-toggle">
              <button
                type="button"
                className={paymentMethod === 'pix' ? 'btn' : 'btn secondary'}
                onClick={() => setPaymentMethod('pix')}
              >
                {t('checkout.paymentMethodPix')}
              </button>
              <button
                type="button"
                className={paymentMethod === 'card' ? 'btn' : 'btn secondary'}
                onClick={() => setPaymentMethod('card')}
              >
                {t('checkout.paymentMethodCard')}
              </button>
            </div>

            {paymentMethod === 'pix' ? (
              <p className="muted">{t('checkout.pixMethodNote')}</p>
            ) : (
              <>
                <div className="field">
                  <label>{t('checkout.cardNumber')}</label>
                  <input type="text" placeholder="4242 4242 4242 4242" disabled />
                </div>
                <div className="field">
                  <label>{t('checkout.cardName')}</label>
                  <input type="text" placeholder="Jane Doe" disabled />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div className="field" style={{ flex: 1 }}>
                    <label>{t('checkout.cardExpiry')}</label>
                    <input type="text" placeholder="MM/YY" disabled />
                  </div>
                  <div className="field" style={{ flex: 1 }}>
                    <label>{t('checkout.cardCvv')}</label>
                    <input type="text" placeholder="123" disabled />
                  </div>
                </div>
                <p className="muted">{t('checkout.cardPlaceholderNote')}</p>
              </>
            )}
          </div>

          <h2 className="section-title">{t('checkout.actionsTitle')}</h2>
          <div className="card">
            <button type="button" className="btn" disabled={submitting} onClick={confirm}>
              {submitting ? t('checkout.submitting') : t('checkout.confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// useOrderPaymentStatus subscribes to SSE for a concrete order id/status —
// split into its own component so it's only ever mounted once an order
// exists, keeping CheckoutPage's own conditional returns from breaking the
// Rules of Hooks.
function CheckoutPaymentPhase({
  order,
  items,
  paymentMethod,
}: {
  order: OrderResponse;
  items: CartItem[];
  paymentMethod: PaymentMethod;
}) {
  const navigate = useNavigate();
  const { t, locale } = useLocale();
  const rate = useQuotation();
  const displayCurrency = LOCALE_CURRENCY[locale];
  const displayPrice = displayPriceFor(displayCurrency, rate);
  const payment = useOrderPaymentStatus(order.id, order.status);

  const usdTotal = rate !== null ? brlToUsd(order.totalPrice, rate) : null;

  return (
    <div style={{ maxWidth: 900 }}>
      <h1>{t('checkout.title')}</h1>
      <div className="order-status-columns">
        <div>
          <h2 className="section-title">{t('orderStatus.itemsTitle')}</h2>
          <div className="card">
            {items.map((item) => {
              const { amount, currency } = displayPrice(item.price);
              return (
                <div key={item.gameId} className="checkout-line-item">
                  {item.coverImageUrl ? (
                    <img className="game-card-cover" src={item.coverImageUrl} alt={item.title} />
                  ) : (
                    <div className="game-card-cover-fallback" aria-hidden="true">
                      {item.title.charAt(0)}
                    </div>
                  )}
                  <h3>{item.title}</h3>
                  <div className="price">{formatPrice(amount, currency)}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="section-title">{t('checkout.paymentTitle')}</h2>
          <PaymentStatusCard {...payment} onCopy={payment.copyPixCode} paymentMethod={paymentMethod} />
          <div className="card">
            <p className="price" style={{ margin: 0 }}>
              {formatPrice(order.totalPrice, 'BRL')}
              {usdTotal !== null && <span className="muted"> (≈ {formatPrice(usdTotal, 'USD')})</span>}
            </p>
          </div>

          <h2 className="section-title">{t('checkout.actionsTitle')}</h2>
          <div className="card">
            {payment.status === 'Paid' && (
              <Link to="/library" className="btn">
                {t('orderStatus.goToLibrary')}
              </Link>
            )}
            {payment.status === 'Failed' && (
              <button type="button" className="btn secondary" onClick={() => navigate('/cart')}>
                {t('checkout.backToCart')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
