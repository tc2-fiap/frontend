import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { catalogApi, notificationsApi, ordersApi, paymentsApi, usersApi } from '../api/endpoints';
import type { GameResponse, NotificationResponse, OrderEventResponse, OrderResponse, PaymentResponse } from '../api/types';
import { OrderIcon } from '../components/NavIcons';
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
  const [games, setGames] = useState<Record<string, GameResponse>>({});
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLocale();

  useEffect(() => {
    if (!orderId) return;

    Promise.allSettled([
      // orderId as a filter, not adminAllOrders()'s pageSize:10 default —
      // otherwise any order beyond the 10 most recent is never found.
      ordersApi.adminAllOrders({ orderId, pageSize: 1 }).then((result) => result.items[0] ?? null),
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

  // Item titles and the buyer's name aren't orders-api's data — resolved
  // here from catalog-api/users-api once the order itself is known, same
  // "compose at the view layer" pattern as the fetch above.
  useEffect(() => {
    if (!order) return;
    Promise.all(order.items.map((item) => catalogApi.get(item.gameId).catch(() => null))).then((results) => {
      setGames(Object.fromEntries(results.filter((g): g is GameResponse => g !== null).map((g) => [g.id, g])));
    });
    usersApi
      .getById(order.userId)
      .then((user) => setUserName(user.name))
      .catch(() => setUserName(order.userId));
  }, [order]);

  if (loading) return <p className="muted">{t('adminOrderDetail.loading')}</p>;

  return (
    <div>
      <h1 className="page-title">
        <OrderIcon size={26} />
        {t('adminOrderDetail.orderPrefix', { id: orderId?.slice(0, 8) ?? '' })}
      </h1>

      {order && (
        <div className="card">
          <p>
            {t('adminOrderDetail.status')} <span className={`badge ${order.status.toLowerCase()}`}>{t(`status.${order.status}`)}</span> ·{' '}
            {t('adminOrderDetail.price')} {formatPrice(order.totalPrice)} · {t('adminOrderDetail.user')} {userName ?? order.userId}
          </p>
          <p className="muted">{t('adminOrderDetail.itemsTitle')}</p>
          <ul>
            {order.items.map((item) => (
              <li key={item.gameId}>
                {games[item.gameId]?.title ?? item.gameId.slice(0, 8)} — {formatPrice(item.price)}
              </li>
            ))}
          </ul>
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
