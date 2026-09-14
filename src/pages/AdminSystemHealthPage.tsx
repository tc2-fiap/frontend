import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { catalogApi, notificationsApi, ordersApi, paymentsApi, platformApi, usersApi } from '../api/endpoints';
import type { PodResponse } from '../api/types';
import { ConfirmModal } from '../components/ConfirmModal';
import { fetchCommitsAhead } from '../api/github';
import { AdminEventsIcon, ArrowLeftIcon, RefreshIcon } from '../components/NavIcons';
import { SkeletonTableRows } from '../components/Skeleton';
import { useLocale } from '../i18n/LocaleContext';

type ServiceName = 'users-api' | 'catalog-api' | 'orders-api' | 'payments-api' | 'notifications-api' | 'platform-api';

// Kept out of ServiceName/SERVICES since it has no HTTP /version endpoint
// to poll (it's not a backend) — its own commit-drift check instead reads
// __BUILD_SHA__, a compile-time constant already baked into this very
// bundle (vite.config.ts), no network round-trip needed to know its own
// build. Still restartable like every other row.
const FRONTEND = 'frontend' as const;
type RestartTarget = ServiceName | typeof FRONTEND;

interface ServiceRow {
  name: ServiceName;
  reachable: boolean;
  sha: string | null;
  buildTime: string | null;
  commitsAhead: number | null;
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
// "unreachable" row instead of blanking the whole page. The commit-drift
// check (GitHub's compare API, called directly from the browser — see
// api/github.ts) is a second, independent, best-effort layer on top: it
// never blocks the table from rendering and fails silently to "—".
export function AdminSystemHealthPage() {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [pods, setPods] = useState<PodResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [restartTarget, setRestartTarget] = useState<RestartTarget | null>(null);
  const [restarting, setRestarting] = useState(false);
  const [restartError, setRestartError] = useState<string | null>(null);
  const [frontendCommitsAhead, setFrontendCommitsAhead] = useState<number | null>(null);
  const { t } = useLocale();

  function fetchAll() {
    Promise.allSettled(SERVICES.map((s) => s.fetchVersion())).then((results) => {
      const rows: ServiceRow[] = results.map((result, i) => ({
        name: SERVICES[i].name,
        reachable: result.status === 'fulfilled',
        sha: result.status === 'fulfilled' ? result.value.sha : null,
        buildTime: result.status === 'fulfilled' ? result.value.buildTime : null,
        commitsAhead: null,
      }));
      setServices(rows);

      Promise.allSettled(rows.map((row) => (row.sha ? fetchCommitsAhead(row.name, row.sha) : Promise.resolve(null)))).then(
        (checks) => {
          setServices((current) =>
            current.map((row, i) => {
              const check = checks[i];
              return { ...row, commitsAhead: check.status === 'fulfilled' && check.value ? check.value.aheadBy : null };
            }),
          );
        },
      );
    });

    // Same check as every backend row, just off the bundle's own compile-time
    // constant (vite.config.ts) instead of an HTTP round-trip — this is
    // already the code running the page doing the check, no /version call
    // needed to know its own build.
    fetchCommitsAhead(FRONTEND, __BUILD_SHA__)
      .then((check) => setFrontendCommitsAhead(check?.aheadBy ?? null))
      .catch(() => setFrontendCommitsAhead(null));

    platformApi
      .adminPods()
      .then(setPods)
      .catch(() => setPods([]))
      .finally(() => setLoading(false));
  }

  useEffect(fetchAll, []);

  async function handleConfirmRestart() {
    if (!restartTarget) return;
    setRestarting(true);
    setRestartError(null);
    try {
      await platformApi.restartService(restartTarget);
      setRestartTarget(null);
    } catch {
      setRestartError(t('adminSystemHealth.restartError', { service: restartTarget }));
    } finally {
      setRestarting(false);
    }
  }

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
              <th>{t('adminSystemHealth.colCommits')}</th>
              <th>{t('adminSystemHealth.colActions')}</th>
            </tr>
          </thead>
          <SkeletonTableRows rows={5} columns={6} />
        </table>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{t('adminSystemHealth.colService')}</th>
              <th>{t('adminSystemHealth.colStatus')}</th>
              <th>{t('adminSystemHealth.colSha')}</th>
              <th>{t('adminSystemHealth.colBuildTime')}</th>
              <th>{t('adminSystemHealth.colCommits')}</th>
              <th>{t('adminSystemHealth.colActions')}</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => {
              const restartDisabled = (service.commitsAhead ?? 0) > 0;
              return (
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
                  <td>
                    {service.commitsAhead === null ? (
                      '—'
                    ) : service.commitsAhead === 0 ? (
                      <span className="badge reachable">{t('adminSystemHealth.upToDate')}</span>
                    ) : (
                      <span className="badge pending">{t('adminSystemHealth.commitsAhead', { n: service.commitsAhead })}</span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn secondary"
                      disabled={restartDisabled}
                      title={restartDisabled ? t('adminSystemHealth.restartDisabledTooltip') : undefined}
                      onClick={() => setRestartTarget(service.name)}
                    >
                      {t('adminSystemHealth.restart')}
                    </button>
                  </td>
                </tr>
              );
            })}
            <tr>
              <td>
                <span className="badge source-frontend">{FRONTEND}</span>
              </td>
              <td>
                <span className="badge reachable">{t('adminSystemHealth.reachable')}</span>
              </td>
              <td>{__BUILD_SHA__ === 'unknown' ? '—' : __BUILD_SHA__.slice(0, 7)}</td>
              <td>{__BUILD_TIME__ === 'unknown' ? '—' : __BUILD_TIME__}</td>
              <td>
                {frontendCommitsAhead === null ? (
                  '—'
                ) : frontendCommitsAhead === 0 ? (
                  <span className="badge reachable">{t('adminSystemHealth.upToDate')}</span>
                ) : (
                  <span className="badge pending">{t('adminSystemHealth.commitsAhead', { n: frontendCommitsAhead })}</span>
                )}
              </td>
              <td>
                <button
                  type="button"
                  className="btn secondary"
                  disabled={(frontendCommitsAhead ?? 0) > 0}
                  title={(frontendCommitsAhead ?? 0) > 0 ? t('adminSystemHealth.restartDisabledTooltip') : undefined}
                  onClick={() => setRestartTarget(FRONTEND)}
                >
                  {t('adminSystemHealth.restart')}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      )}
      {restartError && <p className="error">{restartError}</p>}
      {restartTarget && (
        <ConfirmModal
          title={t('adminSystemHealth.restartTitle', { service: restartTarget })}
          message={t('adminSystemHealth.restartMessage', { service: restartTarget })}
          confirmLabel={t('adminSystemHealth.restartConfirm')}
          cancelLabel={t('adminSystemHealth.restartCancel')}
          busy={restarting}
          onCancel={() => setRestartTarget(null)}
          onConfirm={handleConfirmRestart}
        />
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
