import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { catalogApi } from '../api/endpoints';
import { ApiError } from '../api/client';
import { AdminIcon, ArrowLeftIcon } from '../components/NavIcons';
import { SkeletonCard } from '../components/Skeleton';
import { useLocale } from '../i18n/LocaleContext';
import { formatPrice } from '../utils/currency';

export function AdminEditGamePage() {
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [platform, setPlatform] = useState('');
  const [priceCents, setPriceCents] = useState(0);
  const [releaseDate, setReleaseDate] = useState('');
  const [description, setDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { t } = useLocale();

  useEffect(() => {
    if (!id) return;
    catalogApi
      .get(id)
      .then((game) => {
        setTitle(game.title);
        setGenre(game.genre);
        setPlatform(game.platform);
        setPriceCents(Math.round(game.price * 100));
        setReleaseDate(game.releaseDate);
        setDescription(game.description ?? '');
        setCoverImageUrl(game.coverImageUrl ?? '');
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : t('adminEditGame.loadError')))
      .finally(() => setLoading(false));
  }, [id, t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setError(null);
    setSubmitting(true);
    try {
      await catalogApi.update(id, {
        title,
        genre,
        platform,
        price: priceCents / 100,
        releaseDate,
        description: description || null,
        coverImageUrl: coverImageUrl || null,
      });
      navigate('/admin/games');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('adminEditGame.errorMessage'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading)
    return (
      <div style={{ maxWidth: 500 }}>
        <h1 className="page-title">
          <Link to="/admin/games" className="page-title-back" aria-label={t('common.backToGames')} title={t('common.backToGames')}>
            <ArrowLeftIcon size={20} />
          </Link>
          <AdminIcon size={26} />
          {t('adminEditGame.title')}
        </h1>
        <div aria-busy="true" aria-label={t('adminGames.loading')}>
          <SkeletonCard lines={6} />
        </div>
      </div>
    );

  if (loadError)
    return (
      <div style={{ maxWidth: 500 }}>
        <h1 className="page-title">
          <Link to="/admin/games" className="page-title-back" aria-label={t('common.backToGames')} title={t('common.backToGames')}>
            <ArrowLeftIcon size={20} />
          </Link>
          <AdminIcon size={26} />
          {t('adminEditGame.title')}
        </h1>
        <p className="error">{loadError}</p>
        <Link to="/admin/games" className="btn secondary">
          {t('adminEditGame.backToList')}
        </Link>
      </div>
    );

  return (
    <div style={{ maxWidth: 500 }}>
      <h1 className="page-title">
        <Link to="/admin/games" className="page-title-back" aria-label={t('common.backToGames')} title={t('common.backToGames')}>
          <ArrowLeftIcon size={20} />
        </Link>
        <AdminIcon size={26} />
        {t('adminEditGame.title')}
      </h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="title">{t('adminEditGame.fieldTitle')}</label>
          <input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="genre">{t('adminEditGame.fieldGenre')}</label>
          <input id="genre" required value={genre} onChange={(e) => setGenre(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="platform">{t('adminEditGame.fieldPlatform')}</label>
          <input id="platform" required value={platform} onChange={(e) => setPlatform(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="price">{t('adminEditGame.fieldPrice')}</label>
          <input
            id="price"
            type="text"
            inputMode="numeric"
            required
            value={formatPrice(priceCents / 100)}
            onChange={(e) => setPriceCents(Number(e.target.value.replace(/\D/g, '')) || 0)}
          />
        </div>
        <div className="field">
          <label htmlFor="releaseDate">{t('adminEditGame.fieldReleaseDate')}</label>
          <input
            id="releaseDate"
            type="date"
            required
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="description">{t('adminEditGame.fieldDescription')}</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="coverImageUrl">{t('adminEditGame.fieldCoverImageUrl')}</label>
          <input id="coverImageUrl" value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} />
        </div>
        <button type="submit" className="btn" disabled={submitting} style={{ width: '100%' }}>
          {t('adminEditGame.submitButton')}
        </button>
      </form>
    </div>
  );
}
