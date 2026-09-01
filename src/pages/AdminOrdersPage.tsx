import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalogApi, ordersApi, usersApi } from '../api/endpoints';
import type { OrderResponse } from '../api/types';
import { FilterActions } from '../components/FilterActions';
import { AdminIcon } from '../components/NavIcons';
import { Pagination } from '../components/Pagination';
import { PriceRangeSlider } from '../components/PriceRangeSlider';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useLocale } from '../i18n/LocaleContext';
import { formatPrice } from '../utils/currency';

const PAGE_SIZE = 10;
const PRICE_BOUNDS = { min: 0, max: 2000 };

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'all' | 'Pending' | 'Paid' | 'Failed'>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [orderId, setOrderId] = useState('');
  const debouncedOrderId = useDebouncedValue(orderId);
  const [userName, setUserName] = useState('');
  const debouncedUserName = useDebouncedValue(userName);
  const [resolvedUserIds, setResolvedUserIds] = useState<string[]>([]);
  const [itemName, setItemName] = useState('');
  const debouncedItemName = useDebouncedValue(itemName);
  const [resolvedGameIds, setResolvedGameIds] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState(PRICE_BOUNDS.min);
  const [maxPrice, setMaxPrice] = useState(PRICE_BOUNDS.max);
  const debouncedMinPrice = useDebouncedValue(minPrice);
  const debouncedMaxPrice = useDebouncedValue(maxPrice);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const { t } = useLocale();

  // undefined = no name search in progress, so no filter is sent at all;
  // once a name is typed, this resolves to the (possibly empty) matching
  // id list, derived here rather than reset synchronously inside the effect.
  const userIds = debouncedUserName ? resolvedUserIds : undefined;
  const gameIds = debouncedItemName ? resolvedGameIds : undefined;

  // A name typed here isn't a field orders-api owns — it's resolved to
  // concrete ids via a real call to the service that does own it, then
  // passed to orders-api's admin filter. Same "compose at the view layer,
  // never a cross-schema join" pattern AdminOrderDetailPage already uses.
  useEffect(() => {
    if (!debouncedUserName) return;
    usersApi
      .adminSearchByName(debouncedUserName)
      .then((result) => setResolvedUserIds(result.items.map((u) => u.id)))
      .catch(() => setResolvedUserIds([]));
  }, [debouncedUserName]);

  useEffect(() => {
    if (!debouncedItemName) return;
    catalogApi
      .search({ title: debouncedItemName })
      .then((result) => setResolvedGameIds(result.items.map((g) => g.id)))
      .catch(() => setResolvedGameIds([]));
  }, [debouncedItemName]);

  function fetchOrders() {
    ordersApi
      .adminAllOrders({
        page,
        pageSize: PAGE_SIZE,
        status: status === 'all' ? undefined : status,
        from: from || undefined,
        to: to || undefined,
        orderId: debouncedOrderId || undefined,
        userIds,
        gameIds,
        minPrice: debouncedMinPrice > PRICE_BOUNDS.min ? debouncedMinPrice : undefined,
        maxPrice: debouncedMaxPrice < PRICE_BOUNDS.max ? debouncedMaxPrice : undefined,
      })
      .then((result) => {
        setOrders(result.items);
        setTotalPages(Math.max(1, result.totalPages));
      })
      .finally(() => setLoading(false));
  }

  useEffect(fetchOrders, [page, status, from, to, debouncedOrderId, userIds, gameIds, debouncedMinPrice, debouncedMaxPrice]);

  function clearFilters() {
    setStatus('all');
    setFrom('');
    setTo('');
    setOrderId('');
    setUserName('');
    setItemName('');
    setMinPrice(PRICE_BOUNDS.min);
    setMaxPrice(PRICE_BOUNDS.max);
    setPage(1);
  }

  return (
    <div>
      <div className="page-title-row">
        <h1 className="page-title">
          <AdminIcon size={26} />
          {t('adminOrders.title')}
        </h1>
        <FilterActions onClear={clearFilters} onRefresh={fetchOrders} />
      </div>
      <p className="muted">{t('adminOrders.subtitle')}</p>

      <div className="card filter-bar">
        <div className="field">
          <label>{t('adminOrders.filterStatus')}</label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as 'all' | 'Pending' | 'Paid' | 'Failed');
              setPage(1);
            }}
          >
            <option value="all">{t('adminOrders.statusAll')}</option>
            <option value="Pending">{t('status.Pending')}</option>
            <option value="Paid">{t('status.Paid')}</option>
            <option value="Failed">{t('status.Failed')}</option>
          </select>
        </div>
        <div className="field">
          <label>{t('adminOrders.filterFrom')}</label>
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="field">
          <label>{t('adminOrders.filterTo')}</label>
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="field">
          <label>{t('adminOrders.filterOrderId')}</label>
          <input
            type="text"
            value={orderId}
            onChange={(e) => {
              setOrderId(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="field">
          <label>{t('adminOrders.filterUserName')}</label>
          <input
            type="text"
            value={userName}
            onChange={(e) => {
              setUserName(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="field">
          <label>{t('adminOrders.filterItemName')}</label>
          <input
            type="text"
            value={itemName}
            onChange={(e) => {
              setItemName(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="field">
          <label>{t('adminOrders.filterPriceRange')}</label>
          <PriceRangeSlider
            min={PRICE_BOUNDS.min}
            max={PRICE_BOUNDS.max}
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
        <p className="muted">{t('adminOrders.loading')}</p>
      ) : orders.length === 0 ? (
        <p className="empty-state">{t('adminOrders.empty')}</p>
      ) : (
        <>
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
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
