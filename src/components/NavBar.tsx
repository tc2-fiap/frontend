import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useLocale } from '../i18n/LocaleContext';
import { Logo } from './Logo';

export function NavBar() {
  const { user, isAdmin, logout } = useAuth();
  const { locale, setLocale, t } = useLocale();
  const navigate = useNavigate();

  return (
    <header className="navbar">
      <NavLink to="/" style={{ textDecoration: 'none' }}>
        <Logo />
      </NavLink>
      <div className="locale-toggle">
        <button type="button" className={locale === 'en' ? 'link active' : 'link'} onClick={() => setLocale('en')}>
          EN
        </button>
        <button type="button" className={locale === 'pt' ? 'link active' : 'link'} onClick={() => setLocale('pt')}>
          PT
        </button>
      </div>
      {user && (
        <nav>
          <NavLink to="/catalog">{t('nav.catalog')}</NavLink>
          <NavLink to="/library">{t('nav.library')}</NavLink>
          {isAdmin && <NavLink to="/admin/orders">{t('nav.admin')}</NavLink>}
          {isAdmin && <NavLink to="/admin/events">{t('nav.adminEvents')}</NavLink>}
          <span className="muted">{user.email}</span>
          <button
            type="button"
            className="link"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            {t('nav.logout')}
          </button>
        </nav>
      )}
    </header>
  );
}
