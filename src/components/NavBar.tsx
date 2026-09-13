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
  AppsIcon,
  CartIcon,
  CatalogIcon,
  CloseIcon,
  ContrastIcon,
  GamesIcon,
  HamburgerIcon,
  LibraryIcon,
  LogoutIcon,
  MoonIcon,
  OrderIcon,
  ProfileIcon,
  SunIcon,
  SystemHealthIcon,
} from './NavIcons';
import type { Theme } from '../theme/ThemeContext';

const THEME_OPTIONS: { value: Theme; icon: typeof MoonIcon }[] = [
  { value: 'dark', icon: MoonIcon },
  { value: 'mixed', icon: ContrastIcon },
  { value: 'light', icon: SunIcon },
];

function nextTheme(current: Theme): Theme {
  const index = THEME_OPTIONS.findIndex((option) => option.value === current);
  return THEME_OPTIONS[(index + 1) % THEME_OPTIONS.length].value;
}

export function NavBar() {
  const { user, isAdmin, logout } = useAuth();
  const cart = useCart();
  const { locale, setLocale, t } = useLocale();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [appsMenuOpen, setAppsMenuOpen] = useState(false);

  return (
    <header className="navbar">
      <div className="navbar-brand">
        {user && (
          <button
            type="button"
            className="nav-hamburger"
            aria-expanded={menuOpen}
            aria-label={t('nav.menu')}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <CloseIcon size={18} /> : <HamburgerIcon size={18} />}
          </button>
        )}
        <NavLink to="/" style={{ textDecoration: 'none' }}>
          <Logo />
        </NavLink>
      </div>
      {user && (
        <nav>
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
            className="theme-toggle"
            aria-label={t(`nav.theme.${theme}`)}
            onClick={() => setTheme(nextTheme(theme))}
          >
            {THEME_OPTIONS.map(({ value, icon: Icon }) => (
              <span key={value} className={theme === value ? 'theme-toggle-option active' : 'theme-toggle-option'}>
                <Icon size={12} />
              </span>
            ))}
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
          <div className="nav-apps-toggle">
            <button
              type="button"
              className="nav-hamburger"
              aria-expanded={appsMenuOpen}
              aria-label={t('nav.menu')}
              onClick={() => setAppsMenuOpen((open) => !open)}
            >
              {appsMenuOpen ? <CloseIcon size={18} /> : <AppsIcon size={18} />}
            </button>
            {appsMenuOpen && (
              <div className="nav-dropdown card">
                <NavLink to="/catalog" onClick={() => setAppsMenuOpen(false)}>
                  <CatalogIcon />
                  {t('nav.catalog')}
                </NavLink>
                <NavLink to="/library" onClick={() => setAppsMenuOpen(false)}>
                  <LibraryIcon />
                  {t('nav.library')}
                </NavLink>
                <NavLink to="/orders" onClick={() => setAppsMenuOpen(false)}>
                  <OrderIcon />
                  {t('nav.myOrders')}
                </NavLink>
                {isAdmin && (
                  <NavLink to="/admin/orders" onClick={() => setAppsMenuOpen(false)}>
                    <AdminIcon />
                    {t('nav.admin')}
                  </NavLink>
                )}
                {isAdmin && (
                  <NavLink to="/admin/events" onClick={() => setAppsMenuOpen(false)}>
                    <AdminEventsIcon />
                    {t('nav.adminEvents')}
                  </NavLink>
                )}
                {isAdmin && (
                  <NavLink to="/admin/games" onClick={() => setAppsMenuOpen(false)}>
                    <GamesIcon />
                    {t('nav.manageGames')}
                  </NavLink>
                )}
                {isAdmin && (
                  <NavLink to="/admin/system" onClick={() => setAppsMenuOpen(false)}>
                    <SystemHealthIcon />
                    {t('nav.systemHealth')}
                  </NavLink>
                )}
              </div>
            )}
          </div>
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
        <div className="nav-logged-out">
          <button
            type="button"
            className="theme-toggle"
            aria-label={t(`nav.theme.${theme}`)}
            onClick={() => setTheme(nextTheme(theme))}
          >
            {THEME_OPTIONS.map(({ value, icon: Icon }) => (
              <span key={value} className={theme === value ? 'theme-toggle-option active' : 'theme-toggle-option'}>
                <Icon size={12} />
              </span>
            ))}
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
          <span className="muted nav-version">v{__APP_VERSION__}</span>
        </div>
      )}
      {user && menuOpen && (
        <>
          <div className="nav-drawer-overlay" onClick={() => setMenuOpen(false)} />
          <div className="nav-drawer card">
            <NavLink to="/catalog" onClick={() => setMenuOpen(false)}>
              <CatalogIcon />
              {t('nav.catalog')}
            </NavLink>
            <NavLink to="/library" onClick={() => setMenuOpen(false)}>
              <LibraryIcon />
              {t('nav.library')}
            </NavLink>
            <NavLink to="/orders" onClick={() => setMenuOpen(false)}>
              <OrderIcon />
              {t('nav.myOrders')}
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
            {isAdmin && (
              <NavLink to="/admin/games" onClick={() => setMenuOpen(false)}>
                <GamesIcon />
                {t('nav.manageGames')}
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin/system" onClick={() => setMenuOpen(false)}>
                <SystemHealthIcon />
                {t('nav.systemHealth')}
              </NavLink>
            )}
            <button
              type="button"
              className="link"
              onClick={() => {
                setMenuOpen(false);
                logout();
                navigate('/login');
              }}
            >
              <LogoutIcon />
              {t('nav.logout')}
            </button>
            <span className="muted nav-version">v{__APP_VERSION__}</span>
          </div>
        </>
      )}
    </header>
  );
}
