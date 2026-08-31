import { api } from './client';
import type {
  AuthConfig,
  GameResponse,
  LoginResponse,
  NotificationResponse,
  OrderEventResponse,
  OrderResponse,
  PagedResult,
  PaymentCheckoutResponse,
  PaymentResponse,
  QuotationResponse,
  UserEventResponse,
  UserResponse,
} from './types';

export const usersApi = {
  config: () => api.get<AuthConfig>('/api/users/config'),
  register: (name: string, email: string, password: string) =>
    api.post<UserResponse>('/api/users/register', { name, email, password }),
  login: (email: string, password: string) => api.post<LoginResponse>('/api/users/login', { email, password }),
  loginWithGoogle: (idToken: string) => api.post<LoginResponse>('/api/users/login/google', { idToken }),
  me: () => api.get<{ id: string; email: string }>('/api/users/me'),
  adminAllUserEvents: () => api.get<PagedResult<UserEventResponse>>('/api/users/admin/events?pageSize=100'),
};

export const catalogApi = {
  list: () => api.get<PagedResult<GameResponse>>('/api/games?pageSize=100'),
  get: (id: string) => api.get<GameResponse>(`/api/games/${id}`),
  quotation: () => api.get<QuotationResponse>('/api/quotations/usd-brl'),
};

export const ordersApi = {
  create: (gameId: string) => api.post<OrderResponse>('/api/orders', { gameId }),
  get: (id: string) => api.get<OrderResponse>(`/api/orders/${id}`),
  library: () => api.get<PagedResult<OrderResponse>>('/api/library?pageSize=100'),
  adminAllOrders: () => api.get<PagedResult<OrderResponse>>('/api/orders/admin?pageSize=100'),
  adminOrderEvents: (orderId: string) => api.get<OrderEventResponse[]>(`/api/orders/${orderId}/events`),
  adminAllOrderEvents: () => api.get<PagedResult<OrderEventResponse>>('/api/orders/admin/events?pageSize=100'),
};

export const paymentsApi = {
  adminGetByOrder: (orderId: string) => api.get<PaymentResponse>(`/api/payments/${orderId}`),
  checkout: (orderId: string) => api.get<PaymentCheckoutResponse>(`/api/payments/checkout/${orderId}`),
  adminAllPayments: () => api.get<PagedResult<PaymentResponse>>('/api/payments/admin?pageSize=100'),
};

export const notificationsApi = {
  adminGetByOrder: (orderId: string) => api.get<NotificationResponse[]>(`/api/notifications?orderId=${orderId}`),
  adminAllNotifications: () => api.get<PagedResult<NotificationResponse>>('/api/notifications/admin?pageSize=100'),
};
