import { useLocale } from '../i18n/LocaleContext';
import { RefreshIcon, TrashIcon } from './NavIcons';

interface FilterActionsProps {
  onClear: () => void;
  onRefresh: () => void;
}

export function FilterActions({ onClear, onRefresh }: FilterActionsProps) {
  const { t } = useLocale();

  return (
    <div className="filter-actions">
      <button type="button" className="icon-btn" onClick={onClear}>
        <TrashIcon size={16} />
        {t('filters.clear')}
      </button>
      <button type="button" className="icon-btn" onClick={onRefresh}>
        <RefreshIcon size={16} />
        {t('filters.refresh')}
      </button>
    </div>
  );
}
