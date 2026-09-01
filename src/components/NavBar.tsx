import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../cart/CartContext';
import { useLocale } from '../i18n/LocaleContext';
import { Logo } from './Logo';
import { AdminEventsIcon, AdminIcon, CartIcon, CatalogIcon, LibraryIcon, LogoutIcon } from './NavIcons';

export function NavBar() {
  const { user, isAdmin, logout } = useAuth();
  const cart = useCart();
  const { locale, setLocale, t } = useLocale();
  const navigate = useNavigate();

  return (
    <header className="navbar">
      <NavLink to="/" style={{ textDecoration: 'none' }}>
        <Logo />
      </NavLink>
      {user && (
        <nav>
          <NavLink to="/catalog">
            <CatalogIcon />
            {t('nav.catalog')}
          </NavLink>
          <NavLink to="/library">
            <LibraryIcon />
            {t('nav.library')}
          </NavLink>
          <NavLink to="/cart">
            <CartIcon />
            {t('nav.cart')}
            {cart.count > 0 && (
              <span className="badge pending" style={{ marginLeft: 4 }}>
                {cart.count}
              </span>
            )}
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin/orders">
              <AdminIcon />
              {t('nav.admin')}
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin/events">
              <AdminEventsIcon />
              {t('nav.adminEvents')}
            </NavLink>
          )}
          <span className="muted">{user.email}</span>
          <button
            type="button"
            role="switch"
            aria-checked={locale === 'pt'}
            aria-label="EN / PT"
            className="locale-toggle"
            onClick={() => setLocale(locale === 'en' ? 'pt' : 'en')}
          >
            <span className={locale === 'en' ? 'locale-toggle-option active' : 'locale-toggle-option'}>EN</span>
            <span className={locale === 'pt' ? 'locale-toggle-option active' : 'locale-toggle-option'}>PT</span>
            <span className="locale-toggle-thumb" />
          </button>
          <button
            type="button"
            className="link"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            <LogoutIcon />
            {t('nav.logout')}
          </button>
        </nav>
      )}
      {!user && (
        <button
          type="button"
          role="switch"
          aria-checked={locale === 'pt'}
          aria-label="EN / PT"
          className="locale-toggle"
          onClick={() => setLocale(locale === 'en' ? 'pt' : 'en')}
        >
          <span className={locale === 'en' ? 'locale-toggle-option active' : 'locale-toggle-option'}>EN</span>
          <span className={locale === 'pt' ? 'locale-toggle-option active' : 'locale-toggle-option'}>PT</span>
          <span className="locale-toggle-thumb" />
        </button>
      )}
    </header>
  );
}
