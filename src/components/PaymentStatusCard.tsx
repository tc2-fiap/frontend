import type { OrderResponse, PaymentCheckoutResponse } from '../api/types';
import { useLocale } from '../i18n/LocaleContext';

function toImageSrc(base64: string): string {
  return base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
}

// A fixed (not random) module pattern so the placeholder renders identically
// every time — it's a decorative stand-in, not a real scannable code, and a
// deterministic shape keeps that obvious rather than looking like a glitch.
const GENERIC_QR_MODULES = [
  0b1111100111110, 0b1000101101001, 0b1011101011101, 0b1011100100101, 0b1011101101101, 0b1000101010101,
  0b1111100101110, 0b0000001100000, 0b1101110100011, 0b0110001011101, 0b1011011010001, 0b0010100111011,
  0b1101011000100, 0b0000010101011, 0b1111101001101,
];

function GenericQr() {
  const size = 13;
  const cell = 180 / size;
  return (
    <svg width={180} height={180} viewBox="0 0 180 180" role="img" aria-hidden="true">
      <rect width={180} height={180} fill="#fff" />
      {GENERIC_QR_MODULES.slice(0, size).map((row, y) =>
        Array.from({ length: size }, (_, x) => (row >> x) & 1).map(
          (bit, x) =>
            bit === 1 && (
              <rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell} height={cell} fill="var(--color-accent)" />
            ),
        ),
      )}
    </svg>
  );
}

export type PaymentMethod = 'pix' | 'card';

interface PaymentStatusCardProps {
  status: OrderResponse['status'];
  payment: PaymentCheckoutResponse | null;
  pixVisible: boolean;
  isGenericPix: boolean;
  copied: boolean;
  onCopy: (code: string) => void;
  // The method chosen on checkout, before the order existed — purely a
  // display choice (see notes.md 58/59), since the backend has no
  // per-request payment-method concept. Defaults to 'pix' for callers (like
  // OrderStatusPage) that never had a checkout-time selection to begin with.
  paymentMethod?: PaymentMethod;
}

export function PaymentStatusCard({ status, payment, pixVisible, isGenericPix, copied, onCopy, paymentMethod = 'pix' }: PaymentStatusCardProps) {
  const { t } = useLocale();
  const statusKey = status.toLowerCase();

  return (
    <div className={`card order-status-box order-status-box-${statusKey}`}>
      <span className={`badge ${statusKey} order-status-badge`}>{t(`status.${status}`)}</span>

      {pixVisible && (
        <div className="pix-checkout">
          {paymentMethod === 'card' ? (
            <p className="muted">{t('checkout.cardProcessingNote')}</p>
          ) : (
            <>
              {!isGenericPix && payment?.pixQrCodeBase64 ? (
                <img className="pix-qr-code" src={toImageSrc(payment.pixQrCodeBase64)} alt={t('orderStatus.pixTitle')} />
              ) : (
                <GenericQr />
              )}
              <p className="muted">{t('orderStatus.pixTitle')}</p>
              {!isGenericPix && payment?.pixCopyPasteCode ? (
                <div className="field">
                  <label>{t('orderStatus.pixCopyPaste')}</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="text" readOnly value={payment.pixCopyPasteCode} />
                    <button type="button" className="btn secondary" onClick={() => onCopy(payment.pixCopyPasteCode!)}>
                      {copied ? t('orderStatus.copied') : t('orderStatus.copy')}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="muted">{t('orderStatus.pixSimulatedNote')}</p>
              )}
            </>
          )}
          <p className="muted">{t('orderStatus.autoConfirm')}</p>
        </div>
      )}

      {status === 'Paid' && <p>{t('orderStatus.paidMessage')}</p>}
      {status === 'Failed' && <p className="error">{t('orderStatus.failedMessage')}</p>}
    </div>
  );
}
