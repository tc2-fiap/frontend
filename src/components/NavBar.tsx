import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../cart/CartContext';
import { useLocale } from '../i18n/LocaleContext';
import { useTheme } from '../theme/ThemeContext';
import { Logo } from './Logo';
import {
  AdminEventsIcon,
  AdminIcon,
  CartIcon,
  CatalogIcon,
  CloseIcon,
  HamburgerIcon,
  LibraryIcon,
  LogoutIcon,
  MoonIcon,
  ProfileIcon,
  SunIcon,
} from './NavIcons';

export function NavBar() {
  const { user, isAdmin, logout } = useAuth();
  const cart = useCart();
  const { locale, setLocale, t } = useLocale();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="navbar">
      <NavLink to="/" style={{ textDecoration: 'none' }}>
        <Logo />
      </NavLink>
      {user && (
        <nav>
          <button
            type="button"
            className="nav-hamburger"
            aria-expanded={menuOpen}
            aria-label={t('nav.menu')}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <CloseIcon size={18} /> : <HamburgerIcon size={18} />}
          </button>
          {menuOpen && (
            <div className="nav-dropdown card">
              <NavLink to="/catalog" onClick={() => setMenuOpen(false)}>
                <CatalogIcon />
                {t('nav.catalog')}
              </NavLink>
              <NavLink to="/library" onClick={() => setMenuOpen(false)}>
                <LibraryIcon />
                {t('nav.library')}
              </NavLink>
              {isAdmin && (
                <NavLink to="/admin/orders" onClick={() => setMenuOpen(false)}>
                  <AdminIcon />
                  {t('nav.admin')}
                </NavLink>
              )}
              {isAdmin && (
                <NavLink to="/admin/events" onClick={() => setMenuOpen(false)}>
                  <AdminEventsIcon />
                  {t('nav.adminEvents')}
                </NavLink>
              )}
            </div>
          )}
          <NavLink to="/cart">
            <CartIcon />
            {t('nav.cart')}
            {cart.count > 0 && (
              <span className="badge pending" style={{ marginLeft: 4 }}>
                {cart.count}
              </span>
            )}
          </NavLink>
          <span className="nav-profile muted">
            <ProfileIcon />
            {user.email}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={theme === 'light'}
            aria-label={t('nav.themeToggle')}
            className="locale-toggle"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <span className={theme === 'dark' ? 'locale-toggle-option active' : 'locale-toggle-option'}>
              <MoonIcon size={12} />
            </span>
            <span className={theme === 'light' ? 'locale-toggle-option active' : 'locale-toggle-option'}>
              <SunIcon size={12} />
            </span>
            <span className="locale-toggle-thumb" />
          </button>
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
