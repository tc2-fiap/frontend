import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersApi } from '../api/endpoints';
import type { OrderResponse } from '../api/types';
import { useLocale } from '../i18n/LocaleContext';
import { formatPrice } from '../utils/currency';

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useLocale();

  useEffect(() => {
    ordersApi
      .adminAllOrders()
      .then((result) => setOrders(result.items))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="muted">{t('adminOrders.loading')}</p>;

  return (
    <div>
      <h1>{t('adminOrders.title')}</h1>
      <p className="muted">{t('adminOrders.subtitle')}</p>
      {orders.length === 0 ? (
        <p className="empty-state">{t('adminOrders.empty')}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('adminOrders.colOrder')}</th>
              <th>{t('adminOrders.colUser')}</th>
              <th>{t('adminOrders.colItems')}</th>
              <th>{t('adminOrders.colPrice')}</th>
              <th>{t('adminOrders.colStatus')}</th>
              <th>{t('adminOrders.colCreated')}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="clickable" onClick={() => navigate(`/admin/orders/${order.id}`)}>
                <td>{order.id.slice(0, 8)}</td>
                <td>{order.userId.slice(0, 8)}</td>
                <td>{order.items.length}</td>
                <td>{formatPrice(order.totalPrice)}</td>
                <td>
                  <span className={`badge ${order.status.toLowerCase()}`}>{t(`status.${order.status}`)}</span>
                </td>
                <td>{new Date(order.createdAtUtc).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
