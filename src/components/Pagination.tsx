import { useLocale } from '../i18n/LocaleContext';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const { t } = useLocale();

  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button type="button" className="btn secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        {t('pagination.prev')}
      </button>
      <span className="pagination-page">{t('pagination.pageOf', { page, totalPages })}</span>
      <button
        type="button"
        className="btn secondary"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        {t('pagination.next')}
      </button>
    </div>
  );
}
