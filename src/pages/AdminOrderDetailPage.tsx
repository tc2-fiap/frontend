import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { notificationsApi, ordersApi, paymentsApi } from '../api/endpoints';
import type { NotificationResponse, OrderEventResponse, OrderResponse, PaymentResponse } from '../api/types';
import { useLocale } from '../i18n/LocaleContext';
import { formatPrice } from '../utils/currency';
import { formatJson } from '../utils/formatJson';

// Composed at the view layer from four independent admin endpoints — never
// a cross-schema join. Each service owns and returns only its own data.
// See notes.md 30.
export function AdminOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [events, setEvents] = useState<OrderEventResponse[]>([]);
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLocale();

  useEffect(() => {
    if (!orderId) return;

    Promise.allSettled([
      ordersApi.adminAllOrders().then((result) => result.items.find((o) => o.id === orderId) ?? null),
      ordersApi.adminOrderEvents(orderId),
      paymentsApi.adminGetByOrder(orderId),
      notificationsApi.adminGetByOrder(orderId),
    ]).then(([orderResult, eventsResult, paymentResult, notificationsResult]) => {
      if (orderResult.status === 'fulfilled') setOrder(orderResult.value);
      if (eventsResult.status === 'fulfilled') setEvents(eventsResult.value);
      if (paymentResult.status === 'fulfilled') setPayment(paymentResult.value);
      if (notificationsResult.status === 'fulfilled') setNotifications(notificationsResult.value);
      setLoading(false);
    });
  }, [orderId]);

  if (loading) return <p className="muted">{t('adminOrderDetail.loading')}</p>;

  return (
    <div>
      <h1>{t('adminOrderDetail.orderPrefix', { id: orderId?.slice(0, 8) ?? '' })}</h1>

      {order && (
        <div className="card">
          <p>
            {t('adminOrderDetail.status')} <span className={`badge ${order.status.toLowerCase()}`}>{t(`status.${order.status}`)}</span> ·{' '}
            {t('adminOrderDetail.price')} {formatPrice(order.price)} · {t('adminOrderDetail.user')} {order.userId}
          </p>
        </div>
      )}

      <h2 className="section-title">{t('adminOrderDetail.eventsTitle')}</h2>
      {events.length === 0 ? (
        <p className="empty-state">{t('adminOrderDetail.noEvents')}</p>
      ) : (
        events.map((event) => (
          <div key={event.id} className="card" style={{ marginBottom: 10 }}>
            <strong>{event.eventType}</strong>{' '}
            <span className="muted">{new Date(event.occurredAtUtc).toLocaleString()}</span>
            <pre className="payload">{formatJson(event.payload)}</pre>
          </div>
        ))
      )}

      <h2 className="section-title">{t('adminOrderDetail.paymentTitle')}</h2>
      {payment ? (
        <div className="card">
          <p>
            <span className={`badge ${payment.status.toLowerCase()}`}>{t(`status.${payment.status}`)}</span>{' '}
            {t('adminOrderDetail.via', { gateway: payment.gateway })}
          </p>
          <p className="muted">{t('adminOrderDetail.requestSent')}</p>
          <pre className="payload">{formatJson(payment.requestPayload)}</pre>
          <p className="muted">{t('adminOrderDetail.responseReceived')}</p>
          <pre className="payload">{formatJson(payment.responsePayload)}</pre>
        </div>
      ) : (
        <p className="empty-state">{t('adminOrderDetail.noPayment')}</p>
      )}

      <h2 className="section-title">{t('adminOrderDetail.notificationsTitle')}</h2>
      {notifications.length === 0 ? (
        <p className="empty-state">{t('adminOrderDetail.noNotifications')}</p>
      ) : (
        notifications.map((notification) => (
          <div key={notification.id} className="card" style={{ marginBottom: 10 }}>
            <p>
              {t('adminOrderDetail.notificationLine', {
                type: t(`notificationType.${notification.type}`),
                recipient: notification.recipient,
                channel: t(`channel.${notification.channel}`),
              })}{' '}
              — <span className={`badge ${notification.status.toLowerCase()}`}>{t(`status.${notification.status}`)}</span>
            </p>
            <p className="muted">"{notification.subject}" — {notification.body}</p>
            {notification.providerResponsePayload && (
              <>
                <p className="muted">{t('adminOrderDetail.providerResponse')}</p>
                <pre className="payload">{formatJson(notification.providerResponsePayload)}</pre>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}
