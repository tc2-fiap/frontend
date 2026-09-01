import { Fragment, useEffect, useMemo, useState } from 'react';
import { notificationsApi, ordersApi, paymentsApi, usersApi } from '../api/endpoints';
import type { NotificationResponse, OrderEventResponse, PaymentResponse, UserEventResponse } from '../api/types';
import { AdminEventsIcon } from '../components/NavIcons';
import { Pagination } from '../components/Pagination';
import { useLocale } from '../i18n/LocaleContext';
import { formatJson } from '../utils/formatJson';

const PAGE_SIZE = 20;

type Source = 'users-api' | 'orders-api' | 'payments-api' | 'notifications-api';
type Kind = 'Event' | 'Message';

interface UnifiedRow {
  id: string;
  source: Source;
  kind: Kind;
  label: string;
  timestamp: string;
  payload: string;
}

// Composed at the view layer from four independent admin endpoints — never
// a cross-schema join. Each service owns and returns only its own data.
// See notes.md 30 and 43.
export function AdminEventsPage() {
  const [rows, setRows] = useState<UnifiedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<'all' | Source>('all');
  const [kindFilter, setKindFilter] = useState<'all' | Kind>('all');
  const [labelFilter, setLabelFilter] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const { t } = useLocale();

  useEffect(() => {
    Promise.allSettled([
      usersApi.adminAllUserEvents(),
      ordersApi.adminAllOrderEvents(),
      paymentsApi.adminAllPayments(),
      notificationsApi.adminAllNotifications(),
    ]).then(([usersResult, ordersResult, paymentsResult, notificationsResult]) => {
      const unified: UnifiedRow[] = [];

      if (usersResult.status === 'fulfilled') {
        unified.push(
          ...usersResult.value.items.map((e: UserEventResponse) => ({
            id: `users-${e.id}`,
            source: 'users-api' as const,
            kind: 'Event' as const,
            label: e.eventType,
            timestamp: e.occurredAtUtc,
            payload: e.payload,
          })),
        );
      }
      if (ordersResult.status === 'fulfilled') {
        unified.push(
          ...ordersResult.value.items.map((e: OrderEventResponse) => ({
            id: `orders-${e.id}`,
            source: 'orders-api' as const,
            kind: 'Event' as const,
            label: e.eventType,
            timestamp: e.occurredAtUtc,
            payload: e.payload,
          })),
        );
      }
      if (paymentsResult.status === 'fulfilled') {
        unified.push(
          ...paymentsResult.value.items.map((p: PaymentResponse) => ({
            id: `payments-${p.id}`,
            source: 'payments-api' as const,
            kind: 'Event' as const,
            label: `Payment${p.status}`,
            timestamp: p.processedAtUtc,
            payload: p.responsePayload,
          })),
        );
      }
      if (notificationsResult.status === 'fulfilled') {
        unified.push(
          ...notificationsResult.value.items.map((n: NotificationResponse) => ({
            id: `notifications-${n.id}`,
            source: 'notifications-api' as const,
            kind: 'Message' as const,
            label: n.type,
            timestamp: n.createdAtUtc,
            payload: n.providerResponsePayload ?? n.body,
          })),
        );
      }

      unified.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRows(unified);
      setLoading(false);
    });
  }, []);

  const labels = useMemo(() => Array.from(new Set(rows.map((r) => r.label))).sort(), [rows]);

  const filtered = rows.filter((r) => {
    if (sourceFilter !== 'all' && r.source !== sourceFilter) return false;
    if (kindFilter !== 'all' && r.kind !== kindFilter) return false;
    if (labelFilter !== 'all' && r.label !== labelFilter) return false;
    if (from && new Date(r.timestamp) < new Date(from)) return false;
    if (to && new Date(r.timestamp) > new Date(to)) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return <p className="muted">{t('adminEvents.loading')}</p>;

  return (
    <div>
      <h1 className="page-title">
        <AdminEventsIcon size={26} />
        {t('adminEvents.title')}
      </h1>
      <p className="muted">{t('adminEvents.subtitle')}</p>

      <div className="card filter-bar">
        <div className="field">
          <label>{t('adminEvents.filterSource')}</label>
          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value as 'all' | Source);
              setPage(1);
            }}
          >
            <option value="all">{t('adminEvents.all')}</option>
            <option value="users-api">users-api</option>
            <option value="orders-api">orders-api</option>
            <option value="payments-api">payments-api</option>
            <option value="notifications-api">notifications-api</option>
          </select>
        </div>
        <div className="field">
          <label>{t('adminEvents.filterKind')}</label>
          <select
            value={kindFilter}
            onChange={(e) => {
              setKindFilter(e.target.value as 'all' | Kind);
              setPage(1);
            }}
          >
            <option value="all">{t('adminEvents.all')}</option>
            <option value="Event">{t('adminEvents.kindEvent')}</option>
            <option value="Message">{t('adminEvents.kindMessage')}</option>
          </select>
        </div>
        <div className="field">
          <label>{t('adminEvents.filterLabel')}</label>
          <select
            value={labelFilter}
            onChange={(e) => {
              setLabelFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">{t('adminEvents.all')}</option>
            {labels.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>{t('adminEvents.filterFrom')}</label>
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
          <label>{t('adminEvents.filterTo')}</label>
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="empty-state">{t('adminEvents.empty')}</p>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>{t('adminEvents.colSource')}</th>
                <th>{t('adminEvents.colKind')}</th>
                <th>{t('adminEvents.colLabel')}</th>
                <th>{t('adminEvents.colTimestamp')}</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((row) => (
                <Fragment key={row.id}>
                  <tr className="clickable" onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}>
                    <td>
                      <span className={`badge source-${row.source}`}>{row.source}</span>
                    </td>
                    <td>{row.kind === 'Event' ? t('adminEvents.kindEvent') : t('adminEvents.kindMessage')}</td>
                    <td>{row.label}</td>
                    <td>{new Date(row.timestamp).toLocaleString()}</td>
                  </tr>
                  {expandedId === row.id && (
                    <tr>
                      <td colSpan={4}>
                        <pre className="payload">{formatJson(row.payload)}</pre>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
