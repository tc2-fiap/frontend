import { Navigate, Route, Routes } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { Footer } from './components/Footer';
import { RequireAdmin, RequireAuth, RequireGuest } from './components/RouteGuards';
import { useAuth } from './auth/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CatalogPage } from './pages/CatalogPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { LibraryPage } from './pages/LibraryPage';
import { OrderStatusPage } from './pages/OrderStatusPage';
import { MyOrdersPage } from './pages/MyOrdersPage';
import { AdminOrdersPage } from './pages/AdminOrdersPage';
import { AdminOrderDetailPage } from './pages/AdminOrderDetailPage';
import { AdminEventsPage } from './pages/AdminEventsPage';
import { AdminCreateGamePage } from './pages/AdminCreateGamePage';
import { AdminGamesPage } from './pages/AdminGamesPage';
import { AdminEditGamePage } from './pages/AdminEditGamePage';
import { AdminSystemHealthPage } from './pages/AdminSystemHealthPage';

export function App() {
  const { user } = useAuth();

  return (
    <>
      <NavBar />
      <main className="page">
        <Routes>
          <Route element={<RequireGuest />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/orders" element={<MyOrdersPage />} />
            <Route path="/orders/:orderId" element={<OrderStatusPage />} />

            <Route element={<RequireAdmin />}>
              <Route path="/admin/orders" element={<AdminOrdersPage />} />
              <Route path="/admin/orders/:orderId" element={<AdminOrderDetailPage />} />
              <Route path="/admin/events" element={<AdminEventsPage />} />
              <Route path="/admin/games" element={<AdminGamesPage />} />
              <Route path="/admin/games/new" element={<AdminCreateGamePage />} />
              <Route path="/admin/games/:id/edit" element={<AdminEditGamePage />} />
              <Route path="/admin/system" element={<AdminSystemHealthPage />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to={user ? '/catalog' : '/login'} replace />} />
          <Route path="*" element={<Navigate to={user ? '/catalog' : '/login'} replace />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
