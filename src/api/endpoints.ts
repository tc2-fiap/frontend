import { api } from './client';
import type {
  AuthConfig,
  GameResponse,
  LibraryItemResponse,
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

function toQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

export const usersApi = {
  config: () => api.get<AuthConfig>('/api/users/config'),
  register: (name: string, email: string, password: string) =>
    api.post<UserResponse>('/api/users/register', { name, email, password }),
  login: (email: string, password: string) => api.post<LoginResponse>('/api/users/login', { email, password }),
  loginWithGoogle: (idToken: string) => api.post<LoginResponse>('/api/users/login/google', { idToken }),
  me: () => api.get<{ id: string; email: string }>('/api/users/me'),
  adminAllUserEvents: () => api.get<PagedResult<UserEventResponse>>('/api/users/admin/events?pageSize=100'),
  adminSearchByName: (name: string) =>
    api.get<PagedResult<UserResponse>>(`/api/users/admin/search${toQueryString({ name, pageSize: 100 })}`),
};

export const catalogApi = {
  search: (params?: { title?: string; genre?: string; platform?: string; minPrice?: number; maxPrice?: number }) =>
    api.get<PagedResult<GameResponse>>(`/api/games${toQueryString({ pageSize: 100, ...params })}`),
  get: (id: string) => api.get<GameResponse>(`/api/games/${id}`),
  quotation: () => api.get<QuotationResponse>('/api/quotations/usd-brl'),
};

export const ordersApi = {
  create: (gameIds: string[]) => api.post<OrderResponse>('/api/orders', { gameIds }),
  get: (id: string) => api.get<OrderResponse>(`/api/orders/${id}`),
  library: () => api.get<PagedResult<LibraryItemResponse>>('/api/library?pageSize=100'),
  removeFromLibrary: (gameId: string) => api.delete<void>(`/api/library/${gameId}`),
  adminAllOrders: (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    from?: string;
    to?: string;
    orderId?: string;
    userIds?: string[];
    gameIds?: string[];
    minPrice?: number;
    maxPrice?: number;
  }) => {
    const { userIds, gameIds, ...rest } = params ?? {};
    return api.get<PagedResult<OrderResponse>>(
      `/api/orders/admin${toQueryString({
        pageSize: 10,
        ...rest,
        userIds: userIds?.join(','),
        gameIds: gameIds?.join(','),
      })}`,
    );
  },
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
