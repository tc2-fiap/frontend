import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usersApi } from '../api/endpoints';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useLocale } from '../i18n/LocaleContext';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { LoginIcon } from '../components/NavIcons';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const { login } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();

  useEffect(() => {
    usersApi
      .config()
      .then((config) => setGoogleClientId(config.googleSignInEnabled ? config.googleClientId : null))
      .catch(() => setGoogleClientId(null));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await usersApi.login(email, password);
      login(result.accessToken);
      navigate('/catalog');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('login.genericError'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleToken(idToken: string) {
    setError(null);
    try {
      const result = await usersApi.loginWithGoogle(idToken);
      login(result.accessToken);
      navigate('/catalog');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('login.googleError'));
    }
  }

  return (
    <div className="auth-shell">
      <h1 className="page-title">
        <LoginIcon size={26} />
        {t('login.title')}
      </h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">{t('login.email')}</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="password">{t('login.password')}</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" className="btn" disabled={submitting} style={{ width: '100%' }}>
          {submitting ? t('login.loggingIn') : t('login.submit')}
        </button>
      </form>
      {googleClientId && (
        <div style={{ marginTop: 16 }}>
          <GoogleSignInButton clientId={googleClientId} onToken={handleGoogleToken} />
        </div>
      )}
      <p className="muted" style={{ marginTop: 20 }}>
        {t('login.noAccount')} <Link to="/register">{t('login.registerLink')}</Link>
      </p>
    </div>
  );
}
