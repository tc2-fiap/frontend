import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { catalogApi, notificationsApi, ordersApi, paymentsApi, platformApi, usersApi } from '../api/endpoints';
import type { PodResponse } from '../api/types';
import { AdminEventsIcon, ArrowLeftIcon, RefreshIcon } from '../components/NavIcons';
import { SkeletonTableRows } from '../components/Skeleton';
import { useLocale } from '../i18n/LocaleContext';

type ServiceName = 'users-api' | 'catalog-api' | 'orders-api' | 'payments-api' | 'notifications-api' | 'platform-api';

interface ServiceRow {
  name: ServiceName;
  reachable: boolean;
  sha: string | null;
  buildTime: string | null;
}

const SERVICES: { name: ServiceName; fetchVersion: () => Promise<{ sha: string; buildTime: string }> }[] = [
  { name: 'users-api', fetchVersion: usersApi.adminVersion },
  { name: 'catalog-api', fetchVersion: catalogApi.adminVersion },
  { name: 'orders-api', fetchVersion: ordersApi.adminVersion },
  { name: 'payments-api', fetchVersion: paymentsApi.adminVersion },
  { name: 'notifications-api', fetchVersion: notificationsApi.adminVersion },
  { name: 'platform-api', fetchVersion: platformApi.adminVersion },
];

// Pods run to completion or restart on their own timeline — a coarse
// minutes/hours/days age is plenty here, no need for a shared date-fns-style
// util for a single table on one admin page.
function formatAge(startTimeUtc: string | null): string {
  if (!startTimeUtc) return '—';
  const minutes = Math.floor((Date.now() - new Date(startTimeUtc).getTime()) / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

// Composed at the view layer from seven independent admin endpoints (all
// six services' own /version, plus platform-api's pod list) — never a
// backend aggregator. Same "compose at the view layer" precedent as
// AdminEventsPage (notes.md 30) — one source failing shows an
// "unreachable" row instead of blanking the whole page.
export function AdminSystemHealthPage() {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [pods, setPods] = useState<PodResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLocale();

  function fetchAll() {
    Promise.allSettled(SERVICES.map((s) => s.fetchVersion())).then((results) => {
      setServices(
        results.map((result, i) => ({
          name: SERVICES[i].name,
          reachable: result.status === 'fulfilled',
          sha: result.status === 'fulfilled' ? result.value.sha : null,
          buildTime: result.status === 'fulfilled' ? result.value.buildTime : null,
        })),
      );
    });

    platformApi
      .adminPods()
      .then(setPods)
      .catch(() => setPods([]))
      .finally(() => setLoading(false));
  }

  useEffect(fetchAll, []);

  return (
    <div>
      <div className="page-title-row">
        <h1 className="page-title">
          <Link to="/catalog" className="page-title-back" aria-label={t('common.backToCatalog')} title={t('common.backToCatalog')}>
            <ArrowLeftIcon size={20} />
          </Link>
          <AdminEventsIcon size={26} />
          {t('adminSystemHealth.title')}
        </h1>
        <button type="button" className="icon-btn" onClick={fetchAll}>
          <RefreshIcon size={16} />
          {t('filters.refresh')}
        </button>
      </div>
      <p className="muted">{t('adminSystemHealth.subtitle')}</p>

      <h2>{t('adminSystemHealth.servicesTitle')}</h2>
      {loading ? (
        <table aria-busy="true" aria-label={t('adminSystemHealth.loading')}>
          <thead>
            <tr>
              <th>{t('adminSystemHealth.colService')}</th>
              <th>{t('adminSystemHealth.colStatus')}</th>
              <th>{t('adminSystemHealth.colSha')}</th>
              <th>{t('adminSystemHealth.colBuildTime')}</th>
            </tr>
          </thead>
          <SkeletonTableRows rows={5} columns={4} />
        </table>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('adminSystemHealth.colService')}</th>
              <th>{t('adminSystemHealth.colStatus')}</th>
              <th>{t('adminSystemHealth.colSha')}</th>
              <th>{t('adminSystemHealth.colBuildTime')}</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.name}>
                <td>
                  <span className={`badge source-${service.name}`}>{service.name}</span>
                </td>
                <td>
                  <span className={`badge ${service.reachable ? 'reachable' : 'unreachable'}`}>
                    {service.reachable ? t('adminSystemHealth.reachable') : t('adminSystemHealth.unreachable')}
                  </span>
                </td>
                <td>{service.sha ? service.sha.slice(0, 7) : '—'}</td>
                <td>{service.buildTime ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>{t('adminSystemHealth.podsTitle')}</h2>
      {loading ? (
        <table aria-busy="true" aria-label={t('adminSystemHealth.loading')}>
          <thead>
            <tr>
              <th>{t('adminSystemHealth.colName')}</th>
              <th>{t('adminSystemHealth.colApplication')}</th>
              <th>{t('adminSystemHealth.colNamespace')}</th>
              <th>{t('adminSystemHealth.colNode')}</th>
              <th>{t('adminSystemHealth.colPhase')}</th>
              <th>{t('adminSystemHealth.colReady')}</th>
              <th>{t('adminSystemHealth.colRestarts')}</th>
              <th>{t('adminSystemHealth.colAge')}</th>
            </tr>
          </thead>
          <SkeletonTableRows rows={8} columns={8} />
        </table>
      ) : pods.length === 0 ? (
        <p className="empty-state">{t('adminSystemHealth.empty')}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('adminSystemHealth.colName')}</th>
              <th>{t('adminSystemHealth.colApplication')}</th>
              <th>{t('adminSystemHealth.colNamespace')}</th>
              <th>{t('adminSystemHealth.colNode')}</th>
              <th>{t('adminSystemHealth.colPhase')}</th>
              <th>{t('adminSystemHealth.colReady')}</th>
              <th>{t('adminSystemHealth.colRestarts')}</th>
              <th>{t('adminSystemHealth.colAge')}</th>
            </tr>
          </thead>
          <tbody>
            {pods.map((pod) => (
              <tr key={pod.name}>
                <td>{pod.name}</td>
                <td>
                  <span className={`badge source-${pod.application}`}>{pod.application}</span>
                </td>
                <td>{pod.namespace}</td>
                <td>{pod.node ?? '—'}</td>
                <td>
                  <span className={`badge ${pod.phase === 'Running' ? 'reachable' : 'unreachable'}`}>{pod.phase}</span>
                </td>
                <td>
                  {pod.readyContainers}/{pod.totalContainers}
                </td>
                <td>{pod.restartCount}</td>
                <td>{formatAge(pod.startTimeUtc)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
