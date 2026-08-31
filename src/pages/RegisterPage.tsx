import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usersApi } from '../api/endpoints';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useLocale } from '../i18n/LocaleContext';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await usersApi.register(name, email, password);
      const result = await usersApi.login(email, password);
      login(result.accessToken);
      navigate('/catalog');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('register.genericError'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <h1>{t('register.title')}</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="name">{t('register.name')}</label>
          <input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="email">{t('register.email')}</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="password">{t('register.password')}</label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" className="btn" disabled={submitting} style={{ width: '100%' }}>
          {submitting ? t('register.creating') : t('register.submit')}
        </button>
      </form>
      <p className="muted" style={{ marginTop: 20 }}>
        {t('register.haveAccount')} <Link to="/login">{t('register.loginLink')}</Link>
      </p>
    </div>
  );
}
