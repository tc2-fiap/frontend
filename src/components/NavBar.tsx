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
  ContrastIcon,
  HamburgerIcon,
  LibraryIcon,
  LogoutIcon,
  MoonIcon,
  OrderIcon,
  PlusIcon,
  ProfileIcon,
  SunIcon,
} from './NavIcons';
import type { Theme } from '../theme/ThemeContext';

const THEME_OPTIONS: { value: Theme; icon: typeof MoonIcon }[] = [
  { value: 'dark', icon: MoonIcon },
  { value: 'mixed', icon: ContrastIcon },
  { value: 'light', icon: SunIcon },
];

export function NavBar() {
  const { user, isAdmin, logout } = useAuth();
  const cart = useCart();
  const { locale, setLocale, t } = useLocale();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

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
          <div className="theme-toggle" role="radiogroup" aria-label={t('nav.themeToggle')}>
            {THEME_OPTIONS.map(({ value, icon: Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={theme === value}
                aria-label={t(`nav.theme.${value}`)}
                className={theme === value ? 'theme-toggle-option active' : 'theme-toggle-option'}
                onClick={() => setTheme(value)}
              >
                <Icon size={12} />
              </button>
            ))}
          </div>
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
              <NavLink to="/admin/games/new" onClick={() => setMenuOpen(false)}>
                <PlusIcon />
                {t('nav.createGame')}
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
          </div>
        </>
      )}
    </header>
  );
}
