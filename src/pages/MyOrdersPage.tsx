import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersApi } from '../api/endpoints';
import type { OrderResponse } from '../api/types';
import { OrderIcon } from '../components/NavIcons';
import { Pagination } from '../components/Pagination';
import { useLocale } from '../i18n/LocaleContext';
import { formatPrice } from '../utils/currency';

const PAGE_SIZE = 10;

// Trimmed version of AdminOrdersPage — no filters (not asked for), and no
// User column since it's always the caller. Row click goes to the existing
// OrderStatusPage, which already renders full item detail and live status
// and already authorizes correctly (GetByIdAsync checks order.UserId).
export function MyOrdersPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const { t } = useLocale();

  useEffect(() => {
    ordersApi
      .mine({ page, pageSize: PAGE_SIZE })
      .then((result) => {
        setOrders(result.items);
        setTotalPages(Math.max(1, result.totalPages));
      })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div>
      <h1 className="page-title">
        <OrderIcon size={26} />
        {t('myOrders.title')}
      </h1>

      {loading ? (
        <p className="muted">{t('myOrders.loading')}</p>
      ) : orders.length === 0 ? (
        <p className="empty-state">{t('myOrders.empty')}</p>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>{t('myOrders.colOrder')}</th>
                <th>{t('myOrders.colItems')}</th>
                <th>{t('myOrders.colPrice')}</th>
                <th>{t('myOrders.colStatus')}</th>
                <th>{t('myOrders.colCreated')}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="clickable" onClick={() => navigate(`/orders/${order.id}`)}>
                  <td>{order.id.slice(0, 8)}</td>
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
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
