import { useState } from 'react';
import { catalogApi } from '../api/endpoints';
import { ApiError } from '../api/client';
import { AdminIcon } from '../components/NavIcons';
import { useLocale } from '../i18n/LocaleContext';

export function AdminCreateGamePage() {
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [platform, setPlatform] = useState('');
  const [price, setPrice] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [description, setDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { t } = useLocale();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      await catalogApi.create({
        title,
        genre,
        platform,
        price: Number(price),
        releaseDate,
        description: description || null,
        coverImageUrl: coverImageUrl || null,
      });
      setSuccess(true);
      setTitle('');
      setGenre('');
      setPlatform('');
      setPrice('');
      setReleaseDate('');
      setDescription('');
      setCoverImageUrl('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('adminCreateGame.errorMessage'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 500 }}>
      <h1 className="page-title">
        <AdminIcon size={26} />
        {t('adminCreateGame.title')}
      </h1>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{t('adminCreateGame.successMessage')}</p>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="title">{t('adminCreateGame.fieldTitle')}</label>
          <input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="genre">{t('adminCreateGame.fieldGenre')}</label>
          <input id="genre" required value={genre} onChange={(e) => setGenre(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="platform">{t('adminCreateGame.fieldPlatform')}</label>
          <input id="platform" required value={platform} onChange={(e) => setPlatform(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="price">{t('adminCreateGame.fieldPrice')}</label>
          <input
            id="price"
            type="number"
            step="0.01"
            min="0"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="releaseDate">{t('adminCreateGame.fieldReleaseDate')}</label>
          <input
            id="releaseDate"
            type="date"
            required
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="description">{t('adminCreateGame.fieldDescription')}</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="coverImageUrl">{t('adminCreateGame.fieldCoverImageUrl')}</label>
          <input id="coverImageUrl" value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} />
        </div>
        <button type="submit" className="btn" disabled={submitting} style={{ width: '100%' }}>
          {t('adminCreateGame.submitButton')}
        </button>
      </form>
    </div>
  );
}
